import fs from 'fs';
import path from 'path';
import http from 'http';

const GRAPHQL_URL = process.env.GRAPHQL_URL || 'http://localhost:4000/graphql';
const REQUESTS_PER_LEVEL = 1000;
const TIMEOUT_MS = 10000;

// Progressive concurrency levels: 200, 300, 400, 500, 600, 750, 1000, + higher if needed
const INITIAL_CONCURRENCY_LEVELS = [200, 300, 400, 500, 600, 750, 1000];
const EXTENDED_LEVELS = [1250, 1500, 1750, 2000, 2500];

// HTTP Agent configured for high throughput
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 3000,
  maxFreeSockets: 1000,
  timeout: TIMEOUT_MS,
});

const READ_QUERY = JSON.stringify({
  query: `
    query GetReleasesWithDetails {
      releases {
        id
        name
        date
        status
        additionalInfo
        completedSteps
        createdAt
        updatedAt
      }
      checklistSteps {
        id
        name
        description
        order
      }
    }
  `,
});

function executeRequest(body) {
  return new Promise((resolve) => {
    const start = performance.now();
    const url = new URL(GRAPHQL_URL);

    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        agent: httpAgent,
        timeout: TIMEOUT_MS,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const latency = performance.now() - start;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data);
              if (json.errors && json.errors.length > 0) {
                resolve({
                  success: false,
                  latency,
                  statusCode: res.statusCode,
                  error: json.errors[0].message || 'GraphQL Error',
                });
              } else {
                resolve({
                  success: true,
                  latency,
                  statusCode: res.statusCode,
                });
              }
            } catch (err) {
              resolve({
                success: false,
                latency,
                statusCode: res.statusCode,
                error: 'Invalid JSON response',
              });
            }
          } else {
            resolve({
              success: false,
              latency,
              statusCode: res.statusCode,
              error: `HTTP ${res.statusCode}`,
            });
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('ETIMEDOUT'));
    });

    req.on('error', (err) => {
      const latency = performance.now() - start;
      resolve({
        success: false,
        latency,
        statusCode: 0,
        error: err.message || 'Network Error',
      });
    });

    req.write(body);
    req.end();
  });
}

async function runBenchmarkLevel(concurrency, totalRequests) {
  console.log(`\n============================================================`);
  console.log(`Testing Concurrency: ${concurrency} | Total Requests: ${totalRequests}`);
  console.log(`============================================================`);

  const results = [];
  let completedCount = 0;
  let nextReqIndex = 0;
  const errors = {};

  const startTime = performance.now();

  async function worker() {
    while (nextReqIndex < totalRequests) {
      nextReqIndex++;
      const res = await executeRequest(READ_QUERY);
      results.push(res);
      completedCount++;

      if (!res.success) {
        errors[res.error] = (errors[res.error] || 0) + 1;
      }

      if (completedCount % 100 === 0 || completedCount === totalRequests) {
        process.stdout.write(`  Progress: ${completedCount}/${totalRequests} (${((completedCount / totalRequests) * 100).toFixed(0)}%)\r`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (performance.now() - startTime) / 1000;
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const successRate = totalRequests > 0 ? (successful / totalRequests) * 100 : 0;
  const rps = totalRequests > 0 ? totalRequests / totalTimeSec : 0;

  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const minLatency = latencies.length > 0 ? latencies[0] : 0;
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.50)] : 0;
  const p90 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.90)] : 0;
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  const maxLatency = latencies.length > 0 ? latencies[latencies.length - 1] : 0;

  const levelResult = {
    concurrency,
    totalRequests,
    successful,
    failed,
    successRate: parseFloat(successRate.toFixed(2)),
    averageLatencyMs: parseFloat(avgLatency.toFixed(2)),
    minLatencyMs: parseFloat(minLatency.toFixed(2)),
    p50LatencyMs: parseFloat(p50.toFixed(2)),
    p90LatencyMs: parseFloat(p90.toFixed(2)),
    p95LatencyMs: parseFloat(p95.toFixed(2)),
    p99LatencyMs: parseFloat(p99.toFixed(2)),
    maxLatencyMs: parseFloat(maxLatency.toFixed(2)),
    requestsPerSecond: parseFloat(rps.toFixed(2)),
    totalDurationSeconds: parseFloat(totalTimeSec.toFixed(2)),
    errors,
  };

  console.log(`\n  Completed in: ${totalTimeSec.toFixed(2)}s`);
  console.log(`  Throughput:   ${rps.toFixed(2)} req/sec`);
  console.log(`  Success:      ${successful}/${totalRequests} (${successRate.toFixed(2)}%)`);
  console.log(`  Failed:       ${failed}/${totalRequests} (${(100 - successRate).toFixed(2)}%)`);
  console.log(`  Latency:      Avg: ${avgLatency.toFixed(2)}ms | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | Max: ${maxLatency.toFixed(2)}ms`);
  if (Object.keys(errors).length > 0) {
    console.log(`  Errors:      `, errors);
  }

  return levelResult;
}

function generateMarkdownReport(metadata, breakingPoint, baselineBreakingPoint) {
  let md = `# Optimized Breaking-Point Stress Test Report\n\n`;
  md += `**Date/Time:** \`${metadata.timestamp}\`  \n`;
  md += `**Target:** \`${metadata.endpoint}\`  \n`;
  md += `**Workload:** \`${metadata.workload}\`  \n`;
  md += `**Requests per Level:** \`${metadata.requestsPerLevel}\`  \n\n`;

  md += `## 1. Summary of Optimized Breaking Point\n\n`;
  md += `* **Last 100% Stable Concurrency:** \`${breakingPoint.lastStableConcurrency}\` concurrent clients (0 failures)\n`;
  md += `* **First Failing / Breaking Concurrency:** \`${breakingPoint.firstFailingConcurrency}\` concurrent clients\n`;
  md += `* **Failed Requests:** \`${breakingPoint.failedRequests} / ${metadata.requestsPerLevel}\` (${breakingPoint.failureRate}% failure rate)\n`;
  md += `* **Average Latency at Breaking Point:** \`${breakingPoint.avgLatency}ms\`\n`;
  md += `* **P95 Latency at Breaking Point:** \`${breakingPoint.p95Latency}ms\`\n`;
  md += `* **Throughput at Breaking Point:** \`${breakingPoint.rps} req/sec\`\n`;
  md += `* **Primary Error Types:** \`${JSON.stringify(breakingPoint.errors)}\`\n\n`;

  md += `## 2. Optimized Progressive Concurrency Results\n\n`;
  md += `| Concurrency | Total Reqs | Successful | Failed | Success Rate | Avg Latency | P95 Latency | Max Latency | RPS | Errors |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of metadata.results) {
    const errorSummary = Object.keys(r.errors).length > 0
      ? Object.entries(r.errors).map(([k, v]) => `${k}: ${v}`).join(', ')
      : 'None (100% OK)';
    md += `| **${r.concurrency}** | ${r.totalRequests} | ${r.successful} | ${r.failed} | **${r.successRate}%** | ${r.averageLatencyMs}ms | ${r.p95LatencyMs}ms | ${r.maxLatencyMs}ms | ${r.requestsPerSecond} req/s | ${errorSummary} |\n`;
  }

  if (baselineBreakingPoint) {
    md += `\n## 3. BEFORE vs AFTER Breaking Point Comparison\n\n`;
    md += `| Metric | Baseline (Unoptimized) | Optimized (In-Memory Cache) | Improvement |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    md += `| **Last Stable Concurrency** | \`${baselineBreakingPoint.lastStableConcurrency}\` clients | \`${breakingPoint.lastStableConcurrency}\` clients | **${breakingPoint.lastStableConcurrency >= baselineBreakingPoint.lastStableConcurrency ? '+' : ''}${breakingPoint.lastStableConcurrency - baselineBreakingPoint.lastStableConcurrency} concurrency headroom** |\n`;
    md += `| **First Failing Concurrency** | \`${baselineBreakingPoint.firstFailingConcurrency}\` clients | \`${breakingPoint.firstFailingConcurrency}\` clients | **Extended resilience** |\n`;
    md += `| **Failed Requests at Break** | ${baselineBreakingPoint.failedRequests} (${baselineBreakingPoint.failureRate}%) | ${breakingPoint.failedRequests} (${breakingPoint.failureRate}%) | **${breakingPoint.failureRate}% failure rate** |\n`;
    md += `| **Avg Latency at Break** | ${baselineBreakingPoint.avgLatency}ms | ${breakingPoint.avgLatency}ms | **${((1 - breakingPoint.avgLatency / baselineBreakingPoint.avgLatency) * 100).toFixed(1)}% faster** |\n`;
    md += `| **P95 Latency at Break** | ${baselineBreakingPoint.p95Latency}ms | ${breakingPoint.p95Latency}ms | **${((1 - breakingPoint.p95Latency / baselineBreakingPoint.p95Latency) * 100).toFixed(1)}% lower tail latency** |\n`;
    md += `| **Throughput at Break** | ${baselineBreakingPoint.rps} req/s | ${breakingPoint.rps} req/s | **${((breakingPoint.rps / baselineBreakingPoint.rps - 1) * 100).toFixed(1)}% higher RPS** |\n`;
  }

  return md;
}

async function main() {
  console.log(`============================================================`);
  console.log(`OPTIMIZED BREAKING-POINT STRESS TEST RUNNER`);
  console.log(`Target: ${GRAPHQL_URL}`);
  console.log(`Workload: Representative GraphQL Read (releases + checklistSteps)`);
  console.log(`Initial Concurrency Levels: ${INITIAL_CONCURRENCY_LEVELS.join(' -> ')}`);
  console.log(`Requests per level: ${REQUESTS_PER_LEVEL}`);
  console.log(`============================================================\n`);

  const perfDir = path.join(process.cwd(), 'performance');
  if (!fs.existsSync(perfDir)) {
    fs.mkdirSync(perfDir, { recursive: true });
  }

  // Warm-up phase
  console.log('⚡ Running warm-up phase (50 requests)...');
  for (let i = 0; i < 50; i++) {
    await executeRequest(READ_QUERY);
  }
  console.log('✓ Warm-up complete.\n');

  const benchmarkResults = [];
  let lastStableConcurrency = 0;
  let firstFailingResult = null;
  let stopEscalation = false;

  for (const concurrency of INITIAL_CONCURRENCY_LEVELS) {
    if (stopEscalation) break;

    const result = await runBenchmarkLevel(concurrency, REQUESTS_PER_LEVEL);
    benchmarkResults.push(result);

    if (result.failed === 0) {
      lastStableConcurrency = concurrency;
    } else {
      if (!firstFailingResult) {
        firstFailingResult = result;
      }
      if (result.failed > 30) {
        console.log(`\n⚠️ Significant failure threshold reached at concurrency ${concurrency} (${result.failed} dropped requests). Stopping escalation.`);
        stopEscalation = true;
      }
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  // If 1000 still had 0 failures, continue escalating through EXTENDED_LEVELS
  if (!firstFailingResult && !stopEscalation) {
    console.log(`\n🚀 Concurrency 1000 achieved 100% success! Escalating to extended concurrency levels...`);
    for (const concurrency of EXTENDED_LEVELS) {
      if (stopEscalation) break;

      const result = await runBenchmarkLevel(concurrency, REQUESTS_PER_LEVEL);
      benchmarkResults.push(result);

      if (result.failed === 0) {
        lastStableConcurrency = concurrency;
      } else {
        if (!firstFailingResult) {
          firstFailingResult = result;
        }
        if (result.failed > 30) {
          console.log(`\n⚠️ Significant failure threshold reached at concurrency ${concurrency} (${result.failed} dropped requests). Stopping escalation.`);
          stopEscalation = true;
        }
      }

      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const breakingPoint = {
    lastStableConcurrency,
    firstFailingConcurrency: firstFailingResult ? firstFailingResult.concurrency : 'N/A (> tested limit)',
    failedRequests: firstFailingResult ? firstFailingResult.failed : 0,
    failureRate: firstFailingResult ? (100 - firstFailingResult.successRate).toFixed(2) : '0',
    avgLatency: firstFailingResult ? firstFailingResult.averageLatencyMs : 0,
    p95Latency: firstFailingResult ? firstFailingResult.p95LatencyMs : 0,
    rps: firstFailingResult ? firstFailingResult.requestsPerSecond : 0,
    errors: firstFailingResult ? firstFailingResult.errors : {},
  };

  const metadata = {
    timestamp: new Date().toISOString(),
    endpoint: GRAPHQL_URL,
    workload: 'GraphQL Read (releases & checklistSteps)',
    requestsPerLevel: REQUESTS_PER_LEVEL,
    breakingPoint,
    results: benchmarkResults,
  };

  // Load baseline breaking point if available for comparison
  let baselineBreakingPoint = null;
  const baselineBreakingPointPath = path.join(perfDir, 'baseline-breaking-point-results.json');
  if (fs.existsSync(baselineBreakingPointPath)) {
    try {
      const baselineData = JSON.parse(fs.readFileSync(baselineBreakingPointPath, 'utf-8'));
      baselineBreakingPoint = baselineData.breakingPoint;
    } catch (e) {
      console.warn('Could not parse baseline breaking point results:', e);
    }
  }

  // Write new optimized breaking-point artifacts (preserving baseline and earlier optimization results)
  const optimizedBreakingPointJsonPath = path.join(perfDir, 'optimized-breaking-point-results.json');
  fs.writeFileSync(optimizedBreakingPointJsonPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`\n💾 Saved raw optimized breaking-point results to: ${optimizedBreakingPointJsonPath}`);

  const optimizedBreakingPointMdPath = path.join(perfDir, 'optimized-breaking-point-report.md');
  const mdReport = generateMarkdownReport(metadata, breakingPoint, baselineBreakingPoint);
  fs.writeFileSync(optimizedBreakingPointMdPath, mdReport, 'utf-8');
  console.log(`💾 Saved optimized breaking-point markdown report to: ${optimizedBreakingPointMdPath}`);

  console.log(`\n============================================================`);
  console.log(`OPTIMIZED BREAKING POINT SUMMARY`);
  console.log(`============================================================`);
  console.log(`Last Stable Concurrency:   ${breakingPoint.lastStableConcurrency}`);
  console.log(`First Failing Concurrency: ${breakingPoint.firstFailingConcurrency}`);
  console.log(`Failed Requests:           ${breakingPoint.failedRequests} / ${REQUESTS_PER_LEVEL} (${breakingPoint.failureRate}%)`);
  console.log(`Average Latency at Break:  ${breakingPoint.avgLatency}ms`);
  console.log(`P95 Latency at Break:      ${breakingPoint.p95Latency}ms`);
  console.log(`RPS at Break:              ${breakingPoint.rps} req/sec`);
  console.log(`Errors:                   `, breakingPoint.errors);
  console.log(`============================================================\n`);
}

main().catch((err) => {
  console.error('Fatal error in optimized breaking-point runner:', err);
  process.exit(1);
});
