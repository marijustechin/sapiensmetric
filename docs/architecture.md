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
  - NestJS + Fastify. `GET /health` plus the T-005 credentials auth core
    (`/auth/*`) backed by MySQL via **TypeORM + mysql2**.
  - MySQL Community Server 8.0.46 (local Docker via T-004), server charset
    utf8mb4; driver **TypeORM + mysql2**.
  - API source layout:
    - `apps/api/src/config/` — environment configuration;
    - `apps/api/src/database/` — TypeORM data source and migration scripts;
    - `apps/api/src/database/migrations/` — committed migrations;
    - `apps/api/src/modules/users/` — User feature;
    - `apps/api/src/modules/auth/` — authentication feature;
    - `apps/api/src/modules/auth/sessions/` — refresh-session persistence.
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
- `apps/api` (`@sapiensmetric/api`): NestJS + Fastify with `GET /health`;
  T-005 added the credentials auth core (`/auth/*`, TypeORM + mysql2,
  migrations-only) — see `docs/authentication.md`;
- `packages/contracts` (`@sapiensmetric/contracts`): shared Zod health-response
  contract;
- `packages/assessment` (`@sapiensmetric/assessment`): compilable pure
  TypeScript package (no items, scoring, fixtures, or assessment claims).

T-003 resolved O-001 (test runner: Vitest, D-011) and O-005 (package names,
D-012).

## T-006 email verification and password reset (implemented, approved, archived)

T-006 implements "Email verification and password-reset delivery through generic
SMTP", per D-016 (`docs/decisions.md`) and the archived task record
(`tasks/done/2026-09-21-email-verification-and-password-reset-delivery.md`). It
adds:

- a provider-agnostic mailer module (`apps/api/src/modules/mailer/`) using
  generic authenticated SMTP (nodemailer) behind a transport boundary; no
  provider SDK; implicit TLS for `SMTP_SECURE=true` and required STARTTLS (no
  plaintext fallback) otherwise;
- opaque, SHA-256-hashed, purpose-scoped, single-use, expiring action tokens
  (24h verification, 30min reset), persisted in `email_action_tokens`, with a
  nullable `users.emailVerifiedAt`;
- non-enumerating `/auth/email-verification/*` and `/auth/password-reset/*`
  endpoints; requests issue/send only for eligible accounts and always return a
  generic 202;
- request gating: per-user-and-purpose 15-minute cooldown plus an in-memory
  per-IP limit (3 calls per hour per IP per endpoint), and an in-memory per-IP
  limit of 5 password-reset confirmation calls per hour per IP applied before
  Argon2 hashing; the limiter expires stale entries and caps distinct keys at
  10,000 (new keys rejected without allocation); a transport rejection rolls
  back the token and does not consume the cooldown;
- the verification access gate on login, refresh, and every session-
  authenticated route;
- a minimal LT/EN browser flow across six static pages with fragment-only
  tokens;
- public web/API configuration through the single root `.env`: `PUBLIC_APP_URL`
  and `CORS_ORIGIN` are exact canonical HTTP(S) origins that must be equal after
  canonicalisation (`PUBLIC_APP_URL` is the web/browser origin used in email
  links); `NEXT_PUBLIC_API_BASE_URL` is the separately validated, only exposed
  build-time web value and missing/invalid configuration fails the static web
  build; `API_PORT` is the validated local Nest listener port and need not equal
  the public API URL port (production may sit behind a reverse proxy); no secret
  under the `NEXT_PUBLIC_` prefix;
- canonical Origin enforcement on refresh and on every `POST /auth/logout`
  attempt, before considering whether a refresh cookie is present;
- a data-minimisation/retention privacy gate document
  (`docs/email-verification.md`); O-006 remains open.

API source layout additions:

- `apps/api/src/modules/mailer/` — mailer boundary + generic SMTP transport.
- `apps/api/src/modules/auth/action-tokens/` — EmailActionToken entity/store.
- `apps/api/src/modules/auth/action-token.service.ts` — token generation,
  hashing, TTLs, and consumption.
- `apps/api/src/modules/auth/ip-rate-limiter.ts` — in-memory per-IP limiter.
- `apps/api/src/database/migrations/1781440000001-CreateEmailActionTokens.ts`.
- `apps/api/src/database/cleanup-action-tokens.ts` — explicit retention cleanup.
- `apps/api/src/smtp-smoke.ts` — opt-in live-SMTP smoke command.

## Explicitly deferred beyond T-003

- Google OAuth is T-007.
- Product UI features and public marketing/site content beyond the minimal
  development page.
- shadcn component installation (unless a real UI need arises).
- Deployment/hosting/DNS configuration.
- Microservices, Redis, queues.
- vHosts Node-to-MySQL feasibility (later, separate infrastructure task).

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

Local development uses the T-004 Docker MySQL 8.0.46 on `127.0.0.1:3307`
(single root `.env`, non-root application user, `synchronize` disabled,
committed migrations only).

Unverified / deferred (not configured in this phase):

- vHosts (production) NestJS runtime connectivity to the database.
- Production database credentials and database name.
- TCP versus UNIX-socket configuration for the vHosts NestJS runtime.
- Migration execution against vHosts.

No production database, entity, migration, env file, or connection test was
created.

## Principles

- Assessment/scoring stays framework- and database-free.
- Contracts are versioned (see `docs/assessment-principles.md`).
- Static export first for the public web surface; server features only where
  they are actually required.
