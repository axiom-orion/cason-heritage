/* ============================================================
   The Keeper — autonomous research orchestrator (propose, never publish)
   ------------------------------------------------------------
   Runs under Node (GitHub Action cron or `npm run keeper`). It:
     1. Loads the REAL data.js + memory-graph.js in a vm (the same
        loader selftest.js uses) and pulls the open-line `gap` nodes —
        the single source of truth for "what we don't yet know".
     2. Picks the top N open questions (authored family threads first,
        then the load-bearing Gen-5 link, then the rest).
     3. Asks the deployed /api/consensus endpoint (Grok + Gemini +
        Claude, >=2 = corroborated) each question, with the project's
        anchor facts + DISPROVEN quarantine list as context.
     4. Runs the bloodhound gate: a claim that repeats a quarantined
        myth is caught (never proposed as fact); a corroborated lead is
        tiered `leading`, a single-source lead `possible`, a conflict
        `unsolved`. It NEVER produces `confirmed`/`secondary` — those
        need a primary document, which an LLM is not.
     5. Writes an honestly-tiered research dossier to
        research/proposals/ for a human keeper to review and merge.

   It does not touch data.js and it does not publish. The dossier is a
   proposal; merging the PR is the human approval gate.

   Flags:  --max <n>   how many questions this run (default 3)
           --dry-run    select + print the queue, no network, no files
           --out <dir>  proposals dir (default research/proposals)
   Env:    KEEPER_CONSENSUS_URL  default https://flcason.com/api/consensus
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIVING = path.join(ROOT, 'ui_kits', 'living-line');
const args = process.argv.slice(2);
function flag(name, def) { const i = args.indexOf('--' + name); return i !== -1 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : def; }
const MAX = parseInt(flag('max', '3'), 10) || 3;
const DRY = !!flag('dry-run', false);
const OUT = path.join(ROOT, String(flag('out', 'research/proposals')));
const ENDPOINT = process.env.KEEPER_CONSENSUS_URL || 'https://flcason.com/api/consensus';

// quarantined myths — if a model asserts one, it is caught, never proposed.
const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
// compact anchor + discipline handed to every research call.
const CONTEXT = [
  'Verified anchors (do not contradict without a primary record): Thomas Casson immigrated to Lower Norfolk Co., VA (b.~1604, d.1651; 1635 Harwood headright). Wife Elizabeth (Keeling) Leighton. James the orphan b.1655 d.1722 Princess Anne Co. William4 b.~1691 d.1764 Pitt Co. NC, m. Jane Cannon. Ransom Cason Sr. b.~1763 Pitt Co. NC, d.1853 Alachua Co. FL.',
  'DISPROVEN — never propagate, flag any source that repeats them: Digswell 1608 baptism; "son of John Cason"; John Cason stockholder in the "Virginia Land Company"; ~1629 crossing; birth year 1608; wife "Elizabeth Alcott"; "Steeple Morden" origin; "Church Warden of Lynnhaven Parish".',
  'Tier your evidence and name the record type. If you cannot find a primary record, say so — a clean negative is worth more than a guess. Do not invent a candidate.',
].join(' ');

/* ---- 1. load the real modules in a browser-like vm (selftest pattern) ---- */
function loadGraph() {
  const ctx = { console: console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  ctx.window = ctx;
  vm.createContext(ctx);
  [path.join(LIVING, '..', 'family-tree-app', 'data.js'), path.join(LIVING, 'memory-graph.js'), path.join(LIVING, 'personas.js')]
    .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });
  return { DATA: ctx.CASON_DATA, MEM: ctx.CASON_MEMORY, PERS: ctx.CASON_PERSONAS };
}

/* ---- 2. rank the open questions ---- */
function selectQuestions(g) {
  const seen = {};
  const gaps = g.MEM.nodes.filter(function (n) { return n.kind === 'gap'; });
  const scored = gaps.map(function (n) {
    const p = g.DATA.people[n.ownerId] || {};
    let score = 0;
    if (n.evidence === 'possible') score += 4;            // authored family thread (specific)
    if (n.ownerId === 'james-1727') score += 4;           // the load-bearing Gen-5 link
    if (p.direct) score += 2;
    if ((n.tags || []).indexOf('open-question') !== -1) score += 1;
    return { ownerId: n.ownerId, name: p.name || n.ownerId, lifespan: p.lifespan || '', text: n.text, tags: n.tags || [], score: score };
  }).filter(function (q) { const k = q.ownerId + '|' + q.text; if (seen[k]) return false; seen[k] = 1; return true; });
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.slice(0, MAX);
}

/* ---- 3. ask the consensus endpoint ---- */
async function research(q) {
  const question = 'For ' + q.name + (q.lifespan ? ' (' + q.lifespan + ')' : '') + ': ' + q.text +
    '\nWhat do the primary records say? Name the record type and tier the evidence.';
  const ctl = new AbortController();
  const t = setTimeout(function () { ctl.abort(); }, 60000);
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: question, context: CONTEXT }), signal: ctl.signal,
    });
    const j = await r.json();
    if (!r.ok || j.error) return { ok: false, error: j.error || ('HTTP ' + r.status) };
    return { ok: true, question: question, consensus: j.consensus || {}, providers: j.providers || [], models: j.models || {} };
  } catch (e) { return { ok: false, error: String((e && e.message) || e) }; }
  finally { clearTimeout(t); }
}

/* ---- 4. bloodhound gate: catch myths, tier honestly ---- */
// a consensus that AGREES nothing is proven is a clean negative, not a lead.
const NEGATIVE = /no primary record|no such record|not located|no record (was )?(found|identified|located)|cannot confirm|unproven|unverified (working )?hypothes|clean negative|treated? as unverified|derives entirely from/i;
function gate(res) {
  if (!res.ok) return { tier: 'unsolved', verdict: 'research unavailable (' + res.error + ')', quarantined: false };
  const c = res.consensus, blob = [c.answer, c.corroborated, c.disputed, c.unverified].filter(Boolean).join(' ');
  if (BANNED.test(blob)) return { tier: 'disproven', verdict: 'A model repeated a quarantined claim — caught and held, not proposed as fact.', quarantined: true };
  const okN = res.providers.filter(function (p) { return p.ok; }).length;
  const corro = (c.corroborated || '').trim().length > 0;
  const corroborated = (c.agreement === 'strong' || c.agreement === 'partial') && corro && okN >= 2;
  // models agreeing the claim is UNPROVEN is corroboration of an open question, not a new fact.
  if (corroborated && NEGATIVE.test([c.corroborated, c.answer].filter(Boolean).join(' ')))
    return { tier: 'unsolved', verdict: '>=2 models agree — but on the ABSENCE of a primary record. The line stays open; the dossier names what would close it.', quarantined: false };
  if (corroborated) return { tier: 'leading', verdict: 'Corroborated by >=2 independent models — a lead, not proof. Needs a primary record to confirm.', quarantined: false };
  if (okN >= 1 && (c.unverified || '').trim()) return { tier: 'possible', verdict: 'Single-source / unverified — recorded as a thread to chase, not as fact.', quarantined: false };
  return { tier: 'unsolved', verdict: 'No corroboration (conflict or insufficient) — the question stays open.', quarantined: false };
}

/* ---- 5. dossier ---- */
function snippet(q, tier) {
  return JSON.stringify({
    personId: q.ownerId, text: '<one-line lead the keeper approves, in the site house style>',
    evidence: tier, source: 'AI consensus (Grok · Gemini · Claude), ' + today() + ' — UNVERIFIED until a primary record is found',
    tags: ['ai-consensus', 'keeper'],
  }, null, 2);
}
function clip(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; }
function today() { return new Date().toISOString().slice(0, 10); }

function dossier(runs) {
  const date = today();
  const corroborated = runs.filter(function (r) { return r.gate.tier === 'leading'; }).length;
  const caught = runs.filter(function (r) { return r.gate.quarantined; }).length;
  let md = '# Keeper research dossier — ' + date + '\n\n';
  md += '> Autonomous research pass over the open lines. **Propose, not publish** — every item below is a *lead*, honestly tiered. ';
  md += 'Model consensus is corroboration, never a primary source: nothing here is `confirmed`. Review, then merge to accept, or close to reject.\n\n';
  md += '**' + runs.length + '** question(s) researched · **' + corroborated + '** corroborated lead(s) · **' + caught + '** quarantined myth(s) caught.\n\n';
  md += 'Endpoint: `' + ENDPOINT + '` · models: ' + (runs[0] && runs[0].res.ok ? Object.values(runs[0].res.models).join(', ') : 'n/a') + '\n\n---\n';
  runs.forEach(function (r, i) {
    const q = r.q, c = r.res.ok ? r.res.consensus : {};
    md += '\n## ' + (i + 1) + '. ' + q.name + (q.lifespan ? ' — ' + q.lifespan : '') + '\n\n';
    md += '**Open line (`' + q.ownerId + '`):** ' + q.text + '\n\n';
    md += '**Bloodhound verdict:** `' + r.gate.tier + '` — ' + r.gate.verdict + '\n\n';
    if (r.res.ok) {
      md += '**Consensus:** agreement *' + (c.agreement || '?') + '*, confidence *' + (c.confidence || '?') + '*\n\n';
      if (c.corroborated) md += '- **Corroborated (>=2 models):** ' + clip(c.corroborated, 600) + '\n';
      if (c.disputed) md += '- **Disputed:** ' + clip(c.disputed, 400) + '\n';
      if (c.unverified) md += '- **Unverified (single source):** ' + clip(c.unverified, 400) + '\n';
      if (c.answer) md += '\n> ' + clip(c.answer, 700) + '\n';
      md += '\n<details><summary>Per-model answers</summary>\n\n';
      r.res.providers.forEach(function (p) { md += '**' + p.provider + '** — ' + (p.ok ? clip(p.answer, 500) : '_error: ' + clip(p.error, 160) + '_') + '\n\n'; });
      md += '</details>\n';
    } else {
      md += '_Research unavailable this run: ' + clip(r.res.error, 200) + '._\n';
    }
    if (r.gate.tier === 'leading' || r.gate.tier === 'possible') {
      md += '\n**If you approve, a contribution-shaped record to add (honestly tiered):**\n\n```json\n' + snippet(q, r.gate.tier) + '\n```\n';
    }
    md += '\n---\n';
  });
  md += '\n_Generated by the Keeper. It proposes; you decide. A clean negative is a finding — keep it._\n';
  return { date: date, md: md, corroborated: corroborated, caught: caught };
}

(async function main() {
  const g = loadGraph();
  const qs = selectQuestions(g);
  console.log('Keeper: ' + g.MEM.nodes.filter(function (n) { return n.kind === 'gap'; }).length + ' open lines; researching top ' + qs.length + '.');
  qs.forEach(function (q) { console.log('  · [' + q.score + '] ' + q.name + ' — ' + clip(q.text, 80)); });
  if (DRY) { console.log('\n--dry-run: no network, no files written.'); return; }
  if (!qs.length) { console.log('No open lines to research.'); return; }

  const runs = [];
  for (const q of qs) { const res = await research(q); runs.push({ q: q, res: res, gate: gate(res) }); }

  const d = dossier(runs);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'keeper-' + d.date + '.md');
  fs.writeFileSync(file, d.md);
  console.log('\nWrote ' + path.relative(ROOT, file) + ' — ' + d.corroborated + ' lead(s), ' + d.caught + ' myth(s) caught.');
})().catch(function (e) { console.error('Keeper failed:', e); process.exit(1); });
