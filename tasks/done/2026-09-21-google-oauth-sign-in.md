# T-007 — Google OAuth 2.0 / OpenID Connect sign-in (archived)

- **ID:** T-007
- **Archive date:** 2026-09-21
- **Final status:** Approved (human review granted)
- **Type:** Implementation (API + web + one database migration)
- **Created:** 2026-09-21
- **Approved:** 2026-09-21

---

> T-007 was accepted by human review on 2026-09-21 after a successful **live**
> Google OAuth manual test. It is archived; the original task definition is
> preserved below, followed by the approved-outcome summary.

## Objective

Add Google OpenID Connect sign-in to the existing credentials authentication
core using the OAuth 2.0 authorization-code flow with PKCE. A Google identity is
identified solely by the immutable OIDC `sub`; email is used only for the
documented automatic-linking rules. This adds a new auth capability and is
authorised by the human task request plus the decision recorded in
`docs/decisions.md` (D-018).

## Route / API matrix

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/auth/google/status` | GET | `200 { available: boolean }` — whether Google is configured |
| `/auth/google/start` | GET | `302` to Google; sets the signed transaction cookie; `503` when unavailable |
| `/auth/google/callback` | GET | Validates state/PKCE/nonce/ID token, resolves the account, sets the refresh cookie, `302` back to a safe same-origin web path |

Web UI: a Google sign-in button on `/{lt,en}/auth/login` and
`/{lt,en}/auth/register` that navigates to `/auth/google/start`; it is
unavailable (disabled with a clear note) when Google is not configured.

## Database change

One migration only: `user_identities` (`id`, `userId` FK → `users`, `provider`,
`subject`, `createdAt`) with a **unique `(provider, subject)`** constraint (race
protection) and a `userId` index. No other schema change; `synchronize` stays
disabled.

## Required account behaviour

| Situation | Required result |
| --- | --- |
| Existing Google `sub` | Sign in to its already linked user |
| New Google identity; verified Google email; no local email match | Create one verified local user and link Google |
| New Google identity; verified Google email matches a verified credentials user | Automatically link and sign in to that same user |
| Google email missing or not verified | Reject safely; create/link nothing |
| Google email matches an unverified local user | Reject safely; do not link |
| Google `sub` already belongs to another user | Reject; never reassign it |
| Concurrent first Google sign-in | Exactly one user/identity |

The unverified email/password login gate is unchanged; one account may use both
password and Google sign-in.

## Security requirements

- OAuth 2.0 authorization-code flow with **PKCE (S256)**.
- Validate `state`, PKCE verifier, `nonce`, `iss`, `aud`/client ID, signature via
  Google JWKS, `exp`, and the relevant claims. Do not trust decoded-but-unverified
  JWT payloads.
- Transaction cookie `sm_oauth_tx`: short-lived, `HttpOnly`, `SameSite=Lax`,
  `Secure` in production, path `/auth/google`, integrity-protected with
  **HMAC-SHA256 over an HKDF-derived key**; reject tampering/expiry; clear after
  callback.
- Never log codes, ID/access/refresh tokens, state, nonce, verifier, cookie
  contents, client secret, or `.env` values.
- Only safe same-origin `returnTo` paths (relative to `PUBLIC_APP_URL`); no
  arbitrary redirect targets.

## Non-goals

- No Google account-link/unlink management UI (automatic linking per the table).
- No other social provider, no deployment, no production credentials.
- No SMTP or assessment work.

## Acceptance criteria

- The route/API matrix exists; Google is optional and password auth works with
  Google unconfigured.
- Every account-behaviour row is implemented and covered by fake/mocked tests.
- PKCE/state/nonce, transaction-cookie (valid/tampered/expired/cleared),
  `returnTo` allowlist, ID-token boundary, concurrency, and password-auth
  regression are tested; frontend Google-button/unavailable behaviour is tested
  where the current tooling supports it.
- The real Google ID-token cryptographic path is covered locally with a generated
  RSA key pair and a local JWKS fixture (no network, no Google endpoint, no real
  credentials) using the real `GoogleIdTokenService`: valid token accepted;
  unknown/wrong signing key, wrong issuer, wrong audience, expired token, nonce
  mismatch, and unsuitable/missing signing algorithm rejected; and
  decoded-but-unverified claims never reach account resolution.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, integration tests, `pnpm build`,
  and `bash scripts/verify.sh` pass; no real Google/SMTP/production call is made.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md` (this file)
3. `docs/authentication.md`
4. `docs/architecture.md`
5. `docs/testing.md`
6. `docs/decisions.md` (D-013, D-017, D-018)
7. `packages/contracts/src/auth.ts`

---

## Approved-outcome summary

T-007 delivered optional Google OpenID Connect sign-in over the existing auth
API: authorization-code flow with PKCE (S256), identity keyed solely by the
immutable OIDC `sub` in the new `user_identities` table (unique
`(provider, subject)`), full ID-token validation (RS256/JWKS by `kid`, `iss`,
`aud`, `exp`, `nonce`), a short-lived HttpOnly SameSite=Lax transaction cookie
protected by HMAC-SHA256 over an HKDF-derived key, same-origin `returnTo`
validation, and reuse of the existing refresh-session lifecycle. Google is
optional; password authentication is unaffected when it is unconfigured.

Live manual acceptance (2026-09-21):

- The live Google OAuth flow completed successfully.
- A Google-created account set a password via password reset and then signed in
  through both Google and password.
- An existing verified email/password account signed in through Google and
  resolved to the same account.

Post-review fix: the Google callback performs a full-page redirect to
`/{locale}/account`, and the dev StrictMode double-invoked mount effect fired two
concurrent `/auth/refresh` calls that raced on the rotating refresh cookie (one
`401`), which could bounce the authenticated user to the login form. The auth
bootstrap is now single-flight (`apps/web/lib/single-flight.ts`), and the full
`returnTo` propagation boundary is covered by regression tests.

Verification: `pnpm lint`, `pnpm typecheck`, `pnpm test` (contracts + API + web),
real-MySQL integration, `pnpm build`, and `bash scripts/verify.sh` all passed;
migration `1781440000002-CreateUserIdentities` applied with none pending. No real
Google/SMTP/production call is made in automated tests.
