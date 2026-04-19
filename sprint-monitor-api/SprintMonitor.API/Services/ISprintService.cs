using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public interface ISprintService
{
    Task<IEnumerable<SprintDto>> GetSprintsByTeamAsync(int teamId);
    Task<SprintDto?> GetSprintByIdAsync(int sprintId);
    Task<SprintDto> CreateSprintAsync(CreateSprintDto dto);
    Task<SprintDto?> UpdateSprintAsync(int sprintId, UpdateSprintDto dto);
    Task<bool> DeleteSprintAsync(int sprintId);
    Task<IEnumerable<SprintDto>> GetRecentSprintsAsync(int teamId, int count = 10);
    Task<SprintDto?> GetActiveSprintAsync(int teamId);
    Task<SprintDto> GetOrCreateActiveSprintAsync(int teamId);
}
