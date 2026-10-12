# T-022 — Versioned astronomy draft bank, review eligibility, and local post-submission feedback (archived)

- **ID:** T-022
- **Type:** Server-only assessment content + local feedback + eligibility metadata.
- **Created:** 2026-10-09
- **Archive date:** 2026-10-12
- **Final status:** Transitioned by explicit owner authorization (2026-10-12) so
  T-023 could start as the single active task. **Human browser acceptance of the
  local review environment remains pending**; the owner's request explicitly
  authorised this transition without asserting acceptance. Implementation was
  verified locally and the prerequisites were committed/pushed as `23c6a9c`.
- **Baseline:** T-021 archived; source HEAD `779822b` at task start; committed at
  `23c6a9c`.

---

> T-022 adds a repository-managed, server-only, bilingual **draft** bank covering
> the owner's 25 astronomy topics, typed review-evidence/publication-eligibility
> metadata, a default-off development-only gate, and post-submission feedback
> (correctness, explanations, sources) for the submitted attempt — tied to the
> attempt's versioned content. Drafts remain **unreviewed**; AI drafting, source
> checking and tests are **not** independent astronomy or EN/LT review.

## Scope

1. **Draft bank** (`apps/api/src/modules/assessment/astronomy/`): 25 original
   EN/LT draft items (one per owner topic, with splits/simplifications documented),
   each with stable id/version, objective, relevance rationale, difficulty
   (editorial), prompt/options, answer key, explanation, distractor rationale,
   sources, provenance/rights notes and review status. Four supported response
   kinds used where appropriate.
2. **Revised blueprint**: reconcile the earlier five-objective Solar-System
   blueprint with this broader astronomy scope; record the revision explicitly;
   drop "five items per objective" reporting and any comparability claim.
3. **Review eligibility**: typed content/language review evidence; approvals are
   hash-bound to the reviewed content so relevant changes invalidate them; reject
   eligibility when evidence is absent (never invent reviewers).
4. **Local gating**: `ASSESSMENT_ASTRONOMY_DRAFT_ENABLED` (default off, refused in
   production); the synthetic assessment and its behaviour are preserved.
5. **Post-submission feedback**: explanations/sources only after submission, for
   the submitted attempt's items, resolved by the attempt's `itemVersion` so later
   bank edits do not rewrite historical explanations; no keys in public forms,
   in-progress responses, frontend bundles or the public release.
6. **Local delivery**: reuse the existing attempt/scoring/UI architecture to make
   the module available for local review with a localized content view and a
   feedback panel after submit.
7. **Tests**: bank validation, review eligibility/invalidation, draft gating,
   feedback access/version consistency, key isolation.
8. **Docs + continuity**.

## Delivered

- Server-only bilingual draft bank (`apps/api/src/modules/assessment/astronomy/`)
  covering all 25 owner topics (25 single-answer items), with the revised
  five-objective astronomy blueprint (8/5/4/6/2 items — supersedes the T-015
  "five per objective" Solar-System blueprint).
- Typed review-evidence + publication-eligibility metadata with hash-bound
  invalidation; the validator rejects invented/backfilled approvals.
- `ASSESSMENT_ASTRONOMY_DRAFT_ENABLED` gate (default off; refused in production),
  distinct `astronomy-draft` routes; synthetic flow unchanged.
- Post-submission feedback (`content`/`feedback` endpoints) resolved by the
  attempt's `itemId`+`itemVersion`; keys never exposed to the client — the
  post-submission field is `answerOptionIds`.
- Local UI: module start button, localized prompts/options, feedback panel.
- Docs: `docs/astronomy-draft-bank.md`, plus updates to architecture/testing/
  assessments/.env.example.
- **UX follow-up (2026-10-10):** replaced application `window.confirm` calls in
  the assessment flow (discard/reload/submission) and admin destructive actions
  with a reusable `shared/ui/confirm-dialog.tsx` (accessible, translated,
  destructive treatment; Escape/backdrop cancel); added selective toasts
  (`shared/ui/toast.tsx`) for completed actions only; preserved browser
  `beforeunload` protection (`shared/lib/use-unsaved-changes-warning.ts`).
- **Browser-review corrections (2026-10-10):** untouched drafts are hidden from
  normal history via an explicit `hasProgress` flag (additive migration
  `1781440000005`) while remaining retrievable by id — cleared progress and all
  submissions stay visible; history leads with a translated module title +
  item count + status/date (ids secondary, never guessed); `Assessment.refresh`
  and new keys added to both locales with a source-scanning regression test;
  mobile-safe results/feedback/history (stacked cards, wrapped identifiers);
  reusable `shared/ui/back-to-top.tsx` (public + app shells); the authenticated
  nav now reuses the shared hamburger/drawer at all widths (public pages
  unchanged, session-independent); confirmation cancel/confirm behaviour
  preserved.
- **Local review repair (2026-10-12):** the API was being served **without the
  assessment flags** (both modules returned the generic `ASSESSMENT_NOT_AVAILABLE`);
  fixed with a documented, repeatable profile (`pnpm dev:api:review` + ignored
  root `.env`), preserving default-off/production refusal. `notAvailable` is now
  **module-specific** (astronomy errors never say "synthetic"); the page heading
  is neutral with per-module notes; the migration backfills `hasProgress` so
  pre-migration saved/submitted attempts stay visible. Authenticated navigation
  verified with headless Chromium (login → hamburger → drawer with Account/
  Assessments + Sign out at 320/360/390px); no defect reproduced after a clean web
  restart. Sign-out previously raced the protected-page guard and landed on
  `/{locale}/auth/login/`; now `signOutToHome` revokes the session and returns to
  the home entry `/{locale}` (verified from `/en/account/` and `/en/assessment/`).
  Owner's Yoast-style sitemap request tracked as a **separate** pending follow-up
  (not part of T-022).

## Verification

- `pnpm verify` → **EXIT 0** (static-export 125/0, public-release 98/0, harness
  838/0); API astronomy specs 20/20.
- Live local HTTP journey (API with the gate on): start → `content?locale=lt`
  (25 items, localized, no keys) → feedback-before-submit **409** → save (200,
  revision 1) → submit (200; correct 3 / incorrect 1 / skipped 21) → feedback
  (200; `answerOptionIds`, explanation, sources). No browser-observed evidence
  (no interactive browser); the UI is type-checked but not visually verified.
- UX follow-up: `confirm-guard.test.ts` (cancellation runs no action;
  confirmation runs the action exactly once) and web tests 119/119; live HTTP
  repeat/resume check confirmed two fresh attempts share identical item order and
  option order and that resume returns an identical form; the synthetic flow still
  starts (201). Confirm dialog/toasts not observed in a browser (none available).
- **Owner usability feedback (2026-10-10):** the owner completed the Lithuanian
  draft; wording was generally clear and natural, with sentence-level polishing
  possible. Recorded as **usability feedback only**, not independent language or
  subject-matter review, and not publication eligibility.
- **Confirmed repeat behaviour:** new attempts repeat all 25 items in the same
  order with option order preserved, and resume restores the same presentation.
  This is form presentation only — **not** an exposure/retake policy (none is
  implemented or claimed).

## Limitations

- Drafts are **unreviewed**; no item is publication-eligible. Difficulty is
  editorial. No exposure/retake policy, reporting templates, timers or adaptive
  testing; results are descriptive raw counts.
- Local review URL: start the API (`ASSESSMENT_ASTRONOMY_DRAFT_ENABLED=true`) and
  web dev servers, then `http://localhost:3333/en/assessment/` (or `/lt/…`).
- Not committed, pushed or published; no API deployment.

## Boundaries

- No production/API deployment, hosting/DNS/Google changes, CMS/editor dashboard,
  exposure policy, retakes or calibrated-difficulty claims. Results stay
  descriptive raw counts (skipped reported separately); no IQ/percentile/mastery
  or validated-progress claims.

## Reading order

1. `AGENTS.md`
2. `docs/assessment-foundations.md`
3. `docs/assessment-scoring.md`
4. `docs/assessments.md`, `docs/assessment-ui.md`
5. `docs/architecture.md`, `docs/testing.md`
