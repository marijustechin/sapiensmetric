# T-017 — Persisted assessment attempts with synthetic content (archived)

- **ID:** T-017
- **Type:** Implementation (API + DB vertical slice; synthetic, local/test only)
- **Created:** 2026-09-28
- **Archive date:** 2026-09-28
- **Final status:** Approved (human review granted)
- **Approved:** 2026-09-28
- **Baseline:** T-016 archived at commit `95f5464`; no active task before this one.

---

> T-017 added an authenticated API/DB vertical slice to **start, save, resume,
> and submit** an assessment attempt, scored by the T-016 core. It uses
> **synthetic content only** (local/test, off by default), has **no web UI**, and
> is **not publication-ready**. Acceptance was based on the implementation report
> and automated/API verification — **no human browser testing was performed
> because this task has no UI**. Independent content/language review is **not**
> completed by this work.

## Accepted outcome

The owner accepted T-017 on 2026-09-28. The slice starts, saves, resumes, and
submits an attempt against a persisted immutable keyed snapshot, scored
server-side by `@sapiensmetric/assessment`, with ownership and status enforcement,
idempotent submission, and concurrency-safe answer saving/submission.

## Scope delivered

- Authenticated, active, verified users can start a synthetic attempt.
- The server chooses and persists the exact immutable keyed form snapshot and all
  version fields; the client never supplies keys, scores, or definitions.
- Clients receive only a **public** form projection and their own permitted data.
- Answers are validated and persisted; attempts resume after reload/restart.
- Explicit submission scores the persisted snapshot + answers and finalises
  atomically; repeated/concurrent submission returns the stored result.
- Finalised answers/results cannot be overwritten via answer-saving endpoints.
- Users can list/retrieve only their own attempts and results.

## Deliverables

- `packages/contracts/src/assessment.ts` — client-safe contracts (no keys).
- `apps/api/src/config/env.ts` — `ASSESSMENT_SYNTHETIC_ENABLED` (default false;
  refuses production).
- `apps/api/src/modules/assessment/` — entity, migration-backed store (pessimistic
  locks + optimistic revisions), service, controller, module, public view
  projection, and the server-only `synthetic-form.ts`.
- `apps/api/src/database/migrations/1781440000004-CreateAssessmentAttempts.ts`
  (registered in `data-source.ts`).
- Tests: `access-token.guard.spec.ts`, `assessment-view.spec.ts`,
  `assessment.service.spec.ts`, `assessment.integration.spec.ts`.
- `docs/assessments.md`; updates to `docs/architecture.md`, `docs/testing.md`,
  `docs/assessment-foundations.md` (O-002 policy-approval wording).

## Data and concurrency

- Migration only; `synchronize` disabled; applied to the **local development DB**
  (`CreateAssessmentAttempts1781440000004`, no pending migrations).
- The keyed snapshot is stored per attempt, so results reproduce even if the
  source fixture later changes.
- Minimal lifecycle `in_progress` → `finalised`; no expiry/retention invented.
- Partial saves; `skipped` clears an answer; ownership enforced server-side.
- Pessimistic row lock + optimistic `revision` prevent lost updates; saves and
  submissions serialise; submission is transactionally idempotent; failures roll
  back.
- No automatic deletion of existing users or development data.

## Authorisation and data boundaries

- Reuses `AccessTokenGuard` (per-request session/user-status/verification).
- Ownership from `request.userId`; non-owned attempts return 404. Editors/admins
  get no cross-user access in this slice.
- Answer keys never appear in create/resume/list/result/error DTOs.
- No feedback/answer-key explanations (future slice).
- Responses/results/identifiers are never sent to GA4/GTM; answer bodies and
  credentials are not logged.

## Verification evidence

- API unit tests (`pnpm --filter @sapiensmetric/api test`): **137 pass** —
  unauth/invalid/revoked/**suspended**/**unverified** guard cases, public-DTO
  key-leak checks, availability gating, malformed-answer rejection,
  finalised/revision conflicts, idempotent submit, ownership 404.
- Real-MySQL integration (`pnpm --filter @sapiensmetric/api test:integration`):
  **24 pass** (auth 8, admin 4, **assessment 12**) — snapshot persistence,
  ownership, partial saves with clearing + resume, stale-revision conflict,
  rejection after finalisation, full-denominator scoring, idempotent and
  **concurrent** submission (one finalisation), save-versus-submit race with
  consistent stored answers/result, transaction rollback on invalid persisted
  answers, snapshot independence, per-user history isolation.
- `pnpm verify` → **EXIT 0** (`verify-static-export.sh` 93/0; `verify.sh` 722/0);
  harness invariant 21 asserts the T-017 outputs, migration registration,
  default-off synthetic flag + production refusal, contract export, and no web
  attempt surface.
- Correction made during implementation: `finalisedAt` changed to `datetime(6)`
  after a real in-memory-vs-stored precision mismatch surfaced; the brand-new
  local migration was reverted and re-applied. No further schema changes.
- **No browser verification**: this task has no UI; verification is API/DB level.

## Remaining prerequisites (unchanged)

- Independent astronomy content review and independent EN/LT language review
  (**pending**).
- Data-protection/governance (O-006); IP review (O-007); validation/norming plan
  (O-003).
- **API deployment** for any live, registered assessment.
- The provenance **policy** was approved in T-015 (D-T015-6); this is policy
  approval, **not** review of individual items.
- Scoring/attempt tests establish engine/persistence behaviour only and do not
  validate assessment content or psychometrics.

## Preserved follow-ups (unchanged)

Publication/analytics follow-ups remain in `docs/publication-status.md` and
`docs/publication-checklist.md`; the deployed frontend artifact remains
`64c4941cba87d08c` (operation `mulkgfk6-0768754a1976`).

## Non-goals (as scoped)

- Web UI; production deployment; astronomy-bank publication; item-review
  dashboard; adaptive testing; general-purpose authoring.
- Feedback delivery; exposure tracking; retake scheduling; practice delivery.
- Altering deployed public-site behaviour; Google-account changes.
- Any claim above Tier 0; any IQ/percentile/mastery wording.

## Proposed next slice (not started or authorised)

The **minimal local synthetic-assessment UI** (and, later, feedback/answer-key
explanations for seen items plus exposure/retake handling). Not authorised or
started.

## Reading order

1. `AGENTS.md`
2. `tasks/current.md`
3. `docs/assessments.md`
4. `docs/assessment-scoring.md`
5. `docs/assessment-foundations.md`
6. `docs/decisions.md` (O-002/O-003/O-006/O-007)
