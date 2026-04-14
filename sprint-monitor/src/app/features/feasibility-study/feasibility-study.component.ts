import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeasibilityService } from '../../core/services/feasibility.service';
import { TeamService } from '../../core/services/team.service';
import { 
  Feasibility, 
  CreateFeasibility, 
  FeasibilitySummary,
  FeasibilityStatus 
} from '../../core/models/feasibility.model';

@Component({
  selector: 'app-feasibility-study',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './feasibility-study.component.html',
  styleUrl: './feasibility-study.component.scss'
})
export class FeasibilityStudyComponent implements OnInit {
  private fb = inject(FormBuilder);
  private feasibilityService = inject(FeasibilityService);
  private teamService = inject(TeamService);

  feasibilityStudies: Feasibility[] = [];
  summary: FeasibilitySummary | null = null;
  selectedStudy: Feasibility | null = null;
  showForm = false;
  isEditing = false;
  loading = false;
  error: string | null = null;

  feasibilityForm: FormGroup = this.fb.group({
    teamId: [1],
    technicalFeasibility: [false],
    technicalNotes: [''],
    operationalFeasibility: [false],
    operationalNotes: [''],
    organizationalFeasibility: [false],
    organizationalNotes: [''],
    integrationFeasibility: [false],
    integrationNotes: [''],
    mentorComments: [''],
    approvedBy: [''],
    status: ['Proposed'],
    expectedBenefits: [''],
    adoptionChallenges: [''],
    scalabilityConsiderations: ['']
  });

  statusOptions: FeasibilityStatus[] = [
    'Proposed', 
    'Under Review', 
    'Approved', 
    'Deferred', 
    'Rejected'
  ];

  ngOnInit(): void {
    // Reload when team changes
    this.teamService.getSelectedTeam().subscribe(team => {
      if (team) this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.feasibilityService.getAllFeasibilityStudies().subscribe({
      next: (studies) => {
        this.feasibilityStudies = studies;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load feasibility studies. Please ensure the API is running.';
        this.feasibilityStudies = [];
        this.loading = false;
      }
    });

    this.feasibilityService.getFeasibilitySummary().subscribe({
      next: (summary) => this.summary = summary,
      error: () => { this.summary = null; }
    });
  }

  openNewForm(): void {
    this.isEditing = false;
    this.selectedStudy = null;
    this.feasibilityForm.reset({
      teamId: this.teamService.getSelectedTeamId(),
      technicalFeasibility: false,
      operationalFeasibility: false,
      organizationalFeasibility: false,
      integrationFeasibility: false,
      status: 'Proposed'
    });
    this.showForm = true;
  }

  editStudy(study: Feasibility): void {
    this.isEditing = true;
    this.selectedStudy = study;
    this.feasibilityForm.patchValue(study);
    this.showForm = true;
  }

  viewStudy(study: Feasibility): void {
    this.selectedStudy = study;
    this.showForm = false;
  }

  saveStudy(): void {
    if (this.feasibilityForm.invalid) return;

    const data = this.feasibilityForm.value as CreateFeasibility;
    
    if (this.isEditing && this.selectedStudy) {
      this.feasibilityService.updateFeasibilityStudy(this.selectedStudy.feasibilityId, data)
        .subscribe({
          next: () => {
            this.loadData();
            this.showForm = false;
          },
          error: (err) => this.error = 'Failed to update study'
        });
    } else {
      this.feasibilityService.createFeasibilityStudy(data).subscribe({
        next: () => {
          this.loadData();
          this.showForm = false;
        },
        error: (err) => this.error = 'Failed to create study'
      });
    }
  }

  updateStatus(study: Feasibility, newStatus: FeasibilityStatus): void {
    this.feasibilityService.updateFeasibilityStatus(study.feasibilityId, {
      status: newStatus,
      approvedBy: study.approvedBy
    }).subscribe({
      next: () => this.loadData(),
      error: () => this.error = 'Failed to update status'
    });
  }

  deleteStudy(study: Feasibility): void {
    if (confirm('Are you sure you want to delete this feasibility study?')) {
      this.feasibilityService.deleteFeasibilityStudy(study.feasibilityId).subscribe({
        next: () => this.loadData(),
        error: () => this.error = 'Failed to delete study'
      });
    }
  }

  calculateScore(): number {
    return this.feasibilityService.calculateScore(this.feasibilityForm.value);
  }

  getStatusColor(status: string): string {
    return this.feasibilityService.getStatusColor(status);
  }

  getScoreColor(score: number): string {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  cancelForm(): void {
    this.showForm = false;
    this.selectedStudy = null;
  }
}
