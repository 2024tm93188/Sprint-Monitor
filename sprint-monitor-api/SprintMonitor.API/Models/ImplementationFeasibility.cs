using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SprintMonitor.API.Models;

/// <summary>
/// Feasibility Validation Module
/// Tracks technical, operational, and organizational feasibility 
/// with industry mentor validation for practical deployment viability.
/// </summary>
public class ImplementationFeasibility
{
    [Key]
    public int FeasibilityId { get; set; }

    /// <summary>
    /// Team this feasibility study applies to
    /// </summary>
    public int? TeamId { get; set; }

    [ForeignKey("TeamId")]
    public Team? Team { get; set; }

    /// <summary>
    /// Date when feasibility was evaluated
    /// </summary>
    public DateTime EvaluationDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Technical Feasibility - Can the system be built with available technology?
    /// </summary>
    public bool TechnicalFeasibility { get; set; }

    /// <summary>
    /// Technical feasibility details and notes
    /// </summary>
    [MaxLength(1000)]
    public string? TechnicalNotes { get; set; }

    /// <summary>
    /// Operational Feasibility - Will the system work in daily operations?
    /// </summary>
    public bool OperationalFeasibility { get; set; }

    /// <summary>
    /// Operational feasibility details and notes
    /// </summary>
    [MaxLength(1000)]
    public string? OperationalNotes { get; set; }

    /// <summary>
    /// Organizational Feasibility - Does it fit with company culture/processes?
    /// </summary>
    public bool OrganizationalFeasibility { get; set; }

    /// <summary>
    /// Organizational feasibility details and notes
    /// </summary>
    [MaxLength(1000)]
    public string? OrganizationalNotes { get; set; }

    /// <summary>
    /// Integration possibility with existing Agile tools (Jira, Azure DevOps, etc.)
    /// </summary>
    public bool IntegrationFeasibility { get; set; }

    /// <summary>
    /// Integration feasibility details
    /// </summary>
    [MaxLength(1000)]
    public string? IntegrationNotes { get; set; }

    /// <summary>
    /// Industry mentor's comments and validation
    /// </summary>
    [MaxLength(2000)]
    public string? MentorComments { get; set; }

    /// <summary>
    /// Name of the person who approved (industry mentor)
    /// </summary>
    [MaxLength(200)]
    public string? ApprovedBy { get; set; }

    /// <summary>
    /// Approval status: Proposed, Under Review, Approved, Deferred, Rejected
    /// </summary>
    [MaxLength(50)]
    public string Status { get; set; } = "Proposed";

    /// <summary>
    /// Expected benefits from implementation
    /// </summary>
    [MaxLength(2000)]
    public string? ExpectedBenefits { get; set; }

    /// <summary>
    /// Identified adoption challenges
    /// </summary>
    [MaxLength(2000)]
    public string? AdoptionChallenges { get; set; }

    /// <summary>
    /// Scalability considerations
    /// </summary>
    [MaxLength(2000)]
    public string? ScalabilityConsiderations { get; set; }

    /// <summary>
    /// Overall feasibility score (0-100)
    /// </summary>
    public int OverallScore { get; set; }

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
