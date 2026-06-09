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
  → load the REAL data.js + memory-graph.js (single source of truth)
  → pull the open-line `gap` nodes — the family's unanswered questions
  → rank them (authored family threads + the load-bearing Gen-5 link first)
  → ask /api/consensus each one  (Grok + Gemini + Claude, ≥2 = corroborated)
  → bloodhound gate:
        • a model repeats a quarantined myth → CAUGHT, held, never proposed
        • corroborated by ≥2 models          → tier `leading`  (a lead, not proof)
        • single-source / unverified         → tier `possible` (a thread to chase)
        • conflict / insufficient            → tier `unsolved` (stays open)
  → write research/proposals/keeper-<date>.md
  → open ONE PR for review  →  STOP.  A human merges (accept) or closes (reject).
```

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
