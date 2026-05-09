using SprintMonitor.API.Models;

namespace SprintMonitor.API.DTOs;

/// <summary>
/// DTO for risk assessment request
/// </summary>
public class RiskAssessmentRequestDto
{
    public int TeamId { get; set; }

    /// <summary>
    /// Optional: Link this assessment to a specific sprint record
    /// </summary>
    public int? SprintId { get; set; }

    public int PlannedCommitment { get; set; }
    public int TeamAvailability { get; set; } = 100;
    public int ExternalDependencies { get; set; } = 0;
    public int TeamSize { get; set; } = 5;
    public int MeetingHoursPerSprint { get; set; } = 8;
    public int NewMembersCount { get; set; } = 0;
    public int AvgExperienceLevel { get; set; } = 6;
    public int CollaborationScore { get; set; } = 7;
}

/// <summary>
/// DTO for risk assessment response
/// </summary>
public class RiskAssessmentDto
{
    public int AssessmentId { get; set; }
    public int TeamId { get; set; }
    public int? SprintId { get; set; }
    public int SprintNumber { get; set; }
    public int Iteration { get; set; }
    public bool IsFinal { get; set; }
    public int PlannedCommitment { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    /// <summary>
    /// ML-predicted risk level (null if ML unavailable)
    /// </summary>
    public string? MlRiskLevel { get; set; }
    /// <summary>
    /// Final combined risk level (rule + ML)
    /// </summary>
    public string? FinalRiskLevel { get; set; }
    /// <summary>
    /// ML model prediction confidence (0.0 - 1.0)
    /// </summary>
    public decimal? MlConfidence { get; set; }
    public int TeamSize { get; set; }
    public int MeetingHoursPerSprint { get; set; }
    public int NewMembersCount { get; set; }
    public int AvgExperienceLevel { get; set; }
    public int CollaborationScore { get; set; }
    public int TeamDynamicsScore { get; set; }
    public string TeamCondition { get; set; } = "Balanced";
    public decimal TotalScore { get; set; }
    public int MaxPossibleScore { get; set; }
    public string Confidence { get; set; } = string.Empty;
    public decimal FeedbackCalibrationFactor { get; set; } = 1.0m;
    public int FeedbackSampleSize { get; set; } = 0;
    public DateTime AssessedAt { get; set; }
    public List<RiskFactorDto> Factors { get; set; } = new();
    public List<RecommendationDto> Recommendations { get; set; } = new();
    public SprintMetricsDto Metrics { get; set; } = new();
}

/// <summary>
/// DTO for risk factor
/// </summary>
public class RiskFactorDto
{
    public string FactorName { get; set; } = string.Empty;
    public int Score { get; set; }
    public int MaxScore { get; set; }
    public decimal Weight { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal MetricValue { get; set; }
    public decimal? Threshold { get; set; }
}

/// <summary>
/// DTO for recommendation
/// </summary>
public class RecommendationDto
{
    public int RecommendationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string AddressesRiskFactor { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string? SuggestedChange { get; set; }
    public decimal? BeforeScore { get; set; }
    public decimal? AfterScore { get; set; }
    public string? BeforeRiskLevel { get; set; }
    public string? AfterRiskLevel { get; set; }
    public decimal? EstimatedScoreChange { get; set; }
    public bool WasApplied { get; set; }
    public DateTime? AppliedAt { get; set; }
    public string? AppliedBy { get; set; }
}

public class ApplyRecommendationDto
{
    public decimal? BeforeScore { get; set; }
    public decimal? AfterScore { get; set; }
    public string? BeforeRiskLevel { get; set; }
    public string? AfterRiskLevel { get; set; }
    public decimal? ImpactScoreChange { get; set; }
    public string? AppliedBy { get; set; }
}

public class ApplyRecommendationByMatchDto
{
    public int TeamId { get; set; }
    public int? SprintId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ActionType { get; set; }
    public string? AddressesRiskFactor { get; set; }
    public decimal? BeforeScore { get; set; }
    public decimal? AfterScore { get; set; }
    public string? BeforeRiskLevel { get; set; }
    public string? AfterRiskLevel { get; set; }
    public decimal? ImpactScoreChange { get; set; }
    public string? AppliedBy { get; set; }
}

/// <summary>
/// DTO for computed sprint metrics
/// </summary>
public class SprintMetricsDto
{
    public decimal AverageVelocity { get; set; }
    public decimal VelocityStandardDeviation { get; set; }
    public decimal VelocityCoefficient { get; set; }
    public decimal SpilloverRate { get; set; }
    public decimal EffectiveCapacity { get; set; }
    public decimal CVR { get; set; }
    public int SprintCount { get; set; }
    public string VelocityTrend { get; set; } = string.Empty;
    public int RecommendedCommitment { get; set; }
}

