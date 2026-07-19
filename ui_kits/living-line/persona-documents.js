/* ============================================================
   The Living Line — Document self-awareness  (window.CASON_DOCS)
   ------------------------------------------------------------
   Turns the family's real, dated, person-attached documents and
   pictures (from the Archive / the Proof) into horizon-gated memory
   nodes, so a persona becomes AWARE of the papers and photographs that
   pertain to them — and can speak to them, but only:

     • if the item is VALIDATED (a real, dated item; never a rumor), and
     • within their HORIZON — a picture dated 1962 is knowable to my
       grandmother from 1962 on, and to no one before it was taken.

   The trick is the year: a document memory carries the DOCUMENT'S date
   as its `year` (not the person's birth), so the existing temporal gate
   in memory-graph.js seals it off until that year arrives — self-
   discovery that can never leak the future.

   No-build (window) + Node (module.exports). No regex lookbehind. ASCII.
   ============================================================ */
(function (root) {
  'use strict';

  function years(s) { var o = [], re = /\d{4}/g, m; while ((m = re.exec(String(s || ''))) !== null) o.push(parseInt(m[0], 10)); return o; }
  function docYear(doc) { var y = years(doc && doc.date); return y.length ? y[0] : null; }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0; return (h >>> 0).toString(36); }

  // first-person framing so the persona can hold the item up and speak to it
  var FRAME = {
    photo:       function (t) { return 'A photograph of me — ' + t; },
    portrait:    function (t) { return 'A portrait of me — ' + t; },
    deed:        function (t) { return 'A deed in my name — ' + t; },
    census:      function (t) { return 'A census that lists me — ' + t; },
    will:        function (t) { return 'My will and estate papers — ' + t; },
    letter:      function (t) { return 'A letter — ' + t; },
    certificate: function (t) { return 'A certificate concerning me — ' + t; },
    newspaper:   function (t) { return 'A newspaper notice of me — ' + t; },
    document:    function (t) { return 'A document concerning me — ' + t; },
    other:       function (t) { return 'Something kept concerning me — ' + t; },
  };
  function frame(kind, title, year) {
    var f = FRAME[kind] || FRAME.other;
    var s = f(title || 'untitled');
    if (year) s += ' (' + year + ')';
    return s + '.';
  }

  var BLOCKED_EVIDENCE = { eliminated: 1, disproven: 1 };

  // one document -> one horizon-gated memory node (null if unusable)
  function docMemory(doc, people) {
    if (!doc || !doc.personId) return null;
    var p = people && people[doc.personId];
    if (!p) return null;                                   // must attach to a real person
    var yr = docYear(doc);
    if (yr == null) return null;                           // must be DATED (horizon needs a year)
    if (BLOCKED_EVIDENCE[doc.evidence]) return null;       // validated only
    var kind = doc.kind || 'document';
    var docId = doc.id || hash((doc.title || '') + '|' + yr + '|' + kind);
    return {
      id: 'doc:' + doc.personId + ':' + docId,
      ownerId: doc.personId,
      scope: 'individual',                                 // the persona's own — they know it if alive then
      generation: (typeof p.generation === 'number') ? p.generation : null,
      year: yr,                                            // THE DOCUMENT'S date — drives the horizon gate
      era: null, place: null,
      kind: 'document',
      evidence: doc.evidence || 'secondary',
      text: frame(kind, doc.title, yr),
      derivedFrom: ['document.' + docId],
      sources: [doc.source || doc.title || 'family archive'],
      tags: ['document', kind],
    };
  }

  function docMemories(docs, people) {
    return (docs || []).map(function (d) { return docMemory(d, people); }).filter(Boolean);
  }

  /* Ingest document memories into a CASON_MEMORY-shaped graph. Idempotent
     (same document in -> same node id -> not duplicated). Returns count added. */
  function ingestInto(memory, docs, people) {
    if (!memory || !memory.nodes) return 0;
    var nodes = docMemories(docs, people), added = 0;
    nodes.forEach(function (n) {
      if (memory.byId && memory.byId[n.id]) return;
      memory.nodes.push(n);
      if (memory.byId) memory.byId[n.id] = n;
      if (memory.byOwner) (memory.byOwner[n.ownerId] = memory.byOwner[n.ownerId] || []).push(n);
      added++;
    });
    return added;
  }

  var API = { docMemory: docMemory, docMemories: docMemories, ingestInto: ingestInto, docYear: docYear, FRAME: FRAME };
  root.CASON_DOCS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
