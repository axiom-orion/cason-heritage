/* ============================================================
   The Living Line — Y-DNA Patriline Exclusions  (window.CASON_DNA_EXCLUSIONS)
   ------------------------------------------------------------
   The near-objective safety constraints a genealogy governor can lean on:
   a Y-chromosome haplogroup is inherited father-to-son, so two surnames that
   test to *distinct* patrilineal haplogroups CANNOT share a direct paternal
   line. A record that proposes such a merge is not "low-confidence" — it is
   provably wrong, and the gate refuses it (`no-haplogroup-conflict`).

   HONESTY — this file records the *constraint and its basis*, not invented lab
   results. Where the family has not yet attached the specific surname-project
   panel IDs / haplogroup calls, those fields are left null and the exclusion
   carries its honest evidence tier. The refusal fires on the documented
   exclusion; raising it to `confirmed` is a matter of attaching the panels.
   Do not fabricate haplogroup codes here — a wrong "fact" in the governor is
   worse than an open one.

   Surnames are matched case-insensitively and order-independently.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  /* Each exclusion: two patrilines that Y-DNA places in different haplogroups,
     so a direct paternal link between them is refused. `haplogroups` holds the
     specific calls when the family attaches them (null until then). */
  var EXCLUSIONS = [
    {
      a: 'Cason',
      b: 'Causey',
      basis: 'Y-DNA: distinct patrilineal haplogroups per the Cason and Causey surname DNA projects — a recurring derivative-tree conflation (the names look alike on a worn record), but the male lines do not meet.',
      haplogroups: { Cason: null, Causey: null }, // attach FTDNA project panel calls to raise to `confirmed`
      evidence: 'leading',                         // a documented exclusion; not yet panel-cited here
      sources: [],                                 // e.g. 'Cason Surname Y-DNA Project, FTDNA — group assignment'
      note: 'Distinct from the Cason/Cannon conflation already noted in data.js (the 1652 appraiser Edward Cannon). This is the Cason↔Causey patriline split.',
    },
  ];

  function norm(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

  /** Return the exclusion record for an ordered/unordered surname pair, or null. */
  function excludes(surnameA, surnameB) {
    var x = norm(surnameA), y = norm(surnameB);
    for (var i = 0; i < EXCLUSIONS.length; i++) {
      var e = EXCLUSIONS[i], a = norm(e.a), b = norm(e.b);
      if ((x === a && y === b) || (x === b && y === a)) return e;
    }
    return null;
  }

  /** Given a set/array of surnames, return the first excluded pair found, or null. */
  function firstExcludedPair(surnames) {
    var list = (surnames || []).map(norm).filter(Boolean);
    for (var i = 0; i < list.length; i++) {
      for (var j = i + 1; j < list.length; j++) {
        var e = excludes(list[i], list[j]);
        if (e) return e;
      }
    }
    return null;
  }

  var API = { exclusions: EXCLUSIONS, excludes: excludes, firstExcludedPair: firstExcludedPair };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_DNA_EXCLUSIONS = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
