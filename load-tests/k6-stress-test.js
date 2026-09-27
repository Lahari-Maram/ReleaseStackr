import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.GRAPHQL_URL || 'http://localhost:4000/graphql';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Warm-up to 5 VUs
    { duration: '20s', target: 25 },  // Ramp to 25 VUs
    { duration: '30s', target: 50 },  // Ramp to 50 VUs
    { duration: '30s', target: 100 }, // Stress to 100 VUs
    { duration: '20s', target: 200 }, // Peak stress to 200 VUs
    { duration: '10s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // <5% errors
    http_req_duration: ['p(95)<2000'], // 95% of requests should be < 2000ms
  },
};

const HEADERS = {
  'Content-Type': 'application/json',
};

const GET_RELEASES_QUERY = JSON.stringify({
  query: `
    query GetReleases {
      releases {
        id
        name
        status
        completedSteps
      }
    }
  `,
});

const GET_RELEASE_QUERY = (id) =>
  JSON.stringify({
    query: `
      query GetRelease($id: ID!) {
        release(id: $id) {
          id
          name
          status
          completedSteps
          additionalInfo
        }
      }
    `,
    variables: { id },
  });

const TOGGLE_STEP_MUTATION = (id, stepId, completed) =>
  JSON.stringify({
    query: `
      mutation ToggleStep($id: ID!, $stepId: String!, $completed: Boolean!) {
        toggleReleaseStep(id: $id, stepId: $stepId, completed: $completed) {
          id
          status
          completedSteps
        }
      }
    `,
    variables: { id, stepId, completed },
  });

const UPDATE_INFO_MUTATION = (id, additionalInfo) =>
  JSON.stringify({
    query: `
      mutation UpdateInfo($id: ID!, $additionalInfo: String) {
        updateReleaseAdditionalInfo(id: $id, additionalInfo: $additionalInfo) {
          id
          additionalInfo
        }
      }
    `,
    variables: { id, additionalInfo },
  });

export default function () {
  // Step 1: Query releases list
  const listRes = http.post(BASE_URL, GET_RELEASES_QUERY, { headers: HEADERS });
  const listSuccess = check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list has data': (r) => {
      try {
        const json = r.json();
        return Array.isArray(json?.data?.releases);
      } catch {
        return false;
      }
    },
  });

  if (!listSuccess) {
    sleep(1);
    return;
  }

  const releases = listRes.json().data.releases;
  if (!releases || releases.length === 0) {
    sleep(1);
    return;
  }

  // Pick a release
  const targetRelease = releases[Math.floor(Math.random() * releases.length)];
  const releaseId = targetRelease.id;

  // Step 2: Query single release
  const singleRes = http.post(BASE_URL, GET_RELEASE_QUERY(releaseId), { headers: HEADERS });
  check(singleRes, {
    'single status 200': (r) => r.status === 200,
    'single has id': (r) => r.json()?.data?.release?.id === releaseId,
  });

  // Step 3: Toggle a checklist step
  const steps = ['code-freeze', 'automated-tests', 'security-scan', 'staging-smoke-test'];
  const stepToToggle = steps[Math.floor(Math.random() * steps.length)];
  const toggleRes = http.post(
    BASE_URL,
    TOGGLE_STEP_MUTATION(releaseId, stepToToggle, true),
    { headers: HEADERS }
  );
  check(toggleRes, {
    'toggle status 200': (r) => r.status === 200,
  });

  // Step 4: Update additional information
  const updateRes = http.post(
    BASE_URL,
    UPDATE_INFO_MUTATION(releaseId, `Benchmark note update at ${new Date().toISOString()}`),
    { headers: HEADERS }
  );
  check(updateRes, {
    'update info status 200': (r) => r.status === 200,
  });

  // Step 5: Final query releases list
  const finalRes = http.post(BASE_URL, GET_RELEASES_QUERY, { headers: HEADERS });
  check(finalRes, {
    'final list status 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
