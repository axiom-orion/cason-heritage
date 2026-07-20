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
     QUALITY GATE  (added 2026-07-20)
     ------------------------------------------------------------
     corpus.js links a sentence to the single best-scoring name and the
     FIRST 4-digit year it finds. That is noisy: it mislabels a sentence
     that conflates two people, re-surfaces the DISPROVEN Gen-1 English
     origin we quarantined, and turns pull-list tables into "memories".
     Before a corpus sentence may become a persona's own reference memory,
     it must survive these checks (reject == do not inject):
       1. owned + real person + numeric year          (horizon needs a year)
       2. the person is not eliminated/disproven/placeholder
       3. the year falls within the person's lifespan  (kills gross mislabels)
       4. the text is prose, not a table/header/pull-list fragment
       5. the sentence is not itself disproven-context (a "the claim is
          false / no evidence / alleged" line about a quarantined model)
       6. the sentence confidently names ONLY this person (>=2 distinct
          people named == ambiguous ownership -> decline to guess)
     Precision over recall on purpose: a persona is better off knowing a
     few correct things than many misattributed ones.
     ============================================================ */

  var BLOCKED_EVIDENCE = { eliminated: 1, disproven: 1 };
  // a term that, present in the sentence, marks it as talking-about-a-false-claim
  var DISPROVEN_CONTEXT = /disproven|disproved|disprove|quarantin|discard|debunk|ruled? out|not proven|unproven|no such|never existed|not located|myth|fabricat|invent|no evidence|alleged|the claim|conflat/i;
  // a research EXCLUSION ("neither is Thadeous", "is not kin") is a negative
  // finding about the person, never a first-person memory of theirs
  var NEGATIVE_FINDING = /\bneither\b|\bis not\b|\bwas not\b|\bare not\b|\bnot (?:the same|kin|related|him|her|his|hers|our)\b/i;
  // fragments that are apparatus, not narrative (markdown tables, pull-lists, header rows)
  var FRAGMENT = /-{3,}|\||pull-?list|target record|identifier ?\/ ?access|repositories & identifiers/i;
  var NAME_STOP = { sr: 1, jr: 1, i: 1, ii: 1, iii: 1, iv: 1, v: 1, the: 1, of: 1, and: 1, alleged: 1, unknown: 1, surname: 1, unfilled: 1, slot: 1, cason: 1, casson: 1 };

  function yearsIn(s) { var o = [], re = /\d{4}/g, m; while ((m = re.exec(String(s || ''))) !== null) o.push(parseInt(m[0], 10)); return o; }
  function lifeRange(p) {
    var birth = (p && p.born && typeof p.born.year === 'number') ? p.born.year : null;
    var death = (p && p.died && typeof p.died.year === 'number') ? p.died.year : null;
    var ys = yearsIn(p && p.lifespan);
    if (birth == null && ys.length) birth = ys[0];
    if (death == null && ys.length > 1) death = ys[ys.length - 1];
    return { birth: birth, death: death };
  }
  function personBlocked(p) {
    if (!p) return true;
    if (BLOCKED_EVIDENCE[p.evidence]) return true;
    var tags = p.tags || [];
    for (var i = 0; i < tags.length; i++) { if (tags[i] === 'eliminated' || tags[i] === 'disproven') return true; }
    if (/UNFILLED|alleged/i.test(String(p.name || ''))) return true;   // placeholder / disputed slot
    return false;
  }
  function lowWords(text) { var m = String(text || '').toLowerCase().match(/[a-z0-9]+/g); return m || []; }
  // distinctive given-name tokens of a person (drops the shared surname + stopwords)
  function givenTokens(name) { return lowWords(name).filter(function (t) { return t.length >= 3 && !NAME_STOP[t]; }); }
  function subsetOf(a, b) { for (var i = 0; i < a.length; i++) { if (b.indexOf(a[i]) === -1) return false; } return true; }
  // how many DISTINCT names are present in the sentence. People who share the
  // SAME present given-tokens (Ransom Sr. & Jr. both matched only by "ransom")
  // are ONE ambiguous name, not two; genuinely different names (carl vs
  // thadeous) count separately. >=2 => we cannot say whose memory this is.
  function distinctPeopleNamed(text, people) {
    var present = {}; lowWords(text).forEach(function (w) { present[w] = 1; });
    var groups = [];
    Object.keys(people).forEach(function (pid) {
      var toks = givenTokens(people[pid] && people[pid].name).filter(function (t) { return present[t]; });
      if (!toks.length) return;
      toks.sort();
      for (var i = 0; i < groups.length; i++) {
        if (subsetOf(toks, groups[i]) || subsetOf(groups[i], toks)) {   // same name reference (Sr/Jr, partial vs full)
          if (toks.length > groups[i].length) groups[i] = toks;
          return;
        }
      }
      groups.push(toks);
    });
    return groups.length;
  }
  // reason a corpus node is rejected, or null if it is clean (exported for the selftest)
  function rejectReason(corpusNode, people) {
    if (!corpusNode) return 'empty';
    people = people || {};
    var ownerId = corpusNode.ownerId;
    if (ownerId == null) return 'unowned';
    var person = people[ownerId];
    if (!person) return 'unknown-person';
    if (typeof corpusNode.year !== 'number') return 'undated';
    if (personBlocked(person)) return 'blocked-person';                       // eliminated/disproven/placeholder
    var lr = lifeRange(person);
    if (lr.birth != null && corpusNode.year < lr.birth) return 'before-birth';
    var top = (lr.death != null) ? lr.death + 3 : (lr.birth != null ? lr.birth + 100 : null);
    if (top != null && corpusNode.year > top) return 'after-life';
    var text = String(corpusNode.text || '');
    // "aged N" is a strong ownership tell: a death-of-a-relative sentence carries
    // the RELATIVE's age (Thadeous d.1945 aged 88 mislabelled onto Carl, who was
    // 42 in 1945). If the stated age can't be this person's, it isn't their memory.
    var am = /\baged?\s+(\d{1,3})\b/i.exec(text);
    if (am && lr.birth != null) {
      var stated = parseInt(am[1], 10), actual = corpusNode.year - lr.birth;
      if (Math.abs(stated - actual) > 1) return 'age-mismatch';
    }
    if (FRAGMENT.test(text)) return 'fragment';
    if (lowWords(text).length < 6) return 'too-short';
    if (DISPROVEN_CONTEXT.test(text)) return 'disproven-context';
    if (NEGATIVE_FINDING.test(text)) return 'negative-finding';                // "neither is X" -> not X's memory
    if (distinctPeopleNamed(text, people) >= 2) return 'ambiguous-owner';      // names 2+ people -> whose memory?
    return null;
  }

  /* ============================================================
     corpusMemoryNode(corpusNode, people) -> memory node | null
       Reshape a corpus sentence into a CASON_MEMORY-shaped individual/
       reference node, but ONLY if it passes the quality gate above.
     ============================================================ */
  function corpusMemoryNode(corpusNode, people) {
    people = people || {};
    if (rejectReason(corpusNode, people) !== null) return null;
    var ownerId = corpusNode.ownerId;
    var person = people[ownerId];

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
    rejectReason: rejectReason,                 // why a corpus node is dropped (null == clean)
    helpers: { contentId: contentId, pad8: pad8, lifeRange: lifeRange, personBlocked: personBlocked, distinctPeopleNamed: distinctPeopleNamed }
  };

  root.CASON_CORPUS_MEMORY = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
