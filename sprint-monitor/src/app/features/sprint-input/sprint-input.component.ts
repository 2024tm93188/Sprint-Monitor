import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SprintService } from '../../core/services/sprint.service';
import { MetricsService } from '../../core/services/metrics.service';
import { ApiService, SprintDto } from '../../core/services/api.service';
import { TeamService } from '../../core/services/team.service';
import { SprintPlanningInput, SprintMetrics } from '../../core/models/sprint.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Sprint Input Component
 * Form for entering sprint planning data.
 * Supports:
 *  - Manual input of planned points, availability, and dependencies
 *  - Optional sprint selection to link assessment to an existing sprint
 *  - CSV file import to upload historical sprint data in bulk
 */
@Component({
  selector: 'app-sprint-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSliderModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './sprint-input.component.html',
  styleUrls: ['./sprint-input.component.scss']
})
export class SprintInputComponent implements OnInit {
  /** Emits when user submits the planning form */
  @Output() evaluate = new EventEmitter<SprintPlanningInput>();

  private fb = inject(FormBuilder);
  private sprintService = inject(SprintService);
  private metricsService = inject(MetricsService);
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  planningForm!: FormGroup;
  historicalMetrics: SprintMetrics | null = null;
  recommendedCommitment: number = 0;

  // Sprint selector
  availableSprints: SprintDto[] = [];
  selectedSprintId: number | null = null;

  // CSV import state
  csvImporting = false;
  csvFileName: string | null = null;
  csvError: string | null = null;
  csvSuccess: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadHistoricalData();

    // Reload sprints dropdown when team changes
    this.teamService.getSelectedTeam().subscribe(team => {
      if (team) {
        this.loadAvailableSprints();
      }
    });
  }

  /**
   * Initialize the planning form with default values and validators
   */
  private initForm(): void {
    this.planningForm = this.fb.group({
      plannedPoints: [30, [Validators.required, Validators.min(0)]],
      teamAvailability: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      teamSize: [5, [Validators.required, Validators.min(1)]],
      externalDependencies: [0, [Validators.min(0)]],
      sprintId: [null]  // optional sprint link
    });
  }

  /**
   * Load historical sprint data and calculate metrics
   */
  private loadHistoricalData(): void {
    const sprints = this.sprintService.getHistoricalSprintsSnapshot();
    if (sprints.length > 0) {
      this.historicalMetrics = this.metricsService.calculateMetrics(
        sprints,
        this.planningForm.get('plannedPoints')?.value || 0
      );
      this.recommendedCommitment = this.metricsService.calculateRecommendedCommitment(
        sprints,
        this.planningForm.get('teamAvailability')?.value || 100
      );
    }
  }

  /**
   * Load available sprints for the current team (for sprint linking dropdown)
   */
  private loadAvailableSprints(): void {
    const teamId = this.teamService.getSelectedTeamId();
    this.apiService.getSprints(teamId).subscribe({
      next: (sprints) => {
        this.availableSprints = sprints;
      },
      error: () => {
        this.availableSprints = [];
      }
    });
  }

  /**
   * Handle form submission - emit planning input for risk evaluation
   */
  onSubmit(): void {
    if (this.planningForm.valid) {
      const sprints = this.sprintService.getHistoricalSprintsSnapshot();
      const sprintIdValue = this.planningForm.get('sprintId')?.value;
      const input: SprintPlanningInput = {
        historicalSprints: sprints,
        plannedStoryPoints: this.planningForm.get('plannedPoints')?.value,
        teamAvailability: this.planningForm.get('teamAvailability')?.value,
        teamSize: this.planningForm.get('teamSize')?.value,
        externalDependencies: this.planningForm.get('externalDependencies')?.value,
        sprintId: sprintIdValue || undefined
      };
      this.evaluate.emit(input);
    }
  }

  /**
   * Load sample data for demonstration purposes
   */
  loadSampleData(): void {
    this.planningForm.patchValue({
      plannedPoints: 35,
      teamAvailability: 90,
      teamSize: 5,
      externalDependencies: 2,
      sprintId: null
    });
    this.loadHistoricalData();
  }

  /**
   * Triggered when user selects a sprint from dropdown.
   * Auto-populates planned points from that sprint's committed points.
   */
  onSprintSelected(sprintId: number | null): void {
    if (!sprintId) return;
    const sprint = this.availableSprints.find(s => s.sprintId === sprintId);
    if (sprint) {
      this.planningForm.patchValue({
        plannedPoints: sprint.committedPoints,
        teamAvailability: sprint.teamAvailability,
        teamSize: sprint.teamSize,
        externalDependencies: sprint.externalDependencies
      });
      this.loadHistoricalData();
    }
  }

  /**
   * Triggered when user picks a CSV file for import
   */
  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.name.endsWith('.csv')) {
      this.csvError = 'Please select a valid .csv file';
      return;
    }

    this.csvFileName = file.name;
    this.csvError = null;
    this.csvSuccess = null;

    this.uploadCsv(file);
  }

  /**
   * Upload CSV to API and reload sprint data
   */
  private uploadCsv(file: File): void {
    const teamId = this.teamService.getSelectedTeamId();
    const formData = new FormData();
    formData.append('file', file);

    this.csvImporting = true;
    this.csvError = null;

    this.http.post<{ importedCount?: number; sprintsImported?: number; message?: string }>(
      `${environment.apiBaseUrl}/sprints/import/${teamId}`,
      formData
    ).subscribe({
      next: (result) => {
        this.csvImporting = false;
        const importedCount = result.importedCount ?? result.sprintsImported ?? 0;
        this.csvSuccess = `✅ Imported ${importedCount} sprints from ${this.csvFileName}`;
        this.snackBar.open(this.csvSuccess, 'Dismiss', { duration: 5000 });
        // Reload historical data after successful import
        this.sprintService.loadSprintsFromApi(teamId);
        // Reload sprints dropdown and metrics after a brief delay for DB to settle
        setTimeout(() => {
          this.loadAvailableSprints();
          this.loadHistoricalData();
        }, 500);
      },
      error: (err) => {
        this.csvImporting = false;
        const msg = err.error?.message || 'Failed to import CSV. Check format and try again.';
        this.csvError = `❌ ${msg}`;
      }
    });
  }

  /**
   * Get form control value by name
   */
  getControlValue(controlName: string): any {
    return this.planningForm.get(controlName)?.value;
  }

  /**
   * Check if a form control has a specific error
   */
  hasError(controlName: string, errorName: string): boolean {
    return this.planningForm.get(controlName)?.hasError(errorName) ?? false;
  }
}
