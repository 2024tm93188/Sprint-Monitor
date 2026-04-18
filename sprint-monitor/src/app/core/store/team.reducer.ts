import { createReducer, on } from '@ngrx/store';
import { loadTeams, loadTeamsFailure, loadTeamsSuccess, setSelectedTeam } from './team.actions';
import { initialTeamState, TeamStoreState } from './team.state';

export const teamFeatureKey = 'team';

export const teamReducer = createReducer<TeamStoreState>(
  initialTeamState,
  on(loadTeams, (state) => ({
    ...state,
    loading: true
  })),
  on(loadTeamsSuccess, (state, { teams }) => ({
    ...state,
    teams,
    loading: false
  })),
  on(loadTeamsFailure, (state) => ({
    ...state,
    loading: false
  })),
  on(setSelectedTeam, (state, { team }) => ({
    ...state,
    selectedTeam: team
  }))
);
