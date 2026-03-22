using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Team-specific configuration settings
/// </summary>
public class TeamSetting
{
    [Key]
    public int SettingId { get; set; }

    [Required]
    public int TeamId { get; set; }

    /// <summary>
    /// Setting key (e.g., "CVR_THRESHOLD_HIGH")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string SettingKey { get; set; } = string.Empty;

    /// <summary>
    /// Setting value (stored as string, parsed as needed)
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string SettingValue { get; set; } = string.Empty;

    /// <summary>
    /// Description of what this setting controls
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("TeamId")]
    public Team? Team { get; set; }
}
