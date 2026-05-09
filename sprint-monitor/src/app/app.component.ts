import { Component, ViewChild, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTabGroup } from '@angular/material/tabs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { PlanningEvaluationComponent } from './features/planning-evaluation/planning-evaluation.component';
import { RiskDashboardComponent } from './features/risk-dashboard/risk-dashboard.component';
import { RecommendationsComponent } from './features/recommendations/recommendations.component';
import { FeasibilityStudyComponent } from './features/feasibility-study/feasibility-study.component';
import { TeamRiskConfigurationComponent } from './features/team-risk-configuration/team-risk-configuration.component';
import { RiskFeedbackComponent } from './features/risk-feedback/risk-feedback.component';
import { SprintComparisonComponent } from './features/sprint-comparison/sprint-comparison.component';

import { AuthService } from './core/services/auth.service';
import { TeamService } from './core/services/team.service';
import { ApiService } from './core/services/api.service';
import { TeamDto, RiskAssessmentResponseDto } from './core/services/api.service';
import { SprintMetrics } from './core/models/sprint.model';
import { ActionType, RecommendationPriority, RiskAssessment, Recommendation, RiskLevel, AssessmentConfidence } from './core/models/risk.model';
import { resetPlanningEvaluationState, setCurrentAssessment, setCurrentMetrics } from './core/store/planning-evaluation.actions';
import { selectCurrentAssessment, selectCurrentMetrics } from './core/store/planning-evaluation.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    PlanningEvaluationComponent,
    RiskDashboardComponent,
    RecommendationsComponent,
    FeasibilityStudyComponent,
    TeamRiskConfigurationComponent,
    RiskFeedbackComponent,
    SprintComparisonComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild(PlanningEvaluationComponent) planningEvaluation?: PlanningEvaluationComponent;
  @ViewChild(RiskFeedbackComponent) riskFeedbackComponent?: RiskFeedbackComponent;
  @ViewChild(SprintComparisonComponent) sprintComparisonComponent?: SprintComparisonComponent;
  @ViewChild(MatTabGroup) tabGroup?: MatTabGroup;

  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store);
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  teamService = inject(TeamService);

  currentAssessment: RiskAssessment | null = null;
  currentMetrics: SprintMetrics | null = null;
  private activeSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  teams: TeamDto[] = [];
  selectedTeamId = 1;

  ngOnInit(): void {
    this.teamService.loadTeams();

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

    this.teamService.getTeams().subscribe(teams => {
      this.teams = teams;
      const current = this.teamService.getSelectedTeamSnapshot();
      if (current) {
        this.selectedTeamId = current.teamId;
      } else if (teams.length > 0) {
        this.selectedTeamId = teams[0].teamId;
      }
    });
  }

  onNavigateToRiskDashboard(): void {
    if (this.tabGroup) {
      this.tabGroup.selectedIndex = 2;
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    // Tabs are 0-based in template order.
    if (event.index === 5) {
      this.riskFeedbackComponent?.loadData();
    }

    if (event.index === 6) {
      this.syncAppliedRecommendationsForCurrentSprint();
      this.sprintComparisonComponent?.loadComparison();
    }
  }

  onTeamChange(): void {
    const team = this.teams.find(t => t.teamId === +this.selectedTeamId);
    if (team) {
      this.teamService.setSelectedTeam(team);
      this.store.dispatch(resetPlanningEvaluationState());
      this.showSnackBar(`Switched to team: ${team.teamName}`, 'OK', 2500);
    }
  }

  onApplyRecommendation(recommendation: Recommendation): void {
    if (!this.planningEvaluation) {
      this.showSnackBar('Planning module is not ready. Try again in a moment.', 'OK', 2500);
      return;
    }

    const applyPayload = {
      beforeScore: recommendation.beforeScore,
      afterScore: recommendation.afterScore,
      beforeRiskLevel: recommendation.beforeRiskLevel,
      afterRiskLevel: recommendation.afterRiskLevel,
      impactScoreChange: recommendation.estimatedScoreChange,
      appliedBy: this.authService.userName() || this.authService.userEmail() || 'system'
    };

    const persistByMatch = () =>
      this.apiService.applyRecommendationByMatch({
        teamId: this.selectedTeamId,
        sprintId: this.currentAssessment?.sprintId ?? undefined,
        title: recommendation.title,
        actionType: recommendation.actionType,
        addressesRiskFactor: recommendation.addressesRiskFactor,
        ...applyPayload
      }).subscribe({
        next: () => {
          this.showSnackBar(
            `Applied: ${recommendation.title} (${recommendation.beforeRiskLevel || 'N/A'} -> ${recommendation.afterRiskLevel || 'N/A'})`,
            'OK',
            2200
          );
        },
        error: () => {
          this.showSnackBar('Applied locally, but action-tracking sync failed.', 'OK', 2500);
        }
      });

    const recommendationId = Number(recommendation.id);
    if (!Number.isNaN(recommendationId) && recommendationId > 0) {
      this.apiService.applyRecommendation(recommendationId, applyPayload).subscribe({
        next: () => {
          this.showSnackBar(
            `Applied: ${recommendation.title} (${recommendation.beforeRiskLevel || 'N/A'} -> ${recommendation.afterRiskLevel || 'N/A'})`,
            'OK',
            2200
          );
        },
        error: () => {
          persistByMatch();
        }
      });
    } else {
      persistByMatch();
    }

    this.planningEvaluation.applyRecommendation(recommendation);
  }

  private syncAppliedRecommendationsForCurrentSprint(): void {
    const applied = this.currentAssessment?.recommendations?.filter(r => r.wasApplied) || [];
    if (!applied.length) {
      return;
    }

    applied.forEach(recommendation => {
      this.apiService.applyRecommendationByMatch({
        teamId: this.selectedTeamId,
        sprintId: this.currentAssessment?.sprintId ?? undefined,
        title: recommendation.title,
        actionType: recommendation.actionType,
        addressesRiskFactor: recommendation.addressesRiskFactor,
        beforeScore: recommendation.beforeScore,
        afterScore: recommendation.afterScore,
        beforeRiskLevel: recommendation.beforeRiskLevel,
        afterRiskLevel: recommendation.afterRiskLevel,
        impactScoreChange: recommendation.estimatedScoreChange,
        appliedBy: recommendation.appliedBy || this.authService.userName() || this.authService.userEmail() || 'system'
      }).subscribe({
        next: () => {},
        error: () => {}
      });
    });
  }

  onFinalizeRequestedFromDashboard(): void {
    const assessment = this.currentAssessment;
    if (!assessment?.assessmentId || assessment.isFinal) {
      this.showSnackBar('No draft assessment available to finalize.', 'OK', 2500);
      return;
    }

    this.apiService.markAssessmentAsFinal(assessment.assessmentId).subscribe({
      next: finalized => {
        const updatedAssessment: RiskAssessment = {
          ...assessment,
          assessmentId: finalized.assessmentId,
          sprintId: finalized.sprintId,
          sprintNumber: finalized.sprintNumber,
          iteration: finalized.iteration,
          isFinal: true
        };

        this.store.dispatch(setCurrentAssessment({ assessment: updatedAssessment }));
        this.showSnackBar(`Sprint #${finalized.sprintNumber} marked as final`, 'OK', 2800);
      },
      error: err => {
        const message = err?.error?.message || 'Could not mark assessment as final';
        this.showSnackBar(message, 'OK', 3000);
      }
    });
  }

  onFeedbackSubmitted(assessmentId: number): void {
    this.apiService.getAssessment(assessmentId).subscribe({
      next: (response) => {
        const refreshedAssessment = this.mapAssessmentResponseToModel(response);
        this.store.dispatch(setCurrentAssessment({ assessment: refreshedAssessment }));
        this.store.dispatch(setCurrentMetrics({ metrics: response.metrics }));
      },
      error: () => {
        this.showSnackBar('Feedback saved, but dashboard refresh failed.', 'OK', 2500);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getRiskClass(): string {
    if (!this.currentAssessment) return '';
    return this.currentAssessment.overallRisk.toLowerCase();
  }

  get hideOperationalTabsForCurrentSprint(): boolean {
    // Keep operational tabs visible unless sprint-specific gating is reintroduced.
    return false;
  }

  getTeamName(teamId: number): string {
    const team = this.teams.find(t => t.teamId === +teamId);
    return team?.teamName || 'Select team';
  }

  getTeamInitials(teamId: number): string {
    const name = this.getTeamName(teamId);
    const words = name.split(' ').filter(Boolean);
    if (words.length === 0) return 'TM';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getTeamIcon(teamName: string): string {
    const name = teamName.toLowerCase();
    if (name.includes('mobile') || name.includes('app')) return 'devices';
    if (name.includes('data') || name.includes('analytics')) return 'insights';
    if (name.includes('platform') || name.includes('infra')) return 'dns';
    if (name.includes('qa') || name.includes('quality')) return 'fact_check';
    if (name.includes('api') || name.includes('backend')) return 'hub';
    return 'groups_2';
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

  private mapAssessmentResponseToModel(response: RiskAssessmentResponseDto): RiskAssessment {
    const baseScore = Number(response.totalScore ?? 0);

    return {
      assessmentId: response.assessmentId,
      teamId: response.teamId,
      sprintId: response.sprintId,
      sprintNumber: response.sprintNumber,
      iteration: response.iteration,
      isFinal: response.isFinal,
      overallRisk: response.riskLevel as RiskLevel,
      totalScore: response.totalScore,
      teamSize: response.teamSize,
      meetingHoursPerSprint: response.meetingHoursPerSprint,
      newMembersCount: response.newMembersCount,
      avgExperienceLevel: response.avgExperienceLevel,
      collaborationScore: response.collaborationScore,
      teamDynamicsScore: response.teamDynamicsScore,
      teamCondition: response.teamCondition,
      maxPossibleScore: response.maxPossibleScore,
      confidence: response.confidence as AssessmentConfidence,
      feedbackCalibrationFactor: response.feedbackCalibrationFactor,
      feedbackSampleSize: response.feedbackSampleSize,
      assessedAt: new Date(response.assessedAt),
      factors: response.factors.map(f => ({
        name: f.factorName,
        score: f.score,
        description: f.description,
        metricValue: f.metricValue,
        threshold: f.threshold ?? undefined
      })),
      recommendations: response.recommendations.map(r => {
        const mappedRecommendation: Recommendation = {
          id: r.recommendationId.toString(),
          title: r.title,
          description: r.description,
          priority: r.priority as RecommendationPriority,
          actionType: r.actionType as ActionType,
          suggestedChange: r.suggestedChange ?? undefined,
          addressesRiskFactor: r.addressesRiskFactor,
          beforeScore: r.beforeScore ?? undefined,
          afterScore: r.afterScore ?? undefined,
          beforeRiskLevel: r.beforeRiskLevel as RiskLevel | undefined,
          afterRiskLevel: r.afterRiskLevel as RiskLevel | undefined,
          estimatedScoreChange: r.estimatedScoreChange ?? undefined,
          wasApplied: r.wasApplied ?? undefined,
          appliedAt: r.appliedAt ? new Date(r.appliedAt) : undefined,
          appliedBy: r.appliedBy ?? undefined
        };

        if (mappedRecommendation.beforeScore === undefined || mappedRecommendation.afterScore === undefined) {
          const parsed = mappedRecommendation.suggestedChange?.match(/(\d+(?:\.\d+)?)/);
          const inferredDelta = parsed ? Math.max(0.5, Math.min(3, parseFloat(parsed[1]) / 5)) : 1;
          const before = Math.round(baseScore * 100) / 100;
          const after = Math.max(0, Math.round((before - inferredDelta) * 100) / 100);

          mappedRecommendation.beforeScore = before;
          mappedRecommendation.afterScore = after;
          mappedRecommendation.beforeRiskLevel = mappedRecommendation.beforeRiskLevel ?? (response.riskLevel as RiskLevel);
          mappedRecommendation.afterRiskLevel = mappedRecommendation.afterRiskLevel ?? this.getRiskLevelFromScore(after);
          mappedRecommendation.estimatedScoreChange = mappedRecommendation.estimatedScoreChange ?? Math.round(inferredDelta * 100) / 100;
        }

        return mappedRecommendation;
      })
    };
  }

  private getRiskLevelFromScore(score: number): RiskLevel {
    const normalizedScore = Math.floor(score);

    if (normalizedScore <= 3) return RiskLevel.LOW;
    if (normalizedScore <= 6) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }
}
