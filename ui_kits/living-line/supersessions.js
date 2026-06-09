/* ============================================================
   The Living Line — Supersession Ledger  (window.CASON_SUPERSESSIONS)
   ------------------------------------------------------------
   The record's *history of changes*, made machine-readable. When a
   genealogical claim is corrected, the honest move is not to silently
   overwrite it but to mark the old value SUPERSEDED — retained, dated,
   and queryable — so "what the record used to say, and why it changed"
   is auditable, not buried in prose. This is the supersession discipline
   the sibling repo `agent-memory-service` proves (keying a fact on
   (subject, attribute) and marking stale values inactive), applied to
   the curated family record.

   HONESTY — this ledger does not mutate `data.js` and invents nothing.
   Every record FORMALIZES a correction the family already wrote into a
   person's `notes`/`narrative`. The self-test enforces this: each
   record's `match` MUST be found in its subject's own documented text
   (and a name correction's `current` must equal the person's data.js
   name). A correction that isn't already documented cannot be added —
   "Steeple Morden", for instance, appears nowhere in data.js, so it is
   not here, only in the Keeper's belt-and-suspenders quarantine regex.

   Each record:
     subject     person id in CASON_DATA
     attribute   what changed (origin / birthYear / father / name / …)
     superseded  the old value, now inactive (kept, not deleted)
     current     the value that now stands
     status      'disproven' | 'eliminated'
     reason      why it changed
     basis       the record(s) that decided it
     match       a precise matcher the gate uses to refuse a re-assertion

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  var RECORDS = [
    {
      subject: 'thomas-sr', attribute: 'origin',
      superseded: 'Digswell, Hertfordshire', current: 'England (origin unproven)',
      status: 'disproven',
      reason: 'Cason/Casson is a Lincolnshire/Cambridgeshire/Norfolk surname, not Hertfordshire; the alleged 1608 baptism predates the Digswell register abstracts (which begin 1609).',
      basis: ['Digswell parish-register abstracts begin 1609'],
      match: /digswell/i,
    },
    {
      subject: 'thomas-sr', attribute: 'birthYear',
      superseded: 'b. 1608 (Digswell baptism)', current: 'c.1604',
      status: 'disproven',
      reason: 'A 1642 deposition records his age as 38 — birth ~1604; the 1608 baptism is discarded.',
      basis: ['1642 deposition (age 38)'],
      match: /1608 baptism|baptism[^.]{0,20}1608/i,
    },
    {
      subject: 'thomas-sr', attribute: 'father',
      superseded: 'son of John Cason', current: '(unproven)',
      status: 'eliminated',
      reason: 'No Digswell John Cason c.1580–1610 located in Hertfordshire manorial, will, or Quarter-Sessions records.',
      basis: [],
      match: /son of John Cason/i,
    },
    {
      subject: 'thomas-sr', attribute: 'arrival',
      superseded: '~1629 crossing', current: '1635 Harwood headright (Patent Book 1, p.124)',
      status: 'disproven',
      reason: 'The documented arrival is the 7 July 1635 headright of Capt. Thomas Harwood.',
      basis: ['Virginia Patent Book 1, p.124 (7 July 1635)'],
      match: /1629 crossing|crossing[^.]{0,20}1629/i,
    },
    {
      subject: 'thomas-sr', attribute: 'office',
      superseded: 'Church Warden of Lynnhaven Parish', current: '(unsupported)',
      status: 'disproven',
      reason: 'Appears in derivative IGI-era trees with no primary record support.',
      basis: [],
      match: /church warden/i,
    },
    {
      subject: 'elizabeth-keeling-leighton', attribute: 'name',
      superseded: 'Elizabeth Alcott', current: 'Elizabeth (Keeling) Leighton',
      status: 'disproven',
      reason: "The primary 1641 patent identifies her as the relict of William Leighton/Laighton; 'Alcott' is unsourced.",
      basis: ['1641 patent assignment (Elizabeth City County)'],
      match: /elizabeth alcott/i,
    },
    {
      subject: 'john-cason', attribute: 'role',
      superseded: 'stockholder in the "Virginia Land Company"', current: '(eliminated — no such company)',
      status: 'eliminated',
      reason: "There was no such company, and no John Cason appears in Kingsbury's Records of the Virginia Company.",
      basis: ['Kingsbury, Records of the Virginia Company (absence)'],
      match: /virginia land company/i,
    },
  ];

  function all() { return RECORDS.slice(); }
  function forSubject(id) { return RECORDS.filter(function (r) { return r.subject === id; }); }
  function find(id, attribute) { return RECORDS.filter(function (r) { return r.subject === id && r.attribute === attribute; }); }
  function current(id, attribute) { var r = find(id, attribute)[0]; return r ? r.current : null; }
  function superseded(id, attribute) { return find(id, attribute).map(function (r) { return r.superseded; }); }
  // the superseded values + their matchers, for the governance gate (no-superseded-value).
  function values() { return RECORDS.map(function (r) { return { label: r.superseded, match: r.match, current: r.current }; }); }

  var API = { records: RECORDS, all: all, forSubject: forSubject, find: find, current: current, superseded: superseded, values: values };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_SUPERSESSIONS = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
