/* Narrative section — a prose block in the source's house style. */

const narrativeStyles = {
  section: { maxWidth: 780, margin: '0 auto', padding: '4rem 2rem' },
  h2: { fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--rust)', marginBottom: '0.5rem', textAlign: 'center' },
  h3: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--deep-blue)', margin: '2.5rem 0 1rem' },
  p: { fontSize: '1.05rem', marginBottom: '1.3rem', textAlign: 'justify', fontFamily: 'var(--font-serif)', lineHeight: 1.7, color: 'var(--ink)' },
};

const Narrative = ({ id, h2, sub, children }) => (
  <section id={id} style={narrativeStyles.section}>
    {h2 && <h2 style={narrativeStyles.h2}>{h2}</h2>}
    {sub && <SectionSub>{sub}</SectionSub>}
    {children}
  </section>
);

const NH3 = ({ children }) => <h3 style={narrativeStyles.h3}>{children}</h3>;
const NP = ({ children }) => <p style={narrativeStyles.p}>{children}</p>;

Object.assign(window, { Narrative, NH3, NP });
