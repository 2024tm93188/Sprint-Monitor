/**
 * Risk Rules Utility
 * Deterministic rules for risk scoring.
 * Each rule returns a score based on predefined thresholds.
 *
 * SCORING SYSTEM:
 * - Each factor contributes 0-3 points
 * - Total score determines overall risk:
 *   - ≤ 3: Low Risk
 *   - 4-6: Medium Risk
 *   - ≥ 7: High Risk
 */

import { RISK_THRESHOLDS, RiskLevel } from '../models/risk.model';

/**
 * Score CVR (Commitment-to-Velocity Ratio)
 *
 * CVR = committedPoints / averageVelocity
 *
 * Interpretation:
 * - CVR ≤ 1.0: Team is committing at or below their capacity (Low risk)
 * - CVR 1.0-1.1: Slight overcommitment, manageable (Medium risk)
 * - CVR > 1.1: Significant overcommitment (High risk)
 *
 * @param cvr - Commitment-to-Velocity Ratio
 * @returns Risk score (0, 1, 2, or 3)
 */
export function scoreCVR(cvr: number): number {
  if (cvr <= RISK_THRESHOLDS.CVR.LOW_MAX) {
    return 0; // Committing within velocity - safe
  } else if (cvr <= RISK_THRESHOLDS.CVR.MEDIUM_MAX) {
    return 1; // Slight overcommit - minor risk
  } else if (cvr <= 1.2) {
    return 2; // Moderate overcommit
  } else {
    return 3; // Severe overcommit - high risk
  }
}

/**
 * Score Velocity Variance (Stability)
 *
 * Uses Coefficient of Variation (CV) = stdDev / mean
 *
 * Interpretation:
 * - Low CV: Velocity is stable and predictable
 * - High CV: Velocity fluctuates, making planning unreliable
 *
 * @param cv - Coefficient of variation (decimal, e.g., 0.15 = 15%)
 * @returns Risk score (0, 1, 2, or 3)
 */
export function scoreVelocityVariance(cv: number): number {
  if (cv <= RISK_THRESHOLDS.VELOCITY_CV.LOW_MAX) {
    return 0; // Stable velocity - trustworthy estimates
  } else if (cv <= RISK_THRESHOLDS.VELOCITY_CV.MEDIUM_MAX) {
    return 1; // Moderate variance - some uncertainty
  } else if (cv <= 0.35) {
    return 2; // High variance - unreliable velocity
  } else {
    return 3; // Very high variance - velocity is not useful
  }
}

/**
 * Score Spillover Rate
 *
 * Spillover Rate = (sprints with spillover / total sprints) * 100
 *
 * Interpretation:
 * - Low spillover: Team consistently completes commitments
 * - High spillover: Pattern of overcommitment
 *
 * @param spilloverRate - Percentage of sprints with spillover (0-100)
 * @returns Risk score (0, 1, 2, or 3)
 */
export function scoreSpilloverRate(spilloverRate: number): number {
  if (spilloverRate < RISK_THRESHOLDS.SPILLOVER.LOW_MAX) {
    return 0; // Rarely spills over - good track record
  } else if (spilloverRate <= RISK_THRESHOLDS.SPILLOVER.MEDIUM_MAX) {
    return 1; // Occasional spillover - watch carefully
  } else if (spilloverRate <= 60) {
    return 2; // Frequent spillover - systemic issue
  } else {
    return 3; // Chronic spillover - serious planning problem
  }
}

/**
 * Score Capacity Utilization
 *
 * Uses the 80% rule: effective capacity = velocity * 0.8
 * This reserves 20% buffer for:
 * - Unplanned work
 * - Meetings & ceremonies
 * - Code reviews
 * - Bug fixes
 *
 * @param committedPoints - Story points committed
 * @param effectiveCapacity - Velocity * 0.8
 * @returns Risk score (0, 1, 2, or 3)
 */
export function scoreCapacityUtilization(
  committedPoints: number,
  effectiveCapacity: number
): number {
  if (effectiveCapacity === 0) return 3; // No capacity data

  const utilizationRatio = committedPoints / effectiveCapacity;

  if (utilizationRatio <= 1.0) {
    return 0; // Within safe capacity
  } else if (utilizationRatio <= 1.1) {
    return 1; // Slightly over effective capacity
  } else if (utilizationRatio <= 1.25) {
    return 2; // Significantly over effective capacity
  } else {
    return 3; // Way over - no buffer at all
  }
}

/**
 * Score Team Availability Impact
 *
 * Adjusts risk based on team availability for the sprint.
 * Lower availability increases risk.
 *
 * @param availabilityPercent - Team availability (0-100)
 * @returns Risk score (0, 1, or 2)
 */
export function scoreTeamAvailability(availabilityPercent: number): number {
  if (availabilityPercent >= 90) {
    return 0; // Full team - no adjustment
  } else if (availabilityPercent >= 75) {
    return 1; // Some absence - minor risk increase
  } else {
    return 2; // Significant absence - notable risk
  }
}

/**
 * Determine overall risk level from total score
 *
 * @param totalScore - Sum of all risk factor scores
 * @returns RiskLevel enum value
 */
export function determineRiskLevel(totalScore: number): RiskLevel {
  const normalizedScore = Math.floor(totalScore);

  if (normalizedScore <= RISK_THRESHOLDS.TOTAL_SCORE.LOW_MAX) {
    return RiskLevel.LOW;
  } else if (normalizedScore <= RISK_THRESHOLDS.TOTAL_SCORE.MEDIUM_MAX) {
    return RiskLevel.MEDIUM;
  } else {
    return RiskLevel.HIGH;
  }
}

/**
 * Get risk level color for UI display
 *
 * @param level - Risk level
 * @returns CSS color class name
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.LOW:
      return 'success'; // Green
    case RiskLevel.MEDIUM:
      return 'warning'; // Yellow/Orange
    case RiskLevel.HIGH:
      return 'danger'; // Red
  }
}

/**
 * Get risk level display label
 *
 * @param level - Risk level
 * @returns Human-readable label
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.LOW:
      return 'Low Risk - Sprint looks feasible';
    case RiskLevel.MEDIUM:
      return 'Medium Risk - Review commitments';
    case RiskLevel.HIGH:
      return 'High Risk - Reduce scope recommended';
  }
}
