using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public interface ITeamService
{
    Task<IEnumerable<TeamDto>> GetAllTeamsAsync();
    Task<TeamDto?> GetTeamByIdAsync(int teamId);
    Task<TeamDto> CreateTeamAsync(CreateTeamDto dto);
    Task<TeamDto?> UpdateTeamAsync(int teamId, UpdateTeamDto dto);
    Task<bool> DeleteTeamAsync(int teamId);
}
