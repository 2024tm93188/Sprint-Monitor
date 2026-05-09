/**
 * Risk Feedback Models
 * Human relevance feedback for prediction accuracy and comparison.
 * Field names are aligned with the backend C# DTOs.
 */

export interface RiskFeedback {
  feedbackId: number;
  /** Maps to backend AssessmentId */
  assessmentId: number;
  teamId: number;
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

  createdAt: Date;
}

export type AgreementLevel = 'Accurate' | 'PartiallyAccurate' | 'Incorrect';

export interface CreateRiskFeedback {
  /** Maps to backend AssessmentId */
  assessmentId: number;
  teamId: number;
  sprintId?: number;

  userId?: string;
  userName?: string;
  userRole?: string;

  predictedRisk?: string;
  actualOutcome: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  completedPoints?: number;
  agreementLevel: AgreementLevel;

  /** Maps to backend RecommendationsHelpful */
  recommendationsHelpful: boolean;
  recommendationRating: number;

  feedbackComments?: string;
  improvementSuggestions?: string;
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

export interface AppliedRecommendationSummary {
  title: string;
  actionType?: string;
  beforeScore?: number;
  afterScore?: number;
  beforeRisk?: string;
  afterRisk?: string;
  impactScoreChange?: number;
  appliedAt?: Date;
  appliedBy?: string;
}

/** Matches backend SprintComparisonDto exactly */
export interface SprintComparison {
  assessmentId: number;
  sprintId: number;
  sprintNumber: number;
  sprintName: string;
  startDate?: Date;
  endDate?: Date;

  // Prediction Data
  predictedRisk: string;
  predictedScore: number;
  confidenceLevel: number;

  // ML Risk Fields
  mlRisk?: string | null;
  finalRisk?: string | null;
  mlConfidence?: number | null;
  teamDynamicsScore: number;
  teamCondition?: string | null;
  feasibilityStatus?: string | null;
  feasibilityReason?: string | null;

  iterationCount: number;
  finalIteration: number;
  isFinal: boolean;

  // Actual Outcome
  actualOutcome: string;
  committedPoints: number;
  completedPoints?: number;
  hadSpillover: boolean;
  spilloverPoints: number;

  // Recommendations
  recommendations: string[];
  appliedRecommendationTitle?: string;
  appliedRecommendationActionType?: string;
  appliedBeforeScore?: number;
  appliedAfterScore?: number;
  appliedBeforeRisk?: string;
  appliedAfterRisk?: string;
  appliedImpactScoreChange?: number;
  appliedRecommendations?: AppliedRecommendationSummary[];

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
