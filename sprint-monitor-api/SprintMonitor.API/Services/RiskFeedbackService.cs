using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Interface for Risk Feedback Service
/// </summary>
public interface IRiskFeedbackService
{
    Task<RiskFeedbackDto> SubmitFeedbackAsync(CreateRiskFeedbackDto dto);
    Task<IEnumerable<RiskFeedbackDto>> GetFeedbacksForTeamAsync(int teamId);
    Task<RiskFeedbackDto?> GetFeedbackByIdAsync(int feedbackId);
    Task<RiskFeedbackDto?> GetFeedbackForAssessmentAsync(int assessmentId);
    Task<PredictionAccuracyDto> CalculatePredictionAccuracyAsync(int teamId);
    Task<SprintComparisonAnalysisDto> GetLastThreeSprintComparisonAsync(int teamId);
}

/// <summary>
/// Risk Feedback Service Implementation
/// Manages human relevance feedback for prediction accuracy and system calibration.
/// </summary>
public class RiskFeedbackService : IRiskFeedbackService
{
    private readonly SprintMonitorDbContext _context;

    public RiskFeedbackService(SprintMonitorDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Submit user feedback for a risk assessment
    /// </summary>
    public async Task<RiskFeedbackDto> SubmitFeedbackAsync(CreateRiskFeedbackDto dto)
    {
        var assessment = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .FirstOrDefaultAsync(a => a.AssessmentId == dto.AssessmentId);

        if (assessment == null)
        {
            throw new InvalidOperationException($"Assessment with ID {dto.AssessmentId} not found.");
        }

        if (!assessment.IsFinal)
        {
            throw new InvalidOperationException("Feedback is allowed only for the final assessment of a sprint.");
        }

        if (assessment.SprintId.HasValue)
        {
            var canonicalFinal = await _context.RiskAssessments
                .Where(a => a.SprintId == assessment.SprintId.Value && a.IsFinal)
                .OrderByDescending(a => a.Iteration)
                .ThenByDescending(a => a.AssessedAt)
                .FirstOrDefaultAsync();

            if (canonicalFinal != null && canonicalFinal.AssessmentId != assessment.AssessmentId)
            {
                throw new InvalidOperationException("Feedback must be submitted against the canonical final assessment for this sprint.");
            }
        }

        if (assessment.TeamId != dto.TeamId)
        {
            throw new InvalidOperationException("Assessment does not belong to the selected team.");
        }

        // Ensure there is a sprint row linked to this assessment and that required sprint fields are populated.
        var sprint = await EnsureSprintForFeedbackAsync(assessment, dto);
        assessment.SprintId = sprint.SprintId;

        // Determine user agreement based on agreement level
        bool userAgreement = dto.AgreementLevel == "Accurate";

        var feedback = await _context.RiskFeedbacks
            .Include(f => f.Assessment)
            .Include(f => f.Sprint)
            .FirstOrDefaultAsync(f => f.SprintId == assessment.SprintId);

        if (feedback == null)
        {
            feedback = new RiskFeedback
            {
                AssessmentId = dto.AssessmentId,
                SprintId = assessment.SprintId,
                CreatedAt = DateTime.UtcNow
            };

            _context.RiskFeedbacks.Add(feedback);
        }

        feedback.AssessmentId = dto.AssessmentId;
        feedback.SprintId = sprint.SprintId;
        feedback.UserId = dto.UserId;
        feedback.UserName = dto.UserName;
        feedback.UserRole = dto.UserRole;
        feedback.PredictedRisk = string.IsNullOrWhiteSpace(dto.PredictedRisk)
            ? assessment.RiskLevel.ToString()
            : dto.PredictedRisk;
        feedback.ActualOutcome = dto.ActualOutcome;
        feedback.UserAgreement = userAgreement;
        feedback.AgreementLevel = dto.AgreementLevel;
        feedback.RecommendationsHelpful = dto.RecommendationsHelpful;
        feedback.RecommendationRating = dto.RecommendationRating;
        feedback.FeedbackComments = dto.FeedbackComments;
        feedback.ImprovementSuggestions = dto.ImprovementSuggestions;
        feedback.ActualPointsCompleted = dto.CompletedPoints ?? dto.ActualPointsCompleted;
        var resolvedCompletedPoints = feedback.ActualPointsCompleted;
        var resolvedActualOutcome = ParseActualOutcome(dto.ActualOutcome);
        var resolvedActualSpillover = dto.ActualSpillover ?? InferSpilloverFromOutcome(resolvedActualOutcome);
        var resolvedActualSpilloverPoints = dto.ActualSpilloverPoints;

        if (!resolvedActualSpilloverPoints.HasValue && resolvedCompletedPoints.HasValue)
        {
            var baselineCommitment = assessment.PlannedCommitment;
            resolvedActualSpilloverPoints = Math.Max(0, baselineCommitment - resolvedCompletedPoints.Value);
        }

        feedback.ActualSpillover = resolvedActualSpillover;
        feedback.ActualSpilloverPoints = resolvedActualSpilloverPoints;

        // Persist actual execution outcome against the final prediction record.
        assessment.ActualOutcome = resolvedActualOutcome;
        assessment.ActualCompletedPoints = resolvedCompletedPoints;

        // Keep linked sprint execution state synchronized with submitted feedback.
        if (assessment.Sprint != null)
        {
            if (resolvedCompletedPoints.HasValue)
            {
                assessment.Sprint.CompletedPoints = resolvedCompletedPoints.Value;
            }

            assessment.Sprint.HadSpillover = resolvedActualSpillover;

            if (!dto.ActualSpillover.HasValue && resolvedCompletedPoints.HasValue)
            {
                assessment.Sprint.HadSpillover = resolvedCompletedPoints.Value < assessment.Sprint.CommittedPoints;
            }

            assessment.Sprint.Status = SprintStatus.Completed;
            assessment.Sprint.EndDate ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _context.Entry(feedback).Reference(f => f.Assessment).LoadAsync();
        if (feedback.SprintId.HasValue)
        {
            await _context.Entry(feedback).Reference(f => f.Sprint).LoadAsync();
        }

        return MapToDto(feedback);
    }

    private async Task<Sprint> EnsureSprintForFeedbackAsync(RiskAssessment assessment, CreateRiskFeedbackDto dto)
    {
        var team = await _context.Teams.FirstOrDefaultAsync(t => t.TeamId == assessment.TeamId)
            ?? throw new InvalidOperationException($"Team with ID {assessment.TeamId} not found.");

        var sprint = assessment.Sprint;

        if (sprint == null && assessment.SprintId.HasValue)
        {
            sprint = await _context.Sprints.FirstOrDefaultAsync(s => s.SprintId == assessment.SprintId.Value);
        }

        if (sprint == null)
        {
            var nextSprintNumber = (await _context.Sprints
                .Where(s => s.TeamId == assessment.TeamId)
                .Select(s => (int?)s.SprintNumber)
                .MaxAsync() ?? 0) + 1;

            sprint = new Sprint
            {
                TeamId = assessment.TeamId,
                SprintNumber = nextSprintNumber,
                SprintName = $"Sprint {nextSprintNumber}",
                Status = SprintStatus.Planned,
                CommittedPoints = Math.Max(0, assessment.PlannedCommitment),
                CompletedPoints = Math.Max(0, dto.CompletedPoints ?? dto.ActualPointsCompleted ?? 0),
                AddedPoints = 0,
                RemovedPoints = 0,
                TeamAvailability = Math.Clamp(assessment.TeamAvailability, 0, 100),
                TeamSize = Math.Max(1, team.TeamSize),
                MeetingHoursPerSprint = Math.Max(0, assessment.MeetingHoursPerSprint),
                NewMembersCount = Math.Max(0, assessment.NewMembersCount),
                AvgExperienceLevel = Math.Clamp(assessment.AvgExperienceLevel, 1, 10),
                CollaborationScore = Math.Clamp(assessment.CollaborationScore, 1, 10),
                SprintDuration = 14,
                HadSpillover = false,
                ExternalDependencies = Math.Max(0, assessment.ExternalDependencies),
                EndDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Sprints.Add(sprint);
            assessment.Sprint = sprint;
        }
        else
        {
            sprint.TeamId = assessment.TeamId;
            sprint.CommittedPoints = Math.Max(0, assessment.PlannedCommitment);
            sprint.TeamAvailability = Math.Clamp(assessment.TeamAvailability, 0, 100);
            sprint.TeamSize = Math.Max(1, sprint.TeamSize > 0 ? sprint.TeamSize : team.TeamSize);
            sprint.MeetingHoursPerSprint = Math.Max(0, assessment.MeetingHoursPerSprint);
            sprint.NewMembersCount = Math.Max(0, assessment.NewMembersCount);
            sprint.AvgExperienceLevel = Math.Clamp(assessment.AvgExperienceLevel > 0 ? assessment.AvgExperienceLevel : sprint.AvgExperienceLevel, 1, 10);
            sprint.CollaborationScore = Math.Clamp(assessment.CollaborationScore > 0 ? assessment.CollaborationScore : sprint.CollaborationScore, 1, 10);
            sprint.SprintDuration = sprint.SprintDuration > 0 ? sprint.SprintDuration : 14;
            sprint.ExternalDependencies = Math.Max(0, assessment.ExternalDependencies);

            if (string.IsNullOrWhiteSpace(sprint.SprintName))
            {
                sprint.SprintName = $"Sprint {sprint.SprintNumber}";
            }
        }

        return sprint;
    }

    private static SprintOutcome ParseActualOutcome(string actualOutcome)
    {
        if (Enum.TryParse<SprintOutcome>(actualOutcome, true, out var outcome))
        {
            return outcome;
        }

        throw new InvalidOperationException($"Invalid ActualOutcome '{actualOutcome}'. Expected SUCCESS, PARTIAL, or FAILED.");
    }

    private static bool InferSpilloverFromOutcome(SprintOutcome outcome)
    {
        return outcome switch
        {
            SprintOutcome.SUCCESS => false,
            SprintOutcome.PARTIAL => true,
            SprintOutcome.FAILED => true,
            _ => false
        };
    }

    /// <summary>
    /// Get all feedbacks for a team
    /// </summary>
    public async Task<IEnumerable<RiskFeedbackDto>> GetFeedbacksForTeamAsync(int teamId)
    {
        return await _context.RiskFeedbacks
            .Include(f => f.Assessment)
            .Include(f => f.Sprint)
            .Where(f => f.Assessment != null && f.Assessment.TeamId == teamId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => MapToDto(f))
            .ToListAsync();
    }

    /// <summary>
    /// Get feedback by ID
    /// </summary>
    public async Task<RiskFeedbackDto?> GetFeedbackByIdAsync(int feedbackId)
    {
        var feedback = await _context.RiskFeedbacks
            .Include(f => f.Assessment)
            .Include(f => f.Sprint)
            .FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);

        return feedback != null ? MapToDto(feedback) : null;
    }

    /// <summary>
    /// Get feedback for a specific assessment
    /// </summary>
    public async Task<RiskFeedbackDto?> GetFeedbackForAssessmentAsync(int assessmentId)
    {
        var feedback = await _context.RiskFeedbacks
            .Include(f => f.Assessment)
            .Include(f => f.Sprint)
            .FirstOrDefaultAsync(f => f.AssessmentId == assessmentId);

        return feedback != null ? MapToDto(feedback) : null;
    }

    /// <summary>
    /// Calculate prediction accuracy for a team
    /// </summary>
    public async Task<PredictionAccuracyDto> CalculatePredictionAccuracyAsync(int teamId)
    {
        var feedbacks = await _context.RiskFeedbacks
            .Include(f => f.Assessment)
            .Where(f => f.Assessment != null && f.Assessment.TeamId == teamId)
            .ToListAsync();

        var team = await _context.Teams.FindAsync(teamId);

        int total = feedbacks.Count;
        int accurate = feedbacks.Count(f => f.AgreementLevel == "Accurate");
        int partial = feedbacks.Count(f => f.AgreementLevel == "PartiallyAccurate");
        int incorrect = feedbacks.Count(f => f.AgreementLevel == "Incorrect");

        double accuracyPercent = total > 0 ? (double)accurate / total * 100 : 0;
        double partialPercent = total > 0 ? (double)(accurate + partial) / total * 100 : 0;
        double avgRating = feedbacks.Any() ? feedbacks.Average(f => f.RecommendationRating) : 0;

        // Calculate trend (compare last 5 vs previous 5)
        var sortedFeedbacks = feedbacks.OrderByDescending(f => f.CreatedAt).ToList();
        string trend = "STABLE";
        double trendPercent = 0;

        if (sortedFeedbacks.Count >= 6)
        {
            var recent = sortedFeedbacks.Take(3);
            var previous = sortedFeedbacks.Skip(3).Take(3);

            double recentAccuracy = recent.Count(f => f.UserAgreement) / 3.0 * 100;
            double previousAccuracy = previous.Count(f => f.UserAgreement) / 3.0 * 100;

            trendPercent = recentAccuracy - previousAccuracy;
            trend = trendPercent > 5 ? "IMPROVING" : (trendPercent < -5 ? "DECLINING" : "STABLE");
        }

        return new PredictionAccuracyDto
        {
            TeamId = teamId,
            TeamName = team?.TeamName,
            TotalFeedbacks = total,
            AccuratePredictions = accurate,
            PartiallyAccurate = partial,
            IncorrectPredictions = incorrect,
            AccuracyPercentage = Math.Round(accuracyPercent, 2),
            PartialAccuracyPercentage = Math.Round(partialPercent, 2),
            AverageRecommendationRating = Math.Round(avgRating, 2),
            AccuracyTrend = trend,
            TrendPercentage = Math.Round(trendPercent, 2),
            CalculatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Get comparison of last 3 sprint assessments with recommendations
    /// </summary>
    public async Task<SprintComparisonAnalysisDto> GetLastThreeSprintComparisonAsync(int teamId)
    {
        var team = await _context.Teams.FindAsync(teamId);

        // Load the candidate assessments first, then do grouping/order selection in-memory.
        // EF Core cannot translate the grouped first-per-sprint projection used by the UI view.
        var assessmentCandidates = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Include(a => a.Recommendations)
            .Where(a => a.TeamId == teamId && a.IsFinal && a.SprintId.HasValue)
            .ToListAsync();

        // Compare latest sprints using one canonical final assessment per sprint.
        var assessments = assessmentCandidates
            .GroupBy(a => a.SprintId!.Value)
            .Select(g => g
                .OrderByDescending(a => a.Iteration)
                .ThenByDescending(a => a.AssessedAt)
                .First())
            .OrderByDescending(a => a.Sprint?.SprintNumber ?? 0)
            .Take(3)
            .ToList();

        var sprintIds = assessments
            .Where(a => a.SprintId.HasValue)
            .Select(a => a.SprintId!.Value)
            .Distinct()
            .ToList();

        var sprints = await _context.Sprints
            .Where(s => sprintIds.Contains(s.SprintId))
            .ToListAsync();

        var feasibilityCandidates = await _context.ImplementationFeasibilities
            .Where(f => f.SprintId.HasValue && sprintIds.Contains(f.SprintId.Value))
            .OrderByDescending(f => f.EvaluationDate)
            .ToListAsync();

        var latestFeasibilityBySprint = feasibilityCandidates
            .GroupBy(f => f.SprintId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        // Get feedbacks for these final assessments
        var assessmentIds = assessments.Select(a => a.AssessmentId).ToList();
        var feedbacks = await _context.RiskFeedbacks
            .Where(f => assessmentIds.Contains(f.AssessmentId))
            .ToListAsync();

        var iterationCountsBySprint = await _context.RiskAssessments
            .Where(a => a.SprintId.HasValue && sprintIds.Contains(a.SprintId.Value))
            .GroupBy(a => a.SprintId!.Value)
            .Select(g => new { SprintId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SprintId, x => x.Count);

        // Resolve applied recommendations at sprint scope so actions applied on earlier
        // iterations are still visible when the latest final assessment has no direct flag.
        var appliedRecommendationBySprint = await _context.Recommendations
            .Where(r => r.WasApplied)
            .Join(
                _context.RiskAssessments.Where(a => a.SprintId.HasValue && sprintIds.Contains(a.SprintId.Value)),
                recommendation => recommendation.AssessmentId,
                assessment => assessment.AssessmentId,
                (recommendation, assessment) => new
                {
                    SprintId = assessment.SprintId!.Value,
                    Iteration = assessment.Iteration,
                    AssessedAt = assessment.AssessedAt,
                    Recommendation = recommendation
                })
            .ToListAsync();

        var appliedRecommendationsBySprint = appliedRecommendationBySprint
            .GroupBy(item => item.SprintId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(item => item.Recommendation.AppliedAt ?? DateTime.MinValue)
                    .ThenByDescending(item => item.Iteration)
                    .ThenByDescending(item => item.AssessedAt)
                    .Select(item => item.Recommendation)
                    .ToList());

        var comparisons = new List<SprintComparisonDto>();

        foreach (var assessment in assessments)
        {
            var sprint = assessment.SprintId.HasValue
                ? sprints.FirstOrDefault(s => s.SprintId == assessment.SprintId.Value)
                : null;

            var feedback = feedbacks.FirstOrDefault(f => f.AssessmentId == assessment.AssessmentId);
            var appliedRecommendations = assessment.SprintId.HasValue
                && appliedRecommendationsBySprint.TryGetValue(assessment.SprintId.Value, out var recommendations)
                ? recommendations
                : new List<Recommendation>();

            var latestAppliedRecommendation = appliedRecommendations.FirstOrDefault();

            var appliedRecommendationSummaries = appliedRecommendations
                .Select(recommendation => new AppliedRecommendationSummaryDto
                {
                    Title = recommendation.Title,
                    ActionType = recommendation.ActionType.ToString(),
                    BeforeScore = recommendation.BeforeScore,
                    AfterScore = recommendation.AfterScore,
                    BeforeRisk = recommendation.BeforeRiskLevel?.ToString(),
                    AfterRisk = recommendation.AfterRiskLevel?.ToString(),
                    ImpactScoreChange = recommendation.ImpactScoreChange,
                    AppliedAt = recommendation.AppliedAt,
                    AppliedBy = recommendation.AppliedBy
                })
                .ToList();

            comparisons.Add(new SprintComparisonDto
            {
                AssessmentId = assessment.AssessmentId,
                SprintId = sprint?.SprintId ?? 0,
                SprintNumber = sprint?.SprintNumber ?? 0,
                SprintName = sprint?.SprintName ?? (assessment.SprintId.HasValue ? $"Sprint {assessment.SprintId.Value}" : $"Assessment {assessment.AssessmentId}"),
                StartDate = sprint?.StartDate,
                EndDate = sprint?.EndDate,
                PredictedRisk = assessment.RiskLevel.ToString(),
                PredictedScore = assessment.TotalScore,
                ConfidenceLevel = assessment.Confidence switch
                {
                    AssessmentConfidence.HIGH => 100,
                    AssessmentConfidence.MEDIUM => 66,
                    AssessmentConfidence.LOW => 33,
                    _ => 0
                },
                MlRisk = assessment.MlRiskLevel?.ToString(),
                FinalRisk = assessment.FinalRiskLevel?.ToString(),
                MlConfidence = assessment.MlConfidence,
                TeamDynamicsScore = assessment.TeamDynamicsScore,
                TeamCondition = assessment.TeamCondition,
                FeasibilityStatus = sprint?.SprintId != null && latestFeasibilityBySprint.TryGetValue(sprint.SprintId, out var feasibility)
                    ? feasibility.Status
                    : null,
                FeasibilityReason = sprint?.SprintId != null && latestFeasibilityBySprint.TryGetValue(sprint.SprintId, out var feasibilityReason)
                    ? feasibilityReason.DecisionReason
                    : null,
                IterationCount = assessment.SprintId.HasValue
                    ? iterationCountsBySprint.GetValueOrDefault(assessment.SprintId.Value, 1)
                    : 1,
                FinalIteration = assessment.Iteration,
                IsFinal = assessment.IsFinal,
                ActualOutcome = feedback?.ActualOutcome ?? "Pending",
                CommittedPoints = sprint?.CommittedPoints ?? assessment.PlannedCommitment,
                CompletedPoints = feedback?.ActualPointsCompleted,
                HadSpillover = sprint?.HadSpillover ?? false,
                SpilloverPoints = sprint?.SpilloverPoints ?? 0,
                Recommendations = assessment.Recommendations?.Select(r => r.Title).ToList() ?? new List<string>(),
                AppliedRecommendationTitle = latestAppliedRecommendation?.Title,
                AppliedRecommendationActionType = latestAppliedRecommendation?.ActionType.ToString(),
                AppliedBeforeScore = latestAppliedRecommendation?.BeforeScore,
                AppliedAfterScore = latestAppliedRecommendation?.AfterScore,
                AppliedBeforeRisk = latestAppliedRecommendation?.BeforeRiskLevel?.ToString(),
                AppliedAfterRisk = latestAppliedRecommendation?.AfterRiskLevel?.ToString(),
                AppliedImpactScoreChange = latestAppliedRecommendation?.ImpactScoreChange,
                AppliedRecommendations = appliedRecommendationSummaries,
                WasAccurate = feedback?.UserAgreement ?? false,
                AccuracyLevel = feedback?.AgreementLevel ?? "Pending",
                HasFeedback = feedback != null,
                Feedback = feedback != null ? MapToDto(feedback) : null
            });
        }

        // Calculate recurring risk factors
        var allFactors = assessments
            .SelectMany(a => _context.RiskFactors
                .Where(f => f.AssessmentId == a.AssessmentId && f.Score > 1)
                .Select(f => f.FactorName))
            .GroupBy(f => f)
            .Where(g => g.Count() >= 2)
            .Select(g => g.Key)
            .ToList();

        // Generate insights
        var insights = GenerateInsights(comparisons, feedbacks);

        // Calculate overall accuracy
        double overallAccuracy = feedbacks.Any()
            ? feedbacks.Count(f => f.UserAgreement) / (double)feedbacks.Count * 100
            : 0;

        // Determine improvement trend
        string trend = "STABLE";
        if (comparisons.Count >= 2)
        {
            var scores = comparisons.Select(c => c.PredictedScore).ToList();
            if (scores[0] < scores[1]) trend = "IMPROVING";
            else if (scores[0] > scores[1]) trend = "DECLINING";
        }

        return new SprintComparisonAnalysisDto
        {
            TeamId = teamId,
            TeamName = team?.TeamName ?? $"Team {teamId}",
            Sprints = comparisons,
            OverallAccuracy = Math.Round(overallAccuracy, 2),
            ImprovementTrend = trend,
            RecurringRiskFactors = allFactors,
            KeyInsights = insights,
            GeneratedAt = DateTime.UtcNow
        };
    }

    // Helper: Generate insights from comparison data
    private List<string> GenerateInsights(List<SprintComparisonDto> comparisons, List<RiskFeedback> feedbacks)
    {
        var insights = new List<string>();

        // Completion rate trend
        if (comparisons.Count >= 2)
        {
            var rates = comparisons.Select(c => c.CommittedPoints > 0
                ? (double)(c.CompletedPoints ?? 0) / c.CommittedPoints * 100
                : 100).ToList();

            if (rates[0] > rates[1] + 5)
                insights.Add("📈 Completion rate is improving compared to previous sprints.");
            else if (rates[0] < rates[1] - 5)
                insights.Add("📉 Completion rate has declined. Consider reducing commitment.");
        }

        // Spillover pattern
        int spilloverCount = comparisons.Count(c => c.HadSpillover);
        if (spilloverCount >= 2)
        {
            insights.Add("⚠️ Recurring spillover pattern detected. Review estimation practices.");
        }

        // Prediction accuracy
        int accurateCount = feedbacks.Count(f => f.UserAgreement);
        if (feedbacks.Count >= 2)
        {
            double accuracy = (double)accurateCount / feedbacks.Count * 100;
            if (accuracy >= 80)
                insights.Add("✅ Risk predictions have been highly accurate recently.");
            else if (accuracy < 50)
                insights.Add("⚠️ Prediction accuracy is low. System may need calibration.");
        }

        // Recommendation effectiveness
        var helpfulCount = feedbacks.Count(f => f.RecommendationsHelpful);
        if (feedbacks.Any() && helpfulCount > feedbacks.Count / 2)
        {
            insights.Add("👍 Recommendations are being found helpful by the team.");
        }

        if (!insights.Any())
        {
            insights.Add("ℹ️ More data needed for comprehensive insights.");
        }

        return insights;
    }

    // Mapper
    private static RiskFeedbackDto MapToDto(RiskFeedback f)
    {
        return new RiskFeedbackDto
        {
            FeedbackId = f.FeedbackId,
            AssessmentId = f.AssessmentId,
            TeamId = f.Assessment?.TeamId ?? 0,
            SprintId = f.SprintId,
            SprintName = f.Sprint?.SprintName,
            UserId = f.UserId,
            UserName = f.UserName,
            UserRole = f.UserRole,
            PredictedRisk = f.PredictedRisk,
            ActualOutcome = f.ActualOutcome,
            UserAgreement = f.UserAgreement,
            AgreementLevel = f.AgreementLevel,
            RecommendationsHelpful = f.RecommendationsHelpful,
            RecommendationRating = f.RecommendationRating,
            FeedbackComments = f.FeedbackComments,
            ImprovementSuggestions = f.ImprovementSuggestions,
            ActualPointsCompleted = f.ActualPointsCompleted,
            ActualSpillover = f.ActualSpillover,
            ActualSpilloverPoints = f.ActualSpilloverPoints,
            CreatedAt = f.CreatedAt
        };
    }
}
