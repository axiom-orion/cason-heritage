/* ============================================================
   The Living Line — Persona / Role Sheets  (window.CASON_PERSONAS)
   ------------------------------------------------------------
   Derived from window.CASON_DATA: archetype, occupation, abilities,
   personality, goals, voice, a comedic `levity` dimension, and a
   `provenance` block that keeps the record honest.

   Honesty: facts come from data.js. Personality/voice/levity are
   reconstructed characterization — flagged via provenance.reconstructed.
   Comedy lives in *ambient routine* (engine texture), never asserted
   as documented fact.

   Runs no-build in the browser (window) and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  /* ---- archetype catalog: era-grounded defaults ---- */
  const ARCHETYPES = {
    planter: {
      occupation: 'tobacco planter',
      personality: ['pragmatic', 'pious', 'legacy-minded', 'wary of death'],
      abilities: ['tobacco agronomy & curing', 'headright & land patenting', 'vestry & court navigation', 'estate appraisal'],
      goals: ['keep the name alive', 'take up land', 'survive the seasoning sickness'],
      voice: { register: 'measured 17th-century English — plain, practical, devout',
               idioms: ['by God’s providence', 'the land returns what is planted', 'a steady hand'] },
      levity: 0.25,
      quirks: ['counts the tobacco hogsheads twice and gets two different numbers',
               'lectures the seedlings on perseverance'],
    },
    orphan: {
      occupation: 'planter (the sole heir)',
      personality: ['stoic', 'watchful', 'quietly determined', 'family-anchoring'],
      abilities: ['headright mastery', 'will & inheritance planning', 'endurance under loss'],
      goals: ['carry the name forward alone', 'hold the land', 'see the children settled'],
      voice: { register: 'spare and understated; says less than he knows',
               idioms: ['the land does not care for orphans', 'labor and paper', 'one is enough, if he endures'] },
      levity: 0.2,
      quirks: ['re-reads his own will to make sure it still says what he meant'],
    },
    pioneer: {
      occupation: 'frontier farmer & cattleman',
      personality: ['bold', 'protective', 'weathered', 'a teller of the road'],
      abilities: ['frontier logistics & migration leadership', 'cattle herding', 'Seminole-era situational awareness', 'land clearing'],
      goals: ['reach the new ground', 'move the family together', 'outlast the war and the fever'],
      voice: { register: 'plainspoken frontier; direct, unhurried, hard-won',
               idioms: ['we endure because we move together', 'the swamp does not wait for youth', 'first into the unknown'] },
      levity: 0.35,
      quirks: ['declares the chest-deep swamp “character-building”', 'names his lead ox after a man he disliked'],
    },
    soldier: {
      occupation: 'soldier, then farmer',
      personality: ['dutiful', 'stoic', 'plain', 'rebuilding'],
      abilities: ['tactical awareness', 'forced-march endurance', 'post-war resilience', 'pension navigation'],
      goals: ['do his duty and come home', 'put the county back together', 'provide'],
      voice: { register: 'laconic veteran; clipped, matter-of-fact',
               idioms: ['we marched', 'fewer than a hundred of us', 'a man does what is asked'] },
      levity: 0.2,
      quirks: ['drills the chickens at dawn out of old habit', 'still sleeps lightest near a fence line'],
    },
    'frontier-farmer': {
      occupation: 'turpentiner, logger & open-range farmer',
      personality: ['tireless', 'stoic under scarcity', 'family-first', 'jack of every trade'],
      abilities: ['turpentine & logging', 'open-range cattle', 'sawmill & day labor', 'large-household logistics'],
      goals: ['feed the whole table', 'do every trade at once', 'hold the family land'],
      voice: { register: 'dry Florida cracker; wry, understated, hardscrabble',
               idioms: ['less than seven dollars a month', 'you do all of it', 'the boll weevil took the rest'] },
      levity: 0.4,
      quirks: ['argues with an open-range cow that refuses to respect the new 1949 fence',
               'keeps a running tally of which child ate whose biscuit'],
    },
    matriarch: {
      occupation: 'keeper of the household',
      personality: ['warm', 'managing', 'resourceful', 'the household’s thread'],
      abilities: ['household management', 'foodways & preserving', 'midwifery & doctoring', 'keeping the family’s memory'],
      goals: ['hold the household together', 'raise the children through it', 'remember everyone’s name'],
      voice: { register: 'warm and managing; the one who keeps the thread',
               idioms: ['there’s a mouth for every plate', 'I keep the reckoning of this house', 'come in out of the weather'] },
      levity: 0.4,
      quirks: ['refuses to admit which child is the favorite, then obviously dotes on one',
               'can name every cousin but forgets where she set the candle'],
    },
    modern: {
      occupation: 'farmer / worker of the New South',
      personality: ['grounded', 'steady', 'rooted to the land', 'quietly proud'],
      abilities: ['mechanized & manual farming', 'stewardship of the family land', 'reading weather & soil', 'making do'],
      goals: ['keep the land in the family', 'prepare it for the next ones', 'watch the world change from the porch'],
      voice: { register: 'plain modern Southern; grounded, observant',
               idioms: ['the vehicle changes, the instinct doesn’t', 'from cargo ships to rockets', 'we come back to the land'] },
      levity: 0.35,
      quirks: ['narrates the weather to anyone within earshot', 'insists the old way was better, uses the new way anyway'],
    },
    collateral: { // the further-removed relatives who "meander about"
      occupation: 'of the household & the land',
      personality: ['easygoing', 'digressive', 'sociable', 'along for the line'],
      abilities: ['lending a hand at whatever’s needed', 'knowing everyone’s business', 'turning up at mealtime'],
      goals: ['keep close to kin', 'be of some use', 'have a story to tell'],
      voice: { register: 'easygoing and digressive; a talker who wanders the point',
               idioms: ['now where was I', 'kin is kin', 'I’ll tell you what'] },
      levity: 0.7,
      quirks: ['gets lost walking to the next field he has crossed a thousand times',
               'tells the same road story for the third time today',
               'naps in the curing barn and blames the fumes',
               'mistakes a neighbor’s mule for his own and rides it home'],
    },
    child: { // the young ones — chores half-done, then off to play
      occupation: 'of the household, mostly at play',
      personality: ['quick', 'curious', 'full of motion', 'half-wild'],
      abilities: ['running everywhere', 'finding the creek', 'half-doing a chore', 'minding a smaller one'],
      goals: ['get back to playing', 'keep up with the bigger cousins', 'not be caught idling'],
      voice: { register: 'breathless and direct; a child of the place', idioms: ['watch me!', 'is it supper yet', 'I almost had it'] },
      levity: 0.85,
      quirks: ['swears they were not the least bit tired', 'turns one chore into three games'],
    },
  };

  /* ---- era-grounded wisdom: the advice each archetype hands down ---- */
  const WISDOM = {
    planter: ['Plant in faith; the seasoning fever takes the idle and the unlucky alike.',
              'Land held in your wife’s right is land still — know the law before you need it.'],
    orphan: ['When the house empties, the one left learns to lean on labor and paper, not luck.',
             'Write the will plain, and early — the land does not forgive a vague hand.'],
    pioneer: ['Move the whole family together, or do not move at all.',
              'Respect the swamp and the season; both will teach you, if you live.'],
    soldier: ['A man does what is asked and comes home if he can.',
              'Mend the fence before the field — the rest will follow.'],
    'frontier-farmer': ['When the cash crop fails, you do every trade at once and complain of none.',
                        'Feed the children first; a hungry house remembers.'],
    matriarch: ['Keep the reckoning of the house and the names of the kin — both will be needed.',
                'There is a plate for every mouth, if you mind the pot.'],
    modern: ['Hold the land; the vehicle changes, the instinct does not.',
             'Watch the weather and the soil — they argue, but they do not lie.'],
    collateral: ['Stay close to kin and you’ll never want for a meal or a story.',
                 'A borrowed mule is only borrowed if somebody saw you.'],
    child: ['The creek is always better than the chore.',
            'If you run fast enough, nobody can give you a job.'],
  };

  /* ---- hand-authored depth for the anchor personas. Grounded entirely in the
     documented narratives — no new facts. Epithet/essence/voice/wisdom are
     reconstructed characterization (flagged as such in the UI); names, dates,
     and events stay sourced from data.js. ---- */
  const HERO = {
    'thomas-sr': {
      epithet: 'The Crossing', essence: 'the immigrant who planted the line in Virginia soil, one steady reckoning at a time',
      personality: ['pragmatic', 'quietly pious', 'legacy-minded', 'aware of death’s nearness'],
      abilities: ['tobacco agronomy & curing', 'headright land-patenting', 'vestry & county-court navigation', 'estate appraisal & executry'],
      idioms: ['by God’s providence', 'the land returns what is planted', 'a steady hand and a clear reckoning'],
      wisdom: ['Plant in faith, but keep the reckoning — the seasoning fever takes the idle and the unlucky alike.', 'Land held in your wife’s right is land still; know the law before you need it.', 'Half who cross do not see a second harvest. Build as though you are the one who must endure.'],
      drive: 'Plant the name so deep the fever cannot take it.',
    },
    'james-orphan': {
      epithet: 'The Orphan', essence: 'ten years old and the only Cason left — he made the name survive on labour and paper',
      personality: ['stoic', 'watchful', 'quietly determined', 'the anchor after tragedy'],
      abilities: ['headright land-claiming', 'will & inheritance drafting', 'solitary endurance', 'holding a household together'],
      idioms: ['the land does not care for orphans', 'labour and paper', 'one is enough, if he endures'],
      wisdom: ['When the house empties, the one left learns to lean on labour and paper, not luck.', 'Write the will plain and early — the land does not forgive a vague hand.', 'I was ten and the last. The name does not care how young you are; it only asks that you endure.'],
      drive: 'Be the one link that does not break.',
    },
    'william-1695': {
      epithet: 'The Carolina Move', essence: 'married a Cannon, then took the family three hundred miles south into the Carolina frontier',
      personality: ['restless', 'practical', 'frontier-minded', 'provident'],
      abilities: ['frontier migration', 'clearing forest into field', 'land-grant navigation', 'moving a whole household'],
      idioms: ['south is where the room is', 'cheap land is dear in labour'],
      wisdom: ['Cheap land is dear in labour; pay it in years and the children inherit a farm.', 'Go south before the ground behind you fills.'],
      drive: 'Find unclaimed ground for the next generation.',
    },
    'ransom-sr': {
      epithet: 'The Florida Crossing', essence: 'at sixty he walked his wife and children through the Okefenokee into a roadless territory — and outlasted it',
      personality: ['bold past the age for it', 'fiercely protective', 'weathered', 'a teller of the road'],
      abilities: ['frontier migration leadership', 'open-range cattle & herding', 'Seminole-era situational awareness', 'liquidating & re-staking a whole estate'],
      idioms: ['we endure because we move together', 'the swamp does not wait for youth', 'first into the unknown'],
      wisdom: ['Move the whole family together, or do not move at all.', 'Respect the swamp and the season; both will teach you, if you live.', 'A man walks into the unknown at sixty because the known ground is used up.'],
      drive: 'Reach new ground while there is still time to break it.',
    },
    'james-green': {
      epithet: 'The Builder', essence: 'his father found three hundred souls in Alachua; James Green helped turn a homestead into a county',
      personality: ['steady', 'community-minded', 'rooted', 'patient'],
      abilities: ['homestead & community building', 'cattle & land husbandry', 'marrying the family into the Barrows', 'raising a large house'],
      idioms: ['land and kin, tended together', 'a clearing is only a beginning'],
      wisdom: ['A homestead is only a beginning; the work is the neighbours you make of the wilderness.', 'Land and kin, tended together, become a county.'],
      drive: 'Turn a clearing into a community.',
    },
    'ransom-2': {
      epithet: 'The Grandson Who Marched', essence: 'Lieutenant, 7th Florida — Chickamauga to Bentonville with fewer than a hundred men, then home to a gutted county',
      personality: ['dutiful', 'laconic', 'a stoic veteran', 'rebuilding'],
      abilities: ['infantry tactics & command', 'forced-march endurance', 'rebuilding after ruin', 'pension & paper navigation'],
      idioms: ['we marched', 'fewer than a hundred of us', 'a man does what is asked'],
      wisdom: ['We marched, and those who could came home. The rest is putting the fence back before the field.', 'A man does what is asked, and does not speak much of it after.'],
      drive: 'Carry the duty, then carry the family back from ruin.',
    },
    'thadeous': {
      epithet: 'The Westward Move', essence: 'born in the war, he chased the railroad-and-phosphate boom to Fort White and raised a houseful',
      personality: ['adaptable', 'a boom-and-bust survivor', 'community-rooted', 'a large-family patriarch'],
      abilities: ['reading a boom and moving toward it', 'farming & timber', 'large-household patriarchy', 'rooting a church & a cemetery'],
      idioms: ['follow the rail and the work', 'plan the pot before the prayer'],
      wisdom: ['Follow the rail and the work, but put your dead and your church where you mean to stay.', 'Fourteen at the table teaches a man to plan the pot before the prayer.'],
      drive: 'Find the next ground that will feed a big family.',
    },
    'carl-columbus': {
      epithet: 'Thirteen Children', essence: 'raised thirteen through the Depression on every trade at once — turpentine, timber, cattle, sawmill, and nerve',
      personality: ['tireless', 'stoic under hardship', 'family-first', 'jack of every trade'],
      abilities: ['turpentine, logging & sawmill labour', 'open-range cattle', 'farming under scarcity', 'feeding a table of fifteen'],
      idioms: ['less than seven dollars a month', 'you do all of it', 'feed the children first'],
      wisdom: ['When the cash crop fails, you do every trade at once and complain of none.', 'Feed the children first; a hungry house remembers.', 'Relief was seven dollars a month. The land and your two hands were the rest.'],
      drive: 'Keep fifteen mouths fed, whatever it takes.',
    },
    'robert-sr': {
      epithet: 'The Space Coast', essence: 'from the Fort White farmhouse to Titusville to watch rockets leave the Earth — then home to the land',
      personality: ['grounded', 'observant', 'quietly proud', 'rooted'],
      abilities: ['farming & the New South trades', 'reading change without losing the land', 'witnessing the rocket age', 'returning to the root'],
      idioms: ['the vehicle changes, the instinct does not', 'from cargo ships to rockets'],
      wisdom: ['From a cargo ship to a rocket — the vehicle changes, the instinct does not.', 'Go where the work and the wonder are, but the land is where you come to rest.'],
      drive: 'See the new frontier, then bring the line home to the old ground.',
    },
    'moses': {
      epithet: 'The Watchful', essence: 'survived a Seminole attack in 1842 and never lost the habit of watching the treeline',
      personality: ['watchful', 'protective', 'a frontier storyteller', 'steady'],
      abilities: ['frontier vigilance', 'cattle & woodcraft', 'keeping the family alert', 'telling the story so the young remember'],
      idioms: ['watch the treeline first', 'one eye on the woods'],
      wisdom: ['Watch the treeline first and the pot second; a full belly is no use to the dead.', 'I tell the 1842 story so the children keep one eye on the woods.'],
      drive: 'Keep the family alert and alive.',
      levity: 0.4,
    },
  };

  // era -> default archetype when nothing more specific is detected
  const ERA_DEFAULT = {
    colonial: 'planter', frontier: 'pioneer', pioneer: 'pioneer',
    civil: 'soldier', modern: 'modern',
  };

  function textOf(p) {
    return [p.role, p.narrative, (p.tags || []).join(' ')].filter(Boolean).join(' ');
  }

  function detectArchetype(p, era) {
    const t = textOf(p).toLowerCase();
    const tags = p.tags || [];
    const female = /^(elizabeth|ruth|sarah|anne|susannah|dynah|jane|phoebe|clementine|martha|becky|lucy|lucinda|casey|susan|georgia|lena|carrie|julia|wilma|dot|dorothy|marie|kate|mary)\b/i.test(p.name || '');

    if (tags.indexOf('child') !== -1) return 'child'; // explicitly a young one (e.g. shown playing)
    if (/orphan/.test(t)) return 'orphan';
    if (/lieutenant|infantry|army of tennessee|chickamauga|mustered|surrendered/.test(t)) return 'soldier';
    if (tags.indexOf('tobacco-planter') !== -1 || /tobacco|planter|headright|vestry/.test(t)) return 'planter';
    if (/okefenokee|seminole|pioneer|walked .* south|frontier|cattle|herd/.test(t)) return 'pioneer';
    if (/turpentine|logging|sawmill|phosphate|open-range|boll weevil|depression/.test(t)) return 'frontier-farmer';
    // spouses / married-in women with little else => matriarch
    if (female && /^(m\.|married|widow|matriarch)/i.test(p.role || '') ) return 'matriarch';
    if (female && (p.spouse && p.spouse.length) && !p.narrative) return 'matriarch';
    // a thin, non-direct relative who just appears in the tree => collateral
    if (!p.direct && !p.narrative && !(p.sources && p.sources.length)) return 'collateral';
    return ERA_DEFAULT[era] || 'collateral';
  }

  function isSparse(p) {
    return !p.narrative && !(p.sources && p.sources.length);
  }

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  /* ============================================================
     buildPersonas(data) -> { byId, list }
     ============================================================ */
  function buildPersonas(data) {
    const mem = root && root.CASON_MEMORY_API ? root.CASON_MEMORY_API
              : (typeof require !== 'undefined' ? safeRequire('./memory-graph.js') : null);
    const eraForGen = mem && mem.helpers ? mem.helpers.eraForGen : function () { return null; };

    const people = data.people || {};
    const directSet = {};
    (data.directLine || []).forEach(function (id) { directSet[id] = true; });

    const byId = {};
    Object.keys(people).forEach(function (pid) {
      const p = people[pid];
      const era = eraForGen(data, p.generation);
      const archetypeKey = detectArchetype(p, era);
      const A = ARCHETYPES[archetypeKey] || ARCHETYPES.collateral;
      const sparse = isSparse(p);

      // levity: archetype base, funnier for distant / thin / non-direct relatives,
      // calmer for the documented direct line.
      let levity = A.levity;
      if (!p.direct) levity += 0.15;
      if (sparse) levity += 0.15;
      if (p.direct) levity -= 0.1;
      levity = clamp01(levity);

      // personality nudges from narrative adjectives
      const personality = A.personality.slice();
      const nt = (p.narrative || '').toLowerCase();
      if (/survived|endure|resilien/.test(nt) && personality.indexOf('resilient') === -1) personality.push('resilient');
      if (/trusted|executor|appraiser/.test(nt)) personality.push('trusted by neighbors');

      byId[pid] = {
        id: pid,
        name: p.name,
        generation: p.generation,
        era: era,
        archetype: archetypeKey,
        occupation: A.occupation,
        personality: personality,
        goals: A.goals.slice(),
        abilities: A.abilities.slice(),
        voice: { register: A.voice.register, idioms: A.voice.idioms.slice() },
        levity: Math.round(levity * 100) / 100,
        quirks: A.quirks.slice(),
        wisdom: (WISDOM[archetypeKey] || WISDOM.collateral).slice(),
        direct: !!p.direct,
        provenance: {
          confidence: p.evidence || 'possible',
          reconstructed: sparse,
          knownFacts: (p.sources || []).slice(),
          hasNarrative: !!p.narrative,
          reconstructedFrom: sparse
            ? ['era archetype: ' + archetypeKey, 'kin & generation only']
            : ['record: narrative + sources'],
          note: sparse
            ? 'Story in progress — personality is reconstructed from era and kin, not from a documented life.'
            : null,
        },
      };

      // hand-authored depth for the anchor personas (characterization only)
      const hero = HERO[pid];
      if (hero) {
        const s = byId[pid];
        s.hero = true; s.epithet = hero.epithet; s.essence = hero.essence; s.drive = hero.drive;
        if (hero.personality) s.personality = hero.personality.slice();
        if (hero.abilities) s.abilities = hero.abilities.slice();
        if (hero.wisdom) s.wisdom = hero.wisdom.slice();
        if (hero.idioms) s.voice.idioms = hero.idioms.slice();
        if (hero.levity != null) s.levity = Math.round(hero.levity * 100) / 100;
      }
    });

    return { byId: byId, list: Object.keys(byId).map(function (k) { return byId[k]; }) };
  }

  function safeRequire(m) { try { return require(m); } catch (e) { return null; } }

  // ---- public API ----
  const API = { build: buildPersonas, ARCHETYPES: ARCHETYPES, detectArchetype: detectArchetype };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) {
    root.buildPersonas = buildPersonas;
    root.CASON_PERSONAS_API = API;
    if (root.CASON_DATA) root.CASON_PERSONAS = buildPersonas(root.CASON_DATA);
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
