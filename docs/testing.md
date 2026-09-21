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
- the T-001, T-002, T-003, T-004, T-005, and T-006 task archives exist under
  `tasks/done/`;
- the archived T-006, T-007, and T-008 records exist with their final approved
  statuses, and `tasks/current.md` declares that no task is active;
- the T-007 Google sign-in outputs exist (identity entity/store/module, OAuth
  transaction service, JWKS/ID-token verification, token client, account
  resolution, controller, migration, and the web Google button);
- the T-008 authentication frontend outputs exist (typed API client, safe
  `returnTo` helper and its unit test, auth provider/nav/forms/account
  components, and the LT/EN login, register, and account routes);
- `docs/decisions.md` contains the exact D-016 heading, and (scoped to the
  D-016 section itself) its 2026-09-18 date, the O-006 note, and the
  verification access gate;
- the completed T-006 outputs exist (the mailer module, the action-token
  service, the `*CreateEmailActionTokens*` migration, the six exact LT/EN pages,
  and `docs/email-verification.md`);
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
  endpoint, auth HTTP routes, the conventional registration flow, and the web
  frontend unit tests; Docker-free and `.env`-free);
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

## T-006 testing boundary (implemented)

Docker-free `pnpm test` uses a fake in-memory mail transport and opens no SMTP
connection. It covers the generic 202s, selection gating, the cooldown, the
per-IP limit, transport-rejection rollback (no usable token, no cooldown
consumed), previous-token invalidation, expired/wrong-purpose/consumed token
rejection, exactly-one concurrent consumption, reset revoking all sessions, the
verification access gate, and no-secret-output checks.

It also covers, without any network connection:

- SMTP transport options: implicit TLS for `SMTP_SECURE=true`; required STARTTLS
  with plaintext fallback forbidden for `SMTP_SECURE=false`;
- the password-reset-confirmation per-IP limit (5/hour/IP) applied before Argon2
  hashing (a limited request does not invoke hashing);
- the in-memory limiter bound (stale-key expiry; distinct-key cap of 10,000; new
  keys rejected without allocation while existing keys are still evaluated);
- `POST /auth/logout` rejecting an absent or mismatched Origin with no refresh
  cookie as well as the existing cookie-bearing cases.

Config tests cover a matching canonical `PUBLIC_APP_URL`/`CORS_ORIGIN` pair
(including a trailing-slash variant) and a mismatched pair that fails closed,
`API_PORT` range validation (1–65535, default 3000), and the web API-base
validator (userinfo/query/fragment rejection, path-prefix retention, and
trailing-slash normalisation).

The static web build is verified to fail closed: `pnpm build` resolves
`NEXT_PUBLIC_API_BASE_URL` from the environment or the root `.env` public entry
and fails if it is missing or not an absolute HTTP(S) URL.

Real-MySQL integration (`pnpm --filter @sapiensmetric/api test:integration`)
covers concurrent action-token consumption and reset-session invalidation, and
fixtures create verified users explicitly.

The opt-in `pnpm --filter @sapiensmetric/api smtp:smoke` command (which
requires `SMTP_SMOKE_CONFIRM=send` for that invocation) may send one benign
message only to the configured controlled recipient and is excluded from
`pnpm test`, `pnpm verify`, and integration tests.

No public/end-user data is collected. No raw token, SMTP credential, password,
or verification/reset URL appears in logs or test output. O-006 remains open
(see `docs/email-verification.md`).

## T-008 frontend testing boundary

The authentication frontend is a static-export Next.js app; it has no DOM test
runner and adds no dependency. Its focused unit test uses the built-in Node test
runner only:

- `pnpm --filter @sapiensmetric/web test` — `node --test lib/*.test.ts`,
  asserting that the safe `returnTo` helper accepts same-origin absolute paths
  and falls back for external, protocol-relative, backslash, control-character,
  and non-string inputs.

The full route matrix is verified by the static web build (`pnpm build`), and
`scripts/verify.sh` asserts the frontend outputs exist. Interactive behaviour was
covered by the manual browser plan recorded in the archived T-008 task definition
(`tasks/done/2026-09-21-classical-authentication-frontend.md`).

## T-008 conventional registration testing boundary (D-017)

Automated tests exercise the conventional registration flow with a fake /
in-memory mail transport only. **Real email sending is not part of automated
tests**; no SMTP connection is opened and no `.env` value is read.

- `registration.controller.spec.ts` (Docker-free) — a new registration creates
  an unverified account and issues exactly one verification email and one action
  token; the email locale follows the request (`lt`/`en`, default `en`); a
  duplicate returns the explicit `409 EMAIL_ALREADY_REGISTERED` with no second
  email or token; concurrent registration yields one user, one `202`, one `409`,
  and exactly one email; a transport failure returns the recoverable
  `502 VERIFICATION_EMAIL_DELIVERY_FAILED`, leaves the account unverified with
  no usable token, preserves the login gate, and recovers through the
  resend-verification flow.
- `auth.controller.spec.ts` — duplicate registration returns the explicit
  conflict; concurrent registration yields one `202` and one `409` with a single
  user record.
- `auth.integration.spec.ts` (real MySQL, transport overridden with a fake) —
  duplicate conflict and concurrent registration create exactly one user record
  and exactly one verification token.
- `apps/web/lib/register-feedback.test.ts` — the LT/EN register outcome flags and
  message keys for every outcome (the copy itself is asserted by the T-009
  catalogue test).

## T-007 Google sign-in testing boundary (D-018)

All Google tests use fakes only: a fake ID-token verifier and a fake token
client replace the network edges, and no real Google request, JWKS fetch, token
exchange, or credential is used.

- `oauth-transaction.service.spec.ts` — PKCE S256 challenge, state/nonce
  generation, HKDF/HMAC transaction-cookie round-trip, tampered/expired/rejected
  cases, cookie options, authorization-URL contents, availability, and the
  `returnTo` allowlist.
- `google-auth.controller.spec.ts` — status/start (enabled `302` + signed cookie;
  disabled `503`), every D-018 account-behaviour row (existing `sub`; new verified
  identity; auto-link to a verified credentials user; missing/unverified email;
  unverified local match; `sub` linked elsewhere), concurrent first sign-in
  (one user/identity), invalid transaction, state mismatch, failed ID-token
  validation, password-auth regression while Google is disabled, and the full
  `returnTo` propagation boundary: login-query `returnTo` → start request →
  transaction → callback redirect, default LT/EN targets, and external/malformed
  `returnTo` rejection to the safe default.
- `apps/web/lib/google-auth.test.ts` — the Google start URL (locale, login-query
  `returnTo` propagation, default LT/EN targets, external/malformed rejection,
  trailing-slash normalisation) and the LT/EN button/unavailable copy.
- `apps/web/lib/single-flight.test.ts` — the bootstrap single-flight guard
  (concurrent runs coalesce, a fresh run starts after completion, a retry runs
  after rejection). This prevents a double-invoked mount effect after the
  full-page Google callback redirect from firing two concurrent refreshes that
  race on the rotating cookie and bounce the authenticated user to login.

The real-MySQL integration suite (`auth.integration.spec.ts`) runs with the mail
transport faked; it does not exercise Google.

## T-009 UI internationalisation testing boundary (next-intl)

The refactor keeps the dependency-free Node test runner and adds focused tests
for the new i18n layer:

- `apps/web/lib/messages.test.ts` — both catalogues load, expose the same nested
  key set, and every critical UI key is present and non-empty; locale-specific
  copy differs where expected.
- `apps/web/lib/locale-navigation.test.ts` — locale validation (`lt`/`en` only),
  `otherLocale`, `localizePath` (safe same-origin paths only; rejects external,
  protocol-relative, backslash, control-character, and non-string/non-path
  values), locale-specific default account destinations, same-route language
  switching, and safe `returnTo` remapping/dropping.
- `apps/web/lib/register-feedback.test.ts` — outcome flags and message keys.
- `apps/web/lib/google-auth.test.ts` — Google start URL, default LT/EN account
  destinations, and login-query `returnTo` propagation/rejection (no network).

The full route matrix is verified by the static web build (`pnpm build`), which
must emit `/`, both locale homes, both locales of every auth page, and both
account pages. `<html lang>` and localized copy are checked by inspecting the
static output. No SMTP, live OAuth, deployment, migration, or external call is
performed.

## Workflow expectations

- Every task must state how its work is verified (tests, script, or manual
  checklist) in its acceptance criteria.
- Run the relevant tests/checks before handing a task back for review.
