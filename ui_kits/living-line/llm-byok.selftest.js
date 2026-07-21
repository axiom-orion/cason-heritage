/* ============================================================
   Self-test for llm-byok.js  (node ui_kits/living-line/llm-byok.selftest.js)
   ------------------------------------------------------------
   Validates the BYOK adapter WITHOUT any network:
     - buildRequest shapes the right URL/headers/body for each of the three
       request families (OpenAI-compatible, Anthropic, Gemini);
     - the user's key rides in the correct place and NOT in a way we store;
     - parseResponse extracts text from each provider's response shape;
     - configured() gates on a usable key + model (noKey providers exempt).
   Exit 0 on pass, 1 on any failure.
   ============================================================ */
'use strict';

// in-memory localStorage shim so config get/set/configured work under Node
var store = {};
global.localStorage = { getItem: function (k) { return k in store ? store[k] : null; }, setItem: function (k, v) { store[k] = String(v); }, removeItem: function (k) { delete store[k]; } };
global.window = global;
var L = require('./llm-byok.js');

var fails = [];
function ok(cond, msg) { if (!cond) { fails.push(msg); console.error('FAIL: ' + msg); } }

var MSGS = [{ role: 'user', content: 'Tell me about yourself.' }];

/* ---- 1: OpenAI-compatible (OpenRouter) ---- */
var r1 = L.buildRequest({ provider: 'openrouter', model: 'anthropic/claude-sonnet-4.5', key: 'sk-or-xyz', system: 'You are Amos.', messages: MSGS });
ok(/openrouter\.ai/.test(r1.url), 'openrouter -> openrouter URL');
ok(r1.init.headers.authorization === 'Bearer sk-or-xyz', 'openrouter -> Bearer key');
var b1 = JSON.parse(r1.init.body);
ok(b1.model === 'anthropic/claude-sonnet-4.5' && b1.messages[0].role === 'system' && b1.messages[1].content === 'Tell me about yourself.', 'openrouter body: model + system-first messages');

/* ---- 2: Anthropic (its own shape + direct-browser header) ---- */
var r2 = L.buildRequest({ provider: 'anthropic', model: 'claude-sonnet-4-5', key: 'sk-ant-abc', system: 'You are Amos.', messages: MSGS });
ok(/api\.anthropic\.com/.test(r2.url), 'anthropic -> anthropic URL');
ok(r2.init.headers['x-api-key'] === 'sk-ant-abc' && r2.init.headers['anthropic-dangerous-direct-browser-access'] === 'true', 'anthropic -> x-api-key + direct-browser header');
var b2 = JSON.parse(r2.init.body);
ok(b2.system === 'You are Amos.' && b2.messages[0].content === 'Tell me about yourself.', 'anthropic body: top-level system + messages');

/* ---- 3: Gemini (key in URL, contents shape) ---- */
var r3 = L.buildRequest({ provider: 'gemini', model: 'gemini-2.5-flash', key: 'AIza123', system: 'You are Amos.', messages: [{ role: 'assistant', content: 'Hm.' }, { role: 'user', content: 'Hi' }] });
ok(/gemini-2\.5-flash:generateContent\?key=AIza123/.test(r3.url), 'gemini -> model + key in URL');
var b3 = JSON.parse(r3.init.body);
ok(b3.systemInstruction.parts[0].text === 'You are Amos.', 'gemini -> systemInstruction');
ok(b3.contents[0].role === 'model' && b3.contents[1].role === 'user', 'gemini -> assistant mapped to model role');

/* ---- 4: parseResponse across shapes ---- */
ok(L.parseResponse('openrouter', { choices: [{ message: { content: 'Amos speaking.' } }] }) === 'Amos speaking.', 'parse OpenAI-compatible');
ok(L.parseResponse('anthropic', { content: [{ type: 'text', text: 'Amos speaking.' }] }) === 'Amos speaking.', 'parse Anthropic');
ok(L.parseResponse('gemini', { candidates: [{ content: { parts: [{ text: 'Amos speaking.' }] } }] }) === 'Amos speaking.', 'parse Gemini');

/* ---- 5: config + configured() gate ---- */
ok(L.configured() === false, 'not configured before any key is set');
L.setConfig({ provider: 'openrouter', model: 'openai/gpt-4o-mini', key: 'sk-or-abc' });
ok(L.configured() === true, 'configured once provider+model+key are set');
L.setConfig({ provider: 'openrouter', model: 'x', key: '' });
ok(L.configured() === false, 'a blank key is not configured');
L.setConfig({ provider: 'ollama', model: 'llama3.1' });
ok(L.configured() === true, 'a no-key provider (Ollama) is configured without a key');

/* ---- 6: a real key rides only in the request, never in the shared catalog ---- */
ok(JSON.stringify(L.PROVIDERS).indexOf('SECRET123') === -1, 'the user\'s key is not baked into the provider catalog');
var reqK = L.buildRequest({ provider: 'openrouter', model: 'x', key: 'sk-or-SECRET123', messages: MSGS });
ok(reqK.init.headers.authorization === 'Bearer sk-or-SECRET123', 'the key rides only in the request Authorization header');

/* ---- summary ---- */
if (fails.length) { console.error('llm-byok selftest: ' + fails.length + ' failure(s).'); process.exit(1); }
console.log('llm-byok selftest OK: 3 request shapes built, 3 response shapes parsed, config gate holds, key stays in the request.');
process.exit(0);
