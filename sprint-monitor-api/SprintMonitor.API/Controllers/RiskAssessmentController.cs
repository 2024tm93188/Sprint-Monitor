using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;

namespace SprintMonitor.API.Controllers;

/// <summary>
/// API endpoints for risk assessment
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public class RiskAssessmentController : ControllerBase
{
    private readonly IRiskAssessmentService _riskAssessmentService;

    public RiskAssessmentController(IRiskAssessmentService riskAssessmentService)
    {
        _riskAssessmentService = riskAssessmentService;
    }

    /// <summary>
    /// Evaluate sprint risk based on historical data
    /// </summary>
    /// <remarks>
    /// This is the core functionality of Sprint Monitor.
    /// It analyzes historical sprint data and provides a risk assessment
    /// with actionable recommendations.
    /// </remarks>
    [HttpPost("evaluate")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RiskAssessmentDto>> EvaluateRisk([FromBody] RiskAssessmentRequestDto request)
    {
        if (request.PlannedCommitment <= 0)
            return BadRequest(new { message = "Planned commitment must be greater than 0" });

        if (request.TeamAvailability < 0 || request.TeamAvailability > 100)
            return BadRequest(new { message = "Team availability must be between 0 and 100" });

        try
        {
            var assessment = await _riskAssessmentService.EvaluateRiskAsync(request);
            return Ok(assessment);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get risk assessment history for a team
    /// </summary>
    [HttpGet("history/{teamId}")]
    [ProducesResponseType(typeof(IEnumerable<RiskAssessmentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RiskAssessmentDto>>> GetAssessmentHistory(int teamId)
    {
        var assessments = await _riskAssessmentService.GetAssessmentHistoryAsync(teamId);
        return Ok(assessments);
    }

    /// <summary>
    /// Get a specific assessment by ID
    /// </summary>
    [HttpGet("{assessmentId}")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskAssessmentDto>> GetAssessment(int assessmentId)
    {
        var assessment = await _riskAssessmentService.GetAssessmentByIdAsync(assessmentId);
        if (assessment == null)
            return NotFound(new { message = $"Assessment with ID {assessmentId} not found" });

        return Ok(assessment);
    }

}
