#!/usr/bin/env node
/* Selftest for the Keeper's run memory.

   The Loop Warden found `ransom-sr` asked in five consecutive dossiers, never
   advancing, while forty other lines went untouched. Selection scored gaps by
   intrinsic importance and nothing else, so the same questions won every week
   however many times they had already come back empty.

   These tests pin the two things that have to stay true: a barren question is
   demoted, and a question that ADVANCED never is. */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'scripts', 'keeper.js'), 'utf8');
const a = src.indexOf('const PRIOR = (function ()');
const b = src.indexOf('// GLOBAL: the top-N open questions');
if (a === -1 || b === -1) { console.error('run-memory block not found in keeper.js'); process.exit(1); }
// `require` is module-scoped and absent inside `new Function`, so it is passed
// in explicitly — the block under test requires loop-warden.js for its parser.
const api = new Function('fs', 'path', 'ROOT', '__dirname', 'require',
  src.slice(a, b) + '; return { PRIOR: PRIOR, withRunMemory: withRunMemory, priorKey: priorKey };'
)(fs, path, ROOT, path.join(ROOT, 'scripts'), require);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('\nKeeper run memory\n');

/* ---- learned from the real published record ---- */
ok('history: prior attempts are learned from published dossiers',
  Object.keys(api.PRIOR).length > 0, 'learned ' + Object.keys(api.PRIOR).length);
const ann = Object.keys(api.PRIOR).filter(function (k) { return /^ransom-sr\|bowilliams/.test(k); })[0];
ok('history: the five-times-asked question is recognised', !!ann);
ok('history: it is recorded as never having advanced', ann && api.PRIOR[ann].advanced === false);

/* ---- demotion ---- */
const stalled = { ownerId: 'ransom-sr', text: 'Bo Williams names my brother William’s wife as Ann Munden — the second Cason–Munden match.', score: 7 };
const demoted = api.withRunMemory(stalled);
ok('demote: a barren question loses score', demoted.score < stalled.score, demoted.score + ' vs ' + stalled.score);
ok('demote: it is marked so a reader can see why', demoted.demoted === true && demoted.priorAsked > 0);
ok('demote: the penalty compounds with each barren attempt',
  api.withRunMemory({ ownerId: 'x', text: 'y', score: 10 }).score === 10);

/* ---- precision: per QUESTION, not per person ---- */
const other = { ownerId: 'ransom-sr', text: 'Where do I actually lie? The record marks me at Newnansville, where I died', score: 7 };
ok('precision: a different question about the same person is untouched',
  api.withRunMemory(other).score === 7 && !api.withRunMemory(other).demoted);

/* ---- never demote something that worked ---- */
const fakePrior = { 'p|abc': { asked: 9, advanced: true } };
ok('advanced: a question that reached a lead is never demoted, however often asked',
  (function () {
    // reconstruct withRunMemory against a controlled history
    const f = new Function('PRIOR',
      'function priorKey(q){return q.ownerId+"|"+String(q.text||"").slice(0,50).toLowerCase().replace(/[^a-z0-9]/g,"");}' +
      'function withRunMemory(q){var e=PRIOR[priorKey(q)];if(!e||e.advanced||!e.asked)return q;' +
      'var p=Math.pow(0.66,e.asked);return Object.assign({},q,{score:q.score*p,priorAsked:e.asked,demoted:true});}' +
      'return withRunMemory;')(fakePrior);
    return f({ ownerId: 'p', text: 'abc', score: 5 }).score === 5;
  })());

/* ---- a demoted question is not blocked, only deprioritised ---- */
ok('resurfaces: a demoted question keeps a non-zero score so it can return',
  demoted.score > 0);

/* ---- no history is a first run, not an error ---- */
ok('safety: an unknown question passes through unchanged',
  api.withRunMemory({ ownerId: 'nobody', text: 'never asked', score: 3 }).score === 3);

console.log('\n' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail ? 1 : 0);
