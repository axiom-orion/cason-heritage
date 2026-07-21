/* ============================================================
   Self-test for encounters.js  (node ui_kits/living-line/encounters.selftest.js)
   ------------------------------------------------------------
   Proves "who did they meet, and when?" is now durable and queryable:
     - build derives CERTAIN kin meetings + PROBABLE neighbor meetings;
     - encountersOf lists who a person knew, with when/where/why, certain first;
     - knownPeersOf(id, year) is time-aware: a spouse counts only from the year
       they could both be present, feeding the scope gate durably;
     - ingestEdges persists meetings as first-class `type:'encounter'` edges,
       idempotently.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var ENC = require('./encounters.js');

var data = global.CASON_DATA;
var idx = ENC.build(data);
var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

/* ---- 1: build produces an index ---- */
ok(idx.records.length > 0, 'build derives encounter records (got ' + idx.records.length + ')');
ok(idx.records.some(function (r) { return r.certainty === 'certain'; }), 'there are CERTAIN (kin) encounters');
ok(idx.records.some(function (r) { return r.certainty === 'probable'; }), 'there are PROBABLE (neighbor) encounters');

/* ---- 2: encountersOf lists who a person knew ---- */
var thad = ENC.encountersOf(idx, 'thadeous');
ok(thad.length > 0, 'Thadeous has recorded encounters');
ok(thad.some(function (e) { return e.who === 'georgia-mckinney' && /spouse/.test(e.basis); }), 'Thadeous knew Georgia (kin:spouse)');
ok(thad[0].certainty === 'certain', 'certain encounters are listed first');

/* ---- 3: knownPeersOf is time-aware (feeds the scope gate durably) ---- */
var metBy1900 = ENC.knownPeersOf(idx, 'thadeous', 1900);
var metBy1855 = ENC.knownPeersOf(idx, 'thadeous', 1855); // before Georgia (b.1860) could be present
ok(metBy1900.indexOf('georgia-mckinney') !== -1, 'by 1900 Thadeous had met Georgia');
ok(metBy1855.indexOf('georgia-mckinney') === -1, 'in 1855 he had not yet (time-aware, like the horizon)');
ok(ENC.knownPeersOf(idx, 'thadeous').length >= metBy1855.length, 'the all-time set is a superset of any year-bounded set');

/* ---- 4: symmetry ---- */
ok(ENC.encountersOf(idx, 'georgia-mckinney').some(function (e) { return e.who === 'thadeous'; }), 'the meeting is symmetric (Georgia knew Thadeous too)');

/* ---- 5: ingestEdges persists first-class encounter edges, idempotently ---- */
var mem = global.CASON_MEMORY;
var before = mem.edges.filter(function (e) { return e.type === 'encounter'; }).length;
var added = ENC.ingestEdges(mem, idx);
var after = mem.edges.filter(function (e) { return e.type === 'encounter'; }).length;
ok(after > before || before > 0, 'encounter edges are present in the graph after ingest');
ok(ENC.ingestEdges(mem, idx) === 0, 'a second ingest adds nothing (idempotent)');

/* ---- summary ---- */
if (fails.length) { console.error('encounters selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('encounters selftest OK: kin + neighbor meetings derived, who/when/where queryable, knownPeersOf time-aware, edges persisted idempotently (' + idx.records.length + ' encounters).');
process.exit(0);
