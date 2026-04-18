import { createReducer, on } from '@ngrx/store';
import {
  addHistoricalSprint,
  clearSprints,
  loadSprints,
  loadSprintsFailure,
  loadSprintsSuccess,
  setHistoricalSprints
} from './sprint.actions';
import { initialSprintState, SprintStoreState } from './sprint.state';

export const sprintFeatureKey = 'sprint';

export const sprintReducer = createReducer<SprintStoreState>(
  initialSprintState,
  on(loadSprints, (state) => ({
    ...state,
    loading: true
  })),
  on(loadSprintsSuccess, (state, { sprints }) => ({
    ...state,
    historicalSprints: sprints,
    loading: false
  })),
  on(loadSprintsFailure, (state) => ({
    ...state,
    loading: false,
    historicalSprints: []
  })),
  on(setHistoricalSprints, (state, { sprints }) => ({
    ...state,
    historicalSprints: sprints
  })),
  on(addHistoricalSprint, (state, { sprint }) => ({
    ...state,
    historicalSprints: [...state.historicalSprints, sprint]
  })),
  on(clearSprints, () => initialSprintState)
);
