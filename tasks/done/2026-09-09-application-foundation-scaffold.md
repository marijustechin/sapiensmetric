# T-003 — Application foundation scaffold (archived)

- **ID:** T-003
- **Archive date:** 2026-09-09
- **Final status:** Approved (human review granted)

---

## Original task definition

# T-003 — Application foundation scaffold: pnpm monorepo, static web, API baseline, and shared contracts

- **ID:** T-003
- **Status:** Ready for human review
- **Type:** Implementation (foundation scaffold)

### Purpose

Create the first implementation foundation for Sapiens Metric. It must make
the repository buildable and testable locally, without authentication,
database access, assessment items, scoring logic, or deployment.

### Required implementation scope

- pnpm workspace monorepo.
- `apps/web`: Next.js App Router with static export, Tailwind baseline, and a
  minimal non-marketing development page.
- `apps/api`: NestJS + Fastify with only `GET /health`.
- `packages/contracts`: shared Zod health-response contract used by the API.
- `packages/assessment`: compilable pure TypeScript package, with no items,
  scoring rules, fixtures, or assessment claims.
- A chosen test runner and minimal meaningful tests for the health
  contract/API.
- Root scripts for lint, typecheck, test, build, and verify.
- Concise README and docs updates covering local setup, package layout,
  runtime requirements, and exact verification commands.

### Decisions T-003 must resolve and record

- **O-001** — test runner.
- **O-005** — final initial workspace/package names.

### Inputs

- `AGENTS.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/decisions.md`
- `docs/claims-ladder.md`

### Required outputs

- `pnpm-workspace.yaml` — workspace definition.
- `package.json` — root package with scripts and engines.
- `pnpm-lock.yaml` — lockfile.
- `apps/web/` — Next.js App Router, static export, Tailwind.
- `apps/api/` — NestJS + Fastify, `GET /health` + test.
- `packages/contracts/` — Zod health contract + test.
- `packages/assessment/` — pure TypeScript package (no items/scoring/claims).
- Root config files (tsconfig, eslint, .gitignore).
- Documentation updates (README, architecture, testing, decisions).

### Non-goals

- No authentication, users, JWT, cookies, sessions, refresh tokens, roles.
- No TypeORM, mysql2, MySQL connection, database, entities, migrations, or env
  credentials.
- No item authoring, item metadata, assessment engine, scoring, results, or
  data collection.
- No shadcn component installation unless a real UI need arises.
- No hosting, DNS, deployment, commits, or pushes.

### Acceptance criteria

- `pnpm install` completes.
- Lint, typecheck, tests, and production builds pass.
- The web build produces static-export output.
- The API health endpoint is covered by an automated test.
- `packages/assessment` has no framework, UI, or database dependency.
- All documentation remains consistent with Tier 0 boundaries.

### Required reading order

1. `AGENTS.md`
2. `docs/architecture.md`
3. `docs/testing.md`
4. `docs/decisions.md`
5. `docs/claims-ladder.md`

---

## Completion report

```text
T-003 — Completion report
--------------------------
Status: Approved (human review granted)
Outputs produced:
  pnpm-workspace.yaml, package.json, pnpm-lock.yaml, tsconfig.base.json,
  eslint.config.mjs, .gitignore
  apps/web/{package.json,next.config.mjs,tsconfig.json,next-env.d.ts,
            tailwind.config.ts,postcss.config.mjs,app/globals.css,
            app/layout.tsx,app/page.tsx}
  apps/api/{package.json,tsconfig.json,tsconfig.build.json,
            src/main.ts,src/app.module.ts,src/health.controller.ts,
            src/health.controller.spec.ts}
  packages/contracts/{package.json,tsconfig.json,tsconfig.build.json,
            src/health.ts,src/index.ts,src/health.spec.ts}
  packages/assessment/{package.json,tsconfig.json,src/index.ts}
  README.md, docs/architecture.md, docs/testing.md, docs/decisions.md
Decisions resolved:
  O-001 → D-011 (Vitest, 2026-09-09)
  O-005 → D-012 (@sapiensmetric/{web,api,contracts,assessment}, 2026-09-09)
Tests/verification run:
  pnpm install, pnpm install --frozen-lockfile, pnpm ignored-builds,
  pnpm lint, pnpm typecheck, pnpm test (3 passed), pnpm build,
  pnpm verify, bash -n scripts/verify.sh, bash scripts/verify.sh
  → all green; verify.sh 207 passed, 0 failed.
What was intentionally NOT done:
  No authentication, users, JWT, cookies, sessions, roles; no database,
  TypeORM, mysql2, migrations, env credentials; no assessment items, scoring,
  results, or data collection; no shadcn; no hosting/DNS/deployment; no
  commits or pushes.
Blockers / dependencies for the next task:
  Product-owner decisions from T-002 (scope Option A, provenance-policy
  approval) remain open before any item-authoring task.
```

---

## Approved-outcome summary

T-003 established the application foundation: a buildable pnpm monorepo with
`@sapiensmetric/web` (Next.js 16.3.4 App Router, static export, Tailwind),
`@sapiensmetric/api` (NestJS 10 + Fastify, `GET /health` with an HTTP test),
`@sapiensmetric/contracts` (Zod health contract + test), and
`@sapiensmetric/assessment` (pure TypeScript placeholder with no items,
scoring, or claims). It resolved O-001 (Vitest) and O-005 (package names),
pinned Node >=20.9.0 and pnpm 11.26.0, and made installs reproducible via
`pnpm-lock.yaml`.

## Package names (D-012)

- `@sapiensmetric/web` (`apps/web`)
- `@sapiensmetric/api` (`apps/api`)
- `@sapiensmetric/contracts` (`packages/contracts`)
- `@sapiensmetric/assessment` (`packages/assessment`)

## Decisions

- **D-011** — Test runner: Vitest (2026-09-09).
- **D-012** — Workspace/package names (2026-09-09).

## Verification evidence

- `pnpm install` / `pnpm install --frozen-lockfile` — ok.
- `pnpm lint` — 0 errors.
- `pnpm typecheck` — ok (all packages).
- `pnpm test` — 3 passed (2 contract + 1 API HTTP endpoint).
- `pnpm build` — ok (web static export to `apps/web/out`).
- `pnpm verify` — ok; `bash scripts/verify.sh` → 207 passed, 0 failed.

## Confirmation

Authentication, database access (TypeORM/mysql2/MySQL), assessment items,
scoring, deployment, commits, and pushes were **not** part of T-003.
