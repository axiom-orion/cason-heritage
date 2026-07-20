/* ============================================================
   Self-test for interview.js  (node ui_kits/living-line/interview.selftest.js)
   ------------------------------------------------------------
   Proves the interview is genuinely AGE-BOUNDED:
     - frameFor computes age = year - birth, and reports known vs sealed;
     - questionsFor is grounded in the horizon: a 1962 photograph is NOT a
       suggested question for a 1961 Carl, but IS for a 1963 Carl;
     - the standard life questions are always present;
     - a transcript round-trips to text.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var DOCS = require('./persona-documents.js');
var IV = require('./interview.js');

var people = global.CASON_DATA.people;
var MEM = global.CASON_MEMORY;
var failures = [];
function ok(cond, msg) { if (!cond) { failures.push(msg); console.error('FAIL: ' + msg); } }

/* seed a dated, person-attached photo (the doc-awareness pipeline) */
DOCS.ingestInto(MEM, [{ personId: 'carl-columbus', kind: 'photo', date: '1962', title: 'Carl and the children', id: 'iv1' }], people);

/* ---- 1: frame age math ---- */
var f1940 = IV.frameFor('carl-columbus', 1940);
ok(f1940 != null, 'frameFor returns a frame');
ok(f1940.year === 1940, 'frame year is the simNow (got ' + (f1940 && f1940.year) + ')');
ok(f1940.age === 1940 - f1940.birth, 'age = year - birth (got ' + (f1940 && f1940.age) + ')');
ok(typeof f1940.known === 'number' && typeof f1940.sealed === 'number', 'frame reports known + sealed counts');

/* a year outside the lifespan is flagged not-alive (no interview) */
var fDead = IV.frameFor('carl-columbus', 1850); // before Carl was born
ok(fDead && fDead.alive === false, 'a year before birth is flagged not-alive');

/* ---- 2: questionsFor is horizon-bounded ---- */
function hasPhotoQ(qs) { return qs.some(function (x) { return x.kind === 'document' && /children/i.test(x.basis || ''); }); }
var q1961 = IV.questionsFor('carl-columbus', 1961); // photo not taken yet
var q1963 = IV.questionsFor('carl-columbus', 1963); // photo exists
ok(!hasPhotoQ(q1961), 'BEFORE 1962 the photo is NOT a suggested question (horizon holds)');
ok(hasPhotoQ(q1963), 'AFTER 1962 the photo IS a suggested question (self-discovery)');

/* ---- 3: standard life questions are always present ---- */
ok(q1961.some(function (x) { return x.kind === 'life'; }), 'life questions are always offered');
ok(q1963.length <= 10, 'the suggestion set is capped (<=10)');

/* ---- 4: transcript -> text ---- */
var txt = IV.toText('carl-columbus', [{ role: 'q', text: 'Tell me about your life.', year: 1963 }, { role: 'a', text: 'Carl speaking.' }]);
ok(/Interview -- Carl/.test(txt) && /Q \(1963\): Tell me/.test(txt) && /A: Carl speaking\./.test(txt), 'transcript renders to readable text');

/* ---- summary ---- */
if (failures.length) { console.error('interview selftest: ' + failures.length + ' failure(s).'); process.exit(1); }
console.log('interview selftest OK: frame age math + horizon-bounded questions (1961 hides / 1963 shows the 1962 photo) + transcript all pass.');
process.exit(0);
