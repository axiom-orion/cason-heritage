/* ============================================================
   The Living Line — Seasonal refresh  (window.CASON_SEASON)
   ------------------------------------------------------------
   Content freshness without a backend: the page re-themes with the
   real calendar season and rotates what it features — a persona, a
   documented fact to remember, the open line the family is chasing,
   and where the digging goes this season. Everything is DERIVED from
   the record (CASON_DATA / CASON_MEMORY / CASON_PERSONAS) and chosen
   deterministically (seeded by year+season), so it is stable within a
   load, reproducible, and never invents a fact. The seasonal framing
   is agrarian texture — clearly engine flavor, never asserted as
   documented fact.

   The same rotation is what the quarterly Keeper "season report" pass
   summarizes; this module is the single source of that truth.
   ============================================================ */
(function (root) {
  'use strict';
  function DATA() { return root.CASON_DATA; }
  function MEM() { return root.CASON_MEMORY; }
  function PERS() { return root.CASON_PERSONAS; }

  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function digest(s) { return hash(s).toString(16).padStart(8, '0'); }
  function pick(list, seed) { return list.length ? list[hash(seed) % list.length] : null; }

  // meteorological seasons, northern hemisphere (the Florida homestead)
  function seasonOf(month) { return month <= 1 || month === 11 ? 'winter' : month <= 4 ? 'spring' : month <= 7 ? 'summer' : 'fall'; }
  const SEASONS = {
    winter: { label: 'Winter', emoji: '❄️', accent: '#2d5a4a', theme: 'Hog-killing and mending weather — the year pulled close to the hearth, the ledger squared before spring.' },
    spring: { label: 'Spring', emoji: '🌱', accent: '#2d7a4a', theme: 'Seedbeds broken and the first planting — the season the line always bet on, year after year.' },
    summer: { label: 'Summer', emoji: '🌾', accent: '#9a7b2d', theme: 'The long working light — cattle, turpentine, the river, and the crop carried through the heat.' },
    fall: { label: 'Autumn', emoji: '🍂', accent: '#8b4513', theme: 'Harvest and the curing barns — laying provisions in, and the moves that always seemed to come once the crop was in.' },
  };

  // where the real archival digging points, rotated by season (from the open edges)
  const ARCHIVAL = [
    'Pitt County, NC — deed books & tax lists, 1750–1800 (the Gen-5 father).',
    'English parish registers — Casson/Cason baptisms 1595–1610 across Lincolnshire, Cambridgeshire & Norfolk (the origin).',
    'The Mundens before Georgia — Currituck & Princess Anne Co. records (Phoebe’s people).',
    'Living descendants — obituaries & oral history, 2000–present (the line forward).',
  ];

  // living descendants are opt-in/minimal — never the public seasonal feature.
  function isLiving(id) { const p = DATA().people[id]; return !!(p && (p.tags || []).indexOf('living') !== -1); }
  function eligiblePeople() {
    const p = DATA().people;
    return Object.keys(p).filter(function (id) { return !isLiving(id) && p[id].narrative && p[id].narrative.length >= 140; }).sort();
  }
  function factNodes() {
    return (MEM().nodes || []).filter(function (n) {
      return (n.kind === 'event' || n.kind === 'fact') && ['confirmed', 'secondary', 'leading'].indexOf(n.evidence) !== -1 &&
        !isLiving(n.ownerId) && n.text && n.text.length >= 40 && n.text.length <= 240;
    }).sort(function (a, b) { return (a.id || '').localeCompare(b.id || ''); });
  }
  function questionNodes() {
    const gaps = (MEM().nodes || []).filter(function (n) { return n.kind === 'gap' && n.text; });
    const authored = gaps.filter(function (n) { return n.evidence === 'possible'; });
    return (authored.length ? authored : gaps).sort(function (a, b) { return (a.text || '').localeCompare(b.text || ''); });
  }
  function nm(id) { const p = DATA().people[id]; return p ? p.name : id; }

  function current(date) {
    date = date || new Date();
    const season = seasonOf(date.getMonth());
    const cfg = SEASONS[season];
    const seed = date.getFullYear() + '|' + season;

    const fid = pick(eligiblePeople(), 'feat|' + seed);
    const fact = pick(factNodes(), 'fact|' + seed);
    const q = pick(questionNodes(), 'ask|' + seed);
    const archivalFocus = ARCHIVAL[hash('dig|' + seed) % ARCHIVAL.length];

    const people = Object.keys(DATA().people);
    let sources = 0; people.forEach(function (id) { sources += (DATA().people[id].sources || []).length; });
    const openLines = (MEM().nodes || []).filter(function (n) { return n.kind === 'gap'; }).length;
    const stats = { people: people.length, sources: sources, openLines: openLines };

    return {
      date: date, season: season, label: cfg.label, emoji: cfg.emoji, accent: cfg.accent, theme: cfg.theme,
      featured: fid ? { id: fid, name: nm(fid), line: (DATA().people[fid].role || (DATA().people[fid].lifespan || '')) } : null,
      highlight: fact ? { text: fact.text, owner: fact.ownerId ? nm(fact.ownerId) : null, evidence: fact.evidence } : null,
      question: q ? { ownerId: q.ownerId, name: nm(q.ownerId), text: q.text } : null,
      archivalFocus: archivalFocus,
      stats: stats,
      attest: 'gov:' + digest(JSON.stringify(stats) + '|' + season + '|' + date.getFullYear()),
    };
  }

  root.CASON_SEASON = { current: current, seasonOf: seasonOf, SEASONS: SEASONS };
})(typeof window !== 'undefined' ? window : this);
