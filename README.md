# Cason Heritage — _Into the Unknown: The Cason Line_

Eleven generations of the Cason family, from Hertfordshire (c.1604) to the Space
Coast of Florida — told as an interactive heritage narrative, **and governed by a
small autonomous agent system** that researches the line, refuses what the record
disproves, and shows its work.

**Live:** https://flcason.com · the agent layer is at **/living** · the glass box is
**/living → Governance**

---

## Two things in one repo

1. **The narrative site** — self-contained, no build, no framework. The story
   (`index.html`), the family-tree dashboard (`/dashboard`), the evidence tree
   (`/tree`), the Proof gallery (`/proof`), and the **Living World** (`/living`).
   Open in a browser and it works.
2. **A governed autonomous system** — the "Living Line": a roster of agents that read
   an eleven-generation knowledge graph, speak in era-bounded ancestral personas,
   research the family's open questions, and gate every claim through an auditable
   policy. The guiding law is **propose, never publish** — nothing reaches the record
   without a human. It is the real-world composition of the [Vorion](https://github.com/vorionsys)
   pieces (governance, memory, graph retrieval) on something that matters.

---

## The agent system

Thirteen agents across four layers, each a **real, no-build module** — governed, traced,
self-tested, and self-described in a registry (`ui_kits/living-line/agents.js`). Every
agent's *system* (how it works) and *ability* is machine-checkable: `npm run
selftest:agents` asserts that each `live` agent names a module that exists on disk.

| Layer | Agent | System → Ability |
|---|---|---|
| Foundation | **Memory Graph Steward** | Tri-layer graph from `data.js` + a temporal-horizon access filter; optional durable cross-run memory → `accessibleSubgraph`, provenance/tiers, supersession-aware recall. |
| Foundation | **Ingestion & Provenance** (+ Gatekeeper) | The governed front door: entity-link → honest tier cap → privacy tier → the **same gate** → route (refuse / human-queue). A contribution can't re-introduce a disproven myth. |
| Foundation | **Almanac** (keeper of days) | Compiles a full family calendar from the record — structured years + dates extracted from the narratives — to **honor the main line on this day**; precision flagged, public-only. |
| Specialist | **Persona Agents** (Becky + the line) | Era-grounded voices fed only horizon-accessible facts → in-character dialogue that won't claim the future or invent kin. |
| Specialist | **Evidence & Proof Auditor** | Deterministic kinship resolution + evidence tiering → `<relation> of <person>`, eliminated-kin detection, gap-finding. Corroboration counts independent **sources**, not voices. |
| Specialist | **External Research & Validation** | Claude + Grok + Gemini in parallel, ≥2 = corroborated → multi-model corroboration, same-source echo collapse. |
| Governance | **Governance Conductor** (the Keeper) | Routes open lines → kinship → grounded research → gate → trace → tiered dossier → PR. |
| Governance | **Circuit Breaker & Safety** | The typed pre-action gate + the temporal horizon → allow / needs-approval / **block**, by named rules with thresholds. |
| Governance | **Trust, Coherence & Drift Auditor** | Scheduled invariant battery + content-addressed attestation vs a baseline → drift/regression detection, alert PR. |
| Governance | **Reflection & Self-Improvement** | Reads the graph → a ranked "what to work on" report (the load-bearing Gen-5 slot first). Advises; never writes. |
| Governance | **Recovery & Resilience** | *Cross-cutting:* every external call degrades gracefully — an outage degrades a run, never crashes or fabricates. |
| Interaction | **Narrative Journey** | Recommends the next persona / open line / section and surfaces a memory through the horizon-bounded subgraph; public-only. |
| Interaction | **Curator** (editor-in-residence) | Learns from the record + the calendar → proposes **edits** (no-narrative / no-source / reconstruction-only), **seasonal** features (the season's chapter + this-year milestone anniversaries), and **additions** (a Gen-5 callout, an open line to surface, an under-told spotlight). Proposes; a human applies. |

### How the governed loop works

The **Keeper** (`scripts/keeper.js`) is the conductor. On a schedule (or on demand) it:

1. pulls the open `gap` nodes — the family's unanswered questions;
2. for relational ones, **resolves kinship from the graph** instead of asking a model to guess
   (`kinship.js` — the capability [`genealogy-graphrag`](https://github.com/axiom-orion/genealogy-graphrag) proves);
3. asks the multi-model **consensus** endpoint the rest, grounded with the curated kin;
4. runs each proposed finding through the typed **policy gate** (`governance.js`) —
   allow / needs-approval / **block** — and emits one `TraceEvent` per step as an NDJSON
   **audit trail** (the same wire format the [`governed-agents`](https://github.com/axiom-orion/governed-agents) demo streams);
5. optionally **recalls and persists** to durable memory ([`agent-memory-service`](https://github.com/axiom-orion/agent-memory-service)), so a later finding supersedes a stale one;
6. writes an honestly-tiered **dossier** and opens a PR. A human merges to accept — nothing is auto-published.

### Governance — the load-bearing ideas

- **The temporal horizon is a structural circuit breaker.** A persona literally cannot
  see a generation beyond N+1 or a year past its own — the future never enters context.
- **Corroboration counts independent sources, not voices.** Three models echoing one
  derivative tree is one weak strand, not three confirmations.
- **Two memories, distinct on purpose.** The supersession *ledger* (`supersessions.js`) is
  the curated record's change-history (what it used to say, and why it changed; the gate
  refuses re-asserting a superseded value). The *service* is the Keeper's own cross-run
  research memory.
- **Supervised, by construction.** Every `write_record` routes to a human; the top autonomy
  tier (an autonomous write) is **unoccupied by design** — a provable invariant
  (`governance.autonomyPosture()`), not a promise.
- **The glass box.** The `/living → Governance` view shows it all live: the horizon
  circuit-breaker, the provenance tiers, the quarantine, the **typed gate run in the page**
  with a replayable trace, the supersession ledger, the appeal ledger, and the **agent
  roster** itself.

---

## Run it

```sh
npm run keeper -- --dry-run     # the conductor: show the queue it would research (no network)
npm run keeper -- --max 3       # research 3 open lines, gate them, write a dossier + trace
npm run drift-audit             # the self-audit: re-run invariants + attest the governed state
npm test                        # the Playwright browser smoke suite (the live site + glass box)

# the agent/governance self-tests (Node, no deps):
npm run selftest                # living-line invariants (horizon, no-leak)
npm run selftest:kinship        # the kinship resolver (15)
npm run selftest:governance     # the typed gate + NDJSON trace (20)
npm run selftest:supersessions  # the correction ledger, grounded in data.js (10)
npm run selftest:memory         # the durable-memory client contract (13)
npm run selftest:drift          # the drift auditor incl. injected-regression detection (13)
npm run selftest:agents         # the new agents + registry honesty (20)
```

Durable memory is opt-in and graceful: set `KEEPER_MEMORY_URL` (+ `KEEPER_MEMORY_TOKEN`)
to point the Keeper at an `agent-memory-service` deployment; unset, it runs stateless.

---

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | The heritage narrative (self-contained HTML/CSS/JS). |
| `ui_kits/living-line/` | The Living World app + **the agent layer**: `agents.js` (registry), `governance.js` (gate + trace), `kinship.js`, `supersessions.js`, `memory-client.js`, `ingestion.js`, `journey.js`, `reflection.js`, `personas.js`, `memory-graph.js`, `world-engine.js`, `LivingWorld.jsx`. |
| `ui_kits/family-tree-app/` | The `/dashboard` family-tree app + `data.js` — the single source of truth for the line. |
| `scripts/keeper.js` · `scripts/drift-audit.js` | The Conductor and the Drift Auditor (Node). |
| `api/` | Vercel serverless functions: `persona.js` (live persona voice), `consensus.js` (multi-model corroboration). |
| `research/` | The design docs — see below. |
| `.github/workflows/` | `keeper.yml` (weekly research pass), `drift-audit.yml` (weekly self-audit), `ci.yml` (Playwright smoke). |

### Further reading (the design docs)

- [`research/ORCHESTRATION.md`](research/ORCHESTRATION.md) — the blueprint: the agent register, the federation seams, the phased plan.
- [`research/KEEPER.md`](research/KEEPER.md) — the conductor: the pipeline, the gate rules, durable memory, the honesty bar.
- [`research/bloodhound.md`](research/bloodhound.md) — the one law: corroboration counts independent sources.
- [`research/DRIFT.md`](research/DRIFT.md) — the self-audit: invariants vs. drift, the attestation.

---

## The narrative site (static)

No build step — `index.html` and the `ui_kits/` pages are served as static files. The
visual system (parchment, gold leaf, rust, deep navy; Playfair Display + Source Serif 4 +
Source Sans 3) is inlined under `:root`. The friendly routes (`/living`, `/dashboard`,
`/tree`, `/proof`, `/deck`) are defined in `vercel.json` / `serve.json`.

**Deploy.** Connected to Vercel (project `cason-heritage`, `vorion` team): every push to
`main` ships a production deploy; PRs get a preview URL. By hand: `vercel --prod`.

**Contribute.** The footer's **"Submit a correction or document"** button is wired to a
GitHub Issue Form ([`.github/ISSUE_TEMPLATE/correction.yml`](.github/ISSUE_TEMPLATE/correction.yml)) —
corrections, documents, and citations land as labeled issues. (The Ingestion agent is the
governed path for processing them.)

**Share card.** `og-image.html` is the design source for `og-image.png`; regenerate with the
local-only `.og-builder/` Playwright tool (`cd .og-builder && npm install && node screenshot.js`).

## Domain

- Canonical: https://flcason.com — the apex, served directly
- `www.flcason.com` redirects to the apex · Vercel alias: https://cason-heritage.vercel.app
