using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Represents a sprint with planning and completion data.
/// Core entity for historical analysis.
/// </summary>
public class Sprint
{
    [Key]
    public int SprintId { get; set; }

    [Required]
    public int TeamId { get; set; }

    [Required]
    [MaxLength(100)]
    public string SprintName { get; set; } = string.Empty;

    /// <summary>
    /// Story points committed at sprint start
    /// </summary>
    [Required]
    [Range(0, 1000)]
    public int CommittedPoints { get; set; }

    /// <summary>
    /// Story points actually completed by sprint end
    /// </summary>
    [Required]
    [Range(0, 1000)]
    public int CompletedPoints { get; set; }

    /// <summary>
    /// Points added mid-sprint (scope creep)
    /// </summary>
    [Range(0, 500)]
    public int AddedPoints { get; set; } = 0;

    /// <summary>
    /// Points removed mid-sprint
    /// </summary>
    [Range(0, 500)]
    public int RemovedPoints { get; set; } = 0;

    /// <summary>
    /// Team availability percentage (0-100)
    /// </summary>
    [Range(0, 100)]
    public int TeamAvailability { get; set; } = 100;

    /// <summary>
    /// Number of team members
    /// </summary>
    [Range(1, 50)]
    public int TeamSize { get; set; } = 5;

    /// <summary>
    /// Sprint duration in days (typically 7 or 14)
    /// </summary>
    [Range(1, 30)]
    public int SprintDuration { get; set; } = 14;

    /// <summary>
    /// Whether work spilled over to next sprint
    /// </summary>
    public bool HadSpillover { get; set; }

    /// <summary>
    /// Number of external dependencies
    /// </summary>
    [Range(0, 100)]
    public int ExternalDependencies { get; set; } = 0;

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("TeamId")]
    public Team? Team { get; set; }

    // Computed property (not stored in DB)
    [NotMapped]
    public int SpilloverPoints => CommittedPoints + AddedPoints - RemovedPoints - CompletedPoints;
}
