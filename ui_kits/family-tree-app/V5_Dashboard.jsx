/* Variant 5 — The Dashboard
   Four-tab research dashboard: Overview · Dossiers · Methodology · Brick Walls.
   The 11-category dossier framework structures evidence for every person.
   Strict: uses the corrected (post-audit) anchor facts and surfaces the
   quarantine list in Methodology. No emoji — typographic glyphs only. */

const DASHBOARD_TABS = [
  { id: 'overview',    label: 'Migration & Overview' },
  { id: 'dossiers',    label: 'Broad Tree & Dossiers' },
  { id: 'methodology', label: 'Methodology & Rules' },
  { id: 'brickwalls',  label: 'Research Plan & Brick Walls' },
];

/* The 11 record categories that constitute a complete dossier per person. */
const DOSSIER_CATEGORIES = [
  { id: 'vital',    glyph: '§', name: 'Vital Records',        desc: 'Baptism, marriage, death, burial' },
  { id: 'land',     glyph: '¶', name: 'Land Records',         desc: 'Patents, grants, deeds, quitrents' },
  { id: 'probate',  glyph: '†', name: 'Wills & Probates',     desc: 'Will text, executors, inventory' },
  { id: 'cargo',    glyph: '~', name: 'Cargo & Migration',    desc: 'Manifests, headrights, port books' },
  { id: 'military', glyph: '✶', name: 'Military Records',     desc: 'Militia, Revolutionary, Civil War, pensions' },
  { id: 'census',   glyph: '#', name: 'Census Enumerations',  desc: 'Federal (1790–1950), state, slave schedules' },
  { id: 'tax',      glyph: '$', name: 'Tax & Civil Lists',    desc: 'Tithables, property tax, poll lists' },
  { id: 'eccles',   glyph: '✚', name: 'Ecclesiastical',       desc: 'Parish, vestry books, Baptist minutes' },
  { id: 'court',    glyph: '⚖', name: 'Court Records',        desc: 'Order books, chancery suits, bonds' },
  { id: 'dna',      glyph: '∞', name: 'DNA & FAN Cluster',    desc: 'Y-DNA, autosomal, friends/associates/neighbors' },
  { id: 'news',     glyph: '◫', name: 'Newspapers & Print',   desc: 'Obituaries, notices, runaway ads' },
];

/* Hand-curated evidence-by-category map for our key spine people.
   Derived from the cason-heritage source narrative and the audit corrections.
   Each entry is one line per record set, with primary/derivative tier. */
const PERSON_DOSSIERS = {
  'thomas-sr': {
    vital:    { tier: 'derivative', text: 'Birth ~1604 from 1642 deposition age 38. PRIMARY origin unknown.' },
    land:     { tier: 'primary',    text: '1641 patent (Elizabeth City Co.), 100 ac via wife\'s dower as relict of William Leighton.' },
    probate:  { tier: 'primary',    text: 'Letters of administration 15 Apr 1652 to widow Elizabeth. Inventory 26 Jun 1652: 28,170 lbs tobacco.' },
    cargo:    { tier: 'primary',    text: 'Headright of Capt. Thomas Harwood, VA Patent Book 1 p.124, 7 July 1635.' },
    military: { tier: 'missing',    text: 'No muster roll located. 1630s VA militia records fragmentary.' },
    census:   { tier: 'missing',    text: 'Pre-census.' },
    tax:      { tier: 'derivative', text: 'Implicit in tithables system; not directly enumerated in surviving fragments.' },
    eccles:   { tier: 'disputed',   text: 'Derivative claim of "Church Warden, Lynnhaven Parish" — not located in primary vestry books. DISCARD.' },
    court:    { tier: 'primary',    text: 'Lower Norfolk Order Books 1640–1651: executor for Ralph Clarke (1640), inventory of Wm. Layton orphans (1645), inventory of James Clarke (1645), purchases from John Moye estate (1646).' },
    dna:      { tier: 'pending',    text: 'Y-DNA project: requires confirmed male-line descendants to anchor haplogroup.' },
    news:     { tier: 'missing',    text: 'Pre-newspaper era for Lower Norfolk Co.' },
  },
  'james-orphan': {
    vital:    { tier: 'derivative', text: 'Born 1655 Lynnhaven Parish (compiled from family-line reconstructions).' },
    land:     { tier: 'primary',    text: 'Probate establishes 300+ ac in Princess Anne Co.' },
    probate:  { tier: 'primary',    text: 'Will Book 3 p.448 — executed 5 Feb 1720, probated 1 Aug 1722. Names sons Thomas, William, James + daughters Elizabeth Whitehurst, Susannah Moore, Dynah Wilber.' },
    cargo:    { tier: 'na',         text: 'Born in colony.' },
    military: { tier: 'missing',    text: 'No surviving militia rolls for this individual.' },
    census:   { tier: 'derivative', text: '1704 Virginia Quit Rent Rolls list a James Cason in Princess Anne.' },
    tax:      { tier: 'primary',    text: 'Quit-rent compliance through 1704 rolls.' },
    eccles:   { tier: 'missing',    text: 'Lynnhaven Parish vestry books partial.' },
    court:    { tier: 'derivative', text: 'Lower Norfolk / Princess Anne court records reference his guardianship as orphan c.1665–1670.' },
    dna:      { tier: 'pending',    text: 'Funnel point — all surviving Cason DNA descends through his sons.' },
    news:     { tier: 'na',         text: 'Pre-newspaper.' },
  },
  'william-1695': {
    vital:    { tier: 'derivative', text: 'Born c.1691–95 Princess Anne Co. VA. Died 1 July 1764 Pitt Co. NC.' },
    land:     { tier: 'primary',    text: '1721 marriage settlement (Beaufort Co. NC). 1740 land grant. 1758 deed of gift naming sons Henry, Hillery, dau. Elizabeth.' },
    probate:  { tier: 'derivative', text: 'Will not located in primary form; 1758 deed of gift functions as estate distribution.' },
    cargo:    { tier: 'na',         text: 'Intra-colonial migration VA→NC, 1723.' },
    military: { tier: 'missing',    text: 'Pre-Revolution. Local NC frontier militia rosters incomplete.' },
    census:   { tier: 'primary',    text: '1746 NC tax list: 9 in household.' },
    tax:      { tier: 'primary',    text: 'Pitt Co. NC tax lists 1740–1760.' },
    eccles:   { tier: 'circumstantial', text: 'Transition from VA Anglican to NC frontier Baptist (typical for the family\'s arc).' },
    court:    { tier: 'derivative', text: 'Pitt Co. court order books referenced in derivative compilations.' },
    dna:      { tier: 'pending',    text: 'Critical node for resolving Gen 5 hole.' },
    news:     { tier: 'na',         text: 'Pre-newspaper.' },
  },
  'james-1727': {
    vital:    { tier: 'missing',    text: 'No baptism, marriage, or burial record located.' },
    land:     { tier: 'missing',    text: 'No land records found — basis for "landless = reason to leave" inference.' },
    probate:  { tier: 'missing',    text: 'No will or estate file located.' },
    cargo:    { tier: 'na',         text: 'Native-born.' },
    military: { tier: 'missing',    text: 'No service record located.' },
    census:   { tier: 'missing',    text: 'Pre-1790 federal; 1790 census silent.' },
    tax:      { tier: 'missing',    text: 'NOT FOUND in Pitt Co. tax lists 1750–1775 (negative result, targeted search).' },
    eccles:   { tier: 'missing',    text: '—' },
    court:    { tier: 'missing',    text: 'No deeds, suits, or bonds located.' },
    dna:      { tier: 'pending',    text: 'CRITICAL — Y-DNA triangulation across William\u2074\'s six sons\' lines is the resolution path.' },
    news:     { tier: 'na',         text: 'Pre-newspaper.' },
  },
  'ransom-sr': {
    vital:    { tier: 'derivative', text: 'Born c.1763 Pitt Co. NC. Died 1853 Alachua Co. FL at ~90.' },
    land:     { tier: 'primary',    text: 'Glynn Co. GA Book 6 ff.66 & 71 — 200 ac Turtle River + 200 ac Beaver Dam Swamp, 1799.' },
    probate:  { tier: 'primary',    text: 'Alachua Co. FL Will Book A pp.35–36. Probated 12 Nov 1853.' },
    cargo:    { tier: 'na',         text: 'Intra-American.' },
    military: { tier: 'circumstantial', text: 'Second Seminole War era — son Moses survived 1842 attack; nephew William served as Capt. FL Militia.' },
    census:   { tier: 'primary',    text: '1830 census near son John and son-in-law King Douglas; 1840 census "Fort Harttee" Santa Fe River.' },
    tax:      { tier: 'primary',    text: '1794 Glynn Co. GA tax digest.' },
    eccles:   { tier: 'circumstantial', text: 'Primitive Baptist tradition in surrounding settlements.' },
    court:    { tier: 'primary',    text: '1822 power of attorney to son William (Munro Co. GA); Cherokee Lottery land sales (Houston Co.).' },
    dna:      { tier: 'pending',    text: 'Anchor for the Florida spine.' },
    news:     { tier: 'derivative', text: 'FL Pioneer Cert. #2015S0027 (FSGS) — recognition, not contemporary press.' },
  },
  'ransom-2': {
    vital:    { tier: 'primary',    text: 'Born 1835 Alachua Co.; died 29 Jul 1900; buried N. Pleasant Grove Cemetery.' },
    land:     { tier: 'derivative', text: 'Family land holdings inherited via James Green.' },
    probate:  { tier: 'pending',    text: 'Alachua Co. probate file not yet examined.' },
    cargo:    { tier: 'na',         text: '—' },
    military: { tier: 'primary',    text: 'Lt., 7th FL Infantry, Co. mustered Gainesville Apr 1862. Chickamauga, Missionary Ridge, Atlanta campaign, Franklin, Nashville, Bentonville. Surrendered Bennett Place 26 Apr 1865.' },
    census:   { tier: 'primary',    text: '1850, 1860, 1870, 1880, 1900 federal census, Alachua Co.' },
    tax:      { tier: 'pending',    text: 'FL state tax rolls accessible.' },
    eccles:   { tier: 'derivative', text: 'Local Baptist church records — partial.' },
    court:    { tier: 'pending',    text: 'Alachua Co. order books not yet examined for postwar matters.' },
    dna:      { tier: 'pending',    text: '—' },
    news:     { tier: 'primary',    text: 'Confederate Veterans Pension Application A00841, Florida Memory.' },
  },
};

/* Tier visual treatment. */
const TIER_STYLE = {
  primary:        { color: 'var(--sea-green)', label: 'PRIMARY' },
  derivative:     { color: 'var(--gold)',      label: 'DERIVATIVE' },
  circumstantial: { color: 'var(--faded)',     label: 'CIRCUMSTANTIAL' },
  disputed:       { color: 'var(--blood)',     label: 'DISPUTED' },
  missing:        { color: 'var(--rust)',      label: 'MISSING' },
  pending:        { color: 'var(--ink)',       label: 'PENDING' },
  na:             { color: 'rgba(0,0,0,0.25)', label: 'N/A' },
};

const DashboardView = () => {
  const data = window.CASON_DATA;
  const [tab, setTab] = React.useState('dossiers');
  const [personId, setPersonId] = React.useState('thomas-sr');
  const person = data.people[personId];

  return (
    <div style={{ ...parchmentBg, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader subtitle="The Dashboard · research operating system" right={<>
        <HeaderButton>Export CSV</HeaderButton>
        <HeaderButton primary>Run audit</HeaderButton>
      </>}/>

      {/* Tab bar */}
      <div style={{
        background: 'var(--cream)',
        borderBottom: '1px solid rgba(139,69,19,0.15)',
        display: 'flex',
        padding: '0 22px',
        flexShrink: 0,
      }}>
        {DASHBOARD_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12.5, fontWeight: tab === t.id ? 700 : 500,
              padding: '14px 18px',
              border: 'none', background: 'transparent',
              color: tab === t.id ? 'var(--rust)' : 'var(--faded)',
              borderBottom: tab === t.id ? '3px solid var(--rust)' : '3px solid transparent',
              cursor: 'pointer', letterSpacing: '0.02em',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'overview'    && <OverviewPane data={data} />}
        {tab === 'dossiers'    && <DossierPane data={data} personId={personId} setPersonId={setPersonId} person={person} />}
        {tab === 'methodology' && <MethodologyPane />}
        {tab === 'brickwalls'  && <BrickWallsPane />}
      </div>
    </div>
  );
};

/* ── OVERVIEW ── */
const OverviewPane = ({ data }) => {
  const milestones = [
    { year: '1604', label: 'Birth, England (origin unproven)', who: 'Thomas Casson' },
    { year: '1635', label: 'Headright of Capt. Thomas Harwood', who: 'arrives Virginia' },
    { year: '1651', label: 'Dies Lower Norfolk Co., VA', who: '28,170 lbs tobacco' },
    { year: '1722', label: 'James the orphan dies', who: 'will probated, Princess Anne' },
    { year: '1723', label: 'William\u2074 moves family to NC', who: 'Beaufort/Pitt Co.' },
    { year: '~1750s', label: 'GEN 5 GAP — unfilled', who: 'load-bearing weakness' },
    { year: '1823', label: 'Ransom Sr. walks into Florida', who: 'at age 60, eight children' },
    { year: '1862', label: 'Lt. Ransom 2 musters at Gainesville', who: '7th FL Infantry CSA' },
    { year: '1957', label: 'Robert Sr. moves to Titusville', who: 'Space Coast era' },
  ];

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--gold)', marginBottom: 4,
        }}>The Cason Line — Audit-corrected anchor</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
          color: 'var(--ink)', lineHeight: 1.15,
        }}>~12 generations · c.1604 → present · England → Virginia → North Carolina → Florida</h2>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: 13.5, color: 'var(--faded)',
          marginTop: 6, fontStyle: 'italic', maxWidth: 760, lineHeight: 1.55,
        }}>The "11 generations" tradition is folklore — the math demands ~12 and the Gen 5 slot is the hole. Everything downstream of Ransom Sr. (c.1763) is anchored independently and inherits zero risk from the unproven English origin.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Confirmed anchor strip */}
        <div style={{ background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.15)', borderRadius: 10, padding: 16 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--sea-green)', marginBottom: 10,
          }}>· Verified anchor facts</div>
          {[
            'Thomas Casson, headright of Capt. Thomas Harwood (Patent Book 1 p.124, 7 Jul 1635)',
            'Birth ~1604 (1642 deposition, age 38)',
            'm. Elizabeth (Keeling) Leighton, widow of William Leighton',
            'd. 1651; estate 28,170 lbs tobacco',
            'James the orphan, b.1655, will Princess Anne 1722 (Will Book 3 p.448)',
            'William\u2074, m. Jane Cannon 1721; 1758 deed of gift to Henry, Hillery, Elizabeth',
            'Ransom Sr., FL Pioneer Cert. #2015S0027; Alachua Will Book A pp.35–36',
            'Lt. Ransom 2, 7th FL Infantry CSA, Pension A00841',
          ].map((f, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-serif)', fontSize: 12.5,
              color: 'var(--ink)', padding: '4px 0', lineHeight: 1.5,
              borderBottom: i < 7 ? '1px solid rgba(139,69,19,0.08)' : 'none',
            }}>· {f}</div>
          ))}
        </div>

        {/* Quarantined claims */}
        <div style={{ background: 'rgba(107,29,29,0.04)', border: '1px solid var(--blood)', borderRadius: 10, padding: 16 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'var(--blood)', marginBottom: 10,
          }}>× Disproven · do not propagate</div>
          {[
            'Digswell, Hertfordshire 1608 baptism',
            '"Son of John Cason" (no Digswell John located)',
            'John Cason "stockholder, Virginia Land Company" (no such company)',
            '~1629 crossing (outside Hotten window, contradicted by 1635 headright)',
            'Birth year 1608 (use ~1604)',
            'Wife "Elizabeth Alcott" (was Elizabeth (Keeling) Leighton)',
            '"Church Warden, Lynnhaven Parish" for Thomas Sr.',
            '"Eleven generations" as a hard count (use ~12)',
            'Steeple Morden, Cambridgeshire fallback origin',
          ].map((f, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-serif)', fontSize: 12.5,
              color: 'var(--ink)', padding: '4px 0', lineHeight: 1.5,
              textDecoration: 'line-through', textDecorationColor: 'rgba(107,29,29,0.4)',
              borderBottom: i < 8 ? '1px solid rgba(107,29,29,0.08)' : 'none',
            }}>× {f}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18, background: 'var(--cream)', border: '1px solid rgba(139,69,19,0.15)', borderRadius: 10, padding: 16 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--gold)', marginBottom: 12,
        }}>Milestone timeline</div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 6 }}>
          {milestones.map((m, i) => (
            <div key={i} style={{ minWidth: 180, padding: '0 14px', borderLeft: i > 0 ? '1px dashed rgba(154,123,45,0.3)' : 'none' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
                color: m.year.includes('GAP') || m.label.includes('GAP') ? 'var(--blood)' : 'var(--gold-bright)',
                lineHeight: 1,
              }}>{m.year}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5,
                color: 'var(--ink)', marginTop: 6, lineHeight: 1.3,
              }}>{m.label}</div>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 10.5,
                color: 'var(--faded)', marginTop: 3, lineHeight: 1.3,
              }}>{m.who}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── DOSSIERS ── */
const DossierPane = ({ data, personId, setPersonId, person }) => {
  const peopleByGen = React.useMemo(() => {
    const m = {};
    Object.values(data.people).forEach(p => {
      if (!m[p.generation]) m[p.generation] = [];
      m[p.generation].push(p);
    });
    return m;
  }, [data]);

  const gens = Object.keys(peopleByGen).map(Number).sort((a,b) => a-b);
  const dossier = PERSON_DOSSIERS[personId] || {};

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar: tree of people grouped by generation */}
      <div style={{
        width: 280, flexShrink: 0,
        background: 'var(--cream)',
        borderRight: '1px solid rgba(139,69,19,0.15)',
        overflowY: 'auto',
        padding: 14,
      }}>
        {gens.map(g => (
          <div key={g} style={{ marginBottom: 12 }}>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--gold)', borderBottom: '1px solid rgba(139,69,19,0.15)',
              paddingBottom: 4, marginBottom: 6,
            }}>Generation {g}</div>
            {peopleByGen[g].map(p => {
              const sel = p.id === personId;
              return (
                <button key={p.id} onClick={() => setPersonId(p.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', padding: '5px 8px', borderRadius: 4,
                    border: 'none', textAlign: 'left',
                    background: sel ? 'var(--rust)' : 'transparent',
                    color: sel ? 'var(--cream)' : 'var(--ink)',
                    fontFamily: 'var(--font-serif)', fontSize: 12,
                    cursor: 'pointer', marginBottom: 1,
                  }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: sel ? 'rgba(244,237,228,0.6)' : 'var(--faded)', fontFamily: 'ui-monospace, monospace', marginRight: 6 }}>{p.direct ? '●' : '○'}</span>
                    {p.name}
                  </span>
                  {p.evidence === 'unsolved' && <span style={{ color: sel ? 'var(--gold-bright)' : 'var(--rust)', fontSize: 14, marginLeft: 6 }}>!</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main: dossier */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Banner */}
        <div style={{
          background: 'var(--cream)',
          borderBottom: '1px solid rgba(139,69,19,0.15)',
          padding: '18px 22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--gold)', marginBottom: 4,
            }}>Generation {person.generation} {person.role && '— ' + person.role}</div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
              color: 'var(--ink)', lineHeight: 1.1,
            }}>{person.name}</h2>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--faded)',
              marginTop: 3,
            }}>{person.lifespan}</div>
          </div>
          {person.evidence && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <EvidenceBadge evidence={person.evidence} />
              {person.tags?.includes('priority-1') && (
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--cream)', background: 'var(--blood)',
                  padding: '3px 8px', borderRadius: 3,
                }}>! Priority 1</span>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px' }}>
          {person.narrative && (
            <div style={{ marginBottom: 18 }}>
              <SectionH>Known starting facts</SectionH>
              <p style={{
                fontFamily: 'var(--font-serif)', fontSize: 13.5, lineHeight: 1.65,
                color: 'var(--ink)',
              }}>{person.narrative}</p>
            </div>
          )}

          {person.notes && (
            <div style={{
              marginBottom: 18,
              background: 'rgba(107,29,29,0.05)',
              borderLeft: '3px solid var(--blood)',
              padding: '10px 14px',
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.55,
            }}>{person.notes}</div>
          )}

          <SectionH>11-category dossier</SectionH>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
          }}>
            {DOSSIER_CATEGORIES.map(cat => {
              const entry = dossier[cat.id];
              const tier = entry?.tier || 'missing';
              const t = TIER_STYLE[tier];
              return (
                <div key={cat.id} style={{
                  background: 'var(--cream)',
                  border: '1px solid rgba(139,69,19,0.15)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  borderLeft: `3px solid ${t.color}`,
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 4,
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'baseline', gap: 8,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                        color: 'var(--gold)', width: 14, textAlign: 'center',
                      }}>{cat.glyph}</span>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: 12.5, color: 'var(--ink)',
                      }}>{cat.name}</span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.1em', color: t.color,
                    }}>{t.label}</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-serif)', fontSize: 11.5, lineHeight: 1.5,
                    color: entry ? 'var(--ink)' : 'var(--faded)',
                    fontStyle: entry ? 'normal' : 'italic',
                  }}>{entry?.text || `Awaiting research — target: ${cat.desc}.`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── METHODOLOGY ── */
const MethodologyPane = () => {
  const rules = [
    { num: '01', accent: 'var(--rust)', title: 'Evidence tier on every claim', body: 'Label each assertion: PRIMARY (original record image), DERIVATIVE (abstract or transcript), CIRCUMSTANTIAL (FAN, tax co-occurrence), LORE (oral), or DISPROVEN (contradicted by primary).' },
    { num: '02', accent: 'var(--rust)', title: 'Cite the shelf, not the rumor', body: 'For every assertion, cite the specific record set, repository, microfilm or digital collection ID, and page or image number. WikiTree + Ancestry + FamilySearch indices are derivative until they show the register image.' },
    { num: '03', accent: 'var(--blood)', title: 'Flag every same-name conflation', body: 'Thomas, James, William, Ransom recur every generation. Cason and Cannon are routinely homoglyph-conflated (Edward Cannon appraised the 1652 estate — derivative trees record him as "Edward Cason"). Catch the swap before it propagates.' },
    { num: '04', accent: 'var(--sea-green)', title: 'Build the FAN list', body: 'Friends · Associates · Neighbors. The Burroughs, Hall, Davis, Cannon (appraisers), Munden (in-laws), Barrow, Whitehurst, Moore, Wilber clusters are the migration substrate. Note repeating surnames across counties.' },
    { num: '05', accent: 'var(--gold)',  title: 'Identify brick walls explicitly', body: 'Name each unresolved link. List the next three records most likely to break it. Negative results count.' },
    { num: '06', accent: 'var(--rust)',  title: 'Civil War reconstruction', body: 'Where the Florida line intersects 1861–65: regiment, company, engagements, surrender date, pension, widow\'s affidavit. Lt. Ransom 2: 7th FL Infantry, Co. mustered at Gainesville, surrendered Bennett Place 26 Apr 1865.' },
    { num: '07', accent: 'var(--ink)',   title: 'Ethical accounting', body: 'Account for enslaved people held by the family. Slave schedules (1850, 1860), estate inventories, and post-Emancipation FAN clusters are the surviving record of household composition. This is both an ethical obligation and frequently the only evidence of identity.' },
  ];

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--gold)', marginBottom: 4,
        }}>Seven rules of the work</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
          color: 'var(--ink)', lineHeight: 1.15,
        }}>Methodology &amp; Rules</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {rules.map(r => (
          <div key={r.num} style={{
            background: 'var(--cream)',
            border: '1px solid rgba(139,69,19,0.15)',
            borderRadius: 8, padding: 16,
            borderLeft: `4px solid ${r.accent}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 22,
                color: r.accent, lineHeight: 1,
              }}>{r.num}</span>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                color: 'var(--ink)',
              }}>{r.title}</div>
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)', fontSize: 12.5, color: 'var(--ink)',
              lineHeight: 1.55,
            }}>{r.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── BRICK WALLS ── */
const BrickWallsPane = () => {
  const [open, setOpen] = React.useState('gen5');
  const walls = [
    {
      id: 'gen5',
      title: 'Brick Wall 1 — The Gen 5 Hole · LOAD-BEARING',
      severity: 'priority-1',
      state: '72-year span between William\u2074 Cason (~1691) and Ransom Cason Sr. (~1763) across one nominal link. Implausible as one generation. The slot is unfilled. Leading candidate: William\u2074\'s son James (c.1727, no land records).',
      actions: [
        { rec: 'Pitt County, NC estate files, tax lists, deed books 1750–1800', repo: 'NC State Archives (NCDAH) — original microfilm, not abstracts' },
        { rec: 'Y-DNA testing across documented descendant lines of each of William\u2074\'s six sons', repo: 'FamilyTreeDNA Cason Surname Project' },
        { rec: 'Source citation for the "James Jr. (c.1750) is Ransom\'s brother" claim on WikiTree', repo: 'WikiTree Cason-543 — chase the citation back to a primary' },
      ],
    },
    {
      id: 'english',
      title: 'Brick Wall 2 — Thomas Casson\'s English Origin',
      severity: 'secondary',
      state: 'Digswell, Hertfordshire is disproven. The surname clusters in Lincolnshire / Cambridgeshire / Norfolk; the northern English "Casson" is a distinct surname. Land was acquired in Virginia via wife\'s dower, not a transportation headright, so port records may be silent.',
      actions: [
        { rec: 'Parish registers for Casson/Cason/Cawson baptisms 1595–1610 across Lincs/Cambs/Norfolk', repo: 'Findmypast, FreeREG, county record offices' },
        { rec: 'Casson registers in Lancashire / Yorkshire / Westmorland', repo: 'Lancashire Online Parish Clerks, Borthwick Institute' },
        { rec: 'Capt. Thomas Harwood\'s other 1635 headrights — surname-cluster geographic origins', repo: 'VA Patent Book 1, Library of Virginia' },
        { rec: 'TNA PCC will D883300 — "John Cason, Grocer of London"', repo: 'The National Archives, Kew' },
      ],
    },
    {
      id: 'enslaved',
      title: 'Brick Wall 3 — Identities of enslaved people in the household',
      severity: 'ethical',
      state: 'Thomas Sr.\'s 1652 estate held 28,170 lbs tobacco — at that scale, enslaved labor is documented as part of the foundation of the family\'s wealth, though the surviving 1652 inventory fragments do not name individuals. Same problem repeats in Silas Cason\'s 1850/1860 FL slave schedules.',
      actions: [
        { rec: 'Madison Co. FL probate packets 1862–1865 (Silas Cason estate inventory)', repo: 'Madison Co. Courthouse — inventories name enslaved individuals' },
        { rec: '1870 Federal Census, Madison Co. — Black households adjacent to Dennis Marion Cason / Carlton families', repo: 'NARA M593' },
        { rec: 'Lower Norfolk Order Books 1640–1670 — searches for personal-property transactions naming enslaved persons', repo: 'Library of Virginia microfilm' },
      ],
    },
  ];

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--gold)', marginBottom: 4,
        }}>Active workspace</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
          color: 'var(--ink)', lineHeight: 1.15,
        }}>Research Plan &amp; Brick Walls</h2>
      </div>

      {walls.map(w => {
        const isOpen = open === w.id;
        return (
          <div key={w.id} style={{
            background: 'var(--cream)',
            border: '1px solid rgba(139,69,19,0.15)',
            borderRadius: 8, marginBottom: 12,
            borderLeft: `4px solid ${w.severity === 'priority-1' ? 'var(--blood)' : w.severity === 'secondary' ? 'var(--gold)' : 'var(--sea-green)'}`,
          }}>
            <button onClick={() => setOpen(isOpen ? null : w.id)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', cursor: 'pointer',
                background: 'transparent', border: 'none', textAlign: 'left',
              }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5,
                color: 'var(--ink)',
              }}>{w.title}</div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                color: 'var(--gold)', width: 16, textAlign: 'center',
              }}>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: '0 18px 16px' }}>
                <p style={{
                  fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.6,
                  color: 'var(--ink)', marginBottom: 12,
                }}><strong>Current state. </strong>{w.state}</p>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--gold)', marginBottom: 6,
                }}>Proposed actions</div>
                {w.actions.map((a, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', marginBottom: 6,
                    background: 'var(--parchment)',
                    border: '1px solid rgba(139,69,19,0.12)', borderRadius: 5,
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-serif)', fontSize: 12.5,
                      color: 'var(--ink)', lineHeight: 1.5,
                    }}>· {a.rec}</div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 10.5,
                      color: 'var(--rust)', marginTop: 2, letterSpacing: '0.02em',
                    }}>Repository: {a.repo}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SectionH = ({ children }) => (
  <div style={{
    fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    color: 'var(--gold)', marginBottom: 8,
  }}>{children}</div>
);

window.DashboardView = DashboardView;
