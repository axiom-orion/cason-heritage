/* ============================================================
   The Living Line — Kinship resolver self-test  (run under Node)
     node ui_kits/living-line/kinship.selftest.js
   ------------------------------------------------------------
   Loads the REAL data.js + kinship.js in a browser-like vm and
   asserts the load-bearing invariants of the relation resolver:
     1. Neutral traversals are exact against the curated edges.
     2. The `<relation> of <Name>` parser fires (and only on kin
        headwords).
     3. Gendered relations degrade HONESTLY (sexUnresolved) rather
        than guessing sex — no sex field exists in the data yet.
     4. The eliminated-kin conflict set is high-precision: it catches
        a ruled-out ancestor by its distinctive name, and does NOT
        snag a real living-line person who merely shares a surname.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const dir = __dirname;
const ctx = { console: console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
ctx.window = ctx;
vm.createContext(ctx);
[path.join(dir, '..', 'family-tree-app', 'data.js'), path.join(dir, 'kinship.js')]
  .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });

const KIN = ctx.CASON_KINSHIP;
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }
function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const s = {}; a.forEach(function (x) { s[x] = 1; });
  return b.every(function (x) { return s[x]; });
}

console.log('Kinship resolver self-test\n');

if (!KIN) { console.log('  ✗ CASON_KINSHIP did not initialize'); process.exit(1); }

/* 1. neutral traversals — exact against curated edges */
ok("parents(ransom-sr) = [james-1727]", sameSet(KIN.parents('ransom-sr'), ['james-1727']));
ok("spouse(ransom-sr) = [phoebe-munden]", sameSet(KIN.spouses('ransom-sr'), ['phoebe-munden']));
ok("children(james-1727) includes ransom-sr", KIN.children('james-1727').indexOf('ransom-sr') !== -1);
ok("grandparents(ransom-sr) = [william-1695, jane-cannon]",
  sameSet(KIN.resolveFor('ransom-sr', 'grandparents').targetIds, ['william-1695', 'jane-cannon']));
ok("siblings(william-1695) = the five other children of James the Orphan",
  sameSet(KIN.siblings('william-1695'), ['susannah', 'thomas-3', 'james-jr-1690', 'elizabeth', 'dynah']));

/* 2. parser fires on a kin headword + unique name, and not on a non-kin headword */
const husband = KIN.resolve('the husband of Phoebe Munden');
ok("parse 'husband of Phoebe Munden' -> ransom-sr", !!husband && husband.targetIds.indexOf('ransom-sr') !== -1);
const gps = KIN.resolve('grandparents of Ransom Cason Sr.');
ok("parse 'grandparents of Ransom Cason Sr.' fires", !!gps && sameSet(gps.targetIds, ['william-1695', 'jane-cannon']));
ok("non-kin headword 'household of Phoebe Munden' does NOT fire", KIN.resolve('the household of Phoebe Munden') === null);

/* 3. honest sex degradation — no sex field exists, so gendered relations
      return the neutral set AND raise sexUnresolved (never guess sex) */
const gf = KIN.resolveFor('ransom-sr', 'grandfather');
ok("grandfather(ransom-sr) flags sexUnresolved (no sex data)", gf.sexUnresolved === true);
ok("grandfather(ransom-sr) returns both grandparents rather than guessing",
  sameSet(gf.targetIds, ['william-1695', 'jane-cannon']));
ok("neutral grandparents() does NOT flag sexUnresolved",
  KIN.resolveFor('ransom-sr', 'grandparents').sexUnresolved === false);

/* 4. eliminated-kin conflict set — high precision */
const elim = KIN.eliminatedKin();
const cannon = elim.filter(function (e) { return e.id === 'cannon-sr'; })[0];
ok("eliminatedKin() includes Cannon Cason Sr. (ruled out as Ransom's father)", !!cannon);
ok("its matcher catches the ruled-out ancestor in a free-text answer",
  !!cannon && cannon.pattern.test("The records suggest Ransom's father was Cannon Cason Sr. of Pitt County."));
ok("eliminatedKin() does NOT snag William Cason (gen-4, a real ancestor)",
  elim.every(function (e) { return e.id !== 'william-1695'; }));

/* 5. unknown anchor resolves cleanly to nothing */
ok("resolveFor(unknown id) does not fire", KIN.resolveFor('nobody-123', 'parents').fired === false);

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
