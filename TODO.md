# TODO.md — Planning index

This file is a planning index only. It is **not** an executable task list and
**never** authorises work. Only `tasks/current.md` with explicit human approval
authorises work, and only one task is active at a time.

## Now

- **No active task.** **T-019 (Minimal local synthetic-assessment UI)** was
  approved and archived on 2026-10-06 (record:
  `tasks/done/2026-10-06-minimal-local-synthetic-assessment-ui.md`): a browser
  surface over the T-017 synthetic assessment API (start → answer → save → resume
  → submit → raw result → history), FSD-light and static-export compatible,
  `noindex` and excluded from the public release; local/development only, not
  deployed. The owner confirmed it in the browser — see `docs/assessment-ui.md`.
- **T-018 (Favicon/manifest data)** was approved and archived
  on 2026-10-06 (record: `tasks/done/2026-10-06-favicon-manifest-data.md`): the
  owner-supplied PNG/ICO page/device icons + `site.webmanifest` (served from
  `/branding/...`) replace the interim WebP favicon; in-page WebP logos unchanged.
- **T-017 (Persisted assessment attempts with synthetic content)** was approved
  and archived on 2026-09-28 (record:
  `tasks/done/2026-09-28-persisted-assessment-attempts-with-synthetic-content.md`):
  the authenticated API/DB slice to start, save, resume, and submit an attempt
  (synthetic content, local/test only and off by default; no web UI; not
  publication-ready) — see `docs/assessments.md`.
- **T-016 (Versioned assessment scoring core)** was approved and archived on
  2026-09-28 (record:
  `tasks/done/2026-09-28-versioned-assessment-scoring-core.md`): the pure,
  deterministic scoring core in `@sapiensmetric/assessment` (single-answer,
  multiple-select, ordering, numeric; versioned form snapshots; validation;
  submitted-only scoring) — see `docs/assessment-scoring.md`.
- **T-015 (Assessment foundations and first knowledge-pilot specification)** was
  approved and archived on 2026-09-28 (record:
  `tasks/done/2026-09-28-assessment-foundations-and-knowledge-pilot.md`). It
  recorded the owner-approved content-selection principle and approved the
  **astronomy** first pilot (adults-only; a proposed 25-item form whose final
  composition remains subject to content review), the learning/feedback/exposure/
  retake policy, the future assessment contract, the evidence required for future
  ability scores, and 8 bilingual review-draft items — see
  `docs/assessment-foundations.md` (entry point), `docs/knowledge-pilot-spec.md`,
  `docs/pilot-item-samples.md`, and `docs/assessment-sources.md`. Draft items are
  **unreviewed**; independent subject/language review is **pending**. O-002/O-003/
  O-006/O-007 remain open; no runtime, database, API, or UI is implemented.
- **T-014** was approved and archived on 2026-09-28 (record:
  `tasks/done/2026-09-26-frontend-only-publication-preparation.md`): the
  reproducible frontend-only public release (`pnpm build:public` →
  `dist/public-site/`), the consent-gated GTM→GA4 integration (D-027), and the
  WebDAV deployment tooling are complete, committed, and pushed, and the release
  is deployed to `https://sapiensmetric.eu` (artifact `64c4941cba87d08c`).
- **Current publication state: `docs/publication-status.md`.** Remaining
  operational follow-ups are tracked there and in
  `docs/publication-checklist.md`: GA4 settings review (remaining Enhanced
  Measurement options, Signals/advertising), Search Console sitemap ingestion
  (not confirmed), the unresolved Realtime `/en/assessment-guide` vs
  `/en/assessment-guide/` duplicate, and GA4 report-level verification.
- **T-013 (Public website, educational content, and SEO foundation)** is
  approved (2026-09-26) and archived at
  `tasks/done/2026-09-26-public-website-educational-content-seo.md`
  (D-025/D-026): a bilingual public website with original educational content,
  SEO metadata, sitemap/robots, noindex on non-public routes, no analytics, and
  the confirmed public contact `info@sapiensmetric.eu`.
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

- **Minimal local synthetic-assessment UI** — a small browser surface over the
  existing attempt endpoints for local/testing use only, clearly labelled
  synthetic, with no effect on the deployed public site. **Not authorised or
  started.**
- **Proposed next slice (not started or authorised): item review pipeline, form
  assembly, and pilot delivery/data design.** The two-role item review pipeline,
  session-form assembly, and the attempt-lifecycle/data-minimisation design — see
  `docs/assessment-foundations.md` §7 and `docs/assessment-scoring.md` §8. Gated on
  the remaining prerequisites (`docs/assessment-foundations.md` §9.2) and on O-002
  (sourcing) and O-007 (IP review); O-003 (norming) and O-006 (data protection)
  stay open. Independent content/language review before any item publication is
  **pending**. (The scoring core itself was implemented under T-016.)
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
