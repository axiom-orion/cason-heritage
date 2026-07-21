#!/usr/bin/env node
/* Onboarding CLI: a family's GEDCOM export -> CASON_DATA.
   Usage:
     node scripts/gedcom-import.js <file.ged>              # inspect (JSON + stats)
     node scripts/gedcom-import.js <file.ged> --data-js    # emit a data.js drop-in
   The emitted people plug straight into the governed engine (horizon,
   kinship, personas, review gate) unchanged -- the trust layer is
   family-agnostic. */
'use strict';
var fs = require('fs');
var path = require('path');
var G = require(path.join(__dirname, '..', 'ui_kits', 'living-line', 'gedcom-import.js'));

var file = process.argv[2];
if (!file) { console.error('usage: node scripts/gedcom-import.js <file.ged> [--data-js]'); process.exit(1); }

var text;
try { text = fs.readFileSync(file, 'utf8'); }
catch (e) { console.error('Could not read ' + file + ': ' + (e && e.message || e)); process.exit(1); }

var out = G.parse(text);
console.error('Imported ' + out.stats.people + ' people, ' + out.stats.families + ' families, ' +
  out.stats.generations + ' generations, ' + out.stats.withBirthYear + ' with a birth year. ' +
  'All tiered `possible` (unverified) until sources are attached.');

if (process.argv.indexOf('--data-js') !== -1) {
  process.stdout.write('/* Imported from ' + path.basename(file) + ' via scripts/gedcom-import.js. Review before trusting. */\n');
  process.stdout.write('window.CASON_DATA = ' + JSON.stringify({ people: out.people, eras: [], directLine: [] }, null, 2) + ';\n');
} else {
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}
