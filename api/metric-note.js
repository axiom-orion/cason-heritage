/* POST /api/metric-note  {key, file, frag, occ, selected, comment, kind}  ->  {ok, id}
   Files one correction, observation or suggestion against one paragraph.

   ── THIS ENDPOINT IS WHERE THE PIPELINE RULING IS ENFORCED ──────────────────────────────────
   HANDOFF: "no more syndicate rewrites, annotations only... THE OUTPUT MUST NOT CONTAIN THE
   PROSE." Seven silent edits and two invented chapters got into this book because notes arrived
   wrapped in a copy of the text. So:

     - `frag` is an ANCHOR, not content: seven words, capped, used only to find the paragraph again.
     - `selected` is what the reader highlighted, capped short. It is evidence of WHERE, not a
       replacement for what is there.
     - `comment` is the note.

   ⛔ There is no field a rewritten paragraph can travel in, and the caps are what make that true
   rather than merely intended. A 3,000-character "selected" would be a chapter with a comment
   attached, which is exactly the shape that did the damage. */
const { sb, handle } = require('./_metric');

const KINDS = ['correction', 'observation', 'suggestion'];

function clamp(s, n) {
  s = String(s == null ? '' : s);
  return s.length > n ? s.slice(0, n) : s;
}

module.exports = async function (req, res) {
  await handle(req, res, async function (p, who, out) {
    const file = String(p.file || '');
    if (!/^[0-9A-Za-z._-]{3,80}$/.test(file)) {
      out.status(400).json({ error: 'Bad piece name.' }); return;
    }
    const comment = clamp(p.comment, 4000).trim();
    if (!comment) { out.status(400).json({ error: 'A note needs something in it.' }); return; }
    let kind = String(p.kind || 'observation');
    if (KINDS.indexOf(kind) === -1) kind = 'observation';

    const row = {
      key_label: who.label,
      file: file,
      frag: clamp(p.frag, 200) || null,
      occ: Number.isFinite(Number(p.occ)) ? Math.max(0, Math.floor(Number(p.occ))) : 0,
      // 600 is deliberate: long enough to hold the sentence he is objecting to, far too short to
      // hold a paragraph anybody could paste back in as prose.
      selected: clamp(p.selected, 600).trim() || null,
      comment: comment,
      kind: kind,
    };

    const r = await sb('/rest/v1/metric_notes', {
      method: 'POST',
      headers: { prefer: 'return=representation' },
      body: JSON.stringify([row]),
    });
    if (!r.ok) {
      const t = await r.text();
      out.status(502).json({ error: 'Could not save that note: ' + t.slice(0, 200) });
      return;
    }
    const data = await r.json();
    out.status(200).json({ ok: true, id: data && data[0] && data[0].id, note: data && data[0] });
  });
};
