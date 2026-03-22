import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RiskFeedback,
  CreateRiskFeedback,
  PredictionAccuracy,
  SprintComparisonAnalysis,
  CalibrationStatus
} from '../models/feedback.model';

/**
 * Risk Feedback Service
 * Manages human relevance feedback for prediction accuracy and system calibration
 */
@Injectable({
  providedIn: 'root'
})
export class RiskFeedbackService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/riskfeedback`;

  /**
   * Submit feedback for a risk assessment
   */
  submitFeedback(feedback: CreateRiskFeedback): Observable<RiskFeedback> {
    return this.http.post<RiskFeedback>(this.baseUrl, feedback);
  }

  /**
   * Get feedback by ID
   */
  getFeedbackById(feedbackId: number): Observable<RiskFeedback> {
    return this.http.get<RiskFeedback>(`${this.baseUrl}/${feedbackId}`);
  }

  /**
   * Get all feedbacks for a team
   */
  getFeedbacksForTeam(teamId: number): Observable<RiskFeedback[]> {
    return this.http.get<RiskFeedback[]>(`${this.baseUrl}/team/${teamId}`);
  }

  /**
   * Get feedback for a specific assessment
   */
  getFeedbackForAssessment(assessmentId: number): Observable<RiskFeedback> {
    return this.http.get<RiskFeedback>(`${this.baseUrl}/assessment/${assessmentId}`);
  }

  /**
   * Get prediction accuracy statistics for a team
   */
  getPredictionAccuracy(teamId: number): Observable<PredictionAccuracy> {
    return this.http.get<PredictionAccuracy>(`${this.baseUrl}/team/${teamId}/accuracy`);
  }

  /**
   * Get comparison of last 3 sprint assessments
   */
  getSprintComparison(teamId: number): Observable<SprintComparisonAnalysis> {
    return this.http.get<SprintComparisonAnalysis>(`${this.baseUrl}/team/${teamId}/comparison`);
  }

  /**
   * Get calibration status for a team
   */
  getCalibrationStatus(teamId: number): Observable<CalibrationStatus> {
    return this.http.get<CalibrationStatus>(`${this.baseUrl}/team/${teamId}/calibration`);
  }

  /**
   * Mark feedback as used for calibration
   */
  markAsUsedForCalibration(feedbackId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${feedbackId}/mark-calibrated`, {});
  }

  /**
   * Get risk level color (overloaded to accept number for accuracy percentage)
   */
  getRiskColor(risk: string): string {
    switch (risk?.toLowerCase()) {
      case 'low': return 'low';
      case 'medium': case 'moderate': return 'medium';
      case 'high': return 'high';
      case 'critical': return 'high';
      default: return 'low';
    }
  }

  /**
   * Get accuracy level color based on percentage
   */
  getAccuracyColor(value: number): string {
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'danger';
  }

  /**
   * Get trend icon
   */
  getTrendIcon(trend: string): string {
    switch (trend?.toLowerCase()) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  }
}
