/* ============================================================
   The Living Line -- Corpus Reference Memory  (window.CASON_CORPUS_MEMORY)
   ------------------------------------------------------------
   The family's research memos (research/*.md) are already ingested by
   corpus.js into provenance-tagged nodes (window.CASON_CORPUS). Those
   nodes are RETRIEVAL material -- they are NOT persona knowledge, and
   they carry the 2026 research narration alongside the dated facts.

   This module reshapes those corpus nodes into HORIZON-GATED reference
   memory nodes and ingests them into a CASON_MEMORY-shaped graph, so a
   persona can draw on what the record / research says ABOUT them -- but
   only:
     - if the node is OWNED (a real person in `people`), and
     - if the node carries a FACT year (the year gates the horizon), and
     - within their lifetime: a fact dated 1854 is knowable to Ransom
       from 1854 on, and never before.

   The trick is the same as persona-documents.js: the memory node's
   `year` is the FACT'S year, so the existing temporal gate in
   memory-graph.js seals it off until that year arrives. A yearless node
   cannot be safely gated, so it is SKIPPED -- which is exactly why the
   2026 research narration (year 2026) stays sealed for every ancestor:
   no living ancestor's horizon ever reaches it.

   scope 'individual' -> the persona's own reference material (visible to
   them if alive then). evidence 'reference' -> never asserted as a lived
   fact. kind 'reference' -> distinguishes it from primary event/fact.

   Runs no-build in the browser (attaches to window) and under Node
   (module.exports). ASCII source only; NO regex lookbehind (a parse-time
   SyntaxError on iOS Safari < 16.4 that would kill this whole file); NO
   Date.now()/Math.random()/new Date() -- ids are content hashes so
   re-ingestion is deterministic and idempotent.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---- small deterministic, non-crypto content hash (FNV-1a) ----
     Same approach as corpus.js / memory-graph.js. Stable id => the same
     corpus fact reshaped twice yields the same node id (idempotent). */
  function contentId(parts) {
    var str = parts.filter(function (p) { return p != null; }).join('');
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16);
  }
  // left-pad to 8 hex chars without String.prototype.padStart (old engines)
  function pad8(s) { while (s.length < 8) { s = '0' + s; } return s; }

  /* ============================================================
     corpusMemoryNode(corpusNode, people) -> memory node | null
       Keep ONLY nodes that have BOTH:
         (a) a non-null ownerId that exists in `people`, AND
         (b) a numeric `year` (the FACT year -- this is what horizon-gates
             it; a yearless node cannot be safely gated, so SKIP it).
       Reshape into a CASON_MEMORY-shaped individual/reference node.
     ============================================================ */
  function corpusMemoryNode(corpusNode, people) {
    if (!corpusNode) return null;
    people = people || {};
    var ownerId = corpusNode.ownerId;
    if (ownerId == null) return null;                       // must be owned
    var person = people[ownerId];
    if (!person) return null;                               // owner must be real
    if (typeof corpusNode.year !== 'number') return null;   // must be DATED (horizon needs a year)

    return {
      id: 'corpus:' + ownerId + ':' + pad8(contentId([corpusNode.text, corpusNode.year])),
      ownerId: ownerId,
      scope: 'individual',                                  // the persona's own reference material
      generation: (typeof person.generation === 'number') ? person.generation : null,
      year: corpusNode.year,                                // THE FACT'S year -- drives the horizon gate
      era: null,
      place: null,
      kind: 'reference',
      evidence: 'reference',                                // never asserted as a lived fact
      text: corpusNode.text,
      derivedFrom: (corpusNode.derivedFrom || ['corpus']),
      sources: (corpusNode.sources || []),
      tags: ['corpus', 'reference']
    };
  }

  function corpusMemoryNodes(corpusNodes, people) {
    return (corpusNodes || [])
      .map(function (n) { return corpusMemoryNode(n, people); })
      .filter(Boolean);
  }

  /* ============================================================
     ingestCorpusInto(memory, corpusNodes, people) -> count added
       Ingest all valid reshaped nodes into a CASON_MEMORY-shaped graph.
       Idempotent by id (skip if memory.byId[id]). Pushes to memory.nodes,
       memory.byId, memory.byOwner. Mirrors persona-documents.js ingestInto.
     ============================================================ */
  function ingestCorpusInto(memory, corpusNodes, people) {
    if (!memory || !memory.nodes) return 0;
    var nodes = corpusMemoryNodes(corpusNodes, people), added = 0;
    nodes.forEach(function (n) {
      if (memory.byId && memory.byId[n.id]) return;
      memory.nodes.push(n);
      if (memory.byId) memory.byId[n.id] = n;
      if (memory.byOwner) (memory.byOwner[n.ownerId] = memory.byOwner[n.ownerId] || []).push(n);
      added++;
    });
    return added;
  }

  // ---- public API ----
  var API = {
    corpusMemoryNode: corpusMemoryNode,
    corpusMemoryNodes: corpusMemoryNodes,
    ingestCorpusInto: ingestCorpusInto,
    helpers: { contentId: contentId, pad8: pad8 }
  };

  root.CASON_CORPUS_MEMORY = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
