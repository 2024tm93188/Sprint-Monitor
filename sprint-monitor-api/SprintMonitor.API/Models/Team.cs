using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Represents a team using Sprint Monitor
/// </summary>
public class Team
{
    [Key]
    public int TeamId { get; set; }

    [Required]
    [MaxLength(100)]
    public string TeamName { get; set; } = string.Empty;

    [Range(1, 100)]
    public int TeamSize { get; set; } = 5;

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<RiskAssessment> RiskAssessments { get; set; } = new List<RiskAssessment>();
    public ICollection<TeamSetting> Settings { get; set; } = new List<TeamSetting>();
}
