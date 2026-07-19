/* Selftest for confidence.js — the stamp derivation is honest (never
   overclaims) and assembles a person's asides from the record.
   Run: node ui_kits/living-line/confidence.selftest.js */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var C = require('./confidence.js');

var fails = 0;
function ok(cond, msg) { if (!cond) { console.error('  FAIL: ' + msg); fails++; } }

// derivation: the frame follows the evidence, never above it
ok(C.stampFor('confirmed').key === 'documented', 'confirmed -> ON THE RECORD');
ok(C.stampFor('possible').key === 'reasoned', 'possible -> REASONED (told, but not concrete)');
ok(/not proven/.test(C.stampFor('possible').gloss), 'REASONED gloss is straight about no concrete proof');
ok(C.stampFor('unsolved').key === 'open' && /never be settled/.test(C.stampFor('unsolved').gloss), 'unsolved -> OPEN QUESTION, may never settle');
ok(C.stampFor('eliminated').key === 'ruledout', 'eliminated -> RULED OUT');
ok(C.stampFor(undefined).key === 'noted', 'ungraded -> NOTED (not a false badge)');

// a family tradition can NEVER wear a documented stamp
ok(C.stampFor('possible').tone !== 'strong', 'a "possible" claim is never stamped strong');
ok(C.stampFor('confirmed').tone === 'strong' && C.stampFor('possible').tone === 'soft', 'tone separates proven from plausible');
ok(C.rank(C.stampFor('confirmed')) < C.rank(C.stampFor('possible')), 'documented ranks before reasoned');

// asides assembled from a real person: Casey Ann carries the Berrien patent
// (a source) + her parentage note + the endogamy open line (a gap).
var data = global.CASON_DATA, mem = global.CASON_MEMORY;
var casey = C.asidesForPerson(data.people['casey-ann'], mem);
ok(casey.length >= 2, 'Casey Ann has asides assembled, got ' + casey.length);
ok(casey.some(function (a) { return a.kind === 'source' && /MW-0392-213/.test(a.text); }), 'her Berrien-patent source is an aside');
ok(casey.some(function (a) { return a.kind === 'open' && a.stamp.key === 'open'; }), 'her endogamy open-line is stamped OPEN QUESTION');

// a confirmed direct ancestor: sources read ON THE RECORD
var thomas = C.asidesForPerson(data.people['thomas-sr'], mem);
ok(thomas.some(function (a) { return a.kind === 'source' && a.stamp.tone === 'strong'; }), 'Thomas Casson primary sources stamp strong');

console.log('stamps:', Object.keys(C.STAMPS).length, '| Casey Ann asides:', casey.length, '| Thomas asides:', thomas.length);
if (fails) { console.error('confidence selftest FAILED (' + fails + ')'); process.exit(1); }
console.log('confidence selftest OK');
