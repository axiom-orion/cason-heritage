/* ============================================================
   The Living Line -- Corpus Ingestion  (window.CASON_CORPUS)
   ------------------------------------------------------------
   The memory graph (window.CASON_MEMORY) is built ONLY from the
   STRUCTURED record (window.CASON_DATA). Facts that live in the
   family's UNSTRUCTURED sources -- the research memos in research/*.md
   and long-form narrative prose -- are invisible to it.

   This module turns such documents into memory-node-shaped objects,
   each carrying PROVENANCE (which document, which sentence) so the
   system can reason over the whole corpus and cite where a claim came
   from. It is the "RAG retrieval" primitive: ingest -> nodes -> search.

   IMPORTANT: corpus nodes are exposed SEPARATELY as window.CASON_CORPUS
   and are NOT merged into window.CASON_MEMORY. The governance / horizon
   invariants of the memory graph are untouched, and its self-tests stay
   green. A human wires any graph hookup deliberately, later.

   Node shape (mirrors memory-graph.js), with corpus-specific values:
     kind: 'corpus', scope: 'reference', evidence: 'reference',
     derivedFrom: ['corpus.<docId>'], sources: [<doc path/title>],
     tags: ['corpus','document', ...], ownerId: matched person id | null.

   Runs no-build in the browser (attaches to window) and under Node
   (module.exports). ASCII source only; NO regex lookbehind (a parse-time
   SyntaxError on iOS Safari < 16.4 that would kill this whole file); NO
   Date.now()/Math.random()/new Date() -- ids are content hashes so
   re-ingestion is deterministic and idempotent.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---- small deterministic, non-crypto content hash (FNV-1a) ----
     Same approach as memory-graph.js's contentId. Stable id => the
     same document ingested twice yields the same node ids. The field
     separator is the ASCII unit-separator (0x1f) -- ASCII source, and
     it will not appear inside ordinary prose. */
  function contentId(parts) {
    var str = parts.filter(function (p) { return p != null; }).join('');
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16);
  }
  // left-pad to 8 hex chars without String.prototype.padStart (old engines)
  function pad8(s) { while (s.length < 8) { s = '0' + s; } return s; }

  var MIN_SENTENCE = 40; // minimum characters for a sentence to become a node

  /* ---- first plausible 4-digit year in a string (1500-2099), else null.
     Constrained so "160 acres" / "p.124" / page numbers do not read as a
     year, while the family's real span (c.1604 - present) is covered. */
  function firstYear(s) {
    if (!s) return null;
    var m = String(s).match(/\b(1[5-9]\d\d|20\d\d)\b/);
    return m ? parseInt(m[1], 10) : null;
  }

  /* ---- markdown -> plain text (best-effort) so a memo splits into prose
     sentences rather than raw markup. No lookbehind anywhere. */
  function normalize(text) {
    var s = String(text == null ? '' : text);
    s = s.replace(/\r\n/g, '\n');
    s = s.replace(/```[\s\S]*?```/g, ' ');      // fenced code blocks
    s = s.replace(/`([^`]*)`/g, '$1');          // inline code
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' '); // images
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // links -> link text
    s = s.replace(/[#>*_~|]/g, ' ');            // heading / emphasis / table markup
    s = s.replace(/^\s*[-+]\s+/gm, ' ');         // list bullets
    s = s.replace(/[ \t]+/g, ' ');
    return s;
  }

  /* ---- sentence splitter: SAME approach as memory-graph.js (split after
     sentence-ending punctuation followed by whitespace) but reused here
     with a configurable minimum length. Deliberately NO regex lookbehind. */
  function sentences(text, minLen) {
    var min = (typeof minLen === 'number') ? minLen : MIN_SENTENCE;
    var str = normalize(text);
    if (!str) return [];
    var parts = [];
    var re = /[.?!]\s+/g;
    var start = 0, m;
    while ((m = re.exec(str)) !== null) {
      parts.push(str.slice(start, m.index + 1));
      start = m.index + m[0].length;
    }
    parts.push(str.slice(start));
    return parts
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length >= min; });
  }

  /* ---- name tokenizing for entity-linking ----
     Drop titles, generational suffixes, and non-identifying filler so a
     name reduces to its distinctive tokens: "Ransom Cason Sr." ->
     [ransom, cason]; "Lt. Ransom Cason \"2\"" -> [ransom, cason]. */
  var NAME_STOP = {
    sr: 1, jr: 1, i: 1, ii: 1, iii: 1, iv: 1, v: 1,
    lt: 1, mr: 1, mrs: 1, ms: 1, dr: 1, rev: 1, capt: 1, col: 1, gen: 1,
    the: 1, of: 1, and: 1, alleged: 1, unknown: 1, surname: 1, unfilled: 1, slot: 1
  };
  function words(text) {
    var out = [];
    var m = String(text == null ? '' : text).toLowerCase().match(/[a-z0-9]+/g);
    if (m) { for (var i = 0; i < m.length; i++) out.push(m[i]); }
    return out;
  }
  function nameTokens(name) {
    return words(name).filter(function (t) { return t.length >= 2 && !NAME_STOP[t]; });
  }

  /* ============================================================
     matchPeople(text, people) -> personId | null
       Best-effort entity-link. `people` is CASON_DATA.people (an object
       keyed by id). Returns the id whose distinctive name tokens appear
       in the sentence; null when nothing matches or the match is
       genuinely ambiguous (e.g. a bare surname shared by many).
     ============================================================ */
  function matchPeople(text, people) {
    people = people || {};
    var present = {};
    words(text).forEach(function (w) { present[w] = 1; });

    // count, per surname, how many people carry it -> ambiguity signal
    var surnameCount = {};
    Object.keys(people).forEach(function (pid) {
      var toks = nameTokens(people[pid] && people[pid].name);
      if (toks.length) {
        var sn = toks[toks.length - 1];
        surnameCount[sn] = (surnameCount[sn] || 0) + 1;
      }
    });

    var best = null; // { id, score, gen }
    Object.keys(people).forEach(function (pid) {
      var p = people[pid];
      var toks = nameTokens(p && p.name);
      if (!toks.length) return;
      var surname = toks[toks.length - 1];
      if (!present[surname]) return; // must at least share the family name

      var score = 0;
      var seen = {};
      toks.forEach(function (t) { if (present[t] && !seen[t]) { seen[t] = 1; score++; } });

      // Confidence rule: a full match (surname + a given/other token) counts.
      // A bare surname counts ONLY when that surname is unique in the record,
      // otherwise it is ambiguous and we decline to guess.
      var confident = (score >= 2) || (score >= 1 && surnameCount[surname] === 1);
      if (!confident) return;

      var gen = (typeof p.generation === 'number') ? p.generation : 999;
      if (best === null ||
          score > best.score ||
          (score === best.score && gen < best.gen) ||
          (score === best.score && gen === best.gen && pid < best.id)) {
        best = { id: pid, score: score, gen: gen };
      }
    });

    return best ? best.id : null;
  }

  /* ---- resolve the people table from an explicit arg or the global data ---- */
  function resolvePeople(people) {
    if (people) return people;
    if (root && root.CASON_DATA && root.CASON_DATA.people) return root.CASON_DATA.people;
    return {};
  }

  /* ============================================================
     ingestDoc({ id, path, title, text }, people?) -> [node, ...]
       One node per substantial sentence (>= MIN_SENTENCE chars), each
       tagged with provenance (path/title in `sources`), a `year` if a
       4-digit year appears, and `ownerId` if a person is matched.
     ============================================================ */
  function ingestDoc(doc, people) {
    doc = doc || {};
    people = resolvePeople(people);
    var docId = doc.id || doc.path || doc.title || 'doc';
    var srcs = [];
    if (doc.path) srcs.push(doc.path);
    if (doc.title && doc.title !== doc.path) srcs.push(doc.title);
    if (!srcs.length) srcs.push(docId);

    var out = [];
    sentences(doc.text).forEach(function (s) {
      var ownerId = matchPeople(s, people);
      var owner = ownerId ? people[ownerId] : null;
      var node = {
        id: 'corpus:' + pad8(contentId([docId, s])),
        ownerId: ownerId,
        scope: 'reference',
        generation: (owner && typeof owner.generation === 'number') ? owner.generation : null,
        year: firstYear(s),
        era: null,
        place: null,
        kind: 'corpus',
        evidence: 'reference',
        text: s,
        derivedFrom: ['corpus.' + docId],
        sources: srcs.slice(),
        tags: ['corpus', 'document'].concat(ownerId ? ['person-linked'] : [])
      };
      out.push(node);
    });
    return out;
  }

  /* ---- ingestDocs(docs, people) -> flatten over ingestDoc ---- */
  function ingestDocs(docs, people) {
    people = resolvePeople(people);
    var out = [];
    (docs || []).forEach(function (d) {
      ingestDoc(d, people).forEach(function (n) { out.push(n); });
    });
    return out;
  }

  /* ============================================================
     search(nodes, query) -> [node, ...]
       The RAG retrieval primitive: keyword scan ranked by term overlap.
       A query term matches a node when it occurs (as a substring, so
       "patent" hits "patented") in the node text. Nodes with no matching
       term are dropped; the rest are returned most-relevant first.
     ============================================================ */
  function search(nodes, query) {
    var terms = words(query);
    if (!terms.length) return [];
    var scored = [];
    (nodes || []).forEach(function (n) {
      var hay = String(n && n.text || '').toLowerCase();
      var overlap = 0;
      terms.forEach(function (t) { if (hay.indexOf(t) !== -1) overlap++; });
      if (overlap > 0) scored.push({ node: n, overlap: overlap });
    });
    scored.sort(function (a, b) {
      return (b.overlap - a.overlap) ||
             (String(a.node.id) < String(b.node.id) ? -1 : String(a.node.id) > String(b.node.id) ? 1 : 0);
    });
    return scored.map(function (x) { return x.node; });
  }

  /* ============================================================
     build(docs, people) -> { nodes, byDoc, byOwner, stats }
       Ingest a set of documents into a queryable corpus with indexes.
     ============================================================ */
  function build(docs, people) {
    people = resolvePeople(people);
    var nodes = ingestDocs(docs, people);
    var byDoc = {};
    var byOwner = {};
    nodes.forEach(function (n) {
      var docKey = (n.derivedFrom && n.derivedFrom[0]) || 'corpus.?';
      (byDoc[docKey] = byDoc[docKey] || []).push(n);
      if (n.ownerId) (byOwner[n.ownerId] = byOwner[n.ownerId] || []).push(n);
    });
    return {
      nodes: nodes,
      byDoc: byDoc,
      byOwner: byOwner,
      stats: {
        docCount: (docs || []).length,
        nodeCount: nodes.length,
        matchedOwnerCount: Object.keys(byOwner).length
      }
    };
  }

  // ---- public API ----
  var API = {
    ingestDoc: ingestDoc,
    ingestDocs: ingestDocs,
    matchPeople: matchPeople,
    search: search,
    build: build,
    helpers: {
      contentId: contentId,
      firstYear: firstYear,
      sentences: sentences,
      normalize: normalize,
      nameTokens: nameTokens,
      MIN_SENTENCE: MIN_SENTENCE
    }
  };

  // Browser auto-build is a no-op: the browser cannot read fs, so the
  // module simply exposes the functions. A caller passes docs explicitly.
  root.CASON_CORPUS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
