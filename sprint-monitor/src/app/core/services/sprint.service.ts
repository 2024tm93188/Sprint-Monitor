import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { Sprint, SprintPlanningInput } from '../models/sprint.model';
import { ApiService, SprintDto } from './api.service';
import { TeamService } from './team.service';

/**
 * Sprint Service
 * Manages sprint data storage and retrieval.
 * Uses TeamService for the current team ID (no hardcoding).
 */
@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);

  /** Observable stream of historical sprints */
  private historicalSprints$ = new BehaviorSubject<Sprint[]>([]);

  /** Observable stream of current planning input */
  private planningInput$ = new BehaviorSubject<SprintPlanningInput | null>(null);

  /** Loading state */
  private loading$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // When selected team changes, reload sprints
    this.teamService.getSelectedTeam().subscribe(team => {
      if (team) {
        this.loadSprintsFromApi(team.teamId);
      }
    });
  }

  /**
   * Load sprints from the API for a specific team
   */
  loadSprintsFromApi(teamId?: number): void {
    const id = teamId ?? this.getCurrentTeamId();
    this.loading$.next(true);

    this.apiService.getTeamSprints(id).pipe(
      map(dtos => this.mapSprintDtosToSprints(dtos)),
      tap(sprints => {
        this.historicalSprints$.next(sprints);
        this.loading$.next(false);
      })
    ).subscribe({
      error: (err) => {
        console.error('Failed to load sprints from API:', err);
        this.loading$.next(false);
        this.historicalSprints$.next([]);
      }
    });
  }

  /**
   * Map API DTOs to internal Sprint models
   */
  private mapSprintDtosToSprints(dtos: SprintDto[]): Sprint[] {
    return dtos.map(dto => ({
      id: `sprint-${dto.sprintId}`,
      name: dto.sprintName,
      committedPoints: dto.committedPoints,
      completedPoints: dto.completedPoints,
      teamAvailability: dto.teamAvailability,
      teamSize: dto.teamSize,
      hadSpillover: dto.hadSpillover,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate ? new Date(dto.endDate) : new Date(),
      stories: []
    }));
  }

  /**
   * Get historical sprints as observable
   */
  getHistoricalSprints(): Observable<Sprint[]> {
    return this.historicalSprints$.asObservable();
  }

  /**
   * Get current historical sprints value
   */
  getHistoricalSprintsSnapshot(): Sprint[] {
    return this.historicalSprints$.getValue();
  }

  /**
   * Get loading state
   */
  isLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * Get planning input as observable
   */
  getPlanningInput(): Observable<SprintPlanningInput | null> {
    return this.planningInput$.asObservable();
  }

  /**
   * Update planning input for risk evaluation
   */
  updatePlanningInput(input: SprintPlanningInput): void {
    this.planningInput$.next(input);
  }

  /**
   * Get current team ID from TeamService
   */
  getCurrentTeamId(): number {
    return this.teamService.getSelectedTeamId();
  }

  /**
   * Add a new historical sprint
   */
  addHistoricalSprint(sprint: Sprint): void {
    const current = this.historicalSprints$.getValue();
    this.historicalSprints$.next([...current, sprint]);
  }

  /**
   * Import sprints from CSV data
   * Expected format: Sprint,Committed,Completed,Spillover
   */
  importFromCSV(csvData: string): Sprint[] {
    const lines = csvData.trim().split('\n');
    const sprints: Sprint[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const [name, committed, completed, spillover] = lines[i].split(',');

      if (name && committed && completed) {
        const sprint: Sprint = {
          id: `imported-${i}`,
          name: name.trim(),
          committedPoints: parseInt(committed.trim(), 10),
          completedPoints: parseInt(completed.trim(), 10),
          teamAvailability: 100,
          teamSize: 5,
          hadSpillover: spillover?.trim().toLowerCase() === 'true',
          startDate: new Date(),
          endDate: new Date(),
          stories: []
        };
        sprints.push(sprint);
      }
    }

    this.historicalSprints$.next(sprints);
    return sprints;
  }

  /**
   * Refresh data from API
   */
  refresh(): void {
    this.loadSprintsFromApi();
  }

  /**
   * Clear all historical data
   */
  clearHistory(): void {
    this.historicalSprints$.next([]);
  }
}
