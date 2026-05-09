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
    private readonly IMlRiskService _mlRiskService;
    private readonly ITeamRiskConfigurationService _teamRiskConfigurationService;

    private const int TOTAL_SCORE_LOW_MAX = 3;
    private const int TOTAL_SCORE_MEDIUM_MAX = 6;
    private const decimal METRICS_MAX_SCORE = 17m;
    private const decimal CALIBRATION_MIN = 0.90m;
    private const decimal CALIBRATION_MAX = 1.15m;
    private const int MIN_FEEDBACK_FOR_CALIBRATION = 1;

    public RiskAssessmentService(
        SprintMonitorDbContext context,
        IMetricsService metricsService,
        ISprintService sprintService,
        IMlRiskService mlRiskService,
        ITeamRiskConfigurationService teamRiskConfigurationService)
    {
        _context = context;
        _metricsService = metricsService;
        _sprintService = sprintService;
        _mlRiskService = mlRiskService;
        _teamRiskConfigurationService = teamRiskConfigurationService;
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
        var config = await _teamRiskConfigurationService.GetConfigurationAsync(request.TeamId);

        var effectiveTeamSize = request.TeamSize > 0 ? request.TeamSize : (sprint.TeamSize > 0 ? sprint.TeamSize : 5);
        var effectiveMeetingHours = request.MeetingHoursPerSprint > 0 ? request.MeetingHoursPerSprint : (sprint.MeetingHoursPerSprint > 0 ? sprint.MeetingHoursPerSprint : 8);
        var effectiveNewMembers = request.NewMembersCount >= 0 ? request.NewMembersCount : sprint.NewMembersCount;
        var effectiveExperience = request.AvgExperienceLevel > 0 ? request.AvgExperienceLevel : (sprint.AvgExperienceLevel > 0 ? sprint.AvgExperienceLevel : 6);
        var effectiveCollaboration = request.CollaborationScore > 0 ? request.CollaborationScore : (sprint.CollaborationScore > 0 ? sprint.CollaborationScore : 7);

        // Score each risk factor (delivery + team dynamics)
        var factors = ScoreAllFactors(
            metrics,
            request.PlannedCommitment,
            request.TeamAvailability,
            request.ExternalDependencies,
            config,
            effectiveMeetingHours,
            effectiveNewMembers,
            effectiveExperience,
            effectiveCollaboration,
            out var teamDynamicsScore,
            out var teamCondition);

        // Blend all enabled factors using team-specific weights, then calibrate by feedback quality.
        var baseScore = CalculateWeightedScore(factors);
        var (calibrationFactor, feedbackSampleSize) = await GetFeedbackCalibrationAsync(request.TeamId);
        var totalScore = Math.Min(17m, Math.Round(baseScore * calibrationFactor, 2));

        // Determine overall risk level
        var riskLevel = DetermineRiskLevel(totalScore);

        // Assess confidence based on data quality
        var confidence = AssessConfidence(sprints.Count);

        // Generate recommendations
        var recommendations = GenerateRecommendations(
            factors,
            metrics,
            request.PlannedCommitment,
            riskLevel,
            totalScore,
            teamDynamicsScore,
            teamCondition);

        var iteration = await _context.RiskAssessments
            .Where(a => a.SprintId == sprint.SprintId)
            .Select(a => (int?)a.Iteration)
            .MaxAsync() ?? 0;

        // ---- ML Risk Prediction (Phase 2: Hybrid) ----
        // Determine spillover from historical data
        var lastSprint = sprints.LastOrDefault();
        var hadSpillover = lastSprint?.HadSpillover == true ? 1 : 0;
        var avgCompleted = sprints.Count > 0
            ? (int)sprints.Average(s => s.CompletedPoints)
            : request.PlannedCommitment;

        var mlResult = await _mlRiskService.PredictRiskAsync(
            cvr: metrics.CVR,
            spillover: hadSpillover,
            dependencies: request.ExternalDependencies,
            teamAvailability: request.TeamAvailability,
            committedPoints: request.PlannedCommitment,
            completedPoints: avgCompleted,
            teamSize: effectiveTeamSize,
            meetingHoursPerSprint: effectiveMeetingHours,
            newMembersCount: effectiveNewMembers,
            avgExperienceLevel: effectiveExperience,
            collaborationScore: effectiveCollaboration);

        RiskLevel? mlRiskLevel = null;
        RiskLevel? finalRiskLevel = null;
        decimal? mlConfidence = null;

        if (mlResult.IsAvailable)
        {
            mlRiskLevel = mlResult.MlRisk;
            mlConfidence = mlResult.Confidence;
            finalRiskLevel = _mlRiskService.CombineRiskLevels(riskLevel, mlResult.MlRisk, mlResult.Confidence);
        }
        else
        {
            // ML unavailable — final risk = rule risk
            finalRiskLevel = riskLevel;
        }

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
            TeamSize = effectiveTeamSize,
            MeetingHoursPerSprint = effectiveMeetingHours,
            NewMembersCount = effectiveNewMembers,
            AvgExperienceLevel = effectiveExperience,
            CollaborationScore = effectiveCollaboration,
            TeamDynamicsScore = teamDynamicsScore,
            TeamCondition = teamCondition,
            RiskLevel = riskLevel,
            MlRiskLevel = mlRiskLevel,
            FinalRiskLevel = finalRiskLevel,
            MlConfidence = mlConfidence,
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
            RiskLevel? beforeRisk = null;
            RiskLevel? afterRisk = null;
            if (!string.IsNullOrWhiteSpace(rec.BeforeRiskLevel) && Enum.TryParse<RiskLevel>(rec.BeforeRiskLevel, true, out var parsedBefore))
            {
                beforeRisk = parsedBefore;
            }
            if (!string.IsNullOrWhiteSpace(rec.AfterRiskLevel) && Enum.TryParse<RiskLevel>(rec.AfterRiskLevel, true, out var parsedAfter))
            {
                afterRisk = parsedAfter;
            }

            var recommendation = new Recommendation
            {
                AssessmentId = assessment.AssessmentId,
                Title = rec.Title,
                Description = rec.Description,
                Priority = Enum.Parse<RecommendationPriority>(rec.Priority),
                AddressesRiskFactor = rec.AddressesRiskFactor,
                ActionType = Enum.Parse<ActionType>(rec.ActionType),
                SuggestedChange = rec.SuggestedChange,
                BeforeScore = rec.BeforeScore,
                AfterScore = rec.AfterScore,
                ImpactScoreChange = rec.EstimatedScoreChange,
                BeforeRiskLevel = beforeRisk,
                AfterRiskLevel = afterRisk,
                WasApplied = rec.WasApplied,
                AppliedAt = rec.AppliedAt,
                AppliedBy = rec.AppliedBy
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
            MlRiskLevel = mlRiskLevel?.ToString(),
            FinalRiskLevel = finalRiskLevel?.ToString(),
            MlConfidence = mlConfidence,
            TeamSize = effectiveTeamSize,
            MeetingHoursPerSprint = effectiveMeetingHours,
            NewMembersCount = effectiveNewMembers,
            AvgExperienceLevel = effectiveExperience,
            CollaborationScore = effectiveCollaboration,
            TeamDynamicsScore = teamDynamicsScore,
            TeamCondition = teamCondition,
            TotalScore = totalScore,
            MaxPossibleScore = 17,
            Confidence = confidence.ToString(),
            FeedbackCalibrationFactor = calibrationFactor,
            FeedbackSampleSize = feedbackSampleSize,
            AssessedAt = assessment.AssessedAt,
            Factors = factors,
            Recommendations = recommendations,
            Metrics = metrics
        };
    }

    public async Task<IEnumerable<RiskAssessmentDto>> GetAssessmentHistoryAsync(int teamId)
    {
        var assessments = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Factors)
            .Include(a => a.Recommendations)
            .Where(a => a.TeamId == teamId)
            .OrderByDescending(a => a.Sprint!.SprintNumber)
            .ThenByDescending(a => a.Iteration)
            .ToListAsync();

        var dtos = assessments.Select(MapToDto).ToList();
        var (factor, sampleSize) = await GetFeedbackCalibrationAsync(teamId);
        foreach (var dto in dtos)
        {
            dto.FeedbackCalibrationFactor = factor;
            dto.FeedbackSampleSize = sampleSize;
        }

        return dtos;
    }

    public async Task<IEnumerable<RiskAssessmentDto>> GetFinalAssessmentsAsync(int teamId)
    {
        var assessments = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Factors)
            .Include(a => a.Recommendations)
            .Where(a => a.TeamId == teamId && a.IsFinal && a.SprintId.HasValue)
            .OrderByDescending(a => a.Sprint!.SprintNumber)
            .ThenByDescending(a => a.AssessedAt)
            .ToListAsync();

        var dtos = assessments.Select(MapToDto).ToList();
        var (factor, sampleSize) = await GetFeedbackCalibrationAsync(teamId);
        foreach (var dto in dtos)
        {
            dto.FeedbackCalibrationFactor = factor;
            dto.FeedbackSampleSize = sampleSize;
        }

        return dtos;
    }

    public async Task<RiskAssessmentDto?> GetAssessmentByIdAsync(int assessmentId)
    {
        var assessment = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Factors)
            .Include(a => a.Recommendations)
            .FirstOrDefaultAsync(a => a.AssessmentId == assessmentId);

        if (assessment == null)
        {
            return null;
        }

        var dto = MapToDto(assessment);
        var (factor, sampleSize) = await GetFeedbackCalibrationAsync(assessment.TeamId);
        dto.FeedbackCalibrationFactor = factor;
        dto.FeedbackSampleSize = sampleSize;

        return dto;
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

    public async Task<RecommendationDto?> ApplyRecommendationAsync(int recommendationId, ApplyRecommendationDto dto)
    {
        var recommendation = await _context.Recommendations
            .FirstOrDefaultAsync(r => r.RecommendationId == recommendationId);

        if (recommendation == null)
        {
            return null;
        }

        recommendation.WasApplied = true;
        recommendation.AppliedAt = DateTime.UtcNow;
        recommendation.AppliedBy = string.IsNullOrWhiteSpace(dto.AppliedBy) ? recommendation.AppliedBy : dto.AppliedBy;
        recommendation.BeforeScore = dto.BeforeScore;
        recommendation.AfterScore = dto.AfterScore;
        recommendation.ImpactScoreChange = dto.ImpactScoreChange ??
            (dto.BeforeScore.HasValue && dto.AfterScore.HasValue ? dto.BeforeScore.Value - dto.AfterScore.Value : null);

        if (!string.IsNullOrWhiteSpace(dto.BeforeRiskLevel)
            && Enum.TryParse<RiskLevel>(dto.BeforeRiskLevel, true, out var beforeRisk))
        {
            recommendation.BeforeRiskLevel = beforeRisk;
        }

        if (!string.IsNullOrWhiteSpace(dto.AfterRiskLevel)
            && Enum.TryParse<RiskLevel>(dto.AfterRiskLevel, true, out var afterRisk))
        {
            recommendation.AfterRiskLevel = afterRisk;
        }

        await _context.SaveChangesAsync();

        return new RecommendationDto
        {
            RecommendationId = recommendation.RecommendationId,
            Title = recommendation.Title,
            Description = recommendation.Description,
            Priority = recommendation.Priority.ToString(),
            AddressesRiskFactor = recommendation.AddressesRiskFactor,
            ActionType = recommendation.ActionType.ToString(),
            SuggestedChange = recommendation.SuggestedChange,
            BeforeScore = recommendation.BeforeScore,
            AfterScore = recommendation.AfterScore,
            BeforeRiskLevel = recommendation.BeforeRiskLevel?.ToString(),
            AfterRiskLevel = recommendation.AfterRiskLevel?.ToString(),
            EstimatedScoreChange = recommendation.ImpactScoreChange,
            WasApplied = recommendation.WasApplied,
            AppliedAt = recommendation.AppliedAt,
            AppliedBy = recommendation.AppliedBy
        };
    }

    public async Task<RecommendationDto?> ApplyRecommendationByMatchAsync(ApplyRecommendationByMatchDto dto)
    {
        var query = _context.Recommendations
            .Include(r => r.Assessment)
            .Where(r => r.Assessment != null && r.Assessment.TeamId == dto.TeamId);

        if (dto.SprintId.HasValue)
        {
            query = query.Where(r => r.Assessment!.SprintId == dto.SprintId.Value);
        }

        var title = dto.Title.Trim();
        query = query.Where(r => r.Title == title);

        if (!string.IsNullOrWhiteSpace(dto.ActionType)
            && Enum.TryParse<ActionType>(dto.ActionType, true, out var actionType))
        {
            query = query.Where(r => r.ActionType == actionType);
        }

        if (!string.IsNullOrWhiteSpace(dto.AddressesRiskFactor))
        {
            var riskFactor = dto.AddressesRiskFactor.Trim();
            query = query.Where(r => r.AddressesRiskFactor == riskFactor);
        }

        var recommendation = await query
            .OrderByDescending(r => r.AppliedAt ?? DateTime.MinValue)
            .ThenByDescending(r => r.Assessment!.Iteration)
            .ThenByDescending(r => r.Assessment!.AssessedAt)
            .ThenByDescending(r => r.RecommendationId)
            .FirstOrDefaultAsync();

        if (recommendation == null)
        {
            return null;
        }

        recommendation.WasApplied = true;
        recommendation.AppliedAt = DateTime.UtcNow;
        recommendation.AppliedBy = string.IsNullOrWhiteSpace(dto.AppliedBy) ? recommendation.AppliedBy : dto.AppliedBy;
        recommendation.BeforeScore = dto.BeforeScore;
        recommendation.AfterScore = dto.AfterScore;
        recommendation.ImpactScoreChange = dto.ImpactScoreChange ??
            (dto.BeforeScore.HasValue && dto.AfterScore.HasValue ? dto.BeforeScore.Value - dto.AfterScore.Value : null);

        if (!string.IsNullOrWhiteSpace(dto.BeforeRiskLevel)
            && Enum.TryParse<RiskLevel>(dto.BeforeRiskLevel, true, out var beforeRisk))
        {
            recommendation.BeforeRiskLevel = beforeRisk;
        }

        if (!string.IsNullOrWhiteSpace(dto.AfterRiskLevel)
            && Enum.TryParse<RiskLevel>(dto.AfterRiskLevel, true, out var afterRisk))
        {
            recommendation.AfterRiskLevel = afterRisk;
        }

        await _context.SaveChangesAsync();

        return new RecommendationDto
        {
            RecommendationId = recommendation.RecommendationId,
            Title = recommendation.Title,
            Description = recommendation.Description,
            Priority = recommendation.Priority.ToString(),
            AddressesRiskFactor = recommendation.AddressesRiskFactor,
            ActionType = recommendation.ActionType.ToString(),
            SuggestedChange = recommendation.SuggestedChange,
            BeforeScore = recommendation.BeforeScore,
            AfterScore = recommendation.AfterScore,
            BeforeRiskLevel = recommendation.BeforeRiskLevel?.ToString(),
            AfterRiskLevel = recommendation.AfterRiskLevel?.ToString(),
            EstimatedScoreChange = recommendation.ImpactScoreChange,
            WasApplied = recommendation.WasApplied,
            AppliedAt = recommendation.AppliedAt,
            AppliedBy = recommendation.AppliedBy
        };
    }

    #region Risk Scoring Logic

    private List<RiskFactorDto> ScoreAllFactors(
        SprintMetricsDto metrics,
        int plannedPoints,
        int teamAvailability,
        int externalDependencies,
        TeamRiskConfigurationDto config,
        int meetingHoursPerSprint,
        int newMembersCount,
        int avgExperienceLevel,
        int collaborationScore,
        out int teamDynamicsScore,
        out string teamCondition)
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
        var cvrScore = ScoreCVR(adjustedCvr, config);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Commitment-to-Velocity Ratio (CVR)",
            Score = cvrScore,
            MaxScore = 3,
            Weight = config.CvrWeight,
            Description = GetCVRDescription(adjustedCvr, cvrScore),
            MetricValue = adjustedCvr,
            Threshold = config.CvrLowMax
        });

        // 2. Velocity Variance
        var varianceScore = ScoreVelocityVariance(metrics.VelocityCoefficient, config);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Velocity Stability",
            Score = varianceScore,
            MaxScore = 3,
            Weight = config.VelocityWeight,
            Description = GetVarianceDescription(metrics.VelocityCoefficient, varianceScore),
            MetricValue = metrics.VelocityCoefficient * 100,
            Threshold = config.VelocityCvLowMax * 100
        });

        // 3. Spillover Rate
        var spilloverScore = ScoreSpilloverRate(metrics.SpilloverRate, config);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Historical Spillover Rate",
            Score = spilloverScore,
            MaxScore = 3,
            Weight = config.SpilloverWeight,
            Description = GetSpilloverDescription(metrics.SpilloverRate, spilloverScore),
            MetricValue = metrics.SpilloverRate,
            Threshold = config.SpilloverLowMax
        });

        // 4. Capacity Utilization
        var capacityScore = ScoreCapacityUtilization(plannedPoints, adjustedEffectiveCapacity, config);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Capacity Buffer Utilization",
            Score = capacityScore,
            MaxScore = 3,
            Weight = config.CapacityWeight,
            Description = GetCapacityDescription(plannedPoints, adjustedEffectiveCapacity, capacityScore),
            MetricValue = adjustedEffectiveCapacity > 0 ? (plannedPoints / adjustedEffectiveCapacity) * 100 : 0,
            Threshold = config.CapacityUtilizationLowMax
        });

        // 5. Team Availability
        var availabilityScore = ScoreTeamAvailability(teamAvailability, config);
        factors.Add(new RiskFactorDto
        {
            FactorName = "Team Availability",
            Score = availabilityScore,
            MaxScore = 2,
            Weight = config.AvailabilityWeight,
            Description = GetAvailabilityDescription(teamAvailability, availabilityScore),
            MetricValue = teamAvailability,
            Threshold = config.AvailabilityHighMin
        });

        // 6. External Dependencies
        var dependencyScore = ScoreExternalDependencies(externalDependencies, config);
        factors.Add(new RiskFactorDto
        {
            FactorName = "External Dependencies",
            Score = dependencyScore,
            MaxScore = 3,
            Weight = config.DependencyWeight,
            Description = GetDependencyDescription(externalDependencies, dependencyScore),
            MetricValue = externalDependencies,
            Threshold = config.DependencyLowMax
        });

        teamDynamicsScore = config.UseTeamDynamics
            ? ScoreTeamDynamics(
            meetingHoursPerSprint,
            newMembersCount,
            avgExperienceLevel,
            collaborationScore,
            config)
            : 0;
        teamCondition = config.UseTeamDynamics ? GetTeamCondition(teamDynamicsScore) : "Balanced";

        factors.Add(new RiskFactorDto
        {
            FactorName = "Team Dynamics",
            Score = teamDynamicsScore,
            MaxScore = 3,
            Weight = config.UseTeamDynamics ? config.TeamDynamicsWeight : 0m,
            Description = GetTeamDynamicsDescription(teamDynamicsScore, meetingHoursPerSprint, newMembersCount, avgExperienceLevel, collaborationScore),
            MetricValue = teamDynamicsScore,
            Threshold = 1
        });

        return factors;
    }

    private decimal CalculateWeightedScore(IEnumerable<RiskFactorDto> factors)
    {
        var enabledFactors = factors.Where(f => f.Weight > 0 && f.MaxScore > 0).ToList();
        var totalWeight = enabledFactors.Sum(f => f.Weight);
        if (totalWeight <= 0)
        {
            return 0m;
        }

        var weightedNormalized = enabledFactors.Sum(f => (f.Score / (decimal)f.MaxScore) * f.Weight) / totalWeight;
        return Math.Round(weightedNormalized * METRICS_MAX_SCORE, 2);
    }

    private int ScoreCVR(decimal cvr, TeamRiskConfigurationDto config)
    {
        if (cvr <= config.CvrLowMax) return 0;
        if (cvr <= config.CvrMediumMax) return 1;
        if (cvr <= 1.2m) return 2;
        return 3;
    }

    private int ScoreVelocityVariance(decimal cv, TeamRiskConfigurationDto config)
    {
        if (cv <= config.VelocityCvLowMax) return 0;
        if (cv <= config.VelocityCvMediumMax) return 1;
        if (cv <= 0.35m) return 2;
        return 3;
    }

    private int ScoreSpilloverRate(decimal rate, TeamRiskConfigurationDto config)
    {
        if (rate < config.SpilloverLowMax) return 0;
        if (rate <= config.SpilloverMediumMax) return 1;
        if (rate <= 60) return 2;
        return 3;
    }

    private int ScoreCapacityUtilization(int plannedPoints, decimal effectiveCapacity, TeamRiskConfigurationDto config)
    {
        if (effectiveCapacity == 0) return 3;
        var ratio = plannedPoints / effectiveCapacity;
        if (ratio * 100 <= config.CapacityUtilizationLowMax) return 0;
        if (ratio * 100 <= config.CapacityUtilizationMediumMax) return 1;
        if (ratio <= 1.25m) return 2;
        return 3;
    }

    private int ScoreTeamAvailability(int availability, TeamRiskConfigurationDto config)
    {
        if (availability >= config.AvailabilityHighMin) return 0;
        if (availability >= config.AvailabilityMediumMin) return 1;
        return 2;
    }

    private int ScoreExternalDependencies(int dependencies, TeamRiskConfigurationDto config)
    {
        if (dependencies <= config.DependencyLowMax) return 0;
        if (dependencies <= config.DependencyMediumMax) return 1;
        if (dependencies <= 4) return 2;
        return 3;
    }

    private int ScoreTeamDynamics(int meetingHoursPerSprint, int newMembersCount, int avgExperienceLevel, int collaborationScore, TeamRiskConfigurationDto config)
    {
        var meetingScore = meetingHoursPerSprint <= config.MeetingHoursLowMax
            ? 0
            : meetingHoursPerSprint <= config.MeetingHoursMediumMax
                ? 1
                : meetingHoursPerSprint <= 16
                    ? 2
                    : 3;

        var newMembersScore = newMembersCount <= config.NewMembersLowMax
            ? 0
            : newMembersCount <= config.NewMembersMediumMax
                ? 1
                : newMembersCount == 2
                    ? 2
                    : 3;

        var experienceRiskScore = avgExperienceLevel >= 8
            ? 0
            : avgExperienceLevel >= config.ExperienceMediumMin
                ? 1
                : avgExperienceLevel >= config.ExperienceLowMin
                    ? 2
                    : 3;

        var collaborationRiskScore = collaborationScore >= 8
            ? 0
            : collaborationScore >= config.CollaborationMediumMin
                ? 1
                : collaborationScore >= config.CollaborationLowMin
                    ? 2
                    : 3;

        var weighted = (meetingScore * 0.30m)
            + (newMembersScore * 0.25m)
            + (experienceRiskScore * 0.25m)
            + (collaborationRiskScore * 0.20m);

        return Math.Clamp((int)Math.Round(weighted, MidpointRounding.AwayFromZero), 0, 3);
    }

    private string GetTeamCondition(int teamDynamicsScore)
    {
        return teamDynamicsScore switch
        {
            <= 1 => "Strong",
            2 => "Watch",
            _ => "Fragile"
        };
    }

    private RiskLevel DetermineRiskLevel(decimal totalScore)
    {
        var normalizedScore = Math.Floor(totalScore);

        if (normalizedScore <= TOTAL_SCORE_LOW_MAX) return RiskLevel.LOW;
        if (normalizedScore <= TOTAL_SCORE_MEDIUM_MAX) return RiskLevel.MEDIUM;
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

    private string GetTeamDynamicsDescription(int score, int meetingHoursPerSprint, int newMembersCount, int avgExperienceLevel, int collaborationScore)
    {
        return score switch
        {
            0 => $"Team dynamics are stable (meetings {meetingHoursPerSprint}h, new members {newMembersCount}, experience {avgExperienceLevel}/10, collaboration {collaborationScore}/10).",
            1 => $"Team dynamics show mild risk. Review meeting overhead and onboarding load (meetings {meetingHoursPerSprint}h, new members {newMembersCount}).",
            2 => $"Team dynamics risk is elevated. Low experience/collaboration or onboarding pressure may reduce delivery predictability.",
            _ => $"Team dynamics risk is high. Significant coordination and capability pressure is expected this sprint."
        };
    }

    #endregion

    #region Recommendation Generation

    private List<RecommendationDto> GenerateRecommendations(
        List<RiskFactorDto> factors,
        SprintMetricsDto metrics,
        int plannedPoints,
        RiskLevel riskLevel,
        decimal currentScore,
        int teamDynamicsScore,
        string teamCondition)
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
                recommendations.Add(CreateImpactRecommendation(new RecommendationDto
                {
                    Title = "Reduce Sprint Scope",
                    Description = $"Overall risk is HIGH. Reduce commitment to {(int)metrics.EffectiveCapacity} points (your effective capacity with buffer).",
                    Priority = "CRITICAL",
                    AddressesRiskFactor = "Overall",
                    ActionType = "REDUCE_SCOPE",
                    SuggestedChange = $"Reduce by {reduction} points"
                }, currentScore, Math.Max(1, Math.Min(3, reduction / 2))));
            }
        }
        else if (riskLevel == RiskLevel.MEDIUM && recommendations.Count == 0)
        {
            recommendations.Add(CreateImpactRecommendation(new RecommendationDto
            {
                Title = "Add Buffer for Uncertainty",
                Description = "Consider reserving 10-20% of capacity for unplanned work and uncertainties.",
                Priority = "MEDIUM",
                AddressesRiskFactor = "Overall",
                ActionType = "ADD_BUFFER"
            }, currentScore, 1));
        }

        if (teamDynamicsScore >= 2)
        {
            recommendations.Add(CreateImpactRecommendation(new RecommendationDto
            {
                Title = "Stabilize Team Dynamics",
                Description = teamCondition == "Fragile"
                    ? "Team dynamics are fragile. Reduce meeting load, support onboarding, and schedule pairing/mentoring to recover delivery stability."
                    : "Team dynamics need attention. Protect focused time and actively manage onboarding/collaboration risks.",
                Priority = teamDynamicsScore >= 3 ? "CRITICAL" : "HIGH",
                AddressesRiskFactor = "Team Dynamics",
                ActionType = "IMPROVE_ESTIMATION"
            }, currentScore, teamDynamicsScore >= 3 ? 2 : 1));
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
                recs.Add(CreateImpactRecommendation(new RecommendationDto
                {
                    Title = "Match Commitment to Velocity",
                    Description = $"Your CVR of {factor.MetricValue:F2} indicates overcommitment. Target {targetPoints} points to match your historical velocity.",
                    Priority = factor.Score >= 3 ? "CRITICAL" : "HIGH",
                    AddressesRiskFactor = factor.FactorName,
                    ActionType = "REDUCE_SCOPE",
                    SuggestedChange = $"Reduce by {reduction} points"
                }, metricsToScore(metrics), Math.Max(1, Math.Min(2, factor.Score))));
            }
        }

        if (factor.FactorName.Contains("Spillover"))
        {
            recs.Add(CreateImpactRecommendation(new RecommendationDto
            {
                Title = "Address Spillover Pattern",
                Description = "Your team has a pattern of incomplete sprints. Review estimation accuracy and consider smaller commitments.",
                Priority = "HIGH",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "IMPROVE_ESTIMATION"
            }, metricsToScore(metrics), 1));
        }

        if (factor.FactorName.Contains("Capacity"))
        {
            recs.Add(CreateImpactRecommendation(new RecommendationDto
            {
                Title = "Reserve Buffer Capacity",
                Description = $"Plan to {(int)metrics.EffectiveCapacity} points (80% of velocity) to reserve buffer for unplanned work, meetings, and code reviews.",
                Priority = "HIGH",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "ADD_BUFFER",
                SuggestedChange = $"Target {(int)metrics.EffectiveCapacity} points"
            }, metricsToScore(metrics), 1));
        }

        if (factor.FactorName.Contains("Availability"))
        {
            var adjustedCapacity = (int)(metrics.EffectiveCapacity * (factor.MetricValue / 100));
            recs.Add(CreateImpactRecommendation(new RecommendationDto
            {
                Title = "Adjust for Reduced Availability",
                Description = $"With {factor.MetricValue}% availability, target {adjustedCapacity} points instead of full capacity.",
                Priority = "MEDIUM",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "REDUCE_SCOPE",
                SuggestedChange = $"Target {adjustedCapacity} points"
            }, metricsToScore(metrics), 1));
        }

        if (factor.FactorName.Contains("Dependencies"))
        {
            recs.Add(CreateImpactRecommendation(new RecommendationDto
            {
                Title = "Resolve Dependencies",
                Description = $"{(int)factor.MetricValue} external dependencies detected. Work with dependent teams to resolve blockers before or early in the sprint.",
                Priority = factor.Score >= 3 ? "CRITICAL" : "HIGH",
                AddressesRiskFactor = factor.FactorName,
                ActionType = "RESOLVE_DEPENDENCIES",
                SuggestedChange = $"Reduce dependencies from {(int)factor.MetricValue} to 0-2"
            }, metricsToScore(metrics), Math.Max(1, Math.Min(2, factor.Score))));
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

    private RecommendationDto CreateImpactRecommendation(RecommendationDto recommendation, decimal currentScore, decimal estimatedScoreReduction)
    {
        var reduction = Math.Max(0m, estimatedScoreReduction);
        var beforeScore = Math.Round(currentScore, 2);
        var afterScore = Math.Max(0m, Math.Round(currentScore - reduction, 2));

        recommendation.BeforeScore = beforeScore;
        recommendation.AfterScore = afterScore;
        recommendation.EstimatedScoreChange = Math.Round(beforeScore - afterScore, 2);
        recommendation.BeforeRiskLevel = DetermineRiskLevel(beforeScore).ToString();
        recommendation.AfterRiskLevel = DetermineRiskLevel(afterScore).ToString();

        return recommendation;
    }

    private decimal metricsToScore(SprintMetricsDto metrics)
    {
        return Math.Round(
            (metrics.CVR > 1.1m ? 2m : metrics.CVR > 1.0m ? 1m : 0m)
            + (metrics.VelocityCoefficient > 0.25m ? 2m : metrics.VelocityCoefficient > 0.15m ? 1m : 0m)
            + (metrics.SpilloverRate > 40m ? 2m : metrics.SpilloverRate >= 20m ? 1m : 0m), 2);
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
            MlRiskLevel = assessment.MlRiskLevel?.ToString(),
            FinalRiskLevel = assessment.FinalRiskLevel?.ToString(),
            MlConfidence = assessment.MlConfidence,
            TeamSize = assessment.TeamSize,
            MeetingHoursPerSprint = assessment.MeetingHoursPerSprint,
            NewMembersCount = assessment.NewMembersCount,
            AvgExperienceLevel = assessment.AvgExperienceLevel,
            CollaborationScore = assessment.CollaborationScore,
            TeamDynamicsScore = assessment.TeamDynamicsScore,
            TeamCondition = assessment.TeamCondition,
            TotalScore = assessment.TotalScore,
            MaxPossibleScore = assessment.MaxPossibleScore,
            Confidence = assessment.Confidence.ToString(),
            FeedbackCalibrationFactor = 1.0m,
            FeedbackSampleSize = 0,
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
                SuggestedChange = r.SuggestedChange,
                BeforeScore = r.BeforeScore,
                AfterScore = r.AfterScore,
                BeforeRiskLevel = r.BeforeRiskLevel?.ToString(),
                AfterRiskLevel = r.AfterRiskLevel?.ToString(),
                EstimatedScoreChange = r.ImpactScoreChange,
                WasApplied = r.WasApplied,
                AppliedAt = r.AppliedAt,
                AppliedBy = r.AppliedBy
            }).ToList()
        };
    }

    private async Task<(decimal factor, int sampleSize)> GetFeedbackCalibrationAsync(int teamId)
    {
        var feedbacks = await _context.RiskFeedbacks
            .Include(f => f.Assessment)
            .Where(f => f.Assessment != null
                        && f.Assessment.TeamId == teamId
                        && f.Assessment.IsFinal)
            .OrderByDescending(f => f.CreatedAt)
            .Take(25)
            .ToListAsync();

        var sampleSize = feedbacks.Count;
        if (sampleSize < MIN_FEEDBACK_FOR_CALIBRATION)
        {
            return (1.0m, sampleSize);
        }

        var accurate = feedbacks.Count(f => f.AgreementLevel == "Accurate");
        var partial = feedbacks.Count(f => f.AgreementLevel == "PartiallyAccurate");
        var weightedAccuracy = (accurate + (partial * 0.5m)) / sampleSize;

        // Lower accuracy => more conservative (higher) risk score; high accuracy => slight relaxation.
        var rawFactor = 1.05m - ((weightedAccuracy - 0.5m) * 0.2m);
        var boundedFactor = Math.Clamp(rawFactor, CALIBRATION_MIN, CALIBRATION_MAX);

        return (Math.Round(boundedFactor, 3), sampleSize);
    }
}
