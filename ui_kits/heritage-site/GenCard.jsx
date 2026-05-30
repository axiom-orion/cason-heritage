/* Timeline generation card — default, highlight (direct line), gap (unsolved). */

const genCardStyles = {
  base: {
    position: 'relative',
    width: '44%',
    padding: '1.5rem',
    background: 'var(--cream)',
    borderRadius: 10,
    border: '1px solid rgba(139,69,19,0.15)',
    boxShadow: '0 4px 20px rgba(44,24,16,0.08)',
    marginBottom: '2.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  hover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 30px rgba(44,24,16,0.15)',
    borderColor: 'var(--gold)',
  },
  highlight: {
    border: '2px solid var(--gold)',
    background: 'linear-gradient(135deg, var(--cream), #fff8ec)',
  },
  gap: {
    border: '2px dashed var(--rust)',
    background: 'linear-gradient(135deg, #fff8ec, #fef3e2)',
  },
  number: { fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 },
  name: { fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 2 },
  dates: { fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'var(--faded)', marginBottom: 8 },
  loc: { fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--sea-green)', fontWeight: 600, marginBottom: 8 },
  detail: { fontSize: '0.92rem', color: 'var(--ink)', lineHeight: 1.6, fontFamily: 'var(--font-serif)' },
  hint: { fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--gold)', marginTop: 6, letterSpacing: '0.05em' },
  badge: { display: 'inline-block', background: 'var(--rust)', color: 'white', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em', marginBottom: 6 },
  dot: (side) => ({
    content: '""', position: 'absolute', top: 24, width: 14, height: 14,
    background: 'var(--gold)', border: '3px solid var(--cream)',
    borderRadius: '50%', boxShadow: '0 0 0 3px var(--gold)', zIndex: 2,
    [side === 'left' ? 'right' : 'left']: '-8.5%',
  }),
};

const GenCard = ({ side = 'left', variant = 'default', number, name, dates, location, detail, badge }) => {
  const [hover, setHover] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const merge = {
    ...genCardStyles.base,
    ...(variant === 'highlight' ? genCardStyles.highlight : {}),
    ...(variant === 'gap' ? genCardStyles.gap : {}),
    ...(hover ? genCardStyles.hover : {}),
    marginLeft: side === 'left' ? 0 : 'auto',
    marginRight: side === 'right' ? 0 : 'auto',
  };

  return (
    <div
      style={merge}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => setExpanded(e => !e)}
    >
      <span style={genCardStyles.dot(side)} />
      {badge && <div style={genCardStyles.badge}>{badge}</div>}
      <div style={genCardStyles.number}>{number}</div>
      <div style={genCardStyles.name}>{name}</div>
      <div style={genCardStyles.dates}>{dates}</div>
      <div style={genCardStyles.loc}>{location}</div>
      <div style={{
        maxHeight: expanded ? 600 : 0,
        overflow: 'hidden',
        opacity: expanded ? 1 : 0,
        transition: 'max-height 0.5s ease, opacity 0.3s ease',
      }}>
        <div style={genCardStyles.detail}>{detail}</div>
      </div>
      {!expanded && <div style={genCardStyles.hint}>+ tap to read more</div>}
    </div>
  );
};

window.GenCard = GenCard;
