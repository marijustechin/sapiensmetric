# Email verification and password reset (T-006) — privacy gate

Engineering privacy/data-minimisation gate for the T-006 email flows. This is
**not** a legal conclusion and it does **not** resolve O-006. No GDPR or legal
compliance is claimed.

## Scope

T-006 is local-development backend/API plus a minimal LT/EN browser flow. No
public/end-user data is collected. Tests use synthetic `@example.test`
addresses.

## Data minimisation

- Raw action tokens are never persisted, logged, or returned. Only a SHA-256
  hash is stored.
- Token values are `>=32` random bytes, base64url encoded, purpose-scoped
  (`verify` | `reset`), single-use, and expiring.
- Verification tokens expire after 24 hours; password-reset tokens after 30
  minutes. Both are configuration-driven and validated.
- A token row stores only: id, user id, purpose, token hash, created/expires/
  consumed timestamps.
- No email bodies, subjects, credentials, or reset/verification URLs are
  stored.

## Retention

- Consumed and expired tokens are removed by the explicit, named command
  `pnpm --filter @sapiensmetric/api tokens:cleanup`.
- There is no cron, queue, or background worker. The command must be invoked
  deliberately.
- Target retention for action tokens is minimising: a token is removed as soon
  as it is consumed or expired.

## SMTP and the operator smoke recipient

- Real SMTP values exist only in the ignored root `.env`; they are never
  printed, copied, committed, or logged.
- `.env.example` contains placeholders only.
- `SMTP_TEST_RECIPIENT` is operator-controlled, used solely by the explicitly
  opt-in `smtp:smoke` command (which also requires `SMTP_SMOKE_CONFIRM=send`
  for that invocation), and is never persisted by the application.
- Ordinary tests use a fake in-memory transport and open no SMTP connection.

## Deployment/privacy gate (before any real use)

- O-006 (data protection and governance) remains unresolved and must be
  reviewed by a human/legal process before any real user data is collected.
- Consent, retention, and access-control decisions remain outstanding.
- T-006 does not authorise real product use or a compliance claim.

## Access gate

Email verification is an access gate, not an informational flag: an unverified
user receives the same generic 401 as invalid credentials, existing sessions do
not bypass the gate, and no response reveals "email not verified".
