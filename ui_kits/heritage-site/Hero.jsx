/* Hero unit — title, subtitle, tagline, hero-moments rail, scroll-hint. */

const heroMoments = [
  { year: '1628', line: 'Crossed the Atlantic', name: 'Thomas Sr.' },
  { year: '1665', line: 'Orphan carries the name', name: 'James' },
  { year: '1823', line: 'Walked into Florida', name: 'Ransom Sr.' },
  { year: '1862', line: 'Marched to war', name: 'Ransom II' },
  { year: '1888', line: 'Chased the boom west', name: 'Thadeous' },
  { year: '1930s', line: '13 children, $7/month', name: 'Carl Columbus' },
  { year: '1957', line: 'Space Coast', name: 'Robert Sr.' },
];

const heroStyles = {
  section: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    background: 'var(--deep-blue)',
    padding: '2rem',
    position: 'relative',
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
    fontWeight: 900,
    color: 'var(--cream)',
    letterSpacing: '0.04em',
    marginBottom: '0.5rem',
    textShadow: '0 2px 20px rgba(0,0,0,0.5)',
    lineHeight: 1.05,
  },
  sub: {
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(1rem, 2vw, 1.4rem)',
    color: 'var(--gold-bright)',
    fontWeight: 300,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginBottom: '2rem',
  },
  tag: {
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    color: 'rgba(244,237,228,0.75)',
    fontSize: '1.1rem',
    maxWidth: 640,
    margin: '0 auto 2rem',
    lineHeight: 1.6,
  },
  moments: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 820,
    margin: '2.5rem auto 2rem',
    position: 'relative',
  },
  rule: {
    position: 'absolute',
    top: '50%', left: '5%', right: '5%', height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(196,154,60,0.4), transparent)',
  },
  moment: { textAlign: 'center', padding: '0.6rem 0.8rem', flex: '1 1 0', minWidth: 110 },
  year: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-bright)', display: 'block', marginBottom: 2 },
  line: { fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(244,237,228,0.55)', letterSpacing: '0.03em', lineHeight: 1.3, display: 'block' },
  name: { fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'rgba(244,237,228,0.4)', fontStyle: 'italic', display: 'block', marginTop: 2 },
  dates: { fontFamily: 'var(--font-sans)', color: 'var(--gold-bright)', fontSize: '1rem', letterSpacing: '0.3em', opacity: 0.85, marginTop: 8 },
  scrollHint: {
    position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
    color: 'var(--gold-bright)', fontSize: '0.85rem', letterSpacing: '0.1em',
    textAlign: 'center', cursor: 'pointer', animation: 'caosBounce 2s infinite',
  },
};

const Hero = ({ onBegin }) => (
  <section style={heroStyles.section}>
    <style>{`@keyframes caosBounce { 0%,20%,50%,80%,100% { transform: translateX(-50%) translateY(0); } 40% { transform: translateX(-50%) translateY(-10px); } 60% { transform: translateX(-50%) translateY(-5px); } }`}</style>
    <div style={{ position: 'relative', zIndex: 2 }}>
      <h1 style={heroStyles.h1}>Into the Unknown</h1>
      <div style={heroStyles.sub}>The Cason Line</div>
      <p style={heroStyles.tag}>
        A man left England with nothing. His grandson was orphaned at ten and carried the name alone. Their descendant walked into Florida at sixty. His great-grandson marched through the Civil War. Eleven generations. The inheritance is the willingness to move.
      </p>
      <div style={heroStyles.moments}>
        <div style={heroStyles.rule} />
        {heroMoments.map(m => (
          <div key={m.year} style={heroStyles.moment}>
            <span style={heroStyles.year}>{m.year}</span>
            <span style={heroStyles.line}>{m.line}</span>
            <span style={heroStyles.name}>{m.name}</span>
          </div>
        ))}
      </div>
      <div style={heroStyles.dates}>HERTFORDSHIRE, 1608 — TITUSVILLE, 1957</div>
    </div>
    <div style={heroStyles.scrollHint} onClick={onBegin}>
      Begin the Journey
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" strokeWidth="2" strokeLinecap="round" style={{ display: 'block', margin: '8px auto 0', width: 24, height: 24 }}>
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    </div>
  </section>
);

window.Hero = Hero;
