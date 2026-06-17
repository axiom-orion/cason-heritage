/* ============================================================
   BASIS self-test  (run under Node)
     node ui_kits/living-line/basis.selftest.js
   ------------------------------------------------------------
   The §11-3 ladder, as assertions: privilege nesting, T5's non-nested
   separation-of-duties branch, the agent ceiling at T5, and the live agents.js
   roster auditing clean with its top tier provably unoccupied.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const path = require('path');
const B = require('./basis.js');
const AGENTS = require('./agents.js');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

console.log('BASIS self-test\n');

/* 1. the ladder is well-formed */
['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].forEach(function (t, i) {
  ok('tier present + ranked: ' + t, B.TIERS[t] && B.TIERS[t].rank === i + 1);
});
ok('T5 is the non-nested oversight branch', B.TIERS.T5.nests === false);
ok('the agent ceiling is T5', B.MAX_AGENT_TIER === 'T5');

/* 2. nesting: T1–T4 and T6–T7 nest; T5 is exact-match only */
ok('T4 permits a T2 staging write (nests down)', B.permits('T4', 'T2'));
ok('T2 does NOT permit a T4 canonical proposal', !B.permits('T2', 'T4'));
ok('T7 permits everything on the nesting ladder', B.permits('T7', 'T4') && B.permits('T7', 'T1'));
ok('T5 oversight neither grants nor is granted by the ladder', !B.permits('T5', 'T4') && !B.permits('T4', 'T5'));
ok('T5 permits exactly T5 (separation of duties)', B.permits('T5', 'T5'));
ok('an unknown tier permits nothing', !B.permits('T9', 'T1') && !B.permits('T1', 'T9'));

/* 3. the autonomy vocabulary maps onto the ladder */
ok('advises → T1', B.tierOfAutonomy('advises') === 'T1');
ok('proposes → T4', B.tierOfAutonomy('proposes') === 'T4');
ok('acts-bounded → T5 (oversight)', B.tierOfAutonomy('acts-bounded') === 'T5');
ok('cross-cutting → T1 (resilience posture, not a write privilege)', B.tierOfAutonomy('cross-cutting') === 'T1');
ok('an unknown autonomy → null', B.tierOfAutonomy('autonomous-write') === null);

/* 4. the LIVE roster audits clean, and its top tier is provably unoccupied */
const audit = B.auditRoster(AGENTS.agents);
ok('the live agents.js roster is BASIS-consistent', audit.ok);
if (!audit.ok) audit.findings.forEach(function (f) { console.log('      ! ' + f.agent + ': ' + f.issue); });
ok('every live agent maps to a known tier', AGENTS.agents.every(function (a) { return audit.tiers[a.id]; }));
ok('the top tier (T6 human / T7 reserved) is unoccupied by any agent', B.topTierUnoccupied(AGENTS.agents));
ok('no agent exceeds the T5 ceiling', AGENTS.agents.every(function (a) { return B.tierRank(audit.tiers[a.id]) <= B.tierRank(B.MAX_AGENT_TIER); }));

/* 5. a planted T7 agent is caught (the audit actually bites) */
const planted = AGENTS.agents.concat([{ id: 'rogue', name: 'Rogue', autonomy: 'autonomous-write' }]);
ok('an agent with an off-ladder autonomy is flagged', !B.auditRoster(planted).ok);

/* 6. the module loads from its canonical path (sibling of governance.js) */
ok('basis.js sits beside governance.js in living-line', require('fs').existsSync(path.join(__dirname, 'governance.js')));

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
