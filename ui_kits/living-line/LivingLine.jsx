/* ============================================================
   The Living Line — landing page  (recreated from the Claude
   Design mock "The Living Line.dc.html")
   ------------------------------------------------------------
   Editorial front door to the Living Line: the family line as a
   selectable timeline of generations, the three-store memory
   method, the horizon rule, featured persona sheets, a memory-
   graph teaser, and the roadmap.

   Renders against window.CASON_LINE (built by line-landing-data.js
   from the verified record) — real names, dates, occupations,
   memory counts, source counts, and kinship. No build step; no
   regex lookbehind (iOS Safari < 16.4). ASCII source only —
   any curly quotes / em-dashes on screen come from the data.

   Palette + type are the mock's own (Cormorant Garamond /
   Newsreader / IBM Plex Mono, parchment + oxblood), loaded by
   index.html. The app itself ("Speak with an ancestor", the
   memory graph) lives at /living/world.
   ============================================================ */
const { useState, useMemo, useRef, useEffect } = React;

const LL = {
  bg: '#f6f1e7', ink: '#221c14', accent: '#8a3b24', accentDk: '#5e2817',
  card: '#fcf8ee', panel: '#efe7d4', dark: '#171310', gold: '#d9a441',
  body: '#453b2c', body2: '#4c412e',
  serif: "'Newsreader', Georgia, serif",
  display: "'Cormorant Garamond', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace"
};
const WORLD_URL = '/living/world';

/* ---- one-time CSS for hovers / animation / fonts fallback ---- */
const LL_CSS = [
  "@keyframes ll-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  ".ll-rise{animation:ll-rise .7s ease both}",
  ".ll-link{color:" + LL.ink + ";transition:color .18s ease}",
  ".ll-link:hover{color:" + LL.accent + "}",
  ".ll-cta{transition:background .18s ease}",
  ".ll-cta:hover{background:" + LL.accentDk + " !important}",
  ".ll-ghost{transition:border-color .18s ease,color .18s ease}",
  ".ll-ghost:hover{border-color:" + LL.accent + " !important;color:" + LL.accent + " !important}",
  ".ll-card{transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}",
  ".ll-card:hover{transform:translateY(-3px);border-color:" + LL.accent + ";box-shadow:0 10px 26px rgba(34,28,20,.1)}",
  ".ll-goldbtn{transition:background .18s ease,color .18s ease}",
  ".ll-goldbtn:hover{background:" + LL.gold + ";color:" + LL.dark + "}",
  ".ll-gsel{transition:all .2s ease}",
  ".ll-scroll::-webkit-scrollbar{height:6px}",
  ".ll-scroll::-webkit-scrollbar-thumb{background:rgba(34,28,20,.2);border-radius:6px}",
  "@media(max-width:720px){.ll-2col{grid-template-columns:1fr !important;gap:36px !important}" +
    ".ll-3col{grid-template-columns:1fr !important}.ll-method{grid-template-columns:1fr !important}" +
    ".ll-navlinks{display:none !important}.ll-roadrow{grid-template-columns:1fr !important;gap:8px !important}}"
].join('\n');

function useOnce(css) {
  useEffect(function () {
    if (document.getElementById('ll-style')) return;
    var s = document.createElement('style');
    s.id = 'll-style'; s.textContent = css;
    document.head.appendChild(s);
  }, []);
}

/* ---- status vocabulary (mirrors the persona statuses) ---- */
function statusLabel(st) {
  return st === 'live' ? 'SPEAKING' : st === 'scribe' ? 'IN TRANSCRIPTION' : 'RECORDING';
}
function statusColor(st) {
  return st === 'live' ? LL.accent : st === 'scribe' ? '#8a7a5c' : '#43503a';
}

/* ====================================================================
   Nav
==================================================================== */
function Nav() {
  const linkS = { fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.15em', whiteSpace: 'nowrap' };
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(246,241,231,.94)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(34,28,20,.16)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: LL.display, fontSize: 23, fontWeight: 500, letterSpacing: '.01em', whiteSpace: 'nowrap' }}>The Living Line</span>
          <span style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.16em', color: 'rgba(34,28,20,.5)' }}>FLCASON.COM/LIVING</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="ll-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <a className="ll-link" href="#line" style={linkS}>THE LINE</a>
          <a className="ll-link" href="#method" style={linkS}>METHOD</a>
          <a className="ll-link" href="#sheets" style={linkS}>SHEETS</a>
          <a className="ll-link" href="#numbers" style={linkS}>NUMBERS</a>
          <a className="ll-link" href="/archive" style={linkS}>ARCHIVE</a>
          <a className="ll-cta" href={WORLD_URL} style={{ display: 'inline-block', padding: '10px 18px',
            background: LL.accent, color: LL.bg, fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.14em', whiteSpace: 'nowrap' }}>SPEAK WITH AN ANCESTOR</a>
        </div>
      </div>
    </nav>
  );
}

/* ====================================================================
   Hero
==================================================================== */
function Hero(props) {
  const s = props.stats;
  const diamond = <span style={{ width: 7, height: 7, background: LL.accent, transform: 'rotate(45deg)' }} />;
  const solid = { display: 'inline-block', padding: '15px 28px', background: LL.accent, color: LL.bg, fontFamily: LL.mono, fontSize: 11, letterSpacing: '.16em' };
  const ghost = { display: 'inline-block', padding: '15px 28px', border: '1px solid rgba(34,28,20,.35)', color: LL.ink, fontFamily: LL.mono, fontSize: 11, letterSpacing: '.16em' };
  return (
    <header style={{ maxWidth: 1240, margin: '0 auto', padding: '110px 32px 0', textAlign: 'center' }}>
      <div className="ll-rise" style={{ animationDelay: '.05s', fontFamily: LL.mono, fontSize: 11, letterSpacing: '.22em', color: LL.accent }}>
        THE CASON FAMILY, ALIVE &middot; RECORD OF {s.start} &ndash; PRESENT
      </div>
      <h1 className="ll-rise" style={{ animationDelay: '.15s', fontFamily: LL.display, fontWeight: 400,
        fontSize: 'clamp(54px,7.4vw,110px)', lineHeight: 1.0, letterSpacing: '-.01em', margin: '30px auto 0', maxWidth: 1000 }}>
        Every Cason, awake<br />in <em style={{ fontWeight: 300 }}>their own</em> time.
      </h1>
      <div className="ll-rise" style={{ animationDelay: '.25s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '36px 0 0' }}>
        <span style={{ width: 64, height: 1, background: 'rgba(34,28,20,.3)' }} />{diamond}<span style={{ width: 64, height: 1, background: 'rgba(34,28,20,.3)' }} />
      </div>
      <p className="ll-rise" style={{ animationDelay: '.35s', maxWidth: 640, margin: '32px auto 0', fontSize: 20, lineHeight: 1.65, color: LL.body }}>
        The Living Line renders {s.personas} ancestors as autonomous personas &mdash; each one bounded by what their generation could actually know. Letters, ledgers, and hearsay go in. Nothing from the future ever does.
      </p>
      <div className="ll-rise" style={{ animationDelay: '.45s', display: 'flex', justifyContent: 'center', gap: 14, marginTop: 40, flexWrap: 'wrap' }}>
        <a className="ll-cta" href="#line" style={solid}>EXPLORE THE LINE &darr;</a>
        <a className="ll-ghost" href="#method" style={ghost}>HOW THE BOUNDING WORKS</a>
      </div>
      <div className="ll-rise" style={{ animationDelay: '.55s', marginTop: 72, borderTop: '1px solid rgba(34,28,20,.16)', borderBottom: '1px solid rgba(34,28,20,.16)',
        padding: '18px 0', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px 54px', fontFamily: LL.mono, fontSize: 11.5, letterSpacing: '.14em', color: LL.body }}>
        <span>{s.personas} PERSONAS</span>
        <span>{s.generations} GENERATIONS</span>
        <span>{s.years} YEARS OF RECORD</span>
        <span style={{ color: LL.accent }}>0 GLIMPSES OF THE FUTURE</span>
      </div>
    </header>
  );
}

/* ====================================================================
   Section I — The Family Line (generation selector + member cards)
==================================================================== */
function GenSelector(props) {
  const gens = props.gens, sel = props.sel, onPick = props.onPick;
  return (
    <div className="ll-scroll" style={{ position: 'relative', marginBottom: 52, overflowX: 'auto', paddingBottom: 6 }}>
      <div style={{ position: 'relative', minWidth: gens.length * 64 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 1, background: 'rgba(34,28,20,.22)' }} />
        <div style={{ display: 'flex' }}>
          {gens.map(function (g, i) {
            const on = i === sel;
            return (
              <div key={g.g} onClick={function () { onPick(i); }}
                style={{ flex: 1, minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', position: 'relative' }}>
                <span className="ll-gsel" style={{ width: 11, height: 11, borderRadius: '50%', boxSizing: 'border-box',
                  background: on ? LL.accent : LL.bg, border: on ? '1px solid ' + LL.accent : '1px solid rgba(34,28,20,.45)' }} />
                <span className="ll-gsel" style={{ fontFamily: LL.display, fontSize: 21, fontStyle: 'italic', lineHeight: 1, color: on ? LL.ink : 'rgba(34,28,20,.45)' }}>{g.roman}</span>
                <span className="ll-gsel" style={{ fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.06em', textAlign: 'center', color: on ? LL.accent : 'rgba(34,28,20,.4)' }}>{g.era || ''}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MemberCard(props) {
  const m = props.m, showCat = props.showCat, cat = props.cat;
  const T = window.CASON_TIERS;
  // living family (persona status 'rec') is kept close: outsiders see a
  // private placeholder; outer/known family see the real card.
  if (T && m.st === 'rec' && !T.canSee('outer', props.viewer)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px', background: LL.card, border: '1px dashed rgba(34,28,20,.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {showCat ? <span style={{ fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.16em', color: 'rgba(34,28,20,.4)' }}>{cat}</span> : <span />}
          <span style={{ fontFamily: LL.mono, fontSize: 9, letterSpacing: '.14em', color: '#5f6b4e' }}>LIVING &middot; KEPT CLOSE</span>
        </div>
        <div style={{ fontFamily: LL.display, fontSize: 24, fontWeight: 500, color: 'rgba(34,28,20,.5)' }}>A living Cason</div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'rgba(34,28,20,.5)', fontStyle: 'italic', flex: 1 }}>
          The living generations are held close. If you&rsquo;re family, switch your view to <em>Outer family</em> or <em>Known family</em> to see them.
        </p>
      </div>
    );
  }
  return (
    <a className="ll-card" href={WORLD_URL}
      style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 22px 18px', background: LL.card,
        border: '1px solid rgba(34,28,20,.18)', color: LL.ink }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        {showCat ? <span style={{ fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.16em', color: 'rgba(34,28,20,.5)' }}>{cat}</span> : <span />}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: LL.mono, fontSize: 9, letterSpacing: '.14em', color: statusColor(m.st) }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', boxSizing: 'border-box',
            background: m.st === 'scribe' ? '#a29070' : m.st === 'live' ? LL.accent : 'transparent',
            border: m.st === 'rec' ? '1.5px solid #43503a' : 'none' }} />
          {statusLabel(m.st)}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: LL.display, fontSize: 27, fontWeight: 500, lineHeight: 1.1 }}>{m.n}</div>
        <div style={{ marginTop: 6, fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.1em', color: 'rgba(34,28,20,.55)' }}>
          {m.dates}{m.occ ? <React.Fragment> · <em style={{ fontFamily: LL.serif, fontStyle: 'italic', fontSize: 14, letterSpacing: 0 }}>{m.occ}</em></React.Fragment> : null}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: LL.body2, flex: 1 }}>{m.note}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(34,28,20,.14)', paddingTop: 12 }}>
        <span style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.12em', color: 'rgba(34,28,20,.55)' }}>
          {m.mem.toLocaleString('en-US')} {m.mem === 1 ? 'memory' : 'memories'}
        </span>
        <span style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', color: LL.accent }}>OPEN SHEET &rarr;</span>
      </div>
    </a>
  );
}

function FamilyLine(props) {
  const line = props.line;
  const gens = line.gens;
  const defIdx = useMemo(function () {
    var i = gens.findIndex(function (g) { return g.g === 7; });
    return i >= 0 ? i : Math.min(4, gens.length - 1);
  }, [gens]);
  const [sel, setSel] = useState(defIdx);
  const g = gens[Math.min(sel, gens.length - 1)];

  // stable catalog numbers across the whole line
  const catOf = useMemo(function () {
    var map = {}, n = 0;
    gens.forEach(function (gg) { gg.members.forEach(function (m) { map[m.id] = ++n; }); });
    return map;
  }, [gens]);

  return (
    <section id="line" style={{ maxWidth: 1240, margin: '0 auto', padding: '110px 32px 0' }}>
      <SectionHead num="I" label="THE FAMILY LINE" right="SELECT A GENERATION" />
      <GenSelector gens={gens} sel={sel} onPick={setSel} />
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '12px 28px', marginBottom: 10 }}>
        <h2 style={{ fontFamily: LL.display, fontWeight: 500, fontSize: 42, lineHeight: 1.05, margin: 0 }}>
          Generation {g.roman} &mdash; {g.title}
        </h2>
        <span style={{ fontFamily: LL.mono, fontSize: 11, letterSpacing: '.14em', color: 'rgba(34,28,20,.55)' }}>
          {g.era}{g.seat ? ' · ' + g.seat : ''}
        </span>
      </div>
      <p style={{ fontStyle: 'italic', fontSize: 19, color: LL.body, margin: '0 0 36px', maxWidth: 680 }}>{g.sum}</p>
      <div className="ll-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {g.members.map(function (m) {
          return <MemberCard key={m.id} m={m} showCat={props.showCat} cat={'CAT. ' + String(catOf[m.id]).padStart(3, '0')} viewer={props.viewer} />;
        })}
      </div>
    </section>
  );
}

/* ---- shared section header ---- */
function SectionHead(props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
      <span style={{ fontFamily: LL.mono, fontSize: 11, letterSpacing: '.2em', color: LL.accent, whiteSpace: 'nowrap' }}>{props.num} &mdash; {props.label}</span>
      <span style={{ flex: 1, height: 1, background: 'rgba(34,28,20,.16)' }} />
      {props.right ? <span style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', color: 'rgba(34,28,20,.45)', whiteSpace: 'nowrap' }}>{props.right}</span> : null}
      {props.rightLink ? <a className="ll-link" href={props.rightLink.href} style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', color: LL.accent }}>{props.rightLink.text}</a> : null}
    </div>
  );
}

/* ====================================================================
   Section II — The Method
==================================================================== */
function StoreCard(props) {
  return (
    <div style={{ background: LL.bg, padding: '36px 32px' }}>
      <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8 }}>{props.icon}</div>
      <div style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.18em', color: 'rgba(34,28,20,.5)', marginBottom: 10 }}>{props.store}</div>
      <h3 style={{ fontFamily: LL.display, fontSize: 30, fontWeight: 500, margin: '0 0 12px' }}>{props.title}</h3>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: LL.body2 }}>{props.children}</p>
    </div>
  );
}

function Method(props) {
  const s = props.stats;
  // memory-store icon rows
  const soloDot = <span style={{ width: 13, height: 13, borderRadius: '50%', background: LL.accent }} />;
  const ringDot = function (k) { return <span key={k} style={{ width: 9, height: 9, borderRadius: '50%', border: '1px solid rgba(34,28,20,.45)' }} />; };
  const gen2Icon = [ringDot('a'), ringDot('b'), <span key="c" style={{ width: 13, height: 13, borderRadius: '50%', background: LL.accent }} />, ringDot('d'), ringDot('e')];
  const line3 = <span style={{ width: 20, height: 1, background: 'rgba(34,28,20,.4)' }} />;
  const gen3Icon = [ringDot('a'), <span key="l1">{line3}</span>, ringDot('b'), <span key="l2">{line3}</span>, <span key="c" style={{ width: 13, height: 13, borderRadius: '50%', background: LL.accent }} />];

  return (
    <section id="method" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 32px 0' }}>
      <SectionHead num="II" label="THE METHOD" />
      <div className="ll-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'end', marginBottom: 52 }}>
        <h2 style={{ fontFamily: LL.display, fontWeight: 400, fontSize: 'clamp(36px,3.6vw,52px)', lineHeight: 1.08, margin: 0 }}>Three memories, nested like rings in a tree.</h2>
        <p style={{ margin: 0, fontSize: 17.5, color: LL.body }}>Each persona runs on three memory stores assembled from the family archive. What a persona can say is a strict function of what a body in their place, in their years, could have known.</p>
      </div>
      <div className="ll-method" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid rgba(34,28,20,.18)', background: 'rgba(34,28,20,.18)', gap: 1 }}>
        <StoreCard store="STORE I" title="Personal memory" icon={soloDot}>
          What they alone lived: diary entries, letters, deeds, wills, sworn testimony. The best-documented Casons carry a dozen or more such memories each; those who left only a name in a ledger carry a handful.
        </StoreCard>
        <StoreCard store="STORE II" title="Generational memory" icon={gen2Icon}>
          What their cohort knew together: prices, wars, weather, news as it actually arrived &mdash; late, partial, and mostly by rumor. Shared by everyone in the generation, and no one outside it.
        </StoreCard>
        <StoreCard store="STORE III" title="Line memory" icon={gen3Icon}>
          What flows down from the ancestors only: the story of the 1738 crossing, the walk south through the Okefenokee, quarrels kept warm. Inheritance runs one way &mdash; nothing travels back up the line.
        </StoreCard>
      </div>
      <HorizonRule stats={s} />
    </section>
  );
}

function HorizonRule(props) {
  return (
    <div className="ll-2col" style={{ marginTop: 22, border: '1px solid rgba(34,28,20,.18)', background: LL.panel, padding: '44px 40px',
      display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 52, alignItems: 'center' }}>
      <div>
        <div style={{ fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.2em', color: LL.accent, marginBottom: 14 }}>THE HORIZON RULE</div>
        <h3 style={{ fontFamily: LL.display, fontSize: 34, fontWeight: 500, lineHeight: 1.12, margin: '0 0 16px' }}>No persona knows anything dated after their death.</h3>
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.65, color: LL.body2 }}>
          Lt. Ransom (d. 1900) can tell you of Appomattox, which ended the war he marched in. Ask him about the county&rsquo;s first automobile &mdash; years past his horizon &mdash; and he can only say he has not lived to see such a thing. The model cannot leak what the memory stores do not contain.
        </p>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: LL.mono, fontSize: 10, letterSpacing: '.1em', color: 'rgba(34,28,20,.55)', marginBottom: 8 }}>
          <span>1835</span><span>1861</span><span>1900</span><span>{props.stats.present}</span>
        </div>
        <div style={{ display: 'flex', height: 58, border: '1px solid rgba(34,28,20,.3)' }}>
          <div style={{ width: '40%', background: 'repeating-linear-gradient(135deg,rgba(138,59,36,.22) 0px,rgba(138,59,36,.22) 5px,rgba(138,59,36,.05) 5px,rgba(138,59,36,.05) 10px)', borderRight: '1px solid rgba(34,28,20,.3)' }} />
          <div style={{ width: '27%', background: LL.accent, borderRight: '1px solid rgba(34,28,20,.3)' }} />
          <div style={{ width: '33%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.22em', color: 'rgba(34,28,20,.4)' }}>SEALED</div>
        </div>
        <div style={{ display: 'flex', fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.14em', color: LL.body2, marginTop: 8 }}>
          <span style={{ width: '40%' }}>INHERITED</span>
          <span style={{ width: '27%', color: LL.accent }}>LIVED</span>
          <span style={{ width: '33%' }}>UNKNOWABLE</span>
        </div>
        <p style={{ margin: '14px 0 0', fontFamily: LL.mono, fontSize: 10, letterSpacing: '.08em', color: 'rgba(34,28,20,.5)' }}>FIG. 1 &mdash; KNOWLEDGE HORIZON OF LT. RANSOM CASON, 1835&ndash;1900</p>
      </div>
    </div>
  );
}

/* ====================================================================
   Section III — Persona Sheets (featured)
==================================================================== */
function SheetCard(props) {
  const m = props.m, portrait = props.portrait;
  return (
    <a className="ll-card" href={WORLD_URL} style={{ display: 'block', background: LL.card, border: '1px solid rgba(34,28,20,.18)', color: LL.ink }}>
      <div style={{ height: 190, background: 'repeating-linear-gradient(45deg,#efe7d4 0px,#efe7d4 6px,#e6dcc5 6px,#e6dcc5 12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(34,28,20,.18)' }}>
        <span style={{ fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.14em', color: 'rgba(34,28,20,.55)' }}>{portrait}</span>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.16em', color: 'rgba(34,28,20,.5)', marginBottom: 10 }}>
          CAT. {String(props.cat).padStart(3, '0')} &middot; GENERATION {props.roman} &middot; {statusLabel(m.st)}
        </div>
        <div style={{ fontFamily: LL.display, fontSize: 29, fontWeight: 500 }}>{m.n}</div>
        <div style={{ fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.1em', color: 'rgba(34,28,20,.55)', margin: '6px 0 16px' }}>
          {m.dates}{m.occ ? <React.Fragment> · <em style={{ fontFamily: LL.serif, fontStyle: 'italic', fontSize: 14, letterSpacing: 0 }}>{m.occ}</em></React.Fragment> : null}
        </div>
        <p style={{ margin: 0, fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.6, color: LL.body }}>{m.note}</p>
        <p style={{ margin: '12px 0 0', fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.12em', color: 'rgba(34,28,20,.5)' }}>
          {m.cite ? m.cite.toUpperCase() : (m.src + ' SOURCES ON RECORD')} &middot; {m.mem.toLocaleString('en-US')} {m.mem === 1 ? 'MEMORY' : 'MEMORIES'}
        </p>
      </div>
    </a>
  );
}

function Sheets(props) {
  const line = props.line;
  // find members + their generation roman + catalog number
  const idx = useMemo(function () {
    var map = {}, n = 0;
    line.gens.forEach(function (g) {
      g.members.forEach(function (m) { n++; map[m.id] = { m: m, roman: g.roman, cat: n }; });
    });
    return map;
  }, [line]);
  const feat = [
    { id: 'thomas-sr', portrait: 'NO PORTRAIT SURVIVES · HEADRIGHT, 1635' },
    { id: 'james-green', portrait: 'NO PORTRAIT SURVIVES · FLORIDA, c.1840' },
    { id: 'robert-sr', portrait: 'PORTRAIT PENDING · TITUSVILLE, c.1957' }
  ].map(function (f) { var e = idx[f.id]; return e ? { e: e, portrait: f.portrait } : null; }).filter(Boolean);

  return (
    <section id="sheets" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 32px 0' }}>
      <SectionHead num="III" label="PERSONA SHEETS" rightLink={{ href: WORLD_URL, text: 'OPEN A FULL SHEET →' }} />
      <div className="ll-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
        {feat.map(function (f) {
          return <SheetCard key={f.e.m.id} m={f.e.m} roman={f.e.roman} cat={f.e.cat} portrait={f.portrait} />;
        })}
      </div>
      <p style={{ margin: '24px 0 0', fontSize: 15.5, color: 'rgba(34,28,20,.6)', fontStyle: 'italic' }}>
        Three of {props.stats.personas}. Every sheet carries the persona&rsquo;s full memory bounds, provenance, kin on record, and voice notes.
      </p>
    </section>
  );
}

/* ====================================================================
   Section IV — Memory Graph teaser (canvas)
==================================================================== */
function hashId(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h / 997; }

function GraphTeaser(props) {
  const line = props.line;
  const ref = useRef(null);
  useEffect(function () {
    const cv = ref.current; if (!cv) return;
    const x = cv.getContext('2d'); if (!x) return;
    const w = cv.width, h = cv.height;
    const gens = line.gens;
    const lo = line.start - 10, hi = line.present + 10;
    const X = function (yr) { return 70 + (yr - lo) / (hi - lo) * (w - 140); };
    x.clearRect(0, 0, w, h);
    // representative year per generation (mean of its dated members, else
    // interpolated across the span) so undated kin spread by era, not pile up.
    const genYear = gens.map(function (g, gi) {
      var sum = 0, n = 0;
      g.members.forEach(function (m) {
        var y = m.b != null ? m.b : (m.d != null ? m.d - 30 : null);
        if (y != null) { sum += y; n++; }
      });
      if (n) return sum / n;
      return line.start + (line.present - line.start) * (gi / Math.max(1, gens.length - 1));
    });
    // position every member
    const pos = {};
    gens.forEach(function (g, gi) {
      g.members.forEach(function (m) {
        const mid = (m.b != null && m.d != null) ? (m.b + m.d) / 2 : (m.b != null ? m.b + 25 : (m.d != null ? m.d - 25 : genYear[gi]));
        const band = 40 + gi * (h - 96) / Math.max(1, gens.length - 1);
        pos[m.id] = { x: X(mid + (hashId(m.id + 'x') - 0.5) * 10), y: band + (hashId(m.id) - 0.5) * 30, m: m };
      });
    });
    // decade gridlines
    x.font = '15px IBM Plex Mono, monospace';
    for (var yr = 1650; yr <= 2000; yr += 50) {
      x.strokeStyle = 'rgba(239,230,208,.07)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(X(yr), 18); x.lineTo(X(yr), h - 34); x.stroke();
      x.fillStyle = 'rgba(239,230,208,.28)'; x.fillText(String(yr), X(yr) - 17, h - 12);
    }
    // kinship lines (child -> parent), oxblood
    gens.forEach(function (g) {
      g.members.forEach(function (m) {
        if (m.p && pos[m.p]) {
          const a = pos[m.id], b = pos[m.p];
          x.strokeStyle = 'rgba(196,90,48,.4)'; x.lineWidth = 1;
          x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
        }
      });
    });
    // nodes sized by memory count
    Object.keys(pos).forEach(function (id) {
      const p = pos[id];
      const r = 2.5 + Math.sqrt(p.m.mem || 1) / 7;
      x.beginPath(); x.arc(p.x, p.y, r, 0, 7);
      if (p.m.st === 'rec') { x.strokeStyle = LL.gold; x.lineWidth = 1.5; x.stroke(); }
      else { x.fillStyle = p.m.st === 'live' ? LL.gold : '#6b5f4c'; x.fill(); }
    });
  }, [line]);

  return (
    <section id="graph" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 32px 0' }}>
      <div className="ll-2col" style={{ background: LL.dark, border: '1px solid ' + LL.dark, padding: 56, display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: LL.mono, fontSize: 11, letterSpacing: '.2em', color: LL.gold, marginBottom: 16 }}>IV &mdash; THE MEMORY GRAPH</div>
          <h2 style={{ fontFamily: LL.display, fontWeight: 400, fontSize: 'clamp(34px,3.4vw,48px)', lineHeight: 1.1, margin: '0 0 18px', color: '#efe6d0' }}>One graph, every mind.</h2>
          <p style={{ margin: '0 0 30px', fontSize: 16.5, lineHeight: 1.65, color: 'rgba(239,230,208,.7)' }}>
            Every persona is a node, sized by its memories. Kinship runs in oxblood. Open the full graph to trace how a story crosses four generations without ever moving forward in time.
          </p>
          <a className="ll-goldbtn" href={WORLD_URL} style={{ display: 'inline-block', padding: '14px 26px', border: '1px solid ' + LL.gold, color: LL.gold, fontFamily: LL.mono, fontSize: 11, letterSpacing: '.16em' }}>OPEN THE GRAPH &rarr;</a>
        </div>
        <canvas ref={ref} width={1200} height={640} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </section>
  );
}

/* ====================================================================
   Section V — Roadmap
==================================================================== */
function RoadRow(props) {
  return (
    <div className="ll-roadrow" style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: 32, alignItems: 'baseline', padding: '34px 0', borderBottom: '1px solid rgba(34,28,20,.16)' }}>
      <span style={{ fontFamily: LL.mono, fontSize: 11, letterSpacing: '.18em', color: 'rgba(34,28,20,.5)' }}>{props.phase}</span>
      <div>
        <h3 style={{ fontFamily: LL.display, fontSize: 32, fontWeight: 500, margin: '0 0 8px' }}>{props.title}</h3>
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.6, color: LL.body2, maxWidth: 640 }}>{props.children}</p>
      </div>
      <span style={props.badge.style}>{props.badge.text}</span>
    </div>
  );
}

function Roadmap() {
  const complete = { fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', padding: '8px 14px', background: LL.accent, color: LL.bg };
  const live = { fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', padding: '8px 14px', border: '1px solid ' + LL.accent, color: LL.accent };
  const ahead = { fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', padding: '8px 14px', border: '1px dashed rgba(34,28,20,.4)', color: 'rgba(34,28,20,.55)' };
  return (
    <section id="roadmap" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
        <span style={{ fontFamily: LL.mono, fontSize: 11, letterSpacing: '.2em', color: LL.accent, whiteSpace: 'nowrap' }}>VII &mdash; ROADMAP</span>
        <span style={{ flex: 1, height: 1, background: 'rgba(34,28,20,.16)' }} />
      </div>
      <RoadRow phase="PHASE I" title="The Record" badge={{ style: complete, text: 'COMPLETE · 2025' }}>
        The verified lineage becomes the shared memory graph: every deed, will, census line, and county record indexed, dated, and bounded. Persona sheets published across the line.
      </RoadRow>
      <RoadRow phase="PHASE II" title="The Voices" badge={{ style: live, text: '● LIVE NOW' }}>
        The personas speak. Ask Thomas about the tobacco coast; ask Lt. Ransom what the 7th Florida heard at Missionary Ridge. Every answer cites the memories it stands on &mdash; and refuses the future politely.
      </RoadRow>
      <RoadRow phase="PHASE III" title="The Parlor" badge={{ style: ahead, text: 'AHEAD · 2027' }}>
        Personas in conversation with each other across generations &mdash; and a portal for the living to deposit their own memories into the line, one evening a week.
      </RoadRow>
    </section>
  );
}

/* ====================================================================
   Section VI — The Numbers (lineage statistics)
==================================================================== */
function StatTile(props) {
  return (
    <div style={{ background: LL.card, border: '1px solid rgba(34,28,20,.18)', padding: '20px 22px' }}>
      <div style={{ fontFamily: LL.display, fontSize: 42, fontWeight: 500, lineHeight: 1, color: LL.accent }}>{props.n}</div>
      <div style={{ marginTop: 8, fontFamily: LL.mono, fontSize: 10, letterSpacing: '.12em', color: 'rgba(34,28,20,.6)', lineHeight: 1.5 }}>{props.label}</div>
    </div>
  );
}

function AliveChart(props) {
  const s = props.stats;
  const est = s.aliveByYear.estimated, known = s.aliveByYear.known;
  const [hover, setHover] = useState(null);
  const W = 1000, H = 340, padL = 48, padR = 20, padT = 20, padB = 38;
  const x0 = s.start, x1 = s.present;
  const maxC = Math.max(1, est.reduce(function (m, p) { return Math.max(m, p.count); }, 0));
  const X = function (yr) { return padL + (yr - x0) / (x1 - x0) * (W - padL - padR); };
  const Y = function (c) { return H - padB - c / maxC * (H - padT - padB); };
  const areaPath = 'M' + X(x0) + ' ' + Y(0) + est.map(function (p) { return 'L' + X(p.year).toFixed(1) + ' ' + Y(p.count).toFixed(1); }).join('') + 'L' + X(x1) + ' ' + Y(0) + 'Z';
  const linePath = known.map(function (p, i) { return (i ? 'L' : 'M') + X(p.year).toFixed(1) + ' ' + Y(p.count).toFixed(1); }).join('');
  const peak = est.reduce(function (a, p) { return p.count > a.count ? p : a; }, { count: 0, year: x0 });
  const gridYears = [1650, 1700, 1750, 1800, 1850, 1900, 1950, 2000];
  const gridCounts = [10, 20, 30].filter(function (c) { return c <= maxC; });

  function onMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * W;
    const yr = Math.round(x0 + (px - padL) / (W - padL - padR) * (x1 - x0));
    const i = yr - x0;
    if (i >= 0 && i < est.length) setHover({ year: est[i].year, est: est[i].count, known: known[i].count });
  }
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto', display: 'block' }} onMouseMove={onMove} onMouseLeave={function () { setHover(null); }}>
        {gridCounts.map(function (c) {
          return <g key={'gc' + c}>
            <line x1={padL} y1={Y(c)} x2={W - padR} y2={Y(c)} stroke="rgba(34,28,20,.1)" strokeWidth="1" />
            <text x={padL - 8} y={Y(c) + 3} textAnchor="end" fontFamily={LL.mono} fontSize="10" fill="rgba(34,28,20,.5)">{c}</text>
          </g>;
        })}
        {gridYears.map(function (yr) {
          return <text key={'gy' + yr} x={X(yr)} y={H - padB + 16} textAnchor="middle" fontFamily={LL.mono} fontSize="10" fill="rgba(34,28,20,.5)">{yr}</text>;
        })}
        <path d={areaPath} fill="rgba(138,59,36,.14)" stroke="none" />
        <path d={linePath} fill="none" stroke={LL.accent} strokeWidth="2" />
        <circle cx={X(peak.year)} cy={Y(peak.count)} r="3.5" fill={LL.accent} />
        <text x={X(peak.year)} y={Y(peak.count) - 8} textAnchor="middle" fontFamily={LL.mono} fontSize="10" letterSpacing=".06em" fill={LL.accent}>PEAK ~{peak.count} · {peak.year}</text>
        {hover ? <line x1={X(hover.year)} y1={padT} x2={X(hover.year)} y2={H - padB} stroke="rgba(34,28,20,.35)" strokeWidth="1" /> : null}
      </svg>
      {hover ? (
        <div style={{ position: 'absolute', top: 6, left: (X(hover.year) / W * 100) + '%', transform: 'translateX(-50%)', pointerEvents: 'none',
          background: LL.dark, color: '#efe6d0', fontFamily: LL.mono, fontSize: 10, letterSpacing: '.06em', padding: '6px 9px', whiteSpace: 'nowrap', borderRadius: 2 }}>
          {hover.year} &middot; ~{hover.est} alive{hover.known !== hover.est ? ' (' + hover.known + ' recorded)' : ''}
        </div>
      ) : null}
    </div>
  );
}

function GenTable(props) {
  const rows = props.stats.byGen;
  const th = { fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.12em', color: 'rgba(34,28,20,.55)', textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid rgba(34,28,20,.2)', fontWeight: 400 };
  const td = { fontFamily: LL.serif, fontSize: 14, color: LL.body2, padding: '8px 10px', borderBottom: '1px solid rgba(34,28,20,.1)' };
  const num = { fontFamily: LL.mono, fontSize: 12 };
  function frac(o) { return o.determinable ? o.met + ' / ' + o.determinable : '—'; }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 440 }}>
        <thead><tr>
          <th style={th}>GEN</th><th style={th}>PEOPLE</th><th style={th}>BECAME PARENTS</th>
          <th style={th}>MET A GRANDCHILD</th><th style={th}>MET A GREAT-GRANDCHILD</th>
        </tr></thead>
        <tbody>
          {rows.map(function (r) {
            return <tr key={r.gen}>
              <td style={Object.assign({}, td, { fontFamily: LL.display, fontStyle: 'italic', fontSize: 16 })}>{r.roman}</td>
              <td style={Object.assign({}, td, num)}>{r.total}</td>
              <td style={Object.assign({}, td, num)}>{r.parents}</td>
              <td style={Object.assign({}, td, num)}>{frac(r.grand)}</td>
              <td style={Object.assign({}, td, num)}>{frac(r.great)}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

function TheNumbers() {
  const s = window.CASON_STATS;
  if (!s || !s.byGen || !s.byGen.length) return null;
  const thomas = s.descendants['thomas-sr'] || { total: 0 };
  const ransom = s.descendants['ransom-sr'] || { total: 0 };
  return (
    <section id="numbers" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 32px 0' }}>
      <SectionHead num="V" label="THE NUMBERS" right="THE WHOLE TREE, COUNTED" />
      <div className="ll-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 44 }}>
        <StatTile n={thomas.total} label={'DESCENDANTS OF THOMAS CASSON\n(the 1635 immigrant)'} />
        <StatTile n={ransom.total} label={'DESCENDANTS OF RANSOM SR.\n(the 1823 Florida crossing)'} />
        <StatTile n={s.totals.parents} label={'CARRIED THE LINE ON\n(became parents on record)'} />
        <StatTile n={s.totals.living} label={'LIVING TODAY\n(on the record)'} />
      </div>
      <div className="ll-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'end', marginBottom: 28 }}>
        <h2 style={{ fontFamily: LL.display, fontWeight: 400, fontSize: 'clamp(30px,3.2vw,44px)', lineHeight: 1.1, margin: 0 }}>The family, alive across four centuries.</h2>
        <p style={{ margin: 0, fontSize: 16.5, color: LL.body }}>
          How many Casons were living in any given year. The solid line counts only members with a birth <em>and</em> death on record; the shaded field estimates the rest from their generation and kin &mdash; a reconstruction, not a census.
        </p>
      </div>
      <AliveChart stats={s} />
      <p style={{ margin: '10px 0 44px', fontFamily: LL.mono, fontSize: 10, letterSpacing: '.08em', color: 'rgba(34,28,20,.5)' }}>
        FIG. 2 &mdash; CASON FAMILY MEMBERS ALIVE BY YEAR, {s.start}&ndash;{s.present} &middot; SOLID = RECORDED, SHADED = ESTIMATED
      </p>
      <h3 style={{ fontFamily: LL.display, fontSize: 28, fontWeight: 500, margin: '0 0 6px' }}>Who lived to see the next branches.</h3>
      <p style={{ margin: '0 0 22px', fontSize: 15.5, color: 'rgba(34,28,20,.6)', fontStyle: 'italic', maxWidth: 680 }}>
        Counted only where the dates allow it &mdash; shown as met / determinable. Blanks are generations whose records are still too thin to say.
      </p>
      <GenTable stats={s} />

      <div style={{ marginTop: 64, borderTop: '1px solid rgba(34,28,20,.16)', paddingTop: 44 }}>
        <div className="ll-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'end', marginBottom: 24 }}>
          <h3 style={{ fontFamily: LL.display, fontWeight: 400, fontSize: 'clamp(28px,3vw,40px)', lineHeight: 1.12, margin: 0 }}>Not one descent &mdash; a whole family.</h3>
          <p style={{ margin: 0, fontSize: 16.5, color: LL.body }}>
            The direct line is {s.directMembers} names. Around it stand {s.branchMembers} more &mdash; the brothers and sisters who stayed, the cousins who scattered &mdash; and {s.families.length} families who married into the Casons and became part of the line.
          </p>
        </div>
        <div style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.14em', color: 'rgba(34,28,20,.5)', marginBottom: 14 }}>THE FAMILIES THAT MARRIED IN</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {s.families.map(function (f) {
            return <span key={f.surname} title={f.marriages.map(function (m) { return m.who; }).join(' · ')}
              style={{ fontFamily: LL.serif, fontSize: 15, padding: '7px 14px', border: '1px solid rgba(34,28,20,.2)', background: LL.card, color: LL.ink, borderRadius: 2 }}>
              {f.surname}{f.marriages.length > 1 ? <span style={{ color: 'rgba(34,28,20,.45)', fontFamily: LL.mono, fontSize: 11 }}>{' ×' + f.marriages.length}</span> : null}
            </span>;
          })}
        </div>
        <p style={{ margin: '18px 0 0', fontSize: 14.5, color: 'rgba(34,28,20,.6)', fontStyle: 'italic', maxWidth: 700 }}>
          Cannon, Poole, Munden, Barrow, McKinney, Douglas, O&rsquo;Steen and the rest &mdash; the Casons are only half of every marriage. Their records are still thin; adding them is how the story gets its full width.
        </p>
      </div>
    </section>
  );
}

/* ====================================================================
   Section VI — The Threads (evidence-stamped asides, collapsed by default)
==================================================================== */
const STAMP_TONE = {
  strong: LL.accent,        // ON THE RECORD / STRONGLY SUPPORTED
  mid: '#8a7a5c',           // AS REPORTED / NOTED
  soft: '#a07d4a',          // REASONED / DOUBTFUL
  open: '#5f6b4e',          // OPEN QUESTION
  out: 'rgba(34,28,20,.42)' // RULED OUT
};

function AsideRow(props) {
  const a = props.aside, who = props.who;
  const [open, setOpen] = useState(false);
  const color = STAMP_TONE[a.stamp.tone] || STAMP_TONE.mid;
  const preview = a.text.length > 96 && !open ? a.text.slice(0, 94).replace(/\s+\S*$/, '') + '…' : a.text;
  return (
    <div style={{ borderTop: '1px solid rgba(34,28,20,.12)' }}>
      <button onClick={function () { setOpen(!open); }} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0, marginTop: 2, fontFamily: LL.mono, fontSize: 9, letterSpacing: '.12em', color: color, border: '1px solid ' + color, borderRadius: 2, padding: '3px 7px', whiteSpace: 'nowrap' }}>{a.stamp.label}</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontFamily: LL.serif, fontSize: 15.5, color: a.stamp.tone === 'out' ? 'rgba(34,28,20,.5)' : LL.body2, lineHeight: 1.55 }}>{preview}</span>
          {who ? <span style={{ fontFamily: LL.mono, fontSize: 10, letterSpacing: '.08em', color: 'rgba(34,28,20,.45)', marginLeft: 8 }}>· {who}</span> : null}
          {open ? <span style={{ display: 'block', marginTop: 8, fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.04em', color: color, fontStyle: 'normal' }}>{a.stamp.gloss}</span> : null}
        </span>
        <span style={{ flexShrink: 0, marginTop: 2, fontFamily: LL.mono, fontSize: 13, color: 'rgba(34,28,20,.4)' }}>{open ? '–' : '+'}</span>
      </button>
    </div>
  );
}

function Threads() {
  const conf = window.CASON_CONFIDENCE, data = window.CASON_DATA, mem = window.CASON_MEMORY;
  const rows = useMemo(function () {
    if (!conf || !data) return [];
    // a curated spread of the finds that don't fit the clean story flow —
    // deliberately across the whole confidence ladder, on the people they
    // belong to. `possible`-evidence people supply the REASONED tier.
    const picks = ['ransom-jr', 'casey-ann', 'thadeous', 'ransom-sr', 'carl-columbus', 'james-green', 'moses', 'robert-sr', 'berrien-cason-sr', 'henry-cason-b', 'julia-matilda'];
    const bucket = { strong: [], mid: [], soft: [], open: [], out: [] };
    picks.forEach(function (id) {
      const p = data.people[id]; if (!p) return;
      conf.asidesForPerson(p, mem).forEach(function (a) {
        if (a.kind === 'source' && a.text.length < 40) return;
        (bucket[a.stamp.tone] || bucket.mid).push({ aside: a, who: p.name.replace(/\s*\(.*\)/, '') });
      });
    });
    // quota per tier so every stamp is represented, capped ~2 per person
    const quota = { strong: 3, mid: 2, soft: 3, open: 4, out: 1 };
    const seen = {}, out = [];
    ['strong', 'mid', 'soft', 'open', 'out'].forEach(function (tone) {
      let n = 0;
      bucket[tone].forEach(function (r) {
        if (n >= quota[tone]) return;
        if ((seen[r.who] || 0) >= 2) return;
        seen[r.who] = (seen[r.who] || 0) + 1; n++; out.push(r);
      });
    });
    return out;
  }, []);
  if (!rows.length) return null;
  return (
    <section id="threads" style={{ maxWidth: 1240, margin: '0 auto', padding: '120px 32px 0' }}>
      <SectionHead num="VI" label="THE THREADS" right="TAP TO OPEN · SKIP TO KEEP THE STORY" />
      <div className="ll-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'end', marginBottom: 28 }}>
        <h2 style={{ fontFamily: LL.display, fontWeight: 400, fontSize: 'clamp(30px,3.2vw,44px)', lineHeight: 1.1, margin: 0 }}>The things that don&rsquo;t fit the story &mdash; told straight.</h2>
        <p style={{ margin: 0, fontSize: 16.5, color: LL.body }}>
          The leads, the loose ends, the finds off to the side. Each carries a stamp for exactly how sure we are &mdash; from <em>on the record</em> to <em>reasoned but not concrete</em> to an <em>open question</em> that may never be settled. Collapsed by default; the story reads clean without them.
        </p>
      </div>
      <div style={{ borderBottom: '1px solid rgba(34,28,20,.12)' }}>
        {rows.map(function (r, i) { return <AsideRow key={i} aside={r.aside} who={r.who} />; })}
      </div>
    </section>
  );
}

/* ====================================================================
   Footer
==================================================================== */
function Footer() {
  const linkS = { fontFamily: LL.mono, fontSize: 10.5, letterSpacing: '.14em' };
  return (
    <footer style={{ maxWidth: 1240, margin: '0 auto', padding: '110px 32px 70px' }}>
      <div style={{ borderTop: '1px solid rgba(34,28,20,.3)', paddingTop: 6, borderBottom: '1px solid rgba(34,28,20,.16)' }} />
      <div className="ll-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 40, padding: '44px 0' }}>
        <div>
          <div style={{ fontFamily: LL.display, fontSize: 26, fontWeight: 500 }}>The Living Line</div>
          <p style={{ margin: '10px 0 0', fontSize: 15, color: LL.body2, maxWidth: 300 }}>A project of the Cason family archive. The dead of this family are on speaking terms.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a className="ll-link" href="#line" style={linkS}>THE FAMILY LINE</a>
          <a className="ll-link" href="#method" style={linkS}>THE METHOD</a>
          <a className="ll-link" href="#sheets" style={linkS}>PERSONA SHEETS</a>
          <a className="ll-link" href={WORLD_URL} style={linkS}>THE MEMORY GRAPH</a>
          <a className="ll-link" href={WORLD_URL} style={linkS}>SPEAK WITH AN ANCESTOR</a>
        </div>
        <p style={{ margin: 0, fontFamily: LL.mono, fontSize: 10, letterSpacing: '.08em', lineHeight: 1.8, color: 'rgba(34,28,20,.5)', textAlign: 'right' }}>
          NAMES AND RECORDS SHOWN ARE THE FAMILY&rsquo;S<br />VERIFIED RECORD, POST-AUDIT. CHARACTERIZATION<br />AND VOICE ARE RECONSTRUCTED, AND FLAGGED AS SUCH.
        </p>
      </div>
      <div style={{ borderTop: '1px solid rgba(34,28,20,.16)', paddingTop: 18, fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.14em', color: 'rgba(34,28,20,.45)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span>SET IN CORMORANT GARAMOND, NEWSREADER &amp; IBM PLEX MONO</span>
        <span>FLCASON.COM/LIVING &middot; MMXXVI</span>
      </div>
    </footer>
  );
}

/* ====================================================================
   Root
==================================================================== */
/* the story-depth control — soft, client-side; dials how personal the
   telling gets. Fixed to the corner so it follows the reader. */
function DepthControl(props) {
  const T = window.CASON_TIERS;
  if (!T) return null;
  return (
    <div style={{ position: 'fixed', right: 14, bottom: 14, zIndex: 80, background: 'rgba(23,19,16,.94)', borderRadius: 999,
      padding: '5px 6px', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 6px 22px rgba(0,0,0,.28)' }}>
      <span style={{ fontFamily: LL.mono, fontSize: 9, letterSpacing: '.12em', color: 'rgba(239,230,208,.55)', padding: '0 8px' }}>VIEWING AS</span>
      {T.TIERS.map(function (t) {
        const on = props.viewer === t.key;
        return <button key={t.key} onClick={function () { props.onChange(t.key); }} title={t.blurb}
          style={{ fontFamily: LL.mono, fontSize: 9.5, letterSpacing: '.05em', padding: '6px 11px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: on ? LL.gold : 'transparent', color: on ? '#171310' : 'rgba(239,230,208,.85)' }}>{t.label}</button>;
      })}
    </div>
  );
}

function LivingLine() {
  useOnce(LL_CSS);
  const line = window.CASON_LINE;
  const [viewer, setViewerState] = useState(function () { return window.CASON_TIERS ? window.CASON_TIERS.viewer() : 'outsider'; });
  function pickViewer(key) { if (window.CASON_TIERS) window.CASON_TIERS.setViewer(key); setViewerState(key); }

  if (!line || !line.gens || !line.gens.length) {
    return (
      <div style={{ fontFamily: LL.serif, padding: 60, textAlign: 'center', color: LL.ink }}>
        <p style={{ fontFamily: LL.display, fontSize: 28 }}>The Living Line is loading&hellip;</p>
        <p style={{ color: LL.body }}>If this persists, the family record failed to load.</p>
      </div>
    );
  }

  const stats = useMemo(function () {
    var personas = 0;
    line.gens.forEach(function (g) { personas += g.members.length; });
    return {
      personas: personas,
      generations: line.gens.length,
      years: line.present - line.start,
      start: line.start,
      present: line.present
    };
  }, [line]);

  return (
    <div style={{ minHeight: '100vh', fontFamily: LL.serif, fontSize: 18, lineHeight: 1.6, color: LL.ink, background: LL.bg }}>
      <Nav />
      <DepthControl viewer={viewer} onChange={pickViewer} />
      <Hero stats={stats} />
      <FamilyLine line={line} showCat={true} viewer={viewer} />
      <Method stats={stats} />
      <Sheets line={line} stats={stats} />
      <GraphTeaser line={line} />
      <TheNumbers />
      <Threads />
      <Roadmap />
      <Footer />
    </div>
  );
}

window.LivingLine = LivingLine;
