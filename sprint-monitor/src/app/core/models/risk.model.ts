/**
 * Risk Model
 * Defines risk levels, scores, and recommendations.
 * This is the core output of the Sprint Monitor system.
 */

/**
 * Overall risk level classification
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

/**
 * Individual risk factor with score and explanation
 */
export interface RiskFactor {
  /** Name of the risk factor */
  name: string;

  /** Risk score contribution (0-3) */
  score: number;

  /** Human-readable explanation */
  description: string;

  /** The metric value that triggered this score */
  metricValue: number;

  /** Threshold that was exceeded (if any) */
  threshold?: number;
}

/**
 * Complete Risk Assessment Result
 * Final output from the risk evaluation engine.
 */
export interface RiskAssessment {
  /** Overall risk level */
  overallRisk: RiskLevel;

  /** Total aggregated risk score */
  totalScore: number;

  /** Maximum possible score for context */
  maxPossibleScore: number;

  /** Individual risk factor breakdowns */
  factors: RiskFactor[];

  /** Actionable recommendations based on findings */
  recommendations: Recommendation[];

  /** Timestamp of assessment */
  assessedAt: Date;

  /** Confidence level of assessment (based on data quality) */
  confidence: AssessmentConfidence;
}

/**
 * Recommendation for improving sprint feasibility
 */
export interface Recommendation {
  /** Unique identifier */
  id: string;

  /** Short title */
  title: string;

  /** Detailed recommendation text */
  description: string;

  /** Priority of this recommendation */
  priority: RecommendationPriority;

  /** Which risk factor this addresses */
  addressesRiskFactor: string;

  /** Suggested action type */
  actionType: ActionType;

  /** Quantified impact if available (e.g., "Reduce by 5 points") */
  suggestedChange?: string;
}

export enum RecommendationPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum ActionType {
  REDUCE_SCOPE = 'REDUCE_SCOPE',
  SPLIT_STORIES = 'SPLIT_STORIES',
  ADD_BUFFER = 'ADD_BUFFER',
  RESOLVE_DEPENDENCIES = 'RESOLVE_DEPENDENCIES',
  INCREASE_CAPACITY = 'INCREASE_CAPACITY',
  IMPROVE_ESTIMATION = 'IMPROVE_ESTIMATION'
}

/**
 * Confidence level of the risk assessment
 * Based on amount and quality of historical data.
 */
export enum AssessmentConfidence {
  /** < 3 sprints of data */
  LOW = 'LOW',
  /** 3-5 sprints of data */
  MEDIUM = 'MEDIUM',
  /** > 5 sprints of data */
  HIGH = 'HIGH'
}

/**
 * Risk Thresholds Configuration
 * Defines the boundaries for risk classification.
 * These are the industry-standard values referenced in the requirements.
 */
export const RISK_THRESHOLDS = {
  // CVR (Commitment-to-Velocity Ratio) thresholds
  CVR: {
    LOW_MAX: 1.0,      // CVR ≤ 1.0 = Low risk
    MEDIUM_MAX: 1.1,   // CVR 1.0-1.1 = Medium risk
    // CVR > 1.1 = High risk
  },

  // Spillover rate thresholds (percentage)
  SPILLOVER: {
    LOW_MAX: 20,       // < 20% = Low risk
    MEDIUM_MAX: 40,    // 20-40% = Medium risk
    // > 40% = High risk
  },

  // Velocity coefficient of variation thresholds
  VELOCITY_CV: {
    LOW_MAX: 0.15,     // CV ≤ 15% = Stable velocity
    MEDIUM_MAX: 0.25,  // CV 15-25% = Moderate variance
    // CV > 25% = High variance (unreliable)
  },

  // Capacity buffer (80% rule)
  CAPACITY_BUFFER: 0.8,

  // Total risk score thresholds
  TOTAL_SCORE: {
    LOW_MAX: 3,        // ≤ 3 = Low risk
    MEDIUM_MAX: 6,     // 4-6 = Medium risk
    // ≥ 7 = High risk
  },

  // Minimum sprints for reliable assessment
  MIN_SPRINTS_FOR_HIGH_CONFIDENCE: 6,
  MIN_SPRINTS_FOR_MEDIUM_CONFIDENCE: 3,
} as const;
