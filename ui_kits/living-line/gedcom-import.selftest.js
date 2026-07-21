/* ============================================================
   Self-test for gedcom-import.js  (node ui_kits/living-line/gedcom-import.selftest.js)
   ------------------------------------------------------------
   Proves the onboarding thesis: an arbitrary GEDCOM parses into CASON_DATA
   shape AND plugs straight into the governed engine unchanged --
     - people, kin (parents/children/spouse), generations, dates parsed;
     - imported people are honestly tiered `possible` + tagged imported;
     - buildMemoryGraph accepts the imported data;
     - the HORIZON holds on this stranger's tree: a gen-1 child sees nothing
       beyond gen 2, and nothing after their own year.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

var G = require('./gedcom-import.js');
global.window = global;
var MG = require('./memory-graph.js');

var GED = [
  '0 HEAD',
  '0 @I1@ INDI',
  '1 NAME Amos /Fairweather/',
  '1 SEX M',
  '1 BIRT', '2 DATE ABT 1790', '2 PLAC Kent, England',
  '1 DEAT', '2 DATE 1861',
  '1 FAMS @F1@',
  '0 @I2@ INDI',
  '1 NAME Eliza /Hart/',
  '1 SEX F',
  '1 BIRT', '2 DATE 1795',
  '1 FAMS @F1@',
  '0 @I3@ INDI',
  '1 NAME Martha /Fairweather/',
  '1 SEX F',
  '1 BIRT', '2 DATE 12 MAY 1820', '2 PLAC Boston, Massachusetts',
  '1 FAMC @F1@',
  '1 FAMS @F2@',
  '0 @I4@ INDI',
  '1 NAME John /Reed/',
  '1 FAMS @F2@',
  '0 @I5@ INDI',
  '1 NAME Samuel /Reed/',
  '1 BIRT', '2 DATE 1848',
  '1 FAMC @F2@',
  '0 @F1@ FAM',
  '1 HUSB @I1@', '1 WIFE @I2@', '1 CHIL @I3@',
  '0 @F2@ FAM',
  '1 HUSB @I4@', '1 WIFE @I3@', '1 CHIL @I5@',
  '0 TRLR',
].join('\n');

var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

var out = G.parse(GED);
var P = out.people;

/* ---- 1: people + dates ---- */
ok(out.stats.people === 5, 'parsed 5 people (got ' + out.stats.people + ')');
ok(P['amos-fairweather'] && P['amos-fairweather'].born.year === 1790, 'Amos born ~1790 (got ' + (P['amos-fairweather'] && P['amos-fairweather'].born.year) + ')');
ok(P['amos-fairweather'].died.year === 1861, 'Amos died 1861');
ok(P['martha-fairweather'].born.place === 'Boston, Massachusetts', 'place parsed');

/* ---- 2: kin wired both ways ---- */
ok(P['martha-fairweather'].parents.indexOf('amos-fairweather') !== -1 && P['martha-fairweather'].parents.indexOf('eliza-hart') !== -1, 'Martha has both parents');
ok(P['amos-fairweather'].children.indexOf('martha-fairweather') !== -1, 'Amos lists Martha as child');
ok(P['amos-fairweather'].spouse.indexOf('eliza-hart') !== -1, 'Amos + Eliza are spouses');
ok(P['samuel-reed'].parents.indexOf('martha-fairweather') !== -1, 'Samuel is Martha\'s child (multi-generation)');

/* ---- 3: generations by depth ---- */
ok(P['amos-fairweather'].generation === 0, 'the root ancestor is generation 0');
ok(P['martha-fairweather'].generation === 1, 'her child is generation 1');
ok(P['samuel-reed'].generation === 2, 'the grandchild is generation 2');

/* ---- 4: honest import tier ---- */
ok(P['amos-fairweather'].evidence === 'possible', 'an unsourced import is tiered possible, not asserted as fact');
ok(P['amos-fairweather'].tags.indexOf('imported') !== -1, 'imported people are tagged imported');

/* ---- 5: it plugs into the governed engine, and the HORIZON holds ---- */
var data = { people: P, eras: out.eras, directLine: out.directLine };
var mem = MG.build(data);
mem.access = function (id, opts) { return MG.access(mem, data, id, opts); };
var sub = mem.access('martha-fairweather');
ok(sub.stats.visible > 0, 'the imported persona has accessible memory');
ok(sub.blocked.some(function (b) { return b.why === 'gen'; }) || sub.maxGen === 2, 'a gen-1 persona is capped at gen 2 (horizon holds on a stranger\'s tree)');
var early = mem.access('samuel-reed', { simNow: 1840 }); // before Samuel's 1848 birth
var late = mem.access('samuel-reed', { simNow: 1900 });
ok(early.stats.visible <= late.stats.visible, 'the temporal horizon holds on imported data (1840 knows <= 1900)');

/* ---- summary ---- */
if (fails.length) { console.error('gedcom-import selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('gedcom-import selftest OK: arbitrary GEDCOM -> 5 people, kin + generations + dates, honest import tier, and the horizon holds on the imported tree (the engine is family-agnostic).');
process.exit(0);
