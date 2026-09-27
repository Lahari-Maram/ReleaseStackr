# ReleaseStackr — Release Checklist & Tracking

A full-stack software release management single-page application (SPA) built with **React**, **GraphQL (Apollo Server & Client)**, **Node.js/TypeScript**, and **PostgreSQL (Prisma ORM)**. It enables engineering teams to track release candidates, check off standardized release steps, compute release statuses dynamically, and manage deployment metadata.

---

## 1. Project Overview & Key Features

* **Release Candidate Management:** Create, view, update notes for, and delete software releases.
* **Standardized 8-Step Checklist:** Interactive checklist covering the entire release lifecycle from code freeze to post-deploy verification.
* **Dynamic Lifecycle Status Calculation:**
  * **`PLANNED`**: `0` completed steps
  * **`ONGOING`**: `1–7` completed steps
  * **`DONE`**: All `8` completed steps
* **GraphQL API:** Type-safe queries and mutations with Apollo Server.
* **PostgreSQL Persistence:** Relational persistence with UUID primary keys and Prisma ORM.
* **High-Performance In-Memory Caching:** Sub-millisecond read throughput with strict mutation cache invalidation.
* **Modern UI:** Responsive single-page interface with a pure black (`#000000`) theme, dark gray cards, progress bars, and modal workflows.

---

## 2. Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      React 18 SPA (Vite)                    │
│             Apollo Client · Lucide Icons · CSS              │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP / POST (GraphQL)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Node.js / Express API                      │
│            Apollo Server v4 · In-Memory Cache               │
└──────────────────────────────┬──────────────────────────────┘
                               │  Prisma ORM (Connection Pool)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│                  `releases` Relational Table                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Variables

The backend requires the following environment variables configured in `backend/.env`:

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port for the Express & Apollo Server | `4000` |
| `NODE_ENV` | Runtime environment mode | `development` (or `production`) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/release_checklist?schema=public` |

---

## 4. Local Setup & Run Instructions

### Prerequisites
* **Node.js** &ge; 18.x
* **npm** &ge; 9.x
* **PostgreSQL** &ge; 14 running locally on port `5432`

### 1. Install Dependencies
```bash
# Install dependencies across all npm workspaces (backend, frontend, load-tests)
npm install
```

### 2. Configure Database & Environment
Create `backend/.env` (or verify existing configuration):
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/release_checklist?schema=public"
```

### 3. Initialize Database Schema & Seed Data
```bash
# Push Prisma schema to PostgreSQL
npm --workspace=backend run db:push

# (Optional) Seed the database with sample releases
npm --workspace=backend run db:seed
```

### 4. Start Development Servers
Run both backend and frontend concurrently from the root:
```bash
npm run dev
```
Or start them individually:
* **Backend:** `npm run dev:backend` &rarr; Running at `http://localhost:4000/graphql`
* **Frontend:** `npm run dev:frontend` &rarr; Running at `http://localhost:3000`

---

## 5. GraphQL API & Endpoints

* **GraphQL Endpoint:** `http://localhost:4000/graphql`
* **Health Check:** `http://localhost:4000/health`

### GraphQL Schema Operations

#### Queries
```graphql
# 1. Fetch all releases with status and completed steps
query GetReleases {
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
}

# 2. Fetch single release by ID
query GetRelease($id: ID!) {
  release(id: $id) {
    id
    name
    date
    status
    additionalInfo
    completedSteps
    createdAt
    updatedAt
  }
}

# 3. Fetch fixed 8 checklist steps
query GetChecklistSteps {
  checklistSteps {
    id
    name
    description
    order
  }
}
```

#### Mutations
```graphql
# 1. Create a new release candidate
mutation CreateRelease($input: CreateReleaseInput!) {
  createRelease(input: $input) {
    id
    name
    date
    status
    additionalInfo
    completedSteps
  }
}

# 2. Toggle a checklist step
mutation ToggleStep($id: ID!, $stepId: String!, $completed: Boolean!) {
  toggleReleaseStep(id: $id, stepId: $stepId, completed: $completed) {
    id
    status
    completedSteps
  }
}

# 3. Update release additional notes
mutation UpdateNotes($id: ID!, $additionalInfo: String) {
  updateReleaseAdditionalInfo(id: $id, additionalInfo: $additionalInfo) {
    id
    additionalInfo
    updatedAt
  }
}

# 4. Delete a release
mutation DeleteRelease($id: ID!) {
  deleteRelease(id: $id)
}
```

---

## 6. PostgreSQL Database Schema

Defined in `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Release {
  id             String   @id @default(uuid())
  name           String
  date           DateTime
  additionalInfo String?  @db.Text
  completedSteps Json     @default("[]")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("releases")
}
```

---

## 7. Standardized Release Checklist Steps

The 8 immutable release checklist steps configured in `backend/src/constants/steps.ts`:

1. **`code-freeze`**: Code Freeze & Branch Cut
2. **`automated-tests`**: Automated Test Suite Passed
3. **`security-scan`**: Security & Dependency Scan
4. **`staging-smoke-test`**: Staging Smoke & QA Sign-off
5. **`db-migrations`**: Database Migrations Verified
6. **`production-deploy`**: Production Deployment
7. **`post-deploy-verify`**: Post-Deploy Verification & Monitoring
8. **`release-notes`**: Release Notes Published

---

## 8. Automatic Release Status Logic

Status is centrally derived from the completed steps (`backend/src/utils/status.ts`):

$$\text{Status} = \begin{cases} \text{PLANNED} & \text{if } |\text{valid completed steps}| = 0 \\ \text{DONE} & \text{if } |\text{valid completed steps}| \ge 8 \\ \text{ONGOING} & \text{otherwise} \end{cases}$$

---

## 9. Caching & Performance Optimization Design

* **Bottleneck Identified:** Under high read concurrency (100–200 parallel connections), Prisma connection pool queuing and repetitive PostgreSQL `SELECT` operations caused `p95` latency to spike to `257.69 ms`.
* **Implemented Optimization:** An in-memory cache (`ReleaseCache` in `backend/src/utils/cache.ts`) stores formatted release records.
* **Data Consistency:** Any write mutation (`createRelease`, `updateReleaseAdditionalInfo`, `toggleReleaseStep`, `deleteRelease`) immediately invalidates the cache after database commitment, guaranteeing zero stale reads.

---

## 10. Performance Optimization & Breaking-Point Benchmarks

To evaluate server throughput and discover system breaking points under high concurrent traffic, load tests were executed against the representative GraphQL read workload (`releases` + `checklistSteps`, 1,000 requests per level) using our custom load test harnesses in `load-tests/`.

### 1. Baseline vs. Optimized Breaking-Point Analysis

| Metric | Baseline (Unoptimized) | Optimized (In-Memory Cache) | Verified Improvement |
| :--- | :--- | :--- | :--- |
| **Last Stable Concurrency** | `600` concurrent clients | **`750` concurrent clients** | **+150 clients (+25% headroom)** |
| **First Failing Concurrency** | `750` concurrent clients | **`1000` concurrent clients** | **Breaking threshold extended to 1000** |
| **State at Concurrency 750** | **FAILED (32 / 1000 dropped, 3.2% rate)** | **STABLE (0 / 1000 dropped, 100% OK)** | **100% reliability at previously failing load** |
| **Failures at Breaking Point** | 32 dropped requests (3.20%) | 18 dropped requests (1.80%) | **43.8% fewer drops under extreme load** |

### 2. High-Concurrency Progression (200 – 1000 Clients)

| Concurrency | Baseline Avg Latency | Optimized Avg Latency | Baseline RPS | Optimized RPS | Improvement Highlights |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **200** | 198.78 ms | **172.19 ms** | 915.67 req/s | **1,051.85 req/s** | +14.9% RPS, 13.4% faster |
| **300** | 222.14 ms | **189.27 ms** | 1,162.44 req/s | **1,347.01 req/s** | +15.9% RPS, 14.8% faster |
| **400** | 213.25 ms | **213.37 ms** | 1,474.66 req/s | **1,521.44 req/s** | +3.2% RPS |
| **500** | 232.57 ms | **229.42 ms** | 1,501.31 req/s | **1,592.23 req/s** | +6.1% RPS (Peak Throughput) |
| **600** | 337.63 ms | **261.17 ms** | 1,290.73 req/s | **1,560.99 req/s** | **+20.9% RPS, 22.6% faster** |
| **750** | **FAILED (32 drops)** | **100% OK (0 drops)** | 1,466.47 req/s | **1,522.51 req/s** | **Eliminated failure point (100% success)** |
| **1000** | *Untested (failed at 750)* | **98.20% OK (18 drops)** | N/A | **1,377.85 req/s** | **New extreme breaking limit** |

### 3. Optimization Architecture: In-Memory TTL Cache
* **Strategy:** Write-through in-memory caching with explicit TTL expiration for repeated read queries.
* **Strict Cache Invalidation:** All write mutations (`createRelease`, `toggleReleaseStep`, `updateReleaseAdditionalInfo`, `deleteRelease`) immediately evict list and item caches to guarantee zero stale data reads.

### 4. Preserved Performance Artifacts
* Baseline Benchmark: `performance/baseline-results.json` & `performance/baseline-report.md`
* Baseline Breaking-Point: `performance/baseline-breaking-point-results.json` & `performance/baseline-breaking-point-report.md`
* Optimized Benchmark: `performance/optimized-results.json` & `performance/optimization-report.md`
* Optimized Breaking-Point: `performance/optimized-breaking-point-results.json` & `performance/optimized-breaking-point-report.md`

---

## 11. Automated Testing

The backend includes a comprehensive Vitest test suite testing status calculation, GraphQL resolvers, and cache invalidation.

```bash
# Run all automated tests
npm test

# Run backend tests with Vitest watch mode
npm --workspace=backend run test:watch
```

**Test Results:** **26 / 26 passed** across 3 test suites:
* `src/__tests__/status.test.ts` (8 tests)
* `src/__tests__/resolvers.test.ts` (14 tests)
* `src/__tests__/cache.test.ts` (4 tests)

---

## 12. Docker & Docker Compose

To launch the complete application stack (PostgreSQL + Backend API) in isolated Docker containers:

```bash
# Build and run containers
docker compose up --build

# Run in background
docker compose up -d

# Stop and clean up containers
docker compose down
```

### Docker Services
* **`postgres`**: `postgres:16-alpine` running on port `5432` with healthcheck on `pg_isready`.
* **`backend`**: Multi-stage `node:20-alpine` build running on port `4000` with automated database schema migration on startup.

---

## 13. AI-Assisted Design Decisions

During development, AI pair-programming was utilized for:
1. **Schema & API Design:** Formulating the GraphQL schema, type definitions, and mapping relational JSON columns for step tracking.
2. **Deterministic Lifecycle Rules:** Centralizing status transitions (`computeReleaseStatus`) to eliminate duplicate business logic between frontend and backend.
3. **Performance Diagnostics:** Diagnosing Prisma connection pool contention at &ge; 100 concurrency and designing a write-through in-memory cache with immediate mutation invalidation.
4. **UI Styling & Theming:** Structuring CSS tokens for the Dark Mode (`#000000`) and Light Mode design system, theme persistence, and responsive UI components.

---

## 14. Live Production Deployment

The ReleaseStackr application is deployed and live in production:

* **Frontend Application (Render Static Site):** [https://releasestackr.onrender.com](https://releasestackr.onrender.com)
* **Backend API (Render Web Service):** [https://releasestackr-api.onrender.com](https://releasestackr-api.onrender.com)
* **GraphQL Endpoint:** [https://releasestackr-api.onrender.com/graphql](https://releasestackr-api.onrender.com/graphql)
* **Health Check Endpoint:** [https://releasestackr-api.onrender.com/health](https://releasestackr-api.onrender.com/health)
* **Database Cluster:** Neon Serverless PostgreSQL (ap-southeast-1, Connection Pooling enabled)
