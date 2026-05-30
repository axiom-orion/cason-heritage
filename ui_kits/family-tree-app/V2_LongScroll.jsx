/* Variant 2 — The Long Scroll
   Scroll-as-time. A vertical timeline with a year-ticker on the left,
   ancestors as horizontal cards alternating around a center rail,
   and a persistent location summary on the right that updates with scroll. */

const LongScrollView = () => {
  const data = window.CASON_DATA;
  const [year, setYear] = React.useState(1763);
  const [selectedId, setSelectedId] = React.useState(null);
  const scrollRef = React.useRef();

  // Direct line entries with year anchors for the year-ticker.
  const entries = data.directLine.map(id => data.people[id]).filter(Boolean);

  // Crude year extraction for the ticker.
  const yearOf = p => {
    if (p.born?.year) return p.born.year;
    if (p.lifespan) {
      const m = p.lifespan.match(/(\d{4})/);
      if (m) return parseInt(m[1]);
    }
    return null;
  };

  const onScroll = e => {
    const rows = e.currentTarget.querySelectorAll('[data-yr]');
    let visible = entries[0];
    rows.forEach(r => {
      const top = r.getBoundingClientRect().top;
      if (top < 240) visible = entries.find(en => en.id === r.dataset.id);
    });
    if (visible) setYear(yearOf(visible) || 1608);
  };

  const place = entries.reduce((acc, e) => {
    if (yearOf(e) <= year) return e.born?.place || acc;
    return acc;
  }, 'Hertfordshire, England');

  return (
    <div style={{ ...parchmentBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader subtitle="The Long Scroll · scroll-as-time" right={<>
        <HeaderButton>Jump to year</HeaderButton>
        <HeaderButton primary>Contribute</HeaderButton>
      </>}/>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Year ticker — fixed left rail */}
        <div style={{
          width: 84, flexShrink: 0,
          background: 'var(--deep-blue)', color: 'var(--gold-bright)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 32, position: 'relative',
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(244,237,228,0.5)',
            writingMode: 'vertical-rl', transform: 'rotate(180deg)',
            position: 'absolute', top: 100, left: 18,
          }}>4 centuries · 11 generations</div>
          <div style={{
            position: 'sticky', top: '40%',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 36,
            color: 'var(--gold-bright)', textAlign: 'center', lineHeight: 1,
          }}>{year}</div>
          <div style={{
            position: 'sticky', top: 'calc(40% + 50px)',
            fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(244,237,228,0.6)',
          }}>year of</div>
        </div>

        {/* Scroll column */}
        <div ref={scrollRef} onScroll={onScroll} style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '32px 0',
          position: 'relative',
        }}>
          {/* Center spine */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: '50%',
            width: 3, transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, var(--gold), var(--rust), var(--deep-blue))',
            opacity: 0.5,
          }}/>

          {entries.map((p, i) => {
            const left = i % 2 === 0;
            const y = yearOf(p);
            return (
              <div
                key={p.id}
                data-yr={y}
                data-id={p.id}
                style={{
                  display: 'flex',
                  justifyContent: left ? 'flex-start' : 'flex-end',
                  position: 'relative',
                  padding: '0 30px',
                  marginBottom: 28,
                }}
              >
                {/* Spine dot */}
                <div style={{
                  position: 'absolute', left: '50%', top: 14,
                  width: 14, height: 14, borderRadius: '50%',
                  background: p.direct ? 'var(--gold-bright)' : 'var(--faded)',
                  border: '3px solid var(--parchment)',
                  boxShadow: '0 0 0 2px var(--gold)',
                  transform: 'translateX(-50%)',
                }}/>

                {/* Card */}
                <div
                  onClick={() => setSelectedId(p.id)}
                  style={{
                    width: '46%',
                    background: p.direct ? 'linear-gradient(135deg, var(--cream), #fff8ec)' : 'var(--cream)',
                    border: p.direct ? '2px solid var(--gold)' : '1px dashed var(--rust)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    boxShadow: '0 4px 18px rgba(44,24,16,0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: 'var(--gold)', marginBottom: 3,
                  }}>Gen {p.generation} {p.role ? '· ' + p.role : ''}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 17, color: 'var(--ink)', lineHeight: 1.2,
                  }}>{p.name}</div>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 11,
                    color: 'var(--faded)', marginTop: 2,
                  }}>{p.lifespan}</div>
                  {p.born?.place && (
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 10.5,
                      color: 'var(--sea-green)', fontWeight: 600, marginTop: 4,
                    }}>↳ {p.born.place}</div>
                  )}
                  {p.narrative && (
                    <p style={{
                      fontFamily: 'var(--font-serif)', fontSize: 12, lineHeight: 1.55,
                      color: 'var(--ink)', marginTop: 8,
                    }}>{p.narrative.slice(0, 220)}{p.narrative.length > 220 ? '…' : ''}</p>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{
            textAlign: 'center', padding: '20px 0',
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            color: 'var(--faded)', fontSize: 13,
          }}>· the line continues ·</div>
        </div>

        {/* Right: persistent "where they were" panel */}
        <div style={{
          width: 220, flexShrink: 0,
          background: 'var(--cream)',
          borderLeft: '1px solid rgba(139,69,19,0.15)',
          padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>Where they were</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            color: 'var(--ink)', lineHeight: 1.35,
          }}>{place}</div>

          <div style={{
            height: 140, borderRadius: 8,
            border: '1.5px solid var(--rust)',
            background: `radial-gradient(circle at 30% 60%, rgba(212,168,37,0.4) 0 2%, transparent 2.1%),
                          radial-gradient(circle at 60% 40%, rgba(139,69,19,0.3) 0 1.6%, transparent 1.7%),
                          linear-gradient(135deg, #f7efe2, #ede2cf)`,
          }}/>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 11.5, color: 'var(--faded)', lineHeight: 1.5,
          }}>The map updates as you scroll. The family moved from Hertfordshire to the Space Coast.</div>

          <div style={{ marginTop: 'auto' }}>
            <ContributeCTA person={{ name: 'an ancestor' }} compact />
          </div>
        </div>
      </div>

      <PersonDrawer
        person={data.people[selectedId]}
        allPeople={data.people}
        onClose={() => setSelectedId(null)}
        onSelect={setSelectedId}
      />
    </div>
  );
};

window.LongScrollView = LongScrollView;
