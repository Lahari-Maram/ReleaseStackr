# Baseline Performance Benchmark Report

**Date:** 2026-09-27T07:01:38.496Z
**Target Endpoint:** `http://localhost:4000/graphql`
**Workload:** GraphQL Read Query (`releases` with full field selection + `checklistSteps`)
**Requests Per Concurrency Level:** 1000

## 1. Measured Baseline Results

| Concurrency | Total Req | Success | Failed | Success Rate | Avg Latency | p50 Latency | p95 Latency | p99 Latency | Max Latency | Req/Sec (RPS) |
|---|---|---|---|---|---|---|---|---|---|---|
| **10** | 1000 | 1000 | 0 | 100% | 13.97 ms | 7.99 ms | 14 ms | 20.98 ms | 1085.13 ms | **708.86** |
| **25** | 1000 | 1000 | 0 | 100% | 21.91 ms | 20.57 ms | 30.82 ms | 51.16 ms | 53.1 ms | **1125** |
| **50** | 1000 | 1000 | 0 | 100% | 37.5 ms | 35.06 ms | 50.04 ms | 91.65 ms | 98.94 ms | **1306.66** |
| **100** | 1000 | 1000 | 0 | 100% | 72.35 ms | 67.45 ms | 120.04 ms | 160.99 ms | 163.98 ms | **1330.63** |
| **200** | 1000 | 1000 | 0 | 100% | 143.71 ms | 135.74 ms | 257.69 ms | 298.71 ms | 344.62 ms | **1266.57** |

## 2. Performance Analysis & Degradation Characteristics

- **Peak Throughput:** **1330.63 RPS** achieved at **100 concurrent connections**.
- **First Clear Degradation / Bottleneck Threshold:** **200 concurrent connections** (p95 latency exceeded 200ms (257.69ms)).

### Latency & Throughput Progression

- **Concurrency 10:** Avg `13.97ms`, p95 `14ms`, Max `1085.13ms` &rarr; **708.86 RPS**
- **Concurrency 25:** Avg `21.91ms`, p95 `30.82ms`, Max `53.1ms` &rarr; **1125 RPS**
- **Concurrency 50:** Avg `37.5ms`, p95 `50.04ms`, Max `98.94ms` &rarr; **1306.66 RPS**
- **Concurrency 100:** Avg `72.35ms`, p95 `120.04ms`, Max `163.98ms` &rarr; **1330.63 RPS**
- **Concurrency 200:** Avg `143.71ms`, p95 `257.69ms`, Max `344.62ms` &rarr; **1266.57 RPS**

## 3. Bottleneck Identification & Architecture Assessment

Based on the measured baseline metrics and architectural inspection:

1. **Database Connection Pool Contention (Prisma / PostgreSQL):**
   - The baseline configuration does not specify an explicit `connection_limit` in `DATABASE_URL` or pool configuration in Prisma Client.
   - Under higher concurrency (50–200 concurrent requests), database query queuing occurs because available PostgreSQL connections in the default pool are exhausted by incoming parallel GraphQL requests, driving p95 latency up.

2. **Single-Threaded GraphQL & Event-Loop Overhead:**
   - Apollo Server runs on the main Node.js event loop parsing and executing queries sequentially. At concurrency > 50, per-request event-loop tick delays compound with I/O wait times.

3. **Uncached Read Resolver Pattern:**
   - Every read operation executes a live SQL `SELECT` query against PostgreSQL (`prisma.release.findMany` with sorting and in-memory status recalculation), resulting in direct I/O amplification for identical datasets.

## 4. Conclusion & Next Steps

- Baseline data captured and stored in `performance/baseline-results.json`.
- Functional integrity preserved without modifying application logic.
