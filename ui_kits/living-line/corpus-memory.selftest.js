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
