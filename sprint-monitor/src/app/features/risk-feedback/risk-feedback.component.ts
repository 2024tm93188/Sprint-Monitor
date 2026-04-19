import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RiskFeedbackService } from '../../core/services/feedback.service';
import { ApiService, RiskAssessmentResponseDto } from '../../core/services/api.service';
import { TeamService } from '../../core/services/team.service';
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

    this.feedbackService.getFeedbacksForTeam(this.teamId).subscribe({
      next: (feedbacks: RiskFeedback[]) => {
        this.feedbacks = feedbacks;
        this.loading = false;
      },
      error: () => {
        this.feedbacks = [];
        this.error = 'Could not load feedback data. Please ensure the backend API is running.';
        this.loading = false;
      }
    });

    this.feedbackService.getPredictionAccuracy(this.teamId).subscribe({
      next: (accuracy: PredictionAccuracy) => this.accuracy = accuracy,
      error: () => { this.accuracy = null; }
    });

    // Load assessments for dropdown selection
    this.apiService.getAssessmentHistory(this.teamId).subscribe({
      next: (assessments) => {
        this.assessments = assessments;
        this.syncOpenFormsWithLatestAssessment();
      },
      error: () => { this.assessments = []; }
    });

    // Keep dropdown in sync with comparison dashboard by using same source
    this.feedbackService.getSprintComparison(this.teamId).subscribe({
      next: (comparison) => {
        this.comparisonSprints = comparison.sprints || [];
      },
      error: () => {
        this.comparisonSprints = [];
      }
    });

    // If the forms are already open, keep them populated with the newest run for this team.
    setTimeout(() => this.syncOpenFormsWithLatestAssessment(), 0);
  }

  openFeedbackForm(assessmentId?: number): void {
    // Refresh latest data so newly evaluated runs appear immediately in dropdown.
    this.loadData();

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
    const sprintRef = match?.sprintName || (assessment.sprintId ? `Sprint ${assessment.sprintId}` : 'Ad-hoc Assessment');
    return `Assessment #${assessment.assessmentId} | ${sprintRef} | ${assessment.riskLevel} risk | Planned ${assessment.plannedCommitment} pts | ${date}`;
  }

  get selectableAssessments(): RiskAssessmentResponseDto[] {
    if (!this.comparisonSprints.length) {
      return this.assessments;
    }

    const comparisonAssessmentIds = new Set(this.comparisonSprints.map(s => s.assessmentId));
    const comparisonMatchedAssessments = this.assessments.filter(a => comparisonAssessmentIds.has(a.assessmentId));

    // Fallback to all assessments so forms never become unusable when comparison data lags
    // or does not include the newest assessment yet.
    return comparisonMatchedAssessments.length > 0
      ? comparisonMatchedAssessments
      : this.assessments;
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
