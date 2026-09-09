# Authentication (T-005) — local-development core

Local-development credentials authentication core for Sapiens Metric. This is
backend/API work only, scoped to the D-013/D-014/D-015 decisions in
`docs/decisions.md`. It is **not production-ready**: email verification and
password-reset delivery are deliberately deferred to T-006.

## Scope and limitations

- Local MySQL only (`127.0.0.1:3307`, the non-root T-004 application user).
- No email sending/verification, no password reset, no Google OAuth, no web
  auth UI, no deployment.
- Registration deliberately returns a generic `202` for both new and existing
  addresses and does not issue a session (no registration enumeration).
- Login returns a generic `401` for invalid credentials.

## Environment (single root .env)

The Nest API loads only the root `.env` when run from the repository root. No
second API-specific env file exists. The API reuses the non-root Compose
database user and adds:

- `DB_HOST`, `DB_PORT` — database host/port (defaults `127.0.0.1`, `3307`).
- `CORS_ORIGIN` — the single explicit web origin (credentials enabled).
- `JWT_SECRET` — signing secret (min 32 chars).
- `ACCESS_TOKEN_TTL_SECONDS` — short-lived access token lifetime.
- `REFRESH_SESSION_TTL_DAYS` — refresh session lifetime.

## Data model

- `users` — UUID id, unique normalized email, Argon2id password hash,
  `createdAt`, `updatedAt`.
- `auth_sessions` — UUID id, `userId` FK, SHA-256 hash of the opaque refresh
  token, `createdAt`, `expiresAt`, `revokedAt`, `replacedBySessionId`,
  `revokedReason`.

Schema changes are migrations only; TypeORM `synchronize` is disabled in every
environment.

## Source layout

- `apps/api/src/config/` — validated environment configuration (root `.env`).
- `apps/api/src/database/` — TypeORM data source and migration scripts.
- `apps/api/src/database/migrations/` — committed migrations.
- `apps/api/src/modules/users/` — User entity, store, module.
- `apps/api/src/modules/auth/` — auth controller, service, guards, password and
  token services, plus unit/integration tests.
- `apps/api/src/modules/auth/sessions/` — AuthSession entity, session store,
  sessions module.

## Endpoints

- `POST /auth/register` → `202 { status: 'accepted' }`
- `POST /auth/login` → `200 { accessToken }` + HttpOnly refresh cookie (or 401)
- `POST /auth/refresh` → `200 { accessToken }` + rotated refresh cookie (or 401)
- `POST /auth/logout` → `204`
- `GET /auth/me` → `200 { id, email }` (Bearer access token required)

Refresh token cookie: HttpOnly, `SameSite=Lax`, path `/auth`, `Secure` in
production. Refresh/logout reject an absent or mismatched `Origin` against the
configured web origin.

## Commands

```bash
# database (Docker Compose, see docs/local-development.md)
docker compose up -d

# migrations
pnpm --filter @sapiensmetric/api migration:run
pnpm --filter @sapiensmetric/api migration:show

# tests (Docker-free, .env-free)
pnpm test

# real-MySQL integration (requires the healthy T-004 DB; self-cleans)
pnpm --filter @sapiensmetric/api test:integration
```

`pnpm verify` runs lint, typecheck, test, build, and the dependency-free
harness without reading `.env`.
