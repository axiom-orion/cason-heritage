/* ============================================================
   Self-test for the encounter memory-gate (node ui_kits/living-line/encounter-gate.selftest.js)
   ------------------------------------------------------------
   The scope gate in accessibleSubgraph unlocks another person's PRIVATE
   (individual-scope) memory only to someone who KNEW them. This proves the
   wiring that finally populates that gate:
     - knownPeersOf lists a person's bidirectional immediate kin;
     - WITHOUT the unlock, a spouse's private memory is sealed;
     - WITH includeKin (or an explicit knownPeers), it surfaces;
     - a NON-kin stranger stays sealed (the unlock is not "see everyone");
     - peer memory is STILL horizon-bounded — a spouse recalls only what
       fell within their own lifetime (Georgia can't recall Thadeous's 1857
       birth-year record before 1857).
   Thadeous <-> Georgia are linked spouses in data.js.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

global.window = global;
require('../family-tree-app/data.js');
require('./memory-graph.js');
var G = global.CASON_MEMORY;
var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }
function owned(sub, id) { return sub.individual.filter(function (n) { return n.ownerId === id; }).length; }

/* ---- 1: knownPeersOf is bidirectional immediate kin ---- */
var peers = G.knownPeersOf('georgia-mckinney');
ok(peers.indexOf('thadeous') !== -1, "knownPeersOf(Georgia) includes her spouse Thadeous (got: " + peers.join(', ') + ')');
ok(peers.indexOf('carl-columbus') !== -1, 'knownPeersOf(Georgia) includes her child Carl (inverse link)');

/* ---- 2: WITHOUT the unlock, a spouse's private memory is sealed ---- */
var base = G.access('georgia-mckinney');
ok(owned(base, 'thadeous') === 0, 'sealed: Georgia does NOT see Thadeous\'s private memory by default (got ' + owned(base, 'thadeous') + ')');
var ownBase = owned(base, 'georgia-mckinney');

/* ---- 3: WITH includeKin, the spouse's memory surfaces ---- */
var kin = G.access('georgia-mckinney', { includeKin: true });
ok(owned(kin, 'thadeous') > 0, 'includeKin: Georgia now recalls Thadeous\'s memory (got ' + owned(kin, 'thadeous') + ')');
ok(owned(kin, 'georgia-mckinney') >= ownBase, 'her own memory is unaffected by the unlock');

/* ---- 4: an explicit encounter (knownPeers) unlocks the same way ---- */
var expl = G.access('georgia-mckinney', { knownPeers: ['thadeous'] });
ok(owned(expl, 'thadeous') > 0, 'explicit knownPeers:[thadeous] unlocks his memory (the co-presence path)');

/* ---- 5: a NON-kin stranger stays sealed (unlock is not "see everyone") ---- */
ok(owned(kin, 'ransom-sr') === 0, 'includeKin does NOT open a non-kin ancestor (Ransom Sr. stays sealed)');

/* ---- 6: peer memory is STILL horizon-bounded ---- */
var early = G.access('georgia-mckinney', { includeKin: true, simNow: 1856 }); // before Thadeous's 1857 record
var later = G.access('georgia-mckinney', { includeKin: true, simNow: 1858 });
ok(owned(early, 'thadeous') < owned(later, 'thadeous'), 'peer memory obeys the viewer\'s horizon: sealed before its year, open after (' + owned(early, 'thadeous') + ' < ' + owned(later, 'thadeous') + ')');

/* ---- summary ---- */
if (fails.length) { console.error('encounter-gate selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('encounter-gate selftest OK: kin bidirectional, spouse memory sealed-then-unlocked (includeKin + knownPeers), strangers stay sealed, peer memory still horizon-bounded.');
process.exit(0);
