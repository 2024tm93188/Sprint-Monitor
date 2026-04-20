import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { FeasibilityService } from '../../core/services/feasibility.service';
import { TeamService } from '../../core/services/team.service';
import { ApiService, SprintDto } from '../../core/services/api.service';
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
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private feasibilityService = inject(FeasibilityService);
  private teamService = inject(TeamService);

  feasibilityStudies: Feasibility[] = [];
  selectedStudy: Feasibility | null = null;
  showForm = false;
  isEditing = false;
  loading = false;
  error: string | null = null;
  selectedTeamName = '';
  selectedUserRole = '';
  activeSprint: SprintDto | null = null;

  feasibilityForm: FormGroup = this.fb.group({
    teamId: [1],
    sprintId: [null],
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
    status: ['Approved'],
    expectedBenefits: [''],
    adoptionChallenges: [''],
    scalabilityConsiderations: ['']
  });

  statusOptions: FeasibilityStatus[] = [
    'Approved', 
    'Rejected'
  ];

  ngOnInit(): void {
    // Reload when team changes
    this.teamService.getSelectedTeam().subscribe(team => {
      if (!team) return;

      this.selectedTeamName = team.teamName;
      this.selectedUserRole = this.authService.userRole() ?? 'User';
      this.loadCurrentSprint(team.teamId);
      this.loadData();
    });
  }

  get displayedStudies(): Feasibility[] {
    const selectedTeamId = this.teamService.getSelectedTeamId();
    return this.feasibilityStudies.filter(study => study.teamId === selectedTeamId);
  }

  get summary(): FeasibilitySummary {
    const studies = this.displayedStudies;
    const approvedCount = studies.filter(study => study.status === 'Approved').length;
    const rejectedCount = studies.filter(study => study.status === 'Rejected').length;
    const pendingCount = studies.length - approvedCount - rejectedCount;
    const averageScore = studies.length
      ? studies.reduce((sum, study) => sum + study.overallScore, 0) / studies.length
      : 0;

    return {
      totalStudies: studies.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      averageScore,
      latestStudy: studies[0]
    };
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
  }

  openNewForm(): void {
    this.isEditing = false;
    this.selectedStudy = null;
    this.feasibilityForm.reset({
      teamId: this.teamService.getSelectedTeamId(),
      sprintId: this.activeSprint?.sprintId ?? null,
      technicalFeasibility: false,
      operationalFeasibility: false,
      organizationalFeasibility: false,
      integrationFeasibility: false,
      status: 'Approved'
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

    const data = {
      ...this.feasibilityForm.value,
      teamId: this.teamService.getSelectedTeamId(),
      sprintId: this.activeSprint?.sprintId ?? this.feasibilityForm.get('sprintId')?.value ?? undefined,
      userRole: this.selectedUserRole
    } as CreateFeasibility;
    
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

  get selectedSprintLabel(): string {
    return this.activeSprint?.sprintName || 'Current sprint';
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

  private loadCurrentSprint(teamId: number): void {
    this.apiService.getSprints(teamId).subscribe({
      next: (sprints) => {
        const active = [...sprints]
          .filter(sprint => sprint.status !== 'Completed')
          .sort((left, right) => right.sprintNumber - left.sprintNumber)[0] || sprints[0] || null;

        this.activeSprint = active;
        if (!this.isEditing) {
          this.feasibilityForm.patchValue({ sprintId: active?.sprintId ?? null });
        }
      },
      error: () => {
        this.activeSprint = null;
      }
    });
  }
}
