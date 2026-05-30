/* Evidence-board table — candidate elimination with row-tint statuses. */

const evidenceRows = [
  { son: 'Cannon Sr.', dates: 'c.1724–c.1779', fate: 'Left Pitt Co. by 1752 for Duplin Co., then South Carolina. Will does NOT name Ransom.', status: 'ELIMINATED', tone: 'eliminated' },
  { son: 'William Jr.', dates: 'b.1723–c.1778', fate: 'Left with Cannon by 1752. Died in NC. Never went to Georgia.', status: 'ELIMINATED', tone: 'eliminated' },
  { son: 'Hillery', dates: '1737–1810', fate: 'Moved to interior Georgia, not coastal Glynn where Ransom settled. Barrow surname link noted.', status: 'UNLIKELY', tone: 'unlikely' },
  { son: 'John', dates: 'c.1728–?', fate: 'Stayed Pitt Co. 1790 census: 12 slaves. No positive link to Ransom.', status: 'POSSIBLE', tone: 'possible' },
  { son: 'Henry', dates: 'c.1732–after 1823', fate: '1823 deeds (Book CC p.229) show separate local branch with zero mention of Ransom\'s family.', status: 'SECONDARY', tone: 'secondary' },
  { son: 'James', dates: 'c.1727–?', fate: 'No land records. "James Jr." (c.1750) listed as Ransom\'s brother — implying father named James.', status: 'LEADING', tone: 'leading' },
];

const evidenceStyles = {
  section: { maxWidth: 1000, margin: '0 auto', padding: '4rem 2rem' },
  h2: { fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '2rem', color: 'var(--rust)', marginBottom: '0.5rem' },
  wrap: { overflowX: 'auto', margin: '2rem 0', borderRadius: 8, boxShadow: '0 2px 12px rgba(44,24,16,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', background: 'var(--cream)' },
  thtr: { borderBottom: '3px solid var(--rust)' },
  th: { padding: '12px 14px', color: 'var(--rust)', fontWeight: 700, textAlign: 'left' },
  td: { padding: '12px 14px', verticalAlign: 'top' },
  rowToneMap: {
    eliminated: { background: 'rgba(107,29,29,0.05)' },
    unlikely:   { background: 'rgba(107,29,29,0.05)' },
    possible:   { background: 'transparent' },
    secondary:  { background: 'rgba(196,154,60,0.08)' },
    leading:    { background: 'rgba(45,90,74,0.10)' },
  },
  statusToneMap: {
    eliminated: { color: 'var(--blood)' },
    unlikely:   { color: 'var(--faded)' },
    possible:   { color: 'var(--faded)' },
    secondary:  { color: 'var(--gold)' },
    leading:    { color: 'var(--sea-green)' },
  },
};

const EvidenceTable = () => (
  <section id="evidence" style={evidenceStyles.section}>
    <h2 style={evidenceStyles.h2}>The Evidence Board</h2>
    <SectionSub>Eliminating candidates for Ransom's father — William Cason's six sons</SectionSub>
    <div style={evidenceStyles.wrap}>
      <table style={evidenceStyles.table}>
        <thead>
          <tr style={evidenceStyles.thtr}>
            <th style={evidenceStyles.th}>Son</th>
            <th style={evidenceStyles.th}>Dates</th>
            <th style={evidenceStyles.th}>Fate</th>
            <th style={evidenceStyles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {evidenceRows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(139,69,19,0.1)', ...evidenceStyles.rowToneMap[r.tone] }}>
              <td style={{ ...evidenceStyles.td, fontWeight: 600 }}>{r.son}</td>
              <td style={evidenceStyles.td}>{r.dates}</td>
              <td style={evidenceStyles.td}>{r.fate}</td>
              <td style={{ ...evidenceStyles.td, fontWeight: 700, ...evidenceStyles.statusToneMap[r.tone] }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

window.EvidenceTable = EvidenceTable;
