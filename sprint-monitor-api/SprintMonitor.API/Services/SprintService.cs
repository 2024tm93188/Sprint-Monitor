using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public class SprintService : ISprintService
{
    private readonly SprintMonitorDbContext _context;

    public SprintService(SprintMonitorDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SprintDto>> GetSprintsByTeamAsync(int teamId)
    {
        return await _context.Sprints
            .Include(s => s.Team)
            .Where(s => s.TeamId == teamId)
            .OrderByDescending(s => s.SprintNumber)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<SprintDto?> GetSprintByIdAsync(int sprintId)
    {
        var sprint = await _context.Sprints
            .Include(s => s.Team)
            .FirstOrDefaultAsync(s => s.SprintId == sprintId);

        return sprint == null ? null : MapToDto(sprint);
    }

    public async Task<SprintDto> CreateSprintAsync(CreateSprintDto dto)
    {
        var sprintNumber = await GetNextSprintNumberAsync(dto.TeamId);
        var sprint = new Sprint
        {
            TeamId = dto.TeamId,
            SprintNumber = sprintNumber,
            SprintName = string.IsNullOrWhiteSpace(dto.SprintName) ? $"Sprint {sprintNumber}" : dto.SprintName,
            Status = SprintStatus.Planned,
            CommittedPoints = dto.CommittedPoints,
            CompletedPoints = dto.CompletedPoints,
            AddedPoints = dto.AddedPoints,
            RemovedPoints = dto.RemovedPoints,
            TeamAvailability = dto.TeamAvailability,
            TeamSize = dto.TeamSize,
            SprintDuration = dto.SprintDuration,
            HadSpillover = dto.HadSpillover,
            ExternalDependencies = dto.ExternalDependencies,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedAt = DateTime.UtcNow
        };

        _context.Sprints.Add(sprint);
        await _context.SaveChangesAsync();

        // Reload with team info
        await _context.Entry(sprint).Reference(s => s.Team).LoadAsync();
        return MapToDto(sprint);
    }

    public async Task<SprintDto?> UpdateSprintAsync(int sprintId, UpdateSprintDto dto)
    {
        var sprint = await _context.Sprints.FindAsync(sprintId);
        if (sprint == null) return null;

        if (dto.SprintName != null) sprint.SprintName = dto.SprintName;
        if (dto.CommittedPoints.HasValue) sprint.CommittedPoints = dto.CommittedPoints.Value;
        if (dto.CompletedPoints.HasValue) sprint.CompletedPoints = dto.CompletedPoints.Value;
        if (dto.AddedPoints.HasValue) sprint.AddedPoints = dto.AddedPoints.Value;
        if (dto.RemovedPoints.HasValue) sprint.RemovedPoints = dto.RemovedPoints.Value;
        if (dto.TeamAvailability.HasValue) sprint.TeamAvailability = dto.TeamAvailability.Value;
        if (dto.TeamSize.HasValue) sprint.TeamSize = dto.TeamSize.Value;
        if (dto.HadSpillover.HasValue) sprint.HadSpillover = dto.HadSpillover.Value;
        if (dto.ExternalDependencies.HasValue) sprint.ExternalDependencies = dto.ExternalDependencies.Value;
        if (dto.StartDate.HasValue) sprint.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) sprint.EndDate = dto.EndDate.Value;

        await _context.SaveChangesAsync();
        return await GetSprintByIdAsync(sprintId);
    }

    public async Task<bool> DeleteSprintAsync(int sprintId)
    {
        var sprint = await _context.Sprints.FindAsync(sprintId);
        if (sprint == null) return false;

        _context.Sprints.Remove(sprint);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<SprintDto>> GetRecentSprintsAsync(int teamId, int count = 10)
    {
        return await _context.Sprints
            .Include(s => s.Team)
            .Where(s => s.TeamId == teamId)
            .OrderByDescending(s => s.SprintNumber)
            .Take(count)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<SprintDto?> GetActiveSprintAsync(int teamId)
    {
        var sprint = await _context.Sprints
            .Include(s => s.Team)
            .Where(s => s.TeamId == teamId && s.Status != SprintStatus.Completed)
            .OrderByDescending(s => s.SprintNumber)
            .FirstOrDefaultAsync();

        return sprint == null ? null : MapToDto(sprint);
    }

    public async Task<SprintDto> GetOrCreateActiveSprintAsync(int teamId)
    {
        var activeSprint = await _context.Sprints
            .Include(s => s.Team)
            .Where(s => s.TeamId == teamId && s.Status != SprintStatus.Completed)
            .OrderByDescending(s => s.SprintNumber)
            .FirstOrDefaultAsync();

        if (activeSprint != null)
        {
            return MapToDto(activeSprint);
        }

        var team = await _context.Teams.FindAsync(teamId);
        if (team == null)
        {
            throw new InvalidOperationException($"Team with ID {teamId} not found.");
        }

        var sprintNumber = await GetNextSprintNumberAsync(teamId);
        var sprint = new Sprint
        {
            TeamId = teamId,
            SprintNumber = sprintNumber,
            SprintName = $"Sprint {sprintNumber}",
            Status = SprintStatus.Planned,
            CommittedPoints = 0,
            CompletedPoints = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Sprints.Add(sprint);
        await _context.SaveChangesAsync();

        await _context.Entry(sprint).Reference(s => s.Team).LoadAsync();
        return MapToDto(sprint);
    }

    private async Task<int> GetNextSprintNumberAsync(int teamId)
    {
        var currentMax = await _context.Sprints
            .Where(s => s.TeamId == teamId)
            .Select(s => (int?)s.SprintNumber)
            .MaxAsync();

        return (currentMax ?? 0) + 1;
    }

    private static SprintDto MapToDto(Sprint sprint)
    {
        return new SprintDto
        {
            SprintId = sprint.SprintId,
            TeamId = sprint.TeamId,
            TeamName = sprint.Team?.TeamName ?? "",
            SprintNumber = sprint.SprintNumber,
            SprintName = sprint.SprintName,
            Status = sprint.Status.ToString(),
            CommittedPoints = sprint.CommittedPoints,
            CompletedPoints = sprint.CompletedPoints,
            AddedPoints = sprint.AddedPoints,
            RemovedPoints = sprint.RemovedPoints,
            TeamAvailability = sprint.TeamAvailability,
            TeamSize = sprint.TeamSize,
            SprintDuration = sprint.SprintDuration,
            HadSpillover = sprint.HadSpillover,
            ExternalDependencies = sprint.ExternalDependencies,
            SpilloverPoints = sprint.SpilloverPoints,
            StartDate = sprint.StartDate,
            EndDate = sprint.EndDate,
            CreatedAt = sprint.CreatedAt
        };
    }
}
