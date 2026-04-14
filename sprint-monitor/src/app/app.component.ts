import { Component, inject, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SprintInputComponent } from './features/sprint-input/sprint-input.component';
import { RiskDashboardComponent } from './features/risk-dashboard/risk-dashboard.component';
import { RecommendationsComponent } from './features/recommendations/recommendations.component';
import { FeasibilityStudyComponent } from './features/feasibility-study/feasibility-study.component';
import { RiskFeedbackComponent } from './features/risk-feedback/risk-feedback.component';
import { SprintComparisonComponent } from './features/sprint-comparison/sprint-comparison.component';

import { SprintService } from './core/services/sprint.service';
import { MetricsService } from './core/services/metrics.service';
import { RiskEngineService } from './core/services/risk-engine.service';
import { AuthService } from './core/services/auth.service';
import { TeamService } from './core/services/team.service';
import { TeamDto } from './core/services/api.service';
import { SprintPlanningInput, SprintMetrics } from './core/models/sprint.model';
import { RiskAssessment, Recommendation, ActionType } from './core/models/risk.model';

/**
 * Sprint Monitor - Main Application Component
 *
 * A data-driven sprint feasibility and spillover risk detection system.
 * Uses deterministic, rule-based logic (no AI/ML) for explainable results.
 *
 * Architecture:
 * - SprintInputComponent: Collects planning data
 * - RiskDashboardComponent: Displays risk assessment
 * - RecommendationsComponent: Shows actionable suggestions
 */
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
    SprintInputComponent,
    RiskDashboardComponent,
    RecommendationsComponent,
    FeasibilityStudyComponent,
    RiskFeedbackComponent,
    SprintComparisonComponent
  ],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <mat-icon>speed</mat-icon>
      <span class="title">Sprint Monitor</span>
      <span class="subtitle">Risk Detection System</span>
      <span class="spacer"></span>

      <!-- Team Selector -->
      <div class="team-selector" *ngIf="teams.length > 0">
        <mat-icon class="team-icon">groups</mat-icon>
        <mat-form-field appearance="outline" class="team-field">
          <mat-select
            [(ngModel)]="selectedTeamId"
            (selectionChange)="onTeamChange()"
            panelClass="team-select-panel"
            aria-label="Select team">
            <mat-select-trigger>
              <span class="selected-team-chip">
                <span class="team-avatar">{{ getTeamInitials(selectedTeamId) }}</span>
                <span class="selected-team-name">{{ getTeamName(selectedTeamId) }}</span>
              </span>
            </mat-select-trigger>
            <mat-option *ngFor="let team of teams" [value]="team.teamId">
              <div class="team-option-row">
                <span class="team-avatar">{{ getTeamInitials(team.teamId) }}</span>
                <div class="team-option-text">
                  <span class="team-option-name">{{ team.teamName }}</span>
                  <span class="team-option-meta">{{ team.sprintCount }} sprints</span>
                </div>
                <mat-icon class="team-option-icon">{{ getTeamIcon(team.teamName) }}</mat-icon>
              </div>
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      
      <!-- User Menu -->
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
        <mat-icon>account_circle</mat-icon>
        <span class="user-name">{{ authService.userName() }}</span>
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="user-info-header">
          <mat-icon>person</mat-icon>
          <div>
            <div class="user-fullname">{{ authService.userName() }}</div>
            <div class="user-email">{{ authService.userEmail() }}</div>
            <div class="user-role">{{ authService.userRole() }}</div>
          </div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Sign Out</span>
        </button>
      </mat-menu>

      <button mat-icon-button matTooltip="Help">
        <mat-icon>help_outline</mat-icon>
      </button>
    </mat-toolbar>

    <main class="app-content">
      <mat-tab-group animationDuration="200ms" class="main-tabs">

        <!-- Tab 1: Sprint Planning Input -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>edit_note</mat-icon>
            <span>Planning Input</span>
          </ng-template>
          <div class="tab-content">
            <app-sprint-input (evaluate)="onEvaluateRisk($event)"></app-sprint-input>
          </div>
        </mat-tab>

        <!-- Tab 2: Risk Dashboard -->
        <mat-tab [disabled]="!currentAssessment">
          <ng-template mat-tab-label>
            <mat-icon>dashboard</mat-icon>
            <span>Risk Dashboard</span>
            <span class="badge" *ngIf="currentAssessment" [ngClass]="getRiskClass()">
              {{currentAssessment.overallRisk}}
            </span>
          </ng-template>
          <div class="tab-content">
            <app-risk-dashboard
              [assessment]="currentAssessment"
              [metrics]="currentMetrics">
            </app-risk-dashboard>
          </div>
        </mat-tab>

        <!-- Tab 3: Recommendations -->
        <mat-tab [disabled]="!currentAssessment">
          <ng-template mat-tab-label>
            <mat-icon>lightbulb</mat-icon>
            <span>Recommendations</span>
            <span class="count-badge" *ngIf="currentAssessment?.recommendations?.length">
              {{currentAssessment!.recommendations.length}}
            </span>
          </ng-template>
          <div class="tab-content">
            <app-recommendations
              [recommendations]="currentAssessment?.recommendations || []"
              (apply)="onApplyRecommendation($event)">
            </app-recommendations>
          </div>
        </mat-tab>

        <!-- Tab 4: Feasibility Study -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>assignment_turned_in</mat-icon>
            <span>Feasibility</span>
          </ng-template>
          <div class="tab-content">
            <app-feasibility-study></app-feasibility-study>
          </div>
        </mat-tab>

        <!-- Tab 5: Human Feedback -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>feedback</mat-icon>
            <span>Feedback</span>
          </ng-template>
          <div class="tab-content">
            <app-risk-feedback></app-risk-feedback>
          </div>
        </mat-tab>

        <!-- Tab 6: Sprint Comparison -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>compare_arrows</mat-icon>
            <span>Comparison</span>
          </ng-template>
          <div class="tab-content">
            <app-sprint-comparison></app-sprint-comparison>
          </div>
        </mat-tab>

      </mat-tab-group>
    </main>

    <footer class="app-footer">
      <p>Sprint Monitor v1.0 | Deterministic Risk Analysis | For Academic Use</p>
    </footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      color: var(--text-primary);
    }

    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: 72px;
      padding: 0 20px;
      background: linear-gradient(120deg, rgba(13, 95, 88, 0.95), rgba(15, 118, 110, 0.9));
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 24px rgba(10, 42, 42, 0.2);

      mat-icon:first-child {
        margin-right: 10px;
      }

      .title {
        font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
        font-weight: 700;
        font-size: 22px;
        letter-spacing: 0.02em;
      }

      .subtitle {
        margin-left: 10px;
        font-size: 13px;
        opacity: 0.84;
      }

      .spacer {
        flex: 1;
      }

      .team-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-right: 12px;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 4px 10px;

        .team-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: rgba(255, 255, 255, 0.92);
          margin-right: 0;
        }

        .team-field {
          width: 240px;

          ::ng-deep .mat-mdc-form-field-subscript-wrapper {
            display: none;
          }

          ::ng-deep .mdc-notched-outline__leading,
          ::ng-deep .mdc-notched-outline__notch,
          ::ng-deep .mdc-notched-outline__trailing {
            border-color: rgba(255, 255, 255, 0.22) !important;
          }

          ::ng-deep .mat-mdc-select-trigger {
            min-height: 30px;
          }

          ::ng-deep .mat-mdc-select-value-text,
          ::ng-deep .mat-mdc-select-arrow {
            color: #fff;
          }
        }

        .selected-team-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .selected-team-name {
          font-size: 13px;
          font-weight: 700;
          max-width: 136px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .team-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.24);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }


      .team-option-row {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;

        .team-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #d7f1ee;
          color: #0d5f58;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .team-option-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .team-option-name {
          font-size: 13px;
          font-weight: 700;
          color: #11313a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .team-option-meta {
          font-size: 11px;
          color: #54707a;
        }

        .team-option-icon {
          color: #0f766e;
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
        .team-select {
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          padding: 2px 4px;

          option {
            color: #333;
            background: white;
          }
        }
      }

      .user-menu-btn {
        color: white;
        border-radius: 10px;

        &:hover {
          background: rgba(255, 255, 255, 0.14);
        }
        
        .user-name {
          margin: 0 4px;
        }
      }

      ::ng-deep .team-select-panel {
        border-radius: 12px !important;
        border: 1px solid rgba(15, 118, 110, 0.16);
        overflow: hidden;
      }

      ::ng-deep .team-select-panel .mat-mdc-option {
        min-height: 52px;
      }

      ::ng-deep .team-select-panel .mat-mdc-option.mdc-list-item--selected {
        background: #e9f7f5;
      }
    }

    .user-info-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(180deg, #eef7f6, #f8fdfd);

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--brand);
      }

      .user-fullname {
        font-weight: 500;
      }

      .user-email {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
      }

      .user-role {
        font-size: 11px;
        color: var(--brand);
        text-transform: uppercase;
      }
    }

    .app-content {
      flex: 1;
      padding: 20px;
      display: flex;
      justify-content: center;
    }

    .main-tabs {
      width: min(1320px, 100%);
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(15, 35, 42, 0.08);
      box-shadow: 0 18px 36px rgba(11, 34, 38, 0.1);
      background: rgba(255, 255, 255, 0.76);
      backdrop-filter: blur(8px);

      ::ng-deep .mat-mdc-tab-labels {
        background: rgba(247, 251, 250, 0.92);
        border-bottom: 1px solid rgba(15, 35, 42, 0.08);
      }

      ::ng-deep .mat-mdc-tab {
        min-width: 160px;
        font-weight: 600;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    .tab-content {
      padding: 22px;
      min-height: 0;
      background: transparent;
      animation: riseIn 0.35s ease-out;
    }

    .badge {
      margin-left: 8px;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;

      &.low { background: #dcfce7; color: #166534; }
      &.medium { background: #ffedd5; color: #9a3412; }
      &.high { background: #fee2e2; color: #991b1b; }
    }

    .count-badge {
      margin-left: 8px;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }

    .app-footer {
      background: linear-gradient(180deg, rgba(10, 34, 36, 0.96), rgba(15, 45, 49, 0.98));
      color: #c8d5d8;
      text-align: center;
      padding: 18px;
      font-size: 12px;

      p {
        margin: 0;
        letter-spacing: 0.02em;
      }
    }

    @media (max-width: 960px) {
      .app-toolbar {
        padding: 0 10px;

        .subtitle,
        .user-name {
          display: none;
        }

        .team-selector {
          max-width: 185px;
          overflow: hidden;

          .team-field {
            width: 150px;
          }

          .selected-team-name {
            max-width: 88px;
          }
        }
      }

      .app-content {
        padding: 12px;
      }

      .tab-content {
        padding: 14px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  @ViewChild(SprintInputComponent) sprintInput!: SprintInputComponent;
  
  private sprintService = inject(SprintService);
  private metricsService = inject(MetricsService);
  private riskEngine = inject(RiskEngineService);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);
  teamService = inject(TeamService);

  currentAssessment: RiskAssessment | null = null;
  currentMetrics: SprintMetrics | null = null;
  currentPlanningInput: SprintPlanningInput | null = null;
  isLoading = false;
  private activeSnackBarRef: MatSnackBarRef<TextOnlySnackBar> | null = null;

  teams: TeamDto[] = [];
  selectedTeamId: number = 1;

  ngOnInit(): void {
    this.teamService.loadTeams();

    // Load available teams and keep in sync
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

  /**
   * Handle team selection change from toolbar dropdown
   */
  onTeamChange(): void {
    const team = this.teams.find(t => t.teamId === +this.selectedTeamId);
    if (team) {
      this.teamService.setSelectedTeam(team);
      // Reset current assessment when switching teams
      this.currentAssessment = null;
      this.currentMetrics = null;
      this.currentPlanningInput = null;
      this.showSnackBar(`Switched to team: ${team.teamName}`, 'OK', 2500);
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Handle risk evaluation request from SprintInputComponent
   * Uses API-based evaluation with fallback to local calculation
   */
  onEvaluateRisk(input: SprintPlanningInput): void {
    this.dismissActiveSnackBar();
    this.isLoading = true;
    this.currentPlanningInput = input; // Store for recommendation application

    // Use API-based evaluation
    this.riskEngine.evaluateRiskViaApi(
      input.plannedStoryPoints,
      input.teamAvailability,
      input.teamSize,
      input.externalDependencies,
      input.sprintId
    ).subscribe({
      next: (assessment) => {
        this.currentAssessment = assessment;

        // Calculate metrics for display (can also come from API response)
        this.currentMetrics = this.metricsService.calculateMetrics(
          input.historicalSprints,
          input.plannedStoryPoints
        );

        this.isLoading = false;

        // Show notification
        const riskColor = this.getRiskClass();
        this.showSnackBar(
          `Risk Assessment Complete: ${this.currentAssessment.overallRisk} RISK`,
          'View',
          4000,
          [`snackbar-${riskColor}`]
        );

        console.log('📊 Sprint Metrics:', this.currentMetrics);
        console.log('⚠️ Risk Assessment:', this.currentAssessment);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Risk evaluation failed:', err);

        // Fallback to local calculation
        this.currentMetrics = this.metricsService.calculateMetrics(
          input.historicalSprints,
          input.plannedStoryPoints
        );
        this.currentAssessment = this.riskEngine.evaluateRisk(
          this.currentMetrics,
          input.plannedStoryPoints,
          input.teamAvailability
        );

        this.showSnackBar('Using offline mode - API unavailable', 'OK', 3000);
      }
    });
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

  /** Dismiss any currently visible snackbar */
  private dismissActiveSnackBar(): void {
    if (this.activeSnackBarRef) {
      this.activeSnackBarRef.dismiss();
      this.activeSnackBarRef = null;
    }
  }

  /** Show a snackbar, dismissing any existing one first */
  private showSnackBar(message: string, action: string, duration: number, panelClass?: string[]): MatSnackBarRef<TextOnlySnackBar> {
    this.dismissActiveSnackBar();
    this.activeSnackBarRef = this.snackBar.open(message, action, {
      duration,
      panelClass: panelClass || []
    });
    return this.activeSnackBarRef;
  }

  /**
   * Handle apply recommendation action from RecommendationsComponent
   * Applies the recommended change and re-evaluates risk
   */
  onApplyRecommendation(recommendation: Recommendation): void {
    if (!this.sprintInput || !this.currentPlanningInput) {
      this.showSnackBar('No planning data available. Please evaluate a sprint first.', 'OK', 3000);
      return;
    }

    const form = this.sprintInput.planningForm;
    const currentPlannedPoints = form.get('plannedPoints')?.value || 0;
    const currentAvailability = form.get('teamAvailability')?.value || 100;

    switch (recommendation.actionType) {
      case ActionType.ADD_BUFFER:
        // Reserve Buffer for Unplanned Work: Reduce planned points by 15-20% buffer
        const bufferPercentage = 0.15; // 15% buffer for unplanned work
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
        
        console.log(`🛡️ Buffer Applied: ${currentPlannedPoints} → ${adjustedPoints} (${bufferPoints} points reserved)`);
        break;

      case ActionType.REDUCE_SCOPE:
        // Reduce Scope: Parse suggested change or reduce by 10-15%
        let reduction = Math.ceil(currentPlannedPoints * 0.10);
        if (recommendation.suggestedChange) {
          // Try to parse numeric value from suggested change (e.g., "Reduce by 5 points")
          const match = recommendation.suggestedChange.match(/(\d+)/);
          if (match) {
            reduction = parseInt(match[1], 10);
          }
        }
        const reducedPoints = Math.max(0, currentPlannedPoints - reduction);
        
        form.patchValue({ plannedPoints: reducedPoints });
        
        this.showSnackBar(
          `Scope reduced: ${currentPlannedPoints} → ${reducedPoints} points`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        
        console.log(`📉 Scope Reduced: ${currentPlannedPoints} → ${reducedPoints} points`);
        break;

      case ActionType.SPLIT_STORIES:
        // Split Stories: Provide guidance but no automatic change
        this.showSnackBar(
          'Consider breaking large stories into smaller, manageable pieces (3-5 points each)',
          'Got it',
          6000
        );
        console.log('✂️ Split Stories recommendation noted');
        break;

      case ActionType.RESOLVE_DEPENDENCIES:
        // Reduce dependencies: Decrement external dependencies count
        const currentDeps = form.get('externalDependencies')?.value || 0;
        const reducedDeps = Math.max(0, currentDeps - 1);
        
        form.patchValue({ externalDependencies: reducedDeps });
        
        this.showSnackBar(
          `Dependencies updated: ${currentDeps} → ${reducedDeps}. Work with dependent teams to resolve blockers.`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        
        console.log(`🔗 Dependencies Resolved: ${currentDeps} → ${reducedDeps}`);
        break;

      case ActionType.INCREASE_CAPACITY:
        // Increase capacity: Suggest improving availability
        const suggestedAvailability = Math.min(100, currentAvailability + 10);
        
        form.patchValue({ teamAvailability: suggestedAvailability });
        
        this.showSnackBar(
          `Team availability adjusted: ${currentAvailability}% → ${suggestedAvailability}%. Consider adding resources or reducing PTO.`,
          'Re-evaluate',
          5000
        ).onAction().subscribe(() => {
          this.sprintInput.onSubmit();
        });
        
        console.log(`👥 Capacity Increased: ${currentAvailability}% → ${suggestedAvailability}%`);
        break;

      case ActionType.IMPROVE_ESTIMATION:
        // Improve estimation: Guidance only
        this.showSnackBar(
          'Use Planning Poker and historical data for more accurate estimates. Break down ambiguous items.',
          'Got it',
          6000
        );
        console.log('📏 Improve Estimation recommendation noted');
        break;

      default:
        this.showSnackBar(
          `Recommendation "${recommendation.title}" noted. Review and apply manually.`,
          'OK',
          4000
        );
        break;
    }

    // Mark recommendation as applied in UI (remove from list)
    if (this.currentAssessment) {
      this.currentAssessment.recommendations = this.currentAssessment.recommendations.filter(
        r => r.id !== recommendation.id
      );
    }
  }
}
