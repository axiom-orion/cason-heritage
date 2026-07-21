/* ============================================================
   Self-test for the Cason MCP server (node scripts/mcp-server.selftest.js)
   ------------------------------------------------------------
   Proves the JSON-RPC surface AND that the governance guarantees hold
   THROUGH the MCP boundary:
     - initialize / tools/list behave;
     - find_person + resolve_kin read the curated graph;
     - person_memory is HORIZON-BOUNDED (an earlier asOfYear knows less,
       and the horizon pins to that year) -- the same seal the site enforces;
     - open_questions returns the persona's own gaps;
     - an unknown tool is a clean JSON-RPC error.
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

var M = require('./mcp-server.js');
var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

function rpc(method, params) { return M.handle({ jsonrpc: '2.0', id: 1, method: method, params: params }); }
function callText(name, args) {
  var r = rpc('tools/call', { name: name, arguments: args });
  return (r && r.result && r.result.content && r.result.content[0]) ? r.result.content[0].text : JSON.stringify(r);
}
function callObj(name, args) { return JSON.parse(callText(name, args)); }

/* ---- 1: handshake ---- */
var init = rpc('initialize', { protocolVersion: '2025-06-18' });
ok(init && init.result && init.result.serverInfo && init.result.serverInfo.name === 'cason-heritage', 'initialize returns serverInfo');
ok(init.result.capabilities && init.result.capabilities.tools, 'initialize declares the tools capability');
ok(rpc('notifications/initialized', {}) === null, 'initialized notification gets no response');

/* ---- 2: tools/list ---- */
var list = rpc('tools/list', {});
ok(list.result.tools.length >= 4, 'tools/list returns >=4 tools (got ' + list.result.tools.length + ')');
ok(list.result.tools.every(function (t) { return t.name && t.inputSchema; }), 'every tool has a name + inputSchema');

/* ---- 3: find_person ---- */
var fp = callObj('find_person', { query: 'Thadeous' });
ok(fp.matches.some(function (m) { return m.id === 'thadeous'; }), 'find_person finds Thadeous by name');

/* ---- 4: resolve_kin from the curated graph ---- */
var rk = callObj('resolve_kin', { person: 'ransom-sr', relation: 'children' });
ok(/Ransom Cason Jr\.|James Green|Moses/.test(JSON.stringify(rk.children)), 'resolve_kin lists Ransom Sr.\'s children with tiers');
// name resolution also works (not just id)
var rk2 = callObj('resolve_kin', { person: 'Thadeous Calhoun Cason' });
ok(rk2.id === 'thadeous', 'resolve_kin resolves a full name to the right person');

/* ---- 5: person_memory is HORIZON-BOUNDED through MCP ---- */
var full = callObj('person_memory', { person: 'thadeous' });
var early = callObj('person_memory', { person: 'thadeous', asOfYear: 1870 }); // Thadeous ~age 13
ok(early.horizonYear === 1870, 'person_memory pins the horizon to asOfYear (got ' + early.horizonYear + ')');
ok(early.knows <= full.knows, 'an earlier horizon knows no more than the full life (' + early.knows + ' <= ' + full.knows + ')');
ok(full.facts.every(function (t) { return !/disproven|eliminated/i.test(t); }), 'no disproven/eliminated fact leaks through person_memory');

/* ---- 6: open_questions returns the persona's own gaps ---- */
var oq = callObj('open_questions', { person: 'thadeous' });
ok(oq.count > 0 && oq.openQuestions.some(function (q) { return /Georgia|marriage|1882|1883/i.test(q.question); }),
   'open_questions returns Thadeous\'s own marriage-date question');

/* ---- 7: error handling ---- */
var bad = rpc('tools/call', { name: 'no_such_tool', arguments: {} });
ok(bad.error && bad.error.code === -32602, 'unknown tool -> JSON-RPC error');
var missing = callObj('person_memory', { person: 'nobody-xyz' });
ok(missing.error, 'unknown person -> tool returns an error object');

/* ---- summary ---- */
if (fails.length) { console.error('MCP server selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('MCP server selftest OK: handshake + 4 tools, kin from the graph, horizon-bound held through MCP (1870 knows <= full life), errors clean.');
process.exit(0);
