using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;

namespace SprintMonitor.API.Controllers;

/// <summary>
/// API endpoints for Feasibility Study Management
/// Supports industry mentor validation workflow
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public class FeasibilityController : ControllerBase
{
    private readonly IFeasibilityService _feasibilityService;

    public FeasibilityController(IFeasibilityService feasibilityService)
    {
        _feasibilityService = feasibilityService;
    }

    /// <summary>
    /// Get all feasibility studies
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<FeasibilityDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<FeasibilityDto>>> GetAllFeasibilityStudies()
    {
        var studies = await _feasibilityService.GetAllFeasibilityStudiesAsync();
        return Ok(studies);
    }

    /// <summary>
    /// Get feasibility study by ID
    /// </summary>
    [HttpGet("{feasibilityId}")]
    [ProducesResponseType(typeof(FeasibilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FeasibilityDto>> GetFeasibilityById(int feasibilityId)
    {
        var study = await _feasibilityService.GetFeasibilityByIdAsync(feasibilityId);
        if (study == null)
            return NotFound(new { message = $"Feasibility study with ID {feasibilityId} not found" });

        return Ok(study);
    }

    /// <summary>
    /// Get latest feasibility study for a team
    /// </summary>
    [HttpGet("team/{teamId}/latest")]
    [ProducesResponseType(typeof(FeasibilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FeasibilityDto>> GetLatestForTeam(int teamId)
    {
        var study = await _feasibilityService.GetLatestFeasibilityForTeamAsync(teamId);
        if (study == null)
            return NotFound(new { message = $"No feasibility study found for team {teamId}" });

        return Ok(study);
    }

    /// <summary>
    /// Get feasibility summary statistics
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(FeasibilitySummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<FeasibilitySummaryDto>> GetFeasibilitySummary()
    {
        var summary = await _feasibilityService.GetFeasibilitySummaryAsync();
        return Ok(summary);
    }

    /// <summary>
    /// Create a new feasibility study
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(FeasibilityDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FeasibilityDto>> CreateFeasibilityStudy([FromBody] CreateFeasibilityDto dto)
    {
        try
        {
            var study = await _feasibilityService.CreateFeasibilityStudyAsync(dto);
            return CreatedAtAction(nameof(GetFeasibilityById), new { feasibilityId = study.FeasibilityId }, study);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing feasibility study
    /// </summary>
    [HttpPut("{feasibilityId}")]
    [ProducesResponseType(typeof(FeasibilityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FeasibilityDto>> UpdateFeasibilityStudy(int feasibilityId, [FromBody] UpdateFeasibilityDto dto)
    {
        var study = await _feasibilityService.UpdateFeasibilityStudyAsync(feasibilityId, dto);
        if (study == null)
            return NotFound(new { message = $"Feasibility study with ID {feasibilityId} not found" });

        return Ok(study);
    }

    /// <summary>
    /// Update feasibility study status (approval workflow)
    /// </summary>
    [HttpPatch("{feasibilityId}/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFeasibilityStatus(int feasibilityId, [FromBody] UpdateStatusRequest request)
    {
        var success = await _feasibilityService.UpdateFeasibilityStatusAsync(
            feasibilityId, request.Status, request.ApprovedBy);

        if (!success)
            return NotFound(new { message = $"Feasibility study with ID {feasibilityId} not found" });

        return Ok(new { message = "Status updated successfully" });
    }

    /// <summary>
    /// Delete a feasibility study
    /// </summary>
    [HttpDelete("{feasibilityId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFeasibilityStudy(int feasibilityId)
    {
        var success = await _feasibilityService.DeleteFeasibilityStudyAsync(feasibilityId);
        if (!success)
            return NotFound(new { message = $"Feasibility study with ID {feasibilityId} not found" });

        return NoContent();
    }
}

/// <summary>
/// Request model for status update
/// </summary>
public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
}
