/* ============================================================
   The Living Line — Phase 1 self-test  (run under Node)
     node ui_kits/living-line/selftest.js
   ------------------------------------------------------------
   Loads the REAL data.js + memory-graph.js + personas.js in a
   browser-like vm context (window shim) and asserts the
   load-bearing invariants:
     1. No persona ever sees a node beyond generation N+1.
     2. No persona ever sees a node dated after its horizon.
     3. A gen-6 ancestor cannot see gen-8 (grandchild) events.
     4. Honesty: disproven/eliminated claims exist and are flagged.
     5. Every sparse collateral has a reconstructed, flagged persona.
   Exit code 0 = all pass.
   ============================================================ */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = __dirname;
const ctx = {
  console: console,
  localStorage: {
    getItem(k) {
      if (k === 'cason-memory-ransom-sr') return JSON.stringify([{ personId: 'ransom-sr', text: 'AI-consensus test finding about Ransom.', evidence: 'secondary', source: 'AI consensus (Grok · Gemini · Claude)', when: 1 }]);
      return null;
    },
    setItem() {}, removeItem() {},
  },
};
ctx.window = ctx; // make `window` self-referential like a browser global
vm.createContext(ctx);

[
  path.join(dir, '..', 'family-tree-app', 'data.js'),
  path.join(dir, 'memory-graph.js'),
  path.join(dir, 'personas.js'),
  path.join(dir, 'world-engine.js'),
].forEach(function (f) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
});

const data = ctx.CASON_DATA;
const MEM = ctx.CASON_MEMORY;          // built graph with .access()
const PERS = ctx.CASON_PERSONAS;       // { byId, list }
const ENG = ctx.CASON_ENGINE;          // world engine
const Hh = ctx.CASON_MEMORY_API.helpers;

let failures = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  ✓ ' + name); }
  else { console.log('  ✗ ' + name + (detail ? '  — ' + detail : '')); failures++; }
}

console.log('\n— Build —');
check('data.js loaded ' + Object.keys(data.people).length + ' people', Object.keys(data.people).length >= 60);
check('memory graph built (' + MEM.nodes.length + ' nodes, ' + MEM.edges.length + ' edges)', MEM.nodes.length > 100);
check('personas built (' + PERS.list.length + ')', PERS.list.length === Object.keys(data.people).length);

console.log('\n— Invariant 1+2: generation & temporal gates over EVERY persona —');
let worstGen = 0, worstFuture = 0, sampleViolation = null;
Object.keys(data.people).forEach(function (pid) {
  const p = data.people[pid];
  const sub = MEM.access(pid);
  const all = sub.individual.concat(sub.generational, sub.family);
  all.forEach(function (n) {
    if (n.generation != null && n.generation > p.generation + 1) {
      worstGen++; sampleViolation = sampleViolation || (pid + ' (gen' + p.generation + ') saw node gen' + n.generation + ': ' + n.text.slice(0, 40));
    }
    if (n.year != null && n.year > sub.horizonYear) {
      worstFuture++; sampleViolation = sampleViolation || (pid + ' horizon ' + sub.horizonYear + ' saw year ' + n.year);
    }
  });
});
check('no node beyond generation N+1 (any persona)', worstGen === 0, sampleViolation);
check('no node dated after horizon (any persona)', worstFuture === 0, sampleViolation);

console.log('\n— Invariant 3: a gen-6 ancestor is blind to gen-8 —');
const ransomSr = MEM.access('ransom-sr');
const seesGen8 = ransomSr.individual.concat(ransomSr.generational, ransomSr.family)
  .some(function (n) { return n.generation != null && n.generation >= 8; });
const seesGrandsonId = ransomSr.family.some(function (n) { return n.id === 'mem:ransom-2:identity'; });
check('Ransom Sr. (gen 6) cannot see any gen-8 node', !seesGen8);
check('Ransom Sr. cannot see grandson Lt. Ransom "2" identity', !seesGrandsonId);
check('Ransom Sr. CAN see his son James Green (gen 7) identity',
  ransomSr.family.some(function (n) { return n.id === 'mem:james-green:identity'; }));
check('Ransom Sr.\'s circuit breaker blocked future nodes (' + ransomSr.stats.blockedFuture +
  ' future, ' + ransomSr.stats.blockedGen + ' gen)', (ransomSr.stats.blockedFuture + ransomSr.stats.blockedGen) > 0);

console.log('\n— Invariant 3b: gen-1 Thomas knows children, not grandchildren —');
const thomas = MEM.access('thomas-sr');
check('Thomas (gen 1) sees son Thomas Jr. (gen 2)',
  thomas.family.some(function (n) { return n.id === 'mem:thomas-jr:identity'; }));
check('Thomas (gen 1) does NOT see grandson James the Orphan (gen 3)',
  !thomas.family.some(function (n) { return n.id === 'mem:james-orphan:identity'; }));
check('Thomas (gen 1) does NOT see the Florida-crossing throughline (gen 6)',
  !thomas.family.concat(thomas.generational).some(function (n) { return /Florida|unknown ground/i.test(n.text) && n.generation === 6; }));

console.log('\n— Invariant 4: honesty — disproven/eliminated claims are present & flagged —');
const disproven = MEM.nodes.filter(function (n) { return n.evidence === 'disproven' || n.evidence === 'eliminated'; });
check('disproven/eliminated memory nodes exist (' + disproven.length + ')', disproven.length > 0);
check('Thomas carries a flagged correction about the Digswell claim',
  MEM.byOwner['thomas-sr'].some(function (n) { return /Digswell/i.test(n.text) && (n.evidence === 'disproven' || n.evidence === 'eliminated'); }));

console.log('\n— Invariant 5: every sparse collateral is a flagged, reconstructed persona —');
let sparseCount = 0, badProvenance = 0;
PERS.list.forEach(function (per) {
  const p = data.people[per.id];
  const sparse = !p.narrative && !(p.sources && p.sources.length);
  if (sparse) {
    sparseCount++;
    if (!per.provenance.reconstructed || !per.provenance.note) badProvenance++;
  }
});
check('sparse collaterals flagged reconstructed (' + sparseCount + ' sparse, ' + badProvenance + ' unflagged)', badProvenance === 0);
check('every persona has wisdom + levity', PERS.list.every(function (x) { return x.wisdom.length && typeof x.levity === 'number'; }));

console.log('\n— Humor: distant collaterals skew funnier than the direct line —');
const directAvg = avg(PERS.list.filter(function (x) { return x.direct; }).map(function (x) { return x.levity; }));
const collatAvg = avg(PERS.list.filter(function (x) { return !x.direct; }).map(function (x) { return x.levity; }));
check('collateral levity (' + collatAvg.toFixed(2) + ') > direct-line levity (' + directAvg.toFixed(2) + ')', collatAvg > directAvg);

function avg(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }

console.log('\n— Engine: determinism (same seed ⇒ same world) —');
const clk = new Date(2026, 5, 6, 9, 0, 0); // 9am local → morning
const w1 = ENG.createWorld({ year: 1845, seed: 7, simDate: new Date(1845, 5, 15), realClock: clk });
const w2 = ENG.createWorld({ year: 1845, seed: 7, simDate: new Date(1845, 5, 15), realClock: clk });
check('two worlds, identical seed/date/clock ⇒ byte-identical snapshot', JSON.stringify(w1.snapshot()) === JSON.stringify(w2.snapshot()));

console.log('\n— Engine: no future leak in any spoken or reflected line —');
function speakerOK(spId, nodeId) {
  const node = MEM.byId[nodeId]; if (!node) return false;
  const p = data.people[spId]; const horizon = Hh.lifeYearOf(p);
  if (node.generation != null && node.generation > p.generation + 1) return false;
  if (node.year != null && node.year > horizon) return false;
  return true;
}
const scenarios = [
  { y: 1640, sd: new Date(1640, 9, 3) }, { y: 1722, sd: new Date(1722, 2, 9) },
  { y: 1845, sd: new Date(1845, 5, 15) }, { y: 1863, sd: new Date(1863, 6, 4) },
  { y: 1935, sd: new Date(1935, 11, 25) },
];
const hours = [6, 9, 13, 16, 18, 23];
let utterChecked = 0, leak = 0, comicSeen = false, churchSeen = false;
scenarios.forEach(function (sc) {
  hours.forEach(function (h) {
    const w = ENG.createWorld({ year: sc.y, seed: 3, simDate: sc.sd, realClock: new Date(2026, 5, 6, h, 0, 0) });
    const s = w.snapshot();
    s.agents.forEach(function (a) {
      if (a.kind === 'comic') comicSeen = true;
      if (a.kind === 'sabbath') churchSeen = true;
      if (a.reflection) a.reflection.sources.forEach(function (id) { utterChecked++; if (!speakerOK(a.id, id)) leak++; });
    });
    if (s.encounter) s.encounter.lines.forEach(function (l) {
      (l.sources || []).forEach(function (id) { utterChecked++; if (!speakerOK(l.speaker, id)) leak++; });
    });
  });
});
check('every spoken/reflected source is within the speaker’s horizon (' + utterChecked + ' checked)', leak === 0);

console.log('\n— Engine: only the living are present —');
const present1845 = ENG.activeAt(data, 1845);
check('activeAt(1845) returns only people alive that year (' + present1845.length + ')', present1845.every(function (id) {
  const p = data.people[id]; const b = Hh.birthYearOf(p); let d = Hh.deathYearOf(p); if (d == null) d = b + 70;
  return b <= 1845 && 1845 <= d;
}));
check('Ransom Sr. is present in 1845; Thomas Sr. (d.1651) is not',
  present1845.indexOf('ransom-sr') !== -1 && present1845.indexOf('thomas-sr') === -1);

console.log('\n— Engine: Sunday worship, season-true weather, real-time day/night —');
let sunday = new Date(1845, 5, 1); while (sunday.getDay() !== 0) sunday = new Date(sunday.getTime() + 86400000);
const wSun = ENG.createWorld({ year: 1845, seed: 1, simDate: sunday, realClock: new Date(2026, 5, 6, 9, 0, 0) });
const sSun = wSun.snapshot();
check('on a Sunday morning, someone is at worship', sSun.agents.some(function (a) { return a.kind === 'sabbath'; }));
check('summer date ⇒ no winter frost/snow in the weather', wSun.env.season === 'summer' && !/frost|snow/i.test(wSun.env.weather.label));
check('9am real clock ⇒ morning, not night', wSun.env.timeOfDay.phase === 'morning' && wSun.env.timeOfDay.isNight === false);
const wNight = ENG.createWorld({ year: 1845, seed: 1, simDate: sunday, realClock: new Date(2026, 5, 6, 23, 0, 0) });
check('11pm real clock ⇒ night', wNight.refreshEnv().timeOfDay.isNight === true);
check('humor surfaces and Church appears across the week', comicSeen && churchSeen);

console.log('\n— Hero personas: authored depth, facts intact —');
check('Thomas is a hero with an epithet', PERS.byId['thomas-sr'].hero === true && /Crossing/i.test(PERS.byId['thomas-sr'].epithet || ''));
check('hero overlay leaves the audited facts untouched', PERS.byId['thomas-sr'].provenance.knownFacts.length === (data.people['thomas-sr'].sources || []).length);
check('a sparse collateral gets no hero overlay & stays reconstructed', !PERS.byId['speckled-bill'].hero && PERS.byId['speckled-bill'].provenance.reconstructed === true);
const heroes = PERS.list.filter(function (p) { return p.hero; });
check('the anchor personas are deepened (' + heroes.length + ' heroes; each has drive + >=2 sayings + >=3 abilities)',
  heroes.length >= 9 && heroes.every(function (h) { return h.drive && h.wisdom.length >= 2 && h.abilities.length >= 3; }));

console.log('\n— Georgia chapter (the GA timeline step) —');
check('the Georgia-years memory exists at gen 6', MEM.nodes.some(function (n) { return /Georgia|Glynn/i.test(n.text) && n.generation === 6; }));
const rs = MEM.access('ransom-sr');
check('Ransom Sr. (gen 6) can see the Georgia chapter', rs.generational.concat(rs.family).some(function (n) { return /Georgia|Glynn/i.test(n.text); }));
const ts2 = MEM.access('thomas-sr');
check('Thomas (gen 1) cannot see the Georgia chapter (horizon)', !ts2.generational.concat(ts2.family).some(function (n) { return /Georgia|Glynn/i.test(n.text); }));

console.log('\n— Contributions: user / AI-consensus memories wire into the graph —');
const ransomContribs = (MEM.byOwner['ransom-sr'] || []).filter(function (n) { return n.tags && n.tags.indexOf('ai-consensus') !== -1; });
check('a saved consensus finding is ingested at build (' + ransomContribs.length + ')', ransomContribs.length >= 1);
check('it is visible in Ransom\'s own enclave', MEM.access('ransom-sr').individual.some(function (n) { return n.tags && n.tags.indexOf('ai-consensus') !== -1; }));
check('contributions stay flagged (never confirmed)', ransomContribs.every(function (n) { return n.evidence !== 'confirmed'; }));
const liveAdd = MEM.addUserMemory({ personId: 'thomas-sr', text: 'Live-added oral history note.', evidence: 'possible', source: 'oral history', when: 2 });
check('addUserMemory() appends live and becomes accessible', !!liveAdd && MEM.access('thomas-sr').individual.some(function (n) { return n.id === liveAdd.id; }));
check('one persona cannot see another\'s private contribution', !MEM.access('thomas-sr').individual.some(function (n) { return n.ownerId === 'ransom-sr'; }));

console.log('\n' + (failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)') + '\n');
process.exit(failures === 0 ? 0 : 1);
