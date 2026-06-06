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
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function seasonOf(month) { // 0-11
    if (month <= 1 || month === 11) return 'winter';
    if (month <= 4) return 'spring';
    if (month <= 7) return 'summer';
    return 'autumn';
  }

  const ERA_REGION = { colonial: 'tidewater', frontier: 'carolina', pioneer: 'florida', civil: 'florida', modern: 'florida' };

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
  };

  function nearestPhaseSlot(sched, phase) {
    if (sched[phase]) return sched[phase];
    const i = PHASES.indexOf(phase);
    for (let d = 1; d < PHASES.length; d++) {
      if (sched[PHASES[(i + d) % PHASES.length]]) return sched[PHASES[(i + d) % PHASES.length]];
    }
    return null;
  }

  function activityFor(persona, env, rng) {
    const sched = SCHEDULES[persona.archetype] || SCHEDULES.collateral;
    const phase = env.timeOfDay.phase;
    // Sunday daytime → worship
    if (env.isSunday && sched.sunday && !env.timeOfDay.isNight && sched.sunday[phase]) {
      return { text: pick(rng, sched.sunday[phase]), kind: 'sabbath' };
    }
    const slotDef = nearestPhaseSlot(sched, phase);
    if (!slotDef) return { text: 'goes about the day', kind: 'work' };
    // comic variant scaled by levity
    if (slotDef.comic && chance(rng, persona.levity * 0.55)) return { text: pick(rng, slotDef.comic), kind: 'comic' };
    // weather variant
    const wk = env.weather.kind;
    if (slotDef[wk] && chance(rng, 0.7)) return { text: pick(rng, slotDef[wk]), kind: 'weather' };
    return { text: pick(rng, slotDef.base), kind: env.timeOfDay.isNight ? 'rest' : 'work' };
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
    const lines = [];
    const greet = rel === 'spouse' || rel === 'child' || rel === 'parent' || rel === 'sibling'
      ? ['Well met, ' + first(pb.name) + '.', 'There you are.', 'Come, ' + first(pb.name) + '.']
      : ['Good day to you.', 'Fair morning.', 'Neighbor.'];
    lines.push({ speaker: a, text: pick(rng, greet), sources: [] });

    // B answers with something they actually know (horizon-bounded)
    const topicB = sharedTopic(subB, rng);
    if (topicB) lines.push({ speaker: b, text: 'Aye. ' + capFirst(lower(shorten(topicB.text))) + '.', sources: [topicB.id] });
    else lines.push({ speaker: b, text: 'Aye, that it is.', sources: [] });

    // coordination if they share a working archetype
    if (pa.archetype === pb.archetype && ['planter', 'pioneer', 'frontier-farmer', 'soldier'].indexOf(pa.archetype) !== -1) {
      const tasks = { planter: 'curing barn', pioneer: 'cattle', 'frontier-farmer': 'timber', soldier: 'works' };
      lines.push({ speaker: a, text: 'Lend a hand with the ' + tasks[pa.archetype] + ' and we’ll be done by dusk.', sources: [] });
      lines.push({ speaker: b, text: 'Done. Together, then.', sources: [] });
    } else if (pa.levity >= 0.6 || pb.levity >= 0.6) {
      // a bit of comedy
      const joker = pa.levity >= pb.levity ? a : b;
      const jp = world.personas.byId[joker];
      lines.push({ speaker: joker, text: capFirst(jp.quirks[0]) + ', if you must know.', sources: [] });
    } else {
      const topicA = sharedTopic(subA, rng);
      if (topicA) lines.push({ speaker: a, text: 'I’ve been thinking on it — ' + lower(shorten(topicA.text)) + '.', sources: [topicA.id] });
    }
    return { participants: group.slice(0, 2), relationship: rel, lines: lines };
  }
  function shorten(s) { return s.length > 120 ? s.slice(0, 117).replace(/[\s,;.]+\S*$/, '') + '…' : s; }
  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- agent tick: Perceive → Recall → Plan → Act → Reflect ---------- */
  function tickAgent(world, pid, rng) {
    const persona = world.personas.byId[pid];
    const person = world.data.people[pid];
    const env = world.env;
    const trace = [];
    // Perceive
    trace.push({ step: 'perceive', detail: env.timeOfDay.phase + ', ' + env.weather.label + (env.isSunday ? ', the Sabbath' : '') });
    // Recall (tool: query_graph)
    const sub = world.mem.access(pid, { simNow: env.date.y });
    trace.push({ step: 'recall', tool: 'query_graph', detail: sub.stats.visible + ' memories in reach; ' + (sub.stats.blockedFuture + sub.stats.blockedGen) + ' beyond the horizon' });
    // Plan + Act (tool: perform_task)
    const act = activityFor(persona, env, rng);
    trace.push({ step: 'act', tool: 'perform_task', detail: act.kind });
    // Reflect occasionally (tool: reflect)
    let reflection = null;
    if (chance(rng, 0.22)) {
      reflection = reflectionFor(persona, sub, rng);
      if (reflection) trace.push({ step: 'reflect', tool: 'reflect', detail: reflection.sources.length + ' source(s)' });
    }
    const mood = act.kind === 'comic' ? 'bemused' : act.kind === 'sabbath' ? 'reverent'
      : env.weather.kind === 'storm' ? 'driven for cover' : env.timeOfDay.isNight ? 'at rest' : 'at work';
    return { id: pid, name: person.name, activity: act.text, kind: act.kind, mood: mood, reflection: reflection, trace: trace };
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

    world.snapshot = snapshot;
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
    SCHEDULES: SCHEDULES, WEATHER: WEATHER, PHASES: PHASES,
    _internals: { makeRng: makeRng, timeOfDay: timeOfDay, seasonOf: seasonOf, reflectionFor: reflectionFor, encounter: encounter },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) { root.CASON_ENGINE = API; }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
