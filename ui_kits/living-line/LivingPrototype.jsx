/* ============================================================
   The Living Line — Phase 1 "Memory Inspector"
   ------------------------------------------------------------
   A reviewable window onto the foundation: every relative as a
   first-class persona, and exactly the slice of the shared memory
   graph that persona is allowed to know (individual / generational
   / full-line), with everything past their horizon shown as the
   "unwritten frontier." Reuses the project's design tokens and
   shared components (AppHeader, EvidenceBadge, PersonNode, EraPill).

   Later phases add the world engine (daily tasks, weather, humor),
   the 3-D world, and live dialogue. This proves the bedrock.
   ============================================================ */
const { useState, useMemo } = React;

const DATA = window.CASON_DATA;
const MEM = window.CASON_MEMORY;
const PERS = window.CASON_PERSONAS;

const TIER = {
  individual:   { name: 'Personal Enclave',   sub: 'private memories, sources & corrections', color: 'var(--rust)' },
  generational: { name: 'Generational Fabric', sub: 'what their era knew',                     color: 'var(--sea-green)' },
  family:       { name: 'Ancestral Trunk',     sub: 'the shared line behind them',             color: 'var(--gold)' },
};

function nodeEvidence(ev) {
  const m = {
    confirmed:  ['Confirmed',  'var(--sea-green)'], leading: ['Leading', 'var(--sea-green)'],
    secondary:  ['Secondary',  'var(--gold)'],      possible: ['Possible', 'var(--faded)'],
    unlikely:   ['Unlikely',   'var(--blood)'],     unsolved: ['Open',     'var(--rust)'],
    eliminated: ['Ruled out',  'var(--blood)'],      disproven: ['Disproven','var(--blood)'],
  };
  return m[ev] || ['—', 'var(--faded)'];
}

/* ---- small UI atoms ---- */
const Chip = ({ children, tone }) => (
  <span style={{
    fontFamily: 'var(--font-sans)', fontSize: 11, color: tone || 'var(--ink)',
    background: 'rgba(154,123,45,0.10)', border: '1px solid rgba(154,123,45,0.25)',
    padding: '2px 9px', borderRadius: 999, whiteSpace: 'nowrap',
  }}>{children}</span>
);

const Label = ({ children }) => (
  <div style={{
    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--faded)', margin: '14px 0 6px',
  }}>{children}</div>
);

const StoryInProgress = () => (
  <span style={{
    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--gold)',
    border: '1px dashed var(--gold)', borderRadius: 3, padding: '1px 6px',
    background: 'rgba(154,123,45,0.08)',
  }}>Story in progress</span>
);

/* ---- the persona's role sheet ---- */
function PersonaSheet({ sheet, person }) {
  const levityPct = Math.round(sheet.levity * 100);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', fontWeight: 700 }}>{person.name}</h2>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)' }}>{person.lifespan || 'dates unknown'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
        <EvidenceBadge evidence={person.evidence || 'possible'} />
        {sheet.provenance.reconstructed && <StoryInProgress />}
        <Chip>Gen {sheet.generation}</Chip>
        {sheet.era && <Chip>{sheet.era}</Chip>}
        <Chip tone="var(--rust)">{sheet.occupation}</Chip>
      </div>

      {sheet.provenance.note && (
        <p style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)',
          marginTop: 10, borderLeft: '3px solid var(--gold)', paddingLeft: 10,
        }}>{sheet.provenance.note}</p>
      )}

      <Label>Personality</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sheet.personality.map((t, i) => <Chip key={i}>{t}</Chip>)}
      </div>

      <Label>Abilities</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sheet.abilities.map((t, i) => <Chip key={i} tone="var(--sea-green)">{t}</Chip>)}
      </div>

      <Label>What drives them</Label>
      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--font-serif)', fontSize: 13.5, color: 'var(--ink)' }}>
        {sheet.goals.map((g, i) => <li key={i} style={{ marginBottom: 2 }}>{g}</li>)}
      </ul>

      <Label>Their wisdom</Label>
      {sheet.wisdom.map((w, i) => (
        <p key={i} style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--rust)',
          lineHeight: 1.5, marginBottom: 6,
        }}>“{w}”</p>
      ))}

      <Label>Voice</Label>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)' }}>{sheet.voice.register}</p>

      <Label>Everyday & comical {levityPct >= 60 ? '😄' : ''}</Label>
      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--faded)' }}>
        {sheet.quirks.map((q, i) => <li key={i} style={{ marginBottom: 2 }}>{q}</li>)}
      </ul>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>levity</span>
        <div style={{ flex: 1, maxWidth: 180, height: 7, borderRadius: 4, background: 'rgba(154,123,45,0.15)' }}>
          <div style={{ width: levityPct + '%', height: '100%', borderRadius: 4, background: 'var(--gold-bright)' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>{levityPct}%</span>
      </div>
    </div>
  );
}

/* ---- one memory tier ---- */
function TierBlock({ tier, nodes }) {
  const t = TIER[tier];
  if (!nodes.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{t.name}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>· {t.sub} · {nodes.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {nodes.map((n) => {
          const [evLabel, evColor] = nodeEvidence(n.evidence);
          const ruled = n.evidence === 'disproven' || n.evidence === 'eliminated';
          return (
            <div key={n.id} style={{
              fontFamily: 'var(--font-serif)', fontSize: 12.5, lineHeight: 1.5,
              color: ruled ? 'var(--blood)' : 'var(--ink)',
              background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.12)',
              borderLeft: `3px solid ${t.color}`, borderRadius: 5, padding: '7px 10px',
            }}>
              <span>{n.text}</span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: evColor, marginLeft: 8, whiteSpace: 'nowrap',
              }}>· {evLabel}{n.year ? ' · ' + n.year : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- the accessible-memory panel ---- */
function MemoryView({ sheet, person }) {
  const sub = useMemo(() => MEM.access(person.id), [person.id]);
  const blocked = sub.stats.blockedFuture + sub.stats.blockedGen;
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)', marginBottom: 12,
        background: 'rgba(45,90,74,0.07)', border: '1px solid rgba(45,90,74,0.2)', borderRadius: 6, padding: '8px 12px',
      }}>
        <strong style={{ color: 'var(--sea-green)' }}>{person.name.split(' ')[0]}</strong> knows generations{' '}
        <strong>1–{sub.maxGen}</strong> and nothing dated after{' '}
        <strong>{sub.horizonYear || '—'}</strong>. {sub.stats.visible} memories are within reach.
      </div>

      <TierBlock tier="individual" nodes={sub.individual} />
      <TierBlock tier="generational" nodes={sub.generational} />
      <TierBlock tier="family" nodes={sub.family} />

      <div style={{
        marginTop: 8, padding: '10px 12px', borderRadius: 6,
        border: '1.5px dashed rgba(122,110,98,0.5)', background: 'rgba(122,110,98,0.05)',
        fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)',
      }}>
        ✦ The unwritten frontier — <strong>{blocked}</strong> memories lie beyond {person.name.split(' ')[0]}’s
        horizon (a later generation, or a year past {sub.horizonYear}). The future they are walking toward, but cannot see.
      </div>
    </div>
  );
}

/* ---- Phase-2 world engine: a living day on the homestead ---- */
function btnStyle(active) {
  return {
    fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
    padding: '4px 9px', borderRadius: 5, cursor: 'pointer',
    border: '1px solid ' + (active ? 'var(--gold)' : 'rgba(139,69,19,0.25)'),
    background: active ? 'var(--gold-bright)' : 'var(--cream)', color: active ? 'var(--deep-blue)' : 'var(--faded)',
  };
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function DayInLife({ person, sheet }) {
  const H = window.CASON_MEMORY_API.helpers;
  const ENG = window.CASON_ENGINE;
  const worldRef = React.useRef(null);
  const [, force] = useState(0);
  const [live, setLive] = useState(false);
  const rerender = () => force((n) => n + 1);

  React.useEffect(() => {
    const b = H.birthYearOf(person) || 1700;
    let d = H.deathYearOf(person); if (d == null) d = b + 60;
    const yr = Math.max(b + 1, Math.min(b + 30, d));
    worldRef.current = ENG.createWorld({ year: yr, era: sheet.era, seed: person.id, simDate: new Date(yr, 3, 14), realClock: new Date() });
    rerender();
  }, [person.id]);

  React.useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { if (worldRef.current) { worldRef.current.setRealClock(new Date()); rerender(); } }, 3000);
    return () => clearInterval(t);
  }, [live]);

  const world = worldRef.current;
  if (!world) return null;
  world.setRealClock(new Date());
  const snap = world.snapshot();
  const me = snap.agents.find((a) => a.id === person.id) || snap.agents[0];
  const env = snap.env;
  const wxGlyph = { fair: '☀️', rain: '🌧️', storm: '⛈️', cold: '❄️', hot: '🔥' }[env.weather.kind] || '·';
  const todGlyph = env.timeOfDay.isNight ? '🌙' : (env.timeOfDay.phase === 'dawn' || env.timeOfDay.phase === 'dusk' ? '🌅' : '🌞');
  const nm = (id) => (DATA.people[id] ? DATA.people[id].name.split(' ')[0] : id);

  return (
    <div style={{ marginTop: 22, borderTop: '1px solid rgba(139,69,19,0.15)', paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)' }}>A day on the homestead</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { world.dayStride = 7; world.step(); rerender(); }} style={btnStyle(false)}>Advance a week ›</button>
          <button onClick={() => setLive((v) => !v)} style={btnStyle(live)}>{live ? '⏸ live' : '▶ live'}</button>
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        background: env.timeOfDay.isNight ? 'rgba(26,39,68,0.10)' : 'rgba(212,168,37,0.12)',
        border: '1px solid rgba(139,69,19,0.15)', borderRadius: 8, padding: '8px 12px', marginBottom: 10,
      }}>
        <span style={{ fontSize: 20 }}>{todGlyph}</span>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{env.date.label} · {cap(env.season)}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--faded)' }}>{wxGlyph} {cap(env.weather.label)} · {env.timeOfDay.label}{env.isSunday ? ' · the Sabbath' : ''}</div>
        </div>
      </div>

      {me && (
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 8 }}>
          <strong>{nm(person.id)}</strong> {me.activity}.
          <span style={{ marginLeft: 8 }}><Chip tone="var(--rust)">{me.mood}</Chip></span>
        </div>
      )}

      {me && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }} title="The agent loop behind this moment">
          {me.trace.map((t, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--faded)', background: 'rgba(154,123,45,0.08)', border: '1px solid rgba(154,123,45,0.2)', borderRadius: 3, padding: '1px 5px' }}>{t.step}{t.tool ? ' · ' + t.tool : ''}</span>
          ))}
        </div>
      )}

      {me && me.reflection && (
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--rust)', lineHeight: 1.55, borderLeft: '3px solid var(--gold)', paddingLeft: 10, marginBottom: 10 }}>“{me.reflection.text}”</p>
      )}

      {snap.encounter && snap.encounter.lines.length > 0 && (
        <div style={{ background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.15)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>Overheard nearby · {snap.encounter.relationship}</div>
          {snap.encounter.lines.map((l, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)', marginBottom: 3 }}>
              <strong style={{ color: 'var(--deep-blue)' }}>{nm(l.speaker)}:</strong> “{l.text}”
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Root
   ============================================================ */
function LivingPrototype() {
  const [selectedId, setSelectedId] = useState('thomas-sr');
  const [eraFilter, setEraFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('generation');
  const [query, setQuery] = useState('');

  const roster = useMemo(() => {
    let list = PERS.list.slice();
    if (eraFilter !== 'all') list = list.filter((s) => s.era === eraFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.occupation || '').toLowerCase().includes(q) || (s.archetype || '').includes(q));
    }
    const keyFns = {
      generation: (s) => 'Generation ' + s.generation,
      era: (s) => s.era || 'unknown era',
      archetype: (s) => s.archetype,
      evidence: (s) => s.provenance.confidence,
    };
    const kf = keyFns[groupBy] || keyFns.generation;
    list.sort((a, b) => (a.generation - b.generation) || a.name.localeCompare(b.name));
    const groups = {};
    list.forEach((s) => { (groups[kf(s)] = groups[kf(s)] || []).push(s); });
    return { list, groups, order: Object.keys(groups) };
  }, [eraFilter, groupBy, query]);

  const sheet = PERS.byId[selectedId];
  const person = DATA.people[selectedId];

  return (
    <div style={{ ...window.parchmentBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        subtitle="The Living Line — memory, personas & daily life"
        right={<a href="/dashboard" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--gold-bright)', textDecoration: 'none' }}>↗ family tree</a>}
      />

      {/* controls */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        padding: '12px 22px', borderBottom: '1px solid rgba(139,69,19,0.12)', background: 'rgba(255,255,255,0.4)',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <EraPill era={{ label: 'All ' + PERS.list.length, color: 'var(--deep-blue)' }} active={eraFilter === 'all'} onClick={() => setEraFilter('all')} />
          {DATA.eras.map((e) => (
            <EraPill key={e.id} era={e} active={eraFilter === e.id} onClick={() => setEraFilter(e.id)} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search people…"
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: 'var(--cream)', fontSize: 12, width: 160 }}
        />
        <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>group by{' '}
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: 'var(--cream)', fontSize: 12 }}>
            <option value="generation">generation</option>
            <option value="era">era</option>
            <option value="archetype">role</option>
            <option value="evidence">evidence</option>
          </select>
        </label>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* roster */}
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(139,69,19,0.12)', overflowY: 'auto', padding: '12px 12px 40px' }}>
          {roster.order.length === 0 && <div style={{ padding: 20, color: 'var(--faded)', fontStyle: 'italic' }}>No one matches.</div>}
          {roster.order.map((g) => (
            <div key={g} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', margin: '4px 4px 8px' }}>
                {g} <span style={{ color: 'var(--faded)' }}>· {roster.groups[g].length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {roster.groups[g].map((s) => (
                  <div key={s.id} style={{ position: 'relative' }}>
                    <PersonNode person={DATA.people[s.id]} size="md" selected={s.id === selectedId} onClick={() => setSelectedId(s.id)} />
                    {s.provenance.reconstructed && (
                      <span title="Story in progress" style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', border: '1px solid var(--cream)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* detail */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 24, padding: '22px 26px 60px', minWidth: 0 }}>
          {sheet ? (
            <React.Fragment>
              <div style={{ flex: '1 1 0', minWidth: 280, maxWidth: 460 }}>
                <PersonaSheet sheet={sheet} person={person} />
                <DayInLife person={person} sheet={sheet} />
              </div>
              <div style={{ flex: '1 1 0', minWidth: 300 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 10 }}>
                  Shared memory — what they can know
                </div>
                <MemoryView sheet={sheet} person={person} />
              </div>
            </React.Fragment>
          ) : (
            <div style={{ color: 'var(--faded)', fontStyle: 'italic' }}>Choose a person.</div>
          )}
        </div>
      </div>
    </div>
  );
}

window.LivingPrototype = LivingPrototype;
