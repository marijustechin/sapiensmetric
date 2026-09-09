# Item provenance policy proposal — Sapiens Metric

Status: T-002 policy proposal (draft for product-owner review). This is a
proposal, not an approved policy and not a legal conclusion. Before any item
is authored, this policy must be approved by the product owner and the review
trail below must be operational.

## Purpose

Prevent copying or reconstruction of proprietary or protected test instruments
(the hard constraint in `AGENTS.md`) and ensure every future item carries
verifiable provenance. This is an **internal risk-control policy**, not a
statement of law and not a legal clearance. Whether the policy is legally
adequate, and whether any specific item or third-party use is lawful, are
questions for a copyright/IP expert (O-007); no IP review has occurred and no
legal clearance is claimed here.

## Guiding stance on third-party material

Because copyright protection and the boundaries of what is and is not
protectable are legal questions that this policy does not decide, the policy
takes a conservative default: treat third-party prompts, distractors, visuals,
layouts, and item banks as **unusable** unless a recorded permission, licence,
or a documented public-domain/open-licence basis exists. The absence of an
obvious "owner" or of an obvious infringement is not treated as clearance.

## 1. Original-item authorship rules

1.1 Every item is authored independently by a named author, from a written
    rule specification, with no copying from any external item bank or
    protected instrument.

1.2 Each item has a written "intended rule" document that states the rule the
    item instantiates, the correct answer, and the rationale for distractors.

1.3 Language-neutral items are authored once and shared across `lt`/`en`;
    language-scoped items are authored as distinct, versioned items per
    language (S-002).

1.4 An author attestation is recorded per item: "I authored this item
    independently; it does not reproduce or reconstruct any protected test
    item or other copyrighted expression known to me."

## 2. Prohibited similarity / reconstruction rules

2.1 Prohibited: copying, paraphrasing, or mechanically transforming any item
    from a protected instrument (Raven, Mensa, WAIS, and similar).

2.2 Prohibited: "look-alike" reconstruction — designing an item to reproduce
    the specific expression (wording, visual design, distractor structure, or
    rule sequence) of a known protected item.

2.3 Independent authoring of an original item that tests the same general idea
    or format family (e.g. a rule-governed matrix task) is not automatically
    prohibited, but the idea/expression distinction described in TRIPS
    Article 9(2) (S-007) does **not** provide clearance for any concrete item.
    A superficially similar item must be quarantined and reviewed; the policy
    does not decide infringement.

2.4 A "similarity flag" is raised whenever an item's stem, options, or visual
    is recognisably close to a known protected item; flagged items are
    quarantined pending review and cannot ship.

## 3. Source / licence review requirements

3.1 If any third-party source is used at all (including for inspiration,
    wording, prompts, distractors, visuals, or layouts), the source and its
    licence/permission must be recorded before the item is authored or
    adapted.

3.2 Only sources with a recorded permission, licence, or a documented
    public-domain/open-licence basis are permitted; the grant must be recorded.
    No recorded basis, no use.

3.3 Sources that are protected instruments, commercial test banks, or
    paywalled/closed test materials are not permitted as sources for any item.

3.4 Where a third-party source is used, reproduction requires a recorded
    permission or licence basis; this is an internal control and is not a
    legal conclusion about the source's copyright status.

## 4. Reviewer and approval trail

4.1 Each item passes through at least two named roles before acceptance:
    (a) author; (b) an independent reviewer (provenance + similarity check).

4.2 The review record stores, per item: reviewer names, dates, the similarity
    check result, and the approval decision (accept / revise / reject /
    quarantine).

4.3 No item may be presented to users unless both author attestation and
    reviewer approval are recorded.

## 5. Minimum metadata stored per future item

Each item must store, at minimum:

- item id and version (per `docs/assessment-principles.md` versioning);
- language-scope tag (`neutral`, `lt`, `en`);
- format family (per `docs/item-format-inventory.md`);
- author name and author attestation;
- provenance status (`original` / `third-party` with source record);
- source record (if any): source, licence/permission, URL/DOI, access date;
- intended rule specification reference;
- reviewer names and approval decision;
- similarity-flag status and resolution;
- date of authorship and last review.

## 6. Correction / withdrawal procedure

6.1 If an item's provenance or originality is challenged: the item is
    immediately quarantined (removed from live presentation) pending review.

6.2 The review determines one of: (a) challenge dismissed (provenance
    verified); (b) revision required; (c) withdrawal.

6.3 A withdrawn item is retired and its version marked withdrawn; it is not
    silently replaced — a corrected item is a new version.

6.4 Withdrawals and their reasons are recorded in the item's provenance trail
    so that historical results remain interpretable (a result records the item
    version used).

## Status

Proposal only. Not yet approved, not yet operational. This is an internal
risk-control proposal; no IP review has occurred and no legal clearance is
claimed (O-007).
