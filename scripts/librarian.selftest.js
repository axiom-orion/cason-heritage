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
// Open Library's coverage of recent trade non-fiction is patchy — the live run
// found Co-Intelligence (Mollick, 2024) missing from it entirely. So a catalogue
// miss is missing evidence, not evidence of absence; a fabrication has to fail
// BOTH the catalogue and the reviewer.
ok('adjudicate: published + no catalogue + STRONG score → attested, not called invented',
  L.adjudicate(pub(), strong, absent).tier === 'attested');
ok('adjudicate: published + no catalogue + weak score → unverified',
  L.adjudicate(pub(), weak, absent).tier === 'unverified');
ok('adjudicate: a catalogue miss is never described as proof of invention',
  L.adjudicate(pub(), weak, absent).note.indexOf('invented') === -1);
ok('adjudicate: the scorer is told it cannot search the live web',
  L.buildValidationQuestion({ title: 't', author: 'a', citation: 'c' }).length > 0 &&
  require('fs').readFileSync(path.join(ROOT, 'scripts', 'librarian.js'), 'utf8').indexOf('NO live internet access') !== -1);
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

/* ---- the degraded-adjudicator case: this wasted the first live run ----
   The endpoint returns HTTP 200 with consensus.answer set to the literal
   string "Adjudication unavailable." when the Claude adjudicator's key is
   dead. That string is truthy, so reading it as the answer silently threw
   away two working providers that had both returned usable JSON. ---- */
const ONE = JSON.stringify([{ title: 'Book One', author: 'A', citation: 'publisher listing' }]);
const TWO = JSON.stringify([
  { title: 'Book One', author: 'A', citation: 'ISBN 123' },
  { title: 'Book Two', author: 'B', citation: 'a review' },
]);

const degraded = {
  providers: [
    { provider: 'Claude', ok: false, error: 'credit balance is too low' },
    { provider: 'Grok', ok: true, answer: ONE },
    { provider: 'Gemini', ok: true, answer: TWO },
  ],
  consensus: { answer: 'Adjudication unavailable.' },
};
const got = L.collectCandidates(degraded);
const pick = function (arr, t) { return arr.filter(function (c) { return c.title === t; })[0] || {}; };

ok('degraded: candidates survive a dead adjudicator', got.length === 2, 'got ' + got.length);
ok('degraded: the sentinel string is recognised', L.ADJUDICATOR_DOWN.test('Adjudication unavailable.'));
ok('degraded: the sentinel is not confused with a real answer', !L.ADJUDICATOR_DOWN.test(ONE));
ok('degraded: a title named by two providers is corroborated',
  (pick(got, 'Book One').namedBy || []).length === 2);
ok('degraded: a title named by one provider is kept but marked single-source',
  (pick(got, 'Book Two').namedBy || []).length === 1);
ok('degraded: a citation is carried through the merge', !!pick(got, 'Book One').citation);

ok('degraded: a total outage yields nothing rather than a fabrication',
  L.collectCandidates({
    providers: [{ provider: 'Claude', ok: false, error: 'x' }],
    consensus: { answer: 'Adjudication unavailable.' },
  }).length === 0);

ok('degraded: a provider that errored is never read for candidates',
  L.collectCandidates({ providers: [{ provider: 'Grok', ok: false, answer: ONE }], consensus: {} }).length === 0);

const healthy = L.collectCandidates({ providers: [{ provider: 'Grok', ok: true, answer: ONE }], consensus: { answer: ONE } });
ok('healthy: a live adjudicator counts as one more voice',
  healthy.length === 1 && healthy[0].namedBy.indexOf('adjudicator') !== -1);

ok('degraded: a conflicting status resolves to the riskier claim',
  L.collectCandidates({
    providers: [
      { provider: 'Grok', ok: true, answer: JSON.stringify([{ title: 'X', author: 'A', status: 'published', citation: 'c' }]) },
      { provider: 'Gemini', ok: true, answer: JSON.stringify([{ title: 'X', author: 'A', status: 'forthcoming', citation: 'c' }]) },
    ],
    consensus: {},
  })[0].status === 'forthcoming');

ok('degraded: the same title written differently is merged, not duplicated',
  L.collectCandidates({
    providers: [
      { provider: 'Grok', ok: true, answer: JSON.stringify([{ title: 'The Long Game', author: 'A', citation: 'c' }]) },
      { provider: 'Gemini', ok: true, answer: JSON.stringify([{ title: 'Long Game: A Subtitle', author: 'A', citation: 'c' }]) },
    ],
    consensus: {},
  }).length === 1);

/* ---- the Trace API: `events` is an accessor, not an array ----
   The first run that got all the way through the model work then died writing
   the audit trail: "trace.events.map is not a function". A run that cannot be
   recorded is a run that did not happen, so the contract is asserted here
   rather than discovered in CI again. */
const GOV = require(path.join(ROOT, 'ui_kits', 'living-line', 'governance.js'));
const t = GOV.Trace('selftest');
t.runStarted();
t.runCompleted();
ok('trace: toNdjson() is the serializer', typeof t.toNdjson === 'function');
ok('trace: events is an accessor function, not an array',
  typeof t.events === 'function' && !Array.isArray(t.events));
ok('trace: toNdjson emits one parseable JSON object per line',
  t.toNdjson().trim().split('\n').every(function (l) { try { JSON.parse(l); return true; } catch (e) { return false; } }));
ok('trace: the Librarian serializes via toNdjson, never events.map',
  fs.readFileSync(path.join(ROOT, 'scripts', 'librarian.js'), 'utf8').indexOf('trace.events.map') === -1);

console.log('\n' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail ? 1 : 0);
