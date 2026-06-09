/* ============================================================
   The Living Line — Curator Agent  (window.CASON_CURATOR)
   ------------------------------------------------------------
   The site's editor-in-residence: it learns from the record's current
   state and the calendar, and proposes concrete improvements — EDITS,
   SEASONAL features, and ADDITIONS — for a human to apply. It never
   edits the site itself; it suggests (propose, never publish).

   SYSTEM: pure over (data, MEM, PERS, now). Reads real birth/death years,
   narratives, sources, reconstructed personas, and open lines, plus the
   current date, and emits:
     • seasonal — the season's thematic chapter + this-year milestone
       anniversaries (25/50-year) of dated direct-line events;
     • edits    — direct-line people with no narrative / no source, and
       reconstruction-only personas that a documented detail would lift;
     • additions — a "help solve this" callout for the load-bearing Gen-5
       slot, an open line to surface to visitors, an under-told spotlight.

   IT LEARNS: the suggestions change as the record changes (deterministic
   over current state + date), and when the durable memory is configured the
   Keeper can pass `applied` ids so the Curator stops re-proposing what's done.

   ABILITY: suggest(now, deps) -> { asOf, season, seasonal[], edits[], additions[] }.
   GOVERNANCE: advisory; public-only (never proposes a living person).

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  // month 0–11 → season (Dec/Jan/Feb = winter).
  function season(m) { return (m === 11 || m <= 1) ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn'; }
  const SEASON_THEME = {
    winter: { theme: 'the seasoning sickness', line: 'the brutal first winters of the Virginia years — a season for the survival chapters.' },
    spring: { theme: 'planting & new ground', line: 'tobacco planting and fresh land — a season for the colonial homesteads.' },
    summer: { theme: 'the long roads', line: 'travel and the frontier — a season for the migration map.' },
    autumn: { theme: 'the walk south', line: 'the 1823 crossing into Florida came in the fall — a season for the Florida chapter.' },
  };
  function yearOf(p, which) {
    const e = p[which];
    if (e && e.year) return e.year;
    const m = String(p.lifespan || '').match(/1[5-9]\d\d|20\d\d/g);
    if (m) return which === 'born' ? +m[0] : +m[m.length - 1];
    return null;
  }
  function isLiving(p) { return !!p && (p.tags || []).indexOf('living') !== -1; }

  function suggest(now, deps) {
    now = now || new Date(); deps = deps || {};
    const data = deps.data || root.CASON_DATA || {};
    const MEM = deps.MEM || root.CASON_MEMORY;
    const PERS = deps.PERS || root.CASON_PERSONAS;
    const applied = deps.applied || {};               // ids the Curator has learned were acted on
    const people = data.people || {}, ids = Object.keys(people);
    const year = now.getFullYear(), s = season(now.getMonth());
    const used = function (k) { return applied[k]; };

    // --- seasonal: the season's chapter + this-year milestone anniversaries ---
    const seasonal = [{ title: 'Season — ' + s + ': ' + SEASON_THEME[s].theme, why: SEASON_THEME[s].line }];
    const annivs = [];
    ids.forEach(function (id) {
      const p = people[id]; if (isLiving(p)) return;
      [['born', 'born'], ['died', 'died']].forEach(function (w) {
        const y = yearOf(p, w[0]);
        if (y && y < year) { const ago = year - y; if (ago % 25 === 0) annivs.push({ person: id, years: ago, kind: w[1], y: y }); }
      });
    });
    annivs.sort(function (a, b) { return (b.years % 50 === 0 ? 1 : 0) - (a.years % 50 === 0 ? 1 : 0) || b.years - a.years; });
    annivs.slice(0, 3).forEach(function (a) {
      seasonal.push({ title: a.years + ' years since ' + people[a.person].name + ' ' + (a.kind === 'died' ? 'died' : 'was born') + ' (' + a.y + ')', why: 'a milestone in ' + year + ' — a candidate to feature on the homepage.' });
    });

    // --- edits: concrete record improvements (direct line first) ---
    const edits = [];
    function pushEdit(id, suggestion) { if (!used('edit:' + id) && !edits.some(function (e) { return e.person === id; })) edits.push({ person: id, suggestion: suggestion }); }
    ids.filter(function (id) { return people[id].direct && !((people[id].narrative || '').trim()); }).slice(0, 4)
      .forEach(function (id) { pushEdit(id, (people[id].name || id) + ' has no narrative — add a few sourced sentences.'); });
    ((PERS && PERS.list) || []).filter(function (p) { return p.provenance && p.provenance.reconstructed && people[p.id] && people[p.id].direct; }).slice(0, 4)
      .forEach(function (p) { pushEdit(p.id, (people[p.id].name || p.id) + ' is reconstruction-only — a documented detail would lift the persona off the floor.'); });
    ids.filter(function (id) { return people[id].direct && !((people[id].sources || []).length); }).slice(0, 3)
      .forEach(function (id) { pushEdit(id, (people[id].name || id) + ' cites no source — add the record it rests on.'); });

    // --- additions: new content to consider ---
    const additions = [];
    function pushAdd(key, kind, suggestion) { if (!used('add:' + key)) additions.push({ kind: kind, suggestion: suggestion }); }
    const slot = ids.filter(function (id) { return /UNFILLED SLOT/i.test(people[id].name || ''); })[0];
    if (slot) pushAdd('gen5', 'feature', 'A "help solve this" callout for the load-bearing Gen-5 link (' + people[slot].name + ').');
    const gaps = ((MEM && MEM.nodes) || []).filter(function (n) { return n.kind === 'gap'; });
    if (gaps[0]) pushAdd('openline:' + gaps[0].ownerId, 'open-line', 'Surface the open line on ' + ((people[gaps[0].ownerId] || {}).name || gaps[0].ownerId) + ' as a visitor "can you help?" prompt.');
    const spotlight = ids.filter(function (id) { return people[id].direct && !isLiving(people[id]) && (people[id].narrative || '').length < 120; })[0];
    if (spotlight) pushAdd('spotlight:' + spotlight, 'spotlight', 'A persona spotlight for ' + people[spotlight].name + ' — under-told on the direct line.');

    return { asOf: now.toISOString().slice(0, 10), season: s, seasonal: seasonal, edits: edits, additions: additions };
  }

  const API = { suggest: suggest, season: season };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_CURATOR = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
