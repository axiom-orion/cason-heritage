/* ============================================================
   The Drift Auditor — the system watches itself over time
   ------------------------------------------------------------
   Runs under Node (GitHub Action cron or `npm run drift-audit`). It is the
   "self-aware over long horizons" layer: on a schedule it re-derives the
   governed state, re-runs the load-bearing INVARIANTS, computes a
   content-addressed ATTESTATION digest + per-persona FINGERPRINTS, and
   compares them to a committed baseline (research/attestation.json).

     • An invariant FAILURE (a horizon leak, a dangling kin ref, a disproven
       claim surfacing as fact, the gate losing its supervised posture, an
       ungrounded supersession) is a regression → exit 1, so CI / the cron
       opens an alert PR. These must never happen; the build also enforces them.
     • DRIFT (the digest or a persona fingerprint changed since the last
       attestation) is the record evolving — not a failure. It is reported and
       the baseline is refreshed, so there is an auditable trail of what changed.

   Propose, never publish: like the Keeper, it writes a report + refreshes the
   attestation and opens a PR for a human — it does not touch data.js.

   Flags:  --dry-run          print the audit, write nothing
           --update-baseline  (re)write research/attestation.json to current
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIVING = path.join(ROOT, 'ui_kits', 'living-line');
const BASELINE = path.join(ROOT, 'research', 'attestation.json');
const DRIFT_DIR = path.join(ROOT, 'research', 'drift');
const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;

function today() { return new Date().toISOString().slice(0, 10); }
function fnv(s) { let h = 0x811c9dc5; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; } return h.toString(16).padStart(8, '0'); }

/* ---- load the real modules in a browser-like vm (the selftest pattern) ---- */
function load() {
  const ctx = { console: console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  ctx.window = ctx;
  vm.createContext(ctx);
  ['../ui_kits/family-tree-app/data.js'];
  [path.join(LIVING, '..', 'family-tree-app', 'data.js'), path.join(LIVING, 'memory-graph.js'),
   path.join(LIVING, 'personas.js'), path.join(LIVING, 'kinship.js'),
   path.join(LIVING, 'supersessions.js'), path.join(LIVING, 'governance.js')]
    .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });
  return ctx;
}

/* ---- the invariant battery (the same load-bearing checks the build enforces) ---- */
// Pure over (data, MEM, PERS, GOV, SUP) so the self-test can feed it mutated state.
function invariants(data, MEM, PERS, GOV, SUP) {
  const people = data.people, ids = Object.keys(people);
  const out = [];

  // 1. knowledge-horizon: no persona sees a generation beyond N+1 or a year past its own.
  let leak = 0;
  ids.forEach(function (id) {
    const gen = people[id].generation, sub = MEM.access(id);
    ['individual', 'generational', 'family'].forEach(function (s) {
      (sub[s] || []).forEach(function (n) {
        if (n.generation != null && n.generation > gen + 1) leak++;
        if (n.year != null && sub.horizonYear != null && n.year > sub.horizonYear) leak++;
      });
    });
  });
  out.push({ name: 'knowledge-horizon', ok: leak === 0, detail: leak === 0 ? 'no persona sees beyond gen N+1 / its own year' : leak + ' horizon leak(s)' });

  // 2. referential integrity: every kin id resolves to a real person.
  let dangling = 0;
  ids.forEach(function (id) {
    ['parents', 'children', 'spouse', 'siblings'].forEach(function (rel) {
      (people[id][rel] || []).forEach(function (rid) { if (!people[rid]) dangling++; });
    });
  });
  out.push({ name: 'referential-integrity', ok: dangling === 0, detail: dangling === 0 ? 'every kin id resolves' : dangling + ' dangling kin reference(s)' });

  // 3. quarantine containment: no disproven myth surfaces as fact.
  let qleak = 0;
  (MEM.nodes || []).forEach(function (n) {
    if (BANNED.test(n.text || '') && ['confirmed', 'secondary', 'leading'].indexOf(n.evidence) !== -1) qleak++;
  });
  out.push({ name: 'quarantine-containment', ok: qleak === 0, detail: qleak === 0 ? 'no disproven claim surfaces as fact' : qleak + ' quarantined claim(s) leaking' });

  // 4. supervised-autonomy: the gate's top tier (autonomous write) stays unoccupied.
  const posture = GOV.autonomyPosture(GOV.buildKeeperPolicy({}));
  out.push({ name: 'supervised-autonomy', ok: posture.supervised === true, detail: posture.supervised ? 'no write_record is auto-allowed (T7 unoccupied)' : 'supervision invariant BROKEN — a write can auto-execute' });

  // 5. supersession grounding: every ledger record is documented in its subject's own text.
  const familyNotes = (data.family && data.family.notes) || '';
  function groundText(id) { const p = people[id] || {}; return [p.notes, p.narrative, p.role].filter(Boolean).join(' ') + ' ' + familyNotes; }
  const ungrounded = SUP.all().filter(function (r) { return !(people[r.subject] && r.match.test(groundText(r.subject))); });
  out.push({ name: 'supersession-grounding', ok: ungrounded.length === 0, detail: ungrounded.length === 0 ? SUP.all().length + ' correction(s), each grounded in data.js' : ungrounded.length + ' ungrounded supersession(s)' });

  return out;
}

/* ---- the attestation: a content-addressed fingerprint of the governed state ---- */
function personaFingerprints(PERS) {
  const fps = {};
  const byId = (PERS && PERS.byId) || {};
  Object.keys(byId).sort().forEach(function (id) {
    const p = byId[id], v = p.voice || {};
    fps[id] = fnv([p.archetype || p.role || '', v.register || '', (v.idioms || []).join('|'),
      p.levity == null ? '' : p.levity, (p.provenance && p.provenance.reconstructed) ? 'recon' : 'doc',
      p.generation == null ? '' : p.generation].join('␟'));
  });
  return fps;
}
function attest(data, MEM, PERS) {
  const people = data.people, ids = Object.keys(people);
  const tiers = {}; ids.forEach(function (id) { const t = (people[id].evidence || 'possible'); tiers[t] = (tiers[t] || 0) + 1; });
  let sources = 0, dangling = 0;
  ids.forEach(function (id) {
    sources += (people[id].sources || []).length;
    ['parents', 'children', 'spouse', 'siblings'].forEach(function (rel) { (people[id][rel] || []).forEach(function (rid) { if (!people[rid]) dangling++; }); });
  });
  const gaps = (MEM.nodes || []).filter(function (n) { return n.kind === 'gap'; }).length;
  const quarantine = (MEM.nodes || []).filter(function (n) { return n.evidence === 'disproven' || n.evidence === 'eliminated'; }).length;
  const fps = personaFingerprints(PERS);
  const counts = { people: ids.length, tiers: tiers, sources: sources, gaps: gaps, quarantine: quarantine, refDangling: dangling, personas: Object.keys(fps).length };
  const digest = 'att:' + fnv(JSON.stringify({ counts: counts, fps: fps }));
  return { digest: digest, counts: counts, personas: fps };
}

/* ---- baseline compare ---- */
function diffAttest(base, cur) {
  if (!base) return { firstRun: true, changed: false, personaChanges: [], countChanges: [] };
  const personaChanges = [];
  const ids = new Set(Object.keys(base.personas || {}).concat(Object.keys(cur.personas || {})));
  ids.forEach(function (id) {
    const b = (base.personas || {})[id], c = (cur.personas || {})[id];
    if (b !== c) personaChanges.push(id + (b == null ? ' (new)' : c == null ? ' (removed)' : ' (changed)'));
  });
  const countChanges = [];
  ['people', 'sources', 'gaps', 'quarantine', 'refDangling', 'personas'].forEach(function (k) {
    const b = base.counts && base.counts[k], c = cur.counts && cur.counts[k];
    if (b !== c) countChanges.push(k + ': ' + b + ' → ' + c);
  });
  return { firstRun: false, changed: base.digest !== cur.digest, personaChanges: personaChanges, countChanges: countChanges };
}

/* ---- report ---- */
function report(date, inv, cur, diff) {
  const failures = inv.filter(function (i) { return !i.ok; });
  let md = '# Drift audit — ' + date + '\n\n';
  md += '> The system auditing itself: load-bearing invariants + a content-addressed attestation of the governed state. ';
  md += 'An invariant failure is a regression; a digest change is the record evolving (an auditable trail).\n\n';
  md += '**Attestation:** `' + cur.digest + '` · ' + cur.counts.people + ' people · ' + cur.counts.personas + ' personas · ' +
    cur.counts.gaps + ' open lines · ' + cur.counts.quarantine + ' quarantined.\n\n';
  md += '## Invariants\n\n';
  inv.forEach(function (i) { md += (i.ok ? '- ✅ ' : '- ❌ ') + '`' + i.name + '` — ' + i.detail + '\n'; });
  md += '\n## Drift since last attestation\n\n';
  if (diff.firstRun) md += '_Baseline established — no prior attestation to compare._\n';
  else if (!diff.changed && !diff.personaChanges.length && !diff.countChanges.length) md += '_No drift — the governed state is identical to the last attestation._\n';
  else {
    if (diff.countChanges.length) md += '- **Counts:** ' + diff.countChanges.join(' · ') + '\n';
    if (diff.personaChanges.length) md += '- **Persona fingerprints:** ' + diff.personaChanges.join(', ') + '\n';
    if (!diff.countChanges.length && !diff.personaChanges.length) md += '- The attestation digest changed.\n';
  }
  md += '\n' + (failures.length ? '**' + failures.length + ' invariant(s) FAILED — this is a regression that must be fixed.**' : '_All invariants hold._') + '\n';
  return { md: md, failures: failures.length };
}

/* ---- main ---- */
function main() {
  const args = process.argv.slice(2);
  const DRY = args.indexOf('--dry-run') !== -1;
  const UPDATE = args.indexOf('--update-baseline') !== -1;
  const ctx = load();
  const data = ctx.CASON_DATA, MEM = ctx.CASON_MEMORY, PERS = ctx.CASON_PERSONAS, GOV = ctx.CASON_GOVERNANCE, SUP = ctx.CASON_SUPERSESSIONS;

  const inv = invariants(data, MEM, PERS, GOV, SUP);
  const cur = attest(data, MEM, PERS);
  const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : null;
  const diff = diffAttest(base, cur);
  const r = report(today(), inv, cur, diff);

  console.log('Drift audit — ' + cur.digest);
  inv.forEach(function (i) { console.log('  ' + (i.ok ? '✓' : '✗') + ' ' + i.name + ' — ' + i.detail); });
  if (diff.firstRun) console.log('  · baseline established');
  else if (diff.changed) console.log('  · drift: ' + (diff.countChanges.concat(diff.personaChanges).join('; ') || 'digest changed'));
  else console.log('  · no drift');

  if (DRY) { console.log('\n--dry-run: nothing written.'); return r.failures ? 1 : 0; }

  // write the report only when there's something to say (a failure or real drift)
  if (r.failures || diff.firstRun || diff.changed) {
    fs.mkdirSync(DRIFT_DIR, { recursive: true });
    fs.writeFileSync(path.join(DRIFT_DIR, 'drift-' + today() + '.md'), r.md);
  }
  // refresh the baseline on drift or when asked (so the trail tracks the current truth)
  if (UPDATE || diff.firstRun || diff.changed) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, JSON.stringify(Object.assign({ generatedAt: today() }, cur), null, 2) + '\n');
    console.log('  · attestation written to ' + path.relative(ROOT, BASELINE));
  }
  return r.failures ? 1 : 0;
}

module.exports = { invariants: invariants, attest: attest, personaFingerprints: personaFingerprints, diffAttest: diffAttest, report: report, load: load };

if (require.main === module) process.exit(main());
