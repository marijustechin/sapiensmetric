# T-002 — Initial instrument scope and item-provenance decision proposal (archived)

- **ID:** T-002
- **Archive date:** 2026-09-09
- **Final status:** Approved as a completed decision proposal (human review granted)

> Note: approval concerns the completeness of the proposal, not its content as
> product decisions. The five product-owner decisions remain open.

---

## Original task definition

# T-002 — Initial instrument scope and item-provenance decision proposal

- **ID:** T-002
- **Status:** Ready for human review
- **Type:** Planning / research (no implementation)

### Context

- The first public instrument is primarily for curious adults seeking a
  transparent report of their performance on specified tasks.
- It is not for school assessment, clinical use, recruitment, or employment
  decisions.
- It must remain within Tier 0 of `docs/claims-ladder.md`.
- The product is Lithuanian and English, but the first instrument should favour
  language-neutral content where that materially reduces language bias.

### Objective

Produce decision-ready proposals for the first instrument's narrow scope and
for the mandatory provenance policy required before any item authoring can
begin. The task must recommend a direction but must not silently make the
product-owner decisions.

### Inputs

- `AGENTS.md`
- `docs/assessment-principles.md`
- `docs/measurement-model.md`
- `docs/item-format-inventory.md`
- `docs/claims-ladder.md`
- `docs/validation-norming-gap.md`
- `docs/research-open-questions.md`
- `docs/decisions.md`
- `tasks/done/2026-09-09-product-and-psychometric-discovery-baseline.md`

### Required outputs

1. **`docs/initial-instrument-options.md`** — 2–3 feasible first-instrument
   scope options; target user, intended task-performance report,
   included/excluded construct targets, language handling, timing position,
   and main risks; a clearly labelled recommended option and rationale.
2. **`docs/initial-instrument-decision-brief.md`** — the exact product-owner
   decisions required; consequences of each choice; a recommendation;
   explicitly state that this is not a validity claim or public test
   specification.
3. **`docs/item-provenance-policy-proposal.md`** — original-item authorship
   rules; prohibited similarity/reconstruction rules; source/licence review
   requirements; reviewer and approval trail; minimum metadata per future
   item; correction/withdrawal procedure.
4. **`docs/t002-research-sources.md`** — authoritative sources, same
   source-record format as T-001.

### Required evidence

- Authoritative scholarly, standards-body, primary institutional, or original
  legal/regulatory sources only for factual claims.
- No claim that any proposed instrument measures a cognitive construct until
  evidence exists.
- Cite sources inline where they materially support a claim.

### Non-goals

- No test item authoring or sourcing.
- No data collection.
- No implementation or schema design.
- No selection of a test runner.
- No legal/compliance conclusion.

### Acceptance criteria

- All four documents exist and are consistent with T-001.
- The recommended option remains Tier 0-compliant.
- The policy is concrete enough to govern the first future item-authoring task.
- Open decisions are updated only where evidence supports a decision.
- No implementation artefacts exist.

### Required reading order

1. `AGENTS.md`
2. `docs/assessment-principles.md`
3. `docs/measurement-model.md`
4. `docs/item-format-inventory.md`
5. `docs/claims-ladder.md`
6. `docs/validation-norming-gap.md`
7. `docs/research-open-questions.md`
8. `docs/decisions.md`
9. `tasks/done/2026-09-09-product-and-psychometric-discovery-baseline.md`

---

## Completion report

```text
T-002 — Completion report
--------------------------
Status: Approved as a completed decision proposal (human review granted)
Outputs produced (list each required output and its location):
  docs/initial-instrument-options.md
  docs/initial-instrument-decision-brief.md
  docs/item-provenance-policy-proposal.md
  docs/t002-research-sources.md
Decisions recommended (product-owner decision points):
  Decision 1 — scope (recommend Option A, language-neutral reasoning);
  Decision 2 — timing (recommend untimed);
  Decision 3 — language handling (recommend neutral-shared model);
  Decision 4 — provenance gating (approve policy before authoring);
  Decision 5 — report wording (confirm Tier 0).
Open questions remaining:
  OQ-1–OQ-9 remain open. No open decision (O-001–O-007) was resolved.
What was intentionally NOT done:
  No items authored/sourced/adapted/reconstructed/collected; no code, schema,
  UI, API, dependencies, package scaffolding, or database configuration; no
  commit/push; no legal/IP or compliance conclusion.
Blockers / dependencies for the next task:
  Product-owner approval of the provenance policy and of scope (Option A) is
  required before any item-authoring task; a copyright/IP review (O-007) and a
  data-protection/privacy review (O-006) remain separate prerequisites.
```

---

## Approved-outcome summary

T-002 produced decision-ready proposals for the first instrument's scope and
for the mandatory item-provenance policy, without making the product-owner
decisions and without authoring or sourcing any items. The recommended option
(Option A — language-neutral reasoning, untimed, neutral-shared language
handling) and the other recommendations are proposals only, not recorded
product decisions. The provenance policy is an internal risk-control proposal
that requires product-owner approval before item authoring and a separate
copyright/IP review (O-007) before any reliance on third-party material or any
legal clearance is assumed. No implementation artefacts were produced.

## Produced documents

- `docs/initial-instrument-options.md`
- `docs/initial-instrument-decision-brief.md`
- `docs/item-provenance-policy-proposal.md`
- `docs/t002-research-sources.md`

## Source IDs used

- S-001 — AERA/APA/NCME, *Standards for Educational and Psychological Testing* (2014)
- S-002 — ITC, *Guidelines for Translating and Adapting Tests* (2nd ed., 2017)
- S-003 — Regulation (EU) 2016/679 (GDPR), EUR-Lex
- S-004 — McGrew (2009), CHC theory and the human cognitive abilities project, *Intelligence* 37(1), 1–10
- S-005 — Berne Convention (WIPO)
- S-006 — Directive 2001/29/EC (InfoSoc)
- S-007 — TRIPS Agreement, Article 9(2) (WTO)

## Product-owner decisions (still open)

- Decision 1 — First-instrument scope (recommend Option A)
- Decision 2 — Timing position (recommend untimed)
- Decision 3 — Language handling of the instrument shell (recommend
  neutral-shared)
- Decision 4 — Provenance gating (approve policy before authoring)
- Decision 5 — Report wording (confirm Tier 0)

These are proposals; none has been recorded as a product decision.

## Confirmation

No implementation or items were created. No test items authored or sourced; no
data collection; no code, schema, UI, API, dependencies, database
configuration, commit, or push. No legal/IP or compliance conclusion was made.
