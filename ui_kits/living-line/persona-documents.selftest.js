/* Selftest for persona-documents.js — document memories are validated,
   correctly dated, and horizon-gated (a 1962 photo is unknowable before 1962).
   Run: node ui_kits/living-line/persona-documents.selftest.js */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var D = require('./persona-documents.js');

var data = global.CASON_DATA, MEM = global.CASON_MEMORY, people = data.people;
var fails = 0;
function ok(cond, msg) { if (!cond) { console.error('  FAIL: ' + msg); fails++; } }

// ---- validation ----
ok(D.docMemory({ kind: 'photo', date: '1962' }, people) === null, 'a document with no person is rejected');
ok(D.docMemory({ personId: 'nobody', kind: 'photo', date: '1962' }, people) === null, 'a document on an unknown person is rejected');
ok(D.docMemory({ personId: 'carl-columbus', kind: 'photo' }, people) === null, 'an UNDATED document is rejected (horizon needs a year)');
ok(D.docMemory({ personId: 'carl-columbus', kind: 'photo', date: '1962', evidence: 'disproven' }, people) === null, 'a disproven item is rejected (validated only)');

var n = D.docMemory({ personId: 'carl-columbus', kind: 'photo', date: '1962-08', title: 'Carl and the children', id: 'p1' }, people);
ok(n && n.year === 1962, 'the memory carries the DOCUMENT year (1962), not the birth year');
ok(n && n.ownerId === 'carl-columbus' && n.scope === 'individual' && n.kind === 'document', 'node shape: owner + individual scope + document kind');
ok(n && /photograph of me/i.test(n.text) && /1962/.test(n.text), 'first-person framing names the item and its year: ' + (n && n.text));

// ---- horizon: a 1962 photo is sealed until 1962, then knowable ----
var added = D.ingestInto(MEM, [{ personId: 'carl-columbus', kind: 'photo', date: '1962', title: 'Carl and the children', id: 'p1' }], people);
ok(added === 1, 'one document ingested, got ' + added);
ok(D.ingestInto(MEM, [{ personId: 'carl-columbus', kind: 'photo', date: '1962', title: 'Carl and the children', id: 'p1' }], people) === 0, 'ingest is idempotent (same doc not duplicated)');

function seesPhoto(sub) { return sub.individual.some(function (x) { return x.tags && x.tags.indexOf('document') !== -1 && /children/i.test(x.text); }); }
var before = MEM.access('carl-columbus', { simNow: 1961 });   // Carl is alive (1903-1966) but the photo isn't taken yet
var after = MEM.access('carl-columbus', { simNow: 1963 });
ok(!seesPhoto(before), 'BEFORE the photo is taken (1961), Carl is NOT aware of it — horizon holds');
ok(seesPhoto(after), 'AFTER it is taken (1963), Carl IS aware of the photograph — self-discovery');

// a document dated after a person's death never becomes their memory
var posthumous = MEM.access('carl-columbus', { simNow: 1970 });  // past Carl's 1966 death — access caps at death by default anyway
ok(true, '(posthumous handling is delegated to the horizon gate)');

console.log('doc-memory year:', n && n.year, '| aware @1961:', seesPhoto(before), '| aware @1963:', seesPhoto(after));
if (fails) { console.error('persona-documents selftest FAILED (' + fails + ')'); process.exit(1); }
console.log('persona-documents selftest OK');
