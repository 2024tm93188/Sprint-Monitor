import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Feasibility,
  CreateFeasibility,
  UpdateFeasibility,
  FeasibilitySummary,
  FeasibilityStatusUpdate
} from '../models/feasibility.model';

/**
 * Feasibility Service
 * Manages feasibility study CRUD operations and approval workflow
 */
@Injectable({
  providedIn: 'root'
})
export class FeasibilityService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/feasibility`;

  /**
   * Get all feasibility studies
   */
  getAllFeasibilityStudies(): Observable<Feasibility[]> {
    return this.http.get<Feasibility[]>(this.baseUrl);
  }

  /**
   * Get feasibility study by ID
   */
  getFeasibilityById(feasibilityId: number): Observable<Feasibility> {
    return this.http.get<Feasibility>(`${this.baseUrl}/${feasibilityId}`);
  }

  /**
   * Get latest feasibility study for a team
   */
  getLatestForTeam(teamId: number): Observable<Feasibility> {
    return this.http.get<Feasibility>(`${this.baseUrl}/team/${teamId}/latest`);
  }

  /**
   * Get feasibility summary statistics
   */
  getFeasibilitySummary(): Observable<FeasibilitySummary> {
    return this.http.get<FeasibilitySummary>(`${this.baseUrl}/summary`);
  }

  /**
   * Create a new feasibility study
   */
  createFeasibilityStudy(data: CreateFeasibility): Observable<Feasibility> {
    return this.http.post<Feasibility>(this.baseUrl, data);
  }

  /**
   * Update an existing feasibility study
   */
  updateFeasibilityStudy(feasibilityId: number, data: UpdateFeasibility): Observable<Feasibility> {
    return this.http.put<Feasibility>(`${this.baseUrl}/${feasibilityId}`, data);
  }

  /**
   * Update feasibility status (approval workflow)
   */
  updateFeasibilityStatus(feasibilityId: number, statusUpdate: FeasibilityStatusUpdate): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${feasibilityId}/status`, statusUpdate);
  }

  /**
   * Delete a feasibility study
   */
  deleteFeasibilityStudy(feasibilityId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${feasibilityId}`);
  }

  /**
   * Calculate overall feasibility score
   */
  calculateScore(feasibility: Partial<CreateFeasibility>): number {
    let score = 0;
    if (feasibility.technicalFeasibility) score += 25;
    if (feasibility.operationalFeasibility) score += 25;
    if (feasibility.organizationalFeasibility) score += 25;
    if (feasibility.integrationFeasibility) score += 25;
    return score;
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved': return 'success';
      case 'Proposed': return 'info';
      case 'Under Review': return 'warning';
      case 'Deferred': return 'secondary';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  }
}
