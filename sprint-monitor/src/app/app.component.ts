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
import { RiskFeedbackComponent } from './features/risk-feedback/risk-feedback.component';
import { SprintComparisonComponent } from './features/sprint-comparison/sprint-comparison.component';

import { AuthService } from './core/services/auth.service';
import { TeamService } from './core/services/team.service';
import { TeamDto } from './core/services/api.service';
import { SprintMetrics } from './core/models/sprint.model';
import { RiskAssessment, Recommendation } from './core/models/risk.model';
import { resetPlanningEvaluationState } from './core/store/planning-evaluation.actions';
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
      this.tabGroup.selectedIndex = 1;
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    // Tabs are 0-based in template order.
    if (event.index === 4) {
      this.riskFeedbackComponent?.loadData();
    }

    if (event.index === 5) {
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

    this.planningEvaluation.applyRecommendation(recommendation);
  }

  logout(): void {
    this.authService.logout();
  }

  getRiskClass(): string {
    if (!this.currentAssessment) return '';
    return this.currentAssessment.overallRisk.toLowerCase();
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
}
