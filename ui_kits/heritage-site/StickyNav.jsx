/* Sticky nav that appears after the hero leaves view, with a reading-progress bar. */

const navItems = [
  { id: 'prologue', label: 'Before' },
  { id: 'map', label: 'Map' },
  { id: 'part1', label: 'Thomas' },
  { id: 'part2', label: 'The Chain' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'part3', label: 'Ransom Sr.' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'closing', label: 'The Pattern' },
];

const navStyles = {
  bar: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    background: 'rgba(26,39,68,0.95)',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s ease',
  },
  inner: {
    maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center',
    overflowX: 'auto',
  },
  brand: {
    fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700,
    color: 'var(--gold-bright)', whiteSpace: 'nowrap',
    padding: '0.7rem 1rem',
    borderRight: '1px solid rgba(196,154,60,0.2)',
    flexShrink: 0,
  },
  link: {
    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
    color: 'rgba(244,237,228,0.6)', textDecoration: 'none',
    padding: '0.7rem 0.7rem', whiteSpace: 'nowrap',
    letterSpacing: '0.03em', flexShrink: 0,
    transition: 'color 0.2s', cursor: 'pointer',
  },
  linkActive: { color: 'var(--gold-bright)' },
  progress: {
    position: 'fixed', top: 0, left: 0, height: 3, zIndex: 1002,
    background: 'linear-gradient(90deg, var(--gold-bright), var(--rust))',
    transition: 'width 0.1s linear',
  },
};

const StickyNav = ({ visible, active, progress, onClick }) => (
  <>
    <div style={{ ...navStyles.progress, width: `${progress}%` }} />
    <nav style={{
      ...navStyles.bar,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
    }}>
      <div style={navStyles.inner}>
        <span style={navStyles.brand}>The Cason Line</span>
        {navItems.map(item => (
          <a
            key={item.id}
            style={{ ...navStyles.link, ...(active === item.id ? navStyles.linkActive : {}) }}
            onClick={() => onClick(item.id)}
          >{item.label}</a>
        ))}
      </div>
    </nav>
  </>
);

window.StickyNav = StickyNav;
