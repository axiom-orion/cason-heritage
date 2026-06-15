/* ============================================================
   Gate-contract conformance  (run under Node)
     node ui_kits/living-line/gate-contract.selftest.js
   ------------------------------------------------------------
   cason's governance.js is a faithful, dependency-free PORT of governed-agents'
   lib/governance.ts. "Faithful" is worthless unless it is checked — so this verifies
   the port against the shared contract fixture (contract/gate-contract.json, owned by
   governed-agents): the decision algebra (block > review > allow), the default severity,
   the result shape, and the TraceEvent wire format. The domain RULES legitimately differ
   between repos and are NOT under test — only the contract both must honor.

   If cason's gate ever changes precedence, renames a decision, drops a decision field, or
   emits an off-contract event type, this fails — and CI catches the drift.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const path = require('path');
const GOV = require('./governance.js');
const CONTRACT = require(path.join(__dirname, '..', '..', 'contract', 'gate-contract.json'));

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('Gate-contract conformance (cason governance.js ↔ governed-agents contract)\n');

// A synthetic rule that emits a violation of a given severity ('default' = omit severity).
function ruleEmitting(severity) {
  return {
    name: 'synthetic-' + severity,
    evaluate: function () {
      const v = { rule: 'synthetic', detail: 'contract probe' };
      if (severity !== 'default') v.severity = severity;
      return v;
    },
  };
}
const cleanAction = { kind: 'write_record', payload: { text: 'x' }, justification: 'probe', provenance: [{ sourceId: 's', snippet: 'x', score: 1 }] };

/* 1. the decision algebra — block > review > allow, default severity = block */
CONTRACT.decisionAlgebra.forEach(function (c) {
  const rules = c.severities.map(ruleEmitting);
  const d = GOV.evaluatePolicy(cleanAction, rules);
  ok('algebra: ' + c.name + ' -> ' + c.decision, d.decision === c.decision);
});

/* 2. the result shape carries every contract field */
const sample = GOV.evaluatePolicy(cleanAction, [ruleEmitting('review')]);
CONTRACT.decisionFields.forEach(function (f) {
  ok('decision carries field: ' + f, Object.prototype.hasOwnProperty.call(sample, f));
});
ok('decision is one of the contract decisions', CONTRACT.decisions.indexOf(sample.decision) !== -1);
ok('violations is an array', Array.isArray(sample.violations));
ok('evaluatedAt is an ISO-8601 string', typeof sample.evaluatedAt === 'string' && /^\d{4}-\d\d-\d\dT/.test(sample.evaluatedAt));

/* 3. default-severity invariant stated explicitly */
ok('defaultSeverity is block (a violation without severity blocks)',
  CONTRACT.defaultSeverity === 'block' && GOV.evaluatePolicy(cleanAction, [ruleEmitting('default')]).decision === 'block');

/* 4. the TraceEvent wire format — every emitted type is on-contract */
const t = GOV.Trace('conformance');
t.runStarted();
t.actionProposed('s1', cleanAction);
t.gateDecision('s1', GOV.evaluatePolicy(cleanAction, [ruleEmitting('block')]));
t.executed('s1', 'done');
t.awaitingApproval('s1', 'reason');
t.halted('s1', 'reason');
t.runCompleted();
const events = t.events();
const allowed = new Set(CONTRACT.traceEventTypes);
ok('every emitted event type is on-contract', events.every(function (e) { return allowed.has(e.type); }));
ok('first event is run_started, last is run_completed', events[0].type === 'run_started' && events[events.length - 1].type === 'run_completed');
const gd = events.filter(function (e) { return e.type === 'gate_decision'; })[0];
ok('gate_decision carries a decision with the contract fields', !!gd && CONTRACT.decisionFields.every(function (f) { return Object.prototype.hasOwnProperty.call(gd.decision, f); }));
ok('toNdjson emits one valid JSON object per line', (function () {
  const lines = t.toNdjson().trim().split('\n');
  try { return lines.every(function (l) { return !!JSON.parse(l).type; }); } catch (e) { return false; }
})());

/* 5. the contract names governed-agents as canonical (no silent drift of ownership) */
ok('contract names governed-agents as the source of record', /governed-agents/.test(CONTRACT.source));

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
