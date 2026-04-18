import { ActionReducerMap } from '@ngrx/store';
import {
  planningEvaluationFeatureKey,
  planningEvaluationReducer
} from './planning-evaluation.reducer';
import { PlanningEvaluationStoreState } from './planning-evaluation.state';
import { teamFeatureKey, teamReducer } from './team.reducer';
import { TeamStoreState } from './team.state';
import { sprintFeatureKey, sprintReducer } from './sprint.reducer';
import { SprintStoreState } from './sprint.state';

export interface AppState {
  [planningEvaluationFeatureKey]: PlanningEvaluationStoreState;
  [teamFeatureKey]: TeamStoreState;
  [sprintFeatureKey]: SprintStoreState;
}

export const appReducers: ActionReducerMap<AppState> = {
  [planningEvaluationFeatureKey]: planningEvaluationReducer,
  [teamFeatureKey]: teamReducer,
  [sprintFeatureKey]: sprintReducer
};
