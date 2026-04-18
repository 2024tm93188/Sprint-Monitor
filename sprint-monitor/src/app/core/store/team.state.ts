import { TeamDto } from '../services/api.service';

export interface TeamStoreState {
  teams: TeamDto[];
  selectedTeam: TeamDto | null;
  loading: boolean;
}

export const initialTeamState: TeamStoreState = {
  teams: [],
  selectedTeam: null,
  loading: false
};
