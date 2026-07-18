/* ============================================================
   Corpus / silo auditor self-test  (run under Node)
     node scripts/corpus-audit.selftest.js
   ------------------------------------------------------------
   Tests the audit's LOGIC on SYNTHETIC in-memory fixtures, NOT the live repo
   files -- so it stays green as we FIX index.html (the live audit reporting a
   banned claim is the expected, correct signal, not a test failure).

   Asserts the three checks are honest:
     (a) scanBanned flags a narrative that names a quarantined claim;
     (b) placeSilo detects a place present in the narrative but missing from the
         record, and (informational) a record place not mentioned in narrative;
     (c) personSilo flags a Cason name with no matching record person;
     (d) a CLEAN fixture yields ZERO findings across every check.
   Exit 0 = all pass.
   ============================================================ */
'use strict';
var CA = require('./corpus-audit.js');

var pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ok  ' + name); } else { fail++; console.log('  XX  ' + name); } }

console.log('Corpus / silo auditor self-test\n');

/* ---- (a) Check 1: scanBanned flags a disproven claim in a fake narrative ---- */
var dirtyLines = [
  '<p>Thomas settled in Lynnhaven Parish and prospered.</p>',                 // 1 - clean
  '<p>He married Elizabeth Alcott around 1635 and became Church Warden.</p>', // 2 - TWO banned terms, one line (first match reported)
  '<p>The origin at Digswell, Hertfordshire is where it began.</p>',         // 3 - banned
  '<p>A perfectly ordinary line about tobacco.</p>',                          // 4 - clean
];
var bannedHits = CA.scanBanned('fake.html', dirtyLines);
ok('scanBanned flags "Elizabeth Alcott"', bannedHits.some(function (h) { return h.line === 2 && /elizabeth alcott/i.test(h.term); }));
ok('scanBanned flags "Digswell" on the right (1-based) line', bannedHits.some(function (h) { return h.line === 3 && /digswell/i.test(h.term); }));
ok('scanBanned reports file + snippet', bannedHits.length >= 2 && bannedHits[0].file === 'fake.html' && typeof bannedHits[0].snippet === 'string' && bannedHits[0].snippet.length > 0);

var cleanLines = ['<p>Thomas Casson, headright of Capt. Harwood, 1635 patent.</p>', '<p>Lynnhaven Parish planter. Estate: 28,170 lbs tobacco.</p>'];
ok('scanBanned finds nothing in a clean narrative', CA.scanBanned('clean.html', cleanLines).length === 0);

/* ---- (b) Check 2: placeSilo detects a narrative place missing from the record ---- */
var recordPlaces = [
  'Nassau County, Florida (first FL stop, c.1823)',
  'Newnansville, Alachua Co., FL',
  'Titusville, Brevard Co., FL',
];
// Narrative names Nassau (present in record) AND Cawston (a place the record does NOT carry).
var narrativeTitles = ['Nassau County, FL', 'Cawston, Norfolk, England'];
var narrativeCorpus = 'Nassau and Cawston are named here, and so is Newnansville. The last stop is unnamed.';
var silo = CA.placeSilo(recordPlaces, narrativeTitles, narrativeCorpus);
ok('placeSilo flags a narrative place MISSING from the record (Cawston)',
  silo.missingFromRecord.some(function (t) { return /cawston/i.test(t); }));
ok('placeSilo does NOT flag a narrative place that IS in the record (Nassau)',
  !silo.missingFromRecord.some(function (t) { return /nassau/i.test(t); }));
ok('placeSilo reports a record place not mentioned in the narrative (Titusville)',
  silo.notInNarrative.some(function (l) { return /titusville/i.test(l); }));
ok('placeSilo does NOT report a record place that IS mentioned (Newnansville)',
  !silo.notInNarrative.some(function (l) { return /newnansville/i.test(l); }));

// extractNarrativeTitles pulls title: "..." values from a directLine-style array.
var arrText = 'const directLine = [\n' +
  '  { lat: 1, lng: 2, title: "Digswell, Hertfordshire, England", date: "1608" },\n' +
  "  { lat: 3, lng: 4, title: 'Titusville, Brevard Co., FL', date: '1957' }\n" +
  '];';
var titles = CA.extractNarrativeTitles(arrText);
ok('extractNarrativeTitles pulls both double- and single-quoted titles',
  titles.indexOf('Digswell, Hertfordshire, England') !== -1 && titles.indexOf('Titusville, Brevard Co., FL') !== -1);

/* ---- (c) Check 3: personSilo flags a Cason name with no record person ---- */
var recordNames = ['Thomas Casson', 'Ransom Cason Sr.', 'William Cason'];
var narrNames = CA.extractCasonNames('Ransom Cason moved south. Later, Zebadiah Cason appears in a derivative tree.');
ok('extractCasonNames collects "<Given> Cason" names', narrNames.indexOf('Ransom Cason') !== -1 && narrNames.indexOf('Zebadiah Cason') !== -1);
var persons = CA.personSilo(narrNames, recordNames);
ok('personSilo flags a Cason name with NO matching record person (Zebadiah)',
  persons.unmatched.some(function (n) { return /zebadiah/i.test(n); }));
ok('personSilo does NOT flag a Cason name that matches a record person (Ransom)',
  !persons.unmatched.some(function (n) { return /ransom/i.test(n); }));

/* ---- (d) a fully CLEAN fixture yields zero findings across every check ---- */
var cleanData = {
  people: { r: { name: 'Ransom Cason Sr.' }, t: { name: 'Thomas Casson' } },
  places: [{ label: 'Newnansville, Alachua Co., FL' }, { label: 'Titusville, Brevard Co., FL' }],
};
var cleanNarratives = [{
  name: 'clean.html',
  text: 'A story of Ransom Cason at Newnansville and Titusville. No disproven claims here. ' +
        'const directLine = [{ lat: 1, lng: 2, title: "Newnansville, Alachua Co., FL" }, ' +
        '{ lat: 3, lng: 4, title: "Titusville, Brevard Co., FL" }];',
}];
var cleanRes = CA.runAudit(cleanData, cleanNarratives);
ok('clean fixture: zero banned claims', cleanRes.counts.banned === 0);
ok('clean fixture: zero places missing from record', cleanRes.counts.placesMissingFromRecord === 0);
ok('clean fixture: zero record places unmentioned', cleanRes.counts.placesNotInNarrative === 0);
ok('clean fixture: zero unmatched persons', cleanRes.counts.personsUnmatched === 0);

/* ---- runAudit wiring on a DIRTY fixture: banned drives the fatal count ---- */
var dirtyNarratives = [{
  name: 'dirty.html',
  text: 'He married Elizabeth Alcott and became Church Warden at Digswell.\n' +
        'const directLine = [{ lat: 1, lng: 2, title: "Cawston, Norfolk, England" }];',
}];
var dirtyRes = CA.runAudit(cleanData, dirtyNarratives);
ok('dirty fixture: banned claims counted (fatal signal > 0)', dirtyRes.counts.banned >= 1);
ok('dirty fixture: report renders the HIGH banned finding', /HIGH/.test(CA.report(dirtyRes, dirtyNarratives)) && dirtyRes.banned[0].file === 'dirty.html');

console.log('\n' + pass + ' passed, ' + fail + ' failed.');
process.exit(fail ? 1 : 0);
