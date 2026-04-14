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
    Task<CalibrationStatusDto> GetCalibrationStatusAsync(int teamId);
    Task<bool> MarkFeedbackAsUsedForCalibrationAsync(int feedbackId);
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
        // Determine user agreement based on agreement level
        bool userAgreement = dto.AgreementLevel == "Accurate";

        var feedback = new RiskFeedback
        {
            AssessmentId = dto.AssessmentId,
            SprintId = dto.SprintId,
            UserId = dto.UserId,
            UserName = dto.UserName,
            UserRole = dto.UserRole,
            PredictedRisk = dto.PredictedRisk,
            ActualOutcome = dto.ActualOutcome,
            UserAgreement = userAgreement,
            AgreementLevel = dto.AgreementLevel,
            RecommendationsHelpful = dto.RecommendationsHelpful,
            RecommendationRating = dto.RecommendationRating,
            FeedbackComments = dto.FeedbackComments,
            ImprovementSuggestions = dto.ImprovementSuggestions,
            ActualPointsCompleted = dto.ActualPointsCompleted,
            ActualSpillover = dto.ActualSpillover,
            ActualSpilloverPoints = dto.ActualSpilloverPoints,
            CreatedAt = DateTime.UtcNow,
            UsedForCalibration = false
        };

        _context.RiskFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return MapToDto(feedback);
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

        // Get last 3 assessments for the team
        var assessments = await _context.RiskAssessments
            .Include(a => a.Recommendations)
            .Where(a => a.TeamId == teamId)
            .OrderByDescending(a => a.AssessedAt)
            .Take(3)
            .ToListAsync();

        // Get corresponding sprints
        var sprintIds = assessments
            .Where(a => a.SprintId.HasValue)
            .Select(a => a.SprintId!.Value)
            .ToList();

        var sprints = await _context.Sprints
            .Where(s => s.TeamId == teamId)
            .OrderByDescending(s => s.EndDate ?? s.CreatedAt)
            .Take(3)
            .ToListAsync();

        // Get feedbacks for these assessments
        var assessmentIds = assessments.Select(a => a.AssessmentId).ToList();
        var feedbacks = await _context.RiskFeedbacks
            .Where(f => assessmentIds.Contains(f.AssessmentId))
            .ToListAsync();

        var comparisons = new List<SprintComparisonDto>();

        foreach (var sprint in sprints)
        {
            var assessment = assessments.FirstOrDefault(a => a.SprintId == sprint.SprintId)
                ?? assessments.FirstOrDefault();

            var feedback = feedbacks.FirstOrDefault(f => f.SprintId == sprint.SprintId);

            comparisons.Add(new SprintComparisonDto
            {
                SprintId = sprint.SprintId,
                SprintName = sprint.SprintName ?? $"Sprint {sprint.SprintId}",
                StartDate = sprint.StartDate,
                EndDate = sprint.EndDate,
                PredictedRisk = assessment?.RiskLevel.ToString() ?? "Unknown",
                PredictedScore = (int)(assessment?.TotalScore ?? 0),
                ConfidenceLevel = assessment?.Confidence switch
                {
                    AssessmentConfidence.HIGH => 100,
                    AssessmentConfidence.MEDIUM => 66,
                    AssessmentConfidence.LOW => 33,
                    _ => 0
                },
                ActualOutcome = feedback?.ActualOutcome ?? DetermineActualOutcome(sprint),
                CommittedPoints = sprint.CommittedPoints,
                CompletedPoints = sprint.CompletedPoints,
                HadSpillover = sprint.HadSpillover,
                SpilloverPoints = sprint.SpilloverPoints,
                Recommendations = assessment?.Recommendations?.Select(r => r.Title).ToList() ?? new List<string>(),
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

    /// <summary>
    /// Get calibration status for a team
    /// </summary>
    public async Task<CalibrationStatusDto> GetCalibrationStatusAsync(int teamId)
    {
        var accuracy = await CalculatePredictionAccuracyAsync(teamId);

        bool needsCalibration = accuracy.AccuracyPercentage < 60;
        string recommendation;

        if (accuracy.AccuracyPercentage < 40)
            recommendation = "CRITICAL: Accuracy is very low. Consider reviewing risk thresholds and rules.";
        else if (accuracy.AccuracyPercentage < 60)
            recommendation = "WARNING: Accuracy below target. Adjust sensitivity thresholds.";
        else if (accuracy.AccuracyPercentage < 80)
            recommendation = "MODERATE: System is performing adequately. Minor tuning may help.";
        else
            recommendation = "GOOD: System accuracy is within acceptable range.";

        // Find actual last-calibrated date from DB (most recent feedback used for calibration)
        var lastCalibratedFeedback = await _context.RiskFeedbacks
            .Where(f => f.UsedForCalibration && f.Assessment != null && f.Assessment.TeamId == teamId)
            .OrderByDescending(f => f.CreatedAt)
            .FirstOrDefaultAsync();

        var lastCalibrated = lastCalibratedFeedback?.CreatedAt ?? DateTime.UtcNow.AddYears(-1);

        // Count feedback stats
        var totalFeedbacks = await _context.RiskFeedbacks
            .Where(f => f.Assessment != null && f.Assessment.TeamId == teamId)
            .CountAsync();

        var usedForCalibration = await _context.RiskFeedbacks
            .Where(f => f.UsedForCalibration && f.Assessment != null && f.Assessment.TeamId == teamId)
            .CountAsync();

        int pendingFeedbacks = totalFeedbacks - usedForCalibration;

        return new CalibrationStatusDto
        {
            TeamId = teamId,
            TotalFeedbacks = accuracy.TotalFeedbacks,
            FeedbacksUsedForCalibration = usedForCalibration,
            PendingFeedbacks = pendingFeedbacks,
            CurrentAccuracy = accuracy.AccuracyPercentage,
            TargetAccuracy = 80.0,
            CalibrationNeeded = needsCalibration,
            CalibrationRecommendation = recommendation,
            LastCalibrated = lastCalibrated,
            AccuracyTrend = accuracy.AccuracyTrend,
            TrendPercentage = accuracy.TrendPercentage
        };
    }

    /// <summary>
    /// Mark feedback as used for calibration
    /// </summary>
    public async Task<bool> MarkFeedbackAsUsedForCalibrationAsync(int feedbackId)
    {
        var feedback = await _context.RiskFeedbacks.FindAsync(feedbackId);
        if (feedback == null) return false;

        feedback.UsedForCalibration = true;
        await _context.SaveChangesAsync();
        return true;
    }

    // Helper: Determine actual outcome from sprint data
    private string DetermineActualOutcome(Sprint sprint)
    {
        double completionRate = sprint.CommittedPoints > 0
            ? (double)sprint.CompletedPoints / sprint.CommittedPoints * 100
            : 100;

        if (completionRate >= 95 && !sprint.HadSpillover) return "LOW";
        if (completionRate >= 80) return "MEDIUM";
        if (completionRate >= 60) return "HIGH";
        return "CRITICAL";
    }

    // Helper: Generate insights from comparison data
    private List<string> GenerateInsights(List<SprintComparisonDto> comparisons, List<RiskFeedback> feedbacks)
    {
        var insights = new List<string>();

        // Completion rate trend
        if (comparisons.Count >= 2)
        {
            var rates = comparisons.Select(c => c.CommittedPoints > 0
                ? (double)c.CompletedPoints / c.CommittedPoints * 100
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
