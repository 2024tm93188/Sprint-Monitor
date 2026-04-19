/**
 * Risk Feedback Models
 * Human relevance feedback for prediction accuracy and calibration.
 * Field names are aligned with the backend C# DTOs.
 */

export interface RiskFeedback {
  feedbackId: number;
  /** Maps to backend AssessmentId */
  assessmentId: number;
  sprintId?: number;
  sprintName?: string;

  userId?: string;
  userName?: string;
  userRole?: string;

  predictedRisk?: string;
  actualOutcome?: string;
  userAgreement?: boolean;
  agreementLevel: AgreementLevel;

  /** Maps to backend RecommendationsHelpful */
  recommendationsHelpful: boolean;
  recommendationRating: number;

  feedbackComments?: string;
  improvementSuggestions?: string;

  actualPointsCompleted?: number;
  actualSpillover?: boolean;
  actualSpilloverPoints?: number;

  createdAt: Date;
  usedForCalibration: boolean;
}

export type AgreementLevel = 'Accurate' | 'PartiallyAccurate' | 'Incorrect';

export interface CreateRiskFeedback {
  /** Maps to backend AssessmentId */
  assessmentId: number;
  sprintId?: number;

  userId?: string;
  userName?: string;
  userRole?: string;

  predictedRisk?: string;
  actualOutcome?: string;
  agreementLevel: AgreementLevel;

  /** Maps to backend RecommendationsHelpful */
  recommendationsHelpful: boolean;
  recommendationRating: number;

  feedbackComments?: string;
  improvementSuggestions?: string;

  actualPointsCompleted?: number;
  actualSpillover?: boolean;
  actualSpilloverPoints?: number;
}

export interface PredictionAccuracy {
  teamId: number;
  teamName?: string;

  totalFeedbacks: number;
  /** Maps to backend AccuratePredictions */
  accuratePredictions: number;
  /** Maps to backend PartiallyAccurate */
  partiallyAccurate: number;
  /** Maps to backend IncorrectPredictions */
  incorrectPredictions: number;

  accuracyPercentage: number;
  partialAccuracyPercentage: number;
  averageRecommendationRating: number;

  accuracyTrend?: 'IMPROVING' | 'DECLINING' | 'STABLE';
  trendPercentage?: number;

  calculatedAt?: Date;
}

export interface RiskItem {
  risk: string;
  predicted: boolean;
  occurred: boolean;
}

export interface RecommendationOutcome {
  text: string;
  followed: boolean;
  effective: boolean | null;
}

/** Matches backend SprintComparisonDto exactly */
export interface SprintComparison {
  assessmentId: number;
  sprintId: number;
  sprintName: string;
  startDate?: Date;
  endDate?: Date;

  // Prediction Data
  predictedRisk: string;
  predictedScore: number;
  confidenceLevel: number;

  // Actual Outcome
  actualOutcome: string;
  committedPoints: number;
  completedPoints: number;
  hadSpillover: boolean;
  spilloverPoints: number;

  // Recommendations
  recommendations: string[];

  // Accuracy
  wasAccurate: boolean;
  accuracyLevel: 'Accurate' | 'PartiallyAccurate' | 'Incorrect' | 'Pending' | 'Unknown';

  // Feedback
  hasFeedback: boolean;
  feedback?: RiskFeedback;

  // Computed UI helpers
  accuracyScore?: number;
  predictedVelocity?: number;
  actualVelocity?: number;
}

/** Matches backend SprintComparisonAnalysisDto exactly */
export interface SprintComparisonAnalysis {
  teamId: number;
  teamName: string;

  sprints: SprintComparison[];

  // Aggregated metrics
  overallAccuracy: number;
  improvementTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  recurringRiskFactors: string[];
  keyInsights: string[];

  generatedAt?: Date;
}

/** Matches backend CalibrationStatusDto exactly */
export interface CalibrationStatus {
  teamId: number;
  totalFeedbacks: number;
  feedbacksUsedForCalibration: number;
  pendingFeedbacks: number;
  currentAccuracy: number;
  targetAccuracy: number;
  calibrationNeeded: boolean;
  calibrationRecommendation: string;
  lastCalibrated: Date;
  accuracyTrend: string;
  trendPercentage: number;
}
