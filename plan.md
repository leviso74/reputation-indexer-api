# Reputation Indexer API — Wave Sprint Plan

## Project Overview
A Node.js/Express/PostgreSQL backend that ingests GitHub webhooks, maps pull request contributions to developer identities, and computes long-term Code Quality Scores via BullMQ job queues.

## Wave Sprint Structure
Sprints run on a 7-day cadence. Contributors pick scoped issues, earn points redeemable for on-chain rewards, and must satisfy strict acceptance criteria before merge.

## Issue Types & Point Matrix

### Bug Fixes (100–200 pts)
- **Webhook payload edge cases** (150 pts) — Handle malformed GitHub delivery headers, missing required fields, or unexpected event actions (e.g., `synchronize`, `reopened`) without crashing the worker.
- **Redis reconnection storms** (200 pts) — When Redis drops, BullMQ workers can thrash reconnect attempts. Implement exponential backoff with circuit breaker and graceful degradation to in-memory fallback.
- **Idempotency key collision** (150 pts) — Rare race condition where two identical webhooks arrive in the same millisecond. Add database-level upsert logic paired with advisory locks.
- **Scorecard division by zero** (100 pts) — When a contributor has PRs but no reviews, the approval time calculation divides by zero. Guard all aggregations with NULLIF and COALESCE.

### New Features (100–200 pts)
- **Team scorecard aggregation** (200 pts) — New `GET /api/v1/teams/:slug/scorecard` endpoint that sums individual contributor metrics into a team-level quality snapshot.
- **Webhook replay console** (150 pts) — Admin endpoint `POST /api/v1/admin/webhooks/replay` that re-queues failed jobs from the BullMQ dead-letter queue for manual retry.
- **Trend API** (150 pts) — `GET /api/v1/contributors/:handle/trends?months=6` returning time-series data (PRs/week, score delta) for charting.
- **Slack notifications** (100 pts) — Emit webhook to Slack when a contributor's score drops below a configurable threshold.

### Documentation (50–100 pts)
- **OpenAPI 3.0 spec** (100 pts) — Annotate all routes with Zod-to-OpenAPI conversion (`zod-to-json-schema`) and publish a Swagger UI endpoint at `/api-docs`.
- **Runbook for queue recovery** (50 pts) — Document step-by-step procedures for restarting failed BullMQ workers, inspecting Redis backlog, and re-processing orphaned jobs.
- **Contributor onboarding guide** (50 pts) — Write a markdown guide explaining how to set up a local dev environment with Docker Compose (Postgres + Redis).

### Testing (100–150 pts)
- **Load test suite** (150 pts) — Artillery or k6 script simulating 10,000 concurrent webhook deliveries. Verify idempotency holds and queue depth stays within limits.
- **Fuzz testing for Zod schemas** (100 pts) — Property-based tests using `fast-check` that generate random payloads and confirm the API never throws unhandled exceptions.
- **Integration test with testcontainers** (150 pts) — Spin up ephemeral Postgres + Redis containers in CI and run the full webhook → scorecard pipeline end-to-end.

## Acceptance Criteria
- 95% line coverage via Jest for all new routes and middleware
- Database migrations fully documented in `/migrations`
- No console.log in production code; structured logging via `pino`
- PR must link the original issue (e.g., `Resolves #72`)
