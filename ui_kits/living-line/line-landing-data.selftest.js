/* Selftest for line-landing-data.js — validates the CASON_LINE build
   against the verified record. Run: node ui_kits/living-line/line-landing-data.selftest.js */
'use strict';

global.window = global;
var root = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
require('./personas.js');
var api = require('./line-landing-data.js');

var line = api.buildLine(root.CASON_DATA, root.CASON_MEMORY, root.CASON_PERSONAS);
var fails = 0;
function ok(cond, msg) { if (!cond) { console.error('  FAIL: ' + msg); fails++; } }

// shape
ok(Array.isArray(line.gens) && line.gens.length >= 10, 'has >=10 generations, got ' + line.gens.length);
ok(line.start <= 1610, 'start year near the crossing, got ' + line.start);
ok(line.present === 2026, 'present is 2026');

// generations are ordered and roman-numbered
var g1 = line.gens[0];
ok(g1.g === 1 && g1.roman === 'I', 'first gen is I');
ok(g1.title === 'The Crossing', 'gen I titled The Crossing, got ' + g1.title);
ok(g1.seat.indexOf('Virginia') !== -1, 'gen I seat mentions Virginia');

// gen 0 (alleged) and eliminated people are excluded
var allIds = [];
line.gens.forEach(function (g) { g.members.forEach(function (m) { allIds.push(m.id); }); });
ok(allIds.indexOf('john-cason') === -1, 'alleged gen-0 John Cason excluded');
ok(allIds.indexOf('cannon-sr') === -1, 'eliminated cannon-sr excluded');

// a well-documented direct ancestor maps faithfully
function find(id) {
  var hit = null;
  line.gens.forEach(function (g) { g.members.forEach(function (m) { if (m.id === id) hit = m; }); });
  return hit;
}
var thomas = find('thomas-sr');
ok(thomas && thomas.b === 1604 && thomas.d === 1651, 'thomas-sr years 1604-1651');
ok(thomas && thomas.mem >= 10, 'thomas-sr has real memory count, got ' + (thomas && thomas.mem));
ok(thomas && thomas.st === 'live', 'thomas-sr is SPEAKING (live), got ' + (thomas && thomas.st));
ok(thomas && thomas.direct === true, 'thomas-sr flagged direct');

// a living member records
var robert = find('robert-sr');
ok(robert && robert.st === 'rec', 'living robert-sr is RECORDING (rec), got ' + (robert && robert.st));
ok(robert && robert.d === null, 'living robert-sr has no death year');

// every member has the fields the landing renders
var missing = 0;
line.gens.forEach(function (g) {
  g.members.forEach(function (m) {
    if (!m.id || !m.n || m.dates == null || m.st == null || m.mem == null || m.occ == null) missing++;
  });
});
ok(missing === 0, missing + ' members missing render fields');

// direct-line ancestor sorts first in its generation
line.gens.forEach(function (g) {
  var firstDirect = -1, firstNonDirect = -1;
  g.members.forEach(function (m, i) {
    if (m.direct && firstDirect === -1) firstDirect = i;
    if (!m.direct && firstNonDirect === -1) firstNonDirect = i;
  });
  if (firstDirect !== -1 && firstNonDirect !== -1) {
    ok(firstDirect < firstNonDirect, 'gen ' + g.roman + ': direct ancestor sorts before non-direct');
  }
});

var total = allIds.length;
console.log('members mapped:', total, '| generations:', line.gens.length,
  '| year span:', line.start + '-' + line.end);

if (fails) { console.error('line-landing-data selftest FAILED (' + fails + ')'); process.exit(1); }
console.log('line-landing-data selftest OK');
