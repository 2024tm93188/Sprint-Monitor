import { createAction, props } from '@ngrx/store';
import { TeamDto } from '../services/api.service';

export const loadTeams = createAction('[Team] Load Teams');

export const loadTeamsSuccess = createAction(
  '[Team] Load Teams Success',
  props<{ teams: TeamDto[] }>()
);

export const loadTeamsFailure = createAction('[Team] Load Teams Failure');

export const setSelectedTeam = createAction(
  '[Team] Set Selected Team',
  props<{ team: TeamDto | null }>()
);
