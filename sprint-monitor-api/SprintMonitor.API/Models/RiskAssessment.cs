using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Risk level classification
/// </summary>
public enum RiskLevel
{
    LOW,
    MEDIUM,
    HIGH
}

/// <summary>
/// Actual sprint outcome (for validation)
/// </summary>
public enum SprintOutcome
{
    PENDING,    // Sprint not yet complete
    SUCCESS,    // All committed work done
    PARTIAL,    // Some spillover
    FAILED      // Significant spillover
}

/// <summary>
/// Confidence level based on data quality
/// </summary>
public enum AssessmentConfidence
{
    LOW,        // < 3 sprints of data
    MEDIUM,     // 3-5 sprints of data
    HIGH        // > 5 sprints of data
}

/// <summary>
/// Records a risk assessment for a planned sprint.
/// Used to track prediction accuracy over time.
/// </summary>
public class RiskAssessment
{
    [Key]
    public int AssessmentId { get; set; }

    [Required]
    public int TeamId { get; set; }

    /// <summary>
    /// Optional link to a specific sprint
    /// </summary>
    public int? SprintId { get; set; }

    /// <summary>
    /// Iteration number within the sprint
    /// </summary>
    public int Iteration { get; set; }

    /// <summary>
    /// Marks the final committed assessment for the sprint
    /// </summary>
    public bool IsFinal { get; set; }

    /// <summary>
    /// Story points planned for the assessed sprint
    /// </summary>
    [Required]
    [Range(0, 1000)]
    public int PlannedCommitment { get; set; }

    /// <summary>
    /// Team availability at time of assessment
    /// </summary>
    [Range(0, 100)]
    public int TeamAvailability { get; set; }

    /// <summary>
    /// External dependencies count
    /// </summary>
    [Range(0, 100)]
    public int ExternalDependencies { get; set; }

    /// <summary>
    /// Team size used for this assessment.
    /// </summary>
    [Range(1, 50)]
    public int TeamSize { get; set; } = 5;

    [Range(0, 200)]
    public int MeetingHoursPerSprint { get; set; } = 8;

    [Range(0, 50)]
    public int NewMembersCount { get; set; } = 0;

    [Range(1, 10)]
    public int AvgExperienceLevel { get; set; } = 6;

    [Range(1, 10)]
    public int CollaborationScore { get; set; } = 7;

    /// <summary>
    /// Team dynamics risk score (0-3).
    /// </summary>
    [Range(0, 3)]
    public int TeamDynamicsScore { get; set; }

    /// <summary>
    /// Qualitative team condition derived from team dynamics.
    /// </summary>
    [MaxLength(20)]
    public string TeamCondition { get; set; } = "Balanced";

    /// <summary>
    /// Computed risk level (rule-based)
    /// </summary>
    [Required]
    public RiskLevel RiskLevel { get; set; }

    /// <summary>
    /// ML-predicted risk level (null if ML service unavailable)
    /// </summary>
    public RiskLevel? MlRiskLevel { get; set; }

    /// <summary>
    /// Final combined risk level (rule + ML)
    /// </summary>
    public RiskLevel? FinalRiskLevel { get; set; }

    /// <summary>
    /// ML model prediction confidence (0.0 - 1.0)
    /// </summary>
    [Column(TypeName = "decimal(5,4)")]
    public decimal? MlConfidence { get; set; }

    /// <summary>
    /// Total risk score (0-17)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal TotalScore { get; set; }

    /// <summary>
    /// Maximum possible score
    /// </summary>
    public int MaxPossibleScore { get; set; } = 17;

    /// <summary>
    /// Confidence in the assessment
    /// </summary>
    public AssessmentConfidence Confidence { get; set; }

    /// <summary>
    /// Actual outcome after sprint completion (for validation)
    /// </summary>
    public SprintOutcome? ActualOutcome { get; set; }

    /// <summary>
    /// Actual completed points (filled after sprint ends)
    /// </summary>
    public int? ActualCompletedPoints { get; set; }

    /// <summary>
    /// Notes or comments
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime AssessedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("TeamId")]
    public Team? Team { get; set; }

    [ForeignKey("SprintId")]
    public Sprint? Sprint { get; set; }

    public ICollection<RiskFactor> Factors { get; set; } = new List<RiskFactor>();
    public ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();
}
