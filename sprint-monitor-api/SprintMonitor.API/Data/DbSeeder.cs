using SprintMonitor.API.Models;

namespace SprintMonitor.API.Data;

/// <summary>
/// Seeds the database with sample data for demonstration
/// </summary>
public static class DbSeeder
{
    public static void Seed(SprintMonitorDbContext context)
    {
        // Only seed if database is empty
        if (context.Teams.Any())
            return;

        // Create sample team
        var team = new Team
        {
            TeamName = "Alpha Squad",
            Description = "Full-stack development team for Sprint Monitor",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        context.Teams.Add(team);
        context.SaveChanges();

        // Create sample sprints (10 sprints of history)
        var sprints = new List<Sprint>
        {
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 1",
                CommittedPoints = 30,
                CompletedPoints = 28,
                AddedPoints = 2,
                RemovedPoints = 0,
                TeamAvailability = 100,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 1,
                StartDate = DateTime.UtcNow.AddDays(-140),
                EndDate = DateTime.UtcNow.AddDays(-126)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 2",
                CommittedPoints = 32,
                CompletedPoints = 25,
                AddedPoints = 5,
                RemovedPoints = 2,
                TeamAvailability = 90,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = true,
                ExternalDependencies = 3,
                StartDate = DateTime.UtcNow.AddDays(-126),
                EndDate = DateTime.UtcNow.AddDays(-112)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 3",
                CommittedPoints = 28,
                CompletedPoints = 28,
                AddedPoints = 0,
                RemovedPoints = 0,
                TeamAvailability = 100,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 0,
                StartDate = DateTime.UtcNow.AddDays(-112),
                EndDate = DateTime.UtcNow.AddDays(-98)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 4",
                CommittedPoints = 35,
                CompletedPoints = 30,
                AddedPoints = 3,
                RemovedPoints = 0,
                TeamAvailability = 80,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = true,
                ExternalDependencies = 2,
                StartDate = DateTime.UtcNow.AddDays(-98),
                EndDate = DateTime.UtcNow.AddDays(-84)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 5",
                CommittedPoints = 26,
                CompletedPoints = 27,
                AddedPoints = 2,
                RemovedPoints = 0,
                TeamAvailability = 100,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 0,
                StartDate = DateTime.UtcNow.AddDays(-84),
                EndDate = DateTime.UtcNow.AddDays(-70)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 6",
                CommittedPoints = 30,
                CompletedPoints = 29,
                AddedPoints = 1,
                RemovedPoints = 1,
                TeamAvailability = 100,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 1,
                StartDate = DateTime.UtcNow.AddDays(-70),
                EndDate = DateTime.UtcNow.AddDays(-56)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 7",
                CommittedPoints = 33,
                CompletedPoints = 31,
                AddedPoints = 2,
                RemovedPoints = 0,
                TeamAvailability = 95,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 1,
                StartDate = DateTime.UtcNow.AddDays(-56),
                EndDate = DateTime.UtcNow.AddDays(-42)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 8",
                CommittedPoints = 29,
                CompletedPoints = 26,
                AddedPoints = 4,
                RemovedPoints = 1,
                TeamAvailability = 85,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = true,
                ExternalDependencies = 2,
                StartDate = DateTime.UtcNow.AddDays(-42),
                EndDate = DateTime.UtcNow.AddDays(-28)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 9",
                CommittedPoints = 27,
                CompletedPoints = 27,
                AddedPoints = 0,
                RemovedPoints = 0,
                TeamAvailability = 100,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 0,
                StartDate = DateTime.UtcNow.AddDays(-28),
                EndDate = DateTime.UtcNow.AddDays(-14)
            },
            new Sprint
            {
                TeamId = team.TeamId,
                SprintName = "Sprint 10",
                CommittedPoints = 31,
                CompletedPoints = 30,
                AddedPoints = 1,
                RemovedPoints = 0,
                TeamAvailability = 100,
                TeamSize = 5,
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = 1,
                StartDate = DateTime.UtcNow.AddDays(-14),
                EndDate = DateTime.UtcNow
            }
        };

        context.Sprints.AddRange(sprints);
        context.SaveChanges();

        // Add default team settings
        var settings = new List<TeamSetting>
        {
            new TeamSetting
            {
                TeamId = team.TeamId,
                SettingKey = "CVR_LOW_MAX",
                SettingValue = "1.0",
                Description = "CVR threshold for low risk"
            },
            new TeamSetting
            {
                TeamId = team.TeamId,
                SettingKey = "CVR_MEDIUM_MAX",
                SettingValue = "1.1",
                Description = "CVR threshold for medium risk"
            },
            new TeamSetting
            {
                TeamId = team.TeamId,
                SettingKey = "SPILLOVER_LOW_MAX",
                SettingValue = "20",
                Description = "Spillover rate threshold for low risk (%)"
            },
            new TeamSetting
            {
                TeamId = team.TeamId,
                SettingKey = "SPILLOVER_MEDIUM_MAX",
                SettingValue = "40",
                Description = "Spillover rate threshold for medium risk (%)"
            },
            new TeamSetting
            {
                TeamId = team.TeamId,
                SettingKey = "CAPACITY_BUFFER",
                SettingValue = "0.8",
                Description = "Capacity buffer multiplier (80% rule)"
            }
        };

        context.TeamSettings.AddRange(settings);
        context.SaveChanges();
    }
}
