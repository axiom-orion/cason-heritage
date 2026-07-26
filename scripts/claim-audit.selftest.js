/* ============================================================
   Public Record Auditor self-test  (run under Node)
     node scripts/claim-audit.selftest.js
   ------------------------------------------------------------
   A gate that never refuses anything is decoration. These assert the
   REFUSALS: an internal claim leaking into a public artifact, a number
   with no receipt, an uncheckable claim resting on nothing, and a claim
   that no longer appears where the manifest swears it does.

   Plus the shipped manifest's own honesty: real files, real vocabulary,
   and the live record's counts.

   No network. Exit code 0 = all pass.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GOV = require(path.join(ROOT, 'ui_kits', 'living-line', 'governance.js'));
const CP = require(path.join(ROOT, 'ui_kits', 'living-line', 'claim-policy.js'));
const AUDIT = require(path.join(ROOT, 'scripts', 'claim-audit.js'));

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }
console.log('Public Record Auditor self-test\n');

const PUBLIC = ['resume.html', 'portfolio.html', 'README.md'];
const policy = CP.buildClaimPolicy({ publicArtifacts: PUBLIC, attestationMaxAgeDays: 180 });

function act(payload, check, kind) {
  return { kind: kind || 'publish_claim', payload: payload, check: check || { ok: true, checkable: true, method: 'test' }, provenance: [] };
}
function decide(payload, check, kind) { return GOV.evaluatePolicy(act(payload, check, kind), policy); }
function ruleFired(d, name) { return d.violations.some(function (v) { return v.rule === name; }); }

/* ---- the proprietary boundary: the load-bearing refusal ---- */
const leak = decide({ claimId: 'x', text: 'internal roadmap detail', visibility: 'internal', claimKind: 'narrative', appearsIn: ['resume.html'], missingFrom: [] });
ok('an `internal` claim published in a public artifact is BLOCKED', leak.decision === 'block' && ruleFired(leak, 'no-internal-in-public'));

const internalPrivate = decide({ claimId: 'x', text: 'internal detail', visibility: 'internal', claimKind: 'narrative', appearsIn: ['research/NOTES.md'], missingFrom: [] });
ok('the same `internal` claim in a NON-public file is allowed', internalPrivate.decision === 'allow');

/* ---- a number needs a receipt ---- */
const bareMetric = decide({ claimId: 'x', text: '~8ms p50', visibility: 'public', claimKind: 'metric', appearsIn: [], missingFrom: [] }, { checkable: false, method: 'unverified', ok: null });
ok('a metric with no machine-checkable source is BLOCKED', bareMetric.decision === 'block' && ruleFired(bareMetric, 'no-unsourced-metric'));

const basisMetric = decide({ claimId: 'x', text: '~8ms p50', visibility: 'public', claimKind: 'metric', basis: 'a prose explanation', appearsIn: [], missingFrom: [] }, { checkable: false, method: 'unverified', ok: null });
ok('a metric is STILL blocked even with a prose basis — prose is not a measurement', basisMetric.decision === 'block' && ruleFired(basisMetric, 'no-unsourced-metric'));

const attestedMetric = decide({ claimId: 'x', text: '1,000+ tests', visibility: 'public', claimKind: 'metric', appearsIn: [], missingFrom: [] }, { checkable: true, ok: true, method: 'attested', source: 'the suite run', asOf: new Date().toISOString().slice(0, 10) });
ok('a metric attested to a named, dated source is allowed', attestedMetric.decision === 'allow');

/* ---- an uncheckable claim must rest on something ---- */
const noBasis = decide({ claimId: 'x', text: 'a big claim', visibility: 'public', claimKind: 'narrative', appearsIn: [], missingFrom: [] }, { checkable: false, method: 'unverified', ok: null });
ok('an uncheckable claim with no stated basis is BLOCKED', noBasis.decision === 'block' && ruleFired(noBasis, 'require-claim-basis'));

const withBasis = decide({ claimId: 'x', text: 'a big claim', visibility: 'public', claimKind: 'narrative', basis: 'employment history 1998–present', appearsIn: [], missingFrom: [] }, { checkable: false, method: 'unverified', ok: null });
ok('the same claim with a stated basis is allowed', withBasis.decision === 'allow');

/* ---- the silent edit ---- */
const vanished = decide({ claimId: 'x', text: 'a claim', visibility: 'public', claimKind: 'narrative', basis: 'b', appearsIn: ['resume.html'], missingFrom: ['resume.html'] });
ok('a claim the manifest attests but the page no longer carries is BLOCKED', vanished.decision === 'block' && ruleFired(vanished, 'claim-must-appear'));

/* ---- the world moved: review, never auto-edit ---- */
const drifted = decide({ claimId: 'x', text: 'open', visibility: 'public', claimKind: 'status', appearsIn: [], missingFrom: [] }, { checkable: true, ok: true, method: 'github-issue-state', observed: 'closed', expected: 'open' });
ok('a value that drifted from its source routes to REVIEW', drifted.decision === 'needs_approval' && ruleFired(drifted, 'drifted-value-needs-review'));

const failed = decide({ claimId: 'x', text: 'a link', visibility: 'public', claimKind: 'link', appearsIn: [], missingFrom: [] }, { checkable: true, ok: false, method: 'http-ok', error: 'HTTP 404' });
ok('a failed check routes to REVIEW, not a silent pass', failed.decision === 'needs_approval' && ruleFired(failed, 'failed-check-needs-review'));

const skipped = decide({ claimId: 'x', text: 'a link', visibility: 'public', claimKind: 'link', appearsIn: [], missingFrom: [] }, { checkable: true, ok: null, method: 'http-ok', skipped: true });
ok('an unrun (offline) check is not counted as a pass or a failure', skipped.decision === 'allow' && !ruleFired(skipped, 'failed-check-needs-review'));

/* ---- an attestation expires ---- */
const stale = decide({ claimId: 'x', text: 'n', visibility: 'public', claimKind: 'metric', appearsIn: [], missingFrom: [] }, { checkable: true, ok: true, method: 'attested', source: 's', asOf: '2020-01-01' });
ok('an attestation older than the horizon routes to REVIEW', stale.decision === 'needs_approval' && ruleFired(stale, 'stale-attestation-needs-review'));

/* ---- propose, never publish ---- */
const posture = CP.autonomyPosture(policy);
ok('autonomy posture: supervised — no correction is ever auto-applied', posture.supervised === true && posture.topTier === 'unoccupied');

/* ---- the verifiers ---- */
const counts = AUDIT.recordCounts();
ok('record-count derives live counts from data.js', counts.people > 0 && counts.generations > 0 && counts.evidenceTiers > 0);

const found = AUDIT.presence({ text: 'evidence tiers', appearsIn: ['resume.html'] }, {});
ok('presence(): finds a claim that IS on the page', found.length === 0);
const absent = AUDIT.presence({ text: 'a string that is certainly not on this page ∅', appearsIn: ['resume.html'] }, {});
ok('presence(): reports a claim that is NOT on the page', absent.length === 1 && absent[0] === 'resume.html');

/* ---- the shipped manifest's own honesty ---- */
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'claims.json'), 'utf8'));
ok('manifest: claim ids are unique', new Set(manifest.claims.map(function (c) { return c.id; })).size === manifest.claims.length);
ok('manifest: every visibility is from the vocabulary', manifest.claims.every(function (c) { return CP.VISIBILITIES.indexOf(c.visibility) !== -1; }));
ok('manifest: every claimKind is from the vocabulary', manifest.claims.every(function (c) { return CP.KINDS.indexOf(c.claimKind) !== -1; }));
ok('manifest: every declared artifact exists on disk', manifest.claims.every(function (c) {
  return (c.appearsIn || []).every(function (f) { return fs.existsSync(path.join(ROOT, f)); });
}));
ok('manifest: every claim declares a verify method', manifest.claims.every(function (c) { return c.verify && c.verify.method; }));
ok('manifest: every claim actually appears where it says it does', manifest.claims.every(function (c) { return AUDIT.presence(c, {}).length === 0; }));
ok('manifest: the counts claimed match the live record', (function () {
  const byId = {};
  manifest.claims.forEach(function (c) { byId[c.id] = c; });
  return byId['heritage-people'].verify.expect === counts.people
    && byId['heritage-generations'].verify.expect === counts.generations
    && byId['heritage-tiers'].verify.expect === counts.evidenceTiers;
})());

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
