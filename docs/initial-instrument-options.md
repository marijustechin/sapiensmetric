# Initial instrument options — Sapiens Metric

Status: T-002 decision proposal (draft for product-owner review). This document
proposes options and a recommendation; it does not make the product-owner
decision, and it makes no validity claim and no claim that any instrument
measures a cognitive construct.

## Purpose

Present 2–3 feasible scope options for the first public instrument, each with
the same structure, and a clearly labelled recommendation. The first
instrument must remain within Tier 0 of `docs/claims-ladder.md`: it reports
performance on specified, versioned tasks and never labels a score as an
ability estimate, knowledge estimate, IQ, or a measure of an abstract construct.

## Shared constraints (all options)

- **Target user:** curious adults who want a transparent report of their
  performance on specified tasks. Not for school assessment, clinical use,
  recruitment, or employment decisions.
- **Report form:** task-performance report — raw score(s) per item type, an
  explanation of what the number does and does not mean, and explicit
  "pre-validation, not scientifically validated" language (Tier 0).
- **Timing position:** untimed (power) delivery. Speed (`S1`) is deferred in
  `docs/measurement-model.md`; no speed measurement is included, so no
  timing-based claims are possible or attempted.
- **Language handling for the instrument shell:** UI and instructions
  localised in Lithuanian (`lt`) and English (`en`). Language-neutral item
  content is authored once and shared across both presentations
  (`docs/assessment-principles.md`).
- **Provenance:** every item must satisfy the provenance policy in
  `docs/item-provenance-policy-proposal.md` before authoring.

---

## Option A — Language-neutral reasoning (narrow)

- **Target user:** curious adults (both `lt` and `en` speakers) with no
  language-specific content advantage.
- **Intended task-performance report:** a raw score per task type (e.g.
  pattern completion, number series, spatial), with a plain-language
  explanation. No composite ability score.
- **Included construct targets (provisional labels only):** C1 (fluid
  reasoning / pattern induction), C2 (numerical reasoning), C3 (spatial/visual
  reasoning). All are language-neutral item families from
  `docs/item-format-inventory.md` (formats 1, 2, 3).
- **Excluded:** C4 (verbal reasoning) and K1/K2 (knowledge) — both
  language-scoped and therefore excluded to minimise language bias.
- **Language handling:** language-neutral items; only instruction text is
  localised `lt`/`en`. No per-language item variants.
- **Timing position:** untimed.
- **Main risks:** residual resemblance risk of matrix/figural items to
  protected instruments (managed by the provenance policy); narrower perceived
  "coverage" than a mixed instrument (managed by honest Tier 0 framing).

## Option B — Reasoning + verbal (bilingual)

- **Target user:** curious adults; those who prefer language-based tasks.
- **Intended task-performance report:** raw score per task type, including a
  verbal-reasoning score reported per language (`lt` and `en` separately).
- **Included construct targets (provisional):** C1, C2, C3 (neutral) plus C4
  (verbal reasoning) as distinct `lt` and `en` authored versions.
- **Excluded:** knowledge (K1/K2).
- **Language handling:** neutral items shared; verbal items are separate,
  versioned `lt`/`en` items (not translations) per `docs/assessment-principles.md`
  (S-002).
- **Timing position:** untimed.
- **Main risks:** verbal items are culture- and education-bound; per-language
  authoring doubles the provenance and review burden; any temptation to merge
  `lt`/`en` verbal scores into one "verbal reasoning" number would overstep
  Tier 0 and must be prohibited.

## Option C — Broad mixed (reasoning + knowledge)

- **Target user:** curious adults wanting a broad "knowledge and reasoning"
  report.
- **Intended task-performance report:** raw score per task type across
  reasoning and knowledge families.
- **Included construct targets (provisional):** C1–C4 plus K1 general
  knowledge.
- **Excluded:** K2 domain knowledge (future).
- **Language handling:** neutral items shared; verbal and knowledge items as
  distinct `lt`/`en` authored versions.
- **Timing position:** untimed.
- **Main risks:** highest language/culture bias; largest provenance and review
  surface; hardest to keep Tier 0-compliant because knowledge items invite
  "you scored X on general knowledge" framing that is easy to misread as an
  ability claim; most scope creep risk.

---

## Recommended option

**Recommendation: Option A — Language-neutral reasoning (narrow).**

Rationale:

1. **Language fairness first.** The task context explicitly favours
   language-neutral content where it materially reduces language bias. Option A
   is the only option with zero per-language item content, which best satisfies
   this requirement.
2. **Smallest provenance surface.** One canonical item set, shared across `lt`
   and `en`, minimises the authoring and review load and reduces the
   resemblance-to-protected-instruments risk to the manageable matrix/figural
   family.
3. **Cleanest Tier 0 report.** Reporting performance on three concrete,
   language-neutral task types is straightforwardly honest and least likely to
   drift into ability or knowledge claims.
4. **Fastest credible path to an item pool** that a future validation/norming
   programme (O-003) could build on, without prematurely committing to
   language-scoped content.

Options B and C remain recorded as alternatives if the product owner chooses
broader coverage, accepting the additional language-handling and provenance
costs documented above.

## Non-goals of this document

This is not a validity claim and not a public test specification. The
construct labels above are provisional vocabulary only (`docs/measurement-model.md`);
they do not assert that the proposed instrument measures any construct.
