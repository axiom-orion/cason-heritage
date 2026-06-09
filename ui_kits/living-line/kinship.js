/* ============================================================
   The Living Line — Kinship Resolver  (window.CASON_KINSHIP)
   ------------------------------------------------------------
   Deterministic relational truth by graph traversal — the
   capability the sibling repo `genealogy-graphrag` *proves* (its
   eval takes relational recall@5 from 0.000 to 1.000 the moment a
   kinship graph answers "who was the maternal grandfather of X?"),
   ported here so the Keeper resolves kinship from the family graph
   instead of asking a language model to guess it.

   This is a faithful port of genealogy-graphrag's
   `src/genealogy_rag/kinship.py` (`RelationResolver`): same relation
   headwords, the same `<relation-headword> of <PersonName>` parser,
   and the same maternal/paternal/great traversal — adapted to read
   the curated edges already in CASON_DATA (`people[id].parents /
   children / spouse / siblings`). genealogy-graphrag stays the
   rigorous reference + benchmark; this is the no-build, no-network
   realization that runs in the Keeper's own runtime.

   HONESTY — sex is not fabricated. genealogy-graphrag's resolver
   splits father/mother (and grandfather/son/husband/brother…) by a
   `sex` field. CASON_DATA carries no such field today, so gendered
   relations DEGRADE HONESTLY: when sex cannot be established, the
   resolver returns the sex-neutral set and raises `sexUnresolved`,
   rather than guessing a person's sex from their name. Add `sex: 'M'`
   / `'F'` to a person in data.js and the gendered split becomes exact
   automatically — no code change.

   Truth-direction — parents/children/spouse/siblings are read from a
   person's OWN curated fields, so an `eliminated` claim recorded on
   another node (e.g. the disproven "John Cason → Thomas" edge) never
   pollutes a real lookup. Eliminated nodes are surfaced separately,
   for the conflict check, never as kin.

   Runs no-build in the browser (attaches to window) and under Node
   (module.exports) — the same dual runtime as its sibling modules.
   ============================================================ */
(function (root) {
  'use strict';

  /* Relation headwords + modifiers — identical to genealogy-graphrag. */
  var RELATION_HEADWORDS = {
    grandfather: 1, grandmother: 1, grandparent: 1, grandparents: 1,
    father: 1, mother: 1, parent: 1, parents: 1,
    son: 1, sons: 1, daughter: 1, daughters: 1, child: 1, children: 1,
    husband: 1, wife: 1, spouse: 1,
    brother: 1, brothers: 1, sister: 1, sisters: 1, sibling: 1, siblings: 1,
    cousin: 1, cousins: 1,
  };
  var MODIFIERS = { maternal: 1, paternal: 1, great: 1 };
  var WORD = /[a-z]+/g;

  function dedup(xs) {
    var seen = {}, out = [];
    for (var i = 0; i < xs.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(seen, xs[i])) { seen[xs[i]] = 1; out.push(xs[i]); }
    }
    return out;
  }

  /* ---- build a resolver bound to a CASON_DATA instance ---- */
  function build(data) {
    var people = (data && data.people) || {};

    function has(id) { return Object.prototype.hasOwnProperty.call(people, id); }
    function nameOf(id) { return (has(id) && people[id].name) || id; }
    function evidenceOf(id) { return (has(id) && people[id].evidence) || null; }
    function sexOf(id) { return (has(id) && people[id].sex) || null; } // future-proof; absent today
    function field(id, key) { return (has(id) && Array.isArray(people[id][key])) ? people[id][key].filter(has) : []; }

    function parents(id) { return field(id, 'parents'); }
    function children(id) { return field(id, 'children'); }
    function spouses(id) { return field(id, 'spouse'); }

    /* siblings: explicit `siblings` field UNION derived (shared-parent) — py derives;
       the Cason data has both, so we union and dedup, never counting self. */
    function siblings(id) {
      var out = field(id, 'siblings');
      var ps = parents(id);
      for (var i = 0; i < ps.length; i++) {
        var kids = children(ps[i]);
        for (var j = 0; j < kids.length; j++) if (kids[j] !== id) out.push(kids[j]);
      }
      return dedup(out.filter(function (x) { return x !== id; }));
    }

    function cousins(id) {
      var out = [];
      var ps = parents(id);
      for (var i = 0; i < ps.length; i++) {
        var auncles = siblings(ps[i]);
        for (var j = 0; j < auncles.length; j++) {
          var kids = children(auncles[j]);
          for (var k = 0; k < kids.length; k++) out.push(kids[k]);
        }
      }
      return dedup(out);
    }

    /* Honest sex filter: keep ids whose sex matches `want` OR is unknown,
       and report whether any unknown-sex id had to be let through. */
    function filterSex(ids, want) {
      var out = [], unresolved = false;
      for (var i = 0; i < ids.length; i++) {
        var s = sexOf(ids[i]);
        if (s === want) out.push(ids[i]);
        else if (s == null) { out.push(ids[i]); unresolved = true; }
      }
      return { ids: dedup(out), sexUnresolved: unresolved };
    }

    /* ---- name index (longest names first, like py) ---- */
    var names = Object.keys(people)
      .map(function (id) { return [String(people[id].name || id).toLowerCase(), id]; })
      .sort(function (a, b) { return b[0].length - a[0].length; });

    /* ---- parser: `<relation-headword> of <PersonName>` ---- */
    function parse(query) {
      var ql = String(query || '').toLowerCase();
      for (var n = 0; n < names.length; n++) {
        var nameLower = names[n][0], pid = names[n][1];
        var marker = 'of ' + nameLower;
        var j = ql.indexOf(marker);
        if (j === -1) continue;
        var prefix = ql.slice(0, j).match(WORD) || [];
        if (!prefix.length) continue;
        var headword = prefix[prefix.length - 1];
        if (!RELATION_HEADWORDS[headword]) continue; // "household of X" -> not a kin lookup
        var mods = prefix.slice(Math.max(0, prefix.length - 4), prefix.length - 1)
          .filter(function (w) { return MODIFIERS[w]; });
        return { anchor: pid, relation: headword, modifiers: mods };
      }
      return null;
    }

    function tag(ids) {
      return ids.map(function (id) { return { id: id, name: nameOf(id), evidence: evidenceOf(id) }; });
    }

    /* ---- structured resolution: anchor id + relation (+ modifiers) ---- */
    function resolveFor(anchor, relation, modifiers) {
      relation = String(relation || '').toLowerCase();
      modifiers = modifiers || [];
      var maternal = modifiers.indexOf('maternal') !== -1;
      var paternal = modifiers.indexOf('paternal') !== -1;
      var great = modifiers.indexOf('great') !== -1;
      var sexUnresolved = false;

      function grandparents() {
        var src;
        if (paternal) { src = filterSex(parents(anchor), 'M'); sexUnresolved = sexUnresolved || src.sexUnresolved; src = src.ids; }
        else if (maternal) { src = filterSex(parents(anchor), 'F'); sexUnresolved = sexUnresolved || src.sexUnresolved; src = src.ids; }
        else { src = parents(anchor); }
        var gps = [];
        for (var i = 0; i < src.length; i++) gps = gps.concat(parents(src[i]));
        if (great) { var g2 = []; for (var k = 0; k < gps.length; k++) g2 = g2.concat(parents(gps[k])); gps = g2; }
        return dedup(gps);
      }

      var ids;
      switch (relation) {
        case 'father': { var f = filterSex(parents(anchor), 'M'); sexUnresolved = sexUnresolved || f.sexUnresolved; ids = f.ids; break; }
        case 'mother': { var m = filterSex(parents(anchor), 'F'); sexUnresolved = sexUnresolved || m.sexUnresolved; ids = m.ids; break; }
        case 'parent': case 'parents': ids = parents(anchor); break;
        case 'grandfather': { var gf = filterSex(grandparents(), 'M'); sexUnresolved = sexUnresolved || gf.sexUnresolved; ids = gf.ids; break; }
        case 'grandmother': { var gm = filterSex(grandparents(), 'F'); sexUnresolved = sexUnresolved || gm.sexUnresolved; ids = gm.ids; break; }
        case 'grandparent': case 'grandparents': ids = grandparents(); break;
        case 'son': case 'sons': { var so = filterSex(children(anchor), 'M'); sexUnresolved = sexUnresolved || so.sexUnresolved; ids = so.ids; break; }
        case 'daughter': case 'daughters': { var da = filterSex(children(anchor), 'F'); sexUnresolved = sexUnresolved || da.sexUnresolved; ids = da.ids; break; }
        case 'child': case 'children': ids = children(anchor); break;
        case 'husband': { var hu = filterSex(spouses(anchor), 'M'); sexUnresolved = sexUnresolved || hu.sexUnresolved; ids = hu.ids; break; }
        case 'wife': { var wi = filterSex(spouses(anchor), 'F'); sexUnresolved = sexUnresolved || wi.sexUnresolved; ids = wi.ids; break; }
        case 'spouse': ids = spouses(anchor); break;
        case 'brother': case 'brothers': { var br = filterSex(siblings(anchor), 'M'); sexUnresolved = sexUnresolved || br.sexUnresolved; ids = br.ids; break; }
        case 'sister': case 'sisters': { var si = filterSex(siblings(anchor), 'F'); sexUnresolved = sexUnresolved || si.sexUnresolved; ids = si.ids; break; }
        case 'sibling': case 'siblings': ids = siblings(anchor); break;
        case 'cousin': case 'cousins': ids = cousins(anchor); break;
        default: ids = [];
      }
      ids = dedup(ids);
      // gendered relation with no sex data anywhere in the result is the honest "can't split" case
      return {
        anchor: anchor, anchorName: nameOf(anchor), relation: relation, modifiers: modifiers.slice(),
        targetIds: ids, targets: tag(ids), sexUnresolved: !!sexUnresolved, fired: ids.length > 0,
      };
    }

    function resolve(query) {
      var p = parse(query);
      if (!p) return null;
      return resolveFor(p.anchor, p.relation, p.modifiers);
    }

    /* ---- grounding: a person's known kin, for the consensus context ---- */
    function knownKin(id) {
      return {
        self: { id: id, name: nameOf(id), evidence: evidenceOf(id) },
        parents: tag(parents(id)),
        children: tag(children(id)),
        spouses: tag(spouses(id)),
        siblings: tag(siblings(id)),
      };
    }

    /* ---- the curated "do not propose as kin" set, for the conflict check ----
       People the family has affirmatively ruled out (`evidence: 'eliminated'`)
       or disproven. Each carries a distinctive matcher so a free-text answer
       that revives one as kin can be caught (e.g. "Cannon Cason Sr." was
       eliminated as Ransom's father). Bare/ambiguous names (a plain "John
       Cason" that is also a real living-line son) are NOT matched, to keep the
       check high-precision. */
    function eliminatedKin() {
      var out = [];
      Object.keys(people).forEach(function (id) {
        var p = people[id];
        var tags = p.tags || [];
        var elim = p.evidence === 'eliminated' || tags.indexOf('eliminated') !== -1 || tags.indexOf('disproven') !== -1;
        if (!elim) return;
        var bare = String(p.name || '').replace(/\s*\(.*?\)\s*/g, ' '); // drop "(alleged)" etc.
        var tokens = bare.toLowerCase().match(/[a-z0-9]+/g) || [];
        // distinctive = carries an ordinal (Sr./Jr./III) or is a 3+-token full name,
        // so a bare ambiguous "John Cason" (also a real living-line son) is NOT matched.
        var distinctive = tokens.some(function (t) { return t === 'sr' || t === 'jr' || t === 'ii' || t === 'iii'; }) || tokens.length >= 3;
        if (!distinctive) return;
        // build the matcher from word tokens (not the raw name) so a trailing "." in
        // "Sr." never breaks the closing word boundary.
        var pattern = new RegExp('\\b' + tokens.join('\\s+') + '\\b', 'i');
        out.push({ id: id, name: p.name, evidence: p.evidence || 'eliminated', pattern: pattern });
      });
      return out;
    }

    return {
      build: build,            // re-exposed for convenience
      parse: parse,
      resolve: resolve,
      resolveFor: resolveFor,
      knownKin: knownKin,
      eliminatedKin: eliminatedKin,
      // low-level accessors (parity with genealogy-graphrag's GraphStore)
      parents: parents, children: children, spouses: spouses, siblings: siblings, cousins: cousins,
      nameOf: nameOf, evidenceOf: evidenceOf, sexOf: sexOf, allPersonNames: function () { return names.slice(); },
    };
  }

  var API = { build: build, RELATION_HEADWORDS: RELATION_HEADWORDS, MODIFIERS: MODIFIERS };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) {
    root.CASON_KINSHIP_API = API;
    root.buildKinship = build;
    if (root.CASON_DATA) root.CASON_KINSHIP = build(root.CASON_DATA);
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
