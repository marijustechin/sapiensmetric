# TODO.md — Planning index

This file is a planning index only. It is **not** an executable task list and
**never** authorises work. Only `tasks/current.md` with explicit human approval
authorises work, and only one task is active at a time.

## Now

- **No task is active.** T-012 is approved and archived; T-001..T-012 are
  complete/archived in `tasks/done/`. Only `tasks/current.md` with explicit human
  approval authorises work.
- **T-012 (User roles and admin dashboard)** is approved (2026-09-26) and
  archived at `tasks/done/2026-09-26-user-roles-and-admin-dashboard.md` (D-024):
  per-user roles + account status, the admin API/dashboard, an audit trail, the
  `admin:promote` bootstrap CLI, and the automatic-filter/route-navigation UX
  follow-up.
- **T-011 (FSD light frontend structure)** is approved (2026-09-26) and archived
  at `tasks/done/2026-09-26-fsd-light-frontend-structure.md` (D-023). It
  re-layered `apps/web` into `app` / `widgets` / `features` / `shared` with an
  enforced import direction, behaviour-preserving, with no new dependency.
- **T-010 (static-export directory routes, local config/test isolation, and a
  public-UI claims guard)** is approved (2026-09-26) and archived at
  `tasks/done/2026-09-26-static-export-routes-config-isolation-claims-guard.md`.
  It corrected the flat deep-route `.html` export, the local port profile,
  `.env` handling in tests, and the missing public-claims guard, and it added
  the approved branding assets (D-021) and the remembered-language root redirect
  (D-022).
- **T-009 (next-intl bilingual frontend refactor, LT/EN UI)** is approved
  (2026-09-26) and archived at
  `tasks/done/2026-09-21-next-intl-bilingual-frontend-refactor.md`; delivered in
  commit `52fe481`.
- T-008 (classical authentication frontend) is approved and archived in
  `tasks/done/`.
- T-007 (Google OAuth 2.0 / OpenID Connect sign-in) is approved and archived in
  `tasks/done/`.
- T-006 (email verification and password-reset delivery through generic SMTP) is
  approved and archived in `tasks/done/`.
- T-005 (TypeORM persistence and credentials authentication core) is complete
  and archived.

## Next (not yet authorised)

- **Assessment foundations** — the first real assessment work (item model,
  provenance workflow, scoring package). Blocked on O-002, O-003, O-006, and
  O-007; requires product-owner approval of the T-002 instrument/provenance
  proposals.
- vHosts Node-to-MySQL feasibility (later, separate infrastructure task).

## Blocked

- Product-owner approval of the T-002 instrument/provenance proposals is
  required before any item authoring.
- O-002 (item/content sourcing policy) — gates the assessment foundations.
- O-003 (norming & validation roadmap) — gates the assessment foundations.
- O-006 privacy review is required before any data collection, including any
  real use of the T-006 email flows.
- O-007 IP review is required before relying on third-party material.

## Later

- Assessment domain.
- Item-authoring workflow.
- First authorised item set.
- Public product UI.
- Deployment.
