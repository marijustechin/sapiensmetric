# T-006 — Email verification and password-reset delivery through generic SMTP (archived)

- **ID:** T-006
- **Archive date:** 2026-09-21
- **Final status:** Approved (human review granted)
- **Type:** Implementation (backend/API + minimal web pages)
- **Created:** 2026-09-18
- **Completed:** 2026-09-18
- **Approved:** 2026-09-21

---

> T-006 was executed within the approved scope and approved by human review on
> 2026-09-21. It is archived; the original task definition and the corrected
> completion report are preserved below.

## Objective

Add email verification and password-reset delivery to the T-005 credentials
authentication core, using standard authenticated SMTP behind a
provider-agnostic mailer boundary, plus a minimal Lithuanian/English browser
flow. This does not make the product production-ready and makes no legal or
compliance claim.

## Binding context and constraints

- T-005 (credentials auth core) is complete, approved, and archived in
  `tasks/done/`.
- D-015 deferred email verification, password-reset delivery, and Google OAuth.
  D-016 (`docs/decisions.md`, 2026-09-18) authorises only the explicitly scoped
  T-006 work after human execution approval and records the binding choices
  below.
- **SMTP secrets:** real SMTP values already exist only in the ignored root
  `.env`. They must never be printed, copied, or committed.
- `.env.example` contains placeholders only.
- Use standard authenticated SMTP through a provider-agnostic mailer boundary.
  No provider-specific SDK and no vendor-specific application code.
- **No compliance claim.** Do not claim GDPR or other legal compliance. This
  task must produce a concrete data-minimisation, retention, and
  deployment/privacy gate document. O-006 remains unresolved until human/legal
  review, and this task does not authorise real product use.
- The single-root-`.env` strategy is preserved; no second API env file.

## Token lifecycle

1. **Generate.** On a verification or reset request, generate an opaque token of
   at least 32 random bytes, base64url encoded. Issuance is gated: verification
   tokens are issued and sent only for an existing unverified account, and reset
   tokens only for an existing account. Any request that is not eligible
   (unknown account, already-verified account for verification, cooldown-limited,
   or rate-limited) generates and sends nothing and still receives the same
   generic 202.
2. **Store.** Persist only a SHA-256 hash of the token, with its purpose
   (`verify` | `reset`), the owning user id, and timestamps. Never store or
   return the raw token. The schema direction is exactly: a nullable
   `users.emailVerifiedAt` timestamp plus a dedicated action-token table,
   created by a committed TypeORM migration. No other schema scope is
   authorised.
3. **Expire.** Verification tokens expire after 24 hours; password-reset tokens
   expire after 30 minutes. Both values are configuration-driven and validated.
4. **Replace, cooldown, and rate limit.** Issuing a token atomically
   (transaction/race-safe) invalidates every previous unused token for the same
   user and purpose. A known account receives no new token or email more often
   than once per 15 minutes per purpose. A small in-memory per-IP limit also
   applies: at most 3 request-endpoint calls per hour per IP per endpoint. This
   is defense-in-depth for the single-process bootstrap phase, not a
   distributed production claim; no Redis or new data store is used. Every
   request still receives the same generic 202. The limiter is memory-bounded:
   stale entries expire and distinct keys are capped at 10,000 distinct keys;
   when full, new keys are rejected without allocation while existing keys
   continue to be evaluated.
5. **Transport rejection.** A transport rejection before SMTP acceptance leaves
   no usable action token and does not consume the issuance cooldown. The API
   still returns the generic 202 and may record only a safe operational failure
   without any token, URL, secret, password, or account identifier.
6. **Deliver.** The raw token is used only in the outgoing email. Verification
   and reset links carry the raw token in the URL fragment (`#token=...`),
   never a query string. The token must never be logged, returned in an API
   response, or written to test output.
7. **Consume.** Valid token consumption is atomic, single-use, and
   transaction/race-safe. A token is accepted only when its hash matches, the
   purpose matches, the token is unused, and it has not expired. Password reset
   changes the Argon2id password and revokes all active refresh sessions in the
   same transaction.
8. **Retention.** Consumed and expired tokens are removed by the documented
   retention rule in the privacy gate document.

## Endpoints

These four API endpoint paths are **exact** (not indicative). All request
responses are generic and non-enumerating: an email-verification request issues
and sends only for an existing unverified account and a password-reset request
only for an existing account, but every request — unknown, verified,
cooldown-limited, or rate-limited — returns the same generic `202` body. No
response reveals account existence or configuration.

Request endpoints are protected by the per-user-and-purpose 15-minute cooldown
plus a small in-memory per-IP limit: a maximum of 3 request-endpoint calls per
hour per IP per endpoint. This is defense-in-depth for this single-process
bootstrap phase, not a distributed production claim; no Redis and no new data
store are introduced. A transport rejection before SMTP acceptance must leave
no usable action token and must not consume the issuance cooldown; the API
still returns the generic `202` and may record only a safe operational failure
without any token, URL, secret, password, or account identifier.

- `POST /auth/email-verification/request` — request (or resend) verification;
  responds `202` with a generic body regardless of whether the account exists.
- `POST /auth/email-verification/confirm` — accept a valid unused token and
  mark `emailVerifiedAt`; generic failure otherwise.
- `POST /auth/password-reset/request` — request a reset; responds `202`
  generically regardless of whether the account exists.
- `POST /auth/password-reset/confirm` — accept a valid unused token plus a new
  password, change the Argon2id password, consume the token, and revoke all
  active refresh sessions; generic failure otherwise.

All four request/confirm schemas are shared Zod contracts in
`@sapiensmetric/contracts`. The two request endpoints receive a `locale`
restricted to `lt` or `en`; the selected locale determines the mail copy and
the matching LT/EN browser route. Reset confirmation enforces the existing
12–128-character password rules.

Password-reset confirmation is protected by an in-memory per-IP limit of
5 password-reset confirmation calls per hour per IP, applied before Argon2
hashing; a limited confirmation receives the same generic 400.
POST /auth/logout rejects an absent or mismatched Origin on every attempt,
before considering whether a refresh cookie is present.

Action-token issuance, replacement/cooldown, consumption, password change, and
session invalidation must all be transaction/race-safe.

## Verification access gate

Email verification is an access gate, not an informational flag.

- A user whose `emailVerifiedAt` is null receives the same generic `401` from
  `POST /auth/login` as invalid credentials; no access token and no refresh cookie are issued.
- Refresh and every session-authenticated route, including `GET /auth/me`, must
  reject an unverified user as unauthenticated. Existing sessions must not
  bypass the new gate.
- The response must not reveal "email not verified".
- Once verification succeeds, the user may log in normally.
- Existing Docker-free fixtures and real-MySQL integration fixtures that test
  normal login/session behaviour must create verified users explicitly.

## Browser flow

The browser flow is the **selected** minimal LT/EN option (D-016). The exact
routes are:

- `/lt/auth/verify-email`
- `/en/auth/verify-email`
- `/lt/auth/forgot-password`
- `/en/auth/forgot-password`
- `/lt/auth/reset-password`
- `/en/auth/reset-password`

Email links carry the raw token in the URL fragment (`#token=...`), never a
query string. Pages read the fragment client-side, remove it from browser
history, and call the POST confirmation endpoints only after an explicit user
action. `GET` and link prefetching must never consume a token.

Each route is complete within the existing six routes:

- `verify-email` without a fragment provides the generic resend request form;
  with `#token=` it provides an explicit confirmation action.
- `forgot-password` provides the generic reset-request form.
- `reset-password` requires `#token=` and a new password; it must not submit or
  consume a token on GET or prefetch.

All existing fragment handling, history-removal, and LT/EN rules continue to
apply.

The matching future page files are under `apps/web/app/{lt,en}/auth/...` (see
"Future outputs").

## Public configuration

- The single ignored root `.env` remains the only env file; no second web or
  API env file is introduced.
- `.env.example` gains placeholder-only entries: `PUBLIC_APP_URL` and
  `NEXT_PUBLIC_API_BASE_URL`.
- `PUBLIC_APP_URL` is validated server-side and is used solely to construct the
  email link origin.
- `NEXT_PUBLIC_API_BASE_URL` is a deliberately exposed, validated build-time
  web value used by the six static pages for API calls.
- No secret may use the `NEXT_PUBLIC_` prefix.
- Origin checks use the canonical `CORS_ORIGIN`; do not introduce wildcard CORS
  or a second web/API env file.
- The static web build receives only this public value from the root
  environment; secrets must not be copied into `apps/web` or browser bundles.
- Missing or invalid public web configuration fails the static web build; the
  build has no development fallback.
- `PUBLIC_APP_URL` and `CORS_ORIGIN` are exact HTTP(S) origins (no wildcard,
  userinfo, path other than `/`, query, or fragment), are stored as canonical
  origins, and must be equal after canonicalisation, so a trailing slash cannot
  break Origin checks. `PUBLIC_APP_URL` is the web/browser origin used in email
  links. `NEXT_PUBLIC_API_BASE_URL` is a separately validated API base URL and
  may use a different port/origin. `SMTP_PORT` is validated as 1–65535 and
  `SMTP_FROM` as a valid mailbox address.
- `API_PORT` (1–65535) is the validated local Nest listener port and need not
  equal the public API URL port (production may sit behind a reverse proxy).
  For direct local development `NEXT_PUBLIC_API_BASE_URL` must point at the
  running API listener; the current human configuration uses 3334.
  `NEXT_PUBLIC_API_BASE_URL` rejects userinfo, query strings, and fragments,
  keeps an intentional path prefix, and normalises only a trailing slash.

## Privacy boundary

- **No public/end-user data collection occurs in T-006.** All tests use
  synthetic data and the API's ordinary test persistence.
- The single operator-controlled smoke recipient (`SMTP_TEST_RECIPIENT`) exists
  only in the ignored root `.env`, is used solely for the explicit opt-in smoke
  command, is not persisted by the application, and does not resolve O-006.
- **Data minimisation:** store only what the flow requires (token hash,
  purpose, user id, timestamps). Do not store raw tokens, email bodies, or
  unnecessary metadata.
- **Retention:** define and document a concrete retention period for consumed
  and expired tokens.
- **Deployment/privacy gate:** produce a concrete gate document covering
  data-minimisation, retention, and deployment/privacy conditions.
- **No compliance claim:** the gate document is engineering input to review,
  not a legal conclusion. O-006 remains unresolved.

## SMTP safety rules

- Real SMTP credentials live only in the ignored root `.env`; never print,
  copy, or commit them.
- `.env.example` receives placeholders only.
- Validate all SMTP configuration before use: host, port, secure mode,
  credentials, sender, public application URL, and the controlled SMTP test
  recipient.
- SMTP TLS never downgrades: `SMTP_SECURE=true` uses implicit TLS, and
  `SMTP_SECURE=false` requires STARTTLS; plaintext fallback is not permitted.
- Ordinary tests use a fake/in-memory mail transport and open no network
  connection.
- There is an explicitly named, opt-in SMTP smoke command. It may send one
  benign message only to `SMTP_TEST_RECIPIENT`. It must never run under
  `pnpm test`, `pnpm verify`, or integration tests, and must not print a token,
  URL, password, or SMTP value.
- Never log a raw token, SMTP credential, password, or verification/reset URL.

## Future outputs

The T-006 outputs below now exist; the harness asserts their presence.

- Validated SMTP configuration, with placeholder additions to `.env.example`
  (host, port, secure mode, credentials, sender, public application URL,
  controlled test recipient `SMTP_TEST_RECIPIENT`).
- Placeholder-only root `.env.example` entries for `PUBLIC_APP_URL` and
  `NEXT_PUBLIC_API_BASE_URL` (no secret may use the `NEXT_PUBLIC_` prefix).
- A provider-agnostic mailer module under `apps/api/src/modules/mailer/`.
- An action-token service at
  `apps/api/src/modules/auth/action-token.service.ts` (generation, hashing,
  expiry, single-use consumption).
- A new migration under `apps/api/src/database/migrations/` adding only the
  nullable `users.emailVerifiedAt` timestamp and the dedicated action-token
  table (migrations only; `synchronize` stays disabled).
- Shared Zod contracts for the four request/confirm schemas.
- Six exact web page files:
  - `apps/web/app/lt/auth/verify-email/page.tsx`
  - `apps/web/app/en/auth/verify-email/page.tsx`
  - `apps/web/app/lt/auth/forgot-password/page.tsx`
  - `apps/web/app/en/auth/forgot-password/page.tsx`
  - `apps/web/app/lt/auth/reset-password/page.tsx`
  - `apps/web/app/en/auth/reset-password/page.tsx`
- Tests using a fake transport plus an explicit, opt-in SMTP smoke command.
- The privacy gate document (`docs/email-verification.md`).
- Documentation updates (`docs/architecture.md`, `docs/testing.md`,
  `docs/decisions.md`, `README.md`, `TODO.md`, `scripts/verify.sh`).

## Non-goals

- No Google OAuth (T-007).
- No deployment, no vHosts access.
- No Redis, no queues, no microservices.
- No assessment items/scoring or assessment-domain work.
- No public marketing work.
- No real user data collection and no real product use.
- No GDPR/legal compliance claim.
- No provider-specific SDK or vendor-specific application code.
- No commit or push.

## Acceptance criteria

When T-006 is executed and reviewed, it is complete only when:

- SMTP configuration is validated at startup and documented with `.env.example`
  placeholders; no real secret is committed or logged.
- The mailer boundary is provider-agnostic (no provider SDK).
- Action tokens are opaque, high-entropy, stored only as a hash, single-use,
  purpose-scoped, and expiring (24h verification, 30min reset,
  configuration-driven and validated).
- Issuing a token invalidates previous unused tokens for the same user/purpose
  and enforces the 15-minute-per-purpose cooldown, while every request returns
  the same generic `202`.
- The migration adds only the nullable `users.emailVerifiedAt` timestamp and the
  dedicated action-token table, with `synchronize` disabled.
- The four exact API paths and the six exact web routes exist.
- Request endpoints restrict `locale` to `lt`/`en` and the locale determines the
  mail copy and matching route.
- Email-verification requests issue/send only for an existing unverified account
  and password-reset requests only for an existing account; every request
  (unknown, verified, cooldown-limited, rate-limited) returns the same generic
  `202`.
- The request endpoints enforce the per-user-and-purpose 15-minute cooldown and
  the in-memory per-IP limit of 3 calls per hour per IP per endpoint, with no
  Redis and no new data store.
- A transport rejection before SMTP acceptance leaves no usable action token and
  does not consume the issuance cooldown, while still returning the generic
  `202` and recording only a safe failure without token, URL, secret, password,
  or account identifier.
- Public configuration uses only the single root `.env`: `PUBLIC_APP_URL`
  validated server-side for the email-link origin, `NEXT_PUBLIC_API_BASE_URL`
  as the validated build-time web value, no secret under `NEXT_PUBLIC_`, no
  wildcard CORS, and no secret copied into `apps/web` or browser bundles.
- Email verification marks the email verified.
- Email verification is enforced as an access gate: a user with a null
  `emailVerifiedAt` receives the same generic `401` from `POST /auth/login` as
  invalid credentials with no access token and no refresh cookie; refresh and
  every session-authenticated route, including `GET /auth/me`, reject an
  unverified user as unauthenticated; existing sessions do not bypass the gate;
  responses do not reveal "email not verified"; and a verified user logs in
  normally.
- Docker-free fixtures and real-MySQL integration fixtures that exercise normal
  login/session behaviour create verified users explicitly.
- The six browser routes are complete: verify-email serves the resend form
  without a fragment and the confirmation action with `#token=`;
  forgot-password serves the generic reset-request form; reset-password requires
  `#token=` and a new password and never submits or consumes a token on
  GET/prefetch.
- Auth tests cover unverified login rejection (same generic `401` as invalid
  credentials, no access token, no refresh cookie), refresh rejection,
  `GET /auth/me` rejection, successful verification followed by normal login,
  and that existing sessions do not bypass the gate.
- Password reset with a valid unused token changes the Argon2id password
  (enforcing the 12–128-character rules), consumes the token, and revokes all
  active refresh sessions, transaction/race-safe.
- Fake-transport tests cover: unknown-email generic `202`; verified-account
  verification request returning generic `202` without a send; cooldown generic
  `202` without another send; per-IP limit returning generic `202` without
  another send; transport rejection with no usable token and no cooldown
  consumed; previous-token invalidation; expired, wrong-purpose, and consumed
  token rejection; simultaneous consumption allowing exactly one success; reset
  revoking all sessions; and no token, credential, or URL in output.
- Real-MySQL integration coverage exists for concurrent action-token
  consumption and reset-session invalidation.
- The explicitly named, opt-in SMTP smoke command sends one benign message only
  to `SMTP_TEST_RECIPIENT`, never runs under `pnpm test`, `pnpm verify`, or
  integration tests, and prints no token, URL, password, or SMTP value.
- No raw token, SMTP credential, password, or reset/verification URL appears in
  logs, API responses, or test output.
- The privacy gate document exists and states that no public/end-user data is
  collected; O-006 is still recorded as unresolved.
- Public web configuration fails the static web build when missing or invalid,
  and has no development fallback.
- `PUBLIC_APP_URL` and `CORS_ORIGIN` are strict canonical HTTP(S) origins and
  must be equal after canonicalisation; `PUBLIC_APP_URL` is the web/browser
  origin used in email links and `NEXT_PUBLIC_API_BASE_URL` is a separate API
  base URL that may use a different port/origin, covered by matching/mismatched
  config tests.
- `API_PORT` is validated 1–65535 and drives the Nest listener; the web API-base
  value rejects userinfo, query strings, and fragments while keeping a path
  prefix, covered by focused tests; the configured listener is verified with
  `GET /health`.
- `PUBLIC_APP_URL` and `CORS_ORIGIN` are exact HTTP(S) origins stored as
  canonical origins; `SMTP_PORT` is 1–65535 and `SMTP_FROM` is a valid mailbox.
- SMTP TLS never downgrades: secure mode uses implicit TLS and non-secure mode
  requires STARTTLS with no plaintext fallback, covered by a transport-options
  test that opens no connection.
- Password-reset confirmation enforces the in-memory per-IP limit of 5
  password-reset confirmation calls per hour per IP before Argon2 hashing, with
  the same generic 400 when limited, covered by a test proving no hashing occurs.
- The in-memory limiter is memory-bounded (stale expiry; a cap of 10,000 distinct
  keys; new keys rejected without allocation), with deterministic tests.
- POST /auth/logout rejects an absent or mismatched Origin on every attempt,
  including with no refresh cookie, covered by tests.
- `bash scripts/verify.sh` and the relevant pnpm checks pass.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md` (this file)
3. `docs/authentication.md`
4. `docs/decisions.md` (D-013, D-014, D-015, D-016; O-006)
5. `docs/architecture.md`
6. `docs/testing.md`
7. `docs/local-development.md`
8. `tasks/done/2026-09-09-typeorm-persistence-and-credentials-authentication-core.md`
9. `scripts/verify.sh`

## Browser flow decision

Selected: **minimal LT/EN pages** (the previous undecided browser-choice
blocker is removed; D-016 records this choice). The exact routes are
`/lt/auth/verify-email`, `/en/auth/verify-email`,
`/lt/auth/forgot-password`, `/en/auth/forgot-password`,
`/lt/auth/reset-password`, and `/en/auth/reset-password`. Email links carry the
raw token in the URL fragment (`#token=...`), never a query string; pages read
the fragment client-side, remove it from browser history, and call the POST
confirmation endpoints only after an explicit user action; `GET` and link
prefetching must never consume a token.

O-006 (privacy) remains unresolved and does not authorise real product use or a
compliance claim.

## Completion-report template

```text
T-006 — Completion report
--------------------------
Status:
Outputs produced (list each required output and its location):
SMTP config validated:
Action-token model (hash, TTLs, cooldown, per-IP limit, single-use):
Endpoints and generic responses (selection gating, transport rejection):
Public configuration (PUBLIC_APP_URL, NEXT_PUBLIC_API_BASE_URL):
Migration name and schema change:
Privacy gate document:
Verification access gate (login/refresh/me rejection, no cookie, fixtures):
Browser flow implemented (minimal LT/EN, exact routes, route completeness):
Tests/verification run (list commands and results):
  - ordinary (fake transport):
  - real-MySQL integration:
  - opt-in SMTP smoke (SMTP_TEST_RECIPIENT only):
What was intentionally NOT done:
Blockers / dependencies for the next task:
Secrets confirmation (no real SMTP value/token/password logged or committed):
No-collection confirmation (no public/end-user data collected; O-006 unresolved):
```

## Completion report

```text
T-006 — Completion report
--------------------------
Status: Approved (human review granted); archived 2026-09-21
Outputs produced:
  apps/api/src/config/env.ts (strict SMTP/public/token configuration)
  apps/api/src/modules/mailer/{transport,nodemailer-transport,mailer.service,mailer.module}.ts
  apps/api/src/modules/auth/action-token.service.ts
  apps/api/src/modules/auth/action-tokens/{email-action-token.entity,action-token.store,action-tokens.module}.ts
  apps/api/src/modules/auth/ip-rate-limiter.ts
  apps/api/src/database/migrations/1781440000001-CreateEmailActionTokens.ts
  apps/api/src/database/cleanup-action-tokens.ts
  apps/api/src/smtp-smoke.ts
  apps/api/src/modules/auth/auth.{controller,service,module}.ts, access-token.guard.ts
  apps/api/src/modules/auth/email-flow.controller.spec.ts, auth.integration.spec.ts
  packages/contracts/src/auth.ts, auth.spec.ts
  apps/web/app/{lt,en}/auth/{verify-email,forgot-password,reset-password}/page.tsx
  apps/web/app/_components/auth-forms.tsx, apps/web/next.config.mjs
  docs/email-verification.md, docs/authentication.md, docs/architecture.md,
  docs/testing.md, README.md, TODO.md, tasks/current.md, scripts/verify.sh,
  .env.example, .env (local only, ignored, values not recorded)
SMTP config validated: yes (strict Zod; TLS mode enum; PUBLIC_APP_URL origin
  must match CORS_ORIGIN; fail closed).
Action-token model: >=32 random bytes base64url; SHA-256 persisted; verify TTL
  86400s, reset TTL 1800s (config-driven); per-user/purpose 15-minute cooldown;
  in-memory per-IP limit 3/hour/IP/endpoint; single-use atomic consumption;
  transport-rejection rollback leaves no usable token and no cooldown consumed.
Endpoints and generic responses:
  POST /auth/email-verification/request -> 202 {status:'accepted'}
  POST /auth/email-verification/confirm -> 200 {status:'verified'}
  POST /auth/password-reset/request     -> 202 {status:'accepted'}
  POST /auth/password-reset/confirm     -> 200 {status:'reset'}
Public configuration: PUBLIC_APP_URL (server-side link origin) and
  NEXT_PUBLIC_API_BASE_URL (build-time web only); no secret under NEXT_PUBLIC_.
Migration name and schema change: 1781440000001-CreateEmailActionTokens adds a
  nullable users.emailVerifiedAt and the email_action_tokens table (+indexes/FK);
  synchronize remains disabled.
Privacy gate document: docs/email-verification.md (data minimisation, retention,
  deployment/privacy gate; O-006 unresolved).
Verification access gate: unverified login -> same generic 401 as invalid
  credentials with no access token/refresh cookie; refresh and GET /auth/me
  reject unverified users; existing sessions cannot bypass; fixtures create
  verified users explicitly.
Browser flow implemented: minimal LT/EN, exact six routes; fragment-only tokens
  (#token=), history fragment removal, explicit user action; no GET/prefetch
  consumption.
Verification evidence (redacted; no secret, token, URL, or recipient printed):
  - ordinary (fake transport): 69 non-integration tests passed
    (15 in `@sapiensmetric/contracts`, 54 in `@sapiensmetric/api`);
  - real-MySQL integration: 6 tests passed against the local development
    database;
  - migrations: `CreateAuthTables1781440000000` and
    `CreateEmailActionTokens1781440000001` applied successfully against the local
    development database, and migration status reports none pending;
  - controlled SMTP smoke: exactly one message was accepted by the SMTP
    transport (`SMTP_SMOKE_CONFIRM=send`);
  - `bash scripts/verify.sh`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
    `pnpm build` passed.
What was intentionally NOT done:
  Google OAuth, deployment, vHosts access, Redis/queues/microservices,
  assessment items/scoring, public marketing, real user data collection,
  GDPR/legal compliance claim, commit, push.
Blockers / dependencies for the next task:
  O-006 privacy review before any real user data. T-007 (Google OAuth) is a
  later task that requires its own recorded decision and explicitly scoped task;
  it is not activated by T-006.
Secrets confirmation: no SMTP password, token, URL, recipient address, or raw
  `.env` value was printed or committed.
No-collection confirmation: no public/end-user data collected; O-006 unresolved.
```
