import { createReducer, on } from '@ngrx/store';
import {
  completeRiskEvaluation,
  resetPlanningEvaluationState,
  setCurrentAssessment,
  setCurrentMetrics,
  setPlanningInput,
  startRiskEvaluation,
  updateAssessmentRecommendations
} from './planning-evaluation.actions';
import {
  initialPlanningEvaluationState,
  PlanningEvaluationStoreState
} from './planning-evaluation.state';

export const planningEvaluationFeatureKey = 'planningEvaluation';

export const planningEvaluationReducer = createReducer<PlanningEvaluationStoreState>(
  initialPlanningEvaluationState,
  on(setPlanningInput, (state, { input }) => ({
    ...state,
    planningInput: input
  })),
  on(startRiskEvaluation, (state, { input }) => ({
    ...state,
    planningInput: input,
    loading: true
  })),
  on(completeRiskEvaluation, (state, { input, assessment, metrics }) => ({
    ...state,
    planningInput: input,
    assessment,
    metrics,
    loading: false
  })),
  on(setCurrentAssessment, (state, { assessment }) => ({
    ...state,
    assessment
  })),
  on(setCurrentMetrics, (state, { metrics }) => ({
    ...state,
    metrics
  })),
  on(updateAssessmentRecommendations, (state, { recommendations }) => ({
    ...state,
    assessment: state.assessment
      ? { ...state.assessment, recommendations }
      : state.assessment
  })),
  on(resetPlanningEvaluationState, () => initialPlanningEvaluationState)
);
