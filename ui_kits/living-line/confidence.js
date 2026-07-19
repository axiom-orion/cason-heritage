/* ============================================================
   The Living Line — Confidence stamps  (window.CASON_CONFIDENCE)
   ------------------------------------------------------------
   The register for asides: content that doesn't belong in the clean
   story flow gets told anyway — but stamped with exactly how sure we
   are. The stamp is DERIVED from the record's `evidence` field, so it
   can never overclaim: a family tradition can't wear a "documented"
   badge, and a primary source can't be filed as a rumor.

   The honesty ladder, from proven to hearsay:
     ON THE RECORD  · STRONGLY SUPPORTED · AS REPORTED · REASONED ·
     DOUBTFUL · OPEN QUESTION · RULED OUT

   REASONED is the one the keeper asked for by name: some things make
   sense given the circumstances and can be told — as long as we are
   straight that there is no concrete record. And some things (OPEN
   QUESTION) may never be settled; the gloss says so.

   No-build (window) + Node (module.exports). No regex lookbehind. ASCII.
   ============================================================ */
(function (root) {
  'use strict';

  // evidence value -> stamp. tone drives styling; gloss is plain English.
  var STAMPS = {
    confirmed:  { key: 'documented', label: 'ON THE RECORD',      gloss: 'documented by a primary source',                    tone: 'strong' },
    leading:    { key: 'leading',    label: 'STRONGLY SUPPORTED',  gloss: 'the best-supported reading, not yet closed',        tone: 'strong' },
    secondary:  { key: 'reported',   label: 'AS REPORTED',         gloss: 'from a single, secondary source — still to verify', tone: 'mid' },
    possible:   { key: 'reasoned',   label: 'REASONED',            gloss: 'plausible given the circumstances, but not proven', tone: 'soft' },
    unlikely:   { key: 'doubtful',   label: 'DOUBTFUL',            gloss: 'named in the tradition, but the evidence leans against it', tone: 'soft' },
    unsolved:   { key: 'open',       label: 'OPEN QUESTION',       gloss: 'unresolved — and it may never be settled',          tone: 'open' },
    eliminated: { key: 'ruledout',   label: 'RULED OUT',           gloss: 'once claimed, disproven by the record',             tone: 'out' },
    disproven:  { key: 'ruledout',   label: 'RULED OUT',           gloss: 'once claimed, disproven by the record',             tone: 'out' },
  };
  var UNSTATED = { key: 'noted', label: 'NOTED', gloss: 'recorded; confidence not yet graded', tone: 'mid' };

  // a stamp for a plain "reasoned from the factors" aside that has no
  // evidence value of its own — the keeper's "makes sense, but no concrete"
  var REASONED = STAMPS.possible;

  var TONE_ORDER = { strong: 0, mid: 1, soft: 2, open: 3, out: 4 };

  function stampFor(evidence) {
    if (!evidence) return UNSTATED;
    var s = STAMPS[String(evidence).toLowerCase()];
    return s || UNSTATED;
  }

  // ordering so asides can sort strongest-first (or open-first)
  function rank(stamp) { return TONE_ORDER[stamp.tone] == null ? 9 : TONE_ORDER[stamp.tone]; }

  /* Assemble a person's asides from what the record already holds:
       - each source[]      -> an ON THE RECORD / AS REPORTED aside (by the
                               person's evidence), carrying the citation
       - the note           -> a context aside, stamped by evidence
       - open-line gaps      -> an OPEN QUESTION aside (from CASON_MEMORY)
     Nothing is invented; the frame is derived. `memory` is optional
     (window.CASON_MEMORY); without it, gaps are skipped. */
  function asidesForPerson(person, memory) {
    if (!person) return [];
    var out = [];
    var ev = person.evidence || null;
    var base = stampFor(ev);
    (person.sources || []).forEach(function (src) {
      // a source that is itself flagged secondary reads as "as reported"
      var isSecondary = /secondary|derivative|reconstruct/i.test(src);
      out.push({ kind: 'source', text: src, stamp: isSecondary ? STAMPS.secondary : (base.tone === 'strong' ? STAMPS.confirmed : base) });
    });
    if (person.notes && String(person.notes).trim()) {
      out.push({ kind: 'note', text: String(person.notes).trim(), stamp: base });
    }
    if (memory && memory.byOwner && memory.byOwner[person.id]) {
      memory.byOwner[person.id].forEach(function (n) {
        if (n.kind === 'gap' && n.text) out.push({ kind: 'open', text: n.text, stamp: STAMPS.unsolved });
      });
    }
    return out;
  }

  var API = {
    STAMPS: STAMPS,
    UNSTATED: UNSTATED,
    REASONED: REASONED,
    stampFor: stampFor,
    rank: rank,
    asidesForPerson: asidesForPerson,
  };
  root.CASON_CONFIDENCE = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
