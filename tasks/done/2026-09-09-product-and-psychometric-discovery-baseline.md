# T-001 — Product and psychometric discovery baseline (archived)

- **ID:** T-001
- **Archive date:** 2026-09-09
- **Final status:** Approved (human approval granted)

---

## Original task definition

# T-001 — Product and psychometric discovery baseline

- **ID:** T-001
- **Status:** Ready for human review
- **Type:** Planning / research (no implementation)

### Objective

Establish a written discovery baseline that grounds every later implementation
task: what the product measures, how it measures it without infringing
protected instruments, what claims it may make today, and what evidence must
exist before stronger claims become permissible.

### Inputs

- `AGENTS.md`
- `docs/product-brief.md`
- `docs/assessment-principles.md`
- `docs/architecture.md`
- `docs/decisions.md`

### Required outputs

All outputs are written to the `docs/` directory. Exact locations:

1. **Measurement model sketch** → `docs/measurement-model.md`. The constructs
   (e.g. reasoning, knowledge, processing) the platform intends to measure,
   with working definitions.
2. **Item-format inventory** → `docs/item-format-inventory.md`. Item types
   under consideration, mapped to the language-neutral / Lithuanian / English
   classification.
3. **Claims ladder** → `docs/claims-ladder.md`. The exact wording permitted
   today vs. wording that requires norming/validity evidence, keyed to the
   boundaries in `docs/assessment-principles.md`.
4. **Validation & norming gap analysis** → `docs/validation-norming-gap.md`.
   What is missing before reliability, validity, and representative norms can
   be claimed.
5. **Research / open-questions list** → `docs/research-open-questions.md`.
   Unresolved questions that block later implementation, each with a proposed
   owner and next step.
6. **Research sources** → `docs/research-sources.md`. Every source used,
   recording for each: the source, its URL/DOI, publication or access date,
   the claim it supports, and any limitation.
7. **Updates to `docs/decisions.md`** — only where evidence genuinely supports
   a decision. Where evidence is insufficient, the question stays open; do not
   resolve an open decision by default or merely because the task mentions it.

### Evidence standards

Psychometric and scientific claims require authoritative sources: standards
bodies, peer-reviewed research, primary institutional sources, or original
legal/regulatory sources. Marketing pages, generic blogs, and unsupported AI
assertions cannot be used as evidence.

### Non-goals

- No application source code, UI, API, database schema, or deployment config.
- No test items authored or sourced (planning only; no content production).
- No psychometric data collection or studies started.
- No scaffolding of the monorepo packages.

### Acceptance criteria

- All required outputs exist as documents in `docs/` (or referenced there).
- The claims ladder is consistent with `docs/assessment-principles.md` and uses
  no prohibited claims.
- The item-format inventory respects the "no proprietary content" hard
  constraint and the language-scope classification.
- `docs/decisions.md` is updated and the open-decisions section reflects any
  resolutions.
- No implementation artefacts were produced.

### Required reading order

1. `AGENTS.md`
2. `docs/product-brief.md`
3. `docs/assessment-principles.md`
4. `docs/architecture.md`
5. `docs/decisions.md`
6. `docs/testing.md`

---

## Completion report

```text
T-001 — Completion report
--------------------------
Status: Approved (human approval granted)
Outputs produced (list each required output and its location):
  docs/measurement-model.md
  docs/item-format-inventory.md
  docs/claims-ladder.md
  docs/validation-norming-gap.md
  docs/research-open-questions.md
  docs/research-sources.md
Decisions resolved (reference decision IDs):
  None. T-001 did not resolve O-001–O-006; an explicit note to this effect was
  added to docs/decisions.md.
Open questions remaining (from research list):
  OQ-1 constructs; OQ-2 language fairness; OQ-3 item sourcing; OQ-4 scoring;
  OQ-5 norming population; OQ-6 test runner; OQ-7 data protection; OQ-8 timing.
What was intentionally NOT done:
  No app/UI/API/schema code, no test items authored or sourced, no data
  collection, no monorepo scaffolding, no dependencies, no commit/push.
Blockers / dependencies for the next task:
  OQ-1/OQ-3/OQ-7 must be resolved before item authoring; OQ-7 (legal/privacy
  review) must precede any data collection.
```

---

## Approved-outcome summary

T-001 established the discovery baseline that grounds all later implementation.
It produced a provisional measurement model, an item-format inventory, a claims
ladder, a validation/norming gap analysis, an open-questions list, and a
research-sources register, all consistent with the scientific and ethical
boundaries in `docs/assessment-principles.md` and the evidence standard in the
task. No open decisions were resolved (none had sufficient evidence); O-001 was
explicitly deferred to the first assessment-package scaffold task. The database
environment facts (MySQL Community Server 8.0.46-cll-lve, utf8mb4, TypeORM +
mysql2) were recorded in D-003/D-004 and `docs/architecture.md` without any
implementation.

## Produced documents

- `docs/measurement-model.md`
- `docs/item-format-inventory.md`
- `docs/claims-ladder.md`
- `docs/validation-norming-gap.md`
- `docs/research-open-questions.md`
- `docs/research-sources.md`

## Source IDs used

- S-001 — AERA/APA/NCME, *Standards for Educational and Psychological Testing* (2014)
- S-002 — ITC, *Guidelines for Translating and Adapting Tests* (2nd ed., 2017)
- S-003 — Regulation (EU) 2016/679 (GDPR), EUR-Lex
- S-004 — McGrew (2009), CHC theory and the human cognitive abilities project, *Intelligence* 37(1), 1–10

## Confirmation

No product implementation occurred: no application source code, UI, API,
database schema, test items, data collection, dependencies, or monorepo
scaffolding were produced. No commit, push, or PR was made.
