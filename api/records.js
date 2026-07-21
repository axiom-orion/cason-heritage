/* Vercel serverless function — record search via the Library of Congress
   "Chronicling America" historic-newspaper collection. FREE, keyless, and a
   real primary-ish source: obituaries, marriage & death notices, land and
   court items. Returns CANDIDATE records to verify (a name match in a paper of
   the right era), each with an LOC citation URL -- never a confirmed fact.
   Server-side so it works despite browser CORS, for both the app and the
   Keeper. Raw fetch, no deps. */
function clamp(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  var p = req.body; if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } } p = p || {};

  var name = clamp(p.name || '', 80).trim();
  if (!name) { res.status(400).json({ error: 'Provide a name.' }); return; }
  var from = parseInt(p.from, 10) || 1836;   // Chronicling America coverage ~1756-1963
  var to = parseInt(p.to, 10) || 1963;
  var rows = Math.min(parseInt(p.rows, 10) || 8, 20);

  var url = 'https://www.loc.gov/collections/chronicling-america/?qs=' + encodeURIComponent('"' + name + '"') +
    '&dates=' + from + '/' + to + '&fo=json&c=' + rows;

  try {
    var r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) { res.status(502).json({ error: 'Library of Congress returned ' + r.status }); return; }
    var j = await r.json();
    var items = (j.results || []).slice(0, rows).map(function (it) {
      var desc = Array.isArray(it.description) ? it.description.join(' ') : (it.description || '');
      var link = it.url || (Array.isArray(it.id) ? it.id[0] : it.id) || null;
      return { title: clamp(it.title, 180), date: it.date || null, snippet: clamp(desc, 240), url: link,
        source: 'Chronicling America (Library of Congress)' };
    }).filter(function (x) { return x.url; });
    res.status(200).json({
      query: name, from: from, to: to, count: items.length, items: items,
      note: 'Candidate records to verify -- a name match in a historic newspaper of the right era, not a confirmed fact.',
    });
  } catch (e) {
    res.status(502).json({ error: String((e && e.message) || e) });
  }
};
