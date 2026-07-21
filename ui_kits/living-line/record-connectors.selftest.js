/* ============================================================
   Self-test for record-connectors.js  (node ui_kits/living-line/record-connectors.selftest.js)
   ------------------------------------------------------------
   Proves the pure person -> search mapping and response parsing (the network
   call to /api/records + LOC verifies live, not here):
     - personParams derives a name + a date window bounded to the archive's
       coverage, widened a little around a lifespan;
     - an unknown lifespan falls back to the full coverage window;
     - parse pulls items out of the API shape and tolerates junk.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
var R = require('./record-connectors.js');
var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

/* ---- 1: a dated person -> a bounded window around their life ---- */
var p1 = R.personParams({ name: 'Thadeous Cason', born: { year: 1857 }, died: { year: 1945 } });
ok(p1.name === 'Thadeous Cason', 'name carried through');
ok(p1.from === 1855 && p1.to === 1950, 'window widened a little around the lifespan (1855-1950)');

/* ---- 2: coverage clamps ---- */
var p2 = R.personParams({ name: 'Old Ancestor', born: { year: 1700 }, died: { year: 1770 } });
ok(p2.from === 1836, 'a birth before the archive starts clamps to 1836');
var p3 = R.personParams({ name: 'Recent Kin', born: { year: 1980 } });
ok(p3.to <= 1963, 'the upper bound never exceeds the archive coverage (1963)');

/* ---- 3: unknown lifespan -> full window ---- */
var p4 = R.personParams({ name: 'No Dates' });
ok(p4.from === 1836 && p4.to === 1963, 'no dates -> the full coverage window');

/* ---- 4: empty name ---- */
ok(R.personParams({}).name === '', 'a person with no name yields an empty name (search declines)');

/* ---- 5: parse tolerates the API shape and junk ---- */
ok(R.parse({ items: [{ title: 'A', url: 'u' }] }).length === 1, 'parse pulls items from the API shape');
ok(R.parse(null).length === 0 && R.parse({}).length === 0 && R.parse({ items: 'nope' }).length === 0, 'parse tolerates null / missing / wrong-typed items');

/* ---- summary ---- */
if (fails.length) { console.error('record-connectors selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('record-connectors selftest OK: person -> bounded date search, coverage clamps, and tolerant parsing.');
process.exit(0);
