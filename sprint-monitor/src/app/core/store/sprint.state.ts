import { Sprint } from '../models/sprint.model';

export interface SprintStoreState {
  historicalSprints: Sprint[];
  loading: boolean;
}

export const initialSprintState: SprintStoreState = {
  historicalSprints: [],
  loading: false
};
