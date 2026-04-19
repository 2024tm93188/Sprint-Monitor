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
}
