/**
 * Story Model
 * Represents a user story or task in the sprint backlog.
 */

export interface Story {
  /** Unique identifier */
  id: string;

  /** Story title */
  title: string;

  /** Story point estimate */
  storyPoints: number;

  /** Priority level (1 = highest) */
  priority: number;

  /** Story status */
  status: StoryStatus;

  /** IDs of stories this depends on */
  dependencies: string[];

  /** Whether this is a carryover from previous sprint */
  isCarryover: boolean;

  /** Assigned team member (optional) */
  assignee?: string;

  /** Story type classification */
  type: StoryType;
}

export enum StoryStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED'
}

export enum StoryType {
  FEATURE = 'FEATURE',
  BUG = 'BUG',
  TECH_DEBT = 'TECH_DEBT',
  SPIKE = 'SPIKE'
}

/**
 * Story Risk Factors
 * Specific risks associated with individual stories.
 */
export interface StoryRiskFactors {
  /** Large story (> 8 points) - harder to estimate */
  isLargeStory: boolean;

  /** Has unresolved dependencies */
  hasBlockingDependencies: boolean;

  /** Missing clear acceptance criteria */
  lacksClarity: boolean;

  /** Requires external team coordination */
  hasExternalDependency: boolean;
}
