/* Closing section — parchment fades into deep-blue, "The Pattern". */

const closingStyles = {
  section: {
    background: 'var(--deep-blue)',
    padding: '6rem 2rem 8rem',
    textAlign: 'center',
    color: 'var(--cream)',
  },
  h2: { fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--gold-bright)' },
  p: { maxWidth: 700, margin: '0 auto 1.5rem', fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(244,237,228,0.85)', fontFamily: 'var(--font-serif)' },
  final: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontStyle: 'italic', color: 'var(--gold-bright)', marginTop: '3rem' },
  crest: { marginTop: '3rem', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,154,60,0.5)' },
};

const Closing = () => (
  <section id="closing" style={closingStyles.section}>
    <h2 style={closingStyles.h2}>The Pattern</h2>
    <p style={closingStyles.p}>
      <strong>Thomas Cason</strong> left Hertfordshire at twenty and crossed the Atlantic to a colony that killed eighty percent of the people who came to it. He had no guarantee of survival. He went anyway. <strong>Ransom Cason</strong> left a settled life in Georgia at sixty. He walked his wife and eight children through swamps, past the Okefenokee, into a territory with 8,000 people and no roads. He built a farm. He died on it at ninety.
    </p>
    <p style={closingStyles.p}>
      Neither man had to go. That is the point. They chose the unknown. They chose the harder thing. Not because they were reckless, but because they understood something about what a life is worth.
    </p>
    <p style={closingStyles.final}>The inheritance is the willingness to move.</p>
    <div style={closingStyles.crest}>Cason · Digswell, 1608 · Cawston, Norfolk · Domesday Book, 1086</div>
  </section>
);

window.Closing = Closing;
