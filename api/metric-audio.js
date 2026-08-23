/* POST /api/metric-audio  {key, file}  ->  {url, expires}
   Mints a short-lived signed link to one recording in the private metric-audio bucket.

   ⛔ WHY A SIGNED URL AND NOT A PUBLIC BUCKET. A public bucket would make the gate decorative:
   the object names are derived from chapter titles, so anybody who saw one could guess the rest
   and pull the whole audiobook without a key. Signed links are minted per request, after the key
   is checked, and die in an hour.

   ⚠ ONE HOUR IS CHOSEN AGAINST A REAL CONSTRAINT, not picked round. The longest piece runs about
   thirteen minutes, so an hour covers listening to it, pausing, and coming back -- while a link
   that leaks out of a browser history is dead long before it is useful to anybody. */
const { sb, handle } = require('./_metric');

const TTL = 3600;

module.exports = async function (req, res) {
  await handle(req, res, async function (p, _who, out) {
    const file = String(p.file || '');
    if (!/^[0-9A-Za-z._-]{3,80}$/.test(file)) {
      out.status(400).json({ error: 'Bad piece name.' }); return;
    }
    const r = await sb('/rest/v1/metric_pieces?select=audio,title&file=eq.'
                       + encodeURIComponent(file) + '&limit=1');
    if (!r.ok) { out.status(502).json({ error: 'Could not look that up.' }); return; }
    const rows = await r.json();
    const piece = rows && rows[0];
    if (!piece) { out.status(404).json({ error: 'No such piece.' }); return; }
    if (!piece.audio) {
      // Front matter has no recording by design. Say so plainly rather than 404 -- the page shows
      // this to the reader and "not narrated" is information, not a failure.
      out.status(200).json({ url: null, reason: 'This piece is not narrated.' });
      return;
    }

    const sr = await sb('/storage/v1/object/sign/metric-audio/' +
                        encodeURIComponent(piece.audio), {
      method: 'POST',
      body: JSON.stringify({ expiresIn: TTL }),
    });
    if (!sr.ok) {
      const t = await sr.text();
      out.status(502).json({
        error: 'Could not sign the audio link: ' + t.slice(0, 200),
        hint: 'Has ./web-sync.sh push-audio been run?',
      });
      return;
    }
    const j = await sr.json();
    const signed = j && (j.signedURL || j.signedUrl);
    if (!signed) { out.status(502).json({ error: 'Storage returned no link.' }); return; }
    out.status(200).json({
      url: process.env.SUPABASE_URL.replace(/\/$/, '') + '/storage/v1' +
           (signed.indexOf('/') === 0 ? signed : '/' + signed),
      expires: TTL,
    });
  });
};
