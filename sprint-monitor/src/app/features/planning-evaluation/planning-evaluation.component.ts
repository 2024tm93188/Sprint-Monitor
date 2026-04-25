import { Component, OnInit, ViewChild, inject, DestroyRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { SprintInputComponent } from '../sprint-input/sprint-input.component';
import { MetricsService } from '../../core/services/metrics.service';
import { RiskEngineService } from '../../core/services/risk-engine.service';
import { SprintService } from '../../core/services/sprint.service';
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
  @Output() navigateToRiskDashboard = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  private metricsService = inject(MetricsService);
  private riskEngine = inject(RiskEngineService);
  private sprintService = inject(SprintService);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store);

  currentAssessment: RiskAssessment | null = null;
  currentMetrics: SprintMetrics | null = null;
  currentPlanningInput: SprintPlanningInput | null = null;
  isLoading = false;

  private activeSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;
  private latestEvaluationRequestId = 0;
  private appliedRecommendationKeys = new Set<string>();

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
    const requestId = ++this.latestEvaluationRequestId;
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
        if (requestId !== this.latestEvaluationRequestId) {
          return;
        }

        assessment.recommendations = this.filterAppliedRecommendations(assessment.recommendations);

        const metrics = this.metricsService.calculateMetrics(
          input.historicalSprints,
          input.plannedStoryPoints,
          input.teamAvailability,
          input.externalDependencies
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
        if (requestId !== this.latestEvaluationRequestId) {
          return;
        }

        console.error('Risk evaluation failed:', err);

        const metrics = this.metricsService.calculateMetrics(
          input.historicalSprints,
          input.plannedStoryPoints,
          input.teamAvailability,
          input.externalDependencies
        );
        const assessment = this.riskEngine.evaluateRisk(
          metrics,
          input.plannedStoryPoints,
          input.teamAvailability
        );

        assessment.recommendations = this.filterAppliedRecommendations(assessment.recommendations);

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
    if (!this.sprintInput) {
      this.showSnackBar('No planning data available. Please evaluate a sprint first.', 'OK', 3000);
      return;
    }

    const form = this.sprintInput.planningForm;
    this.appliedRecommendationKeys.add(this.getRecommendationKey(recommendation));
    this.markRecommendationAsApplied(recommendation);

    const currentPlannedPoints = form.get('plannedPoints')?.value || 0;
    const currentAvailability = form.get('teamAvailability')?.value || 100;
    const currentDependencies = form.get('externalDependencies')?.value || 0;

    switch (recommendation.actionType) {
      case ActionType.ADD_BUFFER: {
        const adjustedPoints = Math.max(1, Math.floor(currentPlannedPoints * 0.8));
        const bufferPoints = currentPlannedPoints - adjustedPoints;

        form.patchValue({ plannedPoints: adjustedPoints });
        this.recalculateAndShow(`Buffer applied: Reserved ${bufferPoints} points for unplanned work. New commitment: ${adjustedPoints} points`);
        break;
      }

      case ActionType.REDUCE_SCOPE: {
        let reduction = Math.max(1, Math.ceil(currentPlannedPoints * 0.15));
        if (recommendation.suggestedChange) {
          const match = recommendation.suggestedChange.match(/(\d+)/);
          if (match) {
            reduction = parseInt(match[1], 10);
          }
        }
        const reducedPoints = Math.max(1, currentPlannedPoints - reduction);

        form.patchValue({ plannedPoints: reducedPoints });
        this.recalculateAndShow(`Scope reduced: ${currentPlannedPoints} -> ${reducedPoints} points`);
        break;
      }

      case ActionType.SPLIT_STORIES:
        form.patchValue({ plannedPoints: Math.max(1, Math.floor(currentPlannedPoints * 0.9)) });
        this.recalculateAndShow('Consider breaking large stories into smaller, manageable pieces (3-5 points each)');
        break;

      case ActionType.RESOLVE_DEPENDENCIES: {
        const reducedDeps = Math.max(0, currentDependencies - 2);

        form.patchValue({ externalDependencies: reducedDeps });
        this.recalculateAndShow(`Dependencies updated: ${currentDependencies} -> ${reducedDeps}. Work with dependent teams to resolve blockers.`);
        break;
      }

      case ActionType.INCREASE_CAPACITY: {
        const suggestedAvailability = Math.min(100, currentAvailability + 15);

        form.patchValue({ teamAvailability: suggestedAvailability });
        this.recalculateAndShow(`Team availability adjusted: ${currentAvailability}% -> ${suggestedAvailability}%. Consider adding resources or reducing PTO.`);
        break;
      }

      case ActionType.IMPROVE_ESTIMATION:
        form.patchValue({
          plannedPoints: Math.max(1, Math.floor(currentPlannedPoints * 0.92)),
          externalDependencies: Math.max(0, currentDependencies - 1)
        });
        this.recalculateAndShow('Use Planning Poker and historical data for more accurate estimates. Break down ambiguous items.');
        break;

      default:
        this.recalculateAndShow(`Recommendation "${recommendation.title}" noted. Review and apply manually.`);
        break;
    }
  }

  private markRecommendationAsApplied(applied: Recommendation): void {
    if (!this.currentAssessment?.recommendations?.length) {
      return;
    }

    const recommendations = this.currentAssessment.recommendations;
    const applyIndex = recommendations.findIndex(r => this.getRecommendationKey(r) === this.getRecommendationKey(applied));

    if (applyIndex < 0) {
      return;
    }

    const now = new Date();
    const target = recommendations[applyIndex];

    const updatedRecommendations = recommendations.map((r, index) => {
      if (index !== applyIndex) {
        return r;
      }

      return {
        ...r,
        wasApplied: true,
        appliedAt: now,
        appliedBy: 'Current User'
      };
    });

    this.store.dispatch(updateAssessmentRecommendations({ recommendations: updatedRecommendations }));
  }

  resetEvaluationState(): void {
    this.appliedRecommendationKeys.clear();
    this.store.dispatch(resetPlanningEvaluationState());
  }

  private filterAppliedRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return recommendations.map(r => {
      if (!this.appliedRecommendationKeys.has(this.getRecommendationKey(r))) {
        return r;
      }

      return {
        ...r,
        wasApplied: true,
        appliedBy: r.appliedBy || 'Current User',
        appliedAt: r.appliedAt || new Date()
      };
    });
  }

  private getRecommendationKey(rec: Recommendation): string {
    return `${rec.actionType}|${rec.title}|${rec.addressesRiskFactor}`.toLowerCase();
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
    this.activeSnackBarRef.onAction().subscribe(() => {
      this.navigateToRiskDashboard.emit();
    });
    return this.activeSnackBarRef;
  }

  private recalculateAndShow(message: string): void {
    if (!this.sprintInput) {
      return;
    }

    const form = this.sprintInput.planningForm;
    const refreshedInput: SprintPlanningInput = {
      historicalSprints: this.sprintService.getHistoricalSprintsSnapshot(),
      plannedStoryPoints: form.get('plannedPoints')?.value ?? 0,
      teamAvailability: form.get('teamAvailability')?.value ?? 100,
      teamSize: form.get('teamSize')?.value ?? 1,
      externalDependencies: form.get('externalDependencies')?.value ?? 0,
      sprintId: form.get('sprintId')?.value || undefined
    };

    this.onEvaluateRisk(refreshedInput);
    this.showSnackBar(message, 'View', 5000);
  }
}