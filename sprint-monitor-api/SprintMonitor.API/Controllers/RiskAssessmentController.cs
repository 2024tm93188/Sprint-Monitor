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
    /// Get only final assessments for a team
    /// </summary>
    [HttpGet("final/{teamId}")]
    [ProducesResponseType(typeof(IEnumerable<RiskAssessmentDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RiskAssessmentDto>>> GetFinalAssessments(int teamId)
    {
        var assessments = await _riskAssessmentService.GetFinalAssessmentsAsync(teamId);
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

    /// <summary>
    /// Mark a single assessment as the final committed assessment for its sprint
    /// </summary>
    [HttpPost("{assessmentId}/final")]
    [ProducesResponseType(typeof(RiskAssessmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskAssessmentDto>> MarkAssessmentAsFinal(int assessmentId)
    {
        var assessment = await _riskAssessmentService.MarkAssessmentAsFinalAsync(assessmentId);
        if (assessment == null)
        {
            return NotFound(new { message = $"Assessment with ID {assessmentId} not found" });
        }

        return Ok(assessment);
    }

    /// <summary>
    /// Mark a recommendation as applied and persist before/after impact details
    /// </summary>
    [HttpPost("recommendations/{recommendationId}/apply")]
    [ProducesResponseType(typeof(RecommendationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecommendationDto>> ApplyRecommendation(int recommendationId, [FromBody] ApplyRecommendationDto dto)
    {
        var recommendation = await _riskAssessmentService.ApplyRecommendationAsync(recommendationId, dto);
        if (recommendation == null)
        {
            return NotFound(new { message = $"Recommendation with ID {recommendationId} not found" });
        }

        return Ok(recommendation);
    }

    /// <summary>
    /// Mark a recommendation as applied by matching sprint/team/title/action when a numeric ID is unavailable
    /// </summary>
    [HttpPost("recommendations/apply-by-match")]
    [ProducesResponseType(typeof(RecommendationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RecommendationDto>> ApplyRecommendationByMatch([FromBody] ApplyRecommendationByMatchDto dto)
    {
        if (dto.TeamId <= 0 || string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest(new { message = "TeamId and Title are required" });
        }

        var recommendation = await _riskAssessmentService.ApplyRecommendationByMatchAsync(dto);
        if (recommendation == null)
        {
            return NotFound(new { message = "Matching recommendation was not found" });
        }

        return Ok(recommendation);
    }

}
