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

  // 6. eliminated containment (H7): nobody's ancestry runs THROUGH a ruled-out node.
  // Direction matters: a confirmed father may keep `children` links to candidate sons he
  // ruled out (that IS the audit trail), but no standing person may cite an eliminated/
  // disproven person as a parent or spouse — that is the Cason↔Causey corruption class.
  let throughElim = 0;
  ids.forEach(function (id) {
    const tier = people[id].evidence || 'possible';
    if (tier === 'eliminated' || tier === 'disproven') return; // quarantined nodes may point anywhere
    ['parents', 'spouse'].forEach(function (rel) {
      (people[id][rel] || []).forEach(function (rid) {
        const t = people[rid] && people[rid].evidence;
        if (t === 'eliminated' || t === 'disproven') throughElim++;
      });
    });
  });
  out.push({ name: 'eliminated-containment', ok: throughElim === 0, detail: throughElim === 0 ? 'no ancestry runs through a ruled-out node (parent/spouse)' : throughElim + ' kin claim(s) THROUGH an eliminated/disproven person' });

  return out;
}

/* ---- claim reconciliation (H7): standing claims replayed against the baseline ----
   The attestation now freezes a per-person claim fingerprint { t: tier, s: #sources }.
   On the next run, each standing claim is reconciled against what was attested:
     • a tier may not RISE without at least one new source (a claim silently promoted
       above its evidence, post-commit);
     • sources may not be REMOVED from under a standing confirmed/secondary claim
       while its tier holds (evidence withdrawn, claim unmoved).
   Demotions, additions, and evidenced promotions are DRIFT (reported, baseline
   refreshed) — the record evolving, not a regression. A baseline without claims
   (pre-upgrade) establishes one; nothing fails on first contact. */
var TIER_RANK = { disproven: -1, eliminated: -1, unlikely: 0, unsolved: 0, possible: 1, leading: 2, secondary: 3, confirmed: 4 };

function claimsOf(data) {
  const people = data.people, out = {};
  Object.keys(people).sort().forEach(function (id) {
    out[id] = { t: people[id].evidence || 'possible', s: (people[id].sources || []).length };
  });
  return out;
}

function reconcileClaims(baseClaims, curClaims) {
  if (!baseClaims) return { established: true, failures: [], drift: [] };
  const failures = [], drift = [];
  Object.keys(curClaims).forEach(function (id) {
    const b = baseClaims[id], c = curClaims[id];
    if (!b) { drift.push(id + ': new claim (' + c.t + ', ' + c.s + ' source(s))'); return; }
    if (b.t === c.t && b.s === c.s) return;
    const rose = (TIER_RANK[c.t] != null && TIER_RANK[b.t] != null && TIER_RANK[c.t] > TIER_RANK[b.t]);
    if (rose && c.s <= b.s) {
      failures.push(id + ': tier rose ' + b.t + ' → ' + c.t + ' with no new source (' + b.s + ' → ' + c.s + ')');
    } else if (c.s < b.s && (c.t === 'confirmed' || c.t === 'secondary') && TIER_RANK[c.t] >= TIER_RANK[b.t]) {
      failures.push(id + ': source(s) removed under a standing ' + c.t + ' claim (' + b.s + ' → ' + c.s + ')');
    } else {
      drift.push(id + ': ' + b.t + (b.t === c.t ? '' : ' → ' + c.t) + (b.s === c.s ? '' : ' (sources ' + b.s + ' → ' + c.s + ')'));
    }
  });
  Object.keys(baseClaims).forEach(function (id) { if (!curClaims[id]) drift.push(id + ': claim removed (was ' + baseClaims[id].t + ')'); });
  return { established: false, failures: failures, drift: drift };
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
  const claims = claimsOf(data); // per-person { t: tier, s: #sources } — the H7 reconciliation baseline
  const counts = { people: ids.length, tiers: tiers, sources: sources, gaps: gaps, quarantine: quarantine, refDangling: dangling, personas: Object.keys(fps).length };
  const digest = 'att:' + fnv(JSON.stringify({ counts: counts, fps: fps, claims: claims }));
  return { digest: digest, counts: counts, personas: fps, claims: claims };
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
    if (diff.claimChanges && diff.claimChanges.length) {
      const shown = diff.claimChanges.slice(0, 10);
      md += '- **Claims (reconciled):** ' + shown.join(' · ') + (diff.claimChanges.length > shown.length ? ' · …' + (diff.claimChanges.length - shown.length) + ' more' : '') + '\n';
    }
    if (!diff.countChanges.length && !diff.personaChanges.length && !(diff.claimChanges && diff.claimChanges.length)) md += '- The attestation digest changed.\n';
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

  // H7: reconcile every standing claim against the attested baseline. A failure here
  // is a post-commit regression (a claim silently strengthened, or evidence withdrawn
  // from under it); ordinary evolution lands in the drift section instead.
  const rec = reconcileClaims(base && base.claims, cur.claims);
  diff.claimChanges = rec.drift;
  inv.push({
    name: 'claim-reconciliation',
    ok: rec.failures.length === 0,
    detail: rec.established
      ? 'claims baseline established (' + Object.keys(cur.claims).length + ' standing claims)'
      : rec.failures.length === 0
        ? Object.keys(cur.claims).length + ' standing claim(s) reconciled against the attested baseline'
        : rec.failures.length + ' reconciliation failure(s): ' + rec.failures.slice(0, 3).join('; ') + (rec.failures.length > 3 ? '; …' : ''),
  });

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

module.exports = { invariants: invariants, attest: attest, personaFingerprints: personaFingerprints, diffAttest: diffAttest, report: report, load: load, claimsOf: claimsOf, reconcileClaims: reconcileClaims, TIER_RANK: TIER_RANK };

if (require.main === module) process.exit(main());
