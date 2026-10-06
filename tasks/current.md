# No active task

No task is currently authorised. `TODO.md` is the planning index and never
authorises work; a task must be scoped in this file and approved by a human before
any work starts.

## Recently completed

- **T-018 — Favicon/manifest data** was approved and archived on **2026-10-06**.
  Record: `tasks/done/2026-10-06-favicon-manifest-data.md`. It replaced the interim
  WebP favicon with the owner-supplied PNG/ICO icon set + `site.webmanifest`
  (served from `/branding/...`), declared in both root layouts and the 404 page,
  while preserving the in-page WebP logos. Deployed to production on **2026-10-06**
  (artifact `97e89b25b1edd8a9`, operation `mux030hl-e8032efd1883`); see
  `docs/publication-status.md`.

## Proposed next task (not started or authorised)

- **Minimal local synthetic-assessment UI** (T-019) — a small browser surface over
  the T-017 attempt endpoints so the owner can test the full
  start → answer → save → resume → submit → result → history journey. Synthetic
  content only; local/testing use; not publication-ready.
- Later assessment slices (feedback/answer-key explanations, exposure tracking,
  retake policy) remain proposed and gated on the prerequisites below.

## Remaining prerequisites for a public assessment release

- Independent astronomy content review and independent EN/LT language review
  (**pending**).
- Data-protection/governance (O-006); IP review (O-007); validation/norming plan
  (O-003).
- **API deployment** for any live, registered assessment.
- The provenance **policy** was approved in T-015 (D-T015-6); this is policy
  approval, **not** review of individual items.

## Preserved follow-ups (owned outside a task)

Publication/analytics items remain tracked in `docs/publication-status.md` and
`docs/publication-checklist.md`.
