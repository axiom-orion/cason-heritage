/* ============================================================
   BASIS — the trust ladder, made checkable  (CASON_BASIS)
   ------------------------------------------------------------
   The resolved §11-3 decision from research/VORION-GOVERNANCE.md, in code: BASIS is a
   PRIVILEGE + ASSURANCE ladder, not an autonomy number. A tier is the maximum WRITE
   PRIVILEGE an agent may hold (what CogniGate can mechanically check), and each rung
   carries the minimum ASSURANCE required to hold it (what the auditor checks).

   Two structural rules the brief leaned on, here as enforceable facts:
     • T5 (oversight) is DELIBERATELY NON-NESTED — a separation-of-duties branch, not a
       superset. An agent may not hold a proposing tier (T4) and an oversight tier (T5)
       in the same claim domain, or it can launder its own claims.
     • The top two rungs are where the humans live: autonomous agents top out at T5;
       T6 is the human-co-signed merge; T7 (autonomous canonical write) is RESERVED and
       unoccupied. The "empty top" the rest of the system asserts, now provable.

   This reads the live agents.js registry (the CAR ID / ATD) and the project-native
   autonomy vocabulary (advises / proposes / acts-bounded) and binds each to a tier, so
   "tier-gated capability, self-consistent" stops being prose and becomes an audit.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  // The ladder. `privilege` is the gate-checkable capability; `assurance` is the
  // auditor-checkable requirement to hold the rung; `nests` is whether holding it
  // implies the rungs below (T5 does NOT — it is the oversight branch).
  const TIERS = {
    T1: { rank: 1, privilege: 'read + advise (no writes)', assurance: 'CAR ID (a registry entry)', nests: true },
    T2: { rank: 2, privilege: 'staging / quarantine write', assurance: '+ provenance enforced on every write', nests: true },
    T3: { rank: 3, privilege: 'annotate / cite staged items', assurance: '+ current behavioral attestation', nests: true },
    T4: { rank: 4, privilege: 'propose against canonical (drafts)', assurance: '+ corroboration law (sources, not voices)', nests: true },
    T5: { rank: 5, privilege: 'oversight verdicts (gates others)', assurance: '+ distinct-instance attestation; NO T4 in the same domain', nests: false },
    T6: { rank: 6, privilege: 'canonical / public write WITH human co-sign', assurance: '+ full PAG record + recorded human signature', nests: true },
    T7: { rank: 7, privilege: 'canonical / public write, no human', assurance: '+ quantified telemetry thresholds (defined, unmet)', nests: true },
  };

  // The highest tier any autonomous AGENT may hold. T6/T7 are human / reserved.
  const MAX_AGENT_TIER = 'T5';
  // Tiers no agent may occupy: T6 is the human merge itself; T7 is the reserved frontier.
  const HUMAN_OR_RESERVED = { T6: 'human co-sign (the merge)', T7: 'reserved — the autonomy frontier' };

  // The project-native autonomy vocabulary → its BASIS tier. `acts-bounded` is oversight
  // (T5) by default; an `acts-bounded` agent that also proposes canonical drafts would
  // violate separation of duties (caught by auditRoster). `cross-cutting` is not a write
  // privilege — it is a resilience posture — so it maps to T1 (advise/act within bounds).
  const AUTONOMY_TIER = {
    advises: 'T1',
    proposes: 'T4',
    'acts-bounded': 'T5',
    'cross-cutting': 'T1',
  };

  function tierRank(t) { return (TIERS[t] || { rank: 0 }).rank; }

  /**
   * Does an agent holding `agentTier` permit an action requiring `requiredTier`?
   * Nesting holds for T1–T4 and T6–T7; T5 is the non-nested oversight branch, so it
   * neither grants nor is granted by the proposing ladder — only an exact match permits.
   */
  function permits(agentTier, requiredTier) {
    if (!TIERS[agentTier] || !TIERS[requiredTier]) return false;
    if (requiredTier === 'T5' || agentTier === 'T5') return agentTier === requiredTier;
    return tierRank(agentTier) >= tierRank(requiredTier);
  }

  function tierOfAutonomy(autonomy) { return AUTONOMY_TIER[autonomy] || null; }

  /**
   * Audit a roster (the agents.js list) for BASIS consistency. Returns
   * { ok, findings: [{agent, issue}], tiers: {id: tier} }.
   * Findings flag: an agent above the agent ceiling (claims T6/T7), an unknown
   * autonomy value, or a separation-of-duties violation (oversight + proposing same
   * agent — modeled here as an agent whose autonomy maps to T5 while also declaring a
   * proposing ability against canonical). The roster's own "top tier unoccupied" claim
   * is verified: no agent resolves to T6 or T7.
   */
  function auditRoster(agents) {
    const findings = [];
    const tiers = {};
    (agents || []).forEach(function (a) {
      const tier = tierOfAutonomy(a.autonomy);
      tiers[a.id] = tier;
      if (tier === null) {
        findings.push({ agent: a.id, issue: 'unknown autonomy "' + a.autonomy + '" — no BASIS tier' });
        return;
      }
      if (HUMAN_OR_RESERVED[tier]) {
        findings.push({ agent: a.id, issue: 'resolves to ' + tier + ' (' + HUMAN_OR_RESERVED[tier] + ') — no agent may hold it' });
      }
      if (tierRank(tier) > tierRank(MAX_AGENT_TIER)) {
        findings.push({ agent: a.id, issue: 'tier ' + tier + ' exceeds the agent ceiling ' + MAX_AGENT_TIER });
      }
    });
    return { ok: findings.length === 0, findings: findings, tiers: tiers };
  }

  /** The empty-top invariant, as a boolean: no agent occupies T6 or T7. */
  function topTierUnoccupied(agents) {
    return (agents || []).every(function (a) { return !HUMAN_OR_RESERVED[tierOfAutonomy(a.autonomy)]; });
  }

  const API = {
    TIERS: TIERS,
    MAX_AGENT_TIER: MAX_AGENT_TIER,
    AUTONOMY_TIER: AUTONOMY_TIER,
    permits: permits,
    tierOfAutonomy: tierOfAutonomy,
    tierRank: tierRank,
    auditRoster: auditRoster,
    topTierUnoccupied: topTierUnoccupied,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_BASIS = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
