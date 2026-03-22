/**
 * Risk Feedback Models
 * Human relevance feedback for prediction accuracy and calibration
 */

export interface RiskFeedback {
  feedbackId: number;
  riskAssessmentId: number;
  teamId: number;
  sprintId?: number;
  sprintName?: string;
  
  userId?: string;
  userName?: string;
  userRole?: string;
  providedBy?: string;
  
  predictedRisk?: string;
  actualOutcome?: string;
  userAgreement?: boolean;
  agreementLevel: AgreementLevel;
  
  recommendationHelpful: boolean;
  recommendationRating: number;
  
  userComments?: string;
  feedbackComments?: string;
  improvementSuggestions?: string;
  
  actualPointsCompleted?: number;
  actualSpillover?: boolean;
  actualSpilloverPoints?: number;
  
  feedbackDate: Date;
  usedForCalibration: boolean;
  createdAt?: Date;
}

export type AgreementLevel = 'Accurate' | 'PartiallyAccurate' | 'Incorrect';

export interface CreateRiskFeedback {
  riskAssessmentId: number;
  teamId: number;
  sprintId?: number;
  
  userId?: string;
  userName?: string;
  userRole?: string;
  providedBy?: string;
  
  predictedRisk?: string;
  actualOutcome?: string;
  agreementLevel: AgreementLevel;
  
  recommendationHelpful: boolean;
  recommendationRating: number;
  
  userComments?: string;
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
  accurateCount: number;
  partiallyAccurateCount: number;
  inaccurateCount: number;
  
  accuracyPercentage: number;
  partialAccuracyPercentage?: number;
  averageRecommendationRating: number;
  helpfulnessPercentage: number;
  
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

export interface SprintComparison {
  sprintId: number;
  sprintName: string;
  startDate?: Date;
  endDate?: Date;
  
  // Prediction Data
  predictedRiskLevel: string;
  actualRiskLevel: string;
  predictedVelocity: number;
  actualVelocity: number;
  
  // Risk Analysis
  topRisks: RiskItem[];
  
  // Recommendations
  recommendations: RecommendationOutcome[];
  
  // Accuracy
  accuracyScore: number;
  feedbackCount: number;
  
  // Legacy fields
  predictedRisk?: string;
  predictedScore?: number;
  confidenceLevel?: number;
  actualOutcome?: string;
  committedPoints?: number;
  completedPoints?: number;
  hadSpillover?: boolean;
  spilloverPoints?: number;
  wasAccurate?: boolean;
  accuracyLevel?: 'Accurate' | 'PartiallyAccurate' | 'Incorrect' | 'Pending';
  hasFeedback?: boolean;
  feedback?: RiskFeedback;
}

export interface SprintComparisonAnalysis {
  teamId: number;
  teamName: string;
  
  sprints: SprintComparison[];
  
  averageAccuracy: number;
  accuracyTrend: string;
  mostAccurateArea: string;
  needsImprovementArea: string;
  keyInsights: string[];
  
  // Legacy fields
  overallAccuracy?: number;
  improvementTrend?: 'IMPROVING' | 'DECLINING' | 'STABLE';
  recurringRiskFactors?: string[];
  
  generatedAt?: Date;
}

export interface CalibrationStatus {
  teamId: number;
  totalFeedbacks?: number;
  feedbacksUsedForCalibration: number;
  pendingFeedbacks: number;
  currentAccuracy?: number;
  targetAccuracy?: number;
  calibrationNeeded: boolean;
  calibrationRecommendation?: string;
  lastCalibrationDate: Date;
  accuracyTrend: string;
  trendPercentage: number;
}
