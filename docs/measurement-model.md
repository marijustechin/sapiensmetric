# Measurement model sketch — Sapiens Metric

Status: draft discovery baseline (T-001). Subject to revision by later
validation work. No validity is claimed for any construct below.

## Purpose of this document

Define, provisionally, the constructs Sapiens Metric may — with future validity
evidence — aim to interpret task performance as. This is a planning document,
not evidence of measurement quality.

## Current state vs. future goal

- **Current state:** scores describe a respondent's performance on specified,
  versioned tasks. No raw or transformed score is labelled an "ability
  estimate", a "knowledge estimate", or a measure of an abstract cognitive
  construct.
- **Future goal:** reliability and validity evidence may eventually support
  interpreting task performance as cognitive-ability or knowledge constructs
  for a specific intended use (see `docs/validation-norming-gap.md` and
  `docs/claims-ladder.md`).

## Provisional construct vocabulary

The names below adopt the broad-ability vocabulary of the Cattell–Horn–Carroll
(CHC) taxonomy (S-004). They are working hypotheses about what later items
might eventually be interpreted as eliciting; they are **not** claims that
Sapiens Metric measures these constructs.

### Cognitive ability (reasoning) — C (provisional)

- **C1 — Fluid reasoning / pattern induction.** (provisional) A hypothesised
  ability to identify relations among abstract stimuli and infer the missing
  element of a rule-governed sequence or matrix. Language-neutral by design.
- **C2 — Numerical reasoning.** (provisional) A hypothesised ability to reason
  with quantitative relations (series, proportions, arithmetic-logical rules).
  Language-neutral at the level of notation; may require minimal, controlled
  verbal framing.
- **C3 — Spatial/visual reasoning.** (provisional) A hypothesised ability to
  mentally manipulate shapes and orientations (rotation, reflection,
  composition). Language-neutral.
- **C4 — Verbal reasoning.** (provisional) A hypothesised ability to reason
  with language-based relations (analogies, classifications). Inherently
  language-scoped: separate `lt` and `en` versions, not translations (S-002).

### Knowledge — K (provisional)

- **K1 — General/declarative knowledge.** (provisional) Vocabulary, facts, and
  common knowledge in a specific language-culture context. Language-scoped
  (`lt`, `en`).
- **K2 — Domain knowledge (future).** (provisional) Subject-matter knowledge in
  named domains (e.g. science, humanities). Only where content can be sourced
  legally and is age/culture appropriate.

### Speed / efficiency (deferred)

- **S1 — Processing speed.** (deferred) Response speed under time pressure.
  Deferred: measuring it fairly requires careful timing control,
  device/browser variance handling, and validity evidence we do not yet have.
  Listed here so it is not silently assumed into scoring later.

## Working definitions

- **Item:** a single, versioned task with a defined correct answer or scoring
  rubric and a language-scope tag (`neutral`, `lt`, or `en`). See
  `docs/assessment-principles.md`.
- **Test:** a versioned, ordered collection of item references plus timing and
  scoring configuration.
- **Score:** a deterministic function of a response set under a specific
  scoring-rule version (see `docs/assessment-principles.md`). A score describes
  performance on specified, versioned tasks only.
- **Task-performance result:** the explainable output presented to a user: a
  raw or transformed score plus an explicit statement of what it does and does
  not mean.

> The terms "ability estimate" and "knowledge estimate" are **not** used for
> any Sapiens Metric output until validity evidence exists for the intended
> interpretation.

## Explicit non-goals of the model

- No single "g" / IQ composite.
- No personality, clinical, or psychopathological constructs.
- No self-report traits.
- No "multiple intelligences" marketing framing; only constructs that can be
  operationally defined and scored.

## What must exist before any construct is treated as measured

Each construct above needs, in later work:

1. a domain definition that is operationally tied to observable item
   behaviour;
2. a pool of items whose correctness is defensible;
3. reliability evidence;
4. validity evidence for the intended interpretation of scores for the
   proposed use (S-001) (see `docs/validation-norming-gap.md`).

Until these exist, the constructs remain hypotheses about what the items
elicit — never claims of measurement.
