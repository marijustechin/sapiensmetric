# No active task

No task is currently authorised. `TODO.md` is the planning index and never
authorises work; a task must be scoped in this file and approved by a human before
any work starts.

## Recently completed

- **T-020 — Mobile-first navigation, markup review, and reproducible public
  sitemap** was approved and archived on **2026-10-09**. Record:
  `tasks/done/2026-10-06-mobile-first-navigation-markup-sitemap.md`. It delivered
  the accessible hamburger/drawer navigation, the mobile/markup review, the
  content-generated 20-URL public sitemap, two HTML-conformance fixes, and the
  bounded repository-audit corrections (`docs/audit-2026-10-09.md`). Frontend-only
  **deployed** (current artifact `7facf7e558173e17`, operation
  `mux42oos-932ee20e6c2c`); production is ahead of source — do not relabel the
  deployed artifact as built from the finalisation commit.
- **T-019 — Minimal local synthetic-assessment UI** was approved and archived on
  2026-10-06 (record: `tasks/done/2026-10-06-minimal-local-synthetic-assessment-ui.md`).
- **T-018 — Favicon/manifest data** was approved and archived on 2026-10-06
  (record: `tasks/done/2026-10-06-favicon-manifest-data.md`).

## Proposed next task (not started or authorised)

- **CI and automatic frontend publication** — a GitHub Actions pipeline that runs
  `pnpm verify` on pull requests, builds the public release once on `main`, and
  publishes it through the existing WebDAV mechanism with durable, recoverable
  backups and post-deploy verification. See `docs/audit-2026-10-09.md` (CI was the
  top recommendation). Frontend-only; no API deployment.
- Later assessment slices (item review pipeline, feedback delivery,
  exposure/retakes) remain proposed and gated on the prerequisites below.

## Remaining prerequisites for a public assessment release

- Independent astronomy content review and independent EN/LT language review
  (**pending**).
- Data-protection/governance (O-006); IP review (O-007); validation/norming plan
  (O-003).
- **API deployment** to a Node.js-capable provider (not yet selected; see the
  hosting plan) for any live, registered assessment.
- The provenance **policy** was approved in T-015 (D-T015-6); this is policy
  approval, **not** review of individual items.

## Preserved follow-ups (owned outside a task)

- Hosting plan (owner-confirmed 2026-10-06): frontend **vHost** is temporary;
  planned **Bacloud** migration in ~3 months (**tentative**), no Node.js runtime;
  backend on a separate Node.js provider (not yet selected). See
  `docs/publication-status.md` and `docs/decisions.md` (D-026).
- Publication/analytics items, the **webmanifest `Content-Type`**, the **custom
  404** handling, and Search Console ingestion (unconfirmed) remain tracked in
  `docs/publication-status.md` and `docs/publication-checklist.md`.
