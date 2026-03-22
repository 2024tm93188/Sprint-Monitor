namespace SprintMonitor.API.DTOs;

/// <summary>
/// DTO for displaying risk feedback
/// </summary>
public class RiskFeedbackDto
{
    public int FeedbackId { get; set; }
    public int AssessmentId { get; set; }
    public int? SprintId { get; set; }
    public string? SprintName { get; set; }
    
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserRole { get; set; }
    
    public string PredictedRisk { get; set; } = string.Empty;
    public string ActualOutcome { get; set; } = string.Empty;
    public bool UserAgreement { get; set; }
    public string AgreementLevel { get; set; } = "Accurate";
    
    public bool RecommendationsHelpful { get; set; }
    public int RecommendationRating { get; set; }
    
    public string? FeedbackComments { get; set; }
    public string? ImprovementSuggestions { get; set; }
    
    public int? ActualPointsCompleted { get; set; }
    public bool? ActualSpillover { get; set; }
    public int? ActualSpilloverPoints { get; set; }
    
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for submitting risk feedback
/// </summary>
public class CreateRiskFeedbackDto
{
    public int AssessmentId { get; set; }
    public int? SprintId { get; set; }
    
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserRole { get; set; }
    
    public string PredictedRisk { get; set; } = string.Empty;
    public string ActualOutcome { get; set; } = string.Empty;
    
    /// <summary>
    /// Agreement level: Accurate, PartiallyAccurate, Incorrect
    /// </summary>
    public string AgreementLevel { get; set; } = "Accurate";
    
    public bool RecommendationsHelpful { get; set; }
    public int RecommendationRating { get; set; } = 3;
    
    public string? FeedbackComments { get; set; }
    public string? ImprovementSuggestions { get; set; }
    
    public int? ActualPointsCompleted { get; set; }
    public bool? ActualSpillover { get; set; }
    public int? ActualSpilloverPoints { get; set; }
}

/// <summary>
/// DTO for prediction accuracy statistics
/// </summary>
public class PredictionAccuracyDto
{
    public int TeamId { get; set; }
    public string? TeamName { get; set; }
    
    public int TotalFeedbacks { get; set; }
    public int AccuratePredictions { get; set; }
    public int PartiallyAccurate { get; set; }
    public int IncorrectPredictions { get; set; }
    
    public double AccuracyPercentage { get; set; }
    public double PartialAccuracyPercentage { get; set; }
    public double AverageRecommendationRating { get; set; }
    
    public DateTime CalculatedAt { get; set; }
    
    // Trend information
    public string AccuracyTrend { get; set; } = "STABLE"; // IMPROVING, DECLINING, STABLE
    public double TrendPercentage { get; set; }
}

/// <summary>
/// DTO for sprint comparison (last 3 dashboards)
/// </summary>
public class SprintComparisonDto
{
    public int SprintId { get; set; }
    public string SprintName { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    
    // Prediction Data
    public string PredictedRisk { get; set; } = string.Empty;
    public int PredictedScore { get; set; }
    public double ConfidenceLevel { get; set; }
    
    // Actual Outcome
    public string ActualOutcome { get; set; } = string.Empty;
    public int CommittedPoints { get; set; }
    public int CompletedPoints { get; set; }
    public bool HadSpillover { get; set; }
    public int SpilloverPoints { get; set; }
    
    // Recommendations
    public List<string> Recommendations { get; set; } = new();
    
    // Accuracy
    public bool WasAccurate { get; set; }
    public string AccuracyLevel { get; set; } = "Unknown"; // Accurate, PartiallyAccurate, Incorrect, Pending
    
    // Feedback
    public bool HasFeedback { get; set; }
    public RiskFeedbackDto? Feedback { get; set; }
}

/// <summary>
/// DTO for comparative analysis of last N sprints
/// </summary>
public class SprintComparisonAnalysisDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    
    public List<SprintComparisonDto> Sprints { get; set; } = new();
    
    // Aggregated metrics
    public double OverallAccuracy { get; set; }
    public string ImprovementTrend { get; set; } = "STABLE";
    public List<string> RecurringRiskFactors { get; set; } = new();
    public List<string> KeyInsights { get; set; } = new();
    
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// DTO for calibration status
/// </summary>
public class CalibrationStatusDto
{
    public int TeamId { get; set; }
    public int TotalFeedbacks { get; set; }
    public double CurrentAccuracy { get; set; }
    public double TargetAccuracy { get; set; } = 80.0;
    public bool NeedsCalibration { get; set; }
    public string CalibrationRecommendation { get; set; } = string.Empty;
    public DateTime LastCalibrated { get; set; }
}
