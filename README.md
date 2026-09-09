# Sapiens Metric

A serious cognitive-ability and knowledge-assessment platform.

- Product: **Sapiens Metric**
- Domain: **sapiensmetric.eu**
- Languages: Lithuanian and English
- Status: **Foundation scaffold in place (T-003).** A buildable pnpm monorepo
  with a static web baseline, a minimal NestJS/Fastify API, and shared
  contracts exists. No assessment items, scoring, database, or authentication
  yet.

The documentation and discovery baseline (T-001), the initial-instrument and
item-provenance decision proposal (T-002), and the application foundation
scaffold (T-003) are complete and archived in `tasks/done/`. No task is
currently active.

## Repository layout

- `apps/web` (`@sapiensmetric/web`) — Next.js App Router, static export,
  Tailwind baseline.
- `apps/api` (`@sapiensmetric/api`) — NestJS + Fastify, `GET /health`.
- `packages/contracts` (`@sapiensmetric/contracts`) — shared Zod contracts.
- `packages/assessment` (`@sapiensmetric/assessment`) — pure TypeScript
  placeholder (no items, scoring, or claims yet).
- `docs/` — product, assessment, architecture, testing, and decision docs.
- `tasks/` — current task and archived tasks.
- `TODO.md` — planning index (never authorises work).
- `scripts/verify.sh` — dependency-free documentation-harness checks.

## Local setup

Requirements:

- Node.js `>=20.9.0`
- pnpm `11.26.0` (pinned via `packageManager` and root `engines`)

```bash
pnpm install
```

## Verification commands

```bash
bash scripts/verify.sh   # dependency-free harness invariants
pnpm lint                # ESLint
pnpm typecheck           # TypeScript type checking
pnpm test                # unit tests (health contract + API health endpoint)
pnpm build               # production builds (web static export, API build)
```

The web build emits static-export output to `apps/web/out`.

## Boundaries (non-negotiable)

Until psychometric validation and representative norming exist, Sapiens Metric
must **not** claim to provide a real IQ score, clinical diagnosis, hiring
recommendation, or scientifically validated assessment. It must not copy or
reconstruct proprietary/protected test instruments.
