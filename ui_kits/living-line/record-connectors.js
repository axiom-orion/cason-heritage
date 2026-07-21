/* ============================================================
   Record connectors  (window.CASON_RECORDS)
   ------------------------------------------------------------
   The bridge from a persona to REAL archives -- the "real facts, not
   hypotheses" layer. Today: the Library of Congress "Chronicling America"
   newspaper collection (free, keyless), via /api/records. It turns a person
   into a date-bounded name search and returns candidate records to verify,
   each carrying an LOC citation. These are LEADS -- they enter the record
   only through the governed door (sourced, tiered, human-approved), never as
   fact.

     personParams(person) -> { name, from, to }   [pure, tested]
     parse(apiJson)       -> items[]              [pure, tested]
     search(person)       -> Promise<{items, note, error}>  (calls /api/records)

   Structured tree-GROWTH (new kin) needs a genealogy tree API (FamilySearch,
   OAuth) -- a later connector behind this same interface.

   No-build (window) + Node (module.exports). ASCII; no regex lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  var MIN_YEAR = 1836, MAX_YEAR = 1963;   // Chronicling America practical coverage

  // a person -> a date-bounded name search, widened a little around their life
  function personParams(person) {
    person = person || {};
    var name = String(person.name || '').trim();
    var b = (person.born && typeof person.born.year === 'number') ? person.born.year : null;
    var d = (person.died && typeof person.died.year === 'number') ? person.died.year : null;
    var from = Math.min(b != null ? Math.max(MIN_YEAR, b - 2) : MIN_YEAR, MAX_YEAR);
    var to = Math.max(d != null ? Math.min(MAX_YEAR, d + 5) : (b != null ? Math.min(MAX_YEAR, b + 95) : MAX_YEAR), MIN_YEAR);
    if (to < from) to = from;
    return { name: name, from: from, to: to };
  }

  function parse(json) { return (json && Array.isArray(json.items)) ? json.items : []; }

  function search(person) {
    var params = personParams(person);
    if (!params.name) return Promise.resolve({ items: [], error: 'A name is required.' });
    return fetch('/api/records', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(params) })
      .then(function (r) { return r.json(); })
      .then(function (j) { return { items: parse(j), note: j.note, error: j.error }; })
      .catch(function (e) { return { items: [], error: String((e && e.message) || e) }; });
  }

  var API = { personParams: personParams, parse: parse, search: search, coverage: { from: MIN_YEAR, to: MAX_YEAR } };
  root.CASON_RECORDS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
