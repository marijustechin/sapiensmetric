# Assessment attempts API — T-017 (synthetic, local/test only)

Status: **T-017 deliverable for human review (READY_FOR_HUMAN_REVIEW)**. This is
an authenticated API/DB vertical slice for starting, saving, resuming, and
submitting an assessment attempt. It uses **synthetic content only** and is
**not publication-ready**. No web UI is part of this task.

## 1. Scope and boundaries

In scope: persisted attempts; server-side scoring with
`@sapiensmetric/assessment`; ownership and status enforcement; concurrency-safe
answer saving and submission; a local synthetic fixture.

Out of scope: web UI; production deployment; publishing the astronomy bank;
item-review dashboard; adaptive testing; general-purpose authoring; feedback /
answer-key explanations; exposure tracking; retake scheduling.

## 2. Synthetic content (local/test only)

Synthetic content lives server-side in
`apps/api/src/modules/assessment/synthetic-form.ts`, prefixed `synthetic-`, and is
**not** the astronomy pilot bank.

- Enable locally with `ASSESSMENT_SYNTHETIC_ENABLED=true` (default **false**).
- The config **refuses to start** if it is enabled while `NODE_ENV=production`.
- Only **starting** an attempt requires the flag; existing owned attempts remain
  listable/resumable/submittable if the flag is later turned off (nothing is
  auto-deleted).

## 3. Lifecycle

Minimal and documented: `in_progress` → `finalised`.

- No expiry, abandonment, or retention rules are invented here. Attempts persist
  until an explicit future retention/governance decision (O-006) says otherwise.
- A submitted attempt is **finalised** exactly once; its answers/result become
  immutable. Repeated submission returns the stored result.

## 4. Schema (`assessment_attempts`, migration `1781440000004`)

| Column | Notes |
| --- | --- |
| `id` | uuid PK |
| `userId` | FK → `users(id)` (cascade), indexed with `createdAt` |
| `assessmentId`, `assessmentVersion`, `formId`, `formVersion`, `languageScope`, `translationVersion`, `scoringRuleVersion` | version trace |
| `snapshot` (json) | **exact immutable keyed form snapshot** chosen at start |
| `answers` (json) | the caller's saved response entries (absent item IDs = unanswered) |
| `status` | `in_progress` \| `finalised` |
| `revision` | optimistic-concurrency counter; incremented per successful save/submit |
| `result` (json, nullable) | the stored `ScoringResult` |
| `createdAt`, `updatedAt`, `finalisedAt` | timestamps (`datetime(6)`) |

`synchronize` stays **disabled**; the schema changes only via the committed
migration.

## 5. Endpoints (all behind `AccessTokenGuard`)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/assessments/attempts` | Start a synthetic attempt (201). Requires the flag. |
| `GET` | `/assessments/attempts` | List the caller's own attempts. |
| `GET` | `/assessments/attempts/:id` | Resume: public form + the caller's saved answers + status. |
| `PUT` | `/assessments/attempts/:id/answers` | Partial answer save (revision-gated). |
| `POST` | `/assessments/attempts/:id/submit` | Finalise and score; returns the result. |
| `GET` | `/assessments/attempts/:id/result` | Retrieve the stored result (finalised attempts only). |

Every operation derives the user from the session (`request.userId`) and enforces
ownership server-side. A non-owned attempt returns **404** (existence is not
disclosed). Editors/admins get **no** cross-user access here.

## 6. Contracts and answer-save semantics

Client-safe shapes are in `packages/contracts/src/assessment.ts`. They contain no
answer keys, no numeric answers, and no keyed snapshot.

`PUT .../answers` body:

```jsonc
{
  "revision": 2,                       // the revision the client last saw
  "answers": [
    { "itemId": "synthetic-single", "response": { "kind": "single-answer", "selectedOptionId": "s3" } },
    { "itemId": "synthetic-multi",  "response": { "kind": "skipped" } }   // clears this answer
  ]
}
```

- **Partial**: only the listed items change; others are unchanged.
- **Clearing**: `{ "kind": "skipped" }` removes the stored answer for that item.
- **Validation**: structurally valid but incorrect answers are accepted; malformed
  input (unknown item/option, duplicate entries, wrong response kind, non-permutation
  ordering, non-finite numeric, stale revision) is rejected. Validation reuses the
  scoring core (`400 INVALID_ANSWERS`) — there is no second scoring algorithm.

Error codes: `ASSESSMENT_NOT_AVAILABLE` (404), `ATTEMPT_NOT_FOUND` (404),
`ATTEMPT_FINALISED` (409), `REVISION_CONFLICT` (409), `INVALID_ANSWERS` (400),
`ATTEMPT_NOT_FINALISED` (409).

## 7. Concurrency and transactions

- Answer saves take a **pessimistic row lock** (`SELECT … FOR UPDATE`) and check
  an **optimistic `revision`**. A stale revision is rejected (`409
  REVISION_CONFLICT`); a finalised attempt is rejected (`409 ATTEMPT_FINALISED`).
  This serialises saves and prevents silent lost updates.
- **Submission** locks the row, scores the **persisted** snapshot + answers with
  the shared core, then stores the result and flips to `finalised` **in one
  transaction**. Scoring/validation failure rolls back with nothing persisted.
- **Concurrent submissions** serialise on the row lock: the first finalises, the
  second sees `finalised` and returns the same stored result — exactly one
  finalisation.
- **Save-versus-submit race**: whichever wins the lock runs first; a save that
  loses to a submission is rejected (`ATTEMPT_FINALISED`) and cannot change the
  finalised answers.
- **Reproducibility**: scoring reads the snapshot persisted at start, so a later
  change to the source fixture cannot alter an existing attempt's result.

## 8. Confidential data and logging

- `snapshot` (answer keys) and `answers` live **server-side only**. Responses use
  a public projection (`toPublicForm`) with no keys; results contain no keys and
  no internal item definitions.
- Assessment responses, results, and identifiers are **never** sent to GA4/GTM,
  and answer bodies/credentials are not logged.

## 9. Local walkthrough (existing auth, no embedded secrets)

Prereqs: local MySQL (`docker compose up -d`), root `.env` configured, migrations
applied.

```bash
# 1. Apply the new migration to the local DB
pnpm --filter @sapiensmetric/api migration:run

# 2. Run with synthetic content enabled (local only)
ASSESSMENT_SYNTHETIC_ENABLED=true pnpm --filter @sapiensmetric/api build && \
ASSESSMENT_SYNTHETIC_ENABLED=true pnpm --filter @sapiensmetric/api start

# 3. Register + verify + log in (verification mail is real SMTP; for local testing
#    mark the account verified directly):
curl -s -X POST localhost:3334/auth/register -H 'content-type: application/json' \
  -d '{"email":"you@example.test","password":"a-strong-local-password","locale":"en"}'
#   -> mark verified in MySQL, then:
TOKEN=$(curl -s -X POST localhost:3334/auth/login -H 'content-type: application/json' \
  -d '{"email":"you@example.test","password":"a-strong-local-password"}' | jq -r .accessToken)

# 4. Start, save, resume, submit, retrieve
ATTEMPT=$(curl -s -X POST localhost:3334/assessments/attempts -H "authorization: Bearer $TOKEN" | jq -r .attemptId)
curl -s -X PUT localhost:3334/assessments/attempts/$ATTEMPT/answers -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"revision":0,"answers":[{"itemId":"synthetic-single","response":{"kind":"single-answer","selectedOptionId":"s3"}}]}'
curl -s localhost:3334/assessments/attempts/$ATTEMPT -H "authorization: Bearer $TOKEN"
curl -s -X POST localhost:3334/assessments/attempts/$ATTEMPT/submit -H "authorization: Bearer $TOKEN"
curl -s localhost:3334/assessments/attempts/$ATTEMPT/result -H "authorization: Bearer $TOKEN"
curl -s localhost:3334/assessments/attempts -H "authorization: Bearer $TOKEN"
```

This demonstrates the flow at the **API level** (no browser verification — there
is no UI in this task).

## 10. Local synthetic vs publication-ready

Synthetic content proves the **plumbing only**. It is not reviewed, calibrated, or
validated, and it is not the astronomy pilot. Publication remains gated on the
prerequisites below.

## 11. Remaining prerequisites (unchanged)

- Independent astronomy content review and independent EN/LT language review
  (**pending**).
- Data-protection/governance (O-006), IP review (O-007), norming/validation plan
  (O-003).
- **API publication/deployment** for any live, registered assessment.
- Feedback/answer-key explanations, exposure tracking, retake policy — future
  authorised slices.

Scoring/attempt tests establish **engine and persistence behaviour only**; they do
not validate assessment content or psychometric claims.
