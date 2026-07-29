#!/usr/bin/env node
/* ============================================================
   The Loop Warden — is anything actually moving?
     node scripts/loop-warden.js [--out <dir>] [--json]
   ------------------------------------------------------------
   The sixteenth agent, and the first that watches the other agents rather
   than the record.

   Every governed loop here reports faithfully on its OWN run: the Keeper
   tiers each lead honestly, the Public Record Auditor blocks a bad claim,
   the Librarian withholds an unsupported title. What none of them can see
   is the shape ACROSS runs — and that is where the real failures lived.

   Four dossiers between 2026-06-15 and 2026-07-27, eight questions, zero
   corroborated leads, zero graph-resolved. `ransom-sr` asked in five of
   them. Every individual run was correct and honest; the sequence was a
   treadmill, and nothing in the estate was looking at sequences. That is
   the gap this fills.

   ---- What it watches ----
   STALLED     a question asked repeatedly that never rises above `possible`
   BARREN      consecutive runs producing nothing corroborated
   BACKLOG     agent PRs opened and never merged or closed
   SILENT      a scheduled agent that has not produced output in far longer
               than its own cadence
   PARKED      proposals accumulating on disk with nobody accepting them

   Propose, never publish. It writes a report and opens a PR. It cannot
   change a schedule, close a PR, or edit a dossier — a warden that could
   quietly fix what it found would remove the only reason to read it.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PROPOSALS = path.join(ROOT, 'research', 'proposals');
const CLAIMS = path.join(ROOT, 'research', 'claims');

/* Thresholds. Deliberately generous — a warden that cries early gets muted,
   and a muted warden is worse than none. Each is the point past which a human
   would agree something is wrong, not the point where it first looks odd. */
const STALL_RUNS = 3;        // asked this many times without rising above `possible`
const BARREN_RUNS = 3;       // consecutive dossiers with nothing corroborated
const BACKLOG_DAYS = 14;     // an agent PR open this long is not being reviewed
const SILENT_MULTIPLIER = 3; // missed this many of its own cadences

const CADENCE_DAYS = { keeper: 7, 'claim-audit': 7, 'drift-audit': 7, librarian: 30, season: 91 };

function readDir(dir, re) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(function (f) { return re.test(f); }).sort();
}
function dateOf(file) { const m = file.match(/(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null; }
function daysBetween(a, b) { return Math.round((new Date(a) - new Date(b)) / 86400000); }

/* ---- parse a keeper dossier ---- */
function parseKeeper(file) {
  const body = fs.readFileSync(path.join(PROPOSALS, file), 'utf8');
  const head = body.match(/\*\*(\d+)\*\* question\(s\)[^\n]*?\*\*(\d+)\*\* graph-resolved[^\n]*?\*\*(\d+)\*\* corroborated/);
  const items = [];
  // each item pairs an open-line id with the verdict it received
  const re = /\*\*Open line \(`([a-z0-9-]+)`\):\*\*([\s\S]*?)\*\*Bloodhound verdict:\*\*\s*`([a-z-]+)`/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    items.push({ id: m[1], question: m[2].replace(/\s+/g, ' ').trim().slice(0, 120), tier: m[3] });
  }
  return {
    file: file, date: dateOf(file),
    questions: head ? +head[1] : items.length,
    graphResolved: head ? +head[2] : 0,
    corroborated: head ? +head[3] : 0,
    items: items,
  };
}

/* ---- the findings ---- */
function findStalled(runs) {
  const byId = {};
  runs.forEach(function (r) {
    r.items.forEach(function (it) {
      (byId[it.id] = byId[it.id] || []).push({ date: r.date, tier: it.tier, question: it.question });
    });
  });
  const out = [];
  Object.keys(byId).forEach(function (id) {
    const seen = byId[id];
    if (seen.length < STALL_RUNS) return;
    // "Advanced" means it reached something better than a thread to chase.
    const advanced = seen.some(function (s) { return s.tier === 'leading' || s.tier === 'confirmed' || s.tier === 'secondary'; });
    if (advanced) return;
    out.push({
      kind: 'STALLED', id: id, runs: seen.length,
      first: seen[0].date, last: seen[seen.length - 1].date,
      tiers: seen.map(function (s) { return s.tier; }),
      question: seen[seen.length - 1].question,
      detail: 'Asked in ' + seen.length + ' runs between ' + seen[0].date + ' and ' + seen[seen.length - 1].date +
        ', never rising above `possible` (' + seen.map(function (s) { return s.tier; }).join(' → ') + '). ' +
        'Re-asking an unanswerable question on a schedule is not research; either the question needs re-framing, ' +
        'or the source that would answer it is not reachable and the line should be parked with that stated.',
    });
  });
  return out;
}

function findBarren(runs) {
  if (runs.length < BARREN_RUNS) return [];
  const recent = runs.slice(-BARREN_RUNS);
  if (recent.some(function (r) { return r.corroborated > 0 || r.graphResolved > 0; })) return [];
  return [{
    kind: 'BARREN', runs: recent.length,
    detail: recent.length + ' consecutive runs (' + recent[0].date + ' → ' + recent[recent.length - 1].date +
      ') produced 0 corroborated leads and 0 graph-resolved answers. Each run may be individually correct — ' +
      'a clean negative is a real finding — but a loop that never advances is spending model calls to ' +
      're-confirm that it cannot advance. Check whether the loop has the reach its questions require.',
  }];
}

function findSilent(runs, today) {
  const out = [];
  Object.keys(CADENCE_DAYS).forEach(function (agent) {
    const dir = agent === 'claim-audit' ? CLAIMS : PROPOSALS;
    const files = readDir(dir, new RegExp('^' + agent + '-\\d{4}-\\d{2}-\\d{2}\\.md$'));
    if (!files.length) return;   // never run is not the same as gone quiet
    const last = dateOf(files[files.length - 1]);
    const gap = daysBetween(today, last);
    const allowed = CADENCE_DAYS[agent] * SILENT_MULTIPLIER;
    if (gap <= allowed) return;
    out.push({
      kind: 'SILENT', agent: agent, lastRun: last, days: gap,
      detail: agent + ' last produced output on ' + last + ' — ' + gap + ' days ago, against a ' +
        CADENCE_DAYS[agent] + '-day cadence. A scheduled agent that stops running stops being a control; ' +
        'check the workflow, its schedule, and whether its last run failed silently.',
    });
  });
  return out;
}

function findParked(runs, today) {
  if (!runs.length) return [];
  const last = runs[runs.length - 1];
  const total = runs.length;
  if (total < 3) return [];
  return [{
    kind: 'PARKED', count: total, since: runs[0].date,
    detail: total + ' dossiers on disk from ' + runs[0].date + ' to ' + last.date +
      '. Each was written to be reviewed and then acted on; if they are accumulating unread, the loop is ' +
      'producing proposals faster than anyone is accepting or rejecting them, and the queue is the bottleneck.',
  }];
}

/* Open agent PRs. Needs a token; degrades to a note rather than a false all-clear. */
async function findBacklog(today) {
  const repo = process.env.WARDEN_REPO || 'axiom-orion/cason-heritage';
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [{ kind: 'NOTE', detail: 'PR backlog not checked — no GITHUB_TOKEN. This is a gap in the sweep, not an all-clear.' }];
  let prs;
  try {
    const r = await fetch('https://api.github.com/repos/' + repo + '/pulls?state=open&per_page=100', {
      headers: { accept: 'application/vnd.github+json', authorization: 'Bearer ' + token, 'user-agent': 'cason-loop-warden' },
    });
    if (!r.ok) throw new Error('GitHub API ' + r.status);
    prs = await r.json();
  } catch (e) {
    return [{ kind: 'NOTE', detail: 'PR backlog not checked — ' + String(e.message || e) + '. A gap in the sweep, not an all-clear.' }];
  }
  const AGENT = /^(Keeper|Librarian|Public record audit|Drift|Season)/i;
  return (prs || []).filter(function (pr) {
    return AGENT.test(pr.title || '') && daysBetween(today, pr.created_at.slice(0, 10)) >= BACKLOG_DAYS;
  }).map(function (pr) {
    const age = daysBetween(today, pr.created_at.slice(0, 10));
    return {
      kind: 'BACKLOG', number: pr.number, title: pr.title, days: age,
      detail: 'PR #' + pr.number + ' ("' + pr.title + '") has been open ' + age + ' days. An agent that proposes ' +
        'faster than a human decides builds a queue, and a queue nobody clears is the loop failing quietly at the far end.',
    };
  });
}

function render(findings, runs, today) {
  const by = function (k) { return findings.filter(function (f) { return f.kind === k; }); };
  let md = '# Loop warden — ' + today + '\n\n';
  md += '> Watching the agents rather than the record: is anything actually moving? Every loop here reports honestly on its own run. This looks at the shape ACROSS runs, which is where a treadmill hides. **Propose, never publish** — this report changes nothing on its own.\n\n';
  md += '**' + findings.length + '** finding(s) across **' + runs.length + '** dossier(s).\n\n';

  if (!findings.length) {
    md += 'Nothing to report: every loop that has run recently produced something, and no question is being re-asked without progress.\n';
    return md;
  }

  [['STALLED', 'Questions being re-asked without progress'],
   ['BARREN', 'Loops producing nothing'],
   ['SILENT', 'Agents that have gone quiet'],
   ['BACKLOG', 'Proposals nobody has decided on'],
   ['PARKED', 'Dossiers accumulating'],
   ['NOTE', 'Gaps in this sweep']].forEach(function (pair) {
    const list = by(pair[0]);
    if (!list.length) return;
    md += '## ' + pair[1] + '\n\n';
    list.forEach(function (f) {
      const label = f.id || f.agent || (f.number ? '#' + f.number : '') || '';
      md += '- ' + (label ? '**`' + label + '`** — ' : '') + f.detail + '\n';
      if (f.question) md += '  \n  _"' + f.question + '"_\n';
    });
    md += '\n';
  });

  md += '---\n\n_The warden proposes. It cannot change a schedule, close a PR, or edit a dossier — a warden that quietly fixed what it found would remove the only reason to read it._\n';
  return md;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = function (f, d) { const i = argv.indexOf(f); return i !== -1 && argv[i + 1] ? argv[i + 1] : d; };
  const OUT = path.resolve(ROOT, arg('--out', path.join('research', 'warden')));
  const today = new Date().toISOString().slice(0, 10);

  const runs = readDir(PROPOSALS, /^keeper-\d{4}-\d{2}-\d{2}\.md$/).map(parseKeeper);

  const findings = []
    .concat(findStalled(runs))
    .concat(findBarren(runs))
    .concat(findSilent(runs, today))
    .concat(findParked(runs, today))
    .concat(await findBacklog(today));

  if (argv.indexOf('--json') !== -1) {
    console.log(JSON.stringify({ date: today, runs: runs.length, findings: findings }, null, 2));
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'warden-' + today + '.md');
  fs.writeFileSync(file, render(findings, runs, today));
  console.log('Loop warden: ' + findings.length + ' finding(s) across ' + runs.length + ' dossier(s).');
  findings.forEach(function (f) { console.log('  · ' + f.kind + (f.id ? ' ' + f.id : '') + (f.agent ? ' ' + f.agent : '')); });
  console.log('Wrote ' + path.relative(ROOT, file));
}

if (require.main === module) {
  main().catch(function (e) { console.error(e && e.stack || e); process.exit(1); });
}

module.exports = { parseKeeper, findStalled, findBarren, findSilent, findParked, render, STALL_RUNS, BARREN_RUNS, CADENCE_DAYS };
