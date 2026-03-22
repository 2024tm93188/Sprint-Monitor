using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;

namespace SprintMonitor.API.Controllers;

/// <summary>
/// API endpoints for managing sprints
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public class SprintsController : ControllerBase
{
    private readonly ISprintService _sprintService;
    private readonly ICsvImportService _csvImportService;

    public SprintsController(ISprintService sprintService, ICsvImportService csvImportService)
    {
        _sprintService = sprintService;
        _csvImportService = csvImportService;
    }

    /// <summary>
    /// Get all sprints for a team
    /// </summary>
    [HttpGet("team/{teamId}")]
    [ProducesResponseType(typeof(IEnumerable<SprintDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SprintDto>>> GetSprintsByTeam(int teamId)
    {
        var sprints = await _sprintService.GetSprintsByTeamAsync(teamId);
        return Ok(sprints);
    }

    /// <summary>
    /// Get recent sprints for a team (for metrics calculation)
    /// </summary>
    [HttpGet("team/{teamId}/recent")]
    [ProducesResponseType(typeof(IEnumerable<SprintDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SprintDto>>> GetRecentSprints(int teamId, [FromQuery] int count = 10)
    {
        var sprints = await _sprintService.GetRecentSprintsAsync(teamId, count);
        return Ok(sprints);
    }

    /// <summary>
    /// Get a specific sprint by ID
    /// </summary>
    [HttpGet("{sprintId}")]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SprintDto>> GetSprint(int sprintId)
    {
        var sprint = await _sprintService.GetSprintByIdAsync(sprintId);
        if (sprint == null)
            return NotFound(new { message = $"Sprint with ID {sprintId} not found" });

        return Ok(sprint);
    }

    /// <summary>
    /// Create a new sprint
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SprintDto>> CreateSprint([FromBody] CreateSprintDto dto)
    {
        if (dto.CommittedPoints < 0 || dto.CompletedPoints < 0)
            return BadRequest(new { message = "Points cannot be negative" });

        var sprint = await _sprintService.CreateSprintAsync(dto);
        return CreatedAtAction(nameof(GetSprint), new { sprintId = sprint.SprintId }, sprint);
    }

    /// <summary>
    /// Update an existing sprint
    /// </summary>
    [HttpPut("{sprintId}")]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SprintDto>> UpdateSprint(int sprintId, [FromBody] UpdateSprintDto dto)
    {
        var sprint = await _sprintService.UpdateSprintAsync(sprintId, dto);
        if (sprint == null)
            return NotFound(new { message = $"Sprint with ID {sprintId} not found" });

        return Ok(sprint);
    }

    /// <summary>
    /// Delete a sprint
    /// </summary>
    [HttpDelete("{sprintId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSprint(int sprintId)
    {
        var success = await _sprintService.DeleteSprintAsync(sprintId);
        if (!success)
            return NotFound(new { message = $"Sprint with ID {sprintId} not found" });

        return NoContent();
    }

    /// <summary>
    /// Import sprints from CSV file
    /// </summary>
    [HttpPost("import/{teamId}")]
    [ProducesResponseType(typeof(CsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CsvImportResultDto>> ImportFromCsv(int teamId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "File must be a CSV" });

        using var stream = file.OpenReadStream();
        var result = await _csvImportService.ImportSprintsFromCsvAsync(teamId, stream);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    /// <summary>
    /// Import sprints from CSV string (for testing/API usage)
    /// </summary>
    [HttpPost("import/{teamId}/string")]
    [ProducesResponseType(typeof(CsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CsvImportResultDto>> ImportFromCsvString(int teamId, [FromBody] CsvImportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CsvContent))
            return BadRequest(new { message = "CSV content is required" });

        var result = await _csvImportService.ImportSprintsFromCsvStringAsync(teamId, request.CsvContent);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
}

public class CsvImportRequest
{
    public string CsvContent { get; set; } = string.Empty;
}
