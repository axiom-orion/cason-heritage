/* Vercel serverless function — live persona dialogue via Claude.
   The client sends ONLY horizon-accessible facts (computed from the memory
   graph), so the temporal rule holds even here. The key never reaches the
   browser. Off unless ANTHROPIC_API_KEY is set; the UI falls back to the
   deterministic templated voice otherwise. Raw fetch (no deps) — the repo
   deploys with no npm install. */
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6'; // override via CLAUDE_MODEL

function clamp(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

async function callClaude(system, messages, maxTokens) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens || 420, system: system, messages: messages }),
  });
  if (!r.ok) throw new Error('anthropic ' + r.status + ': ' + (await r.text()).slice(0, 300));
  const data = await r.json();
  return (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('').trim();
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!process.env.ANTHROPIC_API_KEY) { res.status(501).json({ error: 'Live dialogue is not configured (no ANTHROPIC_API_KEY).' }); return; }

  let p = req.body; if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } } p = p || {};

  const name = clamp(p.name || 'this person', 80);
  const facts = Array.isArray(p.facts) ? p.facts.map(function (f) { return '- ' + clamp(f, 300); }).slice(0, 40).join('\n') : '';
  const gaps = Array.isArray(p.gaps) ? p.gaps.map(function (g) { return clamp(g, 200); }).slice(0, 8).join('; ') : '';
  const forbidden = Array.isArray(p.forbidden) ? p.forbidden.map(function (f) { return clamp(f, 200); }).slice(0, 8).join('; ') : '';

  const system = [
    'You ARE ' + name + (p.lifespan ? ' (' + clamp(p.lifespan, 40) + ')' : '') + ', a ' + clamp(p.occupation || 'person of the line', 60) + ' of the ' + clamp(p.era || 'past', 40) + ' era. The year is about ' + clamp(String(p.year || ''), 12) + '. Speak entirely in character, in the first person.',
    p.voice ? 'Voice: ' + clamp(p.voice, 200) + '.' : '',
    p.personality ? 'Bearing: ' + clamp(p.personality, 200) + '.' : '',
    'You may speak ONLY to what you could know within your own lifetime. The notes below are the whole of your memory. Never invent names, dates, places, kin, or events that are not in these notes. If asked about something not in your memory, or anything in your future, say plainly and in period words that you cannot know it. Never say you are an AI or break character. Keep replies under about 110 words.',
    forbidden ? 'You must NEVER assert these discredited claims as true: ' + forbidden + '.' : '',
    'Your memory:',
    facts || '(little of your life is written down)',
    gaps ? 'Questions you yourself wonder about: ' + gaps : '',
  ].filter(Boolean).join('\n');

  const history = Array.isArray(p.history)
    ? p.history.slice(-6).filter(function (m) { return m && m.role && m.content; })
        .map(function (m) { return { role: m.role === 'persona' ? 'assistant' : 'user', content: clamp(m.content, 800) }; })
    : [];
  const messages = history.concat([{ role: 'user', content: clamp(p.userMessage || 'Tell me about yourself.', 800) }]);

  try {
    const reply = await callClaude(system, messages, 420);
    res.status(200).json({ reply: reply, model: CLAUDE_MODEL });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
