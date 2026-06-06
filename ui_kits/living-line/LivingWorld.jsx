/* ============================================================
   The Living Line — Phase 3 front-end
   ------------------------------------------------------------
   The immersive experience over the deterministic brain:
     • a Leaflet macro-map of the migration; click a homestead to
       travel there (place + era + the living cohort)
     • the Homestead: present personas, a live "watch them interact"
       feed, and the selected person's role sheet + current moment
       + horizon-bounded memory + glass-box trace
     • the People Explorer over the whole population (facets, counts)
     • the Memory Hearth: the three knowledge tiers as concentric
       rings, with the unwritten frontier faint beyond the horizon
   Reuses shared.jsx components, the design tokens, and the
   window.CASON_* engine/memory/persona globals. No build step.
   ============================================================ */
const { useState, useMemo, useEffect, useRef } = React;

const DATA = window.CASON_DATA;
const MEM = window.CASON_MEMORY;
const PERS = window.CASON_PERSONAS;
const ENG = window.CASON_ENGINE;
const H = window.CASON_MEMORY_API.helpers;

const ERA = {}; DATA.eras.forEach(function (e) { ERA[e.id] = e; });
const PLACE = {}; DATA.places.forEach(function (p) { PLACE[p.id] = p; });

// Inhabited homestead stops along the line's journey.
const STAGES = [
  { id: 'va', placeId: 'lynnhaven', era: 'colonial', year: 1645, label: 'Lynnhaven Parish, Virginia', blurb: 'Tobacco coast · 1640s' },
  { id: 'nc', placeId: 'beaufort', era: 'frontier', year: 1740, label: 'Beaufort / Pitt Co., North Carolina', blurb: 'Carolina frontier · 1740s' },
  { id: 'fl', placeId: 'newnansville', era: 'pioneer', year: 1845, label: 'Newnansville, Alachua Co., Florida', blurb: 'Pioneer homestead · 1840s' },
  { id: 'war', placeId: 'cason-cem', era: 'civil', year: 1864, label: 'Alachua County at War', blurb: 'The county at war · 1860s' },
  { id: 'fw', placeId: 'fort-white', era: 'modern', year: 1910, label: 'Fort White, Columbia Co., Florida', blurb: 'Turpentine & timber · 1900s' },
  { id: 'sc', placeId: 'titusville', era: 'modern', year: 1957, label: 'Titusville · the Space Coast', blurb: 'Rockets on the horizon · 1957' },
];
const MIGRATION = ['digswell', 'jamestown', 'lynnhaven', 'princess', 'beaufort', 'glynn', 'newnansville', 'cason-cem', 'fort-white', 'titusville'];

function eraHex(era) {
  return { colonial: '#d4a825', frontier: '#2d5a4a', pioneer: '#8b4513', civil: '#6b1d1d', modern: '#9a7b2d' }[era] || '#9a7b2d';
}
function cohortFor(stage) {
  const gens = ERA[stage.era].generations;
  return ENG.activeAt(DATA, stage.year).filter(function (id) { return gens.indexOf(DATA.people[id].generation) !== -1; }).sort();
}
function nm(id) { return DATA.people[id] ? DATA.people[id].name.split(' ')[0] : id; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// open-question count per person (for the explorer + growth)
const OPENQ = {};
(MEM.nodes || []).forEach(function (n) { if (n.kind === 'gap' && n.ownerId) OPENQ[n.ownerId] = (OPENQ[n.ownerId] || 0) + 1; });

/* ---------------- atoms ---------------- */
const Chip = ({ children, tone }) => (
  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: tone || 'var(--ink)', background: 'rgba(154,123,45,0.10)', border: '1px solid rgba(154,123,45,0.25)', padding: '2px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>{children}</span>
);
const Label = ({ children }) => (
  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faded)', margin: '14px 0 6px' }}>{children}</div>
);
const StoryInProgress = () => (
  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px dashed var(--gold)', borderRadius: 3, padding: '1px 6px', background: 'rgba(154,123,45,0.08)' }}>Story in progress</span>
);
function nodeEvidence(ev) {
  const m = { confirmed: ['Confirmed', 'var(--sea-green)'], leading: ['Leading', 'var(--sea-green)'], secondary: ['Secondary', 'var(--gold)'], possible: ['Possible', 'var(--faded)'], unlikely: ['Unlikely', 'var(--blood)'], unsolved: ['Open', 'var(--rust)'], eliminated: ['Ruled out', 'var(--blood)'], disproven: ['Disproven', 'var(--blood)'] };
  return m[ev] || ['—', 'var(--faded)'];
}
function evOpacity(ev) { return { confirmed: 0.95, leading: 0.95, secondary: 0.8, possible: 0.5, unsolved: 0.6, eliminated: 0.9, disproven: 0.9 }[ev] || 0.6; }
function tabBtn(active) {
  return { fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 12px', borderRadius: 5, cursor: 'pointer', border: '1px solid ' + (active ? 'transparent' : 'rgba(196,154,60,0.4)'), background: active ? 'var(--gold-bright)' : 'transparent', color: active ? 'var(--deep-blue)' : 'rgba(244,237,228,0.85)' };
}
function ctlBtn(active) {
  return { fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', padding: '4px 9px', borderRadius: 5, cursor: 'pointer', border: '1px solid ' + (active ? 'var(--gold)' : 'rgba(139,69,19,0.25)'), background: active ? 'var(--gold-bright)' : 'var(--cream)', color: active ? 'var(--deep-blue)' : 'var(--faded)' };
}

/* ---------------- persona role sheet ---------------- */
function PersonaSheet({ sheet, person }) {
  const levityPct = Math.round(sheet.levity * 100);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', fontWeight: 700 }}>{person.name}</h2>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)' }}>{person.lifespan || 'dates unknown'}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
        <EvidenceBadge evidence={person.evidence || 'possible'} />
        {sheet.provenance.reconstructed && <StoryInProgress />}
        <Chip>Gen {sheet.generation}</Chip>
        {sheet.era && <Chip>{ERA[sheet.era] ? ERA[sheet.era].label.split(' (')[0] : sheet.era}</Chip>}
        <Chip tone="var(--rust)">{sheet.occupation}</Chip>
      </div>
      {sheet.provenance.note && (
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)', marginTop: 10, borderLeft: '3px solid var(--gold)', paddingLeft: 10 }}>{sheet.provenance.note}</p>
      )}
      <Label>Personality</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sheet.personality.map((t, i) => <Chip key={i}>{t}</Chip>)}</div>
      <Label>Abilities</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sheet.abilities.map((t, i) => <Chip key={i} tone="var(--sea-green)">{t}</Chip>)}</div>
      <Label>Their wisdom</Label>
      {sheet.wisdom.map((w, i) => <p key={i} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--rust)', lineHeight: 1.5, marginBottom: 6 }}>“{w}”</p>)}
      <Label>Voice</Label>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)' }}>{sheet.voice.register}</p>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>levity {levityPct >= 60 ? '😄' : ''}</span>
        <div style={{ flex: 1, maxWidth: 160, height: 7, borderRadius: 4, background: 'rgba(154,123,45,0.15)' }}>
          <div style={{ width: levityPct + '%', height: '100%', borderRadius: 4, background: 'var(--gold-bright)' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>{levityPct}%</span>
      </div>
    </div>
  );
}

/* ---------------- memory tiers ---------------- */
const TIER = {
  individual: { name: 'Personal Enclave', color: '#8b4513' },
  generational: { name: 'Generational Fabric', color: '#2d5a4a' },
  family: { name: 'Ancestral Trunk', color: '#9a7b2d' },
};
function TierBlock({ tier, nodes }) {
  if (!nodes.length) return null;
  const t = TIER[tier];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{t.name}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>· {nodes.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nodes.slice(0, 40).map(function (n) {
          const ev = nodeEvidence(n.evidence); const ruled = n.evidence === 'disproven' || n.evidence === 'eliminated';
          return (
            <div key={n.id} style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, lineHeight: 1.5, color: ruled ? 'var(--blood)' : 'var(--ink)', background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.12)', borderLeft: '3px solid ' + t.color, borderRadius: 5, padding: '6px 9px' }}>
              {n.text}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: ev[1], marginLeft: 8, whiteSpace: 'nowrap' }}>· {ev[0]}{n.year ? ' · ' + n.year : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function MemoryTiers({ personId, simNow }) {
  const sub = useMemo(function () { return MEM.access(personId, { simNow: simNow }); }, [personId, simNow]);
  const blocked = sub.stats.blockedFuture + sub.stats.blockedGen;
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)', marginBottom: 10, background: 'rgba(45,90,74,0.07)', border: '1px solid rgba(45,90,74,0.2)', borderRadius: 6, padding: '7px 11px' }}>
        Knows generations <strong>1–{sub.maxGen}</strong>, nothing after <strong>{sub.horizonYear || '—'}</strong> · {sub.stats.visible} memories in reach
      </div>
      <TierBlock tier="individual" nodes={sub.individual} />
      <TierBlock tier="generational" nodes={sub.generational} />
      <TierBlock tier="family" nodes={sub.family} />
      <div style={{ marginTop: 6, padding: '9px 11px', borderRadius: 6, border: '1.5px dashed rgba(122,110,98,0.5)', background: 'rgba(122,110,98,0.05)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)' }}>
        ✦ The unwritten frontier — <strong>{blocked}</strong> memories lie beyond the horizon. The future, unseen.
      </div>
    </div>
  );
}

/* ---------------- current moment + glass-box ---------------- */
function CurrentMoment({ snap, personId }) {
  const me = snap.agents.find(function (a) { return a.id === personId; });
  if (!me) {
    const p = DATA.people[personId];
    return <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)' }}>{p ? first(p.name) + ' is not at this homestead in ' + snap.env.date.y + '.' : ''}</div>;
  }
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.6 }}>
        <strong>{nm(personId)}</strong> {me.activity}. <span style={{ marginLeft: 6 }}><Chip tone="var(--rust)">{me.mood}</Chip></span>
      </div>
      {me.reflection && <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--rust)', lineHeight: 1.55, borderLeft: '3px solid var(--gold)', paddingLeft: 10, marginTop: 8 }}>“{me.reflection.text}”</p>}
    </div>
  );
}
function first(name) { return String(name).split(' ')[0]; }

function TracePanel({ snap, personId }) {
  const me = snap.agents.find(function (a) { return a.id === personId; });
  const sub = MEM.access(personId, { simNow: snap.env.date.y });
  return (
    <div style={{ background: 'var(--deep-blue)', borderRadius: 8, padding: '12px 14px', color: 'var(--cream)' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-bright)', marginBottom: 8 }}>Glass-box · the agent loop</div>
      {me ? me.trace.map(function (t, i) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-bright)', minWidth: 58 }}>{t.step}</span>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'rgba(244,237,228,0.9)' }}>{t.tool ? <span style={{ color: '#d4a825' }}>{t.tool}()</span> : null} {t.detail}</span>
          </div>
        );
      }) : <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'rgba(244,237,228,0.6)' }}>Asleep in the record at this hour.</div>}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(196,154,60,0.25)', fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'rgba(244,237,228,0.85)' }}>
        ⛌ circuit breaker — <strong>{sub.stats.blockedFuture + sub.stats.blockedGen}</strong> future / out-of-generation memories withheld; <strong>{sub.stats.visible}</strong> within the horizon of {sub.horizonYear}.
      </div>
    </div>
  );
}

/* ---------------- Memory Hearth (rings) ---------------- */
function MemoryHearth({ personId }) {
  const sub = useMemo(function () { return MEM.access(personId); }, [personId]);
  const cx = 195, cy = 195;
  const rings = [{ key: 'individual', r: 58, color: '#8b4513' }, { key: 'generational', r: 112, color: '#2d5a4a' }, { key: 'family', r: 168, color: '#9a7b2d' }];
  function dotsFor(nodes, r, color) {
    const n = Math.min(nodes.length, 54);
    return nodes.slice(0, 54).map(function (nd, i) {
      const ang = (i / Math.max(n, 1)) * 2 * Math.PI - Math.PI / 2;
      const rr = r - (i % 3) * 9;
      const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
      const ruled = nd.evidence === 'disproven' || nd.evidence === 'eliminated';
      return <circle key={nd.id} cx={x} cy={y} r={ruled ? 4 : 3} fill={ruled ? '#6b1d1d' : color} stroke={ruled ? '#6b1d1d' : 'none'} opacity={evOpacity(nd.evidence)}><title>{nd.text}{ruled ? '  (must not be claimed)' : ''}</title></circle>;
    });
  }
  // beyond-horizon frontier dots
  const frontier = (sub.blocked || []).slice(0, 70).map(function (b, i) {
    const node = MEM.byId[b.id]; if (!node) return null;
    const ang = (i / 70) * 2 * Math.PI; const rr = 188 + (i % 2) * 7;
    return <circle key={'f' + i} cx={cx + Math.cos(ang) * rr} cy={cy + Math.sin(ang) * rr} r={1.6} fill="#7a6e62" opacity={0.35}><title>beyond the horizon: {node.text}</title></circle>;
  });
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <svg width={390} height={390} style={{ flexShrink: 0 }}>
        {rings.map(function (r) { return <circle key={r.key} cx={cx} cy={cy} r={r.r} fill="none" stroke={r.color} strokeOpacity={0.25} strokeWidth={1} />; })}
        <circle cx={cx} cy={cy} r={196} fill="none" stroke="#7a6e62" strokeOpacity={0.3} strokeDasharray="2 5" />
        {frontier}
        {dotsFor(sub.family, 168, '#9a7b2d')}
        {dotsFor(sub.generational, 112, '#2d5a4a')}
        {dotsFor(sub.individual, 58, '#8b4513')}
        <circle cx={cx} cy={cy} r={26} fill="var(--cream)" stroke="var(--gold)" />
        <text x={cx} y={cy - 2} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, fill: 'var(--ink)' }}>{nm(personId)}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fill: 'var(--faded)' }}>Gen {DATA.people[personId].generation}</text>
      </svg>
      <div style={{ minWidth: 200, flex: 1 }}>
        {rings.map(function (r) {
          return (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: r.color }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{TIER[r.key].name}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>{sub[r.key].length}</span>
            </div>
          );
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#7a6e62', opacity: 0.4 }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)' }}>the unwritten frontier · {sub.stats.blockedFuture + sub.stats.blockedGen}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--faded)', lineHeight: 1.55, marginTop: 8 }}>
          Hover a node to read it. The dim outer band is everything {nm(personId)} cannot know — a later generation, or a year past {sub.horizonYear}.
        </p>
      </div>
    </div>
  );
}

/* ---------------- the map ---------------- */
function HomesteadMap({ stageId, onSelect }) {
  const ref = useRef(null), mapRef = useRef(null), markers = useRef({});
  useEffect(function () {
    if (mapRef.current || !window.L || !ref.current) return;
    const map = window.L.map(ref.current, { scrollWheelZoom: false, zoomControl: true });
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 18 }).addTo(map);
    window.L.polyline(MIGRATION.map(function (id) { return PLACE[id].coords; }), { color: '#9a7b2d', weight: 2, opacity: 0.55, dashArray: '4 6' }).addTo(map);
    window.L.circleMarker(PLACE['digswell'].coords, { radius: 7, color: '#7a6e62', weight: 1, fillColor: '#7a6e62', fillOpacity: 0.15, dashArray: '2 3' })
      .addTo(map).bindPopup('<b>Misty Origins</b><br/>The English roots remain <b>unproven</b> — a research frontier, not a confirmed home.');
    STAGES.forEach(function (st) {
      const m = window.L.circleMarker(PLACE[st.placeId].coords, { radius: 9, color: '#2c1810', weight: 1.5, fillColor: eraHex(st.era), fillOpacity: 0.9 })
        .addTo(map).bindTooltip(st.label + ' — ' + st.blurb);
      m.on('click', function () { onSelect(st.id); });
      markers.current[st.id] = m;
    });
    map.fitBounds(window.L.latLngBounds(MIGRATION.map(function (id) { return PLACE[id].coords; })).pad(0.12));
    mapRef.current = map;
  }, []);
  useEffect(function () {
    Object.keys(markers.current).forEach(function (id) {
      markers.current[id].setStyle({ radius: id === stageId ? 13 : 9, weight: id === stageId ? 3 : 1.5, color: id === stageId ? '#d4a825' : '#2c1810' });
    });
    const st = STAGES.find(function (s) { return s.id === stageId; });
    if (st && mapRef.current) mapRef.current.panTo(PLACE[st.placeId].coords, { animate: true });
  }, [stageId]);
  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 250 }} />;
}

/* ---------------- live feed ---------------- */
function snapLines(snap, salt) {
  const out = [], tl = snap.env.timeOfDay.label;
  if (snap.encounter) snap.encounter.lines.slice(0, 2).forEach(function (l) { out.push({ t: tl, who: nm(l.speaker), text: '“' + l.text + '”', kind: 'talk' }); });
  if (snap.agents.length) {
    const a = snap.agents[salt % snap.agents.length];
    out.push({ t: tl, who: nm(a.id), text: a.activity + '.', kind: a.kind });
  }
  if (snap.reflections[0]) { const r = snap.reflections[0]; out.push({ t: tl, who: nm(r.id), text: '(reflects) “' + r.text + '”', kind: 'reflect' }); }
  return out;
}
function LiveFeed({ feed }) {
  const kc = { talk: 'var(--deep-blue)', reflect: 'var(--rust)', comic: 'var(--gold)', sabbath: 'var(--sea-green)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {feed.length === 0 && <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)' }}>Press ▶ live or Advance to watch the homestead.</div>}
      {feed.map(function (e, i) {
        return (
          <div key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45, opacity: Math.max(0.35, 1 - i * 0.03) }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, color: 'var(--faded)', marginRight: 6 }}>{e.t}</span>
            <strong style={{ color: kc[e.kind] || 'var(--ink)' }}>{e.who}</strong> {e.text}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- People Explorer ---------------- */
function PeopleExplorer({ onSelect }) {
  const [q, setQ] = useState('');
  const [groupBy, setGroupBy] = useState('generation');
  const [eraF, setEraF] = useState('all');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyStory, setOnlyStory] = useState(false);

  const result = useMemo(function () {
    let list = PERS.list.slice();
    if (eraF !== 'all') list = list.filter(function (s) { return s.era === eraF; });
    if (onlyOpen) list = list.filter(function (s) { return OPENQ[s.id]; });
    if (onlyStory) list = list.filter(function (s) { return s.provenance.reconstructed; });
    if (q.trim()) { const x = q.toLowerCase(); list = list.filter(function (s) { return s.name.toLowerCase().indexOf(x) !== -1 || (s.occupation || '').toLowerCase().indexOf(x) !== -1 || s.archetype.indexOf(x) !== -1; }); }
    const keyFns = { generation: function (s) { return 'Generation ' + s.generation; }, era: function (s) { return ERA[s.era] ? ERA[s.era].label.split(' (')[0] : 'Unknown'; }, archetype: function (s) { return cap(s.archetype.replace('-', ' ')); }, evidence: function (s) { return cap(s.provenance.confidence); } };
    const kf = keyFns[groupBy];
    list.sort(function (a, b) { return (a.generation - b.generation) || a.name.localeCompare(b.name); });
    const groups = {}; list.forEach(function (s) { (groups[kf(s)] = groups[kf(s)] || []).push(s); });
    return { total: list.length, groups: groups, order: Object.keys(groups) };
  }, [q, groupBy, eraF, onlyOpen, onlyStory]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder="search the whole line…" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: 'var(--cream)', fontSize: 12, width: 180 }} />
        <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>group&nbsp;
          <select value={groupBy} onChange={function (e) { setGroupBy(e.target.value); }} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: 'var(--cream)', fontSize: 12 }}>
            <option value="generation">generation</option><option value="era">era</option><option value="archetype">role</option><option value="evidence">evidence</option>
          </select>
        </label>
        <button onClick={function () { setOnlyStory(function (v) { return !v; }); }} style={ctlBtn(onlyStory)}>story in progress</button>
        <button onClick={function () { setOnlyOpen(function (v) { return !v; }); }} style={ctlBtn(onlyOpen)}>open questions</button>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>{result.total} people</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <EraPill era={{ label: 'All eras', color: 'var(--deep-blue)' }} active={eraF === 'all'} onClick={function () { setEraF('all'); }} />
        {DATA.eras.map(function (e) { return <EraPill key={e.id} era={e} active={eraF === e.id} onClick={function () { setEraF(e.id); }} />; })}
      </div>
      {result.order.map(function (g) {
        return (
          <div key={g} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>{g} <span style={{ color: 'var(--faded)' }}>· {result.groups[g].length}</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.groups[g].map(function (s) {
                return (
                  <div key={s.id} style={{ position: 'relative' }}>
                    <PersonNode person={DATA.people[s.id]} size="sm" onClick={function () { onSelect(s.id); }} />
                    {s.provenance.reconstructed && <span title="Story in progress" style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', border: '1px solid var(--cream)' }} />}
                    {OPENQ[s.id] && <span title={OPENQ[s.id] + ' open question(s)'} style={{ position: 'absolute', bottom: 5, right: 6, fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--rust)' }}>?{OPENQ[s.id]}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Root
   ============================================================ */
function LivingWorld() {
  const [stageId, setStageId] = useState('fl');
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('homestead');
  const [live, setLive] = useState(false);
  const [threeD, setThreeD] = useState(false);
  const [sceneErr, setSceneErr] = useState(null);
  const [feed, setFeed] = useState([]);
  const [, force] = useState(0);
  const rerender = function () { force(function (n) { return n + 1; }); };
  const worldRef = useRef(null);
  const tickRef = useRef(0);
  const keepSel = useRef(false);
  const sceneHost = useRef(null);
  const sceneCtrl = useRef(null);

  const stage = STAGES.find(function (s) { return s.id === stageId; });
  const cohort = useMemo(function () { return cohortFor(stage); }, [stageId]);

  // (re)build the homestead world when the stage changes
  useEffect(function () {
    const w = ENG.createWorld({ year: stage.year, era: stage.era, placeId: stage.placeId, seed: stage.id, simDate: new Date(stage.year, 3, 14), realClock: new Date(), roster: cohort });
    worldRef.current = w;
    const snap = w.snapshot();
    setFeed(snapLines(snap, 0));
    if (keepSel.current) keepSel.current = false; // arrived via the Explorer — keep their pick
    else setSelectedId(function (cur) { return (cur && cohort.indexOf(cur) !== -1) ? cur : cohort[0] || null; });
    rerender();
  }, [stageId]);

  // live clock — day/night tracks the real wall clock; homestead chatter rolls
  useEffect(function () {
    if (!live) return;
    const t = setInterval(function () {
      const w = worldRef.current; if (!w) return;
      w.setRealClock(new Date());
      tickRef.current++;
      const snap = w.snapshot();
      setFeed(function (f) { return snapLines(snap, tickRef.current).concat(f).slice(0, 26); });
      rerender();
    }, 3500);
    return function () { clearInterval(t); };
  }, [live, stageId]);

  const world = worldRef.current;
  if (world) world.setRealClock(new Date());
  const snap = world ? world.snapshot() : null;

  // 3-D world — opt-in, lazy-loaded, WebGL-feature-detected (off by default, so CI never spins up GL)
  useEffect(function () {
    if (!threeD) return;
    if (!window.CASON_SCENE || !window.CASON_SCENE.isSupported()) {
      setSceneErr('WebGL isn’t available here, so the 3-D homestead can’t render — the rest of the Living Line still works.');
      return;
    }
    const host = sceneHost.current; if (!host) return;
    let alive = true; setSceneErr(null);
    window.CASON_SCENE.mount(host, {
      stage: stage,
      snapshot: worldRef.current ? worldRef.current.snapshot() : null,
      onSelect: function (id) { setSelectedId(id); },
    }).then(function (ctrl) { if (!alive) { ctrl.dispose(); return; } sceneCtrl.current = ctrl; })
      .catch(function (e) { if (alive) setSceneErr('Could not load the 3-D world (' + (e && e.message) + ').'); });
    return function () { alive = false; if (sceneCtrl.current) { sceneCtrl.current.dispose(); sceneCtrl.current = null; } };
  }, [threeD, stageId]);

  useEffect(function () { if (threeD && sceneCtrl.current && snap) sceneCtrl.current.update(snap); });

  const sel = selectedId || cohort[0] || null;
  const selPresent = !!(sel && cohort.indexOf(sel) !== -1);
  const selSimNow = selPresent ? stage.year : undefined; // present ⇒ live moment; browsing ⇒ full-life horizon
  const sheet = sel ? PERS.byId[sel] : null;
  const person = sel ? DATA.people[sel] : null;

  function advance() {
    const w = worldRef.current; if (!w) return;
    w.dayStride = 7; const snap = w.step(); tickRef.current++;
    setFeed(function (f) { return snapLines(snap, tickRef.current).concat(f).slice(0, 26); });
    rerender();
  }
  function selectPerson(id) {
    const p = DATA.people[id];
    const st = STAGES.find(function (s) { return ERA[s.era].generations.indexOf(p.generation) !== -1; });
    keepSel.current = true;
    setSelectedId(id); setView('homestead');
    if (st && st.id !== stageId) setStageId(st.id); else keepSel.current = false;
  }

  return (
    <div style={{ ...window.parchmentBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        subtitle="The Living Line"
        right={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[['homestead', 'Homestead'], ['people', 'People'], ['hearth', 'Memory Hearth']].map(function (v) {
              return <button key={v[0]} onClick={function () { setView(v[0]); }} style={tabBtn(view === v[0])}>{v[1]}</button>;
            })}
            <a href="/dashboard" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--gold-bright)', textDecoration: 'none', marginLeft: 4 }}>↗ tree</a>
          </div>
        }
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* navigator column */}
        <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid rgba(139,69,19,0.12)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ height: 250, flexShrink: 0, borderBottom: '1px solid rgba(139,69,19,0.12)' }}>
            <HomesteadMap stageId={stageId} onSelect={setStageId} />
          </div>
          {/* env + controls */}
          {snap && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(139,69,19,0.12)', background: snap.env.timeOfDay.isNight ? 'rgba(26,39,68,0.10)' : 'rgba(212,168,37,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{stage.label}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--faded)' }}>
                    {({ fair: '☀️', rain: '🌧️', storm: '⛈️', cold: '❄️', hot: '🔥' }[snap.env.weather.kind] || '·')} {snap.env.date.label} · {cap(snap.env.weather.label)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--faded)' }}>{snap.env.timeOfDay.isNight ? '🌙' : '🌞'} {snap.env.timeOfDay.label}{snap.env.isSunday ? ' · the Sabbath' : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button onClick={function () { setLive(function (v) { return !v; }); }} style={ctlBtn(live)}>{live ? '⏸ live' : '▶ live'}</button>
                  <button onClick={advance} style={ctlBtn(false)}>week ›</button>
                </div>
              </div>
            </div>
          )}
          {/* live feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 30px' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 8 }}>Watch them live</div>
            <LiveFeed feed={feed} />
          </div>
        </div>

        {/* main pane */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {view === 'people' && (
            <div style={{ padding: '20px 24px 60px' }}><PeopleExplorer onSelect={selectPerson} /></div>
          )}

          {view === 'hearth' && sel && (
            <div style={{ padding: '20px 24px 60px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', marginBottom: 4 }}>{person.name} — Memory Hearth</h2>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)', marginBottom: 16 }}>Three tiers of knowledge, ringed around the self; the future faint beyond the horizon.</p>
              <MemoryHearth personId={sel} />
              <div style={{ marginTop: 22, maxWidth: 560 }}><MemoryTiers personId={sel} simNow={selSimNow} /></div>
            </div>
          )}

          {view === 'homestead' && (
            <div>
              {threeD && (
                <div style={{ padding: '14px 22px 0' }}>
                  <div ref={sceneHost} style={{ width: '100%', height: 440, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(139,69,19,0.2)', background: '#dfe6ee', position: 'relative' }}>
                    {sceneErr && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--faded)' }}>{sceneErr}</div>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)', marginTop: 6 }}>Drag to look · scroll to zoom · click a figure to select them. The sky follows the real clock; weather rolls in as the day turns.</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 22, padding: '18px 22px 60px', minWidth: 0 }}>
                {/* cohort + detail */}
              <div style={{ flex: '1 1 0', minWidth: 280, maxWidth: 470 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)' }}>At this homestead · {cohort.length} living</div>
                  <button onClick={function () { setThreeD(function (v) { return !v; }); }} style={ctlBtn(threeD)}>{threeD ? 'Exit 3-D' : 'Enter 3-D ▸'}</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                  {cohort.map(function (id) { return <PersonNode key={id} person={DATA.people[id]} size="sm" selected={id === sel} onClick={function () { setSelectedId(id); }} />; })}
                </div>
                {sheet && person ? (
                  <React.Fragment>
                    <PersonaSheet sheet={sheet} person={person} />
                    {snap && <div style={{ marginTop: 16, borderTop: '1px solid rgba(139,69,19,0.15)', paddingTop: 14 }}><CurrentMoment snap={snap} personId={sel} /></div>}
                  </React.Fragment>
                ) : <div style={{ color: 'var(--faded)', fontStyle: 'italic' }}>No one is recorded living here in {stage.year} yet.</div>}
              </div>
              {/* memory + trace */}
              {sheet && person && (
                <div style={{ flex: '1 1 0', minWidth: 300 }}>
                  {snap && selPresent && <div style={{ marginBottom: 16 }}><TracePanel snap={snap} personId={sel} /></div>}
                  <MemoryTiers personId={sel} simNow={selSimNow} />
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.LivingWorld = LivingWorld;
