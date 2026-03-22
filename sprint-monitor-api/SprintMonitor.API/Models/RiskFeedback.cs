using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Human Relevance Feedback Model
/// Captures user feedback on risk predictions to enable:
/// - Prediction accuracy measurement
/// - System calibration and improvement
/// - Comparison between predicted vs actual outcomes
/// </summary>
public class RiskFeedback
{
    [Key]
    public int FeedbackId { get; set; }

    /// <summary>
    /// Reference to the risk assessment being evaluated
    /// </summary>
    public int AssessmentId { get; set; }

    [ForeignKey("AssessmentId")]
    public RiskAssessment? Assessment { get; set; }

    /// <summary>
    /// Sprint ID this feedback relates to
    /// </summary>
    public int? SprintId { get; set; }

    [ForeignKey("SprintId")]
    public Sprint? Sprint { get; set; }

    /// <summary>
    /// User who provided the feedback (Scrum Master, Team Lead)
    /// </summary>
    [MaxLength(200)]
    public string? UserId { get; set; }

    /// <summary>
    /// Name of the user who provided feedback
    /// </summary>
    [MaxLength(200)]
    public string? UserName { get; set; }

    /// <summary>
    /// User's role (Scrum Master, Team Lead, Developer, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? UserRole { get; set; }

    /// <summary>
    /// The risk level predicted by the system
    /// </summary>
    [MaxLength(20)]
    public string PredictedRisk { get; set; } = string.Empty;

    /// <summary>
    /// The actual outcome after sprint completion
    /// </summary>
    [MaxLength(20)]
    public string ActualOutcome { get; set; } = string.Empty;

    /// <summary>
    /// Did the user agree with the prediction?
    /// </summary>
    public bool UserAgreement { get; set; }

    /// <summary>
    /// Agreement level: Accurate, Partially Accurate, Incorrect
    /// </summary>
    [MaxLength(50)]
    public string AgreementLevel { get; set; } = "Accurate";

    /// <summary>
    /// Were the recommendations helpful?
    /// </summary>
    public bool RecommendationsHelpful { get; set; }

    /// <summary>
    /// Rating for recommendations (1-5 stars)
    /// </summary>
    public int RecommendationRating { get; set; }

    /// <summary>
    /// User's detailed feedback comments
    /// </summary>
    [MaxLength(2000)]
    public string? FeedbackComments { get; set; }

    /// <summary>
    /// Suggestions for improving the risk engine
    /// </summary>
    [MaxLength(2000)]
    public string? ImprovementSuggestions { get; set; }

    /// <summary>
    /// Actual story points completed (for accuracy measurement)
    /// </summary>
    public int? ActualPointsCompleted { get; set; }

    /// <summary>
    /// Was there spillover in this sprint?
    /// </summary>
    public bool? ActualSpillover { get; set; }

    /// <summary>
    /// Actual spillover points
    /// </summary>
    public int? ActualSpilloverPoints { get; set; }

    /// <summary>
    /// Feedback submission timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Flag indicating if feedback was used for calibration
    /// </summary>
    public bool UsedForCalibration { get; set; } = false;
}

/// <summary>
/// Aggregated prediction accuracy statistics
/// </summary>
public class PredictionAccuracyStats
{
    public int TeamId { get; set; }
    public int TotalFeedbacks { get; set; }
    public int AccuratePredictions { get; set; }
    public int PartiallyAccurate { get; set; }
    public int IncorrectPredictions { get; set; }
    public double AccuracyPercentage { get; set; }
    public double AverageRecommendationRating { get; set; }
    public DateTime CalculatedAt { get; set; }
}
