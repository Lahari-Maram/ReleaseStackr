export interface ChecklistStep {
  id: string;
  name: string;
  description: string;
  order: number;
}

export const FIXED_CHECKLIST_STEPS: ChecklistStep[] = [
  {
    id: 'code-freeze',
    name: 'Code Freeze & Branch Cut',
    description: 'Feature freeze confirmed and release branch created.',
    order: 1,
  },
  {
    id: 'automated-tests',
    name: 'Automated Test Suite Passed',
    description: 'Unit, integration, and regression test suites all pass green.',
    order: 2,
  },
  {
    id: 'security-scan',
    name: 'Security & Dependency Scan',
    description: 'SAST vulnerability scan and license audit completed with no high/critical issues.',
    order: 3,
  },
  {
    id: 'staging-smoke-test',
    name: 'Staging Smoke & QA Sign-off',
    description: 'Deployed to staging environment and QA smoke tests verified.',
    order: 4,
  },
  {
    id: 'db-migrations',
    name: 'Database Migrations Verified',
    description: 'Schema migrations applied and backward compatibility confirmed.',
    order: 5,
  },
  {
    id: 'production-deploy',
    name: 'Production Deployment',
    description: 'Application deployed to production cluster.',
    order: 6,
  },
  {
    id: 'post-deploy-verify',
    name: 'Post-Deploy Verification & Monitoring',
    description: 'Production health probes, APM telemetry, and error rates verified normal.',
    order: 7,
  },
  {
    id: 'release-notes',
    name: 'Release Notes Published',
    description: 'Changelog published to team channels and external stakeholders.',
    order: 8,
  },
];

export const FIXED_STEP_IDS = FIXED_CHECKLIST_STEPS.map((s) => s.id);
export const TOTAL_FIXED_STEPS = FIXED_CHECKLIST_STEPS.length;
