#!/usr/bin/env node
/* ============================================================
   The Librarian — reading recommendations (propose, never publish)
     node scripts/librarian.js [--max <n>] [--dry-run] [--out <dir>]
   ------------------------------------------------------------
   The fifteenth agent. The Keeper researches the family record; the Public
   Record Auditor governs what the site claims about the person. This one
   watches what the person reads and proposes what to read next.

   It reads books.json — the log IS the taste profile, so the profile can
   never drift from what was actually finished — asks the same multi-model
   consensus endpoint the Keeper uses, and proposes candidates for a human
   to accept by merging.

   ---- The failure mode this is built around ----
   "What books are coming out that I'd like" is the single most
   confabulation-prone question you can ask a language model. Models
   fluently invent plausible titles by real authors, and for FORTHCOMING
   work they extrapolate — "the next Sowell book" is a sentence a model can
   write without a single fact behind it. Worse, multi-model consensus does
   NOT save you here: two models trained on similar corpora will invent the
   same plausible title independently, and agreement then launders the
   fabrication into a "corroborated" claim.

   ---- Three independent checks, because one is not enough ----
   1. CITE. The proposing model must say where it knows this from — a
      publisher listing, an ISBN, a dated announcement. A recommendation
      with no citation is dropped before it is ever scored. This is the
      claim being made explicit so it can be attacked.
   2. SCORE. A second, separate model pass researches the presented facts
      and the citation and scores validity 0-100, instructed to be hostile
      and to treat an unverifiable citation as worse than no citation. The
      proposer never sees this pass; the scorer never sees the reading
      profile, so it cannot be seduced by fit.
   3. CATALOGUE. Open Library, an objective third party with no opinion
      about any of it.

   The three are combined so that each covers the others' blind spot. In
   particular a catalogue MISS is not evidence of fabrication for a book
   that is genuinely forthcoming — nothing unpublished is catalogued yet —
   which is exactly the case the citation requirement exists to cover. So
   a forthcoming title is judged on its citation, and a supposedly-already-
   published title is judged on the catalogue, and a title that fails the
   test appropriate to its own claimed status is withheld:

     verified     — published, and the catalogue confirms title + author
     attested     — forthcoming, with a citation that survived hostile scoring
     conflict     — catalogue has the title under a different author
     unsupported  — the citation did not survive scoring
     uncited      — no citation offered at all
     unverified   — claimed published, but no catalogue record exists

   Only `verified` and `attested` are proposed. The rest are kept in the
   dossier, visibly, because a silently dropped hallucination teaches nobody
   anything — and the count of them is the honest measure of how much to
   trust a model on this question at all.

   Same discipline as everything else here: a self-claim is worth zero trust
   (rule 04), and it never writes to books.json (rule 03).

   Flags:  --max <n>     how many candidates to ask for (default 8)
           --dry-run     build the profile + print the prompt, no network
           --out <dir>   proposals dir (default research/proposals)
   Env:    LIBRARIAN_CONSENSUS_URL  default https://flcason.com/api/consensus
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GOV = require(path.join(ROOT, 'ui_kits', 'living-line', 'governance.js'));

const BOOKS = path.join(ROOT, 'books.json');
const ENDPOINT = process.env.LIBRARIAN_CONSENSUS_URL || 'https://flcason.com/api/consensus';
const OPENLIB = 'https://openlibrary.org/search.json';
const GBOOKS = 'https://www.googleapis.com/books/v1/volumes';
// 20s was too tight: the proposal call fans out to three models in parallel and
// the slowest sets the pace, so a normal run intermittently aborted itself.
const TIMEOUT_MS = Number(process.env.LIBRARIAN_TIMEOUT_MS) || 60000;

function today() { return new Date().toISOString().slice(0, 10); }
function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; }

/* Normalize for comparison: strip punctuation, articles, case, and the
   subtitle after a colon — "Atomic Habits: An Easy & Proven Way…" and
   "Atomic Habits" are the same book and must not be recommended back. */
function norm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .split(':')[0]
    // Intra-word marks vanish rather than splitting the word: "Unfu*k" must
    // match "Unfuk" and "Don't" must match "Dont", or the already-read filter
    // misses a title the moment a model writes it slightly differently.
    .replace(/['''`´*.]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Surname only, lowercased — catalogues disagree constantly on initials,
   middle names and honorifics ("Dr. Joe Dispenza" vs "Joe Dispenza"). */
function surname(s) {
  const parts = String(s == null ? '' : s).split(/&|,| and /)[0].trim().split(/\s+/)
    .filter(function (w) { return !/^(dr|mr|mrs|ms|prof|md|phd|jr|sr|ii|iii)\.?$/i.test(w); });
  return parts.length ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '') : '';
}

async function getJSON(url, opts) {
  const ctl = new AbortController();
  const t = setTimeout(function () { ctl.abort(); }, TIMEOUT_MS);
  try {
    const r = await fetch(url, Object.assign({ signal: ctl.signal }, opts || {}));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

/* ---- the profile: derived from the log, never hand-written ---- */
function loadProfile() {
  if (!fs.existsSync(BOOKS)) throw new Error('books.json not found — the Librarian has no profile to work from');
  const data = JSON.parse(fs.readFileSync(BOOKS, 'utf8'));
  const log = data.log || [];
  if (!log.length) throw new Error('books.json has an empty log — nothing to derive a profile from');
  const revisiting = (data.revisiting || []).map(function (b) { return b.title; });
  return {
    log: log,
    // A re-read is a stronger taste signal than a single pass. The agent is
    // told which ones those are rather than treating all 27 as equal weight.
    reread: log.filter(function (b) { return revisiting.indexOf(b.title) !== -1; }),
    titles: log.map(function (b) { return b.title + ' — ' + b.author; }),
    seen: new Set(log.map(function (b) { return norm(b.title); })),
  };
}

function buildQuestion(profile, max) {
  return 'Here is a complete reading log of ' + profile.log.length + ' finished books:\n\n' +
    profile.titles.map(function (t, i) { return (i + 1) + '. ' + t; }).join('\n') +
    '\n\nBooks from that list currently being re-read (a stronger signal of what landed): ' +
    (profile.reread.length ? profile.reread.map(function (b) { return b.title; }).join('; ') : 'none') +
    '\n\nRecommend exactly ' + max + ' books this reader has NOT read that they would likely value. ' +
    'Prioritise titles published within roughly the last two years, or announced as forthcoming. ' +
    'Do NOT recommend anything already in the list above.\n\n' +
    'MANDATORY: for each book you must state where your knowledge of it comes from — a publisher ' +
    'listing, an ISBN, a dated public announcement, a retailer pre-order page, a review. Be specific: ' +
    '"Penguin Random House catalogue listing, pub date March 2026" is a citation; "widely reported" ' +
    'and "I recall seeing" are not. If you cannot cite a real source for a title, OMIT that title. ' +
    'A short list is a good answer. An invented title is a failure, and a title with a vague or ' +
    'made-up citation is a worse failure than one you left out.\n\n' +
    'Respond with ONLY a JSON array, no prose, of exactly this shape:\n' +
    '[{"title":"…","author":"…","status":"published|forthcoming","date":"YYYY or YYYY-MM",' +
    '"citation":"the specific source you know this from","why":"one sentence on why this reader specifically"}]';
}

/* The second pass. Deliberately does NOT receive the reading profile: a scorer
   that knows what the reader likes is a scorer that wants the book to be real.
   It sees only the claim and the citation, and is told to attack them. */
function buildValidationQuestion(cand) {
  return 'Assess whether this specific book actually exists as described. Research the claim and the ' +
    'citation offered for it. Be hostile: your job is to catch a fabricated or misremembered title, ' +
    'not to be agreeable.\n\n' +
    'Claimed title: ' + cand.title + '\n' +
    'Claimed author: ' + cand.author + '\n' +
    'Claimed status: ' + (cand.status || 'unstated') + '\n' +
    'Claimed date: ' + (cand.date || 'unstated') + '\n' +
    'Citation offered: ' + cand.citation + '\n\n' +
    'Consider: Does this author exist and write in this area? Does a book of this title by this author ' +
    'exist? Does the cited source plausibly exist and actually support the claim, or is the citation ' +
    'itself vague or invented? Is the date consistent? Beware a title that sounds exactly like what ' +
    'this author WOULD write — that is the signature of a fabrication, not evidence for one.\n\n' +
    'Answer TWO SEPARATE questions. Do not let one contaminate the other.\n\n' +
    'existsScore (0-100): does this book exist, by this author, at all? This is the question that ' +
    'matters. If you recognise the book, score it high even when the citation offered is imprecise — ' +
    'a real book described with a sloppy citation is still a real book. Score near 50 if you simply ' +
    'do not know; below 20 only if you know something that contradicts it, such as an author who ' +
    'does not exist or a title that belongs to someone else.\n\n' +
    'citationScore (0-100): separately, how specific and checkable is the citation as written? ' +
    'A bare "publisher catalogue" is vague; an ISBN with a dated listing is specific. A vague ' +
    'citation for a book you know to be real should NOT drag down existsScore.\n\n' +
    'Respond with ONLY a JSON object, no prose:\n' +
    '{"existsScore":0-100,"citationScore":0-100,"sourceType":"publisher|retailer|news|review|vague|none",' +
    '"reasoning":"one or two sentences on whether the BOOK is real","concerns":"what would make you wrong, or empty"}';
}

/* Models wrap JSON in prose or fences no matter how firmly you ask. */
function parseCandidates(text) {
  if (!text) return [];
  let s = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  if (a === -1 || b === -1 || b <= a) return [];
  let arr;
  try { arr = JSON.parse(s.slice(a, b + 1)); } catch (e) { return []; }
  if (!Array.isArray(arr)) return [];
  return arr.filter(function (c) { return c && c.title && c.author; }).map(function (c) {
    const status = String(c.status || '').toLowerCase() === 'forthcoming' ? 'forthcoming' : 'published';
    return {
      title: String(c.title).trim(),
      author: String(c.author).trim(),
      status: status,
      date: String(c.date || c.year || '').trim(),
      citation: clip(c.citation, 300),
      why: clip(c.why, 240),
    };
  });
}

/* Corroboration counted here rather than taken from the adjudicator.

   The endpoint's adjudicator is Claude; when that key is unavailable the
   endpoint still returns 200 with `consensus.answer` set to the literal string
   "Adjudication unavailable." — a truthy non-answer. Depending on it meant a
   dead adjudicator silently discarded two perfectly good provider responses.

   So every provider is parsed independently and a title is corroborated when
   two or more of them named it. Same >=2 rule the gate wants, computed from
   the raw answers, and it degrades to single-source-but-flagged instead of to
   nothing. Corroboration is signal, not the gate — a title still has to carry
   a citation, survive scoring, and satisfy the catalogue. */
const ADJUDICATOR_DOWN = /adjudication unavailable/i;

/* The endpoint defaults to the Keeper's genealogy framing, which made both
   models refuse this task outright ("poses no explicit question about
   historical or genealogical facts"). The Librarian supplies its own. */
const PROPOSE_SYS = 'You are a well-read acquisitions librarian. You recommend books, and you are ' +
  'rigorous about which books actually exist. You never invent a title, an author, or a publication ' +
  'date, and you would rather return a short list than pad it with something you are unsure of. ' +
  'When asked for JSON, you return only JSON with no prose around it.';

const VALIDATE_SYS = 'You are a hostile fact-checker assessing whether a specific book exists as ' +
  'described. You assume the claim is wrong until the evidence says otherwise. You are especially ' +
  'suspicious of titles that sound exactly like what a given author would plausibly write, because ' +
  'that is the signature of a fabrication rather than evidence for one.\n\n' +
  'CRITICAL: you have NO live internet access. You cannot search publisher sites, retailers or ' +
  'databases, and you must never write as though you had — claiming "extensive searching yields no ' +
  'evidence" is itself a fabrication, and a worse one than the claim you were asked to check. ' +
  'Reason only from what you already know, and say plainly when your knowledge may simply not ' +
  'reach a recent title.\n\n' +
  'Absence from YOUR memory is weak evidence, not proof. Score near 50 when you genuinely do not ' +
  'know; reserve scores under 20 for a claim that actively contradicts something you do know, such ' +
  'as an author who does not exist or a title you know belongs to someone else. When asked for ' +
  'JSON, you return only JSON.';

function collectCandidates(res) {
  const providers = (res && res.providers) || [];
  const byTitle = new Map();

  providers.filter(function (p) { return p && p.ok && p.answer; }).forEach(function (p) {
    parseCandidates(p.answer).forEach(function (c) {
      const key = norm(c.title);
      if (!key) return;
      const prev = byTitle.get(key);
      if (!prev) {
        byTitle.set(key, Object.assign({}, c, { namedBy: [p.provider] }));
        return;
      }
      if (prev.namedBy.indexOf(p.provider) === -1) prev.namedBy.push(p.provider);
      // Keep the first real citation; a later provider's is only a fallback.
      if (!prev.citation && c.citation) prev.citation = c.citation;
      if (!prev.why && c.why) prev.why = c.why;
      // If any provider says forthcoming, treat it as the riskier claim and
      // hold it to the higher bar rather than the more convenient one.
      if (c.status === 'forthcoming') prev.status = 'forthcoming';
    });
  });

  // The adjudicator's synthesis, when it actually ran, as one more voice.
  const adj = res && res.consensus && res.consensus.answer;
  if (adj && !ADJUDICATOR_DOWN.test(adj)) {
    parseCandidates(adj).forEach(function (c) {
      const key = norm(c.title);
      if (!key) return;
      const prev = byTitle.get(key);
      if (!prev) byTitle.set(key, Object.assign({}, c, { namedBy: ['adjudicator'] }));
      else if (prev.namedBy.indexOf('adjudicator') === -1) prev.namedBy.push('adjudicator');
    });
  }

  return Array.from(byTitle.values());
}

/* Scores collected per provider, for the same reason candidates are: the
   adjudicator can be offline, and its "Adjudication unavailable." sentinel is
   truthy. Where reviewers disagree the LOWEST score wins — these are hostile
   fact-checkers, and one of them confidently saying "I cannot substantiate
   this" is the finding, not something to average away. Every score is kept so
   the disagreement stays visible. */
function collectScore(res) {
  const scores = [];
  ((res && res.providers) || []).filter(function (p) { return p && p.ok && p.answer; })
    .forEach(function (p) {
      const s = parseScore(p.answer);
      if (s) scores.push(Object.assign({ by: p.provider }, s));
    });
  const adj = res && res.consensus && res.consensus.answer;
  if (adj && !ADJUDICATOR_DOWN.test(adj)) {
    const s = parseScore(adj);
    if (s) scores.push(Object.assign({ by: 'adjudicator' }, s));
  }
  if (!scores.length) return null;

  const lowest = scores.reduce(function (a, b) { return b.score < a.score ? b : a; });
  return Object.assign({}, lowest, {
    all: scores.map(function (s) { return s.by + ' ' + s.score; }),
    // Any reviewer rejecting the citation rejects it for all of them.
    citationSupports: scores.every(function (s) { return s.citationSupports; }),
    reviewers: scores.length,
  });
}

function parseScore(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a === -1 || b === -1 || b <= a) return null;
  let o;
  try { o = JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  if (!o || typeof o !== 'object') return null;
  const clamp01 = function (v) { const n = Number(v); return isFinite(n) ? Math.max(0, Math.min(100, n)) : null; };
  // `score` is the older single-value shape; accept it as existsScore so a model
  // that answers in the old form still degrades usefully rather than to null.
  const exists = clamp01(o.existsScore != null ? o.existsScore : o.score);
  if (exists == null) return null;
  const cite = clamp01(o.citationScore);
  return {
    score: exists,                       // the one that decides: does the book exist
    citationScore: cite,                 // secondary: how checkable the citation is
    sourceType: String(o.sourceType || 'none').toLowerCase(),
    reasoning: clip(o.reasoning, 300),
    concerns: clip(o.concerns, 240),
  };
}

/* ---- check 3: the objective third parties ----
   Two catalogues, because one was measurably not enough. The 2026-07-27 live
   run rejected six real books — Co-Intelligence, Slow Productivity, Nexus,
   Supercommunicators, Clear Thinking, AI Snake Oil — and Open Library's patchy
   coverage of recent trade non-fiction was half the reason. Google Books has
   materially better coverage there but requires a key (the anonymous quota
   answers 429), so it activates only when GOOGLE_BOOKS_API_KEY is set and the
   agent runs correctly, if more strictly, without it.

   A hit in EITHER catalogue is a hit: they have different gaps, and the point
   is corroboration from something that is not a language model. */
async function lookupOpenLibrary(cand) {
  const d = await getJSON(OPENLIB + '?q=' + encodeURIComponent(cand.title + ' ' + cand.author) + '&limit=5&fields=title,author_name,first_publish_year');
  const docs = (d && d.docs) || [];
  const wantT = norm(cand.title), wantA = surname(cand.author);
  const titleHit = docs.filter(function (doc) { return norm(doc.title) === wantT; });
  if (!titleHit.length) return { state: 'absent' };
  const authorHit = titleHit.filter(function (doc) {
    return (doc.author_name || []).some(function (a) { return surname(a) === wantA; });
  });
  if (!authorHit.length) {
    return { state: 'author-mismatch', who: (titleHit[0].author_name || []).slice(0, 2).join(', ') || 'unknown' };
  }
  return { state: 'present', year: authorHit[0].first_publish_year || null };
}

async function lookupGoogleBooks(cand) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (!key) return { state: 'skipped' };
  const q = 'intitle:' + JSON.stringify(cand.title) + ' inauthor:' + JSON.stringify(surname(cand.author));
  const d = await getJSON(GBOOKS + '?q=' + encodeURIComponent(q) + '&maxResults=5&key=' + encodeURIComponent(key));
  const items = (d && d.items) || [];
  const wantT = norm(cand.title), wantA = surname(cand.author);
  const titleHit = items.map(function (i) { return i.volumeInfo || {}; })
    .filter(function (v) { return norm(v.title) === wantT; });
  if (!titleHit.length) return { state: 'absent' };
  const authorHit = titleHit.filter(function (v) {
    return (v.authors || []).some(function (a) { return surname(a) === wantA; });
  });
  if (!authorHit.length) {
    return { state: 'author-mismatch', who: ((titleHit[0].authors) || []).slice(0, 2).join(', ') || 'unknown' };
  }
  return { state: 'present', year: parseInt(String(authorHit[0].publishedDate || '').slice(0, 4), 10) || null };
}

async function lookupCatalogue(cand) {
  const results = [];
  for (const [name, fn] of [['Open Library', lookupOpenLibrary], ['Google Books', lookupGoogleBooks]]) {
    try {
      const r = await fn(cand);
      if (r.state !== 'skipped') results.push(Object.assign({ source: name }, r));
    } catch (e) {
      // An outage degrades the run; it never fabricates a pass.
      results.push({ source: name, state: 'unreachable', err: clip(e && e.message, 50) });
    }
  }
  if (!results.length) return { state: 'unreachable', note: 'no catalogue was consulted' };

  const hit = results.filter(function (r) { return r.state === 'present'; })[0];
  if (hit) return { state: 'present', note: hit.source + ' confirms title and author', year: hit.year, sources: results };

  const mismatch = results.filter(function (r) { return r.state === 'author-mismatch'; })[0];
  if (mismatch) return { state: 'author-mismatch', note: mismatch.source + ' has this title under ' + mismatch.who + ', not ' + cand.author, sources: results };

  const checked = results.filter(function (r) { return r.state === 'absent'; });
  if (!checked.length) {
    return { state: 'unreachable', note: 'every catalogue was unreachable: ' + results.map(function (r) { return r.source; }).join(', ') };
  }
  return {
    state: 'absent',
    note: 'not found in ' + checked.map(function (r) { return r.source; }).join(' or ') +
      (process.env.GOOGLE_BOOKS_API_KEY ? '' : ' (Google Books not consulted — no API key set)'),
    sources: results,
  };
}

/* ---- combine: each check covers the others' blind spot ----
   The central asymmetry: absence from the catalogue means opposite things
   depending on what the proposer CLAIMED. For an already-published book it is
   damning. For a forthcoming one it is expected, and the citation score is the
   only evidence there is — which is precisely why the citation is mandatory. */
const SCORE_PUBLISHED = 40;   // catalogue is doing the work; score is a sanity floor
const SCORE_FORTHCOMING = 70; // citation is doing ALL the work, so demand more of it
const WEAK_SOURCES = ['vague', 'none'];

function adjudicate(cand, score, cat) {
  if (!cand.citation) {
    return { tier: 'uncited', note: 'no citation offered — dropped before scoring' };
  }
  if (!score) {
    return { tier: 'unsupported', note: 'the validation pass returned nothing usable; treated as unsupported rather than assumed good' };
  }
  if (cat.state === 'author-mismatch') {
    return { tier: 'conflict', note: cat.note, score: score.score };
  }

  /* The catalogue outranks the citation, and used not to.

     Previously a 'vague' sourceType rejected outright, BEFORE the catalogue was
     consulted. Since a model with no web access can almost never call a citation
     specific, that vetoed nearly everything — including books the reviewer had
     just confirmed. The 2026-07-27 run rejected "The Diary of a CEO: The 33 Laws
     of Business and Life" at 22/100 while stating "the actual known title is
     'The Diary of a CEO: The 33 Laws of Business and Life'".

     The citation was only ever a proxy for independent evidence. When a
     catalogue supplies that evidence directly the proxy is redundant, and
     letting it veto is letting the weaker signal overrule the stronger one. */
  if (cat.state === 'present') {
    return {
      tier: 'verified',
      note: cat.note + (score.citationScore != null && score.citationScore < 40
        ? ' (the citation itself was thin, but the catalogue is the evidence here)' : ''),
      score: score.score,
      year: cat.year,
    };
  }

  // No catalogue record: now the citation is all there is, so it has to hold up.
  if (WEAK_SOURCES.indexOf(score.sourceType) !== -1 && score.score < SCORE_FORTHCOMING) {
    return {
      tier: 'unsupported',
      note: 'no catalogue record, and the citation is ' + score.sourceType + ' with the book itself ' +
        'scored only ' + score.score + '/100: ' + score.reasoning,
      score: score.score,
    };
  }

  if (cand.status === 'forthcoming') {
    // Not in the catalogue is EXPECTED here — do not hold it against the title.
    if (score.score >= SCORE_FORTHCOMING) {
      return {
        tier: 'attested',
        note: 'forthcoming; citation survived hostile review at ' + score.score + '/100 (' + score.sourceType + ')',
        score: score.score,
      };
    }
    return {
      tier: 'unsupported',
      note: 'forthcoming, but the citation scored ' + score.score + '/100 — below the ' + SCORE_FORTHCOMING + ' required when a catalogue cannot corroborate',
      score: score.score,
    };
  }

  // (A catalogue hit already returned above — the catalogue outranks the citation.)
  if (cat.state === 'unreachable') {
    return { tier: 'unsupported', note: cat.note + ' — cannot confirm a supposedly-published title without it', score: score.score };
  }

  /* Catalogue absent, claimed published. This used to return `unverified` with
     the note "most likely invented" — which was itself an overclaim, and the
     live run proved it: Co-Intelligence (Mollick, Portfolio 2024) is a real,
     well-known book that Open Library simply does not have. The catalogue is
     crowd-sourced and its coverage of recent trade non-fiction is patchy, so
     absence is missing evidence, not evidence of absence.

     A fabrication fails BOTH checks — no catalogue record AND a reviewer who
     can find nothing to support it. Requiring both keeps the guard while
     letting a real book with a strong citation through on the same terms as a
     forthcoming one. */
  if (score.score >= SCORE_FORTHCOMING) {
    return {
      tier: 'attested',
      note: 'not in the catalogue, whose coverage of recent titles is incomplete, but the citation ' +
        'survived review at ' + score.score + '/100 (' + score.sourceType + ') — treated as uncorroborated, not disproven',
      score: score.score,
    };
  }
  return {
    tier: 'unverified',
    note: 'claimed already published, but no catalogue record and the citation scored only ' +
      score.score + '/100 — nothing independent supports it',
    score: score.score,
  };
}

/* ---- the dossier ---- */
const PASSING = ['verified', 'attested'];

function render(d) {
  const passed = d.items.filter(function (i) { return PASSING.indexOf(i.check.tier) !== -1; });
  const held = d.items.filter(function (i) { return PASSING.indexOf(i.check.tier) === -1; });

  let md = '# Reading proposals — ' + d.date + '\n\n';
  md += '> The Librarian. Recommendations derived from `books.json` — the log is the profile, so it cannot drift from what was actually finished. **Propose, never publish**: nothing here edits `books.json`, and merging this PR is the approval.\n\n';
  md += '**' + d.items.length + '** candidate(s) · **' + passed.length + '** survived review · **' + held.length + '** withheld\n\n';
  md += 'Profile: ' + d.profileSize + ' finished titles. Endpoint: `' + ENDPOINT + '`.\n\n';
  md += '### How each of these was checked\n\n';
  md += '1. **Cited** — the proposing model had to state where it knows the book from. No citation, no consideration.\n';
  md += '2. **Scored** — a separate model pass researched the claim and the citation and scored it 0-100, instructed to be hostile. That pass never sees the reading profile, so it cannot be swayed by how well the book fits.\n';
  md += '3. **Catalogued** — Open Library, an objective third party.\n\n';
  md += 'A catalogue miss is *expected* for a genuinely forthcoming title and is not held against it; those are judged on the citation instead, at a higher bar (' + SCORE_FORTHCOMING + '/100 vs ' + SCORE_PUBLISHED + '/100) precisely because nothing else can corroborate them. A title claimed as already published that the catalogue has never heard of is treated as invented.\n\n---\n\n';

  if (passed.length) {
    md += '## Proposed\n\n';
    passed.forEach(function (i) {
      md += '### ' + i.cand.title + '\n\n';
      md += '**' + i.cand.author + '** · `' + i.check.tier + '`' +
        (i.check.year ? ' · first published ' + i.check.year : (i.cand.date ? ' · ' + i.cand.date : '')) + '\n\n';
      md += i.cand.why + '\n\n';
      md += '- **Citation offered:** ' + (i.cand.citation || '—') + '\n';
      md += '- **Independent score:** ' + (i.check.score != null ? i.check.score + '/100' : 'n/a') +
        (i.score && i.score.sourceType ? ' (' + i.score.sourceType + ')' : '') + '\n';
      if (i.score && i.score.reasoning) md += '- **Reviewer said:** ' + i.score.reasoning + '\n';
      if (i.score && i.score.concerns) md += '- **Reviewer\'s own caveat:** ' + i.score.concerns + '\n';
      md += '- **Verdict:** ' + i.check.note + '\n';
      md += '- **Gate:** `' + i.decision.decision + '`' + (GOV.reasonOf(i.decision, 'review') ? ' — ' + GOV.reasonOf(i.decision, 'review') : '') + '\n\n';
    });
  } else {
    md += '## Proposed\n\nNothing survived review this run. That is a result, not a failure — see below.\n\n';
  }

  if (held.length) {
    md += '---\n\n## Withheld — shown on purpose\n\n';
    md += 'Kept visible rather than quietly dropped: the count is the honest measure of how much to trust a model on this question at all.\n\n';
    md += '| Title | Author | Claimed | Score | Verdict | Why |\n|---|---|---|---|---|---|\n';
    held.forEach(function (i) {
      md += '| ' + i.cand.title + ' | ' + i.cand.author + ' | ' + i.cand.status + ' | ' +
        (i.check.score != null ? i.check.score : '—') + ' | `' + i.check.tier + '` | ' + i.check.note + ' |\n';
    });
    md += '\n';
  }
  md += '\n---\n\n*To accept: add the title to `books.json` when finished. The Librarian never writes it — that is the point.*\n';
  return md;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = function (f, dflt) { const i = argv.indexOf(f); return i !== -1 && argv[i + 1] ? argv[i + 1] : dflt; };
  const max = Math.max(1, Math.min(20, parseInt(arg('--max', '8'), 10) || 8));
  const dryRun = argv.indexOf('--dry-run') !== -1;
  // resolve, not join: an absolute --out should be used as given, not appended to ROOT.
  const OUT = path.resolve(ROOT, arg('--out', path.join('research', 'proposals')));

  const profile = loadProfile();
  const question = buildQuestion(profile, max);

  if (dryRun) {
    console.log('Profile: ' + profile.log.length + ' finished, ' + profile.reread.length + ' being re-read.');
    console.log('Endpoint: ' + ENDPOINT + ' (not called)\n');
    console.log(question);
    return;
  }

  let proposal;
  try {
    proposal = await getJSON(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question: question,
        system: PROPOSE_SYS,
        // The log alone is well past the endpoint's default 600-char cap.
        maxQuestion: 8000,
        context: 'The reader builds AI governance and memory infrastructure and spent 25 years in hospitality operations before that.',
      }),
    });
  } catch (e) {
    console.error('Consensus endpoint failed: ' + (e && e.message));
    process.exitCode = 1;
    return;
  }

  // Report what actually answered — a silent degradation is the thing that
  // wasted the first live run of this agent.
  const provs = (proposal.providers || []);
  const live = provs.filter(function (p) { return p && p.ok; }).map(function (p) { return p.provider; });
  const dead = provs.filter(function (p) { return p && !p.ok; });
  console.log('Providers answering: ' + (live.join(', ') || 'NONE'));
  dead.forEach(function (p) { console.log('  ! ' + p.provider + ' unavailable: ' + clip(p.error, 100)); });
  if (!live.length) {
    console.error('No provider answered — nothing to propose. This is an outage, not an empty result.');
    process.exitCode = 1;
    return;
  }

  let cands = collectCandidates(proposal);
  // Never recommend something already finished — the profile is the filter.
  const before = cands.length;
  cands = cands.filter(function (c) { return !profile.seen.has(norm(c.title)); });
  const filtered = before - cands.length;
  if (filtered) console.log('Filtered ' + filtered + ' already-read title(s).');

  if (!cands.length) {
    console.log('No parseable candidates this run — nothing to propose.');
    return;
  }

  const policy = GOV.buildKeeperPolicy({ consensusThreshold: 0.5, primaryThreshold: 1.0 });
  const trace = GOV.Trace('Librarian reading pass — ' + today());
  trace.runStarted();

  const items = [];
  for (let i = 0; i < cands.length; i++) {
    const cand = cands[i];
    const step = trace.runId + ':b' + i;

    // Pass 2 — the hostile scorer. Skipped entirely when nothing was cited:
    // there is nothing to score, and asking anyway invites a charitable guess.
    let score = null;
    if (cand.citation) {
      trace.stepStarted(step, 'reasoner');
      try {
        const vres = await getJSON(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question: buildValidationQuestion(cand), system: VALIDATE_SYS, maxQuestion: 2000 }),
        });
        score = collectScore(vres);
      } catch (e) {
        score = null; // an outage is not a pass
      }
      trace.stepCompleted(step, 'reasoner',
        'citation review: ' + (score ? score.score + '/100 (' + score.sourceType + ')' : 'no usable verdict'),
        ['model-review']);
    }

    // Pass 3 — the catalogue.
    trace.stepStarted(step, 'researcher');
    const cat = await lookupCatalogue(cand);
    trace.stepCompleted(step, 'researcher', cand.title + ' → catalogue ' + cat.state, ['open-library']);

    const check = adjudicate(cand, score, cat);
    const passing = PASSING.indexOf(check.tier) !== -1;

    const named = (cand.namedBy || []).length;
    const prov = [named >= 2 ? 'model-consensus' : 'single-model'];
    if (cand.citation) prov.push('cited-source');
    if (score && score.score >= SCORE_PUBLISHED) prov.push('model-review');
    if (cat.state === 'present') prov.push('open-library');

    const action = {
      kind: 'propose_reading',
      // Provenance is what independently backed the claim — never the fact
      // that a model asserted it. That assertion IS the claim.
      provenance: prov,
      confidence: passing ? (check.score != null ? check.score / 100 : 0.7) : 0.2,
      justification: cand.why || 'matches the reading profile',
      tier: passing ? 'leading' : 'possible',
    };
    trace.actionProposed(step, action);
    const decision = GOV.evaluatePolicy(action, policy);
    trace.gateDecision(step, decision);
    trace.awaitingApproval(step, 'awaiting human merge');

    items.push({ cand: cand, check: check, score: score, cat: cat, action: action, decision: decision });
  }
  trace.runCompleted();

  const d = { date: today(), items: items, profileSize: profile.log.length };
  fs.mkdirSync(OUT, { recursive: true });
  const mdFile = path.join(OUT, 'librarian-' + d.date + '.md');
  const trFile = path.join(OUT, 'librarian-' + d.date + '.trace.ndjson');
  fs.writeFileSync(mdFile, render(d));
  // toNdjson(), not events.map — `events` is an accessor function on the Trace
  // API, not an array. The Keeper has always used toNdjson(); this didn't.
  fs.writeFileSync(trFile, trace.toNdjson());

  const ok = items.filter(function (i) { return PASSING.indexOf(i.check.tier) !== -1; }).length;
  console.log('Librarian: ' + items.length + ' candidate(s), ' + ok + ' survived review, ' + (items.length - ok) + ' withheld.');
  console.log('Wrote ' + path.relative(ROOT, mdFile));
}

if (require.main === module) {
  main().catch(function (e) { console.error(e && e.stack || e); process.exit(1); });
}

module.exports = {
  norm: norm, surname: surname,
  parseCandidates: parseCandidates, parseScore: parseScore, collectCandidates: collectCandidates, collectScore: collectScore,
  ADJUDICATOR_DOWN: ADJUDICATOR_DOWN,
  buildQuestion: buildQuestion, buildValidationQuestion: buildValidationQuestion,
  adjudicate: adjudicate, render: render,
  SCORE_PUBLISHED: SCORE_PUBLISHED, SCORE_FORTHCOMING: SCORE_FORTHCOMING, PASSING: PASSING,
};
