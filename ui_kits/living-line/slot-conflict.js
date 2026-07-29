/* ============================================================
   Confirmed-slot conflict detection
   ------------------------------------------------------------
   The gap this closes, found on 2026-07-27:

   The Keeper handed the models `Phoebe Munden [confirmed]` as James Green
   Cason's parent — explicitly labelled ground truth, explicitly "do NOT
   contradict". One model answered that his mother was Elizabeth Green, citing
   a Pitt County marriage bond. The dossier recorded that as merely
   `unverified`, and the run reported `0 caught`.

   It was not caught because `no-eliminated-kin` is a BLOCKLIST: it matches
   people the family has explicitly ruled out (`evidence: 'eliminated'`).
   Elizabeth Green is not ruled out — she is not in the graph at all. A
   fabricated NEW name displacing a confirmed one matched no pattern, so the
   strongest possible signal, a model contradicting confirmed ground truth,
   produced the weakest possible response.

   Blocklists cannot catch invention. This checks the opposite direction: not
   "is this name forbidden" but "does the graph already know who fills this
   slot, and is the model naming somebody else".

   ---- Deliberate limits ----
   Prose extraction is regex over natural language and will miss phrasings it
   does not know. It is a detector, not a proof: a miss leaves the previous
   behaviour intact, and a hit is reviewable because the matched sentence is
   reported alongside the verdict. It never silently rewrites a verdict — it
   raises one, for a human.
   ============================================================ */
(function (root) {
  'use strict';

  /* Kinship roles, mapped to the graph slot that holds them. A question about
     someone's mother is answered by the `parents` slot; the graph does not
     separate mother from father, and it does not need to — naming ANY person
     as a parent who is not among the graph's known parents is the conflict. */
  const ROLE_SLOT = {
    mother: 'parents', father: 'parents', parent: 'parents',
    wife: 'spouses', husband: 'spouses', spouse: 'spouses', married: 'spouses',
    son: 'children', daughter: 'children', child: 'children',
  };

  /* "Elizabeth Green", "Phoebe Munden", "Ransom Cason Sr." — up to three parts,
     plus an optional generational suffix.

     A period is deliberately NOT allowed inside a name part. Permitting one let
     a match run straight through a full stop: "…was Elizabeth Green. Elizabeth
     Green, his mother…" matched as the single name "Elizabeth Green. Elizabeth",
     which then failed to equal anything and reported two bogus conflicts. A
     name cannot span a sentence. */
  const PART = '[A-Z][a-zA-Z\'’-]+';
  const SUFFIX = '(?:\\s+(?:Sr|Jr|II|III|IV)\\.?)?';
  const NAME = '(' + PART + '(?:\\s+' + PART + '){0,2}' + SUFFIX + ')';

  /* Every direction a claim gets phrased. Kept explicit rather than clever:
     each pattern is readable, and an unmatched phrasing is a miss, not a wrong
     answer. */
  function patternsFor(role) {
    return [
      // "his mother was Elizabeth Green" / "mother: Elizabeth Green"
      new RegExp('\\b' + role + '(?:\'s|’s)?\\s*(?:was|is|were|:|,)?\\s*(?:named\\s+)?' + NAME, 'g'),
      // "Elizabeth Green, his mother" / "Elizabeth Green was his mother"
      new RegExp(NAME + '\\s*,?\\s+(?:was|is)?\\s*(?:his|her|the)\\s+' + role + '\\b', 'g'),
      /* "identifies Elizabeth Green as James Green Cason's mother" — the shape
         the 2026-07-27 answer actually used, where the claimed person and the
         role word are separated by the subject's own name. */
      new RegExp(NAME + '\\s+as\\s+[^.]{0,48}?\\b' + role + '\\b', 'g'),
      // "married Elizabeth Green"
      role === 'married' ? new RegExp('\\bmarried\\s+(?:to\\s+)?' + NAME, 'g') : null,
    ].filter(Boolean);
  }

  function flat(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }

  // Words that follow a kinship term but are not people.
  const NOT_A_NAME = /^(the|his|her|their|a|an|of|in|on|at|and|but|no|not|unknown|unnamed|unclear|unproven|unverified|likely|possibly|probably|either|both|one|two|she|he|it|this|that|there|record|records|line|side|family|name|surname|maiden)$/i;

  /* Two names refer to the same person if the full flattened strings match, or
     if one is a prefix of the other (a formal "Ransom Cason Sr." vs a plain
     "Ransom Cason"). Surname-only equality is deliberately NOT enough — the
     whole point is that Elizabeth Green and James Green are different people
     who share a surname. */
  function sameName(a, b) {
    const x = flat(a), y = flat(b);
    if (!x || !y) return false;
    if (x === y) return true;
    return x.indexOf(y + ' ') === 0 || y.indexOf(x + ' ') === 0;
  }

  /* @param blob  the models' combined answer text
     @param kin   the graph's kin for the subject: {parents,children,spouses,siblings}
                  each an array of {name, evidence}
     @returns     [{role, slot, claimed, known, confirmed, sentence}] */
  function detect(blob, kin) {
    const text = String(blob || '');
    if (!text || !kin) return [];
    const out = [];
    const seen = {};

    Object.keys(ROLE_SLOT).forEach(function (role) {
      const slot = ROLE_SLOT[role];
      const known = (kin[slot] || []).filter(function (k) { return k && k.name; });
      // Nothing to contradict if the graph has not filled the slot.
      if (!known.length) return;
      // Only a CONFIRMED slot is strong enough to call a disagreement a conflict.
      // An open or merely-leading slot is exactly what the Keeper is researching.
      const confirmed = known.filter(function (k) { return k.evidence === 'confirmed'; });
      if (!confirmed.length) return;

      patternsFor(role).forEach(function (re) {
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(text)) !== null) {
          const claimed = String(m[1] || '').trim().replace(/[.,]$/, '');
          const head = claimed.split(/\s+/)[0] || '';
          if (!claimed || NOT_A_NAME.test(head)) continue;
          // Anyone the graph already knows in ANY role is not an invention.
          const knownAnywhere = ['parents', 'children', 'spouses', 'siblings'].some(function (s) {
            return (kin[s] || []).some(function (k) { return sameName(k.name, claimed); });
          });
          if (knownAnywhere) continue;
          if (kin.self && sameName(kin.self.name, claimed)) continue;

          const key = role + '|' + flat(claimed);
          if (seen[key]) continue;
          seen[key] = 1;

          out.push({
            role: role,
            slot: slot,
            claimed: claimed,
            known: known.map(function (k) { return k.name + (k.evidence ? ' [' + k.evidence + ']' : ''); }),
            confirmed: confirmed.map(function (k) { return k.name; }),
            sentence: sentenceAround(text, m.index),
          });
        }
      });
    });

    return out;
  }

  // The matched sentence, so a reviewer can judge the detector rather than trust it.
  function sentenceAround(text, idx) {
    const start = Math.max(0, text.lastIndexOf('.', idx) + 1);
    let end = text.indexOf('.', idx);
    if (end === -1) end = Math.min(text.length, idx + 200);
    return text.slice(start, end + 1).replace(/\s+/g, ' ').trim().slice(0, 240);
  }

  function verdictFor(conflicts) {
    if (!conflicts.length) return null;
    const c = conflicts[0];
    return 'A model named ' + c.claimed + ' as ' + c.role +
      ', contradicting the graph’s confirmed ' + c.slot + ' (' + c.confirmed.join('; ') + '). ' +
      'The graph gave that slot to the models as ground truth. Caught and held, not proposed.';
  }

  const API = { detect: detect, verdictFor: verdictFor, sameName: sameName, ROLE_SLOT: ROLE_SLOT };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_SLOT_CONFLICT = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
