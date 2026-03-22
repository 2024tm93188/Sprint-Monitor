using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

public interface IMetricsService
{
    SprintMetricsDto CalculateMetrics(IEnumerable<Sprint> sprints, int plannedPoints);
    string CalculateVelocityTrend(IEnumerable<Sprint> sprints);
    int CalculateRecommendedCommitment(IEnumerable<Sprint> sprints, int availabilityPercent);
}
