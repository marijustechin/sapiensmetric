# Synthetic-assessment UI — T-019 (local/development only)

Status: **T-019 approved and archived (2026-10-06)**; the owner tested the
synthetic assessment in the browser and confirmed the expected behaviour (no
specific device/browser/accessibility checks are asserted). A minimal browser
surface over the T-017 assessment-attempt API so the full **start → answer → save
→ resume → submit → result → history** journey can be exercised. It uses
**synthetic content only**, is **off by default**, is refused in production, and
is **not publication-ready**. No real astronomy bank, no answer-key explanations,
no exposure tracking, no retakes/timer/adaptive testing, no IQ/percentile/mastery
framing, and **no API deployment**.

## 1. What it does

- Entry from the authenticated app area: the nav **Assessment** link and the
  account page's "Open the synthetic assessment" link lead to `/{locale}/assessment/`.
- Lists the signed-in user's own attempts (status, revision, timestamps) with
  **Resume** / **View result** actions.
- Starts a new attempt only through an explicit button (never on mount).
- Renders the four existing item kinds — single-answer, multiple-select, ordering
  (keyboard-accessible Move up / Move down), and numeric — with progress, change,
  and clear.
- Explicit **Save** with unsaved / saving / saved / error states (no autosave).
- **Submit** saves any pending answers successfully first, then finalises;
  unanswered items are counted as skipped by the server.
- Shows the server's **raw** result (correct / incorrect / skipped / total, a raw
  score, and per-objective totals) and the attempt history. Finalised attempts are
  read-only.

## 2. Authority and boundaries

The server remains authoritative for ownership, revisions, submission, and
scoring. The web app:

- imports **no** keyed form, answer key, or scoring code, and never imports
  `@sapiensmetric/assessment` or the server `synthetic-form.ts`;
- holds the access token only in memory (via the existing auth provider);
- sends **no** assessment responses, results, or attempt identifiers to GA4/GTM
  (the authenticated app area does not load GTM, and analytics helpers would strip
  query strings regardless).

The route is `noindex` and **excluded** from the frontend-only public artifact and
sitemap.

## 3. Architecture (FSD light)

| Layer | Files |
| --- | --- |
| app | `app/[locale]/(app)/assessment/page.tsx` (thin, `noindex`) |
| widgets | `widgets/assessment-screen/{assessment-screen.tsx,use-assessment-store.ts,use-attempt-param.ts}` |
| features | `features/assessment/{assessment-api,assessment-types,assessment-answers,assessment-store,assessment-item,assessment-runner,assessment-result,assessment-history}.ts(x)` |
| shared | existing auth, i18n, and navigation helpers |

The store (`assessment-store.ts`) is a framework-free observable: the widget binds
it with `useSyncExternalStore` and injects an in-memory token getter, so the risky
behaviour is unit-testable with a fake API. The active attempt is a **client-side
selection** read from `?attempt=<id>` (via `window.location`, not
`useSearchParams`), keeping the build a static-export shell with no dynamic
attempt-ID path.

### Recovery semantics

- **Unsaved changes:** a `window.confirm` guards selecting another attempt,
  starting a new one, going back, and (via the store) the conflict discard.
- **Revision conflict** (`409 REVISION_CONFLICT`): local edits are kept; further
  saves are blocked until the user either **reloads the server answers** (discards
  local, after a warning) or **keeps their edits**, which re-reads the server and
  re-applies only their edited items on top (never silently reverting unrelated
  server changes). A stale revision never overwrites newer server answers.
- **Duplicate actions:** in-flight saves and submits are guarded; a second call
  does not reach the API.
- **Ambiguous submit** (network failure): not auto-retried; **Check submission
  status** reconciles against the server and loads the result if it was finalised.
- **Access/error recovery:** auth bootstrap (loading / error + retry /
  unauthenticated → login with `returnTo`), session expiry/unverified/suspended
  (401) surfaces a re-sign-in prompt while keeping local edits, and
  missing/not-owned attempts (404) and disabled synthetic availability
  (`ASSESSMENT_NOT_AVAILABLE`) show specific messages.

## 4. Local startup (ports web 3333, API 3334, MySQL 3307)

Prerequisites: local MySQL via Docker, root `.env` configured, migrations applied.

```bash
# 1. Local MySQL
docker compose up -d

# 2. Apply migrations (once)
pnpm --filter @sapiensmetric/api migration:run

# 3. API with synthetic content enabled (local only)
ASSESSMENT_SYNTHETIC_ENABLED=true pnpm --filter @sapiensmetric/api build
ASSESSMENT_SYNTHETIC_ENABLED=true pnpm --filter @sapiensmetric/api start   # :3334

# 4. Web (separate terminal)
pnpm --filter @sapiensmetric/web dev                                       # :3333
```

Root `.env` must set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3334` and
`CORS_ORIGIN=http://localhost:3333`.

Create and sign in an account (registration sends a real verification email;
for local testing mark the account verified directly in MySQL), then open
**http://localhost:3333/en/assessment/** (or `/lt/assessment/`).

> `ASSESSMENT_SYNTHETIC_ENABLED` is default-`false`; **starting** an attempt
> requires it. Existing owned attempts remain listable/resumable/submittable if it
> is turned off later (nothing is auto-deleted).

## 5. Manual acceptance checklist

Run through the authenticated app area in a real browser (EN and LT):

- [ ] Nav and account page both link to the assessment screen; the synthetic
      banner is visible and the page is clearly labelled development-only.
- [ ] No attempt is created merely by opening the page; **Start a new attempt**
      creates one (POST), and it appears in the history.
- [ ] All four item kinds render; ordering works with the keyboard (Move up /
      Move down / Tab / Enter), not only a pointer.
- [ ] Answers can be changed and cleared; progress updates.
- [ ] **Save** shows unsaved → saving → saved; reloading the page and resuming
      from history restores the server-persisted answers.
- [ ] Unsaved changes trigger a warning before switching attempt / starting new /
      going back.
- [ ] **Submit** with pending edits saves first, then finalises; a confirm explains
      finalisation and that unanswered items count as skipped.
- [ ] Double-clicking Save or Submit does not create duplicate in-flight requests.
- [ ] The result view shows raw correct/incorrect/skipped/total and objective
      totals; a finalised attempt is read-only.
- [ ] Simulate a stale revision (save in another tab / device, then edit + save
      here): a conflict banner appears; reload and keep-local paths both behave as
      described and never silently overwrite.
- [ ] Stop the API: save/submit show clear network errors; an interrupted submit
      offers **Check submission status**.
- [ ] Sign out/expire the session: the screen routes to sign-in with `returnTo`,
      and a 401 keeps local edits with a re-sign-in prompt.
- [ ] Mobile/narrow layout is usable and keyboard focus is visible throughout.

## 6. Automated verification

- `apps/web/features/assessment/assessment-answers.test.ts` and
  `assessment-store.test.ts` (behavioural, fake API).
- `pnpm verify` includes the web tests, FSD boundary check, `next build`,
  `verify-static-export.sh` (route + `noindex` + icons + sitemap exclusion), and
  `verify.sh` (invariant 22).
- `pnpm build:public && pnpm verify:public-release` asserts the assessment route is
  excluded from the public artifact.

## 7. Known limitations / next slice

- **Synthetic only.** Not calibrated, not reviewed, not the astronomy pilot; the
  result is raw server output, not a validated assessment outcome.
- No explanations/feedback, no exposure tracking, no retake policy, no timer, no
  adaptive testing, no reporting templates.
- The implementing session had no browser, so its evidence is logic +
  static-export/HTTP/runtime level; the owner's browser confirmation covers
  general expected behaviour (section 5 remains the detailed manual checklist).
- **API deployment** is still required before any real use; publication remains
  gated on content/language review and O-003/O-006/O-007.
