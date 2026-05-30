/* Variant 1 — The Atlas
   Classic top-down branching tree on a parchment canvas.
   Direct line glows; branches dim. Pan/zoom hint in the corner.
   Tap a node → side drawer with full detail. */

const AtlasView = () => {
  const data = window.CASON_DATA;
  const [selectedId, setSelectedId] = React.useState('ransom-sr');
  const [showOnlyDirect, setShowOnlyDirect] = React.useState(false);
  const [zoom, setZoom] = React.useState(0.85);

  const selected = data.people[selectedId];

  // Top-down layout, generation-by-generation.
  // Layout 7 generations explicitly — beyond that becomes hard to read at this scale.
  const layout = [
    [{ id: 'thomas-sr' }],
    [{ id: 'james-1634' }, { id: 'ruth' }, { id: 'thomas-jr' }],
    [{ id: 'james-orphan' }],
    [{ id: 'susannah' }, { id: 'thomas-3' }, { id: 'james-jr-1690' }, { id: 'elizabeth' }, { id: 'dynah' }, { id: 'william-1695' }],
    [{ id: 'cannon-sr' }, { id: 'william-jr' }, { id: 'james-1727' }, { id: 'john-1728' }, { id: 'henry-1732' }, { id: 'hillery' }],
    [{ id: 'ransom-sr' }],
    [{ id: 'john-cason-6' }, { id: 'speckled-bill' }, { id: 'james-green' }, { id: 'ransom-jr' }, { id: 'moses' }, { id: 'clementine' }, { id: 'martha' }, { id: 'phoebe-c' }, { id: 'becky' }],
  ];

  const showPerson = p => {
    if (showOnlyDirect) return p.direct;
    return true;
  };

  return (
    <div style={{ ...parchmentBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader subtitle="The Atlas" right={<>
        <HeaderButton onClick={() => setShowOnlyDirect(d => !d)}>{showOnlyDirect ? 'Show All' : 'Direct Line Only'}</HeaderButton>
        <HeaderButton primary>Contribute</HeaderButton>
      </>}/>

      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 22px', flexWrap: 'wrap',
        background: 'var(--cream)', borderBottom: '1px solid rgba(139,69,19,0.12)',
        alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--faded)', marginRight: 6,
        }}>Era</div>
        {data.eras.map(e => <EraPill key={e.id} era={e} active />)}
        <div style={{ flex: 1 }} />
        <input placeholder="Search ancestors…" style={{
          fontFamily: 'var(--font-serif)', fontSize: 12,
          padding: '6px 12px', borderRadius: 999,
          border: '1px solid rgba(139,69,19,0.2)',
          background: 'var(--parchment)', color: 'var(--ink)', width: 200,
          outline: 'none',
        }}/>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          transform: `scale(${zoom})`, transformOrigin: 'top center',
          padding: '24px 24px 80px',
          minWidth: 1240,
          transition: 'transform 0.2s',
        }}>
          {layout.map((gen, genIdx) => (
            <div key={genIdx}>
              {/* Generation label */}
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--gold)', textAlign: 'center', marginBottom: 4,
              }}>Generation {genIdx + 1}</div>

              {/* Row of nodes */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 10,
                marginBottom: 6,
              }}>
                {gen.map(({ id }) => {
                  const p = data.people[id];
                  if (!p || !showPerson(p)) return <div key={id} style={{ width: 130 }} />;
                  return (
                    <PersonNode
                      key={id}
                      person={p}
                      selected={id === selectedId}
                      dim={showOnlyDirect && !p.direct}
                      onClick={() => setSelectedId(id)}
                      size="sm"
                    />
                  );
                })}
              </div>

              {/* Connector line down (except for last gen) */}
              {genIdx < layout.length - 1 && (
                <div style={{
                  width: 2, height: 26, background: 'var(--gold)',
                  margin: '0 auto', opacity: 0.5,
                }}/>
              )}
            </div>
          ))}

          <div style={{
            textAlign: 'center', marginTop: 18,
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            color: 'var(--faded)', fontSize: 13,
          }}>· four more generations · Lt. Ransom 2 → Robert Sr. · 1835–present ·</div>
        </div>

        {/* Zoom controls */}
        <div style={{
          position: 'absolute', bottom: 18, left: 18, display: 'flex', gap: 4,
          background: 'var(--cream)', padding: 4, borderRadius: 8,
          border: '1px solid rgba(139,69,19,0.15)',
          boxShadow: '0 2px 10px rgba(44,24,16,0.08)',
        }}>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} style={zoomBtn}>−</button>
          <div style={{
            padding: '4px 10px', fontFamily: 'var(--font-sans)',
            fontSize: 11, color: 'var(--faded)', alignSelf: 'center',
          }}>{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom(z => Math.min(1.3, z + 0.1))} style={zoomBtn}>+</button>
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 18, right: 18,
          background: 'var(--cream)', padding: '10px 14px', borderRadius: 8,
          border: '1px solid rgba(139,69,19,0.15)',
          fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)',
          display: 'flex', gap: 14, alignItems: 'center',
          boxShadow: '0 2px 10px rgba(44,24,16,0.08)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'linear-gradient(135deg, var(--cream), #fff8ec)', border: '1.5px solid var(--gold)', borderRadius: 2 }}/>Direct line</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.18)', borderRadius: 2 }}/>Branch</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: 'var(--cream)', border: '1.5px dashed var(--rust)', borderRadius: 2 }}/>Unsolved</span>
        </div>

        <PersonDrawer
          person={selected}
          allPeople={data.people}
          onClose={() => setSelectedId(null)}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
};

const zoomBtn = {
  width: 24, height: 24, borderRadius: 4, border: 'none',
  background: 'transparent', color: 'var(--ink)', cursor: 'pointer',
  fontSize: 14, fontFamily: 'var(--font-sans)',
};

window.AtlasView = AtlasView;
