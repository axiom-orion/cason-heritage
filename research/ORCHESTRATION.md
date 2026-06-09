# Agent Orchestration — what flcason.com already is, and what it's missing

*The blueprint for turning the Cason Line into a strong, real-world example of a
**governed autonomous system** — written against the code that exists, not against
a whiteboard.*

This sits beside [`KEEPER.md`](./KEEPER.md) (the conductor) and
[`bloodhound.md`](./bloodhound.md) (the law). Read those first; this file ties them —
and the three sibling repositories — into one register and one contract.

---

## 0. The finding

The honest headline, after reading the code: **most of the autonomous stack is already
built.** The familiar "you need twelve agents" framing maps almost one-for-one onto
modules that already run — under project-native names (the Keeper, the Bloodhound, the
personas, the consensus endpoint, the living-line memory graph). What is *missing* is not
more agents. It is the **federation seam**: the four repositories each solve their layer
rigorously, but they do not yet call each other, share one policy gate, or surface one
glass-box trace. Close that seam and the Cason Line stops being four good demos and
becomes one provable autonomous system.

So this document does two things: (1) a register that marks every agent **LIVE /
PARTIAL / GAP** against real files, and (2) the contract that wires them together.

---

## 1. The four repositories (the substrate)

| repo | layer it owns | status |
|---|---|---|
| **cason-heritage** (this) | the world, the personas, the conductor, the public surface | live at flcason.com |
| **governed-agents** | the typed pre-execution policy gate + NDJSON audit trace | live demo; not yet called by the site |
| **agent-memory-service** | the rigorous four-store memory (episodic→semantic, supersession, audit) | library; not yet called by the site |
| **genealogy-graphrag** | hybrid retrieval + kinship-graph resolution with citations | library; not yet called by the site |

The site reimplements thin versions of the bottom two in browser JS
(`ui_kits/living-line/memory-graph.js`). The federation seam (§4) is about pointing the
conductor at the real services instead.

---

## 2. The agent register (vision → reality)

Each row: the aspirational agent, the module that **is** it today, and its honest status.

### Foundation — memory & truth

1. **Memory Graph Steward** — **LIVE (in-browser) / GAP (federated).**
   `ui_kits/living-line/memory-graph.js` builds a derived, tri-layered graph (family /
   generational / individual) from `data.js`, with provenance and a temporal-horizon
   filter. The rigorous version — episodic→semantic consolidation, `(subject,attribute)`
   supersession, append-only audit — lives in **agent-memory-service** (`src/agent_memory/`)
   and is **not yet wired in**. *Gap: the site's memory cannot yet forget a stale fact the
   way the service provably can.*

2. **Ingestion & Provenance** — **PARTIAL.** The "Submit a correction or document"
   issue form (`.github/ISSUE_TEMPLATE/correction.yml`) + the Keeper's dossier PRs are the
   intake. Living-line contributions have auth (`living-line/auth.js`,
   `supabase-config.js`). *Gap: no OCR/entity-extraction step; intake is human-keyed.*

### Domain specialists

3. **Persona Agents (Becky + the ancestral voices)** — **LIVE.**
   `ui_kits/living-line/personas.js` is a full era-grounded archetype catalog
   (planter, orphan, …) with voice, levity, and a `provenance.reconstructed` honesty flag.
   `api/persona.js` gives them a live Claude voice that is fed **only** horizon-accessible
   facts. *This is already the strongest piece.*

4. **Narrative Journey Agent** — **GAP.** The narrative arc is static HTML
   (`index.html`). No agent personalizes the path or surfaces a relevant memory on a
   behavioral trigger. The hooks exist (`world-engine.js` encounters); nothing drives them
   from user state.

5. **Evidence & Proof Auditor** — **PARTIAL.** The Bloodhound law
   (`research/bloodhound.md`) and the Keeper's tiering (`leading / possible / unsolved`,
   never `confirmed`) score evidence. The rigorous relational auditor — "who is the
   maternal grandfather of X", answered by graph traversal **with citations** — is
   **genealogy-graphrag** (`src/genealogy_rag/kinship.py`, `pipeline.py`), not yet called.

### Governance & meta (the Vorion heart)

6. **Governance Conductor (meta-orchestrator)** — **LIVE.**
   `scripts/keeper.js` *is* the conductor: it loads the real graph, ranks open `gap` nodes,
   fans out to consensus, runs the gate, and writes a dossier — **propose, never publish**,
   stopping at a human merge. The typed loop variant (Researcher→Reasoner→gate→execute) is
   **governed-agents** `lib/loop.ts`.

7. **Trust / Coherence / Drift Auditor** — **GAP.** Per-utterance `sources` exist
   (`world-engine.js`) and `selftest.js` proves no-leak, but nothing runs a *scheduled*
   self-audit for persona drift or memory contradiction over time.

8. **Circuit Breaker & Safety** — **LIVE (two of them).** (a) The **temporal horizon**:
   `accessibleSubgraph` in `memory-graph.js` structurally filters the future out of every
   persona's context — the future *cannot* enter the prompt. (b) The **corroboration law**:
   the Bloodhound counts independent *sources*, not *voices*, and quarantines disproven
   myths. The typed pre-execution gate (`governed-agents/lib/governance.ts`,
   `evaluatePolicy`) is the third, **not yet on the site's path**.

### Interaction & self-improvement

9. **Reflection & Self-Improvement** — **PARTIAL.** The Keeper improves *coverage*
   (chases gaps). It does not yet review *system* health (drift, prompt quality, persona
   expansion). World-engine "reflections" are deterministic ambient texture, not a
   strategy loop.

10. **Recovery & Resilience** — **PARTIAL.** `api/persona.js` degrades to a templated
    voice with no API key; `api/consensus.js` runs whatever provider subset is configured.
    *Gap: no unified degradation state machine or breaker-state surfaced to the user.*

### External interface

11. **External Research & Validation** — **LIVE.** `api/consensus.js` asks
    Claude + Grok + Gemini in parallel and a Claude adjudicator marks a claim
    CORROBORATED only when ≥2 *independent* models agree — the guard against one model's
    hallucination spreading as fact. The Keeper consumes it; the Bloodhound collapses
    same-source echoes.

12. **Family Contribution Gatekeeper** — **PARTIAL.** Auth + the correction form are the
    gate; privacy tiers exist in the memory graph (family / generational / individual).
    *Gap: no moderation queue with explicit consent/privacy-tier assignment on upload.*

**Tally: 4 LIVE, 6 PARTIAL, 2 GAP.** The system is real. The work is federation and a
small number of genuinely-missing loops — not twelve new agents.

---

## 3. One law, enforced three ways

The reason this stack is *governed* and not just *multi-agent* is that the same honesty
bar is enforced structurally at three layers:

- **In memory** — the temporal horizon (`accessibleSubgraph`): an agent literally cannot
  see its own future. The circuit breaker is a *filter on context*, not a prompt plea.
- **In corroboration** — independent **sources**, not reporters (`bloodhound.md` §0).
  Three models echoing one WikiTree tree is one weak strand, not three confirmations.
- **At the action** — propose, never publish. The Keeper opens a PR; a human merges.
  governed-agents' `evaluatePolicy` is the same idea, typed and pre-execution.

Any new agent added to the register MUST inherit all three or it does not ship.

---

## 4. The federation contract (the missing seam)

This is the concrete work that turns four repos into one autonomous system. The conductor
(`scripts/keeper.js`) gains three outbound calls; the site gains one public trace.

```
                         ┌──────────────────────────────────────────┐
   open gap nodes ──────▶│  THE KEEPER  (conductor, scripts/keeper.js)│
   (memory-graph.js)     └───┬───────────┬───────────────┬──────────┘
                             │           │               │
              relational Q   │           │ propose action│  episodic event
                             ▼           ▼               ▼
                 ┌───────────────┐ ┌─────────────┐ ┌──────────────────┐
                 │ genealogy-    │ │ governed-   │ │ agent-memory-    │
                 │ graphrag      │ │ agents gate │ │ service          │
                 │ (citations)   │ │ evaluate    │ │ (consolidate/    │
                 │               │ │ Policy()    │ │  supersede/audit)│
                 └───────┬───────┘ └──────┬──────┘ └────────┬─────────┘
                         │ allow + cite   │ allow/block/hold │ durable, auditable
                         └────────────────┴──────────────────┘
                                          │
                                   ONE NDJSON trace
                                          ▼
                         public "System Health" glass-box on flcason.com
```

**Three seams, in priority order:**

1. **Conductor → relational truth from the kinship graph.** ✅ *Delivered in-repo
   (Phase 1).* The Keeper no longer asks an LLM to guess kinship: `ui_kits/living-line/
   kinship.js` ports genealogy-graphrag's `RelationResolver` (the layer that takes
   relational recall 0.000→1.000) to run over the curated Cason edges, in the Keeper's own
   no-build runtime. It now (a) **grounds** every research call with the subject's curated
   kin as ground truth, and (b) catches a model that **revives a ruled-out ancestor**
   (`graph-conflict`), with a `graph-resolved` fast path for questions the graph already
   answers. *Future upgrade:* when genealogy-graphrag runs as a service over an export of
   the Cason graph, swap the in-repo resolver for a call to its `pipeline.py` to inherit
   bibliographic citations directly — the Keeper seam stays the same.

2. **Conductor → governed-agents gate for every proposed dossier entry.** ✅ *Delivered
   in-repo (Phase 1).* `ui_kits/living-line/governance.js` ports governed-agents'
   `evaluatePolicy` + `TraceEvent` contract: every researched item is decided
   **allow / needs-approval / block** by named rules with thresholds (provenance,
   quarantine, eliminated-kin, overclaim, model-consensus, human-merge), and each run writes
   `keeper-<date>.trace.ndjson` — one `TraceEvent` per line, the *same* wire format the demo
   streams. The family site now decides with the same typed gate and leaves the same
   replayable audit trail. *Future upgrade:* a shared policy artifact (canonical in
   governed-agents, consumed by both) so "edit a threshold once" governs demo and site
   together.

3. **Supersession over the curated record (Seam 3).** ✅ *Delivered in-repo — the "B" call.*
   The Keeper is stateless by design and `data.js` *is* the memory, so rather than stand up a
   persistent agent store, the supersession discipline `agent-memory-service` proves is applied
   to the **record's change-history**: `ui_kits/living-line/supersessions.js` is a queryable,
   `data.js`-grounded ledger of every documented correction — keyed on `(subject, attribute)`,
   the old value kept and marked, the current value standing. It backs a `no-superseded-value`
   gate rule (refusing any re-assertion, and catching corrections the myth regex misses) and a
   public "what the record used to say, and why it changed" pane. The ledger can only formalize
   corrections already written into `data.js` — its self-test rejects anything ungrounded.

Each seam is a network call behind a feature flag; none requires rewriting the in-browser
graph, which stays the fast path for rendering the world.

---

## 5. The genuinely-missing loops (to be a *showcase*)

Beyond federation, four loops are real GAPs worth building:

- **Drift auditor (agent 7)** — a scheduled job that re-runs `selftest.js`-style no-leak
  checks *plus* persona-voice consistency across runs, and opens an alert PR on regression.
- **Persona identity fingerprint** — extend `provenance.reconstructed` to a stable
  per-persona signature so impersonation/drift is *detectable*, not just flagged.
- **Public glass-box pane** — ✅ *landed.* The living-line **Governance** view now runs
  the typed gate (`governance.js`) in the browser over representative scenarios and renders
  the live decision + the replayable NDJSON `TraceEvent` stream — "watch it refuse the
  Cason↔Causey merge," on screen (`LivingWorld.jsx` → `AuditTraceCard`). Next: feed it the
  Keeper's actual `keeper-<date>.trace.ndjson` rather than in-page scenarios.
- **Narrative Journey agent (agent 4)** — drive `world-engine.js` encounters from user
  state so the site can *proactively* surface a relevant memory.

---

## 6. Phased rollout (grounded in current code)

**Phase 1 — Federate (highest correctness, lowest new surface).**
Seam 1 (relational truth from the kinship graph) and Seam 2 (typed `evaluatePolicy` gate +
NDJSON trace) are **both landed in-repo** — the Keeper grounds on and graph-verifies against
the curated edges (`kinship.js`), then gates each item allow/needs-approval/block by named
rules and writes a replayable `TraceEvent` audit trail (`governance.js`). Next: Seam 3
(durable episodic→semantic memory via agent-memory-service), then the public glass-box pane
that renders these traces.

**Phase 2 — Make memory provable.**
Seam 3 (agent-memory-service on dossier merge) + the drift auditor (agent 7). Now the
system provably forgets stale facts and watches itself for drift.

**Phase 3 — Make governance visible.**
The public glass-box pane + persona identity fingerprints + the Narrative Journey agent.
The Cason Line becomes a *showcase*: a living, self-regulating, provable autonomous
heritage system where the governance is on screen, not in a README.

---

*The line is already governed. The remaining work is to let its four halves speak to each
other — and to put the glass box where the family can see it.*
