/* ============================================================
   The Living Line — Agent Registry  (window.CASON_AGENTS)
   ------------------------------------------------------------
   The canonical, self-describing roster the Governance Conductor routes
   over and the glass-box renders. It is the honest answer to "what agents
   does this system have, and what can each one do?" — every entry states
   the agent's SYSTEM (how it works, naming the real module) and its
   ABILITIES, plus the governance hooks that bound it and its autonomy
   posture. Nothing here is aspirational: a `live` agent names a module
   that exists on disk (the self-test enforces it); `cross-cutting` means a
   real behaviour realized across several modules rather than one file.

   Autonomy vocabulary (all human-bounded — the top tier is unoccupied):
     proposes      — acts then stops at a human gate (PR / moderation queue)
     advises       — read-only; produces reports, never writes
     acts-bounded  — refuses/blocks autonomously, but only structurally
                     (a circuit breaker can stop; it cannot publish)

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  const LAYERS = ['foundation', 'specialist', 'governance', 'interaction'];
  const STATUSES = ['live', 'cross-cutting'];

  const AGENTS = [
    {
      id: 'conductor', name: 'Governance Conductor', layer: 'governance', status: 'live', autonomy: 'proposes',
      modules: ['scripts/keeper.js'],
      system: 'Ranks the open lines, routes each through kinship → grounded model research → the typed gate → an NDJSON trace, and writes a tiered dossier; durable memory optional. Propose, never publish.',
      abilities: ['orchestrate the specialist agents', 'apply the gate + audit trace per item', 'recall/persist run memory', 'open a dossier PR'],
      hooks: ['propose-never-publish (human merge)', 'every step traced'],
    },
    {
      id: 'memory-steward', name: 'Memory Graph Steward', layer: 'foundation', status: 'live', autonomy: 'acts-bounded',
      modules: ['ui_kits/living-line/memory-graph.js', 'ui_kits/living-line/memory-client.js'],
      system: 'Derives a tri-layered knowledge graph from data.js with a temporal-horizon access filter; optionally backs the Keeper with durable cross-run memory via agent-memory-service (supersession-aware).',
      abilities: ['accessibleSubgraph(persona)', 'provenance + tiers per node', 'durable recall/ingest/consolidate (service)'],
      hooks: ['temporal-horizon circuit breaker (the future cannot enter context)'],
    },
    {
      id: 'ingestion', name: 'Ingestion & Provenance (+ Gatekeeper)', layer: 'foundation', status: 'live', autonomy: 'proposes',
      modules: ['ui_kits/living-line/ingestion.js'],
      system: 'The governed front door: entity-links a contribution to the graph, caps its tier honestly (never above `possible` from intake), assigns a privacy tier, then runs it through the SAME gate and routes it (refuse / human-queue).',
      abilities: ['entity-link a contribution', 'honest tier cap', 'privacy-tier + consent (gatekeeper)', 'gate + route incoming records'],
      hooks: ['the gate (myth / eliminated-kin / superseded / overclaim)', 'living-private → authenticated-descendant tier'],
    },
    {
      id: 'almanac', name: 'Almanac (keeper of days)', layer: 'foundation', status: 'live', autonomy: 'advises',
      modules: ['ui_kits/living-line/almanac.js'],
      system: 'Compiles a full family calendar from the record — structured born/died years (year precision) plus the specific dates written into narratives ("7 July 1635", "12 Nov 1853"; day precision), classified born/died/married/land/military/estate. Every event carries its precision.',
      abilities: ['honor the main line on this day / this month', 'the roster of dates to honor', 'on-this-day / in-month lookup', 'other dates of note'],
      hooks: ['public-only (living-private dates excluded)', 'precision flagged — a year-only anniversary is never shown as an exact date'],
    },
    {
      id: 'personas', name: 'Persona Agents (Becky + the line)', layer: 'specialist', status: 'live', autonomy: 'acts-bounded',
      modules: ['ui_kits/living-line/personas.js', 'api/persona.js'],
      system: 'Era-grounded archetype voices reconstructed from data.js, fed ONLY horizon-accessible facts; a live Claude voice when configured, a deterministic templated voice otherwise.',
      abilities: ['in-character dialogue', 'distinguish fact / interpretation / lore', 'never claim to know the future or invent kin'],
      hooks: ['temporal horizon', 'provenance.reconstructed honesty flag'],
    },
    {
      id: 'journey', name: 'Narrative Journey', layer: 'interaction', status: 'live', autonomy: 'advises',
      modules: ['ui_kits/living-line/journey.js'],
      system: 'A deterministic recommender over personas, open lines, the migration arc and the views; from a light user state it suggests the next step and surfaces a memory through the horizon-bounded subgraph.',
      abilities: ['recommend next persona / open line / section', 'proactive memory surfacing'],
      hooks: ['public-only (never recommends living-private)', 'memories drawn through MEM.access'],
    },
    {
      id: 'curator', name: 'Curator (editor-in-residence)', layer: 'interaction', status: 'live', autonomy: 'proposes',
      modules: ['ui_kits/living-line/curator.js'],
      system: 'Learns from the record’s current state and the calendar and proposes concrete site improvements — EDITS (no-narrative / no-source / reconstruction-only), SEASONAL features (the season’s chapter + this-year milestone anniversaries), and ADDITIONS (a Gen-5 "help solve this" callout, an open line to surface, an under-told spotlight).',
      abilities: ['suggest edits', 'seasonal / anniversary features', 'additions & spotlights', 'learns (skips applied suggestions)'],
      hooks: ['advisory — proposes, never edits the site', 'public-only (never proposes a living person)'],
    },
    {
      id: 'evidence-auditor', name: 'Evidence & Proof Auditor', layer: 'specialist', status: 'live', autonomy: 'acts-bounded',
      modules: ['ui_kits/living-line/kinship.js', 'research/bloodhound.md'],
      system: 'Resolves relational truth deterministically from the kinship graph, scores evidence tiers, and catches conflations / ruled-out kin; genealogy-graphrag is the rigorous reference.',
      abilities: ['<relation> of <person> resolution', 'tiering (never `confirmed` from an LLM)', 'eliminated-kin detection', 'gap detection'],
      hooks: ['corroboration counts independent SOURCES, not voices', 'eliminated-kin block'],
    },
    {
      id: 'circuit-breaker', name: 'Circuit Breaker & Safety', layer: 'governance', status: 'live', autonomy: 'acts-bounded',
      modules: ['ui_kits/living-line/governance.js', 'ui_kits/living-line/memory-graph.js'],
      system: 'The typed pre-action gate (allow / needs-approval / block) plus the structural temporal horizon — refusals are enforced before any effect, by named rules with thresholds, not prompts.',
      abilities: ['evaluatePolicy(action) → decision + violations', 'block myth / eliminated-kin / superseded / overclaim', 'route split votes & every write to a human'],
      hooks: ['pre-execution', 'supervised — the top tier (autonomous write) is unoccupied'],
    },
    {
      id: 'external-validation', name: 'External Research & Validation', layer: 'specialist', status: 'live', autonomy: 'proposes',
      modules: ['api/consensus.js'],
      system: 'Asks Claude + Grok + Gemini in parallel; a Claude adjudicator marks a claim corroborated only when ≥2 INDEPENDENT models agree — the guard against one model’s hallucination spreading as fact.',
      abilities: ['multi-model corroboration', 'flag single-source vs conflict', 'collapse same-source echoes'],
      hooks: ['≥2 independent sources to corroborate', 'never a primary record'],
    },
    {
      id: 'drift-auditor', name: 'Trust, Coherence & Drift Auditor', layer: 'governance', status: 'live', autonomy: 'proposes',
      modules: ['scripts/drift-audit.js'],
      system: 'A scheduled self-audit: re-runs the load-bearing invariants and attests to the governed state with a content-addressed digest + per-persona fingerprints vs a committed baseline.',
      abilities: ['invariant battery (horizon / refs / quarantine / supervised / supersession)', 'attestation + drift diff', 'alert PR on regression'],
      hooks: ['invariant failure = regression (non-zero exit)', 'propose-never-publish'],
    },
    {
      id: 'reflection', name: 'Reflection & Self-Improvement', layer: 'governance', status: 'live', autonomy: 'advises',
      modules: ['ui_kits/living-line/reflection.js'],
      system: 'Reads the graph for tier distribution, reconstruction-only personas, unsourced direct-line people and open-line clusters, and produces a ranked "what to work on next" report.',
      abilities: ['system-health stats', 'priority ranking (load-bearing first)', 'improvement proposals'],
      hooks: ['advises only — never writes, proposes nothing as fact'],
    },
    {
      id: 'resilience', name: 'Recovery & Resilience', layer: 'governance', status: 'cross-cutting', autonomy: 'acts-bounded',
      modules: [],
      system: 'Not one file but a discipline realized across the system: every external call degrades gracefully — the persona voice falls back to a templated voice with no key, consensus runs whatever provider subset is present, the memory client no-ops on outage, and the gate is a pure synchronous function.',
      abilities: ['graceful degradation on any dependency outage', 'a memory/consensus outage never fails a Keeper run'],
      hooks: ['fail safe, not silent — degrade rather than crash or fabricate'],
    },
  ];

  function byId(id) { return AGENTS.filter(function (a) { return a.id === id; })[0] || null; }
  function byLayer(layer) { return AGENTS.filter(function (a) { return a.layer === layer; }); }
  function modulesOf() { return AGENTS.reduce(function (acc, a) { return acc.concat(a.modules || []); }, []); }

  const API = { agents: AGENTS, byId: byId, byLayer: byLayer, modulesOf: modulesOf, LAYERS: LAYERS, STATUSES: STATUSES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_AGENTS = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
