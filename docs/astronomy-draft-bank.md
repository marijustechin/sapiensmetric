# Astronomy draft bank, review eligibility, and local feedback (T-022)

Status: **T-022 deliverable — READY_FOR_HUMAN_REVIEW, uncommitted and
unpublished.** A repository-managed, **server-only**, bilingual (EN/LT) draft bank
covering the owner's 25 astronomy topics, with typed review-evidence/publication-
eligibility metadata, a default-off local gate, and post-submission feedback.

> **Unreviewed drafts.** AI drafting, source checking and automated tests are
> **not** independent astronomy or EN/LT language review. Nothing here is
> publication-ready; no item is publication-eligible (see §4).

## 1. Revised blueprint (supersedes the T-015 five-objective Solar-System set)

T-015 proposed a five-objective **Solar-System** blueprint with the intent of
"five items per objective" (25 items). T-022 broadens the scope to astronomy as a
whole and **revises the blueprint**:

| Objective | Title | Owner topics | Items |
| --- | --- | --- | --- |
| `astro-obj-earth-moon-sun` | Earth, Moon and the Solar System | 1–8 | 8 |
| `astro-obj-stars` | Stars, light and element origins | 9, 11–14 | 5 |
| `astro-obj-galaxies` | Galaxies and the Milky Way | 15–18 | 4 |
| `astro-obj-cosmology` | The universe: origin, expansion and composition | 19–24 | 6 |
| `astro-obj-scale` | Astronomical scale and look-back time | 10, 25 | 2 |

This is **not** "five items per objective", and it is **not comparable** to the
T-015 proposal; the earlier five-per-objective reporting is withdrawn.

## 2. Item format

Each draft item (`apps/api/src/modules/assessment/astronomy/astronomy-bank.ts`)
carries: stable `itemId` + `itemVersion`; `topic`; `objectiveId`; `kind`;
`languageScope`; bilingual prompt/options; the answer key (`correctOptionIds`);
a bilingual explanation; per-distractor rationale; authoritative-source ids;
provenance/rights notes; an **editorial** difficulty label; the relevance
rationale ("why understanding this subject helps"); and review status/evidence.

- **Response kinds:** the engine supports four kinds, but this draft uses
  `single-answer` throughout because these are concept-comprehension items — a
  deliberate, documented departure.
- **Difficulty** labels are editorial estimates, **not** calibrated measurements.
- **Source checking (2026-10-09):** the comet-tail distinction, the Andromeda
  encounter uncertainty, cosmological-vs-Doppler redshift, and the unknown nature
  of dark matter/energy were checked against current NASA/ESA pages; sources are
  recorded with a `checked` flag. All sources remain subject to independent review.
- **Notably uncertain points handled explicitly:** the Andromeda item uses the
  2025 Hubble/Gaia result (~50% chance of merging within ~10 Gyr; only ~2% for a
  head-on collision in 4–5 Gyr), not the older "certain in 4 Gyr" claim.

## 3. Gating

The bank is available only for **local review**:

- `ASSESSMENT_ASTRONOMY_DRAFT_ENABLED` (default **false**); the config **refuses
  to start** if it is enabled while `NODE_ENV=production`.
- Starting uses a distinct route (`POST /assessments/attempts/astronomy-draft`) so
  the synthetic flow is unchanged and remains the default.
- The bank is **server-only**: answer keys never appear in public forms,
  in-progress responses, the frontend bundle or the public release.

## 4. Review evidence and publication eligibility

`astronomy-review.ts` defines typed evidence for **content** and **language**
review. An approval records the reviewer, role, date, scope, reference and a
`contentHash` of the exact reviewed content; `isReviewCurrent` compares that hash
with the current content, so a **relevant change invalidates** the approval.
`evaluatePublicationEligibility` requires *current* content **and** language
evidence and an `approved` status; unreviewed drafts are ineligible. The bank
validator additionally rejects any draft that carries review evidence or is
publication-eligible, so reviewers cannot be invented or backfilled.

## 5. Post-submission feedback (versioned)

Endpoints (all behind `AccessTokenGuard`, ownership enforced):

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/assessments/attempts/astronomy-draft` | Start a draft attempt (gate). |
| `GET` | `/assessments/attempts/:id/content?locale=en\|lt` | Localized prompts/options (**no keys**); any owned attempt. |
| `GET` | `/assessments/attempts/:id/feedback?locale=en\|lt` | Correctness, explanation, sources; **finalised only**. |

- Feedback is derived from the attempt's persisted snapshot and resolved by the
  attempt's own `itemId`+`itemVersion`; if a version is no longer in the bank the
  item is marked `unavailable` rather than substituted, so later bank edits do not
  silently rewrite historical explanations.
- The client projection names the post-submission correct-option field
  `answerOptionIds` (distinct from the server-internal keyed `correctOptionIds`),
  keeping the repository's keyed-material guard strict.
- Results are **descriptive raw counts** (correct / incorrect / skipped, skipped
  reported separately). No IQ, percentile, mastery, validated-literacy or
  measured-progress claims.

## 6. Local review instructions

```bash
# 1. Local MySQL + migrations
docker compose up -d
pnpm --filter @sapiensmetric/api migration:run

# 2. API with the draft gate enabled (local only)
ASSESSMENT_ASTRONOMY_DRAFT_ENABLED=true pnpm --filter @sapiensmetric/api build
ASSESSMENT_ASTRONOMY_DRAFT_ENABLED=true pnpm --filter @sapiensmetric/api start   # :3334

# 3. Web (separate terminal)
pnpm --filter @sapiensmetric/web dev                                            # :3333
```

Sign in, open **http://localhost:3333/en/assessment/** (or `/lt/assessment/`), and
use **Start astronomy draft (local review)**. Save/submit; explanations and
sources appear after submission. The synthetic flow is unchanged.

- **Automated evidence (this task):** `pnpm verify` EXIT 0; the astronomy specs
  (bank validation, eligibility/invalidation, feedback versioning, gating) pass;
  a live local HTTP journey exercised start → content (LT) → feedback-before-
  submit (409) → save → submit (correct 3 / incorrect 1 / skipped 21) → feedback.
- **Browser-observed evidence:** not captured in this session (no interactive
  browser); the UI is wired and type-checked but a human should confirm rendering.

## 7. Remaining release blockers

- Independent **astronomy** and **EN/LT language** review (no item is eligible).
- O-002 (sourcing), O-003 (validation/norming), O-006 (data protection),
  O-007 (IP provenance).
- API deployment (not in scope); exposure/retake policy and reporting remain
  explicitly unimplemented and are **not** claimed.

## 8. Owner feedback and UX follow-up (2026-10-10)

**Owner usability feedback.** The owner completed the Lithuanian astronomy draft
and reported the wording was generally clear and natural, with some sentence-level
polishing possible. This is recorded as **owner usability feedback only** — it is
**not** independent EN/LT language review and **not** subject-matter approval; no
item becomes publication-eligible.

**Application confirmations replaced.** The assessment flow's `window.confirm`
calls (discard, reload-server, submission) and the admin destructive-action
confirmations now use a reusable dialog in `shared/ui/confirm-dialog.tsx`:

- modal in the existing visual language, responsive, EN/LT wording, clear action
  labels, and a distinct (red) treatment for destructive actions;
- keyboard operable: initial focus on the safe **cancel** action, Tab contained
  while modal, focus returned to the trigger on close, `role="dialog"` +
  `aria-labelledby`;
- **Escape, backdrop and dismissal cancel** (never confirm);
- safety guarantees unchanged — the same actions run only on an explicit confirm,
  and the confirm/cancel decision is covered by
  `features/assessment/confirm-guard.test.ts` (cancellation runs no action;
  confirmation runs the action exactly once).
- **Distinct, preserved:** closing or reloading the tab with unsaved work cannot
  be intercepted by an in-page dialog, so the browser `beforeunload` prompt is
  kept (`shared/lib/use-unsaved-changes-warning.ts`).

**Toasts** (`shared/ui/toast.tsx`) are used selectively for completed actions only
("Answers saved", "Attempt submitted"). Persistent inline errors and actionable
recovery (save errors, revision conflicts, ambiguous submissions) stay inline and
are **not** moved into disappearing notifications. Prompts, responses and results
are exchanged only with the **authorised application API**; they must never enter
GA4/GTM analytics payloads (toasts carry no assessment data).

**Confirmed repeat/resume behaviour (observed, not assumed).** The form-selection
logic builds a deterministic snapshot from the bank:

- every new attempt includes **all 25 items in the same order**, with **option
  order preserved** (no randomisation, no shuffling, no alternate forms);
- resume/reload returns the **same presentation** (the attempt's persisted
  snapshot);
- verified over live HTTP: two fresh attempts had identical item order and option
  order; reloading the same attempt returned an identical public form; the
  synthetic flow was unaffected. A deterministic-snapshot unit test also asserts
  this.

This is the **form-selection/presentation policy only**. It is **not** an
exposure/retake policy: there is no exposure tracking, no item rotation, no
spacing, and no claim that repeated attempts are equivalent measurements.

**Browser limitation.** No interactive browser was available in the session, so
the confirm dialog and toasts are type-checked and unit-tested but **not
visually/behaviourally observed in a browser**; a human should confirm focus,
keyboard and layout.

## 9. Browser-review corrections (2026-10-10)

**History visibility rule.** Normal attempt history omits an **untouched draft**
(started, no answer saved, not submitted). The draft row is retained for
snapshot/ownership integrity and is still retrievable by id. Visibility is an
explicit `hasProgress` flag (`assessment_attempts.hasProgress`, additive migration
`1781440000005`, default `false`), set when a save actually applies answer
operations and on submission — deliberately **not** derived from `revision`,
which an empty save can increment. Consequences:

- an attempt that saved answers and later cleared them stays visible
  (`hasProgress` remains true);
- explicitly submitted attempts stay visible, including intentional all-skipped
  submissions (`status = finalised`);
- ownership, concurrency, idempotency and resume are unchanged; no existing
  attempt is deleted; **this is not exposure tracking** (hiding an empty draft
  says nothing about which items were presented).

**Human-readable identity.** History leads with a translated **module title**
mapped from the client-safe `assessmentId` (`synthetic-demo` → "Synthetic
assessment", `astronomy-draft` → "Astronomy draft"), plus 25/4 **item count**
(from the versioned form), status and date. Technical id/revision are secondary
(inside a "Details" disclosure). The module is never guessed from item count.

**Translations.** `Assessment.refresh` was a MISSING_MESSAGE in both catalogues;
added EN/LT plus the new history/nav keys. A regression test
(`assessment-i18n.test.ts`) scans the assessment/nav sources for fixed `t('…')`
keys and fails if any key is absent from either locale.

**Mobile layout.** The result view renders objective summaries as stacked cards
and the totals/feedback as wrap-friendly label/value groups; identifiers and
source links wrap (`break-all`), so results, feedback and history are usable at
320/360/390px in EN and LT without page-level horizontal scroll. The confirm
dialog and toasts are narrow-safe (toasts moved to the top-right inset to avoid
the bottom controls).

**Back to top.** `shared/ui/back-to-top.tsx` (public shell + authenticated shell):
appears after meaningful scroll, keyboard operable, translated accessible name,
honours `prefers-reduced-motion`, sits below the consent banner/drawer/dialog
layers, and is hydration-safe (rendered only after a client effect).

**Navigation consistency.** The authenticated app nav (`widgets/auth-nav`) now
reuses the same accessible hamburger/drawer (`shared/ui/drawer.tsx`) as the public
`site-header` at all widths; role-aware destinations, account, sign-out, locale
switching, `returnTo` and auth bootstrap are preserved. Public pages remain
independent of the session (no auth requests). Compared locally vs production:
the public `/en/` **user-visible text is identical** (2421 chars); the only
differences are build/RSC payloads and the **intentional** authenticated-shell
change. Production still returns **404** for `/en/assessment/` and `/en/account/`
(frontend-only exclusions intact).

**Confirmation preserved.** Escape/backdrop dismissal cancels (never confirms) and
issues no submit request; `confirm-guard` tests assert cancellation runs no action
and confirmation runs it exactly once.

**Data boundary wording.** Prompts, responses and results are exchanged only with
the authorised application API and must never enter GA4/GTM analytics payloads.

## 10. Local review availability and shell corrections (2026-10-12)

**Diagnosed cause of "content is disabled".** The API process serving `:3334` had
been started **without** the assessment flags (its environment had no
`ASSESSMENT_*` values), so both modules returned `404 ASSESSMENT_NOT_AVAILABLE`.
Fixed by making the review setup repeatable: the documented profile
`pnpm dev:api:review` (root `package.json`) starts the API with both flags, and
the git-ignored root `.env` may set them. Default-off behaviour and the
production refusal are unchanged.

**Module-specific disabled messages.** `AssessmentService.notAvailable(module)`
now identifies the requested module ("Synthetic assessment content…" vs
"Astronomy draft content…"); the client maps `ASSESSMENT_NOT_AVAILABLE` using the
module that was requested (`startErrorModule`), so an astronomy failure never
claims synthetic content is disabled. Covered by service tests.

**Page context.** The page heading is a neutral "Assessment (development)" with a
local-review-only intro; the **synthetic** fixture warning sits with the synthetic
module's button and the **astronomy** unreviewed/local-only note with the
astronomy button. Neither module's publication eligibility or claims boundaries
changed.

**Authenticated navigation verified.** Headless Chromium (real login form →
`/en/account/`) shows the hamburger menu button, an openable drawer containing
Home/Account/Assessments and **Sign out**, at 320/360/390px. The earlier "brand
only" report did not reproduce against the current build; the web dev server and
`.next` cache were restarted clean.

**Sign-out destination fixed.** Signing out used to race the protected-page guard
and settle on `/{locale}/auth/login/?returnTo=…` instead of home. `signOutToHome`
(`features/auth/sign-out.ts`), used by both the drawer and the account view,
revokes the session first and then returns to the established home entry
(`/{locale}`) with a full document navigation, so the guard cannot strand the user
on sign-in. Verified headlessly: sign-out from `/en/account/` and
`/en/assessment/` settles on `/en/`, and `/en/account/` still redirects to
sign-in when unauthenticated.

**Migration answer (pre-migration attempts).** Migration `1781440000005` backfills
`hasProgress = 1` for rows that were `finalised`, still hold answers, or had any
save (`revision > 0`, which the old code incremented only on save/submit), so
**pre-migration saved unfinished attempts remain visible**, including when their
answers were later cleared. Locally, all remaining `in_progress` rows are
genuinely untouched (`revision = 0`) and stay hidden. Submitted attempts were
always visible via `status = finalised`.
