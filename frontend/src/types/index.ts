export type ReleaseStatus = 'PLANNED' | 'ONGOING' | 'DONE';

export interface ChecklistStep {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Release {
  id: string;
  name: string;
  date: string;
  status: ReleaseStatus;
  additionalInfo?: string | null;
  completedSteps: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReleaseInput {
  name: string;
  date: string;
  additionalInfo?: string;
}
