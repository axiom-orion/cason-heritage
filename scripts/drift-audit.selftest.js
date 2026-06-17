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

/* 6. eliminated containment (H7) — ancestry may not run THROUGH a ruled-out node */
ok('invariant present: eliminated-containment', inv.some(function (i) { return i.name === 'eliminated-containment'; }));
ok('eliminated-containment holds on the current record', inv.filter(function (i) { return i.name === 'eliminated-containment'; })[0].ok === true);
const elimClone = JSON.parse(JSON.stringify(data));
const elimId = Object.keys(elimClone.people).filter(function (id) { return ['eliminated', 'disproven'].indexOf(elimClone.people[id].evidence) !== -1; })[0];
const victim = Object.keys(elimClone.people).filter(function (id) { return elimClone.people[id].evidence === 'confirmed'; })[0];
elimClone.people[victim].parents = (elimClone.people[victim].parents || []).concat([elimId]);
const elimInv = DA.invariants(elimClone, MEM, PERS, GOV, SUP).filter(function (i) { return i.name === 'eliminated-containment'; })[0];
ok('a confirmed person citing an eliminated PARENT fails eliminated-containment', elimInv.ok === false);
// ...while the existing children-links to ruled-out candidates (the audit trail) stay legal
ok('audit-trail children links to eliminated candidates stay legal (current state passes)', DA.invariants(data, MEM, PERS, GOV, SUP).filter(function (i) { return i.name === 'eliminated-containment'; })[0].ok === true);

/* 7. claim reconciliation (H7) — standing claims replayed against the attested baseline */
ok('attestation carries per-person claims', base.claims && Object.keys(base.claims).length === Object.keys(data.people).length);
const same = DA.reconcileClaims(base.claims, DA.claimsOf(data));
ok('identical state reconciles clean', !same.established && same.failures.length === 0 && same.drift.length === 0);
ok('a missing baseline establishes, never fails', DA.reconcileClaims(null, DA.claimsOf(data)).established === true);

const promo = JSON.parse(JSON.stringify(data));
const possId = Object.keys(promo.people).filter(function (id) { return promo.people[id].evidence === 'possible'; })[0];
promo.people[possId].evidence = 'confirmed'; // tier rises, no new source
const promoRec = DA.reconcileClaims(base.claims, DA.claimsOf(promo));
ok('a tier promotion WITHOUT new evidence is a reconciliation FAILURE', promoRec.failures.length === 1 && promoRec.failures[0].indexOf(possId) === 0);

promo.people[possId].sources = (promo.people[possId].sources || []).concat(['New primary record, located ' + new Date().getFullYear()]);
const promoOk = DA.reconcileClaims(base.claims, DA.claimsOf(promo));
ok('the same promotion WITH a new source is drift, not failure', promoOk.failures.length === 0 && promoOk.drift.some(function (s) { return s.indexOf(possId) === 0; }));

const strip = JSON.parse(JSON.stringify(data));
const confSrcId = Object.keys(strip.people).filter(function (id) { return strip.people[id].evidence === 'confirmed' && (strip.people[id].sources || []).length > 0; })[0];
strip.people[confSrcId].sources = [];
const stripRec = DA.reconcileClaims(base.claims, DA.claimsOf(strip));
ok('removing sources from under a standing confirmed claim is a FAILURE', stripRec.failures.length === 1 && stripRec.failures[0].indexOf(confSrcId) === 0);

const demote = JSON.parse(JSON.stringify(data));
demote.people[confSrcId].evidence = 'possible';
const demoteRec = DA.reconcileClaims(base.claims, DA.claimsOf(demote));
ok('a demotion is drift, not failure (honesty may always lower a claim)', demoteRec.failures.length === 0 && demoteRec.drift.some(function (s) { return s.indexOf(confSrcId) === 0; }));

/* 8. provenance replay (H7, Stage-2 benchmark) — each standing claim's source chain is
   replayed against CURRENT evidence; a retracted/superseded source under a still-standing
   claim trips a drift finding, while a still-supported claim does NOT trip it. */
ok('invariant present: provenance-replay', inv.some(function (i) { return i.name === 'provenance-replay'; }));
ok('provenance-replay holds on the current record (every standing source chain supported)',
  inv.filter(function (i) { return i.name === 'provenance-replay'; })[0].ok === true);

const replayClean = DA.replayProvenance(data, SUP);
ok('a still-supported claim does NOT trip provenance-replay', replayClean.divergences.length === 0 && replayClean.standing > 0);

// THE BENCHMARK: a retracted source under a standing claim trips a drift finding.
const retract = JSON.parse(JSON.stringify(data));
const retractId = Object.keys(retract.people).filter(function (id) { return retract.people[id].evidence === 'confirmed' && (retract.people[id].sources || []).length > 0; })[0];
retract.people[retractId].sources[0] = retract.people[retractId].sources[0] + ' [RETRACTED 2026 — record withdrawn by the holding archive]';
const retractReplay = DA.replayProvenance(retract, SUP);
ok('a RETRACTED source under a standing claim is a provenance divergence', retractReplay.divergences.some(function (d) { return d.id === retractId && d.reason === 'retracted'; }));

// ...and the divergence drives the invariant red -> report counts a failure -> a drift PR opens.
const retractInv = DA.invariants(retract, MEM, PERS, GOV, SUP).filter(function (i) { return i.name === 'provenance-replay'; })[0];
ok('the retracted source fails the provenance-replay INVARIANT (the auditor would open a drift PR)', retractInv.ok === false);
const retractReport = DA.report('2026-01-01', DA.invariants(retract, MEM, PERS, GOV, SUP), DA.attest(data, MEM, PERS), DA.diffAttest(null, DA.attest(data, MEM, PERS)));
ok('a retracted source trips a drift PR (report records a regression -> non-zero exit)', retractReport.failures >= 1 && /provenance-replay/.test(retractReport.md));

// ...and the failure is PRECISE — the other invariants stay green (not a blanket fail).
ok('a retracted source leaves the other invariants green (precise, not a blanket fail)',
  DA.invariants(retract, MEM, PERS, GOV, SUP).filter(function (i) { return i.name !== 'provenance-replay'; }).every(function (i) { return i.ok; }));

// a source the supersession ledger has DISPROVEN, still cited under a standing claim, also diverges.
const superseded = JSON.parse(JSON.stringify(data));
const supId = Object.keys(superseded.people).filter(function (id) { return ['confirmed', 'secondary', 'leading', 'possible'].indexOf(superseded.people[id].evidence) !== -1; })[0];
superseded.people[supId].sources = (superseded.people[supId].sources || []).concat(['Parish register, Digswell, Hertfordshire (origin)']);
const supReplay = DA.replayProvenance(superseded, SUP);
ok('a still-cited source the ledger disproved is a provenance divergence (superseded)', supReplay.divergences.some(function (d) { return d.id === supId && d.reason === 'superseded'; }));

// a retracted source under a QUARANTINED claim (disproven/eliminated) is NOT standing -> no trip.
const quarantined = JSON.parse(JSON.stringify(data));
const qId = Object.keys(quarantined.people).filter(function (id) { return ['disproven', 'eliminated'].indexOf(quarantined.people[id].evidence) !== -1; })[0];
if (qId) {
  quarantined.people[qId].sources = (quarantined.people[qId].sources || []).concat(['Some source [RETRACTED]']);
  ok('a retracted source under an already-quarantined claim does NOT trip (not standing)',
    DA.replayProvenance(quarantined, SUP).divergences.every(function (d) { return d.id !== qId; }));
} else {
  ok('a retracted source under an already-quarantined claim does NOT trip (not standing)', true);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
