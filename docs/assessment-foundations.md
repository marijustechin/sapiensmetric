# Assessment foundations — Sapiens Metric (T-015)

Status: **T-015 proposal for human review (READY_FOR_HUMAN_REVIEW)**. This
document records **owner product direction** and a set of **methodological
proposals**. It is not a validity claim, not a public test specification, and not
approved policy. Nothing here authorises implementation. Open decisions
(O-002, O-003, O-006, O-007) remain open; the T-002 proposals remain proposals.

Companion documents produced by T-015:

- `docs/knowledge-pilot-spec.md` — the bounded first knowledge pilot (proposal).
- `docs/pilot-item-samples.md` — 6–8 original bilingual review drafts.
- `docs/assessment-sources.md` — the T-015 source register (S-008…S-013).

Binding context that this document must stay within: `AGENTS.md`,
`docs/product-brief.md`, `docs/assessment-principles.md`,
`docs/claims-ladder.md`, `docs/validation-norming-gap.md`,
`docs/decisions.md` (D-006/D-007/D-008/D-025…D-027 and O-002/O-003/O-006/O-007),
and the `packages/assessment` boundary (pure TypeScript, no UI/framework/DB).

## Owner-approved content-selection principle (2026-09-28)

The owner has approved this central content-selection principle:

> "We include a question because understanding its subject helps a person make
> sense of the world—and we can explain why it matters."

This principle covers **cultural understanding, historical perspective,
scientific understanding, and informed judgment**. **Relevance must not be
reduced to immediate practical or employment utility.** Every objective and every
item in the pilot therefore carries a short **"Why this matters"** rationale
describing its contribution to making sense of the world — not merely an assertion
that the fact is authoritative. See `docs/knowledge-pilot-spec.md` and
`docs/pilot-item-samples.md`.

### Audience and purpose (owner direction)

- **Initial target audience: European**, with **EN (default) / LT** delivery.
- **Broader purpose:** a **defensible foundation of general literacy for
  contemporary global life**.
- **Geography guides presentation and context; it does not restrict whose
  literature, history, or scientific contributions may be included.**
- **Not claimed:** a universal curriculum, a population-wide knowledge standard,
  or secondary-school qualification equivalence.
- **Astronomy is a *proposed* first pilot** (this document's recommendation), not
  an approved subject and not the full product direction. Every other
  methodological choice here remains a **proposal** unless explicitly approved.

### Document status separation (applies throughout T-015)

1. **Owner-approved (2026-09-28):**
   - the content-selection principle above and the product direction in §2
     (audience framing included);
   - **astronomy as the first knowledge pilot**;
   - **adults-only (18+)** initial audience;
   - a **25-item proposed form** (5 per objective) — **final item composition
     remains subject to content review**;
   - **documented provenance, sources, and independent content/language review
     before publication** — approving this policy does **not** mean the draft
     items have passed review;
   - **post-submission answers, explanations, and sources**;
   - **a clearly labelled learning repeat** when insufficient unseen items remain,
     distinct from a fresh assessment, with **no** claim that score increases
     demonstrate independent improvement;
   - **descriptive raw results only**, within the existing claims boundaries.
2. **Proposed by T-015 (not approved)** — the remaining scoring/contract detail,
   the future assessment data contract, and the next implementation slice.
3. **Required reviews/decisions (not done)** — independent subject and language
   review (assignment **and** completion), an IP review (O-007), a data-protection
   review (O-006), and a validation/norming plan (O-003). See §9 and
   `docs/knowledge-pilot-spec.md` §13.

AI drafting and editing is **not** independent subject-matter or language review;
no item is presented as reviewed or validated.

## 1. How T-015 relates to the open decisions and the T-002 proposals

- **O-002 (item/content sourcing policy).** The owner **approved the policy
  direction** in T-015 (D-T015-6): documented provenance, sources, and independent
  content/language review **before publication**. This is **policy approval, not
  review of individual items** — the draft items remain **unreviewed**, the
  operational two-role review trail is not yet running, and no IP review (O-007)
  has occurred.
- **O-003 (norming & validation roadmap).** T-015 does **not** set a norming plan
  or sample size. It states what evidence would be required and what a specialist
  must design (`section 7`).
- **O-006 (data protection & governance).** T-015 does **not** decide consent,
  retention, or access. It proposes a minimum operational data set and leaves
  retention/consent and access boundaries explicitly **open** (`section 6`).
- **O-007 (copyright/IP provenance review).** T-015 does **not** perform or claim
  an IP review. Item drafts are marked unvalidated and not cleared for publication.
- **T-002 proposals** (`docs/initial-instrument-options.md`,
  `docs/initial-instrument-decision-brief.md`,
  `docs/item-provenance-policy-proposal.md`) remain **proposals**. T-015 adds a
  knowledge-focused first-pilot recommendation; it does **not** overwrite or
  approve the T-002 cognitive-instrument options, and it does not treat any of
  them as owner-approved.

Where T-015 recommends something that would require a product-owner decision, it
is labelled **[Proposal]** and listed again in `section 9` as a decision for the
owner, with a recommended default. T-015 never records a decision on the owner's
behalf and does not create new decision IDs.

## 2. Product direction (owner requirements — recorded, not merely proposed)

The following are captured directly from the current owner direction:

1. Provide **meaningful, honest information** about knowledge and abilities —
   no inflated or entertainment framing.
2. Keep **knowledge assessment and cognitive-ability assessment distinct**. A
   knowledge result is not an ability result, and vice versa.
3. **Eventually** support general-education subjects: literature, geography,
   astronomy, world history, and other general-education subjects. (Subject
   coverage grows over time; the first pilot is deliberately small.)
4. **Require registration to take assessments**; provide **private result
   history** and **useful statistics**.
5. **Reduce answer memorisation and repeated-attempt score inflation without
   treating genuine learning as cheating.**
6. Support **English and Lithuanian**, with **English as the default**.
7. **Explore monetisation later**; it must **not distort scoring** and must not
   introduce a **surprise payment requirement to see the promised basic result**.

**Initial intended use:** educational **self-assessment**. Claims must not be
clinical, hiring, qualification, or school-equivalence claims
(`docs/claims-ladder.md`; `AGENTS.md`).

### 2.1 Knowledge vs cognitive ability (binding for reporting)

- A **knowledge** score describes performance on **specified, versioned content
  objectives** (e.g. selected astronomy facts/concepts). It is **not** a measure
  of intelligence, aptitude, or "general knowledge" as a trait.
- An **ability** score (C1–C4 in `docs/measurement-model.md`) describes
  performance on **specified reasoning tasks** and, even then, is only ever a
  task-performance result until reliability/validity evidence exists.
- The two must not be merged into a single headline number, and a knowledge
  module must never be described as "IQ", a percentile, or an ability estimate.

## 3. The first knowledge pilot — approved (summary)

**Owner-approved: an "Astronomy essentials" knowledge module for adults** —
identifiable secondary-science content (Solar System structure/scale; Earth's
motions and seasons; Moon phases and eclipses; object classification). Full
specification and rationale are in `docs/knowledge-pilot-spec.md`, which compares
two alternatives (physical geography; world history) and explains why astronomy
is the cleanest first subject (objective, internationally sourced answer keys;
stable facts; low contested content; supports comprehension/application items as
well as recall).

Astronomy as the first pilot (D-T015-1) and the adults-only initial audience
(D-T015-2) are **owner-approved** (2026-09-28). The 25-item form is approved as a
proposed form; **final item composition remains subject to content review**, and
approval of the subject does not approve the draft items.

## 4. Learning vs assessment, feedback exposure, and retakes (`section 5`)

**[Proposal]** — one coherent initial policy; none of it is implemented.

### 4.1 The contradiction, resolved

Showing an item's answer and explanation **exposes** that item to the participant.
Separate practice pools reduce, but do not eliminate, exposure (a participant can
still read assessment feedback). The policy cannot promise both full item
explanations **and** a permanently unexposed assessment bank, and it cannot treat
**random** forms as equally difficult. The initial policy therefore trades some
repeat-attempt freshness for educational feedback, and manages that trade-off
explicitly.

### 4.2 The initial policy

- **Pools.** A public **practice** pool (immediate per-item feedback) and a
  non-public **assessment** pool. The two pools do not overlap; practice never
  shows active assessment items.
- **What feedback is shown, and when.**
  - During an assessment attempt: no answers and no correctness signals.
  - After **explicit final submission**: per-item correctness, a short
    explanation, and the source for the items the participant actually saw, plus
    the objective-level summary. Feedback is objective-level, never an ability
    claim.
  - Practice items: immediate explanation.
- **Exposure recording and use.** Every presented item records an exposure event
  (participant, attempt, date, order). After submission, those assessment items
  are marked **"exposed to this participant"** and are **not re-served to that
  participant** in later assessment attempts while fresh items remain.
- **When insufficient unseen items remain — learning repeat.** Use previously seen
  items in a clearly labelled **learning repeat**, explicitly distinct from a fresh
  assessment: the result is more practised/familiar and **not directly
  comparable** to the first attempt, and a score increase must **not** be presented
  as independent improvement. Growing the bank via the item-review pipeline is the
  real fix.
- **Forms.** Multiple forms are built from the same objective blueprint.
  **Random selection alone does not make forms equally difficult**; form
  difficulty may differ and must be *established*, not assumed (S-001/S-008).
- **Repeat limits/intervals.** No immediate same-form re-serve; repeat attempts
  are labelled. The interval is an **operational** choice, not a
  research-supported rule, until data exist.
- **What repeat results can and cannot mean.** A learning repeat can show practice
  on the specific items/objectives; it **cannot** be treated as a fresh, equivalent
  measurement, and is **not** comparable to a first attempt without equating
  evidence. Saved history is **descriptive** (a list of past attempts); it is not a
  measure of progress and does not demonstrate improvement.
- **Registration limits, honestly.** Registration gives identity, private history,
  and a consistent locale/version record; it **cannot** prevent multiple accounts,
  outside assistance, or AI use, and cannot prove unsupervised conditions. No
  "cheat-proof" claim. A score increase is not automatically cognitive improvement
  (it may reflect learning, familiarity, exposure, or assistance).

### 4.3 Trade-offs (recorded)

- Feedback aids learning but consumes items: each explained item is exposed.
- Withholding feedback protects the bank but weakens the educational purpose.
- The initial choice favours **educational feedback for seen items**, and manages
  integrity with exposure tracking, repeat labels, an explicit non-comparability
  caveat, and bank growth — accepting that repeats are less comparable.
- It does **not** claim random forms are equivalent, nor that the bank stays
  unexposed.

## 5. Future assessment contract (specification, not implemented) (`section 6`)

A **[Proposal]** for the minimum information needed to reproduce a result. It
must stay consistent with the existing API and the pure
`@sapiensmetric/assessment` package. Nothing here is implemented in T-015.

### 5.1 Versions (must be recorded on every result)

- `assessmentVersion` — the versioned test/blueprint configuration.
- `itemId` + `itemVersion` — per presented item.
- `translationVersion` / `languageScope` (`neutral` | `lt` | `en`) — per item
  presentation (D-007; S-002).
- `formId` + `formVersion` — the assembled form.
- `scoringRuleVersion` — the exact rules that produced the score (D-008).

### 5.2 Attempt record

- `attemptId`; `userId`; `locale` (`en` default); `formId`;
  presented **item order**; issued timestamps; lifecycle state
  (`started` → `submitted` | `abandoned`).
- **Responses**: selected option(s) / constructed value per item, with timestamps.
- **Finalised vs unfinished.** Only an **explicitly submitted** attempt receives a
  final comparable score, computed over the **full form denominator** (skipped
  items = 0, reported separately). An **unfinished/abandoned** attempt shows
  progress and an **incomplete** status only; it is **not** assigned a comparable
  score and is excluded from comparable history statistics.
- **Score** + the `scoringRuleVersion` and the exact inputs used.
- **First/repeat** flag and the **exposure** information of presented items.
- **Feedback version** and the administration conditions that affect
  interpretation (e.g. interrupted vs completed).

### 5.3 Scoring and answer keys

- **Server-side answer keys and authoritative scoring.** The client must not
  receive correct answers for live assessment items; scoring is performed by the
  deterministic pure `@sapiensmetric/assessment` package, invoked server-side,
  with the result persisted by the API.
- Scoring is a pure function of (responses, item versions, scoring-rule version),
  so the same inputs reproduce the same score.

### 5.4 Data minimisation, access boundaries, and open retention

- **Operational records (minimum):** user id, attempt lifecycle, locale, form and
  item versions, responses, score, timestamps, first/repeat, exposure counts.
- **Optional research data (separate, opt-in, and out of scope here):** anything
  beyond the operational minimum (e.g. additional demographics) must be a
  **separate** collection with its own purpose/consent step and governance.
- **Access boundaries [Proposal]:** a user can read only their own attempts and
  results; administrators read only what operations require, with audit; no
  third-party analytics access to responses/results.
- **Retention is an open decision (O-006):** no retention period is set here.
- **Analytics boundary (binding, from D-025/D-027):** assessment responses and
  results must **not** be sent to GA4/GTM. Analytics stays limited to the
  consent-gated, sanitised public-site page views already implemented.

### 5.5 Dependency

Live **registered** assessments depend on the **API being deployed** — it is
currently unpublished (`https://api.sapiensmetric.eu` is planned, not deployed;
D-026). This is a **dependency**, not part of T-015; T-015 does not scope API
deployment.

## 6. Evidence required for future ability scores (`section 7`)

In plain language (sources: S-001, S-002; `docs/validation-norming-gap.md`,
`docs/claims-ladder.md`):

- **Reliability** — how consistently the instrument measures under the stated
  conditions (internal consistency and/or test–retest). Needed before Tier 1
  statements.
- **Validity for a stated use** — the degree to which evidence and theory support
  a *specific interpretation of scores for a specific use*. Validity is never
  abstract; it is claimed for a use (e.g. "describes performance on these
  objectives", not "measures intelligence").
- **Measurement uncertainty** — scores carry error; reporting must reflect a
  range/uncertainty, not a false-precision single number.
- **Fairness** — evidence that the instrument functions comparably across groups
  and languages (EN/LT) relevant to the intended use.
- **Norms** — norm-referenced statements require a **defined target population**
  and a **representative sample**.

Additional plain-language points:

- **Self-selected site visitors are not automatically a representative norming
  sample.** Convenience samples are biased by who visits, who opts in, and who
  completes; norms require a designed sampling plan.
- **Translating a test does not establish EN/LT equivalence** (S-002). An adapted
  version is a distinct, versioned instrument whose equivalence must be
  demonstrated, not assumed.
- **Arbitrary question weights or rescaling raw scores cannot produce a
  defensible IQ score.** No linear transform of a raw score becomes an IQ; that
  requires a validated construct, norming, and a defensible scaling model.
- **Independent specialists are required:** an independent psychometric
  specialist for design/analysis, and **subject-matter and language reviewers**
  for content and translation. **AI drafting is not independent review** — the
  draft items in `docs/pilot-item-samples.md` are explicitly unreviewed.
- **Claims-ladder movement** happens only when the evidence for the next tier
  exists and is recorded (`docs/claims-ladder.md`).

**No universal minimum sample size and no guaranteed timeline to a validated IQ
test are asserted.** Those are research-design questions the psychometric
specialist and study plan must determine (O-003). The repository must not imply a
promised path or date.

### 6.1 Later item review and pilot analysis (what a small sample cannot show)

A later pilot analysis should cover: **ambiguity/unintended interpretations**,
**difficulty**, **discrimination**, **distractor behaviour (including non-
functioning distractors)**, **reliability where appropriate**, **language
differences (EN/LT)**, and **item revision**. From a **tiny convenience sample**
one may at most triage gross ambiguity and technical faults; one **cannot**
establish item difficulty calibration, discrimination, reliability, equivalence,
or norms. Those require designed samples and specialist analysis.

## 7. Scoring core and bounded next slices

**Implemented under T-016 (deliverable for human review):** the pure versioned
scoring core in `@sapiensmetric/assessment` — versioned form snapshots,
validation, deterministic scoring for single-answer, multiple-select, ordering,
and numeric items (inclusive absolute tolerance), and a browser-safe projection.
See `docs/assessment-scoring.md`. It is not a psychometric result and does not
validate any assessment content; the draft items remain unreviewed.

**Proposed next slice (not started or authorised)**, gated on the remaining
prerequisites (§9.2) and on O-002/O-007 for item approval:

1. **Item review pipeline** (documentation/process first): the two-role review
   (author + independent reviewer) required by the provenance policy, applied to
   the draft items before any are eligible for a form.
2. **Session-form assembly and pilot delivery design** (documentation): the
   presentation order/objective blueprint assembly, the attempt lifecycle,
   server-side key handling, data-minimisation fields, and feedback templates,
   ready for a future API task.

It deliberately excludes: runtime UI, database migrations, endpoints, adaptive
testing, speed measurement, and any ability/IQ construct. API deployment remains a
separate future dependency (`section 5.5`).

## 8. Document map

- Product direction and binding boundaries: `docs/product-brief.md`,
  `docs/assessment-principles.md`, `docs/claims-ladder.md`.
- Proposed first pilot: `docs/knowledge-pilot-spec.md`.
- Draft item sample: `docs/pilot-item-samples.md`.
- Evidence requirements: this document (`section 6`),
  `docs/validation-norming-gap.md`.
- Sources: `docs/assessment-sources.md` (T-015), `docs/research-sources.md`
  (T-001), `docs/t002-research-sources.md` (T-002).
- Decisions and open questions: `docs/decisions.md`.

## 9. Approved decisions and remaining prerequisites

### 9.1 Approved (2026-09-28)

- **D-T015-1 — Pilot subject: astronomy** (first knowledge pilot).
- **D-T015-2 — Adults-only (18+)** initial audience.
- **D-T015-5 — A 25-item proposed form** (5 per objective); **final item
  composition subject to content review**.
- **D-T015-6 — Documented provenance, sources, and independent content/language
  review before publication.** Approving this policy does **not** mean the draft
  items have passed review.
- **D-T015-7 — Descriptive raw results** within the existing claims boundaries.
- **D-T015-8 — Feedback / retake / exposure (§4.2):** post-submission answers,
  explanations, and sources; exposure recorded and not re-served while fresh items
  remain; a clearly labelled **learning repeat** (not a fresh assessment, and not
  independent improvement) when unseen items run out; no "cheat-proof" and no
  random-forms-equivalent claim.

### 9.2 Remaining prerequisites (pending; not done)

- **Independent subject-matter reviewer** (astronomy): assignment and completion.
  **Pending; not assigned.**
- **Independent EN/LT language reviewer(s):** assignment and completion.
  **Pending; not assigned.**
- **Operational two-role review trail** for items (author + independent reviewer).
- **O-006** data-protection/governance, **O-007** IP review, and **O-003**
  validation/norming plan for anything beyond Tier 0.
- **API deployment** for live registered assessments.

No reviewer is invented and no review is claimed complete.

## 10. Explicit non-claims of T-015

- No validity, reliability, norming, equivalence, or mastery claim.
- No claim that a small module represents what "every secondary-school graduate
  worldwide must know".
- No clinical, hiring, qualification, or school-equivalence claim.
- No claim that the draft items are reviewed, calibrated, or production-ready.
- No decision is recorded on the owner's behalf; open decisions stay open.
