import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService, TeamDto } from './api.service';

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

  private teams$ = new BehaviorSubject<TeamDto[]>([]);
  private selectedTeam$ = new BehaviorSubject<TeamDto | null>(this.loadSelectedTeamFromStorage());
  private loading$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadTeams();
  }

  /** Load all teams from API */
  loadTeams(): void {
    this.loading$.next(true);
    this.apiService.getTeams().pipe(
      tap(teams => {
        this.teams$.next(teams);
        this.loading$.next(false);

        // Auto-select: if nothing selected, pick stored or first team
        const current = this.selectedTeam$.getValue();
        if (!current && teams.length > 0) {
          this.setSelectedTeam(teams[0]);
        } else if (current) {
          // Refresh from API data to get latest team info
          const fresh = teams.find(t => t.teamId === current.teamId);
          if (fresh) this.selectedTeam$.next(fresh);
        }
      })
    ).subscribe({
      error: () => this.loading$.next(false)
    });
  }

  /** Get all available teams as observable */
  getTeams(): Observable<TeamDto[]> {
    return this.teams$.asObservable();
  }

  /** Get all teams snapshot */
  getTeamsSnapshot(): TeamDto[] {
    return this.teams$.getValue();
  }

  /** Get currently selected team as observable */
  getSelectedTeam(): Observable<TeamDto | null> {
    return this.selectedTeam$.asObservable();
  }

  /** Get selected team ID (defaults to 1 if nothing selected) */
  getSelectedTeamId(): number {
    return this.selectedTeam$.getValue()?.teamId ?? 1;
  }

  /** Get selected team snapshot */
  getSelectedTeamSnapshot(): TeamDto | null {
    return this.selectedTeam$.getValue();
  }

  /** Set the currently active team */
  setSelectedTeam(team: TeamDto): void {
    this.selectedTeam$.next(team);
    localStorage.setItem(SELECTED_TEAM_KEY, JSON.stringify(team));
  }

  /** Whether teams are loading */
  isLoading(): Observable<boolean> {
    return this.loading$.asObservable();
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
