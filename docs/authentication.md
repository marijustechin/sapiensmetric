# Authentication (T-005 + T-006 + T-008 + T-007) — local-development core

Local-development credentials authentication core (T-005), email verification
and password-reset delivery through generic SMTP (T-006), the classical LT/EN
authentication frontend (T-008), and optional Google OpenID Connect sign-in
(T-007) for Sapiens Metric. Scoped to D-013/D-014/D-015/D-016/D-017/D-018 in
`docs/decisions.md`. It is
**not production-ready**, makes no legal or compliance claim, and must not be
used for real user data before the O-006 privacy review. See
`docs/email-verification.md`.

## Scope and limitations

- Local MySQL only (`127.0.0.1:3307`, the non-root T-004 application user).
- Google OpenID Connect sign-in is implemented but **optional**: it is available
  only when the Google environment values are configured, and its absence never
  affects password authentication. No deployment.
- Registration is conventional (D-017): a new address creates an unverified
  account and immediately sends one verification email; an already-registered
  address returns an explicit `409 EMAIL_ALREADY_REGISTERED` conflict. This
  intentionally trades registration enumeration resistance for clear UX.
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
- `user_identities` — UUID id, `userId` FK, `provider` (e.g. `google`),
  `subject` (immutable OIDC `sub`), `createdAt`; unique `(provider, subject)`.

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
- `apps/api/src/modules/auth/identities/` — durable provider identities
  (`user_identities`).
- `apps/api/src/modules/auth/google/` — OAuth transaction/PKCE, JWKS + ID-token
  verification, token exchange, account resolution, controller.
- `apps/api/src/smtp-smoke.ts` — opt-in live-SMTP smoke command.

## Endpoints

- `POST /auth/register` → `202 { status: 'accepted' }` (account created and one
  verification email issued/sent); `409 { code: 'EMAIL_ALREADY_REGISTERED' }`
  for an existing address; `502 { code: 'VERIFICATION_EMAIL_DELIVERY_FAILED' }`
  when the account was created but the verification email could not be sent
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
- `GET /auth/google/status` → `200 { available: boolean }`
- `GET /auth/google/start` → `302` to Google (sets the signed transaction
  cookie); `503 { code: 'GOOGLE_OAUTH_UNAVAILABLE' }` when unconfigured
- `GET /auth/google/callback` → validates the transaction and ID token, sets the
  refresh cookie, and `302` back to a safe same-origin web path; on any failure
  `302` to the web login page with a `googleError` marker

Request bodies use shared Zod contracts. Request endpoints take a `locale`
restricted to `lt` or `en`. Reset confirmation enforces the 12–128 character
password rules.

## Registration flow (T-008, D-017)

Registration is conventional and clear rather than non-enumerating:

- **New address:** the account is created unverified and exactly one
  verification email is issued and sent, reusing the existing action-token
  issuance, 15-minute cooldown, hashing, TTL, mailer, and transport-rejection
  handling. The optional `locale` (`lt` | `en`, default `en`) selects the mail
  copy and link route.
- **Existing address:** `409 { statusCode: 409, code:
  'EMAIL_ALREADY_REGISTERED', message }`. This deliberately reveals that the
  address is registered (D-017).
- **Delivery failure after creation:** `502 { statusCode: 502, code:
  'VERIFICATION_EMAIL_DELIVERY_FAILED', message }`. The account remains
  unverified, the unusable token is removed, and the user recovers via the
  resend-verification flow. Registration never reports false success and never
  retries delivery automatically.
- **Concurrency:** at most one user record and at most one verification email
  per address; a concurrent loser receives the duplicate conflict and sends
  nothing.
- The unverified login/refresh/session gate below is unchanged.

## Verification access gate (D-016)

- An unverified user gets the same generic `401` from `POST /auth/login` as
  invalid credentials; no access token and no refresh cookie are issued.
- Refresh and every session-authenticated route, including `GET /auth/me`,
  reject an unverified user. Existing sessions cannot bypass the gate.
- No response reveals "email not verified".

## Roles, account status, and session validity (T-012)

Permission matrix (API-enforced):

| Capability | user | editor | admin |
| --- | --- | --- | --- |
| Own account access (login, `/account`, logout) | yes | yes | yes |
| Content management | – | deferred | – |
| Admin summary / user list / user detail | no | no | yes |
| Change role / suspend / reactivate / revoke sessions | no | no | yes |

- One role per user (`user` | `editor` | `admin`) and a separate account status
  (`active` | `suspended`). Both are read from the database on every request; no
  role is trusted from the JWT.
- `AccessTokenGuard` rejects a missing/revoked/expired session, an unverified
  user, or a non-active user with `401`. `AdminGuard` additionally requires
  `role = admin` (`403` otherwise).
- Suspension revokes the user's active sessions and blocks new credentials and
  OAuth sessions; revoke-all invalidates access and refresh; reactivation does
  not revive revoked sessions; password reset and email verification never
  reactivate a suspended account.
- Admin endpoints: `GET /admin/summary`, `GET /admin/users` (search,
  role/status/verification filters, bounded pagination, deterministic sorting),
  `GET /admin/users/:id` (+ linked provider names),
  `PATCH /admin/users/:id/role`, `PATCH /admin/users/:id/status`,
  `POST /admin/users/:id/revoke-sessions`, `GET /admin/audit`.
- Administrators cannot change their own role or suspend themselves; the last
  active verified administrator cannot be demoted or suspended (enforced in the
  transaction, including concurrent requests).
- Administrative mutations and their `admin_audit_log` entries are atomic; audit
  entries contain no credentials or tokens.
- Bootstrap: `pnpm --filter @sapiensmetric/api admin:promote -- --email <email>`
  (dry run) or `... --apply` (see `docs/local-development.md`).

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

## Browser frontend (T-008, static export)

T-008 adds the classical LT/EN frontend over these endpoints. All pages remain
static-export client components; the only configured API base is
`NEXT_PUBLIC_API_BASE_URL` (no host is hardcoded).

- Access token: held **in memory only** (a React ref). It is never written to
  `localStorage`, `sessionStorage`, the URL, logs, or rendered HTML.
- Session bootstrap: `POST /auth/refresh` using the HttpOnly cookie
  (`credentials: 'include'`). A `401` means unauthenticated; a network failure or
  `5xx` is a recoverable error with an explicit retry (never an automatic
  redirect to login).
- On refresh success, `GET /auth/me` (Bearer) supplies the account identity.
- Protected route: only `/{lt,en}/account` (client-side gate); other auth pages
  remain public.
- `returnTo` is same-origin-validated (`apps/web/features/auth/auth-navigation.ts`): an
  external, protocol-relative, or malformed value falls back to the account path.
- Logout calls `POST /auth/logout` (Origin-checked) and clears the in-memory
  token.

T-008 introduces no new auth capability and no new endpoint.

## Google sign-in (T-007, D-018)

Optional Google OpenID Connect sign-in using the OAuth 2.0 authorization-code
flow with PKCE (S256). Identity is keyed solely by the immutable OIDC `sub`;
email only drives the automatic-linking rules (D-018). The transaction cookie
`sm_oauth_tx` is short-lived (10 minutes), `HttpOnly`, `SameSite=Lax`, path
`/auth/google`, `Secure` in production, and integrity-protected with HMAC-SHA256
over an HKDF-SHA256-derived key; it is rejected when tampered/expired and cleared
after the callback. The ID token is verified against Google JWKS (RS256 selected
by `kid`), plus `iss`, `aud`/client ID, `exp`, and the `nonce` binding; a decoded
but unverified payload is never trusted.

Flow: the web button navigates to `GET /auth/google/start`, Google redirects to
`GET /auth/google/callback`, and a successful callback establishes the same
refresh session as password login, then redirects to a safe same-origin
`returnTo` (default `/{locale}/account`). No token is placed in a URL. On any
failure the callback redirects to the web login page with a `googleError` marker.

### Local Google setup

1. In the Google Cloud Console create an OAuth 2.0 Client ID (Web application).
2. **Authorized redirect URI is required and must exactly equal**
   `GOOGLE_REDIRECT_URI`, e.g. `http://localhost:3334/auth/google/callback`
   (scheme, host, port, and path must match exactly).
3. **Authorized JavaScript origins are not required** for this server-side
   authorization-code flow. They would only be needed if a browser SDK such as
   Google Identity Services were added later; do not configure them for this
   task.
4. Configure only the ignored root `.env` (never committed): `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
5. Leave them absent to keep Google disabled; `/auth/google/status` then reports
   unavailable and password authentication is unaffected.

No account link/unlink management UI exists; linking is automatic per D-018.

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
