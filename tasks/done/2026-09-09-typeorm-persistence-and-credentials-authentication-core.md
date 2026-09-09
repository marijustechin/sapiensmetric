# T-005 — TypeORM persistence and credentials authentication core (archived)

- **ID:** T-005
- **Archive date:** 2026-09-09
- **Final status:** Approved (human review granted)

---

## Original task definition

# T-005 — TypeORM persistence and credentials authentication core

- **ID:** T-005
- **Status:** Ready for human review
- **Type:** Implementation (backend/API)

### Objective

Create the explicitly scoped, local-development authentication foundation for
Sapiens Metric: MySQL/TypeORM migrations plus email-and-password registration,
login, refresh, logout, and an authenticated identity endpoint. Backend/API
only; not deployed or used for real user data before the O-006 privacy review.

### Recorded prerequisites (D-013/D-014/D-015, in docs/decisions.md, 2026-09-09)

- **D-013** — Credentials auth uses a short-lived JWT access token returned in
  the response body plus an opaque, rotating refresh token stored only in an
  HttpOnly cookie.
- **D-014** — One active refresh session per user. A successful login revokes
  all prior active sessions; refresh rotates the token; logout revokes the
  current session.
- **D-015** — Email verification, password-reset delivery, and Google OAuth
  are deliberately deferred; T-005 must not claim production-ready account
  verification.

### Scope, non-goals, acceptance criteria

See the archived T-005 definition (single root `.env`, TypeORM migrations only
with `synchronize` disabled, non-root local MySQL user, generic 202 register /
generic 401 login, 12–128 char passwords, Origin-checked refresh/logout, no
web UI, no OAuth/SMTP/reset, no deployment).

---

## Completion report

```text
T-005 — Completion report
--------------------------
Status: Approved (human review granted)
Outputs produced:
  apps/api/src/config/, apps/api/src/database/ (+ migrations/),
  apps/api/src/modules/users/, apps/api/src/modules/auth/ (+ sessions/)
  apps/api/package.json, apps/api/tsconfig.json
  packages/contracts/src/auth.ts, auth.spec.ts, index.ts
  docs/authentication.md, docs/architecture.md, docs/testing.md,
  docs/decisions.md, README.md, TODO.md, scripts/verify.sh, tasks/current.md,
  .env.example, pnpm-lock.yaml, pnpm-workspace.yaml (argon2 approval)
Decisions resolved: D-013, D-014, D-015 (recorded 2026-09-09).
Verification run: pnpm install/frozen-lockfile, migration:run/migration:show,
  lint, typecheck, test (Docker-free), test:integration (real MySQL), build,
  verify.sh — all green.
What was intentionally NOT done:
  Email verification, password reset, Google OAuth, SMTP, web auth UI,
  deployment, vHosts access, Redis/queues, assessment items/scoring, real
  user data collection, commit, push.
Blockers / dependencies for the next task:
  T-006 must add the email-verification/password-reset gate before public
  release (D-015); O-006 privacy review precedes any real data collection.
```

---

## Approved-outcome summary

T-005 delivered a local-development credentials authentication core on the
T-004 MySQL environment: TypeORM + mysql2 with migrations only (`synchronize`
disabled), `User` and `AuthSession` tables, and the `/auth/*` endpoints
(`register`, `login`, `refresh`, `logout`, `me`). It implements D-013
(short-lived JWT access token + opaque rotating refresh token in an HttpOnly,
SameSite=Lax cookie), D-014 (one active session per user with atomic
login/refresh/logout semantics under a per-user lock), and D-015 (no email
verification / reset / OAuth). Race conditions (concurrent registration,
concurrent refresh, logout-versus-refresh) and input validation were
hardened during review.

## Final source layout

- `apps/api/src/config/` — validated environment configuration (root `.env`).
- `apps/api/src/database/` — TypeORM data source + migration scripts.
- `apps/api/src/database/migrations/` — `1781440000000-CreateAuthTables.ts`.
- `apps/api/src/modules/users/` — User entity, store, module.
- `apps/api/src/modules/auth/` — controller, service, guard, password/token
  services, module, unit/integration tests.
- `apps/api/src/modules/auth/sessions/` — AuthSession entity, session store,
  sessions module.

## MySQL/TypeORM migration outcome

- Migration `1781440000000-CreateAuthTables` creates `users` and
  `auth_sessions` (utf8mb4 / utf8mb4_0900_ai_ci) with unique-email,
  token-hash, and userId indexes/FK only. No other tables.

## Credentials endpoint contract

- `POST /auth/register` → `202 { status: 'accepted' }` (new or existing email;
  no session; non-enumerating).
- `POST /auth/login` → `200 { accessToken }` + HttpOnly refresh cookie, or
  generic `401`.
- `POST /auth/refresh` → `200 { accessToken }` + rotated refresh cookie, or
  `401` (missing/revoked/expired, or absent/mismatched Origin).
- `POST /auth/logout` → `204`, clears refresh cookie; `401` on absent/mismatched
  Origin.
- `GET /auth/me` → `200 { id, email }` (Bearer access token required; rejects
  expired JWT, revoked/expired session, or sub/session mismatch).

## Security model

- Passwords: Argon2id, 12–128 chars, never in logs/contracts/errors/docs.
- Access token: short-lived JWT with only `sub` and `sid`.
- Refresh token: opaque random (48 bytes), SHA-256-hashed at rest, HttpOnly,
  SameSite=Lax, path `/auth`, Secure in production, Max-Age from
  `REFRESH_SESSION_TTL_DAYS`.
- CORS: single explicit configured origin with credentials.
- Session mutations serialise per user (pessimistic lock on the User row),
  making login, refresh, and logout atomic and deadlock-safe.

## Deferred work (not part of T-005)

- O-006 privacy review before any real data collection.
- T-006: email verification + password-reset delivery.
- T-007: Google OAuth.
- Web auth UI, production deployment, and vHosts Node-to-MySQL feasibility.

## Verification evidence

- `pnpm lint` / `pnpm typecheck` / `pnpm build` — green.
- `pnpm test` — Docker-free, `.env`-free (contracts + auth HTTP routes).
- `pnpm --filter @sapiensmetric/api test:integration` — real MySQL, synthetic
  `@example.test` data, self-cleanup.
- `bash scripts/verify.sh` / `pnpm verify` — green.

## Confirmation

No real user data, no assessment items/scoring, no deployment, no commit, and
no push occurred. The local `.env` was never committed and is not recorded
here.
