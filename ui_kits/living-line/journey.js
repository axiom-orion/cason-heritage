/* ============================================================
   The Living Line — Narrative Journey Agent  (window.CASON_JOURNEY)
   ------------------------------------------------------------
   SYSTEM: a deterministic recommender over the REAL data — personas
   (CASON_PERSONAS), open lines (CASON_MEMORY gap nodes), the migration
   arc (generations), and a fixed set of views. Given a light user state
   (which views seen, which personas met, the last persona), it suggests
   where to go next and proactively surfaces a memory from the last
   persona's own horizon-bounded reach.

   ABILITY: recommend(state) -> a short, ordered list of next steps
   (a persona to meet · an open line to explore · a section to see · a
   memory to surface), each with a plain "why".

   GOVERNANCE: bounded to public personas/facts — it never recommends a
   person tagged `living` or surfaces a private detail, and it draws
   memories only through `MEM.access` (the temporal-horizon circuit
   breaker), so a surfaced memory can never leak beyond what that persona
   could know. It advises; it never writes.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  const VIEWS = [
    { id: 'homestead', label: 'the homestead' },
    { id: 'day', label: 'a day in this life' },
    { id: 'people', label: 'the people' },
    { id: 'lines', label: 'the open lines' },
    { id: 'hearth', label: 'the memory hearth' },
    { id: 'arc', label: 'the long move' },
    { id: 'gov', label: 'the glass box (governance)' },
  ];
  function isLiving(p) { return !!p && (p.tags || []).indexOf('living') !== -1; }
  function nameOf(people, id) { return (people[id] && people[id].name) || id; }

  function recommend(state, deps) {
    state = state || {}; deps = deps || {};
    const data = deps.data || root.CASON_DATA || {};
    const MEM = deps.MEM || root.CASON_MEMORY;
    const PERS = deps.PERS || root.CASON_PERSONAS;
    const people = data.people || {};
    const visited = state.visited || [];
    const met = state.personas || [];
    const last = state.lastPersonId && people[state.lastPersonId] ? people[state.lastPersonId] : null;
    const lastGen = last ? last.generation : null;
    const recs = [];

    // 1. next persona — adjacent generation to the last one met, public, unmet, prefer the direct line.
    if (PERS && PERS.list) {
      const cand = PERS.list
        .filter(function (p) { return !isLiving(people[p.id]) && met.indexOf(p.id) !== -1 ? false : !isLiving(people[p.id]); })
        .filter(function (p) { return met.indexOf(p.id) === -1; })
        .sort(function (a, b) {
          const pa = people[a.id] || {}, pb = people[b.id] || {};
          const da = lastGen == null ? 0 : Math.abs((pa.generation || 0) - (lastGen + 1));
          const db = lastGen == null ? 0 : Math.abs((pb.generation || 0) - (lastGen + 1));
          if (da !== db) return da - db;
          return (pb.direct ? 1 : 0) - (pa.direct ? 1 : 0);
        });
      if (cand[0]) recs.push({ kind: 'persona', id: cand[0].id, why: last ? ('the line moves on from ' + (last.name || state.lastPersonId) + ' — meet ' + nameOf(people, cand[0].id)) : ('begin with ' + nameOf(people, cand[0].id)) });
    }

    // 2. an open line worth exploring — one owned by a persona met, else the load-bearing Gen-5 link.
    const gaps = ((MEM && MEM.nodes) || []).filter(function (n) { return n.kind === 'gap'; });
    const gap = gaps.filter(function (g) { return met.indexOf(g.ownerId) !== -1; })[0]
      || gaps.filter(function (g) { return g.ownerId === 'james-1727'; })[0] || gaps[0];
    if (gap) recs.push({ kind: 'openline', id: gap.ownerId, why: 'an unresolved thread: ' + String(gap.text || '').slice(0, 90) });

    // 3. a section not yet seen.
    const view = VIEWS.filter(function (v) { return visited.indexOf(v.id) === -1; })[0];
    if (view) recs.push({ kind: 'section', id: view.id, why: 'you haven’t yet seen ' + view.label });

    // 4. proactive memory surfacing — only through the horizon-bounded subgraph.
    if (last && MEM && MEM.access) {
      const sub = MEM.access(state.lastPersonId) || {};
      const fact = ((sub.individual || []).concat(sub.family || [])).filter(function (n) { return n.kind !== 'gap' && n.text; })[0];
      if (fact) recs.push({ kind: 'memory', id: state.lastPersonId, why: 'from ' + (last.name) + '’s own memory: ' + String(fact.text).slice(0, 90) });
    }

    return recs;
  }

  const API = { recommend: recommend, VIEWS: VIEWS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_JOURNEY = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
