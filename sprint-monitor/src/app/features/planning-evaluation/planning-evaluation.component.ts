import { Component, OnInit, ViewChild, inject, DestroyRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { of, switchMap, map, catchError } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';


import { SprintInputComponent } from '../sprint-input/sprint-input.component';
import { MetricsService } from '../../core/services/metrics.service';
import { RiskEngineService } from '../../core/services/risk-engine.service';
import { SprintService } from '../../core/services/sprint.service';
import { ApiService } from '../../core/services/api.service';
import { SprintPlanningInput, SprintMetrics } from '../../core/models/sprint.model';
import { RiskAssessment, Recommendation, ActionType, RiskLevel } from '../../core/models/risk.model';
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
  styleUrls: ['./planning-evaluation.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(18px)' }),
        animate('350ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PlanningEvaluationComponent implements OnInit {
  @ViewChild(SprintInputComponent) sprintInput!: SprintInputComponent;
  @Output() navigateToRiskDashboard = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  private metricsService = inject(MetricsService);
  private riskEngine = inject(RiskEngineService);
  private sprintService = inject(SprintService);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store);

  currentAssessment: RiskAssessment | null = null;
  currentMetrics: SprintMetrics | null = null;
  currentPlanningInput: SprintPlanningInput | null = null;
  isLoading = false;

  private activeSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;
  private latestEvaluationRequestId = 0;

  /**
   * Tracks which recommendation IDs have been applied in this session.
   * Uses numeric backend ID (string) when available, else composite key.
   */
  private appliedRecommendationIds = new Set<string>();

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

  getMlRisk(): RiskLevel | null {
    return this.getAssessmentRiskValue('mlRisk', 'mlRiskLevel');
  }

  getFinalRisk(): RiskLevel | null {
    return this.getAssessmentRiskValue('finalRisk', 'finalRiskLevel');
  }

  hasHybridRiskData(): boolean {
    return !!this.currentAssessment && !!(this.getMlRisk() || this.getFinalRisk());
  }

  /** Returns a CSS class for the confidence bar fill based on confidence level. */
  getConfidenceClass(): string {
    const conf = this.currentAssessment?.mlConfidence ?? 0;
    if (conf >= 0.75) return 'conf-high';
    if (conf >= 0.5)  return 'conf-medium';
    return 'conf-low';
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
      input.meetingHoursPerSprint,
      input.newMembersCount,
      input.avgExperienceLevel,
      input.collaborationScore,
      input.sprintId
    ).subscribe({
      next: (assessment) => {
        if (requestId !== this.latestEvaluationRequestId) {
          return;
        }

        // Re-apply wasApplied state from session tracking to the fresh assessment
        assessment.recommendations = this.restoreAppliedState(assessment.recommendations);

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

        this.store.dispatch(completeRiskEvaluation({
          input,
          assessment,
          metrics
        }));

        this.showSnackBar('Using offline mode - API unavailable', 'OK', 3000);
      }
    });
  }

  /**
   * Apply a recommendation's form changes and optionally trigger backend re-evaluation.
   *
   * @param recommendation - The recommendation to apply
   * @param skipFormPatch  - When true, skip patching the form (caller will handle inputs externally).
   *                         Re-evaluation is always expected to be triggered by the caller.
   */
  applyRecommendation(recommendation: Recommendation, skipFormPatch = false): void {
    if (!this.sprintInput) {
      this.showSnackBar('No planning data available. Please evaluate a sprint first.', 'OK', 3000);
      return;
    }

    // Track this recommendation as applied by its stable ID
    this.appliedRecommendationIds.add(this.getRecommendationStableId(recommendation));

    // Mark just this one recommendation as applied in the store (not all)
    this.markSingleRecommendationAsApplied(recommendation);

    if (skipFormPatch) {
      // Caller (AppComponent) will handle the form + backend call
      console.log('[PlanningEval] applyRecommendation: skipFormPatch=true, skipping form patch for', recommendation.title);
      return;
    }

    // Patch the form with the recommended change
    const form = this.sprintInput.planningForm;
    const currentPlannedPoints = form.get('plannedPoints')?.value || 0;
    const currentAvailability = form.get('teamAvailability')?.value || 100;
    const currentDependencies = form.get('externalDependencies')?.value || 0;

    switch (recommendation.actionType) {
      case ActionType.ADD_BUFFER: {
        const adjustedPoints = Math.max(1, Math.floor(currentPlannedPoints * 0.8));
        const bufferPoints = currentPlannedPoints - adjustedPoints;
        form.patchValue({ plannedPoints: adjustedPoints });
        this.recalculateAndShow(`Buffer applied: Reserved ${bufferPoints} points. New commitment: ${adjustedPoints} points`);
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
        this.recalculateAndShow(`Scope reduced: ${currentPlannedPoints} → ${reducedPoints} points`);
        break;
      }

      case ActionType.SPLIT_STORIES:
        form.patchValue({ plannedPoints: Math.max(1, Math.floor(currentPlannedPoints * 0.9)) });
        this.recalculateAndShow('Consider breaking large stories into smaller, manageable pieces (3-5 points each)');
        break;

      case ActionType.RESOLVE_DEPENDENCIES: {
        const reducedDeps = Math.max(0, currentDependencies - 2);
        form.patchValue({ externalDependencies: reducedDeps });
        this.recalculateAndShow(`Dependencies updated: ${currentDependencies} → ${reducedDeps}. Work with dependent teams.`);
        break;
      }

      case ActionType.INCREASE_CAPACITY: {
        const suggestedAvailability = Math.min(100, currentAvailability + 15);
        form.patchValue({ teamAvailability: suggestedAvailability });
        this.recalculateAndShow(`Team availability adjusted: ${currentAvailability}% → ${suggestedAvailability}%.`);
        break;
      }

      case ActionType.IMPROVE_ESTIMATION:
        form.patchValue({
          plannedPoints: Math.max(1, Math.floor(currentPlannedPoints * 0.92)),
          externalDependencies: Math.max(0, currentDependencies - 1)
        });
        this.recalculateAndShow('Use Planning Poker and historical data for more accurate estimates.');
        break;

      default:
        this.recalculateAndShow(`Recommendation "${recommendation.title}" noted. Review and apply manually.`);
        break;
    }
  }

  /**
   * Patch the form for a given recommendation without triggering UI side-effects.
   * Used when the caller (AppComponent) wants to update inputs before its own
   * authoritative backend re-evaluation call.
   */
  patchFormForRecommendation(recommendation: Recommendation): void {
    if (!this.sprintInput) return;

    const form = this.sprintInput.planningForm;
    const currentPlannedPoints = form.get('plannedPoints')?.value || 0;
    const currentAvailability = form.get('teamAvailability')?.value || 100;
    const currentDependencies = form.get('externalDependencies')?.value || 0;

    switch (recommendation.actionType) {
      case ActionType.ADD_BUFFER: {
        const adjustedPoints = Math.max(1, Math.floor(currentPlannedPoints * 0.8));
        form.patchValue({ plannedPoints: adjustedPoints });
        break;
      }
      case ActionType.REDUCE_SCOPE: {
        let reduction = Math.max(1, Math.ceil(currentPlannedPoints * 0.15));
        if (recommendation.suggestedChange) {
          const match = recommendation.suggestedChange.match(/(\d+)/);
          if (match) reduction = parseInt(match[1], 10);
        }
        form.patchValue({ plannedPoints: Math.max(1, currentPlannedPoints - reduction) });
        break;
      }
      case ActionType.SPLIT_STORIES:
        form.patchValue({ plannedPoints: Math.max(1, Math.floor(currentPlannedPoints * 0.9)) });
        break;
      case ActionType.RESOLVE_DEPENDENCIES:
        form.patchValue({ externalDependencies: Math.max(0, currentDependencies - 2) });
        break;
      case ActionType.INCREASE_CAPACITY:
        form.patchValue({ teamAvailability: Math.min(100, currentAvailability + 15) });
        break;
      case ActionType.IMPROVE_ESTIMATION:
        form.patchValue({
          plannedPoints: Math.max(1, Math.floor(currentPlannedPoints * 0.92)),
          externalDependencies: Math.max(0, currentDependencies - 1)
        });
        break;
    }

    console.log('[PlanningEval] Form patched for recommendation:', recommendation.title,
      '| plannedPoints:', form.get('plannedPoints')?.value);
  }

  resetEvaluationState(): void {
    this.appliedRecommendationIds.clear();
    this.store.dispatch(resetPlanningEvaluationState());
  }

  /**
   * Trigger a backend re-evaluation using the CURRENT form values and mark the result as final.
   * This is the single source of truth for post-recommendation risk updates.
   */
  triggerReevaluationAndFinalize() {
    if (!this.sprintInput) {
      this.showSnackBar('No planning data available to re-evaluate.', 'OK', 2500);
      return of(null);
    }

    const form = this.sprintInput.planningForm;

    // Snapshot current form values at the time of this call
    const refreshedInput: SprintPlanningInput = {
      historicalSprints: this.sprintService.getHistoricalSprintsSnapshot(),
      plannedStoryPoints: form.get('plannedPoints')?.value ?? 0,
      teamAvailability: form.get('teamAvailability')?.value ?? 100,
      teamSize: form.get('teamSize')?.value ?? 1,
      meetingHoursPerSprint: form.get('meetingHoursPerSprint')?.value ?? 8,
      newMembersCount: form.get('newMembersCount')?.value ?? 0,
      avgExperienceLevel: form.get('avgExperienceLevel')?.value ?? 6,
      collaborationScore: form.get('collaborationScore')?.value ?? 7,
      externalDependencies: form.get('externalDependencies')?.value ?? 0,
      sprintId: form.get('sprintId')?.value || undefined
    };

    console.log('[PlanningEval] triggerReevaluationAndFinalize — inputs:', {
      plannedPoints: refreshedInput.plannedStoryPoints,
      teamAvailability: refreshedInput.teamAvailability,
      externalDependencies: refreshedInput.externalDependencies,
      sprintId: refreshedInput.sprintId
    });

    return this.riskEngine.evaluateRiskViaApi(
      refreshedInput.plannedStoryPoints,
      refreshedInput.teamAvailability,
      refreshedInput.teamSize,
      refreshedInput.externalDependencies,
      refreshedInput.meetingHoursPerSprint,
      refreshedInput.newMembersCount,
      refreshedInput.avgExperienceLevel,
      refreshedInput.collaborationScore,
      refreshedInput.sprintId
    ).pipe(
      switchMap((assessment: RiskAssessment) => {
        if (!assessment) return of(null);

        // Restore applied state from session tracking into the fresh assessment
        assessment.recommendations = this.restoreAppliedState(assessment.recommendations);

        const metrics = this.metricsService.calculateMetrics(
          refreshedInput.historicalSprints,
          refreshedInput.plannedStoryPoints,
          refreshedInput.teamAvailability,
          refreshedInput.externalDependencies
        );

        this.store.dispatch(completeRiskEvaluation({ input: refreshedInput, assessment, metrics }));

        console.log('[PlanningEval] Re-evaluation complete:', {
          assessmentId: assessment.assessmentId,
          overallRisk: assessment.overallRisk,
          mlRisk: (assessment as any).mlRisk,
          finalRisk: (assessment as any).finalRisk,
          totalScore: assessment.totalScore
        });

        if (assessment.assessmentId) {
          return this.apiService.markAssessmentAsFinal(assessment.assessmentId).pipe(
            map((finalized) => {
              console.log('[PlanningEval] Marked assessment as final:', finalized.assessmentId);
              return assessment;
            }),
            catchError((err) => {
              console.warn('[PlanningEval] markAssessmentAsFinal failed:', err);
              return of(assessment);
            })
          );
        }

        return of(assessment);
      }),
      catchError((err) => {
        console.error('[PlanningEval] triggerReevaluationAndFinalize error:', err);
        return of(null);
      })
    );
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Returns a stable, unique key for a recommendation.
   * Prefers the numeric backend ID; falls back to composite key only if no ID.
   */
  private getRecommendationStableId(rec: Recommendation): string {
    const numericId = Number(rec.id);
    if (!Number.isNaN(numericId) && numericId > 0) {
      return `id:${numericId}`;
    }
    // Fallback: composite (should only happen for offline-mode recs)
    return `composite:${rec.actionType}|${rec.title.trim().toLowerCase()}|${rec.addressesRiskFactor}`;
  }

  /**
   * Marks only the given recommendation as applied in the store.
   * Does NOT mark any other recommendations.
   */
  private markSingleRecommendationAsApplied(applied: Recommendation): void {
    if (!this.currentAssessment?.recommendations?.length) {
      return;
    }

    const stableId = this.getRecommendationStableId(applied);
    const now = new Date();

    const updatedRecommendations = this.currentAssessment.recommendations.map(r => {
      if (this.getRecommendationStableId(r) === stableId) {
        return { ...r, wasApplied: true, appliedAt: now, appliedBy: 'Current User' };
      }
      return r;
    });

    this.store.dispatch(updateAssessmentRecommendations({ recommendations: updatedRecommendations }));
    console.log('[PlanningEval] Marked single recommendation as applied:', applied.title, '| stableId:', stableId);
  }

  /**
   * Restores wasApplied state from session tracking into a freshly-fetched recommendation list.
   * Matches by stable ID so only the actual applied recs are marked.
   */
  private restoreAppliedState(recommendations: Recommendation[]): Recommendation[] {
    if (!this.appliedRecommendationIds.size) {
      return recommendations;
    }

    return recommendations.map(r => {
      const stableId = this.getRecommendationStableId(r);
      if (this.appliedRecommendationIds.has(stableId)) {
        return { ...r, wasApplied: true };
      }
      return r;
    });
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
      meetingHoursPerSprint: form.get('meetingHoursPerSprint')?.value ?? 8,
      newMembersCount: form.get('newMembersCount')?.value ?? 0,
      avgExperienceLevel: form.get('avgExperienceLevel')?.value ?? 6,
      collaborationScore: form.get('collaborationScore')?.value ?? 7,
      externalDependencies: form.get('externalDependencies')?.value ?? 0,
      sprintId: form.get('sprintId')?.value || undefined
    };

    this.onEvaluateRisk(refreshedInput);
    this.showSnackBar(message, 'View', 5000);
  }

  private getAssessmentRiskValue(...keys: string[]): RiskLevel | null {
    if (!this.currentAssessment) {
      return null;
    }

    const assessment = this.currentAssessment as unknown as Record<string, unknown>;

    for (const key of keys) {
      const value = assessment[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value as RiskLevel;
      }
    }

    return null;
  }
}