/* The full timeline: center spine, alternating cards, eleven generations. */

const generations = [
  { side: 'left', variant: 'highlight', number: 'Generation 1 — The Crossing', name: 'Thomas Cason Sr.', dates: 'bapt. 1608 – 1651', location: 'Digswell, Hertfordshire → Lynnhaven Parish, Virginia', detail: 'Son of John Cason. Emigrated ~1628 at age 20. Name on Jamestown memorial wall. Married Elizabeth Alcott ~1635. Church Warden. Estate: 28,170 lbs tobacco.' },
  { side: 'right', number: 'Generation 2', name: 'Thomas Cason Jr.', dates: 'b. after 1642 – 1665', location: 'Lynnhaven Parish, Virginia', detail: 'Tobacco planter. Married Sarah Poole ~1654. One son: James. Sarah died Aug 21, 1661. Thomas Jr. died 1665. His brother James also died 1665 without children. The entire line passed through one orphaned boy.' },
  { side: 'left', number: 'Generation 3', name: 'James Cason', dates: 'c.1655 – 1722', location: 'Princess Anne County, Virginia', detail: 'Orphaned by age 10. Married Anne ~1678. 450 acres via headright. Six children including William. Will: Feb 5, 1720.' },
  { side: 'right', number: 'Generation 4 — The Carolina Move', name: 'William Cason', dates: 'c.1695 – 1764', location: 'Virginia → Beaufort/Pitt Co., North Carolina', detail: 'Married Jane Cannon, 1721. Moved family to NC in 1723. Land grant 1740. Six sons including Cannon, William Jr., James, John, Henry, Hillery.' },
  { side: 'left', variant: 'gap', badge: 'UNSOLVED — RECORDS NEEDED', number: 'Generation 5 — The Missing Link', name: 'James Cason (c.1727) or Henry Cason (c.1732)', dates: 'c.1727 – ?', location: 'Pitt County, North Carolina', detail: 'James is the leading candidate — no land records, "James Cason Jr." appears as Ransom\'s brother. Henry is secondary — right location, but his 1823 deeds show a separate local branch. The Pitt County records of 1750–1800 are the path to certainty.' },
  { side: 'right', variant: 'highlight', number: 'Generation 6 — The Florida Crossing', name: 'Ransom Cason Sr.', dates: 'c.1763 – 1853', location: 'Pitt Co., NC → Glynn Co., GA → Alachua Co., Florida', detail: 'Married Phoebe Munden. Nine children, seven moved to FL. Florida Pioneer #P2015-0072. Will Book A pp.35-36. Survived the Second Seminole War. Died at ~90.' },
  { side: 'left', number: 'Generation 7', name: 'James Green Cason', dates: 'c.1800 – 1878', location: 'Alachua County, Florida', detail: 'Married Lucinda "Lucy" Barrow. At least nine children. Continued the farm and family in the land his father settled.' },
  { side: 'right', number: 'Generation 8', name: 'Lt. Ransom Cason "2"', dates: '1835 – 1900', location: 'Alachua County, Florida', detail: 'Lt., 7th FL Infantry, Army of Tennessee. Chickamauga, Missionary Ridge, Atlanta, Franklin, Nashville, Bentonville. Pension A00841.' },
  { side: 'left', number: 'Generation 9', name: 'Thadeous Calhoun Cason', dates: '1857 – 1945', location: 'Columbia County, Florida', detail: 'Married Georgia Quintine McKinney, December 24, 1882. 12–14 children. Buried at Tustenuggee Methodist Cemetery, Fort White. Lived to 88.' },
  { side: 'right', number: 'Generation 10', name: 'Carl Columbus Cason', dates: '1903 – 1966', location: 'Columbia County, Florida', detail: 'Married Wilma Douglas. Thirteen children: Dorothy "Dot," Buddy, Robert Sr., Noah, Wyles, Jake, Lawrence, Earl, Paul, Johnny, Marie, Zeke, Kate.' },
  { side: 'left', variant: 'highlight', number: 'Generation 11 — The Space Coast', name: 'Robert Randall Cason Sr.', dates: 'b. 1933', location: 'Fort White → Titusville, Brevard Co., Florida', detail: 'Born 1933 in the farmhouse on CR 778 (still standing). In 1957 moved to Titusville — watched rockets leave the Earth as Brevard grew 371% in a decade.' },
];

const timelineStyles = {
  section: { padding: '5rem 2rem', maxWidth: 900, margin: '0 auto' },
  h2: { fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '2.2rem', color: 'var(--rust)', marginBottom: '0.5rem' },
  rail: { position: 'relative', padding: '1rem 0' },
  spine: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, var(--gold), var(--rust), var(--deep-blue))' },
};

const Timeline = () => (
  <section id="timeline" style={timelineStyles.section}>
    <h2 style={timelineStyles.h2}>The Full Line</h2>
    <SectionSub>Eleven generations, three and a half centuries, one unbroken thread</SectionSub>
    <div style={timelineStyles.rail}>
      <div style={timelineStyles.spine} />
      {generations.map((g, i) => <GenCard key={i} {...g} />)}
    </div>
  </section>
);

window.Timeline = Timeline;
