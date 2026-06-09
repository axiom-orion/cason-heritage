/* ============================================================
   The Living Line — Governance gate + trace self-test  (run under Node)
     node ui_kits/living-line/governance.selftest.js
   ------------------------------------------------------------
   Loads the REAL data.js + kinship.js + governance.js and asserts the
   pre-action gate and NDJSON trace are faithful to governed-agents:
     1. The three-tier gate: block > review > allow.
     2. The Keeper's tiers map to decisions (lead→needs_approval,
        myth/eliminated-kin→block, graph/open→allow).
     3. The demo's signature: editing a threshold flips a decision.
     4. The emitted trace is valid NDJSON in the TraceEvent schema.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = __dirname;
const ctx = { console: console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
ctx.window = ctx;
vm.createContext(ctx);
[path.join(dir, '..', 'family-tree-app', 'data.js'), path.join(dir, 'kinship.js'), path.join(dir, 'governance.js')]
  .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });

const GOV = ctx.CASON_GOVERNANCE;
const KIN = ctx.CASON_KINSHIP;
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('Governance gate + trace self-test\n');
if (!GOV || !KIN) { console.log('  ✗ modules did not initialize'); process.exit(1); }

const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
const eliminated = KIN.eliminatedKin();
const policy = GOV.buildKeeperPolicy({ bannedPattern: BANNED, eliminatedPatterns: eliminated, primaryThreshold: 1.0, consensusThreshold: 0.5 });

function modelProv(score) { return [{ sourceId: 'model:grok', snippet: 'a lead', score: score == null ? 0.5 : score }]; }

/* 1. tier → decision mapping */
const lead = { kind: 'write_record', payload: { personId: 'ransom-sr', evidence: 'leading', text: 'A Pitt Co. deed may name the father.' }, justification: 'corroborated by two models', provenance: modelProv(), consensus: { votes: [{ model: 'grok', kind: 'write_record' }, { model: 'gemini', kind: 'write_record' }], agreementRatio: 1.0, chosenKind: 'write_record' } };
ok("a clean corroborated lead → needs_approval (human merge gate)", GOV.evaluatePolicy(lead, policy).decision === 'needs_approval');

const myth = { kind: 'write_record', payload: { personId: 'thomas-sr', evidence: 'possible', text: 'The Digswell 1608 baptism names his father.' }, justification: 'one source', provenance: modelProv() };
ok("a quarantined myth (Digswell) → block", GOV.evaluatePolicy(myth, policy).decision === 'block');

const revival = { kind: 'write_record', payload: { personId: 'ransom-sr', evidence: 'leading', text: 'The father was Cannon Cason Sr. of Pitt County.' }, justification: 'two models', provenance: modelProv(), consensus: { votes: [{ model: 'grok', kind: 'write_record' }, { model: 'gemini', kind: 'write_record' }], agreementRatio: 1.0, chosenKind: 'write_record' } };
const revivalDecision = GOV.evaluatePolicy(revival, policy);
ok("reviving a ruled-out ancestor (Cannon Cason Sr.) → block", revivalDecision.decision === 'block');
ok("...and the violation names the no-eliminated-kin rule", revivalDecision.violations.some(function (v) { return v.rule === 'no-eliminated-kin'; }));

ok("affirming a graph edge (affirm_graph) → allow", GOV.evaluatePolicy({ kind: 'affirm_graph', payload: { personId: 'ransom-sr' }, justification: 'graph', provenance: [{ sourceId: 'graph:kinship', snippet: 'parents', score: 1.0 }] }, policy).decision === 'allow');
ok("leaving a line open (leave_open) → allow", GOV.evaluatePolicy({ kind: 'leave_open', payload: { personId: 'ransom-sr' }, justification: 'clean negative', provenance: [] }, policy).decision === 'allow');
ok("a record citing no source → block (require-provenance)", GOV.evaluatePolicy({ kind: 'write_record', payload: { personId: 'x', evidence: 'possible', text: 'unsourced' }, justification: '', provenance: [] }, policy).decision === 'block');

/* 2. the demo's signature: editing a threshold flips a decision */
const overclaim = { kind: 'write_record', payload: { personId: 'x', evidence: 'secondary', text: 'a secondary-tier claim' }, justification: 'one strong source', provenance: [{ sourceId: 's1', snippet: 'doc', score: 0.8 }] };
const strict = GOV.buildKeeperPolicy({ bannedPattern: BANNED, eliminatedPatterns: eliminated, primaryThreshold: 1.0 });
const loose = GOV.buildKeeperPolicy({ bannedPattern: BANNED, eliminatedPatterns: eliminated, primaryThreshold: 0.7 });
ok("secondary@0.8 is BLOCKED at primaryThreshold 1.0", GOV.evaluatePolicy(overclaim, strict).decision === 'block');
ok("...and FLIPS to needs_approval when the threshold drops to 0.7", GOV.evaluatePolicy(overclaim, loose).decision === 'needs_approval');

/* 3. consensus rule routes a split vote to a human */
const split = { kind: 'write_record', payload: { personId: 'x', evidence: 'possible', text: 'a contested lead' }, justification: 'split', provenance: modelProv(), consensus: { votes: [{ model: 'grok', kind: 'write_record' }, { model: 'gemini', kind: 'leave_open' }], agreementRatio: 0.4, chosenKind: 'write_record' } };
ok("a split model vote raises the require-model-consensus review", GOV.evaluatePolicy(split, policy).violations.some(function (v) { return v.rule === 'require-model-consensus'; }));

/* 4. the trace is valid NDJSON in the TraceEvent schema */
const trace = GOV.Trace('selftest run');
trace.runStarted();
trace.stepStarted('s1:researcher', 'researcher');
trace.stepCompleted('s1:researcher', 'researcher', 'retrieved', [{ sourceId: 'm', snippet: 'x', score: 0.5 }]);
trace.actionProposed('s1:reasoner', lead);
trace.gateDecision('s1:reasoner', GOV.evaluatePolicy(lead, policy));
trace.awaitingApproval('s1:reasoner', 'human merges');
trace.runCompleted();
const lines = trace.toNdjson().trim().split('\n');
let allParse = true, parsed = [];
lines.forEach(function (l) { try { parsed.push(JSON.parse(l)); } catch (e) { allParse = false; } });
ok("every trace line is valid JSON", allParse);
ok("trace opens with run_started and closes with run_completed", parsed.length > 2 && parsed[0].type === 'run_started' && parsed[parsed.length - 1].type === 'run_completed');
ok("trace carries a gate_decision event", parsed.some(function (e) { return e.type === 'gate_decision'; }));
ok("every event has a type and an ISO timestamp", parsed.every(function (e) { return e.type && /^\d{4}-\d\d-\d\dT/.test(e.at); }));

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
