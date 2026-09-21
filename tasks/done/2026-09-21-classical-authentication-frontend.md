# T-008 — Classical authentication frontend (LT/EN browser journey) (archived)

- **ID:** T-008
- **Archive date:** 2026-09-21
- **Final status:** Approved (human review granted)
- **Type:** Implementation (web frontend + conventional registration API flow; no database-schema change)
- **Created:** 2026-09-21
- **Approved:** 2026-09-21

---

> T-008 was accepted by human review on 2026-09-21 after a successful manual LT
> journey (registration → verification email → verification → login → logout →
> password reset → login). It is archived; the original task definition and the
> registration amendment (D-017) are preserved below.

## Objective

Provide a minimal but complete Lithuanian/English browser frontend for the
already-implemented credentials authentication API (T-005) and email flows
(T-006), so the whole local user journey can be exercised in a browser:
registration, login, email verification, forgot-password, reset-password,
session bootstrap (refresh + `/auth/me`), logout, and one protected account page.

**Amendment (D-017):** registration is conventional and clear — a new address
creates an unverified account and immediately sends one verification email; an
already-registered address returns an explicit `EMAIL_ALREADY_REGISTERED`
conflict. This supersedes the earlier generic-`202` registration behaviour and
is recorded in `docs/decisions.md` as D-017.

This task adds **no new auth capability** and no server-side behaviour: it is a
static-export frontend over the existing endpoints. It therefore does not add a
new entry to `docs/decisions.md`; the authorisation is the explicit human task
request, and the existing D-013/D-014/D-015/D-016 decisions still govern the API.

## Binding context and constraints

- T-005 (credentials auth core) and T-006 (email verification + password reset)
  are approved and archived in `tasks/done/`.
- Next.js App Router **static export** must be preserved (`output: 'export'`).
- The only configured API base is `NEXT_PUBLIC_API_BASE_URL`; no localhost URL
  may be hardcoded.
- The access token is held **in memory only**. It must never be written to
  `localStorage`, `sessionStorage`, the URL, logs, or rendered HTML.
- Refresh uses the existing **HttpOnly** refresh cookie
  (`credentials: 'include'`).
- Verification/reset action tokens are **fragment-only** (`#token=...`), read on
  explicit user action only; GET/prefetch must never consume a token.
- `returnTo` must be same-origin and safe; an arbitrary external URL must never
  be used as a redirect target.
- Only the account page is protected at this stage.
- Reuse and improve the existing LT/EN verify-email, forgot-password, and
  reset-password pages; do not duplicate those flows.
- No new dependency, no API change, no database change. Stop and ask before
  adding a dependency or changing the API.

## Exact route matrix

| Route (lt and en) | Purpose | Protection |
| --- | --- | --- |
| `/` | language chooser | public |
| `/lt`, `/en` | locale home with auth navigation | public |
| `/lt/auth/register`, `/en/auth/register` | registration form | public |
| `/lt/auth/login`, `/en/auth/login` | login form (`?returnTo=`) | public |
| `/lt/auth/verify-email`, `/en/auth/verify-email` | resend request + `#token=` confirm (existing) | public |
| `/lt/auth/forgot-password`, `/en/auth/forgot-password` | reset request (existing) | public |
| `/lt/auth/reset-password`, `/en/auth/reset-password` | `#token=` + new password (existing) | public |
| `/lt/account`, `/en/account` | authenticated account state + logout | **protected (client gate)** |

## Bootstrap rules

- `POST /auth/refresh` returning `401` means **unauthenticated**.
- A network failure or `5xx` means a **recoverable error** with an explicit
  retry; it must not automatically redirect to login.
- On success, the access token is kept in memory and `GET /auth/me` supplies the
  account identity.

## Registration flow decision (D-017)

- A new email address creates an unverified account and immediately issues and
  sends exactly one verification email, reusing the existing action-token
  issuance, cooldown, hashing, TTL, mailer, and transport-rejection handling
  (shared helper, not duplicated; no controller-to-controller calls).
- An already-registered email address returns an explicit
  `409 { statusCode: 409, code: 'EMAIL_ALREADY_REGISTERED', message }`. This
  intentionally trades registration enumeration resistance for conventional UX.
- Duplicate registration sends no email.
- Concurrent registration of the same address creates one user record, returns
  one `202` and one `409`, and issues exactly one verification email.
- If delivery fails after account creation, the API returns a recoverable
  `502 { statusCode: 502, code: 'VERIFICATION_EMAIL_DELIVERY_FAILED', message }`;
  the account stays unverified, the unusable token is removed, and the user uses
  the resend-verification flow. Registration never reports false success and
  never retries delivery automatically.
- The unverified login/refresh/session gate is unchanged.
- Registration never persists the access token client-side and does not auto-log
  the user in.

## Required outputs

- `apps/web/lib/auth-types.ts`, `apps/web/lib/auth-api.ts` — typed browser API
  client mirroring `packages/contracts/src/auth.ts`.
- `apps/web/lib/auth-navigation.ts` + `auth-navigation.test.ts` — safe
  `returnTo` handling, unit-tested with the built-in Node test runner.
- `apps/web/app/_components/auth-provider.tsx`, `auth-nav.tsx`,
  `auth-forms.tsx` (extended), `account-view.tsx`.
- LT/EN pages for register, login, and account; locale layouts and home pages.
- Root layout wrapping the app in the auth provider.
- Root `/` language chooser.
- Conventional registration (D-017): shared contracts for the register request
  (`locale`) and the `409 EMAIL_ALREADY_REGISTERED` / `502
  VERIFICATION_EMAIL_DELIVERY_FAILED` outcomes; a shared API issuance/delivery
  helper reused by registration and resend; focused API/controller tests
  (`registration.controller.spec.ts`), updated registration tests, integration
  coverage, and a pure LT/EN register-feedback mapping with its unit test.
- Test/verification script wiring and documentation/harness updates.
- No commit, push, deploy, or archival.

## Non-goals

- Google OAuth or any social login (that is T-007, not activated here).
- Assessment items, scoring, reports, or any IQ/clinical/hiring claim.
- Deployment, hosting, DNS, production data, or production testing.
- Backend redesign, database-schema changes, or new dependencies.
- A marketing-site redesign; UX stays functional and clean.

## Acceptance criteria

- All routes in the route matrix exist and build as static export.
- Registration, login, verification request/confirm, forgot-password,
  reset-password, bootstrap, logout, and the protected account page are wired to
  the existing endpoints.
- Access/refresh tokens are never persisted in browser storage, URLs, logs, or
  rendered HTML.
- Refresh `401` → unauthenticated; network/`5xx` → recoverable error with retry.
- `returnTo` is same-origin-validated and never external.
- Existing verify/forgot/reset pages are reused (not duplicated) and remain
  fragment-only.
- Conventional registration: a new address issues exactly one verification
  email; a duplicate returns `409 EMAIL_ALREADY_REGISTERED` and sends nothing;
  concurrent registration creates one user and one email; a transport failure
  returns recoverable `502 VERIFICATION_EMAIL_DELIVERY_FAILED` with an
  unverified account and a working resend path; the login gate is unchanged.
- Registration tests use a fake/mock transport only; no SMTP email is sent and
  no `.env` value is read; real email sending is not part of automated tests.
- The LT/EN registration form shows truthful success, already-registered (with
  Login, Resend verification, and Forgot password links), and recoverable
  delivery-failure (with a Resend verification link) states, preserves
  validation/loading/no-duplicate-submission, and never auto-retries.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (including the new web unit tests),
  `pnpm build`, and `bash scripts/verify.sh` pass; no SMTP smoke is run.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md` (this file)
3. `docs/authentication.md`
4. `docs/architecture.md`
5. `docs/testing.md`
6. `tasks/done/2026-09-09-typeorm-persistence-and-credentials-authentication-core.md`
7. `tasks/done/2026-09-21-email-verification-and-password-reset-delivery.md`
8. `packages/contracts/src/auth.ts`

---

## Approved-outcome summary

T-008 delivered the classical LT/EN authentication frontend as a static-export
Next.js app over the existing auth API: registration, login, email verification,
forgot/reset password, session bootstrap (refresh + `/auth/me`), logout, and a
protected account page, with same-origin `returnTo` validation and an
in-memory-only access token. The D-017 amendment made registration conventional:
a new address creates an unverified account and immediately sends one
verification email; an existing address returns an explicit
`409 EMAIL_ALREADY_REGISTERED`; delivery failure returns a recoverable
`502 VERIFICATION_EMAIL_DELIVERY_FAILED` and leaves the account unverified for
the resend flow. No database-schema change and no new dependency were added.

Acceptance verification (2026-09-21): `pnpm lint`, `pnpm typecheck`,
`pnpm test` (contracts + API + web), `pnpm build` (17 static routes),
`bash scripts/verify.sh`, and the real-MySQL integration suite all passed; a
controlled live SMTP smoke had already been accepted. Real email sending is not
part of automated tests (fake transport only). Marijus confirmed the manual LT
journey end-to-end.
