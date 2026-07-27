#!/usr/bin/env node
/* The Librarian's selftest. The thing worth testing here is not that it can
   recommend a book — it is that it refuses to pass off an invented one. */
'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./librarian.js');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}

console.log('\nThe Librarian\n');

/* ---- title normalization: the already-read filter depends on it ---- */
ok('norm: subtitle after a colon is ignored',
  L.norm('Atomic Habits: An Easy & Proven Way to Build Good Habits') === L.norm('Atomic Habits'));
ok('norm: leading article is ignored', L.norm('The Hypomanic Edge') === L.norm('Hypomanic Edge'));
ok('norm: intra-word punctuation is ignored', L.norm('Unfu*k Yourself') === L.norm('unfuk yourself'));
ok('norm: apostrophes are ignored', L.norm("Don't Look Away") === L.norm('Dont Look Away'));
ok('norm: genuinely different titles stay different',
  L.norm('Extreme Ownership') !== L.norm('The Dichotomy of Leadership'));

/* ---- author matching ---- */
ok('surname: honorific is stripped', L.surname('Dr. Joe Dispenza') === 'dispenza');
ok('surname: suffix is stripped', L.surname('Napoleon Hill Jr.') === 'hill');
ok('surname: first of a co-authored pair', L.surname('Jocko Willink & Leif Babin') === 'willink');
ok('surname: middle initial does not break it', L.surname('John C. Maxwell') === 'maxwell');
ok('surname: different authors do not collide', L.surname('Thomas Sowell') !== L.surname('Sean Carroll'));

/* ---- candidate parsing ---- */
ok('parse: fenced JSON', L.parseCandidates('```json\n[{"title":"A","author":"B","citation":"c"}]\n```').length === 1);
ok('parse: JSON buried in prose',
  L.parseCandidates('Sure!\n[{"title":"A","author":"B","citation":"c"}]\nHope that helps.').length === 1);
ok('parse: entries missing an author are dropped',
  L.parseCandidates('[{"title":"A"},{"title":"B","author":"C"}]').length === 1);
ok('parse: malformed JSON yields nothing rather than throwing',
  L.parseCandidates('[{"title": broken').length === 0);
ok('parse: status defaults to published when unstated',
  L.parseCandidates('[{"title":"A","author":"B"}]')[0].status === 'published');
ok('parse: forthcoming status is preserved',
  L.parseCandidates('[{"title":"A","author":"B","status":"forthcoming"}]')[0].status === 'forthcoming');

/* ---- score parsing ---- */
ok('parseScore: reads a clean object', L.parseScore('{"score":85,"citationSupports":true,"sourceType":"publisher"}').score === 85);
ok('parseScore: clamps above 100', L.parseScore('{"score":900,"citationSupports":true}').score === 100);
ok('parseScore: clamps below 0', L.parseScore('{"score":-5,"citationSupports":true}').score === 0);
ok('parseScore: garbage yields null, not a default pass', L.parseScore('I think it is probably real') === null);
ok('parseScore: a missing score yields null', L.parseScore('{"citationSupports":true}') === null);
ok('parseScore: citationSupports must be explicitly true',
  L.parseScore('{"score":90,"citationSupports":"yes"}').citationSupports === false);

/* ---- ADJUDICATION: the part where a bug lets a fabrication through ---- */
const strong = { score: 90, citationSupports: true, sourceType: 'publisher', reasoning: 'r', concerns: '' };
const weak = { score: 55, citationSupports: true, sourceType: 'publisher', reasoning: 'r', concerns: '' };
const vague = { score: 90, citationSupports: true, sourceType: 'vague', reasoning: 'r', concerns: '' };
const rejects = { score: 30, citationSupports: false, sourceType: 'news', reasoning: 'r', concerns: '' };
const present = { state: 'present', note: 'catalogue confirms title and author', year: 2025 };
const absent = { state: 'absent', note: 'no catalogue record for this title' };
const mismatch = { state: 'author-mismatch', note: 'catalogue has this title under Someone Else' };
const down = { state: 'unreachable', note: 'catalogue unreachable' };
const pub = function (c) { return { title: 't', author: 'a', status: 'published', citation: c === undefined ? 'a real citation' : c }; };
const fwd = function (c) { return { title: 't', author: 'a', status: 'forthcoming', citation: c === undefined ? 'a real citation' : c }; };

ok('adjudicate: no citation → uncited, never scored',
  L.adjudicate({ title: 't', author: 'a', status: 'published', citation: '' }, strong, present).tier === 'uncited');
ok('adjudicate: published + catalogue + strong score → verified',
  L.adjudicate(pub(), strong, present).tier === 'verified');
ok('adjudicate: published + NO catalogue record → unverified even with a 90 score',
  L.adjudicate(pub(), strong, absent).tier === 'unverified');
ok('adjudicate: forthcoming + no catalogue + strong score → attested (miss is expected)',
  L.adjudicate(fwd(), strong, absent).tier === 'attested');
ok('adjudicate: forthcoming is held to the HIGHER bar',
  L.adjudicate(fwd(), weak, absent).tier === 'unsupported');
ok('adjudicate: published passes at a score that would fail forthcoming',
  L.adjudicate(pub(), weak, present).tier === 'verified' && weak.score < L.SCORE_FORTHCOMING);
ok('adjudicate: a vague source is rejected however high the score',
  L.adjudicate(fwd(), vague, absent).tier === 'unsupported');
ok('adjudicate: reviewer rejecting the citation overrides a catalogue hit',
  L.adjudicate(pub(), rejects, present).tier === 'unsupported');
ok('adjudicate: author mismatch → conflict',
  L.adjudicate(pub(), strong, mismatch).tier === 'conflict');
ok('adjudicate: an unusable score is treated as unsupported, not assumed good',
  L.adjudicate(pub(), null, present).tier === 'unsupported');
ok('adjudicate: a catalogue outage cannot pass a supposedly-published title',
  L.adjudicate(pub(), strong, down).tier === 'unsupported');
ok('adjudicate: a catalogue outage does NOT block a well-cited forthcoming title',
  L.adjudicate(fwd(), strong, down).tier === 'attested');
ok('adjudicate: only verified and attested are in the passing set',
  L.PASSING.length === 2 && L.PASSING.indexOf('verified') !== -1 && L.PASSING.indexOf('attested') !== -1);
ok('adjudicate: the forthcoming bar is strictly higher than the published one',
  L.SCORE_FORTHCOMING > L.SCORE_PUBLISHED);

/* ---- rendering: a withheld item must never read as a recommendation ---- */
const mk = function (tier, note, extra) {
  return {
    date: '2026-07-27', profileSize: 27,
    items: [Object.assign({
      cand: { title: 'The Compounding Mind', author: 'Thomas Sowell', status: 'forthcoming', citation: 'vibes', why: 'plausible and invented' },
      check: { tier: tier, note: note, score: 30 },
      score: { score: 30, sourceType: 'vague', reasoning: 'could not substantiate', concerns: '' },
      decision: { decision: 'needs_approval', violations: [] },
    }, extra || {})],
  };
};
const outFab = L.render(mk('unsupported', 'citation rejected on review'));
ok('render: a withheld title is NOT under Proposed', outFab.indexOf('Nothing survived review') !== -1);
ok('render: a withheld title still appears, with its reason', outFab.indexOf('The Compounding Mind') !== -1 && outFab.indexOf('Withheld') !== -1);
ok('render: counts report 0 survived', outFab.indexOf('**0** survived review') !== -1);
ok('render: the three checks are described in the dossier',
  outFab.indexOf('Cited') !== -1 && outFab.indexOf('Scored') !== -1 && outFab.indexOf('Catalogued') !== -1);
ok('render: the dossier explains why a catalogue miss is not damning for forthcoming titles',
  outFab.indexOf('expected* for a genuinely forthcoming') !== -1);

const outReal = L.render(mk('attested', 'forthcoming; citation survived hostile review at 82/100 (publisher)'));
ok('render: an attested title IS proposed', outReal.indexOf('### The Compounding Mind') !== -1);
ok('render: the citation offered is shown for scrutiny', outReal.indexOf('Citation offered') !== -1);
ok('render: the independent score is shown', outReal.indexOf('Independent score') !== -1);
ok('render: the reviewer\'s own caveat is surfaced when present',
  L.render(mk('attested', 'ok', { score: { score: 82, sourceType: 'publisher', reasoning: 'r', concerns: 'date may slip' } })).indexOf('date may slip') !== -1);

/* ---- the profile is derived from the real log ---- */
const books = JSON.parse(fs.readFileSync(path.join(ROOT, 'books.json'), 'utf8'));
ok('books.json: the log is non-empty', (books.log || []).length > 0);
ok('books.json: every log entry has a title and an author',
  (books.log || []).every(function (b) { return b.title && b.author; }));
ok('books.json: no two logged titles normalize to the same string',
  new Set(books.log.map(function (b) { return L.norm(b.title); })).size === books.log.length);

const q = L.buildQuestion({ log: books.log, reread: [], titles: books.log.map(function (b) { return b.title + ' — ' + b.author; }) }, 8);
ok('question: every finished title is sent so nothing is recommended back',
  books.log.every(function (b) { return q.indexOf(b.title) !== -1; }));
ok('question: a citation is demanded', q.indexOf('MANDATORY') !== -1 && q.indexOf('citation') !== -1);
ok('question: vague citations are explicitly called out as unacceptable', q.indexOf('widely reported') !== -1);

const v = L.buildValidationQuestion({ title: 'T', author: 'A', status: 'forthcoming', date: '2026', citation: 'C' });
ok('validation: the scorer is told to be hostile', v.indexOf('hostile') !== -1);
ok('validation: the scorer is warned about plausible-sounding fabrications',
  v.indexOf('sounds exactly like what') !== -1);
ok('validation: the scorer is NOT given the reading profile (it cannot be swayed by fit)',
  books.log.every(function (b) { return v.indexOf(b.title) === -1; }));
ok('validation: a low score is explicitly endorsed as a correct answer',
  v.indexOf('honest low score is the correct answer') !== -1);

console.log('\n' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail ? 1 : 0);
