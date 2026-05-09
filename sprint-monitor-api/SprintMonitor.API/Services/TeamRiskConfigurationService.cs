using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public class TeamRiskConfigurationService : ITeamRiskConfigurationService
{
    private const string CvrLowMaxKey = "CVR_LOW_MAX";
    private const string CvrMediumMaxKey = "CVR_MEDIUM_MAX";
    private const string VelocityCvLowMaxKey = "VELOCITY_CV_LOW_MAX";
    private const string VelocityCvMediumMaxKey = "VELOCITY_CV_MEDIUM_MAX";
    private const string SpilloverLowMaxKey = "SPILLOVER_LOW_MAX";
    private const string SpilloverMediumMaxKey = "SPILLOVER_MEDIUM_MAX";
    private const string CapacityUtilizationLowMaxKey = "CAPACITY_UTILIZATION_LOW_MAX";
    private const string CapacityUtilizationMediumMaxKey = "CAPACITY_UTILIZATION_MEDIUM_MAX";
    private const string AvailabilityHighMinKey = "AVAILABILITY_HIGH_MIN";
    private const string AvailabilityMediumMinKey = "AVAILABILITY_MEDIUM_MIN";
    private const string DependencyLowMaxKey = "DEPENDENCY_LOW_MAX";
    private const string DependencyMediumMaxKey = "DEPENDENCY_MEDIUM_MAX";
    private const string CvrWeightKey = "CVR_WEIGHT";
    private const string VelocityWeightKey = "VELOCITY_WEIGHT";
    private const string SpilloverWeightKey = "SPILLOVER_WEIGHT";
    private const string CapacityWeightKey = "CAPACITY_WEIGHT";
    private const string AvailabilityWeightKey = "AVAILABILITY_WEIGHT";
    private const string DependencyWeightKey = "DEPENDENCY_WEIGHT";
    private const string TeamDynamicsWeightKey = "TEAM_DYNAMICS_WEIGHT";
    private const string UseTeamDynamicsKey = "USE_TEAM_DYNAMICS";
    private const string MeetingHoursLowMaxKey = "MEETING_HOURS_LOW_MAX";
    private const string MeetingHoursMediumMaxKey = "MEETING_HOURS_MEDIUM_MAX";
    private const string NewMembersLowMaxKey = "NEW_MEMBERS_LOW_MAX";
    private const string NewMembersMediumMaxKey = "NEW_MEMBERS_MEDIUM_MAX";
    private const string ExperienceLowMinKey = "EXPERIENCE_LOW_MIN";
    private const string ExperienceMediumMinKey = "EXPERIENCE_MEDIUM_MIN";
    private const string CollaborationLowMinKey = "COLLABORATION_LOW_MIN";
    private const string CollaborationMediumMinKey = "COLLABORATION_MEDIUM_MIN";

    private readonly SprintMonitorDbContext _context;

    public TeamRiskConfigurationService(SprintMonitorDbContext context)
    {
        _context = context;
    }

    public async Task<TeamRiskConfigurationDto> GetConfigurationAsync(int teamId)
    {
        var settings = await _context.TeamSettings
            .Where(s => s.TeamId == teamId)
            .ToListAsync();

        var configuration = CreateDefaults(teamId);

        configuration.CvrLowMax = GetDecimal(settings, CvrLowMaxKey, configuration.CvrLowMax);
        configuration.CvrMediumMax = GetDecimal(settings, CvrMediumMaxKey, configuration.CvrMediumMax);
        configuration.VelocityCvLowMax = GetDecimal(settings, VelocityCvLowMaxKey, configuration.VelocityCvLowMax);
        configuration.VelocityCvMediumMax = GetDecimal(settings, VelocityCvMediumMaxKey, configuration.VelocityCvMediumMax);
        configuration.SpilloverLowMax = GetDecimal(settings, SpilloverLowMaxKey, configuration.SpilloverLowMax);
        configuration.SpilloverMediumMax = GetDecimal(settings, SpilloverMediumMaxKey, configuration.SpilloverMediumMax);
        configuration.CapacityUtilizationLowMax = GetDecimal(settings, CapacityUtilizationLowMaxKey, configuration.CapacityUtilizationLowMax);
        configuration.CapacityUtilizationMediumMax = GetDecimal(settings, CapacityUtilizationMediumMaxKey, configuration.CapacityUtilizationMediumMax);
        configuration.AvailabilityHighMin = GetInt(settings, AvailabilityHighMinKey, configuration.AvailabilityHighMin);
        configuration.AvailabilityMediumMin = GetInt(settings, AvailabilityMediumMinKey, configuration.AvailabilityMediumMin);
        configuration.DependencyLowMax = GetInt(settings, DependencyLowMaxKey, configuration.DependencyLowMax);
        configuration.DependencyMediumMax = GetInt(settings, DependencyMediumMaxKey, configuration.DependencyMediumMax);
        configuration.CvrWeight = GetDecimal(settings, CvrWeightKey, configuration.CvrWeight);
        configuration.VelocityWeight = GetDecimal(settings, VelocityWeightKey, configuration.VelocityWeight);
        configuration.SpilloverWeight = GetDecimal(settings, SpilloverWeightKey, configuration.SpilloverWeight);
        configuration.CapacityWeight = GetDecimal(settings, CapacityWeightKey, configuration.CapacityWeight);
        configuration.AvailabilityWeight = GetDecimal(settings, AvailabilityWeightKey, configuration.AvailabilityWeight);
        configuration.DependencyWeight = GetDecimal(settings, DependencyWeightKey, configuration.DependencyWeight);
        configuration.TeamDynamicsWeight = GetDecimal(settings, TeamDynamicsWeightKey, configuration.TeamDynamicsWeight);
        configuration.UseTeamDynamics = GetBool(settings, UseTeamDynamicsKey, configuration.UseTeamDynamics);
        configuration.MeetingHoursLowMax = GetInt(settings, MeetingHoursLowMaxKey, configuration.MeetingHoursLowMax);
        configuration.MeetingHoursMediumMax = GetInt(settings, MeetingHoursMediumMaxKey, configuration.MeetingHoursMediumMax);
        configuration.NewMembersLowMax = GetInt(settings, NewMembersLowMaxKey, configuration.NewMembersLowMax);
        configuration.NewMembersMediumMax = GetInt(settings, NewMembersMediumMaxKey, configuration.NewMembersMediumMax);
        configuration.ExperienceLowMin = GetInt(settings, ExperienceLowMinKey, configuration.ExperienceLowMin);
        configuration.ExperienceMediumMin = GetInt(settings, ExperienceMediumMinKey, configuration.ExperienceMediumMin);
        configuration.CollaborationLowMin = GetInt(settings, CollaborationLowMinKey, configuration.CollaborationLowMin);
        configuration.CollaborationMediumMin = GetInt(settings, CollaborationMediumMinKey, configuration.CollaborationMediumMin);

        return configuration;
    }

    public async Task<TeamRiskConfigurationDto> SaveConfigurationAsync(int teamId, TeamRiskConfigurationDto configuration)
    {
        configuration.TeamId = teamId;

        var entries = new Dictionary<string, string>
        {
            [CvrLowMaxKey] = configuration.CvrLowMax.ToString(CultureInfo.InvariantCulture),
            [CvrMediumMaxKey] = configuration.CvrMediumMax.ToString(CultureInfo.InvariantCulture),
            [VelocityCvLowMaxKey] = configuration.VelocityCvLowMax.ToString(CultureInfo.InvariantCulture),
            [VelocityCvMediumMaxKey] = configuration.VelocityCvMediumMax.ToString(CultureInfo.InvariantCulture),
            [SpilloverLowMaxKey] = configuration.SpilloverLowMax.ToString(CultureInfo.InvariantCulture),
            [SpilloverMediumMaxKey] = configuration.SpilloverMediumMax.ToString(CultureInfo.InvariantCulture),
            [CapacityUtilizationLowMaxKey] = configuration.CapacityUtilizationLowMax.ToString(CultureInfo.InvariantCulture),
            [CapacityUtilizationMediumMaxKey] = configuration.CapacityUtilizationMediumMax.ToString(CultureInfo.InvariantCulture),
            [AvailabilityHighMinKey] = configuration.AvailabilityHighMin.ToString(CultureInfo.InvariantCulture),
            [AvailabilityMediumMinKey] = configuration.AvailabilityMediumMin.ToString(CultureInfo.InvariantCulture),
            [DependencyLowMaxKey] = configuration.DependencyLowMax.ToString(CultureInfo.InvariantCulture),
            [DependencyMediumMaxKey] = configuration.DependencyMediumMax.ToString(CultureInfo.InvariantCulture),
            [CvrWeightKey] = configuration.CvrWeight.ToString(CultureInfo.InvariantCulture),
            [VelocityWeightKey] = configuration.VelocityWeight.ToString(CultureInfo.InvariantCulture),
            [SpilloverWeightKey] = configuration.SpilloverWeight.ToString(CultureInfo.InvariantCulture),
            [CapacityWeightKey] = configuration.CapacityWeight.ToString(CultureInfo.InvariantCulture),
            [AvailabilityWeightKey] = configuration.AvailabilityWeight.ToString(CultureInfo.InvariantCulture),
            [DependencyWeightKey] = configuration.DependencyWeight.ToString(CultureInfo.InvariantCulture),
            [TeamDynamicsWeightKey] = configuration.TeamDynamicsWeight.ToString(CultureInfo.InvariantCulture),
            [UseTeamDynamicsKey] = configuration.UseTeamDynamics.ToString(),
            [MeetingHoursLowMaxKey] = configuration.MeetingHoursLowMax.ToString(CultureInfo.InvariantCulture),
            [MeetingHoursMediumMaxKey] = configuration.MeetingHoursMediumMax.ToString(CultureInfo.InvariantCulture),
            [NewMembersLowMaxKey] = configuration.NewMembersLowMax.ToString(CultureInfo.InvariantCulture),
            [NewMembersMediumMaxKey] = configuration.NewMembersMediumMax.ToString(CultureInfo.InvariantCulture),
            [ExperienceLowMinKey] = configuration.ExperienceLowMin.ToString(CultureInfo.InvariantCulture),
            [ExperienceMediumMinKey] = configuration.ExperienceMediumMin.ToString(CultureInfo.InvariantCulture),
            [CollaborationLowMinKey] = configuration.CollaborationLowMin.ToString(CultureInfo.InvariantCulture),
            [CollaborationMediumMinKey] = configuration.CollaborationMediumMin.ToString(CultureInfo.InvariantCulture)
        };

        foreach (var entry in entries)
        {
            var setting = await _context.TeamSettings.FirstOrDefaultAsync(s => s.TeamId == teamId && s.SettingKey == entry.Key);
            if (setting == null)
            {
                _context.TeamSettings.Add(new TeamSetting
                {
                    TeamId = teamId,
                    SettingKey = entry.Key,
                    SettingValue = entry.Value,
                    Description = GetDescription(entry.Key)
                });
            }
            else
            {
                setting.SettingValue = entry.Value;
                setting.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return await GetConfigurationAsync(teamId);
    }

    private static TeamRiskConfigurationDto CreateDefaults(int teamId) => new()
    {
        TeamId = teamId,
        CvrLowMax = 1.0m,
        CvrMediumMax = 1.1m,
        VelocityCvLowMax = 0.15m,
        VelocityCvMediumMax = 0.25m,
        SpilloverLowMax = 20m,
        SpilloverMediumMax = 40m,
        CapacityUtilizationLowMax = 100m,
        CapacityUtilizationMediumMax = 125m,
        AvailabilityHighMin = 90,
        AvailabilityMediumMin = 75,
        DependencyLowMax = 0,
        DependencyMediumMax = 2,
        CvrWeight = 25m,
        VelocityWeight = 10m,
        SpilloverWeight = 15m,
        CapacityWeight = 10m,
        AvailabilityWeight = 10m,
        DependencyWeight = 10m,
        TeamDynamicsWeight = 20m,
        UseTeamDynamics = true,
        MeetingHoursLowMax = 8,
        MeetingHoursMediumMax = 12,
        NewMembersLowMax = 0,
        NewMembersMediumMax = 1,
        ExperienceLowMin = 4,
        ExperienceMediumMin = 6,
        CollaborationLowMin = 4,
        CollaborationMediumMin = 6
    };

    private static decimal GetDecimal(IEnumerable<TeamSetting> settings, string key, decimal fallback)
    {
        var setting = settings.FirstOrDefault(s => string.Equals(s.SettingKey, key, StringComparison.OrdinalIgnoreCase));
        return setting != null && decimal.TryParse(setting.SettingValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var value)
            ? value
            : fallback;
    }

    private static int GetInt(IEnumerable<TeamSetting> settings, string key, int fallback)
    {
        var setting = settings.FirstOrDefault(s => string.Equals(s.SettingKey, key, StringComparison.OrdinalIgnoreCase));
        return setting != null && int.TryParse(setting.SettingValue, NumberStyles.Any, CultureInfo.InvariantCulture, out var value)
            ? value
            : fallback;
    }

    private static bool GetBool(IEnumerable<TeamSetting> settings, string key, bool fallback)
    {
        var setting = settings.FirstOrDefault(s => string.Equals(s.SettingKey, key, StringComparison.OrdinalIgnoreCase));
        return setting != null && bool.TryParse(setting.SettingValue, out var value)
            ? value
            : fallback;
    }

    private static string? GetDescription(string key) => key switch
    {
        CvrLowMaxKey => "CVR threshold for low risk",
        CvrMediumMaxKey => "CVR threshold for medium risk",
        VelocityCvLowMaxKey => "Velocity coefficient threshold for low risk",
        VelocityCvMediumMaxKey => "Velocity coefficient threshold for medium risk",
        SpilloverLowMaxKey => "Spillover rate threshold for low risk (%)",
        SpilloverMediumMaxKey => "Spillover rate threshold for medium risk (%)",
        CapacityUtilizationLowMaxKey => "Capacity utilization threshold for low risk (%)",
        CapacityUtilizationMediumMaxKey => "Capacity utilization threshold for medium risk (%)",
        AvailabilityHighMinKey => "Minimum availability for low risk",
        AvailabilityMediumMinKey => "Minimum availability for medium risk",
        DependencyLowMaxKey => "Dependency count threshold for low risk",
        DependencyMediumMaxKey => "Dependency count threshold for medium risk",
        CvrWeightKey => "CVR weight used in the weighted score",
        VelocityWeightKey => "Velocity weight used in the weighted score",
        SpilloverWeightKey => "Spillover weight used in the weighted score",
        CapacityWeightKey => "Capacity weight used in the weighted score",
        AvailabilityWeightKey => "Availability weight used in the weighted score",
        DependencyWeightKey => "Dependency weight used in the weighted score",
        TeamDynamicsWeightKey => "Team dynamics weight used in the weighted score",
        UseTeamDynamicsKey => "Whether team dynamics contributes to the risk score",
        MeetingHoursLowMaxKey => "Low-risk threshold for meeting load",
        MeetingHoursMediumMaxKey => "Medium-risk threshold for meeting load",
        NewMembersLowMaxKey => "Low-risk threshold for new members",
        NewMembersMediumMaxKey => "Medium-risk threshold for new members",
        ExperienceLowMinKey => "Low experience threshold",
        ExperienceMediumMinKey => "Medium experience threshold",
        CollaborationLowMinKey => "Low collaboration threshold",
        CollaborationMediumMinKey => "Medium collaboration threshold",
        _ => null
    };
}
