/* ============================================================
   Self-test for the Keeper's per-persona scheduler (node scripts/keeper.selftest.js)
   ------------------------------------------------------------
   Proves the autonomous "each persona explores its own questions" pass:
     - selectPerPersona returns ONE question per persona (no clustering);
     - each pick is a real, horizon-accessible gap of its owner;
     - ruled-out / disproven / placeholder personas are never selected;
     - the MAX cap is respected;
     - it genuinely spreads wider than the global top-N (which can cluster).
   keeper.js exports these without running main() (require.main guard).
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

var K = require('./keeper.js');
var g = K.loadGraph();
var failures = [];
function ok(cond, msg) { if (!cond) { failures.push(msg); console.error('FAIL: ' + msg); } }

var picks = K.selectPerPersona(g);

/* ---- 1: returns picks, capped, one per persona ---- */
ok(Array.isArray(picks) && picks.length > 0, 'per-persona selection returns picks (got ' + (picks && picks.length) + ')');
ok(picks.length <= 3, 'respects the MAX cap (default 3): ' + picks.length);
var owners = picks.map(function (p) { return p.ownerId; });
var uniq = owners.filter(function (o, i) { return owners.indexOf(o) === i; });
ok(uniq.length === owners.length, 'one question per persona -- no duplicate owners: ' + owners.join(', '));

/* ---- 2: each pick is a horizon-accessible gap of its owner ---- */
ok(picks.every(function (p) {
  var sub = g.MEM.access(p.ownerId);
  return sub.individual.some(function (n) { return n.kind === 'gap' && n.text === p.text; });
}), 'each pick is a horizon-accessible gap of its own owner');

/* ---- 3: no ruled-out / disproven / placeholder persona is ever selected ---- */
ok(picks.every(function (p) { return !K.personBlocked(g.DATA.people[p.ownerId]); }),
   'no blocked (eliminated/disproven/placeholder) persona is selected');
// spot-check: john-cason (evidence: eliminated) must never appear
ok(picks.every(function (p) { return p.ownerId !== 'john-cason'; }), 'the disproven John Cason is not researched');

/* ---- 4: per-persona spreads wider than the global top-N ---- */
var global3 = K.selectQuestions(g);
var globalOwners = {};
global3.forEach(function (q) { globalOwners[q.ownerId] = (globalOwners[q.ownerId] || 0) + 1; });
var globalDistinct = Object.keys(globalOwners).length;
ok(uniq.length >= globalDistinct, 'per-persona covers at least as many distinct personas as global (' + uniq.length + ' >= ' + globalDistinct + ')');

/* ---- summary ---- */
if (failures.length) { console.error('keeper per-persona selftest: ' + failures.length + ' failure(s).'); process.exit(1); }
console.log('keeper per-persona selftest OK: one horizon-bounded question per persona (' + owners.join(', ') + '), blocked personas skipped, cap respected.');
process.exit(0);
