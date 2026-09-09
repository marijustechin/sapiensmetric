# Item-format inventory — Sapiens Metric

Status: draft discovery baseline (T-001). Planning only; no items are authored
or sourced in this task.

## Purpose

List item formats under consideration, map each to the language-scope
classification (`neutral`, `lt`, `en`) from `docs/assessment-principles.md`,
and flag format-specific constraints (scoring, fairness, and the "no
proprietary content" hard constraint).

## Hard constraint (applies to every format)

No copying or reconstruction of proprietary or protected test items (Raven,
Mensa, WAIS, and similar). Every item must be original or from a legally usable
source with recorded provenance (see O-002 in `docs/decisions.md`). Formats
below describe item *shapes*, not specific protected content.

## Language-scope classification recap

- `neutral` — no dependence on a specific language (shapes, numbers, symbols).
- `lt` — authored for Lithuanian speakers.
- `en` — authored for English speakers.

## Formats under consideration

### 1. Matrix / figural series completion

- **Description:** identify the missing cell or next figure in a rule-governed
  visual pattern (shape, colour, count, orientation, position).
- **Language scope:** `neutral`.
- **Scoring:** single correct answer, dichotomous (0/1).
- **Notes/risks:** risk of accidental resemblance to protected matrix tests;
  rules must be independently authored and documented. Feasible to generate
  and verify programmatically.

### 2. Number series / numerical rule

- **Description:** infer the rule and supply the next number(s) in a sequence.
- **Language scope:** `neutral` (notation only; instruction text is localised
  `lt`/`en` but the item core is language-neutral).
- **Scoring:** single correct answer, dichotomous; must guarantee a unique
  rule or accept an explicit intended rule.
- **Notes/risks:** must avoid ambiguity where multiple rules fit; prefer items
  with a single defensible answer.

### 3. Mental rotation / spatial manipulation

- **Description:** identify a rotated/reflected/composed form among options.
- **Language scope:** `neutral`.
- **Scoring:** single correct answer, dichotomous.
- **Notes/risks:** rendering must be device-independent; timing is a
  confound if speed is measured (deferred).

### 4. Verbal analogy / verbal classification

- **Description:** reason about a relation between words (A:B :: C:?).
- **Language scope:** `lt` and `en` as distinct authored versions, not
  translations.
- **Scoring:** single correct answer, dichotomous; distractors must be
  defensible.
- **Notes/risks:** culture-bound; a `lt` and `en` item are separate versioned
  items referencing a common format, not equivalent content (S-002; see
  `docs/assessment-principles.md`).

### 5. Vocabulary / general knowledge

- **Description:** select the definition, synonym, or correct factual answer.
- **Language scope:** `lt` and `en` (distinct content).
- **Scoring:** single correct answer, dichotomous.
- **Notes/risks:** strongly culture- and education-dependent; knowledge items
  target `K`, not `C`, and must be scored/reported separately.

### 6. Logical deduction (syllogism / conditional)

- **Description:** given premises, determine which conclusion necessarily
  follows.
- **Language scope:** `lt` and `en` (distinct authored content).
- **Scoring:** single correct answer, dichotomous.
- **Notes/risks:** wording must be unambiguous; logic content is language-
  dependent in practice, so treated as language-scoped.

### 7. Working-memory / sequencing (deferred)

- **Description:** recall or reorder a briefly presented sequence (e.g.
  digits, positions).
- **Language scope:** `neutral` in principle.
- **Status:** deferred — fair delivery depends on timing and device control we
  do not yet have.

## Formats deliberately excluded for now

- Free-text/essay and constructed-response scoring (requires rubric and
  rater reliability work).
- Adaptive item selection (requires an item-response calibration base that
  does not yet exist).
- Any format that would require reproducing protected instruments.

## Next steps (not part of T-001)

For each format adopted later, record: authoring rules, the intended rule
specification, the language-scope tag, scoring rule version, and provenance.
