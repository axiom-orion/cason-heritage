/* ============================================================
   Self-test for family-store.js  (node ui_kits/living-line/family-store.selftest.js)
   ------------------------------------------------------------
   Proves local persistence round-trips and degrades gracefully:
     - save then load returns the same family (name + gedcom);
     - has() reflects presence; clear() removes it;
     - a quota-exceeded save returns { ok:false, reason:'too-large' }
       (the session still works, it just isn't persisted).
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

var store = {};
global.localStorage = {
  getItem: function (k) { return k in store ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; },
};
global.window = global;
var F = require('./family-store.js');

var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

/* ---- 1: round-trip ---- */
ok(F.has() === false, 'nothing saved to begin with');
var r = F.save('The Reed Line', '0 @I1@ INDI\n1 NAME Amos /Reed/');
ok(r.ok === true, 'save succeeds');
ok(F.has() === true, 'has() is true after save');
var got = F.load();
ok(got && got.name === 'The Reed Line' && /Amos \/Reed\//.test(got.gedcom), 'load returns the saved family');
ok(typeof got.savedAt === 'number', 'a savedAt timestamp is recorded');

/* ---- 2: clear ---- */
F.clear();
ok(F.has() === false && F.load() === null, 'clear removes the saved family');

/* ---- 3: quota is handled gracefully (session survives, just not saved) ---- */
var realSet = global.localStorage.setItem;
global.localStorage.setItem = function () { var e = new Error('exceeded'); e.name = 'QuotaExceededError'; throw e; };
var big = F.save('Huge Tree', 'x');
ok(big.ok === false && big.reason === 'too-large', 'over-quota save reports too-large, does not throw');
global.localStorage.setItem = realSet;

/* ---- summary ---- */
if (fails.length) { console.error('family-store selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('family-store selftest OK: save/load round-trip, has/clear, and graceful quota handling.');
process.exit(0);
