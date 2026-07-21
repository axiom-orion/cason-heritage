/* ============================================================
   The Living Line -- Encounters  (window.CASON_ENCOUNTERS)
   ------------------------------------------------------------
   "Who did they meet, and when?" made durable and queryable. Co-presence
   in the world scene was transient -- a meeting was never recorded, so the
   web of who-knew-whom could not be asked of the graph. This derives that
   web from the record and persists it as first-class encounter objects:

     - build(data)                the encounter index: CERTAIN kin meetings
                                  (spouse/parent/child/sibling) + PROBABLE
                                  neighbor meetings (same place, overlapping
                                  lives, adjacent generation). Each carries a
                                  year (earliest both were present), a place,
                                  a basis, and a certainty.
     - encountersOf(idx, id)      who this person knew, with when/where/why.
     - knownPeersOf(idx, id, yr)  the peers they had met BY a given year -- a
                                  durable feed for the scope gate (who they
                                  knew opens what they know), beyond kin.
     - ingestEdges(memory, idx)   add `type:'encounter'` edges to the graph so
                                  meetings are queryable graph structure.

   No new NODES enter persona memory (encounters are relational metadata, not
   memory content, so they never flood a persona's recall). Deterministic;
   No-build (window) + Node (module.exports). ASCII; no regex lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  var MAX_NEIGHBOR = 600; // keep the probable-neighbor set bounded

  function helpers() { return root.CASON_MEMORY_API ? root.CASON_MEMORY_API.helpers : null; }
  function placeStr(p) { return (p && p.born && p.born.place) ? p.born.place : (p && p.place) ? p.place : null; }
  function lifeYears(H, p) {
    if (!H) return null;
    var b = H.birthYearOf(p); if (b == null) return null;
    var d = H.deathYearOf(p); if (d == null) d = b + 80;
    return [b, d];
  }
  function overlap(H, a, b) {
    var ya = lifeYears(H, a), yb = lifeYears(H, b);
    if (!ya || !yb) return null;
    var s = Math.max(ya[0], yb[0]), e = Math.min(ya[1], yb[1]);
    return (s <= e) ? [s, e] : null;
  }
  function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  function build(data) {
    var people = (data && data.people) || {};
    var H = helpers();
    var ids = Object.keys(people);
    var records = [], seen = {};

    function add(a, b, year, place, basis, certainty) {
      if (a === b || !people[a] || !people[b]) return;
      var k = pairKey(a, b); if (seen[k]) return; seen[k] = true;
      records.push({ id: 'enc:' + k.replace('|', ':'), a: a, b: b, year: (year != null ? year : null), place: place || null, basis: basis, certainty: certainty });
    }

    // 1) CERTAIN kin meetings
    ids.forEach(function (id) {
      var p = people[id];
      [['spouse', 'spouse'], ['parents', 'parent'], ['children', 'child'], ['siblings', 'sibling']].forEach(function (rel) {
        (p[rel[0]] || []).forEach(function (other) {
          if (!people[other]) return;
          var ov = overlap(H, p, people[other]);
          var yr = ov ? ov[0] : (H ? H.birthYearOf(p) : null);
          add(id, other, yr, placeStr(p) || placeStr(people[other]), 'kin:' + rel[1], 'certain');
        });
      });
    });

    // 2) PROBABLE neighbor meetings: same place, overlapping lives, adjacent gen
    var byPlace = {};
    ids.forEach(function (id) { var pl = placeStr(people[id]); if (pl) (byPlace[pl] = byPlace[pl] || []).push(id); });
    var added = 0;
    Object.keys(byPlace).forEach(function (pl) {
      var grp = byPlace[pl];
      for (var i = 0; i < grp.length && added < MAX_NEIGHBOR; i++) {
        for (var j = i + 1; j < grp.length && added < MAX_NEIGHBOR; j++) {
          var a = grp[i], b = grp[j];
          if (seen[pairKey(a, b)]) continue;
          var pa = people[a], pb = people[b];
          if (Math.abs((pa.generation || 0) - (pb.generation || 0)) > 1) continue;
          var ov = overlap(H, pa, pb);
          if (!ov) continue;
          add(a, b, ov[0], pl, 'same place & time', 'probable');
          added++;
        }
      }
    });

    var byPerson = {};
    records.forEach(function (r) { (byPerson[r.a] = byPerson[r.a] || []).push(r); (byPerson[r.b] = byPerson[r.b] || []).push(r); });
    return { records: records, byPerson: byPerson };
  }

  function other(r, id) { return r.a === id ? r.b : r.a; }

  // who this person knew, most-certain first, then earliest
  function encountersOf(idx, personId) {
    var list = (idx && idx.byPerson[personId]) || [];
    return list.slice().sort(function (x, y) {
      if (x.certainty !== y.certainty) return x.certainty === 'certain' ? -1 : 1;
      return (x.year || 9999) - (y.year || 9999);
    }).map(function (r) { return { who: other(r, personId), year: r.year, place: r.place, basis: r.basis, certainty: r.certainty }; });
  }

  // the peers they had met BY `year` (or ever, if year omitted) -- feeds the scope gate
  function knownPeersOf(idx, personId, year) {
    var list = (idx && idx.byPerson[personId]) || [];
    var out = {};
    list.forEach(function (r) { if (year == null || r.year == null || r.year <= year) out[other(r, personId)] = true; });
    return Object.keys(out);
  }

  // persist meetings as first-class graph edges (idempotent by from|to|type)
  function ingestEdges(memory, idx) {
    if (!memory || !memory.edges || !memory.identityOf) return 0;
    var have = {};
    memory.edges.forEach(function (e) { if (e.type === 'encounter') have[e.from + '>' + e.to] = true; });
    var added = 0;
    (idx.records || []).forEach(function (r) {
      var fa = memory.identityOf[r.a], fb = memory.identityOf[r.b];
      if (!fa || !fb || have[fa + '>' + fb] || have[fb + '>' + fa]) return;
      memory.edges.push({ from: fa, to: fb, type: 'encounter', rel: r.basis, year: r.year, weight: r.certainty === 'certain' ? 1 : 0.5 });
      have[fa + '>' + fb] = true; added++;
    });
    return added;
  }

  var API = { build: build, encountersOf: encountersOf, knownPeersOf: knownPeersOf, ingestEdges: ingestEdges };
  root.CASON_ENCOUNTERS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  // build once against the default graph (browser convenience)
  if (root.CASON_DATA && root.CASON_MEMORY && !root.CASON_MEMORY.encounters) {
    try {
      root.CASON_MEMORY.encounters = build(root.CASON_DATA);
      ingestEdges(root.CASON_MEMORY, root.CASON_MEMORY.encounters);
      root.CASON_MEMORY.knownPeersMet = function (id, year) { return knownPeersOf(root.CASON_MEMORY.encounters, id, year); };
    } catch (e) {}
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
