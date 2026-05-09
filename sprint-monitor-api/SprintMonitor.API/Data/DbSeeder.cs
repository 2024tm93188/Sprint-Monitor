using SprintMonitor.API.Models;

namespace SprintMonitor.API.Data;

/// <summary>
/// Seeds the database with canonical baseline data.
/// Keeps authentication users intact and resets all non-auth domain data.
/// </summary>
public static class DbSeeder
{
    private static readonly Dictionary<string, (int minCommitted, int maxCommitted, int availability, int deps, string pattern)> TeamPatterns =
        new()
        {
            // RDA: Emergency-focused, high variability, many dependencies
            { "RDA (Rapid Damage Assessment)", (18, 60, 85, 5, "Emergency") },
            // catnet: Steady platform team, good predictability
            { "catnet", (25, 45, 92, 2, "Steady") },
            // oneplatform: Enablement team, scope creep challenges
            { "oneplatform", (28, 55, 88, 4, "Enablement") },
            // Property Insights: Product team, consistent performance
            { "Property Insights", (22, 40, 90, 2, "Product") },
            // Portfolio Insights: Analytics team, variable analytics work
            { "Portfolio Insights", (20, 50, 87, 3, "Analytics") },
            // Impact +: Fast-moving business impact team with moderate coordination overhead
            { "Impact +", (24, 48, 89, 3, "Impact") },
            // PUMA: Project Underwriting Management Application, regulated domain with dependency-heavy delivery
            { "PUMA (Project Underwriting Management Application)", (26, 52, 86, 4, "Underwriting") }
        };

    public static void Seed(SprintMonitorDbContext context)
    {
        ResetNonAuthData(context);

        var teamSeed = new List<(string TeamName, int TeamSize, string Description)>
        {
            ("RDA (Rapid Damage Assessment)", 8, "Rapid Damage Assessment delivery team"),
            ("catnet", 7, "Catnet platform engineering team"),
            ("oneplatform", 9, "Shared oneplatform enablement team"),
            ("Property Insights", 6, "Property insights product engineering team"),
            ("Portfolio Insights", 6, "Portfolio insights analytics and delivery team"),
            ("Impact +", 7, "Impact + product delivery and business outcomes team"),
            ("PUMA (Project Underwriting Management Application)", 8, "Project Underwriting Management Application engineering team")
        };

        var teams = new List<Team>();
        foreach (var seed in teamSeed)
        {
            var team = new Team
            {
                TeamName = seed.TeamName,
                TeamSize = seed.TeamSize,
                Description = seed.Description,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            context.Teams.Add(team);
            context.SaveChanges();
            teams.Add(team);
            EnsureDefaultTeamSettings(context, team.TeamId);
        }

        // Seed historical sprints across all teams
        SeedHistoricalSprints(context, teams);
    }

    /// <summary>
    /// Add missing canonical teams and baseline sprint history to an existing DB without resetting data.
    /// Safe to run on each startup.
    /// </summary>
    public static void EnsureCanonicalTeamsAndSprints(SprintMonitorDbContext context)
    {
        var canonicalTeams = new List<(string TeamName, int TeamSize, string Description)>
        {
            ("RDA (Rapid Damage Assessment)", 8, "Rapid Damage Assessment delivery team"),
            ("catnet", 7, "Catnet platform engineering team"),
            ("oneplatform", 9, "Shared oneplatform enablement team"),
            ("Property Insights", 6, "Property insights product engineering team"),
            ("Portfolio Insights", 6, "Portfolio insights analytics and delivery team"),
            ("Impact +", 7, "Impact + product delivery and business outcomes team"),
            ("PUMA (Project Underwriting Management Application)", 8, "Project Underwriting Management Application engineering team")
        };

        var addedTeams = new List<Team>();
        foreach (var seed in canonicalTeams)
        {
            var exists = context.Teams.Any(t => t.TeamName == seed.TeamName);
            if (exists)
            {
                continue;
            }

            var team = new Team
            {
                TeamName = seed.TeamName,
                TeamSize = seed.TeamSize,
                Description = seed.Description,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            context.Teams.Add(team);
            context.SaveChanges();
            EnsureDefaultTeamSettings(context, team.TeamId);
            addedTeams.Add(team);
        }

        if (addedTeams.Count > 0)
        {
            SeedHistoricalSprints(context, addedTeams);
        }
    }

    private static void ResetNonAuthData(SprintMonitorDbContext context)
    {
        context.RiskFeedbacks.RemoveRange(context.RiskFeedbacks);
        context.Recommendations.RemoveRange(context.Recommendations);
        context.RiskFactors.RemoveRange(context.RiskFactors);
        context.RiskAssessments.RemoveRange(context.RiskAssessments);
        context.ImplementationFeasibilities.RemoveRange(context.ImplementationFeasibilities);
        context.TeamSettings.RemoveRange(context.TeamSettings);
        context.Sprints.RemoveRange(context.Sprints);
        context.Teams.RemoveRange(context.Teams);
        context.SaveChanges();
    }

    private static void EnsureDefaultTeamSettings(SprintMonitorDbContext context, int teamId)
    {
        var settings = new List<TeamSetting>
        {
            new()
            {
                TeamId = teamId,
                SettingKey = "CVR_LOW_MAX",
                SettingValue = "1.0",
                Description = "CVR threshold for low risk"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "CVR_MEDIUM_MAX",
                SettingValue = "1.1",
                Description = "CVR threshold for medium risk"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "VELOCITY_CV_LOW_MAX",
                SettingValue = "0.15",
                Description = "Velocity coefficient threshold for low risk"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "VELOCITY_CV_MEDIUM_MAX",
                SettingValue = "0.25",
                Description = "Velocity coefficient threshold for medium risk"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "SPILLOVER_LOW_MAX",
                SettingValue = "20",
                Description = "Spillover rate threshold for low risk (%)"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "SPILLOVER_MEDIUM_MAX",
                SettingValue = "40",
                Description = "Spillover rate threshold for medium risk (%)"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "CAPACITY_BUFFER",
                SettingValue = "0.8",
                Description = "Capacity buffer multiplier (80% rule)"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "TEAM_DYNAMICS_WEIGHT",
                SettingValue = "20",
                Description = "Weight used for team dynamics in the risk score"
            },
            new()
            {
                TeamId = teamId,
                SettingKey = "USE_TEAM_DYNAMICS",
                SettingValue = "true",
                Description = "Whether team dynamics contributes to the risk score"
            }
        };

        context.TeamSettings.AddRange(settings);
        context.SaveChanges();
    }

    private static void SeedHistoricalSprints(SprintMonitorDbContext context, List<Team> teams)
    {
        var random = new Random(42);
        var sprints = new List<Sprint>();
        var baseDate = DateTime.UtcNow.AddMonths(-10);

        foreach (var team in teams)
        {
            if (!TeamPatterns.TryGetValue(team.TeamName, out var patternDef))
            {
                continue;
            }

            var (minCommitted, maxCommitted, availability, deps, pattern) = patternDef;
            var sprintsPerTeam = 30 + random.Next(0, 10); // 30-39 sprints per team

            for (int i = 0; i < sprintsPerTeam; i++)
            {
                var startDate = baseDate.AddDays(i * 14);
                var endDate = startDate.AddDays(14);
                var sprintNumber = i + 1;

                // Team-specific variations
                int committedPoints;
                int completedPoints;
                int addedPoints;
                int removedPoints;
                int teamAvailability;
                int externalDeps;

                switch (pattern)
                {
                    case "Emergency": // RDA - high variance, many deps
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.7 + random.NextDouble() * 0.5)); // 70-120%
                        addedPoints = random.Next(5, 25); // High scope creep
                        removedPoints = random.Next(0, 8);
                        teamAvailability = random.Next(80, 95);
                        externalDeps = random.Next(3, 8);
                        break;

                    case "Steady": // catnet - predictable platform team
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.9 + random.NextDouble() * 0.15)); // 90-105%
                        addedPoints = random.Next(0, 5); // Low scope creep
                        removedPoints = random.Next(0, 3);
                        teamAvailability = random.Next(90, 99);
                        externalDeps = random.Next(0, 3);
                        break;

                    case "Enablement": // oneplatform - coordination challenges
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.75 + random.NextDouble() * 0.4)); // 75-115%
                        addedPoints = random.Next(8, 20); // High scope creep (enablement nature)
                        removedPoints = random.Next(2, 8);
                        teamAvailability = random.Next(82, 92);
                        externalDeps = random.Next(2, 6);
                        break;

                    case "Product": // Property Insights - good delivery
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.88 + random.NextDouble() * 0.2)); // 88-108%
                        addedPoints = random.Next(1, 8);
                        removedPoints = random.Next(0, 4);
                        teamAvailability = random.Next(88, 98);
                        externalDeps = random.Next(0, 3);
                        break;

                    case "Impact": // Impact + - outcome-driven with moderate scope changes
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.85 + random.NextDouble() * 0.25)); // 85-110%
                        addedPoints = random.Next(2, 10);
                        removedPoints = random.Next(0, 4);
                        teamAvailability = random.Next(86, 96);
                        externalDeps = random.Next(1, 4);
                        break;

                    case "Underwriting": // PUMA - regulated workflow and higher dependency complexity
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.78 + random.NextDouble() * 0.28)); // 78-106%
                        addedPoints = random.Next(4, 14);
                        removedPoints = random.Next(1, 6);
                        teamAvailability = random.Next(82, 93);
                        externalDeps = random.Next(2, 6);
                        break;

                    default: // Portfolio Insights - analytics patterns
                        committedPoints = random.Next(minCommitted, maxCommitted);
                        completedPoints = (int)(committedPoints * (0.8 + random.NextDouble() * 0.3)); // 80-110%
                        addedPoints = random.Next(3, 12);
                        removedPoints = random.Next(0, 5);
                        teamAvailability = random.Next(85, 95);
                        externalDeps = random.Next(1, 4);
                        break;
                }

                var spilloverRate = committedPoints > 0
                    ? ((committedPoints - completedPoints + addedPoints - removedPoints) * 100.0 / committedPoints)
                    : 0;

                var sprint = new Sprint
                {
                    TeamId = team.TeamId,
                    SprintNumber = sprintNumber,
                    SprintName = $"{team.TeamName.Split('(')[0].Trim()}-{i + 1:D3}",
                    Status = SprintStatus.Completed,
                    CommittedPoints = Math.Max(10, committedPoints),
                    CompletedPoints = Math.Max(0, completedPoints),
                    AddedPoints = addedPoints,
                    RemovedPoints = removedPoints,
                    TeamAvailability = Math.Min(100, teamAvailability),
                    TeamSize = team.TeamSize,
                    SprintDuration = i % 5 == 0 ? 7 : 14, // Mix of 7 and 14 day sprints
                    HadSpillover = spilloverRate > 15,
                    ExternalDependencies = externalDeps,
                    StartDate = startDate,
                    EndDate = endDate,
                    CreatedAt = DateTime.UtcNow
                };

                sprints.Add(sprint);
            }
        }

        context.Sprints.AddRange(sprints);
        context.SaveChanges();
    }
}
