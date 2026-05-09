import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Store } from '@ngrx/store';
import { Sprint, SprintPlanningInput } from '../models/sprint.model';
import { ApiService, SprintDto } from './api.service';
import { TeamService } from './team.service';
import {
  addHistoricalSprint,
  clearSprints,
  loadSprints,
  loadSprintsFailure,
  loadSprintsSuccess,
  setHistoricalSprints
} from '../store/sprint.actions';
import { selectHistoricalSprints, selectSprintsLoading } from '../store/sprint.selectors';
import { setPlanningInput } from '../store/planning-evaluation.actions';
import { selectCurrentPlanningInput } from '../store/planning-evaluation.selectors';

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
  private store = inject(Store);

  private historicalSprintsSnapshot: Sprint[] = [];

  constructor() {
    this.store.select(selectHistoricalSprints).subscribe(sprints => {
      this.historicalSprintsSnapshot = sprints;
    });

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
    this.store.dispatch(loadSprints());

    this.apiService.getTeamSprints(id).pipe(
      map(dtos => this.mapSprintDtosToSprints(dtos))
    ).subscribe({
      next: (sprints) => {
        this.store.dispatch(loadSprintsSuccess({ sprints }));
      },
      error: (err) => {
        console.error('Failed to load sprints from API:', err);
        this.store.dispatch(loadSprintsFailure());
      }
    });
  }

  /**
   * Map API DTOs to internal Sprint models
   */
  private mapSprintDtosToSprints(dtos: SprintDto[]): Sprint[] {
    return dtos.map(dto => ({
      id: `sprint-${dto.sprintId}`,
      sprintNumber: dto.sprintNumber,
      status: dto.status as 'Planned' | 'InProgress' | 'Completed',
      name: dto.sprintName,
      committedPoints: dto.committedPoints,
      completedPoints: dto.completedPoints,
      teamAvailability: dto.teamAvailability,
      teamSize: dto.teamSize,
      meetingHoursPerSprint: dto.meetingHoursPerSprint,
      newMembersCount: dto.newMembersCount,
      avgExperienceLevel: dto.avgExperienceLevel,
      collaborationScore: dto.collaborationScore,
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
    return this.store.select(selectHistoricalSprints);
  }

  /**
   * Get current historical sprints value
   */
  getHistoricalSprintsSnapshot(): Sprint[] {
    return this.historicalSprintsSnapshot;
  }

  /**
   * Get loading state
   */
  isLoading(): Observable<boolean> {
    return this.store.select(selectSprintsLoading);
  }

  /**
   * Get planning input as observable
   */
  getPlanningInput(): Observable<SprintPlanningInput | null> {
    return this.store.select(selectCurrentPlanningInput);
  }

  /**
   * Update planning input for risk evaluation
   */
  updatePlanningInput(input: SprintPlanningInput): void {
    this.store.dispatch(setPlanningInput({ input }));
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
    this.store.dispatch(addHistoricalSprint({ sprint }));
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
          meetingHoursPerSprint: 8,
          newMembersCount: 0,
          avgExperienceLevel: 6,
          collaborationScore: 7,
          hadSpillover: spillover?.trim().toLowerCase() === 'true',
          startDate: new Date(),
          endDate: new Date(),
          stories: []
        };
        sprints.push(sprint);
      }
    }

    this.store.dispatch(setHistoricalSprints({ sprints }));
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
    this.store.dispatch(clearSprints());
  }
}
