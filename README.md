# 📡 GitHub Telemetry & Reputation Indexer API

A robust **Node.js**, **Express.js**, and **PostgreSQL** backend service that ingests GitHub webhooks, parses pull request data, and maps contributions to specific developer identities. The API computes a long-term **Code Quality Score** based on PR approval velocity, test coverage, and subsequent bug regressions.

## Core Features

- **GitHub Webhook Ingestion** — Reliably receive and process PR merge events via `/api/v1/webhooks/github`.
- **Contributor Identity Mapping** — Link pull request activity to verified contributor profiles.
- **Code Quality Scoring** — Algorithm that weighs approval speed, testing coverage, and regression rates into a single reputation metric.
- **RESTful API** — Query contributor scorecards, reputation data, and health metrics through fast, indexed endpoints.
- **Redis-Backed Job Queues** — Asynchronous, idempotent webhook processing via BullMQ to handle traffic spikes without data duplication.
- **Zod Schema Validation** — Strict input validation on all incoming payloads with descriptive error responses.

## Active Wave Issues & Point Matrix

This backend is maintained through the **Drips Wave Program**, a synchronized 7-day development sprint where contributors earn on-chain rewards for resolving ecosystem bottlenecks.

> **Important:** Ensure your Drips account has completed KYC and is linked to your Discord profile to receive the "Contributor" role upon your first merged PR.

### 🔴 High Complexity — 200 Points

**Issue #34: GitHub Webhook Idempotency & Queue Processing**

During the final hours of a Wave, GitHub webhooks can spike massively. Implement Redis-backed job queues (using BullMQ) to process incoming PR merge events asynchronously.

- Develop strict idempotency keys to prevent duplicate webhook deliveries from double-counting a contributor's reputation score.
- Include local load-test scripts to verify behavior under high throughput.

### 🟡 Medium Complexity — 150 Points

**Issue #39: Contributor Scorecard Aggregation Endpoint**

Create a fast REST endpoint (`GET /api/v1/contributors/:github_handle/scorecard`) that executes a complex PostgreSQL join across the `pull_requests`, `reviews`, and `bug_reports` tables to calculate a developer's overall health metric.

- Use PostgreSQL materialized views or strategic indexing so the endpoint resolves in **under 200ms** with over 50,000 PRs in the database.

### 🟢 Trivial Complexity — 100 Points

**Issue #41: Zod Schema Validation for Webhook Payloads**

Replace manual string-checking logic with Zod schema validation for all incoming `POST` requests on the `/api/v1/webhooks/github` route.

- The API must return a **400 Bad Request** with specific error details if a webhook payload is missing `pull_request.user.login` or `action`.

## ✅ Maintainer Acceptance Criteria

- **Test Coverage:** Strict **95% unit test coverage** via Jest for all new API routes and middleware.
- **Database Migrations:** Any changes to the PostgreSQL schema or Redis configuration must be fully documented in `/migrations`.
- **Professional Communication:** Stay active in issue threads. If an assignee goes silent for **48 hours** without pushing code, the issue will be reassigned to unblock the sprint.

## 🛠️ Local Development Setup

### Prerequisites

- **Node.js** v20+
- **PostgreSQL** v15+
- **Redis Server** (required for job queues)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/reputation-indexer-api.git
cd reputation-indexer-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local Postgres and Redis credentials.

### 3. Run the API

```bash
npm run dev
```
