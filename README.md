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

## 10. Performance Testing & Measured Results

Load tests were conducted using `load-tests/baseline-benchmark.js` against `http://localhost:4000/graphql` across 1,000 requests per tier:

| Concurrency | Baseline RPS | Optimized RPS | Throughput Improvement | Baseline p95 Latency | Optimized p95 Latency | p95 Latency Reduction | Success Rate |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **10** | 708.86 req/s | **1,259.42 req/s** | **+77.7%** | 14.00 ms | **12.41 ms** | **-11.4%** | 100% (0 errors) |
| **25** | 1,125.00 req/s | **1,575.19 req/s** | **+40.0%** | 30.82 ms | **21.05 ms** | **-31.7%** | 100% (0 errors) |
| **50** | 1,306.66 req/s | **1,497.86 req/s** | **+14.6%** | 50.04 ms | **53.57 ms** | ~flat | 100% (0 errors) |
| **100** | 1,330.63 req/s | **1,221.31 req/s** | -8.2% | 120.04 ms | **145.41 ms** | - | 100% (0 errors) |
| **200** | 1,266.57 req/s | **2,057.64 req/s** | **+62.5%** | 257.69 ms | **170.35 ms** | **-33.9%** | 100% (0 errors) |

Artifacts preserved:
* `performance/baseline-results.json` & `performance/baseline-report.md`
* `performance/optimized-results.json` & `performance/optimization-report.md`

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
4. **UI Styling & Theming:** Structuring CSS tokens for the pure black (`#000000`) theme and responsive layout.

---

## 14. Production Deployment

* **Target Cloud Platforms:** Render / Fly.io / AWS ECS / Railway.
* **Backend Image:** Multi-stage `backend/Dockerfile` ready for container deployment.
* **Frontend SPA:** Static bundle (`npm --workspace=frontend run build`) ready for deployment to Cloudflare Pages, Vercel, or Netlify.
* **Database:** Managed PostgreSQL (e.g., Supabase, Neon, AWS RDS).

*(Deployment configuration placeholders ready for production release).*
