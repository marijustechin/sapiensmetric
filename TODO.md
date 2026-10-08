# TODO.md — Planning index

This file is a planning index only. It is **not** an executable task list and
**never** authorises work. Only `tasks/current.md` with explicit human approval
authorises work, and only one task is active at a time.

## Now

- **T-021 (CI and automatic frontend publication)** is the **active task** —
  READY_FOR_HUMAN_REVIEW. GitHub Actions `ci.yml` runs `pnpm verify` on pull
  requests; `deploy.yml` builds the release once on `main`, persists an encrypted
  pre-deployment baseline off-runner, publishes the exact verified artifact over
  WebDAV, verifies production and records the deployment. Automatic publication
  awaits owner-configured `production` environment secrets; see
  `docs/deployment-webdav.md`. Committed and pushed; not archived.
- **T-020 (Mobile-first navigation, markup review, and
  reproducible public sitemap)** was approved and archived on 2026-10-09 (record:
  `tasks/done/2026-10-06-mobile-first-navigation-markup-sitemap.md`): the
  accessible hamburger/drawer navigation, mobile/markup review, the
  content-generated 20-URL public sitemap, two HTML-conformance fixes, and the
  bounded repository-audit corrections (`docs/audit-2026-10-09.md`). Frontend-only
  deployed (current artifact `7facf7e558173e17`, operation
  `mux42oos-932ee20e6c2c`); see `docs/publication-status.md`.
- **T-019 (Minimal local synthetic-assessment UI)** was
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
  O-006/O-007 remain open. T-015 itself was documentation-only; the scoring core
  (T-016), synthetic attempt API (T-017), local UI (T-019) and public navigation
  (T-020) were implemented by later tasks.
- **T-014** was approved and archived on 2026-09-28 (record:
  `tasks/done/2026-09-26-frontend-only-publication-preparation.md`): the
  repeatable frontend-only public release (`pnpm build:public` →
  `dist/public-site/`), the consent-gated GTM→GA4 integration (D-027), and the
  WebDAV deployment tooling are complete, committed, and pushed, and the release
  is deployed to `https://sapiensmetric.eu`. The deployed artifact has since been
  superseded; the **current** artifact is `7facf7e558173e17` (operation
  `mux42oos-932ee20e6c2c`; T-020).
- **Current publication state: `docs/publication-status.md`.** Remaining
  operational follow-ups are tracked there and in
  `docs/publication-checklist.md`: GA4 settings review (remaining Enhanced
  Measurement options, Signals/advertising), Search Console sitemap ingestion
  (not confirmed), the unresolved Realtime `/en/assessment-guide` vs
  `/en/assessment-guide/` duplicate, GA4 report-level verification, the manifest
  `Content-Type` mapping, the custom-404 ErrorDocument, the confirmed hosting
  migration plan (vHost temporary → Bacloud ~3 months, tentative; separate
  Node.js backend provider not yet selected), and the pending API deployment.
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
