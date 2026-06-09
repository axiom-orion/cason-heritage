# The Keeper — autonomous research, human approval

The Keeper is the orchestrator that keeps the record growing without ever letting
an unproven claim slip in as fact. It runs the pieces the site already has —
the open-line worklist, the multi-model consensus endpoint, the bloodhound
validation, and the evidence tiers — on a schedule, and stops at a human gate.

**Propose, never publish.** The Keeper opens a pull request with a research
*dossier*. Nothing reaches `data.js` or the live family site until a keeper
reviews and merges it.

## The workflow

```
weekly cron (or manual run)
  → load the REAL data.js + memory-graph.js + kinship.js (single source of truth)
  → pull the open-line `gap` nodes — the family's unanswered questions
  → rank them (authored family threads + the load-bearing Gen-5 link first)
  → KINSHIP FIRST (ui_kits/living-line/kinship.js):
        • a relational question the GRAPH answers ("which of my children…",
          "<relation> of <Name>") → tier `graph-resolved`, NO model call
        • otherwise → hand the curated kin to the models as ground truth
  → ask /api/consensus each remaining one  (Grok + Gemini + Claude, ≥2 = corroborated)
  → bloodhound gate:
        • a model repeats a quarantined myth → CAUGHT, held, never proposed
        • a model revives a ruled-out ancestor as kin → `graph-conflict`, CAUGHT
        • corroborated by ≥2 models          → tier `leading`  (a lead, not proof)
        • single-source / unverified         → tier `possible` (a thread to chase)
        • conflict / insufficient            → tier `unsolved` (stays open)
  → write research/proposals/keeper-<date>.md
  → open ONE PR for review  →  STOP.  A human merges (accept) or closes (reject).
```

### Kinship: graph truth before model guess

A genealogical relation is a fact the family graph already holds, not a thing to
ask a language model to invent. Before any model call, the Keeper resolves
relational questions deterministically from the curated kinship edges in
`data.js` — a faithful, no-build port of the sibling repo
[`genealogy-graphrag`](https://github.com/axiom-orion/genealogy-graphrag)'s
`RelationResolver` (whose eval shows relational recall jumping from **0.000 to
1.000** the moment a graph, not text retrieval, answers *"who was the maternal
grandfather of X?"*). Two always-on effects, plus one fast path:

- **Ground, don't guess.** Every research call now carries the subject's curated
  kin (parents / children / spouse / siblings, with their evidence tiers) as
  ground truth — so the models corroborate *around* what the line already knows
  instead of re-deriving (or contradicting) it.
- **`graph-conflict` circuit-breaker.** If a model names a person the family has
  **ruled out** (`evidence: 'eliminated'` — e.g. Cannon Cason Sr., eliminated as
  Ransom's father) as kin, the gate catches it against the graph and holds it,
  exactly as it does a quarantined myth.
- **`graph-resolved` fast path.** When a question *is* answerable from the curated
  edges, the graph answers it and no model is called. (On today's open-by-design
  gap set this rarely fires — a gap is, by definition, an edge the graph does
  *not* yet hold — but it keeps the Keeper from ever paying a model to guess a
  kinship the line already records.)

Honesty note: `data.js` carries no `sex` field, so a *gendered* split
(father vs. mother, grandfather vs. grandmother) is reported as the full set with
a `sexUnresolved` flag rather than guessed from a name. Add `sex: 'M'`/`'F'` to a
person and the split sharpens automatically. Validate with
`npm run selftest:kinship`.

### The honesty bar — why this can't drift

- **Consensus is corroboration, not a source.** Agreement between three language
  models is a *lead*. The Keeper never produces `confirmed` or `secondary` —
  those tiers require a primary document (a parish register, a court order, an
  etched stone), which an LLM is not. The highest an autonomous finding can reach
  is `leading`.
- **The quarantine is load-bearing.** If a model repeats Digswell-1608, "Elizabeth
  Alcott", the "Virginia Land Company", or the Lynnhaven church-warden myth, the
  gate catches it and records the catch — it is never proposed as fact.
- **A clean negative is a finding.** "Searched, found nothing, here's the record
  that would decide it" is kept, not discarded.
- **The governance layer still applies.** Anything promoted into `data.js` is then
  subject to the horizon, quarantine, and meta-governance invariants the build
  enforces.

### The gate is typed, and every run leaves an audit trail

The bloodhound verdict is the Keeper's *domain reasoning*; the **policy gate** is the
*formal governance decision* on top of it, ported from the sibling repo
[`governed-agents`](https://github.com/axiom-orion/governed-agents)
(`ui_kits/living-line/governance.js` mirrors its `evaluatePolicy` + `TraceEvent`
contract). Each researched item becomes a typed `ProposedAction` and is decided
**allow / needs-approval / block** by named rules with thresholds — not inline
conditionals:

- `require-provenance` — a proposed record must cite a source (**block**).
- `no-quarantined-myth` — content repeating a disproven claim, from the hardcoded
  myth regex (**block**).
- `no-superseded-value` — content re-asserting any value the record has **superseded**
  (the `supersessions.js` ledger), e.g. *Elizabeth Alcott* or the *~1629 crossing*
  (**block**) — data-driven, and it catches corrections the myth regex misses.
- `no-eliminated-kin` — reviving a ruled-out (`evidence:'eliminated'`) ancestor as
  kin (**block**) — the Seam-1 circuit-breaker, now a named policy rule.
- `no-overclaimed-record` — a `confirmed`/`secondary` claim needs a source scoring
  `>= primaryThreshold`; model consensus never reaches it (**block**).
- `require-model-consensus` — a split model vote routes to a human (**review**).
- `lead-needs-human-merge` — every clean lead parks for the human merge gate
  (**review**) — *propose, never publish*, expressed as policy.

**Supervised, by construction.** Because `lead-needs-human-merge` makes *every*
`write_record` at least `needs_approval`, **no policy path auto-writes a new claim** —
the top autonomy tier (a model-originated write with no human) is unoccupied by design.
This is a provable invariant, not a promise: `governance.autonomyPosture(policy)` probes a
clean, fully-sourced write and confirms it still cannot reach `allow` (and the self-test
checks that removing the rule breaks it). The living-line glass-box surfaces it.

Because the rules key off **named thresholds**, the family site inherits the demo's
signature property: lower `primaryThreshold` and a `block` flips to `needs_approval` —
a real change in the gate, not a cosmetic one. Every run also writes
`keeper-<date>.trace.ndjson` beside the dossier: one `TraceEvent` per line
(`run_started → step_started/completed → action_proposed → gate_decision →
executed | awaiting_approval | halted → run_completed`), the **same wire format**
the governed-agents demo streams — a replayable, inspectable audit trail (and the
substrate for a future public "glass-box" pane). Validate with
`npm run selftest:governance`.

## Running it

```bash
npm run keeper -- --dry-run        # show the queue it would research (no network)
npm run keeper -- --max 3          # research 3 questions, write a dossier
```

The scheduled run is `.github/workflows/keeper.yml` (Mondays 13:00 UTC, plus a
manual **Run workflow** button). It skips itself if a Keeper PR is already open,
so proposals don't pile up while one is awaiting review.

### Where it researches

By default the Keeper calls the deployed `https://flcason.com/api/consensus`,
which already holds the API keys server-side — so the Action needs **no secrets**,
only the automatic `GITHUB_TOKEN` to open the PR. To point it elsewhere, set a
repository variable `KEEPER_CONSENSUS_URL`.

## Approving a dossier

1. Open the Keeper PR; read each question's verdict and the corroborated points.
2. For a `leading`/`possible` lead worth keeping, the dossier includes a
   ready-to-paste, honestly-tiered record. Promote it into `data.js` (or ask
   Claude to) — keeping the consensus citation and the "unverified until a
   primary record" note.
3. **Merge** to accept the dossier into the research record, or **close** to
   reject. Either way the thread is documented; the next run won't re-pile while
   one is open.

## Seasonal refresh (next)

The same pipeline, run quarterly, also powers content freshness: a "new to the
record this season" digest, a featured-persona rotation, and a re-attestation of
the `gov:<digest>` integrity stamp. That builds on this orchestrator.
