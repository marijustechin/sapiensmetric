# Architecture — Sapiens Metric

## Overview

pnpm monorepo. The assessment/scoring logic is isolated in a pure TypeScript
package so it can be validated and reused without any UI, framework, or
database dependency.

## Intended packages

- `apps/web` → **@sapiensmetric/web** — public web application.
  - Next.js App Router, **static export** for the public marketing/site pages.
  - UI internationalisation: **next-intl** (T-009, D-019) with the `lt`/`en`
    `app/[locale]` structure and checked-in message catalogues.
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

## T-008 authentication frontend (static export)

T-008 adds the classical LT/EN browser journey over the existing auth API. It is
a static-export Next.js frontend; no server route, API change, database change,
or new dependency is introduced (the focused unit test uses the built-in Node
test runner).

- Frontend logic: `apps/web/lib/auth-api.ts` (typed fetch client using
  `NEXT_PUBLIC_API_BASE_URL` with `credentials: 'include'`),
  `apps/web/lib/auth-types.ts`, and `apps/web/lib/auth-navigation.ts`
  (same-origin `returnTo` validation).
- React state: `apps/web/app/_components/auth-provider.tsx` holds the access
  token in memory only and performs the refresh + `/auth/me` bootstrap.
- Routes: `/{lt,en}` home, `/{lt,en}/auth/{login,register,verify-email,forgot-password,reset-password}`,
  and the protected `/{lt,en}/account`. T-009 later consolidated these LT/EN
  pages under a single `app/[locale]` implementation (see below).

## T-009 UI internationalisation (next-intl, static export)

T-009 replaces the hand-duplicated LT/EN page structure with `next-intl`,
shared locale-aware routes/components, and checked-in message catalogues. It
adds `next-intl` as the UI i18n layer (D-019) and keeps the static-export build,
the exact route matrix, and all auth/OAuth security behaviour unchanged.

- i18n configuration: `apps/web/i18n/routing.ts` (locales `lt`/`en`,
  `localePrefix: 'always'`), `apps/web/i18n/request.ts` (message loading for the
  explicit locale; no request headers, cookies, or proxy), and
  `apps/web/i18n/navigation.ts` (locale-aware `Link`/`useRouter`/`usePathname`).
- Message catalogues: `apps/web/messages/lt.json`, `apps/web/messages/en.json`.
- Routes: `apps/web/app/[locale]/...` — one implementation per route, generated
  for both locales via `generateStaticParams` in the `[locale]` root layout —
  plus `apps/web/app/(chooser)/` for the static bilingual `/` language chooser.
  The `[locale]` layout is a root layout so `<html lang>` follows the active
  locale; the build has no `app/layout.tsx`.
- Pure helpers: `apps/web/lib/locale-navigation.ts` (locale validation,
  same-route language switching, and safe `returnTo` locale remapping); the
  language switcher never uses `document.cookie`.
- No middleware/proxy and no runtime browser-language detection are added.
  The static build emits the same route matrix as T-008 (both locales, every
  public route) and remains refresh-safe on static hosting.
- Assessment-item translations are intentionally **not** in the UI catalogues;
  they belong in the API/database model (D-019).

## T-007 Google OpenID Connect sign-in (implemented, in review)

T-007 adds optional Google OIDC sign-in (authorization-code flow with PKCE)
over the existing auth API, per D-018.

- `apps/api/src/modules/auth/identities/` — `user_identities` entity/store
  (`provider`, `subject`, unique `(provider, subject)`, FK to `users`).
- `apps/api/src/modules/auth/google/` — transaction/PKCE service (HMAC-SHA256
  over an HKDF-derived key), JWKS + ID-token verification, token exchange,
  account resolution, and the `/auth/google/*` controller.
- Migration `1781440000002-CreateUserIdentities`.
- Reuses the existing refresh-session/cookie lifecycle; no token in URLs.
- The web login/register pages show a Google button when
  `/auth/google/status` reports it is available; Google stays optional and
  password authentication is unaffected.

## Explicitly deferred beyond T-003

- Google OAuth is T-007 (implemented, in review).
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
