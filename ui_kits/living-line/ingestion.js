/* ============================================================
   The Living Line — Ingestion & Provenance Agent  (window.CASON_INGESTION)
   ------------------------------------------------------------
   The governed FRONT DOOR for family contributions (a correction, a
   document, a story). It also carries the Family Contribution
   Gatekeeper's role: consent/privacy-tier assignment.

   SYSTEM: takes a raw contribution, ENTITY-LINKS it to a person in the
   graph (by id, else by matching names via the kinship resolver),
   assigns an HONEST provisional tier (always `possible` from intake — a
   human promotes it only after verifying any citation), attaches provenance
   (a primary citation boosts its score), assigns a PRIVACY tier (living/private
   details → authenticated-descendant), then runs the proposed record
   through the SAME governance gate the Keeper uses and ROUTES it:
     • block          → refuse (a myth / ruled-out kin / superseded value)
     • needs_approval → human moderation queue (propose, never publish)

   ABILITY: intake(contribution) -> { candidate, decision, route, reasons }.

   GOVERNANCE: incoming contributions are governed exactly like the
   Keeper's own proposals — the gate (no-quarantined-myth, no-eliminated-kin,
   no-superseded-value, no-overclaimed-record, lead-needs-human-merge) is the
   single chokepoint, so a family member cannot re-introduce a disproven
   claim, and nothing reaches the record without a human.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  const DEFAULT_BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
  const PRIMARY_HINT = /\b(deed|will|census|patent|probate|parish register|certificate|bible record|order book|deposition|p\.?\s?\d|page\s?\d)\b/i;
  const PRIVATE_HINT = /\b(living|private|address|phone|e-?mail|ssn|born\s+(?:19[5-9]\d|20\d\d))\b/i;

  function intake(contribution, deps) {
    contribution = contribution || {}; deps = deps || {};
    const data = deps.data || root.CASON_DATA || {};
    const KIN = deps.KIN || root.CASON_KINSHIP;
    const GOV = deps.GOV || root.CASON_GOVERNANCE;
    const SUP = deps.SUP || root.CASON_SUPERSESSIONS;
    const banned = deps.bannedPattern || DEFAULT_BANNED;
    const people = data.people || {};
    const text = String(contribution.text || '');

    // --- entity-link: explicit id if valid, else match a name from the graph ---
    let personId = contribution.personId && people[contribution.personId] ? contribution.personId : null;
    let linked = [];
    if (!personId && KIN && KIN.allPersonNames) {
      const tl = text.toLowerCase();
      linked = KIN.allPersonNames().filter(function (nm) { return nm[0] && tl.indexOf(nm[0]) !== -1; }).map(function (nm) { return nm[1]; });
      personId = linked[0] || null;
    }

    // --- honest tier cap: intake NEVER asserts above `possible`. A citation raises the
    //     provenance score for the reviewer, but only a human promotes the tier after
    //     verifying it (claiming `secondary` here would rightly trip the overclaim rule). ---
    const citation = String(contribution.citation || '');
    const hasPrimary = PRIMARY_HINT.test(citation + ' ' + text);
    const tier = 'possible';

    // --- gatekeeper: privacy tier for living/private details ---
    const person = personId ? people[personId] : null;
    const living = (person && (person.tags || []).indexOf('living') !== -1) || PRIVATE_HINT.test(text);
    const privacyTier = living ? 'authenticated_descendant' : 'public';

    const provenance = [{
      sourceId: 'contribution:' + (contribution.submitter || 'anon'),
      snippet: (citation || 'family contribution').slice(0, 160),
      score: hasPrimary ? 0.8 : 0.4,
    }];

    // --- run the SAME gate the Keeper runs ---
    const action = {
      kind: 'write_record',
      payload: { personId: personId || '(unlinked)', evidence: tier, text: text },
      justification: 'family contribution' + (contribution.submitter ? ' by ' + contribution.submitter : ''),
      provenance: provenance,
    };
    let decision = { decision: 'needs_approval', violations: [] };
    if (GOV) {
      const policy = GOV.buildKeeperPolicy({
        bannedPattern: banned,
        eliminatedPatterns: (KIN && KIN.eliminatedKin) ? KIN.eliminatedKin() : [],
        supersededValues: (SUP && SUP.values) ? SUP.values() : [],
        primaryThreshold: 1.0, consensusThreshold: 0.5,
      });
      decision = GOV.evaluatePolicy(action, policy);
    }
    const route = decision.decision === 'block' ? 'refuse'
      : decision.decision === 'allow' ? 'accepted' : 'human-queue';

    return {
      candidate: { personId: personId, linked: linked, evidence: tier, citationOffered: hasPrimary, text: text, privacyTier: privacyTier, provenance: provenance },
      decision: decision,
      route: route,
      reasons: (decision.violations || []).map(function (v) { return v.rule + ': ' + v.detail; }),
    };
  }

  const API = { intake: intake };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_INGESTION = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
