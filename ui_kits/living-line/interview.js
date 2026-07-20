/* ============================================================
   The Living Line -- Interview  (window.CASON_INTERVIEW)
   ------------------------------------------------------------
   The scaffolding for "interview a persona at an age." Given a person
   and a year (simNow), it builds:

     - frameFor(id, simNow)     who they are AT that year: age, and how
                                many memories are within reach vs sealed
                                beyond the horizon (the future they can't
                                yet know).
     - questionsFor(id, simNow) suggested questions GROUNDED in what is
                                accessible at that year -- the documents
                                and events they'd actually have by then,
                                so a 1961 Carl is not asked about a photo
                                taken in 1962, but a 1963 Carl is.

   The horizon does the bounding (memory-graph accessibleSubgraph); this
   module just reads it and shapes an interview around it. The ai-client
   answers the questions, age-bounded, via personaRespond({simNow}).

   No-build (window) + Node (module.exports). ASCII source; no regex
   lookbehind (parse-time SyntaxError on iOS Safari < 16.4).
   ============================================================ */
(function (root) {
  'use strict';

  function MEM() { return root.CASON_MEMORY; }
  function DATA() { return root.CASON_DATA; }
  function H() { return root.CASON_MEMORY_API ? root.CASON_MEMORY_API.helpers : null; }
  function personOf(id) { var d = DATA(); return (d && d.people) ? d.people[id] : null; }
  function accessAt(id, simNow) { return MEM().access(id, (simNow != null) ? { simNow: simNow } : undefined); }

  function trim(s, n) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    return s.slice(0, n - 1).replace(/\s+\S*$/, '') + '...';
  }

  /* who the persona is AT `simNow` -- the frame shown above the interview */
  function frameFor(personId, simNow) {
    var p = personOf(personId); if (!p) return null;
    var h = H();
    var birth = h ? h.birthYearOf(p) : null;
    var death = h ? h.deathYearOf(p) : null;
    var year = (simNow != null) ? simNow : (death != null ? death : (birth != null ? birth + 55 : null));
    var sub = accessAt(personId, simNow);
    var st = sub.stats || {};
    var sealed = (st.blockedFuture || 0);
    var known = (st.visible != null) ? st.visible : (sub.individual.length + sub.family.length + sub.generational.length);
    var alive = (birth == null || year >= birth) && (death == null || year <= death);
    return {
      personId: personId, name: p.name,
      birth: birth, death: death, year: year,
      age: (birth != null && year != null) ? (year - birth) : null,
      known: known, sealed: sealed, alive: alive,
      horizonYear: sub.horizonYear != null ? sub.horizonYear : year,
    };
  }

  function askAbout(text) { return 'Tell me about this -- ' + trim(text, 72); }

  /* suggested questions grounded in what is ACCESSIBLE at `simNow`.
     Each: { q, kind, basis?, year? }. kinds: document | event | gap | life. */
  function questionsFor(personId, simNow) {
    var sub = accessAt(personId, simNow);
    var out = [];

    // 1. document-grounded -- the pictures & papers they'd have by this year
    sub.individual
      .filter(function (n) { return n.tags && n.tags.indexOf('document') !== -1; })
      .slice(0, 4)
      .forEach(function (n) { out.push({ q: askAbout(n.text), kind: 'document', basis: n.text, year: n.year }); });

    // 2. event / fact-grounded -- things that have happened to them by now
    sub.individual
      .filter(function (n) { return (n.kind === 'event' || n.kind === 'fact') && n.evidence !== 'disproven' && n.evidence !== 'eliminated'; })
      .slice(0, 4)
      .forEach(function (n) { out.push({ q: askAbout(n.text), kind: 'event', basis: n.text, year: n.year }); });

    // 3. an open thread -- what they still wonder about (a gap in their own record)
    var gaps = sub.individual.filter(function (n) { return n.kind === 'gap'; });
    if (gaps.length) out.push({ q: 'What do you still wonder about?', kind: 'gap', basis: gaps[0].text });

    // 4. standard life questions -- always answerable, always present
    ['Tell me about your life so far.', 'Who are the people closest to you?', 'What work fills your days?', 'What do you hope for?']
      .forEach(function (q) { out.push({ q: q, kind: 'life' }); });

    // dedup by question text, cap the set
    var seen = {}, uniq = [];
    out.forEach(function (x) { if (!seen[x.q]) { seen[x.q] = 1; uniq.push(x); } });
    return uniq.slice(0, 10);
  }

  /* ---- transcript persistence (the family keeps its interviews) ---- */
  function key(personId) { return 'cason-interview-' + personId; }
  function saveTranscript(personId, entries) {
    try { localStorage.setItem(key(personId), JSON.stringify(entries || [])); return true; } catch (e) { return false; }
  }
  function loadTranscript(personId) {
    try { return JSON.parse(localStorage.getItem(key(personId)) || '[]'); } catch (e) { return []; }
  }
  /* a plain-text transcript for export/sharing */
  function toText(personId, entries) {
    var p = personOf(personId);
    var lines = ['Interview -- ' + (p ? p.name : personId), ''];
    (entries || []).forEach(function (e) {
      if (e.role === 'q') lines.push('Q' + (e.year != null ? ' (' + e.year + ')' : '') + ': ' + e.text);
      else lines.push('A: ' + e.text, '');
    });
    return lines.join('\n');
  }

  var API = {
    frameFor: frameFor,
    questionsFor: questionsFor,
    saveTranscript: saveTranscript,
    loadTranscript: loadTranscript,
    toText: toText,
    trim: trim,
  };
  root.CASON_INTERVIEW = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
