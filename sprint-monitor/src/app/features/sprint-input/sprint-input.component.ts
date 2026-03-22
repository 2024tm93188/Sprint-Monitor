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

import { SprintService } from '../../core/services/sprint.service';
import { MetricsService } from '../../core/services/metrics.service';
import { SprintPlanningInput, SprintMetrics } from '../../core/models/sprint.model';

/**
 * Sprint Input Component
 * Form for entering sprint planning data.
 * Collects: planned points, team availability, team size, dependencies
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
    MatDividerModule
  ],
  templateUrl: './sprint-input.component.html',
  styleUrls: ['./sprint-input.component.scss']
})
export class SprintInputComponent implements OnInit {
  @Output() evaluate = new EventEmitter<SprintPlanningInput>();

  private fb = inject(FormBuilder);
  private sprintService = inject(SprintService);
  private metricsService = inject(MetricsService);

  planningForm!: FormGroup;
  historicalMetrics: SprintMetrics | null = null;
  recommendedCommitment: number = 0;

  ngOnInit(): void {
    this.initForm();
    this.loadHistoricalData();
  }

  /**
   * Initialize the planning form with default values and validators
   */
  private initForm(): void {
    this.planningForm = this.fb.group({
      plannedPoints: [30, [Validators.required, Validators.min(0)]],
      teamAvailability: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      teamSize: [5, [Validators.required, Validators.min(1)]],
      externalDependencies: [0, [Validators.min(0)]]
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
   * Handle form submission - emit planning input for risk evaluation
   */
  onSubmit(): void {
    if (this.planningForm.valid) {
      const sprints = this.sprintService.getHistoricalSprintsSnapshot();
      const input: SprintPlanningInput = {
        historicalSprints: sprints,
        plannedStoryPoints: this.planningForm.get('plannedPoints')?.value,
        teamAvailability: this.planningForm.get('teamAvailability')?.value,
        teamSize: this.planningForm.get('teamSize')?.value,
        externalDependencies: this.planningForm.get('externalDependencies')?.value
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
      externalDependencies: 2
    });
    this.loadHistoricalData();
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
