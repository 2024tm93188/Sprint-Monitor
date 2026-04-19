/**
 * Sprint Model
 * Represents a sprint with planning and completion data.
 * Used for historical analysis and current sprint planning.
 */

export interface Sprint {
  /** Unique identifier for the sprint */
  id: string;

  /** Sprint number within the team */
  sprintNumber?: number;

  /** Current sprint status */
  status?: 'Planned' | 'InProgress' | 'Completed';

  /** Sprint name (e.g., "Sprint 23") */
  name: string;

  /** Total story points committed at sprint start */
  committedPoints: number;

  /** Story points actually completed by sprint end */
  completedPoints: number;

  /** Team's available capacity as percentage (0-100) */
  teamAvailability: number;

  /** Number of team members participating */
  teamSize: number;

  /** Whether stories spilled over to next sprint */
  hadSpillover: boolean;

  /** Sprint start date */
  startDate: Date;

  /** Sprint end date */
  endDate: Date;

  /** Stories planned for this sprint */
  stories: string[]; // Story IDs
}

/**
 * Sprint Planning Input
 * Data collected from the user for risk evaluation.
 */
export interface SprintPlanningInput {
  /** Historical sprints for velocity calculation */
  historicalSprints: Sprint[];

  /** Story points planned for the upcoming sprint */
  plannedStoryPoints: number;

  /** Team availability percentage for upcoming sprint (0-100) */
  teamAvailability: number;

  /** Number of team members */
  teamSize: number;

  /** Number of external dependencies */
  externalDependencies: number;

  /**
   * Optional: DB SprintId to link this assessment to an existing sprint record.
   * Creates a direct FK relationship: RiskAssessment.SprintId → Sprint.SprintId.
   * Enables feedback linkage and sprint comparison traceability.
   */
  sprintId?: number;
}

/**
 * Computed Sprint Metrics
 * Derived values used in risk calculation.
 */
export interface SprintMetrics {
  /** Average velocity across historical sprints */
  averageVelocity: number;

  /** Standard deviation of velocity */
  velocityStandardDeviation: number;

  /** Coefficient of variation (stdDev / mean) */
  velocityCoefficient: number;

  /** Percentage of sprints with spillover (0-100) */
  spilloverRate: number;

  /** Historical baseline spillover rate from past sprints (0-100) */
  historicalSpilloverRate?: number;

  /** Effective capacity after buffer (velocity * 0.8) */
  effectiveCapacity: number;

  /** Commitment-to-Velocity Ratio */
  cvr: number;

  /** Total sprints analyzed */
  sprintCount: number;
}
