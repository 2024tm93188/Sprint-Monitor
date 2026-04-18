import { SprintPlanningInput, SprintMetrics } from '../models/sprint.model';
import { RiskAssessment } from '../models/risk.model';

export interface PlanningEvaluationStoreState {
  assessment: RiskAssessment | null;
  metrics: SprintMetrics | null;
  planningInput: SprintPlanningInput | null;
  loading: boolean;
}

export const initialPlanningEvaluationState: PlanningEvaluationStoreState = {
  assessment: null,
  metrics: null,
  planningInput: null,
  loading: false
};
