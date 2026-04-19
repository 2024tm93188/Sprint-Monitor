import { createAction, props } from '@ngrx/store';
import { SprintPlanningInput, SprintMetrics } from '../models/sprint.model';
import { RiskAssessment, Recommendation } from '../models/risk.model';

export const setPlanningInput = createAction(
  '[Planning Evaluation] Set Planning Input',
  props<{ input: SprintPlanningInput }>()
);

export const startRiskEvaluation = createAction(
  '[Planning Evaluation] Start Risk Evaluation',
  props<{ input: SprintPlanningInput }>()
);

export const completeRiskEvaluation = createAction(
  '[Planning Evaluation] Complete Risk Evaluation',
  props<{
    input: SprintPlanningInput;
    assessment: RiskAssessment;
    metrics: SprintMetrics;
  }>()
);

export const setCurrentAssessment = createAction(
  '[Planning Evaluation] Set Current Assessment',
  props<{ assessment: RiskAssessment }>()
);

export const setCurrentMetrics = createAction(
  '[Planning Evaluation] Set Current Metrics',
  props<{ metrics: SprintMetrics }>()
);

export const updateAssessmentRecommendations = createAction(
  '[Planning Evaluation] Update Assessment Recommendations',
  props<{ recommendations: Recommendation[] }>()
);

export const resetPlanningEvaluationState = createAction(
  '[Planning Evaluation] Reset State'
);
