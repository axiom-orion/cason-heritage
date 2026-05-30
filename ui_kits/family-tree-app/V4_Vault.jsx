/* Variant 4 — The Vault
   Research/contribution two-pane.
   Left: searchable index with evidence/era filters and unsolved-first sorting.
   Right: focused dossier with photo grid, oral-history upload slot, source list.
   Designed for relatives doing the digging — "I'm going to dig up info for validations." */

const VaultView = () => {
  const data = window.CASON_DATA;
  const [selectedId, setSelectedId] = React.useState('james-1727');
  const [search, setSearch] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const selected = data.people[selectedId];

  // Build flat list of all people sorted by generation, with unsolved/leading first.
  const allPeople = Object.values(data.people).sort((a, b) => {
    const aPriority = a.evidence === 'unsolved' ? 0 : 1;
    const bPriority = b.evidence === 'unsolved' ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (a.generation || 0) - (b.generation || 0);
  });

  const filtered = allPeople.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter === 'unsolved' && p.evidence !== 'unsolved') return false;
    if (activeFilter === 'direct' && !p.direct) return false;
    if (activeFilter === 'with-photos') return false; // none yet
    return true;
  });

  return (
    <div style={{ ...parchmentBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader subtitle="The Vault · research & contribution" right={<>
        <HeaderButton>Export GEDCOM</HeaderButton>
        <HeaderButton primary>+ Add person</HeaderButton>
      </>}/>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — searchable index */}
        <div style={{
          width: 320, flexShrink: 0,
          background: 'var(--cream)',
          borderRight: '1px solid rgba(139,69,19,0.2)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ancestors…"
              style={{
                width: '100%', fontFamily: 'var(--font-serif)', fontSize: 13,
                padding: '8px 12px', borderRadius: 6,
                border: '1px solid rgba(139,69,19,0.2)',
                background: 'var(--parchment)', color: 'var(--ink)',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All', count: Object.keys(data.people).length },
                { id: 'direct', label: 'Direct line', count: data.directLine.length },
                { id: 'unsolved', label: 'Unsolved', count: Object.values(data.people).filter(p => p.evidence === 'unsolved').length },
                { id: 'with-photos', label: 'With photos', count: 0 },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600,
                    padding: '4px 9px', borderRadius: 999,
                    border: `1px solid ${activeFilter === f.id ? 'var(--gold)' : 'rgba(139,69,19,0.2)'}`,
                    background: activeFilter === f.id ? '#fff8ec' : 'transparent',
                    color: activeFilter === f.id ? 'var(--ink)' : 'var(--faded)',
                    cursor: 'pointer',
                  }}
                >{f.label} <span style={{ opacity: 0.6, marginLeft: 2 }}>{f.count}</span></button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--rust)', padding: '8px 0 4px',
            }}>Needs attention · {Object.values(data.people).filter(p => p.evidence === 'unsolved').length}</div>

            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  width: '100%', padding: '8px 10px', borderRadius: 6,
                  border: '1px solid transparent',
                  background: selectedId === p.id ? '#fff8ec' : 'transparent',
                  borderColor: selectedId === p.id ? 'var(--gold)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  marginBottom: 2,
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(154,123,45,0.1)',
                  border: '1px dashed var(--gold)',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700,
                  color: 'var(--gold)',
                }}>{p.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 600,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</div>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--faded)',
                  }}>Gen {p.generation} · {p.lifespan || '—'}</div>
                </div>
                {p.evidence && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: p.evidence === 'unsolved' ? 'var(--rust)'
                              : p.evidence === 'confirmed' ? 'var(--sea-green)'
                              : p.evidence === 'eliminated' ? 'var(--blood)'
                              : 'var(--faded)',
                    flexShrink: 0,
                  }}/>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — dossier */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Banner */}
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--gold)', marginBottom: 4,
          }}>Generation {selected.generation} {selected.role && '— ' + selected.role}</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <PhotoSlot size={108} person={selected} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 30, color: 'var(--ink)', lineHeight: 1.1,
              }}>{selected.name}</div>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 13,
                color: 'var(--faded)', marginTop: 4,
              }}>{selected.lifespan}</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                {selected.evidence && <EvidenceBadge evidence={selected.evidence} />}
                {selected.direct && (
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--gold-bright)', background: 'var(--deep-blue)',
                    padding: '2px 8px', borderRadius: 3,
                  }}>Direct line</span>
                )}
              </div>
            </div>
          </div>

          {/* If unsolved — feature an evidence-needed callout */}
          {selected.evidence === 'unsolved' && (
            <div style={{
              marginTop: 18, padding: '14px 18px',
              background: 'linear-gradient(135deg, #fff8ec, #fef3e2)',
              border: '2px dashed var(--rust)', borderRadius: 8,
            }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'var(--rust)', marginBottom: 4,
              }}>Evidence needed</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
                color: 'var(--ink)', marginBottom: 6,
              }}>What we'd need to confirm {selected.name.split(' ')[0]}</div>
              <ul style={{
                fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--ink)',
                margin: 0, paddingLeft: 18, lineHeight: 1.6,
              }}>
                <li>Y-DNA test from a known male-line descendant</li>
                <li>Pitt County land or tax records 1750–1790 naming a James Cason</li>
                <li>Bible records or family letters linking father to son</li>
                <li>Will or probate document naming Ransom as heir</li>
              </ul>
            </div>
          )}

          {/* Narrative */}
          {selected.narrative && (
            <div style={{ marginTop: 18 }}>
              <SectionLabel>The story so far</SectionLabel>
              <p style={{
                fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.7,
                color: 'var(--ink)',
              }}>{selected.narrative}</p>
            </div>
          )}

          {/* Two-column: photos & oral history */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
            <div>
              <SectionLabel>Photos · drop to upload</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[0,1,2,3,4,5].map(i => <PhotoSlot key={i} id={`${selected.id}-photo-${i}`} size={68} label={i === 0 ? 'portrait' : i === 1 ? 'home' : i === 2 ? 'document' : null} />)}
              </div>
            </div>

            <div>
              <SectionLabel>Oral history · audio or text</SectionLabel>
              <div style={{
                border: '1.5px dashed var(--sea-green)', borderRadius: 8,
                padding: '14px 16px', minHeight: 144,
                background: 'rgba(45,90,74,0.04)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                  fontSize: 12.5, color: 'var(--faded)', lineHeight: 1.6,
                }}>"My grandmother told me he used to walk down to the Santa Fe river every Sunday after church and just stand there for an hour. Said he was talking to the people who came before him."</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button style={voltButtonStyle}>🎙 Record</button>
                  <button style={voltButtonStyle}>✎ Write</button>
                  <button style={voltButtonStyle}>↑ Upload</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sources & timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
            <div>
              <SectionLabel>Sources · {selected.sources?.length || 0}</SectionLabel>
              <div style={{
                background: 'var(--cream)', borderRadius: 6,
                border: '1px solid rgba(139,69,19,0.15)', padding: 12,
                minHeight: 60,
              }}>
                {(selected.sources || ['No sources cited yet. Add one to strengthen this record.']).map((s, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-sans)', fontSize: 12,
                    color: selected.sources ? 'var(--rust)' : 'var(--faded)',
                    fontStyle: selected.sources ? 'normal' : 'italic',
                    padding: '4px 0', borderBottom: i < (selected.sources?.length || 0) - 1 ? '1px solid rgba(139,69,19,0.08)' : 'none',
                  }}>{selected.sources ? '§ ' + s : s}</div>
                ))}
                <button style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.05em', color: 'var(--sea-green)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '6px 0 0', marginTop: 4,
                }}>+ Add source</button>
              </div>
            </div>

            <div>
              <SectionLabel>Linked relatives</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[...(selected.parents||[]), ...(selected.spouse||[]), ...(selected.children||[])]
                  .map(id => data.people[id]).filter(Boolean).map(p => (
                    <button
                      key={p.id} onClick={() => setSelectedId(p.id)}
                      style={{
                        fontFamily: 'var(--font-serif)', fontSize: 11.5,
                        padding: '4px 10px', borderRadius: 4,
                        border: '1px solid rgba(139,69,19,0.2)',
                        background: 'var(--cream)', color: 'var(--ink)', cursor: 'pointer',
                      }}>{p.name}</button>
                  ))}
              </div>
            </div>
          </div>

          {/* Contribution dock */}
          <div style={{ marginTop: 24 }}>
            <ContributeCTA person={selected} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--gold)', marginBottom: 8,
  }}>{children}</div>
);

const voltButtonStyle = {
  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
  padding: '6px 10px', borderRadius: 4, cursor: 'pointer',
  background: 'var(--sea-green)', color: 'var(--cream)',
  border: 'none',
};

window.VaultView = VaultView;
