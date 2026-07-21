/* ============================================================
   Onboarding -- GEDCOM import  (window.CASON_GEDCOM)
   ------------------------------------------------------------
   The product unlock: ANY family exports a GEDCOM (from Ancestry,
   MyHeritage, FamilySearch, Gramps, ...) and it becomes CASON_DATA --
   the exact shape the whole governed engine already consumes. So the
   horizon-bounding, the kinship graph, the personas, the encounter web,
   the review gate all work on a stranger's tree with zero changes. That
   is the thesis proven: the trust layer is family-agnostic.

   parse(gedcomText) -> { people, eras:[], directLine:[], stats }
     - people: id-keyed records { id, generation, name, sex, born, died,
       parents[], spouse[], children[], direct, evidence, narrative, tags,
       sources }.
     - imported people are honestly tiered `possible` (unverified until a
       source is attached) and tagged `imported` -- they enter the record
       through the SAME governed door as any other lead, never as fact.

   Deterministic, dependency-free. Node + browser. ASCII; no lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function year(s) { var m = String(s || '').match(/\d{4}/); return m ? parseInt(m[0], 10) : null; }

  // one GEDCOM line -> { level, xref, tag, value }
  function parseLine(line) {
    var m = String(line).match(/^\s*(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s([\s\S]*))?$/);
    if (!m) return null;
    return { level: parseInt(m[1], 10), xref: m[2] ? m[2].trim() : null, tag: m[3], value: (m[4] != null ? m[4] : '') };
  }

  // clean a GEDCOM NAME ("John Wilkes /Cason/") into a display name
  function cleanName(v) { return String(v || '').replace(/\//g, '').replace(/\s+/g, ' ').trim(); }

  function readRecords(text) {
    var lines = String(text || '').split(/\r?\n/);
    var indi = {}, fam = {};
    var cur = null, curType = null, sub = null;
    lines.forEach(function (raw) {
      var p = parseLine(raw); if (!p) return;
      if (p.level === 0) {
        if (p.tag === 'INDI' && p.xref) { cur = { id: p.xref, name: '', sex: '', fams: [], famc: null, note: '', hasSource: false }; indi[p.xref] = cur; curType = 'INDI'; }
        else if (p.tag === 'FAM' && p.xref) { cur = { id: p.xref, husb: null, wife: null, chil: [] }; fam[p.xref] = cur; curType = 'FAM'; }
        else { cur = null; curType = null; }
        sub = null; return;
      }
      if (!cur) return;
      if (curType === 'INDI') {
        if (p.level === 1) {
          sub = p.tag;
          if (p.tag === 'NAME') cur.name = cleanName(p.value);
          else if (p.tag === 'SEX') cur.sex = p.value.trim();
          else if (p.tag === 'FAMS') cur.fams.push(p.value.trim());
          else if (p.tag === 'FAMC') cur.famc = p.value.trim();
          else if (p.tag === 'BIRT') cur.birth = cur.birth || {};
          else if (p.tag === 'DEAT') cur.death = cur.death || {};
          else if (p.tag === 'NOTE') cur.note = (cur.note ? cur.note + ' ' : '') + p.value;
          else if (p.tag === 'SOUR') cur.hasSource = true;
        } else if (p.level >= 2) {
          if (sub === 'BIRT' && cur.birth) { if (p.tag === 'DATE') cur.birth.date = p.value; else if (p.tag === 'PLAC') cur.birth.place = p.value.trim(); }
          else if (sub === 'DEAT' && cur.death) { if (p.tag === 'DATE') cur.death.date = p.value; else if (p.tag === 'PLAC') cur.death.place = p.value.trim(); }
          else if (sub === 'NOTE' || p.tag === 'CONT' || p.tag === 'CONC') cur.note = (cur.note ? cur.note + ' ' : '') + p.value;
          else if (p.tag === 'SOUR') cur.hasSource = true;
        }
      } else if (curType === 'FAM') {
        if (p.tag === 'HUSB') cur.husb = p.value.trim();
        else if (p.tag === 'WIFE') cur.wife = p.value.trim();
        else if (p.tag === 'CHIL') cur.chil.push(p.value.trim());
      }
    });
    return { indi: indi, fam: fam };
  }

  // generation = longest parent-chain depth (roots at 0), by fixpoint
  function assignGenerations(people) {
    var ids = Object.keys(people), gen = {};
    ids.forEach(function (id) { if (!(people[id].parents || []).length) gen[id] = 0; });
    var changed = true, guard = 0;
    while (changed && guard++ < 200) {
      changed = false;
      ids.forEach(function (id) {
        var ps = (people[id].parents || []).map(function (p) { return gen[p]; }).filter(function (g) { return g != null; });
        if (ps.length) { var g = Math.max.apply(null, ps) + 1; if (gen[id] !== g) { gen[id] = g; changed = true; } }
      });
    }
    ids.forEach(function (id) { if (gen[id] == null) gen[id] = 0; });
    return gen;
  }

  function parse(text) {
    var rec = readRecords(text);
    var indi = rec.indi, fam = rec.fam;

    // xref -> stable slug id (deduped)
    var slugOf = {}, used = {};
    Object.keys(indi).forEach(function (x) {
      var base = slugify(indi[x].name) || ('person-' + slugify(x));
      var id = base, n = 2;
      while (used[id]) { id = base + '-' + n; n++; }
      used[id] = true; slugOf[x] = id;
    });

    // people skeletons
    var people = {};
    Object.keys(indi).forEach(function (x) {
      var g = indi[x], id = slugOf[x];
      var rec2 = {
        id: id, name: g.name || 'Unknown', direct: false,
        parents: [], spouse: [], children: [],
        evidence: g.hasSource ? 'secondary' : 'possible',   // imported = unverified until sourced
        tags: ['imported'],
        sources: [], narrative: g.note ? String(g.note).trim() : null,
      };
      if (g.sex) rec2.sex = g.sex;
      if (g.birth) rec2.born = { year: year(g.birth.date), place: g.birth.place || null };
      if (g.death) rec2.died = { year: year(g.death.date), place: g.death.place || null };
      people[id] = rec2;
    });

    // resolve kin from families
    Object.keys(fam).forEach(function (fx) {
      var f = fam[fx];
      var hus = f.husb && slugOf[f.husb], wif = f.wife && slugOf[f.wife];
      var kids = (f.chil || []).map(function (c) { return slugOf[c]; }).filter(Boolean);
      if (hus && wif) { pushUniq(people[hus].spouse, wif); pushUniq(people[wif].spouse, hus); }
      kids.forEach(function (k) {
        if (hus) { pushUniq(people[k].parents, hus); pushUniq(people[hus].children, k); }
        if (wif) { pushUniq(people[k].parents, wif); pushUniq(people[wif].children, k); }
      });
    });

    // generations
    var gen = assignGenerations(people);
    Object.keys(people).forEach(function (id) { people[id].generation = gen[id]; });

    var withYear = Object.keys(people).filter(function (id) { return people[id].born && people[id].born.year != null; }).length;
    return {
      people: people, eras: [], directLine: [],
      stats: { people: Object.keys(people).length, families: Object.keys(fam).length,
               generations: Math.max.apply(null, Object.keys(people).map(function (id) { return gen[id]; }).concat([0])) + 1,
               withBirthYear: withYear },
    };
  }
  function pushUniq(arr, v) { if (v && arr.indexOf(v) === -1) arr.push(v); }

  var API = { parse: parse, slugify: slugify };
  root.CASON_GEDCOM = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
