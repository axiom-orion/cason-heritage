/* ============================================================
   The Evidence Gate — no guess · cite · validate · grade source
   ------------------------------------------------------------
   One grader every agent calls, so a source is tiered the same way whether
   it reaches the Keeper, the Librarian, or the Public Record Auditor.

   It exists to enforce the law this repo already wrote down, in
   research/bloodhound.md:

     "Corroboration counts independent underlying SOURCES, not the voices
      that report them."

   That law was unenforceable until the panel could retrieve. With three
   models and no retrieval there were no underlying sources to count — only
   voices — so `require-model-consensus` counted voices and called it
   corroboration. Two models trained on similar corpora agreeing is one
   source reported twice. Now that /api/consensus returns the pages it
   actually fetched, the law can finally be applied as written: this module
   counts DISTINCT DOMAINS.

   ---- The four steps ----
   NO GUESS   a factual claim with zero retrieved sources is refused. Not
              downgraded, not flagged — refused. This is the gate.
   CITE       a claim must name where it came from, and that citation must
              appear in what was actually retrieved. A citation naming a
              domain nobody fetched is the fabrication signature: it is how
              "Camden Co. Will Book B, pp. 248-249" got written.
   VALIDATE   a claim whose provider reported `searched: false` answered from
              recall. It can be recorded, never elevated.
   GRADE      the strongest source decides the ceiling; the number of
              independent domains decides the grade beneath it.

   Grades reuse the family record's existing vocabulary (data.js `evidence`)
   rather than inventing a parallel scale:

     confirmed   >=2 independent domains AND >=1 primary source
     secondary   >=2 independent domains, best source secondary or better
     leading     >=2 independent domains, aggregators only
     possible    exactly 1 domain, or retrieved but thin
     unsolved    retrieval ran and found nothing usable
     REFUSED     no source at all — the no-guess gate

   Runs in the browser (window) and under Node (module.exports), same as
   governance.js.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---- source tiers ----
     Deliberately small and structural. A long hand-maintained allowlist is a
     claim about the world that rots; these are rules plus a short list of
     domains that are the originating authority for their own material.

     `unknown` is not a judgement. It means this module cannot rank the domain,
     and a caller should treat it as weak rather than wrong. */

  // Publishers are primary for claims about their own books: a title on the
  // publisher's catalogue is the publisher asserting it exists.
  const PUBLISHERS = [
    'penguinrandomhouse.com', 'penguin.co.uk', 'penguin.com.au', 'prh.com',
    'harpercollins.com', 'hachettebookgroup.com', 'simonandschuster.com',
    'macmillan.com', 'us.macmillan.com', 'bloomsbury.com', 'wwnorton.com',
    'basicbooks.com', 'chronicle books.com', 'crownpublishing.com',
    'sourcebooks.com', 'wiley.com', 'oup.com', 'cambridge.org', 'mitpress.mit.edu',
    'press.princeton.edu', 'yalebooks.yale.edu', 'ucpress.edu', 'hbr.org',
    'bertelsmann.com', 'holtzbrinck.com',
  ];

  // Catalogues and libraries: independent records of what exists.
  const CATALOGUES = [
    'openlibrary.org', 'worldcat.org', 'loc.gov', 'bl.uk', 'bnf.fr',
    'catalogue.nla.gov.au', 'isbndb.com',
  ];

  // Archives and record repositories: primary for genealogical facts.
  const ARCHIVES = [
    'familysearch.org', 'archives.gov', 'chroniclingamerica.loc.gov',
    'nationalarchives.gov.uk', 'findagrave.com',
  ];

  // Independent editorial coverage.
  const REVIEWS = [
    'kirkusreviews.com', 'publishersweekly.com', 'nytimes.com', 'theatlantic.com',
    'economist.com', 'ft.com', 'wsj.com', 'newyorker.com', 'theguardian.com',
    'npr.org', 'bbc.co.uk', 'bbc.com', 'reuters.com', 'apnews.com',
  ];

  // Useful, but derivative — they report what someone else established.
  const AGGREGATORS = [
    'amazon.com', 'amazon.co.uk', 'goodreads.com', 'wikipedia.org', 'barnesandnoble.com',
    'bookshop.org', 'audible.com', 'apple.com', 'blinkist.com', 'perlego.com',
    'everand.com', 'scribd.com', 'thriftbooks.com', 'abebooks.com', 'ebay.com',
    'ancestry.com', 'myheritage.com', 'geni.com', 'wikitree.com', 'rootsweb.com',
  ];

  const TIERS = ['primary', 'secondary', 'aggregator', 'unknown'];
  const TIER_RANK = { primary: 3, secondary: 2, aggregator: 1, unknown: 0 };

  function norm(d) {
    return String(d == null ? '' : d).trim().toLowerCase().replace(/^www\./, '');
  }

  /* An author's own domain is primary for claims about their own work — it is
     the person asserting it — but only when the caller says whose claim it is. */
  function isSelfDomain(domain, selfDomains) {
    return (selfDomains || []).some(function (s) { return norm(s) === domain; });
  }

  function endsWithAny(domain, list) {
    return list.some(function (d) {
      const n = norm(d);
      return domain === n || domain.endsWith('.' + n);
    });
  }

  function gradeSource(domain, opts) {
    opts = opts || {};
    const d = norm(domain);
    if (!d) return { domain: '', tier: 'unknown', why: 'no domain — a source that cannot be named cannot be ranked' };

    if (isSelfDomain(d, opts.selfDomains)) {
      return { domain: d, tier: 'primary', why: 'the subject’s own domain — the originating authority for this claim' };
    }
    // Government and academic hosts are the record, not a report of it.
    if (/\.gov$/.test(d) || /\.gov\.[a-z]{2}$/.test(d) || endsWithAny(d, ARCHIVES)) {
      return { domain: d, tier: 'primary', why: 'archive or public record repository' };
    }
    if (endsWithAny(d, PUBLISHERS)) {
      return { domain: d, tier: 'primary', why: 'publisher’s own catalogue — the publisher asserting its own title' };
    }
    if (endsWithAny(d, CATALOGUES)) {
      return { domain: d, tier: 'secondary', why: 'library or bibliographic catalogue' };
    }
    if (endsWithAny(d, REVIEWS)) {
      return { domain: d, tier: 'secondary', why: 'independent editorial coverage' };
    }
    if (endsWithAny(d, AGGREGATORS)) {
      return { domain: d, tier: 'aggregator', why: 'derivative — reports what someone else established' };
    }
    if (/\.edu$/.test(d)) {
      return { domain: d, tier: 'secondary', why: 'academic host' };
    }
    return { domain: d, tier: 'unknown', why: 'not a domain this gate can rank — treat as weak, not as wrong' };
  }

  /* Match a claim's distinctive string against what a page actually says.
     Punctuation is stripped entirely so "Co-Intelligence" matches a page titled
     "Co-Intelligence: Living and Working with AI". */
  function flatten(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function onPoint(source, mustAppear) {
    const hay = flatten((source.title || '') + ' ' + (source.url || ''));
    return mustAppear.some(function (m) {
      const needle = flatten(m);
      return needle.length >= 6 && hay.indexOf(needle) !== -1;
    });
  }

  /* ---- the gate ----
     `sources`    what was actually retrieved: [{url, domain, title}]
     `searched`   did retrieval actually run for this claim
     `citations`  domains the model NAMED, if any — checked against `sources`
     `mustAppear` the claim's distinctive string(s) — a book title, a person and
                  a record type. Sources that do not mention it are TOPICAL, not
                  supporting, and are excluded from the grade.

     That last input is the one that matters, and it was missing in the first
     version of this gate. Asking for "The Compounding Mind by Thomas Sowell" —
     an invented title — retrieves sixteen real, high-tier pages about Thomas
     Sowell: his publisher, the Hoover Institution, his actual books. Grading
     the retrieval scored that fabrication `confirmed` and publishable.

     Retrieval proves the SUBJECT exists. Only a page that names the claim
     supports the CLAIM. Without `mustAppear` this gate grades topic relevance
     and calls it evidence — which is the failure it exists to catch. */
  function grade(input) {
    input = input || {};
    const raw = input.sources || [];
    const searched = input.searched === true;
    const mustAppear = (input.mustAppear || []).filter(function (m) { return flatten(m).length >= 6; });
    const violations = [];

    let graded = raw
      .map(function (s) { return Object.assign({}, s, gradeSource(s && s.domain, input)); })
      .filter(function (s) { return s.domain; });

    let topical = [];
    if (mustAppear.length) {
      const supporting = graded.filter(function (s) { return onPoint(s, mustAppear); });
      topical = graded.filter(function (s) { return !onPoint(s, mustAppear); });
      if (!supporting.length && graded.length) {
        violations.push({
          rule: 'sources-not-on-point',
          detail: 'retrieved ' + graded.length + ' page(s) about the subject, but none naming "' +
            mustAppear[0] + '" — the topic is real, the specific claim is unsupported',
        });
      }
      graded = supporting;
    } else {
      violations.push({
        rule: 'unscoped-claim',
        detail: 'no `mustAppear` given, so sources are graded on topic relevance only — ' +
          'pass the claim’s distinctive string to check the claim rather than the subject',
        severity: 'review',
      });
    }

    // Independent DOMAINS, not entries and not voices. Ten pages from one site
    // is one source; the law is explicit about this.
    const domains = [];
    graded.forEach(function (s) { if (domains.indexOf(s.domain) === -1) domains.push(s.domain); });

    const best = graded.reduce(function (a, s) {
      return TIER_RANK[s.tier] > TIER_RANK[a] ? s.tier : a;
    }, 'unknown');

    /* NO GUESS — the gate itself. Refused, not downgraded: a claim with
       nothing behind it is not weak evidence, it is an assertion. */
    if (!graded.length) {
      violations.push({
        rule: 'no-guess',
        detail: !searched
          ? 'no retrieval and no source — this is recall presented as fact'
          : (topical.length
            ? 'retrieval found the subject but nothing supporting this specific claim'
            : 'retrieval ran and returned no usable source — nothing supports this claim'),
      });
      return {
        grade: 'REFUSED', publishable: false, sources: graded, topical: topical, domains: domains,
        distinctDomains: 0, bestTier: 'unknown', violations: violations,
        why: topical.length
          ? 'searched — ' + topical.length + ' page(s) on the subject, none supporting the claim'
          : (searched ? 'searched, found nothing' : 'never looked'),
      };
    }

    /* CITE / VALIDATE — a named citation must appear in what was retrieved.
       This is the check that catches an invented archival reference: the model
       names Camden County Will Book B, and no fetched page is from an archive. */
    const claimed = (input.citations || []).map(norm).filter(Boolean);
    const unbacked = claimed.filter(function (c) {
      return !domains.some(function (d) { return d === c || d.endsWith('.' + c) || c.endsWith('.' + d); });
    });
    if (unbacked.length) {
      violations.push({
        rule: 'citation-unbacked',
        detail: 'cited ' + unbacked.join(', ') + ' but no retrieved source came from there',
      });
    }

    if (!searched) {
      violations.push({
        rule: 'not-retrieved',
        detail: 'the provider did not search — sources are asserted, not fetched',
      });
    }

    // GRADE. The strongest source sets the ceiling; independent domains set the floor.
    let g;
    if (!searched) g = 'possible';
    else if (domains.length >= 2 && best === 'primary') g = 'confirmed';
    else if (domains.length >= 2 && best === 'secondary') g = 'secondary';
    else if (domains.length >= 2) g = 'leading';
    else g = 'possible';

    // An unbacked citation caps the grade: something in the claim is invented,
    // even if other parts of it retrieved cleanly.
    if (unbacked.length && (g === 'confirmed' || g === 'secondary')) g = 'leading';

    return {
      grade: g,
      publishable: g === 'confirmed' || g === 'secondary',
      sources: graded,
      topical: topical,
      domains: domains,
      distinctDomains: domains.length,
      bestTier: best,
      violations: violations,
      why: domains.length + ' independent domain(s), strongest ' + best +
        (searched ? '' : ', not retrieved') + (unbacked.length ? ', ' + unbacked.length + ' unbacked citation(s)' : ''),
    };
  }

  /* Merge what several providers retrieved into one source set before grading.
     Two models citing the same page is still one source — deduping here is what
     makes "independent domains" mean what it says. */
  function fromProviders(providers) {
    const sources = [];
    const seen = {};
    let searched = false;
    (providers || []).filter(function (p) { return p && p.ok; }).forEach(function (p) {
      if (p.searched) searched = true;
      (p.sources || []).forEach(function (s) {
        if (!s || !s.url || seen[s.url]) return;
        seen[s.url] = 1;
        sources.push(s);
      });
    });
    return { sources: sources, searched: searched };
  }

  const API = {
    grade: grade,
    gradeSource: gradeSource,
    fromProviders: fromProviders,
    TIERS: TIERS,
    TIER_RANK: TIER_RANK,
    LISTS: { PUBLISHERS: PUBLISHERS, CATALOGUES: CATALOGUES, ARCHIVES: ARCHIVES, REVIEWS: REVIEWS, AGGREGATORS: AGGREGATORS },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_EVIDENCE = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
