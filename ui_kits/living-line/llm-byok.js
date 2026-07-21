/* ============================================================
   Bring-your-own-key LLM  (window.CASON_LLM)
   ------------------------------------------------------------
   The user picks any provider + model and pastes THEIR key. The browser
   calls the provider DIRECTLY -- the key never touches our server, we pay
   nothing for their inference, and it stays as private as the tree. One
   adapter over three request shapes (OpenAI-compatible, Anthropic, Gemini).

   CORS reality: not every provider allows direct browser calls. The ones
   that reliably do are flagged `browser:true` (OpenRouter -- any model,
   one key; Anthropic with its direct-browser header; Gemini; local Ollama;
   a custom OpenAI-compatible base URL). Others may need a small proxy.

     configured()                -> is a usable key + model set?
     setConfig({provider,model,key,baseUrl})  (stored in localStorage only)
     chat({system,messages,maxTokens}) -> Promise<{text}>
   buildRequest / parseResponse are pure and unit-tested (no network).

   No-build (window) + Node (module.exports). ASCII; no regex lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  var PROVIDERS = {
    openrouter: { label: 'OpenRouter (any model)', kind: 'openai', url: 'https://openrouter.ai/api/v1/chat/completions',
      keyHint: 'sk-or-...', browser: true, note: 'One key, hundreds of models. Recommended.',
      models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4o-mini', 'google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat'] },
    anthropic: { label: 'Anthropic (Claude)', kind: 'anthropic', url: 'https://api.anthropic.com/v1/messages',
      keyHint: 'sk-ant-...', browser: true, models: ['claude-sonnet-4-5', 'claude-3-5-haiku-latest'] },
    gemini: { label: 'Google Gemini', kind: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/',
      keyHint: 'AIza...', browser: true, models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
    ollama: { label: 'Ollama (local, no key)', kind: 'openai', url: 'http://localhost:11434/v1/chat/completions',
      keyHint: '(none needed)', browser: true, noKey: true, models: ['llama3.1', 'qwen2.5', 'mistral'] },
    openai: { label: 'OpenAI', kind: 'openai', url: 'https://api.openai.com/v1/chat/completions',
      keyHint: 'sk-...', browser: false, note: 'May need a proxy (browser CORS).', models: ['gpt-4o', 'gpt-4o-mini'] },
    groq: { label: 'Groq (fast, free tier)', kind: 'openai', url: 'https://api.groq.com/openai/v1/chat/completions',
      keyHint: 'gsk_...', browser: false, note: 'CORS may vary.', models: ['llama-3.3-70b-versatile'] },
    xai: { label: 'xAI (Grok)', kind: 'openai', url: 'https://api.x.ai/v1/chat/completions',
      keyHint: 'xai-...', browser: false, note: 'CORS may vary.', models: ['grok-2-latest'] },
    custom: { label: 'Custom (OpenAI-compatible)', kind: 'openai', url: '', keyHint: 'your key', browser: true,
      note: 'Set your own base URL.', models: [] },
  };

  var LS = 'cason-llm-config';
  function getConfig() { try { return JSON.parse((root.localStorage && root.localStorage.getItem(LS)) || 'null'); } catch (e) { return null; } }
  function setConfig(c) { try { if (root.localStorage) root.localStorage.setItem(LS, JSON.stringify(c || {})); } catch (e) {} }
  function clearConfig() { try { if (root.localStorage) root.localStorage.removeItem(LS); } catch (e) {} }
  function configured() {
    var c = getConfig(); if (!c || !c.provider || !c.model) return false;
    var p = PROVIDERS[c.provider]; if (!p) return false;
    return p.noKey ? true : !!c.key;
  }

  /* ---- pure: build the fetch request for the provider ---- */
  function buildRequest(o) {
    var p = PROVIDERS[o.provider] || PROVIDERS.custom;
    var url = ((o.provider === 'custom' || o.provider === 'ollama') && o.baseUrl) ? o.baseUrl : p.url;
    var max = o.maxTokens || 500;
    if (p.kind === 'anthropic') {
      return { url: url, init: { method: 'POST', headers: {
        'x-api-key': o.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
        body: JSON.stringify({ model: o.model, max_tokens: max, system: o.system || '', messages: o.messages || [] }) } };
    }
    if (p.kind === 'gemini') {
      var gurl = url + encodeURIComponent(o.model) + ':generateContent?key=' + encodeURIComponent(o.key || '');
      return { url: gurl, init: { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: o.system ? { parts: [{ text: o.system }] } : undefined,
          contents: (o.messages || []).map(function (m) { return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }; }),
          generationConfig: { maxOutputTokens: max } }) } };
    }
    // OpenAI-compatible
    var headers = { 'content-type': 'application/json' };
    if (!p.noKey && o.key) headers.authorization = 'Bearer ' + o.key;
    if (o.provider === 'openrouter') { headers['HTTP-Referer'] = 'https://flcason.com'; headers['X-Title'] = 'The Cason Line'; }
    var msgs = o.system ? [{ role: 'system', content: o.system }].concat(o.messages || []) : (o.messages || []);
    return { url: url, init: { method: 'POST', headers: headers,
      body: JSON.stringify({ model: o.model, max_tokens: max, messages: msgs }) } };
  }

  /* ---- pure: extract the reply text from a provider response ---- */
  function parseResponse(provider, data) {
    var p = PROVIDERS[provider] || PROVIDERS.custom;
    if (!data) return '';
    if (p.kind === 'anthropic') return (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('').trim();
    if (p.kind === 'gemini') { var c = data.candidates && data.candidates[0]; return (((c && c.content && c.content.parts) || []).map(function (x) { return x.text || ''; }).join('')).trim(); }
    return ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
  }

  function errText(data, status) {
    if (data && data.error) return (typeof data.error === 'string') ? data.error : (data.error.message || JSON.stringify(data.error));
    return 'request failed (HTTP ' + status + ')';
  }

  /* ---- chat: compose the pure parts with fetch, using the stored config ---- */
  function chat(o) {
    o = o || {};
    var c = getConfig() || {};
    if (!configured()) return Promise.reject(new Error('No model configured. Add your key in settings.'));
    var req = buildRequest({ provider: c.provider, model: o.model || c.model, key: c.key, baseUrl: c.baseUrl,
      system: o.system, messages: o.messages || [], maxTokens: o.maxTokens });
    return fetch(req.url, req.init)
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }, function () { return { ok: r.ok, status: r.status, j: null }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(errText(res.j, res.status));
        var text = parseResponse(c.provider, res.j);
        if (!text) throw new Error('The model returned an empty reply.');
        return { text: text };
      });
  }

  var API = { PROVIDERS: PROVIDERS, getConfig: getConfig, setConfig: setConfig, clearConfig: clearConfig,
    configured: configured, buildRequest: buildRequest, parseResponse: parseResponse, chat: chat };
  root.CASON_LLM = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
