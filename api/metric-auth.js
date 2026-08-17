/* POST /api/metric-auth  {key}  ->  {ok, label, book, toc}
   Validates a preview key and hands back the table of contents only.

   ⛔ THE TOC CARRIES NO PROSE. Not a first line, not a blurb, not an excerpt. A reader who guesses
   at this endpoint with a bad key gets nothing; a reader with a good one gets titles and word
   counts, and has to ask for each piece separately. That keeps the whole manuscript from ever
   sitting in one response, which matters because a response is a thing that ends up in a log, a
   proxy cache, or somebody's browser history export. */
const { sb, handle } = require('./_metric');

module.exports = async function (req, res) {
  await handle(req, res, async function (_p, who, out) {
    const r = await sb('/rest/v1/metric_pieces?select=file,n,slug,title,words,audio&order=file.asc');
    if (!r.ok) {
      const t = await r.text();
      out.status(502).json({ error: 'Could not load the contents: ' + t.slice(0, 200) });
      return;
    }
    const rows = await r.json();
    if (!rows.length) {
      out.status(200).json({
        ok: true, label: who.label, empty: true,
        book: { title: 'The Metric Is the Walls' },
        toc: [],
        message: 'The key works. Nothing has been pushed yet — run ./web-sync.sh push from the book repo.',
      });
      return;
    }
    out.status(200).json({
      ok: true,
      label: who.label,
      book: {
        title: 'The Metric Is the Walls',
        subtitle: 'What the Floor Knows About Systems, Scale, and the Invisible Work That Holds Organizations Together',
        author: 'Ryan Cason',
      },
      toc: rows.map(function (x) {
        return {
          file: x.file, n: x.n, slug: x.slug, title: x.title,
          words: x.words, hasAudio: Boolean(x.audio),
        };
      }),
    });
  });
};
