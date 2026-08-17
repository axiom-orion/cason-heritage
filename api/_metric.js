/* Shared server-side helpers for the gated book reader.
   Vercel does not route files beginning with an underscore, so this is a module, not an endpoint.

   ── THE ONE RULE THIS FILE EXISTS TO ENFORCE ────────────────────────────────────────────────
   The browser never holds a Supabase credential of any kind. It holds a preview key, and every
   request re-checks it here against a hash. That means revoking a key takes effect on the very
   next request with no session to expire and nothing to invalidate -- which is the property he
   actually asked for: "i can give out the key to who i want to preview it," and take it back.

   No JWT, no session table, no refresh dance. The key IS the session, and it is checked every
   time. Slightly more database reads, and vastly less to get wrong. */
const crypto = require('crypto');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function configured() {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

function sb(path, opts) {
  opts = opts || {};
  return fetch(SUPABASE_URL + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      apikey: SERVICE_KEY,
      authorization: 'Bearer ' + SERVICE_KEY,
      'content-type': 'application/json',
    }, opts.headers || {}),
    body: opts.body,
  });
}

function hashKey(key) {
  return crypto.createHash('sha256').update(String(key), 'utf8').digest('hex');
}

function body(req) {
  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
  return p || {};
}

/* Returns the key row, or null. Also bumps uses/last_seen so he can see which preview keys are
   actually being read and which were never opened -- the same question the book keeps asking
   about instruments nobody looks at.

   ⚠ BRUTE FORCE IS ANSWERED BY KEY LENGTH, NOT BY RATE LIMITING, AND THAT IS A DELIBERATE CALL.
   web-sync.sh mints 128 bits of randomness per key. Guessing one is not a thing that happens.
   Serverless functions have no shared memory to count attempts in, so an in-process limiter would
   be theatre -- it would reset on every cold start while reading as protection. If this ever needs
   real throttling it belongs in the Vercel firewall, not in this file. */
async function checkKey(key) {
  if (!key || typeof key !== 'string' || key.length < 16) return null;
  const hash = hashKey(key.trim());
  const q = '/rest/v1/metric_keys?select=id,label,revoked,expires_at&key_hash=eq.' +
            encodeURIComponent(hash) + '&limit=1';
  const r = await sb(q);
  if (!r.ok) return null;
  const rows = await r.json();
  const row = rows && rows[0];
  if (!row || row.revoked) return null;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;
  // fire-and-forget; a failed bookkeeping write must never deny a valid read
  sb('/rest/v1/metric_keys?id=eq.' + row.id, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ last_seen_at: new Date().toISOString(), uses: (row.uses || 0) + 1 }),
  }).catch(function () {});
  return row;
}

/* Every endpoint answers the same way so the page has one error path.
   ⛔ NOINDEX ON THE API TOO. The page carries a robots meta tag, but an endpoint that returns the
   text of a chapter is exactly as indexable as the page that renders it, and a crawler that finds
   a URL does not read the HTML first. */
function guard(res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

async function handle(req, res, fn) {
  guard(res);
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!configured()) {
    res.status(501).json({ error: 'Reader not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    return;
  }
  const p = body(req);
  const who = await checkKey(p.key);
  if (!who) { res.status(401).json({ error: 'That key is not valid.' }); return; }
  try {
    await fn(p, who, res);
  } catch (e) {
    res.status(500).json({ error: 'Server error: ' + (e && e.message ? e.message : String(e)) });
  }
}

module.exports = { sb, handle, hashKey, guard, configured };
