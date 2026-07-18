/* Selftest for tiers.js — the gate math and the guardrail scan.
   Run: node ui_kits/living-line/tiers.selftest.js */
'use strict';

global.window = global;
global.localStorage = (function () { var m = {}; return { getItem: function (k) { return m[k] || null; }, setItem: function (k, v) { m[k] = v; }, removeItem: function (k) { delete m[k]; } }; })();
var T = require('./tiers.js');

var fails = 0;
function ok(cond, msg) { if (!cond) { console.error('  FAIL: ' + msg); fails++; } }

// ordering
ok(T.level('outsider') === 0 && T.level('outer') === 1 && T.level('known') === 2, 'tiers are ordinal 0/1/2');
ok(T.TIERS.length === 3, 'three tiers');

// the gate: a viewer sees their tier and everything more public; never deeper
ok(T.canSee('outsider', 'outsider'), 'outsider sees public');
ok(!T.canSee('known', 'outsider'), 'outsider does NOT see known-family content');
ok(!T.canSee('outer', 'outsider'), 'outsider does NOT see outer-family content');
ok(T.canSee('outer', 'known'), 'known family sees outer content (dials down)');
ok(T.canSee('known', 'known'), 'known family sees known content');
ok(!T.canSee('known', 'outer'), 'outer family does NOT see the innermost tier');

// default + set/read viewer
ok(T.viewer() === 'outsider', 'default viewer is outsider, got ' + T.viewer());
T.setViewer('known'); ok(T.viewer() === 'known', 'setViewer persists');
T.setViewer('nonsense'); ok(T.viewer() === 'known', 'invalid tier ignored');

// guardrail: harmful-if-leaked for a LIVING person; historical is allowed
ok(T.harmfulScan('lives at 123 Main Street', true).indexOf('street-address') !== -1, 'living address flagged');
ok(T.harmfulScan('the farmhouse on 1715 SW McClinton Rd', false).length === 0, 'a deceased/historical address is NOT flagged (allowed)');
ok(T.harmfulScan('call (386) 758-1342', true).indexOf('phone') !== -1, 'living phone flagged');
ok(T.harmfulScan('diagnosed with cancer', true).indexOf('health') !== -1, 'health detail flagged regardless');
ok(T.harmfulScan('email me at a@b.com').indexOf('email') !== -1, 'email flagged');
ok(T.harmfulScan('a tobacco planter in Lynnhaven Parish', true).length === 0, 'ordinary history is clean');

console.log('tiers:', T.TIERS.map(function (t) { return t.key; }).join('/'), '| guardrail kinds:', T.HARMFUL.length);
if (fails) { console.error('tiers selftest FAILED (' + fails + ')'); process.exit(1); }
console.log('tiers selftest OK');
