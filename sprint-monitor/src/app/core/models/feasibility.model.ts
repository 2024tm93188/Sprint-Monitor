/**
 * Feasibility Study Models
 * Supports industry mentor validation workflow
 */

export interface Feasibility {
  feasibilityId: number;
  teamId?: number;
  teamName?: string;
  sprintId?: number;
  sprintName?: string;
  userRole?: string;
  evaluationDate: Date;
  
  // Feasibility Flags
  technicalFeasibility: boolean;
  technicalNotes?: string;
  operationalFeasibility: boolean;
  operationalNotes?: string;
  organizationalFeasibility: boolean;
  organizationalNotes?: string;
  integrationFeasibility: boolean;
  integrationNotes?: string;
  
  // Mentor Validation
  mentorComments?: string;
  approvedBy?: string;
  status: FeasibilityStatus;
  
  // Analysis
  expectedBenefits?: string;
  adoptionChallenges?: string;
  scalabilityConsiderations?: string;
  overallScore: number;
  
  createdAt: Date;
  updatedAt?: Date;
}

export type FeasibilityStatus = 'Approved' | 'Rejected' | 'Proposed' | 'Under Review' | 'Deferred';

export interface CreateFeasibility {
  teamId?: number;
  sprintId?: number;
  userRole?: string;
  
  technicalFeasibility: boolean;
  technicalNotes?: string;
  
  operationalFeasibility: boolean;
  operationalNotes?: string;
  
  organizationalFeasibility: boolean;
  organizationalNotes?: string;
  
  integrationFeasibility: boolean;
  integrationNotes?: string;
  
  mentorComments?: string;
  approvedBy?: string;
  status?: FeasibilityStatus;
  
  expectedBenefits?: string;
  adoptionChallenges?: string;
  scalabilityConsiderations?: string;
}

export interface UpdateFeasibility {
  sprintId?: number;
  userRole?: string;

  technicalFeasibility?: boolean;
  technicalNotes?: string;
  
  operationalFeasibility?: boolean;
  operationalNotes?: string;
  
  organizationalFeasibility?: boolean;
  organizationalNotes?: string;
  
  integrationFeasibility?: boolean;
  integrationNotes?: string;
  
  mentorComments?: string;
  approvedBy?: string;
  status?: FeasibilityStatus;
  
  expectedBenefits?: string;
  adoptionChallenges?: string;
  scalabilityConsiderations?: string;
}

export interface FeasibilitySummary {
  totalStudies: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  averageScore: number;
  latestStudy?: Feasibility;
}

export interface FeasibilityStatusUpdate {
  status: FeasibilityStatus;
  approvedBy?: string;
}
