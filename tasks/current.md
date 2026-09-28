# No active task

No task is currently authorised. `TODO.md` is the planning index and never
authorises work; a task must be scoped in this file and approved by a human before
any work starts.

## Recently completed

- **T-017 — Persisted assessment attempts with synthetic content** was approved
  and archived on **2026-09-28**. Record:
  `tasks/done/2026-09-28-persisted-assessment-attempts-with-synthetic-content.md`.
  It added the authenticated API/DB slice to start, save, resume, and submit an
  attempt (scored by the T-016 core; synthetic/local-test only; no UI) —
  `docs/assessments.md`.

## Proposed next task (not started or authorised)

- **Minimal local synthetic-assessment UI** — a small browser surface over the
  existing attempt endpoints for local/testing use only, clearly labelled
  synthetic, with no effect on the deployed public site. **Not authorised or
  started.** Later assessment slices (feedback/answer-key explanations,
  exposure tracking, retake policy) remain proposed and gated on the
  prerequisites below.

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
`docs/publication-checklist.md`: GA4 settings review, Search Console sitemap
ingestion (not confirmed), the Realtime `/en/assessment-guide` vs
`/en/assessment-guide/` duplicate (cause not established), and GA4 report-level
verification. The deployed frontend artifact remains `64c4941cba87d08c`
(operation `mulkgfk6-0768754a1976`).
