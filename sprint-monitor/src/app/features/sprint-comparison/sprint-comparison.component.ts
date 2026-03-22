import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskFeedbackService } from '../../core/services/feedback.service';
import { SprintService } from '../../core/services/sprint.service';
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
  private sprintService = inject(SprintService);

  comparison: SprintComparisonAnalysis | null = null;
  loading = false;
  error: string | null = null;
  selectedSprint: SprintComparison | null = null;

  ngOnInit(): void {
    this.loadComparison();
  }

  loadComparison(): void {
    this.loading = true;
    this.error = null;
    
    const teamId = this.sprintService.getCurrentTeamId();
    
    this.feedbackService.getSprintComparison(teamId).subscribe({
      next: (data: SprintComparisonAnalysis) => {
        this.comparison = data;
        this.loading = false;
      },
      error: () => {
        this.comparison = null;
        this.error = 'Could not load sprint comparison data. Please ensure the backend API is running and assessments with feedback exist.';
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

  getVelocityDiff(sprint: SprintComparison): number {
    return (sprint.actualVelocity || 0) - (sprint.predictedVelocity || 0);
  }

  getVelocityDiffClass(sprint: SprintComparison): string {
    const diff = this.getVelocityDiff(sprint);
    if (diff >= 0) return 'positive';
    if (diff >= -5) return 'neutral';
    return 'negative';
  }

  getOverallTrend(): string {
    if (!this.comparison?.sprints || this.comparison.sprints.length < 2) {
      return 'stable';
    }
    
    const sprints = this.comparison.sprints;
    const recentAccuracy = sprints[0]?.accuracyScore || 0;
    const previousAccuracy = sprints[1]?.accuracyScore || 0;
    
    if (recentAccuracy > previousAccuracy + 5) return 'improving';
    if (recentAccuracy < previousAccuracy - 5) return 'declining';
    return 'stable';
  }
}
