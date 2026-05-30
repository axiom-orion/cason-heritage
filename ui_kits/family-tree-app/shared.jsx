/* Shared components for all four family-tree variants.
   All components are exported to window. */

const FT_PALETTE = {
  bg: 'var(--parchment)',
  cream: 'var(--cream)',
  ink: 'var(--ink)',
  faded: 'var(--faded)',
  rust: 'var(--rust)',
  gold: 'var(--gold)',
  goldBright: 'var(--gold-bright)',
  deepBlue: 'var(--deep-blue)',
  seaGreen: 'var(--sea-green)',
  blood: 'var(--blood)',
};

/* ── Photo slot — drag-and-drop upload with localStorage persistence ── */
const PHOTO_LS_KEY = 'cason-photo-';
const PHOTO_MAX_BYTES = 800 * 1024; // ~800KB after base64 — refuse bigger

const PhotoSlot = ({ size = 80, label, person, id }) => {
  // Stable key per slot: explicit id wins, else person.id-portrait, else null (won't persist).
  const slotKey = id || (person && person.id ? `${person.id}-portrait` : null);
  const [file, setFile] = React.useState(() => {
    if (!slotKey) return null;
    try { return localStorage.getItem(PHOTO_LS_KEY + slotKey); }
    catch (e) { return null; }
  });
  const [overSize, setOverSize] = React.useState(false);
  const inputRef = React.useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > PHOTO_MAX_BYTES) {
      setOverSize(true);
      setTimeout(() => setOverSize(false), 2500);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setFile(dataUrl);
      if (slotKey) {
        try { localStorage.setItem(PHOTO_LS_KEY + slotKey, dataUrl); }
        catch (err) { /* quota exceeded — keep in-memory */ }
      }
    };
    reader.readAsDataURL(f);
  };

  const clear = (e) => {
    e.preventDefault(); e.stopPropagation();
    setFile(null);
    if (slotKey) {
      try { localStorage.removeItem(PHOTO_LS_KEY + slotKey); } catch (err) {}
    }
  };

  return (
    <label
      style={{
        width: size, height: size, borderRadius: size === 'pill' ? 999 : Math.max(6, size * 0.08),
        background: file ? `url(${file}) center/cover` : 'rgba(154,123,45,0.07)',
        border: overSize ? '1.5px solid var(--blood)' : file ? '1px solid var(--gold)' : '1.5px dashed var(--gold)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        fontFamily: 'var(--font-sans)', fontSize: Math.max(9, size * 0.11),
        color: overSize ? 'var(--blood)' : 'var(--gold)', textAlign: 'center', lineHeight: 1.2, padding: 4,
        position: 'relative', transition: 'all 0.2s',
      }}
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
      onMouseEnter={e => !file && !overSize && (e.currentTarget.style.background = 'rgba(154,123,45,0.14)')}
      onMouseLeave={e => !file && (e.currentTarget.style.background = 'rgba(154,123,45,0.07)')}
    >
      {!file && !overSize && (label || 'add\nphoto')}
      {overSize && 'too\nbig'}
      {file && (
        <button
          onClick={clear}
          aria-label="Remove photo"
          style={{
            position: 'absolute', top: 4, right: 4, width: 18, height: 18,
            borderRadius: '50%', border: 'none', background: 'rgba(44,24,16,0.7)',
            color: 'var(--cream)', cursor: 'pointer', fontSize: 11, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
        >×</button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </label>
  );
};

/* ── Evidence badge — shows confidence in a person's record ── */
const EvidenceBadge = ({ evidence }) => {
  const map = {
    confirmed:  { color: 'var(--sea-green)', label: 'Confirmed' },
    leading:    { color: 'var(--sea-green)', label: 'Leading' },
    secondary:  { color: 'var(--gold)',      label: 'Secondary' },
    possible:   { color: 'var(--faded)',     label: 'Possible' },
    unlikely:   { color: 'var(--blood)',     label: 'Unlikely' },
    eliminated: { color: 'var(--blood)',     label: 'Eliminated' },
    unsolved:   { color: 'var(--rust)',      label: 'Unsolved' },
  };
  const e = map[evidence] || map.confirmed;
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-sans)', fontSize: 10,
      fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: e.color,
      border: `1px solid ${e.color}`,
      padding: '1px 6px', borderRadius: 3,
      background: 'rgba(255,255,255,0.4)',
    }}>{e.label}</span>
  );
};

/* ── Era pill — for filter chips and tags ── */
const EraPill = ({ era, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.05em',
      padding: '5px 11px', borderRadius: 999,
      border: `1px solid ${active ? era.color : 'rgba(154,123,45,0.3)'}`,
      background: active ? era.color : 'transparent',
      color: active ? 'var(--cream)' : 'var(--faded)',
      cursor: 'pointer', transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >{era.label}</button>
);

/* ── App chrome — header used by every variant ── */
const AppHeader = ({ subtitle, right }) => (
  <header style={{
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    padding: '14px 22px', borderBottom: '1px solid rgba(139,69,19,0.15)',
    background: 'var(--deep-blue)', color: 'var(--cream)',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 900,
        fontSize: 22, color: 'var(--cream)', letterSpacing: '0.02em',
      }}>Into the Unknown</div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--gold-bright)',
      }}>The Cason Line</div>
      {subtitle && (
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 12, color: 'rgba(244,237,228,0.6)',
        }}>· {subtitle}</div>
      )}
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{right}</div>
  </header>
);

const HeaderButton = ({ children, primary, onClick }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: 'var(--font-sans)', fontSize: 11,
      fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
      background: primary ? 'var(--gold-bright)' : 'transparent',
      color: primary ? 'var(--deep-blue)' : 'rgba(244,237,228,0.85)',
      border: primary ? 'none' : '1px solid rgba(196,154,60,0.4)',
      transition: 'all 0.15s',
    }}
  >{children}</button>
);

/* ── Contribution call-to-action — used across variants ── */
const ContributeCTA = ({ person, compact }) => (
  <div style={{
    background: 'rgba(45,90,74,0.06)',
    border: '1px dashed var(--sea-green)',
    borderRadius: 8,
    padding: compact ? '10px 12px' : '14px 16px',
    display: 'flex', gap: 12, alignItems: 'center',
  }}>
    <div style={{
      width: compact ? 28 : 36, height: compact ? 28 : 36,
      borderRadius: '50%', background: 'var(--sea-green)',
      color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, flexShrink: 0,
      fontSize: compact ? 14 : 18,
    }}>+</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: compact ? 13 : 14, fontWeight: 700,
        color: 'var(--ink)',
      }}>Help fill in {person?.name?.split(' ')[0] || 'this story'}</div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)',
        marginTop: 2,
      }}>Photo · oral history · correction · source citation</div>
    </div>
    {!compact && (
      <button style={{
        fontFamily: 'var(--font-sans)', fontSize: 11,
        fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '7px 12px', borderRadius: 4, cursor: 'pointer',
        background: 'var(--sea-green)', color: 'var(--cream)',
        border: 'none', flexShrink: 0,
      }}>Contribute</button>
    )}
  </div>
);

/* ── Person detail drawer — the unified "tap a person" reveal ── */
const PersonDrawer = ({ person, allPeople, onClose, onSelect }) => {
  if (!person) return null;
  const ref = id => allPeople[id];
  const spouses = (person.spouse || []).map(ref).filter(Boolean);
  const children = (person.children || []).map(ref).filter(Boolean);
  const parents = (person.parents || []).map(ref).filter(Boolean);
  const siblings = parents.length
    ? Object.values(allPeople).filter(p =>
        p.id !== person.id &&
        (p.parents || []).some(pid => (person.parents || []).includes(pid)))
    : [];

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 420, maxWidth: '95%',
      background: 'var(--cream)',
      borderLeft: '1px solid rgba(139,69,19,0.2)',
      boxShadow: '-12px 0 40px rgba(44,24,16,0.18)',
      overflowY: 'auto', overflowX: 'hidden',
      fontFamily: 'var(--font-serif)',
      zIndex: 50,
      animation: 'ftDrawerIn 0.3s ease-out',
    }}>
      <style>{`@keyframes ftDrawerIn { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
      <button onClick={onClose} style={{
        position: 'sticky', top: 8, marginLeft: 'calc(100% - 36px)',
        width: 28, height: 28, borderRadius: '50%',
        border: '1px solid rgba(139,69,19,0.2)', background: 'var(--parchment)',
        color: 'var(--faded)', cursor: 'pointer', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>×</button>

      <div style={{ padding: '0 22px 22px', marginTop: -28 }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--gold)', marginBottom: 4,
        }}>Generation {person.generation} {person.role ? '— ' + person.role : ''}</div>

        {/* Name + dates + portrait */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
          <PhotoSlot size={84} person={person} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 22, lineHeight: 1.15, color: 'var(--ink)',
            }}>{person.name}</div>
            {person.lifespan && (
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)',
                marginTop: 3,
              }}>{person.lifespan}</div>
            )}
            <div style={{ marginTop: 8 }}>
              {person.evidence && <EvidenceBadge evidence={person.evidence} />}
            </div>
          </div>
        </div>

        {/* Location */}
        {(person.born?.place || person.died?.place) && (
          <div style={{
            display: 'flex', gap: 16, marginBottom: 14,
            fontFamily: 'var(--font-sans)', fontSize: 12,
          }}>
            {person.born?.place && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 2 }}>Born</div>
                <div style={{ color: 'var(--sea-green)', fontWeight: 600 }}>{person.born.place}</div>
              </div>
            )}
            {person.died?.place && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 2 }}>Died</div>
                <div style={{ color: 'var(--rust)', fontWeight: 600 }}>{person.died.place}</div>
              </div>
            )}
          </div>
        )}

        {/* Narrative */}
        {person.narrative && (
          <p style={{
            fontFamily: 'var(--font-serif)', fontSize: 13.5, lineHeight: 1.65,
            color: 'var(--ink)', marginBottom: 14,
          }}>{person.narrative}</p>
        )}

        {/* Notes / unsolved */}
        {person.notes && (
          <div style={{
            background: 'rgba(139,69,19,0.06)', borderLeft: '3px solid var(--rust)',
            padding: '8px 12px', marginBottom: 14,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 12.5, color: 'var(--ink)',
          }}>{person.notes}</div>
        )}

        {/* Linked relatives */}
        <RelativeRow label="Spouse" people={spouses} onSelect={onSelect} />
        <RelativeRow label="Parents" people={parents} onSelect={onSelect} />
        <RelativeRow label="Siblings" people={siblings} onSelect={onSelect} />
        <RelativeRow label="Children" people={children} onSelect={onSelect} />

        {/* Sources */}
        {person.sources?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 6,
            }}>Sources</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {person.sources.map((s, i) => (
                <li key={i} style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11.5,
                  color: 'var(--rust)', marginBottom: 3,
                }}>· {s}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <ContributeCTA person={person} />
        </div>
      </div>
    </div>
  );
};

const RelativeRow = ({ label, people, onSelect }) => {
  if (!people || people.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 4,
      }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {people.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect && onSelect(p.id)}
            style={{
              fontFamily: 'var(--font-serif)', fontSize: 12,
              padding: '4px 10px', borderRadius: 4,
              border: '1px solid rgba(139,69,19,0.2)',
              background: 'var(--parchment)',
              color: 'var(--ink)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = '#fff8ec'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,69,19,0.2)'; e.currentTarget.style.background = 'var(--parchment)'; }}
          >{p.name}</button>
        ))}
      </div>
    </div>
  );
};

/* ── Compact person node — for tree views and grids ── */
const PersonNode = ({ person, selected, dim, onClick, size = 'md' }) => {
  const sizes = {
    sm: { w: 130, photo: 28, title: 12, sub: 9.5, pad: '7px 9px' },
    md: { w: 168, photo: 36, title: 13, sub: 10, pad: '9px 11px' },
    lg: { w: 200, photo: 48, title: 14, sub: 10.5, pad: '11px 13px' },
  }[size] || {};

  const direct = person.direct;
  const eliminated = person.evidence === 'eliminated';
  const unsolved = person.evidence === 'unsolved';

  return (
    <div
      onClick={onClick}
      style={{
        width: sizes.w,
        padding: sizes.pad, borderRadius: 8,
        background: direct ? 'linear-gradient(135deg, var(--cream), #fff8ec)' : 'var(--cream)',
        border: selected
          ? '2px solid var(--gold-bright)'
          : direct ? '1.5px solid var(--gold)'
          : unsolved ? '1.5px dashed var(--rust)'
          : '1px solid rgba(139,69,19,0.18)',
        boxShadow: selected ? '0 6px 24px rgba(154,123,45,0.35)' : '0 2px 10px rgba(44,24,16,0.07)',
        cursor: 'pointer',
        opacity: dim ? 0.35 : 1,
        transition: 'all 0.2s',
        display: 'flex', gap: 8, alignItems: 'center',
        position: 'relative',
      }}
    >
      <div style={{
        width: sizes.photo, height: sizes.photo, borderRadius: '50%',
        background: eliminated ? 'rgba(107,29,29,0.1)' : 'rgba(154,123,45,0.12)',
        border: `1px dashed ${eliminated ? 'var(--blood)' : 'var(--gold)'}`,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: sizes.photo * 0.42,
        color: eliminated ? 'var(--blood)' : 'var(--gold)',
      }}>{person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: sizes.title, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}>{person.name}</div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: sizes.sub,
          color: eliminated ? 'var(--blood)' : 'var(--faded)',
          marginTop: 2, letterSpacing: '0.02em',
        }}>{person.lifespan || (person.role || '—')}</div>
      </div>
    </div>
  );
};

/* ── Subtle parchment grain ── */
const parchmentBg = {
  background: `
    radial-gradient(ellipse at 30% 20%, rgba(139,69,19,0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 70%, rgba(154,123,45,0.05) 0%, transparent 50%),
    var(--parchment)
  `,
};

Object.assign(window, {
  FT_PALETTE, PhotoSlot, EvidenceBadge, EraPill,
  AppHeader, HeaderButton, ContributeCTA,
  PersonDrawer, PersonNode, RelativeRow,
  parchmentBg,
});
