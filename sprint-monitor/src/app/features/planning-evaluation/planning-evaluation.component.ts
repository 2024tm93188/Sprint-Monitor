import { Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { SprintInputComponent } from '../sprint-input/sprint-input.component';
import { MetricsService } from '../../core/services/metrics.service';
import { RiskEngineService } from '../../core/services/risk-engine.service';
import { SprintPlanningInput, SprintMetrics } from '../../core/models/sprint.model';
import { RiskAssessment, Recommendation, ActionType } from '../../core/models/risk.model';
import {
  completeRiskEvaluation,
  resetPlanningEvaluationState,
  startRiskEvaluation,
  updateAssessmentRecommendations
} from '../../core/store/planning-evaluation.actions';
import {
  selectCurrentAssessment,
  selectCurrentMetrics,
  selectCurrentPlanningInput,
  selectEvaluationLoading
} from '../../core/store/planning-evaluation.selectors';

@Component({
  selector: 'app-planning-evaluation',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    SprintInputComponent
  ],
  templateUrl: './planning-evaluation.component.html',
  styleUrls: ['./planning-evaluation.component.scss']
})
export class PlanningEvaluationComponent implements OnInit {
  @ViewChild(SprintInputComponent) sprintInput!: SprintInputComponent;

  private destroyRef = inject(DestroyRef);
  private metricsService = inject(MetricsService);
  private riskEngine = inject(RiskEngineService);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store);

  currentAssessment: RiskAssessment | null = null;
  currentMetrics: SprintMetrics | null = null;
  currentPlanningInput: SprintPlanningInput | null = null;
  isLoading = false;

  private activeSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  ngOnInit(): void {
    this.store.select(selectCurrentAssessment)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(assessment => {
        this.currentAssessment = assessment;
      });

    this.store.select(selectCurrentMetrics)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(metrics => {
        this.currentMetrics = metrics;
      });

    this.store.select(selectCurrentPlanningInput)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(planningInput => {
        this.currentPlanningInput = planningInput;
      });

    this.store.select(selectEvaluationLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  onEvaluateRisk(input: SprintPlanningInput): void {
    this.dismissActiveSnackBar();
    this.store.dispatch(startRiskEvaluation({ input }));

    this.riskEngine.evaluateRiskViaApi(
      input.plannedStoryPoints,
      input.teamAvailability,
      input.teamSize,
      input.externalDependencies,
      input.sprintId
    ).subscribe({
      next: (assessment) => {
        const metrics = this.metricsService.calculateMetrics(
          input.historicalSprints,
          input.plannedStoryPoints
        );

        this.store.dispatch(completeRiskEvaluation({
          input,
          assessment,
          metrics
        }));

        const riskColor = assessment.overallRisk.toLowerCase();
        this.showSnackBar(
          `Risk Assessment Complete: ${assessment.overallRisk} RISK`,
          'View',
          4000,
          [`snackbar-${riskColor}`]
        );
      },
      error: (err) => {
        console.error('Risk evaluation failed:', err);

        const metrics = this.metricsService.calculateMetrics(
          input.historicalSprints,
          input.plannedStoryPoints
        );
        const assessment = this.riskEngine.evaluateRisk(
          metrics,
          input.plannedStoryPoints,
          input.teamAvailability
        );

        this.store.dispatch(completeRiskEvaluation({
          input,
          assessment,
          metrics
        }));

        this.showSnackBar('Using offline mode - API unavailable', 'OK', 3000);
      }
    });
  }

  applyRecommendation(recommendation: Recommendation): void {
    if (!this.sprintInput || !this.currentPlanningInput) {
      this.showSnackBar('No planning data available. Please evaluate a sprint first.', 'OK', 3000);
      return;
    }

    const form = this.sprintInput.planningForm;
    const currentPlannedPoints = form.get('plannedPoints')?.value || 0;
    const currentAvailability = form.get('teamAvailability')?.value || 100;

    switch (recommendation.actionType) {
      case ActionType.ADD_BUFFER: {
        const bufferPercentage = 0.15;
        const bufferPoints = Math.ceil(currentPlannedPoints * bufferPercentage);
        const adjustedPoints = currentPlannedPoints - bufferPoints;

        form.patchValue({ plannedPoints: adjustedPoints });

        this.showSnackBar(
          `Buffer applied: Reserved ${bufferPoints} points for unplanned work. New commitment: ${adjustedPoints} points`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        break;
      }

      case ActionType.REDUCE_SCOPE: {
        let reduction = Math.ceil(currentPlannedPoints * 0.10);
        if (recommendation.suggestedChange) {
          const match = recommendation.suggestedChange.match(/(\d+)/);
          if (match) {
            reduction = parseInt(match[1], 10);
          }
        }
        const reducedPoints = Math.max(0, currentPlannedPoints - reduction);

        form.patchValue({ plannedPoints: reducedPoints });

        this.showSnackBar(
          `Scope reduced: ${currentPlannedPoints} -> ${reducedPoints} points`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        break;
      }

      case ActionType.SPLIT_STORIES:
        this.showSnackBar(
          'Consider breaking large stories into smaller, manageable pieces (3-5 points each)',
          'Got it',
          6000
        );
        break;

      case ActionType.RESOLVE_DEPENDENCIES: {
        const currentDeps = form.get('externalDependencies')?.value || 0;
        const reducedDeps = Math.max(0, currentDeps - 1);

        form.patchValue({ externalDependencies: reducedDeps });

        this.showSnackBar(
          `Dependencies updated: ${currentDeps} -> ${reducedDeps}. Work with dependent teams to resolve blockers.`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        break;
      }

      case ActionType.INCREASE_CAPACITY: {
        const suggestedAvailability = Math.min(100, currentAvailability + 10);

        form.patchValue({ teamAvailability: suggestedAvailability });

        this.showSnackBar(
          `Team availability adjusted: ${currentAvailability}% -> ${suggestedAvailability}%. Consider adding resources or reducing PTO.`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        break;
      }

      case ActionType.IMPROVE_ESTIMATION:
        this.showSnackBar(
          'Use Planning Poker and historical data for more accurate estimates. Break down ambiguous items.',
          'Got it',
          6000
        );
        break;

      default:
        this.showSnackBar(
          `Recommendation "${recommendation.title}" noted. Review and apply manually.`,
          'OK',
          4000
        );
        break;
    }

    if (this.currentAssessment) {
      const recommendations = this.currentAssessment.recommendations.filter(
        r => r.id !== recommendation.id
      );
      this.store.dispatch(updateAssessmentRecommendations({ recommendations }));
    }
  }

  resetEvaluationState(): void {
    this.store.dispatch(resetPlanningEvaluationState());
  }

  private dismissActiveSnackBar(): void {
    if (this.activeSnackBarRef) {
      this.activeSnackBarRef.dismiss();
      this.activeSnackBarRef = null;
    }
  }

  private showSnackBar(message: string, action: string, duration: number, panelClass?: string[]): MatSnackBarRef<TextOnlySnackBar> {
    this.dismissActiveSnackBar();
    this.activeSnackBarRef = this.snackBar.open(message, action, {
      duration,
      panelClass: panelClass || []
    });
    return this.activeSnackBarRef;
  }
}