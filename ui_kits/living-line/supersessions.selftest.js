/* ============================================================
   The Living Line — Supersession ledger self-test  (run under Node)
     node ui_kits/living-line/supersessions.selftest.js
   ------------------------------------------------------------
   The honesty guard for the supersession ledger: it may ONLY formalize
   corrections the family already documented in data.js. This test proves it:
     1. Every record's subject is a real person.
     2. Every record's `match` is found in that subject's own documented
        text (notes/narrative) or the family note — i.e. the correction is
        already written down; the ledger merely structures it.
     3. A name correction's `current` equals the person's data.js name.
     4. The guard has teeth: a fabricated, undocumented correction
        ("Steeple Morden") is NOT groundable and would be rejected.
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
[path.join(dir, '..', 'family-tree-app', 'data.js'), path.join(dir, 'supersessions.js')]
  .forEach(function (f) { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); });

const DATA = ctx.CASON_DATA;
const SUP = ctx.CASON_SUPERSESSIONS;
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('Supersession ledger self-test\n');
if (!DATA || !SUP) { console.log('  ✗ modules did not initialize'); process.exit(1); }

const familyNotes = (DATA.family && DATA.family.notes) || '';
// the documented text a correction must be grounded in.
function groundText(id) {
  const p = DATA.people[id] || {};
  return [p.notes, p.narrative, p.role].filter(Boolean).join(' \n ') + ' \n ' + familyNotes;
}
function grounded(rec) { return rec.match.test(groundText(rec.subject)); }

ok('the ledger has records', SUP.all().length > 0);
ok('every record subject is a real person in data.js', SUP.all().every(function (r) { return !!DATA.people[r.subject]; }));
ok('every record is GROUNDED — its match is found in the subject’s documented text', SUP.all().every(grounded));
ok('every record has a status of disproven or eliminated', SUP.all().every(function (r) { return r.status === 'disproven' || r.status === 'eliminated'; }));

/* name correction is consistent with the live record */
const nameRec = SUP.find('elizabeth-keeling-leighton', 'name')[0];
ok('the name correction’s `current` equals the person’s data.js name', !!nameRec && DATA.people['elizabeth-keeling-leighton'].name === nameRec.current);
ok('...and its superseded value (Elizabeth Alcott) is NOT the current name', !!nameRec && DATA.people['elizabeth-keeling-leighton'].name !== nameRec.superseded);

/* API */
ok('current(thomas-sr, origin) returns the standing value', /unproven/i.test(SUP.current('thomas-sr', 'origin') || ''));
ok('superseded(thomas-sr, father) returns the inactive value', (SUP.superseded('thomas-sr', 'father')[0] || '').indexOf('John Cason') !== -1);
ok('values() exposes each superseded value with a matcher (for the gate)', SUP.values().length === SUP.all().length && SUP.values().every(function (v) { return v.match && typeof v.match.test === 'function'; }));

/* the guard has teeth — an undocumented correction cannot be grounded */
ok('a fabricated "Steeple Morden" correction is NOT groundable (guard works)', grounded({ subject: 'thomas-sr', match: /steeple morden/i }) === false);

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
