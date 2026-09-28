# Assessment scoring core (`@sapiensmetric/assessment`) — T-016

Status: **T-016 deliverable for human review (READY_FOR_HUMAN_REVIEW)**. This
describes the versioned, deterministic scoring core implemented in
`packages/assessment`. It is not a validity or psychometric claim, and it does
**not** validate any assessment content. Content/language review, data
governance, IP review, and API publication remain prerequisites for a live pilot
(see `docs/assessment-foundations.md` §9.2).

## Purpose and boundaries

The package is pure and dependency-free: **no UI, HTTP, database,
authentication, environment variables, network, randomness, or wall-clock time**.
Inputs are never mutated; the same input always produces the same output.

The core scores **one submitted attempt** against one **exact keyed form
snapshot**. It makes no decisions about identity, persistence, lifecycle
transitions, exposure, retakes, practice delivery, or feedback delivery — those
are the caller's responsibilities (§7).

## Public API

Entry module: `@sapiensmetric/assessment` (`packages/assessment/src/index.ts`).

- `scoreAttempt(form: KeyedFormSnapshot, submission: AttemptSubmission): ScoringResult`
- `validateKeyedFormSnapshot(form: KeyedFormSnapshot): void`
- `toPublicForm(form: KeyedFormSnapshot): PublicFormSnapshot`
- `SUPPORTED_SCORING_RULE_VERSIONS`
- Types: `KeyedFormSnapshot`, `ItemDefinition` (the four item kinds),
  `AttemptSubmission`, `ItemResponse`, `ScoringResult`, `PublicFormSnapshot`, …
- Errors: `AssessmentError` with `code` (see §4).

### Small synthetic example

```ts
import { scoreAttempt, type KeyedFormSnapshot, type AttemptSubmission } from '@sapiensmetric/assessment';

const form: KeyedFormSnapshot = {
  assessmentId: 'demo-assessment', assessmentVersion: '1.0.0',
  formId: 'demo-form-a', formVersion: '1.0.0',
  languageScope: 'en', translationVersion: 'en-1.0.0', scoringRuleVersion: '1.0.0',
  objectives: [{ objectiveId: 'obj-1' }, { objectiveId: 'obj-2' }],
  items: [
    { itemId: 'i1', itemVersion: '1', objectiveId: 'obj-1', languageScope: 'en', translationVersion: 't1',
      kind: 'single-answer', optionIds: ['a', 'b', 'c', 'd'], correctOptionId: 'c' },
    { itemId: 'i2', itemVersion: '1', objectiveId: 'obj-2', languageScope: 'neutral', translationVersion: 't1',
      kind: 'numeric', unit: 'minutes', acceptedValue: 8, absoluteTolerance: 0.5 },
  ],
};

const submission: AttemptSubmission = {
  attemptId: 'attempt-1',
  status: 'submitted',
  responses: [
    { itemId: 'i1', response: { kind: 'single-answer', selectedOptionId: 'c' } },
    { itemId: 'i2', response: { kind: 'numeric', value: 8.5 } }, // inclusive boundary -> correct
  ],
};

const result = scoreAttempt(form, submission);
// result.totalItems === 2, result.correct === 2, result.incorrect === 0,
// result.skipped === 0, result.score === 2
```

## 1. Item types and scoring rules

Matching uses **stable IDs** (item/option/objective IDs), never translated labels
or display positions. Each item is worth **one point** in this version — no
weights, partial credit, guessing correction, IQ conversion, percentiles, mastery
thresholds, adaptive selection, or timing.

- **Single answer** — 1 if `selectedOptionId === correctOptionId`, else 0.
- **Multiple select** — 1 only if the selected **set** exactly equals the key
  (order-independent), else 0.
- **Ordering** — 1 only if the ordered sequence exactly equals `correctOrder`
  (all-or-nothing), else 0.
- **Numeric** — 1 if `|value - acceptedValue| <= absoluteTolerance` (inclusive
  boundaries), else 0; the `unit` is a label (comparison is unit-agnostic; the
  caller is responsible for presenting the right unit).

A submitted attempt's `score` equals its `correct` count in this version.

## 2. Input contract and versions

The **keyed form snapshot** carries the exact items, answer keys, objective
mappings, language scope, translation version, and `scoringRuleVersion` needed to
reproduce a result. The result traces `assessmentId`/`assessmentVersion`,
`formId`/`formVersion`, `scoringRuleVersion`, `languageScope`, and
`translationVersion`, plus each item's `itemId`/`itemVersion`/`objectiveId`.

**Version identifiers do not substitute for the scoring definition.** The scorer
reads the actual item definitions in the snapshot; it only checks that
`scoringRuleVersion` is a *supported* rule version. An unsupported version is
rejected rather than scored with current rules.

## 3. Submitted versus unfinished

Only an attempt whose `status === 'submitted'` receives a final score. Anything
else throws `ATTEMPT_NOT_SUBMITTED` and returns no result. The core does not
implement a persisted attempt lifecycle; the **caller** owns submission
authority, persistence, and lifecycle transitions.

For a submitted attempt the denominator is **always the full form**. A missing
response entry counts as **skipped**; an explicit `{ kind: 'skipped' }` also
counts as skipped. Invariants: `correct + incorrect + skipped === totalItems`, and
the denominator is never reduced to the answered subset.

## 4. Validation and error behaviour

All failures throw `AssessmentError` with one of these codes; a failure never
produces a partial result and malformed values are never coerced:

- `UNSUPPORTED_SCORING_RULE_VERSION` — unknown `scoringRuleVersion`.
- `INVALID_FORM` — malformed form: duplicate item/objective IDs, an item whose
  `objectiveId` is not declared, a correct option outside `optionIds`, a
  multiple-select key that is not a subset, an ordering key that is not a
  permutation, or non-finite/misconfigured numeric values.
- `INVALID_RESPONSES` — malformed responses: unknown item, duplicate response
  entries, an unknown option, a duplicated selected option, an ordering response
  that is not a permutation, a response kind that does not match the item, or a
  non-finite numeric value.
- `ATTEMPT_NOT_SUBMITTED` — the attempt is not explicitly submitted.

## 5. Internal keyed data versus browser-safe data

`KeyedFormSnapshot` is **internal/confidential** — it contains answer keys and
numeric answers. It must not be placed in public web data, shared browser DTOs,
or static assets, and must not be imported into `apps/web`.

`toPublicForm(keyed)` returns a `PublicFormSnapshot` that strips every answer key:
option **IDs** are kept (they are already shown to participants), the numeric
**unit** is kept, and `correctOptionId`/`correctOptionIds`/`correctOrder`/
`acceptedValue`/`absoluteTolerance` are removed. `ScoringResult` likewise carries
no keys and no full item definitions.

Later feedback delivery (explanations/sources for seen items) is a **separate**
authorised step.

## 6. What the core guarantees

- Deterministic, pure scoring: no I/O, no clock, no randomness, no mutation.
- Full-form denominator with `correct + incorrect + skipped === totalItems`.
- Explicit, coded rejection of malformed input and unsupported rule versions.
- Browser-safe projection that excludes answer keys.
- No hardcoding of astronomy, item counts, or objectives — the engine is generic.

## 7. Caller responsibilities (not implemented here)

- Authentication, submission authority, persistence, and attempt lifecycle
  (including marking an attempt unfinished/abandoned).
- **Exposure tracking, retake scheduling, practice delivery, and item-bank/form
  selection** — and the approved **learning-repeat** policy
  (`docs/assessment-foundations.md` §4.2): a learning repeat is clearly labelled,
  distinct from a fresh assessment, and never presented as independent
  improvement.
- Feedback delivery, analytics exclusions (assessment data never to GA4/GTM),
  data minimisation/retention (O-006), and API publication.

## 8. Proposed next slice (not started)

Session-form assembly and delivery/data design remain **proposed, not started**:
a bounded form-assembly helper (presentation order, objective blueprint) and the
attempt-lifecycle/data-minimisation design, still gated on the remaining
prerequisites (`docs/assessment-foundations.md` §9.2). Item content/language
review is a separate prerequisite and is **not** provided by scoring tests.

## 9. Non-claims

Scoring tests establish **engine behaviour only**. They do not validate
assessment content, item quality, difficulty, reliability, validity, equivalence,
or any psychometric property, and they do not make accuracy claims about the
draft astronomy items.
