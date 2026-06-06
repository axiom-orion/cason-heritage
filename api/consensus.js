/* Vercel serverless function — multi-model research consensus.
   Asks every configured provider (Claude / Grok / Gemini) the same question in
   parallel, then a Claude adjudicator cross-checks the answers: a claim counts
   as CORROBORATED only when >=2 independent models agree; a single-model claim
   is flagged UNVERIFIED; conflicts are surfaced. This is the guard against one
   model's hallucination spreading as fact.

   Configure any subset via env vars (the endpoint uses whatever is present):
     ANTHROPIC_API_KEY  (+ CLAUDE_MODEL,  default claude-sonnet-4-6)
     XAI_API_KEY        (+ XAI_MODEL,     default grok-4)        // OpenAI-compatible
     GEMINI_API_KEY     (+ GEMINI_MODEL,  default gemini-2.5-flash)
   The Claude adjudicator needs ANTHROPIC_API_KEY. Raw fetch, no deps. */
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'; // override via CLAUDE_MODEL
const XAI_MODEL = process.env.XAI_MODEL || 'grok-4';            // set to a model your xAI key supports
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'; // set to a model your Gemini key supports

function clamp(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

async function callClaude(system, user, opts) {
  opts = opts || {};
  const body = { model: CLAUDE_MODEL, max_tokens: opts.max_tokens || 400, system: system, messages: [{ role: 'user', content: user }] };
  if (opts.thinking) body.thinking = opts.thinking;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('anthropic ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return (d.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('').trim();
}

async function callGrok(system, user, maxTokens) {
  const r = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + process.env.XAI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ model: XAI_MODEL, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error('xai ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  return ((d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '').trim();
}

async function callGemini(system, user, maxTokens) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + encodeURIComponent(process.env.GEMINI_API_KEY);
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { maxOutputTokens: maxTokens } }),
  });
  if (!r.ok) throw new Error('gemini ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const d = await r.json();
  const c = d.candidates && d.candidates[0];
  return ((c && c.content && c.content.parts) || []).map(function (p) { return p.text || ''; }).join('').trim();
}

const RESEARCH_SYS = 'You are a careful research assistant verifying historical and genealogical facts. Answer the question concisely (<=120 words). Be precise. End with your confidence as high, medium, or low. If you are not certain, say so explicitly and do NOT guess or fabricate. Where you can, name the type of source your answer rests on.';

function parseJson(s) { if (!s) return null; const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; } }

module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  let p = req.body; if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } } p = p || {};
  const question = clamp(p.question || '', 600);
  if (!question) { res.status(400).json({ error: 'Provide a question.' }); return; }
  const user = question + (p.context ? '\n\nContext: ' + clamp(p.context, 800) : '');

  const jobs = [];
  if (process.env.ANTHROPIC_API_KEY) jobs.push({ provider: 'Claude', run: function () { return callClaude(RESEARCH_SYS, user, { max_tokens: 400 }); } });
  if (process.env.XAI_API_KEY) jobs.push({ provider: 'Grok', run: function () { return callGrok(RESEARCH_SYS, user, 400); } });
  if (process.env.GEMINI_API_KEY) jobs.push({ provider: 'Gemini', run: function () { return callGemini(RESEARCH_SYS, user, 400); } });
  if (!jobs.length) { res.status(501).json({ error: 'No research providers configured. Set ANTHROPIC_API_KEY, XAI_API_KEY, and/or GEMINI_API_KEY.' }); return; }

  const providers = await Promise.all(jobs.map(function (j) {
    return j.run().then(function (answer) { return { provider: j.provider, ok: true, answer: answer }; })
      .catch(function (e) { return { provider: j.provider, ok: false, error: String(e.message || e) }; });
  }));
  const good = providers.filter(function (s) { return s.ok && s.answer; });

  let consensus;
  if (!process.env.ANTHROPIC_API_KEY || good.length === 0) {
    consensus = {
      agreement: 'insufficient', confidence: 'low', corroborated: '', disputed: '',
      unverified: good.map(function (g) { return g.provider; }).join(', '),
      answer: 'Not enough corroboration to judge — treat any single answer as unverified.',
      note: process.env.ANTHROPIC_API_KEY ? 'No model returned an answer.' : 'No adjudicator (needs ANTHROPIC_API_KEY).',
    };
  } else {
    const block = good.map(function (g) { return '### ' + g.provider + '\n' + g.answer; }).join('\n\n');
    const adjSys = 'You are a meticulous adjudicator guarding against hallucination. You are given answers from several INDEPENDENT AI models to the same question. Compare them. A claim counts as CORROBORATED only if at least two independent models assert it. A claim from a single model is UNVERIFIED and must never be elevated to fact. If models conflict, report the conflict. Never add facts that none of the models provided. Respond with ONLY a single JSON object, no prose, of exactly this shape: {"agreement":"strong|partial|conflict|insufficient","confidence":"high|medium|low","corroborated":"the points two or more models agree on, or empty","disputed":"where the models differ, or empty","unverified":"claims only one model made, or empty","answer":"a synthesized, honest answer that treats only multi-model-agreed points as established and explicitly marks single-source or conflicting points as unconfirmed"}.';
    const adjUser = 'Question: ' + question + '\n\nModel answers:\n' + block;
    let raw = '';
    try { raw = await callClaude(adjSys, adjUser, { max_tokens: 1500, thinking: { type: 'adaptive' } }); } catch (e) { raw = ''; }
    consensus = parseJson(raw) || {
      agreement: good.length >= 2 ? 'partial' : 'insufficient', confidence: 'low',
      corroborated: '', disputed: '', unverified: '', answer: clamp(raw, 800) || 'Adjudication unavailable.',
    };
  }

  res.status(200).json({ question: question, providers: providers, consensus: consensus, models: { claude: CLAUDE_MODEL, grok: XAI_MODEL, gemini: GEMINI_MODEL } });
};
