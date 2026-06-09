/* Vercel serverless — the agent ingest door into the in-app review queue.
   The Keeper (and any other agent) POSTs honestly-tiered leads here; they land
   in cason_proposals (status 'pending') for in-app approval at the policy gate.
   No GitHub round-trip — findings show up on the Desk.

   Auth: a shared bearer token (KEEPER_INGEST_TOKEN). The Supabase service-role
   key stays server-side only (never the browser) and is used to insert as the
   agent identity (bypassing the members-only RLS the browser is held to). The
   in-app Review queue re-runs the FULL policy gate on display, so even a bad
   token can only enqueue 'pending' items that still cannot be approved if they
   violate policy. Raw fetch, no deps. */
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://sqrducmuobczigncbfdy.supabase.co').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INGEST_TOKEN = process.env.KEEPER_INGEST_TOKEN;
// server-side backstop: never enqueue a quarantined myth, even if an agent slips.
const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
const TIERS = ['possible', 'leading', 'unsolved', 'disproven', 'secondary', 'confirmed'];
const ORIGINS = ['keeper', 'consensus', 'member'];

function clamp(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!SERVICE_KEY) { res.status(501).json({ error: 'Ingest not configured — set SUPABASE_SERVICE_ROLE_KEY.' }); return; }
  const auth = req.headers.authorization || '';
  if (!INGEST_TOKEN || auth !== 'Bearer ' + INGEST_TOKEN) { res.status(401).json({ error: 'Unauthorized.' }); return; }

  let p = req.body; if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } } p = p || {};
  const items = Array.isArray(p.proposals) ? p.proposals : [p];
  const rows = [];
  items.forEach(function (it) {
    it = it || {};
    const summary = clamp(it.summary || it.text || '', 1200).trim();
    if (!summary || BANNED.test(summary)) return;
    let evidence = String(it.evidence || 'possible'); if (TIERS.indexOf(evidence) === -1) evidence = 'possible';
    let origin = String(it.origin || 'keeper'); if (ORIGINS.indexOf(origin) === -1) origin = 'keeper';
    rows.push({
      person_id: it.personId || it.person_id || null,
      kind: clamp(it.kind || 'write_record', 40),
      summary: summary,
      evidence: evidence,
      source: clamp(it.source || 'AI consensus (Grok · Gemini · Claude)', 400),
      justification: clamp(it.justification || '', 600) || null,
      origin: origin,
      submitter_email: clamp(it.submitterEmail || 'keeper@flcason.com', 120),
      submitter_name: clamp(it.submitterName || 'The Keeper', 80),
    });
  });
  if (!rows.length) { res.status(400).json({ error: 'No valid proposals (empty, or all caught by the myth backstop).' }); return; }

  const r = await fetch(SUPABASE_URL + '/rest/v1/cason_proposals', {
    method: 'POST',
    headers: { apikey: SERVICE_KEY, authorization: 'Bearer ' + SERVICE_KEY, 'content-type': 'application/json', prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
  const text = await r.text();
  if (!r.ok) { res.status(502).json({ error: 'insert failed: ' + r.status + ' ' + text.slice(0, 300) }); return; }
  let data = []; try { data = JSON.parse(text); } catch (e) {}
  res.status(200).json({ ok: true, inserted: (data && data.length) || rows.length, ids: (data || []).map(function (d) { return d.id; }) });
};
