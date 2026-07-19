/* ============================================================
   The Living Line — Audience tiers  (window.CASON_TIERS)
   ------------------------------------------------------------
   How personal the story gets, by who is reading. Three tiers,
   ordinal, innermost last:

     0 · outsiders     the public story — nothing personal about the living
     1 · outer family  the wider family — living kin named, kept plain
     2 · known family  closest in — the personal telling

   The keeper assigns a viewer's tier by closeness. The reader can
   dial DOWN from there (a known-family viewer can preview what an
   outsider sees) but never up.

   SOFT ENFORCEMENT (for now): the gate is client-side. That means it
   is BYPASSABLE — everything shipped to the browser can be read by a
   determined viewer. So until hard (Supabase) enforcement lands,
   nothing HARMFUL-IF-LEAKED may live in any tier above outsider. The
   harmfulScan() guardrail below is how we keep that promise: run it in
   an audit; if it flags a living person's address / phone / health /
   a minor's private data, that content waits for the hard gate.

   No-build (window) + Node (module.exports). No regex lookbehind. ASCII.
   ============================================================ */
(function (root) {
  'use strict';

  var TIERS = [
    { key: 'outsider', level: 0, label: 'Outsiders',    blurb: 'the public story — nothing personal about the living' },
    { key: 'outer',    level: 1, label: 'Outer family', blurb: 'the wider family — living kin named, kept plain' },
    { key: 'known',    level: 2, label: 'Known family', blurb: 'closest in — the personal telling' },
  ];
  var BY_KEY = {}; TIERS.forEach(function (t) { BY_KEY[t.key] = t; });
  var DEFAULT = 'outsider';
  var LS_KEY = 'cason-view-tier';

  function tier(key) { return BY_KEY[key] || BY_KEY[DEFAULT]; }
  function level(key) { return tier(key).level; }

  // content tagged at `contentTier` is visible to a viewer at `viewerTier`
  // when the viewer is at least that far in.
  function canSee(contentTier, viewerTier) {
    return level(contentTier || 'outsider') <= level(viewerTier || DEFAULT);
  }

  /* ---- viewer state (soft: localStorage, plus a ?tier= share link) ---- */
  function readViewer() {
    try {
      if (typeof root.location !== 'undefined' && root.location.search) {
        var m = root.location.search.match(/[?&]tier=([a-z]+)/i);
        if (m && BY_KEY[m[1].toLowerCase()]) { setViewer(m[1].toLowerCase()); return m[1].toLowerCase(); }
      }
    } catch (e) {}
    try {
      var v = root.localStorage && root.localStorage.getItem(LS_KEY);
      if (v && BY_KEY[v]) return v;
    } catch (e) {}
    return DEFAULT;
  }
  function setViewer(key) {
    if (!BY_KEY[key]) return;
    try { if (root.localStorage) root.localStorage.setItem(LS_KEY, key); } catch (e) {}
  }

  /* ---- guardrail: harmful-if-leaked content must not ride the soft gate ---- */
  var HARMFUL = [
    { kind: 'street-address', re: /\b\d{2,6}\s+[A-Z][a-zA-Z.]*\s+(?:St|Street|Rd|Road|Ave|Avenue|Ln|Lane|Dr|Drive|Blvd|Ct|Court|Way|Cir|Circle|Pl|Place|Ter|Terrace|Hwy)\b/ },
    { kind: 'phone', re: /\b\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
    { kind: 'ssn', re: /\b\d{3}-\d{2}-\d{4}\b/ },
    { kind: 'email', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ },
    { kind: 'health', re: /\b(diagnos\w*|cancer|dementia|alzheimer|addict\w*|psychiatr\w*|HIV|overdose|suicid\w*)\b/i },
  ];
  // scan a string; returns the kinds of harmful patterns present (empty = clean).
  // A person marked living (livingFlag true) makes address/phone harmful; for the
  // deceased those are historical and allowed.
  function harmfulScan(text, livingFlag) {
    var hits = [];
    if (!text) return hits;
    HARMFUL.forEach(function (h) {
      if (h.re.test(text)) {
        if ((h.kind === 'street-address' || h.kind === 'phone') && !livingFlag) return; // historical, ok
        hits.push(h.kind);
      }
    });
    return hits;
  }

  var API = {
    TIERS: TIERS,
    DEFAULT: DEFAULT,
    tier: tier,
    level: level,
    canSee: canSee,
    viewer: readViewer,      // current viewer tier key
    setViewer: setViewer,
    harmfulScan: harmfulScan,
    HARMFUL: HARMFUL,
  };
  root.CASON_TIERS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
