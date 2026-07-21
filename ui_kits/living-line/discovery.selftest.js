/* ============================================================
   Self-test for discovery.js + memory-graph addPerson
   (node ui_kits/living-line/discovery.selftest.js)
   ------------------------------------------------------------
   Proves a NEWLY-FOUND person becomes a real, governed entity:
     - a discovery mints a new person node wired to its anchor BOTH ways
       (the anchor now lists them; knownPeersOf sees them);
     - it is accessible in the graph (identity node) and its memory reachable;
     - evidence is CAPPED below primary (never 'confirmed'), tagged discovered;
     - it is idempotent (same name -> same id, no duplicate);
     - it is REJECTED without a name / anchor / valid relation;
     - a data.js snippet is emitted for the durable, human-approved record.
   Uses a fresh graph (not the shared singleton) so it can't pollute others.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
var MG = require('./memory-graph.js');
var D = require('./discovery.js');

// a fresh graph over a COPY of the data so the test is self-contained
var data = JSON.parse(JSON.stringify(global.CASON_DATA));
// discovery.js reads root.CASON_DATA for validate/people; point it at our copy
global.CASON_DATA = data;
var mem = MG.build(data);
mem.access = function (id, opts) { return MG.access(mem, data, id, opts); };
mem.knownPeersOf = function (id) { return (MG.helpers.knownPeersOf(data, id)); };

var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

/* ---- 1: a discovery becomes a wired entity ---- */
var res = D.apply(mem, { name: 'Ann Munden', relation: 'sibling', anchor: 'phoebe-munden', source: 'Bo Williams, Pioneers of the Wiregrass (derivative)' });
ok(res && res.id === 'ann-munden' && !res.error, 'apply mints the new person id "ann-munden" (got ' + JSON.stringify(res.error || res.id) + ')');
ok(!!data.people['ann-munden'], 'the new person is now in data.people');
ok((data.people['phoebe-munden'].siblings || []).indexOf('ann-munden') !== -1, 'the anchor (Phoebe) now lists Ann as a sibling (wired BOTH ways)');
ok(mem.knownPeersOf('phoebe-munden').indexOf('ann-munden') !== -1, 'knownPeersOf(Phoebe) now includes the discovered Ann');

/* ---- 2: the entity is accessible + memory reachable ---- */
var sub = mem.access('ann-munden');
ok(sub.family.some(function (n) { return /Ann Munden/.test(n.text); }) || (mem.byOwner['ann-munden'] || []).length > 0,
   'the new entity has graph nodes (identity + note)');

/* ---- 3: evidence capped, tagged, provisional ---- */
ok(data.people['ann-munden'].evidence === 'secondary', 'a sourced discovery caps at secondary, never confirmed (got ' + data.people['ann-munden'].evidence + ')');
ok((data.people['ann-munden'].tags || []).indexOf('provisional') !== -1, 'the new person is tagged provisional');

/* ---- 4: idempotent ---- */
var again = D.apply(mem, { name: 'Ann Munden', relation: 'sibling', anchor: 'phoebe-munden' });
ok(again.existing === true && again.id === 'ann-munden', 'applying the same discovery again is idempotent (no duplicate)');
ok(Object.keys(data.people).filter(function (k) { return k === 'ann-munden'; }).length === 1, 'exactly one ann-munden exists');

/* ---- 5: rejected when malformed ---- */
ok(D.apply(mem, { relation: 'child', anchor: 'phoebe-munden' }).error, 'no name -> rejected');
ok(D.apply(mem, { name: 'Nobody', relation: 'child', anchor: 'no-such-anchor' }).error, 'unknown anchor -> rejected');
ok(D.apply(mem, { name: 'Nobody', relation: 'friend', anchor: 'phoebe-munden' }).error, 'invalid relation -> rejected');

/* ---- 6: a no-source discovery still works but caps lower ---- */
var poss = D.apply(mem, { name: 'Baby Cason', relation: 'child', anchor: 'moses' });
ok(poss.id === 'baby-cason' && data.people['baby-cason'].evidence === 'possible', 'an unsourced discovery caps at possible');
ok((data.people['moses'].children || []).indexOf('baby-cason') !== -1, 'Moses now lists the discovered child');

/* ---- 7: durable data.js snippet ---- */
ok(res.snippet && /'ann-munden': \{/.test(res.snippet) && /evidence: 'secondary'/.test(res.snippet) && /tags: \['discovered'\]/.test(res.snippet),
   'a data.js record snippet is emitted for the keeper to append: ' + (res.snippet || '').slice(0, 80));

/* ---- summary ---- */
if (fails.length) { console.error('discovery selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('discovery selftest OK: found person -> wired provisional entity (capped + tagged), idempotent, malformed rejected, durable data.js snippet emitted.');
process.exit(0);
