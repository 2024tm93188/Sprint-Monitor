import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TeamStoreState } from './team.state';
import { teamFeatureKey } from './team.reducer';

export const selectTeamState = createFeatureSelector<TeamStoreState>(teamFeatureKey);

export const selectTeams = createSelector(
  selectTeamState,
  (state) => state.teams
);

export const selectSelectedTeam = createSelector(
  selectTeamState,
  (state) => state.selectedTeam
);

export const selectSelectedTeamId = createSelector(
  selectSelectedTeam,
  (team) => team?.teamId ?? 1
);

export const selectTeamLoading = createSelector(
  selectTeamState,
  (state) => state.loading
);
