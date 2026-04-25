import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RiskFeedbackService } from '../../core/services/feedback.service';
import { ApiService, RiskAssessmentResponseDto } from '../../core/services/api.service';
import { TeamService } from '../../core/services/team.service';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  RiskFeedback,
  CreateRiskFeedback,
  PredictionAccuracy,
  AgreementLevel,
  SprintComparison
} from '../../core/models/feedback.model';

@Component({
  selector: 'app-risk-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './risk-feedback.component.html',
  styleUrl: './risk-feedback.component.scss'
})
export class RiskFeedbackComponent implements OnInit {
    @Output() feedbackSubmitted = new EventEmitter<number>();

  private fb = inject(FormBuilder);
  private feedbackService = inject(RiskFeedbackService);
  private apiService = inject(ApiService);
  private teamService = inject(TeamService);

  feedbacks: RiskFeedback[] = [];
  accuracy: PredictionAccuracy | null = null;
  assessments: RiskAssessmentResponseDto[] = [];
  comparisonSprints: SprintComparison[] = [];
  showForm = false;
  loading = false;
  error: string | null = null;

  feedbackForm: FormGroup = this.fb.group({
    assessmentId: [null, Validators.required],
    actualOutcome: ['SUCCESS', Validators.required],
    completedPoints: [null, [Validators.min(0)]],
    agreementLevel: ['Accurate', Validators.required],
    userComments: [''],
    recommendationRating: [5, [Validators.min(1), Validators.max(5)]],
    recommendationsHelpful: [true]
  });

  agreementOptions: AgreementLevel[] = [
    'Accurate',
    'PartiallyAccurate',
    'Incorrect'
  ];

  actualOutcomeOptions = [
    { value: 'SUCCESS', label: '✅ Success — All committed work done' },
    { value: 'PARTIAL', label: '⚠️ Partial — Some spillover' },
    { value: 'FAILED', label: '❌ Failed — Significant spillover' }
  ];

  ngOnInit(): void {
    // Reload when team changes
    this.teamService.getSelectedTeam().subscribe(team => {
      if (team) this.loadData();
    });
  }

  private get teamId(): number {
    return this.teamService.getSelectedTeamId();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.loadFeedbackContext().subscribe({
      next: context => {
        this.feedbacks = context.feedbacks;
        this.accuracy = context.accuracy;
        this.comparisonSprints = context.comparisonSprints;
        this.assessments = context.assessments;
        this.loading = false;
        this.syncOpenFormsWithLatestAssessment();
      },
      error: (err: HttpErrorResponse) => {
        this.feedbacks = [];
        this.accuracy = null;
        this.comparisonSprints = [];
        this.assessments = [];
        this.error = this.getLoadErrorMessage(err);
        this.loading = false;
      }
    });
  }

  openFeedbackForm(assessmentId?: number): void {
    // Refresh latest data so newly finalized assessments appear immediately.
    this.loading = true;
    this.error = null;

    this.loadFeedbackContext().subscribe({
      next: context => {
        this.feedbacks = context.feedbacks;
        this.accuracy = context.accuracy;
        this.comparisonSprints = context.comparisonSprints;
        this.assessments = context.assessments;
        this.loading = false;

        if (!this.assessments.length) {
          this.error = 'No final assessments are available yet. Mark a sprint assessment as final first.';
          return;
        }

        const resolvedAssessmentId = assessmentId ?? this.getLatestAssessmentId();

        this.feedbackForm.reset({
          assessmentId: resolvedAssessmentId,
          actualOutcome: 'SUCCESS',
          completedPoints: null,
          agreementLevel: 'Accurate',
          recommendationRating: 5,
          recommendationsHelpful: true,
          userComments: ''
        });
        this.showForm = true;
      },
      error: (err: HttpErrorResponse) => {
        this.feedbacks = [];
        this.accuracy = null;
        this.comparisonSprints = [];
        this.assessments = [];
        this.error = this.getLoadErrorMessage(err);
        this.loading = false;
      }
    });
  }

  private loadFeedbackContext(): Observable<{
    feedbacks: RiskFeedback[];
    accuracy: PredictionAccuracy | null;
    comparisonSprints: SprintComparison[];
    assessments: RiskAssessmentResponseDto[];
  }> {
    return forkJoin({
      feedbacks: this.feedbackService.getFeedbacksForTeam(this.teamId),
      accuracy: this.feedbackService.getPredictionAccuracy(this.teamId).pipe(
        catchError(() => of(null))
      ),
      comparison: this.feedbackService.getSprintComparison(this.teamId)
    }).pipe(
      map(({ feedbacks, accuracy, comparison }) => ({
        feedbacks,
        accuracy,
        comparisonSprints: comparison.sprints || []
      })),
      map(context => {
        const comparisonAssessmentIds = context.comparisonSprints
          .map((s: SprintComparison) => s.assessmentId)
          .filter((id: number) => Number.isFinite(id) && id > 0);

        return { ...context, comparisonAssessmentIds };
      }),
      switchMap(context =>
        this.apiService.getFinalAssessments(this.teamId).pipe(
          map(assessments => {
            const sprintLinkedAssessments = assessments.filter(a => !!a.sprintId);

            const resolvedAssessments = !context.comparisonAssessmentIds.length
              ? sprintLinkedAssessments
                  .sort((left, right) => new Date(right.assessedAt).getTime() - new Date(left.assessedAt).getTime())
                  .slice(0, 3)
              : context.comparisonAssessmentIds
                  .map((id: number) => sprintLinkedAssessments.find((assessment: RiskAssessmentResponseDto) => assessment.assessmentId === id))
                  .filter((assessment): assessment is RiskAssessmentResponseDto => !!assessment);

            return {
              feedbacks: context.feedbacks,
              accuracy: context.accuracy,
              comparisonSprints: context.comparisonSprints,
              assessments: resolvedAssessments
            };
          })
        )
      ),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  private getLoadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Your session has expired or is invalid. Please log in again and retry.';
    }

    if (error.status === 0) {
      return 'Could not connect to the API. Please ensure backend is running and reachable.';
    }

    const backendMessage = error.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }

    return 'Failed to load feedback data. Please try again.';
  }

  submitFeedback(): void {
    if (this.feedbackForm.invalid) return;

    const formValues = this.feedbackForm.value;
    const selectedSprint = this.getSelectedComparisonSprint(formValues.assessmentId);
    const sprintId = selectedSprint && selectedSprint.sprintId > 0
      ? selectedSprint.sprintId
      : undefined;

    const data: CreateRiskFeedback = {
      assessmentId: formValues.assessmentId,
      teamId: this.teamId,
      sprintId,
      predictedRisk: this.getAssessmentRiskLevel(formValues.assessmentId),
      actualOutcome: formValues.actualOutcome,
      completedPoints: formValues.completedPoints,
      agreementLevel: formValues.agreementLevel,
      recommendationsHelpful: formValues.recommendationsHelpful,
      recommendationRating: formValues.recommendationRating,
      feedbackComments: formValues.userComments
    };

    this.feedbackService.submitFeedback(data).subscribe({
      next: () => {
        this.loadData();
        this.showForm = false;
        this.feedbackSubmitted.emit(formValues.assessmentId);
      },
      error: () => {
        this.error = 'Failed to submit feedback. Please try again.';
        this.showForm = false;
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
  }

  getAssessmentRiskLevel(assessmentId: number): string {
    const assessment = this.assessments.find(a => a.assessmentId === assessmentId);
    return assessment?.riskLevel || 'Unknown';
  }

  getAssessmentLabel(assessment: RiskAssessmentResponseDto): string {
    const date = new Date(assessment.assessedAt).toLocaleDateString();
    const match = this.getSelectedComparisonSprint(assessment.assessmentId);
    const sprintRef = match?.sprintName || (assessment.sprintNumber ? `Sprint #${assessment.sprintNumber}` : 'Committed Sprint');
    return `Final Assessment #${assessment.assessmentId} | ${sprintRef} | Iteration ${assessment.iteration} | ${assessment.riskLevel} risk | Planned ${assessment.plannedCommitment} pts | ${date}`;
  }

  get selectableAssessments(): RiskAssessmentResponseDto[] {
    return this.assessments;
  }

  private getSelectedComparisonSprint(assessmentId: number): SprintComparison | undefined {
    return this.comparisonSprints.find(s => s.assessmentId === assessmentId);
  }

  private getLatestAssessmentId(): number | null {
    if (!this.assessments.length) {
      return null;
    }

    return [...this.assessments]
      .sort((left, right) => new Date(right.assessedAt).getTime() - new Date(left.assessedAt).getTime())[0]
      .assessmentId;
  }

  private syncOpenFormsWithLatestAssessment(): void {
    const latestAssessmentId = this.getLatestAssessmentId();

    if (latestAssessmentId == null) {
      return;
    }

    if (this.showForm && !this.feedbackForm.get('assessmentId')?.value) {
      this.feedbackForm.patchValue({ assessmentId: latestAssessmentId });
    }

  }

  getAgreementColor(level: string): string {
    switch (level) {
      case 'Accurate': return 'success';
      case 'PartiallyAccurate': return 'warning';
      case 'Incorrect': return 'danger';
      default: return 'secondary';
    }
  }

  getAgreementIcon(level: string): string {
    switch (level) {
      case 'Accurate': return '✅';
      case 'PartiallyAccurate': return '⚠️';
      case 'Incorrect': return '❌';
      default: return '❓';
    }
  }

  getAgreementLabel(level: string): string {
    switch (level) {
      case 'PartiallyAccurate': return 'Partially Accurate';
      default: return level;
    }
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getAccuracyColor(value: number): string {
    return this.feedbackService.getAccuracyColor(value);
  }
}
