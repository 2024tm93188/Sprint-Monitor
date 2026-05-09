import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';

import { ApiService, TeamRiskConfigurationDto } from '../../core/services/api.service';
import { TeamService } from '../../core/services/team.service';
import { SprintService } from '../../core/services/sprint.service';
import { RiskEngineService } from '../../core/services/risk-engine.service';
import { MetricsService } from '../../core/services/metrics.service';
import { Store } from '@ngrx/store';
import { startRiskEvaluation, completeRiskEvaluation } from '../../core/store/planning-evaluation.actions';

@Component({
  selector: 'app-team-risk-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './team-risk-configuration.component.html',
  styleUrls: ['./team-risk-configuration.component.scss']
})
export class TeamRiskConfigurationComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly teamService = inject(TeamService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly sprintService = inject(SprintService);
  private readonly riskEngine = inject(RiskEngineService);
  private readonly metricsService = inject(MetricsService);
  private readonly store = inject(Store);

  selectedTeamId = 0;
  selectedTeamName = '';
  loading = false;
  saving = false;

  readonly form = this.fb.group({
    cvrLowMax: [1.0, [Validators.required, Validators.min(0)]],
    cvrMediumMax: [1.1, [Validators.required, Validators.min(0)]],
    velocityCvLowMax: [0.15, [Validators.required, Validators.min(0)]],
    velocityCvMediumMax: [0.25, [Validators.required, Validators.min(0)]],
    spilloverLowMax: [20, [Validators.required, Validators.min(0)]],
    spilloverMediumMax: [40, [Validators.required, Validators.min(0)]],
    capacityUtilizationLowMax: [100, [Validators.required, Validators.min(0)]],
    capacityUtilizationMediumMax: [125, [Validators.required, Validators.min(0)]],
    availabilityHighMin: [90, [Validators.required, Validators.min(0), Validators.max(100)]],
    availabilityMediumMin: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
    dependencyLowMax: [0, [Validators.required, Validators.min(0)]],
    dependencyMediumMax: [2, [Validators.required, Validators.min(0)]],
    cvrWeight: [25, [Validators.required, Validators.min(0)]],
    velocityWeight: [10, [Validators.required, Validators.min(0)]],
    spilloverWeight: [15, [Validators.required, Validators.min(0)]],
    capacityWeight: [10, [Validators.required, Validators.min(0)]],
    availabilityWeight: [10, [Validators.required, Validators.min(0)]],
    dependencyWeight: [10, [Validators.required, Validators.min(0)]],
    teamDynamicsWeight: [20, [Validators.required, Validators.min(0)]],
    useTeamDynamics: [true],
    meetingHoursLowMax: [8, [Validators.required, Validators.min(0)]],
    meetingHoursMediumMax: [12, [Validators.required, Validators.min(0)]],
    newMembersLowMax: [0, [Validators.required, Validators.min(0)]],
    newMembersMediumMax: [1, [Validators.required, Validators.min(0)]],
    experienceLowMin: [4, [Validators.required, Validators.min(1), Validators.max(10)]],
    experienceMediumMin: [6, [Validators.required, Validators.min(1), Validators.max(10)]],
    collaborationLowMin: [4, [Validators.required, Validators.min(1), Validators.max(10)]],
    collaborationMediumMin: [6, [Validators.required, Validators.min(1), Validators.max(10)]]
  });

  ngOnInit(): void {
    this.teamService.getSelectedTeam()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(team => {
        if (!team) {
          return;
        }

        this.selectedTeamId = team.teamId;
        this.selectedTeamName = team.teamName;
        this.loadConfiguration(team.teamId);
      });
  }

  save(): void {
    if (!this.selectedTeamId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();

    this.apiService.saveTeamRiskConfiguration(this.selectedTeamId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Configuration saved for the selected team.', 'Close', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });

        // If there's a planning input, re-run risk evaluation so planning reflects new config
        this.sprintService.getPlanningInput()
          .pipe(take(1))
          .subscribe(planningInput => {
            if (!planningInput) return;

            this.store.dispatch(startRiskEvaluation({ input: planningInput }));

            this.riskEngine.evaluateRiskViaApi(
              planningInput.plannedStoryPoints,
              planningInput.teamAvailability,
              planningInput.teamSize,
              planningInput.externalDependencies,
              planningInput.meetingHoursPerSprint,
              planningInput.newMembersCount,
              planningInput.avgExperienceLevel,
              planningInput.collaborationScore,
              planningInput.sprintId
            ).subscribe({
              next: assessment => {
                const metrics = this.metricsService.calculateMetrics(
                  planningInput.historicalSprints,
                  planningInput.plannedStoryPoints,
                  planningInput.teamAvailability,
                  planningInput.externalDependencies
                );

                this.store.dispatch(completeRiskEvaluation({ input: planningInput, assessment, metrics }));
              },
              error: err => {
                const metrics = this.metricsService.calculateMetrics(
                  planningInput.historicalSprints,
                  planningInput.plannedStoryPoints,
                  planningInput.teamAvailability,
                  planningInput.externalDependencies
                );
                const assessment = this.riskEngine.evaluateRisk(metrics, planningInput.plannedStoryPoints, planningInput.teamAvailability);
                this.store.dispatch(completeRiskEvaluation({ input: planningInput, assessment, metrics }));
              }
            });
          });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Could not save the configuration.', 'Close', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private loadConfiguration(teamId: number): void {
    this.loading = true;
    this.apiService.getTeamRiskConfiguration(teamId).subscribe({
      next: configuration => {
        this.loading = false;
        this.form.patchValue(configuration);
        this.snackBar.open('Loaded team-specific risk configuration.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        });
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Using system defaults until the configuration is loaded.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['info-snackbar']
        });
      }
    });
  }

  private buildPayload(): TeamRiskConfigurationDto {
    const values = this.form.getRawValue();

    return {
      teamId: this.selectedTeamId,
      cvrLowMax: values.cvrLowMax ?? 1.0,
      cvrMediumMax: values.cvrMediumMax ?? 1.1,
      velocityCvLowMax: values.velocityCvLowMax ?? 0.15,
      velocityCvMediumMax: values.velocityCvMediumMax ?? 0.25,
      spilloverLowMax: values.spilloverLowMax ?? 20,
      spilloverMediumMax: values.spilloverMediumMax ?? 40,
      capacityUtilizationLowMax: values.capacityUtilizationLowMax ?? 100,
      capacityUtilizationMediumMax: values.capacityUtilizationMediumMax ?? 125,
      availabilityHighMin: values.availabilityHighMin ?? 90,
      availabilityMediumMin: values.availabilityMediumMin ?? 75,
      dependencyLowMax: values.dependencyLowMax ?? 0,
      dependencyMediumMax: values.dependencyMediumMax ?? 2,
      cvrWeight: values.cvrWeight ?? 25,
      velocityWeight: values.velocityWeight ?? 10,
      spilloverWeight: values.spilloverWeight ?? 15,
      capacityWeight: values.capacityWeight ?? 10,
      availabilityWeight: values.availabilityWeight ?? 10,
      dependencyWeight: values.dependencyWeight ?? 10,
      teamDynamicsWeight: values.teamDynamicsWeight ?? 20,
      useTeamDynamics: values.useTeamDynamics ?? true,
      meetingHoursLowMax: values.meetingHoursLowMax ?? 8,
      meetingHoursMediumMax: values.meetingHoursMediumMax ?? 12,
      newMembersLowMax: values.newMembersLowMax ?? 0,
      newMembersMediumMax: values.newMembersMediumMax ?? 1,
      experienceLowMin: values.experienceLowMin ?? 4,
      experienceMediumMin: values.experienceMediumMin ?? 6,
      collaborationLowMin: values.collaborationLowMin ?? 4,
      collaborationMediumMin: values.collaborationMediumMin ?? 6
    };
  }
}
