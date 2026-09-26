# T-012 — User roles and admin dashboard (archived)

- **ID:** T-012
- **Archive date:** 2026-09-26
- **Final status:** Approved (human review granted)
- **Type:** Feature (API + DB migration + FSD web admin; no new dependency)
- **Created:** 2026-09-26
- **Approved:** 2026-09-26

---

> T-012 was accepted by human review on 2026-09-26. Marijus confirmed manual
> browser testing passed, including the automatic-filter/route-navigation UX
> follow-up. It is archived; the full scope (roles, admin dashboard, session
> invalidation, audit trail, bootstrap CLI, and UX corrections) is preserved
> below.

## Objective

Add one role per user (`user` | `editor` | `admin`), an account status
(`active` | `suspended`) separate from email verification, an administrator API
and bilingual dashboard, an audit trail, and a local bootstrap CLI, without
changing API authentication/authorisation checks or the existing static export,
local profile, locale persistence, and credentials/OAuth/verification/
password-reset behaviour.

## Permission matrix

| Capability | user | editor | admin |
| --- | --- | --- | --- |
| Own account access (login, `/account`, logout) | yes | yes | yes |
| Content management | – | deferred (ordinary account access only) | – |
| Admin summary / user list / user detail | no | no | yes |
| Change role / suspend / reactivate / revoke sessions | no | no | yes |

Enforced in the API (`AdminGuard`: authenticated + active + verified + role
`admin`). Frontend visibility is usability only, never authorisation.

## Roles and status

- `users.role` defaults to `user`; every public registration and Google sign-up
  defaults to `user`. Public requests can never set a role.
- `editor` has ordinary account access only; content permissions are deferred.
- `users.status` (`active`/`suspended`) is independent of `emailVerifiedAt`.
- Migration `1781440000003-CreateRolesAndAdminAudit`; migrations only
  (`synchronize: false`). Admin DTOs never expose password hashes, token hashes,
  secrets, or auth internals.

## Authorisation and session validity

The access guard re-reads the session row and the user on every request, so no
role is trusted from the JWT:

- demotion removes admin access on the next request (`403`);
- suspension invalidates access (`401`) and refresh, and blocks new
  credentials/OAuth sessions;
- revoke-all-sessions invalidates existing access as well as refresh tokens;
- reactivation does not revive revoked sessions;
- password-reset / email-verification never reactivate a suspended account.

Self-protection: an administrator cannot change their own role or suspend
themselves. Last-active-verified-administrator protection is enforced inside the
database transaction (active verified administrators are locked in a fixed order
before the target), including concurrent requests.

## Administrator bootstrap

`pnpm --filter @sapiensmetric/api admin:promote -- --email <email> [--apply]`
(or `--id <uuid>`), documented in `docs/local-development.md`. Dry-run by
default; requires exactly one explicit target; fails clearly when the account is
missing, ambiguous (neither/both targets), suspended, or unverified; repeated
execution is safe. Recorded with an explicit CLI actor type
(`cli:promote-admin`), never an invented human identity. No public bootstrap
endpoint, no default password, no first-registrant promotion.

## Admin API and UI

API: `GET /admin/summary`, `GET /admin/users` (search, role/status/verification
filters, bounded pagination, deterministic sorting), `GET /admin/users/:id`
(+ provider names), `PATCH /admin/users/:id/role`,
`PATCH /admin/users/:id/status`, `POST /admin/users/:id/revoke-sessions`,
`GET /admin/audit`.

UI: bilingual `/en/admin/` and `/lt/admin/` (static-export compatible; the user
detail is a client-side panel, no `[userId]` route, no pre-rendered records).
Loading, empty, error, forbidden, and expired-session handling; confirmation for
consequential actions; real counts and working actions.

## Audit trail

`admin_audit_log` records actor type/identity, target user id, action, before/
after values, and timestamp. Account mutations and audit entries are written in
one transaction; audit records contain no credentials or tokens and are
read-only in the UI.

## Frontend structure (FSD light)

Direction extended to `app -> widgets -> features -> entities -> shared`
(D-024). `entities/user` holds the safe user model and presentation; it does not
import `features/*`. Session ownership stays in `features/auth` and the admin
feature consumes it (same-layer import). Tailwind scans `./entities/**` and the
generated-CSS check includes an entities-only utility.

## UX follow-up (automatic filters + admin route navigation)

- Filters apply automatically: role/status/verification immediately, email
  search after a short debounce. The redundant Apply button was removed and
  Reset retained. Any filter change resets pagination to page 1; Reset clears
  all filters and the pending search debounce and loads the unfiltered first
  page.
- A monotonic request gate discards stale responses so a slow request cannot
  overwrite newer filter results.
- After session bootstrap the route resolves without flashing admin content or a
  "no permissions" screen: the shared loading state is shown while resolving or
  redirecting; authenticated non-admins are redirected to `/{locale}/account/`;
  unauthenticated visitors are redirected to `/{locale}/auth/login/` with the
  admin destination preserved as a safe `returnTo` (the login page still offers
  the registration link). A post-login admin continues to the admin route; a
  non-admin lands on Account without a redirect loop.
- During an open session: confirmed role loss / admin `403` -> Account; invalid
  session (`401`) -> existing login recovery; network/`5xx` -> actionable retry;
  action-level `400`/`409` errors are shown inline and never become permission
  redirects. API auth/authorisation is unchanged; client redirects are
  navigation behaviour, not enforcement.

## Non-goals

- Hard deletion, impersonation, manual email verification, admin-set passwords,
  additional email-sending actions.
- Content-management permissions for `editor`.
- Any change to the static export, the local profile, locale persistence, or the
  approved branding assets.

## Verification

- `pnpm verify` (lint, typecheck, tests, FSD boundary, build, static-export,
  harness).
- Docker-free admin API spec and bootstrap spec; real-MySQL integration spec.
- Verified the admin routes are emitted by the static export and that the
  entities utility is generated.

---

## Approved-outcome summary

T-012 delivered per-user roles (`user` | `editor` | `admin`) and an account
status (`active` | `suspended`) separate from email verification, with a
database-level last-administrator guarantee and per-request authorisation
re-evaluated from the database. It added the bilingual admin dashboard
(`/en/admin/`, `/lt/admin/`) with summary counts, filtered/paginated user list,
user detail (including provider names), role/status/session actions, and an
atomic audit trail; a documented `admin:promote` CLI; the FSD `entities/user`
layer; and the automatic-filter/route-navigation UX corrections.

Acceptance verification (2026-09-26): `pnpm verify` passed (lint, typecheck,
tests, FSD boundary check, build, `verify-static-export.sh`, `verify.sh`), the
real-MySQL integration suite passed, and human review confirmed the browser
journey including the UX follow-up.
