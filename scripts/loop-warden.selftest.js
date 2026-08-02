#!/usr/bin/env node
/* Selftest for the Loop Warden.

   The failure mode to guard against is a warden that reports all-clear on a
   loop that is not moving — so the tests are mostly "does it fire when it
   should", and equally "does it stay quiet when the loop IS advancing". */
'use strict';

const path = require('path');
const fs = require('fs');
const W = require(path.join(__dirname, 'loop-warden.js'));

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}
const run = function (date, corr, items) {
  return { file: 'keeper-' + date + '.md', date: date, questions: items.length, graphResolved: 0, corroborated: corr, items: items };
};
const item = function (id, tier) { return { id: id, tier: tier, question: 'q' }; };

console.log('\nThe Loop Warden\n');

/* ---- STALLED ---- */
const stalled = W.findStalled([
  run('2026-01-01', 0, [item('a', 'unsolved')]),
  run('2026-01-08', 0, [item('a', 'unsolved')]),
  run('2026-01-15', 0, [item('a', 'possible')]),
]);
ok('stalled: a question asked 3x without advancing is caught', stalled.length === 1);
ok('stalled: the question id is named', stalled.length && stalled[0].id === 'a');
ok('stalled: the tier history is shown so the judgement is checkable',
  stalled.length && stalled[0].tiers.join(',') === 'unsolved,unsolved,possible');
ok('stalled: it suggests reframing or parking, not just re-running',
  stalled.length && /re-framing|parked/.test(stalled[0].detail));

ok('stalled: a question that REACHED `leading` is not stalled',
  W.findStalled([
    run('2026-01-01', 0, [item('a', 'unsolved')]),
    run('2026-01-08', 0, [item('a', 'unsolved')]),
    run('2026-01-15', 1, [item('a', 'leading')]),
  ]).length === 0);
ok('stalled: below the run threshold stays quiet',
  W.findStalled([run('2026-01-01', 0, [item('a', 'unsolved')]), run('2026-01-08', 0, [item('a', 'unsolved')])]).length === 0);
ok('stalled: a `confirmed` answer counts as advancing',
  W.findStalled([
    run('2026-01-01', 0, [item('b', 'unsolved')]), run('2026-01-08', 0, [item('b', 'unsolved')]),
    run('2026-01-15', 0, [item('b', 'confirmed')]),
  ]).length === 0);
ok('stalled: different questions are tracked independently',
  W.findStalled([
    run('2026-01-01', 0, [item('a', 'unsolved'), item('b', 'unsolved')]),
    run('2026-01-08', 0, [item('a', 'unsolved'), item('b', 'unsolved')]),
    run('2026-01-15', 0, [item('a', 'unsolved'), item('b', 'leading')]),
  ]).map(function (f) { return f.id; }).join(',') === 'a');

/* ---- BARREN ---- */
ok('barren: three empty runs in a row is caught',
  W.findBarren([run('2026-01-01', 0, []), run('2026-01-08', 0, []), run('2026-01-15', 0, [])]).length === 1);
ok('barren: a single corroborated lead in the window clears it',
  W.findBarren([run('2026-01-01', 0, []), run('2026-01-08', 1, []), run('2026-01-15', 0, [])]).length === 0);
ok('barren: a graph-resolved answer also counts as productive',
  W.findBarren([
    run('2026-01-01', 0, []), Object.assign(run('2026-01-08', 0, []), { graphResolved: 1 }), run('2026-01-15', 0, []),
  ]).length === 0);
ok('barren: fewer runs than the window stays quiet',
  W.findBarren([run('2026-01-01', 0, []), run('2026-01-08', 0, [])]).length === 0);
ok('barren: only the most RECENT window counts — old success does not excuse a current drought',
  W.findBarren([
    run('2026-01-01', 5, []), run('2026-01-08', 0, []), run('2026-01-15', 0, []), run('2026-01-22', 0, []),
  ]).length === 1);

/* ---- SILENT ----
   findSilent reads the real output directories, so these assert against the
   actual estate rather than fixtures. `season` and `drift-audit` have never
   written a dossier; keeper, librarian and claim-audit have. */
const farFuture = W.findSilent([], '2026-12-01').map(function (f) { return f.agent; });
ok('silent: an agent that never ran is not "silent" — it never started',
  farFuture.indexOf('season') === -1 && farFuture.indexOf('drift-audit') === -1);
ok('silent: an agent that HAS run and then stopped is flagged',
  farFuture.indexOf('keeper') !== -1, 'flagged: ' + farFuture.join(', '));
ok('silent: an agent inside its cadence is quiet',
  W.findSilent([], '2026-07-29').length === 0);
ok('silent: cadences are declared per agent',
  W.CADENCE_DAYS.keeper === 7 && W.CADENCE_DAYS.librarian === 30);

/* ---- PARKED ---- */
ok('parked: a small number of dossiers is not a backlog',
  W.findParked([run('2026-01-01', 0, []), run('2026-01-08', 0, [])], '2026-01-09').length === 0);
ok('parked: an accumulation is flagged',
  W.findParked([run('2026-01-01', 0, []), run('2026-01-08', 0, []), run('2026-01-15', 0, [])], '2026-01-16').length === 1);

/* ---- rendering ---- */
const md = W.render(stalled.concat(W.findBarren([run('2026-01-01', 0, []), run('2026-01-08', 0, []), run('2026-01-15', 0, [])])), [run('2026-01-01', 0, [])], '2026-01-16');
ok('render: findings are grouped under readable headings', /Questions being re-asked without progress/.test(md));
ok('render: the propose-never-publish limit is stated', /cannot change a schedule/.test(md));
ok('render: a clean sweep says so plainly', /Nothing to report/.test(W.render([], [run('2026-01-01', 0, [])], '2026-01-16')));
ok('render: a missing check is reported as a gap, never as an all-clear',
  /gap in this sweep|not an all-clear/i.test(W.render([{ kind: 'NOTE', detail: 'PR backlog not checked — no GITHUB_TOKEN. This is a gap in the sweep, not an all-clear.' }], [], '2026-01-16')));

/* ---- parsing the real dossiers ---- */
const real = path.join(__dirname, '..', 'research', 'proposals');
const files = fs.existsSync(real) ? fs.readdirSync(real).filter(function (f) { return /^keeper-\d{4}-\d{2}-\d{2}\.md$/.test(f); }) : [];
ok('parse: real dossiers are present to parse', files.length > 0);
if (files.length) {
  const parsed = W.parseKeeper(files[0]);
  ok('parse: the header counts are read', typeof parsed.questions === 'number' && typeof parsed.corroborated === 'number');
  ok('parse: open-line ids and their verdicts are paired',
    parsed.items.length > 0 && parsed.items.every(function (i) { return i.id && i.tier; }));
  // the regression this agent exists for
  const all = files.map(W.parseKeeper);
  const hits = W.findStalled(all).map(function (f) { return f.id; });
  ok('regression: `ransom-sr` is caught as stalled on the real record',
    hits.indexOf('ransom-sr') !== -1, 'caught: ' + hits.join(', '));
  ok('regression: the real record shows a barren window', W.findBarren(all).length === 1);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail ? 1 : 0);
