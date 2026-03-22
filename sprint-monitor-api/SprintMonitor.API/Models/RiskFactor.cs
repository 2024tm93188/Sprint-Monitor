using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Individual risk factor with score and explanation
/// </summary>
public class RiskFactor
{
    [Key]
    public int FactorId { get; set; }

    [Required]
    public int AssessmentId { get; set; }

    /// <summary>
    /// Name of the risk factor (e.g., "CVR", "Spillover Rate")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string FactorName { get; set; } = string.Empty;

    /// <summary>
    /// Score contribution (0-3)
    /// </summary>
    [Required]
    [Range(0, 3)]
    public int Score { get; set; }

    /// <summary>
    /// Maximum score for this factor
    /// </summary>
    public int MaxScore { get; set; } = 3;

    /// <summary>
    /// Human-readable explanation
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// The metric value that triggered this score
    /// </summary>
    [Column(TypeName = "decimal(10,4)")]
    public decimal MetricValue { get; set; }

    /// <summary>
    /// Threshold that was exceeded (if any)
    /// </summary>
    [Column(TypeName = "decimal(10,4)")]
    public decimal? Threshold { get; set; }

    // Navigation property
    [ForeignKey("AssessmentId")]
    public RiskAssessment? Assessment { get; set; }
}
