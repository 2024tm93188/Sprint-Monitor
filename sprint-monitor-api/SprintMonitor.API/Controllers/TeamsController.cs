using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;

namespace SprintMonitor.API.Controllers;

/// <summary>
/// API endpoints for managing teams
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;
    private readonly ITeamRiskConfigurationService _teamRiskConfigurationService;

    public TeamsController(ITeamService teamService, ITeamRiskConfigurationService teamRiskConfigurationService)
    {
        _teamService = teamService;
        _teamRiskConfigurationService = teamRiskConfigurationService;
    }

    /// <summary>
    /// Get all active teams
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TeamDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TeamDto>>> GetAllTeams()
    {
        var teams = await _teamService.GetAllTeamsAsync();
        return Ok(teams);
    }

    /// <summary>
    /// Get a specific team by ID
    /// </summary>
    [HttpGet("{teamId}")]
    [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TeamDto>> GetTeam(int teamId)
    {
        var team = await _teamService.GetTeamByIdAsync(teamId);
        if (team == null)
            return NotFound(new { message = $"Team with ID {teamId} not found" });

        return Ok(team);
    }

    /// <summary>
    /// Create a new team
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TeamDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TeamDto>> CreateTeam([FromBody] CreateTeamDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.TeamName))
            return BadRequest(new { message = "Team name is required" });
        if (dto.TeamSize <= 0)
            return BadRequest(new { message = "Team size must be greater than 0" });

        var team = await _teamService.CreateTeamAsync(dto);
        return CreatedAtAction(nameof(GetTeam), new { teamId = team.TeamId }, team);
    }

    /// <summary>
    /// Update an existing team
    /// </summary>
    [HttpPut("{teamId}")]
    [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TeamDto>> UpdateTeam(int teamId, [FromBody] UpdateTeamDto dto)
    {
        if (dto.TeamSize.HasValue && dto.TeamSize.Value <= 0)
            return BadRequest(new { message = "Team size must be greater than 0" });

        var team = await _teamService.UpdateTeamAsync(teamId, dto);
        if (team == null)
            return NotFound(new { message = $"Team with ID {teamId} not found" });

        return Ok(team);
    }

    /// <summary>
    /// Delete (deactivate) a team
    /// </summary>
    [HttpDelete("{teamId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTeam(int teamId)
    {
        var success = await _teamService.DeleteTeamAsync(teamId);
        if (!success)
            return NotFound(new { message = $"Team with ID {teamId} not found" });

        return NoContent();
    }

    [HttpGet("{teamId}/risk-config")]
    [ProducesResponseType(typeof(TeamRiskConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TeamRiskConfigurationDto>> GetRiskConfiguration(int teamId)
    {
        var team = await _teamService.GetTeamByIdAsync(teamId);
        if (team == null)
        {
            return NotFound(new { message = $"Team with ID {teamId} not found" });
        }

        var configuration = await _teamRiskConfigurationService.GetConfigurationAsync(teamId);
        return Ok(configuration);
    }

    [HttpPut("{teamId}/risk-config")]
    [ProducesResponseType(typeof(TeamRiskConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TeamRiskConfigurationDto>> SaveRiskConfiguration(int teamId, [FromBody] TeamRiskConfigurationDto dto)
    {
        var team = await _teamService.GetTeamByIdAsync(teamId);
        if (team == null)
        {
            return NotFound(new { message = $"Team with ID {teamId} not found" });
        }

        var saved = await _teamRiskConfigurationService.SaveConfigurationAsync(teamId, dto);
        return Ok(saved);
    }
}
