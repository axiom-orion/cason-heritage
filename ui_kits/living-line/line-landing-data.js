/* ============================================================
   The Living Line — Landing dataset  (window.CASON_LINE)
   ------------------------------------------------------------
   Transforms the verified record (window.CASON_DATA) plus the
   derived memory graph (window.CASON_MEMORY) and persona sheets
   (window.CASON_PERSONAS) into the editorial shape the landing
   page renders against — a list of generations, each with a
   roman numeral, title, era, seat, one-line summary, and its
   members.

   Nothing here is invented: names, dates, occupations, source
   counts, memory counts, and kinship all come straight from the
   record. The per-generation title / seat / summary are curated
   editorial glue, each grounded in that generation's direct-line
   ancestor and the era / place metadata already in the data.

   BUILT from the record — never a duplicate of it. Same facts in
   => same CASON_LINE out (idempotent).

   Runs no-build in the browser (window) and under Node
   (module.exports) for the selftest. No regex lookbehind — that
   is a parse-time SyntaxError on iOS Safari < 16.4.
   ============================================================ */
(function (root) {
  'use strict';

  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];

  /* Curated per-generation framing, each line grounded in the real
     narratives / roles / places in CASON_DATA. Keyed by generation
     number. Missing keys fall back to derived values. */
  var GEN_META = {
    1:  { title: 'The Crossing',
          seat: 'Lynnhaven Parish, Lower Norfolk Co., Virginia',
          sum: 'Thomas Casson comes over as a headright in 1635 and plants the name on the Virginia tobacco coast.' },
    2:  { title: 'The First-Born',
          seat: 'Lynnhaven Parish, Virginia',
          sum: 'Thomas Jr. and his siblings hold the Lynnhaven land; by 1665 the line narrows to a single male heir.' },
    3:  { title: 'The Orphan',
          seat: 'Princess Anne County, Virginia',
          sum: 'James, orphaned in 1665, is the sole surviving male Cason — the whole line hangs on one boy.' },
    4:  { title: 'The Carolina Move',
          seat: 'Princess Anne, Virginia to Pitt Co., North Carolina',
          sum: 'James’s children scatter; William carries the name south into the Carolina frontier.' },
    5:  { title: 'The Missing Link',
          seat: 'Pitt County, North Carolina',
          sum: 'The load-bearing generation — the unproven bridge between William’s Carolina household and the Florida Casons.' },
    6:  { title: 'The Florida Crossing',
          seat: 'Pitt Co., NC to Glynn Co., Georgia to Florida',
          sum: 'Ransom Sr. and his brothers leave Carolina; the line crosses into Georgia and then into Florida.' },
    7:  { title: 'The Builder',
          seat: 'Newnansville, Alachua Co., Florida',
          sum: 'James Green Cason builds the Florida homestead — nine children, and the county learns the name.' },
    8:  { title: 'The War Years',
          seat: 'Alachua County, Florida',
          sum: 'The war takes some and marks the rest; Lt. Ransom marches and comes home to rebuild.' },
    9:  { title: 'The Westward Move',
          seat: 'Alachua to Columbia Co. / Fort White, Florida',
          sum: 'Thadeous carries the family through Reconstruction and into the new century.' },
    10: { title: 'Thirteen Children',
          seat: 'Fort White, Columbia Co., Florida',
          sum: 'Carl Columbus and Wilma raise thirteen children through turpentine, timber, and the Depression.' },
    11: { title: 'The Space Coast',
          seat: 'Titusville, Brevard Co., Florida',
          sum: 'The line reaches the Space Coast — Robert Sr. and his generation, rockets on the horizon.' },
    12: { title: 'The Children of the Coast',
          seat: 'Brevard County, Florida',
          sum: 'Robert Sr.’s children — the household that grew up under the rockets.' },
    13: { title: 'The Keepers',
          seat: 'Florida and beyond',
          sum: 'The generation building the Living Line, recording itself as it goes.' },
    14: { title: 'The Newest',
          seat: 'The archive is the homeplace',
          sum: 'The youngest on the line — the record continues.' }
  };

  /* ---- year parsing (no lookbehind) ---- */
  function years(str) {
    if (!str) return [];
    var out = [];
    var re = /\d{4}/g;
    var m;
    while ((m = re.exec(String(str))) !== null) out.push(parseInt(m[0], 10));
    return out;
  }
  function birthYearOf(p) {
    if (p.born && typeof p.born.year === 'number') return p.born.year;
    var ys = years(p.lifespan);
    if (!ys.length) return null;
    // "b. 1933" / "bapt 1608" => single year is the birth
    return ys[0];
  }
  function deathYearOf(p) {
    if (p.died && typeof p.died.year === 'number') return p.died.year;
    var ys = years(p.lifespan);
    if (ys.length >= 2) return ys[ys.length - 1];
    // a lone year that reads as a death ("d. 1722")
    if (ys.length === 1 && /\bd\.?\s/i.test(p.lifespan || '')) return ys[0];
    return null;
  }

  /* Is this person still living? No death on record and born in the
     modern era. These are the ones still "recording" their own line. */
  function isLiving(p, b, d) {
    if (d != null) return false;
    if (b != null && b >= 1900) return true;
    return false;
  }

  /* Persona status the landing renders:
       live   -> SPEAKING        (deceased, well-documented, on the line)
       scribe -> IN TRANSCRIPTION (deceased, thinner record)
       rec    -> RECORDING       (still living, narrating their own sheet) */
  function statusOf(p, b, d, mem) {
    if (isLiving(p, b, d)) return 'rec';
    var ev = p.evidence;
    if (ev === 'confirmed' || ev === 'leading') return 'live';
    if (mem >= 8) return 'live';
    return 'scribe';
  }

  // abbreviations whose trailing period is NOT a sentence end
  var ABBR = {};
  ('mr mrs ms dr sr jr st co inc capt lt gen col sgt rev hon esq no vs pp p c ca approx bef aft d b m'
    .split(' ')).forEach(function (a) { ABBR[a] = 1; });

  /* First real sentence of the narrative, else the role. No lookbehind.
     Skips periods that belong to abbreviations / single letters so notes
     like "...Ransom Sr. and his brothers..." don't get cut at "Sr." */
  function firstSentence(text) {
    if (!text) return '';
    var t = String(text).trim();
    var end = -1;
    for (var i = 0; i < t.length - 1; i++) {
      var c = t[i];
      if ((c === '!' || c === '?') && t[i + 1] === ' ') { end = i + 1; break; }
      if (c === '.' && t[i + 1] === ' ') {
        // word ending just before the period
        var j = i - 1, w = '';
        while (j >= 0 && /[A-Za-z]/.test(t[j])) { w = t[j] + w; j--; }
        var lower = w.toLowerCase();
        if (w.length === 1) continue;          // initial, e.g. "J. Green"
        if (ABBR[lower]) continue;             // known abbreviation
        end = i + 1; break;
      }
    }
    var s = end === -1 ? t : t.slice(0, end);
    if (s.length > 190) s = s.slice(0, 187).replace(/\s+\S*$/, '') + '…';
    return s.trim();
  }

  function displayDates(p, b, d) {
    if (p.lifespan && p.lifespan.trim() && p.lifespan.trim() !== '? - ?' && p.lifespan.trim() !== '? – ?') {
      return p.lifespan.trim();
    }
    if (b != null && d != null) return b + '–' + d;
    if (b != null) return 'b. ' + b;
    if (d != null) return 'd. ' + d;
    return '';
  }

  function occupationOf(personas, p) {
    var byId = personas && personas.byId;
    var per = byId && byId[p.id];
    if (per && per.occupation) return per.occupation;
    var role = (p.role || '').trim();
    if (!role) return '';
    // strip an em-dash / hyphen qualifier: "The Crossing — origin unproven"
    var cut = role.split(/\s—\s|\s-\s/)[0].trim();
    return cut || role;
  }

  function memCountOf(memory, id) {
    var by = memory && memory.byOwner;
    var arr = by && by[id];
    return arr && arr.length ? arr.length : 0;
  }

  /* ---- the build ---- */
  function buildLine(data, memory, personas) {
    var people = data.people || {};
    var ids = Object.keys(people);

    // group by generation (skip gen 0 = alleged/eliminated origin,
    // and skip anything disproven — the living line is the record
    // that stands).
    var byGen = {};
    var globalMin = 9999, globalMax = 0;
    ids.forEach(function (id) {
      var p = people[id];
      var g = p.generation;
      if (typeof g !== 'number' || g < 1) return;
      if (p.evidence === 'eliminated') return;
      (byGen[g] = byGen[g] || []).push(p);
    });

    var directIndex = {};
    (data.directLine || []).forEach(function (id, i) { directIndex[id] = i; });

    var gens = Object.keys(byGen).map(Number).sort(function (a, b) { return a - b; }).map(function (g) {
      var list = byGen[g];
      var genMin = 9999, genMax = 0;

      var members = list.map(function (p) {
        var b = birthYearOf(p);
        var d = deathYearOf(p);
        var mem = memCountOf(memory, p.id);
        if (b != null) { genMin = Math.min(genMin, b); globalMin = Math.min(globalMin, b); }
        if (d != null) { genMax = Math.max(genMax, d); globalMax = Math.max(globalMax, d); }
        return {
          id: p.id,
          n: p.name,
          b: b,
          d: d,
          direct: !!p.direct,
          occ: occupationOf(personas, p),
          note: firstSentence(p.narrative) || (p.role || ''),
          mem: mem,
          src: (p.sources || []).length,
          st: statusOf(p, b, d, mem),
          ev: p.evidence || 'secondary',
          p: (p.parents && p.parents.length) ? p.parents[0] : null,
          cite: (p.sources && p.sources.length) ? p.sources[0] : null,
          dates: displayDates(p, b, d)
        };
      });

      // direct-line ancestor(s) first, then by birth year, then name.
      members.sort(function (a, b2) {
        if (a.direct !== b2.direct) return a.direct ? -1 : 1;
        var ab = a.b == null ? 99999 : a.b, bb = b2.b == null ? 99999 : b2.b;
        if (ab !== bb) return ab - bb;
        return String(a.n).localeCompare(String(b2.n));
      });

      var meta = GEN_META[g] || {};
      var era = (genMin < 9999 && genMax > 0)
        ? (genMin + '–' + genMax)
        : (genMin < 9999 ? genMin + '–' : '');

      return {
        g: g,
        roman: ROMAN[g] || String(g),
        title: meta.title || ('Generation ' + (ROMAN[g] || g)),
        era: era,
        seat: meta.seat || '',
        sum: meta.sum || '',
        members: members
      };
    });

    var present = 2026;
    return {
      start: globalMin < 9999 ? globalMin : 1604,
      end: Math.max(globalMax || 0, present),
      present: present,
      gens: gens
    };
  }

  var api = { buildLine: buildLine, birthYearOf: birthYearOf, deathYearOf: deathYearOf, firstSentence: firstSentence };

  // Browser: build immediately from the globals the page already loaded.
  if (root && root.CASON_DATA) {
    try {
      root.CASON_LINE = buildLine(root.CASON_DATA, root.CASON_MEMORY, root.CASON_PERSONAS);
    } catch (e) {
      if (typeof console !== 'undefined') console.error('[CASON_LINE] build failed:', e);
    }
  }
  root.CASON_LINE_API = api;

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
