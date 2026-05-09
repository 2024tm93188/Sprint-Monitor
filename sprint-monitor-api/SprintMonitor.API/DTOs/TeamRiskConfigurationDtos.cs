namespace SprintMonitor.API.DTOs;

/// <summary>
/// Team-specific risk configuration for thresholds, weights, and optional metrics.
/// Core Agile metrics remain fixed; only tuning values are configurable.
/// </summary>
public class TeamRiskConfigurationDto
{
    public int TeamId { get; set; }

    public decimal CvrLowMax { get; set; } = 1.0m;
    public decimal CvrMediumMax { get; set; } = 1.1m;
    public decimal VelocityCvLowMax { get; set; } = 0.15m;
    public decimal VelocityCvMediumMax { get; set; } = 0.25m;
    public decimal SpilloverLowMax { get; set; } = 20m;
    public decimal SpilloverMediumMax { get; set; } = 40m;
    public decimal CapacityUtilizationLowMax { get; set; } = 100m;
    public decimal CapacityUtilizationMediumMax { get; set; } = 125m;
    public int AvailabilityHighMin { get; set; } = 90;
    public int AvailabilityMediumMin { get; set; } = 75;
    public int DependencyLowMax { get; set; } = 0;
    public int DependencyMediumMax { get; set; } = 2;

    public decimal CvrWeight { get; set; } = 25m;
    public decimal VelocityWeight { get; set; } = 10m;
    public decimal SpilloverWeight { get; set; } = 15m;
    public decimal CapacityWeight { get; set; } = 10m;
    public decimal AvailabilityWeight { get; set; } = 10m;
    public decimal DependencyWeight { get; set; } = 10m;
    public decimal TeamDynamicsWeight { get; set; } = 20m;

    public bool UseTeamDynamics { get; set; } = true;
    public int MeetingHoursLowMax { get; set; } = 8;
    public int MeetingHoursMediumMax { get; set; } = 12;
    public int NewMembersLowMax { get; set; } = 0;
    public int NewMembersMediumMax { get; set; } = 1;
    public int ExperienceLowMin { get; set; } = 4;
    public int ExperienceMediumMin { get; set; } = 6;
    public int CollaborationLowMin { get; set; } = 4;
    public int CollaborationMediumMin { get; set; } = 6;
}
