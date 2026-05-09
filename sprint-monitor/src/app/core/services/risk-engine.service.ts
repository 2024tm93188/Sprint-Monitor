import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { SprintMetrics } from '../models/sprint.model';
import {
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  Recommendation,
  RecommendationPriority,
  ActionType,
  AssessmentConfidence,
  RISK_THRESHOLDS
} from '../models/risk.model';
import {
  scoreCVR,
  scoreVelocityVariance,
  scoreSpilloverRate,
  scoreCapacityUtilization,
  scoreTeamAvailability,
  determineRiskLevel
} from '../utils/rules.util';
import { MetricsService } from './metrics.service';
import { ApiService, RiskAssessmentRequestDto } from './api.service';
import { SprintService } from './sprint.service';

/**
 * Risk Engine Service
 * Core evaluation engine that aggregates metrics into risk assessment.
 * Can use either API-based evaluation or local calculation.
 *
 * SCORING SYSTEM:
 * - Each factor contributes 0-3 points
 * - Total score determines overall risk level
 * - All thresholds are based on industry-standard Agile metrics
 */
@Injectable({
  providedIn: 'root'
})
export class RiskEngineService {
  private metricsService = inject(MetricsService);
  private apiService = inject(ApiService);
  private sprintService = inject(SprintService);

  /** Flag to use API for risk evaluation */
  private useApiEvaluation = true;

  /**
   * Evaluate risk using API
   * Falls back to local calculation if API fails
   */
  evaluateRiskViaApi(
    plannedPoints: number,
    teamAvailability: number,
    teamSize: number,
    externalDependencies: number,
    meetingHoursPerSprint: number,
    newMembersCount: number,
    avgExperienceLevel: number,
    collaborationScore: number,
    sprintId?: number
  ): Observable<RiskAssessment> {
    if (!this.useApiEvaluation) {
      // Use local calculation
      const sprints = this.sprintService.getHistoricalSprintsSnapshot();
      const metrics = this.metricsService.calculateMetrics(sprints, plannedPoints, teamAvailability, externalDependencies);
      return of(this.evaluateRisk(metrics, plannedPoints, teamAvailability));
    }

    const request: RiskAssessmentRequestDto = {
      teamId: this.sprintService.getCurrentTeamId(),
      sprintId: sprintId || undefined,
      plannedCommitment: plannedPoints,
      teamAvailability,
      externalDependencies,
      teamSize,
      meetingHoursPerSprint,
      newMembersCount,
      avgExperienceLevel,
      collaborationScore
    };

    return this.apiService.evaluateRisk(request).pipe(
      map(response => this.mapApiResponseToAssessment(response)),
      catchError(err => {
        console.warn('API evaluation failed, falling back to local calculation:', err);
        const sprints = this.sprintService.getHistoricalSprintsSnapshot();
        const metrics = this.metricsService.calculateMetrics(sprints, plannedPoints, teamAvailability, externalDependencies);
        return of(this.evaluateRisk(metrics, plannedPoints, teamAvailability));
      })
    );
  }

  /**
   * Map API response to internal RiskAssessment model
   */
  private mapApiResponseToAssessment(response: any): RiskAssessment {
    const baseScore = Number(response.totalScore ?? 0);
    return {
      assessmentId: response.assessmentId,
      teamId: response.teamId,
      sprintId: response.sprintId,
      sprintNumber: response.sprintNumber,
      iteration: response.iteration,
      isFinal: response.isFinal,
      overallRisk: response.riskLevel as RiskLevel,
      mlRisk: response.mlRiskLevel ? response.mlRiskLevel as RiskLevel : null,
      finalRisk: response.finalRiskLevel ? response.finalRiskLevel as RiskLevel : null,
      mlConfidence: response.mlConfidence ?? null,
      teamSize: response.teamSize,
      meetingHoursPerSprint: response.meetingHoursPerSprint,
      newMembersCount: response.newMembersCount,
      avgExperienceLevel: response.avgExperienceLevel,
      collaborationScore: response.collaborationScore,
      teamDynamicsScore: response.teamDynamicsScore,
      teamCondition: response.teamCondition,
      totalScore: response.totalScore,
      maxPossibleScore: response.maxPossibleScore,
      confidence: response.confidence as AssessmentConfidence,
      feedbackCalibrationFactor: response.feedbackCalibrationFactor,
      feedbackSampleSize: response.feedbackSampleSize,
      factors: response.factors.map((f: any) => ({
        name: f.factorName,
        score: f.score,
        description: f.description,
        metricValue: f.metricValue,
        threshold: f.threshold
      })),
      recommendations: response.recommendations.map((r: any) => {
        const recommendation: Recommendation = {
          id: r.recommendationId.toString(),
          title: r.title,
          description: r.description,
          priority: r.priority as RecommendationPriority,
          actionType: r.actionType as ActionType,
          suggestedChange: r.suggestedChange,
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

        if (recommendation.beforeScore === undefined || recommendation.afterScore === undefined) {
          const delta = recommendation.estimatedScoreChange ?? this.estimateScoreChange(recommendation);
          const before = Math.round(baseScore * 100) / 100;
          const after = Math.max(0, Math.round((before - delta) * 100) / 100);

          recommendation.beforeScore = before;
          recommendation.afterScore = after;
          recommendation.beforeRiskLevel = recommendation.beforeRiskLevel ?? determineRiskLevel(before);
          recommendation.afterRiskLevel = recommendation.afterRiskLevel ?? determineRiskLevel(after);
          recommendation.estimatedScoreChange = recommendation.estimatedScoreChange ?? Math.round(delta * 100) / 100;
        }

        return recommendation;
      }),
      assessedAt: new Date(response.assessedAt)
    };
  }

  /**
   * Toggle between API and local evaluation
   */
  setUseApiEvaluation(useApi: boolean): void {
    this.useApiEvaluation = useApi;
  }

  /**
   * Perform complete risk evaluation (local calculation)
   *
   * @param metrics - Computed sprint metrics
   * @param plannedPoints - Story points planned for sprint
   * @param teamAvailability - Team availability percentage (0-100)
   * @returns Complete risk assessment with recommendations
   */
  evaluateRisk(
    metrics: SprintMetrics,
    plannedPoints: number,
    teamAvailability: number
  ): RiskAssessment {
    // Step 1: Score each risk factor
    const factors = this.scoreAllFactors(metrics, plannedPoints, teamAvailability);

    // Step 2: Calculate total score
    const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
    const maxPossibleScore = factors.length * 3; // Each factor can contribute max 3 points

    // Step 3: Determine overall risk level
    const overallRisk = determineRiskLevel(totalScore);

    // Step 4: Generate recommendations based on findings
    const recommendations = this.generateRecommendations(
      factors,
      metrics,
      plannedPoints,
      overallRisk,
      totalScore
    );

    // Step 5: Assess confidence based on data quality
    const confidence = this.assessConfidence(metrics.sprintCount);

    return {
      isFinal: false,
      overallRisk,
      totalScore,
      maxPossibleScore,
      factors,
      recommendations,
      assessedAt: new Date(),
      confidence
    };
  }

  /**
   * Score all risk factors and return detailed breakdown
   */
  private scoreAllFactors(
    metrics: SprintMetrics,
    plannedPoints: number,
    teamAvailability: number
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // 1. CVR (Commitment-to-Velocity Ratio)
    const cvrScore = scoreCVR(metrics.cvr);
    factors.push({
      name: 'Commitment-to-Velocity Ratio (CVR)',
      score: cvrScore,
      description: this.getCVRDescription(metrics.cvr, cvrScore),
      metricValue: metrics.cvr,
      threshold: RISK_THRESHOLDS.CVR.LOW_MAX
    });

    // 2. Velocity Variance
    const varianceScore = scoreVelocityVariance(metrics.velocityCoefficient);
    factors.push({
      name: 'Velocity Stability',
      score: varianceScore,
      description: this.getVarianceDescription(metrics.velocityCoefficient, varianceScore),
      metricValue: metrics.velocityCoefficient * 100, // Show as percentage
      threshold: RISK_THRESHOLDS.VELOCITY_CV.LOW_MAX * 100
    });

    // 3. Spillover Rate
    const spilloverScore = scoreSpilloverRate(metrics.spilloverRate);
    factors.push({
      name: 'Historical Spillover Rate',
      score: spilloverScore,
      description: this.getSpilloverDescription(metrics.spilloverRate, spilloverScore),
      metricValue: metrics.spilloverRate,
      threshold: RISK_THRESHOLDS.SPILLOVER.LOW_MAX
    });

    // 4. Capacity Utilization
    const capacityScore = scoreCapacityUtilization(plannedPoints, metrics.effectiveCapacity);
    factors.push({
      name: 'Capacity Buffer Utilization',
      score: capacityScore,
      description: this.getCapacityDescription(plannedPoints, metrics.effectiveCapacity, capacityScore),
      metricValue: metrics.effectiveCapacity > 0
        ? (plannedPoints / metrics.effectiveCapacity) * 100
        : 0,
      threshold: 100 // 100% of effective capacity
    });

    // 5. Team Availability
    const availabilityScore = scoreTeamAvailability(teamAvailability);
    factors.push({
      name: 'Team Availability',
      score: availabilityScore,
      description: this.getAvailabilityDescription(teamAvailability, availabilityScore),
      metricValue: teamAvailability,
      threshold: 90
    });

    return factors;
  }

  /**
   * Generate actionable recommendations based on risk factors
   */
  private generateRecommendations(
    factors: RiskFactor[],
    metrics: SprintMetrics,
    plannedPoints: number,
    overallRisk: RiskLevel,
    currentScore: number
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check each factor and add relevant recommendations
    factors.forEach(factor => {
      if (factor.score >= 2) {
        // High-scoring factors need attention
        const recs = this.getRecommendationsForFactor(factor, metrics, plannedPoints);
        recommendations.push(...recs);
      }
    });

    // Add general recommendations based on overall risk
    if (overallRisk === RiskLevel.HIGH) {
      recommendations.push({
        id: 'general-reduce',
        title: 'Significantly Reduce Sprint Scope',
        description: `Overall risk is HIGH. Consider reducing commitment to ${Math.round(metrics.effectiveCapacity)} points (your effective capacity with buffer).`,
        priority: RecommendationPriority.CRITICAL,
        addressesRiskFactor: 'Overall',
        actionType: ActionType.REDUCE_SCOPE,
        suggestedChange: `Reduce by ${plannedPoints - Math.round(metrics.effectiveCapacity)} points`
      });
    } else if (overallRisk === RiskLevel.MEDIUM && recommendations.length === 0) {
      recommendations.push({
        id: 'general-buffer',
        title: 'Add Buffer for Uncertainty',
        description: 'Consider reserving 10-20% of capacity for unplanned work and uncertainties.',
        priority: RecommendationPriority.MEDIUM,
        addressesRiskFactor: 'Overall',
        actionType: ActionType.ADD_BUFFER
      });
    }

    // Sort by priority
    return this.decorateRecommendationImpact(
      recommendations.sort((a, b) =>
        this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority)
      ),
      currentScore
    );
  }

  /**
   * Get specific recommendations for a risk factor
   */
  private getRecommendationsForFactor(
    factor: RiskFactor,
    metrics: SprintMetrics,
    plannedPoints: number
  ): Recommendation[] {
    const recs: Recommendation[] = [];

    switch (factor.name) {
      case 'Commitment-to-Velocity Ratio (CVR)':
        const pointsToReduce = this.metricsService.calculatePointsToReduce(
          plannedPoints,
          metrics.averageVelocity
        );
        if (pointsToReduce > 0) {
          recs.push({
            id: 'cvr-reduce',
            title: 'Reduce Commitment to Match Velocity',
            description: `Your CVR of ${metrics.cvr.toFixed(2)} indicates overcommitment. Reduce planned points to align with your average velocity of ${metrics.averageVelocity}.`,
            priority: factor.score >= 3 ? RecommendationPriority.CRITICAL : RecommendationPriority.HIGH,
            addressesRiskFactor: factor.name,
            actionType: ActionType.REDUCE_SCOPE,
            suggestedChange: `Reduce by ${pointsToReduce} points`
          });
        }
        break;

      case 'Velocity Stability':
        recs.push({
          id: 'variance-improve',
          title: 'Improve Estimation Practices',
          description: `High velocity variance (${(factor.metricValue).toFixed(1)}%) indicates inconsistent estimates. Consider planning poker or breaking down large stories.`,
          priority: RecommendationPriority.HIGH,
          addressesRiskFactor: factor.name,
          actionType: ActionType.IMPROVE_ESTIMATION
        });
        recs.push({
          id: 'variance-split',
          title: 'Split Large Stories',
          description: 'Large stories (>8 points) are harder to estimate accurately. Split them into smaller, more predictable pieces.',
          priority: RecommendationPriority.MEDIUM,
          addressesRiskFactor: factor.name,
          actionType: ActionType.SPLIT_STORIES
        });
        break;

      case 'Historical Spillover Rate':
        recs.push({
          id: 'spillover-conservative',
          title: 'Commit More Conservatively',
          description: `${factor.metricValue.toFixed(0)}% of recent sprints had spillover. Commit to 80% of velocity to break this pattern.`,
          priority: RecommendationPriority.HIGH,
          addressesRiskFactor: factor.name,
          actionType: ActionType.ADD_BUFFER,
          suggestedChange: `Target ${Math.round(metrics.effectiveCapacity)} points`
        });
        break;

      case 'Capacity Buffer Utilization':
        recs.push({
          id: 'capacity-buffer',
          title: 'Reserve Buffer for Unplanned Work',
          description: 'You\'re exceeding your effective capacity. The 80% rule reserves time for meetings, code reviews, and unexpected issues.',
          priority: RecommendationPriority.HIGH,
          addressesRiskFactor: factor.name,
          actionType: ActionType.REDUCE_SCOPE,
          suggestedChange: `Limit to ${Math.round(metrics.effectiveCapacity)} points`
        });
        break;

      case 'Team Availability':
        recs.push({
          id: 'availability-adjust',
          title: 'Adjust for Reduced Availability',
          description: `Team availability at ${factor.metricValue}% means you should reduce commitment proportionally.`,
          priority: RecommendationPriority.HIGH,
          addressesRiskFactor: factor.name,
          actionType: ActionType.REDUCE_SCOPE,
          suggestedChange: `Reduce by ${Math.round((100 - factor.metricValue) / 100 * plannedPoints)} points`
        });
        break;
    }

    return recs;
  }

  /**
   * Assess confidence level based on available data
   */
  private assessConfidence(sprintCount: number): AssessmentConfidence {
    if (sprintCount >= RISK_THRESHOLDS.MIN_SPRINTS_FOR_HIGH_CONFIDENCE) {
      return AssessmentConfidence.HIGH;
    } else if (sprintCount >= RISK_THRESHOLDS.MIN_SPRINTS_FOR_MEDIUM_CONFIDENCE) {
      return AssessmentConfidence.MEDIUM;
    }
    return AssessmentConfidence.LOW;
  }

  /**
   * Helper: Get priority weight for sorting
   */
  private getPriorityWeight(priority: RecommendationPriority): number {
    const weights = {
      [RecommendationPriority.CRITICAL]: 0,
      [RecommendationPriority.HIGH]: 1,
      [RecommendationPriority.MEDIUM]: 2,
      [RecommendationPriority.LOW]: 3
    };
    return weights[priority];
  }

  private decorateRecommendationImpact(recommendations: Recommendation[], currentScore: number): Recommendation[] {
    return recommendations.map(recommendation => {
      const estimatedScoreChange = this.estimateScoreChange(recommendation);
      const afterScore = Math.max(0, Math.round((currentScore - estimatedScoreChange) * 100) / 100);

      return {
        ...recommendation,
        beforeScore: Math.round(currentScore * 100) / 100,
        afterScore,
        beforeRiskLevel: determineRiskLevel(currentScore),
        afterRiskLevel: determineRiskLevel(afterScore),
        estimatedScoreChange: Math.round(estimatedScoreChange * 100) / 100
      };
    });
  }

  private estimateScoreChange(recommendation: Recommendation): number {
    if (recommendation.suggestedChange) {
      const match = recommendation.suggestedChange.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return Math.max(0.5, Math.min(3, parseFloat(match[1]) / 5));
      }
    }

    switch (recommendation.actionType) {
      case ActionType.REDUCE_SCOPE:
        return 1.5;
      case ActionType.ADD_BUFFER:
        return 1.0;
      case ActionType.SPLIT_STORIES:
        return 0.75;
      case ActionType.RESOLVE_DEPENDENCIES:
        return 1.25;
      case ActionType.INCREASE_CAPACITY:
        return 1.0;
      case ActionType.IMPROVE_ESTIMATION:
        return 0.75;
      default:
        return 0.5;
    }
  }

  // Description generators for risk factors
  private getCVRDescription(cvr: number, score: number): string {
    if (score === 0) return `CVR of ${cvr.toFixed(2)} - Committing within your velocity capacity.`;
    if (score === 1) return `CVR of ${cvr.toFixed(2)} - Slight overcommitment, monitor closely.`;
    if (score === 2) return `CVR of ${cvr.toFixed(2)} - Moderate overcommitment detected.`;
    return `CVR of ${cvr.toFixed(2)} - Severe overcommitment! High risk of spillover.`;
  }

  private getVarianceDescription(cv: number, score: number): string {
    const cvPercent = (cv * 100).toFixed(1);
    if (score === 0) return `Velocity CV of ${cvPercent}% - Very stable, reliable for planning.`;
    if (score === 1) return `Velocity CV of ${cvPercent}% - Moderate variation, acceptable.`;
    if (score === 2) return `Velocity CV of ${cvPercent}% - High variation, estimates less reliable.`;
    return `Velocity CV of ${cvPercent}% - Very unstable velocity, difficult to plan accurately.`;
  }

  private getSpilloverDescription(rate: number, score: number): string {
    if (score === 0) return `${rate.toFixed(0)}% spillover rate - Good track record of completion.`;
    if (score === 1) return `${rate.toFixed(0)}% spillover rate - Occasional overcommitment.`;
    if (score === 2) return `${rate.toFixed(0)}% spillover rate - Frequent spillovers indicate systemic issues.`;
    return `${rate.toFixed(0)}% spillover rate - Chronic overcommitment pattern.`;
  }

  private getCapacityDescription(planned: number, effective: number, score: number): string {
    const utilization = effective > 0 ? ((planned / effective) * 100).toFixed(0) : 0;
    if (score === 0) return `Using ${utilization}% of effective capacity - Buffer preserved.`;
    if (score === 1) return `Using ${utilization}% of effective capacity - Buffer partially used.`;
    if (score === 2) return `Using ${utilization}% of effective capacity - No buffer for surprises.`;
    return `Using ${utilization}% of effective capacity - Significantly exceeding safe limit.`;
  }

  private getAvailabilityDescription(availability: number, score: number): string {
    if (score === 0) return `${availability}% availability - Full team present.`;
    if (score === 1) return `${availability}% availability - Some team members unavailable.`;
    return `${availability}% availability - Significant capacity reduction.`;
  }
}
