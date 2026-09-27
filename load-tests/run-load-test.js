#!/usr/bin/env node

/**
 * High-performance, cross-platform load testing runner for GraphQL API.
 * Simulates realistic virtual user journeys and outputs exact benchmark metrics.
 */

const targetUrl = process.env.GRAPHQL_URL || getArgValue('--url') || 'http://localhost:4000/graphql';
const isRamp = process.argv.includes('--ramp');
const customVUs = parseInt(getArgValue('--vus') || '10', 10);
const customDuration = parseInt(getArgValue('--duration') || '15', 10);

function getArgValue(flag) {
  const arg = process.argv.find((a) => a.startsWith(flag + '=') || a === flag);
  if (!arg) return null;
  if (arg.includes('=')) return arg.split('=')[1];
  const idx = process.argv.indexOf(flag);
  return process.argv[idx + 1] || null;
}

const GET_RELEASES_BODY = JSON.stringify({
  query: `query { releases { id name status completedSteps } }`,
});

const GET_RELEASE_BODY = (id) =>
  JSON.stringify({
    query: `query($id: ID!) { release(id: $id) { id name status completedSteps additionalInfo } }`,
    variables: { id },
  });

const TOGGLE_STEP_BODY = (id, stepId, completed) =>
  JSON.stringify({
    query: `mutation($id: ID!, $stepId: String!, $completed: Boolean!) {
      toggleReleaseStep(id: $id, stepId: $stepId, completed: $completed) { id status completedSteps }
    }`,
    variables: { id, stepId, completed },
  });

const UPDATE_INFO_BODY = (id, info) =>
  JSON.stringify({
    query: `mutation($id: ID!, $additionalInfo: String) {
      updateReleaseAdditionalInfo(id: $id, additionalInfo: $additionalInfo) { id additionalInfo }
    }`,
    variables: { id, additionalInfo: info },
  });

async function sendGraphQL(body) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const duration = performance.now() - start;

    if (!res.ok) {
      return { success: false, duration, error: `HTTP ${res.status}` };
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      return { success: false, duration, error: json.errors[0].message };
    }

    return { success: true, duration, data: json.data };
  } catch (err) {
    const duration = performance.now() - start;
    return { success: false, duration, error: err.message || 'Fetch error' };
  }
}

async function runVirtualUser(targetId, stopSignal, results) {
  const steps = ['code-freeze', 'automated-tests', 'security-scan', 'staging-smoke-test'];

  while (!stopSignal.stopped) {
    // 1. Fetch releases list
    const r1 = await sendGraphQL(GET_RELEASES_BODY);
    results.latencies.push(r1.duration);
    if (r1.success) results.success++;
    else {
      results.failed++;
      results.errors[r1.error] = (results.errors[r1.error] || 0) + 1;
    }

    if (stopSignal.stopped) break;

    // 2. Fetch single release
    const r2 = await sendGraphQL(GET_RELEASE_BODY(targetId));
    results.latencies.push(r2.duration);
    if (r2.success) results.success++;
    else {
      results.failed++;
      results.errors[r2.error] = (results.errors[r2.error] || 0) + 1;
    }

    if (stopSignal.stopped) break;

    // 3. Toggle step
    const step = steps[Math.floor(Math.random() * steps.length)];
    const r3 = await sendGraphQL(TOGGLE_STEP_BODY(targetId, step, true));
    results.latencies.push(r3.duration);
    if (r3.success) results.success++;
    else {
      results.failed++;
      results.errors[r3.error] = (results.errors[r3.error] || 0) + 1;
    }

    if (stopSignal.stopped) break;

    // 4. Update additional info
    const r4 = await sendGraphQL(UPDATE_INFO_BODY(targetId, `Load test note at ${Date.now()}`));
    results.latencies.push(r4.duration);
    if (r4.success) results.success++;
    else {
      results.failed++;
      results.errors[r4.error] = (results.errors[r4.error] || 0) + 1;
    }

    if (stopSignal.stopped) break;

    // 5. Fetch releases list again
    const r5 = await sendGraphQL(GET_RELEASES_BODY);
    results.latencies.push(r5.duration);
    if (r5.success) results.success++;
    else {
      results.failed++;
      results.errors[r5.error] = (results.errors[r5.error] || 0) + 1;
    }

    // Small think time
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function runStage(vus, durationSec, targetReleaseId) {
  console.log(`\n▶ Starting Test Stage: ${vus} Concurrent Users for ${durationSec}s ...`);

  const results = {
    vus,
    durationSec,
    success: 0,
    failed: 0,
    latencies: [],
    errors: {},
  };

  const stopSignal = { stopped: false };
  const startTime = performance.now();

  const vuPromises = [];
  for (let i = 0; i < vus; i++) {
    vuPromises.push(runVirtualUser(targetReleaseId, stopSignal, results));
  }

  await new Promise((resolve) => {
    setTimeout(() => {
      stopSignal.stopped = true;
      resolve();
    }, durationSec * 1000);
  });

  await Promise.all(vuPromises);
  const totalTimeSec = (performance.now() - startTime) / 1000;

  const totalRequests = results.success + results.failed;
  const errorRate = totalRequests > 0 ? ((results.failed / totalRequests) * 100).toFixed(2) : '0.00';
  const throughput = totalRequests > 0 ? (totalRequests / totalTimeSec).toFixed(1) : '0.0';

  results.latencies.sort((a, b) => a - b);
  const count = results.latencies.length;
  const avg = count > 0 ? (results.latencies.reduce((a, b) => a + b, 0) / count).toFixed(1) : '0.0';
  const p50 = count > 0 ? results.latencies[Math.floor(count * 0.5)].toFixed(1) : '0.0';
  const p95 = count > 0 ? results.latencies[Math.floor(count * 0.95)].toFixed(1) : '0.0';
  const p99 = count > 0 ? results.latencies[Math.floor(count * 0.99)].toFixed(1) : '0.0';
  const max = count > 0 ? results.latencies[count - 1].toFixed(1) : '0.0';

  console.log(`----------------------------------------------------------------`);
  console.log(`📊 Stage Results (${vus} VUs, ${totalTimeSec.toFixed(1)}s):`);
  console.log(`   Total Requests: ${totalRequests}`);
  console.log(`   Success:        ${results.success}`);
  console.log(`   Failed:         ${results.failed} (${errorRate}% error rate)`);
  console.log(`   Throughput:     ${throughput} req/sec`);
  console.log(`   Latency (ms):   Avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms | Max: ${max}ms`);

  if (Object.keys(results.errors).length > 0) {
    console.log(`   Errors Breakdown:`, results.errors);
  }

  return {
    vus,
    totalRequests,
    success: results.success,
    failed: results.failed,
    errorRate: parseFloat(errorRate),
    throughput: parseFloat(throughput),
    avgLatency: parseFloat(avg),
    p95Latency: parseFloat(p95),
    p99Latency: parseFloat(p99),
  };
}

async function main() {
  console.log(`================================================================`);
  console.log(`🚀 GraphQL API Stress & Load Test Runner`);
  console.log(`🎯 Target Endpoint: ${targetUrl}`);
  console.log(`================================================================`);

  // Verify connectivity and get an active release ID
  console.log(`\n🔍 Probing target endpoint...`);
  const probe = await sendGraphQL(GET_RELEASES_BODY);
  if (!probe.success || !probe.data?.releases || probe.data.releases.length === 0) {
    console.error(`❌ Could not connect or no releases found to test against!`);
    console.error(`   Error details:`, probe.error);
    process.exit(1);
  }

  const targetReleaseId = probe.data.releases[0].id;
  console.log(`✓ Connected successfully! Testing against Release ID: ${targetReleaseId}`);

  const summary = [];

  if (isRamp) {
    const stages = [
      { vus: 1, duration: 10 },
      { vus: 5, duration: 15 },
      { vus: 10, duration: 15 },
      { vus: 25, duration: 15 },
      { vus: 50, duration: 20 },
      { vus: 100, duration: 20 },
      { vus: 150, duration: 20 },
      { vus: 200, duration: 20 },
    ];

    for (const stage of stages) {
      const result = await runStage(stage.vus, stage.duration, targetReleaseId);
      summary.push(result);

      // Check degradation condition
      if (result.errorRate > 5.0 || result.p95Latency > 2000) {
        console.log(`\n⚠️ DEGRADATION THRESHOLD REACHED AT ${stage.vus} CONCURRENT USERS!`);
        console.log(`   (Error Rate: ${result.errorRate}% | p95 Latency: ${result.p95Latency}ms)`);
        break;
      }

      // Rest briefly between stages
      await new Promise((r) => setTimeout(r, 2000));
    }
  } else {
    const result = await runStage(customVUs, customDuration, targetReleaseId);
    summary.push(result);
  }

  console.log(`\n================================================================`);
  console.log(`📋 BENCHMARK SUMMARY TABLE`);
  console.log(`================================================================`);
  console.table(summary);
}

main().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
