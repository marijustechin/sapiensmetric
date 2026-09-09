# Sapiens Metric

A serious cognitive-ability and knowledge-assessment platform.

- Product: **Sapiens Metric**
- Domain: **sapiensmetric.eu**
- Languages: Lithuanian and English
- Status: **Foundation + local MySQL + credentials auth core.** A buildable
  pnpm monorepo with a static web baseline, a NestJS/Fastify API (health +
  `/auth/*`), shared Zod contracts, and a local MySQL 8.0.46 environment.
  No assessment items, scoring, email verification, or production deployment
  yet.

The documentation and discovery baseline (T-001), the initial-instrument and
item-provenance decision proposal (T-002), the application foundation scaffold
(T-003), the local MySQL development environment (T-004), and the credentials
authentication core (T-005) are complete and archived in `tasks/done/`. No task
is currently active.

T-005 uses a single environment-file strategy: the Nest API loads only the
root local `.env` (see below); no second API-specific env file is created.

## Repository layout

- `apps/web` (`@sapiensmetric/web`) — Next.js App Router, static export,
  Tailwind baseline.
- `apps/api` (`@sapiensmetric/api`) — NestJS + Fastify, `GET /health` plus
  `/auth/*` credentials auth core (see `docs/authentication.md`).
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
