# Sapiens Metric

A serious cognitive-ability and knowledge-assessment platform.

- Product: **Sapiens Metric**
- Domain: **sapiensmetric.eu**
- Languages: Lithuanian and English
- Status: **Foundation + local MySQL + credentials auth + email flows + auth
  frontend + static-export directory routes.** A buildable pnpm monorepo with a
  static web app (Next.js App Router, static export as `<route>/index.html`), a
  NestJS/Fastify API (health + `/auth/*`), shared Zod contracts, and a local
  MySQL 8.0.46 environment. No assessment items, scoring, norming, or production
  deployment yet.

T-001..T-012 are complete, approved, and archived in `tasks/done/`. **No task is
currently active.** T-012 (D-024) added one role per user (`user` | `editor` |
`admin`), an account status (`active` | `suspended`) separate from email
verification, the bilingual admin API/dashboard, an audit trail, and a local
bootstrap CLI (`admin:promote`). T-009 delivered
the next-intl LT/EN frontend (commit `52fe481`). T-010 corrected the
static-export format, unified the local profile, isolated `.env` handling in
tests, added the public-UI claims guard, wired the approved branding assets
(D-021), and replaced the `/` chooser with a remembered-language redirect
(D-022). T-011 re-layered `apps/web` into a light FSD structure (`app` /
`widgets` / `features` / `entities` / `shared`, D-023/D-024).

T-006 (email verification and password-reset delivery through generic SMTP) is
implemented, approved, and archived. See
`docs/authentication.md` and `docs/email-verification.md`. It adds the
`CreateEmailActionTokens` migration, the `/auth/email-verification/*` and
`/auth/password-reset/*` endpoints, a minimal Lithuanian/English browser flow,
request gating (15-minute per-purpose cooldown plus a memory-bounded in-memory
per-IP limit), a password-reset-confirmation per-IP limit applied before
hashing, transport-rejection rollback, a verification access gate, canonical
Origin enforcement on refresh/logout, and non-downgrading SMTP TLS. `PUBLIC_APP_URL`
and `CORS_ORIGIN` must be equal canonical HTTP(S) origins; `NEXT_PUBLIC_API_BASE_URL`
is a separate, browser-visible API base URL and `API_PORT` is the validated local
listener port (production may sit behind a reverse proxy, so the two ports need
not match). For direct local development `NEXT_PUBLIC_API_BASE_URL` must point at
the running API listener. The static web build fails closed if
`NEXT_PUBLIC_API_BASE_URL` is missing or invalid. It is not production-ready and
no real user data is used (O-006 remains open).

The classical LT/EN authentication frontend (T-008) is approved and archived:
registration, login, verification, password reset, session bootstrap, logout,
and a protected account page over the existing auth API. Registration is
conventional (D-017): a new address sends one verification email, and an existing
address returns an explicit `EMAIL_ALREADY_REGISTERED` conflict.

Google OpenID Connect sign-in (T-007, D-018) is approved and archived. It is
optional: it stays disabled and the Google button is unavailable unless
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` are
configured; password authentication is unaffected.

T-005 uses a single environment-file strategy: the Nest API loads only the
root local `.env` (see below); no second API-specific env file is created.

## Current project state (T-010)

- **Static export is directory-style by contract.** `apps/web/next.config.mjs`
  sets `trailingSlash: true`, so every public route is emitted as
  `<route>/index.html` (`/lt/`, `/lt/auth/login/`, `/en/account/`, …).
  Production is plain shared static hosting with no Next server, middleware,
  proxy, or rewrite rules, so a clean URL resolves from the filesystem alone.
  `bash scripts/verify-static-export.sh` (part of `pnpm verify`) enforces this.
- **T-010 fixed the audit findings:** the flat deep-route `.html` export format,
  an inconsistent local port profile, `.env` handling in tests, and the absence
  of an automated guard on public claims wording.
- **Local profile:** web `http://localhost:3333`, API `http://localhost:3334`,
  MySQL `127.0.0.1:3307` (see `docs/local-development.md`).
- **Assessment core is not started.** `packages/assessment` is a deliberate pure
  TypeScript placeholder: no items, scoring, norming, or claims. It is blocked on
  O-002 (item sourcing), O-003 (validation/norming), O-006 (data-protection/
  governance), and O-007 (copyright/IP provenance), plus product-owner approval
  of the T-002 instrument/provenance proposals.
- **Next strategic step:** an assessment-foundations task, gated on O-002,
  O-003, O-006, and O-007 — not yet authorised.

## Repository layout

- `apps/web` (`@sapiensmetric/web`) — Next.js App Router, static export as
  directory-style `<route>/index.html` (`trailingSlash: true`), Tailwind
  baseline, and the next-intl bilingual LT/EN authentication frontend
  (`app/[locale]`, message catalogues in `messages/`: login, registration,
  email verification, password reset, account). Layered as a **light FSD**
  structure (`app` / `widgets` / `features` / `shared`; see
  `docs/fsd-light.md`, D-023). The approved branding WebP
  assets are served from the stable `/branding/...` paths and the supplied
  favicon is registered (D-021). The root `/` redirects to the remembered local
  language preference (`localStorage`, `lt`/`en`) or to `/en/` by default
  (D-022; no interactive language chooser).
- `apps/api` (`@sapiensmetric/api`) — NestJS + Fastify, `GET /health` plus
  `/auth/*` credentials auth core (see `docs/authentication.md`).
- `packages/contracts` (`@sapiensmetric/contracts`) — shared Zod contracts.
- `packages/assessment` (`@sapiensmetric/assessment`) — pure TypeScript
  placeholder (no items, scoring, or claims yet).
- `docs/` — product, assessment, architecture, testing, and decision docs.
- `tasks/` — current task and archived tasks.
- `TODO.md` — planning index (never authorises work).
- `scripts/verify.sh` — dependency-free documentation-harness checks
  (including the archived task records, the T-008 frontend outputs, the T-007
  Google sign-in outputs, the T-010 corrective outputs, and the completed
  T-003/T-004/T-005/T-006 outputs).
- `scripts/verify-static-export.sh` — dependency-free static-export route
  invariant (run after `pnpm build`; part of `pnpm verify`).

## Local setup

Requirements:

- Node.js `>=20.9.0`
- pnpm `11.26.0` (pinned via `packageManager` and root `engines`)

```bash
pnpm install
```

### Local database (MySQL 8.0.46 via Docker Compose)

See `docs/local-development.md` for full instructions. Quick start:

```bash
cp .env.example .env   # then edit values; never commit .env
docker compose up -d   # starts local MySQL on 127.0.0.1:3307
docker compose ps      # confirm "healthy"
```

## Verification commands

```bash
bash scripts/verify.sh   # dependency-free harness invariants
pnpm lint                # ESLint
pnpm typecheck           # TypeScript type checking
pnpm test                # unit tests (Docker-free, .env-free)
pnpm build               # production builds (web static export, API build)
bash scripts/verify-static-export.sh   # static-export route invariant (after build)
# or the whole chain:
pnpm verify              # lint + typecheck + test + build + export invariant + harness

# migrations + real-MySQL integration (see docs/authentication.md)
pnpm --filter @sapiensmetric/api migration:run
pnpm --filter @sapiensmetric/api test:integration
```

The web build emits static-export output to `apps/web/out`.

## Boundaries (non-negotiable)

Until psychometric validation and representative norming exist, Sapiens Metric
must **not** claim to provide a real IQ score, clinical diagnosis, hiring
recommendation, or scientifically validated assessment. It must not copy or
reconstruct proprietary/protected test instruments.
