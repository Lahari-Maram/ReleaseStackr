import { FIXED_CHECKLIST_STEPS } from '../constants/steps';

export type ReleaseStatus = 'PLANNED' | 'ONGOING' | 'DONE';

/**
 * Centrally computes the release status based on completed step IDs.
 * Rules:
 * - No completed steps -> PLANNED
 * - At least one completed step but not all -> ONGOING
 * - All fixed steps completed -> DONE
 */
export function computeReleaseStatus(completedSteps: unknown): ReleaseStatus {
  if (!Array.isArray(completedSteps) || completedSteps.length === 0) {
    return 'PLANNED';
  }

  const validCompletedSet = new Set(
    completedSteps.filter(
      (id): id is string =>
        typeof id === 'string' &&
        FIXED_CHECKLIST_STEPS.some((step) => step.id === id)
    )
  );

  if (validCompletedSet.size === 0) {
    return 'PLANNED';
  }

  if (validCompletedSet.size >= FIXED_CHECKLIST_STEPS.length) {
    return 'DONE';
  }

  return 'ONGOING';
}
