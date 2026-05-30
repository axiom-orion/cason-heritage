/* Map section — stylized placeholder for the Leaflet interactive map. */

const mapStyles = {
  section: { position: 'relative', padding: '4rem 2rem 2rem' },
  h2: { fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '2rem', color: 'var(--rust)', marginBottom: '0.5rem' },
  frame: {
    width: '100%', maxWidth: 1100, height: 360, margin: '0 auto',
    borderRadius: 12, border: '3px solid var(--rust)',
    boxShadow: '0 10px 40px rgba(44,24,16,0.2)',
    background: `linear-gradient(135deg, #f7efe2 0%, #ede2cf 100%)`,
    backgroundImage: `radial-gradient(circle at 25% 60%, rgba(196,154,60,0.12) 0 1.5%, transparent 1.6%),
                       radial-gradient(circle at 38% 58%, rgba(45,90,74,0.18) 0 1.2%, transparent 1.3%),
                       radial-gradient(circle at 58% 64%, rgba(45,90,74,0.18) 0 1.2%, transparent 1.3%),
                       radial-gradient(circle at 67% 70%, rgba(139,69,19,0.18) 0 1.2%, transparent 1.3%),
                       radial-gradient(circle at 74% 78%, rgba(107,29,29,0.22) 0 1.4%, transparent 1.5%),
                       radial-gradient(circle at 78% 86%, rgba(212,168,37,0.4) 0 1.6%, transparent 1.7%),
                       linear-gradient(135deg, #f7efe2 0%, #ede2cf 100%)`,
    position: 'relative',
    overflow: 'hidden',
  },
  caption: {
    position: 'absolute', bottom: 16, left: 20,
    fontFamily: 'var(--font-display)', fontStyle: 'italic',
    fontSize: '0.95rem', color: 'var(--faded)',
  },
  legend: {
    maxWidth: 1100, margin: '1.5rem auto 0',
    display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--faded)',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: (c) => ({ width: 12, height: 12, borderRadius: '50%', display: 'inline-block', background: c }),
};

const MapSection = () => (
  <section id="map" style={mapStyles.section}>
    <h2 style={mapStyles.h2}>The Migration</h2>
    <SectionSub>England → Virginia → North Carolina → Georgia → Florida</SectionSub>
    <div style={mapStyles.frame}>
      <div style={mapStyles.caption}>Leaflet map · England to the Space Coast · stylized in this kit</div>
    </div>
    <div style={mapStyles.legend}>
      <span style={mapStyles.legendItem}><span style={mapStyles.dot('#d4a825')} /> Atlantic Crossing (1620s–1630s)</span>
      <span style={mapStyles.legendItem}><span style={mapStyles.dot('#8b4513')} /> Colonial Expansion</span>
      <span style={mapStyles.legendItem}><span style={mapStyles.dot('#2d5a4a')} /> Frontier Push</span>
      <span style={mapStyles.legendItem}><span style={mapStyles.dot('#6b1d1d')} /> Florida Settlement</span>
    </div>
  </section>
);

window.MapSection = MapSection;
