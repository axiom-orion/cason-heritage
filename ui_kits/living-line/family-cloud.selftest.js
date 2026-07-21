/* ============================================================
   Self-test for family-cloud.js  (node ui_kits/living-line/family-cloud.selftest.js)
   ------------------------------------------------------------
   Proves the local<->cloud reconciler (pickNewest) and graceful degradation:
     - cloud newer than local -> cloud wins; local newer -> local wins;
     - a tie goes to the cloud (the shared source of truth);
     - only-local or only-cloud is chosen; neither -> null;
     - configured() is false with no auth, and push/pull degrade (no throw).
   The Supabase calls themselves need a signed-in session (verified live,
   not here); this locks the decision logic that drives them.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
var C = require('./family-cloud.js');
var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

var LOCAL = { name: 'Local Line', gedcom: 'L', savedAt: 1000 };
var CLOUD_NEW = { name: 'Cloud Line', gedcom: 'C', updated_at: new Date(2000).toISOString() };
var CLOUD_OLD = { name: 'Cloud Line', gedcom: 'C', updated_at: new Date(500).toISOString() };

/* ---- pickNewest ---- */
ok(C.pickNewest(LOCAL, CLOUD_NEW).source === 'cloud', 'cloud newer than local -> cloud wins');
ok(C.pickNewest(LOCAL, CLOUD_OLD).source === 'local', 'local newer than cloud -> local wins');
var tie = { name: 'x', gedcom: 'x', savedAt: 1000 };
ok(C.pickNewest(tie, { updated_at: new Date(1000).toISOString() }).source === 'cloud', 'a tie goes to the cloud (shared source)');
ok(C.pickNewest(LOCAL, null).source === 'local', 'only local -> local');
ok(C.pickNewest(null, CLOUD_NEW).source === 'cloud', 'only cloud -> cloud');
ok(C.pickNewest(null, null) === null, 'neither -> null');
ok(C.pickNewest(LOCAL, CLOUD_NEW).gedcom === 'C' && C.pickNewest(LOCAL, CLOUD_NEW).name === 'Cloud Line', 'the winner carries its name + gedcom');

/* ---- graceful degradation with no auth ---- */
ok(C.configured() === false, 'not configured when CASON_AUTH is absent');
return C.push({ name: 'x', gedcom: 'x' }).then(function (r) {
  ok(r && r.ok === false, 'push degrades (no throw) without auth');
  return C.pull();
}).then(function (t) {
  ok(t === null, 'pull returns null without auth');
  if (fails.length) { console.error('family-cloud selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
  console.log('family-cloud selftest OK: pickNewest reconciler (cloud/local/tie/one-sided/none) + graceful degradation without auth.');
  process.exit(0);
});
