/* ============================================================
   The Keeper — autonomous research orchestrator (propose, never publish)
   ------------------------------------------------------------
   Runs under Node (GitHub Action cron or `npm run keeper`). It:
     1. Loads the REAL data.js + memory-graph.js + kinship.js in a vm
        (the same loader selftest.js uses) and pulls the open-line `gap`
        nodes — the single source of truth for "what we don't yet know".
     2. Picks the top N open questions (authored family threads first,
        then the load-bearing Gen-5 link, then the rest).
     3. KINSHIP FIRST (ui_kits/living-line/kinship.js): for a relational
        question ("which of my children carried the line on", or any
        "<relation> of <Name>"), resolves it DETERMINISTICALLY from the
        curated family graph instead of asking a model to guess kin — the
        capability the sibling repo genealogy-graphrag proves. A curated
        edge => tier `graph-resolved` (NO model call). An empty/open edge
        => the graph's known kin is handed to the models as ground truth.
     4. Asks the deployed /api/consensus endpoint (Grok + Gemini +
        Claude, >=2 = corroborated) each REMAINING question, with the
        anchor facts + DISPROVEN quarantine list + GRAPH KIN as context.
     5. Runs the bloodhound gate: a claim that repeats a quarantined myth
        OR revives a ruled-out ancestor as kin (`graph-conflict`) is caught
        and held; a corroborated lead is tiered `leading`, a single-source
        lead `possible`, a conflict `unsolved`. It NEVER produces
        `confirmed`/`secondary` — those need a primary document.
     6. Writes an honestly-tiered research dossier to
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
  [path.join(LIVING, '..', 'family-tree-app', 'data.js'), path.join(LIVING, 'memory-graph.js'), path.join(LIVING, 'personas.js'), path.join(LIVING, 'kinship.js')]
    .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });
  return { DATA: ctx.CASON_DATA, MEM: ctx.CASON_MEMORY, PERS: ctx.CASON_PERSONAS, KIN: ctx.CASON_KINSHIP };
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
async function research(q, extraContext) {
  const question = 'For ' + q.name + (q.lifespan ? ' (' + q.lifespan + ')' : '') + ': ' + q.text +
    '\nWhat do the primary records say? Name the record type and tier the evidence.';
  const ctl = new AbortController();
  const t = setTimeout(function () { ctl.abort(); }, 60000);
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: question, context: CONTEXT + (extraContext || '') }), signal: ctl.signal,
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
function gate(res, eliminated) {
  if (!res.ok) return { tier: 'unsolved', verdict: 'research unavailable (' + res.error + ')', quarantined: false };
  const c = res.consensus, blob = [c.answer, c.corroborated, c.disputed, c.unverified].filter(Boolean).join(' ');
  if (BANNED.test(blob)) return { tier: 'disproven', verdict: 'A model repeated a quarantined claim — caught and held, not proposed as fact.', quarantined: true };
  // graph circuit-breaker: a model that revives a person the family has ruled
  // out (`evidence: 'eliminated'`) as kin is caught against the kinship graph.
  const revived = (eliminated || []).filter(function (e) { return e.pattern.test(blob); });
  if (revived.length) return { tier: 'graph-conflict', verdict: 'A model named a ruled-out ancestor as kin — ' + revived.map(function (e) { return e.name; }).join(', ') + ' (evidence: eliminated in the family graph). Caught and held, not proposed.', quarantined: true };
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

/* ---- 4b. kinship: resolve relational gaps from the graph, ground the rest ---- */
// canonical derived gaps (memory-graph.js) map to a relation on the gap's owner.
function relationOf(KIN, q) {
  const t = String(q.text || '');
  if (/which of my children|next link is not yet drawn/i.test(t)) return { relation: 'children', anchor: q.ownerId, mods: [], source: 'derived gap' };
  if (/place in the line is not yet proven|record breaks here/i.test(t)) return { relation: 'parents', anchor: q.ownerId, mods: [], source: 'derived gap' };
  const parsed = KIN && KIN.parse(t);                 // authored gaps phrased "<relation> of <Name>"
  if (parsed) return { relation: parsed.relation, anchor: parsed.anchor, mods: parsed.modifiers, source: 'parsed question' };
  return null;
}
function fmtKinList(list) {
  return list && list.length
    ? list.map(function (x) { return x.name + (x.evidence ? ' [' + x.evidence + ']' : ''); }).join('; ')
    : '(open — not yet drawn in the graph)';
}
// the curated kin handed to the models as ground truth (so they ground, not guess).
function groundingText(kin) {
  if (!kin) return '';
  return ' GRAPH KIN for ' + kin.self.name + ' (curated family graph — treat as ground truth, do NOT contradict): ' +
    'parents: ' + fmtKinList(kin.parents) + ' · children: ' + fmtKinList(kin.children) +
    ' · spouse: ' + fmtKinList(kin.spouses) + ' · siblings: ' + fmtKinList(kin.siblings) +
    '. Where a relation is open above, name the primary record that would close it; do not invent a name.';
}
// a relation the graph answers deterministically — no model needed.
function graphGate(rel, res) {
  return {
    tier: 'graph-resolved', quarantined: false,
    verdict: 'Resolved from the family kinship graph (' + rel.source + ') — ' + res.relation + ' of ' +
      res.anchorName + ' = ' + res.targets.map(function (t) { return t.name; }).join('; ') + '. No model needed.' +
      (res.sexUnresolved ? ' (Sex is not recorded, so a gendered split was not applied — the full set is returned.)' : ''),
  };
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
  const graphResolved = runs.filter(function (r) { return r.gate.tier === 'graph-resolved'; }).length;
  const caught = runs.filter(function (r) { return r.gate.quarantined; }).length;
  const llmRun = runs.filter(function (r) { return r.res && r.res.ok && !r.res.graph; })[0];
  let md = '# Keeper research dossier — ' + date + '\n\n';
  md += '> Autonomous research pass over the open lines. **Propose, not publish** — every item below is a *lead*, honestly tiered. ';
  md += 'Kinship is resolved from the curated family graph where the graph already knows it; model consensus is corroboration, never a primary source — nothing here is `confirmed`. Review, then merge to accept, or close to reject.\n\n';
  md += '**' + runs.length + '** question(s) · **' + graphResolved + '** graph-resolved · **' + corroborated + '** corroborated lead(s) · **' + caught + '** caught (myth / graph-conflict).\n\n';
  md += 'Endpoint: `' + ENDPOINT + '` · models: ' + (llmRun ? Object.values(llmRun.res.models).join(', ') : 'n/a') + ' · kinship: `ui_kits/living-line/kinship.js`\n\n---\n';
  runs.forEach(function (r, i) {
    const q = r.q;
    md += '\n## ' + (i + 1) + '. ' + q.name + (q.lifespan ? ' — ' + q.lifespan : '') + '\n\n';
    md += '**Open line (`' + q.ownerId + '`):** ' + q.text + '\n\n';
    md += '**Bloodhound verdict:** `' + r.gate.tier + '` — ' + r.gate.verdict + '\n\n';

    if (r.res && r.res.graph) {
      // graph-resolved: render the kinship trace; no model was called.
      const gr = r.graph;
      md += '**Resolved by the family kinship graph — no model called.**\n\n';
      md += '- **' + gr.relation + ' of ' + gr.anchorName + ':** ' +
        gr.targets.map(function (t) { return t.name + ' (`' + t.id + '`' + (t.evidence ? ', ' + t.evidence : '') + ')'; }).join('; ') + '\n';
      if (gr.sexUnresolved) md += '- _Sex is not recorded in the data, so a gendered split (father/mother, …) was not applied; the full set is returned. Add `sex` in data.js to refine._\n';
      md += '\n_This edge is already curated in `data.js` — it needs no AI corroboration. Any target above that is itself an open/placeholder node leaves that deeper question open._\n';
      md += '\n---\n';
      return;
    }

    const c = r.res.ok ? r.res.consensus : {};
    if (r.kin) {
      md += '**Graph kin given to the models (ground truth):** parents: ' + fmtKinList(r.kin.parents) +
        ' · children: ' + fmtKinList(r.kin.children) + ' · spouse: ' + fmtKinList(r.kin.spouses) + '\n\n';
    }
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
  return { date: date, md: md, corroborated: corroborated, caught: caught, graphResolved: graphResolved };
}

(async function main() {
  const g = loadGraph();
  const qs = selectQuestions(g);
  console.log('Keeper: ' + g.MEM.nodes.filter(function (n) { return n.kind === 'gap'; }).length + ' open lines; researching top ' + qs.length + '.');
  qs.forEach(function (q) {
    let mark = '';
    if (g.KIN) {
      const rel = relationOf(g.KIN, q);
      if (rel) { const r = g.KIN.resolveFor(rel.anchor, rel.relation, rel.mods); mark = r.fired ? ' [graph-resolved]' : ' [graph-grounded]'; }
    }
    console.log('  · [' + q.score + ']' + mark + ' ' + q.name + ' — ' + clip(q.text, 80));
  });
  if (DRY) { console.log('\n--dry-run: no network, no files written.'); return; }
  if (!qs.length) { console.log('No open lines to research.'); return; }

  const eliminated = g.KIN ? g.KIN.eliminatedKin() : [];
  const runs = [];
  for (const q of qs) {
    const kin = g.KIN ? g.KIN.knownKin(q.ownerId) : null;
    const rel = g.KIN ? relationOf(g.KIN, q) : null;
    if (rel) {
      const r = g.KIN.resolveFor(rel.anchor, rel.relation, rel.mods);
      if (r.fired) { runs.push({ q: q, kin: kin, rel: rel, graph: r, res: { ok: true, graph: true }, gate: graphGate(rel, r) }); continue; }
    }
    const res = await research(q, groundingText(kin));   // graph-grounded model research
    runs.push({ q: q, kin: kin, rel: rel, res: res, gate: gate(res, eliminated) });
  }

  const d = dossier(runs);
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, 'keeper-' + d.date + '.md');
  fs.writeFileSync(file, d.md);
  console.log('\nWrote ' + path.relative(ROOT, file) + ' — ' + d.graphResolved + ' graph-resolved, ' + d.corroborated + ' lead(s), ' + d.caught + ' caught.');
})().catch(function (e) { console.error('Keeper failed:', e); process.exit(1); });
