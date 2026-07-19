/* Selftest for lineage-stats.js — validates the family numbers against the
   verified record. Run: node ui_kits/living-line/lineage-stats.selftest.js */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
var api = require('./lineage-stats.js');

var data = global.CASON_DATA;
var S = api.build(data);
var fails = 0;
function ok(cond, msg) { if (!cond) { console.error('  FAIL: ' + msg); fails++; } }

// shape
ok(S.totals.people >= 90, 'counts the full tree, got ' + S.totals.people);
ok(Array.isArray(S.byGen) && S.byGen.length >= 12, 'has per-generation rows, got ' + (S.byGen && S.byGen.length));

// descendants of Thomas Casson (the immigrant) span the whole tree
var thomas = S.descendants['thomas-sr'];
ok(thomas && thomas.total >= 60, 'Thomas Casson has many descendants, got ' + (thomas && thomas.total));
// descendants of Ransom Sr. are a strict subset, still substantial
var ransom = S.descendants['ransom-sr'];
ok(ransom && ransom.total >= 30, 'Ransom Sr. has many descendants, got ' + (ransom && ransom.total));
ok(ransom.total < thomas.total, 'Ransom descendants are a subset of Thomas descendants');

// descendant math is consistent: descendants grouped by depth sum to total
var depthSum = Object.keys(thomas.byDepth).reduce(function (a, k) { return a + thomas.byDepth[k].length; }, 0);
ok(depthSum === thomas.total, 'descendant depth buckets sum to total (' + depthSum + ' vs ' + thomas.total + ')');

// a known direct ancestor is counted as a parent and a grandparent-who-met
// Ransom Sr. (d.1853): son James Green (b.1800), grandson Lt. Ransom (b.1835)
// — both born before 1853, so Ransom Sr. met a grandchild.
function genRow(g) { return S.byGen.filter(function (r) { return r.gen === g; })[0]; }
ok(genRow(6) && genRow(6).parents >= 1, 'gen VI has parents');
ok(genRow(6) && genRow(6).grand.met >= 1, 'gen VI has a grandparent who met a grandchild (Ransom Sr.)');

// alive-by-year: two series, same length, spanning the tree; estimated >= known each year
var ky = S.aliveByYear.known, ey = S.aliveByYear.estimated;
ok(ky.length === ey.length && ky.length > 300, 'alive-by-year covers the span, got ' + ky.length);
ok(ky[0].year === S.start && ey[ky.length - 1].year === S.present, 'curve runs from start to present');
var everBad = false, peakEst = 0;
for (var i = 0; i < ky.length; i++) { if (ey[i].count < ky[i].count) everBad = true; if (ey[i].count > peakEst) peakEst = ey[i].count; }
ok(!everBad, 'estimated alive-count is never below the known count');
ok(peakEst >= 10, 'estimated family-alive curve peaks at a plausible size, got ' + peakEst);

// determinable denominators never exceed the count that has such descendants
S.byGen.forEach(function (r) {
  ok(r.grand.met <= r.grand.determinable, 'gen ' + r.roman + ': grand.met <= determinable');
  ok(r.grand.determinable <= r.grand.has, 'gen ' + r.roman + ': grand.determinable <= has');
  ok(r.parents <= r.total, 'gen ' + r.roman + ': parents <= total');
});

console.log('people:', S.totals.people, '| parents:', S.totals.parents, '| living:', S.totals.living,
  '| Thomas desc:', thomas.total, '| Ransom desc:', ransom.total,
  '| curve peak (est):', peakEst, 'at span', S.start + '-' + S.present);

if (fails) { console.error('lineage-stats selftest FAILED (' + fails + ')'); process.exit(1); }
console.log('lineage-stats selftest OK');
