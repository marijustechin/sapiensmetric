# Authentication (T-005 + T-006) — local-development core

Local-development credentials authentication core (T-005) plus email
verification and password-reset delivery through generic SMTP (T-006) for
Sapiens Metric. Scoped to D-013/D-014/D-015/D-016 in `docs/decisions.md`. It is
**not production-ready**, makes no legal or compliance claim, and must not be
used for real user data before the O-006 privacy review. See
`docs/email-verification.md`.

## Scope and limitations

- Local MySQL only (`127.0.0.1:3307`, the non-root T-004 application user).
- No Google OAuth, no deployment.
- Registration returns a generic `202` for both new and existing addresses and
  does not issue a session (no registration enumeration).
- Login returns a generic `401` for invalid credentials. An **unverified** user
  receives the same generic `401` (access gate; see below).
- Email verification and password reset are implemented via standard
  authenticated SMTP behind a provider-agnostic boundary.

## Environment (single root .env)

The Nest API loads only the root `.env` when run from the repository root. No
second API-specific env file exists. Variables:

- `DB_HOST`, `DB_PORT` — database host/port (defaults `127.0.0.1`, `3307`);
  `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` are reused from T-004.
- `API_PORT` (1–65535) — the local Nest listener port; it need not equal the
  public API URL port because production may sit behind a reverse proxy.
- `CORS_ORIGIN` — the single explicit web origin (credentials enabled); it is
  the equal canonical partner of `PUBLIC_APP_URL`.
- `JWT_SECRET`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_SESSION_TTL_DAYS` — auth.
- `SMTP_HOST`, `SMTP_PORT` (1–65535), `SMTP_SECURE`, `SMTP_USER`,
  `SMTP_PASSWORD`, `SMTP_FROM` (valid mailbox) — generic authenticated SMTP
  (strictly validated; invalid config or TLS mode fails closed). TLS never
  downgrades: `SMTP_SECURE=true` uses implicit TLS; `SMTP_SECURE=false` requires
  STARTTLS with no plaintext fallback.
- `SMTP_TEST_RECIPIENT` — operator-controlled recipient for the opt-in smoke
  command only.
- `EMAIL_VERIFICATION_TOKEN_TTL_SECONDS` (default `86400`),
  `PASSWORD_RESET_TOKEN_TTL_SECONDS` (default `1800`).
- `PUBLIC_APP_URL` — validated as an exact HTTP(S) origin (no wildcard,
  userinfo, non-root path, query, or fragment), stored canonically, and used
  solely as the web/browser origin in email links. It must equal the canonical
  `CORS_ORIGIN`; a mismatch fails config loading.
- `NEXT_PUBLIC_API_BASE_URL` — the only value exposed to the static web bundle,
  resolved from the environment or the root `.env` public entry; missing or
  invalid configuration fails the static web build. It is the separately
  validated browser-visible API base URL and may use a different port/origin
  from `PUBLIC_APP_URL`. For direct local development it must point at the
  running API listener (`API_PORT`); the current human configuration uses 3334.
  It rejects userinfo, query strings, and fragments, keeps an intentional path
  prefix, and normalises only a trailing slash. No secret may use the
  `NEXT_PUBLIC_` prefix.

## Data model

- `users` — UUID id, unique normalized email, Argon2id password hash, nullable
  `emailVerifiedAt`, `createdAt`, `updatedAt`.
- `auth_sessions` — UUID id, `userId` FK, SHA-256 hash of the opaque refresh
  token, `createdAt`, `expiresAt`, `revokedAt`, `replacedBySessionId`,
  `revokedReason`.
- `email_action_tokens` — UUID id, `userId` FK, `purpose` (`verify` | `reset`),
  SHA-256 `tokenHash`, `createdAt`, `expiresAt`, `consumedAt`.

Schema changes are migrations only; TypeORM `synchronize` is disabled in every
environment.

## Source layout

- `apps/api/src/config/` — validated environment configuration (root `.env`).
- `apps/api/src/database/` — TypeORM data source and migration scripts
  (+ `cleanup-action-tokens.ts`).
- `apps/api/src/database/migrations/` — `CreateAuthTables1781440000000`,
  `CreateEmailActionTokens1781440000001`.
- `apps/api/src/modules/users/` — User entity, store, module.
- `apps/api/src/modules/auth/` — auth controller, service, guard, password and
  token services, `action-token.service.ts`, `ip-rate-limiter.ts`, tests.
- `apps/api/src/modules/auth/sessions/` — AuthSession entity, store, module.
- `apps/api/src/modules/auth/action-tokens/` — EmailActionToken entity and
  store.
- `apps/api/src/modules/mailer/` — provider-agnostic mailer boundary and the
  generic nodemailer SMTP transport.
- `apps/api/src/smtp-smoke.ts` — opt-in live-SMTP smoke command.

## Endpoints

- `POST /auth/register` → `202 { status: 'accepted' }`
- `POST /auth/login` → `200 { accessToken }` + HttpOnly refresh cookie (or
  generic 401, including for unverified users)
- `POST /auth/refresh` → `200 { accessToken }` + rotated refresh cookie (or 401)
- `POST /auth/logout` → `204` (rejects an absent or mismatched Origin with `401`,
  including when no refresh cookie is present)
- `GET /auth/me` → `200 { id, email }` (Bearer access token required)
- `POST /auth/email-verification/request` → `202 { status: 'accepted' }`
  (generic for unknown, verified, cooldown-limited, and rate-limited requests)
- `POST /auth/email-verification/confirm` → `200 { status: 'verified' }`
- `POST /auth/password-reset/request` → `202 { status: 'accepted' }`
- `POST /auth/password-reset/confirm` → `200 { status: 'reset' }`

Request bodies use shared Zod contracts. Request endpoints take a `locale`
restricted to `lt` or `en`. Reset confirmation enforces the 12–128 character
password rules.

## Verification access gate (D-016)

- An unverified user gets the same generic `401` from `POST /auth/login` as
  invalid credentials; no access token and no refresh cookie are issued.
- Refresh and every session-authenticated route, including `GET /auth/me`,
  reject an unverified user. Existing sessions cannot bypass the gate.
- No response reveals "email not verified".

## In-memory limits and Origin enforcement

- Request endpoints: per-user-and-purpose 15-minute cooldown plus an in-memory
  per-IP limit of 3 calls per hour per IP per endpoint; every limited request
  still returns the generic `202`.
- Password-reset confirmation: an in-memory per-IP limit of 5 password-reset
  confirmation calls per hour per IP, applied before Argon2 hashing; a limited
  confirmation returns the same generic `400`.
- The in-memory limiter expires stale entries and caps distinct keys at 10,000;
  when full, new keys are rejected without allocation while existing keys
  continue to be evaluated. No Redis or new data store is used.
- `POST /auth/logout` rejects an absent or mismatched Origin on every attempt,
  before considering whether a refresh cookie is present. Refresh uses the same
  rule. Origins are canonical, so a trailing slash in configuration does not
  break the check.

## Browser flow (minimal LT/EN)

Six static pages:
`/lt|/en` + `/auth/verify-email`, `/auth/forgot-password`,
`/auth/reset-password`. Email links carry the raw token in the URL fragment
(`#token=...`), never a query string; pages read the fragment client-side,
remove it from browser history, and call the confirmation endpoints only after
an explicit user action. `GET`/prefetch never consume a token.

## Commands

```bash
# database (Docker Compose, see docs/local-development.md)
docker compose up -d

# migrations
pnpm --filter @sapiensmetric/api migration:run
pnpm --filter @sapiensmetric/api migration:show

# action-token retention cleanup (explicit; no cron/queue/worker)
pnpm --filter @sapiensmetric/api tokens:cleanup

# tests (Docker-free, .env-free, SMTP-network-free; fake transport)
pnpm test

# real-MySQL integration (requires the healthy T-004 DB; self-cleans)
pnpm --filter @sapiensmetric/api test:integration

# opt-in live-SMTP smoke (controlled recipient only; fails closed otherwise)
SMTP_SMOKE_CONFIRM=send pnpm --filter @sapiensmetric/api smtp:smoke
```

`pnpm verify` runs lint, typecheck, test, build, and the dependency-free
harness without reading `.env`. The smoke command is never part of `pnpm test`,
`pnpm verify`, or the integration suite.
