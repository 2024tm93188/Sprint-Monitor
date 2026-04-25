import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// API Response Types matching .NET backend DTOs
export interface TeamDto {
  teamId: number;
  teamName: string;
  teamSize: number;
  description: string | null;
  createdAt: string;
  isActive: boolean;
  sprintCount: number;
}

export interface SprintDto {
  sprintId: number;
  teamId: number;
  teamName: string;
  sprintNumber: number;
  sprintName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  committedPoints: number;
  completedPoints: number;
  addedPoints: number;
  removedPoints: number;
  teamSize: number;
  teamAvailability: number;
  sprintDuration: number;
  hadSpillover: boolean;
  spilloverPoints: number;
  externalDependencies: number;
  createdAt: string;
}

export interface SprintMetricsDto {
  averageVelocity: number;
  velocityStandardDeviation: number;
  velocityCoefficient: number;
  spilloverRate: number;
  effectiveCapacity: number;
  cvr: number;
  sprintCount: number;
  velocityTrend: string;
  recommendedCommitment: number;
}

export interface RiskFactorDto {
  factorName: string;
  score: number;
  maxScore: number;
  description: string;
  metricValue: number;
  threshold: number | null;
}

export interface RecommendationDto {
  recommendationId: number;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actionType: string;
  suggestedChange: string | null;
  addressesRiskFactor: string;
  beforeScore?: number | null;
  afterScore?: number | null;
  beforeRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  afterRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  estimatedScoreChange?: number | null;
  wasApplied?: boolean;
  appliedAt?: string | null;
  appliedBy?: string | null;
}

export interface ApplyRecommendationRequestDto {
  beforeScore?: number;
  afterScore?: number;
  beforeRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  afterRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  impactScoreChange?: number;
  appliedBy?: string;
}

export interface ApplyRecommendationByMatchRequestDto extends ApplyRecommendationRequestDto {
  teamId: number;
  sprintId?: number;
  title: string;
  actionType?: string;
  addressesRiskFactor?: string;
}

export interface RiskAssessmentRequestDto {
  teamId: number;
  /** Optional: link assessment to a specific existing sprint record */
  sprintId?: number;
  plannedCommitment: number;
  teamAvailability: number;
  externalDependencies: number;
}

export interface RiskAssessmentResponseDto {
  assessmentId: number;
  teamId: number;
  sprintId?: number | null;
  sprintNumber: number;
  iteration: number;
  isFinal: boolean;
  plannedCommitment: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  totalScore: number;
  maxPossibleScore: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: RiskFactorDto[];
  recommendations: RecommendationDto[];
  metrics: SprintMetricsDto;
  feedbackCalibrationFactor?: number;
  feedbackSampleSize?: number;
  assessedAt: string;
}

export interface CreateSprintDto {
  teamId: number;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
  addedPoints?: number;
  removedPoints?: number;
  teamAvailability?: number;
  teamSize?: number;
  sprintDuration?: number;
  hadSpillover: boolean;
  externalDependencies?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * API Service
 * Handles all HTTP communication with the .NET backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  // ---- Teams ----
  getTeams(): Observable<TeamDto[]> {
    return this.http.get<TeamDto[]>(`${this.baseUrl}/teams`);
  }

  getTeam(id: number): Observable<TeamDto> {
    return this.http.get<TeamDto>(`${this.baseUrl}/teams/${id}`);
  }

  createTeam(team: { teamName: string; teamSize: number; description?: string }): Observable<TeamDto> {
    return this.http.post<TeamDto>(`${this.baseUrl}/teams`, team);
  }

  // ---- Sprints ----
  getSprints(teamId: number): Observable<SprintDto[]> {
    return this.http.get<SprintDto[]>(`${this.baseUrl}/sprints/team/${teamId}`);
  }

  getRecentSprints(teamId: number, count: number = 10): Observable<SprintDto[]> {
    return this.http.get<SprintDto[]>(`${this.baseUrl}/sprints/team/${teamId}/recent?count=${count}`);
  }

  getSprint(id: number): Observable<SprintDto> {
    return this.http.get<SprintDto>(`${this.baseUrl}/sprints/${id}`);
  }

  getTeamSprints(teamId: number): Observable<SprintDto[]> {
    return this.http.get<SprintDto[]>(`${this.baseUrl}/sprints/team/${teamId}`);
  }

  createSprint(sprint: CreateSprintDto): Observable<SprintDto> {
    return this.http.post<SprintDto>(`${this.baseUrl}/sprints`, sprint);
  }

  updateSprint(id: number, sprint: Partial<CreateSprintDto>): Observable<SprintDto> {
    return this.http.put<SprintDto>(`${this.baseUrl}/sprints/${id}`, sprint);
  }

  deleteSprint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sprints/${id}`);
  }

  // ---- Metrics ----
  getTeamMetrics(teamId: number, plannedPoints: number = 0): Observable<SprintMetricsDto> {
    return this.http.get<SprintMetricsDto>(`${this.baseUrl}/metrics/team/${teamId}?plannedPoints=${plannedPoints}`);
  }

  // ---- Risk Assessment ----
  evaluateRisk(request: RiskAssessmentRequestDto): Observable<RiskAssessmentResponseDto> {
    return this.http.post<RiskAssessmentResponseDto>(
      `${this.baseUrl}/riskassessment/evaluate`,
      request
    );
  }

  getAssessmentHistory(teamId: number): Observable<RiskAssessmentResponseDto[]> {
    return this.http.get<RiskAssessmentResponseDto[]>(`${this.baseUrl}/riskassessment/history/${teamId}`);
  }

  getFinalAssessments(teamId: number): Observable<RiskAssessmentResponseDto[]> {
    return this.http.get<RiskAssessmentResponseDto[]>(`${this.baseUrl}/riskassessment/final/${teamId}`);
  }

  getAssessment(id: number): Observable<RiskAssessmentResponseDto> {
    return this.http.get<RiskAssessmentResponseDto>(`${this.baseUrl}/riskassessment/${id}`);
  }

  markAssessmentAsFinal(assessmentId: number): Observable<RiskAssessmentResponseDto> {
    return this.http.post<RiskAssessmentResponseDto>(`${this.baseUrl}/riskassessment/${assessmentId}/final`, {});
  }

  applyRecommendation(recommendationId: number, request: ApplyRecommendationRequestDto): Observable<RecommendationDto> {
    return this.http.post<RecommendationDto>(`${this.baseUrl}/riskassessment/recommendations/${recommendationId}/apply`, request);
  }

  applyRecommendationByMatch(request: ApplyRecommendationByMatchRequestDto): Observable<RecommendationDto> {
    return this.http.post<RecommendationDto>(`${this.baseUrl}/riskassessment/recommendations/apply-by-match`, request);
  }
}
