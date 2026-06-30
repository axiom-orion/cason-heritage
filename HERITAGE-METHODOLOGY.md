# Heritage Methodology — Genealogy as a Governed Agent

_How the Cason Heritage project ("Into the Unknown: The Cason Line") borrows its
research discipline from the axiom-orion projects (`agent-memory-service`,
`governed-agents`, `gigtrip`)._

> The visual identity of this site comes from the Vorion Design System. The
> **methodology** below — how a claim earns its place in the tree — comes from
> axiom-orion. This document records that lineage so the discipline survives even
> as people add ancestors.

---

## The thesis

A family tree is just an agent's memory: a store of facts about subjects, some of
which change or turn out to be wrong over time. The axiom-orion projects exist to
solve exactly that failure mode for AI agents — *don't act on stale or unverified
facts, and don't silently delete the ones you retire.* The Cason genealogy applies
the same three rules to ancestors:

1. **Every fact carries provenance and a tier.** Nothing is "just known."
2. **A claim must clear a decision threshold before it enters the line** (a
   verification gate), and is grounded in sources, not plausibility.
3. **Disproven claims are superseded and quarantined, never deleted** — they stay
   retained, marked, and queryable so the reasoning is auditable.

The result is a tree that can tell a *current, verified* ancestor from a *stale,
derivative* one — the genealogy equivalent of moving a memory system from
"returns the stale value every time" to "current-fact accuracy 100%, staleness 0%."

---

## The borrowed mechanisms

### 1. Provenance scoring and tiers
**From:** `agent-memory-service` (a "typed, provenance-tracked memory layer") and
`governed-agents` ("decisions key off scored provenance, never fabricated by the
model").

**In heritage:**
- The dossier grading scheme **(a) primary-sourced · (b) derivative/secondary ·
  (c) circumstantial inference · (d) family lore**, applied line-by-line in the
  Gen 1–5 dossiers.
- Per-record tiers in the Dashboard dossier model:
  `primary | derivative | disputed | missing | pending`.
- A coarse `evidence: confirmed | unsolved | eliminated` flag on every person in
  `CASON_DATA`.

A name with only a (d) family-lore tier is visibly weaker than one anchored by an
(a) primary patent — the tree shows its own confidence.

### 2. Supersession, not deletion
**From:** `agent-memory-service` — its core correctness mechanism keys semantic
facts on `(subject, attribute)` and marks superseded values **inactive but
retained and queryable through the audit log**, "which is what an auditable
deployment requires."

**In heritage:** the Generation-1 forensic audit **disproved** the long-standing
Digswell-1608 baptism, the named father "John Cason," the "~1629 crossing," and
the "Elizabeth Alcott" first wife. Rather than erasing them, the project:
- keeps them in `CASON_DATA` flagged `eliminated` with a `notes` field explaining
  the discard ("DISPROVEN — Discard: …"),
- surfaces them as a **quarantine list** in the Dashboard's Methodology tab.

The stale claim stays visible *as* stale, so future researchers don't
re-introduce it from derivative trees.

### 3. A pre-execution verification gate
**From:** `governed-agents` — an explicit **policy gate** in front of every action
that **allows / blocks / routes for human approval** *before* anything runs, using
named rules with numeric thresholds.

**In heritage:**
- The audit document is literally titled **"Generation 1 Verification Gate."**
- The **Evidence Board** runs candidate elimination with graded statuses —
  `LEADING · SECONDARY · POSSIBLE · UNLIKELY · ELIMINATED` — instead of asserting
  a single pedigree.
- The **Verification Tracker** (`.xlsx`) has an explicit
  **"Decision Threshold / Stop condition"** column, e.g.
  _"Zero hits at Digswell → retire the claim."_

A claim is admitted to the line only when it clears its gate; weak claims are held
("route for approval" = "Y-DNA testing is the path to certainty") rather than
accepted.

### 4. Grounded, auditable, replayable reasoning
**From:** `governed-agents` ("policy is named rules with thresholds, not vibes";
every step is an inspectable `TraceEvent` you can replay) and
`agent-memory-service` ("every operation written to an append-only audit log for
explainability").

**In heritage:** every verdict states its **reason and source**. The
governed-agents pattern "the only source scores 0.55, the rule requires ≥ 0.70, so
the action halts" reappears as _"Cannon's will omits Ransom → ELIMINATED"_ and
_"1823 Pitt Co. deeds (Book CC p.229) show a separate local branch → SECONDARY."_
The forensic audit is an append-only, item-by-item reasoned log of exactly which
sub-claims were stripped and why.

### 5. Typed, structured retrieval
**From:** `agent-memory-service` — four typed stores (working / episodic /
semantic / procedural) so retrieval is structured, not a flat blob.

**In heritage:** the Dashboard frames a complete dossier as **11 fixed record
categories** per person — Vital, Land, Probate, Cargo/Migration, Military, Census,
Tax, Ecclesiastical, Court, DNA/FAN cluster, Newspapers — each slot tier-tagged.
Every ancestor is "retrieved" against the same schema, which makes gaps
(`missing`, `pending`) explicit rather than invisible.

### 6. Exploration over a bundled corpus (lightest tie)
**From:** `gigtrip` — plans real itineraries over a bundled corpus, surfacing
options rather than a single fixed answer.

**In heritage:** the **Migration** variant plots ancestors over a geographic
corpus, and the **Vault** sorts the index **unsolved-first** with an "evidence
needed" callout — corpus-driven exploration and an explicit research backlog
rather than a finished, frozen claim.

---

## Side-by-side

| axiom-orion mechanism | Source project | Heritage emulation |
|---|---|---|
| Provenance scoring / tiers | agent-memory-service; governed-agents | a–d grading; `primary/derivative/disputed/missing/pending`; `confirmed/unsolved/eliminated` |
| Supersession, not deletion | agent-memory-service | Disproven Digswell-1608 claims retained, flagged `eliminated`, shown as a quarantine list |
| Pre-execution policy gate w/ thresholds | governed-agents | "Generation 1 Verification Gate"; Evidence Board statuses; Tracker "Decision Threshold / Stop condition" |
| Grounded, auditable reasoning | governed-agents; agent-memory-service | Reason + source on every verdict; append-only forensic audit |
| Typed / structured retrieval | agent-memory-service | 11-category dossier schema, tier-tagged per person |
| Exploration over a corpus | gigtrip | Migration map; Vault "unsolved-first" research backlog |

---

## The showcase: the Digswell-1608 episode

This single case is the whole method in miniature, and it maps cleanly onto the
problem `agent-memory-service` was built to demonstrate:

- A flat **"append everything"** family tree (the exact anti-pattern the memory
  service beats) keeps serving the stale 1608 baptism because it can't tell a
  current, primary-sourced fact from an old, oft-repeated derivative one.
- The heritage method runs the claim through the **verification gate**, finds it
  fails on provenance (no primary register support; "Cason/Casson" is a
  northern-English, not Hertfordshire, surname), **supersedes** it (kept, flagged,
  quarantined), and re-anchors Generation 1 on the **primary 1635 Harwood
  headright patent** instead.
- Net effect, in memory-service terms: changing-fact accuracy → correct,
  staleness → zero, with the retired claim still auditable.

The Florida branch (Ransom Cason Sr., c.1763 forward) is anchored independently
and therefore inherits zero risk from the Gen-1 weakness — the genealogical
equivalent of keying facts so a fix in one subject doesn't corrupt another.

---

## Rule for contributors

When you add or change a person in `CASON_DATA`:

1. **Tag provenance.** Give every assertion a tier; default unproven links to
   `evidence: 'unsolved'` and cite the record in `sources`.
2. **Gate before you admit.** State the decision threshold that would confirm or
   retire the claim (what record, where, what result decides it).
3. **Supersede, don't delete.** If you overturn an existing claim, leave it in
   place flagged `eliminated` with a `notes` reason — add to the quarantine list,
   never silently remove.
4. **Keep it grounded.** Reasons cite sources, not plausibility.

_Last updated: 2026-06-29._
