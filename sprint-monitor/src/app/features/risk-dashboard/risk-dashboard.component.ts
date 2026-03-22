import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import {
  RiskAssessment,
  RiskLevel,
  RiskFactor,
  AssessmentConfidence
} from '../../core/models/risk.model';
import { SprintMetrics } from '../../core/models/sprint.model';
import { getRiskLevelColor, getRiskLevelLabel } from '../../core/utils/rules.util';

/**
 * Risk Dashboard Component
 * Displays the risk assessment results with visual indicators.
 * Shows risk badge, computed metrics, and factor breakdown.
 */
@Component({
  selector: 'app-risk-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './risk-dashboard.component.html',
  styleUrls: ['./risk-dashboard.component.scss']
})
export class RiskDashboardComponent implements OnChanges {
  @Input() assessment: RiskAssessment | null = null;
  @Input() metrics: SprintMetrics | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // React to input changes if needed
  }

  getRiskClass(): string {
    if (!this.assessment) return '';
    return this.assessment.overallRisk.toLowerCase();
  }

  getRiskIcon(): string {
    if (!this.assessment) return 'help';
    switch (this.assessment.overallRisk) {
      case RiskLevel.LOW: return 'check_circle';
      case RiskLevel.MEDIUM: return 'warning';
      case RiskLevel.HIGH: return 'error';
    }
  }

  getRiskLabel(): string {
    if (!this.assessment) return '';
    return getRiskLevelLabel(this.assessment.overallRisk);
  }

  getConfidenceClass(): string {
    if (!this.assessment) return '';
    return this.assessment.confidence.toLowerCase() + '-confidence';
  }

  getConfidenceIcon(): string {
    if (!this.assessment) return 'help';
    switch (this.assessment.confidence) {
      case AssessmentConfidence.HIGH: return 'verified';
      case AssessmentConfidence.MEDIUM: return 'thumb_up';
      case AssessmentConfidence.LOW: return 'priority_high';
    }
  }

  // Metric styling helpers
  getCVRClass(): string {
    if (!this.metrics) return '';
    if (this.metrics.cvr <= 1.0) return 'good';
    if (this.metrics.cvr <= 1.1) return 'warning';
    return 'danger';
  }

  getCVRProgress(): number {
    if (!this.metrics) return 0;
    return Math.min(100, (this.metrics.cvr / 1.5) * 100);
  }

  getCVRProgressColor(): 'primary' | 'accent' | 'warn' {
    if (!this.metrics) return 'primary';
    if (this.metrics.cvr <= 1.0) return 'primary';
    if (this.metrics.cvr <= 1.1) return 'accent';
    return 'warn';
  }

  getStabilityClass(): string {
    if (!this.metrics) return '';
    const cv = this.metrics.velocityCoefficient;
    if (cv <= 0.15) return 'good';
    if (cv <= 0.25) return 'warning';
    return 'danger';
  }

  getSpilloverClass(): string {
    if (!this.metrics) return '';
    if (this.metrics.spilloverRate < 20) return 'good';
    if (this.metrics.spilloverRate <= 40) return 'warning';
    return 'danger';
  }

  getSpilloverProgressColor(): 'primary' | 'accent' | 'warn' {
    if (!this.metrics) return 'primary';
    if (this.metrics.spilloverRate < 20) return 'primary';
    if (this.metrics.spilloverRate <= 40) return 'accent';
    return 'warn';
  }

  // Factor styling helpers
  getFactorScoreClass(score: number): string {
    return `score-${score}`;
  }

  getFactorColor(score: number): 'primary' | 'accent' | 'warn' {
    if (score <= 1) return 'primary';
    if (score === 2) return 'accent';
    return 'warn';
  }
}
