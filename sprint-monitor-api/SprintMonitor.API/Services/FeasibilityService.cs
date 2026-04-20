using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Interface for Feasibility Service
/// </summary>
public interface IFeasibilityService
{
    Task<IEnumerable<FeasibilityDto>> GetAllFeasibilityStudiesAsync();
    Task<FeasibilityDto?> GetFeasibilityByIdAsync(int feasibilityId);
    Task<FeasibilityDto?> GetLatestFeasibilityForTeamAsync(int teamId);
    Task<FeasibilityDto> CreateFeasibilityStudyAsync(CreateFeasibilityDto dto);
    Task<FeasibilityDto?> UpdateFeasibilityStudyAsync(int feasibilityId, UpdateFeasibilityDto dto);
    Task<bool> UpdateFeasibilityStatusAsync(int feasibilityId, string status, string? approvedBy);
    Task<FeasibilitySummaryDto> GetFeasibilitySummaryAsync();
    Task<bool> DeleteFeasibilityStudyAsync(int feasibilityId);
}

/// <summary>
/// Feasibility Service Implementation
/// Manages technical, operational, and organizational feasibility validation
/// with industry mentor approval workflow.
/// </summary>
public class FeasibilityService : IFeasibilityService
{
    private readonly SprintMonitorDbContext _context;
    private readonly ISprintService _sprintService;

    public FeasibilityService(SprintMonitorDbContext context, ISprintService sprintService)
    {
        _context = context;
        _sprintService = sprintService;
    }

    /// <summary>
    /// Get all feasibility studies
    /// </summary>
    public async Task<IEnumerable<FeasibilityDto>> GetAllFeasibilityStudiesAsync()
    {
        return await _context.ImplementationFeasibilities
            .Include(f => f.Team)
            .Include(f => f.Sprint)
            .OrderByDescending(f => f.EvaluationDate)
            .Select(f => MapToDto(f))
            .ToListAsync();
    }

    /// <summary>
    /// Get feasibility study by ID
    /// </summary>
    public async Task<FeasibilityDto?> GetFeasibilityByIdAsync(int feasibilityId)
    {
        var feasibility = await _context.ImplementationFeasibilities
            .Include(f => f.Team)
            .Include(f => f.Sprint)
            .FirstOrDefaultAsync(f => f.FeasibilityId == feasibilityId);

        return feasibility != null ? MapToDto(feasibility) : null;
    }

    /// <summary>
    /// Get latest feasibility study for a team
    /// </summary>
    public async Task<FeasibilityDto?> GetLatestFeasibilityForTeamAsync(int teamId)
    {
        var feasibility = await _context.ImplementationFeasibilities
            .Include(f => f.Team)
            .Include(f => f.Sprint)
            .Where(f => f.TeamId == teamId)
            .OrderByDescending(f => f.EvaluationDate)
            .FirstOrDefaultAsync();

        return feasibility != null ? MapToDto(feasibility) : null;
    }

    /// <summary>
    /// Create a new feasibility study
    /// </summary>
    public async Task<FeasibilityDto> CreateFeasibilityStudyAsync(CreateFeasibilityDto dto)
    {
        Sprint? sprint = null;

        if (dto.SprintId.HasValue)
        {
            sprint = await _context.Sprints
                .FirstOrDefaultAsync(s => s.SprintId == dto.SprintId.Value && s.TeamId == dto.TeamId);
        }
        else if (dto.TeamId.HasValue)
        {
            var activeSprint = await _sprintService.GetActiveSprintAsync(dto.TeamId.Value);
            if (activeSprint != null)
            {
                sprint = await _context.Sprints.FirstOrDefaultAsync(s => s.SprintId == activeSprint.SprintId);
            }
        }

        var feasibility = new ImplementationFeasibility
        {
            TeamId = dto.TeamId,
            SprintId = sprint?.SprintId,
            EvaluationDate = DateTime.UtcNow,
            TechnicalFeasibility = dto.TechnicalFeasibility,
            TechnicalNotes = dto.TechnicalNotes,
            OperationalFeasibility = dto.OperationalFeasibility,
            OperationalNotes = dto.OperationalNotes,
            OrganizationalFeasibility = dto.OrganizationalFeasibility,
            OrganizationalNotes = dto.OrganizationalNotes,
            IntegrationFeasibility = dto.IntegrationFeasibility,
            IntegrationNotes = dto.IntegrationNotes,
            MentorComments = dto.MentorComments,
            ApprovedBy = dto.ApprovedBy,
            UserRole = dto.UserRole,
            Status = dto.Status,
            ExpectedBenefits = dto.ExpectedBenefits,
            AdoptionChallenges = dto.AdoptionChallenges,
            ScalabilityConsiderations = dto.ScalabilityConsiderations,
            OverallScore = CalculateOverallScore(dto),
            CreatedAt = DateTime.UtcNow
        };

        _context.ImplementationFeasibilities.Add(feasibility);
        await _context.SaveChangesAsync();

        // Reload with team data
        await _context.Entry(feasibility).Reference(f => f.Team).LoadAsync();
        if (feasibility.SprintId.HasValue)
        {
            await _context.Entry(feasibility).Reference(f => f.Sprint).LoadAsync();
        }
        return MapToDto(feasibility);
    }

    /// <summary>
    /// Update an existing feasibility study
    /// </summary>
    public async Task<FeasibilityDto?> UpdateFeasibilityStudyAsync(int feasibilityId, UpdateFeasibilityDto dto)
    {
        var feasibility = await _context.ImplementationFeasibilities
            .Include(f => f.Team)
            .FirstOrDefaultAsync(f => f.FeasibilityId == feasibilityId);

        if (feasibility == null) return null;

        // Update fields if provided
        if (dto.TechnicalFeasibility.HasValue)
            feasibility.TechnicalFeasibility = dto.TechnicalFeasibility.Value;
        if (dto.TechnicalNotes != null)
            feasibility.TechnicalNotes = dto.TechnicalNotes;
        if (dto.OperationalFeasibility.HasValue)
            feasibility.OperationalFeasibility = dto.OperationalFeasibility.Value;
        if (dto.OperationalNotes != null)
            feasibility.OperationalNotes = dto.OperationalNotes;
        if (dto.OrganizationalFeasibility.HasValue)
            feasibility.OrganizationalFeasibility = dto.OrganizationalFeasibility.Value;
        if (dto.OrganizationalNotes != null)
            feasibility.OrganizationalNotes = dto.OrganizationalNotes;
        if (dto.IntegrationFeasibility.HasValue)
            feasibility.IntegrationFeasibility = dto.IntegrationFeasibility.Value;
        if (dto.IntegrationNotes != null)
            feasibility.IntegrationNotes = dto.IntegrationNotes;
        if (dto.MentorComments != null)
            feasibility.MentorComments = dto.MentorComments;
        if (dto.ApprovedBy != null)
            feasibility.ApprovedBy = dto.ApprovedBy;
        if (dto.UserRole != null)
            feasibility.UserRole = dto.UserRole;
        if (dto.Status != null)
            feasibility.Status = dto.Status;
        if (dto.ExpectedBenefits != null)
            feasibility.ExpectedBenefits = dto.ExpectedBenefits;
        if (dto.AdoptionChallenges != null)
            feasibility.AdoptionChallenges = dto.AdoptionChallenges;
        if (dto.ScalabilityConsiderations != null)
            feasibility.ScalabilityConsiderations = dto.ScalabilityConsiderations;

        // Recalculate score
        feasibility.OverallScore = CalculateOverallScore(feasibility);
        feasibility.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(feasibility);
    }

    /// <summary>
    /// Update feasibility status (approval workflow)
    /// </summary>
    public async Task<bool> UpdateFeasibilityStatusAsync(int feasibilityId, string status, string? approvedBy)
    {
        var feasibility = await _context.ImplementationFeasibilities.FindAsync(feasibilityId);
        if (feasibility == null) return false;

        feasibility.Status = status;
        if (!string.IsNullOrEmpty(approvedBy))
            feasibility.ApprovedBy = approvedBy;
        feasibility.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Get feasibility summary statistics
    /// </summary>
    public async Task<FeasibilitySummaryDto> GetFeasibilitySummaryAsync()
    {
        var studies = await _context.ImplementationFeasibilities
            .Include(f => f.Team)
            .Include(f => f.Sprint)
            .ToListAsync();

        var latestStudy = studies.OrderByDescending(f => f.EvaluationDate).FirstOrDefault();

        return new FeasibilitySummaryDto
        {
            TotalStudies = studies.Count,
            ApprovedCount = studies.Count(s => s.Status == "Approved"),
            PendingCount = studies.Count(s => s.Status == "Proposed" || s.Status == "Under Review"),
            RejectedCount = studies.Count(s => s.Status == "Rejected" || s.Status == "Deferred"),
            AverageScore = studies.Any() ? studies.Average(s => s.OverallScore) : 0,
            LatestStudy = latestStudy != null ? MapToDto(latestStudy) : null
        };
    }

    /// <summary>
    /// Delete a feasibility study
    /// </summary>
    public async Task<bool> DeleteFeasibilityStudyAsync(int feasibilityId)
    {
        var feasibility = await _context.ImplementationFeasibilities.FindAsync(feasibilityId);
        if (feasibility == null) return false;

        _context.ImplementationFeasibilities.Remove(feasibility);
        await _context.SaveChangesAsync();
        return true;
    }

    // Helper: Calculate overall feasibility score (0-100)
    private int CalculateOverallScore(CreateFeasibilityDto dto)
    {
        int score = 0;
        if (dto.TechnicalFeasibility) score += 25;
        if (dto.OperationalFeasibility) score += 25;
        if (dto.OrganizationalFeasibility) score += 25;
        if (dto.IntegrationFeasibility) score += 25;
        return score;
    }

    private int CalculateOverallScore(ImplementationFeasibility f)
    {
        int score = 0;
        if (f.TechnicalFeasibility) score += 25;
        if (f.OperationalFeasibility) score += 25;
        if (f.OrganizationalFeasibility) score += 25;
        if (f.IntegrationFeasibility) score += 25;
        return score;
    }

    // Mapper
    private static FeasibilityDto MapToDto(ImplementationFeasibility f)
    {
        return new FeasibilityDto
        {
            FeasibilityId = f.FeasibilityId,
            TeamId = f.TeamId,
            TeamName = f.Team?.TeamName,
            SprintId = f.SprintId,
            SprintName = f.Sprint?.SprintName,
            UserRole = f.UserRole,
            EvaluationDate = f.EvaluationDate,
            TechnicalFeasibility = f.TechnicalFeasibility,
            TechnicalNotes = f.TechnicalNotes,
            OperationalFeasibility = f.OperationalFeasibility,
            OperationalNotes = f.OperationalNotes,
            OrganizationalFeasibility = f.OrganizationalFeasibility,
            OrganizationalNotes = f.OrganizationalNotes,
            IntegrationFeasibility = f.IntegrationFeasibility,
            IntegrationNotes = f.IntegrationNotes,
            MentorComments = f.MentorComments,
            ApprovedBy = f.ApprovedBy,
            Status = f.Status,
            ExpectedBenefits = f.ExpectedBenefits,
            AdoptionChallenges = f.AdoptionChallenges,
            ScalabilityConsiderations = f.ScalabilityConsiderations,
            OverallScore = f.OverallScore,
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt
        };
    }
}
