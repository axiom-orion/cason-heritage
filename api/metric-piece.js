/* POST /api/metric-piece  {key, file}  ->  {title, blocks, notes}
   One piece of the book, plus the notes already filed against it so they show up in the margin
   where they were written rather than in a list somewhere else.

   ⚠ `file` IS MATCHED AGAINST THE TABLE, NEVER INTERPOLATED INTO A PATH. It arrives from the
   browser, so it is a hostile string until proven otherwise -- it goes through PostgREST as an
   equality filter on a primary key and touches no filesystem anywhere. */
const { sb, handle } = require('./_metric');

module.exports = async function (req, res) {
  await handle(req, res, async function (p, _who, out) {
    const file = String(p.file || '');
    if (!/^[0-9A-Za-z._-]{3,80}$/.test(file)) {
      out.status(400).json({ error: 'Bad piece name.' }); return;
    }
    const r = await sb('/rest/v1/metric_pieces?select=file,title,n,words,audio,blocks&file=eq.'
                       + encodeURIComponent(file) + '&limit=1');
    if (!r.ok) { out.status(502).json({ error: 'Could not load that piece.' }); return; }
    const rows = await r.json();
    const piece = rows && rows[0];
    if (!piece) { out.status(404).json({ error: 'No such piece.' }); return; }

    // Notes ride along with the piece so the reader is one request, not two. Anything already
    // pulled into the manuscript still shows -- he should be able to see that a thing he flagged
    // on Tuesday has landed, without leaving the page.
    let notes = [];
    const nr = await sb('/rest/v1/metric_notes?select=id,created_at,key_label,frag,occ,selected,comment,kind,status&file=eq.'
                        + encodeURIComponent(file) + '&order=created_at.asc');
    if (nr.ok) notes = await nr.json();

    out.status(200).json({
      file: piece.file, title: piece.title, n: piece.n, words: piece.words,
      hasAudio: Boolean(piece.audio), blocks: piece.blocks, notes: notes,
    });
  });
};
