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
  { id: 'ga', placeId: 'glynn', era: 'pioneer', year: 1810, label: 'Glynn County, Georgia', blurb: 'The Georgia years · seven of nine would move on' },
  { id: 'fl', placeId: 'newnansville', era: 'pioneer', year: 1845, label: 'Newnansville, Alachua Co., Florida', blurb: 'Florida pioneer homestead · 1840s' },
  { id: 'war', placeId: 'cason-cem', era: 'civil', year: 1864, label: 'Alachua County at War', blurb: 'The county at war · 1860s' },
  { id: 'fw', placeId: 'fort-white', era: 'modern', year: 1910, label: 'Fort White, Columbia Co., Florida', blurb: 'Turpentine & timber · 1900s' },
  { id: 'sc', placeId: 'titusville', era: 'modern', year: 1957, label: 'Titusville · the Space Coast', blurb: 'Rockets on the horizon · 1957' },
];
const MIGRATION = ['digswell', 'jamestown', 'lynnhaven', 'princess', 'beaufort', 'glynn', 'newnansville', 'cason-cem', 'fort-white', 'titusville'];

function eraHex(era) {
  return { colonial: '#d4a825', frontier: '#2d5a4a', pioneer: '#8b4513', civil: '#6b1d1d', modern: '#9a7b2d' }[era] || '#9a7b2d';
}
// A few homesteads carry an explicit household beyond the strict alive-in-year
// filter — e.g. the Space Coast shows Robert Sr., Mary Nell and their children.
const STAGE_EXTRA = { sc: ['robert-sr', 'mary-nell', 'robert-jr', 'richard', 'carol', 'suzy', 'paul-r'] };
function cohortFor(stage) {
  const gens = ERA[stage.era].generations;
  const base = ENG.activeAt(DATA, stage.year).filter(function (id) { return gens.indexOf(DATA.people[id].generation) !== -1; });
  const extra = (STAGE_EXTRA[stage.id] || []).filter(function (id) { return DATA.people[id]; });
  const seen = {}, out = [];
  base.concat(extra).forEach(function (id) { if (!seen[id]) { seen[id] = 1; out.push(id); } });
  return out.sort();
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
function isContributed(n) { return !!(n.tags && n.tags.indexOf('contributed') !== -1); }
function contribLabel(n) { return (n.tags && n.tags.indexOf('ai-consensus') !== -1) ? 'AI-consensus' : 'contributed'; }
function tabBtn(active) {
  return { fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 12px', borderRadius: 5, cursor: 'pointer', border: '1px solid ' + (active ? 'transparent' : 'rgba(196,154,60,0.4)'), background: active ? 'var(--gold-bright)' : 'transparent', color: active ? 'var(--deep-blue)' : 'rgba(244,237,228,0.85)' };
}
function ctlBtn(active) {
  return { fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', padding: '4px 9px', borderRadius: 5, cursor: 'pointer', border: '1px solid ' + (active ? 'var(--gold)' : 'rgba(139,69,19,0.25)'), background: active ? 'var(--gold-bright)' : 'var(--cream)', color: active ? 'var(--deep-blue)' : 'var(--faded)' };
}
const roleInput = { padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: '#fff', fontSize: 12.5, minWidth: 180 };

/* narrator vs vetted-member controls (Supabase magic-link when configured; local preview otherwise) */
function RoleControls({ role, field, setField, msg, onSignIn, onPreview, onSignOut }) {
  const enabled = window.CASON_AUTH && window.CASON_AUTH.enabled;
  if (role && role.mode === 'member') {
    return (
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)' }}>
        <strong style={{ color: 'var(--sea-green)' }}>✦ {role.name}</strong> — you’re embodied as a family member{role.preview ? ' (preview — not verified)' : role.verified ? ' (verified)' : ''}. Open the 3-D homestead and click the ground to walk your avatar; your saved findings are attributed to you.
        <button onClick={onSignOut} style={{ ...ctlBtn(false), marginLeft: 8 }}>{role.preview ? 'leave preview' : 'sign out'}</button>
      </div>
    );
  }
  return (
    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)' }}>
      <div style={{ marginBottom: 6 }}>You’re exploring as a <strong>narrator</strong> — watch the line, ask the ancestors, research. Verified family can embody an avatar and leave attributed history.</div>
      {enabled ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={field} onChange={function (e) { setField(e.target.value); }} placeholder="family email" style={roleInput} />
          <button onClick={onSignIn} style={ctlBtn(true)}>Send sign-in link</button>
          {role && role.signedIn && !role.verified && <span style={{ color: 'var(--rust)', fontSize: 12 }}>Signed in, but not on the family list yet.</span>}
          {msg && <span style={{ color: 'var(--faded)', fontSize: 12 }}>{msg}</span>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={field} onChange={function (e) { setField(e.target.value); }} placeholder="your name" style={roleInput} />
          <button onClick={onPreview} style={ctlBtn(true)}>Enter as family (preview)</button>
          <span style={{ color: 'var(--faded)', fontSize: 11.5 }}>Preview only — real verification needs Supabase sign-in (not yet connected).</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- persona role sheet ---------------- */
function PersonaSheet({ sheet, person, onAskAbility }) {
  const levityPct = Math.round(sheet.levity * 100);
  const abilityBtn = { fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--sea-green)', background: 'rgba(45,90,74,0.08)', border: '1px solid rgba(45,90,74,0.35)', padding: '3px 9px', borderRadius: 999, cursor: onAskAbility ? 'pointer' : 'default', whiteSpace: 'nowrap' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink)', fontWeight: 700 }}>{person.name}</h2>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)' }}>{person.lifespan || 'dates unknown'}</span>
      </div>
      {sheet.epithet && (
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13.5, color: 'var(--rust)', marginTop: 4, lineHeight: 1.4 }}>
          {sheet.hero ? '★ ' : ''}“{sheet.epithet}” — {sheet.essence}.
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <EvidenceBadge evidence={person.evidence || 'possible'} />
        {sheet.provenance.reconstructed && <StoryInProgress />}
        <Chip>Gen {sheet.generation}</Chip>
        {sheet.era && <Chip>{ERA[sheet.era] ? ERA[sheet.era].label.split(' (')[0] : sheet.era}</Chip>}
        <Chip tone="var(--rust)">{sheet.occupation}</Chip>
      </div>
      {sheet.provenance.note && (
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)', marginTop: 10, borderLeft: '3px solid var(--gold)', paddingLeft: 10 }}>{sheet.provenance.note}</p>
      )}
      {sheet.drive && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13.5, color: 'var(--ink)', marginTop: 10 }}><strong style={{ color: 'var(--deep-blue)' }}>Driven by:</strong> {sheet.drive}</p>
      )}
      <Label>Personality</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sheet.personality.map((t, i) => <Chip key={i}>{t}</Chip>)}</div>
      <Label>{onAskAbility ? 'Signature abilities — tap to ask' : 'Abilities'}</Label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sheet.abilities.map(function (t, i) {
          return onAskAbility
            ? <button key={i} onClick={function () { onAskAbility(t); }} style={abilityBtn} title={'Ask ' + person.name.split(' ')[0] + ' about this'}>{t}</button>
            : <Chip key={i} tone="var(--sea-green)">{t}</Chip>;
        })}
      </div>
      <Label>Their wisdom</Label>
      {sheet.wisdom.map((w, i) => <p key={i} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--rust)', lineHeight: 1.5, marginBottom: 6 }}>“{w}”</p>)}
      <Label>Voice</Label>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)' }}>{sheet.voice.register}</p>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--faded)', marginTop: 4, fontStyle: 'italic' }}>Voice &amp; bearing reconstructed from the record; names, dates &amp; events stay sourced.</div>
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
              {isContributed(n) && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: 3, padding: '0 4px', marginLeft: 6, whiteSpace: 'nowrap' }}>{contribLabel(n)}</span>}
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

/* ---------------- Speak with a persona + multi-model research ---------------- */
function Bubble({ m }) {
  const mine = m.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
      <div style={{
        maxWidth: '85%', fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.5,
        background: mine ? 'var(--deep-blue)' : 'var(--cream)', color: mine ? 'var(--cream)' : 'var(--ink)',
        border: mine ? 'none' : '1px solid rgba(139,69,19,0.15)', borderRadius: 9, padding: '7px 11px',
      }}>
        {m.text}
        {m.mode && !mine && (
          <span style={{ display: 'block', marginTop: 3, fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: m.mode === 'live' ? 'var(--sea-green)' : m.mode === 'error' ? 'var(--blood)' : 'var(--faded)' }}>
            {m.mode === 'live' ? '✦ live Claude' : m.mode === 'error' ? 'offline' : 'templated'}{m.note ? ' · ' + m.note : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function ConsensusView({ data }) {
  const c = data.consensus || {};
  const tone = { high: 'var(--sea-green)', medium: 'var(--gold)', low: 'var(--blood)' }[c.confidence] || 'var(--faded)';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {(data.providers || []).map(function (s, i) {
          return (
            <div key={i} style={{ flex: '1 1 150px', minWidth: 140, background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.15)', borderRadius: 7, padding: '7px 9px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.ok ? 'var(--deep-blue)' : 'var(--blood)', marginBottom: 3 }}>{s.provider}{s.ok ? '' : ' · failed'}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 11.5, lineHeight: 1.45, color: s.ok ? 'var(--ink)' : 'var(--faded)' }}>{s.ok ? s.answer : s.error}</div>
            </div>
          );
        })}
      </div>
      <div style={{ border: '1px solid ' + tone, borderRadius: 8, padding: '9px 11px', background: 'rgba(255,255,255,0.5)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)' }}>Consensus</span>
          <Chip tone={tone}>{c.agreement || '—'}</Chip>
          <Chip tone={tone}>confidence {c.confidence || '—'}</Chip>
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--ink)' }}>{c.answer}</p>
        {c.corroborated && <p style={{ fontFamily: 'var(--font-serif)', fontSize: 11.5, color: 'var(--sea-green)', marginTop: 5 }}><strong>Corroborated:</strong> {c.corroborated}</p>}
        {c.disputed && <p style={{ fontFamily: 'var(--font-serif)', fontSize: 11.5, color: 'var(--rust)', marginTop: 3 }}><strong>Disputed:</strong> {c.disputed}</p>}
        {c.unverified && <p style={{ fontFamily: 'var(--font-serif)', fontSize: 11.5, color: 'var(--blood)', marginTop: 3 }}><strong>Unverified (single source):</strong> {c.unverified}</p>}
        {c.note && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)', marginTop: 4 }}>{c.note}</p>}
      </div>
    </div>
  );
}

function PersonaDossier({ personId, sheet, person, snap, onSaved, pending, onPendingConsumed, member, focusSignal }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('templated');
  const [busy, setBusy] = useState(false);
  const [showR, setShowR] = useState(false);
  const [rq, setRq] = useState('');
  const [rdata, setRdata] = useState(null);
  const [rbusy, setRbusy] = useState(false);
  const [rerr, setRerr] = useState(null);
  const [saved, setSaved] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(function () { setMsgs([]); setRdata(null); setRerr(null); setSaved(false); setRq(''); }, [personId]);

  useEffect(function () {
    if (focusSignal && chatRef.current) { try { chatRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} if (inputRef.current) inputRef.current.focus(); }
  }, [focusSignal]);

  useEffect(function () {
    if (pending) { setShowR(true); setRq(pending); research(pending); if (onPendingConsumed) onPendingConsumed(); }
  }, [pending]);

  function send(text) {
    const t = (text != null ? text : input).trim();
    if (!t || busy) return;
    setInput('');
    const history = msgs.map(function (m) { return { role: m.role, content: m.text }; });
    setMsgs(function (m) { return m.concat([{ role: 'user', text: t }]); });
    setBusy(true);
    window.CASON_AI.personaRespond({ personId: personId, userMessage: t, history: history, mode: mode })
      .then(function (out) { setMsgs(function (m) { return m.concat([{ role: 'persona', text: out.text, mode: out.mode }]); }); })
      .catch(function (e) {
        const off = window.CASON_AI.templated(personId, t);
        setMsgs(function (m) { return m.concat([{ role: 'persona', text: off.text, mode: 'error', note: 'live unavailable' }]); });
      })
      .then(function () { setBusy(false); });
  }

  function research(qArg) {
    const q = (qArg != null ? qArg : rq).trim(); if (!q || rbusy) return;
    setRbusy(true); setRerr(null); setRdata(null); setSaved(false);
    window.CASON_AI.researchConsensus(q)
      .then(function (r) { setRdata(r); })
      .catch(function (e) { setRerr(String(e && e.message || e)); })
      .then(function () { setRbusy(false); });
  }

  // push the current question to all three models, inline in the conversation
  function pushToAll(text) {
    const t = (text != null ? text : input).trim(); if (!t || busy) return;
    setInput('');
    setMsgs(function (m) { return m.concat([{ role: 'user', text: t }]); });
    setBusy(true);
    const ctx = nm(personId) + (person && person.lifespan ? ' (' + person.lifespan + ')' : '') + (person && person.born && person.born.place ? ', ' + person.born.place : '');
    window.CASON_AI.researchConsensus(t, ctx)
      .then(function (r) { setMsgs(function (m) { return m.concat([{ role: 'consensus', data: r }]); }); })
      .catch(function (e) { setMsgs(function (m) { return m.concat([{ role: 'persona', text: 'The three-model cross-check could not run (' + (e && e.message || e) + ').', mode: 'error' }]); }); })
      .then(function () { setBusy(false); });
  }

  function saveConsensus(data) {
    if (!data || !data.consensus) return;
    const c = data.consensus;
    const ev = c.confidence === 'high' ? 'secondary' : c.confidence === 'medium' ? 'possible' : 'unlikely';
    const rec = { personId: personId, question: data.question, text: c.answer, corroborated: c.corroborated, evidence: ev, source: 'AI consensus (Grok · Gemini · Claude)' + (member ? ' · saved by ' + member : ''), when: Date.now() };
    try { const k = 'cason-memory-' + personId; const arr = JSON.parse(localStorage.getItem(k) || '[]'); arr.push(rec); localStorage.setItem(k, JSON.stringify(arr)); } catch (e) {}
    if (window.CASON_MEMORY && window.CASON_MEMORY.addUserMemory) window.CASON_MEMORY.addUserMemory(rec);
    if (member && window.CASON_AUTH && window.CASON_AUTH.addContribution) window.CASON_AUTH.addContribution(rec);
    if (onSaved) onSaved();
  }

  // route a corroborated finding to the in-app review queue (a keeper approves it under Governance)
  function proposeConsensus(data) {
    if (!data || !data.consensus || !(window.CASON_AUTH && window.CASON_AUTH.submitProposal)) return;
    const c = data.consensus;
    const ev = c.confidence === 'high' ? 'leading' : 'possible'; // model consensus caps at 'leading'
    window.CASON_AUTH.submitProposal({ personId: personId, summary: c.answer, evidence: ev, source: 'AI consensus (Grok · Gemini · Claude)', justification: data.question, origin: 'consensus' })
      .then(function () { setMsgs(function (m) { return m.concat([{ role: 'persona', text: 'Proposed to the review queue — a keeper can approve it under Governance → Review queue.', mode: 'note' }]); }); })
      .catch(function (e) { setMsgs(function (m) { return m.concat([{ role: 'persona', text: 'Could not propose: ' + (e && e.message || e), mode: 'error' }]); }); });
  }

  function saveFinding() {
    if (!rdata || !rdata.consensus) return;
    const c = rdata.consensus;
    const ev = c.confidence === 'high' ? 'secondary' : c.confidence === 'medium' ? 'possible' : 'unlikely';
    const rec = { personId: personId, question: rdata.question, text: c.answer, corroborated: c.corroborated, evidence: ev, source: 'AI consensus (Grok · Gemini · Claude)' + (member ? ' · saved by ' + member : ''), when: Date.now() };
    try {
      const k = 'cason-memory-' + personId;
      const arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr.push(rec);
      localStorage.setItem(k, JSON.stringify(arr));
    } catch (e) {}
    if (window.CASON_MEMORY && window.CASON_MEMORY.addUserMemory) window.CASON_MEMORY.addUserMemory(rec); // live into the graph
    if (member && window.CASON_AUTH && window.CASON_AUTH.addContribution) window.CASON_AUTH.addContribution(rec); // shared + attributed (Supabase)
    setSaved(true);
    if (onSaved) onSaved();
  }

  const QUICK = [['Tell me about your life', 'Tell me about your life.'], ['Reflect', 'Reflect on your life.'], ['What are you missing?', 'What do you wish you knew?']];

  return (
    <div>
      {sheet && person && <PersonaSheet sheet={sheet} person={person} onAskAbility={function (a) { send('I should like to learn — tell me of your skill in ' + a + '.'); }} />}
      {snap && person && <div style={{ marginTop: 14, borderTop: '1px solid rgba(139,69,19,0.15)', paddingTop: 12 }}><CurrentMoment snap={snap} personId={personId} /></div>}
      <div ref={chatRef} style={{ marginTop: 16, borderTop: '1px solid rgba(139,69,19,0.15)', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)' }}>Speak with {nm(personId)}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={function () { setMode('templated'); }} style={ctlBtn(mode === 'templated')}>Templated</button>
          <button onClick={function () { setMode('live'); }} style={ctlBtn(mode === 'live')}>Live Claude</button>
        </div>
      </div>

      {msgs.length > 0 && (
        <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 8, padding: '2px 2px 2px 0' }}>
          {msgs.map(function (m, i) {
            if (m.role === 'consensus') {
              return (
                <div key={i} style={{ margin: '8px 0', padding: '8px 10px', background: 'rgba(44,74,107,0.06)', border: '1px solid rgba(44,74,107,0.18)', borderRadius: 8 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--deep-blue)', marginBottom: 4 }}>⚖ Cross-check · Grok · Gemini · Claude</div>
                  <ConsensusView data={m.data} />
                  {m.data.consensus && m.data.consensus.confidence !== 'low' && <button onClick={function () { saveConsensus(m.data); }} style={{ ...ctlBtn(false), marginTop: 6 }}>Save corroborated finding to {nm(personId).split(' ')[0]}</button>}
                  {m.data.consensus && m.data.consensus.confidence !== 'low' && member && <button onClick={function () { proposeConsensus(m.data); }} title="Send this to the in-app review queue for a keeper to approve under the policy gate" style={{ ...ctlBtn(false), marginTop: 6, marginLeft: 6 }}>Propose for review</button>}
                </div>
              );
            }
            return <Bubble key={i} m={m} />;
          })}
          {busy && <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faded)' }}>…thinking</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 7 }}>
        {QUICK.map(function (qa, i) { return <button key={i} onClick={function () { send(qa[1]); }} style={ctlBtn(false)}>{qa[0]}</button>; })}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input ref={inputRef} value={input} onChange={function (e) { setInput(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') send(); }}
          placeholder={'Ask ' + nm(personId) + '…'} style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: 'var(--cream)', fontSize: 12.5 }} />
        <button onClick={function () { send(); }} disabled={busy} style={{ ...ctlBtn(true), opacity: busy ? 0.5 : 1 }}>Send</button>
        {member && <button onClick={function () { pushToAll(); }} disabled={busy} title="Push this question to all three models — Grok, Gemini & Claude — and bring the cross-checked answer into the conversation" style={{ ...ctlBtn(false), opacity: busy ? 0.5 : 1, whiteSpace: 'nowrap' }}>⚖ All 3</button>}
      </div>
      {member && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--faded)', marginTop: 4 }}>Send speaks with {nm(personId).split(' ')[0]} in their own voice (bounded to what they could know). <strong>⚖ All 3</strong> pushes the question to Grok, Gemini &amp; Claude and brings the cross-checked answer into the conversation.</div>}
      {mode === 'live' && !member && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--faded)', marginTop: 4 }}>Live mode needs a server key; it falls back to the offline voice if unavailable.</div>}

      {/* multi-model research */}
      <div style={{ marginTop: 12 }}>
        <button onClick={function () { setShowR(function (v) { return !v; }); }} style={{ ...ctlBtn(showR), width: '100%' }}>
          {showR ? '▾' : '▸'} Research a question — cross-check Grok · Gemini · Claude
        </button>
        {showR && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={rq} onChange={function (e) { setRq(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') research(); }}
                placeholder="e.g. Where in England did Thomas Casson originate?" style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.25)', background: 'var(--cream)', fontSize: 12.5 }} />
              <button onClick={function () { research(); }} disabled={rbusy} style={{ ...ctlBtn(true), opacity: rbusy ? 0.5 : 1 }}>{rbusy ? '…' : 'Cross-check'}</button>
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--faded)', marginTop: 4 }}>
              Three independent models answer; an adjudicator corroborates only what ≥2 agree on, so one hallucination can’t become fact. Needs server keys.
            </div>
            {rerr && <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--blood)', marginTop: 6 }}>Could not research: {rerr}</div>}
            {rdata && <ConsensusView data={rdata} />}
            {rdata && rdata.consensus && rdata.consensus.confidence !== 'low' && (
              <button onClick={saveFinding} disabled={saved} style={{ ...ctlBtn(false), marginTop: 8 }}>
                {saved ? '✓ saved as a flagged finding' : 'Save corroborated finding to this persona'}
              </button>
            )}
          </div>
        )}
      </div>
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
      if (isContributed(nd)) return <circle key={nd.id} cx={x} cy={y} r={4.5} fill="#d4a825" stroke="#9a7b2d" strokeWidth={1.2}><title>{contribLabel(nd)}: {nd.text}</title></circle>;
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
      <svg viewBox="0 0 390 390" width={390} height={390} style={{ flexShrink: 0, maxWidth: '100%', height: 'auto' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#d4a825', border: '1px solid #9a7b2d' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--gold)' }}>contributed · AI-consensus &amp; oral history</span>
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
  const kc = { talk: 'var(--deep-blue)', reflect: 'var(--rust)', comic: 'var(--gold)', sabbath: 'var(--sea-green)', play: 'var(--gold-bright)', watch: 'var(--blood)', fireside: 'var(--rust)' };
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

/* ---------------- Population over time (known relatives living per year) ---------------- */
function PopulationGraph() {
  const d = useMemo(function () {
    const H = window.CASON_MEMORY_API.helpers;
    const now = new Date().getFullYear(), start = 1600, end = now;
    const spans = [];
    Object.keys(DATA.people).forEach(function (k) {
      const p = DATA.people[k]; const b = H.birthYearOf(p); if (b == null) return;
      let dd = H.deathYearOf(p); if (dd == null) dd = Math.min(now, b + 100); // still-living or unknown death
      spans.push([b, dd]);
    });
    const series = []; let peak = 0, peakYear = start;
    for (let y = start; y <= end; y++) {
      let c = 0;
      for (let i = 0; i < spans.length; i++) { if (spans[i][0] <= y && y <= spans[i][1]) c++; }
      series.push(c); if (c > peak) { peak = c; peakYear = y; }
    }
    return { series: series, start: start, end: end, peak: peak, peakYear: peakYear, current: series[series.length - 1] };
  }, []);

  const W = 720, Hh = 150, padB = 18, padT = 10, padL = 4, padR = 6;
  const n = d.series.length;
  const X = function (i) { return padL + (i / (n - 1)) * (W - padL - padR); };
  const Y = function (c) { return padT + (1 - c / Math.max(d.peak, 1)) * (Hh - padT - padB); };
  let area = 'M ' + X(0).toFixed(1) + ' ' + Y(0).toFixed(1);
  d.series.forEach(function (c, i) { area += ' L ' + X(i).toFixed(1) + ' ' + Y(c).toFixed(1); });
  area += ' L ' + X(n - 1).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z';
  let line = '';
  d.series.forEach(function (c, i) { line += (i ? ' L ' : 'M ') + X(i).toFixed(1) + ' ' + Y(c).toFixed(1); });
  const ticks = [1650, 1700, 1750, 1800, 1850, 1900, 1950, 2000];
  const events = [{ y: 1635, t: 'crossing' }, { y: 1723, t: 'NC' }, { y: 1823, t: 'Florida' }, { y: 1957, t: 'Space Coast' }];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Known relatives living, by year</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)', marginBottom: 6 }}>
        The recorded family across four centuries · peak {d.peak} living around {d.peakYear} · {d.current} on record through {d.end}. Documented records only — approximate where dates are thin.
      </div>
      <svg viewBox={'0 0 ' + W + ' ' + Hh} width="100%" style={{ maxWidth: W, height: 'auto', background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.15)', borderRadius: 8 }}>
        {ticks.map(function (t) { const i = t - d.start; if (i < 0 || i >= n) return null; return <g key={'t' + t}><line x1={X(i)} y1={padT} x2={X(i)} y2={Hh - padB} stroke="rgba(139,69,19,0.07)" /><text x={X(i)} y={Hh - 5} textAnchor="middle" style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fill: 'var(--faded)' }}>{t}</text></g>; })}
        <path d={area} fill="rgba(45,90,74,0.18)" />
        <path d={line} fill="none" stroke="var(--sea-green)" strokeWidth="1.5" />
        {events.map(function (e) { const i = e.y - d.start; if (i < 0 || i >= n) return null; return <g key={'e' + e.y}><line x1={X(i)} y1={padT} x2={X(i)} y2={Hh - padB} stroke="var(--rust)" strokeOpacity="0.45" strokeDasharray="2 2" /><text x={X(i)} y={padT + 7} textAnchor="middle" style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fill: 'var(--rust)' }}>{e.t}</text></g>; })}
      </svg>
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

/* ---------------- Open Lines — the worklist of unresolved threads ---------------- */
function OpenLines({ onSelect, onResearch }) {
  const rows = useMemo(function () {
    const list = (MEM.nodes || []).filter(function (n) { return n.kind === 'gap' && n.ownerId; });
    const byPerson = {};
    list.forEach(function (n) { (byPerson[n.ownerId] = byPerson[n.ownerId] || []).push(n); });
    const out = Object.keys(byPerson).map(function (pid) {
      const p = DATA.people[pid]; const per = PERS.byId[pid];
      const ev = p.evidence || 'possible';
      const evScore = { confirmed: 3, leading: 2.5, secondary: 2, possible: 1, unlikely: 0.7, unsolved: 0.5, eliminated: 0.4 }[ev] || 1;
      const hasSrc = (p.sources && p.sources.length) ? 1 : 0;
      const priority = (p.tags && (p.tags.indexOf('priority-1') !== -1 || p.tags.indexOf('leading') !== -1)) ? 5 : 0;
      return { pid: pid, name: p.name, gen: p.generation, era: per.era, ev: ev, gaps: byPerson[pid], score: priority + evScore + hasSrc, priority: priority };
    });
    out.sort(function (a, b) { return b.score - a.score || a.gen - b.gen; });
    return out;
  }, []);
  const total = rows.reduce(function (s, r) { return s + r.gaps.length; }, 0);
  function closeness(r) {
    if (r.priority) return ['load-bearing', 'var(--blood)'];
    if (r.score >= 4) return ['record nearby', 'var(--sea-green)'];
    if (r.score >= 2.5) return ['traceable', 'var(--gold)'];
    return ['research frontier', 'var(--faded)'];
  }
  const nameBtn = { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--deep-blue)', background: 'transparent', border: 'none', borderBottom: '1px dotted var(--deep-blue)', cursor: 'pointer', padding: 0 };
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Open lines — {total} unresolved threads</div>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)', margin: '4px 0 16px' }}>
        One boy carried the name three hundred years ago; these are the threads still hanging from the line — lost surnames, branches that split off, the load-bearing Gen-5 link. Cross-check each with Grok · Gemini · Claude; corroborated findings save back into that person’s record.
      </p>
      {rows.map(function (r) {
        const c = closeness(r);
        return (
          <div key={r.pid} style={{ background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.15)', borderLeft: '3px solid ' + c[1], borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <button onClick={function () { onSelect(r.pid); }} style={nameBtn}>{r.name}</button>
              <Chip>Gen {r.gen}</Chip>
              {r.era && <Chip>{ERA[r.era] ? ERA[r.era].label.split(' (')[0] : r.era}</Chip>}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c[1], border: '1px solid ' + c[1], borderRadius: 3, padding: '0 6px' }}>{c[0]}</span>
            </div>
            {r.gaps.map(function (g, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--ink)', flex: 1, minWidth: 0 }}>{g.text}</span>
                  <button onClick={function () { onResearch(r.pid, g.text); }} style={ctlBtn(false)} title="Cross-check with Grok · Gemini · Claude">Research ▸</button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Root
   ============================================================ */
function useViewport() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(function () {
    const f = function () { setW(window.innerWidth); };
    window.addEventListener('resize', f);
    return function () { window.removeEventListener('resize', f); };
  }, []);
  return { w: w, narrow: w < 860 };
}

/* ---------- A Day Here: the household's movements, dawn → dark ---------- */
const PHASE_LABEL = { dawn: '🌅 Dawn', morning: '🌤️ Morning', midday: '☀️ Midday', afternoon: '🌾 Afternoon', dusk: '🔥 Dusk', night: '🌙 Night' };
function DayHere({ world, stage, onSelect }) {
  const [hi, setHi] = useState(0);
  const day = useMemo(function () { try { return world ? world.daySnapshot() : null; } catch (e) { return null; } }, [world, stage.id]);
  useEffect(function () {
    const t = setInterval(function () { setHi(function (h) { return (h + 1) % 6; }); }, 3400);
    return function () { clearInterval(t); };
  }, [stage.id]);
  if (!day) return <div style={{ color: 'var(--faded)', fontStyle: 'italic' }}>No household is recorded here yet.</div>;
  return (
    <div style={{ maxWidth: 840 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--ink)', marginBottom: 3 }}>A day at {stage.label}</h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)', marginBottom: 14 }}>{day.date.label} · {cap(day.movements[2].weather.label)} — one day in the household, watched from dawn to dark.</p>

      <div style={{ background: 'rgba(139,30,30,0.06)', border: '1px solid rgba(139,30,30,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blood, #7a1f1f)', marginBottom: 4 }}>The trial of this time</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>{day.challenge.trial}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--rust)', marginTop: 7 }}><strong>Working toward</strong> — {day.challenge.endeavor}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {day.movements.map(function (m, i) {
          const active = i === hi;
          return (
            <div key={m.phase} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 9, background: active ? 'rgba(154,123,45,0.13)' : 'var(--cream, #faf6f0)', border: '1px solid ' + (active ? 'var(--gold)' : 'rgba(139,69,19,0.14)'), transition: 'background .4s, border-color .4s' }}>
              <div style={{ minWidth: 104, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{PHASE_LABEL[m.phase]}{m.isSunday ? <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, color: 'var(--sea-green)', textTransform: 'uppercase', letterSpacing: '.08em' }}>the Sabbath</div> : null}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {m.agents.slice(0, 7).map(function (a) {
                  return <div key={a.id} onClick={function () { onSelect && onSelect(a.id); }} style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, lineHeight: 1.4, color: 'var(--ink)', cursor: 'pointer' }}><strong style={{ color: a.isChild ? 'var(--gold-bright)' : 'var(--sea-green)' }}>{a.name.split(' ')[0]}</strong> {a.activity}.</div>;
                })}
                {m.agents.length === 0 && <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faded)' }}>quiet — no one recorded here at this hour.</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- The Long Move: how each generation met its trial and moved on ---------- */
function LongMove({ onSelect }) {
  const arc = (DATA.directLine || []).map(function (id) {
    const p = DATA.people[id] || {}, per = (PERS && PERS.byId[id]) || {};
    return {
      id: id, name: p.name, lifespan: p.lifespan || '', generation: p.generation,
      place: (p.born && p.born.place) || (p.died && p.died.place) || '',
      move: p.role || per.epithet || '', essence: per.essence || '', drive: per.drive || '',
      era: per.era, evidence: p.evidence,
    };
  });
  const keeper = DATA.people['ryan'];
  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--ink)', marginBottom: 3 }}>The Long Move</h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)', marginBottom: 20, maxWidth: 600 }}>Four centuries, eleven hands. Each generation met the trial of its time and, when the known ground was used up, moved first into the unknown. Read down the line to see how the family got here — and where the instinct points.</p>

      <div style={{ position: 'relative', paddingLeft: 22 }}>
        <div style={{ position: 'absolute', left: 6, top: 4, bottom: 30, width: 2, background: 'linear-gradient(var(--gold-bright), var(--rust), var(--blood), var(--gold))' }} />
        {arc.map(function (a, i) {
          const unproven = a.evidence === 'unsolved' || a.evidence === 'leading';
          return (
            <div key={a.id} style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: 12, background: unproven ? 'var(--cream)' : eraHex(a.era), border: '2px solid ' + (unproven ? 'var(--rust)' : eraHex(a.era)) }} />
              <div onClick={function () { onSelect && onSelect(a.id); }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{a.name}</span>
                  {a.move && <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--rust)' }}>— {a.move}</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)', marginTop: 1 }}>{a.lifespan}{a.place ? ' · ' + a.place : ''}</div>
                {a.essence && <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink)', marginTop: 5 }}>{a.essence}.</div>}
                {!a.essence && unproven && <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--faded)', marginTop: 5, fontStyle: 'italic' }}>The load-bearing gap in the pedigree — the link the bloodhound is still running to ground.</div>}
              </div>
            </div>
          );
        })}
        {keeper && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: -22, top: 4, width: 12, height: 12, borderRadius: 12, background: 'var(--gold)', border: '2px solid var(--gold)' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{keeper.name} <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--gold)' }}>— the present keeper</span></div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)', marginTop: 1 }}>{keeper.role}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.55, color: 'var(--ink)', marginTop: 8, borderLeft: '3px solid var(--gold)', paddingLeft: 11 }}>
              The pattern holds across four centuries: when the known ground is used up, the line moves first into the unknown. That instinct — not any one place — is the inheritance, and it points wherever the next frontier opens. The record is kept so the next ones can see how they got here, and take the next move with their eyes open.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Governance — the glass box (the honest Vorion layer) ---------- */
const GTIER = { confirmed: 'var(--sea-green)', secondary: 'var(--gold)', leading: 'var(--gold-bright)', possible: 'var(--faded)', unsolved: 'var(--rust)', reconstructed: 'var(--deep-blue)', eliminated: 'var(--blood)', disproven: 'var(--blood)' };
function gTierOf(id) {
  const per = PERS.byId[id];
  if (per && per.provenance && per.provenance.reconstructed) return 'reconstructed';
  return (DATA.people[id] && DATA.people[id].evidence) || 'possible';
}
function GovBadge({ t }) { return <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: '#fff', background: GTIER[t] || 'var(--faded)' }}>{t}</span>; }
function GovCard({ cap, children }) {
  return (
    <div style={{ background: 'var(--cream,#faf6f0)', border: '1px solid rgba(139,69,19,0.16)', borderRadius: 11, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 9 }}>{cap}</div>
      {children}
    </div>
  );
}
/* ---------- Meta-governance — governing the governor ---------- */
// content-addressed digest: same governed state -> same id; any drift -> new id.
function govHash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return (h >>> 0).toString(16).padStart(8, '0'); }
function MetaGovCard({ audit, appeals }) {
  // Each primitive can itself drift; the meta-governor attests over all of them.
  const rulings = (appeals || []).filter(function (a) { return a.status !== 'under_review'; });
  const rulingsNoNote = rulings.filter(function (a) { return !(a.resolution_note && a.resolution_note.trim()); }).length;
  const STALE_DAYS = 30, now = Date.now();
  const stale = (appeals || []).filter(function (a) { return a.status === 'under_review' && a.created_at && (now - new Date(a.created_at).getTime()) > STALE_DAYS * 864e5; }).length;
  const invariants = [
    { key: 'horizon', label: 'Knowledge-horizon boundary', ok: audit.fails.length === 0, detail: audit.pass + '/' + audit.total + ' personas bounded to gen ≤ N+1 and their own year' },
    { key: 'ref', label: 'Referential integrity', ok: audit.refDangling === 0, detail: audit.refDangling === 0 ? 'every kin id resolves to a real person' : audit.refDangling + ' dangling kin reference(s)' },
    { key: 'quarantine', label: 'Quarantine containment', ok: audit.quarantineLeak === 0, detail: audit.quarantineLeak === 0 ? 'no disproven claim surfaces as fact (' + audit.quarantine.length + ' held)' : audit.quarantineLeak + ' disproven claim(s) leaking as fact' },
    { key: 'rulings', label: 'Appeal-ruling completeness', ok: rulingsNoNote === 0, detail: rulings.length === 0 ? 'no rulings yet' : rulingsNoNote === 0 ? (rulings.length + ' ruling(s), each with a recorded reason') : rulingsNoNote + ' ruling(s) closed without a recorded reason' },
  ];
  const allOk = invariants.every(function (i) { return i.ok; });
  // the attestation is over the governed state itself — tamper-evident
  const digest = govHash(JSON.stringify({ p: audit.pass, t: audit.total, ti: audit.tiers, q: audit.quarantine.length, s: audit.sources, g: audit.gaps, r: audit.refDangling, l: audit.quarantineLeak }));
  return (
    <GovCard cap="Meta-governance — governing the governor">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
        <div style={{ fontSize: 24 }}>{allOk ? '🧭' : '⚠️'}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: allOk ? 'var(--sea-green)' : 'var(--blood)' }}>{allOk ? 'All governance invariants attest' : 'A governance invariant needs attention'}</div>
          <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>The watcher over the watchers — every primitive above can itself drift, so the record audits its own governance live. The same checks gate the build.</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {invariants.map(function (i) {
          return (
            <div key={i.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12.5 }}>
              <span style={{ color: i.ok ? 'var(--sea-green)' : 'var(--blood)', fontWeight: 700, width: 14 }}>{i.ok ? '✓' : '✗'}</span>
              <span style={{ width: 196, color: 'var(--ink)', fontWeight: 600 }}>{i.label}</span>
              <span style={{ color: 'var(--faded)', flex: 1 }}>{i.detail}</span>
            </div>
          );
        })}
      </div>
      {stale > 0 && <div style={{ fontSize: 11.5, color: 'var(--rust)', marginTop: 8 }}>⏳ {stale} appeal(s) under review &gt; {STALE_DAYS} days — a ruling is overdue.</div>}
      <div style={{ marginTop: 11, paddingTop: 9, borderTop: '1px dashed rgba(139,69,19,0.2)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)' }}>Integrity attestation</span>
        <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--deep-blue)', background: 'rgba(45,74,90,0.08)', padding: '2px 8px', borderRadius: 6 }}>gov:{digest}</code>
        <span style={{ fontSize: 11, color: 'var(--faded)' }}>content-addressed over the governed state — it changes the instant the record drifts.</span>
      </div>
    </GovCard>
  );
}

/* ---------- Contestation & Appeal — challenge a tier or a quarantine, in the open ---------- */
const APPEAL_STATUS = {
  under_review: { label: 'under review', bg: 'var(--gold)', fg: '#3a2a00' },
  approved: { label: 'approved', bg: 'var(--sea-green)', fg: '#fff' },
  denied: { label: 'denied', bg: 'var(--blood)', fg: '#fff' },
  escalated: { label: 'escalated · ⚖ all 3', bg: 'var(--deep-blue)', fg: '#fff' },
};
function AppealBadge({ s }) {
  const c = APPEAL_STATUS[s] || APPEAL_STATUS.under_review;
  return <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: c.fg, background: c.bg }}>{c.label}</span>;
}
function ContestationCard({ personId, member, verified, quarantine, appeals, loaded, reload }) {
  const enabled = !!(window.CASON_AUTH && window.CASON_AUTH.enabled);
  appeals = appeals || [];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [targetKey, setTargetKey] = useState('');
  const [challenge, setChallenge] = useState('');
  const [evidence, setEvidence] = useState('');
  const [notes, setNotes] = useState({});
  const selP = personId ? DATA.people[personId] : null;

  // what can be contested: the selected person's tier + each quarantined claim
  const targets = [];
  if (selP) targets.push({ key: 'tier:' + personId, type: 'tier', id: personId, label: selP.name + ' — current tier “' + gTierOf(personId) + '”' });
  (quarantine || []).slice(0, 12).forEach(function (q, i) {
    targets.push({ key: 'q:' + i, type: 'quarantine', id: (q.owner || 'claim') + '#' + i, label: 'Quarantined' + (q.owner ? ' · ' + nm(q.owner) : '') + ' — ' + q.text.slice(0, 46) });
  });
  const activeKey = targetKey || (targets[0] && targets[0].key) || '';
  const chosen = targets.find(function (t) { return t.key === activeKey; }) || targets[0] || null;

  function submit() {
    if (!chosen || !challenge.trim()) { setMsg('Pick what you’re contesting and say why.'); return; }
    setBusy(true); setMsg('Filing…');
    window.CASON_AUTH.fileAppeal({ targetType: chosen.type, targetId: chosen.id, targetLabel: chosen.label, challenge: challenge.trim(), evidence: evidence.trim() })
      .then(function () { setChallenge(''); setEvidence(''); setOpen(false); setMsg('Filed — it’s on the open ledger below.'); reload(); })
      .catch(function (e) { setMsg('Could not file: ' + (e && e.message || e)); })
      .then(function () { setBusy(false); });
  }
  function resolve(id, status) {
    setBusy(true); setMsg('');
    window.CASON_AUTH.resolveAppeal(id, status, notes[id] || '')
      .then(function () { setNotes(function (n) { const c = Object.assign({}, n); delete c[id]; return c; }); reload(); })
      .catch(function (e) { setMsg('Could not update: ' + (e && e.message || e)); })
      .then(function () { setBusy(false); });
  }

  const inp = { width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-serif)', fontSize: 12.5, padding: '7px 9px', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 7, background: '#fff', color: 'var(--ink)' };
  const mini = function (bg) { return { fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, padding: '4px 9px', borderRadius: 7, border: 'none', color: '#fff', background: bg, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }; };
  const counts = appeals.reduce(function (a, x) { a[x.status] = (a[x.status] || 0) + 1; return a; }, {});

  return (
    <GovCard cap={'Contestation & Appeal — the record can be challenged, in the open (' + appeals.length + ')'}>
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>
        Governance isn’t one-way. A verified family member can contest an evidence tier or a quarantined claim with a source; the challenge and its ruling are a <strong>public, auditable ledger</strong> — anyone can read why a decision stands or was overturned.
      </div>

      {!enabled && <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>Connect the family backend to open the appeal ledger.</div>}

      {enabled && verified && (
        <div style={{ marginBottom: 12 }}>
          {!open && <button onClick={function () { setOpen(true); setMsg(''); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--deep-blue)', background: 'var(--deep-blue)', color: '#fff', cursor: 'pointer' }}>＋ File an appeal</button>}
          {open && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', border: '1px solid rgba(139,69,19,0.2)', borderRadius: 9, padding: 12 }}>
              <label style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--faded)' }}>What are you contesting?</label>
              <select value={activeKey} onChange={function (e) { setTargetKey(e.target.value); }} style={inp}>
                {targets.length === 0 && <option value="">Select a person, or open a quarantined claim</option>}
                {targets.map(function (t) { return <option key={t.key} value={t.key}>{t.label}</option>; })}
              </select>
              <textarea value={challenge} onChange={function (e) { setChallenge(e.target.value); }} placeholder="Why is the current standing wrong, and what should it be?" rows={3} style={Object.assign({}, inp, { resize: 'vertical' })} />
              <input value={evidence} onChange={function (e) { setEvidence(e.target.value); }} placeholder="Source / citation you’re offering (deed, census, Bible record…)" style={inp} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={submit} disabled={busy} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--sea-green)', color: '#fff', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>Submit appeal</button>
                <button onClick={function () { setOpen(false); setMsg(''); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(139,69,19,0.25)', background: 'transparent', color: 'var(--faded)', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      {enabled && !verified && (
        <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12, marginBottom: 12 }}>
          {member ? 'Preview members can read the ledger; verify by email to file an appeal.' : 'Family members can contest a tier or a quarantined claim — sign in (Narrator → family email) to file one.'}
        </div>
      )}

      {msg && <div style={{ fontSize: 11.5, color: /Could not|wrong/.test(msg) ? 'var(--blood)' : 'var(--sea-green)', marginBottom: 8 }}>{msg}</div>}

      {appeals.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--faded)', marginBottom: 8 }}>
          {['under_review', 'approved', 'denied', 'escalated'].filter(function (k) { return counts[k]; }).map(function (k) {
            return <span key={k}>{APPEAL_STATUS[k].label}: <strong style={{ color: 'var(--ink)' }}>{counts[k]}</strong></span>;
          })}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {appeals.map(function (a) {
          return (
            <div key={a.id} style={{ borderLeft: '3px solid ' + (APPEAL_STATUS[a.status] || APPEAL_STATUS.under_review).bg, paddingLeft: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <AppealBadge s={a.status} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)' }}>{a.target_type}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{a.target_label || a.target_id}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5, margin: '4px 0' }}>{a.challenge}</div>
              {a.evidence && <div style={{ fontSize: 11.5, color: 'var(--faded)' }}><strong>Source offered:</strong> {a.evidence}</div>}
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)', marginTop: 2 }}>
                filed by {a.submitter_name || 'a member'}{a.created_at ? ' · ' + new Date(a.created_at).toLocaleDateString() : ''}
                {a.resolver_name ? ' · ruled by ' + a.resolver_name : ''}
              </div>
              {a.resolution_note && <div style={{ fontSize: 11.5, color: 'var(--ink)', fontStyle: 'italic', marginTop: 3 }}>Ruling: {a.resolution_note}</div>}
              {verified && a.status === 'under_review' && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                  <input value={notes[a.id] || ''} onChange={function (e) { const v = e.target.value; setNotes(function (n) { return Object.assign({}, n, { [a.id]: v }); }); }} placeholder="ruling note…" style={Object.assign({}, inp, { width: 200, padding: '4px 8px', fontSize: 11.5 })} />
                  <button onClick={function () { resolve(a.id, 'approved'); }} disabled={busy} style={mini('var(--sea-green)')}>Approve</button>
                  <button onClick={function () { resolve(a.id, 'denied'); }} disabled={busy} style={mini('var(--blood)')}>Deny</button>
                  <button onClick={function () { resolve(a.id, 'escalated'); }} disabled={busy} title="Escalate to the ⚖ all-3 multi-model consensus" style={mini('var(--deep-blue)')}>Escalate ⚖</button>
                </div>
              )}
            </div>
          );
        })}
        {loaded && appeals.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>No appeals filed — the record stands unchallenged.</div>}
      </div>
    </GovCard>
  );
}
/* ---------- Audit trace — the typed policy gate, live in the page ---------- */
const GATE_COLOR = { allow: 'var(--sea-green)', needs_approval: 'var(--gold)', block: 'var(--blood)' };
const GATE_LABEL = { allow: 'ALLOW', needs_approval: 'NEEDS APPROVAL', block: 'BLOCK' };
function evDetail(e) {
  if (e.type === 'run_started') return e.task || '';
  if (e.type === 'step_started') return e.role + ' →';
  if (e.type === 'step_completed') return e.role + (e.summary ? ' — ' + e.summary : '');
  if (e.type === 'action_proposed') return (e.action && e.action.kind) || '';
  if (e.type === 'gate_decision') return (e.decision && e.decision.decision) || '';
  if (e.type === 'executed') return e.result || '';
  if (e.type === 'awaiting_approval') return e.reason || '';
  if (e.type === 'halted') return e.reason || '';
  if (e.type === 'error') return e.message || '';
  return '';
}
function evColor(e) {
  const blocked = e.type === 'halted' || e.type === 'error' || (e.type === 'gate_decision' && e.decision && e.decision.decision === 'block');
  const review = e.type === 'awaiting_approval' || (e.type === 'gate_decision' && e.decision && e.decision.decision === 'needs_approval');
  if (blocked) return 'var(--blood)';
  if (review) return 'var(--rust)';
  if (e.type === 'executed' || e.type === 'run_completed') return 'var(--sea-green)';
  return 'var(--ink)';
}
function TraceEvents({ events }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
      {events.map(function (e, i) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontFamily: 'var(--font-sans)', fontSize: 11 }}>
            <span style={{ width: 118, flexShrink: 0, color: 'var(--faded)', fontFamily: 'monospace', fontSize: 10 }}>{e.type}</span>
            <span style={{ flex: 1, color: evColor(e), lineHeight: 1.45 }}>{evDetail(e)}</span>
          </div>
        );
      })}
    </div>
  );
}
function AuditTraceCard() {
  const GOV = window.CASON_GOVERNANCE, KIN = window.CASON_KINSHIP;
  const [pick, setPick] = useState(0);
  const [raw, setRaw] = useState(false);
  const [real, setReal] = useState(null); // the latest *actual* Keeper run, if one is published
  const [realOpen, setRealOpen] = useState(false);
  useEffect(function () {
    let alive = true;
    fetch('/research/proposals/latest.trace.ndjson', { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.text() : null; })
      .then(function (txt) {
        if (!alive || !txt) return;
        const events = txt.trim().split('\n').map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
        if (!events.length) return;
        const started = events.find(function (e) { return e.type === 'run_started'; }) || {};
        const tally = { allow: 0, needs_approval: 0, block: 0 };
        events.forEach(function (e) { if (e.type === 'gate_decision' && e.decision) tally[e.decision.decision] = (tally[e.decision.decision] || 0) + 1; });
        setReal({ task: started.task || 'Keeper run', at: started.at || '', tally: tally, events: events, ndjson: txt });
      })
      .catch(function () { /* no run published yet — the scenarios stand */ });
    return function () { alive = false; };
  }, []);
  const runs = useMemo(function () {
    if (!GOV) return [];
    const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
    const SUP = window.CASON_SUPERSESSIONS;
    const policy = GOV.buildKeeperPolicy({ bannedPattern: BANNED, eliminatedPatterns: (KIN ? KIN.eliminatedKin() : []), supersededValues: (SUP ? SUP.values() : []), primaryThreshold: 1.0, consensusThreshold: 0.5 });
    const modelProv = [{ sourceId: 'model:grok', snippet: 'a single derivative tree', score: 0.5 }];
    const corroborated = { votes: [{ model: 'grok', kind: 'write_record' }, { model: 'gemini', kind: 'write_record' }], agreementRatio: 1.0, chosenKind: 'write_record' };
    const scenarios = [
      { name: 'Revive a ruled-out father', desc: "A model names Ransom's father as a branch the family eliminated.",
        action: { kind: 'write_record', payload: { personId: 'ransom-sr', evidence: 'leading', text: "Ransom Cason Sr.'s father was Cannon Cason Sr. of Pitt County." }, justification: 'two models agree', provenance: modelProv, consensus: corroborated } },
      { name: 'Repeat a quarantined myth', desc: 'A model repeats the disproven Digswell origin.',
        action: { kind: 'write_record', payload: { personId: 'thomas-sr', evidence: 'possible', text: 'The Digswell 1608 baptism names his father.' }, justification: 'one source', provenance: modelProv } },
      { name: 'Re-assert a corrected value', desc: 'A model revives the “Elizabeth Alcott” name the record has superseded.',
        action: { kind: 'write_record', payload: { personId: 'elizabeth-keeling-leighton', evidence: 'possible', text: 'Her name was Elizabeth Alcott.' }, justification: 'an old derivative tree', provenance: modelProv } },
      { name: 'A clean lead', desc: 'A single-source lead, honestly tiered — parked for a human merge.',
        action: { kind: 'write_record', payload: { personId: 'james-green', evidence: 'possible', text: 'The Green middle name may trace to a Glynn Co. family.' }, justification: 'one derivative source', provenance: modelProv } },
      { name: 'Affirm a graph edge', desc: 'A kinship already curated in the record — no model needed.',
        action: { kind: 'affirm_graph', payload: { personId: 'ransom-sr', relation: 'parents' }, justification: 'parents(Ransom) resolve from the curated graph', provenance: [{ sourceId: 'graph:kinship', snippet: 'curated edge', score: 1.0 }] } },
    ];
    return scenarios.map(function (s) {
      const decision = GOV.evaluatePolicy(s.action, policy);
      const trace = GOV.Trace(s.name);
      trace.runStarted();
      trace.actionProposed('s1', s.action);
      trace.gateDecision('s1', decision);
      if (decision.decision === 'allow') trace.executed('s1', s.action.kind === 'affirm_graph' ? 'edge already curated — no write' : 'no record written');
      else if (decision.decision === 'needs_approval') trace.awaitingApproval('s1', GOV.reasonOf(decision, 'review'));
      else trace.halted('s1', GOV.reasonOf(decision));
      trace.runCompleted();
      return { s: s, decision: decision, ndjson: trace.toNdjson(), events: trace.events() };
    });
  }, []);

  const posture = useMemo(function () { return GOV ? GOV.autonomyPosture(GOV.buildKeeperPolicy({})) : null; }, []);
  if (!GOV || runs.length === 0) {
    return <GovCard cap="Audit trace — the policy gate, live"><div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>The governance module isn’t loaded.</div></GovCard>;
  }
  const r = runs[pick] || runs[0];
  const dc = GATE_COLOR[r.decision.decision] || 'var(--faded)';
  return (
    <GovCard cap="Audit trace — the policy gate, live in the page">
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>
        The same typed gate the Keeper runs, here in the browser: each proposed action is decided <strong>allow / needs-approval / block</strong> by named rules, and every step is one line of a replayable <strong>NDJSON trace</strong> — the wire format of the audit trail. Pick a scenario and watch it decide.
      </div>
      {posture && posture.supervised && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink)', background: 'rgba(45,74,90,0.06)', border: '1px solid rgba(45,74,90,0.12)', borderRadius: 8, padding: '6px 10px', marginBottom: 11 }}>
          <span>🔒</span><span>Autonomy: <strong>supervised</strong> — the top tier (autonomous write) is <strong>unoccupied by design</strong>. {posture.detail}.</span>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 11 }}>
        {runs.map(function (run, i) {
          const active = i === pick;
          return <button key={i} onClick={function () { setPick(i); setRaw(false); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', border: '1px solid ' + (active ? 'var(--deep-blue)' : 'rgba(139,69,19,0.25)'), background: active ? 'var(--deep-blue)' : 'transparent', color: active ? '#fff' : 'var(--faded)' }}>{run.s.name}</button>;
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 7, color: '#fff', background: dc }}>{GATE_LABEL[r.decision.decision]}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink)', fontStyle: 'italic' }}>{r.s.desc}</span>
      </div>
      {r.decision.violations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 9 }}>
          {r.decision.violations.map(function (v, i) {
            const hard = (v.severity || 'block') === 'block';
            return <div key={i} style={{ fontSize: 12, color: 'var(--ink)', borderLeft: '3px solid ' + (hard ? 'var(--blood)' : 'var(--gold)'), paddingLeft: 9 }}><code style={{ fontFamily: 'monospace', fontSize: 11.5, color: hard ? 'var(--blood)' : 'var(--rust)' }}>{v.rule}</code> — {v.detail}</div>;
          })}
        </div>
      ) : <div style={{ fontSize: 12, color: 'var(--sea-green)', marginBottom: 9 }}>No violations — the action is permitted.</div>}
      <TraceEvents events={r.events} />
      <button onClick={function () { setRaw(function (x) { return !x; }); }} style={{ marginTop: 8, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(139,69,19,0.25)', background: 'transparent', color: 'var(--deep-blue)' }}>{raw ? 'Hide' : 'View'} raw NDJSON</button>
      {raw && <pre style={{ marginTop: 8, background: 'rgba(45,74,90,0.06)', border: '1px solid rgba(45,74,90,0.12)', borderRadius: 8, padding: 10, fontFamily: 'monospace', fontSize: 10.5, lineHeight: 1.5, color: 'var(--deep-blue)', overflowX: 'auto', whiteSpace: 'pre' }}>{r.ndjson}</pre>}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed rgba(139,69,19,0.2)' }}>
        {real ? (
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 6 }}>Latest Keeper run{real.at ? ' · ' + new Date(real.at).toLocaleDateString() : ''}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: 'var(--ink)', marginBottom: 6 }}>
              <span><strong style={{ color: 'var(--sea-green)' }}>{real.tally.allow}</strong> allow</span>
              <span><strong style={{ color: 'var(--rust)' }}>{real.tally.needs_approval}</strong> needs-approval</span>
              <span><strong style={{ color: 'var(--blood)' }}>{real.tally.block}</strong> block</span>
            </div>
            <button onClick={function () { setRealOpen(function (x) { return !x; }); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(139,69,19,0.25)', background: 'transparent', color: 'var(--deep-blue)' }}>{realOpen ? 'Hide' : 'View'} the run ({real.events.length} events)</button>
            {realOpen && <TraceEvents events={real.events} />}
            {realOpen && <pre style={{ marginTop: 8, background: 'rgba(45,74,90,0.06)', border: '1px solid rgba(45,74,90,0.12)', borderRadius: 8, padding: 10, fontFamily: 'monospace', fontSize: 10.5, lineHeight: 1.5, color: 'var(--deep-blue)', overflowX: 'auto', whiteSpace: 'pre' }}>{real.ndjson}</pre>}
          </div>
        ) : (
          <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'var(--faded)' }}>No Keeper run published yet — the scenarios above show the same gate, live.</div>
        )}
      </div>
    </GovCard>
  );
}
/* ---------- Supersession ledger — what the record used to say, and why it changed ---------- */
function SupersessionCard() {
  const SUP = window.CASON_SUPERSESSIONS;
  const recs = SUP ? SUP.all() : [];
  if (!recs.length) return null;
  return (
    <GovCard cap={'What the record used to say — and why it changed (' + recs.length + ')'}>
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>
        Corrections aren’t erased — the old value is kept and marked <strong>superseded</strong>, so the record’s change-history stays auditable. The gate refuses to re-assert any of them.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recs.map(function (r, i) {
          return (
            <div key={i} style={{ borderLeft: '3px solid var(--blood)', paddingLeft: 10 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)' }}>{nm(r.subject)} · {r.attribute}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--faded)' }}>{r.superseded}</span>{'  →  '}<strong>{r.current}</strong>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, color: 'var(--blood)', textTransform: 'uppercase', marginLeft: 6 }}>{r.status}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--faded)', marginTop: 2 }}>{r.reason}{r.basis && r.basis.length ? ' — ' + r.basis.join('; ') : ''}</div>
            </div>
          );
        })}
      </div>
    </GovCard>
  );
}
/* ---------- The agent roster — the whole governed system, self-described ---------- */
function AgentsCard() {
  const REG = window.CASON_AGENTS;
  if (!REG) return null;
  return (
    <GovCard cap={'The agent roster — what governs this line (' + REG.agents.length + ')'}>
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 11 }}>
        Every agent, its <strong>system</strong> (how it works) and what it <strong>can do</strong>, and the autonomy that bounds it. The top tier is unoccupied by design — nothing here publishes without a human.
      </div>
      {REG.LAYERS.map(function (layer) {
        const inLayer = REG.byLayer(layer);
        if (!inLayer.length) return null;
        return (
          <div key={layer} style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 6 }}>{layer}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {inLayer.map(function (a) {
                const color = a.status === 'live' ? 'var(--sea-green)' : 'var(--gold)';
                return (
                  <div key={a.id} style={{ borderLeft: '3px solid ' + color, paddingLeft: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{a.name}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', padding: '1px 7px', borderRadius: 20, color: '#fff', background: color }}>{a.status}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)' }}>{a.autonomy}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, margin: '2px 0' }}>{a.system}</div>
                    <div style={{ fontSize: 11, color: 'var(--faded)' }}><strong>Can:</strong> {a.abilities.join(' · ')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </GovCard>
  );
}
/* ---------- The Curator + the interaction agents — surfaced, learning, proposing ---------- */
function agentSub(label) {
  return <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--faded)', margin: '11px 0 5px' }}>{label}</div>;
}
function CuratorCard() {
  const CUR = window.CASON_CURATOR, REF = window.CASON_REFLECTION, JNY = window.CASON_JOURNEY;
  const DATA = window.CASON_DATA, MEM = window.CASON_MEMORY, PERS = window.CASON_PERSONAS;
  if (!CUR) return null;
  const deps = { data: DATA, MEM: MEM, PERS: PERS };
  const s = CUR.suggest(new Date(), deps);
  const ref = REF ? REF.report(DATA, MEM, PERS) : null;
  const jny = JNY ? JNY.recommend({ visited: [], personas: [] }, deps) : [];
  const ul = { margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.55 };
  return (
    <GovCard cap="The Curator & the interaction agents — what to do next (proposed, never auto-applied)">
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5 }}>
        These agents learn from the record and the calendar and <strong>suggest</strong> — seasonal features, edits, additions, and where to look next. A human applies them; nothing here changes the site on its own.
      </div>
      {agentSub('Seasonal — ' + s.season)}
      <ul style={ul}>{s.seasonal.map(function (x, i) { return <li key={i}><strong>{x.title}</strong> — {x.why}</li>; })}</ul>
      {s.edits.length ? agentSub('Suggested edits') : null}
      <ul style={ul}>{s.edits.slice(0, 5).map(function (e, i) { return <li key={i}>{e.suggestion}</li>; })}</ul>
      {s.additions.length ? agentSub('Additions to consider') : null}
      <ul style={ul}>{s.additions.map(function (a, i) { return <li key={i}><em>{a.kind}</em> — {a.suggestion}</li>; })}</ul>
      {ref && ref.priorities.length ? <div>{agentSub('Reflection — work on next')}<ul style={ul}>{ref.priorities.slice(0, 3).map(function (p, i) { return <li key={i}>{p.why}</li>; })}</ul></div> : null}
      {jny.length ? <div>{agentSub('Journey — try next')}<div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.55 }}>{jny[0].why}</div></div> : null}
    </GovCard>
  );
}
/* ---------- In-app approval queue — agent proposals decided at the policy gate ---------- */
const PROP_TIERS = ['possible', 'leading', 'unsolved'];
function ReviewQueueCard({ member, verified, proposals, loaded, reload }) {
  const enabled = !!(window.CASON_AUTH && window.CASON_AUTH.enabled);
  const GOV = window.CASON_GOVERNANCE, KIN = window.CASON_KINSHIP, SUP = window.CASON_SUPERSESSIONS;
  proposals = proposals || [];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [notes, setNotes] = useState({});
  const [tiers, setTiers] = useState({});

  const policy = useMemo(function () {
    if (!GOV) return null;
    const BANNED = /digswell|elizabeth alcott|church warden|virginia land company|steeple morden|stockholder/i;
    return GOV.buildKeeperPolicy({ bannedPattern: BANNED, eliminatedPatterns: (KIN ? KIN.eliminatedKin() : []), supersededValues: (SUP ? SUP.values() : []), primaryThreshold: 1.0, consensusThreshold: 0.5 });
  }, []);
  function decisionFor(p, tier) {
    if (!GOV || !policy) return null;
    const action = { kind: p.kind || 'write_record', payload: { personId: p.person_id, evidence: tier || p.evidence, text: p.summary }, justification: p.justification || 'proposal', provenance: p.source ? [{ sourceId: 'src', snippet: p.source, score: /consensus|model/i.test(p.source) ? 0.5 : 0.8 }] : [] };
    return GOV.evaluatePolicy(action, policy);
  }
  function approve(p) {
    const tier = tiers[p.id] || (PROP_TIERS.indexOf(p.evidence) !== -1 ? p.evidence : 'possible');
    const d = decisionFor(p, tier);
    if (d && d.decision === 'block') { setMsg('The policy gate blocks this proposal — it cannot be approved into the record.'); return; }
    setBusy(true); setMsg('');
    const rec = { personId: p.person_id, text: p.summary, evidence: tier, source: (p.source || 'proposal') + ' · approved by ' + (member || 'a keeper'), when: Date.now() };
    if (window.CASON_MEMORY && window.CASON_MEMORY.addUserMemory) { try { window.CASON_MEMORY.addUserMemory(rec); } catch (e) {} }
    (window.CASON_AUTH.addContribution ? window.CASON_AUTH.addContribution(rec) : Promise.resolve())
      .then(function () { return window.CASON_AUTH.decideProposal(p.id, 'approved', notes[p.id] || '', tier); })
      .then(function () { reload && reload(); })
      .catch(function (e) { setMsg('Could not approve: ' + (e && e.message || e)); })
      .then(function () { setBusy(false); });
  }
  function reject(p) {
    setBusy(true); setMsg('');
    window.CASON_AUTH.decideProposal(p.id, 'rejected', notes[p.id] || '')
      .then(function () { reload && reload(); })
      .catch(function (e) { setMsg('Could not reject: ' + (e && e.message || e)); })
      .then(function () { setBusy(false); });
  }
  function noteFor(id, v) { setNotes(function (n) { return Object.assign({}, n, { [id]: v }); }); }

  const pending = proposals.filter(function (p) { return p.status === 'pending'; });
  const decided = proposals.filter(function (p) { return p.status !== 'pending'; });
  const inp = { fontFamily: 'var(--font-serif)', fontSize: 11.5, padding: '4px 8px', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 7, background: '#fff', color: 'var(--ink)' };
  const mini = function (bg, on) { return { fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, padding: '4px 10px', borderRadius: 7, border: 'none', color: '#fff', background: bg, cursor: (busy || !on) ? 'default' : 'pointer', opacity: (busy || !on) ? 0.45 : 1 }; };

  return (
    <GovCard cap={'Review queue — agent proposals, decided at the gate (' + pending.length + ' pending)'}>
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>
        Where the agents' findings come to be <strong>approved in the app</strong>, not on GitHub. Each proposal is run through the same typed policy gate the Keeper uses — <strong>allow / needs-approval / block</strong> — and a verified member promotes it into the record (a flagged, attributed contribution) or rejects it. <strong>The gate can refuse</strong>: a proposal that repeats a quarantined myth, revives a ruled-out ancestor, or over-claims a tier <em>cannot</em> be approved.
      </div>
      {!enabled && <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>Connect the family backend to open the review queue.</div>}
      {msg && <div style={{ fontSize: 11.5, color: /Could not|blocks/.test(msg) ? 'var(--blood)' : 'var(--sea-green)', marginBottom: 8 }}>{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {pending.map(function (p) {
          const tier = tiers[p.id] || (PROP_TIERS.indexOf(p.evidence) !== -1 ? p.evidence : 'possible');
          const d = decisionFor(p, tier);
          const dc = d ? (GATE_COLOR[d.decision] || 'var(--faded)') : 'var(--faded)';
          const blocked = d && d.decision === 'block';
          return (
            <div key={p.id} style={{ borderLeft: '3px solid ' + dc, paddingLeft: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                {d && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: '#fff', background: dc }}>{d.decision.replace('_', ' ')}</span>}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)' }}>{p.origin}</span>
                {p.person_id && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{nm(p.person_id)}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5, margin: '3px 0' }}>{p.summary}</div>
              {p.source && <div style={{ fontSize: 11.5, color: 'var(--faded)' }}><strong>Source:</strong> {p.source}</div>}
              {d && d.violations && d.violations.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--blood)', marginTop: 3 }}>
                  {d.violations.map(function (v, i) { return <div key={i}>⛔ {v.rule}: {v.detail}</div>; })}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)', marginTop: 2 }}>proposed by {p.submitter_name || 'a member'}{p.created_at ? ' · ' + new Date(p.created_at).toLocaleDateString() : ''}</div>
              {verified && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, color: 'var(--faded)' }}>tier</span>
                  <select value={tier} onChange={function (e) { const v = e.target.value; setTiers(function (t) { return Object.assign({}, t, { [p.id]: v }); }); }} style={inp}>
                    {PROP_TIERS.map(function (t) { return <option key={t} value={t}>{t}</option>; })}
                  </select>
                  <input value={notes[p.id] || ''} onChange={function (e) { noteFor(p.id, e.target.value); }} placeholder="decision note…" style={Object.assign({}, inp, { width: 160 })} />
                  <button onClick={function () { approve(p); }} disabled={busy || blocked} title={blocked ? 'The policy gate blocks this proposal' : 'Approve → promote into the record as a flagged contribution'} style={mini('var(--sea-green)', !blocked)}>Approve</button>
                  <button onClick={function () { reject(p); }} disabled={busy} style={mini('var(--blood)', true)}>Reject</button>
                </div>
              )}
            </div>
          );
        })}
        {loaded && pending.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>No proposals awaiting review. Run the ⚖ All-3 cross-check on an open line, then “Propose for review”.</div>}
      </div>

      {decided.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 9, borderTop: '1px dashed rgba(139,69,19,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 6 }}>Decided ({decided.length})</div>
          {decided.slice(0, 6).map(function (p) {
            return (
              <div key={p.id} style={{ fontSize: 11.5, color: 'var(--ink)', lineHeight: 1.45, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, color: p.status === 'approved' ? 'var(--sea-green)' : 'var(--blood)', textTransform: 'uppercase' }}>{p.status}</span>
                {p.final_evidence ? ' · ' + p.final_evidence : ''}{p.reviewer_name ? ' · ' + p.reviewer_name : ''} — {p.summary.length > 90 ? p.summary.slice(0, 90) + '…' : p.summary}
                {p.decision_note ? <span style={{ fontStyle: 'italic', color: 'var(--faded)' }}> ({p.decision_note})</span> : null}
              </div>
            );
          })}
        </div>
      )}
    </GovCard>
  );
}

function GovernancePanel({ personId, onSelect, member, verified }) {
  const audit = useMemo(function () {
    const people = DATA.people, ids = Object.keys(people);
    let pass = 0; const fails = [];
    ids.forEach(function (id) {
      const gen = people[id].generation, sub = MEM.access(id); let ok = true;
      ['individual', 'generational', 'family'].forEach(function (s) {
        (sub[s] || []).forEach(function (n) {
          if (n.generation != null && n.generation > gen + 1) ok = false;
          if (n.year != null && sub.horizonYear != null && n.year > sub.horizonYear) ok = false;
        });
      });
      if (ok) pass++; else fails.push(id);
    });
    const tiers = {}; ids.forEach(function (id) { const t = gTierOf(id); tiers[t] = (tiers[t] || 0) + 1; });
    const seen = {}, quarantine = [];
    (MEM.nodes || []).forEach(function (n) {
      if ((n.evidence === 'disproven' || n.evidence === 'eliminated') && n.text) {
        const k = (n.ownerId || '') + '|' + n.text.slice(0, 28);
        if (!seen[k]) { seen[k] = 1; quarantine.push({ owner: n.ownerId, text: n.text, tier: n.evidence }); }
      }
    });
    const gaps = (MEM.nodes || []).filter(function (n) { return n.kind === 'gap'; }).length;
    let sources = 0; ids.forEach(function (id) { sources += (people[id].sources || []).length; });
    // structural invariants the meta-governor attests over (same checks the build enforces)
    let refDangling = 0;
    ids.forEach(function (id) {
      ['parents', 'children', 'spouse', 'siblings'].forEach(function (rel) {
        (people[id][rel] || []).forEach(function (rid) { if (!people[rid]) refDangling++; });
      });
    });
    const banned = /digswell|elizabeth alcott|church warden|virginia land company/i;
    let quarantineLeak = 0;
    (MEM.nodes || []).forEach(function (n) {
      if (banned.test(n.text || '') && ['confirmed', 'secondary', 'leading'].indexOf(n.evidence) !== -1) quarantineLeak++;
    });
    const watch = { flags: [], verify: [], thin: [], living: [] };
    ids.forEach(function (id) {
      const p = people[id], notes = p.notes || '', tags = p.tags || [], per = PERS.byId[id];
      if (/flag|do not merge|collision|conflat|chronolog|⚠/i.test(notes) || tags.indexOf('name-collision') !== -1) watch.flags.push(id);
      if (/verify|lead/i.test(notes) || ['possible', 'leading'].indexOf(p.evidence) !== -1) watch.verify.push(id);
      if (per && per.provenance && per.provenance.reconstructed) watch.thin.push(id);
      if (tags.indexOf('living') !== -1) watch.living.push(id);
    });
    return { pass: pass, total: ids.length, fails: fails, tiers: tiers, quarantine: quarantine, gaps: gaps, sources: sources, watch: watch, refDangling: refDangling, quarantineLeak: quarantineLeak };
  }, []);
  const tierOrder = ['confirmed', 'secondary', 'leading', 'possible', 'unsolved', 'reconstructed', 'eliminated', 'disproven'];
  const sub = personId ? MEM.access(personId) : null;
  const selP = personId ? DATA.people[personId] : null;
  const held = audit.fails.length === 0;
  // one shared appeal load — feeds both the meta-governor's ruling check and the ledger
  const [appeals, setAppeals] = useState([]);
  const [appealsLoaded, setAppealsLoaded] = useState(false);
  function reloadAppeals() {
    if (!(window.CASON_AUTH && window.CASON_AUTH.enabled)) { setAppealsLoaded(true); return; }
    window.CASON_AUTH.loadAppeals().then(function (rows) { setAppeals(rows || []); setAppealsLoaded(true); }).catch(function () { setAppealsLoaded(true); });
  }
  useEffect(function () { reloadAppeals(); }, []);
  // the in-app approval queue
  const [proposals, setProposals] = useState([]);
  const [proposalsLoaded, setProposalsLoaded] = useState(false);
  function reloadProposals() {
    if (!(window.CASON_AUTH && window.CASON_AUTH.enabled)) { setProposalsLoaded(true); return; }
    window.CASON_AUTH.loadProposals().then(function (rows) { setProposals(rows || []); setProposalsLoaded(true); }).catch(function () { setProposalsLoaded(true); });
  }
  useEffect(function () { reloadProposals(); }, []);
  return (
    <div style={{ maxWidth: 780 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--ink)', marginBottom: 3 }}>Governance — the glass box</h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)', marginBottom: 18, maxWidth: 620 }}>The honest form of governance over the line: what each agent is allowed to know, how well every claim is sourced, and what the record refuses to repeat — computed live over all {audit.total} people, and enforced by the build.</p>

      <AgentsCard />

      <CuratorCard />

      <ReviewQueueCard member={member} verified={verified} proposals={proposals} loaded={proposalsLoaded} reload={reloadProposals} />

      <GovCard cap="Needs your eye — soft signals (won't fail the build, but worth watching)">
        <div style={{ marginBottom: audit.watch.flags.length ? 9 : 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--blood,#7a1f1f)' }}>⚠ Conflation risks · {audit.watch.flags.length}</div>
          <div style={{ fontSize: 11, color: 'var(--faded)', margin: '1px 0 5px' }}>same-name people that must not be merged, and flagged speculative links</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {audit.watch.flags.map(function (id) {
              return <span key={id} onClick={function () { onSelect && onSelect(id); }} style={{ cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(139,30,30,0.1)', color: 'var(--blood,#7a1f1f)', border: '1px solid rgba(139,30,30,0.25)' }}>{nm(id)}</span>;
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, marginTop: 8, color: 'var(--ink)' }}>
          <div>🔍 <strong>{audit.watch.verify.length}</strong> awaiting a primary record</div>
          <div>✎ <strong>{audit.watch.thin.length}</strong> story-in-progress</div>
          <div>👤 <strong>{audit.watch.living.length}</strong> living, in the public record</div>
        </div>
      </GovCard>

      <GovCard cap="Knowledge-horizon circuit-breaker">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 26 }}>{held ? '🛡️' : '⚠️'}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: held ? 'var(--sea-green)' : 'var(--blood)' }}>{held ? 'Holding' : audit.fails.length + ' breached'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5 }}>{audit.pass}/{audit.total} personas bounded to generations ≤ N+1 and nothing past their own year. No agent can see the future.</div>
          </div>
        </div>
      </GovCard>

      <MetaGovCard audit={audit} appeals={appeals} />

      <GovCard cap="Provenance tiers — trust in the record, not in behavior">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tierOrder.filter(function (t) { return audit.tiers[t]; }).map(function (t) {
            const n = audit.tiers[t], pct = Math.round(n / audit.total * 100);
            return (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 100, fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink)' }}>{t}</div>
                <div style={{ flex: 1, height: 11, background: 'rgba(139,69,19,0.08)', borderRadius: 6, overflow: 'hidden' }}><div style={{ width: Math.max(2, pct) + '%', height: '100%', background: GTIER[t] || 'var(--faded)' }} /></div>
                <div style={{ width: 28, textAlign: 'right', fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)' }}>{n}</div>
              </div>
            );
          })}
        </div>
      </GovCard>

      <GovCard cap={'Quarantine — claims the record refuses (' + audit.quarantine.length + ')'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {audit.quarantine.slice(0, 6).map(function (q, i) {
            return (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--ink)', borderLeft: '3px solid var(--blood)', paddingLeft: 9 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, color: 'var(--blood)', textTransform: 'uppercase' }}>{q.tier}</span>{q.owner ? ' · ' + nm(q.owner) : ''}<br />{q.text.length > 160 ? q.text.slice(0, 160) + '…' : q.text}
              </div>
            );
          })}
          {audit.quarantine.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>Nothing quarantined.</div>}
        </div>
      </GovCard>

      <SupersessionCard />

      <AuditTraceCard />

      <ContestationCard personId={personId} member={member} verified={verified} quarantine={audit.quarantine} appeals={appeals} loaded={appealsLoaded} reload={reloadAppeals} />

      <GovCard cap="Audit & open threads">
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', fontSize: 13, alignItems: 'baseline' }}>
          <div><strong style={{ fontSize: 19, color: 'var(--sea-green)' }}>{audit.sources}</strong> sources on record</div>
          <div><strong style={{ fontSize: 19, color: 'var(--rust)' }}>{audit.gaps}</strong> open questions</div>
          <div><a href="/proof" style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5 }}>the Proof →</a></div>
        </div>
      </GovCard>

      {sub && selP ? (
        <GovCard cap="Governed agent">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{selP.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '7px 0' }}>
            <GovBadge t={gTierOf(personId)} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: '#fff', background: 'var(--deep-blue)' }}>gen {selP.generation}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.55 }}>
            Bounded to generations ≤ <strong>{selP.generation + 1}</strong>, nothing past <strong>{sub.horizonYear || '—'}</strong>.<br />
            <strong>{sub.stats.visible}</strong> memories in reach · <strong>{sub.stats.blockedFuture + sub.stats.blockedGen}</strong> held beyond the horizon by the circuit-breaker.
          </div>
        </GovCard>
      ) : <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--faded)' }}>Select a person to see their governance record.</div>}
    </div>
  );
}

/* ---------- Seasonal refresh — the homestead re-themes & re-features with the calendar ---------- */
function SeasonCard({ onSelect, onResearch }) {
  const s = useMemo(function () { return window.CASON_SEASON ? window.CASON_SEASON.current() : null; }, []);
  if (!s) return null;
  const pill = { fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fff', background: s.accent, padding: '3px 9px', borderRadius: 20 };
  const link = { cursor: 'pointer', color: s.accent, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 };
  return (
    <div style={{ margin: '14px 22px 0', border: '1px solid ' + s.accent + '33', borderLeft: '4px solid ' + s.accent, borderRadius: 11, background: 'linear-gradient(180deg, ' + s.accent + '0d, transparent)', padding: '13px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{s.emoji}</span>
        <span style={pill}>{s.label} at the homestead</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, color: 'var(--ink)' }}>{s.theme}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.6 }}>
        {s.featured && (
          <div><strong>Featured this season:</strong>{' '}
            <span style={link} onClick={function () { onSelect && onSelect(s.featured.id); }}>{s.featured.name}</span>
            {s.featured.line ? <span style={{ color: 'var(--faded)' }}> — {s.featured.line}</span> : null}
          </div>
        )}
        {s.question && (
          <div><strong>The line is chasing:</strong>{' '}
            <span style={link} onClick={function () { onResearch && onResearch(s.question.ownerId, s.question.text); }} title="Research this open line with the consensus models">{s.question.name}</span>
            <span style={{ color: 'var(--faded)' }}> — {s.question.text.length > 120 ? s.question.text.slice(0, 120) + '…' : s.question.text}</span>
          </div>
        )}
      </div>
      {s.highlight && (
        <div style={{ marginTop: 7, fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.55, borderTop: '1px dashed ' + s.accent + '33', paddingTop: 7 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.accent }}>A record to remember{s.highlight.owner ? ' · ' + s.highlight.owner : ''}</span><br />
          {s.highlight.text}
        </div>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'baseline', fontSize: 11, color: 'var(--faded)' }}>
        <span>🔎 Where we’re digging: {s.archivalFocus}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'baseline' }}>
          <span>{s.stats.people} people · {s.stats.sources} sources · {s.stats.openLines} open lines</span>
          <code style={{ fontFamily: 'monospace', fontSize: 10.5, color: s.accent }}>{s.attest}</code>
        </span>
      </div>
    </div>
  );
}

/* ---------- The Desk — the command center: uploads, file sorting, the queue, all in-app ---------- */
const ART_KINDS = ['photo', 'document', 'letter', 'deed', 'census', 'will', 'map', 'other'];
const ART_TIERS = ['confirmed', 'secondary', 'leading', 'possible'];
function kindIcon(k) { return ({ photo: '🖼️', document: '📄', letter: '✉️', deed: '📜', census: '🗒️', will: '⚖️', map: '🗺️' })[k] || '📎'; }

function UploadsCard({ artifacts, loaded, verified, member, onSelect, reload }) {
  const enabled = !!(window.CASON_AUTH && window.CASON_AUTH.enabled);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [pid, setPid] = useState('');
  const [kind, setKind] = useState('photo');
  const [tier, setTier] = useState('possible');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  // sorting controls
  const [fKind, setFKind] = useState('');
  const [fPid, setFPid] = useState('');
  const [fTier, setFTier] = useState('');
  const [sortBy, setSortBy] = useState('new');
  const [groupBy, setGroupBy] = useState('none');

  const people = useMemo(function () { return Object.keys(DATA.people).map(function (id) { return { id: id, name: DATA.people[id].name }; }).sort(function (a, b) { return a.name.localeCompare(b.name); }); }, []);
  const inp = { fontFamily: 'var(--font-serif)', fontSize: 12, padding: '5px 8px', border: '1px solid rgba(139,69,19,0.25)', borderRadius: 7, background: '#fff', color: 'var(--ink)' };
  const lbl = { fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--faded)' };

  function submit() {
    if (!file) { setMsg('Choose a file first.'); return; }
    setBusy(true); setMsg('Uploading…');
    window.CASON_AUTH.uploadArtifact(file, { personId: pid || null, title: title || file.name, kind: kind, evidence: tier, note: note || null })
      .then(function () { setMsg('Uploaded — sorted into the gallery.'); setFile(null); setTitle(''); setNote(''); setOpen(false); reload && reload(); })
      .catch(function (e) { setMsg('Could not upload: ' + (e && e.message || e)); })
      .then(function () { setBusy(false); });
  }

  let list = (artifacts || []).slice();
  if (fKind) list = list.filter(function (a) { return (a.kind || 'document') === fKind; });
  if (fPid) list = list.filter(function (a) { return a.person_id === fPid; });
  if (fTier) list = list.filter(function (a) { return (a.evidence || 'possible') === fTier; });
  const sorters = {
    new: function (a, b) { return new Date(b.created_at || 0) - new Date(a.created_at || 0); },
    old: function (a, b) { return new Date(a.created_at || 0) - new Date(b.created_at || 0); },
    person: function (a, b) { return nm(a.person_id || 'zz').localeCompare(nm(b.person_id || 'zz')); },
    kind: function (a, b) { return (a.kind || '').localeCompare(b.kind || ''); },
    tier: function (a, b) { return ART_TIERS.indexOf(a.evidence) - ART_TIERS.indexOf(b.evidence); },
  };
  list.sort(sorters[sortBy] || sorters.new);
  let groups;
  if (groupBy === 'none') groups = [{ key: '', items: list }];
  else {
    const m = {};
    list.forEach(function (a) { const k = groupBy === 'person' ? (a.person_id ? nm(a.person_id) : '— unattached') : groupBy === 'kind' ? (a.kind || 'document') : (a.evidence || 'possible'); (m[k] = m[k] || []).push(a); });
    groups = Object.keys(m).sort().map(function (k) { return { key: k, items: m[k] }; });
  }
  const sel = { fontFamily: 'var(--font-sans)', fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid rgba(139,69,19,0.22)', background: '#fff', color: 'var(--ink)' };

  return (
    <GovCard cap={'Uploads & evidence — your files, sorted (' + (artifacts || []).length + ')'}>
      <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 10 }}>
        Photos, letters, deeds, census pages, wills — uploaded here and <strong>attached to a person and a tier</strong>, then filtered, sorted and grouped. A real document is real provenance: it can back a proposal and lift it past what a model alone could claim.
      </div>

      {enabled && verified ? (
        <div style={{ marginBottom: 12 }}>
          {!open && <button onClick={function () { setOpen(true); setMsg(''); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--deep-blue)', background: 'var(--deep-blue)', color: '#fff', cursor: 'pointer' }}>＋ Upload a file</button>}
          {open && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', background: '#fff', border: '1px solid rgba(139,69,19,0.2)', borderRadius: 9, padding: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={lbl}>file</span><input type="file" onChange={function (e) { setFile(e.target.files && e.target.files[0]); }} style={{ fontSize: 11 }} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={lbl}>title</span><input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder="what is it?" style={inp} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={lbl}>person</span>
                <select value={pid} onChange={function (e) { setPid(e.target.value); }} style={inp}><option value="">— unattached</option>{people.map(function (p) { return <option key={p.id} value={p.id}>{p.name}</option>; })}</select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={lbl}>kind</span>
                <select value={kind} onChange={function (e) { setKind(e.target.value); }} style={inp}>{ART_KINDS.map(function (k) { return <option key={k} value={k}>{k}</option>; })}</select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><span style={lbl}>tier</span>
                <select value={tier} onChange={function (e) { setTier(e.target.value); }} style={inp}>{ART_TIERS.map(function (t) { return <option key={t} value={t}>{t}</option>; })}</select>
              </div>
              <button onClick={submit} disabled={busy} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--sea-green)', color: '#fff', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>Upload</button>
              <button onClick={function () { setOpen(false); setMsg(''); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(139,69,19,0.25)', background: 'transparent', color: 'var(--faded)', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
      ) : <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12, marginBottom: 12 }}>{enabled ? 'Verified family members can upload evidence — sign in (Narrator → family email).' : 'Connect the family backend to upload evidence.'}</div>}

      {msg && <div style={{ fontSize: 11.5, color: /Could not|first/.test(msg) ? 'var(--blood)' : 'var(--sea-green)', marginBottom: 8 }}>{msg}</div>}

      {/* sorting controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 10, fontSize: 11, color: 'var(--faded)' }}>
        <span style={lbl}>sort</span>
        <select value={fKind} onChange={function (e) { setFKind(e.target.value); }} style={sel}><option value="">all kinds</option>{ART_KINDS.map(function (k) { return <option key={k} value={k}>{k}</option>; })}</select>
        <select value={fTier} onChange={function (e) { setFTier(e.target.value); }} style={sel}><option value="">all tiers</option>{ART_TIERS.map(function (t) { return <option key={t} value={t}>{t}</option>; })}</select>
        <select value={fPid} onChange={function (e) { setFPid(e.target.value); }} style={sel}><option value="">all people</option>{people.map(function (p) { return <option key={p.id} value={p.id}>{p.name}</option>; })}</select>
        <select value={sortBy} onChange={function (e) { setSortBy(e.target.value); }} style={sel}><option value="new">newest</option><option value="old">oldest</option><option value="person">by person</option><option value="kind">by kind</option><option value="tier">by tier</option></select>
        <select value={groupBy} onChange={function (e) { setGroupBy(e.target.value); }} style={sel}><option value="none">no grouping</option><option value="person">group: person</option><option value="kind">group: kind</option><option value="tier">group: tier</option></select>
        <span style={{ marginLeft: 'auto' }}>{list.length} shown</span>
      </div>

      {groups.map(function (g) {
        return (
          <div key={g.key || 'all'} style={{ marginBottom: g.key ? 10 : 0 }}>
            {g.key && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, color: 'var(--rust)', margin: '4px 0' }}>{g.key} · {g.items.length}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {g.items.map(function (a) {
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 9, alignItems: 'center', padding: '5px 8px', background: '#fff', border: '1px solid rgba(139,69,19,0.14)', borderRadius: 8 }}>
                    <span style={{ fontSize: 16 }}>{kindIcon(a.kind)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)' }}>{a.title || a.kind}</a> : (a.title || a.kind)}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--faded)' }}>
                        {a.person_id ? <span onClick={function () { onSelect && onSelect(a.person_id); }} style={{ cursor: 'pointer', color: 'var(--deep-blue)' }}>{nm(a.person_id)}</span> : 'unattached'}
                        {' · ' + (a.kind || 'document')}{a.author_name ? ' · ' + a.author_name : ''}{a.created_at ? ' · ' + new Date(a.created_at).toLocaleDateString() : ''}
                      </div>
                    </div>
                    <GovBadge t={a.evidence || 'possible'} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {loaded && list.length === 0 && <div style={{ fontStyle: 'italic', color: 'var(--faded)', fontSize: 12 }}>{(artifacts || []).length ? 'No files match these filters.' : 'No evidence uploaded yet.'}</div>}
    </GovCard>
  );
}

function DeskView({ verified, member, onSelect, onResearch, onGoto }) {
  const enabled = !!(window.CASON_AUTH && window.CASON_AUTH.enabled);
  const [proposals, setProposals] = useState([]);
  const [pLoaded, setPLoaded] = useState(false);
  const [appeals, setAppeals] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [aLoaded, setALoaded] = useState(false);
  function reloadProposals() { if (!enabled) { setPLoaded(true); return; } window.CASON_AUTH.loadProposals().then(function (r) { setProposals(r || []); setPLoaded(true); }).catch(function () { setPLoaded(true); }); }
  function reloadArtifacts() { if (!enabled) { setALoaded(true); return; } window.CASON_AUTH.loadArtifacts().then(function (r) { setArtifacts(r || []); setALoaded(true); }).catch(function () { setALoaded(true); }); }
  function reloadAppeals() { if (!enabled) return; window.CASON_AUTH.loadAppeals().then(function (r) { setAppeals(r || []); }).catch(function () {}); }
  useEffect(function () { reloadProposals(); reloadArtifacts(); reloadAppeals(); }, []);

  const openLines = useMemo(function () { return (MEM.nodes || []).filter(function (n) { return n.kind === 'gap'; }); }, []);
  const pending = proposals.filter(function (p) { return p.status === 'pending'; });
  const openAppeals = appeals.filter(function (a) { return a.status === 'under_review'; });
  const topLines = useMemo(function () {
    return openLines.slice().sort(function (a, b) { return (b.evidence === 'possible' ? 1 : 0) - (a.evidence === 'possible' ? 1 : 0); }).slice(0, 5);
  }, [openLines.length]);

  function Chip(p) {
    return (
      <div onClick={p.onClick} style={{ cursor: p.onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 7, background: 'var(--cream,#faf6f0)', border: '1px solid rgba(139,69,19,0.16)', borderRadius: 10, padding: '8px 13px' }}>
        <span style={{ fontSize: 17 }}>{p.icon}</span>
        <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: p.color, lineHeight: 1 }}>{p.n}</div><div style={{ fontSize: 10.5, color: 'var(--faded)' }}>{p.label}</div></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px 60px', maxWidth: 840 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, color: 'var(--ink)', marginBottom: 3 }}>Your desk</h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faded)', marginBottom: 16, maxWidth: 640 }}>Everything in one place — the agents bring their findings here, you upload and sort the evidence, and you decide. No need to leave the page.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 18 }}>
        {Chip({ icon: '🗳️', n: pending.length, label: 'proposals to review', color: 'var(--gold-bright,#c8941f)' })}
        {Chip({ icon: '📎', n: (artifacts || []).length, label: 'evidence files', color: 'var(--sea-green)' })}
        {Chip({ icon: '🔎', n: openLines.length, label: 'open lines', color: 'var(--rust)' })}
        {Chip({ icon: '⚖️', n: openAppeals.length, label: 'appeals to rule', color: 'var(--deep-blue)', onClick: function () { onGoto && onGoto('gov'); } })}
      </div>

      <UploadsCard artifacts={artifacts} loaded={aLoaded} verified={verified} member={member} onSelect={onSelect} reload={reloadArtifacts} />

      <ReviewQueueCard member={member} verified={verified} proposals={proposals} loaded={pLoaded} reload={reloadProposals} />

      <GovCard cap="Open lines — research one, then propose it">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {topLines.map(function (n, i) {
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <button onClick={function () { onResearch && onResearch(n.ownerId, n.text); }} style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 7, border: '1px solid var(--rust)', background: 'transparent', color: 'var(--rust)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Research</button>
                <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.45 }}><strong>{nm(n.ownerId)}</strong> — {n.text.length > 120 ? n.text.slice(0, 120) + '…' : n.text}</div>
              </div>
            );
          })}
        </div>
      </GovCard>
    </div>
  );
}

function LivingWorld() {
  const [stageId, setStageId] = useState('fl');
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('homestead');
  const [live, setLive] = useState(false);
  const [threeD, setThreeD] = useState(false);
  const [sceneErr, setSceneErr] = useState(null);
  const vp = useViewport();
  const narrow = vp.narrow;
  const [navOpen, setNavOpen] = useState(typeof window === 'undefined' ? true : window.innerWidth >= 860);
  const [memOpen, setMemOpen] = useState(true);
  const [pendingResearch, setPendingResearch] = useState(null);
  const [role, setRole] = useState(window.CASON_AUTH ? window.CASON_AUTH.getState() : { mode: 'narrator', enabled: false });
  const [showRole, setShowRole] = useState(false);
  const [authField, setAuthField] = useState('');
  const [chatFocus, setChatFocus] = useState(0);
  const [authMsg, setAuthMsg] = useState('');
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

  // (re)build the homestead world when the stage changes. Every village is
  // anchored to *today's* calendar day (in its own era's year), so the season,
  // weather and day/night all read as the same moment across the homesteads.
  useEffect(function () {
    const today = new Date();
    const w = ENG.createWorld({ year: stage.year, era: stage.era, placeId: stage.placeId, seed: stage.id, simDate: new Date(stage.year, today.getMonth(), today.getDate()), realClock: new Date(), roster: cohort });
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
      onSelect: function (id) { setSelectedId(id); setView('homestead'); setChatFocus(function (c) { return c + 1; }); },
    }).then(function (ctrl) { if (!alive) { ctrl.dispose(); return; } sceneCtrl.current = ctrl; if (ctrl.setAvatar) ctrl.setAvatar(isMember ? (role.name || 'You') : null); })
      .catch(function (e) { if (alive) setSceneErr('Could not load the 3-D world (' + (e && e.message) + ').'); });
    return function () { alive = false; if (sceneCtrl.current) { sceneCtrl.current.dispose(); sceneCtrl.current = null; } };
  }, [threeD, stageId]);

  useEffect(function () { if (threeD && sceneCtrl.current && snap) sceneCtrl.current.update(snap); });

  // roles — subscribe to auth, and pull shared (member) contributions into the graph
  useEffect(function () {
    if (!window.CASON_AUTH) return;
    const off = window.CASON_AUTH.onChange(function (s) { setRole(s); });
    if (window.CASON_AUTH.enabled && window.CASON_MEMORY && window.CASON_MEMORY.addUserMemory) {
      window.CASON_AUTH.loadContributions().then(function (recs) { recs.forEach(function (r) { window.CASON_MEMORY.addUserMemory(r); }); if (recs.length) rerender(); });
    }
    return off;
  }, []);

  const isMember = !!(role && role.mode === 'member');

  // embody / un-embody the member's avatar in the 3-D scene
  useEffect(function () {
    if (sceneCtrl.current && sceneCtrl.current.setAvatar) sceneCtrl.current.setAvatar(isMember ? (role.name || 'You') : null);
  }, [isMember, threeD, role.name]);

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
  function researchLine(id, q) { selectPerson(id); setPendingResearch({ personId: id, q: q }); }

  return (
    <div style={{ ...window.parchmentBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <AppHeader
        subtitle={narrow ? undefined : 'The Living Line'}
        right={
          <div style={{ display: 'flex', gap: narrow ? 4 : 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={function () { setShowRole(function (v) { return !v; }); }} style={tabBtn(isMember)} title="Your role">{isMember ? '✦ ' + String(role.name || 'Member').split(' ')[0] : 'Narrator'}</button>
            {[['homestead', narrow ? 'Home' : 'Homestead'], ['desk', 'Desk'], ['day', narrow ? 'Day' : 'A Day Here'], ['people', 'People'], ['lines', narrow ? 'Lines' : 'Open lines'], ['hearth', narrow ? 'Hearth' : 'Memory Hearth'], ['arc', narrow ? 'Arc' : 'The Long Move'], ['gov', narrow ? 'Gov' : 'Governance']].map(function (v) {
              return <button key={v[0]} onClick={function () { setView(v[0]); }} style={tabBtn(view === v[0])}>{v[1]}</button>;
            })}
            {!narrow && <a href="/dashboard" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--gold-bright)', textDecoration: 'none', marginLeft: 4 }}>↗ tree</a>}
          </div>
        }
      />

      {showRole && (
        <div style={{ borderBottom: '1px solid rgba(139,69,19,0.15)', background: 'var(--cream)', padding: '12px 22px' }}>
          <RoleControls role={role} field={authField} setField={setAuthField} msg={authMsg}
            onSignIn={function () { setAuthMsg('Sending…'); window.CASON_AUTH.signIn(authField).then(function () { setAuthMsg('Check your email for a sign-in link.'); }).catch(function (e) { setAuthMsg('Error: ' + (e && e.message || e)); }); }}
            onPreview={function () { window.CASON_AUTH.previewMember(authField); setShowRole(false); }}
            onSignOut={function () { window.CASON_AUTH.signOut(); }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: narrow ? 'column' : 'row', minHeight: 0 }}>
        {/* navigator column (collapsible) */}
        {navOpen ? (
        <div style={{ width: narrow ? 'auto' : 340, flexShrink: 0, borderRight: narrow ? 'none' : '1px solid rgba(139,69,19,0.12)', borderBottom: narrow ? '1px solid rgba(139,69,19,0.12)' : 'none', display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: narrow ? 360 : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid rgba(139,69,19,0.1)' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--faded)' }}>Map &amp; feed</span>
            <button onClick={function () { setNavOpen(false); }} style={ctlBtn(false)}>‹ hide</button>
          </div>
          <div style={{ height: narrow ? 180 : 250, flexShrink: 0, borderBottom: '1px solid rgba(139,69,19,0.12)' }}>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 20px', maxHeight: narrow ? 150 : 'none' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)', marginBottom: 8 }}>Watch them live</div>
            <LiveFeed feed={feed} />
          </div>
        </div>
        ) : (
          <button onClick={function () { setNavOpen(true); }} style={{ ...ctlBtn(false), margin: narrow ? '6px 10px' : 8, alignSelf: 'flex-start' }}>☰ Map &amp; feed</button>
        )}

        {/* main pane */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {view === 'people' && (
            <div style={{ padding: '20px 24px 60px' }}>
              <PopulationGraph />
              <PeopleExplorer onSelect={selectPerson} />
            </div>
          )}

          {view === 'day' && (
            <div style={{ padding: '20px 24px 60px' }}>
              <DayHere world={world} stage={stage} onSelect={selectPerson} />
            </div>
          )}

          {view === 'arc' && (
            <div style={{ padding: '20px 24px 60px' }}>
              <LongMove onSelect={selectPerson} />
            </div>
          )}

          {view === 'gov' && (
            <div style={{ padding: '20px 24px 60px' }}>
              <GovernancePanel personId={sel} onSelect={selectPerson} member={isMember ? role.name : null} verified={!!role.verified} />
            </div>
          )}

          {view === 'desk' && (
            <DeskView verified={!!role.verified} member={isMember ? role.name : null} onSelect={selectPerson} onResearch={researchLine} onGoto={setView} />
          )}

          {view === 'lines' && (
            <div style={{ padding: '20px 24px 60px', maxWidth: 720 }}>
              <OpenLines onSelect={selectPerson} onResearch={researchLine} />
            </div>
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
              <SeasonCard onSelect={selectPerson} onResearch={researchLine} />
              {threeD && (
                <div style={{ padding: '14px 22px 0' }}>
                  <div ref={sceneHost} style={{ width: '100%', height: 440, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(139,69,19,0.2)', background: '#dfe6ee', position: 'relative' }}>
                    {sceneErr && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--faded)' }}>{sceneErr}</div>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--faded)', marginTop: 6 }}>{isMember ? 'You’re embodied ✦ — click the ground to walk your avatar. Drag to look, scroll to zoom, click a figure to meet them.' : 'Drag to look · scroll to zoom · click a figure to select them. You’re observing as narrator.'}</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: (narrow || !memOpen) ? 'column' : 'row', gap: 22, padding: '18px 22px 60px', minWidth: 0 }}>
                {/* cohort + detail */}
              <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: narrow ? 'none' : 470 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--faded)' }}>At this homestead · {cohort.length} living</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={function () { setMemOpen(function (v) { return !v; }); }} style={ctlBtn(memOpen)}>{memOpen ? 'Hide memory' : 'Show memory'}</button>
                    <button onClick={function () { setThreeD(function (v) { return !v; }); }} style={ctlBtn(threeD)}>{threeD ? 'Exit 3-D' : 'Enter 3-D ▸'}</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                  {cohort.map(function (id) { return <PersonNode key={id} person={DATA.people[id]} size="sm" selected={id === sel} onClick={function () { setSelectedId(id); }} />; })}
                </div>
                {sheet && person ? (
                  <PersonaDossier personId={sel} sheet={sheet} person={person} snap={snap} onSaved={rerender} member={isMember ? role.name : null} focusSignal={chatFocus} pending={pendingResearch && pendingResearch.personId === sel ? pendingResearch.q : null} onPendingConsumed={function () { setPendingResearch(null); }} />
                ) : <div style={{ color: 'var(--faded)', fontStyle: 'italic' }}>No one is recorded living here in {stage.year} yet.</div>}
              </div>
              {/* memory + trace */}
              {sheet && person && memOpen && (
                <div style={{ flex: '1 1 0', minWidth: narrow ? 0 : 300 }}>
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
