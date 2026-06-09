/* ============================================================
   The Living Line — Governance Gate + Trace  (window.CASON_GOVERNANCE)
   ------------------------------------------------------------
   The typed, pre-action policy gate the sibling repo `governed-agents`
   defines — ported here so the family site decides "propose / block /
   route-to-human" with the SAME three-tier model, named rules with
   thresholds, and the SAME NDJSON `TraceEvent` wire format the demo
   emits. One governance contract, two surfaces.

   Faithful to governed-agents `lib/governance.ts` and `lib/trace-events.ts`:
     • Decision      = "allow" | "block" | "needs_approval"   (block > review > allow)
     • evaluatePolicy(action, rules) -> { decision, violations, evaluatedAt }
     • PolicyRule    = { name, evaluate(action) -> violation | null }
     • TraceEvent    = run_started | step_started | step_completed |
                       action_proposed | gate_decision | executed |
                       halted | awaiting_approval | run_completed | error
   governed-agents stays the canonical, typed home of this gate (and its
   live "edit a threshold → the decision flips" demo); this is the
   no-build, dependency-free realization that runs in the Keeper.

   The rules here are the family record's policy, expressed as named
   thresholds rather than inline conditionals — the bloodhound's honesty
   bar made legible and tunable:
     • a record must cite a source                  (require-provenance, block)
     • never echo a quarantined myth                (no-quarantined-myth, block)
     • never revive a ruled-out ancestor as kin     (no-eliminated-kin, block)
     • never link two patrilines a Y-DNA haplogroup
       exclusion keeps apart (Cason↔Causey)          (no-haplogroup-conflict, block)
     • never write `confirmed`/`secondary` without a
       primary document scoring >= primaryThreshold  (no-overclaimed-record, block)
     • a split model vote routes to a human         (require-model-consensus, review)
     • every lead parks for the human merge gate    (lead-needs-human-merge, review)

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  function now() { return new Date().toISOString(); }
  function severityOf(v) { return v.severity || 'block'; }

  /* ---- the gate (identical semantics to governed-agents evaluatePolicy) ----
     A hard block beats a review request; a review request beats allow. */
  function evaluatePolicy(action, rules) {
    const violations = (rules || [])
      .map(function (r) { return r.evaluate(action); })
      .filter(function (v) { return v !== null && v !== undefined; });
    const hasBlock = violations.some(function (v) { return severityOf(v) === 'block'; });
    const hasReview = violations.some(function (v) { return severityOf(v) === 'review'; });
    const decision = hasBlock ? 'block' : hasReview ? 'needs_approval' : 'allow';
    return { decision: decision, violations: violations, evaluatedAt: now() };
  }

  /* ---- helpers ---- */
  function payloadText(payload) {
    return Object.keys(payload || {})
      .map(function (k) { return payload[k]; })
      .filter(function (v) { return typeof v === 'string'; })
      .join(' \n ');
  }
  function actionText(a) { return [payloadText(a.payload), a.justification].filter(Boolean).join(' \n '); }

  /* ---- the policy rules ---- */
  // a proposed record must rest on at least one source.
  const requireProvenance = {
    name: 'require-provenance',
    evaluate: function (a) {
      if (a.kind !== 'write_record') return null;
      return (a.provenance || []).length === 0
        ? { rule: 'require-provenance', detail: 'a proposed record cites no source' }
        : null;
    },
  };

  // never echo a quarantined myth (the disproven list) as a fact.
  function makeNoQuarantinedMyth(bannedPattern) {
    return {
      name: 'no-quarantined-myth',
      evaluate: function (a) {
        if (!bannedPattern) return null;
        return bannedPattern.test(actionText(a))
          ? { rule: 'no-quarantined-myth', detail: 'content repeats a quarantined (disproven) claim' }
          : null;
      },
    };
  }

  // never revive a person the family ruled out (evidence: 'eliminated') as kin.
  function makeNoEliminatedKin(eliminatedPatterns) {
    return {
      name: 'no-eliminated-kin',
      evaluate: function (a) {
        const text = actionText(a);
        const hit = (eliminatedPatterns || []).filter(function (e) { return e.pattern.test(text); });
        return hit.length
          ? { rule: 'no-eliminated-kin', detail: 'names a ruled-out ancestor as kin — ' + hit.map(function (e) { return e.name; }).join(', ') }
          : null;
      },
    };
  }

  // the honesty bar as a threshold: a record claimed at a PRIMARY-DOCUMENT tier
  // (`confirmed`/`secondary`) needs a source scoring >= primaryThreshold. Model
  // consensus never reaches it, so an AI-sourced confirmed/secondary is blocked.
  // `leading`/`possible` are the legitimate autonomous proposal tiers and pass.
  const OVERCLAIM_TIERS = { confirmed: 1, secondary: 1 };
  function makeNoOverclaimedRecord(primaryThreshold) {
    const thr = primaryThreshold == null ? 1.0 : primaryThreshold;
    return {
      name: 'no-overclaimed-record',
      evaluate: function (a) {
        if (a.kind !== 'write_record') return null;
        const tier = a.payload && a.payload.evidence;
        if (!OVERCLAIM_TIERS[tier]) return null;
        const hasPrimary = (a.provenance || []).some(function (p) { return p.score >= thr; });
        return hasPrimary ? null : {
          rule: 'no-overclaimed-record',
          detail: 'record claimed at `' + tier + '` but no source scores >= ' + thr.toFixed(2) + ' (an LLM is not a primary record)',
        };
      },
    };
  }

  // a split model vote routes to a human rather than acting on disagreement.
  function makeRequireModelConsensus(consensusThreshold) {
    const thr = consensusThreshold == null ? 0.5 : consensusThreshold;
    return {
      name: 'require-model-consensus',
      evaluate: function (a) {
        const c = a.consensus;
        if (!c) return null;
        const participating = (c.votes || []).filter(function (v) { return v.abstained !== true; }).length;
        if (participating < 2) return null;
        return c.agreementRatio < thr
          ? { rule: 'require-model-consensus', detail: Math.round(c.agreementRatio * 100) + '% model agreement is below the ' + Math.round(thr * 100) + '% required', severity: 'review' }
          : null;
      },
    };
  }

  // near-objective safety (the GPS-grade constraint): a Y-DNA haplogroup is
  // inherited father-to-son, so two surnames in different haplogroups cannot
  // share a direct paternal line. A merge/link that crosses a documented
  // exclusion is not low-confidence — it is provably wrong. Hard block.
  const PATRILINE = /patriline|paternal line|same male line|same male\b|y-?dna|same family|one (male )?line/i;
  function makeNoHaplogroupConflict(exclusions) {
    const list = (exclusions || []).map(function (e) {
      return { a: String(e.a).toLowerCase(), b: String(e.b).toLowerCase(), basis: e.basis, a0: e.a, b0: e.b };
    });
    function surnamesOf(a) {
      return (a.payload && Array.isArray(a.payload.surnames)) ? a.payload.surnames.map(function (s) { return String(s).toLowerCase(); }) : null;
    }
    return {
      name: 'no-haplogroup-conflict',
      evaluate: function (a) {
        const isMerge = a.kind === 'merge_persons' || a.kind === 'link_patriline';
        const claim = a.payload && (a.payload.claim || a.payload.relation);
        const assertsPatriline = isMerge || (a.kind === 'write_record' && (claim === 'patriline' || PATRILINE.test(actionText(a))));
        if (!assertsPatriline) return null;
        const given = surnamesOf(a);
        const text = given ? null : actionText(a).toLowerCase();
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          const hit = given
            ? (given.indexOf(p.a) !== -1 && given.indexOf(p.b) !== -1)
            : (new RegExp('\\b' + p.a + '\\b').test(text) && new RegExp('\\b' + p.b + '\\b').test(text));
          if (hit) return { rule: 'no-haplogroup-conflict', detail: 'proposes a paternal link across a Y-DNA exclusion (' + p.a0 + ' ↔ ' + p.b0 + '): ' + p.basis, severity: 'block' };
        }
        return null;
      },
    };
  }

  // propose, never publish: every lead parks for the human merge gate.
  const leadNeedsHumanMerge = {
    name: 'lead-needs-human-merge',
    evaluate: function (a) {
      return a.kind === 'write_record'
        ? { rule: 'lead-needs-human-merge', detail: 'a lead is proposed for the dossier; a human merges to accept', severity: 'review' }
        : null;
    },
  };

  /** Assemble the Keeper's policy from a config; rule order is stable. */
  function buildKeeperPolicy(config) {
    config = config || {};
    return [
      requireProvenance,
      makeNoQuarantinedMyth(config.bannedPattern),
      makeNoEliminatedKin(config.eliminatedPatterns),
      makeNoHaplogroupConflict(config.dnaExclusions),
      makeNoOverclaimedRecord(config.primaryThreshold),
      makeRequireModelConsensus(config.consensusThreshold),
      leadNeedsHumanMerge,
    ];
  }

  /* ---- the NDJSON trace (same TraceEvent schema as governed-agents) ---- */
  function newRunId() { return 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function Trace(task) {
    const runId = newRunId();
    const events = [];
    function push(e) { e.at = now(); events.push(e); return e; }
    return {
      runId: runId,
      runStarted: function () { return push({ type: 'run_started', runId: runId, task: task }); },
      stepStarted: function (stepId, role) { return push({ type: 'step_started', stepId: stepId, role: role }); },
      stepCompleted: function (stepId, role, summary, provenance) { return push({ type: 'step_completed', stepId: stepId, role: role, summary: summary, provenance: provenance || [] }); },
      actionProposed: function (stepId, action) { return push({ type: 'action_proposed', stepId: stepId, action: action }); },
      gateDecision: function (stepId, decision) { return push({ type: 'gate_decision', stepId: stepId, decision: decision }); },
      executed: function (stepId, result) { return push({ type: 'executed', stepId: stepId, result: result }); },
      awaitingApproval: function (stepId, reason) { return push({ type: 'awaiting_approval', stepId: stepId, reason: reason }); },
      halted: function (stepId, reason) { return push({ type: 'halted', stepId: stepId, reason: reason }); },
      runCompleted: function () { return push({ type: 'run_completed', runId: runId }); },
      error: function (message) { return push({ type: 'error', message: message }); },
      events: function () { return events.slice(); },
      toNdjson: function () { return events.map(function (e) { return JSON.stringify(e); }).join('\n') + '\n'; },
    };
  }

  // map a gate decision to the trace's terminal event (mirrors loop.ts step 4).
  function reasonOf(decision, severity) {
    return decision.violations
      .filter(function (v) { return severity ? severityOf(v) === severity : true; })
      .map(function (v) { return v.rule + ': ' + v.detail; })
      .join('; ');
  }

  const API = {
    evaluatePolicy: evaluatePolicy,
    buildKeeperPolicy: buildKeeperPolicy,
    Trace: Trace,
    reasonOf: reasonOf,
    // rules exposed for testing / reuse
    requireProvenance: requireProvenance,
    makeNoQuarantinedMyth: makeNoQuarantinedMyth,
    makeNoEliminatedKin: makeNoEliminatedKin,
    makeNoHaplogroupConflict: makeNoHaplogroupConflict,
    makeNoOverclaimedRecord: makeNoOverclaimedRecord,
    makeRequireModelConsensus: makeRequireModelConsensus,
    leadNeedsHumanMerge: leadNeedsHumanMerge,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_GOVERNANCE = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
