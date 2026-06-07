/* Eleven generations of the Cason line — extensible data shape.
   Add new persons by appending here. Use `id` for cross-refs.
   Unknown fields: leave as null or empty array. Mark uncertainty with `evidence`. */

const CASON_DATA = {
  family: {
    name: 'Into the Unknown — The Cason Line',
    span: 'c.1604 – present (~12 generations, Gen 5 unfilled)',
    rootId: 'thomas-sr',
    notes: 'Post-audit. Gen 1 origin in Digswell, Hertfordshire is DISPROVEN — discard the 1608 baptism, "son of John Cason," "Elizabeth Alcott," and ~1629 crossing. The verified immigrant is Thomas Casson, headright of Capt. Thomas Harwood per the 7 July 1635 patent (Patent Book 1, p.124); born ~1604 (1642 deposition); m. Elizabeth (Keeling) Leighton. The Florida branch from Ransom Cason Sr. (c.1763) forward is anchored independently and inherits zero risk from Gen 1. The Gen 5 link between William⁴ Cason (~1691) and Ransom Sr. (~1763) remains the load-bearing weakness — resolve via Pitt Co. NC records 1750–1800 + Y-DNA.',
  },

  people: {
    'thomas-sr': {
      id: 'thomas-sr',
      generation: 1,
      name: 'Thomas Casson',
      role: 'The Crossing — origin unproven',
      lifespan: 'c.1604 – 1651',
      born: { year: 1604, place: 'England (origin unproven)', coords: [51.8167, -0.1833] },
      died: { year: 1651, place: 'Lynnhaven Parish, Lower Norfolk Co., Virginia', coords: [36.8879, -76.0174] },
      spouse: ['elizabeth-keeling-leighton'],
      parents: [],
      children: ['james-1634', 'ruth', 'thomas-jr'],
      direct: true,
      portrait: null,
      narrative: 'Documented as a headright of Captain Thomas Harwood, transported to Virginia in the patent of 7 July 1635 (Patent Book 1, p.124). A 1642 deposition records his age as 38 — birth ~1604. By the early 1640s he was an established planter in Lynnhaven Parish, married to Elizabeth (Keeling) Leighton, widow of William Leighton, acquiring land in her right of dower. Court records 1640–1651 show him as executor, appraiser, and trusted neighbor. Died 1651; widow granted administration 15 April 1652. Estate inventory 26 June 1652: 28,170 lbs tobacco; appraisers Christopher Burroughs, Thomas Hall, Robert Davis, Edward Cannon (NOT a Cason — root of the Cason/Cannon conflation in derivative trees).',
      evidence: 'confirmed',
      sources: ['Virginia Patent Book 1, p.124 (7 July 1635 Harwood headright)', 'Nugent, Cavaliers and Pioneers Vol. 1', 'Lower Norfolk Order Books 1640–1651', '1642 deposition (age 38)', '1652 estate inventory'],
      tags: ['immigrant', 'tobacco-planter', 'headright'],
      notes: 'DISPROVEN — Discard: "Digswell 1608 baptism," "son of John Cason," "~1629 crossing," "Elizabeth Alcott," and "Church Warden of Lynnhaven Parish." These appear in derivative IGI-era trees but have no primary record support. The Digswell parish-register abstracts begin 1609 (one year AFTER the alleged 1608 baptism), and Cason/Casson is a Lincolnshire/Cambridgeshire/Norfolk surname, not Hertfordshire. Recorded as "Casson" in Virginia — possibly a distinct northern-English surname.',
    },
    'elizabeth-keeling-leighton': { id: 'elizabeth-keeling-leighton', generation: 1, name: 'Elizabeth (Keeling) Leighton', role: 'm. Thomas Casson', lifespan: '? – aft. 1652', spouse: ['william-leighton', 'thomas-sr', 'john-stratton'], children: ['james-1634','ruth','thomas-jr'], direct: false, narrative: 'Widow of William Leighton. Brought 100-acre Keeling patent (originally 1635, Thomas Keeling) to her marriage with Thomas Casson; the land was acquired by Thomas "in right of his wife Elizabeth" via the 1641 patent assignment (Elizabeth City County). After Thomas\'s death she received letters of administration on 15 April 1652 and remarried John Stratton later that year.', evidence: 'confirmed', tags: ['matriarch'], notes: 'CORRECTION — earlier trees named her "Elizabeth Alcott," but the primary 1641 patent identifies her as the relict of William Leighton/Laighton. "Alcott" is unsourced.' },
    'john-cason': { id: 'john-cason', generation: 0, name: 'John Cason (alleged)', role: 'England — DISPUTED', lifespan: 'unknown', children: ['thomas-sr'], direct: false, evidence: 'eliminated', narrative: 'No Digswell John Cason c.1580–1610 located in Hertfordshire manorial, will, or Quarter-Sessions records. Often welded to a fully invented claim that he was "a stockholder in the Virginia Land Company" — there was no such company, and no John Cason appears in Kingsbury\'s Records of the Virginia Company. Treat as a backward reconstruction from American trees.', tags: ['unsolved','disproven'] },

    'james-1634': { id: 'james-1634', generation: 2, name: 'James Cason', role: 'd. unmarried, 1665', lifespan: 'c.1634 – 1665', parents: ['thomas-sr','elizabeth-keeling-leighton'], siblings: ['ruth','thomas-jr'], direct: false, evidence: 'confirmed', narrative: 'Thomas Sr.\'s firstborn son. Died 1665. Never married. Left no children.' },
    'ruth': { id: 'ruth', generation: 2, name: 'Ruth Cason', role: 'm. Woodhouse', lifespan: 'c.1638 – ?', parents: ['thomas-sr','elizabeth-keeling-leighton'], spouse: ['woodhouse'], direct: false, evidence: 'confirmed', narrative: 'Married into the Woodhouse family. Carried no Cason name forward.' },
    'thomas-jr': {
      id: 'thomas-jr', generation: 2, name: 'Thomas Cason Jr.', role: 'tobacco planter',
      lifespan: 'b. aft. 1642 – 1665', parents: ['thomas-sr','elizabeth-keeling-leighton'],
      spouse: ['sarah-poole'], children: ['james-orphan'],
      born: { place: 'Lynnhaven Parish, Virginia', coords: [36.8879, -76.0174] },
      direct: true, evidence: 'confirmed',
      narrative: 'Tobacco planter. Married Sarah Poole around 1654. One son: James. Sarah died August 21, 1661. Thomas Jr. died 1665, leaving the boy James orphaned at ten.',
    },
    'sarah-poole': { id: 'sarah-poole', generation: 2, name: 'Sarah Poole', role: 'm. Thomas Jr.', lifespan: '? – 1661', spouse: ['thomas-jr'], children: ['james-orphan'], direct: false, evidence: 'confirmed', narrative: 'Died August 21, 1661, when her son James was six.' },

    'james-orphan': {
      id: 'james-orphan', generation: 3, name: 'James Cason',
      role: 'The Orphan — sole male Cason, 1665',
      lifespan: '1655 – 1722',
      born: { place: 'Lynnhaven Parish, Virginia', coords: [36.8879, -76.0174] },
      died: { year: 1722, place: 'Princess Anne County, Virginia', coords: [36.84, -76.05] },
      parents: ['thomas-jr','sarah-poole'], spouse: ['anne'],
      children: ['susannah','thomas-3','james-jr-1690','elizabeth','dynah','william-1695'],
      direct: true, evidence: 'confirmed',
      narrative: 'By 1665, age ten, James was the sole surviving male Cason in Virginia. Father (Thomas Jr.) dead 1665. Mother (Sarah Poole) dead 1661. Uncle (James, Thomas Sr.\'s firstborn) also dead 1665, without issue. The name rested on a child. He survived. Married Anne ~1678 in Princess Anne County. Will (Will Book 3 p.448) executed Feb 5, 1720, probated Aug 1, 1722 — explicitly names sons Thomas, William, James and daughters Elizabeth Whitehurst, Susannah Moore, Dynah Wilber, with 1-shilling legacies to those already settled and 150-acre tracts to Thomas and William. This will is the gold-standard primary source bridging Gens 3→4.',
    },
    'anne': { id: 'anne', generation: 3, name: 'Anne (surname unknown)', role: 'm. James the Orphan', lifespan: '? – ?', spouse: ['james-orphan'], direct: false, evidence: 'unsolved', notes: 'Surname not recovered. Married c.1678, Princess Anne County, VA.' },
    'susannah': { id: 'susannah', generation: 4, name: 'Susannah Cason', role: 'm. — Moore', parents: ['james-orphan','anne'], spouse: ['moore'], direct: false },
    'thomas-3': { id: 'thomas-3', generation: 4, name: 'Thomas Cason III', parents: ['james-orphan','anne'], direct: false },
    'james-jr-1690': { id: 'james-jr-1690', generation: 4, name: 'James Cason Jr.', parents: ['james-orphan','anne'], direct: false },
    'elizabeth': { id: 'elizabeth', generation: 4, name: 'Elizabeth Cason', role: 'm. — Whitehurst', parents: ['james-orphan','anne'], spouse: ['whitehurst'], direct: false },
    'dynah': { id: 'dynah', generation: 4, name: 'Dynah Cason', role: 'm. — Wilber', parents: ['james-orphan','anne'], spouse: ['wilber'], direct: false },

    'william-1695': {
      id: 'william-1695', generation: 4, name: 'William Cason',
      role: 'The Carolina Move',
      lifespan: 'c.1695 – 1764',
      born: { place: 'Princess Anne County, Virginia', coords: [36.84, -76.05] },
      died: { year: 1764, place: 'Pitt County, North Carolina', coords: [35.60, -77.37] },
      parents: ['james-orphan','anne'], spouse: ['jane-cannon'],
      children: ['cannon-sr','william-jr','james-1727','john-1728','henry-1732','hillery'],
      direct: true, evidence: 'confirmed',
      narrative: 'Married Jane Cannon, 1721. Moved family from Virginia to Beaufort County, NC in 1723 — a 300-mile journey south into Carolina frontier. Land grant 1740. Nine in household by 1746. Died c.1764 in Pitt County.',
    },
    'jane-cannon': { id: 'jane-cannon', generation: 4, name: 'Jane Cannon', role: 'm. William', lifespan: '? – ?', spouse: ['william-1695'], direct: false },

    'cannon-sr': { id: 'cannon-sr', generation: 5, name: 'Cannon Cason Sr.', lifespan: 'c.1724 – c.1779', parents: ['william-1695','jane-cannon'], direct: false, evidence: 'eliminated', narrative: 'Left Pitt Co. by 1752 for Duplin Co., then South Carolina. Will does NOT name Ransom. Eliminated as Ransom\'s father.', tags: ['branch','eliminated'] },
    'william-jr': { id: 'william-jr', generation: 5, name: 'William Cason Jr.', lifespan: 'b. 1723 – c.1778', parents: ['william-1695','jane-cannon'], direct: false, evidence: 'eliminated', narrative: 'Left with Cannon for Duplin County by 1752. Died in NC. Never went to Georgia.', tags: ['branch','eliminated'] },
    'james-1727': {
      id: 'james-1727', generation: 5, name: 'James Cason (or — UNFILLED SLOT)',
      role: 'The Missing Link — leading candidate (Gen 5 hole)',
      lifespan: 'c.1727 – ?',
      parents: ['william-1695','jane-cannon'], children: ['ransom-sr','james-jr-1750','eli-cason','william-cason-b','henry-cason-b'],
      direct: true, evidence: 'unsolved',
      narrative: 'STRUCTURAL WEAKNESS — the load-bearing gap in this pedigree. 72-year span between William⁴ Cason (b. ~1691) and Ransom Cason I (b. ~1763) across one nominal link is two generations, not one. The "11 generations" tradition is folklore; the real count is ~12, and this slot is the hole. Leading candidate is James Cason (c.1727), William⁴\'s son with no significant land records — landless = most reason to leave. STRENGTHENED (6 Jun 2026): the Pitt Co. taxables of 1762 and 1763 list "James Cason — 1" (a single poll — an adult male, no large holding), fitting a c.1727 small-holder; and Bo Williams (Huxford) names Ransom\'s brothers as Eli (m. Cassandra Weeks), William (m. Ann Munden), James (m. Elizabeth Watkins) and Henry — implying their father was also a James. STILL UNSOLVED: no primary will, deed, or bible explicitly names Ransom\'s father. Resolve via Pitt Co. NC estate packets ~1770–1790 (NCDAH, largely un-digitized) and the Huxford Society Cason file.',
      tags: ['unsolved','leading','priority-1'],
      sources: ['Pitt Co. NC List of Taxables 1762 & 1763 — "James Cason — 1" (PRIMARY, transcribed; RootsWeb/USGenWeb ptax)', 'Huxford, Pioneers of the Wiregrass Georgia Vol. II, p.85 (Bo Williams — names Ransom\'s brothers; derivative)', 'Pitt Co. NC estate packets ~1770–1790 (target archive, NCDAH)'],
    },
    'john-1728': { id: 'john-1728', generation: 5, name: 'John Cason', lifespan: 'c.1728 – ?', parents: ['william-1695','jane-cannon'], direct: false, evidence: 'possible', narrative: 'Stayed Pitt Co. 1790 census: 12 slaves. No positive link to Ransom.', tags: ['branch','possible'] },
    'henry-1732': { id: 'henry-1732', generation: 5, name: 'Henry Cason', lifespan: 'c.1732 – after 1823', parents: ['william-1695','jane-cannon'], direct: false, evidence: 'secondary', narrative: '1823 deeds (Book CC p.229) show a separate Pitt County branch with zero mention of Ransom\'s family.', tags: ['branch','secondary'] },
    'hillery': { id: 'hillery', generation: 5, name: 'Hillery Cason', lifespan: '1737 – 1810', parents: ['william-1695','jane-cannon'], spouse: ['sarah-barrow-ormond'], direct: false, evidence: 'unlikely', narrative: 'Moved to interior Georgia 1792 — not coastal Glynn where Ransom settled. Wife: Sarah Barrow Ormond. Different children\'s names.', tags: ['branch','unlikely'] },

    'ransom-sr': {
      id: 'ransom-sr', generation: 6, name: 'Ransom Cason Sr.',
      role: 'The Florida Crossing',
      lifespan: 'c.1763 – 1853',
      born: { year: 1763, place: 'Pitt County, North Carolina', coords: [35.60, -77.37] },
      died: { year: 1853, place: 'Newnansville, Alachua County, Florida', coords: [29.8086, -82.4787] },
      parents: ['james-1727'], spouse: ['phoebe-munden'],
      children: ['john-cason-6','speckled-bill','james-green','ransom-jr','moses','clementine','martha','phoebe-c','becky'],
      direct: true, evidence: 'confirmed',
      narrative: 'Married Phoebe Munden. Nine children, seven moved to Florida. In 1822 he began liquidating Georgia holdings — power of attorney to son William, Cherokee Lottery land sold. In 1823, at age sixty, he walked his wife and children south through the Okefenokee into a territory of 8,000 people with no roads. Survived the Second Seminole War. Florida Pioneer Certificate #2015S0027. Died at ~90.',
      sources: ['Alachua Co. Will Book A, pp. 35-36', 'FL Pioneer Certificate #2015S0027'],
      notes: 'RESEARCH LEADS (single derivative source — Grok via WikiTree/compilations; verify each against the original before promoting above "possible"): a Georgia footprint before Florida — Glynn Co. tax digest 1794; 1799 land warrants for 200 ac on Turtle River + 200 ac on Beaver Dam Swamp; 1822 power of attorney covering Lots 174 & 172, Munro Co.; Cherokee Lottery land in Houston Co. Will probated 12 Nov 1853. 1830 Alachua census places the household near son John, King Douglas, and one Michael Clements. PARENTAGE (Gen 5) remains the load-bearing unknown; his brothers are unestablished.',
    },
    'phoebe-munden': { id: 'phoebe-munden', generation: 6, name: 'Phoebe Munden', role: 'm. Ransom Sr.', lifespan: 'c.1770 – c.1850', spouse: ['ransom-sr'], parents: ['munden-father'], siblings: ['munden-sister'], direct: false, evidence: 'confirmed', notes: 'Her Munden family is scarcely documented — parents, birthplace (the Mundens cluster in Currituck / Princess Anne Co., coastal NC–VA) and siblings are all open. A second Cason–Munden match (a sister married a brother of Ransom Sr.) is family tradition, unconfirmed.' },

    'john-cason-6': { id: 'john-cason-6', generation: 7, name: 'John Cason', parents: ['ransom-sr','phoebe-munden'], direct: false },
    'speckled-bill': { id: 'speckled-bill', generation: 7, name: 'William "Speckled Bill" Cason', parents: ['ransom-sr','phoebe-munden'], direct: false },
    'ransom-jr': { id: 'ransom-jr', generation: 7, name: 'Ransom Cason Jr.', parents: ['ransom-sr','phoebe-munden'], direct: false, narrative: 'Brother of James Green. Not to be confused with nephew "Ransom 2."' },
    'moses': { id: 'moses', generation: 7, name: 'Moses Cason', parents: ['ransom-sr','phoebe-munden'], direct: false, narrative: 'Farmer. Survived a Seminole attack in 1842.' },
    'clementine': { id: 'clementine', generation: 7, name: 'Clementine Cason', parents: ['ransom-sr','phoebe-munden'], spouse: ['king-douglas'], direct: false, narrative: 'Married King Douglas. Lived "11 mi north of Newnansville, Ft. Call Road" in 1842.' },
    'martha': { id: 'martha', generation: 7, name: 'Martha Cason', parents: ['ransom-sr','phoebe-munden'], direct: false },
    'phoebe-c': { id: 'phoebe-c', generation: 7, name: 'Phoebe Cason', parents: ['ransom-sr','phoebe-munden'], direct: false },
    'becky': { id: 'becky', generation: 7, name: 'Becky Cason', parents: ['ransom-sr','phoebe-munden'], direct: false, narrative: 'Buried Cason Cemetery, CR 239. FindAGrave #62398516.' },

    'james-green': {
      id: 'james-green', generation: 7, name: 'James Green Cason',
      role: 'The Builder',
      lifespan: 'c.1800 – 1878',
      born: { place: 'Alachua County, Florida', coords: [29.8086, -82.4787] },
      died: { year: 1878, place: 'Alachua County, Florida', coords: [29.89, -82.45] },
      parents: ['ransom-sr','phoebe-munden'], spouse: ['lucy-barrow'],
      children: ['mary-ann','john-barrow','george-washington','ransom-2'],
      direct: true, evidence: 'confirmed',
      narrative: 'Married Lucinda "Lucy" Barrow. At least nine children. His father arrived when Alachua County had 300 people; by 1878, thousands. James Green\'s generation turned a homestead into a community.',
    },
    'lucy-barrow': { id: 'lucy-barrow', generation: 7, name: 'Lucinda "Lucy" Barrow', role: 'm. James Green', spouse: ['james-green'], direct: false },
    'mary-ann': { id: 'mary-ann', generation: 8, name: 'Mary Ann Cason', parents: ['james-green','lucy-barrow'], direct: false },
    'john-barrow': { id: 'john-barrow', generation: 8, name: 'John Barrow Cason', parents: ['james-green','lucy-barrow'], direct: false },
    'george-washington': { id: 'george-washington', generation: 8, name: 'George Washington Cason', parents: ['james-green','lucy-barrow'], direct: false },

    'ransom-2': {
      id: 'ransom-2', generation: 8, name: 'Lt. Ransom Cason "2"',
      role: 'The Grandson Who Marched',
      lifespan: '1835 – 1900',
      born: { year: 1835, place: 'Alachua County, Florida', coords: [29.89, -82.45] },
      died: { year: 1900, place: 'North Pleasant Grove Cemetery, Santa Fe, FL', coords: [29.8879, -82.4540] },
      parents: ['james-green','lucy-barrow'], spouse: ['casey-ann','susan-holloway'],
      children: ['thadeous'],
      direct: true, evidence: 'confirmed',
      narrative: 'Lieutenant, 7th Florida Infantry, Army of Tennessee. Mustered at Gainesville April 1862, age 27. Chickamauga. Missionary Ridge. The Atlanta Campaign — Dalton, Resaca, Kennesaw. Franklin. Nashville. Bentonville with fewer than 100 men. Surrendered at Bennett Place, April 26, 1865. Came home to a county economically gutted. Pension A00841. Buried North Pleasant Grove Cemetery, half a mile from his grandfather Ransom Sr.',
      sources: ['Florida Memory Pension A00841'],
    },
    'casey-ann': { id: 'casey-ann', generation: 8, name: 'Casey Ann', role: '1st wife', lifespan: '? – 1871', spouse: ['ransom-2'], children: ['thadeous'], direct: false },
    'susan-holloway': { id: 'susan-holloway', generation: 8, name: 'Susan Holloway', role: '2nd wife', spouse: ['ransom-2'], direct: false, narrative: 'Married February 14, 1872, after Casey Ann died.' },

    'thadeous': {
      id: 'thadeous', generation: 9, name: 'Thadeous Calhoun Cason',
      role: 'The Westward Move',
      lifespan: '1857 – 1945',
      born: { year: 1857, place: 'Alachua County, Florida', coords: [29.89, -82.45] },
      died: { year: 1945, place: 'Fort White, Columbia County, Florida', coords: [29.9186, -82.6393] },
      parents: ['ransom-2','casey-ann'], spouse: ['georgia-mckinney'],
      children: ['lena-alice','carrie-mae','james-johnson','eddie-ross','carl-columbus','wilbur','tom-arthur','julia-matilda','timothy'],
      direct: true, evidence: 'confirmed',
      narrative: 'Born during the war. Four when his father left for Gainesville. Eight at war\'s end. On Christmas Eve 1882, married Georgia Quintine McKinney in Columbia County. Moved 15–20 miles west to Fort White, chasing the railroad-and-phosphate boom of 1888. Twelve to fourteen children. Buried Tustenuggee Methodist Cemetery, on land some believe was once a Seminole burial ground.',
      notes: 'Derivative refinements to verify against the record: b. 26 Aug 1857; d. 17 Dec 1945; wife Georgia Quintine McKinney d. 3 Sep 1937; FindAGrave memorial #11538485.',
    },
    'georgia-mckinney': { id: 'georgia-mckinney', generation: 9, name: 'Georgia Quintine McKinney', spouse: ['thadeous'], lifespan: '1860 – 1937', role: 'm. Thadeous', direct: false },
    'lena-alice': { id: 'lena-alice', generation: 10, name: 'Lena Alice Cason', lifespan: '1888 – 1927', parents: ['thadeous','georgia-mckinney'], spouse: ['guynn'], direct: false, narrative: 'm. Guynn.' },
    'carrie-mae': { id: 'carrie-mae', generation: 10, name: 'Carrie Mae Cason', parents: ['thadeous','georgia-mckinney'], direct: false },
    'james-johnson': { id: 'james-johnson', generation: 10, name: 'James Johnson Cason', parents: ['thadeous','georgia-mckinney'], direct: false },
    'eddie-ross': { id: 'eddie-ross', generation: 10, name: 'Eddie Ross Cason', parents: ['thadeous','georgia-mckinney'], direct: false },
    'wilbur': { id: 'wilbur', generation: 10, name: 'Wilbur C. Cason', parents: ['thadeous','georgia-mckinney'], direct: false },
    'tom-arthur': { id: 'tom-arthur', generation: 10, name: 'Tom Arthur Cason', parents: ['thadeous','georgia-mckinney'], direct: false },
    'julia-matilda': { id: 'julia-matilda', generation: 10, name: 'Julia Matilda Cason', parents: ['thadeous','georgia-mckinney'], spouse: ['puckett'], direct: false, evidence: 'possible', narrative: 'm. Puckett — per a single derivative source; given name and dates unverified.' },
    'timothy': { id: 'timothy', generation: 10, name: 'Timothy Cason', parents: ['thadeous','georgia-mckinney'], direct: false },

    'carl-columbus': {
      id: 'carl-columbus', generation: 10, name: 'Carl Columbus Cason',
      role: 'Thirteen Children',
      lifespan: '1903 – 1966',
      born: { year: 1903, place: 'Fort White, Columbia County, Florida', coords: [29.888409, -82.655932] },
      died: { year: 1966, place: 'Fort White, Florida', coords: [29.888409, -82.655932] },
      parents: ['thadeous','georgia-mckinney'], spouse: ['wilma-douglas'],
      children: ['dot','buddy','robert-sr','noah','wyles','jake','lawrence','earl','paul','johnny','marie','zeke','kate'],
      direct: true, evidence: 'confirmed',
      narrative: 'Born into the ruins of Fort White\'s boom — citrus dead, phosphate gone, boll weevil tearing through cotton. Married Wilma Douglas. Thirteen children. Depression-era relief in rural Florida was less than $7/month per family. He would have done everything: turpentine, logging, farming, open-range cattle (Florida was the last state to pass a mandatory fence law, in 1949), day labor, sawmill work.',
      notes: 'Derivative refinement to verify: b. 11 Aug 1903.',
    },
    'wilma-douglas': { id: 'wilma-douglas', generation: 10, name: 'Wilma Douglas', role: 'm. Carl Columbus', spouse: ['carl-columbus'], direct: false },
    'dot': { id: 'dot', generation: 11, name: 'Dorothy "Dot" Cason', lifespan: '~1928 – 2019', parents: ['carl-columbus','wilma-douglas'], spouse: ['raymos'], direct: false, narrative: 'm. Raymos. Lake City.' },
    'buddy': { id: 'buddy', generation: 11, name: 'Buddy Cason', parents: ['carl-columbus','wilma-douglas'], direct: false },
    'noah': { id: 'noah', generation: 11, name: 'Noah Cason', lifespan: '1938 – 1942', parents: ['carl-columbus','wilma-douglas'], direct: false, narrative: 'Died young.', tags: ['died-young'] },
    'wyles': { id: 'wyles', generation: 11, name: 'Daniel Wyles Cason', lifespan: '1939 – 2017', parents: ['carl-columbus','wilma-douglas'], spouse: ['becki'], direct: false, narrative: 'm. Becki. Fort White.' },
    'jake': { id: 'jake', generation: 11, name: 'James W. "Jake" Cason', lifespan: '~1943 – 2014', parents: ['carl-columbus','wilma-douglas'], direct: false, narrative: 'Sprint Telephone 39 years. City councilman 14 years. Deacon, Morriston Baptist.' },
    'lawrence': { id: 'lawrence', generation: 11, name: 'Lawrence Milton Cason', lifespan: '1946 – 2017', parents: ['carl-columbus','wilma-douglas'], direct: false },
    'earl': { id: 'earl', generation: 11, name: 'Earl Cason', parents: ['carl-columbus','wilma-douglas'], direct: false },
    'paul': { id: 'paul', generation: 11, name: 'Paul Cason', parents: ['carl-columbus','wilma-douglas'], direct: false },
    'johnny': { id: 'johnny', generation: 11, name: 'Johnny Cason', parents: ['carl-columbus','wilma-douglas'], direct: false },
    'marie': { id: 'marie', generation: 11, name: 'Marie Cason', parents: ['carl-columbus','wilma-douglas'], spouse: ['dorsey'], direct: false, narrative: 'm. Dorsey.' },
    'zeke': { id: 'zeke', generation: 11, name: 'Zeke Cason', parents: ['carl-columbus','wilma-douglas'], spouse: ['roberts'], direct: false, narrative: 'm. Roberts.' },
    'kate': { id: 'kate', generation: 11, name: 'Kate Cason', parents: ['carl-columbus','wilma-douglas'], spouse: ['alexander'], direct: false, narrative: 'm. Alexander.' },

    'robert-sr': {
      id: 'robert-sr', generation: 11, name: 'Robert Randall Cason Sr.',
      role: 'The Space Coast',
      lifespan: 'b. 1933',
      born: { year: 1933, place: 'Fort White, Columbia County, Florida (CR 778)', coords: [29.888409, -82.655932] },
      died: { place: 'Fort White, Florida (returned home)', coords: [29.888409, -82.655932] },
      parents: ['carl-columbus','wilma-douglas'], spouse: ['mary-nell'],
      children: ['robert-jr','richard','carol','suzy','paul-r'],
      direct: true, evidence: 'confirmed',
      narrative: 'Born 1933 in the farmhouse on CR 778 — still standing. Married Mary Nell. In 1957 moved to Titusville on the Indian River, where Brevard County grew 371% in a decade as Kennedy committed to the Moon. Watched rockets leave the Earth. Returned to the family land in Fort White; he and Mary Nell rest there, a stone\'s throw from the farmhouse where he came into the world. From Thomas\'s cargo ship to Robert\'s rockets. The vehicle changes. The instinct doesn\'t.',
    },
    'mary-nell': { id: 'mary-nell', generation: 11, name: 'Mary Nell', role: 'm. Robert Sr.', spouse: ['robert-sr'], children: ['robert-jr','richard','carol','suzy','paul-r'], direct: false },

    /* ── Generation 12 — Robert Sr. & Mary Nell's children ──
       LIVING family, added at the family's wish. First names only, no dates
       or other detail (privacy). Tagged 'child' so they appear as the young
       ones playing at the Space Coast homestead. */
    'robert-jr': { id: 'robert-jr', generation: 12, name: 'Robert Cason Jr.', parents: ['robert-sr','mary-nell'], direct: false, evidence: 'secondary', tags: ['child','living'], narrative: 'Son of Robert Sr. and Mary Nell.' },
    'richard': { id: 'richard', generation: 12, name: 'Richard Cason', parents: ['robert-sr','mary-nell'], direct: false, evidence: 'secondary', tags: ['child','living'], narrative: 'Son of Robert Sr. and Mary Nell.' },
    'carol': { id: 'carol', generation: 12, name: 'Carol Cason', parents: ['robert-sr','mary-nell'], direct: false, evidence: 'secondary', tags: ['child','living'], narrative: 'Daughter of Robert Sr. and Mary Nell.' },
    'suzy': { id: 'suzy', generation: 12, name: 'Suzy Cason', parents: ['robert-sr','mary-nell'], direct: false, evidence: 'secondary', tags: ['child','living'], narrative: 'Daughter of Robert Sr. and Mary Nell.' },
    'paul-r': { id: 'paul-r', generation: 12, name: 'Paul Cason', parents: ['robert-sr','mary-nell'], direct: false, evidence: 'secondary', tags: ['child','living'], narrative: 'Son of Robert Sr. and Mary Nell.' },

    /* ── Extended in-laws & collateral spouses ──
       Names attested in the family record; the individuals are sparse, so their
       personas are reconstructed and flagged honestly (see personas.js). */
    'william-leighton': { id: 'william-leighton', generation: 1, name: 'William Leighton', role: 'Elizabeth’s 1st husband', lifespan: '? – bef. 1641', spouse: ['elizabeth-keeling-leighton'], direct: false, evidence: 'confirmed', narrative: 'First husband of Elizabeth (Keeling); his widow carried the Keeling dower land into her marriage with Thomas Casson.' },
    'john-stratton': { id: 'john-stratton', generation: 1, name: 'John Stratton', role: 'Elizabeth’s 3rd husband', lifespan: '? – ?', spouse: ['elizabeth-keeling-leighton'], direct: false, evidence: 'confirmed', narrative: 'Married the widow Elizabeth (Keeling, Leighton) Casson late in 1652, after Thomas’s death.' },
    'woodhouse': { id: 'woodhouse', generation: 2, name: '— Woodhouse', role: 'm. Ruth Cason', lifespan: '? – ?', spouse: ['ruth'], direct: false, evidence: 'secondary', narrative: 'Of the Woodhouse family of Lower Norfolk; married Ruth Cason. Given name not recovered.' },
    'king-douglas': { id: 'king-douglas', generation: 7, name: 'King Douglas', role: 'm. Clementine Cason', lifespan: '? – ?', spouse: ['clementine'], direct: false, evidence: 'confirmed', narrative: 'Married Clementine Cason; the couple lived eleven miles north of Newnansville on the Fort Call Road in 1842.' },
    'guynn': { id: 'guynn', generation: 10, name: '— Guynn', role: 'm. Lena Alice Cason', lifespan: '? – ?', spouse: ['lena-alice'], direct: false, evidence: 'secondary', narrative: 'Married Lena Alice Cason. Given name not recovered.' },
    'raymos': { id: 'raymos', generation: 11, name: '— Raymos', role: 'm. Dorothy “Dot” Cason', lifespan: '? – ?', spouse: ['dot'], direct: false, evidence: 'secondary', narrative: 'Married Dorothy “Dot” Cason; the couple settled at Lake City. Given name not recovered.' },
    'becki': { id: 'becki', generation: 11, name: 'Becki', role: 'm. Daniel Wyles Cason', lifespan: '? – ?', spouse: ['wyles'], direct: false, evidence: 'secondary', narrative: 'Married Daniel Wyles Cason; the couple lived at Fort White.' },
    'dorsey': { id: 'dorsey', generation: 11, name: '— Dorsey', role: 'm. Marie Cason', lifespan: '? – ?', spouse: ['marie'], direct: false, evidence: 'secondary', narrative: 'Married Marie Cason. Given name not recovered.' },
    'roberts': { id: 'roberts', generation: 11, name: '— Roberts', role: 'm. Zeke Cason', lifespan: '? – ?', spouse: ['zeke'], direct: false, evidence: 'secondary', narrative: 'Married Zeke Cason. Given name not recovered.' },
    'alexander': { id: 'alexander', generation: 11, name: '— Alexander', role: 'm. Kate Cason', lifespan: '? – ?', spouse: ['kate'], direct: false, evidence: 'secondary', narrative: 'Married Kate Cason. Given name not recovered.' },
    'whitehurst': { id: 'whitehurst', generation: 4, name: '— Whitehurst', role: 'm. Elizabeth Cason', lifespan: '? – ?', spouse: ['elizabeth'], direct: false, evidence: 'secondary', narrative: 'Married Elizabeth Cason — named “Elizabeth Whitehurst” in her father James’s 1720 will. Given name not recovered.' },
    'moore': { id: 'moore', generation: 4, name: '— Moore', role: 'm. Susannah Cason', lifespan: '? – ?', spouse: ['susannah'], direct: false, evidence: 'secondary', narrative: 'Married Susannah Cason — named “Susannah Moore” in James’s 1720 will. Given name not recovered.' },
    'wilber': { id: 'wilber', generation: 4, name: '— Wilber', role: 'm. Dynah Cason', lifespan: '? – ?', spouse: ['dynah'], direct: false, evidence: 'secondary', narrative: 'Married Dynah Cason — named “Dynah Wilber” in James’s 1720 will. Given name not recovered.' },
    'sarah-barrow-ormond': { id: 'sarah-barrow-ormond', generation: 5, name: 'Sarah Barrow Ormond', role: 'm. Hillery Cason', lifespan: '? – ?', spouse: ['hillery'], direct: false, evidence: 'secondary', narrative: 'Wife of Hillery Cason; the couple moved to interior Georgia in 1792.' },

    /* ── Open research branches (seeded as honest leads, NOT documented fact) ──
       The Munden in-law family and Ransom Sr.'s brothers — the edges the
       "bloodhound" research loop is meant to chase down. Evidence is 'unsolved'
       or 'possible' until a primary record fixes a name, date, or place. */
    'munden-father': { id: 'munden-father', generation: 5, name: '— Munden (Phoebe’s father)', role: 'father of Phoebe Munden', lifespan: '? – ?', children: ['phoebe-munden','munden-sister'], direct: false, evidence: 'unsolved', narrative: 'Father of Phoebe Munden (m. Ransom Cason Sr.). Given name, dates, and place not yet recovered. The Munden surname concentrates in Currituck and Princess Anne Counties (coastal NC–VA); a deep Munden study is the open task.', tags: ['in-law','unsolved','munden'] },
    'munden-sister': { id: 'munden-sister', generation: 6, name: 'Ann Munden', role: 'm. William Cason (Ransom’s brother)', lifespan: '? – ?', parents: ['munden-father'], siblings: ['phoebe-munden'], spouse: ['william-cason-b'], direct: false, evidence: 'secondary', narrative: 'Bo Williams (Huxford) names the wife of Ransom Sr.’s brother William as Ann Munden — the documented "second Cason–Munden match" the family remembered. Family tradition holds Ann was a sister of Phoebe Munden (the surname agrees), but that sister relationship is not yet fixed by a primary record. Her dates are unrecovered.', tags: ['in-law','secondary','munden','migration'] },
    'james-jr-1750': { id: 'james-jr-1750', generation: 6, name: 'James Cason (m. Elizabeth Watkins)', role: 'brother of Ransom Sr. — stayed in Pitt Co.', lifespan: 'c.1750 – c.1822', parents: ['james-1727'], spouse: ['elizabeth-watkins'], direct: false, evidence: 'leading', narrative: 'The brother of Ransom Sr. who stayed in Pitt County. The William Watkins will (Pitt Co., written 9 Nov 1771, probated 14 Oct 1773) names a son-in-law and executor "James Cason" — a PRIMARY record of his marriage into the Watkins family. Bo Williams (Huxford) lists "James who married Elizabeth Watkins" among Ransom\'s brothers. His exact birth and death are not yet fixed by record. (Earlier this slot was wrongly flagged as the brother who married a Munden — that is his brother William; see Ann Munden.)', tags: ['branch','leading','migration'], sources: ['Pitt Co. NC — William Watkins will, w. 9 Nov 1771 / p. 14 Oct 1773 (PRIMARY — names son-in-law & executor James Cason)', 'Huxford, Pioneers of the Wiregrass Georgia Vol. II, p.85 (Bo Williams; derivative)'] },
    'puckett': { id: 'puckett', generation: 10, name: '— Puckett', role: 'm. Julia Matilda Cason', lifespan: '? – ?', spouse: ['julia-matilda'], direct: false, evidence: 'possible', narrative: 'Married Julia Matilda Cason per a single derivative source; given name not recovered. Verify against a marriage or census record.', tags: ['in-law','possible'] },

    /* ── Ransom Sr.'s brothers (Bo Williams / Huxford, Pioneers of the Wiregrass
       GA Vol. II p.85) — children of the same unproven Gen-5 father (james-1727).
       Named by a respected compiler (secondary); birth/death/place still open. */
    'eli-cason': { id: 'eli-cason', generation: 6, name: 'Eli Cason', role: 'brother of Ransom Sr.', lifespan: '? – ?', parents: ['james-1727'], spouse: ['cassandra-weeks'], direct: false, evidence: 'secondary', narrative: 'Brother of Ransom Cason Sr. per Bo Williams (Huxford); married Cassandra Weeks. Birth, death, and where he passed are not yet established by record.', tags: ['branch','secondary','brothers'], sources: ['Huxford, Pioneers of the Wiregrass Georgia Vol. II, p.85 (Bo Williams; derivative)'] },
    'cassandra-weeks': { id: 'cassandra-weeks', generation: 6, name: 'Cassandra Weeks', role: 'm. Eli Cason', lifespan: '? – ?', spouse: ['eli-cason'], direct: false, evidence: 'secondary', narrative: 'Wife of Eli Cason (Ransom Sr.’s brother) per Bo Williams (Huxford).', tags: ['in-law','secondary'] },
    'william-cason-b': { id: 'william-cason-b', generation: 6, name: 'William Cason (Ransom’s brother)', role: 'brother of Ransom Sr. — m. Ann Munden', lifespan: '? – ?', parents: ['james-1727'], spouse: ['munden-sister'], direct: false, evidence: 'secondary', narrative: 'Brother of Ransom Cason Sr. per Bo Williams (Huxford); married Ann Munden — the "second Cason–Munden match." Birth, death, and where he passed are open. Not to be confused with William⁴ Cason (Gen 4) or William Cason Jr. (Gen 5).', tags: ['branch','secondary','brothers','munden'], sources: ['Huxford, Pioneers of the Wiregrass Georgia Vol. II, p.85 (Bo Williams; derivative)'] },
    'henry-cason-b': { id: 'henry-cason-b', generation: 6, name: 'Henry Cason (Ransom’s brother?)', role: 'brother of Ransom Sr. — per Bo Williams', lifespan: '? – ?', parents: ['james-1727'], direct: false, evidence: 'possible', narrative: 'Bo Williams (Huxford) lists a Henry among Ransom Sr.’s brothers. FLAGGED — likely confused with Henry Cason (c.1732), William⁴’s son and Ransom’s UNCLE (the 1823 Grindal Creek deeds, Deed Book CC p.229). Whether a distinct brother Henry existed needs a primary record.', tags: ['branch','possible','brothers','name-collision'], sources: ['Huxford, Pioneers of the Wiregrass Georgia Vol. II, p.85 (Bo Williams; derivative)'] },
    'elizabeth-watkins': { id: 'elizabeth-watkins', generation: 6, name: 'Elizabeth Watkins', role: 'm. James Cason (Ransom’s brother)', lifespan: '? – ?', spouse: ['james-jr-1750'], parents: [], direct: false, evidence: 'secondary', narrative: 'Daughter of William Watkins of Pitt Co. (his 1771 will names a daughter Elizabeth and a son-in-law James Cason). Married James Cason, brother of Ransom Sr., per Bo Williams (Huxford).', tags: ['in-law','secondary'], sources: ['Pitt Co. NC — William Watkins will, w. 9 Nov 1771 / p. 14 Oct 1773 (PRIMARY)'] },
  },

  // Direct-line spine in order — used by views that need it.
  directLine: [
    'thomas-sr','thomas-jr','james-orphan','william-1695','james-1727',
    'ransom-sr','james-green','ransom-2','thadeous','carl-columbus','robert-sr',
  ],

  // Eras for filter chips & color coding.
  eras: [
    { id: 'colonial', label: 'Colonial (1608–1722)', generations: [1,2,3], color: 'var(--gold-bright)' },
    { id: 'frontier', label: 'Frontier (1723–1822)', generations: [4,5],   color: 'var(--sea-green)' },
    { id: 'pioneer',  label: 'Florida Pioneer (1823–1878)', generations: [6,7], color: 'var(--rust)' },
    { id: 'civil',    label: 'Civil War & After (1862–1900)', generations: [8], color: 'var(--blood)' },
    { id: 'modern',   label: 'Modern (1900–today)', generations: [9,10,11,12], color: 'var(--gold)' },
  ],

  // Locations of interest for map view.
  places: [
    { id: 'digswell',    label: 'Digswell, Hertfordshire',         coords: [51.8167, -0.1833], era: 'colonial' },
    { id: 'jamestown',   label: 'Jamestown, Virginia',             coords: [37.2096, -76.7747], era: 'colonial' },
    { id: 'lynnhaven',   label: 'Lynnhaven Parish, Virginia',      coords: [36.8879, -76.0174], era: 'colonial' },
    { id: 'princess',    label: 'Princess Anne County, Virginia',  coords: [36.84, -76.05],     era: 'colonial' },
    { id: 'beaufort',    label: 'Beaufort/Pitt Co., North Carolina', coords: [35.60, -77.37],   era: 'frontier' },
    { id: 'glynn',       label: 'Glynn County, Georgia',           coords: [31.21, -81.50],    era: 'frontier' },
    { id: 'newnansville',label: 'Newnansville, Alachua Co., FL',   coords: [29.8086, -82.4787], era: 'pioneer' },
    { id: 'cason-cem',   label: 'Cason Family Land, Alachua Co.',  coords: [29.89, -82.45],    era: 'pioneer' },
    { id: 'fort-white',  label: 'Fort White, Columbia Co., FL',    coords: [29.888409, -82.655932], era: 'modern' },
    { id: 'titusville',  label: 'Titusville, Brevard Co., FL',     coords: [28.61, -80.81],    era: 'modern' },
  ],
};

window.CASON_DATA = CASON_DATA;
