import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  RiskAssessment,
  RiskLevel,
  RiskFactor,
  AssessmentConfidence
} from '../../core/models/risk.model';
import { SprintMetrics } from '../../core/models/sprint.model';
import { getRiskLevelLabel } from '../../core/utils/rules.util';

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
    MatIconModule
  ],
  templateUrl: './risk-dashboard.component.html',
  styleUrls: ['./risk-dashboard.component.scss']
})
export class RiskDashboardComponent implements OnChanges {
  @Input() assessment: RiskAssessment | null = null;
  @Input() metrics: SprintMetrics | null = null;
  @Output() finalizeRequested = new EventEmitter<void>();

  detailsExpanded = false;

  ngOnChanges(_: SimpleChanges): void {
    this.detailsExpanded = false;
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

  canMarkFinal(): boolean {
    return !!this.assessment?.assessmentId && !this.assessment?.isFinal;
  }

  onMarkFinal(): void {
    this.finalizeRequested.emit();
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

  getSpilloverProgress(): number {
    if (!this.metrics) return 0;
    return Math.min(100, this.metrics.spilloverRate);
  }

  getTopContributingFactor(): RiskFactor | null {
    if (!this.assessment?.factors?.length) {
      return null;
    }

    return [...this.assessment.factors].sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.metricValue - left.metricValue;
    })[0];
  }

  getTopContributingFactorTitle(): string {
    const factor = this.getTopContributingFactor();
    return factor ? factor.name : 'No factor available';
  }

  getTopContributingFactorMetric(): string {
    const factor = this.getTopContributingFactor();
    if (!factor) {
      return 'N/A';
    }

    return `${factor.metricValue.toFixed(1)}${factor.name.includes('Availability') || factor.name.includes('Spillover') ? '%' : ''}`;
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

  /** Returns a CSS class for the ML confidence bar based on confidence level */
  getConfidenceBarClass(): string {
    const confidence = this.assessment?.mlConfidence ?? 0;
    if (confidence >= 0.75) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-medium';
    return 'confidence-low';
  }
}
