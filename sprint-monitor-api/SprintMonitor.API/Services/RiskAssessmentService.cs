using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Risk Assessment Service
/// Core evaluation engine that aggregates metrics into risk assessment.
/// Implements deterministic, explainable risk scoring.
/// </summary>
public class RiskAssessmentService : IRiskAssessmentService
{
    private readonly SprintMonitorDbContext _context;
    private readonly IMetricsService _metricsService;
    private readonly ISprintService _sprintService;

    // Thresholds (could be moved to configuration)
    private const decimal CVR_LOW_MAX = 1.0m;
    private const decimal CVR_MEDIUM_MAX = 1.1m;
    private const decimal VELOCITY_CV_LOW_MAX = 0.15m;
    private const decimal VELOCITY_CV_MEDIUM_MAX = 0.25m;
    private const decimal SPILLOVER_LOW_MAX = 20m;
    private const decimal SPILLOVER_MEDIUM_MAX = 40m;
    private const int TOTAL_SCORE_LOW_MAX = 3;
    private const int TOTAL_SCORE_MEDIUM_MAX = 6;

    public RiskAssessmentService(SprintMonitorDbContext context, IMetricsService metricsService, ISprintService sprintService)
    {
        _context = context;
        _metricsService = metricsService;
        _sprintService = sprintService;
    }

    /// <summary>
    /// Perform complete risk evaluation and save to database
    /// </summary>
    public async Task<RiskAssessmentDto> EvaluateRiskAsync(RiskAssessmentRequestDto request)
    {
        Sprint sprint;

        if (request.SprintId.HasValue)
        {
            sprint = await _context.Sprints.FirstOrDefaultAsync(s => s.SprintId == request.SprintId.Value && s.TeamId == request.TeamId)
                ?? throw new InvalidOperationException($"Sprint with ID {request.SprintId.Value} not found for team {request.TeamId}.");
        }
        else
        {
            var activeSprint = await _sprintService.GetActiveSprintAsync(request.TeamId);
            if (activeSprint != null)
            {
                sprint = await _context.Sprints.FirstAsync(s => s.SprintId == activeSprint.SprintId);
            }
            else
            {
                var createdSprint = await _sprintService.GetOrCreateActiveSprintAsync(request.TeamId);
                sprint = await _context.Sprints.FirstAsync(s => s.SprintId == createdSprint.SprintId);
            }
        }

        if (sprint.TeamId != request.TeamId)
        {
            throw new InvalidOperationException("Selected sprint does not belong to the selected team.");
        }

        // Get historical sprints for this team
        var sprints = await _context.Sprints
            .Where(s => s.TeamId == request.TeamId && s.SprintId != sprint.SprintId)
            .OrderBy(s => s.SprintNumber)
            .ToListAsync();

        // Calculate metrics
        var metrics = _metricsService.CalculateMetrics(sprints, request.PlannedCommitment);

        // Score each risk factor
        var factors = ScoreAllFactors(metrics, request.PlannedCommitment, request.TeamAvailability, request.ExternalDependencies);

        // Calculate total score
        var totalScore = factors.Sum(f => f.Score);

        // Determine overall risk level
        var riskLevel = DetermineRiskLevel(totalScore);

        // Assess confidence based on data quality
        var confidence = AssessConfidence(sprints.Count);

        // Generate recommendations
        var recommendations = GenerateRecommendations(factors, metrics, request.PlannedCommitment, riskLevel);

        var iteration = await _context.RiskAssessments
            .Where(a => a.SprintId == sprint.SprintId)
            .Select(a => (int?)a.Iteration)
            .MaxAsync() ?? 0;

        // Create and save the assessment
        var assessment = new RiskAssessment
        {
            TeamId = request.TeamId,
            SprintId = sprint.SprintId,
            Iteration = iteration + 1,
            IsFinal = false,
            PlannedCommitment = request.PlannedCommitment,
            TeamAvailability = request.TeamAvailability,
            ExternalDependencies = request.ExternalDependencies,
            RiskLevel = riskLevel,
            TotalScore = totalScore,
            MaxPossibleScore = 17,
            Confidence = confidence,
            AssessedAt = DateTime.UtcNow
        };

        _context.RiskAssessments.Add(assessment);
        await _context.SaveChangesAsync();

        // Save risk factors
        foreach (var factor in factors)
        {
            var riskFactor = new RiskFactor
            {
                AssessmentId = assessment.AssessmentId,
                FactorName = factor.FactorName,
                Score = factor.Score,
                MaxScore = factor.MaxScore,
                Description = factor.Description,
                MetricValue = factor.MetricValue,
                Threshold = factor.Threshold
            };
            _context.RiskFactors.Add(riskFactor);
        }

        // Save recommendations
        foreach (var rec in recommendations)
        {
            var recommendation = new Recommendation
            {
                AssessmentId = assessment.AssessmentId,
                Title = rec.Title,
                Description = rec.Description,
                Priority = Enum.Parse<RecommendationPriority>(rec.Priority),
                AddressesRiskFactor = rec.AddressesRiskFactor,
                ActionType = Enum.Parse<ActionType>(rec.ActionType),
                SuggestedChange = rec.SuggestedChange
            };
            _context.Recommendations.Add(recommendation);
        }

        await _context.SaveChangesAsync();

        // Return the complete assessment
        return new RiskAssessmentDto
        {
            AssessmentId = assessment.AssessmentId,
            TeamId = assessment.TeamId,
            SprintId = assessment.SprintId,
            SprintNumber = sprint.SprintNumber,
            Iteration = assessment.Iteration,
            IsFinal = assessment.IsFinal,
            PlannedCommitment = assessment.PlannedCommitment,
            RiskLevel = riskLevel.ToString(),
            TotalScore = totalScore,
            MaxPossibleScore = 17,
            Confidence = confidence.ToString(),
            AssessedAt = assessment.AssessedAt,
            Factors = factors,
            Recommendations = recommendations,
            Metrics = metrics
        };
    }

    public async Task<IEnumerable<RiskAssessmentDto>> GetAssessmentHistoryAsync(int teamId)
    {
        return await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Factors)
            .Include(a => a.Recommendations)
            .Where(a => a.TeamId == teamId)
            .OrderByDescending(a => a.Sprint!.SprintNumber)
            .ThenByDescending(a => a.Iteration)
            .Select(a => MapToDto(a))
            .ToListAsync();
    }

    public async Task<IEnumerable<RiskAssessmentDto>> GetFinalAssessmentsAsync(int teamId)
    {
        return await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Factors)
            .Include(a => a.Recommendations)
            .Where(a => a.TeamId == teamId && a.IsFinal && a.SprintId.HasValue)
            .OrderByDescending(a => a.Sprint!.SprintNumber)
            .ThenByDescending(a => a.AssessedAt)
            .Select(a => MapToDto(a))
            .ToListAsync();
    }

    public async Task<RiskAssessmentDto?> GetAssessmentByIdAsync(int assessmentId)
    {
        var assessment = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Factors)
            .Include(a => a.Recommendations)
            .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

        return assessment == null ? null : MapToDto(assessment);
    }

    public async Task<RiskAssessmentDto?> MarkAssessmentAsFinalAsync(int assessmentId)
    {
        var assessment = await _context.RiskAssessments
            .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

        if (assessment == null)
        {
            return null;
        }

        if (!assessment.SprintId.HasValue)
        {
            throw new InvalidOperationException("Assessment must be linked to a sprint before it can be finalized.");
        }

        var sprintId = assessment.SprintId.Value;
        var siblingAssessments = await _context.RiskAssessments
            .Where(a => a.SprintId == sprintId)
            .ToListAsync();

        foreach (var sibling in siblingAssessments)
        {
            sibling.IsFinal = sibling.AssessmentId == assessmentId;
        }

        await _context.SaveChangesAsync();

        return await GetAssessmentByIdAsync(assessmentId);
    }

    #region Risk Scoring Logic

    private List<RiskFactorDto> ScoreAllFactors(SprintMetricsDto metrics, int plannedPoints, int teamAvailability, int externalDependencies = 0)
    {
        var factors = new List<RiskFactorDto>();
        var availabilityMultiplier = teamAvailability <= 0
            ? 0m
            : (teamAvailability >= 100 ? 1m : teamAvailability / 100m);

        var adjustedVelocity = metrics.AverageVelocity * availabilityMultiplier;
        var adjustedEffectiveCapacity = metrics.EffectiveCapacity * availabilityMultiplier;
        var adjustedCvr = adjustedVelocity > 0
            ? plannedPoints / adjustedVelocity
            : 0;

        // 1. CVR (Commitment-to-Velocity Ratio)
        var cvrScore = ScoreCVR(adjustedCvr);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Commitment-to-Velocity Ratio (CVR)",
            Score = cvrScore,
            MaxScore = 3,
            Description = GetCVRDescription(adjustedCvr, cvrScore),
            MetricValue = adjustedCvr,
            Threshold = CVR_LOW_MAX
        });

        // 2. Velocity Variance
        var varianceScore = ScoreVelocityVariance(metrics.VelocityCoefficient);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Velocity Stability",
            Score = varianceScore,
            MaxScore = 3,
            Description = GetVarianceDescription(metrics.VelocityCoefficient, varianceScore),
            MetricValue = metrics.VelocityCoefficient * 100,
            Threshold = VELOCITY_CV_LOW_MAX * 100
        });

        // 3. Spillover Rate
        var spilloverScore = ScoreSpilloverRate(metrics.SpilloverRate);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Historical Spillover Rate",
            Score = spilloverScore,
            MaxScore = 3,
            Description = GetSpilloverDescription(metrics.SpilloverRate, spilloverScore),
            MetricValue = metrics.SpilloverRate,
            Threshold = SPILLOVER_LOW_MAX
        });

        // 4. Capacity Utilization
        var capacityScore = ScoreCapacityUtilization(plannedPoints, adjustedEffectiveCapacity);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Capacity Buffer Utilization",
            Score = capacityScore,
            MaxScore = 3,
            Description = GetCapacityDescription(plannedPoints, adjustedEffectiveCapacity, capacityScore),
            MetricValue = adjustedEffectiveCapacity > 0 ? (plannedPoints / adjustedEffectiveCapacity) * 100 : 0,
            Threshold = 100
        });

        // 5. Team Availability
        var availabilityScore = ScoreTeamAvailability(teamAvailability);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Team Availability",
            Score = availabilityScore,
            MaxScore = 2,
            Description = GetAvailabilityDescription(teamAvailability, availabilityScore),
            MetricValue = teamAvailability,
            Threshold = 90
        });

        // 6. External Dependencies
        var dependencyScore = ScoreExternalDependencies(externalDependencies);
        factors.Add(new RiskFactorDto
        {
            FactorName = "External Dependencies",
            Score = dependencyScore,
            MaxScore = 3,
            Description = GetDependencyDescription(externalDependencies, dependencyScore),
            MetricValue = externalDependencies,
            Threshold = 2
        });

        return factors;
    }

    private int ScoreCVR(decimal cvr)
    {
        if (cvr <= CVR_LOW_MAX) return 0;
        if (cvr <= CVR_MEDIUM_MAX) return 1;
        if (cvr <= 1.2m) return 2;
        return 3;
    }

    private int ScoreVelocityVariance(decimal cv)
    {
        if (cv <= VELOCITY_CV_LOW_MAX) return 0;
        if (cv <= VELOCITY_CV_MEDIUM_MAX) return 1;
        if (cv <= 0.35m) return 2;
        return 3;
    }

    private int ScoreSpilloverRate(decimal rate)
    {
        if (rate < SPILLOVER_LOW_MAX) return 0;
        if (rate <= SPILLOVER_MEDIUM_MAX) return 1;
        if (rate <= 60) return 2;
        return 3;
    }

    private int ScoreCapacityUtilization(int plannedPoints, decimal effectiveCapacity)
    {
        if (effectiveCapacity == 0) return 3;
        var ratio = plannedPoints / effectiveCapacity;
        if (ratio <= 1.0m) return 0;
        if (ratio <= 1.1m) return 1;
        if (ratio <= 1.25m) return 2;
        return 3;
    }

    private int ScoreTeamAvailability(int availability)
    {
        if (availability >= 90) return 0;
        if (availability >= 75) return 1;
        return 2;
    }

    private int ScoreExternalDependencies(int dependencies)
    {
        if (dependencies == 0) return 0;
        if (dependencies <= 2) return 1;
        if (dependencies <= 4) return 2;
        return 3;
    }

    private RiskLevel DetermineRiskLevel(int totalScore)
    {
        if (totalScore <= TOTAL_SCORE_LOW_MAX) return RiskLevel.LOW;
        if (totalScore <= TOTAL_SCORE_MEDIUM_MAX) return RiskLevel.MEDIUM;
        return RiskLevel.HIGH;
    }

    private AssessmentConfidence AssessConfidence(int sprintCount)
    {
        if (sprintCount >= 6) return AssessmentConfidence.HIGH;
        if (sprintCount >= 3) return AssessmentConfidence.MEDIUM;
        return AssessmentConfidence.LOW;
    }

    #endregion

    #region Description Generators

    private string GetCVRDescription(decimal cvr, int score)
    {
        return score switch
        {
            0 => $"CVR of {cvr:F2} indicates commitment is within historical velocity. Safe commitment level.",
            1 => $"CVR of {cvr:F2} shows slight overcommitment (1-10% above velocity). Minor risk.",
            2 => $"CVR of {cvr:F2} indicates moderate overcommitment (10-20% above velocity). Consider reducing scope.",
            _ => $"CVR of {cvr:F2} shows significant overcommitment (>20% above velocity). High risk of spillover."
        };
    }

    private string GetVarianceDescription(decimal cv, int score)
    {
        var percentage = cv * 100;
        return score switch
        {
            0 => $"Velocity variance of {percentage:F1}% indicates stable, predictable delivery.",
            1 => $"Velocity variance of {percentage:F1}% shows moderate fluctuation. Estimates are reasonably reliable.",
            2 => $"Velocity variance of {percentage:F1}% indicates high fluctuation. Historical velocity may be unreliable.",
            _ => $"Velocity variance of {percentage:F1}% is very high. Historical velocity is not a reliable predictor."
        };
    }

    private string GetSpilloverDescription(decimal rate, int score)
    {
        return score switch
        {
            0 => $"Spillover rate of {rate:F0}% indicates consistent sprint completion.",
            1 => $"Spillover rate of {rate:F0}% shows occasional incomplete sprints.",
            2 => $"Spillover rate of {rate:F0}% indicates frequent spillover. Pattern of overcommitment.",
            _ => $"Spillover rate of {rate:F0}% shows chronic spillover. Serious planning issue."
        };
    }

    private string GetCapacityDescription(int planned, decimal effective, int score)
    {
        return score switch
        {
            0 => $"Planned {planned} points is within effective capacity of {effective:F0} points. Good buffer reserved.",
            1 => $"Planned {planned} points slightly exceeds effective capacity of {effective:F0} points. Minimal buffer.",
            2 => $"Planned {planned} points significantly exceeds effective capacity of {effective:F0} points. No buffer for unplanned work.",
            _ => $"Planned {planned} points far exceeds effective capacity of {effective:F0} points. High risk of failure."
        };
    }

    private string GetAvailabilityDescription(int availability, int score)
    {
        return score switch
        {
            0 => $"Team availability of {availability}% indicates full capacity.",
            1 => $"Team availability of {availability}% indicates some absence. Adjust commitment accordingly.",
            _ => $"Team availability of {availability}% indicates significant absence. Reduce commitment proportionally."
        };
    }

    private string GetDependencyDescription(int dependencies, int score)
    {
        return score switch
        {
            0 => "No external dependencies. Sprint scope is fully self-contained.",
            1 => $"{dependencies} external dependencies identified. Minor coordination needed.",
            2 => $"{dependencies} external dependencies. Significant coordination risk — consider resolving blockers before sprint.",
            _ => $"{dependencies} external dependencies. High risk of delays — strongly recommend reducing or resolving dependencies."
        };
    }

    #endregion

    #region Recommendation Generation

    private List<RecommendationDto> GenerateRecommendations(
        List<RiskFactorDto> factors,
        SprintMetricsDto metrics,
        int plannedPoints,
        RiskLevel riskLevel)
    {
        var recommendations = new List<RecommendationDto>();

        foreach (var factor in factors.Where(f => f.Score >= 2))
        {
            recommendations.AddRange(GetRecommendationsForFactor(factor, metrics, plannedPoints));
        }

        // Add general recommendations for high risk
        if (riskLevel == RiskLevel.HIGH)
        {
            var reduction = plannedPoints - (int)metrics.EffectiveCapacity;
            if (reduction > 0)
            {
                recommendations.Add(new RecommendationDto
                {
                    Title = "Significantly Reduce Sprint Scope",
                    Description = $"Overall risk is HIGH. Reduce commitment to {(int)metrics.EffectiveCapacity} points (your effective capacity with buffer).",
                    Priority = "CRITICAL",
                    AddressesRiskFactor = "Overall",
                    ActionType = "REDUCE_SCOPE",
                    SuggestedChange = $"Reduce by {reduction} points"
                });
            }
        }
        else if (riskLevel == RiskLevel.MEDIUM && recommendations.Count == 0)
        {
            recommendations.Add(new RecommendationDto
            {
                Title = "Add Buffer for Uncertainty",
                Description = "Consider reserving 10-20% of capacity for unplanned work and uncertainties.",
                Priority = "MEDIUM",
                AddressesRiskFactor = "Overall",
                ActionType = "ADD_BUFFER"
            });
        }

        return recommendations.OrderBy(r => GetPriorityWeight(r.Priority)).ToList();
    }

    private List<RecommendationDto> GetRecommendationsForFactor(
        RiskFactorDto factor,
        SprintMetricsDto metrics,
        int plannedPoints)
    {
        var recs = new List<RecommendationDto>();

        if (factor.FactorName.Contains("CVR"))
        {
            var targetPoints = (int)(metrics.AverageVelocity * 1.0m);
            var reduction = plannedPoints - targetPoints;
            if (reduction > 0)
            {
                recs.Add(new RecommendationDto
                {
                    Title = "Reduce Commitment to Match Velocity",
                    Description = $"Your CVR of {factor.MetricValue:F2} indicates overcommitment. Target {targetPoints} points to match your historical velocity.",
                    Priority = factor.Score >= 3 ? "CRITICAL" : "HIGH",
                    AddressesRiskFactor = factor.FactorName,
                    ActionType = "REDUCE_SCOPE",
                    SuggestedChange = $"Reduce by {reduction} points"
                });
            }
        }

        if (factor.FactorName.Contains("Spillover"))
        {
            recs.Add(new RecommendationDto
            {
                Title = "Address Chronic Spillover Pattern",
                Description = "Your team has a pattern of incomplete sprints. Review estimation accuracy and consider smaller commitments.",
                Priority = "HIGH",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "IMPROVE_ESTIMATION"
            });
        }

        if (factor.FactorName.Contains("Capacity"))
        {
            recs.Add(new RecommendationDto
            {
                Title = "Reserve Buffer Capacity",
                Description = $"Plan to {(int)metrics.EffectiveCapacity} points (80% of velocity) to reserve buffer for unplanned work, meetings, and code reviews.",
                Priority = "HIGH",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "ADD_BUFFER",
                SuggestedChange = $"Target {(int)metrics.EffectiveCapacity} points"
            });
        }

        if (factor.FactorName.Contains("Availability"))
        {
            var adjustedCapacity = (int)(metrics.EffectiveCapacity * (factor.MetricValue / 100));
            recs.Add(new RecommendationDto
            {
                Title = "Adjust for Reduced Availability",
                Description = $"With {factor.MetricValue}% availability, target {adjustedCapacity} points instead of full capacity.",
                Priority = "MEDIUM",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "REDUCE_SCOPE",
                SuggestedChange = $"Target {adjustedCapacity} points"
            });
        }

        if (factor.FactorName.Contains("Dependencies"))
        {
            recs.Add(new RecommendationDto
            {
                Title = "Resolve External Dependencies",
                Description = $"{(int)factor.MetricValue} external dependencies detected. Work with dependent teams to resolve blockers before or early in the sprint.",
                Priority = factor.Score >= 3 ? "CRITICAL" : "HIGH",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "RESOLVE_DEPENDENCIES",
                SuggestedChange = $"Reduce dependencies from {(int)factor.MetricValue} to 0-2"
            });
        }

        return recs;
    }

    private int GetPriorityWeight(string priority)
    {
        return priority switch
        {
            "CRITICAL" => 0,
            "HIGH" => 1,
            "MEDIUM" => 2,
            "LOW" => 3,
            _ => 4
        };
    }

    #endregion

    private static RiskAssessmentDto MapToDto(RiskAssessment assessment)
    {
        return new RiskAssessmentDto
        {
            AssessmentId = assessment.AssessmentId,
            TeamId = assessment.TeamId,
            SprintId = assessment.SprintId,
            SprintNumber = assessment.Sprint?.SprintNumber ?? 0,
            Iteration = assessment.Iteration,
            IsFinal = assessment.IsFinal,
            PlannedCommitment = assessment.PlannedCommitment,
            RiskLevel = assessment.RiskLevel.ToString(),
            TotalScore = assessment.TotalScore,
            MaxPossibleScore = assessment.MaxPossibleScore,
            Confidence = assessment.Confidence.ToString(),
            AssessedAt = assessment.AssessedAt,
            Factors = assessment.Factors.Select(f => new RiskFactorDto
            {
                FactorName = f.FactorName,
                Score = f.Score,
                MaxScore = f.MaxScore,
                Description = f.Description,
                MetricValue = f.MetricValue,
                Threshold = f.Threshold
            }).ToList(),
            Recommendations = assessment.Recommendations.Select(r => new RecommendationDto
            {
                RecommendationId = r.RecommendationId,
                Title = r.Title,
                Description = r.Description,
                Priority = r.Priority.ToString(),
                AddressesRiskFactor = r.AddressesRiskFactor,
                ActionType = r.ActionType.ToString(),
                SuggestedChange = r.SuggestedChange
            }).ToList()
        };
    }
}
