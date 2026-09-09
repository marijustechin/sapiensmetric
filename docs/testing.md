# Testing & verification — Sapiens Metric

## Expectations

- The assessment/scoring package must have unit tests for scoring rules,
  item-version resolution, and result reproduction.
- Tests must not require a database, network, or UI runtime.
- Scoring correctness is the highest-priority test target: given a response
  set and scoring-rule version, the produced score must be deterministic.
- Snapshot/regression tests are appropriate for versioned scoring output.

## Tooling

- Test runner: **Vitest** (D-011, 2026-09-09). It runs inside the pnpm
  monorepo with no extra system dependencies and is used for the health
  contract (`packages/contracts/src/health.spec.ts`), the auth contracts
  (`packages/contracts/src/auth.spec.ts`), the API health endpoint
  (`apps/api/src/health.controller.spec.ts`), and the auth HTTP routes
  (`apps/api/src/modules/auth/auth.controller.spec.ts`).

## Repository-invariant verification (dependency-free harness)

`scripts/verify.sh` is a dependency-free Bash harness checker. It verifies
documentation-harness invariants only:

- core docs (including `TODO.md`, the planning index that never authorises
  work), the T-001 discovery documents, and the T-002 documents exist;
- the T-001, T-002, T-003, T-004, and T-005 task archives exist under
  `tasks/done/`;
- `tasks/current.md` states that no task is currently active;
- the completed T-005 outputs exist (config, database, users, auth, migrations
  source directories, `packages/contracts/src/auth.ts` and `auth.spec.ts`,
  `docs/authentication.md`);
- the T-004 outputs (`compose.yaml`, `.env.example`,
  `docs/local-development.md`) exist and `.gitignore` contains an exact `.env`
  ignore rule;
- the T-003 implementation source outputs and `pnpm-lock.yaml` exist;
- local markdown references do not point to missing files (where reasonably
  checkable).

It uses common shell utilities (`bash`, `grep`, `sed`, `test`), requires no
Node or external dependencies, is runnable with `bash scripts/verify.sh`, and
never reads `.env`.

## Runtime verification (pnpm)

The repository provides pnpm-based checks, separate from the dependency-free
harness:

- `pnpm lint` — linting (ESLint, flat config);
- `pnpm typecheck` — TypeScript type checking across all packages;
- `pnpm test` — unit tests (health contract, auth contracts, API health
  endpoint, auth HTTP routes; Docker-free and `.env`-free);
- `pnpm build` — production builds (web static export, API build, package
  builds).

These pnpm checks require dependencies and are only relevant after the
foundation scaffold exists. They complement, and do not replace,
`scripts/verify.sh`.

## Authentication testing boundary (T-005)

The auth core uses a single environment-file strategy: the Nest API loads only
the root local `.env` when run from the repository root (no second
`apps/api/.env.example`). Testing is split:

- `pnpm test` — Docker-free and `.env`-free. Auth HTTP routes are exercised
  against controlled in-memory/test-double persistence.
- `pnpm --filter @sapiensmetric/api test:integration` — real-MySQL integration
  against the healthy T-004 container; runs migrations, uses a unique synthetic
  `@example.test` address, and deletes its own created sessions/user during
  cleanup. It never resets the database or runs `docker compose down -v`.

The integration suite complements, and does not replace, the Docker-free
`pnpm test` suite.

## Workflow expectations

- Every task must state how its work is verified (tests, script, or manual
  checklist) in its acceptance criteria.
- Run the relevant tests/checks before handing a task back for review.
