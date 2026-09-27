import { describe, it, expect } from 'vitest';
import { computeReleaseStatus } from '../utils/status';
import { FIXED_CHECKLIST_STEPS, FIXED_STEP_IDS } from '../constants/steps';

describe('computeReleaseStatus', () => {
  it('should return PLANNED when completedSteps is empty', () => {
    expect(computeReleaseStatus([])).toBe('PLANNED');
  });

  it('should return PLANNED when completedSteps is null or undefined or not an array', () => {
    expect(computeReleaseStatus(null)).toBe('PLANNED');
    expect(computeReleaseStatus(undefined)).toBe('PLANNED');
    expect(computeReleaseStatus('invalid')).toBe('PLANNED');
    expect(computeReleaseStatus({})).toBe('PLANNED');
  });

  it('should return PLANNED when completedSteps contains only unknown/invalid IDs', () => {
    expect(computeReleaseStatus(['random-unknown-step', 'another-invalid'])).toBe('PLANNED');
  });

  it('should return ONGOING when at least one valid step is completed but not all', () => {
    // 1 step completed
    expect(computeReleaseStatus(['code-freeze'])).toBe('ONGOING');

    // Half of the steps completed
    const halfSteps = FIXED_STEP_IDS.slice(0, 4);
    expect(computeReleaseStatus(halfSteps)).toBe('ONGOING');

    // All steps except one completed
    const almostAll = FIXED_STEP_IDS.slice(0, FIXED_STEP_IDS.length - 1);
    expect(computeReleaseStatus(almostAll)).toBe('ONGOING');
  });

  it('should return DONE when all fixed steps are completed', () => {
    expect(computeReleaseStatus(FIXED_STEP_IDS)).toBe('DONE');
  });

  it('should return DONE even if completedSteps array is ordered differently', () => {
    const reversed = [...FIXED_STEP_IDS].reverse();
    expect(computeReleaseStatus(reversed)).toBe('DONE');
  });

  it('should handle duplicate step IDs without falsely marking DONE', () => {
    // 1 step duplicated 8 times should still be ONGOING, not DONE
    const duplicatedSingleStep = Array(8).fill('code-freeze');
    expect(computeReleaseStatus(duplicatedSingleStep)).toBe('ONGOING');
  });

  it('should accurately verify against FIXED_CHECKLIST_STEPS length', () => {
    expect(FIXED_CHECKLIST_STEPS.length).toBe(8);
  });
});
