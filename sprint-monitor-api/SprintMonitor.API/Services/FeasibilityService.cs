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
        var sprint = await ResolveSprintLinkedToFinalAssessmentAsync(dto.TeamId, dto.SprintId);
        var finalAssessment = await ResolveFinalAssessmentForSprintAsync(sprint?.SprintId);

        var resolvedTeamId = dto.TeamId ?? sprint?.TeamId;
        if (!resolvedTeamId.HasValue)
        {
            throw new InvalidOperationException("TeamId is required to create feasibility study.");
        }

        var (computedStatus, riskLevel, teamCondition, teamDynamicsScore, decisionReason) =
            ComputeFeasibilityDecision(finalAssessment);

        var feasibility = new ImplementationFeasibility
        {
            TeamId = resolvedTeamId,
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
            Status = string.Equals(dto.Status, "Proposed", StringComparison.OrdinalIgnoreCase)
                ? computedStatus
                : dto.Status,
            ExpectedBenefits = dto.ExpectedBenefits,
            AdoptionChallenges = dto.AdoptionChallenges,
            ScalabilityConsiderations = dto.ScalabilityConsiderations,
            RiskLevel = riskLevel,
            TeamCondition = teamCondition,
            TeamDynamicsScore = teamDynamicsScore,
            DecisionReason = string.IsNullOrWhiteSpace(dto.DecisionReason) ? decisionReason : dto.DecisionReason,
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

        if (dto.SprintId.HasValue)
        {
            var sprint = await ResolveSprintLinkedToFinalAssessmentAsync(feasibility.TeamId, dto.SprintId);
            feasibility.SprintId = sprint?.SprintId;
        }

        var finalAssessment = await ResolveFinalAssessmentForSprintAsync(feasibility.SprintId);

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
        if (dto.DecisionReason != null)
            feasibility.DecisionReason = dto.DecisionReason;

        var (computedStatus, riskLevel, teamCondition, teamDynamicsScore, decisionReason) =
            ComputeFeasibilityDecision(finalAssessment);

        if (!string.IsNullOrWhiteSpace(riskLevel))
            feasibility.RiskLevel = riskLevel;
        if (!string.IsNullOrWhiteSpace(teamCondition))
            feasibility.TeamCondition = teamCondition;
        feasibility.TeamDynamicsScore = teamDynamicsScore;

        if (string.IsNullOrWhiteSpace(dto.Status) || string.Equals(dto.Status, "Proposed", StringComparison.OrdinalIgnoreCase))
            feasibility.Status = computedStatus;

        if (string.IsNullOrWhiteSpace(feasibility.DecisionReason))
            feasibility.DecisionReason = decisionReason;

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

    private async Task<Sprint?> ResolveSprintLinkedToFinalAssessmentAsync(int? teamId, int? sprintId)
    {
        if (sprintId.HasValue)
        {
            var sprint = await _context.Sprints
                .FirstOrDefaultAsync(s => s.SprintId == sprintId.Value);

            if (sprint == null)
            {
                throw new InvalidOperationException($"Sprint with ID {sprintId.Value} not found.");
            }

            if (teamId.HasValue && sprint.TeamId != teamId.Value)
            {
                throw new InvalidOperationException("Selected sprint does not belong to the selected team.");
            }

            var canonicalFinal = await _context.RiskAssessments
                .Where(a => a.SprintId == sprint.SprintId && a.IsFinal)
                .OrderByDescending(a => a.Iteration)
                .ThenByDescending(a => a.AssessedAt)
                .FirstOrDefaultAsync();

            if (canonicalFinal == null)
            {
                throw new InvalidOperationException("Feasibility can only be validated against a sprint that has a final assessment.");
            }

            return sprint;
        }

        if (!teamId.HasValue)
        {
            return null;
        }

        var latestFinalAssessment = await _context.RiskAssessments
            .Include(a => a.Sprint)
            .Where(a => a.TeamId == teamId.Value && a.IsFinal && a.SprintId.HasValue)
            .OrderByDescending(a => a.Sprint!.SprintNumber)
            .ThenByDescending(a => a.Iteration)
            .ThenByDescending(a => a.AssessedAt)
            .FirstOrDefaultAsync();

        if (latestFinalAssessment == null || latestFinalAssessment.Sprint == null)
        {
            throw new InvalidOperationException("No finalized sprint plan found for this team. Finalize an assessment first, then submit feasibility validation.");
        }

        return latestFinalAssessment.Sprint;
    }

    private async Task<RiskAssessment?> ResolveFinalAssessmentForSprintAsync(int? sprintId)
    {
        if (!sprintId.HasValue)
        {
            return null;
        }

        return await _context.RiskAssessments
            .Where(a => a.SprintId == sprintId.Value && a.IsFinal)
            .OrderByDescending(a => a.Iteration)
            .ThenByDescending(a => a.AssessedAt)
            .FirstOrDefaultAsync();
    }

    private static (string status, string riskLevel, string teamCondition, int teamDynamicsScore, string reason)
        ComputeFeasibilityDecision(RiskAssessment? finalAssessment)
    {
        if (finalAssessment == null)
        {
            return (
                status: "Under Review",
                riskLevel: "Unknown",
                teamCondition: "Unknown",
                teamDynamicsScore: 0,
                reason: "No final risk assessment found. Feasibility remains under review.");
        }

        var finalRisk = finalAssessment.FinalRiskLevel ?? finalAssessment.RiskLevel;
        var risk = finalRisk.ToString();
        var teamScore = Math.Clamp(finalAssessment.TeamDynamicsScore, 0, 3);
        var condition = string.IsNullOrWhiteSpace(finalAssessment.TeamCondition)
            ? (teamScore <= 1 ? "Strong" : teamScore == 2 ? "Watch" : "Fragile")
            : finalAssessment.TeamCondition;

        if (finalRisk == RiskLevel.HIGH && teamScore >= 2)
        {
            return ("Rejected", risk, condition, teamScore,
                "High delivery risk combined with unstable team dynamics makes implementation infeasible in the current sprint.");
        }

        if (finalRisk == RiskLevel.HIGH || teamScore >= 3)
        {
            return ("Deferred", risk, condition, teamScore,
                "Implementation should be deferred until risk or team dynamics improve.");
        }

        if (finalRisk == RiskLevel.MEDIUM && teamScore >= 2)
        {
            return ("Under Review", risk, condition, teamScore,
                "Moderate risk with team dynamics pressure requires additional mitigation and mentor review.");
        }

        return ("Approved", risk, condition, teamScore,
            "Risk and team conditions are acceptable for implementation with standard monitoring.");
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
            RiskLevel = f.RiskLevel,
            TeamCondition = f.TeamCondition,
            TeamDynamicsScore = f.TeamDynamicsScore,
            DecisionReason = f.DecisionReason,
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt
        };
    }
}
