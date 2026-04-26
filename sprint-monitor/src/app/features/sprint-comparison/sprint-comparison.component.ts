import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskFeedbackService } from '../../core/services/feedback.service';
import { TeamService } from '../../core/services/team.service';
import { SprintComparisonAnalysis, SprintComparison } from '../../core/models/feedback.model';

@Component({
  selector: 'app-sprint-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sprint-comparison.component.html',
  styleUrl: './sprint-comparison.component.scss'
})
export class SprintComparisonComponent implements OnInit {
  private feedbackService = inject(RiskFeedbackService);
  private teamService = inject(TeamService);

  comparison: SprintComparisonAnalysis | null = null;
  loading = false;
  error: string | null = null;
  selectedSprint: SprintComparison | null = null;
  collapsedRecommendations = new Set<number>();

  ngOnInit(): void {
    // Reload when team changes
    this.teamService.getSelectedTeam().subscribe(team => {
      if (team) this.loadComparison();
    });
  }

  loadComparison(): void {
    this.loading = true;
    this.error = null;

    const teamId = this.teamService.getSelectedTeamId();

    this.feedbackService.getSprintComparison(teamId).subscribe({
      next: (data: SprintComparisonAnalysis) => {
        this.comparison = data;
        this.collapsedRecommendations = new Set(
          data.sprints.map(sprint => sprint.assessmentId)
        );
        this.loading = false;
      },
      error: () => {
        this.comparison = null;
        this.error = 'Could not load sprint comparison data. Please ensure the backend API is running and assessments exist.';
        this.loading = false;
      }
    });
  }

  selectSprint(sprint: SprintComparison): void {
    this.selectedSprint = this.selectedSprint?.sprintId === sprint.sprintId ? null : sprint;
  }

  toggleRecommendations(sprint: SprintComparison): void {
    const key = sprint.assessmentId;
    if (this.collapsedRecommendations.has(key)) {
      this.collapsedRecommendations.delete(key);
      return;
    }
    this.collapsedRecommendations.add(key);
  }

  isRecommendationsExpanded(sprint: SprintComparison): boolean {
    return !this.collapsedRecommendations.has(sprint.assessmentId);
  }

  getMlRiskDisplay(sprint: SprintComparison): string {
    return sprint.mlRisk ?? 'N/A';
  }

  getFinalRiskDisplay(sprint: SprintComparison): string {
    return sprint.finalRisk ?? sprint.predictedRisk ?? 'N/A';
  }

  getRiskClass(level?: string | null): string {
    if (!level) {
      return 'risk-unknown';
    }
    const mapped = this.getRiskColor(level);
    return mapped ? `risk-${mapped}` : 'risk-unknown';
  }

  getRiskColor(level: string): string {
    return this.feedbackService.getRiskColor(level);
  }

  getAccuracyColor(value: number): string {
    return this.feedbackService.getAccuracyColor(value);
  }

  getTrendIcon(trend: string): string {
    return this.feedbackService.getTrendIcon(trend);
  }

  /** Completion rate for a sprint (committed → completed) */
  getCompletionRate(sprint: SprintComparison): number {
    if (sprint.completedPoints === undefined || sprint.completedPoints === null) return 0;
    if (!sprint.committedPoints) return 100;
    return Math.round((sprint.completedPoints / sprint.committedPoints) * 100);
  }

  getCompletionRateClass(sprint: SprintComparison): string {
    const rate = this.getCompletionRate(sprint);
    if (rate >= 95) return 'positive';
    if (rate >= 80) return 'neutral';
    return 'negative';
  }

  getAccuracyLevelColor(level: string): string {
    switch (level) {
      case 'Accurate': return 'success';
      case 'PartiallyAccurate': return 'warning';
      case 'Incorrect': return 'danger';
      default: return 'secondary';
    }
  }

  getAccuracyLevelIcon(level: string): string {
    switch (level) {
      case 'Accurate': return '✅';
      case 'PartiallyAccurate': return '⚠️';
      case 'Incorrect': return '❌';
      default: return '⏳';
    }
  }

  getOverallTrend(): string {
    return this.comparison?.improvementTrend ?? 'STABLE';
  }

  getLatestAppliedRecommendationSprint(): SprintComparison | null {
    if (!this.comparison?.sprints?.length) {
      return null;
    }

    const withAppliedAction = this.comparison.sprints.filter(
      sprint => !!sprint.appliedRecommendationTitle
    );

    if (!withAppliedAction.length) {
      return null;
    }

    return [...withAppliedAction].sort((left, right) => right.sprintNumber - left.sprintNumber)[0];
  }

  formatActionType(actionType?: string): string {
    if (!actionType) {
      return 'Action';
    }

    return actionType
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  abbreviateRisk(level?: string): string {
    if (!level) {
      return 'N/A';
    }

    switch (level.toUpperCase()) {
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MED';
      case 'LOW':
        return 'LOW';
      default:
        return level;
    }
  }

  formatMetric(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.00$/, '');
  }
}
