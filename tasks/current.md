# No active task

No task is currently authorised. `TODO.md` is the planning index and never
authorises work; a task must be scoped in this file and approved by a human before
any work starts.

## Recently completed

- **T-021 — CI and automatic frontend publication** was approved and archived on
  **2026-10-09**. Record:
  `tasks/done/2026-10-09-ci-automatic-frontend-publication.md`. It added GitHub
  Actions CI (`pnpm verify` on PRs) and an automatic, frontend-only publication
  pipeline (build once → encrypted off-runner baseline → exact-artifact WebDAV
  upload → production verify → durable record), and the first automatic deployment
  succeeded the same day (artifact `4ad00f748d5c2d7e`, operation
  `mv0jf68i-80ea22b4c68e`).
- **T-020 — Mobile-first navigation, markup review, and reproducible public
  sitemap** was approved and archived on 2026-10-09 (record:
  `tasks/done/2026-10-06-mobile-first-navigation-markup-sitemap.md`).
- **T-019 — Minimal local synthetic-assessment UI** was approved and archived on
  2026-10-06 (record: `tasks/done/2026-10-06-minimal-local-synthetic-assessment-ui.md`).

## Proposed next task (not started or authorised)

- **Versioned astronomy draft bank, review eligibility, and local
  post-submission feedback** — a repository-managed, server-only bilingual draft
  bank covering the owner's 25 astronomy topics, with typed review-evidence and
  publication-eligibility metadata and post-submission explanations/sources for
  the submitted attempt. Drafts remain unreviewed; local-only and not
  publication-ready. Scoped in `tasks/current.md` when authorised.
- Later assessment slices (item review pipeline, exposure tracking, retake
  policy) remain proposed and gated on the prerequisites below.

## Remaining prerequisites for a public assessment release

- Independent astronomy content review and independent EN/LT language review
  (**pending**).
- Data-protection/governance (O-006); IP review (O-007); validation/norming plan
  (O-003).
- **API deployment** to a Node.js-capable provider (not yet selected) for any
  live, registered assessment.
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
