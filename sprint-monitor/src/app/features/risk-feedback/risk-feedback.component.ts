import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RiskFeedbackService } from '../../core/services/feedback.service';
import { ApiService, RiskAssessmentResponseDto, UpdateAssessmentOutcomeDto } from '../../core/services/api.service';
import { SprintService } from '../../core/services/sprint.service';
import { 
  RiskFeedback, 
  CreateRiskFeedback, 
  PredictionAccuracy,
  CalibrationStatus,
  AgreementLevel
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
  private sprintService = inject(SprintService);

  feedbacks: RiskFeedback[] = [];
  accuracy: PredictionAccuracy | null = null;
  calibration: CalibrationStatus | null = null;
  assessments: RiskAssessmentResponseDto[] = [];
  showForm = false;
  showOutcomeForm = false;
  loading = false;
  error: string | null = null;
  outcomeSuccess: string | null = null;

  feedbackForm: FormGroup = this.fb.group({
    riskAssessmentId: [null, Validators.required],
    teamId: [1],
    sprintId: [null],
    agreementLevel: ['Accurate', Validators.required],
    userComments: [''],
    recommendationRating: [5, [Validators.min(1), Validators.max(5)]],
    recommendationHelpful: [true],
    actualOutcome: [''],
    providedBy: ['']
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
    this.loadData();
  }

  private get teamId(): number {
    return this.sprintService.getCurrentTeamId();
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
      error: () => {
        this.accuracy = null;
      }
    });

    this.feedbackService.getCalibrationStatus(this.teamId).subscribe({
      next: (calibration: CalibrationStatus) => this.calibration = calibration,
      error: () => {
        this.calibration = null;
      }
    });

    // Load assessments for dropdown selection
    this.apiService.getAssessmentHistory(this.teamId).subscribe({
      next: (assessments) => this.assessments = assessments,
      error: () => {
        this.assessments = [];
      }
    });
  }

  openFeedbackForm(assessmentId?: number): void {
    const selectedAssessment = assessmentId 
      ? this.assessments.find(a => a.assessmentId === assessmentId) 
      : null;

    this.feedbackForm.reset({
      riskAssessmentId: assessmentId || null,
      teamId: this.teamId,
      sprintId: null,
      agreementLevel: 'Accurate',
      recommendationRating: 5,
      recommendationHelpful: true,
      actualOutcome: selectedAssessment ? `Predicted: ${selectedAssessment.riskLevel}` : '',
      providedBy: ''
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

    // Map form values to match backend CreateRiskFeedbackDto
    const data: any = {
      assessmentId: formValues.riskAssessmentId,
      sprintId: formValues.sprintId,
      predictedRisk: this.getAssessmentRiskLevel(formValues.riskAssessmentId),
      actualOutcome: formValues.actualOutcome || 'Pending',
      agreementLevel: formValues.agreementLevel,
      recommendationsHelpful: formValues.recommendationHelpful,
      recommendationRating: formValues.recommendationRating,
      feedbackComments: formValues.userComments,
      userName: formValues.providedBy,
      userRole: formValues.providedBy
    };
    
    this.feedbackService.submitFeedback(data).subscribe({
      next: () => {
        this.loadData();
        this.showForm = false;
      },
      error: (err) => {
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
        this.loadData(); // Refresh data
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
    return `#${assessment.assessmentId} — ${assessment.riskLevel} Risk — ${assessment.plannedCommitment} pts (${date})`;
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
