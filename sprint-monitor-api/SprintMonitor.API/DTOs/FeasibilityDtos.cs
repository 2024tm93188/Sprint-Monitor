namespace SprintMonitor.API.DTOs;

/// <summary>
/// DTO for displaying feasibility study information
/// </summary>
public class FeasibilityDto
{
    public int FeasibilityId { get; set; }
    public int? TeamId { get; set; }
    public string? TeamName { get; set; }
    public DateTime EvaluationDate { get; set; }
    
    // Feasibility Flags
    public bool TechnicalFeasibility { get; set; }
    public string? TechnicalNotes { get; set; }
    public bool OperationalFeasibility { get; set; }
    public string? OperationalNotes { get; set; }
    public bool OrganizationalFeasibility { get; set; }
    public string? OrganizationalNotes { get; set; }
    public bool IntegrationFeasibility { get; set; }
    public string? IntegrationNotes { get; set; }
    
    // Mentor Validation
    public string? MentorComments { get; set; }
    public string? ApprovedBy { get; set; }
    public string Status { get; set; } = "Proposed";
    
    // Analysis
    public string? ExpectedBenefits { get; set; }
    public string? AdoptionChallenges { get; set; }
    public string? ScalabilityConsiderations { get; set; }
    public int OverallScore { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO for creating a new feasibility study
/// </summary>
public class CreateFeasibilityDto
{
    public int? TeamId { get; set; }
    
    public bool TechnicalFeasibility { get; set; }
    public string? TechnicalNotes { get; set; }
    
    public bool OperationalFeasibility { get; set; }
    public string? OperationalNotes { get; set; }
    
    public bool OrganizationalFeasibility { get; set; }
    public string? OrganizationalNotes { get; set; }
    
    public bool IntegrationFeasibility { get; set; }
    public string? IntegrationNotes { get; set; }
    
    public string? MentorComments { get; set; }
    public string? ApprovedBy { get; set; }
    public string Status { get; set; } = "Proposed";
    
    public string? ExpectedBenefits { get; set; }
    public string? AdoptionChallenges { get; set; }
    public string? ScalabilityConsiderations { get; set; }
}

/// <summary>
/// DTO for updating feasibility study
/// </summary>
public class UpdateFeasibilityDto
{
    public bool? TechnicalFeasibility { get; set; }
    public string? TechnicalNotes { get; set; }
    
    public bool? OperationalFeasibility { get; set; }
    public string? OperationalNotes { get; set; }
    
    public bool? OrganizationalFeasibility { get; set; }
    public string? OrganizationalNotes { get; set; }
    
    public bool? IntegrationFeasibility { get; set; }
    public string? IntegrationNotes { get; set; }
    
    public string? MentorComments { get; set; }
    public string? ApprovedBy { get; set; }
    public string? Status { get; set; }
    
    public string? ExpectedBenefits { get; set; }
    public string? AdoptionChallenges { get; set; }
    public string? ScalabilityConsiderations { get; set; }
}

/// <summary>
/// Summary DTO for feasibility overview
/// </summary>
public class FeasibilitySummaryDto
{
    public int TotalStudies { get; set; }
    public int ApprovedCount { get; set; }
    public int PendingCount { get; set; }
    public int RejectedCount { get; set; }
    public double AverageScore { get; set; }
    public FeasibilityDto? LatestStudy { get; set; }
}
