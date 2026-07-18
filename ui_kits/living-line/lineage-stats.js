/* ============================================================
   The Living Line — Lineage statistics  (window.CASON_STATS)
   ------------------------------------------------------------
   The numbers, computed from the verified record (window.CASON_DATA)
   over the full audited tree (Thomas Casson down):

     - descendants(rootId): every descendant, counted by generation
       (pure parent/child graph — fully reliable, needs no dates).
     - per-generation life-stage stats: how many reached parenthood,
       how many lived to meet a grandchild, and a great-grandchild —
       each with a "determinable" denominator, since many people have
       no recorded dates.
     - aliveByYear: an extended-family population curve. Two series:
       `known` (only people with both birth and death recorded) and
       `estimated` (gaps filled from generation and kin, clearly a
       reconstruction, never asserted as fact).

   Honesty first: anything derived from missing dates is reported as
   estimated / determinable-out-of-total, never dressed up as a count.

   Runs no-build in the browser (window) and under Node
   (module.exports). No regex lookbehind (iOS Safari < 16.4). ASCII.
   ============================================================ */
(function (root) {
  'use strict';

  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
  var PRESENT = 2026;
  var LIFESPAN_EST = 68;   // avg lifespan used only to estimate an unknown death
  var GEN_GAP_EST = 30;    // years per generation, used only for estimates

  function years(s) {
    var out = [], re = /\d{4}/g, m;
    while ((m = re.exec(String(s || ''))) !== null) out.push(parseInt(m[0], 10));
    return out;
  }
  function birthYearOf(p) {
    if (p.born && typeof p.born.year === 'number') return p.born.year;
    var y = years(p.lifespan);
    return y.length ? y[0] : null;
  }
  function deathYearOf(p) {
    if (p.died && typeof p.died.year === 'number') return p.died.year;
    var y = years(p.lifespan);
    if (y.length >= 2) return y[y.length - 1];
    if (y.length === 1 && /\bd\.?\s/i.test(p.lifespan || '')) return y[0];
    return null;
  }
  // Living: no death on record and born (or estimated) in the modern era.
  function isLiving(p, b, d) {
    if (d != null) return false;
    if (b != null && b >= 1915) return true;
    if (b == null && (p.tags || []).indexOf('living') !== -1) return true;
    return false;
  }

  /* ---- child index: reverse of `parents` (more complete than the
     `children` field, which is only filled for some people) ---- */
  function childIndex(people) {
    var kids = {};
    Object.keys(people).forEach(function (id) { kids[id] = []; });
    Object.keys(people).forEach(function (id) {
      (people[id].parents || []).forEach(function (par) {
        if (kids[par]) kids[par].push(id);
      });
    });
    // union with any explicitly listed children not caught above
    Object.keys(people).forEach(function (id) {
      (people[id].children || []).forEach(function (c) {
        if (people[c] && kids[id].indexOf(c) === -1) kids[id].push(c);
      });
    });
    return kids;
  }

  function descendantsAtDepth(kids, id, depth) {
    var frontier = [id];
    for (var lvl = 0; lvl < depth; lvl++) {
      var next = [];
      frontier.forEach(function (x) { (kids[x] || []).forEach(function (c) { if (next.indexOf(c) === -1) next.push(c); }); });
      frontier = next;
    }
    return frontier;
  }

  /* all descendants of a root, grouped by DEPTH below the root */
  function descendantsOf(people, kids, rootId) {
    var byDepth = {}, all = [], seen = {};
    var frontier = [rootId], depth = 0;
    while (frontier.length) {
      var next = [];
      frontier.forEach(function (x) {
        (kids[x] || []).forEach(function (c) {
          if (!seen[c]) { seen[c] = 1; all.push(c); (byDepth[depth + 1] = byDepth[depth + 1] || []).push(c); next.push(c); }
        });
      });
      frontier = next; depth++;
      if (depth > 40) break; // cycle backstop
    }
    // group by actual generation number too
    var byGen = {};
    all.forEach(function (id) {
      var g = people[id].generation;
      byGen[g] = (byGen[g] || 0) + 1;
    });
    return { total: all.length, ids: all, byDepth: byDepth, byGen: byGen };
  }

  /* ---- generation representative birth year (for estimates only) ---- */
  function genBirthEstimates(people) {
    var sum = {}, cnt = {};
    Object.keys(people).forEach(function (id) {
      var p = people[id], g = p.generation, b = birthYearOf(p);
      if (typeof g !== 'number' || g < 1) return;
      if (b != null) { sum[g] = (sum[g] || 0) + b; cnt[g] = (cnt[g] || 0) + 1; }
    });
    var est = {};
    for (var g = 1; g <= 14; g++) {
      if (cnt[g]) est[g] = Math.round(sum[g] / cnt[g]);
    }
    // fill gens with no known birth by interpolating/extrapolating gen 1 anchor
    var anchor = est[1] != null ? est[1] : 1604;
    for (var gg = 1; gg <= 14; gg++) {
      if (est[gg] == null) est[gg] = anchor + (gg - 1) * GEN_GAP_EST;
    }
    return est;
  }

  function estBirth(p, genEst) {
    var b = birthYearOf(p);
    if (b != null) return b;
    var g = p.generation;
    return (typeof g === 'number' && genEst[g] != null) ? genEst[g] : null;
  }
  function estDeath(p, b, living) {
    var d = deathYearOf(p);
    if (d != null) return d;
    if (living) return PRESENT;
    if (b != null) return Math.min(PRESENT, b + LIFESPAN_EST);
    return null;
  }

  /* ---- the families that married into the line (widen beyond one descent) ---- */
  var NAME_STOP = { Ann: 1, Nell: 1, Mae: 1, Lucy: 1, Jr: 1, Sr: 1, II: 1, III: 1, Cason: 1, Casson: 1 };
  function surnameOf(name) {
    var m = String(name).match(/n[eé]e\s+([A-Z][A-Za-z'’]+)/);
    if (m) return m[1];
    var clean = String(name).replace(/["'‘’][^"'‘’]*["'‘’]/g, ' ').replace(/\([^)]*\)/g, ' ').trim();
    var toks = clean.split(/\s+/).filter(Boolean);
    if (toks.length < 2) return null;
    var last = toks[toks.length - 1];
    if (last.length < 3 || NAME_STOP[last]) return null;
    return last;
  }
  function marriedFamilies(people) {
    var fam = {};
    Object.keys(people).forEach(function (id) {
      var p = people[id];
      (p.spouse || []).forEach(function (sid) {
        var s = people[sid];
        if (!s || /cason|casson/i.test(s.name)) return;   // born into the line, not married-in
        var sur = surnameOf(s.name);
        if (!sur) return;
        (fam[sur] = fam[sur] || { surname: sur, marriages: [] });
        fam[sur].marriages.push({ who: s.name, into: p.name });
      });
      // Cason women who took a married surname: "Mary Cason Tuck" -> Tuck
      var mm = String(p.name).match(/Cason\s+([A-Z][A-Za-z'’]+)\b/);
      if (mm && !NAME_STOP[mm[1]] && mm[1].length >= 3) {
        var sur2 = mm[1];
        (fam[sur2] = fam[sur2] || { surname: sur2, marriages: [] });
        if (!fam[sur2].marriages.some(function (x) { return x.into === p.name; }))
          fam[sur2].marriages.push({ who: p.name, into: 'married out' });
      }
    });
    return Object.keys(fam).sort().map(function (k) { return fam[k]; });
  }

  function build(data) {
    data = data || (root && root.CASON_DATA) || {};
    var people = data.people || {};
    var ids = Object.keys(people).filter(function (id) { return typeof people[id].generation === 'number' && people[id].generation >= 1; });
    var kids = childIndex(people);
    var genEst = genBirthEstimates(people);

    // per-person derived facts
    var facts = {};
    ids.forEach(function (id) {
      var p = people[id];
      var b = birthYearOf(p), d = deathYearOf(p);
      var living = isLiving(p, b, d);
      var eb = estBirth(p, genEst), ed = estDeath(p, eb, living);
      facts[id] = {
        b: b, d: d, living: living, eb: eb, ed: ed,
        isParent: (kids[id] || []).length > 0,
      };
    });

    // ---- per-generation life-stage stats ----
    function determinableMet(id, depth) {
      // returns { met: bool|null, determinable: bool }
      var f = facts[id];
      var desc = descendantsAtDepth(kids, id, depth);
      if (!desc.length) return { met: false, determinable: true, has: false }; // no such descendant => did not meet one (determinable)
      // need person's death (or living) and at least one descendant's known birth
      var death = f.d != null ? f.d : (f.living ? PRESENT : null);
      var births = desc.map(function (c) { return birthYearOf(people[c]); }).filter(function (y) { return y != null; });
      if (death == null || !births.length) return { met: null, determinable: false, has: true };
      var earliest = Math.min.apply(null, births);
      return { met: earliest <= death, determinable: true, has: true };
    }

    var genMap = {};
    ids.forEach(function (id) {
      var g = people[id].generation;
      genMap[g] = genMap[g] || { gen: g, roman: ROMAN[g] || String(g), total: 0, parents: 0,
        grand: { met: 0, determinable: 0, has: 0 }, great: { met: 0, determinable: 0, has: 0 } };
      var gm = genMap[g];
      gm.total++;
      if (facts[id].isParent) gm.parents++;
      var gr = determinableMet(id, 2), gg = determinableMet(id, 3);
      if (gr.has) gm.grand.has++;
      if (gr.determinable && gr.has) { gm.grand.determinable++; if (gr.met) gm.grand.met++; }
      if (gg.has) gm.great.has++;
      if (gg.determinable && gg.has) { gm.great.determinable++; if (gg.met) gm.great.met++; }
    });
    var byGen = Object.keys(genMap).map(Number).sort(function (a, b) { return a - b; }).map(function (g) { return genMap[g]; });

    // ---- alive-by-year population curve ----
    var start = 9999, endYear = PRESENT;
    ids.forEach(function (id) { var b = facts[id].eb; if (b != null && b < start) start = b; });
    if (start === 9999) start = 1604;
    var known = [], estimated = [];
    for (var y = start; y <= endYear; y++) {
      var kc = 0, ec = 0;
      ids.forEach(function (id) {
        var f = facts[id];
        if (f.b != null && f.d != null && y >= f.b && y <= f.d) kc++;
        if (f.eb != null && f.ed != null && y >= f.eb && y <= f.ed) ec++;
      });
      known.push({ year: y, count: kc });
      estimated.push({ year: y, count: ec });
    }

    // ---- roots of interest ----
    var thomas = data.family && data.family.rootId ? data.family.rootId : 'thomas-sr';
    var rootStats = {};
    ['thomas-sr', 'ransom-sr'].forEach(function (rid) {
      if (people[rid]) rootStats[rid] = descendantsOf(people, kids, rid);
    });

    return {
      present: PRESENT,
      start: start,
      totals: {
        people: ids.length,
        withBirth: ids.filter(function (id) { return facts[id].b != null; }).length,
        withBoth: ids.filter(function (id) { return facts[id].b != null && facts[id].d != null; }).length,
        parents: ids.filter(function (id) { return facts[id].isParent; }).length,
        living: ids.filter(function (id) { return facts[id].living; }).length,
      },
      byGen: byGen,
      aliveByYear: { known: known, estimated: estimated },
      descendants: rootStats,
      families: marriedFamilies(people),
      branchMembers: ids.filter(function (id) { return !people[id].direct; }).length,
      directMembers: ids.filter(function (id) { return people[id].direct; }).length,
      facts: facts,
      rootId: thomas,
    };
  }

  var api = {
    build: build,
    birthYearOf: birthYearOf,
    deathYearOf: deathYearOf,
    childIndex: childIndex,
    descendantsOf: descendantsOf,
    descendantsAtDepth: descendantsAtDepth,
    surnameOf: surnameOf,
    marriedFamilies: marriedFamilies,
  };

  if (root && root.CASON_DATA) {
    try { root.CASON_STATS = build(root.CASON_DATA); } catch (e) { if (typeof console !== 'undefined') console.error('[CASON_STATS] build failed:', e); }
  }
  root.CASON_STATS_API = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
