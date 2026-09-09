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
