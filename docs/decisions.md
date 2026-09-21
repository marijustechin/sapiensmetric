# Decision log — Sapiens Metric

Recorded decisions and open decisions. Decisions are dated and reversible
where noted. Update this file when a decision is made or changed.

## Decided

### D-001 — Product identity
- Name: **Sapiens Metric**; canonical domain: **sapiensmetric.eu**.
- Category: serious cognitive-ability and knowledge-assessment platform.
- Date: 2026-09-09.
- Status: decided. Non-reversible without explicit product owner sign-off.

### D-002 — Languages
- Product languages: Lithuanian and English.
- Date: 2026-09-09.
- Status: decided.

### D-003 — Hosting & infrastructure
- Domain registrar: **Bacloud**.
- Planned hosting: **vHosts.lt**.
- Date: 2026-09-09.
- Status: decided. Hosting/deployment is deferred, not configured in bootstrap.
- Confirmed environment observation (2026-09-09): the vHosts database
  environment is **MySQL Community Server 8.0.46-cll-lve**; server charset
  **utf8mb4**; phpMyAdmin exposes local UNIX-socket access. NestJS runtime
  connectivity, database credentials, database name, TCP-versus-socket
  configuration, and migration execution remain unverified and deferred. No
  database, entity, migration, env file, or connection test was created.

### D-004 — Technology direction
- pnpm monorepo.
- Public web: Next.js App Router with **static export**.
- API: NestJS + Fastify.
- Database: MySQL Community Server 8.0.46-cll-lve (vHosts), server charset
  utf8mb4; backend driver remains **TypeORM + mysql2**.
- UI: Tailwind + shadcn/ui.
- Contracts: Zod.
- Assessment/scoring logic: independent, pure TypeScript package.
- Date: 2026-09-09.
- Status: decided (direction). No scaffolding in bootstrap.

### D-005 — PostgreSQL and Prisma are out of scope
- The shared-hosting environment does not provide PostgreSQL, and Prisma is not
  an accepted runtime dependency there.
- Use MariaDB/MySQL + TypeORM + mysql2 instead.
- Date: 2026-09-09.
- Status: decided.

### D-006 — Scientific/ethical boundaries
- No IQ-score, clinical-diagnosis, hiring-recommendation, or scientific-
  validation claims until psychometric validation and representative norming
  exist.
- No copying/reconstruction of proprietary/protected instruments.
- Date: 2026-09-09.
- Status: decided (hard constraint).

### D-007 — Language handling of test content
- Items are classified as language-neutral, Lithuanian (`lt`), or English
  (`en`), with an explicit language-scope tag per item.
- Date: 2026-09-09.
- Status: decided.

### D-008 — Versioning
- Tests, items, scoring rules, and results are versioned; a result records the
  exact versions used to produce it.
- Date: 2026-09-09.
- Status: decided.

### D-009 — Bootstrap is documentation-first
- No application source, database schema, UI, API, auth, or deployment config
  in the bootstrap task.
- Date: 2026-09-09.
- Status: decided.

### D-010 — Workflow rules
- Every future task starts by reading AGENTS.md, relevant docs, and
  `tasks/current.md`; one task at a time; human review before archival; no
  silent scope expansion.
- Date: 2026-09-09.
- Status: decided.

### D-011 — Test runner (resolves O-001)
- Test runner: **Vitest**.
- Date: 2026-09-09.
- Rationale: runs inside the pnpm monorepo with no extra system dependencies,
  first-class TypeScript support, and a minimal API; it is used for the health
  contract and API health-endpoint tests created in T-003.
- Status: decided.

### D-012 — Workspace/package names (resolves O-005)
- Root workspace name: **sapiensmetric**.
- Package names: **@sapiensmetric/web** (`apps/web`), **@sapiensmetric/api**
  (`apps/api`), **@sapiensmetric/contracts** (`packages/contracts`),
  **@sapiensmetric/assessment** (`packages/assessment`).
- Date: 2026-09-09.
- Rationale: scoped names under the product namespace; directory layout
  `apps/*` and `packages/*` matches `docs/architecture.md`.
- Status: decided.

### D-013 — Credentials auth token strategy
- Credentials auth uses a short-lived JWT access token returned in the response
  body plus an opaque, rotating refresh token stored only in an HttpOnly
  cookie.
- Date: 2026-09-09.
- Status: decided. Authorises the explicitly scoped T-005 auth work only.

### D-014 — Refresh session semantics
- One active refresh session per user. A successful login revokes all prior
  active sessions for that user; refresh rotates the token; logout revokes the
  current session.
- Date: 2026-09-09.
- Status: decided. Authorises the explicitly scoped T-005 auth work only.

### D-015 — Deferred verification/delivery/social-login
- Email verification, password-reset delivery, and Google OAuth are
  deliberately deferred; T-005 must not claim production-ready account
  verification.
- Date: 2026-09-09.
- Status: decided. T-006 (email verification + password-reset delivery) and
  T-007 (Google OAuth) are later tasks.

### D-016 — Email action tokens, generic SMTP, and minimal LT/EN browser flow
- Standard authenticated SMTP behind a provider-agnostic boundary; no provider
  SDK or vendor-specific code.
- `users.emailVerifiedAt` is a nullable timestamp; action tokens are persisted
  in a dedicated table through a committed TypeORM migration only.
- Token values are `>=32` random bytes, base64url encoded, and only SHA-256
  hashes are persisted.
- Verification tokens expire after 24 hours; password-reset tokens after 30
  minutes; both values are configuration-driven and validated.
- Issuing a token atomically invalidates every previous unused token for the
  same user and purpose.
- Email-verification requests issue/send only for an existing unverified
  account; password-reset requests only for an existing account. Every request,
  including unknown, verified, cooldown-limited, and rate-limited cases, returns
  the same generic 202 body.
- A known account receives no new token or email more often than once per
  15 minutes per purpose. In addition, a small in-memory per-IP limit applies: a
  maximum of 3 request-endpoint calls per hour per IP per endpoint. This is
  defense-in-depth for this single-process bootstrap phase, not a distributed
  production claim; no Redis and no new data store are introduced. Every request
  still returns the same generic 202.
- A transport rejection before SMTP acceptance must leave no usable action token
  and must not consume the issuance cooldown. The API still returns the generic
  202 and may record only a safe operational failure without any token, URL,
  secret, password, or account identifier.
- Email verification is an access gate, not an informational flag. A user whose
  `emailVerifiedAt` is null receives the same generic 401 from
  `POST /auth/login` as invalid credentials; no access token or refresh cookie is
  issued. Refresh and every session-authenticated route, including
  `GET /auth/me`, reject an unverified user as unauthenticated, and existing
  sessions must not bypass the gate. The response must not reveal "email not
  verified". Once verification succeeds, the user may log in normally. Existing
  Docker-free fixtures and real-MySQL integration fixtures that test normal
  login/session behaviour must create verified users explicitly.
- Valid token consumption is atomic and single-use; password reset changes the
  Argon2id password and revokes all active refresh sessions in the same
  transaction.
- Browser flow is minimal LT/EN pages, with these exact routes:
  - `/lt/auth/verify-email`
  - `/en/auth/verify-email`
  - `/lt/auth/forgot-password`
  - `/en/auth/forgot-password`
  - `/lt/auth/reset-password`
  - `/en/auth/reset-password`
- Verification and reset email links carry the raw token in the URL fragment
  (`#token=...`), never a query string. Pages read the fragment client-side,
  remove it from browser history, and call POST confirmation endpoints only
  after an explicit user action. GET and link prefetching must never consume a
  token.
- The minimal browser flow is complete within its six routes: the verify-email
  page without a fragment provides the generic resend request form, and with
  `#token=` an explicit confirmation action; forgot-password provides the
  generic reset-request form; reset-password requires `#token=` and a new
  password and must not submit or consume a token on GET/prefetch.
- Public configuration uses only the single ignored root `.env`; no second
  web/API env file is introduced. `PUBLIC_APP_URL` is validated server-side and
  used solely to construct the email link origin. `NEXT_PUBLIC_API_BASE_URL` is
  a deliberately exposed, validated build-time web value used by the six static
  pages for API calls. No secret may use the `NEXT_PUBLIC_` prefix. The canonical
  `CORS_ORIGIN` is the only allowed browser origin for Origin checks; no wildcard
  CORS is introduced. The static web build receives only this public value from the root
  environment and must not copy secrets into `apps/web` or browser bundles.
- Public web configuration fails closed: `NEXT_PUBLIC_API_BASE_URL` is resolved
  only from the explicit environment or the root `.env` public entry and must be
  a validated absolute HTTP(S) URL.
  Missing or invalid configuration fails the static web build.
  No secret is exposed to or copied into the web bundle.
- `PUBLIC_APP_URL` and `CORS_ORIGIN` are validated as exact HTTP(S) origins (no
  wildcard, userinfo, path other than `/`, query, or fragment), stored as
  canonical origins, and must be equal after canonicalisation, so a harmless
  trailing slash cannot break Origin checks. `PUBLIC_APP_URL` is the web/browser
  origin used in email links. `NEXT_PUBLIC_API_BASE_URL` is a separately
  validated API base URL and may use a different port/origin. `SMTP_PORT` is
  validated as 1–65535 and `SMTP_FROM` as a valid mailbox address.
- `API_PORT` (1–65535) is the validated local Nest listener port and need not
  equal the public API URL port; production may sit behind a reverse proxy. For
  direct local development `NEXT_PUBLIC_API_BASE_URL` must point at
  the running API listener; the current human configuration uses 3334. The web
  API-base value rejects userinfo, query strings, and fragments, keeps an
  intentional path prefix, and normalises only a trailing slash.
- SMTP TLS never downgrades: `SMTP_SECURE=true` uses implicit TLS, and
  `SMTP_SECURE=false` requires STARTTLS with no plaintext fallback.
- Password-reset confirmation is protected against Argon2 denial of service by an
  in-memory per-IP limit of 5 password-reset confirmation calls per hour per IP,
  applied before password hashing. A limited confirmation receives the same
  generic 400 as any other invalid confirmation.
- The in-memory limiter is memory-bounded: stale entries expire and distinct keys
  are capped at 10,000 distinct keys; when full, new keys are rejected without
  being allocated while existing keys continue to be evaluated. Request endpoints
  still return the generic 202 when limited.
- POST /auth/logout rejects an absent or mismatched Origin on every attempt,
  before considering whether a refresh cookie is present.
- Date: 2026-09-18.
- Status: decided. Authorises only the explicitly scoped T-006 work after human
  execution approval.
- This does not resolve O-006 and does not authorise real product use or a
  compliance claim.

## Open decisions

> T-001 note (2026-09-09): the discovery baseline (`docs/measurement-model.md`,
> `docs/item-format-inventory.md`, `docs/claims-ladder.md`,
> `docs/validation-norming-gap.md`, `docs/research-open-questions.md`,
> `docs/research-sources.md`) did not resolve any of O-001–O-006. All remain
> open pending the evidence and decisions they require.

### O-001 — Test runner
- Resolved by **D-011** (Vitest, 2026-09-09).

### O-002 — Item/content sourcing policy
- Exact provenance and licensing criteria for original vs. legally reusable
  items, and how provenance is stored.

### O-003 — Norming & validation roadmap
- Scope, budget, and sequencing of representative norming and validity studies.

### O-004 — Organisational-use claims
- The specific evidence threshold required before any organisational-use or
  screening claim is allowed.

### O-005 — Repository/package naming
- Resolved by **D-012** (@sapiensmetric/{web,api,contracts,assessment},
  2026-09-09).

### O-006 — Data protection & governance
- Data-protection, consent, retention, access-control, and organisational-use
  governance.
- Requires a later dedicated legal/privacy review. No compliance claim is
  permitted now.

### O-007 — Copyright/IP provenance review
- Scope, timing, and responsible expert for reviewing the item provenance
  policy (`docs/item-provenance-policy-proposal.md`) and any use of
  third-party material.
- This is a copyright/IP review decision, distinct from the data-protection
  governance decision (O-006).
- No IP review has occurred and no legal clearance is claimed; the policy is
  an internal risk-control proposal until a responsible expert reviews it.
