import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SprintStoreState } from './sprint.state';
import { sprintFeatureKey } from './sprint.reducer';

export const selectSprintState = createFeatureSelector<SprintStoreState>(sprintFeatureKey);

export const selectHistoricalSprints = createSelector(
  selectSprintState,
  (state) => state.historicalSprints
);

export const selectSprintsLoading = createSelector(
  selectSprintState,
  (state) => state.loading
);
