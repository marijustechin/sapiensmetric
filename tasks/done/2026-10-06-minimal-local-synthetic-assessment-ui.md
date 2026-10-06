# T-019 — Minimal local synthetic-assessment UI (archived)

- **ID:** T-019
- **Type:** Frontend feature (no new dependency); browser surface over the T-017
  assessment API. Local/development only.
- **Created:** 2026-10-06
- **Archive date:** 2026-10-06
- **Final status:** Approved (human review granted)
- **Approved:** 2026-10-06
- **Baseline:** T-018 archived at commit `f1d0e69` and deployed (`4dceadd`); no
  active task before this one.

---

> T-019 makes the existing T-017 synthetic-assessment API usable through the
> browser so the full **start → answer → save → resume → submit → result →
> history** journey can be exercised. The server remains authoritative for
> ownership, revisions, submission, and scoring. Synthetic content only,
> **default-off** and refused in production; **not** publication-ready; **not**
> deployed (API deployment was not authorised by this task).

## Accepted outcome

The owner tested the synthetic assessment in the browser and **confirmed the
expected behaviour**. This is a general browser confirmation only: **no** specific
device, browser, viewport, or accessibility checks are asserted.

## Delivered scope

- **Entry:** the authenticated app nav gains an **Assessment** link and the
  account page an "Open the synthetic assessment" link, both to
  `/{locale}/assessment/`.
- **Journey:** history list (status/revision/timestamps, resume/view result);
  explicit **Start** (never on mount); single-answer, multiple-select, ordering
  (keyboard Move up / Move down), and numeric items; progress; change/clear;
  explicit **Save** with unsaved/saving/saved/error states; **Submit** that saves
  pending answers successfully first and explains finalisation/skips; raw server
  result (correct/incorrect/skipped/total, raw score, objective totals); finalised
  attempts read-only.
- **Recovery:** auth bootstrap / login `returnTo` / unverified-suspended-session
  expiry (401 keeps local edits) / missing-not-owned attempt (404) /
  disabled-synthetic (`ASSESSMENT_NOT_AVAILABLE`) / network / server errors;
  a stale revision never overwrites newer server answers (reload-server or
  keep-local merge that re-applies only the user's edited items, after a warning);
  duplicate in-flight save/submit guarded; ambiguous submit reconciled via
  **Check submission status**.
- **Boundaries:** no keyed form, answer key, or scoring code in the frontend; no
  `@sapiensmetric/assessment` import; no assessment data to GA4/GTM; route is
  `noindex` and excluded from the public artifact and sitemap.
- **Architecture:** FSD light — `features/assessment/` (types, API client, pure
  answers, framework-free store, item/runner/result/history components),
  `widgets/assessment-screen/` (auth wiring + client-side selection), thin route
  `app/[locale]/(app)/assessment/page.tsx`. Static-export shell with client-side
  `?attempt=` selection (no dynamic attempt-ID path). No API change was required.

## Files

- `apps/web/features/assessment/` — `assessment-types.ts`, `assessment-api.ts`,
  `assessment-answers.ts`, `assessment-store.ts`, `assessment-item.tsx`,
  `assessment-runner.tsx`, `assessment-result.tsx`, `assessment-history.tsx`,
  and the tests `assessment-answers.test.ts`, `assessment-store.test.ts`.
- `apps/web/widgets/assessment-screen/` — `assessment-screen.tsx`,
  `use-assessment-store.ts`, `use-attempt-param.ts`.
- `apps/web/app/[locale]/(app)/assessment/page.tsx`.
- `apps/web/widgets/auth-nav/auth-nav.tsx`,
  `apps/web/features/auth/account-view.tsx`, `apps/web/messages/{en,lt}.json`.
- `docs/assessment-ui.md`, `docs/architecture.md`, `docs/testing.md`.

## Verification evidence (actually collected)

- `pnpm verify` → **EXIT 0** (lint, typecheck, tests, FSD, `next build`,
  `verify-static-export.sh` 111/0, `verify.sh` 768/0).
- Focused behavioural tests: `assessment-answers.test.ts` (7) and
  `assessment-store.test.ts` (**13/13**): save/clear/resume, pending-only saves,
  save-before-submit and its block on failure, duplicate save/submit, clean-submit
  skips save, revision conflict + keep-local merge, finalised read-only,
  unauthorized/not-found recovery, disabled-synthetic on start, ambiguous-submit
  reconcile.
- `pnpm build:public` + `pnpm verify:public-release` → **92/0**, with the
  assessment route excluded from the public artifact and `noindex` verified in the
  export.
- **Runtime end-to-end** (real local API, the frontend store, no browser):
  **15/15** — start → save → resume → clear/save/persist → re-answer → submit →
  raw result (total 4, correct 4, score 4; objective totals) → finalised read-only
  → history → unknown attempt 404 → invalid token 401.
- Dev HTTP: `GET /en/assessment/` and `/lt/assessment/` return **200** with
  `noindex` and the synthetic banner.
- **Owner acceptance:** browser test by the owner confirmed the expected behaviour
  (see Accepted outcome; no specific device/accessibility checks claimed).

## Limitations / notes

- The implementing session had **no browser**, so visual rendering, mobile layout,
  and the keyboard walkthrough were documented as a manual checklist
  (`docs/assessment-ui.md` §5) rather than automated here; automated evidence is
  logic, static-export, and HTTP/runtime level. The owner's browser confirmation
  covers general expected behaviour.
- Synthetic content remains unreviewed and uncalibrated; no explanations, exposure
  tracking, retakes, timer, adaptive testing, or reporting.
- No API deployment; publication remains gated on content/language review and
  O-003/O-006/O-007.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/assessment-ui.md`
4. `docs/assessments.md` (the T-017 API)
5. `docs/architecture.md` (T-019 section)
6. `docs/testing.md` (T-019 checks)
