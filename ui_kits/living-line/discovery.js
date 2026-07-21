/* ============================================================
   The Living Line -- Discovery  (window.CASON_DISCOVERY)
   ------------------------------------------------------------
   The governed path for a NEWLY-FOUND person to become a real entity --
   an in-law's family, an unnamed child, a neighbor a persona encountered.
   Until now nothing could CREATE a person node: every path only annotated
   existing people, and a discovery could only live as gap-text on the
   nearest ancestor. This closes that gap while keeping the record supervised:

     - validate(spec)         a discovery must name the person, anchor them to
                              a KNOWN relative, and state the relation; a source
                              is what lifts it above a bare 'possible'.
     - apply(memory, spec)    mint the entity PROVISIONALLY in the graph
                              (memory.addPerson), capped below primary, tagged
                              provisional/discovered -- it appears at once but is
                              never `confirmed`.
     - dataSnippet(id, rec)   the durable record: a data.js line a keeper appends
                              (the human approval that makes it permanent).

   So a discovery is: proposed -> provisional entity (visible, tiered) ->
   keeper approves -> appended to data.js. Autonomy to FIND; the record's
   permanence stays human-gated.

   No-build (window) + Node (module.exports). ASCII; no regex lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  var RELATIONS = ['child', 'parent', 'spouse', 'sibling'];

  function peopleOf(memory) {
    if (root.CASON_DATA && root.CASON_DATA.people) return root.CASON_DATA.people;
    return {};
  }

  /* a discovery is well-formed only if it names the person, anchors them to a
     real relative, and states a valid relation. */
  function validate(spec, memory) {
    spec = spec || {};
    if (!String(spec.name || '').trim()) return { ok: false, error: 'Name the person you found.' };
    if (RELATIONS.indexOf(spec.relation) === -1) return { ok: false, error: 'State the relation: child, parent, spouse, or sibling.' };
    var people = peopleOf(memory);
    if (!spec.anchor || !people[spec.anchor]) return { ok: false, error: 'Anchor them to a known relative (a person already in the record).' };
    return { ok: true };
  }

  function esc(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  /* a data.js record line a keeper appends to make the entity permanent. */
  function dataSnippet(id, rec) {
    rec = rec || {};
    var parts = ["id: '" + esc(id) + "'"];
    if (rec.generation != null) parts.push('generation: ' + rec.generation);
    parts.push("name: '" + esc(rec.name) + "'");
    ['parents', 'spouse', 'children', 'siblings'].forEach(function (k) {
      if (rec[k] && rec[k].length) parts.push(k + ": ['" + rec[k].map(esc).join("', '") + "']");
    });
    parts.push('direct: false');
    parts.push("evidence: '" + esc(rec.evidence || 'possible') + "'");
    if (rec.narrative) parts.push("narrative: '" + esc(rec.narrative) + "'");
    if (rec.sources && rec.sources.length) parts.push("sources: ['" + rec.sources.map(esc).join("', '") + "']");
    parts.push("tags: ['discovered']");
    return "    '" + esc(id) + "': { " + parts.join(', ') + ' },';
  }

  /* validate -> mint the provisional entity -> hand back the durable snippet. */
  function apply(memory, spec) {
    if (!memory || typeof memory.addPerson !== 'function') return { error: 'This memory graph cannot create entities.' };
    var v = validate(spec, memory);
    if (!v.ok) return { error: v.error };
    var out = memory.addPerson(spec);
    if (out && out.error) return { error: out.error };
    var rec = out.record || (root.CASON_DATA && root.CASON_DATA.people[out.id]) || null;
    return { id: out.id, existing: !!out.existing, record: rec, snippet: rec ? dataSnippet(out.id, rec) : null };
  }

  var API = { RELATIONS: RELATIONS, validate: validate, apply: apply, dataSnippet: dataSnippet };
  root.CASON_DISCOVERY = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
