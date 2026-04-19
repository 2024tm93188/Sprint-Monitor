import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RiskFeedbackService } from '../../core/services/feedback.service';
import { ApiService, RiskAssessmentResponseDto, UpdateAssessmentOutcomeDto } from '../../core/services/api.service';
import { TeamService } from '../../core/services/team.service';
import {
  RiskFeedback,
  CreateRiskFeedback,
  PredictionAccuracy,
  CalibrationStatus,
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
  calibration: CalibrationStatus | null = null;
  assessments: RiskAssessmentResponseDto[] = [];
  comparisonSprints: SprintComparison[] = [];
  showForm = false;
  showOutcomeForm = false;
  loading = false;
  error: string | null = null;
  outcomeSuccess: string | null = null;

  feedbackForm: FormGroup = this.fb.group({
    assessmentId: [null, Validators.required],
    agreementLevel: ['Accurate', Validators.required],
    userComments: [''],
    recommendationRating: [5, [Validators.min(1), Validators.max(5)]],
    recommendationsHelpful: [true]
  });

  outcomeForm: FormGroup = this.fb.group({
    assessmentId: [null, Validators.required],
    actualOutcome: ['SUCCESS', Validators.required],
    actualCompletedPoints: [null, [Validators.min(0)]],
    notes: ['']
  });

  agreementOptions: AgreementLevel[] = [
    'Accurate',
    'PartiallyAccurate',
    'Incorrect'
  ];

  outcomeOptions = [
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

    this.feedbackService.getCalibrationStatus(this.teamId).subscribe({
      next: (calibration: CalibrationStatus) => this.calibration = calibration,
      error: () => { this.calibration = null; }
    });

    // Load assessments for dropdown selection
    this.apiService.getAssessmentHistory(this.teamId).subscribe({
      next: (assessments) => this.assessments = assessments,
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
  }

  openFeedbackForm(assessmentId?: number): void {
    const selectedAssessment = assessmentId
      ? this.assessments.find(a => a.assessmentId === assessmentId)
      : null;

    this.feedbackForm.reset({
      assessmentId: assessmentId || null,
      agreementLevel: 'Accurate',
      recommendationRating: 5,
      recommendationsHelpful: true,
      userComments: ''
    });
    this.showForm = true;
  }

  openOutcomeForm(assessmentId?: number): void {
    this.outcomeForm.reset({
      assessmentId: assessmentId || null,
      actualOutcome: 'SUCCESS',
      actualCompletedPoints: null,
      notes: ''
    });
    this.outcomeSuccess = null;
    this.showOutcomeForm = true;
  }

  submitFeedback(): void {
    if (this.feedbackForm.invalid) return;

    const formValues = this.feedbackForm.value;
    const selectedSprint = this.getSelectedComparisonSprint(formValues.assessmentId);

    const data: CreateRiskFeedback = {
      assessmentId: formValues.assessmentId,
      sprintId: selectedSprint?.sprintId,
      predictedRisk: this.getAssessmentRiskLevel(formValues.assessmentId),
      actualOutcome: 'Pending',
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

  submitOutcome(): void {
    if (this.outcomeForm.invalid) return;

    const formValues = this.outcomeForm.value;
    const dto: UpdateAssessmentOutcomeDto = {
      actualOutcome: formValues.actualOutcome,
      actualCompletedPoints: formValues.actualCompletedPoints,
      notes: formValues.notes
    };

    this.apiService.updateAssessmentOutcome(formValues.assessmentId, dto).subscribe({
      next: () => {
        this.outcomeSuccess = 'Actual outcome recorded successfully!';
        this.loadData();
        setTimeout(() => {
          this.showOutcomeForm = false;
          this.outcomeSuccess = null;
        }, 2000);
      },
      error: () => {
        this.error = 'Failed to record actual outcome. Please try again.';
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
  }

  cancelOutcomeForm(): void {
    this.showOutcomeForm = false;
  }

  markForCalibration(feedback: RiskFeedback): void {
    this.feedbackService.markAsUsedForCalibration(feedback.feedbackId).subscribe({
      next: () => {
        feedback.usedForCalibration = true;
      },
      error: () => {
        this.error = 'Failed to mark feedback for calibration.';
      }
    });
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
    return this.assessments.filter(a => comparisonAssessmentIds.has(a.assessmentId));
  }

  private getSelectedComparisonSprint(assessmentId: number): SprintComparison | undefined {
    return this.comparisonSprints.find(s => s.assessmentId === assessmentId);
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
