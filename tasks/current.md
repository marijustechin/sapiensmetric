# No active task

No task is currently authorised. `TODO.md` is the planning index and never
authorises work; a task must be scoped in this file and approved by a human before
any work starts.

## Recently completed

- **T-019 — Minimal local synthetic-assessment UI** was approved and archived on
  **2026-10-06**. Record:
  `tasks/done/2026-10-06-minimal-local-synthetic-assessment-ui.md`. It adds a
  browser surface over the T-017 synthetic assessment API (start → answer → save →
  resume → submit → raw result → history), FSD-light and static-export compatible,
  `noindex` and excluded from the public release. The owner tested it in the
  browser and confirmed the expected behaviour. **Local/development only; not
  deployed.**
- **T-018 — Favicon/manifest data** was approved and archived on **2026-10-06**
  (record: `tasks/done/2026-10-06-favicon-manifest-data.md`) and deployed to
  production (artifact `97e89b25b1edd8a9`, operation `mux030hl-e8032efd1883`);
  see `docs/publication-status.md`.

## Proposed next task (not started or authorised)

- Real (astronomy) assessment content and any public assessment release remain
  gated on independent content/language review and O-003/O-006/O-007, and on
  **API deployment** (planned origin `https://api.sapiensmetric.eu`, not yet
  authorised). Later UI slices (feedback/answer-key explanations, exposure
  tracking, retake policy) remain proposed.

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
- Publication/analytics items, the **sitemap apex-root source/deployment
  discrepancy**, the **webmanifest `Content-Type`**, and the **custom 404**
  handling remain tracked in `docs/publication-status.md` and
  `docs/publication-checklist.md`.
