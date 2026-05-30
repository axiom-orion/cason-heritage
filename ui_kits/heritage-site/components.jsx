/* Shared primitives for the Heritage Site UI kit. */

const Seam = ({ from = 'var(--deep-blue)', to = 'var(--parchment)', height = 64 }) => (
  <div style={{
    height,
    background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
  }} />
);

const Eyebrow = ({ children, color = 'var(--gold)', style = {} }) => (
  <div style={{
    fontFamily: 'var(--font-sans)',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color,
    marginBottom: 4,
    ...style,
  }}>{children}</div>
);

const Pullquote = ({ children }) => (
  <div style={{
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontStyle: 'italic',
    color: 'var(--rust)',
    textAlign: 'center',
    padding: '2rem',
    margin: '2rem 0',
    borderTop: '2px solid var(--gold)',
    borderBottom: '2px solid var(--gold)',
    lineHeight: 1.5,
  }}>{children}</div>
);

const StatGrid = ({ stats }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    margin: '2rem 0',
  }}>
    {stats.map((s, i) => (
      <div key={i} style={{
        background: 'var(--cream)',
        border: '1px solid rgba(139,69,19,0.15)',
        borderRadius: 10,
        padding: '1.5rem',
        textAlign: 'center',
        boxShadow: '0 2px 12px rgba(44,24,16,0.05)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.2rem',
          fontWeight: 900,
          color: 'var(--blood)',
          lineHeight: 1,
        }}>{s.num}</div>
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.85rem',
          color: 'var(--faded)',
          marginTop: 6,
        }}>{s.label}</div>
      </div>
    ))}
  </div>
);

const Divider = () => (
  <div style={{
    textAlign: 'center',
    padding: '3rem 0',
    color: 'var(--gold)',
    fontSize: '1.5rem',
    letterSpacing: '0.5em',
  }}>• • •</div>
);

const SectionSub = ({ children }) => (
  <p style={{
    textAlign: 'center',
    color: 'var(--faded)',
    fontStyle: 'italic',
    marginBottom: '2rem',
    fontFamily: 'var(--font-serif)',
  }}>{children}</p>
);

const SourceLink = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener" style={{
    color: 'rgba(196,154,60,0.6)',
    textDecoration: 'none',
  }}>{children}</a>
);

Object.assign(window, { Seam, Eyebrow, Pullquote, StatGrid, Divider, SectionSub, SourceLink });
