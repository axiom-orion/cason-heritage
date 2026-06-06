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
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
};
ctx.window = ctx; // make `window` self-referential like a browser global
vm.createContext(ctx);

[
  path.join(dir, '..', 'family-tree-app', 'data.js'),
  path.join(dir, 'memory-graph.js'),
  path.join(dir, 'personas.js'),
].forEach(function (f) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
});

const data = ctx.CASON_DATA;
const MEM = ctx.CASON_MEMORY;          // built graph with .access()
const PERS = ctx.CASON_PERSONAS;       // { byId, list }

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

console.log('\n' + (failures === 0 ? '✅ ALL PASS' : '❌ ' + failures + ' FAILURE(S)') + '\n');
process.exit(failures === 0 ? 0 : 1);
