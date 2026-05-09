using SprintMonitor.API.DTOs;

namespace SprintMonitor.API.Services;

public interface ITeamRiskConfigurationService
{
    Task<TeamRiskConfigurationDto> GetConfigurationAsync(int teamId);
    Task<TeamRiskConfigurationDto> SaveConfigurationAsync(int teamId, TeamRiskConfigurationDto configuration);
}
