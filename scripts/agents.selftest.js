/* ============================================================
   Agent roster self-test  (run under Node)
     node scripts/agents.selftest.js
   ------------------------------------------------------------
   Validates the three newly-built agents (Journey, Reflection, Ingestion)
   and the honesty of the registry (every `live` agent names a module that
   exists on disk). Loads the REAL modules in a vm, like the other suites.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LIVING = path.join(ROOT, 'ui_kits', 'living-line');
const ctx = { console: console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
ctx.window = ctx;
vm.createContext(ctx);
[path.join(LIVING, '..', 'family-tree-app', 'data.js'), path.join(LIVING, 'memory-graph.js'), path.join(LIVING, 'personas.js'),
 path.join(LIVING, 'kinship.js'), path.join(LIVING, 'supersessions.js'), path.join(LIVING, 'governance.js'),
 path.join(LIVING, 'journey.js'), path.join(LIVING, 'reflection.js'), path.join(LIVING, 'ingestion.js'), path.join(LIVING, 'curator.js'), path.join(LIVING, 'agents.js')]
  .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });

const DATA = ctx.CASON_DATA, MEM = ctx.CASON_MEMORY, PERS = ctx.CASON_PERSONAS;
const JOURNEY = ctx.CASON_JOURNEY, REFLECTION = ctx.CASON_REFLECTION, INGESTION = ctx.CASON_INGESTION, CURATOR = ctx.CASON_CURATOR, AGENTS = ctx.CASON_AGENTS;
const KIN = ctx.CASON_KINSHIP, GOV = ctx.CASON_GOVERNANCE, SUP = ctx.CASON_SUPERSESSIONS;
const deps = { data: DATA, MEM: MEM, PERS: PERS, KIN: KIN, GOV: GOV, SUP: SUP };

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }
console.log('Agent roster self-test\n');
if (!JOURNEY || !REFLECTION || !INGESTION || !CURATOR || !AGENTS) { console.log('  ✗ modules did not initialize'); process.exit(1); }

/* ---- Narrative Journey ---- */
const recs = JOURNEY.recommend({ visited: ['homestead'], personas: ['thomas-sr'], lastPersonId: 'thomas-sr' }, deps);
ok('journey: returns recommendations', recs.length > 0);
ok('journey: suggests a next persona, an open line, and an unseen section', ['persona', 'openline', 'section'].every(function (k) { return recs.some(function (r) { return r.kind === k; }); }));
ok('journey: never recommends a living person', recs.filter(function (r) { return r.kind === 'persona'; }).every(function (r) { return ((DATA.people[r.id] || {}).tags || []).indexOf('living') === -1; }));
ok('journey: does not re-suggest a persona already met', recs.filter(function (r) { return r.kind === 'persona'; }).every(function (r) { return r.id !== 'thomas-sr'; }));

/* ---- Reflection ---- */
const rep = REFLECTION.report(DATA, MEM, PERS);
ok('reflection: stats.people matches the graph', rep.stats.people === Object.keys(DATA.people).length);
ok('reflection: ranks the load-bearing Gen-5 link first', rep.priorities[0] && rep.priorities[0].item === 'james-1727');
ok('reflection: emits improvement proposals', rep.proposals.length > 0);

/* ---- Curator — edits / seasonal / additions, learns from `applied` ---- */
const cur = CURATOR.suggest(new Date('2026-10-15'), deps); // autumn
ok('curator: names the season and its theme', cur.season === 'autumn' && cur.seasonal[0] && /autumn/.test(cur.seasonal[0].title));
ok('curator: proposes concrete edits and additions', cur.edits.length > 0 && cur.additions.length > 0);
ok('curator: an addition features the load-bearing Gen-5 slot', cur.additions.some(function (a) { return /Gen-5/.test(a.suggestion); }));
ok('curator: never proposes an edit for a living person', cur.edits.every(function (e) { return ((DATA.people[e.person] || {}).tags || []).indexOf('living') === -1; }));
const firstEdit = cur.edits[0].person;
const learned = CURATOR.suggest(new Date('2026-10-15'), Object.assign({}, deps, { applied: { ['edit:' + firstEdit]: true } }));
ok('curator: learns — skips an edit it was told is applied', !learned.edits.some(function (e) { return e.person === firstEdit; }));

/* ---- Ingestion (+ gatekeeper) — governed by the SAME gate ---- */
const myth = INGESTION.intake({ text: 'Thomas was baptized at Digswell in 1608, son of John Cason.', personId: 'thomas-sr', submitter: 'a cousin' }, deps);
ok('ingestion: a contribution reasserting a disproven myth is REFUSED', myth.route === 'refuse' && myth.decision.decision === 'block');
const revive = INGESTION.intake({ text: "Ransom's father was Cannon Cason Sr.", personId: 'ransom-sr' }, deps);
ok('ingestion: reviving a ruled-out ancestor is REFUSED', revive.route === 'refuse' && revive.reasons.some(function (s) { return /eliminated/.test(s); }));
const clean = INGESTION.intake({ text: 'A 1799 Glynn County land warrant names Ransom.', personId: 'ransom-sr', citation: 'Glynn Co. GA deed book' }, deps);
ok('ingestion: a clean lead routes to the human queue (never auto-published)', clean.route === 'human-queue' && clean.decision.decision === 'needs_approval');
ok('ingestion: intake never asserts above `possible`', clean.candidate.evidence === 'possible');
ok('ingestion: entity-links a name from free text', (INGESTION.intake({ text: 'Phoebe Munden — a note about her people.' }, deps).candidate.personId) === 'phoebe-munden');
const living = INGESTION.intake({ text: 'Contact for a living cousin: phone and address.', personId: 'ransom-sr' }, deps);
ok('ingestion (gatekeeper): living/private detail → authenticated-descendant privacy tier', living.candidate.privacyTier === 'authenticated_descendant');

/* ---- Registry honesty ---- */
ok('registry: lists agents', AGENTS.agents.length >= 10);
ok('registry: ids are unique', new Set(AGENTS.agents.map(function (a) { return a.id; })).size === AGENTS.agents.length);
ok('registry: every status is from the vocabulary', AGENTS.agents.every(function (a) { return AGENTS.STATUSES.indexOf(a.status) !== -1; }));
ok('registry: every layer is from the vocabulary', AGENTS.agents.every(function (a) { return AGENTS.LAYERS.indexOf(a.layer) !== -1; }));
ok('registry: every `live` agent names a module that EXISTS on disk', AGENTS.agents.filter(function (a) { return a.status === 'live'; }).every(function (a) {
  return (a.modules || []).length > 0 && a.modules.every(function (m) { return fs.existsSync(path.join(ROOT, m)); });
}));
ok('registry: the newly-built agents are registered live', ['ingestion', 'journey', 'reflection', 'curator'].every(function (id) { const a = AGENTS.byId(id); return a && a.status === 'live'; }));
ok('registry: every agent declares system + abilities + hooks + autonomy', AGENTS.agents.every(function (a) { return a.system && (a.abilities || []).length && (a.hooks || []).length && a.autonomy; }));

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
