namespace SprintMonitor.API.DTOs;

/// <summary>
/// DTO for creating a new team
/// </summary>
public class CreateTeamDto
{
    public string TeamName { get; set; } = string.Empty;
    public int TeamSize { get; set; } = 5;
    public string? Description { get; set; }
}

/// <summary>
/// DTO for team response
/// </summary>
public class TeamDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int TeamSize { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public int SprintCount { get; set; }
}

/// <summary>
/// DTO for updating a team
/// </summary>
public class UpdateTeamDto
{
    public string? TeamName { get; set; }
    public int? TeamSize { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}
