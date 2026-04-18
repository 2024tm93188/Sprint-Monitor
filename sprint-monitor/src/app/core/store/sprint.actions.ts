import { createAction, props } from '@ngrx/store';
import { Sprint } from '../models/sprint.model';

export const loadSprints = createAction('[Sprint] Load Sprints');

export const loadSprintsSuccess = createAction(
  '[Sprint] Load Sprints Success',
  props<{ sprints: Sprint[] }>()
);

export const loadSprintsFailure = createAction('[Sprint] Load Sprints Failure');

export const setHistoricalSprints = createAction(
  '[Sprint] Set Historical Sprints',
  props<{ sprints: Sprint[] }>()
);

export const addHistoricalSprint = createAction(
  '[Sprint] Add Historical Sprint',
  props<{ sprint: Sprint }>()
);

export const clearSprints = createAction('[Sprint] Clear Sprints');
