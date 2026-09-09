# Architecture — Sapiens Metric

## Overview

pnpm monorepo. The assessment/scoring logic is isolated in a pure TypeScript
package so it can be validated and reused without any UI, framework, or
database dependency.

## Intended packages

- `apps/web` → **@sapiensmetric/web** — public web application.
  - Next.js App Router, **static export** for the public marketing/site pages.
  - Tailwind CSS + shadcn/ui (shadcn deferred; not installed in T-003).
  - Zod contracts for shared/API schemas.
- `apps/api` → **@sapiensmetric/api** — API service.
  - NestJS + Fastify. Currently only `GET /health`.
  - MySQL Community Server 8.0.46-cll-lve (vHosts), server charset utf8mb4;
    driver **TypeORM + mysql2** (deferred beyond T-003).
- `packages/assessment` → **@sapiensmetric/assessment** — independent, pure
  TypeScript package. Items, tests, scoring rules, results (none implemented
  yet). No UI, framework, or DB dependencies.
- `packages/contracts` → **@sapiensmetric/contracts** — Zod schemas shared
  between web and API. Currently the health-response contract.

## Foundation scaffold (T-003)

T-003 created the minimal web/API baseline:

- pnpm workspace monorepo (`pnpm-workspace.yaml`, root `package.json`);
- `apps/web` (`@sapiensmetric/web`): Next.js App Router with static export,
  Tailwind baseline, and a minimal non-marketing development page;
- `apps/api` (`@sapiensmetric/api`): NestJS + Fastify with only `GET /health`;
- `packages/contracts` (`@sapiensmetric/contracts`): shared Zod health-response
  contract;
- `packages/assessment` (`@sapiensmetric/assessment`): compilable pure
  TypeScript package (no items, scoring, fixtures, or assessment claims).

T-003 resolved O-001 (test runner: Vitest, D-011) and O-005 (package names,
D-012).

## Explicitly deferred beyond T-003

- Authentication implementation (any auth logic).
- Database access: TypeORM, mysql2, MySQL connection, entities, migrations,
  and env credentials.
- Assessment implementation: item authoring, item metadata, assessment engine,
  scoring, results, and data collection.
- Product UI features and public marketing/site content beyond the minimal
  development page.
- shadcn component installation (unless a real UI need arises).
- Deployment/hosting/DNS configuration.
- Microservices, Redis, queues.

## Out of scope (permanent)

- PostgreSQL and Prisma. The intended shared-hosting environment does not
  provide PostgreSQL, and Prisma is not an accepted runtime dependency there.
  Use MySQL + TypeORM + mysql2 instead.

## Confirmed database environment facts (observed, not implemented)

- DB server observed in the vHosts environment: **MySQL Community Server
  8.0.46-cll-lve**.
- Server charset: **utf8mb4**.
- Planned backend driver: **TypeORM + mysql2**.
- phpMyAdmin shows **local UNIX-socket access** for administration.

Unverified / deferred (not configured in this phase):

- NestJS runtime connectivity to the database.
- Database credentials and database name.
- TCP versus UNIX-socket configuration for the NestJS runtime.
- Migration execution.

No database, entity, migration, env file, or connection test was created.

## Principles

- Assessment/scoring stays framework- and database-free.
- Contracts are versioned (see `docs/assessment-principles.md`).
- Static export first for the public web surface; server features only where
  they are actually required.
