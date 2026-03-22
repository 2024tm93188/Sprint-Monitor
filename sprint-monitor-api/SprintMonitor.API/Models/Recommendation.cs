using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Recommendation priority levels
/// </summary>
public enum RecommendationPriority
{
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

/// <summary>
/// Types of recommended actions
/// </summary>
public enum ActionType
{
    REDUCE_SCOPE,
    SPLIT_STORIES,
    ADD_BUFFER,
    RESOLVE_DEPENDENCIES,
    INCREASE_CAPACITY,
    IMPROVE_ESTIMATION
}

/// <summary>
/// Actionable recommendation based on risk assessment
/// </summary>
public class Recommendation
{
    [Key]
    public int RecommendationId { get; set; }

    [Required]
    public int AssessmentId { get; set; }

    /// <summary>
    /// Short title
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed recommendation text
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Priority of this recommendation
    /// </summary>
    [Required]
    public RecommendationPriority Priority { get; set; }

    /// <summary>
    /// Which risk factor this addresses
    /// </summary>
    [MaxLength(100)]
    public string AddressesRiskFactor { get; set; } = string.Empty;

    /// <summary>
    /// Suggested action type
    /// </summary>
    public ActionType ActionType { get; set; }

    /// <summary>
    /// Quantified impact if available
    /// </summary>
    [MaxLength(200)]
    public string? SuggestedChange { get; set; }

    /// <summary>
    /// Whether the recommendation was applied
    /// </summary>
    public bool WasApplied { get; set; } = false;

    // Navigation property
    [ForeignKey("AssessmentId")]
    public RiskAssessment? Assessment { get; set; }
}
