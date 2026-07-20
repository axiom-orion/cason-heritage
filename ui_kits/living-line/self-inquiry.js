/* ============================================================
   The Living Line -- Self-inquiry  (window.CASON_INQUIRY)
   ------------------------------------------------------------
   A persona's OWN open questions -- the gaps in its own record --
   surfaced from inside its horizon, so it can pursue them. This is the
   "questioning" tier of autonomy: a persona may RAISE and RESEARCH its
   own questions, but every finding still flows through the human-gated
   Review queue (proposeConsensus / /api/propose). Autonomy to ASK; the
   WRITE stays supervised -- the top tier of the registry stays unoccupied.

   The gaps are already authored/derived as first-person questions
   (memory-graph.js AUTHORED_GAPS + derived-gap rules), tagged
   ['open-question']. This module just reads the horizon-accessible ones
   for a given persona (and year) and packages them for research, with a
   context string for the 3-model consensus.

     openQuestionsFor(id, simNow) -> [{ question, basis, evidence, tags, year }]
     deriveInquiry(gapNode, person) -> one packaged inquiry
     researchContext(id, simNow)   -> "Name (lifespan), place" for consensus

   Deterministic today (the gap text IS the question); a model step can
   sharpen the query later. No-build (window) + Node (module.exports).
   ASCII source; no regex lookbehind (parse-time SyntaxError iOS < 16.4).
   ============================================================ */
(function (root) {
  'use strict';

  function MEM() { return root.CASON_MEMORY; }
  function DATA() { return root.CASON_DATA; }
  function personOf(id) { var d = DATA(); return (d && d.people) ? d.people[id] : null; }
  function accessAt(id, simNow) { return MEM().access(id, (simNow != null) ? { simNow: simNow } : undefined); }

  /* package one gap node as a research-ready inquiry. The gap text is
     already the persona's own first-person question, so it IS the query;
     evidence/tags ride along so the UI can stamp confidence + route it. */
  function deriveInquiry(gap, person) {
    if (!gap) return null;
    return {
      question: String(gap.text || '').trim(),
      basis: gap.text,
      evidence: gap.evidence || 'unsolved',
      tags: (gap.tags || []).filter(function (t) { return t !== 'open-question'; }),
      year: (typeof gap.year === 'number') ? gap.year : null,
      id: gap.id,
    };
  }

  /* the persona's OWN open questions, horizon-scoped to `simNow` */
  function openQuestionsFor(personId, simNow) {
    var sub = accessAt(personId, simNow);
    var person = personOf(personId);
    var seen = {}, out = [];
    sub.individual
      .filter(function (n) { return n.kind === 'gap'; })
      .forEach(function (g) {
        var iq = deriveInquiry(g, person);
        if (!iq || !iq.question || seen[iq.question]) return;
        seen[iq.question] = 1;
        out.push(iq);
      });
    return out;
  }

  /* who/when/where, handed to researchConsensus so the models can anchor
     the question to the right person (not a same-named stranger) */
  function researchContext(personId, simNow) {
    var p = personOf(personId); if (!p) return '';
    var parts = [p.name];
    if (p.lifespan) parts.push('(' + p.lifespan + ')');
    var place = (p.born && p.born.place) ? p.born.place : (p.place || null);
    if (place) parts.push(place);
    return parts.join(' ');
  }

  var API = {
    openQuestionsFor: openQuestionsFor,
    deriveInquiry: deriveInquiry,
    researchContext: researchContext,
  };
  root.CASON_INQUIRY = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
