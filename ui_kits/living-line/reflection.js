/* ============================================================
   The Living Line — Reflection & Self-Improvement Agent  (window.CASON_REFLECTION)
   ------------------------------------------------------------
   SYSTEM: reads the derived graph and asks "where should the line's
   research go next?" — tier distribution, personas that are
   reconstruction-only, direct-line people with no cited source, and
   which open lines cluster on which person. Pure over (data, MEM, PERS).

   ABILITY: report() -> { stats, priorities[], proposals[] } — a ranked
   "what to work on" view (the load-bearing Gen-5 link first, then
   unsourced direct-line people, then the busiest open-line owners) plus
   plain-language improvement proposals.

   GOVERNANCE: it ADVISES only — it never writes to data.js and proposes
   nothing as fact; it complements the Keeper (coverage) and the Drift
   Auditor (health) with strategy. Deterministic, so the same graph yields
   the same report.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  function report(data, MEM, PERS) {
    data = data || root.CASON_DATA || {};
    MEM = MEM || root.CASON_MEMORY;
    PERS = PERS || root.CASON_PERSONAS;
    const people = data.people || {}, ids = Object.keys(people);

    const tiers = {};
    ids.forEach(function (id) { const t = people[id].evidence || 'possible'; tiers[t] = (tiers[t] || 0) + 1; });

    const directNoSources = ids.filter(function (id) { return people[id].direct && !((people[id].sources || []).length); });
    const reconstructed = ((PERS && PERS.list) || []).filter(function (p) { return p.provenance && p.provenance.reconstructed; }).length;

    const gaps = ((MEM && MEM.nodes) || []).filter(function (n) { return n.kind === 'gap'; });
    const byOwner = {};
    gaps.forEach(function (g) { byOwner[g.ownerId] = (byOwner[g.ownerId] || 0) + 1; });

    // priorities — ranked: the load-bearing unfilled slot, then unsourced direct line, then busiest open lines.
    const priorities = [];
    const slot = ids.filter(function (id) { return /UNFILLED SLOT/i.test(people[id].name || ''); })[0]; // the curated Gen-5 weakness
    if (slot) priorities.push({ rank: 1, item: slot, why: 'the load-bearing unfilled slot — the single highest-value unknown' });
    directNoSources.slice(0, 5).forEach(function (id) { priorities.push({ rank: 2, item: id, why: (people[id].name || id) + ' is on the direct line but cites no source yet' }); });
    Object.keys(byOwner).sort(function (a, b) { return byOwner[b] - byOwner[a]; }).slice(0, 4).forEach(function (id) {
      if (id !== slot) priorities.push({ rank: 3, item: id, why: ((people[id] && people[id].name) || id) + ' carries ' + byOwner[id] + ' open line(s)' });
    });

    const proposals = [];
    proposals.push((tiers.confirmed || 0) + '/' + ids.length + ' people are confirmed; ' + (tiers.possible || 0) + ' sit at "possible" — that is the research frontier.');
    if (reconstructed) proposals.push(reconstructed + ' personas are reconstruction-only — a single documented detail would lift each off the floor.');
    if (directNoSources.length) proposals.push(directNoSources.length + ' direct-line ' + (directNoSources.length === 1 ? 'person cites' : 'people cite') + ' no source yet — these are the load-bearing citations to find.');
    proposals.push(gaps.length + ' open lines across ' + Object.keys(byOwner).length + ' people; the Keeper works the highest-ranked first.');

    return {
      stats: { people: ids.length, tiers: tiers, gaps: gaps.length, reconstructed: reconstructed, directNoSources: directNoSources.length },
      priorities: priorities,
      proposals: proposals,
    };
  }

  const API = { report: report };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_REFLECTION = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
