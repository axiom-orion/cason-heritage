#!/usr/bin/env node
/* Selftest for confirmed-slot conflict detection.

   The case that matters is the real one: on 2026-07-27 a model was handed
   `Phoebe Munden [confirmed]` as James Green Cason's parent and answered that
   his mother was Elizabeth Green. The run reported `0 caught`. */
'use strict';

const path = require('path');
const SC = require(path.join(__dirname, '..', 'ui_kits', 'living-line', 'slot-conflict.js'));

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}

// James Green Cason as the graph actually holds him.
const KIN = {
  self: { name: 'James Green Cason' },
  parents: [{ name: 'Ransom Cason Sr.', evidence: 'confirmed' }, { name: 'Phoebe Munden', evidence: 'confirmed' }],
  children: [{ name: 'Lt. Ransom Cason "2"', evidence: 'confirmed' }],
  spouses: [{ name: 'Lucinda "Lucy" Barrow', evidence: 'secondary' }],
  siblings: [],
};

console.log('\nConfirmed-slot conflict\n');

/* ---- the regression ---- */
const REAL = 'Gemini asserts that a North Carolina Marriage Bond (Ransom Cason x Elizabeth Green, ' +
  '17 Dec 1787, Pitt Co., NC) definitively identifies Elizabeth Green as James Green Cason mother. ' +
  'Neither Claude nor Grok corroborates the existence of these documents.';
const hits = SC.detect(REAL, KIN);
ok('regression: the Elizabeth Green claim is caught', hits.length > 0, 'got ' + hits.length);
ok('regression: the invented name is identified', hits.length && hits[0].claimed === 'Elizabeth Green');
ok('regression: the role is identified', hits.length && hits[0].role === 'mother');
ok('regression: the contradicted slot is named', hits.length && hits[0].slot === 'parents');
ok('regression: the confirmed fillers are reported',
  hits.length && hits[0].confirmed.indexOf('Phoebe Munden') !== -1);
ok('regression: the matched sentence is quoted for review',
  hits.length && /Elizabeth Green/.test(hits[0].sentence));
ok('regression: the verdict names both sides',
  /Elizabeth Green/.test(SC.verdictFor(hits)) && /Phoebe Munden/.test(SC.verdictFor(hits)));

/* ---- must NOT fire ---- */
ok('clean: naming the graph’s own confirmed parent is not a conflict',
  SC.detect('His mother was Phoebe Munden, per the family record.', KIN).length === 0);
ok('clean: a formal variant of a known name is the same person',
  SC.detect('His father was Ransom Cason, of Alachua County.', KIN).length === 0);
ok('clean: naming a known person in another role is not an invention',
  SC.detect('His mother was Lucinda "Lucy" Barrow.', KIN).length === 0);
ok('clean: an unfilled slot cannot be contradicted',
  SC.detect('His mother was Elizabeth Green.', { self: KIN.self, parents: [], children: [], spouses: [], siblings: [] }).length === 0);
ok('clean: a slot with no CONFIRMED entry is research, not conflict',
  SC.detect('His wife was Sarah Fielding.', KIN).length === 0);
ok('clean: a non-name after the role word is ignored',
  SC.detect('His mother was unknown to the record. The mother of the line is not proven.', KIN).length === 0);
ok('clean: empty input is safe', SC.detect('', KIN).length === 0 && SC.detect('x', null).length === 0);

/* ---- surname sharing must not mask an invention ---- */
ok('names: a shared surname is NOT the same person',
  SC.sameName('Elizabeth Green', 'James Green Cason') === false);
ok('names: a formal suffix still matches', SC.sameName('Ransom Cason Sr.', 'Ransom Cason') === true);
ok('names: case and punctuation are ignored', SC.sameName('phoebe  munden', 'Phoebe Munden') === true);
ok('names: different people do not match', SC.sameName('Phoebe Munden', 'Ann Munden') === false);

/* ---- other phrasings ---- */
ok('phrasing: "X, his mother" is caught',
  SC.detect('The bond names Elizabeth Green, his mother, as a party.', KIN).length > 0);
ok('phrasing: "married X" against a confirmed spouse slot',
  SC.detect('He married Sarah Fielding in 1820.', {
    self: KIN.self, parents: [], children: [],
    spouses: [{ name: 'Lucinda Barrow', evidence: 'confirmed' }], siblings: [],
  }).length > 0);
ok('dedupe: the same claim matched twice is reported once',
  SC.detect('His mother was Elizabeth Green. Elizabeth Green, his mother, appears again.', KIN).length === 1);

console.log('\n' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail ? 1 : 0);
