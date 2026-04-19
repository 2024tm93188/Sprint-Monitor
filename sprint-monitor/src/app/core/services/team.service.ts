import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { ApiService, TeamDto } from './api.service';
import { loadTeams, loadTeamsFailure, loadTeamsSuccess, setSelectedTeam } from '../store/team.actions';
import { selectSelectedTeam, selectTeamLoading, selectTeams } from '../store/team.selectors';

const SELECTED_TEAM_KEY = 'sprint_monitor_selected_team';

/**
 * Team Service
 * Manages team selection and exposes available teams loaded from the API.
 * Single source of truth for the currently selected team across all components.
 */
@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiService = inject(ApiService);
  private store = inject(Store);

  private teamsSnapshot: TeamDto[] = [];
  private selectedTeamSnapshot: TeamDto | null = null;

  constructor() {
    this.store.select(selectTeams).subscribe(teams => {
      this.teamsSnapshot = teams;
    });

    this.store.select(selectSelectedTeam).subscribe(team => {
      this.selectedTeamSnapshot = team;
    });

    this.loadTeams();
  }

  /** Load all teams from API */
  loadTeams(): void {
    this.store.dispatch(loadTeams());

    this.apiService.getTeams().subscribe({
      next: (teams) => {
        this.store.dispatch(loadTeamsSuccess({ teams }));

        const stored = this.loadSelectedTeamFromStorage();
        const current = this.selectedTeamSnapshot;

        if (!current && teams.length > 0) {
          if (stored) {
            const matched = teams.find(t => t.teamId === stored.teamId);
            this.setSelectedTeam(matched ?? teams[0]);
          } else {
            this.setSelectedTeam(teams[0]);
          }
          return;
        }

        if (current) {
          const fresh = teams.find(t => t.teamId === current.teamId);
          if (fresh) {
            this.store.dispatch(setSelectedTeam({ team: fresh }));
            localStorage.setItem(SELECTED_TEAM_KEY, JSON.stringify(fresh));
          }
        }
      },
      error: () => {
        this.store.dispatch(loadTeamsFailure());
      }
    });
  }

  /** Get all available teams as observable */
  getTeams(): Observable<TeamDto[]> {
    return this.store.select(selectTeams);
  }

  /** Get all teams snapshot */
  getTeamsSnapshot(): TeamDto[] {
    return this.teamsSnapshot;
  }

  /** Get currently selected team as observable */
  getSelectedTeam(): Observable<TeamDto | null> {
    return this.store.select(selectSelectedTeam);
  }

  /** Get selected team ID (defaults to 1 if nothing selected) */
  getSelectedTeamId(): number {
    if (this.selectedTeamSnapshot?.teamId) {
      return this.selectedTeamSnapshot.teamId;
    }

    if (this.teamsSnapshot.length > 0) {
      return this.teamsSnapshot[0].teamId;
    }

    return 0;
  }

  /** Get selected team snapshot */
  getSelectedTeamSnapshot(): TeamDto | null {
    return this.selectedTeamSnapshot;
  }

  /** Set the currently active team */
  setSelectedTeam(team: TeamDto): void {
    this.store.dispatch(setSelectedTeam({ team }));
    localStorage.setItem(SELECTED_TEAM_KEY, JSON.stringify(team));
  }

  /** Whether teams are loading */
  isLoading(): Observable<boolean> {
    return this.store.select(selectTeamLoading);
  }

  private loadSelectedTeamFromStorage(): TeamDto | null {
    const json = localStorage.getItem(SELECTED_TEAM_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json) as TeamDto;
    } catch {
      return null;
    }
  }
}
