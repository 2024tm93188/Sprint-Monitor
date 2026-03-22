using SprintMonitor.API.DTOs;
using SprintMonitor.API.Models;

namespace SprintMonitor.API.Services;

/// <summary>
/// Service for calculating sprint metrics.
/// All calculations are deterministic and explainable.
/// </summary>
public class MetricsService : IMetricsService
{
    private const decimal CAPACITY_BUFFER = 0.8m;

    /// <summary>
    /// Calculate all sprint metrics from historical data
    /// </summary>
    public SprintMetricsDto CalculateMetrics(IEnumerable<Sprint> sprints, int plannedPoints)
    {
        var sprintList = sprints.ToList();
        
        if (sprintList.Count == 0)
        {
            return new SprintMetricsDto
            {
                AverageVelocity = 0,
                VelocityStandardDeviation = 0,
                VelocityCoefficient = 0,
                SpilloverRate = 0,
                EffectiveCapacity = 0,
                CVR = 0,
                SprintCount = 0,
                VelocityTrend = "stable",
                RecommendedCommitment = 0
            };
        }

        // Extract completed points for velocity calculation
        var velocities = sprintList.Select(s => (decimal)s.CompletedPoints).ToList();

        // Calculate average velocity
        var averageVelocity = CalculateMean(velocities);

        // Calculate velocity standard deviation
        var velocityStandardDeviation = CalculateStandardDeviation(velocities);

        // Calculate coefficient of variation (relative stability measure)
        var velocityCoefficient = averageVelocity > 0 
            ? velocityStandardDeviation / averageVelocity 
            : 0;

        // Calculate spillover rate
        var spilloverCount = sprintList.Count(s => s.HadSpillover);
        var spilloverRate = CalculateRate(spilloverCount, sprintList.Count);

        // Calculate effective capacity using 80% buffer rule
        var effectiveCapacity = averageVelocity * CAPACITY_BUFFER;

        // Calculate Commitment-to-Velocity Ratio (CVR)
        var cvr = averageVelocity > 0 
            ? plannedPoints / averageVelocity 
            : 0;

        return new SprintMetricsDto
        {
            AverageVelocity = Math.Round(averageVelocity, 2),
            VelocityStandardDeviation = Math.Round(velocityStandardDeviation, 2),
            VelocityCoefficient = Math.Round(velocityCoefficient, 3),
            SpilloverRate = Math.Round(spilloverRate, 1),
            EffectiveCapacity = Math.Round(effectiveCapacity, 2),
            CVR = Math.Round(cvr, 3),
            SprintCount = sprintList.Count,
            VelocityTrend = CalculateVelocityTrend(sprintList),
            RecommendedCommitment = CalculateRecommendedCommitment(sprintList, 100)
        };
    }

    /// <summary>
    /// Calculate velocity trend (improving, stable, declining)
    /// </summary>
    public string CalculateVelocityTrend(IEnumerable<Sprint> sprints)
    {
        var sprintList = sprints.ToList();
        
        if (sprintList.Count < 3) return "stable";

        // Compare recent sprints to older sprints
        var midpoint = sprintList.Count / 2;
        var olderSprints = sprintList.Take(midpoint).ToList();
        var recentSprints = sprintList.Skip(midpoint).ToList();

        var olderAvg = CalculateMean(olderSprints.Select(s => (decimal)s.CompletedPoints));
        var recentAvg = CalculateMean(recentSprints.Select(s => (decimal)s.CompletedPoints));

        if (olderAvg == 0) return "stable";

        var changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (changePercent > 10) return "improving";
        if (changePercent < -10) return "declining";
        return "stable";
    }

    /// <summary>
    /// Calculate the recommended commitment based on historical data
    /// </summary>
    public int CalculateRecommendedCommitment(IEnumerable<Sprint> sprints, int availabilityPercent)
    {
        var sprintList = sprints.ToList();
        
        if (sprintList.Count == 0) return 0;

        var velocities = sprintList.Select(s => (decimal)s.CompletedPoints);
        var avgVelocity = CalculateMean(velocities);

        // Apply 80% capacity buffer
        var safeCapacity = avgVelocity * CAPACITY_BUFFER;

        // Adjust for availability
        var adjustedCapacity = safeCapacity * (availabilityPercent / 100m);

        return (int)Math.Round(adjustedCapacity);
    }

    #region Statistical Helper Methods

    private static decimal CalculateMean(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        if (list.Count == 0) return 0;
        return list.Sum() / list.Count;
    }

    private static decimal CalculateVariance(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        if (list.Count < 2) return 0;
        
        var mean = CalculateMean(list);
        var squaredDiffs = list.Select(v => (v - mean) * (v - mean));
        return CalculateMean(squaredDiffs);
    }

    private static decimal CalculateStandardDeviation(IEnumerable<decimal> values)
    {
        return (decimal)Math.Sqrt((double)CalculateVariance(values));
    }

    private static decimal CalculateRate(int occurrences, int total)
    {
        if (total == 0) return 0;
        return ((decimal)occurrences / total) * 100;
    }

    #endregion
}
