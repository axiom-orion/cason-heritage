/* ============================================================
   The Cason Archive — the family's place to load pictures & documents.
   Reads window.CASON_MEDIA (IndexedDB store) + window.CASON_DATA (the
   record, for attaching an item to a person). No build step.
   ============================================================ */
const { useState, useEffect, useMemo, useRef } = React;

const AR_DATA = window.CASON_DATA || { people: {} };
const MEDIA = window.CASON_MEDIA;

// people sorted by generation then name, for the "attach to" picker
const AR_PEOPLE = Object.keys(AR_DATA.people)
  .map(function (id) { return AR_DATA.people[id]; })
  .filter(function (p) { return typeof p.generation === 'number' && p.generation >= 1; })
  .sort(function (a, b) { return (a.generation - b.generation) || String(a.name).localeCompare(String(b.name)); });
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
function personName(id) { return AR_DATA.people[id] ? AR_DATA.people[id].name : id; }
function fmtBytes(n) { if (!n) return '0 KB'; if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB'; return (n / (1024 * 1024)).toFixed(1) + ' MB'; }
function isImg(it) { return (it.mime || '').indexOf('image') === 0 || /^data:image/.test(it.dataUrl || ''); }

/* ---- file picker that reads to a data URL ---- */
function FileDrop(props) {
  const [over, setOver] = useState(false);
  const ref = useRef();
  function take(f) {
    if (!f) return;
    if (f.size > MEDIA.MAX_BYTES) { props.onError('That file is larger than ' + Math.round(MEDIA.MAX_BYTES / (1024 * 1024)) + ' MB.'); return; }
    const r = new FileReader();
    r.onload = function (e) { props.onFile({ dataUrl: e.target.result, name: f.name, mime: f.type, size: f.size }); };
    r.readAsDataURL(f);
  }
  const has = props.file;
  return (
    <label
      onDragOver={function (e) { e.preventDefault(); setOver(true); }}
      onDragLeave={function () { setOver(false); }}
      onDrop={function (e) { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 150,
        border: '2px dashed ' + (over ? 'var(--rust)' : 'var(--gold)'), borderRadius: 8, background: has ? '#000' : 'rgba(154,123,45,0.06)',
        cursor: 'pointer', textAlign: 'center', padding: 14, overflow: 'hidden', position: 'relative' }}>
      {has && isImg(props.file)
        ? <img src={props.file.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }} />
        : has
          ? <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--cream)', fontSize: 14 }}>📄 {props.file.name}<div style={{ fontSize: 11, color: 'var(--fg-on-dark-2)', marginTop: 4 }}>{fmtBytes(props.file.size)}</div></div>
          : <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--faded)', fontSize: 14 }}>Drop a photo or document here, or <u>choose a file</u><br /><span style={{ fontSize: 11 }}>Images or PDF, up to {Math.round(MEDIA.MAX_BYTES / (1024 * 1024))} MB</span></span>}
      <input ref={ref} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
        onChange={function (e) { take(e.target.files[0]); e.target.value = ''; }} />
    </label>
  );
}

/* ---- the add form ---- */
function AddForm(props) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('photo');
  const [personId, setPersonId] = useState('');
  const [date, setDate] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  function reset() { setFile(null); setTitle(''); setKind('photo'); setPersonId(''); setDate(''); setSource(''); setNote(''); setErr(''); }
  function submit() {
    if (!file) { setErr('Choose a file first.'); return; }
    const meta = { title: title, kind: kind, personId: personId || null, date: date, source: source, note: note, name: file.name, mime: file.mime, size: file.size };
    MEDIA.add(meta, file.dataUrl, AR_DATA.people)
      .then(function (it) { reset(); props.onAdded(it); })
      .catch(function (e) { setErr(e.message || 'Could not save.'); });
  }
  const label = { fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--faded)', display: 'block', margin: '14px 0 5px' };
  const input = { width: '100%', fontFamily: 'var(--font-serif)', fontSize: 15, padding: '9px 11px', border: '1px solid var(--border-medium)', borderRadius: 5, background: 'var(--cream)', color: 'var(--ink)', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--border-hairline)', borderRadius: 10, padding: 22 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>Add to the archive</div>
      <FileDrop file={file} onFile={function (f) { setFile(f); setErr(''); if (!title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, '')); }} onError={setErr} />
      <label style={label}>Title</label>
      <input style={input} value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder="e.g. Thadeous's 1945 will, p.1" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={label}>Category</label>
          <select style={input} value={kind} onChange={function (e) { setKind(e.target.value); }}>
            {MEDIA.CATEGORIES.map(function (c) { return <option key={c.key} value={c.key}>{c.label}</option>; })}
          </select>
        </div>
        <div>
          <label style={label}>Date (optional)</label>
          <input style={input} value={date} onChange={function (e) { setDate(e.target.value); }} placeholder="1945 or 1945-12-17" />
        </div>
      </div>
      <label style={label}>Attach to a person (optional)</label>
      <select style={input} value={personId} onChange={function (e) { setPersonId(e.target.value); }}>
        <option value="">— not attached —</option>
        {AR_PEOPLE.map(function (p) { return <option key={p.id} value={p.id}>{'Gen ' + (ROMAN[p.generation] || p.generation) + ' · ' + p.name}</option>; })}
      </select>
      <label style={label}>Source / citation (optional)</label>
      <input style={input} value={source} onChange={function (e) { setSource(e.target.value); }} placeholder="e.g. Columbia Co. Will Book, p.111" />
      <label style={label}>Note (optional)</label>
      <textarea style={Object.assign({}, input, { minHeight: 54, resize: 'vertical' })} value={note} onChange={function (e) { setNote(e.target.value); }} />
      {err ? <div style={{ color: 'var(--blood)', fontFamily: 'var(--font-sans)', fontSize: 13, marginTop: 10 }}>{err}</div> : null}
      <button onClick={submit} style={{ marginTop: 16, width: '100%', padding: '12px', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, letterSpacing: '.04em', background: 'var(--rust)', color: 'var(--cream)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Add to archive</button>
    </div>
  );
}

/* ---- one gallery card ---- */
function ItemCard(props) {
  const it = props.item;
  return (
    <div onClick={function () { props.onOpen(it); }} style={{ background: 'var(--cream)', border: '1px solid var(--border-hairline)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ height: 150, background: isImg(it) ? '#111' : 'repeating-linear-gradient(45deg,#efe7d4 0,#efe7d4 6px,#e6dcc5 6px,#e6dcc5 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isImg(it) ? <img src={it.dataUrl} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)' }}>📄 {(it.mime || 'document').split('/').pop().toUpperCase()}</span>}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rust)' }}>{MEDIA.catLabel(it.kind)}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)', margin: '4px 0 2px', lineHeight: 1.15 }}>{it.title}</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)' }}>
          {it.personId ? personName(it.personId) : 'unattached'}{it.date ? ' · ' + it.date : ''}
        </div>
      </div>
    </div>
  );
}

/* ---- detail overlay ---- */
function ItemDetail(props) {
  const it = props.item;
  const row = { fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink)', margin: '6px 0' };
  const k = { color: 'var(--faded)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10, marginRight: 8 };
  return (
    <div onClick={props.onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,39,68,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={function (e) { e.stopPropagation(); }} style={{ background: 'var(--parchment)', borderRadius: 12, maxWidth: 900, width: '100%', maxHeight: '90vh', overflow: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)' }}>
        <div style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          {isImg(it) ? <img src={it.dataUrl} alt={it.title} style={{ maxWidth: '100%', maxHeight: '86vh', objectFit: 'contain' }} />
            : <a href={it.dataUrl} download={it.name || it.title} style={{ color: 'var(--gold-bright)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>📄 Open / download document</a>}
        </div>
        <div style={{ padding: 26 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--rust)' }}>{MEDIA.catLabel(it.kind)}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', margin: '6px 0 14px' }}>{it.title}</div>
          {it.personId ? <div style={row}><span style={k}>Person</span>{personName(it.personId)}</div> : null}
          {it.date ? <div style={row}><span style={k}>Date</span>{it.date}</div> : null}
          {it.source ? <div style={row}><span style={k}>Source</span>{it.source}</div> : null}
          {it.note ? <div style={row}><span style={k}>Note</span>{it.note}</div> : null}
          <div style={row}><span style={k}>File</span>{(it.name || 'file')} · {fmtBytes(it.size)}</div>
          <div style={{ marginTop: 22, display: 'flex', gap: 10 }}>
            <button onClick={props.onClose} style={{ flex: 1, padding: '10px', fontFamily: 'var(--font-sans)', fontSize: 13, background: 'var(--cream)', border: '1px solid var(--border-medium)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink)' }}>Close</button>
            <button onClick={function () { props.onDelete(it); }} style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, background: 'var(--bg-danger)', border: '1px solid var(--blood)', color: 'var(--blood)', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- root ---- */
function Archive() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState('all');
  const [person, setPerson] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const importRef = useRef();

  function refresh() { return MEDIA.all().then(function (list) { setItems(list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); })); }); }
  useEffect(function () { MEDIA.ready().then(refresh); }, []);

  const idx = useMemo(function () { return MEDIA.index(items || [], AR_DATA); }, [items]);
  const shown = useMemo(function () {
    return (items || []).filter(function (it) {
      if (cat !== 'all' && it.kind !== cat) return false;
      if (person !== 'all' && it.personId !== person) return false;
      if (q) { var s = (it.title + ' ' + (it.note || '') + ' ' + (it.source || '') + ' ' + personName(it.personId || '')).toLowerCase(); if (s.indexOf(q.toLowerCase()) === -1) return false; }
      return true;
    });
  }, [items, cat, person, q]);

  function del(it) { MEDIA.remove(it.id).then(function () { setOpen(null); refresh(); }); }
  function doExport() {
    MEDIA.exportAll().then(function (dump) {
      const blob = new Blob([JSON.stringify(dump)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cason-archive-backup.json'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  }
  function doImport(f) { if (!f) return; const r = new FileReader(); r.onload = function (e) { try { MEDIA.importAll(JSON.parse(e.target.result)).then(refresh); } catch (x) {} }; r.readAsText(f); }

  const peopleWith = useMemo(function () { return Object.keys(idx.byPerson); }, [idx]);
  const chip = function (active) { return { fontFamily: 'var(--font-sans)', fontSize: 12, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid ' + (active ? 'var(--rust)' : 'var(--border-medium)'), background: active ? 'var(--rust)' : 'transparent', color: active ? 'var(--cream)' : 'var(--ink)' }; };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 80px' }}>
      <header style={{ padding: '46px 0 24px', borderBottom: '1px solid var(--border-hairline)', marginBottom: 30 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--rust)' }}>The Cason Line</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px,5vw,54px)', color: 'var(--ink)', margin: '6px 0 10px', fontWeight: 600 }}>The Family Archive</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--faded)', maxWidth: 640, margin: 0 }}>
          Load photographs and documents &mdash; deeds, census sheets, wills, letters, portraits &mdash; and file each under a category and, when you know it, the ancestor it belongs to.
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)', marginTop: 14 }}>
          🔒 Everything is stored <strong>on this device only</strong> ({MEDIA.backendKind() === 'indexeddb' ? 'in your browser' : 'in memory'}). Nothing is uploaded. Use <strong>Export</strong> to make a backup you keep.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,340px) minmax(0,1fr)', gap: 34, alignItems: 'start' }} className="ar-cols">
        <AddForm onAdded={function () { refresh(); }} />

        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={chip(cat === 'all')} onClick={function () { setCat('all'); }}>All · {idx.count}</span>
            {MEDIA.CATEGORIES.filter(function (c) { return idx.byKind[c.key]; }).map(function (c) {
              return <span key={c.key} style={chip(cat === c.key)} onClick={function () { setCat(c.key); }}>{c.label} · {idx.byKind[c.key]}</span>;
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 22px', alignItems: 'center' }}>
            <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder="Search the archive…" style={{ flex: '1 1 200px', fontFamily: 'var(--font-serif)', fontSize: 14, padding: '8px 12px', border: '1px solid var(--border-medium)', borderRadius: 6, background: 'var(--cream)', color: 'var(--ink)' }} />
            {peopleWith.length ? (
              <select value={person} onChange={function (e) { setPerson(e.target.value); }} style={{ fontFamily: 'var(--font-serif)', fontSize: 14, padding: '8px 10px', border: '1px solid var(--border-medium)', borderRadius: 6, background: 'var(--cream)', color: 'var(--ink)' }}>
                <option value="all">Everyone with media ({peopleWith.length})</option>
                {peopleWith.map(function (pid) { return <option key={pid} value={pid}>{personName(pid)} ({idx.byPerson[pid].length})</option>; })}
              </select>
            ) : null}
            <button onClick={doExport} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink)' }}>Export backup</button>
            <button onClick={function () { importRef.current && importRef.current.click(); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, padding: '8px 14px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink)' }}>Import</button>
            <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={function (e) { doImport(e.target.files[0]); e.target.value = ''; }} />
          </div>

          {items === null ? <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--faded)' }}>Opening the archive…</p>
            : shown.length === 0 ? (
              <div style={{ border: '2px dashed var(--border-medium)', borderRadius: 10, padding: '50px 24px', textAlign: 'center', fontFamily: 'var(--font-serif)', color: 'var(--faded)' }}>
                {idx.count === 0 ? 'The archive is empty. Add your first photograph or document on the left.' : 'Nothing matches these filters.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                {shown.map(function (it) { return <ItemCard key={it.id} item={it} onOpen={setOpen} />; })}
              </div>
            )}
        </div>
      </div>

      {open ? <ItemDetail item={open} onClose={function () { setOpen(null); }} onDelete={del} /> : null}
    </div>
  );
}

window.Archive = Archive;
