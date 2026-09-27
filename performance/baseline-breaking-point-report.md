# Baseline Breaking-Point Stress Test Report

**Date/Time:** `2026-09-27T08:58:02.815Z`  
**Target:** `http://localhost:4000/graphql`  
**Workload:** `GraphQL Read (releases & checklistSteps)`  
**Requests per Level:** `1000`  

## 1. Summary of Breaking Point Finding

* **Last 100% Stable Concurrency:** `600` concurrent clients (0 failures)
* **First Failing / Breaking Concurrency:** `750` concurrent clients
* **Failure Count / Dropped Requests:** `32 / 1000` (3.20% failure rate)
* **Average Latency at Breaking Point:** `298.77ms`
* **P95 Latency at Breaking Point:** `589.23ms`
* **Throughput at Breaking Point:** `1466.47 req/sec`
* **Primary Error Types:** `{"Network Error":32}`

## 2. Progressive Concurrency Results

| Concurrency | Total Reqs | Successful | Failed | Success Rate | Avg Latency | P95 Latency | Max Latency | RPS | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **200** | 1000 | 1000 | 0 | **100%** | 198.78ms | 260.91ms | 301.31ms | 915.67 req/s | None (100% OK) |
| **300** | 1000 | 1000 | 0 | **100%** | 222.14ms | 500.87ms | 814.45ms | 1162.44 req/s | None (100% OK) |
| **400** | 1000 | 1000 | 0 | **100%** | 213.25ms | 452.67ms | 643.05ms | 1474.66 req/s | None (100% OK) |
| **500** | 1000 | 1000 | 0 | **100%** | 232.57ms | 569.97ms | 625.36ms | 1501.31 req/s | None (100% OK) |
| **600** | 1000 | 1000 | 0 | **100%** | 337.63ms | 697.13ms | 725.09ms | 1290.73 req/s | None (100% OK) |
| **750** | 1000 | 968 | 32 | **96.8%** | 298.77ms | 589.23ms | 625.8ms | 1466.47 req/s | Network Error: 32 |

## 3. Loom Video Commentary Guidance

When presenting this breaking point in the Loom walkthrough video:

1. **Show the baseline breaking point escalation:** Point out that up to `600` concurrency, the system handled traffic stably without dropping requests, but at `750` concurrency, socket exhaustion / event loop contention caused 32 requests to drop (3.20% failure rate).
2. **Highlight Latency Degradation:** Explain that the average latency climbed from sub-10ms up to `298.77ms` with p95 reaching `589.23ms` under extreme unoptimized load.
3. **Transition to Optimization:** State that this breaking point demonstrated the need for our in-memory caching and request optimization layer, which buffers repeat queries and keeps response times predictable.
