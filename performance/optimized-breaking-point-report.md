# Optimized Breaking-Point Stress Test Report

**Date/Time:** `2026-09-27T09:00:51.429Z`  
**Target:** `http://localhost:4000/graphql`  
**Workload:** `GraphQL Read (releases & checklistSteps)`  
**Requests per Level:** `1000`  

## 1. Summary of Optimized Breaking Point

* **Last 100% Stable Concurrency:** `750` concurrent clients (0 failures)
* **First Failing / Breaking Concurrency:** `1000` concurrent clients
* **Failed Requests:** `18 / 1000` (1.80% failure rate)
* **Average Latency at Breaking Point:** `420.8ms`
* **P95 Latency at Breaking Point:** `641.36ms`
* **Throughput at Breaking Point:** `1377.85 req/sec`
* **Primary Error Types:** `{"Network Error":18}`

## 2. Optimized Progressive Concurrency Results

| Concurrency | Total Reqs | Successful | Failed | Success Rate | Avg Latency | P95 Latency | Max Latency | RPS | Errors |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **200** | 1000 | 1000 | 0 | **100%** | 172.19ms | 239.28ms | 274.05ms | 1051.85 req/s | None (100% OK) |
| **300** | 1000 | 1000 | 0 | **100%** | 189.27ms | 407.68ms | 708.59ms | 1347.01 req/s | None (100% OK) |
| **400** | 1000 | 1000 | 0 | **100%** | 213.37ms | 450.12ms | 619.43ms | 1521.44 req/s | None (100% OK) |
| **500** | 1000 | 1000 | 0 | **100%** | 229.42ms | 545.51ms | 591.14ms | 1592.23 req/s | None (100% OK) |
| **600** | 1000 | 1000 | 0 | **100%** | 261.17ms | 586ms | 605.33ms | 1560.99 req/s | None (100% OK) |
| **750** | 1000 | 1000 | 0 | **100%** | 276.23ms | 535.74ms | 601.94ms | 1522.51 req/s | None (100% OK) |
| **1000** | 1000 | 982 | 18 | **98.2%** | 420.8ms | 641.36ms | 658.71ms | 1377.85 req/s | Network Error: 18 |

## 3. BEFORE vs AFTER Breaking Point Comparison

### Breaking Point Thresholds

| Metric | Baseline (Unoptimized) | Optimized (In-Memory Cache) | Improvement |
| :--- | :--- | :--- | :--- |
| **Last Stable Concurrency** | `600` concurrent clients | `750` concurrent clients | **+150 clients (+25% headroom)** |
| **First Failing Concurrency** | `750` concurrent clients | `1000` concurrent clients | **Extended breaking point to 1000** |
| **State at Concurrency 750** | **BROKEN** (32 dropped requests, 3.20% failure) | **STABLE** (0 dropped requests, 100% success) | **100% reliability at 750 concurrency** |
| **Failures at Breaking Point** | 32 dropped requests (3.20%) | 18 dropped requests (1.80%) | **43.8% fewer drops under extreme load** |

### Level-by-Level Latency & Throughput Comparison

| Concurrency | Baseline Avg Latency | Optimized Avg Latency | Baseline RPS | Optimized RPS | Improvement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **200** | 198.78 ms | **172.19 ms** | 915.67 req/s | **1051.85 req/s** | +14.9% RPS, 13.4% faster |
| **300** | 222.14 ms | **189.27 ms** | 1162.44 req/s | **1347.01 req/s** | +15.9% RPS, 14.8% faster |
| **400** | 213.25 ms | **213.37 ms** | 1474.66 req/s | **1521.44 req/s** | +3.2% RPS |
| **500** | 232.57 ms | **229.42 ms** | 1501.31 req/s | **1592.23 req/s** | +6.1% RPS |
| **600** | 337.63 ms | **261.17 ms** | 1290.73 req/s | **1560.99 req/s** | **+20.9% RPS, 22.6% faster** |
| **750** | **FAILED (32 drops)** | **100% OK (0 drops)** | 1466.47 req/s | **1522.51 req/s** | **Fixed breaking point (0 vs 32 failures)** |
| **1000** | *Untested (failed at 750)* | **98.2% OK (18 drops)** | N/A | **1377.85 req/s** | New extreme threshold |
