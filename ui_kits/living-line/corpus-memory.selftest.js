/* ============================================================
   Self-test for corpus-memory.js  (node ui_kits/living-line/corpus-memory.selftest.js)
   ------------------------------------------------------------
   Proves the reshape + horizon gate:
     - a dated, owned corpus node becomes an individual/reference memory
       node carrying the FACT year;
     - a yearless or ownerless corpus node is SKIPPED (cannot be gated);
     - the horizon gate seals a fact until its year arrives -- which is
       exactly why the 2026 research narration stays sealed for every
       ancestor;
     - ingestion is idempotent.
   Exit 0 on pass, exit 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var CM = require('./corpus-memory.js');

var people = global.CASON_DATA.people;
var failures = [];
function ok(cond, msg) { if (!cond) { failures.push(msg); console.error('FAIL: ' + msg); } }

/* ---- fixtures ---- */
var dated = {
  ownerId: 'ransom-jr',
  year: 1854,
  text: 'In 1854 Ransom patented 160 acres near Newnansville.',
  evidence: 'reference',
  kind: 'corpus'
};
var yearless = { ownerId: 'ransom-jr', text: 'Ransom patented land near Newnansville.' };
var ownerless = { ownerId: null, year: 1854, text: 'Someone patented land near Newnansville.' };

/* ---- 1: reshape a dated, owned corpus node ---- */
var node = CM.corpusMemoryNode(dated, people);
ok(node != null, 'dated owned node reshapes to a memory node (got null)');
if (node) {
  ok(node.year === 1854, 'year is preserved as the fact year 1854 (got ' + node.year + ')');
  ok(node.evidence === 'reference', "evidence === 'reference' (got " + node.evidence + ')');
  ok(node.kind === 'reference', "kind === 'reference' (got " + node.kind + ')');
  ok(node.scope === 'individual', "scope === 'individual' (got " + node.scope + ')');
  ok(node.ownerId === 'ransom-jr', "ownerId === 'ransom-jr' (got " + node.ownerId + ')');
  ok(node.generation === people['ransom-jr'].generation,
     'generation matches the person (got ' + node.generation + ')');
  ok(node.tags.indexOf('corpus') !== -1 && node.tags.indexOf('reference') !== -1,
     "tags include 'corpus' and 'reference'");
}

/* ---- 2: skip yearless and ownerless nodes ---- */
ok(CM.corpusMemoryNode(yearless, people) === null, 'yearless node is skipped (-> null)');
ok(CM.corpusMemoryNode(ownerless, people) === null, 'ownerless node is skipped (-> null)');

/* ---- 2b: the QUALITY GATE rejects noisy / misattributed sentences ----
   Each of these was a REAL failure mode in the two research memos. */
function reason(n) { return CM.rejectReason(n, people); }

// a) a fact pinned to a DISPROVEN/eliminated person (the quarantined English origin)
ok(reason({ ownerId: 'john-cason', year: 1608, text: 'John Cason baptised at Digswell in 1608, a stockholder in the Virginia Company.' }) === 'blocked-person',
   'a node on a disproven/eliminated person is rejected (blocked-person)');

// b) a year OUTSIDE the person's lifespan (Thadeous d.1945 mislabelled onto Carl 1903-1966 still in-life,
//    but a clearly-out-of-life year must go)
ok(reason({ ownerId: 'carl-columbus', year: 1780, text: 'A record dated 1780 mentioning Carl Columbus somehow.' }) === 'before-birth',
   'a year before the person was born is rejected (before-birth)');

// c) a markdown pull-list / table fragment
ok(reason({ ownerId: 'thadeous', year: 1888, text: 'Pull-list --- Target record Where Identifier / access --- Federal land patents' }) === 'fragment',
   'a table / pull-list fragment is rejected (fragment)');

// d) a NEGATIVE finding ("neither is Thadeous") is not Thadeous's memory
ok(reason({ ownerId: 'thadeous', year: 1920, text: 'The 1920 serial patent SER-735685 near Fort White. Neither is Thadeous the patentee here.' }) === 'negative-finding',
   'a research exclusion ("neither is X") is rejected (negative-finding)');

// e) a sentence naming TWO different people is ambiguous as to whose memory it is
ok(reason({ ownerId: 'carl-columbus', year: 1930, text: 'Carl married and Thadeous his father had by then moved west to Fort White.' }) === 'ambiguous-owner',
   'a sentence naming two distinct people is rejected (ambiguous-owner)');

// e2) an "aged N" that can't be this person's age (a relative's death told
//     relative to them) is rejected — Carl was 42 in 1945, not 88
ok(reason({ ownerId: 'carl-columbus', year: 1945, text: 'Died 17 Dec 1945 aged 88 and buried at Tustenuggee Methodist Cemetery near Fort White.' }) === 'age-mismatch',
   'a stated age that cannot be the person\'s is rejected (age-mismatch)');

// f) a genuinely CLEAN, dated, single-subject prose fact SURVIVES (gate is not just "reject all")
var clean = { ownerId: 'carl-columbus', year: 1962, text: 'Carl Columbus kept the Fort White homestead through the 1962 planting season.' };
ok(reason(clean) === null, 'a clean single-subject dated fact passes the gate (got ' + reason(clean) + ')');
ok(CM.corpusMemoryNode(clean, people) != null, 'the clean fact reshapes into a memory node');

// g) Ransom Sr. & Jr. share the given name "Ransom" — a bare "Ransom" is ONE
//    ambiguous name (which generation), not two people, so it is NOT ambiguous-owner
ok(reason(dated) === null, 'a shared first name across generations is not falsely flagged ambiguous (Ransom 1854 passes)');

/* ---- 3: HORIZON gate ---- */
var added = CM.ingestCorpusInto(global.CASON_MEMORY, [dated], people);
ok(added === 1, 'ingestCorpusInto added exactly 1 node (got ' + added + ')');

function surfacesCorpus(simNow) {
  var view = global.CASON_MEMORY.access('ransom-jr', { simNow: simNow });
  return view.individual.some(function (n) {
    return n.tags && n.tags.indexOf('corpus') !== -1;
  });
}

ok(surfacesCorpus(1853) === false,
   'BEFORE the fact year (simNow 1853): corpus reference is NOT surfaced (future is sealed)');
ok(surfacesCorpus(1855) === true,
   'AT/AFTER the fact year (simNow 1855): corpus reference IS surfaced');

/* This is the invariant that keeps the 2026 research narration sealed:
   a year-2026 node exceeds every ancestor's horizon, so it never leaks. */

/* ---- 4: idempotency ---- */
var addedAgain = CM.ingestCorpusInto(global.CASON_MEMORY, [dated], people);
ok(addedAgain === 0, 'second ingest is idempotent (added 0, got ' + addedAgain + ')');

/* ---- summary ---- */
if (failures.length) {
  console.error('corpus-memory selftest: ' + failures.length + ' failure(s).');
  process.exit(1);
}
console.log('corpus-memory selftest OK: reshape + horizon gate (1853 sealed / 1855 open) + idempotent ingest all pass.');
process.exit(0);
