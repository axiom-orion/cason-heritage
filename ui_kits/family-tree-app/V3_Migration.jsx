/* Variant 3 — The Migration
   Map-as-tree. The geographic journey IS the family structure.
   Plot ancestors at their last known locations, draw migration arcs
   between parent and child. Hovering a node lights up its descendants. */

const MigrationView = () => {
  const data = window.CASON_DATA;
  const [selectedId, setSelectedId] = React.useState('ransom-sr');

  // Map projection — we plot a stylized East-Coast-plus-England map
  // in a 1000x600 viewBox. Coords are hand-tuned for legibility.
  // (Real lat/long would clutter at this scale.)
  const W = 1000, H = 600;

  // Map view positions per direct-line person (X, Y in viewBox units)
  const nodes = [
    { id: 'thomas-sr',  x: 810, y: 90,  label: 'Hertfordshire' },
    { id: 'thomas-jr',  x: 380, y: 200, label: 'Lynnhaven, VA' },
    { id: 'james-orphan', x: 360, y: 230, label: 'Princess Anne' },
    { id: 'william-1695', x: 340, y: 290, label: 'Pitt Co., NC' },
    { id: 'james-1727', x: 330, y: 320, label: 'Pitt Co., NC' },
    { id: 'ransom-sr',  x: 300, y: 410, label: 'Alachua Co., FL' },
    { id: 'james-green', x: 295, y: 440, label: 'Alachua' },
    { id: 'ransom-2',   x: 290, y: 460, label: 'Alachua' },
    { id: 'thadeous',   x: 275, y: 470, label: 'Fort White' },
    { id: 'carl-columbus', x: 270, y: 480, label: 'Fort White' },
    { id: 'robert-sr',  x: 360, y: 520, label: 'Titusville · CR 778' },
  ];

  // Branch nodes — siblings who left the direct line
  const branches = [
    { id: 'cannon-sr', x: 280, y: 340, label: 'Fairfield Co., SC' },
    { id: 'hillery',   x: 295, y: 370, label: 'Screven Co., GA' },
    { id: 'henry-1732',x: 350, y: 320, label: 'Pitt Co., NC' },
  ];

  // Arcs from parent → child
  const arcs = [];
  for (let i = 1; i < nodes.length; i++) arcs.push([nodes[i-1], nodes[i]]);

  const selected = data.people[selectedId];

  // Build set of selected's ancestor + descendant ids for highlight
  const inLineage = (id) => {
    if (!selectedId) return true;
    let ids = new Set([selectedId]);
    let p = data.people[selectedId];
    while (p?.parents?.length) {
      const pid = p.parents.find(x => data.people[x]?.direct) || p.parents[0];
      if (!pid) break;
      ids.add(pid);
      p = data.people[pid];
    }
    // descendants
    const desc = (pid) => {
      const per = data.people[pid];
      if (!per) return;
      (per.children || []).forEach(cid => {
        if (data.people[cid]?.direct) { ids.add(cid); desc(cid); }
      });
    };
    desc(selectedId);
    return ids.has(id);
  };

  return (
    <div style={{ ...parchmentBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader subtitle="The Migration · map-as-tree" right={<>
        <HeaderButton>Direct line</HeaderButton>
        <HeaderButton>Branches</HeaderButton>
        <HeaderButton primary>Contribute</HeaderButton>
      </>}/>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* MAP CANVAS */}
        <div style={{
          flex: 1, position: 'relative',
          background: `
            radial-gradient(ellipse at 50% 100%, rgba(45,90,74,0.05) 0%, transparent 60%),
            var(--parchment)
          `,
        }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            {/* Stylized coastline + atlantic */}
            <defs>
              <pattern id="oceanGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 10 Q5 8 10 10 T20 10" stroke="rgba(45,90,74,0.18)" fill="none" strokeWidth="0.6"/>
              </pattern>
              <linearGradient id="arcGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--gold-bright)"/>
                <stop offset="100%" stopColor="var(--rust)"/>
              </linearGradient>
            </defs>

            {/* Atlantic */}
            <path d="M 0 60 Q 200 80 380 130 Q 500 170 600 200 Q 700 130 900 80 L 1000 60 L 1000 600 L 0 600 Z" fill="url(#oceanGrid)"/>

            {/* North America landmass (stylized) */}
            <path d="M 0 0 L 0 280 Q 120 240 250 250 Q 320 290 340 360 Q 320 420 280 480 Q 320 540 400 560 Q 480 555 520 500 Q 540 440 510 380 Q 460 320 410 290 Q 380 230 360 180 Q 320 100 220 60 Z"
                  fill="rgba(244,237,228,1)" stroke="var(--rust)" strokeWidth="1.5"/>

            {/* Florida peninsula spike */}
            <path d="M 320 420 Q 360 460 400 530 Q 410 555 395 565 Q 370 560 350 530 Q 330 490 320 460 Z"
                  fill="rgba(244,237,228,1)" stroke="var(--rust)" strokeWidth="1.5"/>

            {/* British Isles */}
            <path d="M 760 60 Q 790 50 830 65 Q 850 90 845 130 Q 820 145 790 135 Q 770 110 760 80 Z"
                  fill="rgba(244,237,228,1)" stroke="var(--rust)" strokeWidth="1.5"/>

            {/* Migration arcs */}
            {arcs.map((a, i) => {
              const [p1, p2] = a;
              // Atlantic-spanning arc gets a wider curve
              const dx = p2.x - p1.x, dy = p2.y - p1.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const curve = Math.min(80, dist * 0.25);
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2 - curve;
              const a1 = inLineage(p1.id) && inLineage(p2.id);
              return (
                <path
                  key={i}
                  d={`M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`}
                  stroke={a1 ? 'url(#arcGold)' : 'rgba(154,123,45,0.25)'}
                  strokeWidth={a1 ? 2.2 : 1.2}
                  strokeDasharray={i === 0 ? '6 5' : 'none'}
                  fill="none"
                  opacity={a1 ? 0.9 : 0.4}
                />
              );
            })}

            {/* Branch arcs (to gray nodes) */}
            {branches.map((b, i) => {
              const parent = nodes.find(n => n.id === 'william-1695');
              if (!parent) return null;
              return (
                <line key={'b'+i}
                  x1={parent.x} y1={parent.y}
                  x2={b.x} y2={b.y}
                  stroke="var(--faded)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5"/>
              );
            })}

            {/* Branch markers */}
            {branches.map(b => {
              const p = data.people[b.id];
              return (
                <g key={b.id} onClick={() => setSelectedId(b.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={b.x} cy={b.y} r="5" fill="var(--parchment)" stroke="var(--blood)" strokeWidth="1.5" opacity="0.7"/>
                  <text x={b.x + 8} y={b.y + 3} fontFamily="var(--font-sans)" fontSize="9" fill="var(--blood)">{p?.name.split(' ')[0]}</text>
                </g>
              );
            })}

            {/* Direct-line nodes */}
            {nodes.map(n => {
              const p = data.people[n.id];
              const lit = inLineage(n.id);
              const isSel = selectedId === n.id;
              return (
                <g key={n.id} onClick={() => setSelectedId(n.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={isSel ? 11 : 7}
                          fill={lit ? 'var(--gold-bright)' : 'rgba(154,123,45,0.3)'}
                          stroke={isSel ? 'var(--blood)' : 'var(--ink)'}
                          strokeWidth={isSel ? 2 : 1}/>
                  {isSel && <circle cx={n.x} cy={n.y} r="18" fill="none" stroke="var(--gold-bright)" strokeWidth="1.5" opacity="0.6"/>}
                  <text
                    x={n.x + 14} y={n.y + 4}
                    fontFamily="var(--font-display)"
                    fontSize={isSel ? 13 : 11}
                    fontWeight={isSel ? 700 : 600}
                    fill={lit ? 'var(--ink)' : 'var(--faded)'}
                  >{p?.name.split(' ').slice(0, 2).join(' ')}</text>
                  <text x={n.x + 14} y={n.y + 18}
                        fontFamily="var(--font-sans)" fontSize="9.5"
                        fill="var(--faded)">{n.label}</text>
                </g>
              );
            })}
          </svg>

          {/* Map title overlay */}
          <div style={{
            position: 'absolute', top: 18, left: 22,
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            color: 'var(--rust)', fontSize: 16,
          }}>England → Virginia → North Carolina → Georgia → Florida</div>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 18, left: 22,
            background: 'var(--cream)', padding: '10px 14px', borderRadius: 8,
            border: '1px solid rgba(139,69,19,0.15)',
            fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)',
            display: 'flex', flexDirection: 'column', gap: 5,
            boxShadow: '0 2px 10px rgba(44,24,16,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-bright)' }}/>Direct line</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'transparent', border: '1.5px solid var(--blood)' }}/>Branch</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 2, background: 'var(--gold-bright)', borderRadius: 1 }}/>Parent → child</div>
          </div>
        </div>

        {/* Right side: focused person card */}
        <div style={{
          width: 320, flexShrink: 0,
          background: 'var(--cream)',
          borderLeft: '1px solid rgba(139,69,19,0.2)',
          overflowY: 'auto', padding: 18,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>Generation {selected.generation} {selected.role && '— ' + selected.role}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <PhotoSlot size={72} person={selected} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 18, color: 'var(--ink)', lineHeight: 1.2,
              }}>{selected.name}</div>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 11,
                color: 'var(--faded)', marginTop: 3,
              }}>{selected.lifespan}</div>
              <div style={{ marginTop: 6 }}>
                {selected.evidence && <EvidenceBadge evidence={selected.evidence} />}
              </div>
            </div>
          </div>

          {selected.narrative && (
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: 12.5, lineHeight: 1.6,
              color: 'var(--ink)',
            }}>{selected.narrative}</p>
          )}

          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--faded)', marginTop: 4,
          }}>Lineage</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {nodes.filter(n => inLineage(n.id)).map(n => {
              const p = data.people[n.id];
              const isSel = n.id === selectedId;
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  style={{
                    fontFamily: 'var(--font-serif)', fontSize: 11,
                    padding: '3px 8px', borderRadius: 999,
                    border: isSel ? '1.5px solid var(--gold-bright)' : '1px solid rgba(139,69,19,0.2)',
                    background: isSel ? '#fff8ec' : 'var(--parchment)',
                    color: 'var(--ink)', cursor: 'pointer',
                  }}
                >{p?.name.split(' ').slice(-1)[0]}</button>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <ContributeCTA person={selected} />
          </div>
        </div>
      </div>
    </div>
  );
};

window.MigrationView = MigrationView;
