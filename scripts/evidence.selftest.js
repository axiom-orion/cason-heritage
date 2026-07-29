#!/usr/bin/env node
/* The Evidence Gate's selftest.

   The cases that matter are the ones where a fabrication would otherwise pass:
   a claim with no source, a citation naming a domain nobody fetched, and ten
   pages from one site posing as corroboration. */
'use strict';

const path = require('path');
const E = require(path.join(__dirname, '..', 'ui_kits', 'living-line', 'evidence.js'));

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); }
}
const src = function (domain, url) { return { domain: domain, url: url || ('https://' + domain + '/x'), title: domain }; };

console.log('\nThe Evidence Gate\n');

/* ---- source tiering ---- */
ok('tier: publisher catalogue is primary', E.gradeSource('penguinrandomhouse.com').tier === 'primary');
ok('tier: subdomain of a publisher is primary', E.gradeSource('books.penguinrandomhouse.com').tier === 'primary');
ok('tier: .gov is primary', E.gradeSource('columbia.clerk.fl.gov').tier === 'primary');
ok('tier: archive is primary', E.gradeSource('familysearch.org').tier === 'primary');
ok('tier: catalogue is secondary', E.gradeSource('openlibrary.org').tier === 'secondary');
ok('tier: independent review is secondary', E.gradeSource('kirkusreviews.com').tier === 'secondary');
ok('tier: .edu is secondary', E.gradeSource('hbs.edu').tier === 'secondary');
ok('tier: retailer is aggregator', E.gradeSource('amazon.com').tier === 'aggregator');
ok('tier: wiki is aggregator', E.gradeSource('en.wikipedia.org').tier === 'aggregator');
ok('tier: a genealogy aggregator is NOT primary',
  E.gradeSource('ancestry.com').tier === 'aggregator');
ok('tier: www. is stripped', E.gradeSource('www.amazon.com').tier === 'aggregator');
ok('tier: an unrecognised domain is unknown, not wrong',
  E.gradeSource('somebodysblog.net').tier === 'unknown');
ok('tier: unknown says so plainly', /not as wrong/.test(E.gradeSource('somebodysblog.net').why));
ok('tier: an empty domain cannot be ranked', E.gradeSource('').tier === 'unknown');
ok('tier: the subject’s own domain is primary when declared',
  E.gradeSource('calnewport.com', { selfDomains: ['calnewport.com'] }).tier === 'primary');
ok('tier: the same domain is NOT primary when not declared',
  E.gradeSource('calnewport.com').tier === 'unknown');

/* ---- NO GUESS: the gate ---- */
const noSource = E.grade({ sources: [], searched: true });
ok('no-guess: zero sources is REFUSED, not merely weak', noSource.grade === 'REFUSED');
ok('no-guess: refused is never publishable', noSource.publishable === false);
ok('no-guess: the violation is named', noSource.violations.some(function (v) { return v.rule === 'no-guess'; }));
// Look violations up by rule, never by index — the gate pushes several and
// their order is not part of the contract.
const ruleDetail = function (res, rule) {
  const v = (res.violations || []).filter(function (x) { return x.rule === rule; })[0];
  return v ? v.detail : '';
};
ok('no-guess: searched-and-found-nothing reads differently from never-looked',
  /returned no usable source/.test(ruleDetail(noSource, 'no-guess')) &&
  /recall presented as fact/.test(ruleDetail(E.grade({ sources: [], searched: false }), 'no-guess')));
ok('no-guess: found-the-subject-but-not-the-claim is a THIRD distinct message',
  /nothing supporting this specific claim/.test(ruleDetail(E.grade({
    searched: true, mustAppear: ['An Invented Title'],
    sources: [{ domain: 'hoover.org', url: 'https://hoover.org/x', title: 'Thomas Sowell' }],
  }), 'no-guess')));

/* ---- corroboration counts DOMAINS, not entries and not voices ---- */
const oneSiteManyPages = E.grade({
  searched: true,
  sources: [
    src('amazon.com', 'https://amazon.com/a'), src('amazon.com', 'https://amazon.com/b'),
    src('amazon.com', 'https://amazon.com/c'), src('amazon.com', 'https://amazon.com/d'),
  ],
});
ok('corroboration: four pages from one site is ONE source',
  oneSiteManyPages.distinctDomains === 1, 'got ' + oneSiteManyPages.distinctDomains);
ok('corroboration: one domain cannot exceed possible', oneSiteManyPages.grade === 'possible');

const twoDomains = E.grade({ searched: true, sources: [src('penguinrandomhouse.com'), src('kirkusreviews.com')] });
ok('corroboration: two domains with a primary → confirmed', twoDomains.grade === 'confirmed');
ok('corroboration: confirmed is publishable', twoDomains.publishable === true);

ok('grade: two secondary domains → secondary',
  E.grade({ searched: true, sources: [src('openlibrary.org'), src('kirkusreviews.com')] }).grade === 'secondary');
ok('grade: two aggregators → leading, not secondary',
  E.grade({ searched: true, sources: [src('amazon.com'), src('goodreads.com')] }).grade === 'leading');
ok('grade: leading is not publishable',
  E.grade({ searched: true, sources: [src('amazon.com'), src('goodreads.com')] }).publishable === false);
ok('grade: a lone primary source is still only possible',
  E.grade({ searched: true, sources: [src('penguinrandomhouse.com')] }).grade === 'possible');

/* ---- VALIDATE: not-retrieved cannot be elevated ---- */
const recallOnly = E.grade({ searched: false, sources: [src('penguinrandomhouse.com'), src('kirkusreviews.com')] });
ok('not-retrieved: recall caps at possible however good the claimed sources',
  recallOnly.grade === 'possible');
ok('not-retrieved: the violation is recorded',
  recallOnly.violations.some(function (v) { return v.rule === 'not-retrieved'; }));

/* ---- CITE: a citation naming a domain nobody fetched ----
   This is the Gemini failure of 2026-07-27: "Camden Co. NC Will Book B,
   pp. 248-249" asserted with no retrieval behind it. */
const fabricated = E.grade({
  searched: true,
  sources: [src('penguinrandomhouse.com'), src('kirkusreviews.com')],
  citations: ['camden-county-archives.gov'],
});
ok('cite: a citation with no retrieved page behind it is flagged',
  fabricated.violations.some(function (v) { return v.rule === 'citation-unbacked'; }));
ok('cite: an unbacked citation caps the grade below publishable',
  fabricated.grade === 'leading' && fabricated.publishable === false);
ok('cite: the unbacked domain is named in the violation',
  /camden-county-archives\.gov/.test(fabricated.violations.filter(function (v) { return v.rule === 'citation-unbacked'; })[0].detail));

const honest = E.grade({
  searched: true,
  mustAppear: ['Co-Intelligence'],
  sources: [
    { domain: 'penguinrandomhouse.com', url: 'https://p.com/co-intelligence', title: 'Co-Intelligence' },
    { domain: 'kirkusreviews.com', url: 'https://k.com/co-intelligence', title: 'Co-Intelligence review' },
  ],
  citations: ['penguinrandomhouse.com'],
});
ok('cite: a citation that IS backed passes clean',
  honest.grade === 'confirmed' && honest.violations.length === 0);
ok('cite: a subdomain citation matches its parent domain',
  E.grade({ searched: true, mustAppear: ['Co-Intelligence'], citations: ['penguinrandomhouse.com'], sources: [
    { domain: 'books.penguinrandomhouse.com', url: 'https://b.com/x', title: 'Co-Intelligence' },
    { domain: 'kirkusreviews.com', url: 'https://k.com/y', title: 'Co-Intelligence' },
  ] }).violations.length === 0);

/* ---- merging providers: two models citing the same page is one source ---- */
const merged = E.fromProviders([
  { ok: true, searched: true, sources: [{ url: 'https://a.com/1', domain: 'a.com' }, { url: 'https://b.com/1', domain: 'b.com' }] },
  { ok: true, searched: true, sources: [{ url: 'https://a.com/1', domain: 'a.com' }] },
  { ok: false, error: 'down' },
  { ok: true, searched: false, sources: [] },
]);
ok('merge: an identical URL from two providers is deduped to one', merged.sources.length === 2);
ok('merge: a failed provider contributes nothing', merged.sources.every(function (s) { return s.domain !== undefined; }));
ok('merge: searched is true when ANY provider actually searched', merged.searched === true);
ok('merge: searched is false when none did',
  E.fromProviders([{ ok: true, searched: false, sources: [] }]).searched === false);

/* ---- the law this implements ---- */
const fs = require('fs');
const law = fs.readFileSync(path.join(__dirname, '..', 'research', 'bloodhound.md'), 'utf8');
ok('law: bloodhound.md still states corroboration counts sources, not voices',
  /counts independent underlying SOURCES, not the voices/i.test(law));

/* ---- ON-POINT: the flaw the first version of this gate shipped with ----
   Searching for an invented title returns real, high-tier pages about the
   author. Grading the retrieval scored a fabrication `confirmed` and
   publishable. Sources must name the CLAIM, not merely the subject. */
const sowellPages = ['hoover.org', 'hachettebookgroup.com', 'en.wikipedia.org', 'basicbooks.com', 'amazon.com']
  .map(function (d, i) { return { domain: d, url: 'https://' + d + '/p' + i, title: 'Thomas Sowell — page ' + i }; });

const fabricatedTitle = E.grade({ searched: true, sources: sowellPages, mustAppear: ['The Compounding Mind'] });
ok('on-point: an invented title is REFUSED despite 5 real high-tier pages',
  fabricatedTitle.grade === 'REFUSED', 'got ' + fabricatedTitle.grade);
ok('on-point: the violation names the problem',
  fabricatedTitle.violations.some(function (v) { return v.rule === 'sources-not-on-point'; }));
ok('on-point: topical pages are reported, not silently dropped', fabricatedTitle.topical.length === 5);
ok('on-point: the explanation separates subject from claim',
  /subject/.test(fabricatedTitle.why) && /none supporting the claim/.test(fabricatedTitle.why));

const realTitle = E.grade({
  searched: true,
  mustAppear: ['Co-Intelligence'],
  sources: [
    { domain: 'penguinrandomhouse.com', url: 'https://p.com/a', title: 'Co-Intelligence: Living and Working with AI' },
    { domain: 'kirkusreviews.com', url: 'https://k.com/b', title: 'CO-INTELLIGENCE | Kirkus Reviews' },
    { domain: 'hoover.org', url: 'https://h.org/c', title: 'An unrelated page' },
  ],
});
ok('on-point: a real title matches through punctuation and subtitle',
  realTitle.grade === 'confirmed', 'got ' + realTitle.grade);
ok('on-point: only supporting sources are counted', realTitle.distinctDomains === 2);
ok('on-point: the off-topic page is set aside as topical', realTitle.topical.length === 1);
ok('on-point: a URL slug counts as a match',
  E.grade({ searched: true, mustAppear: ['Slow Productivity'], sources: [
    { domain: 'penguinrandomhouse.com', url: 'https://penguinrandomhouse.com/books/slow-productivity/', title: '' },
    { domain: 'kirkusreviews.com', url: 'https://kirkusreviews.com/slow-productivity', title: '' },
  ] }).grade === 'confirmed');
ok('on-point: omitting mustAppear is flagged, never silently allowed',
  E.grade({ searched: true, sources: [src('penguinrandomhouse.com'), src('kirkusreviews.com')] })
    .violations.some(function (v) { return v.rule === 'unscoped-claim'; }));
ok('on-point: a needle too short to be distinctive is ignored, not matched loosely',
  E.grade({ searched: true, mustAppear: ['AI'], sources: [src('penguinrandomhouse.com')] })
    .violations.some(function (v) { return v.rule === 'unscoped-claim'; }));

/* ---- conjunction matching, for claims that are relationships ----
   "William Cason married Ann Munden" is supported by a page naming BOTH. A
   page naming only Cason is about the family, not about the marriage — the
   same subject-versus-claim distinction, one level down. */
const pg = function (d, title) { return { domain: d, url: 'https://' + d + '/x', title: title }; };

const bothNames = E.grade({
  searched: true, mustAppearAll: ['Cason', 'Munden'],
  sources: [
    pg('familysearch.org', 'Cason-Munden marriage bond, Camden County'),
    pg('archives.gov', 'Munden and Cason family papers'),
    pg('wikipedia.org', 'Cason (surname)'),
  ],
});
ok('conjunction: only pages naming BOTH terms count', bothNames.distinctDomains === 2);
ok('conjunction: the family-only page is set aside as topical', bothNames.topical.length === 1);
ok('conjunction: two archives → confirmed', bothNames.grade === 'confirmed');

const oneNameOnly = E.grade({
  searched: true, mustAppearAll: ['Cason', 'Munden'],
  sources: [pg('wikipedia.org', 'Cason (surname)'), pg('ancestry.com', 'Cason family tree')],
});
ok('conjunction: pages naming only one term support nothing', oneNameOnly.grade === 'REFUSED');
ok('conjunction: the violation lists every required term',
  /Cason \+ Munden/.test(oneNameOnly.violations.filter(function (v) { return v.rule === 'sources-not-on-point'; })[0].detail));
ok('conjunction: a short-but-distinctive token is allowed (>=4 chars)',
  E.grade({ searched: true, mustAppearAll: ['Cason'],
    sources: [pg('archives.gov', 'Cason record'), pg('loc.gov', 'Cason papers')] }).grade === 'confirmed');
ok('conjunction: scoping by conjunction clears the unscoped-claim flag',
  !bothNames.violations.some(function (v) { return v.rule === 'unscoped-claim'; }));

console.log('\n' + pass + ' passed, ' + fail + ' failed.\n');
process.exit(fail ? 1 : 0);
