# Research / open questions — Sapiens Metric

Status: draft discovery baseline (T-001). Each entry names a question, why it
blocks later work, a proposed owner, and a next step.

## OQ-1 — Constructs: which to adopt and how to define them

- **Question:** Which of the constructs in `docs/measurement-model.md` become
  actual first-class measures, and what are their final operational
  definitions?
- **Why it blocks:** item authoring and scoring depend on stable construct
  definitions.
- **Proposed owner:** product owner + psychometric advisor.
- **Next step:** prioritise constructs against `docs/product-brief.md` goals.

## OQ-2 — Language fairness and equivalence

- **Question:** For language-scoped constructs, how do we establish that `lt`
  and `en` versions are comparable without assuming they are translations?
- **Why it blocks:** cross-language reporting and any combined norming.
- **Proposed owner:** psychometric advisor + localisation reviewer.
- **Next step:** define an equivalence/adaptation protocol aligned with the
  ITC guidelines for adapting tests.

## OQ-3 — Item sourcing and originality

- **Question:** What is the exact provenance/licensing policy for original vs.
  legally reusable items, and how is provenance stored? (Maps to O-002.)
- **Why it blocks:** the "no proprietary content" hard constraint requires a
  verifiable authoring trail before any item is written.
- **Proposed owner:** product owner + copyright/IP review (see O-007).
- **Next step:** draft sourcing policy for a dedicated decision.

## OQ-4 — Scoring and aggregation

- **Question:** Raw scores per item type vs. any composite; how are time
  limits and partial credit handled; when (if ever) is an aggregate defensible?
- **Why it blocks:** scoring-rule versioning and the assessment package design.
- **Proposed owner:** psychometric advisor + engineering lead.
- **Next step:** specify scoring rules per adopted item format.

## OQ-5 — Norming target population and sampling

- **Question:** What are the target populations for `lt` and `en`, and what
  constitutes a representative sample? (Maps to O-003.)
- **Why it blocks:** any percentile/norm claim and the norming study design.
- **Proposed owner:** psychometric advisor.
- **Next step:** define target populations and sampling feasibility.

## OQ-6 — Test-runner and package tooling

- **Question:** Which test runner/framework is used for the assessment package
  and monorepo? (Maps to O-001.)
- **Why it blocks:** `docs/testing.md` expects tests, but the runner is
  undecided.
- **Proposed owner:** engineering lead.
- **Next step:** evaluate runners against the "no extra system dependencies"
  constraint when the assessment package is scaffolded.

## OQ-7 — Data-protection and consent baseline

- **Question:** What are consent, retention, access-control, and
  organisational-use governance requirements? (Maps to O-006.)
- **Why it blocks:** any future data collection (including validation data)
  must be lawful and governed.
- **Proposed owner:** legal/privacy review (dedicated task).
- **Next step:** commission the legal/privacy review before any data
  collection.

## OQ-8 — Timing and device fairness

- **Question:** How do we handle timing, device, and browser variance for
  speed-sensitive items (deferred `S1`)?
- **Why it blocks:** speed measurement is currently excluded; reintroduction
  needs a fairness plan.
- **Proposed owner:** engineering lead + psychometric advisor.
- **Next step:** define timing-control requirements if speed is pursued.

## OQ-9 — Copyright/IP provenance review

- **Question:** Who is the responsible expert, and what is the scope and timing
  of a copyright/IP review of the item provenance policy and any use of
  third-party material? (Maps to O-007.)
- **Why it blocks:** the provenance policy is currently an internal risk-control
  proposal; before any reliance on third-party material or any IP clearance is
  assumed, an IP review must be commissioned.
- **Proposed owner:** copyright/IP expert (dedicated review).
- **Next step:** commission the IP review; no legal clearance is claimed before
  it occurs.

## Status

All open. None is resolved by T-001; this list feeds later task scoping.
