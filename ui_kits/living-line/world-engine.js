/* ============================================================
   The Living Line — World Engine  (window.CASON_ENGINE)
   ------------------------------------------------------------
   The deterministic "brain" that makes the homesteads live: a
   seedable clock, authentic per-era daily routines (fires, camp,
   provisions, fishing, Church on Sundays), season-true weather,
   a real-time day/night cycle, group encounters & coordination,
   first-person reflections, and humor that scales with a persona's
   `levity`. No AI, no network, fully reproducible.

   It is a pure layer over the memory graph: every spoken or
   reflected line is drawn ONLY from that speaker's
   accessibleSubgraph, so the temporal-horizon rule holds even in
   ambient chatter. Each utterance carries `sources` (node ids) for
   the glass-box trace and the no-leak self-test.

   Runs no-build in the browser and under Node (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  function dep(name) {
    if (root && root[name]) return root[name];
    return null;
  }
  function helpers() {
    const api = dep('CASON_MEMORY_API');
    return api ? api.helpers : null;
  }

  /* ---------- deterministic PRNG ---------- */
  function hashStr(s) {
    let h = 0x811c9dc5;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) { return mulberry32(typeof seed === 'number' ? seed : hashStr(seed)); }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function chance(r, p) { return r() < p; }

  /* ---------- calendar & environment ---------- */
  const PHASES = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'];
  const PHASE_HOUR = { dawn: 6, morning: 9, midday: 12, afternoon: 15, dusk: 18, night: 22 };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function seasonOf(month) { // 0-11
    if (month <= 1 || month === 11) return 'winter';
    if (month <= 4) return 'spring';
    if (month <= 7) return 'summer';
    return 'autumn';
  }

  const ERA_REGION = { colonial: 'tidewater', frontier: 'carolina', pioneer: 'florida', civil: 'florida', modern: 'florida' };

  // Documented migrations, keyed by the place a homestead sits at. `last` is the
  // move that brought the family here; `next` is the move still ahead of them.
  // These are real, sourced relocations — the musings below are the personas
  // *contemplating* a move (intent/rumor), never claimed knowledge of the future.
  const MIGRATIONS = {
    lynnhaven:   { last: 'the crossing from England', next: { place: 'the Carolina frontier', year: 1723, push: 'the tidewater ground is all taken up' } },
    beaufort:    { last: 'the long road south from Virginia', next: { place: 'the Georgia coast', year: 1790, push: 'there is open land further south' } },
    glynn:       { last: 'the move down from Carolina', next: { place: 'the Florida territory, past the Okefenokee', year: 1823, push: 'they say a man can still take up new ground in Florida' } },
    newnansville:{ last: 'the crossing into Florida through the swamp', next: null },
    'cason-cem': { last: 'the homestead our grandfather broke from wilderness', next: null },
    'fort-white':{ last: 'the move west, chasing the rail and the phosphate', next: null },
    titusville:  { last: 'the move to the coast, where they are firing rockets at the Moon', next: null },
  };

  // The documented trial of each era — the hardship the family met — and what
  // they were working toward against it. Drawn straight from the record.
  const CHALLENGES = {
    colonial: { trial: 'The seasoning sickness takes near half of new arrivals in their first years; tobacco is money and law, and the grave is never far.', endeavor: 'Plant the name deep enough that the fever cannot take it.' },
    frontier: { trial: 'Virgin forest to clear into field, thin courts, far neighbors, and a long road back to anywhere.', endeavor: 'Break new ground and take up a grant the children can inherit.' },
    pioneer: { trial: 'A roadless territory of fever and swamp — the Okefenokee behind, the Seminole at the edge of every clearing.', endeavor: 'Cross into Florida together and break a homestead before the season turns.' },
    civil: { trial: 'The men gone to the 7th Florida Infantry; the county economically gutted; blockade, impressment, and the long wait for word.', endeavor: 'Hold the family and the land together until those who can come home.' },
    modern: { trial: 'Citrus killed by the freeze, the phosphate played out, the boll weevil in the cotton, and Depression relief under seven dollars a month.', endeavor: 'Do every trade at once and keep the whole table fed.' },
  };
  const PLACE_CHALLENGE = {
    titusville: { trial: 'The pull between the rooted land and a brand-new frontier — the family leaves the farm for the coast, where they are firing rockets at the Moon.', endeavor: 'Witness the new age, then carry the line home to the old ground.' },
  };
  function challengeFor(era, placeId) { return (placeId && PLACE_CHALLENGE[placeId]) || CHALLENGES[era] || CHALLENGES.pioneer; }

  // season-true, period-plausible weather per region. kind drives routine variants.
  const WEATHER = {
    tidewater: {
      winter: [['hard frost on the fields', 'cold'], ['a cold rain off the bay', 'rain'], ['snow spitting from the north', 'cold'], ['bright and bitter', 'cold']],
      spring: [['a soft spring rain', 'rain'], ['mild and greening', 'fair'], ['a raw wind off the water', 'cold'], ['clear and cool', 'fair']],
      summer: [['close and humid', 'hot'], ['a thundery afternoon', 'storm'], ['hazy heat', 'hot'], ['fair and warm', 'fair']],
      autumn: [['crisp and golden', 'fair'], ['a grey drizzle', 'rain'], ['first frost on the tobacco', 'cold'], ['air like cider', 'fair']],
    },
    carolina: {
      winter: [['a damp grey cold', 'cold'], ['cold rain in the pines', 'rain'], ['light frost', 'cold'], ['clear and sharp', 'fair']],
      spring: [['warm rains, the woods greening', 'rain'], ['fair and budding', 'fair'], ['a blustery day', 'fair'], ['mild and bright', 'fair']],
      summer: [['heavy heat in the longleaf', 'hot'], ['an afternoon storm', 'storm'], ['sultry and still', 'hot'], ['warm and clear', 'fair']],
      autumn: [['cool and clear', 'fair'], ['a steady drizzle', 'rain'], ['crisp mornings', 'fair'], ['the first cold front', 'cold']],
    },
    florida: {
      winter: [['mild and bright', 'fair'], ['a rare frost on the greens', 'cold'], ['a cold snap off the north', 'cold'], ['damp and grey', 'rain']],
      spring: [['warm and dry, dust on the road', 'fair'], ['a fine clear morning', 'fair'], ['a brief shower', 'rain'], ['breezy and pleasant', 'fair']],
      summer: [['fierce heat', 'hot'], ['the afternoon thunderhead building', 'storm'], ['steaming after the rain', 'hot'], ['still and sweltering', 'hot']],
      autumn: [['warm days and cool nights', 'fair'], ['a grey blow off the Gulf', 'rain'], ['clear and pleasant', 'fair'], ['muggy yet', 'hot']],
    },
  };

  function weatherFor(region, season, seedKey) {
    const pool = (WEATHER[region] || WEATHER.florida)[season];
    const w = pick(makeRng('wx|' + seedKey), pool);
    return { label: w[0], kind: w[1] };
  }

  function timeOfDay(clock) {
    const h = clock.getHours() + clock.getMinutes() / 60;
    let phase = 'night';
    if (h >= 5 && h < 7) phase = 'dawn';
    else if (h >= 7 && h < 11) phase = 'morning';
    else if (h >= 11 && h < 14) phase = 'midday';
    else if (h >= 14 && h < 17) phase = 'afternoon';
    else if (h >= 17 && h < 20) phase = 'dusk';
    const light = Math.max(0, Math.cos((h - 13) / 24 * 2 * Math.PI) * 0.5 + 0.5);
    return { phase: phase, hour: Math.floor(h), label: clockLabel(h), lightLevel: Math.round(light * 100) / 100, isNight: h < 6 || h >= 20 };
  }
  function clockLabel(h) {
    const hr = Math.floor(h) % 24, ap = hr < 12 ? 'am' : 'pm', h12 = (hr % 12) || 12;
    return h12 + (hr < 12 ? ' in the morning' : hr < 17 ? ' in the afternoon' : hr < 21 ? ' in the evening' : ' at night');
  }

  // env(simDate: Date, era, placeId, realClock: Date)
  function environment(simDate, era, placeId, realClock) {
    const region = ERA_REGION[era] || 'florida';
    const season = seasonOf(simDate.getMonth());
    const dayOfYear = Math.floor((simDate - new Date(simDate.getFullYear(), 0, 0)) / 86400000);
    const wx = weatherFor(region, season, (placeId || region) + '|' + simDate.getFullYear() + '|' + dayOfYear);
    const tod = timeOfDay(realClock || new Date());
    const isSunday = simDate.getDay() === 0;
    return {
      date: { y: simDate.getFullYear(), m: simDate.getMonth(), d: simDate.getDate(), label: MONTHS[simDate.getMonth()] + ' ' + simDate.getDate() + ', ' + simDate.getFullYear() },
      season: season, region: region, weather: wx, timeOfDay: tod, isSunday: isSunday,
    };
  }

  /* ---------- authentic daily routines ---------- */
  // schedule[archetype][phase] = { base:[...], rain:[...], hot:[...], cold:[...], storm:[...], comic:[...] }
  // plus an optional sunday[phase] that overrides daytime work with worship.
  const S = {}; // shorthand builder
  function slot(base, extra) { return Object.assign({ base: base }, extra || {}); }

  const SCHEDULES = {
    planter: {
      dawn: slot(['kindles the hall fire and says the morning prayers', 'walks the tobacco rows in the cool, judging the leaf']),
      morning: slot(['sets the seedbeds and tends the young plants', 'tops and suckers the tobacco', 'mends a wall of the curing barn'], { rain: ['keeps to the barn, sorting and tying leaf out of the wet'], cold: ['breaks ice on the trough, then sees to the stock'] }),
      midday: slot(['takes dinner, then meets the cooper about hogsheads', 'weighs the cured leaf for the next shipment']),
      afternoon: slot(['rides to the parish on vestry business', 'appraises a neighbor’s estate for the court', 'trades tobacco notes at the landing'], { storm: ['waits out the thunder under the porch with a neighbor'] }),
      dusk: slot(['tallies the crop in the ledger by the last light', 'salts and hangs the meat']),
      night: slot(['banks the fire and reads a chapter aloud to the house']),
      sunday: { morning: ['rides to the parish church', 'leads the family to worship'], afternoon: ['sees to vestry matters after the service', 'keeps the Sabbath, walking the quiet rows'] },
    },
    orphan: {
      dawn: slot(['rises alone, lays the fire, and stands a moment in the empty house']),
      morning: slot(['works the field he was left, steady and unhurried', 'clears another half-acre by his own hand']),
      midday: slot(['eats plainly, then rides to record a deed', 'measures out the next parcel to take up']),
      afternoon: slot(['re-reads his will, making certain it says what he means', 'sees the children of the house set to their tasks']),
      dusk: slot(['counts the day’s work and what tomorrow needs']),
      night: slot(['sits by the one fire, the house quiet around him']),
      sunday: { morning: ['takes the household to meeting'], afternoon: ['rests, and thinks on those the fever took'] },
    },
    pioneer: {
      dawn: slot(['builds up the camp fire and boils the coffee', 'rouses the family and the stock before the heat']),
      morning: slot(['drives the cattle on toward the new ground', 'clears trail and fords the creek with the wagon', 'fells timber for a cabin'], { rain: ['rigs a tarp and presses on through the mud'], hot: ['works the cool of the morning hard, to lie up at noon'] }),
      midday: slot(['fishes the river for the pot', 'hunts the hammock for game', 'rests the team in the shade'], { storm: ['gets everyone under the wagon as the thunderhead breaks'] }),
      afternoon: slot(['raises a lean-to and lays in firewood', 'scouts the treeline for sign', 'marks out the field to be cleared'], { hot: ['naps out the worst heat, then back to the axe'] }),
      dusk: slot(['sets the night watch and cooks the day’s game', 'pens the cattle against panther and thief']),
      night: slot(['keeps the fire and watches the dark treeline']),
      sunday: { morning: ['rests the stock and reads from the Book at the wagon'], afternoon: ['mends harness and lets the family rest the Sabbath'] },
    },
    soldier: {
      dawn: slot(['stands to at reveille and answers the roll']),
      morning: slot(['drills with the company', 'cleans the musket and draws rations'], { rain: ['huddles in the wet, keeping his powder dry'] }),
      midday: slot(['marches the dusty road south', 'holds the picket line, watching the far treeline']),
      afternoon: slot(['throws up earthworks with the regiment', 'forages the countryside for the mess'], { storm: ['shelters in the works as the storm comes through'] }),
      dusk: slot(['cooks the ration and writes a few lines home']),
      night: slot(['stands picket in the dark, listening']),
      sunday: { morning: ['gathers for the chaplain’s service in camp'], afternoon: ['rests in camp, cleaning gear, thinking of home'] },
    },
    'frontier-farmer': {
      dawn: slot(['lays a fire in the stove and goes to the milking']),
      morning: slot(['chips the turpentine boxes in the pine', 'fells and snakes out timber', 'feeds the stock and slops the hogs'], { cold: ['thaws the pump and sees the children warm first'], rain: ['mends harness and nets in the shed out of the rain'] }),
      midday: slot(['takes a hard dinner and rests an hour', 'sharpens the tools for the afternoon']),
      afternoon: slot(['hauls a load to the sawmill', 'hoes the field and chops cotton', 'fishes the Santa Fe for supper'], { hot: ['works slow in the heat, drinks from the gourd'], storm: ['runs the stock to cover ahead of the storm'] }),
      dusk: slot(['splits stovewood and pens the animals']),
      night: slot(['sits the porch and fixes gear by the lamp']),
      sunday: { morning: ['takes the whole family to Tustenuggee Methodist'], afternoon: ['dinner-on-the-grounds, then rests the Sabbath'] },
    },
    matriarch: {
      dawn: slot(['stirs the fire and starts breakfast for the house']),
      morning: slot(['boils the wash and hangs it', 'churns butter and sets the bread', 'puts up preserves from the garden'], { rain: ['keeps the little ones in, piecing a quilt'] }),
      midday: slot(['lays dinner for the whole table and counts heads']),
      afternoon: slot(['works the garden rows', 'doctors a sick child with what the woods give', 'sits to her sewing']),
      dusk: slot(['cooks supper and minds the smallest ones']),
      night: slot(['mends by lamplight and writes the births in the family Book']),
      sunday: { morning: ['leads the children to church, scrubbed and combed'], afternoon: ['feeds everyone twice and keeps the visiting'] },
    },
    modern: {
      dawn: slot(['pours coffee and reads the sky for the day’s weather']),
      morning: slot(['tends the grove and the field', 'works on the tractor in the shed'], { rain: ['catches up the books and repairs in the barn'] }),
      midday: slot(['comes in for dinner and the noon news']),
      afternoon: slot(['runs the fence line', 'makes the market run to town', 'sets irrigation against the dry'], { hot: ['works the shade rows and waters down'] }),
      dusk: slot(['watches the coast for a rocket on the horizon']),
      night: slot(['sits the porch as the land cools']),
      sunday: { morning: ['takes the family to church'], afternoon: ['Sunday dinner, and the porch all afternoon'] },
    },
    collateral: {
      dawn: slot(['oversleeps, then wanders out scratching his head']),
      morning: slot(['ambles over to “help” at whatever’s nearest and is gently sent elsewhere', 'sets out to do one chore and forgets it halfway'], { comic: ['gets thoroughly lost walking to the next field he has crossed a thousand times'] }),
      midday: slot(['turns up at someone’s table precisely at dinnertime', 'holds forth on the weather to anyone who’ll listen'], { comic: ['mistakes a neighbor’s mule for his own and rides it halfway home'] }),
      afternoon: slot(['naps in the curing barn and blames the fumes', 'tells the same long road story for the third time today'], { comic: ['loses a stubborn argument with a hog and retires with dignity'] }),
      dusk: slot(['ambles home by the longest possible way']),
      night: slot(['snores by the fire before anyone else is tired']),
      sunday: { morning: ['arrives at church a hymn and a half late'], afternoon: ['eats two dinners and calls it being neighborly'] },
    },
    child: { // the young ones — real chores half-done, then off to play
      dawn: slot(['is shaken awake and sent to fetch water and gather the eggs', 'rubs the sleep away and totes in the morning kindling']),
      morning: slot(['feeds the chickens, then slips off to play the moment no one is looking', 'minds a smaller sibling — mostly', 'is set to weeding the garden rows and half-does it'], { rain: ['plays jacks in the doorway, kept in by the wet'], cold: ['hugs the hearth and is shooed out to the woodpile'] }),
      midday: slot(['bolts dinner to get back to the creek', 'races the other young ones three times round the yard']),
      afternoon: slot(['runs the fields with a stick and a yellow dog', 'fishes the bank with a bent pin and endless patience', 'is kept at letters and figures at the kitchen table'], { hot: ['hunts the cool shade and the swimming hole with the cousins'], storm: ['counts the seconds between the lightning and the thunder from the porch'] }),
      dusk: slot(['is hollered in from play as the light goes amber', 'lingers at the edge of the firelight, not ready for the day to end']),
      night: slot(['fights off sleep by the fire, drinking in the grown folks’ talk', 'is carried to bed having sworn they were not the least bit tired']),
      sunday: { morning: ['squirms through the long sermon in a stiff collar'], afternoon: ['runs wild with a pack of cousins after dinner-on-the-grounds'] },
    },
  };

  // The evening gathering — when the day's work is done the household draws
  // together: the fire is built up, and on the frontier someone stands watch.
  function eveningGatherFor(persona, env, rng) {
    if (!(env.timeOfDay.phase === 'dusk' || env.timeOfDay.isNight)) return null;
    const frontier = ['pioneer', 'soldier', 'frontier-farmer'].indexOf(persona.archetype) !== -1;
    if (env.timeOfDay.isNight && frontier && chance(rng, 0.45))
      return { text: pick(rng, ['takes the night watch, the rifle across his knees, reading the dark treeline', 'keeps the fire and listens past it for anything moving in the dark']), kind: 'watch' };
    if (chance(rng, 0.6))
      return { text: pick(rng, ['settles by the campfire as the talk turns to old roads and far places', 'feeds the evening fire and lets the day’s ache ease out of him', 'gathers the household close around the fire against the coming dark']), kind: 'fireside' };
    return null;
  }

  function nearestPhaseSlot(sched, phase) {
    if (sched[phase]) return sched[phase];
    const i = PHASES.indexOf(phase);
    for (let d = 1; d < PHASES.length; d++) {
      if (sched[PHASES[(i + d) % PHASES.length]]) return sched[PHASES[(i + d) % PHASES.length]];
    }
    return null;
  }

  function activityFor(persona, env, rng, archOverride) {
    const archetype = archOverride || persona.archetype;
    const sched = SCHEDULES[archetype] || SCHEDULES.collateral;
    const phase = env.timeOfDay.phase;
    // Sunday daytime → worship
    if (env.isSunday && sched.sunday && !env.timeOfDay.isNight && sched.sunday[phase]) {
      return { text: pick(rng, sched.sunday[phase]), kind: 'sabbath' };
    }
    // Evening: the grown household draws to the fire; the frontier keeps a watch.
    if (archetype !== 'child') {
      const gather = eveningGatherFor(persona, env, rng);
      if (gather) return gather;
    }
    const slotDef = nearestPhaseSlot(sched, phase);
    if (!slotDef) return { text: 'goes about the day', kind: 'work' };
    // comic variant scaled by levity
    if (slotDef.comic && chance(rng, persona.levity * 0.55)) return { text: pick(rng, slotDef.comic), kind: 'comic' };
    // weather variant
    const wk = env.weather.kind;
    if (slotDef[wk] && chance(rng, 0.7)) return { text: pick(rng, slotDef[wk]), kind: 'weather' };
    const kind = archetype === 'child' ? 'play' : env.timeOfDay.isNight ? 'rest' : 'work';
    return { text: pick(rng, slotDef.base), kind: kind };
  }

  /* ---------- who is alive & present ---------- */
  function activeAt(data, year) {
    const H = helpers();
    const ids = [];
    Object.keys(data.people).forEach(function (pid) {
      const p = data.people[pid];
      const b = H ? H.birthYearOf(p) : null;
      if (b == null) return;
      let d = H ? H.deathYearOf(p) : null;
      if (d == null) d = b + 70;
      if (year >= b && year <= d) ids.push(pid);
    });
    return ids;
  }

  /* ---------- reflections (first-person, horizon-bounded) ---------- */
  function reflectionFor(persona, sub, rng) {
    const pool = sub.individual.filter(function (n) {
      return (n.kind === 'event' || n.kind === 'fact') &&
        ['confirmed', 'leading', 'secondary'].indexOf(n.evidence) !== -1 && n.text.length < 180;
    });
    const wisdom = persona.wisdom && persona.wisdom.length ? pick(rng, persona.wisdom) : null;
    if (!pool.length) {
      return wisdom ? { text: wisdom, sources: [] } : null;
    }
    const n = pick(rng, pool);
    const frames = [
      'I think on this often: ' + lower(n.text),
      'It stays with me — ' + lower(n.text),
      lower(n.text) + (wisdom ? ' ' + wisdom : ''),
    ];
    return { text: pick(rng, frames), sources: [n.id] };
  }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function first(name) { return String(name).split(' ')[0]; }

  // A loop of self-discovery: the persona turning over its OWN open questions
  // (the `gap` nodes — a lost surname, an unproven link, a thin record). This is
  // the growth loop made first-person — never a claim, always a wondering.
  function selfDiscoveryFor(persona, sub, rng) {
    const gaps = (sub.individual || []).filter(function (n) { return n.kind === 'gap'; });
    if (!gaps.length) return null;
    const g = pick(rng, gaps);
    const frames = [
      'I find myself wondering — ' + lower(g.text),
      'It nags at me, some nights: ' + lower(g.text),
      'I would give much to know it: ' + lower(g.text),
      'Who came before me, and what did they carry? ' + capFirst(lower(g.text)),
    ];
    return { text: pick(rng, frames), sources: g.id ? [g.id] : [], kind: 'self-discovery' };
  }

  // The pull of the next move — a would-be migrant contemplating documented
  // ground still ahead of them (intent and rumor, never knowledge of outcome).
  function migrationMusingNode(persona, world, sub, rng) {
    const mig = MIGRATIONS[world.placeId];
    if (!mig || !mig.next) return null;
    const here = (world.env && world.env.date && world.env.date.y) || mig.next.year;
    if (mig.next.year < here) return null; // the move is already behind them
    const mover = ['pioneer', 'planter', 'frontier-farmer'].indexOf(persona.archetype) !== -1 || persona.hero;
    if (!mover && !chance(rng, 0.25)) return null;
    const frames = [
      'My mind keeps turning toward ' + mig.next.place + ' — ' + mig.next.push + ', and it is not so far for a family that moves together.',
      'I hear talk of ' + mig.next.place + '. ' + capFirst(mig.next.push) + '. A man wonders if he has one more move left in him.',
      'We came through ' + mig.last + ', and I do not think it is the last of it. ' + capFirst(mig.next.place) + ' is on my mind.',
    ];
    return { text: pick(rng, frames), sources: [], kind: 'migration' };
  }

  /* ---------- encounters & coordination ---------- */
  function relationship(data, aId, bId) {
    const a = data.people[aId] || {};
    if ((a.spouse || []).indexOf(bId) !== -1) return 'spouse';
    if ((a.children || []).indexOf(bId) !== -1) return 'child';
    if ((a.parents || []).indexOf(bId) !== -1) return 'parent';
    const b = data.people[bId] || {};
    const shareParent = (a.parents || []).some(function (x) { return (b.parents || []).indexOf(x) !== -1; });
    if (shareParent) return 'sibling';
    return 'kin/neighbor';
  }
  function sharedTopic(sub, rng) {
    const pool = sub.generational.concat(sub.family).filter(function (n) { return n.kind === 'era-texture' || n.text.length < 140; });
    return pool.length ? pick(rng, pool) : null;
  }

  function encounter(data, world, group, rng) {
    if (group.length < 2) return null;
    const a = group[0], b = group[1];
    const pa = world.personas.byId[a], pb = world.personas.byId[b];
    const subA = world.mem.access(a), subB = world.mem.access(b);
    const rel = relationship(data, a, b);
    const env = world.env || {};
    const tod = env.timeOfDay || { phase: 'midday', isNight: false };
    const evening = tod.phase === 'dusk' || tod.isNight;
    const kin = rel === 'spouse' || rel === 'child' || rel === 'parent' || rel === 'sibling';
    const lines = [];

    // 1) a natural opener, aware of kin and the hour
    const opener = kin
      ? pick(rng, ['There you are, ' + first(pb.name) + '.', 'Come sit, ' + first(pb.name) + '.',
                   'Well now, ' + first(pb.name) + '.', evening ? 'Pull up to the fire, ' + first(pb.name) + '.' : 'You’re a welcome sight, ' + first(pb.name) + '.'])
      : pick(rng, ['Good day to you.', 'Well met, neighbor.', 'Fair to see you.', evening ? 'Evenin’ to you.' : 'You’re about early.']);
    lines.push({ speaker: a, text: opener, sources: [] });

    // 2) a grounded remark on the day — the weather, the season, or the fire
    const dayRemark = evening
      ? pick(rng, ['Good to sit a spell, with the work laid by.', 'The fire’s welcome tonight.', 'Long day. Dark comes on quick this time of year.'])
      : (env.weather && env.weather.label)
        ? pick(rng, ['It’s ' + env.weather.label + ', and no mistaking it.', capFirst(env.weather.label) + ' — we take the day the Lord sends.', 'A proper ' + (env.season || 'day') + ' morning.'])
        : pick(rng, ['Fine day for the work.', 'No use wasting the light.']);
    lines.push({ speaker: b, text: dayRemark, sources: [] });

    // 3) the heart of it — the next move, the shared work, a memory, or a laugh
    const mig = MIGRATIONS[world.placeId];
    if (mig && mig.next && chance(rng, 0.6)) {
      // village mates weigh the road behind and the ground ahead
      lines.push({ speaker: a, text: pick(rng, ['We’ve come a fair way since ' + mig.last + '.', 'Feels not so long since ' + mig.last + '.']), sources: [] });
      lines.push({ speaker: b, text: pick(rng, [
        'And not done yet, I think. They say ' + mig.next.push + '.',
        'There’s ground to be had at ' + mig.next.place + ', or so the talk goes. You given it thought?',
        'Some are speaking of ' + mig.next.place + '. A hard road — but when did that stop this family?',
      ]), sources: [] });
      lines.push({ speaker: a, text: pick(rng, [
        'If we go, we go together. That’s the only way it’s ever held.',
        'I’ve thought of little else. The young ones could break new ground there.',
        'One more move in me, maybe. Then let the children put down roots and stay.',
      ]), sources: [] });
    } else if (pa.archetype === pb.archetype && ['planter', 'pioneer', 'frontier-farmer', 'soldier'].indexOf(pa.archetype) !== -1) {
      const tasks = { planter: 'curing barn', pioneer: 'cattle', 'frontier-farmer': 'timber', soldier: 'works' };
      lines.push({ speaker: a, text: pick(rng, ['Lend me a hand with the ' + tasks[pa.archetype] + ' and we’ll be done by dark.', 'The ' + tasks[pa.archetype] + ' wants two pair of hands — you with me?']), sources: [] });
      lines.push({ speaker: b, text: pick(rng, ['Aye. Together, then.', 'I’m with you, same as always.', 'Sooner begun, sooner done.']), sources: [] });
    } else if (pa.levity >= 0.6 || pb.levity >= 0.6) {
      const joker = pa.levity >= pb.levity ? a : b, jp = world.personas.byId[joker];
      lines.push({ speaker: joker, text: capFirst(jp.quirks[0]) + ', if you must know.', sources: [] });
      lines.push({ speaker: joker === a ? b : a, text: pick(rng, ['You’re a case, you are.', 'Lord. Same as ever with you.', 'Go on with you, then.']), sources: [] });
    } else {
      const topicB = sharedTopic(subB, rng);
      if (topicB) lines.push({ speaker: b, text: pick(rng, ['Been turning this over — ', 'You know what stays with me: ', 'I keep coming back to it — ']) + lower(shorten(topicB.text)) + '.', sources: [topicB.id] });
      const topicA = sharedTopic(subA, rng);
      if (topicA) lines.push({ speaker: a, text: pick(rng, ['Aye. ', 'True enough. ', 'I’ve felt the same of it — ']) + lower(shorten(topicA.text)) + '.', sources: [topicA.id] });
      else if (!topicB) lines.push({ speaker: a, text: pick(rng, ['Aye, that it is.', 'You’re not wrong.', 'Just so.']), sources: [] });
    }

    return { participants: group.slice(0, 2), relationship: rel, evening: evening, lines: lines };
  }
  function shorten(s) { return s.length > 120 ? s.slice(0, 117).replace(/[\s,;.]+\S*$/, '') + '…' : s; }
  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- agent tick: Perceive → Recall → Plan → Act → Reflect ---------- */
  function tickAgent(world, pid, rng) {
    const persona = world.personas.byId[pid];
    const person = world.data.people[pid];
    const env = world.env;
    const H = helpers();
    const trace = [];
    // age in the sim year → the young ones live a child's day, not a grown one
    const bornY = H ? H.birthYearOf(person) : null;
    const age = (bornY != null && env.date.y != null) ? env.date.y - bornY : null;
    const taggedChild = persona.archetype === 'child'; // explicitly depicted as a young one
    const isChild = taggedChild || (age != null && age >= 3 && age <= 13);
    const effArch = isChild ? 'child' : persona.archetype;
    // Perceive
    trace.push({ step: 'perceive', detail: env.timeOfDay.phase + ', ' + env.weather.label + (env.isSunday ? ', the Sabbath' : '') });
    // Recall (tool: query_graph)
    const sub = world.mem.access(pid, { simNow: env.date.y });
    trace.push({ step: 'recall', tool: 'query_graph', detail: sub.stats.visible + ' memories in reach; ' + (sub.stats.blockedFuture + sub.stats.blockedGen) + ' beyond the horizon' });
    // Plan + Act (tool: perform_task)
    const act = activityFor(persona, env, rng, effArch);
    trace.push({ step: 'act', tool: 'perform_task', detail: act.kind });
    // Reflect occasionally (tool: reflect) — a loop of self-discovery (turning over
    // an open question), the pull of the next move, or a settled memory.
    let reflection = null;
    if (chance(rng, isChild ? 0.1 : 0.24)) {
      reflection = (chance(rng, 0.45) && selfDiscoveryFor(persona, sub, rng))
                || migrationMusingNode(persona, world, sub, rng)
                || reflectionFor(persona, sub, rng);
      if (reflection) trace.push({ step: 'reflect', tool: 'reflect', detail: (reflection.kind || 'memory') + ' · ' + reflection.sources.length + ' source(s)' });
    }
    const mood = isChild ? 'at play'
      : act.kind === 'comic' ? 'bemused' : act.kind === 'sabbath' ? 'reverent'
      : act.kind === 'watch' ? 'watchful' : act.kind === 'fireside' ? 'easing by the fire'
      : env.weather.kind === 'storm' ? 'driven for cover' : env.timeOfDay.isNight ? 'at rest' : 'at work';
    return { id: pid, name: person.name, activity: act.text, kind: act.kind, archetype: effArch, isChild: isChild, age: age, mood: mood, reflection: reflection, trace: trace };
  }

  /* ============================================================
     createWorld(opts) -> world instance
       opts: { data?, mem?, personas?, year, placeId?, era?, seed?,
               simDate?: Date, realClock?: Date, dayStride? }
     ============================================================ */
  function createWorld(opts) {
    opts = opts || {};
    const data = opts.data || dep('CASON_DATA');
    const mem = opts.mem || dep('CASON_MEMORY');
    const personas = opts.personas || dep('CASON_PERSONAS');
    const H = helpers();

    const world = {
      data: data, mem: mem, personas: personas,
      year: opts.year, placeId: opts.placeId || null,
      era: opts.era || (H ? H.eraForGen(data, guessGen(data, opts.year)) : null),
      seed: opts.seed != null ? opts.seed : 1,
      simDate: opts.simDate ? new Date(opts.simDate) : new Date((opts.year || 1700), 3, 14),
      realClock: opts.realClock || null,
      dayStride: opts.dayStride || 1,
      roster: opts.roster || null,
      _timer: null,
      env: null,
    };

    function refreshEnv() {
      world.env = environment(world.simDate, world.era, world.placeId, world.realClock || new Date());
      return world.env;
    }

    function snapshot() {
      refreshEnv();
      const present = (world.roster && world.roster.length)
        ? world.roster.slice()
        : activeAt(data, world.year != null ? world.year : world.simDate.getFullYear());
      // deterministic ordering
      present.sort();
      const agents = present.map(function (pid) {
        const rng = makeRng(world.seed + '|' + pid + '|' + world.simDate.toDateString() + '|' + world.env.timeOfDay.phase);
        return tickAgent(world, pid, rng);
      });
      // an encounter among the first co-present kin/neighbors
      let enc = null;
      if (present.length >= 2) {
        const rng = makeRng(world.seed + '|enc|' + world.simDate.toDateString() + '|' + world.env.timeOfDay.phase);
        // prefer a kin pair
        const pair = bestPair(data, present, rng);
        enc = encounter(data, world, pair, rng);
      }
      const reflections = agents.filter(function (a) { return a.reflection; }).slice(0, 6)
        .map(function (a) { return { id: a.id, name: a.name, text: a.reflection.text, sources: a.reflection.sources }; });
      return {
        env: world.env, year: world.year, era: world.era,
        agents: agents, encounter: enc, reflections: reflections,
        present: present,
      };
    }

    function bestPair(data, present, rng) {
      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          const rel = relationship(data, present[i], present[j]);
          if (rel !== 'kin/neighbor') return [present[i], present[j]];
        }
      }
      return [pick(rng, present), pick(rng, present)].filter(function (v, i, a) { return a.indexOf(v) === i; }).length === 2
        ? [present[0], present[1]] : [present[0], present[1]];
    }

    // A whole day at this homestead — every household member's movements across
    // all six phases (dawn→night), plus the documented trial of the time.
    function daySnapshot() {
      refreshEnv();
      const present = (world.roster && world.roster.length)
        ? world.roster.slice()
        : activeAt(data, world.year != null ? world.year : world.simDate.getFullYear());
      present.sort();
      const Hh = helpers();
      const dd = world.simDate;
      const movements = PHASES.map(function (phase) {
        const clk = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate(), PHASE_HOUR[phase] || 12, 0, 0);
        const env = environment(dd, world.era, world.placeId, clk);
        const agents = present.map(function (pid) {
          const persona = world.personas.byId[pid], person = data.people[pid];
          if (!persona || !person) return null;
          const bornY = Hh ? Hh.birthYearOf(person) : null;
          const age = (bornY != null && env.date.y != null) ? env.date.y - bornY : null;
          const isChild = persona.archetype === 'child' || (age != null && age >= 3 && age <= 13);
          const act = activityFor(persona, env, makeRng(world.seed + '|day|' + pid + '|' + dd.toDateString() + '|' + phase), isChild ? 'child' : persona.archetype);
          return { id: pid, name: person.name, activity: act.text, kind: act.kind, isChild: isChild };
        }).filter(Boolean);
        return { phase: phase, label: env.timeOfDay.label, isNight: env.timeOfDay.isNight, weather: env.weather, isSunday: env.isSunday, agents: agents };
      });
      return { date: world.env.date, era: world.era, placeId: world.placeId, challenge: challengeFor(world.era, world.placeId), movements: movements, present: present };
    }

    world.snapshot = snapshot;
    world.daySnapshot = daySnapshot;
    world.refreshEnv = refreshEnv;
    world.step = function () { world.simDate = new Date(world.simDate.getTime() + world.dayStride * 86400000); return snapshot(); };
    world.seekTo = function (o) { if (o.year != null) { world.year = o.year; world.era = H ? H.eraForGen(data, guessGen(data, o.year)) : world.era; } if (o.placeId) world.placeId = o.placeId; if (o.simDate) world.simDate = new Date(o.simDate); return snapshot(); };
    world.setRealClock = function (c) { world.realClock = c; return refreshEnv(); };
    world.setRoster = function (ids) { world.roster = ids && ids.length ? ids.slice() : null; return snapshot(); };
    world.play = function (onTick, ms) {
      world.pause();
      world._timer = setInterval(function () { onTick && onTick(world.step()); }, ms || 2500);
      return world._timer;
    };
    world.pause = function () { if (world._timer) { clearInterval(world._timer); world._timer = null; } };

    refreshEnv();
    return world;
  }

  function guessGen(data, year) {
    if (year == null) return 6;
    const H = helpers();
    let best = 6, bestD = Infinity;
    Object.keys(data.people).forEach(function (pid) {
      const p = data.people[pid];
      const b = H ? H.birthYearOf(p) : null;
      if (b == null) return;
      const d = Math.abs(b + 25 - year);
      if (d < bestD) { bestD = d; best = p.generation; }
    });
    return best;
  }

  /* ---------- public API ---------- */
  const API = {
    createWorld: createWorld,
    environment: environment, activeAt: activeAt, activityFor: activityFor,
    challengeFor: challengeFor, CHALLENGES: CHALLENGES,
    SCHEDULES: SCHEDULES, WEATHER: WEATHER, PHASES: PHASES,
    _internals: { makeRng: makeRng, timeOfDay: timeOfDay, seasonOf: seasonOf, reflectionFor: reflectionFor, encounter: encounter },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) { root.CASON_ENGINE = API; }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
