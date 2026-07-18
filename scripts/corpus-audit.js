/* ============================================================
   The Corpus / Silo Auditor — the narrative watched against the record
   ------------------------------------------------------------
   Runs under Node (`node scripts/corpus-audit.js`). Where the drift-audit
   watches the GOVERNED state (data.js -> memory-graph/personas/almanac) evolve
   over time, this closes a different gap: the hand-written NARRATIVE pages
   (index.html, hub.html, cason-tree.html) are NOT derived from CASON_DATA, so
   they can drift out from under the audited record and even resurrect DISPROVEN
   claims the post-audit record explicitly quarantines. The governance smoke
   test bans those claims in the memory GRAPH, but the narrative HTML evades it
   because it is not in the graph. This audit scans the narrative directly.

   Three checks, over the same structured record every other layer derives from
   (window.CASON_DATA):

     • Check 1 — banned/disproven claims in the narrative (HIGH severity).
       The narrative asserting "Digswell", "Elizabeth Alcott", "Church Warden",
       or "Virginia Land Company" is stale text contradicting the audited
       record. Every hit is reported as file:line -- "<snippet>". Any Check-1
       finding makes the audit exit 1 (like a failing invariant).

     • Check 2 — place silo (informational). Place titles named in the narrative
       but MISSING from CASON_DATA.places, and record places not mentioned in
       any narrative. Reported, non-fatal.

     • Check 3 — person silo (best-effort, noisy). "<Given> Cason"-style names
       named in the narrative with no matching person in CASON_DATA.people.
       Reported, non-fatal.

   Propose, never publish: it reads files and prints a report; it edits nothing.
   Silo findings (Checks 2-3) are a soft report; only banned claims (Check 1)
   drive the non-zero exit, mirroring how the drift-audit signals a regression.

   Hard constraints: plain CommonJS, no external deps, no regex lookbehind, ASCII.
   ============================================================ */
'use strict';
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var DATA = path.join(ROOT, 'ui_kits', 'family-tree-app', 'data.js');
var NARRATIVE_FILES = ['index.html', 'hub.html', 'cason-tree.html'];

// The same quarantine vocabulary the governance smoke test bans in the graph.
var BANNED = /digswell|elizabeth alcott|church warden|virginia land company/i;

/* ---- load the structured record the browser way (global.window = global) ---- */
function loadRecord() {
  global.window = global;
  require(DATA); // data.js sets window.CASON_DATA = CASON_DATA
  return global.window.CASON_DATA;
}

/* ---- read the narrative files (skip any that don't exist) ---- */
function readNarratives() {
  var out = [];
  NARRATIVE_FILES.forEach(function (f) {
    var full = path.join(ROOT, f);
    if (fs.existsSync(full)) out.push({ name: f, text: fs.readFileSync(full, 'utf8') });
  });
  return out;
}

/* ---- small helpers ---- */
function dedupe(arr) {
  var seen = {}, out = [];
  arr.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
  return out;
}

// Normalize a place-ish string to lowercase alnum words (HTML entities dropped).
function normalizePlace(s) {
  return String(s)
    .replace(/&[a-z]+;/gi, ' ')       // &mdash; &amp; etc.
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Distinctive key tokens for a place LABEL/title: the leading segment before the
// first comma, split on '/', with generic geo suffix words stripped. e.g.
//   "Nassau County, Florida"        -> ["nassau"]
//   "Beaufort/Pitt Co., N. Carolina"-> ["beaufort", "pitt"]
//   "Newnansville, Alachua Co., FL" -> ["newnansville"]
var GEO_SUFFIX = /\b(county|co|parish|historic|site|area|headwaters|england|virginia|florida|georgia|carolina|fl|va|ga|nc|sc)\b/g;
function placeKeys(label) {
  var head = String(label).split(',')[0];
  return head.split('/').map(function (part) {
    return normalizePlace(part).replace(GEO_SUFFIX, ' ').replace(/\s+/g, ' ').trim();
  }).filter(Boolean);
}

// Two key tokens match when they are equal, or (for tokens long enough that a
// substring is meaningful) one contains the other. Short tokens require equality.
function tokenMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
}
function keysOverlap(aKeys, bKeys) {
  for (var i = 0; i < aKeys.length; i++) {
    for (var j = 0; j < bKeys.length; j++) {
      if (tokenMatch(aKeys[i], bKeys[j])) return true;
    }
  }
  return false;
}

function normalizeName(s) {
  return String(s)
    .replace(/&[a-z]+;/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
   Check 1 — banned/disproven claims in a narrative file.
   scanBanned(fileName, lines) -> [{ file, line, term, snippet }]
   `lines` is the file already split on '\n'; line numbers are 1-based.
   ============================================================ */
function snippetOf(line, at) {
  var start = Math.max(0, at - 40);
  var slice = line.slice(start, at + 60);
  slice = slice.replace(/\s+/g, ' ').trim();
  return (start > 0 ? '...' : '') + slice + (at + 60 < line.length ? '...' : '');
}
/* A banned term is only a PROBLEM when asserted as fact. When the same line
   also marks it disproven / quarantined, it is a legitimate audit-trail
   mention (e.g. cason-tree.html's quarantine ledger, or a "X is disproven"
   correction) — reported as info, never fatal. */
var DISPROVEN_CONTEXT = /disproven|disproved|disprove|quarantin|discard|debunk|ruled? out|not proven|unproven|no such|no register|does ?n.t exist|never existed|not located|myth|corrected|supersed|removed|in question|eliminated|alleged|fabricat|invent|false|no evidence|class="(?:claim|why|disproven)"|node-label disproven|the claim|the why/i;
var CONTEXT_WINDOW = 3;
function scanBanned(fileName, lines) {
  var hits = [];
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(BANNED);
    if (m) {
      // a banned term is only ASSERTED-as-fact when neither its own line nor
      // any line within +/-CONTEXT_WINDOW marks it disproven/quarantined
      // (ledgers wrap the claim in one div and the disproof in the next).
      var documented = false;
      for (var j = Math.max(0, i - CONTEXT_WINDOW); j <= Math.min(lines.length - 1, i + CONTEXT_WINDOW); j++) {
        if (DISPROVEN_CONTEXT.test(lines[j])) { documented = true; break; }
      }
      hits.push({
        file: fileName, line: i + 1, term: m[0],
        snippet: snippetOf(lines[i], m.index),
        context: documented ? 'documented' : 'asserted',
      });
    }
  }
  return hits;
}

/* ============================================================
   Check 2 — place silo.
   extractNarrativeTitles(text) pulls `title: "..."`/`title: '...'` values (the
   index.html directLine + branch marker arrays name places this way).
   placeSilo(recordPlaces, narrativeTitles, narrativeCorpus)
     recordPlaces     : array of place LABEL strings (CASON_DATA.places[].label)
     narrativeTitles  : array of place TITLE strings from the narrative
     narrativeCorpus  : (optional) full narrative text; used to decide whether a
                        record place is "mentioned" anywhere. Defaults to titles.
   -> { missingFromRecord: [titles in narrative w/ no record place],
        notInNarrative:    [record labels not mentioned in any narrative] }
   ============================================================ */
function extractNarrativeTitles(text) {
  var titles = [], re = /title:\s*(['"])([\s\S]*?)\1/g, m;
  while ((m = re.exec(text))) titles.push(m[2].replace(/\s+/g, ' ').trim());
  return dedupe(titles.filter(Boolean));
}
function placeSilo(recordPlaces, narrativeTitles, narrativeCorpus) {
  var corpus = normalizePlace(narrativeCorpus != null ? narrativeCorpus : narrativeTitles.join(' '));
  var recordKeyed = recordPlaces.map(function (lbl) { return { label: lbl, keys: placeKeys(lbl) }; });
  var narrKeyed = narrativeTitles.map(function (t) { return { title: t, keys: placeKeys(t) }; });

  var missingFromRecord = [];
  narrKeyed.forEach(function (n) {
    if (!n.keys.length) return;
    var matched = recordKeyed.some(function (r) { return keysOverlap(n.keys, r.keys); });
    if (!matched) missingFromRecord.push(n.title);
  });

  var notInNarrative = [];
  recordKeyed.forEach(function (r) {
    var mentioned = r.keys.some(function (k) { return k && k.length >= 3 && corpus.indexOf(k) !== -1; });
    if (!mentioned) notInNarrative.push(r.label);
  });

  return { missingFromRecord: dedupe(missingFromRecord), notInNarrative: notInNarrative };
}

/* ============================================================
   Check 3 — person silo (best-effort, names are noisy).
   extractCasonNames(text) collects "<Given> [X.] Cason"-style names.
   personSilo(narrativeNames, recordNames)
     -> { unmatched: [narrative Cason names with no matching record person] }
   Fuzzy match: a narrative name matches a record person when the narrative's
   given-name token appears as a whole token in the record person's name.
   ============================================================ */
function extractCasonNames(text) {
  // <Capitalized given> optionally <Middle initial or name> then Cason.
  var re = /\b[A-Z][a-z]+(?:\s+(?:[A-Z]\.?|[A-Z][a-z]+))?\s+Cason\b/g, m, out = [];
  while ((m = re.exec(text))) out.push(m[0].replace(/\s+/g, ' ').trim());
  return dedupe(out);
}
function personSilo(narrativeNames, recordNames) {
  var recTokenSets = recordNames.map(function (n) { return normalizeName(n).split(' ').filter(Boolean); });
  var unmatched = [];
  narrativeNames.forEach(function (nm) {
    var tokens = normalizeName(nm).split(' ').filter(Boolean);
    var given = tokens[0];
    if (!given) return;
    var matched = recTokenSets.some(function (set) { return set.indexOf(given) !== -1; });
    if (!matched) unmatched.push(nm);
  });
  return { unmatched: dedupe(unmatched) };
}

/* ============================================================
   Orchestration
   ============================================================ */
function runAudit(data, narratives) {
  // Check 1
  var banned = [];
  narratives.forEach(function (n) { banned = banned.concat(scanBanned(n.name, n.text.split('\n'))); });
  var bannedAsserted = banned.filter(function (h) { return h.context === 'asserted'; });
  var bannedDocumented = banned.filter(function (h) { return h.context === 'documented'; });

  // Check 2
  var recordPlaces = ((data && data.places) || []).map(function (p) { return p.label; });
  var narrTitles = [], corpus = '';
  narratives.forEach(function (n) { narrTitles = narrTitles.concat(extractNarrativeTitles(n.text)); corpus += ' ' + n.text; });
  var places = placeSilo(recordPlaces, dedupe(narrTitles), corpus);

  // Check 3
  var recordNames = Object.keys((data && data.people) || {}).map(function (id) { return data.people[id].name; });
  var narrNames = [];
  narratives.forEach(function (n) { narrNames = narrNames.concat(extractCasonNames(n.text)); });
  var persons = personSilo(dedupe(narrNames), recordNames);

  return {
    banned: banned,
    bannedAsserted: bannedAsserted,
    bannedDocumented: bannedDocumented,
    places: places,
    persons: persons,
    counts: {
      narrativeFiles: narratives.length,
      recordPlaces: recordPlaces.length,
      recordPeople: recordNames.length,
      banned: banned.length,
      bannedAsserted: bannedAsserted.length,
      bannedDocumented: bannedDocumented.length,
      placesMissingFromRecord: places.missingFromRecord.length,
      placesNotInNarrative: places.notInNarrative.length,
      personsUnmatched: persons.unmatched.length,
    },
  };
}

function report(res, files) {
  var L = [];
  L.push('Corpus / silo audit');
  L.push('  narrative files scanned: ' + files.map(function (f) { return f.name; }).join(', ') + ' (' + res.counts.narrativeFiles + ')');
  L.push('  record: ' + res.counts.recordPeople + ' people, ' + res.counts.recordPlaces + ' places');
  L.push('');
  L.push('Summary');
  L.push('  Check 1  quarantined claim ASSERTED as fact : ' + res.counts.bannedAsserted + '   [HIGH]');
  L.push('  Check 1  quarantined claim documented as disproven : ' + res.counts.bannedDocumented + '   [info, ok]');
  L.push('  Check 2  places in narrative, missing from record : ' + res.counts.placesMissingFromRecord + '   [info]');
  L.push('  Check 2  record places not mentioned in narrative : ' + res.counts.placesNotInNarrative + '   [info]');
  L.push('  Check 3  Cason names in narrative, no record person : ' + res.counts.personsUnmatched + '   [info, best-effort]');
  L.push('');

  L.push('== HIGH: quarantined claims ASSERTED as fact in the narrative ==');
  if (!res.bannedAsserted.length) {
    L.push('  (none) no page asserts a disproven claim as fact.');
  } else {
    res.bannedAsserted.forEach(function (h) {
      L.push('  ' + h.file + ':' + h.line + ' -- "' + h.snippet + '"   [matched: ' + h.term + ']');
    });
  }
  L.push('');

  L.push('== info: quarantined terms named in disproven/quarantine context (ok) ==');
  if (!res.bannedDocumented.length) L.push('    (none)');
  else res.bannedDocumented.forEach(function (h) { L.push('    ' + h.file + ':' + h.line + '   [' + h.term + ']'); });
  L.push('');

  L.push('== info: place silo ==');
  L.push('  present in narrative, MISSING from CASON_DATA.places (' + res.places.missingFromRecord.length + '):');
  if (!res.places.missingFromRecord.length) L.push('    (none)');
  else res.places.missingFromRecord.forEach(function (t) { L.push('    - ' + t); });
  L.push('  in CASON_DATA.places, not mentioned in any narrative (' + res.places.notInNarrative.length + '):');
  if (!res.places.notInNarrative.length) L.push('    (none)');
  else res.places.notInNarrative.forEach(function (t) { L.push('    - ' + t); });
  L.push('');

  L.push('== info: person silo (best-effort; Cason names are noisy) ==');
  L.push('  Cason names in narrative with no matching record person (' + res.persons.unmatched.length + '):');
  if (!res.persons.unmatched.length) L.push('    (none)');
  else res.persons.unmatched.forEach(function (n) { L.push('    - ' + n); });
  L.push('');

  L.push(res.bannedAsserted.length
    ? '** ' + res.bannedAsserted.length + ' quarantined claim(s) ASSERTED as fact in the narrative -- fix the narrative (exit 1). **'
    : '_No page asserts a disproven claim as fact. Documented mentions and silo findings above are informational._');
  return L.join('\n');
}

function main() {
  var data = loadRecord();
  var narratives = readNarratives();
  var res = runAudit(data, narratives);
  console.log(report(res, narratives));
  return res.bannedAsserted.length ? 1 : 0;
}

module.exports = {
  BANNED: BANNED,
  loadRecord: loadRecord,
  readNarratives: readNarratives,
  scanBanned: scanBanned,
  extractNarrativeTitles: extractNarrativeTitles,
  placeKeys: placeKeys,
  placeSilo: placeSilo,
  extractCasonNames: extractCasonNames,
  personSilo: personSilo,
  runAudit: runAudit,
  report: report,
};

if (require.main === module) process.exit(main());
