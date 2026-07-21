#!/usr/bin/env node
/* ============================================================
   The Cason Line — MCP server  (Model Context Protocol, stdio)
   ------------------------------------------------------------
   Exposes the GOVERNED family record as MCP tools, so any MCP client
   (Claude Desktop, Claude Code, ...) can query it with the same
   guarantees the site enforces: kinship resolved from the curated graph,
   memory horizon-bounded to a persona's own year, disproven/eliminated
   facts withheld, sources named.

   It reuses the real browser modules (data.js, memory-graph.js, kinship.js,
   self-inquiry.js) loaded under Node — the same pattern keeper.js and the
   selftests use — so there is ONE source of truth, not a second copy.

   Zero dependencies: a hand-rolled JSON-RPC 2.0 loop over stdio (newline-
   delimited, per the MCP stdio transport). stdout carries ONLY protocol
   messages; everything else is routed to stderr. ASCII; no regex lookbehind.

   Run:      node scripts/mcp-server.js         (or: npm run mcp)
   Register: add to your client's MCP config, e.g. claude_desktop_config.json:
     { "mcpServers": { "cason": { "command": "node",
       "args": ["<abs-path>/scripts/mcp-server.js"] } } }
   ============================================================ */
'use strict';

// stdout is the protocol channel — keep stray logs off it (route to stderr).
console.log = function () { console.error.apply(console, arguments); };

const path = require('path');
const LIVING = path.join(__dirname, '..', 'ui_kits', 'living-line');
global.window = global;
require(path.join(__dirname, '..', 'ui_kits', 'family-tree-app', 'data.js'));
require(path.join(LIVING, 'memory-graph.js'));
require(path.join(LIVING, 'personas.js'));
require(path.join(LIVING, 'kinship.js'));
require(path.join(LIVING, 'self-inquiry.js'));

const DATA = global.CASON_DATA;
const MEM = global.CASON_MEMORY;
const KIN = global.CASON_KINSHIP;
const IQ = global.CASON_INQUIRY;

const SERVER = { name: 'cason-heritage', version: '1.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

/* ---- resolve a person by exact id, then exact name, then substring ---- */
function resolvePerson(q) {
  if (!q) return null;
  if (DATA.people[q]) return q;
  const needle = String(q).toLowerCase();
  const ids = Object.keys(DATA.people);
  let hit = ids.filter(function (id) { return String(DATA.people[id].name || '').toLowerCase() === needle; })[0];
  if (hit) return hit;
  return ids.filter(function (id) { return String(DATA.people[id].name || '').toLowerCase().indexOf(needle) !== -1; })[0] || null;
}
function relKey(rel) { return rel === 'spouse' ? 'spouses' : rel; }
function fmtKin(list) {
  return (list && list.length)
    ? list.map(function (x) { return x.name + (x.evidence ? ' [' + x.evidence + ']' : ''); })
    : ['(none recorded)'];
}

/* ---- the tools ---- */
const TOOLS = [
  {
    name: 'find_person',
    description: 'Search the Cason family record by name (or part of a name). Returns matching people with their ids, lifespans, and generation. Use the id with the other tools.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'a name or part of a name, e.g. "Thadeous" or "Cason"' } }, required: ['query'] },
  },
  {
    name: 'resolve_kin',
    description: 'Resolve a person\'s kin (parents, children, spouse, siblings) DETERMINISTICALLY from the curated family graph, each tagged with its evidence tier. Never guesses; a relation the graph does not know is reported as open.',
    inputSchema: { type: 'object', properties: {
      person: { type: 'string', description: 'person id or name' },
      relation: { type: 'string', enum: ['parents', 'children', 'spouse', 'siblings'], description: 'optional; omit to get all relations' },
    }, required: ['person'] },
  },
  {
    name: 'person_memory',
    description: 'What a persona knows about itself and its family, HORIZON-BOUNDED. With asOfYear, you meet them at that year of their life: they know nothing later, and disproven/eliminated claims are withheld. Returns facts, family context, open questions, and the horizon.',
    inputSchema: { type: 'object', properties: {
      person: { type: 'string', description: 'person id or name' },
      asOfYear: { type: 'number', description: 'optional year of their life to bound knowledge to (default = end of life)' },
    }, required: ['person'] },
  },
  {
    name: 'open_questions',
    description: 'A persona\'s OWN open questions — the documented gaps in its record, in its own voice (e.g. "Where do I actually lie?"). These are what the family is still researching about this person.',
    inputSchema: { type: 'object', properties: {
      person: { type: 'string', description: 'person id or name' },
      asOfYear: { type: 'number', description: 'optional; bound to a year of their life' },
    }, required: ['person'] },
  },
];

const HANDLERS = {
  find_person: function (a) {
    const needle = String(a.query || '').toLowerCase();
    if (!needle) return { error: 'Provide a query.' };
    const matches = Object.keys(DATA.people)
      .filter(function (id) { return String(DATA.people[id].name || '').toLowerCase().indexOf(needle) !== -1; })
      .slice(0, 25)
      .map(function (id) { const p = DATA.people[id]; return { id: id, name: p.name, lifespan: p.lifespan || null, generation: p.generation, direct: !!p.direct }; });
    return { query: a.query, count: matches.length, matches: matches };
  },
  resolve_kin: function (a) {
    const id = resolvePerson(a.person);
    if (!id) return { error: 'No person matches "' + a.person + '". Try find_person first.' };
    const kin = KIN.knownKin(id);
    const out = { person: DATA.people[id].name, id: id };
    if (a.relation) { out[a.relation] = fmtKin(kin[relKey(a.relation)]); }
    else { out.parents = fmtKin(kin.parents); out.children = fmtKin(kin.children); out.spouse = fmtKin(kin.spouses); out.siblings = fmtKin(kin.siblings); }
    out.note = 'Resolved from the curated family graph; tiers in [brackets]. Relations shown as (none recorded) are open, not disproven.';
    return out;
  },
  person_memory: function (a) {
    const id = resolvePerson(a.person);
    if (!id) return { error: 'No person matches "' + a.person + '". Try find_person first.' };
    const simNow = (typeof a.asOfYear === 'number') ? a.asOfYear : undefined;
    const sub = MEM.access(id, (simNow != null) ? { simNow: simNow } : undefined);
    const stats = sub.stats || {};
    return {
      person: DATA.people[id].name, id: id,
      asOfYear: (simNow != null) ? simNow : null,
      horizonYear: (sub.horizonYear != null) ? sub.horizonYear : null,
      knows: (stats.visible != null) ? stats.visible : sub.individual.length,
      sealedBeyondHorizon: stats.blockedFuture || 0,
      facts: sub.individual.filter(function (n) { return n.kind !== 'gap' && n.evidence !== 'disproven' && n.evidence !== 'eliminated'; }).map(function (n) { return n.text; }),
      family: sub.family.slice(0, 12).map(function (n) { return n.text; }),
      openQuestions: sub.individual.filter(function (n) { return n.kind === 'gap'; }).map(function (n) { return n.text; }),
      note: 'Horizon-bounded: nothing after the horizon year, and disproven/eliminated claims are withheld.',
    };
  },
  open_questions: function (a) {
    const id = resolvePerson(a.person);
    if (!id) return { error: 'No person matches "' + a.person + '". Try find_person first.' };
    const simNow = (typeof a.asOfYear === 'number') ? a.asOfYear : undefined;
    const qs = IQ.openQuestionsFor(id, simNow);
    return {
      person: DATA.people[id].name, id: id, count: qs.length,
      openQuestions: qs.map(function (q) { return { question: q.question, evidence: q.evidence, tags: q.tags }; }),
    };
  },
};

/* ---- JSON-RPC 2.0 dispatch ---- */
function reply(id, result) { return { jsonrpc: '2.0', id: id, result: result }; }
function errReply(id, code, message) { return { jsonrpc: '2.0', id: id, error: { code: code, message: message } }; }
function toolText(id, obj, isError) { return reply(id, { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }], isError: !!isError }); }

function handle(req) {
  if (!req || req.jsonrpc !== '2.0') return null;
  const id = req.id, m = req.method;
  if (m === 'initialize') {
    const pv = (req.params && req.params.protocolVersion) || DEFAULT_PROTOCOL;
    return reply(id, { protocolVersion: pv, capabilities: { tools: {} }, serverInfo: SERVER });
  }
  if (m === 'notifications/initialized' || m === 'initialized') return null; // notification
  if (m === 'ping') return reply(id, {});
  if (m === 'tools/list') return reply(id, { tools: TOOLS });
  if (m === 'tools/call') {
    const name = req.params && req.params.name;
    const args = (req.params && req.params.arguments) || {};
    const fn = HANDLERS[name];
    if (!fn) return errReply(id, -32602, 'Unknown tool: ' + name);
    let result;
    try { result = fn(args); } catch (e) { return toolText(id, { error: String((e && e.message) || e) }, true); }
    return toolText(id, result, !!(result && result.error));
  }
  if (id === undefined || id === null) return null;        // an unknown notification
  return errReply(id, -32601, 'Method not found: ' + m);
}

/* ---- stdio loop (newline-delimited JSON-RPC) — only when run directly ---- */
if (require.main === module) {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (chunk) {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      let req = null;
      try { req = JSON.parse(line); } catch (e) { continue; }
      const res = handle(req);
      if (res) process.stdout.write(JSON.stringify(res) + '\n');
    }
  });
  process.stdin.on('end', function () { process.exit(0); });
  console.error('cason-heritage MCP server ready (' + TOOLS.length + ' tools) on stdio.');
}

module.exports = { handle: handle, tools: TOOLS, handlers: HANDLERS, resolvePerson: resolvePerson };
