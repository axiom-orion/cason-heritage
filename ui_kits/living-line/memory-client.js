/* ============================================================
   The Living Line — Durable Memory Client  (window.CASON_MEMORY_CLIENT)
   ------------------------------------------------------------
   The Keeper is stateless across runs; this gives it durable, growing,
   semantically-retrievable memory by calling the sibling service
   **agent-memory-service** (FastAPI) over HTTP. The service consolidates
   episodic findings into semantic facts and SUPERSEDES stale ones, keyed
   on (subject, attribute) — so a later corroborated finding marks an
   earlier one inactive rather than letting both coexist.

   This complements (does not replace) the in-repo supersession ledger:
     • supersessions.js — the curated RECORD's change-history (human truth)
     • this            — the KEEPER's own research memory across its runs

   Speaks the deployed contract (serve/app.py):
     POST /recall   { query, k }                     -> { records: [...] }   (public)
     POST /ingest   { records: [{id,text,ts_day,subject,attribute,value,importance}] }
     POST /consolidate?now_day=N                                            (Bearer)
     GET  /stats                                     -> { active, superseded }
     GET  /pag/verify -> { ok, length, head, signed, actor }                (public)

   That last is the PAG (Provenance Attestation Graph): the service records every
   memory operation in an append-only, hash-chained, actor-attributed log, and
   /pag/verify reports its integrity — provenance the Keeper relies on but does
   not itself hold. The Keeper can confirm the chain verifies before trusting a
   recall (and surface it in the glass-box).

   Config (env): KEEPER_MEMORY_URL (base), KEEPER_MEMORY_TOKEN (admin Bearer).
   ENV-GATED + GRACEFUL: unset URL => enabled() is false and every call is a
   safe no-op; any network/HTTP error returns empty rather than throwing, so a
   memory outage never fails a Keeper run. `recall` is public; `ingest`/
   `consolidate` need the token (return false without it — recall still works).

   Runs no-build under Node (the Keeper) and in the browser.
   ============================================================ */
(function (root) {
  'use strict';

  function env(k) { return (typeof process !== 'undefined' && process.env && process.env[k]) || ''; }
  function cfg() { return { url: env('KEEPER_MEMORY_URL').replace(/\/+$/, ''), token: env('KEEPER_MEMORY_TOKEN') }; }
  function enabled() { return !!cfg().url; }

  async function post(pathname, body, needsAuth) {
    const c = cfg();
    if (!c.url) return null;
    if (needsAuth && !c.token) return null; // admin route without a token — skip cleanly
    const headers = { 'content-type': 'application/json' };
    if (needsAuth && c.token) headers.authorization = 'Bearer ' + c.token;
    const ctl = new AbortController();
    const t = setTimeout(function () { ctl.abort(); }, 15000);
    try {
      const r = await fetch(c.url + pathname, { method: 'POST', headers: headers, body: JSON.stringify(body || {}), signal: ctl.signal });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; } finally { clearTimeout(t); }
  }

  // public, read-only — ranked prior memory for a query.
  async function recall(query, k) {
    const j = await post('/recall', { query: String(query == null ? '' : query), k: k || 5 }, false);
    return (j && Array.isArray(j.records)) ? j.records : [];
  }
  // Bearer — persist this run's findings as episodic memories.
  async function ingest(records) {
    if (!Array.isArray(records) || !records.length) return false;
    const j = await post('/ingest', { records: records }, true);
    return !!(j && typeof j.ingested === 'number');
  }
  // Bearer — distil episodic -> semantic and supersede stale (subject,attribute) values.
  async function consolidate(nowDay) {
    const j = await post('/consolidate?now_day=' + (nowDay || 0), {}, true);
    return !!(j && j.ok);
  }
  async function stats() {
    const c = cfg();
    if (!c.url) return null;
    try { const r = await fetch(c.url + '/stats'); return r.ok ? await r.json() : null; } catch (e) { return null; }
  }
  // public — provenance-chain integrity of the durable memory (PAG). Returns the
  // verify report ({ ok, length, head, signed, actor }) or null when unconfigured /
  // unreachable; never throws, so a provenance check never fails a Keeper run.
  async function pagVerify() {
    const c = cfg();
    if (!c.url) return null;
    try { const r = await fetch(c.url + '/pag/verify'); return r.ok ? await r.json() : null; } catch (e) { return null; }
  }

  const API = { enabled: enabled, recall: recall, ingest: ingest, consolidate: consolidate, stats: stats, pagVerify: pagVerify };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.CASON_MEMORY_CLIENT = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
