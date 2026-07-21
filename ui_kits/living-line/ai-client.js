/* ============================================================
   The Living Line — AI seam  (window.CASON_AI)
   ------------------------------------------------------------
   One adapter over three backends, deterministic by default:
     • templated   — offline, free, horizon-bounded (ships now / default)
     • live        — real Claude via /api/persona (needs ANTHROPIC_API_KEY)
     • consensus   — Grok + Gemini + Claude cross-check via /api/consensus
   The browser only ever sends horizon-accessible facts; keys live server-side.
   Responses are cached (memory + localStorage) so repeats are free.
   ============================================================ */
(function (root) {
  'use strict';
  function MEM() { return root.CASON_MEMORY; }
  function PERS() { return root.CASON_PERSONAS; }
  function DATA() { return root.CASON_DATA; }
  function H() { return root.CASON_MEMORY_API.helpers; }

  const mem = {};
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return (h >>> 0).toString(16); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* the horizon-bounded context handed to the live model.
     simNow (optional) pins the persona to a year of their life -- the
     "interview them at age N" seam: at 1823 a 60-yr-old Ransom anticipates
     the Florida move; at 1848 an 85-yr-old Ransom has lived it. */
  function contextFor(personId, simNow) {
    // includeKin: a persona may draw on what its immediate family shared -- but
    // those memories are handed over LABELLED (see `shared`), never as its own
    // firsthand recollection, and still bounded by this persona's own horizon.
    const opts = { includeKin: true };
    if (simNow != null) opts.simNow = simNow;
    const sub = MEM().access(personId, opts);
    const per = PERS().byId[personId];
    const p = DATA().people[personId];
    const people = DATA().people;
    const facts = [], shared = [];
    sub.individual.forEach(function (n) {
      if (n.kind === 'gap' || n.evidence === 'disproven' || n.evidence === 'eliminated') return;
      if (n.ownerId && n.ownerId !== personId) {                      // a kin member's memory, through them
        const peer = people[n.ownerId];
        shared.push((peer ? peer.name.split(' ')[0] : 'kin') + ': ' + n.text);
      } else facts.push(n.text);
    });
    sub.family.slice(0, 20).forEach(function (n) { facts.push(n.text); });
    sub.generational.slice(0, 8).forEach(function (n) { facts.push(n.text); });
    const gaps = sub.individual.filter(function (n) { return n.kind === 'gap' && (!n.ownerId || n.ownerId === personId); }).map(function (n) { return n.text; });
    const forbidden = (MEM().byOwner[personId] || []).filter(function (n) { return n.evidence === 'disproven' || n.evidence === 'eliminated'; }).map(function (n) { return n.text; });
    return {
      name: p.name, lifespan: p.lifespan, era: per.era,
      year: (simNow != null) ? simNow : (H().deathYearOf(p) || H().birthYearOf(p)),
      asOfYear: (simNow != null) ? simNow : null,   // the interview horizon, if pinned
      occupation: per.occupation, voice: per.voice.register, personality: per.personality.join(', '),
      facts: facts, shared: shared.slice(0, 20), gaps: gaps, forbidden: forbidden,
    };
  }

  /* deterministic, offline voice — always available. simNow (optional)
     bounds the voice to a year of the persona's life, same as the live seam. */
  function templated(personId, msg, simNow) {
    const sub = MEM().access(personId, (simNow != null) ? { simNow: simNow } : undefined);
    const per = PERS().byId[personId];
    const p = DATA().people[personId];
    const q = (msg || '').toLowerCase();
    const idioms = (per.voice && per.voice.idioms) || [];
    const idiom = idioms.length ? idioms[Math.floor(Math.random() * idioms.length)] : null;
    const events = sub.individual.filter(function (n) { return (n.kind === 'event' || n.kind === 'fact') && n.evidence !== 'disproven' && n.evidence !== 'eliminated'; });
    let text;
    if (/missing|don'?t know|do not know|question|wonder|unknown/.test(q)) {
      const gaps = sub.individual.filter(function (n) { return n.kind === 'gap'; });
      text = gaps.length ? 'What I cannot yet answer: ' + gaps.map(function (g) { return g.text; }).join(' ') : 'Little troubles me as missing — though much of any life goes unwritten.';
    } else if (/reflect|think on|feel|believe/.test(q)) {
      const eng = root.CASON_ENGINE;
      const r = eng ? eng._internals.reflectionFor(per, sub, eng._internals.makeRng(personId + '|chat')) : null;
      text = r ? r.text : (per.wisdom[0] || 'I keep my own counsel.');
    } else if (!q || /life|who are you|your story|tell me|yourself|name|born|raise/.test(q)) {
      const lead = events.slice(0, 3).map(function (n) { return n.text; }).join(' ');
      text = p.name.split(' ')[0] + ' speaking. ' + (lead || (per.provenance.reconstructed ? 'Little of my life was written down — my story is still being traced.' : '')) + ' ' + (per.wisdom[0] || '');
    } else {
      const words = q.split(/\W+/).filter(function (w) { return w.length > 3; });
      const hit = events.find(function (n) { return words.some(function (w) { return n.text.toLowerCase().indexOf(w) !== -1; }); });
      text = hit ? hit.text : 'I cannot rightly speak to that — ' + (idiom || 'it lies beyond what I know') + '.';
    }
    if (idiom && Math.random() < 0.4) text = text + ' ' + cap(idiom) + '.';
    return { text: String(text).trim(), mode: 'templated', sources: events.slice(0, 3).map(function (n) { return n.id; }) };
  }

  function personaRespond(opts) {
    opts = opts || {};
    const personId = opts.personId, userMessage = opts.userMessage || '';
    const simNow = (opts.simNow != null) ? opts.simNow : null;   // interview horizon (optional)
    if ((opts.mode || 'templated') !== 'live') return Promise.resolve(templated(personId, userMessage, simNow));
    const ck = 'cason-ai-' + hash(personId + '|' + (simNow != null ? simNow : '') + '|' + userMessage + '|' + (opts.history || []).map(function (m) { return m.content; }).join('|'));
    const cached = mem[ck] || lsGet(ck);
    if (cached) { try { return Promise.resolve(Object.assign({ cached: true }, JSON.parse(cached))); } catch (e) {} }
    const ctx = contextFor(personId, simNow);
    ctx.userMessage = userMessage; ctx.history = opts.history || [];
    return fetch('/api/persona', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ctx) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) {
        if (!o.ok || o.j.error) throw new Error(o.j.error || 'request failed');
        const out = { text: o.j.reply, mode: 'live', sources: [] };
        mem[ck] = JSON.stringify(out); lsSet(ck, JSON.stringify(out));
        return out;
      });
  }

  function researchConsensus(question, context) {
    const ck = 'cason-consensus-' + hash(question + '|' + (context || ''));
    const cached = mem[ck] || lsGet(ck);
    if (cached) { try { return Promise.resolve(Object.assign({ cached: true }, JSON.parse(cached))); } catch (e) {} }
    return fetch('/api/consensus', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: question, context: context }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) {
        if (!o.ok || o.j.error) throw new Error(o.j.error || 'request failed');
        mem[ck] = JSON.stringify(o.j); lsSet(ck, JSON.stringify(o.j));
        return o.j;
      });
  }

  root.CASON_AI = { personaRespond: personaRespond, researchConsensus: researchConsensus, templated: templated, contextFor: contextFor };
})(typeof window !== 'undefined' ? window : this);
