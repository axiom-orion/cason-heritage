/* ============================================================
   Acceptance test — the Cason↔Causey refusal  (run under Node)
     node tests/cason-causey-refusal.test.js
   ------------------------------------------------------------
   THE acceptance test for the governor: a Y-DNA haplogroup exclusion is a
   near-objective "this merge is wrong", and the gate must refuse it — and
   record the refusal to the audit trail (one provable, replayable artifact
   that is the demo and the acceptance test in one).

   Primary test level: Unit/API (the policy gate is a pure function; no UI),
   matching the repo's `selftest:*` family. E2E / component / data-testid /
   network-first are N/A — there is no browser surface under test.

   Given-When-Then, one assertion per check, deterministic, isolated.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = path.join(__dirname, '..', 'ui_kits', 'living-line');
const ctx = { console: console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
ctx.window = ctx;
vm.createContext(ctx);
[path.join(dir, '..', 'family-tree-app', 'data.js'), path.join(dir, 'kinship.js'), path.join(dir, 'dna-exclusions.js'), path.join(dir, 'governance.js')]
  .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });

const GOV = ctx.CASON_GOVERNANCE;
const KIN = ctx.CASON_KINSHIP;
const DNA = ctx.CASON_DNA_EXCLUSIONS;
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('Acceptance — the Cason↔Causey refusal\n');
if (!GOV || !KIN || !DNA) { console.log('  ✗ modules did not initialize'); process.exit(1); }

const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
const policy = GOV.buildKeeperPolicy({ bannedPattern: BANNED, eliminatedPatterns: KIN.eliminatedKin(), dnaExclusions: DNA.exclusions, primaryThreshold: 1.0, consensusThreshold: 0.5 });

/* GIVEN the documented Cason↔Causey Y-DNA exclusion ... */
ok("the exclusion is recorded and order-independent (Causey↔Cason)", !!DNA.excludes('Causey', 'Cason') && !!DNA.excludes('cason', 'causey'));

/* WHEN a record proposes a direct paternal link across that exclusion ... */
const merge = {
  kind: 'merge_persons',
  payload: { surnames: ['Cason', 'Causey'], claim: 'patriline', text: 'A derivative tree merges the Causey line into the Cason patriline as one male line.' },
  justification: 'an online tree shows them as the same family',
  provenance: [{ sourceId: 'tree:wikitree', snippet: 'merged tree', score: 0.4 }],
};
const decision = GOV.evaluatePolicy(merge, policy);

/* THEN the gate blocks it, and names the haplogroup rule. */
ok("a Cason↔Causey paternal merge is BLOCKED", decision.decision === 'block');
ok("...the blocking violation is `no-haplogroup-conflict`", decision.violations.some(function (v) { return v.rule === 'no-haplogroup-conflict'; }));
ok("...the violation is hard (severity block, not review)", decision.violations.filter(function (v) { return v.rule === 'no-haplogroup-conflict'; }).every(function (v) { return (v.severity || 'block') === 'block'; }));

/* AND the refusal is recorded to the audit trail (the replayable artifact). */
const trace = GOV.Trace('Cason↔Causey acceptance');
trace.runStarted();
trace.actionProposed('s1', merge);
trace.gateDecision('s1', decision);
trace.halted('s1', GOV.reasonOf(decision));
trace.runCompleted();
const ndjson = trace.toNdjson();
const halted = ndjson.trim().split('\n').map(function (l) { return JSON.parse(l); }).filter(function (e) { return e.type === 'halted'; })[0];
ok("the trace records a `halted` refusal event", !!halted);
ok("...whose reason names the haplogroup exclusion and the Causey line", !!halted && /no-haplogroup-conflict/.test(halted.reason) && /caus/i.test(halted.reason));

/* NEGATIVE CONTROL — the rule is precise, not a blunt surname filter. */
const withinCason = { kind: 'merge_persons', payload: { surnames: ['Cason', 'Cason'], claim: 'patriline', text: 'merge two Cason records that are the same man' }, justification: 'duplicate', provenance: [{ sourceId: 's', snippet: 'x', score: 0.5 }] };
ok("merging two Cason records is NOT haplogroup-blocked", !GOV.evaluatePolicy(withinCason, policy).violations.some(function (v) { return v.rule === 'no-haplogroup-conflict'; }));

const benign = { kind: 'write_record', payload: { personId: 'ransom-sr', evidence: 'possible', text: 'A neighbor named Causey witnessed the 1823 deed.' }, justification: 'a record mentions a Causey neighbor', provenance: [{ sourceId: 'deed', snippet: 'x', score: 0.5 }] };
ok("merely mentioning a Causey neighbor (no patriline claim) is NOT haplogroup-blocked", !GOV.evaluatePolicy(benign, policy).violations.some(function (v) { return v.rule === 'no-haplogroup-conflict'; }));

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
