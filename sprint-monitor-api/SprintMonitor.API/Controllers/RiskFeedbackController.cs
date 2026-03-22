using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;

namespace SprintMonitor.API.Controllers;

/// <summary>
/// API endpoints for Human Relevance Feedback
/// Enables prediction accuracy tracking and system calibration
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public class RiskFeedbackController : ControllerBase
{
    private readonly IRiskFeedbackService _feedbackService;

    public RiskFeedbackController(IRiskFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    /// <summary>
    /// Submit feedback for a risk assessment
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RiskFeedbackDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RiskFeedbackDto>> SubmitFeedback([FromBody] CreateRiskFeedbackDto dto)
    {
        if (string.IsNullOrEmpty(dto.PredictedRisk) || string.IsNullOrEmpty(dto.ActualOutcome))
            return BadRequest(new { message = "PredictedRisk and ActualOutcome are required" });

        try
        {
            var feedback = await _feedbackService.SubmitFeedbackAsync(dto);
            return CreatedAtAction(nameof(GetFeedbackById), new { feedbackId = feedback.FeedbackId }, feedback);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get feedback by ID
    /// </summary>
    [HttpGet("{feedbackId}")]
    [ProducesResponseType(typeof(RiskFeedbackDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskFeedbackDto>> GetFeedbackById(int feedbackId)
    {
        var feedback = await _feedbackService.GetFeedbackByIdAsync(feedbackId);
        if (feedback == null)
            return NotFound(new { message = $"Feedback with ID {feedbackId} not found" });

        return Ok(feedback);
    }

    /// <summary>
    /// Get all feedbacks for a team
    /// </summary>
    [HttpGet("team/{teamId}")]
    [ProducesResponseType(typeof(IEnumerable<RiskFeedbackDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<RiskFeedbackDto>>> GetFeedbacksForTeam(int teamId)
    {
        var feedbacks = await _feedbackService.GetFeedbacksForTeamAsync(teamId);
        return Ok(feedbacks);
    }

    /// <summary>
    /// Get feedback for a specific assessment
    /// </summary>
    [HttpGet("assessment/{assessmentId}")]
    [ProducesResponseType(typeof(RiskFeedbackDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RiskFeedbackDto>> GetFeedbackForAssessment(int assessmentId)
    {
        var feedback = await _feedbackService.GetFeedbackForAssessmentAsync(assessmentId);
        if (feedback == null)
            return NotFound(new { message = $"No feedback found for assessment {assessmentId}" });

        return Ok(feedback);
    }

    /// <summary>
    /// Calculate prediction accuracy for a team
    /// </summary>
    [HttpGet("team/{teamId}/accuracy")]
    [ProducesResponseType(typeof(PredictionAccuracyDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PredictionAccuracyDto>> GetPredictionAccuracy(int teamId)
    {
        var accuracy = await _feedbackService.CalculatePredictionAccuracyAsync(teamId);
        return Ok(accuracy);
    }

    /// <summary>
    /// Get comparison of last 3 sprint assessments
    /// </summary>
    [HttpGet("team/{teamId}/comparison")]
    [ProducesResponseType(typeof(SprintComparisonAnalysisDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SprintComparisonAnalysisDto>> GetSprintComparison(int teamId)
    {
        var comparison = await _feedbackService.GetLastThreeSprintComparisonAsync(teamId);
        return Ok(comparison);
    }

    /// <summary>
    /// Get calibration status for a team
    /// </summary>
    [HttpGet("team/{teamId}/calibration")]
    [ProducesResponseType(typeof(CalibrationStatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CalibrationStatusDto>> GetCalibrationStatus(int teamId)
    {
        var status = await _feedbackService.GetCalibrationStatusAsync(teamId);
        return Ok(status);
    }

    /// <summary>
    /// Mark feedback as used for calibration
    /// </summary>
    [HttpPatch("{feedbackId}/mark-calibrated")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsUsedForCalibration(int feedbackId)
    {
        var success = await _feedbackService.MarkFeedbackAsUsedForCalibrationAsync(feedbackId);
        if (!success)
            return NotFound(new { message = $"Feedback with ID {feedbackId} not found" });

        return Ok(new { message = "Feedback marked as used for calibration" });
    }
}
