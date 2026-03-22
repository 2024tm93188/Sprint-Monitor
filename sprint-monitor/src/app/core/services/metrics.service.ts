import { Injectable } from '@angular/core';
import { Sprint, SprintMetrics } from '../models/sprint.model';
import { RISK_THRESHOLDS } from '../models/risk.model';
import {
  calculateMean,
  calculateStandardDeviation,
  calculateCoefficientOfVariation,
  calculateRate,
  roundTo
} from '../utils/statistics.util';

/**
 * Metrics Service
 * Calculates sprint metrics from historical data.
 * All calculations are deterministic and explainable.
 */
@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  /**
   * Calculate all sprint metrics from historical data
   *
   * @param sprints - Array of historical sprints
   * @param plannedPoints - Story points planned for upcoming sprint
   * @returns Computed metrics for risk evaluation
   */
  calculateMetrics(sprints: Sprint[], plannedPoints: number): SprintMetrics {
    // Extract completed points for velocity calculation
    // Using completed points (not committed) for realistic velocity
    const velocities = sprints.map(s => s.completedPoints);

    // Calculate average velocity
    const averageVelocity = roundTo(calculateMean(velocities));

    // Calculate velocity standard deviation
    const velocityStandardDeviation = roundTo(calculateStandardDeviation(velocities));

    // Calculate coefficient of variation (relative stability measure)
    const velocityCoefficient = roundTo(calculateCoefficientOfVariation(velocities), 3);

    // Calculate spillover rate
    const spilloverCount = sprints.filter(s => s.hadSpillover).length;
    const spilloverRate = roundTo(calculateRate(spilloverCount, sprints.length));

    // Calculate effective capacity using 80% buffer rule
    const effectiveCapacity = roundTo(averageVelocity * RISK_THRESHOLDS.CAPACITY_BUFFER);

    // Calculate Commitment-to-Velocity Ratio (CVR)
    const cvr = averageVelocity > 0
      ? roundTo(plannedPoints / averageVelocity, 3)
      : 0;

    return {
      averageVelocity,
      velocityStandardDeviation,
      velocityCoefficient,
      spilloverRate,
      effectiveCapacity,
      cvr,
      sprintCount: sprints.length
    };
  }

  /**
   * Calculate velocity trend (improving, stable, declining)
   *
   * @param sprints - Historical sprints (should be in chronological order)
   * @returns Trend indicator
   */
  calculateVelocityTrend(sprints: Sprint[]): 'improving' | 'stable' | 'declining' {
    if (sprints.length < 3) return 'stable';

    // Compare recent sprints to older sprints
    const midpoint = Math.floor(sprints.length / 2);
    const olderSprints = sprints.slice(0, midpoint);
    const recentSprints = sprints.slice(midpoint);

    const olderAvg = calculateMean(olderSprints.map(s => s.completedPoints));
    const recentAvg = calculateMean(recentSprints.map(s => s.completedPoints));

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent > 10) return 'improving';
    if (changePercent < -10) return 'declining';
    return 'stable';
  }

  /**
   * Get velocity data for charting
   *
   * @param sprints - Historical sprints
   * @returns Data formatted for chart display
   */
  getVelocityChartData(sprints: Sprint[]): {
    labels: string[];
    committed: number[];
    completed: number[];
  } {
    return {
      labels: sprints.map(s => s.name),
      committed: sprints.map(s => s.committedPoints),
      completed: sprints.map(s => s.completedPoints)
    };
  }

  /**
   * Calculate the recommended commitment based on historical data
   *
   * @param sprints - Historical sprints
   * @param availabilityPercent - Team availability for upcoming sprint
   * @returns Recommended story points to commit
   */
  calculateRecommendedCommitment(
    sprints: Sprint[],
    availabilityPercent: number
  ): number {
    if (sprints.length === 0) return 0;

    const velocities = sprints.map(s => s.completedPoints);
    const avgVelocity = calculateMean(velocities);

    // Apply 80% capacity buffer
    const safeCapacity = avgVelocity * RISK_THRESHOLDS.CAPACITY_BUFFER;

    // Adjust for availability
    const adjustedCapacity = safeCapacity * (availabilityPercent / 100);

    return roundTo(adjustedCapacity, 0);
  }

  /**
   * Calculate points that need to be reduced for a target risk level
   *
   * @param currentCommitment - Currently planned story points
   * @param averageVelocity - Historical average velocity
   * @param targetCVR - Target CVR (default 1.0 for safe commitment)
   * @returns Points to reduce
   */
  calculatePointsToReduce(
    currentCommitment: number,
    averageVelocity: number,
    targetCVR: number = 1.0
  ): number {
    const targetCommitment = averageVelocity * targetCVR;
    const reduction = currentCommitment - targetCommitment;
    return Math.max(0, roundTo(reduction, 0));
  }
}
