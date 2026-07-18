/* ============================================================
   The Living Line -- Corpus Ingestion self-test  (run under Node)
     node ui_kits/living-line/corpus.selftest.js
   ------------------------------------------------------------
   Loads the REAL structured data (data.js) and corpus.js, then asserts
   the load-bearing invariants of the ingestion + retrieval primitive on
   a synthetic fixture:
     * a substantial sentence becomes a corpus node with provenance,
       kind 'corpus', and evidence 'reference';
     * a sentence containing a 4-digit year carries that year;
     * a sentence naming a real Cason person entity-links to a real
       person id (a Ransom) via matchPeople against CASON_DATA;
     * search() retrieves a node by keyword overlap;
     * a too-short sentence is dropped.
   Exit code 0 = all pass. Also ingests the real research/*.md files as a
   non-asserting bonus and prints node/owner counts.
   ============================================================ */
'use strict';

// Match the module's UMD root so require() side-effects land on a shared object.
global.window = global;
require('../family-tree-app/data.js'); // sets global.CASON_DATA
var C = require('./corpus.js');

var people = (global.CASON_DATA && global.CASON_DATA.people) || {};

var pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

console.log('Corpus ingestion self-test\n');

// --- synthetic fixture -----------------------------------------------------
var doc = {
  id: 't1',
  path: 'research/test.md',
  title: 'Test Memo',
  text: 'In 1854 Ransom Cason patented 160 acres near Newnansville. This sentence is long enough to be a node.'
};

var nodes = C.ingestDoc(doc);

ok('ingestDoc returns >= 1 node', nodes.length >= 1);

ok('every node carries the source path in sources',
  nodes.length > 0 && nodes.every(function (n) { return n.sources.indexOf('research/test.md') !== -1; }));

ok("every node has kind === 'corpus'",
  nodes.every(function (n) { return n.kind === 'corpus'; }));

ok("every node has evidence === 'reference'",
  nodes.every(function (n) { return n.evidence === 'reference'; }));

ok("every node has scope === 'reference'",
  nodes.every(function (n) { return n.scope === 'reference'; }));

ok("every node derivedFrom the doc",
  nodes.every(function (n) { return n.derivedFrom.indexOf('corpus.t1') !== -1; }));

ok("every node tagged ['corpus','document', ...]",
  nodes.every(function (n) { return n.tags.indexOf('corpus') !== -1 && n.tags.indexOf('document') !== -1; }));

var yearNode = nodes.filter(function (n) { return n.text.indexOf('1854') !== -1; })[0];
ok('the "1854" sentence has year === 1854', !!yearNode && yearNode.year === 1854);

// --- entity-linking --------------------------------------------------------
var matched = C.matchPeople('In 1854 Ransom Cason patented 160 acres near Newnansville.', people);
ok('matchPeople resolves a real person id', !!matched && !!people[matched]);
ok('matched person is a Cason', !!matched && /cason/i.test((people[matched] || {}).name || ''));
ok('matched person is a Ransom (best-effort tiebreak)', !!matched && /ransom/i.test((people[matched] || {}).name || ''));
ok('the "1854" node ownerId is set to that person', !!yearNode && yearNode.ownerId === matched);

// bare surname alone is ambiguous -> declines to guess
ok('bare surname "the Cason family" does NOT falsely link',
  C.matchPeople('the Cason family moved south', people) === null);

// --- retrieval -------------------------------------------------------------
var hits = C.search(nodes, 'patent Newnansville');
ok("search(nodes,'patent Newnansville') returns the patent node",
  hits.length >= 1 && hits[0].text.indexOf('Newnansville') !== -1);
ok('search with no matching terms returns nothing',
  C.search(nodes, 'zzzznotpresent').length === 0);

// --- min-length gate -------------------------------------------------------
var shortNodes = C.ingestDoc({ id: 's1', path: 'research/short.md', title: 'Short', text: 'Short one.' });
ok('a too-short sentence is dropped', shortNodes.length === 0);

// --- build() indexes -------------------------------------------------------
var built = C.build([doc], people);
ok('build() reports doc/node/owner stats',
  built.stats.docCount === 1 && built.stats.nodeCount === nodes.length && built.stats.matchedOwnerCount >= 1);
ok('build() indexes byDoc and byOwner',
  !!built.byDoc['corpus.t1'] && !!built.byOwner[matched]);

// --- BONUS: ingest the real research/*.md corpus (non-asserting) -----------
(function () {
  var fs = require('fs');
  var path = require('path');
  var dir = path.join(__dirname, '..', '..', 'research');
  var docs = [];
  try {
    fs.readdirSync(dir).filter(function (f) { return /\.md$/i.test(f); }).forEach(function (f) {
      var full = path.join(dir, f);
      docs.push({ id: f.replace(/\.md$/i, ''), path: 'research/' + f, title: f, text: fs.readFileSync(full, 'utf8') });
    });
  } catch (e) {
    console.log('\n(bonus) research/ not readable: ' + e.message);
    return;
  }
  var real = C.build(docs, people);
  console.log('\n(bonus) real research corpus: ' + real.stats.docCount + ' docs -> ' +
    real.stats.nodeCount + ' nodes, ' + real.stats.matchedOwnerCount + ' owners matched');
  var sample = C.search(real.nodes, 'Fort White turpentine patent');
  console.log('(bonus) top hit for "Fort White turpentine patent": ' +
    (sample[0] ? '[' + (sample[0].ownerId || '-') + '] ' + sample[0].text.slice(0, 90) : '(none)'));
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
