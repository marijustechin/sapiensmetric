# Initial instrument decision brief — Sapiens Metric

Status: T-002 decision brief (draft for product-owner review). This document
identifies the decisions the product owner must make, the consequences of each
choice, and a recommendation. It is **not** a validity claim and **not** a
public test specification.

## How to read this

Each decision below is a genuine product-owner choice. T-002 only recommends;
it does not decide. Until the product owner records these decisions, item
authoring must not begin.

---

## Decision 1 — First-instrument scope

- **Question:** Which scope option is adopted for the first instrument?
- **Options:** Option A (language-neutral reasoning, narrow); Option B
  (reasoning + verbal, bilingual); Option C (broad mixed).
  See `docs/initial-instrument-options.md`.
- **Consequences:**
  - A: minimal language bias, smallest provenance surface, cleanest Tier 0
    report; narrower perceived coverage.
  - B: adds verbal tasks; higher authoring/review burden; per-language verbal
    content that cannot be merged into one score.
  - C: broadest coverage; highest language/culture bias and provenance burden;
    highest risk of Tier 0 drift.
- **Recommendation:** Option A.

## Decision 2 — Timing position

- **Question:** Is the first instrument untimed (power) or timed (speeded)?
- **Options:** Untimed (recommended); timed.
- **Consequences:**
  - Untimed: no speed measurement (S1 remains deferred), no timing-fairness
    problem, consistent with `docs/validation-norming-gap.md`.
  - Timed: would require timing control and device/browser variance handling
    that are explicitly deferred; would reopen OQ-8 and require new scoping.
- **Recommendation:** Untimed.

## Decision 3 — Language handling of the instrument shell

- **Question:** Confirm that language-neutral item content is authored once and
  shared, with only instruction/UI text localised in `lt` and `en`.
- **Options:** Confirm the neutral-shared model (recommended); introduce
  per-language item variants for neutral items (discouraged).
- **Consequences:**
  - Neutral-shared: one canonical item set, consistent with
    `docs/assessment-principles.md`.
  - Per-language neutral variants: unnecessary duplication and risks implying
    language-neutral items are "translated" (contra S-002).
- **Recommendation:** Confirm the neutral-shared model.

## Decision 4 — Provenance gating

- **Question:** Confirm that no item authoring begins until the provenance
  policy in `docs/item-provenance-policy-proposal.md` is approved and its
  review trail is operational.
- **Options:** Approve the policy before authoring (recommended); author in
  parallel without the policy (rejected — violates the "no proprietary content"
  hard constraint in `AGENTS.md`).
- **Consequences:**
  - Approve-first: every future item carries recorded provenance and a
    reviewer/approval trail before it ships.
  - Parallel/no-policy: unverifiable provenance, exposure to reconstruction of
    protected instruments.
- **Recommendation:** Approve the policy before authoring.

Note: product-owner approval of the policy is the immediate gate for item
authoring. It is **not** legal clearance. A separate copyright/IP review
(O-007) determines the policy's legal adequacy and governs any use of
third-party material; no IP review has occurred.

## Decision 5 — Report wording

- **Question:** Confirm the first instrument's report stays within Tier 0
  wording (raw score + task-performance explanation; no IQ, no percentile, no
  ability/knowledge estimate, no predictive statement).
- **Options:** Confirm Tier 0 (recommended); attempt stronger wording (rejected
  — no evidence exists).
- **Consequences:**
  - Tier 0: honest, defensible, consistent with `docs/claims-ladder.md`.
  - Stronger wording: prohibited claims, ethical and reputational risk.
- **Recommendation:** Confirm Tier 0.

---

## Decisions that are explicitly NOT for T-002

- Selection of a test runner (O-001; deferred to the assessment-package
  scaffold task).
- Copyright/IP review of the provenance policy and any third-party material
  (O-007; a separate expert review, not part of T-002).
- Data-protection/consent/retention governance (O-006; deferred to a dedicated
  legal/privacy review).
- Norming/validation scope (O-003).

## Statement of scope

This brief is a planning aid for product-owner decision-making. It contains no
validity claim and does not constitute a public test specification or a
psychometric statement about any instrument.
