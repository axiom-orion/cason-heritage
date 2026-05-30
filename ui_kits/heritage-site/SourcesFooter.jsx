/* Three-column sources footer on deep-blue, with share row. */

const footerSources = {
  primary: [
    { href: 'https://www.wikitree.com/wiki/Cason-75', label: 'Thomas Cason Sr. — WikiTree' },
    { href: 'https://www.wikitree.com/wiki/Cason-177', label: 'Ransom Cason Sr. — WikiTree' },
    { href: 'https://www.wikitree.com/wiki/Cason-543', label: 'Lt. Ransom Cason 2 — WikiTree' },
    { href: '#', label: 'Alachua Co. Will Book A, pp. 35-36' },
    { href: '#', label: 'Pitt Co. Deed Book CC, p. 229' },
  ],
  military: [
    { href: '#', label: '7th FL Infantry — NPS' },
    { href: '#', label: 'Jamestown Starving Time' },
    { href: '#', label: 'Seminole Wars — FL Dept. of State' },
    { href: '#', label: 'Adams-Onis Treaty — State Dept.' },
  ],
  cemeteries: [
    { href: '#', label: 'Becky Cason — FindAGrave' },
    { href: '#', label: 'Tustenuggee Methodist Cemetery' },
    { href: '#', label: 'FL Pioneer Program — FSGS' },
    { href: '#', label: 'FL Pioneer Certificate #2015S0027' },
  ],
};

const footerStyles = {
  footer: { background: 'var(--deep-blue)', padding: '3rem 2rem', color: 'rgba(244,237,228,0.5)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', lineHeight: 1.6 },
  grid: { maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' },
  h3: { fontFamily: 'var(--font-display)', color: 'var(--gold-bright)', fontSize: '1.1rem', marginBottom: '1rem' },
  h4: { color: 'rgba(244,237,228,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  ul: { listStyle: 'none', padding: 0 },
  li: { marginBottom: '0.35rem' },
  bottom: { maxWidth: 1000, margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,154,60,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  share: { display: 'flex', gap: 8, alignItems: 'center' },
  shareLink: { padding: '0.3rem 0.8rem', border: '1px solid rgba(196,154,60,0.3)', borderRadius: 4, fontSize: '0.75rem', color: 'rgba(196,154,60,0.6)', textDecoration: 'none' },
};

const SourcesFooter = () => (
  <footer style={footerStyles.footer}>
    <div style={footerStyles.grid}>
      <div>
        <h3 style={footerStyles.h3}>Sources</h3>
        <h4 style={footerStyles.h4}>Primary</h4>
        <ul style={footerStyles.ul}>{footerSources.primary.map((s, i) => <li key={i} style={footerStyles.li}><SourceLink href={s.href}>{s.label}</SourceLink></li>)}</ul>
      </div>
      <div>
        <h4 style={{ ...footerStyles.h4, marginTop: '2.4rem' }}>Military &amp; Historical</h4>
        <ul style={footerStyles.ul}>{footerSources.military.map((s, i) => <li key={i} style={footerStyles.li}><SourceLink href={s.href}>{s.label}</SourceLink></li>)}</ul>
      </div>
      <div>
        <h4 style={{ ...footerStyles.h4, marginTop: '2.4rem' }}>Cemeteries &amp; Records</h4>
        <ul style={footerStyles.ul}>{footerSources.cemeteries.map((s, i) => <li key={i} style={footerStyles.li}><SourceLink href={s.href}>{s.label}</SourceLink></li>)}</ul>
      </div>
    </div>
    <div style={footerStyles.bottom}>
      <div>
        <span style={{ color: 'rgba(244,237,228,0.4)' }}>Compiled April 2026. Research ongoing.</span><br/>
        <span style={{ color: 'rgba(244,237,228,0.3)', fontSize: '0.75rem' }}>Have information about the Cason family? Corrections welcome.</span>
      </div>
      <div style={footerStyles.share}>
        <span style={{ color: 'rgba(244,237,228,0.4)', fontSize: '0.75rem' }}>Share:</span>
        <a href="#" style={footerStyles.shareLink}>X</a>
        <a href="#" style={footerStyles.shareLink}>Facebook</a>
        <a href="#" style={footerStyles.shareLink}>Copy Link</a>
      </div>
    </div>
  </footer>
);

window.SourcesFooter = SourcesFooter;
