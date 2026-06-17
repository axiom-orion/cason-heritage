/* ============================================================
   The Living Line — Durable memory client self-test  (run under Node)
     node ui_kits/living-line/memory-client.selftest.js
   ------------------------------------------------------------
   Spins a tiny in-process mock of agent-memory-service's HTTP contract
   (/recall public, /ingest + /consolidate Bearer-guarded) and asserts the
   client speaks it correctly and degrades gracefully:
     1. enabled() reflects KEEPER_MEMORY_URL.
     2. recall is public and returns the records array.
     3. ingest requires the Bearer token (false without; true with), and
        sends the contract's record shape.
     4. consolidate posts now_day and is Bearer-guarded.
     5. a memory outage / unset URL never throws — calls no-op safely.
   Exit code 0 = all pass.
   ============================================================ */
'use strict';
const http = require('http');
const path = require('path');

let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } }

// --- a mock that mirrors serve/app.py: /recall public, /ingest & /consolidate Bearer ---
const TOKEN = 'test-token';
let lastIngest = null;
const store = [
  { id: 1, content: "Ransom Cason Sr. — leading: corroborated by two models.", type: 'semantic', importance: 0.7, superseded: false },
  { id: 2, content: "Ransom Cason Sr. — possible: a single-source lead.", type: 'episodic', importance: 0.5, superseded: true },
];
function authed(req) { return (req.headers.authorization || '') === 'Bearer ' + TOKEN; }
const server = http.createServer(function (req, res) {
  let body = '';
  req.on('data', function (c) { body += c; });
  req.on('end', function () {
    let j = {}; try { j = JSON.parse(body || '{}'); } catch (e) {}
    const send = function (code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    const url = req.url.split('?')[0];
    if (req.method === 'POST' && url === '/recall') return send(200, { records: store }); // public
    if (req.method === 'GET' && url === '/stats') return send(200, { active: 1, superseded: 1 });
    if (req.method === 'GET' && url === '/pag/verify') return send(200, { ok: true, length: 7, head: 'a1b2c3', signed: false, actor: { agent_id: 'memory-service', attestation_level: 'config-hash' } }); // public PAG integrity
    if (req.method === 'POST' && (url === '/ingest' || url === '/consolidate')) {
      if (!authed(req)) return send(401, { detail: 'missing bearer token' });
      if (url === '/ingest') { lastIngest = j.records; return send(200, { ingested: (j.records || []).length }); }
      return send(200, { ok: true });
    }
    send(404, { detail: 'not found' });
  });
});

function load() { delete require.cache[require.resolve('./memory-client.js')]; return require('./memory-client.js'); }

server.listen(0, async function () {
  const port = server.address().port;
  console.log('Durable memory client self-test (mock on :' + port + ')\n');

  // 1. unset URL -> disabled + safe no-ops
  delete process.env.KEEPER_MEMORY_URL; delete process.env.KEEPER_MEMORY_TOKEN;
  let MEM = load();
  ok('enabled() is false when KEEPER_MEMORY_URL is unset', MEM.enabled() === false);
  ok('recall() no-ops to [] when unconfigured (never throws)', (await MEM.recall('x')).length === 0);
  ok('ingest() no-ops to false when unconfigured', (await MEM.ingest([{ id: 'a', text: 'x', ts_day: 1 }])) === false);

  // 2. configured, no token -> recall (public) works; ingest (Bearer) declines cleanly
  process.env.KEEPER_MEMORY_URL = 'http://127.0.0.1:' + port;
  MEM = load();
  ok('enabled() is true with URL set', MEM.enabled() === true);
  const recs = await MEM.recall('who was Ransom\'s father?', 5);
  ok('recall() returns the records array (public, no token)', recs.length === 2 && recs[0].content.indexOf('Ransom') !== -1);
  ok('recall() surfaces the superseded flag', recs.some(function (r) { return r.superseded === true; }));
  ok('ingest() returns false without a token (admin route)', (await MEM.ingest([{ id: 'a', text: 'x', ts_day: 1 }])) === false);

  // 3. configured WITH token -> ingest + consolidate succeed and send the contract shape
  process.env.KEEPER_MEMORY_TOKEN = TOKEN;
  MEM = load();
  const recIn = [{ id: 'keeper-2026-06-09-ransom-sr-0', text: 'Ransom — leading: ...', ts_day: 20600, subject: 'ransom-sr', attribute: 'gap:abc123', value: 'leading', importance: 0.7 }];
  ok('ingest() returns true with a valid token', (await MEM.ingest(recIn)) === true);
  ok('...and sent the (subject, attribute) keyed record shape', !!lastIngest && lastIngest[0].subject === 'ransom-sr' && lastIngest[0].attribute === 'gap:abc123');
  ok('consolidate() succeeds (Bearer)', (await MEM.consolidate(20600)) === true);
  ok('stats() returns active/superseded counts', (await MEM.stats()).superseded === 1);

  // 3b. PAG integrity — the provenance chain behind the durable memory (public)
  const pag = await MEM.pagVerify();
  ok('pagVerify() reads the provenance-chain integrity report', !!pag && pag.ok === true && pag.length === 7);
  ok('pagVerify() surfaces the attested actor + signed flag', !!pag && pag.actor.attestation_level === 'config-hash' && pag.signed === false);

  // 4. bad URL -> graceful (no throw, empty/false/null)
  process.env.KEEPER_MEMORY_URL = 'http://127.0.0.1:1'; // nothing listening
  MEM = load();
  ok('recall() to a dead endpoint no-ops to [] (graceful)', (await MEM.recall('x')).length === 0);
  ok('ingest() to a dead endpoint no-ops to false (graceful)', (await MEM.ingest(recIn)) === false);
  ok('pagVerify() to a dead endpoint no-ops to null (graceful)', (await MEM.pagVerify()) === null);

  // 5. unset URL -> pagVerify no-ops to null too
  delete process.env.KEEPER_MEMORY_URL;
  MEM = load();
  ok('pagVerify() returns null when unconfigured (never throws)', (await MEM.pagVerify()) === null);

  server.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed.');
  process.exit(fail ? 1 : 0);
});
