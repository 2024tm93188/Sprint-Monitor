import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  planningEvaluationFeatureKey
} from './planning-evaluation.reducer';
import { PlanningEvaluationStoreState } from './planning-evaluation.state';

export const selectPlanningEvaluationState =
  createFeatureSelector<PlanningEvaluationStoreState>(planningEvaluationFeatureKey);

export const selectCurrentAssessment = createSelector(
  selectPlanningEvaluationState,
  (state) => state?.assessment ?? null
);

export const selectCurrentMetrics = createSelector(
  selectPlanningEvaluationState,
  (state) => state?.metrics ?? null
);

export const selectCurrentPlanningInput = createSelector(
  selectPlanningEvaluationState,
  (state) => state?.planningInput ?? null
);

export const selectEvaluationLoading = createSelector(
  selectPlanningEvaluationState,
  (state) => state?.loading ?? false
);
