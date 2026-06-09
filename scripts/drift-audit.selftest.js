/* ============================================================
   Drift Auditor self-test  (run under Node)
     node scripts/drift-audit.selftest.js
   ------------------------------------------------------------
   Asserts the auditor is honest: it passes on the real (good) state, its
   attestation digest is deterministic, and it DETECTS an injected regression
   (a dangling kin reference) — so a real drift would fail CI / open an alert.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const DA = require('./drift-audit.js');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('Drift Auditor self-test\n');

const ctx = DA.load();
const data = ctx.CASON_DATA, MEM = ctx.CASON_MEMORY, PERS = ctx.CASON_PERSONAS, GOV = ctx.CASON_GOVERNANCE, SUP = ctx.CASON_SUPERSESSIONS;

/* 1. all invariants hold on the real, current state */
const inv = DA.invariants(data, MEM, PERS, GOV, SUP);
ok('all invariants hold on the current governed state', inv.every(function (i) { return i.ok; }));
['knowledge-horizon', 'referential-integrity', 'quarantine-containment', 'supervised-autonomy', 'supersession-grounding'].forEach(function (n) {
  ok('invariant present: ' + n, inv.some(function (i) { return i.name === n; }));
});

/* 2. the attestation digest is deterministic (same state -> same digest) */
const a1 = DA.attest(data, MEM, PERS), a2 = DA.attest(data, MEM, PERS);
ok('attestation digest is deterministic', a1.digest === a2.digest && /^att:[0-9a-f]{8}$/.test(a1.digest));
ok('attestation carries per-persona fingerprints', Object.keys(a1.personas).length > 0);

/* 3. an injected regression is DETECTED — a dangling kin reference */
const clone = JSON.parse(JSON.stringify(data));
const someId = Object.keys(clone.people)[0];
clone.people[someId].parents = (clone.people[someId].parents || []).concat(['ghost-nonexistent']);
const drifted = DA.invariants(clone, MEM, PERS, GOV, SUP);
const refCheck = drifted.filter(function (i) { return i.name === 'referential-integrity'; })[0];
ok('a dangling kin reference fails referential-integrity', !!refCheck && refCheck.ok === false);
ok('...and the other invariants still hold (precise, not a blanket fail)', drifted.filter(function (i) { return i.name !== 'referential-integrity'; }).every(function (i) { return i.ok; }));

/* 4. that mutation changes the attestation digest (drift is visible) */
ok('a changed governed state yields a different attestation digest', DA.attest(clone, MEM, PERS).digest !== a1.digest);

/* 5. diffAttest reports drift between two attestations */
const base = DA.attest(data, MEM, PERS);
const curB = DA.attest(clone, MEM, PERS);
const d = DA.diffAttest(base, curB);
ok('diffAttest flags a changed digest', d.changed === true);
ok('first run is reported as baseline (no false drift)', DA.diffAttest(null, base).firstRun === true);

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
