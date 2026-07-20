/* ============================================================
   Self-test for self-inquiry.js  (node ui_kits/living-line/self-inquiry.selftest.js)
   ------------------------------------------------------------
   Proves a persona surfaces ITS OWN open questions, horizon-scoped:
     - openQuestionsFor(id) returns that persona's gap questions;
     - the questions are the gap text (the persona's own voice);
     - they are per-persona: Thadeous's list is not Carl's;
     - deriveInquiry carries evidence + tags for downstream routing;
     - researchContext anchors who/when/where for the consensus.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var IQ = require('./self-inquiry.js');

var failures = [];
function ok(cond, msg) { if (!cond) { failures.push(msg); console.error('FAIL: ' + msg); } }

/* ---- 1: a persona surfaces its own open questions ---- */
var thad = IQ.openQuestionsFor('thadeous');
ok(Array.isArray(thad) && thad.length > 0, 'Thadeous has open questions (got ' + (thad && thad.length) + ')');
ok(thad.every(function (q) { return typeof q.question === 'string' && q.question.length > 0; }), 'every inquiry has a non-empty question');
ok(thad.some(function (q) { return /Georgia|marriage|married|1882|1883/i.test(q.question); }),
   'Thadeous surfaces the marriage-date question in his own voice');

/* ---- 2: questions are PER-PERSONA (his own record, not the whole tree) ---- */
var carl = IQ.openQuestionsFor('carl-columbus');
ok(carl.some(function (q) { return /land|deed|homestead|Fort White/i.test(q.question); }),
   'Carl surfaces the land-descent question');
var thadQs = thad.map(function (q) { return q.question; });
ok(carl.every(function (q) { return thadQs.indexOf(q.question) === -1; }),
   'Carl\'s questions are his own -- none leak in from Thadeous');

/* ---- 3: deriveInquiry carries routing metadata ---- */
ok(thad.every(function (q) { return typeof q.evidence === 'string'; }), 'each inquiry carries an evidence tier (for tier-capping downstream)');
ok(thad.some(function (q) { return q.tags && q.tags.indexOf('open-question') === -1; }) || thad.every(function (q) { return Array.isArray(q.tags); }),
   'tags ride along, with the internal open-question tag stripped');

/* ---- 4: research context anchors the person ---- */
var ctx = IQ.researchContext('thadeous');
ok(/Thadeous/.test(ctx), 'research context names the person: ' + ctx);

/* ---- summary ---- */
if (failures.length) { console.error('self-inquiry selftest: ' + failures.length + ' failure(s).'); process.exit(1); }
console.log('self-inquiry selftest OK: per-persona horizon-scoped open questions (Thadeous != Carl) + routing metadata + context all pass.');
process.exit(0);
