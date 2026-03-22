using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SprintMonitor.API.Data;
using SprintMonitor.API.DTOs;
using SprintMonitor.API.Services;

namespace SprintMonitor.API.Controllers;

/// <summary>
/// API endpoints for sprint metrics
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[Produces("application/json")]
public class MetricsController : ControllerBase
{
    private readonly SprintMonitorDbContext _context;
    private readonly IMetricsService _metricsService;

    public MetricsController(SprintMonitorDbContext context, IMetricsService metricsService)
    {
        _context = context;
        _metricsService = metricsService;
    }

    /// <summary>
    /// Get computed metrics for a team
    /// </summary>
    [HttpGet("team/{teamId}")]
    [ProducesResponseType(typeof(SprintMetricsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SprintMetricsDto>> GetTeamMetrics(int teamId, [FromQuery] int plannedPoints = 0)
    {
        var sprints = await _context.Sprints
            .Where(s => s.TeamId == teamId)
            .OrderBy(s => s.EndDate ?? s.CreatedAt)
            .ToListAsync();

        var metrics = _metricsService.CalculateMetrics(sprints, plannedPoints);
        return Ok(metrics);
    }

    /// <summary>
    /// Get velocity chart data for a team
    /// </summary>
    [HttpGet("team/{teamId}/velocity-chart")]
    [ProducesResponseType(typeof(VelocityChartDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<VelocityChartDto>> GetVelocityChartData(int teamId, [FromQuery] int lastN = 10)
    {
        var sprints = await _context.Sprints
            .Where(s => s.TeamId == teamId)
            .OrderByDescending(s => s.EndDate ?? s.CreatedAt)
            .Take(lastN)
            .OrderBy(s => s.EndDate ?? s.CreatedAt)
            .ToListAsync();

        var chartData = new VelocityChartDto
        {
            Labels = sprints.Select(s => s.SprintName).ToList(),
            Committed = sprints.Select(s => s.CommittedPoints).ToList(),
            Completed = sprints.Select(s => s.CompletedPoints).ToList(),
            Added = sprints.Select(s => s.AddedPoints).ToList(),
            Removed = sprints.Select(s => s.RemovedPoints).ToList()
        };

        return Ok(chartData);
    }

    /// <summary>
    /// Get spillover analysis for a team
    /// </summary>
    [HttpGet("team/{teamId}/spillover-analysis")]
    [ProducesResponseType(typeof(SpilloverAnalysisDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SpilloverAnalysisDto>> GetSpilloverAnalysis(int teamId)
    {
        var sprints = await _context.Sprints
            .Where(s => s.TeamId == teamId)
            .OrderBy(s => s.EndDate ?? s.CreatedAt)
            .ToListAsync();

        if (sprints.Count == 0)
        {
            return Ok(new SpilloverAnalysisDto());
        }

        var totalSprints = sprints.Count;
        var spilloverSprints = sprints.Count(s => s.HadSpillover);
        var totalCommitted = sprints.Sum(s => s.CommittedPoints);
        var totalCompleted = sprints.Sum(s => s.CompletedPoints);
        var totalAdded = sprints.Sum(s => s.AddedPoints);
        var totalRemoved = sprints.Sum(s => s.RemovedPoints);

        var analysis = new SpilloverAnalysisDto
        {
            TotalSprints = totalSprints,
            SprintsWithSpillover = spilloverSprints,
            SpilloverRate = (decimal)spilloverSprints / totalSprints * 100,
            TotalCommittedPoints = totalCommitted,
            TotalCompletedPoints = totalCompleted,
            TotalAddedPoints = totalAdded,
            TotalRemovedPoints = totalRemoved,
            CompletionRate = totalCommitted > 0 ? (decimal)totalCompleted / totalCommitted * 100 : 0,
            ScopeChangeRate = totalCommitted > 0 ? (decimal)(totalAdded + totalRemoved) / totalCommitted * 100 : 0,
            SprintDetails = sprints.Select(s => new SprintSpilloverDetail
            {
                SprintName = s.SprintName,
                Committed = s.CommittedPoints,
                Completed = s.CompletedPoints,
                Added = s.AddedPoints,
                Removed = s.RemovedPoints,
                SpilloverPoints = s.SpilloverPoints,
                HadSpillover = s.HadSpillover
            }).ToList()
        };

        return Ok(analysis);
    }
}

public class VelocityChartDto
{
    public List<string> Labels { get; set; } = new();
    public List<int> Committed { get; set; } = new();
    public List<int> Completed { get; set; } = new();
    public List<int> Added { get; set; } = new();
    public List<int> Removed { get; set; } = new();
}

public class SpilloverAnalysisDto
{
    public int TotalSprints { get; set; }
    public int SprintsWithSpillover { get; set; }
    public decimal SpilloverRate { get; set; }
    public int TotalCommittedPoints { get; set; }
    public int TotalCompletedPoints { get; set; }
    public int TotalAddedPoints { get; set; }
    public int TotalRemovedPoints { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal ScopeChangeRate { get; set; }
    public List<SprintSpilloverDetail> SprintDetails { get; set; } = new();
}

public class SprintSpilloverDetail
{
    public string SprintName { get; set; } = string.Empty;
    public int Committed { get; set; }
    public int Completed { get; set; }
    public int Added { get; set; }
    public int Removed { get; set; }
    public int SpilloverPoints { get; set; }
    public bool HadSpillover { get; set; }
}
