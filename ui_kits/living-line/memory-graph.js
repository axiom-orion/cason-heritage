/* ============================================================
   The Living Line — Shared Memory Graph  (window.CASON_MEMORY)
   ------------------------------------------------------------
   A derived, tri-layered knowledge graph for the Cason personas.
   It is BUILT from window.CASON_DATA — never a duplicate of it.

   Three knowledge tiers (scope):
     • family       — "Ancestral Trunk":  shared lineage history
                       (identity, kinship, line-wide throughlines)
     • generational — "Generational Fabric": era-shared texture
                       (what everyone of an era knew)
     • individual   — "Personal Enclave": a person's private
                       memories, sources, corrections, open questions

   Temporal-visibility rule (accessibleSubgraph):
     A persona of generation N may see nodes with
       generation <= N+1   AND   year <= horizonYear
     and another person's *individual* memory only via a shared
     encounter (knownPeers). The future is filtered structurally —
     it never enters an agent's context (the governance circuit breaker).

   Runs no-build in the browser (attaches to window) and also under
   Node for the self-test (module.exports).
   ============================================================ */
(function (root) {
  'use strict';

  /* ---- small deterministic, non-crypto content hash (FNV-1a) ----
     Stable id => the graph is tamper-evident and re-derivation is
     idempotent (same facts in => same node ids out). */
  function contentId(parts) {
    const str = parts.filter(function (p) { return p != null; }).join('␟');
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  /* ---- year parsing: prefer structured fields, fall back to lifespan ---- */
  function firstYear(s) {
    if (!s) return null;
    const m = String(s).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : null;
  }
  function parseLifespan(str) {
    if (!str) return { birth: null, death: null };
    const parts = String(str).split(/[–—-]/); // en / em / hyphen
    if (parts.length >= 2) {
      return { birth: firstYear(parts[0]), death: firstYear(parts[1]) };
    }
    // single chunk: "b. 1933" / "bapt 1608" => birth; else treat as birth
    return { birth: firstYear(str), death: null };
  }

  // approximate birth-year anchor per generation, for records with no dates
  const GEN_ANCHOR = {
    0: 1600, 1: 1620, 2: 1650, 3: 1680, 4: 1710, 5: 1740,
    6: 1770, 7: 1805, 8: 1840, 9: 1875, 10: 1905, 11: 1935,
  };

  function birthYearOf(p) {
    if (p.born && typeof p.born.year === 'number') return p.born.year;
    const b = parseLifespan(p.lifespan).birth;
    return b != null ? b : (GEN_ANCHOR[p.generation] != null ? GEN_ANCHOR[p.generation] : null);
  }
  function deathYearOf(p) {
    if (p.died && typeof p.died.year === 'number') return p.died.year;
    return parseLifespan(p.lifespan).death;
  }
  // the persona's "present" horizon: end of life (what they could ever know)
  function lifeYearOf(p) {
    const d = deathYearOf(p);
    if (d != null) return d;
    const b = birthYearOf(p);
    if (b != null) return b + 55;
    return GEN_ANCHOR[p.generation] != null ? GEN_ANCHOR[p.generation] + 55 : 1700;
  }

  function eraForGen(data, gen) {
    const e = (data.eras || []).find(function (er) {
      return (er.generations || []).indexOf(gen) !== -1;
    });
    return e ? e.id : null;
  }

  function nearestPlace(data, coords) {
    if (!coords) return null;
    let best = null, bestD = Infinity;
    (data.places || []).forEach(function (pl) {
      if (!pl.coords) return;
      const dy = pl.coords[0] - coords[0], dx = pl.coords[1] - coords[1];
      const d = dy * dy + dx * dx;
      if (d < bestD) { bestD = d; best = pl.id; }
    });
    // only count it as "at" a place when reasonably close (~0.4deg)
    return bestD <= 0.16 ? best : null;
  }
  function placeOf(data, p) {
    return nearestPlace(data, (p.born && p.born.coords)) ||
           nearestPlace(data, (p.died && p.died.coords)) || null;
  }

  function sentences(text) {
    if (!text) return [];
    // Split after sentence-ending punctuation followed by whitespace.
    // No regex lookbehind here: it is a parse-time SyntaxError on
    // iOS Safari < 16.4 and would kill this entire file (no CASON_MEMORY).
    const str = String(text);
    const parts = [];
    const re = /[.?!]\s+/g;
    let start = 0, m;
    while ((m = re.exec(str)) !== null) {
      parts.push(str.slice(start, m.index + 1));
      start = m.index + m[0].length;
    }
    parts.push(str.slice(start));
    return parts
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length >= 28; });
  }

  /* ---- authored layer: Generational Fabric + Ancestral Trunk throughlines.
     Authored ONLY from facts already present in the narratives. Each is
     gated by `generation` so no one sees an era beyond their horizon. ---- */
  const AUTHORED_NODES = [
    // Generational Fabric (era-shared texture)
    { scope: 'generational', generation: 1, year: 1640, era: 'colonial', place: 'lynnhaven',
      text: 'Tobacco is money and law in the Tidewater; land is taken up by headright — one tract per person whose passage you pay. Death takes near half of new arrivals.' },
    { scope: 'generational', generation: 4, year: 1723, era: 'frontier', place: 'beaufort',
      text: 'The Carolina frontier is a 300-mile reach south of the Tidewater — cheap land, thin courts, and the constant work of clearing forest into field.' },
    { scope: 'generational', generation: 6, year: 1823, era: 'pioneer', place: 'newnansville',
      text: 'Florida is a new territory of some 8,000 souls, no roads, fever in the lowlands, and the Seminole at the edge of every clearing. You travel and defend as a family.' },
    { scope: 'generational', generation: 8, year: 1863, era: 'civil', place: 'cason-cem',
      text: 'The county sends its men to the 7th Florida Infantry; those who march come home, if they come home, to a country economically gutted.' },
    { scope: 'generational', generation: 10, year: 1932, era: 'modern', place: 'fort-white',
      text: 'Fort White lives by turpentine, logging, open-range cattle and hard farming; Depression relief is a few dollars a month, so a man does every trade at once.' },
    // Ancestral Trunk (line-wide throughlines)
    { scope: 'family', generation: 1, year: 1635, era: 'colonial', place: 'lynnhaven',
      text: 'The line begins in the New World with a single crossing from England to Virginia — the first move into the unknown.' },
    { scope: 'family', generation: 6, year: 1823, era: 'pioneer', place: 'newnansville',
      text: 'The family carries one instinct across four centuries: when the known ground is used up, move first into the unknown.' },
    // The Georgia chapter — the 20+ years between Carolina and Florida
    { scope: 'generational', generation: 6, year: 1810, era: 'pioneer', place: 'glynn',
      text: 'Before Florida the family spends a generation on the Georgia coast — Glynn County cotton and timber, Cherokee Lottery land — and the slow weighing of whether to move on.' },
    { scope: 'family', generation: 6, year: 1822, era: 'pioneer', place: 'glynn',
      text: 'In 1822 Ransom liquidates the Georgia holdings — power of attorney to his son William — and in 1823 seven of his nine children follow him south into Florida; some of the line stays behind in Georgia.' },
  ];

  /* ---- hand-authored root-questions: open threads the family carries by
     tradition but the record does not yet close. Owned, so they surface in a
     persona's "what I'm missing" and the Open Lines worklist. evidence
     'possible' = family tradition, not yet documented — never asserted as fact. ---- */
  const AUTHORED_GAPS = [
    { ownerId: 'ransom-sr', tags: ['migration', 'in-law'],
      text: 'Bo Williams names my brother William’s wife as Ann Munden — the second Cason–Munden match. Is she truly a sister of my Phoebe, and where is the primary marriage record?' },
    { ownerId: 'ransom-sr', tags: ['migration', 'brothers'],
      text: 'My brothers are named now — Eli, William, James and Henry — but when and where each of them was born and died is still unwritten, and no primary record yet names our father.' },
    { ownerId: 'phoebe-munden', tags: ['migration', 'in-law'],
      text: 'Ann Munden married Ransom’s brother William. If Ann is my sister, our shared parents and the Munden line before Georgia are still to be proven.' },
    { ownerId: 'phoebe-munden', tags: ['in-law', 'munden'],
      text: 'My own people, the Mundens — my father and mother, my brothers and sisters — are scarcely written down. Where did the Mundens come from before Georgia?' },
    { ownerId: 'james-jr-1750', tags: ['branch', 'unsolved'],
      text: 'My marriage into the Watkins family is in the 1771 will, but no record yet fixes the year I was born or the year and place I died.' },
    { ownerId: 'james-green', tags: ['naming', 'maternal'],
      text: 'My middle name is Green — but whose people were the Greens? It has the look of a mother’s maiden name, and I cannot yet say which line carried it down to me.' },
    { ownerId: 'casey-ann', tags: ['endogamy', 'cason'],
      text: 'They say my own name was Cason before ever I married one — that Ransom and I were cousins, and my father was a Berrien Cason. Now there is paper: a Berrien Cason and I hold a bounty-land patent together in 1860, in Alachua. It does not yet say in so many words that he is my father, nor which Berrien he was — the warrant papers still must.' },
    { ownerId: 'thadeous', tags: ['marriage', 'discrepancy'],
      text: 'My headstone at Tustenuggee says I married Georgia on 25 December 1883, but the family record keeps it as Christmas Eve 1882. Which year — and which day — is right? The Columbia County marriage return will settle it.' },
    { ownerId: 'carl-columbus', tags: ['land'],
      text: 'My father Thadeous is proven now — the 1910 and 1920 census both set me among his children in the Fort White household (the 1910 taker misheard our name as "Caron," which is why the record hid so long). What is still unwritten is the land: there is no homestead patent and no probate in Thad\'s name, so the Fort White ground passed by deed or by hand. Only the Columbia County deed books can still show how it came from Thad to me, and from me to Robert.' },
    { ownerId: 'ransom-sr', tags: ['burial', 'location'],
      text: 'Where do I actually lie? The record marks me at Newnansville, where I died, but the family says I rest half a mile from my grandson Ransom at North Pleasant Grove. The two places are nine miles apart — my grave has not truly been found, only guessed. My son James Green\'s resting place is no surer.' },
  ];

  /* ============================================================
     buildMemoryGraph(data) -> { nodes, edges, byId, byOwner, meta }
     ============================================================ */
  function buildMemoryGraph(data) {
    const nodes = [];
    const edges = [];
    const identityOf = {}; // personId -> identity node id

    function add(node) {
      if (!node.id) node.id = 'mem:' + contentId([node.ownerId, node.kind, node.scope, node.text]);
      nodes.push(node);
      return node.id;
    }

    const people = data.people || {};
    Object.keys(people).forEach(function (pid) {
      const p = people[pid];
      const gen = p.generation;
      const era = eraForGen(data, gen);
      const place = placeOf(data, p);
      const birth = birthYearOf(p);
      const death = deathYearOf(p);

      // --- identity node (Ancestral Trunk): who this person is ---
      const idNode = {
        id: 'mem:' + pid + ':identity',
        ownerId: pid, scope: 'family', generation: gen, year: birth, era: era, place: place,
        kind: 'fact', evidence: p.evidence || 'possible',
        text: p.name + (p.lifespan ? ' (' + p.lifespan + ')' : '') + (p.role ? ' — ' + p.role : ''),
        derivedFrom: ['person.identity'], sources: [], tags: (p.tags || []).slice(),
      };
      add(idNode);
      identityOf[pid] = idNode.id;

      // --- individual event nodes from narrative (Personal Enclave) ---
      sentences(p.narrative).slice(0, 12).forEach(function (s) {
        add({
          ownerId: pid, scope: 'individual', generation: gen, year: death != null ? death : birth,
          era: era, place: place, kind: 'event', evidence: p.evidence || 'possible',
          text: s, derivedFrom: ['person.narrative'], sources: [], tags: (p.tags || []).slice(),
        });
      });

      // --- source citations as first-class memory (Personal Enclave) ---
      (p.sources || []).forEach(function (src) {
        add({
          ownerId: pid, scope: 'individual', generation: gen, year: death != null ? death : birth,
          era: era, place: place, kind: 'fact', evidence: p.evidence || 'confirmed',
          text: 'On the record: ' + src, derivedFrom: ['person.sources'], sources: [src], tags: [],
        });
      });

      // --- corrections / disproven claims: what the persona must NOT claim ---
      if (p.notes) {
        add({
          ownerId: pid, scope: 'individual', generation: gen, year: birth,
          era: era, place: place, kind: 'fact',
          evidence: /disproven/i.test(p.notes) ? 'disproven' : 'eliminated',
          text: p.notes, derivedFrom: ['person.notes'], sources: [],
          tags: ['correction'].concat((p.tags || []).filter(function (t) {
            return t === 'disproven' || t === 'eliminated' || t === 'unsolved';
          })),
        });
      }

      // --- gap nodes: the persona's own open root-questions (growth loop) ---
      const gaps = [];
      const sparse = !p.narrative && !(p.sources && p.sources.length);
      if (p.evidence === 'unsolved') gaps.push('My place in the line is not yet proven — the record breaks here.');
      if (/surname (unknown|not recovered|unrecovered)/i.test(p.notes || '') || /\(surname unknown\)/i.test(p.name || ''))
        gaps.push('My own surname is lost to the record.');
      if (sparse) gaps.push('Little of my life was written down — my story is still being traced.');
      if (p.direct && (!p.children || !p.children.length) && gen < 11)
        gaps.push('Which of my children carried the line on? The next link is not yet drawn.');
      gaps.forEach(function (g) {
        add({
          ownerId: pid, scope: 'individual', generation: gen, year: birth,
          era: era, place: place, kind: 'gap', evidence: 'unsolved',
          text: g, derivedFrom: ['derived.gap'], sources: [], tags: ['open-question'],
        });
      });
    });

    // --- authored Generational Fabric + Ancestral Trunk nodes ---
    AUTHORED_NODES.forEach(function (n) {
      add({
        ownerId: null, scope: n.scope, generation: n.generation, year: n.year,
        era: n.era, place: n.place || null, kind: n.scope === 'family' ? 'fact' : 'era-texture',
        evidence: 'secondary', text: n.text, derivedFrom: ['authored'], sources: [], tags: [],
      });
    });

    // --- authored root-questions (owned open threads) ---
    AUTHORED_GAPS.forEach(function (g) {
      const owner = people[g.ownerId]; if (!owner) return;
      add({
        ownerId: g.ownerId, scope: 'individual', generation: owner.generation,
        year: birthYearOf(owner), era: eraForGen(data, owner.generation), place: placeOf(data, owner),
        kind: 'gap', evidence: 'possible', text: g.text,
        derivedFrom: ['authored.gap'], sources: [], tags: ['open-question'].concat(g.tags || []),
      });
    });

    // --- edges: kin / thematic(owner) / temporal / location ---
    Object.keys(people).forEach(function (pid) {
      const p = people[pid];
      const me = identityOf[pid];
      // kin: parent_of (only when the parent identity exists)
      (p.parents || []).forEach(function (par) {
        if (identityOf[par]) edges.push({ from: identityOf[par], to: me, type: 'kin', rel: 'parent_of', weight: 1 });
      });
      (p.spouse || []).forEach(function (sp) {
        if (identityOf[sp]) edges.push({ from: me, to: identityOf[sp], type: 'kin', rel: 'spouse_of', weight: 0.8 });
      });
    });
    // thematic: every individual node belongs to its owner's identity
    nodes.forEach(function (n) {
      if (n.scope === 'individual' && n.ownerId && identityOf[n.ownerId] && n.id !== identityOf[n.ownerId]) {
        edges.push({ from: identityOf[n.ownerId], to: n.id, type: 'thematic', rel: 'remembers', weight: 0.4 });
      }
    });
    // temporal: consecutive direct-line generations
    const line = data.directLine || [];
    for (let i = 1; i < line.length; i++) {
      if (identityOf[line[i - 1]] && identityOf[line[i]]) {
        edges.push({ from: identityOf[line[i - 1]], to: identityOf[line[i]], type: 'temporal', rel: 'before', weight: 1 });
      }
    }
    // location: identity nodes sharing a place
    const byPlace = {};
    nodes.forEach(function (n) {
      if (n.kind === 'fact' && n.scope === 'family' && n.place && n.id.indexOf(':identity') !== -1) {
        (byPlace[n.place] = byPlace[n.place] || []).push(n.id);
      }
    });

    // indexes
    const byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });
    const byOwner = {};
    nodes.forEach(function (n) {
      if (n.ownerId) (byOwner[n.ownerId] = byOwner[n.ownerId] || []).push(n);
    });

    // --- user-contributed memories (corrections, oral history, AI-consensus
    //     findings) — appended live and persisted in localStorage, always
    //     flagged so they never masquerade as primary-source fact. Attached to
    //     the owner's Personal Enclave at their own birth year, so they stay
    //     within that persona's horizon and never leak to others. ---
    function ingestUserMemory(rec) {
      if (!rec || !rec.personId || !rec.text) return null;
      const person = people[rec.personId]; if (!person) return null;
      const id = 'mem:user:' + contentId([rec.personId, rec.text, rec.when || '']);
      if (byId[id]) return byId[id];
      const node = {
        id: id, ownerId: rec.personId, scope: 'individual', generation: person.generation,
        year: birthYearOf(person), era: eraForGen(data, person.generation), place: placeOf(data, person),
        kind: 'fact', evidence: rec.evidence || 'possible', text: rec.text,
        derivedFrom: ['user.contributed'], sources: rec.source ? [rec.source] : [],
        tags: ['contributed'].concat((rec.source && /consensus/i.test(rec.source)) ? ['ai-consensus'] : []),
      };
      nodes.push(node); byId[id] = node;
      (byOwner[rec.personId] = byOwner[rec.personId] || []).push(node);
      return node;
    }
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        Object.keys(people).forEach(function (pid) {
          const raw = localStorage.getItem('cason-memory-' + pid);
          if (raw) { try { (JSON.parse(raw) || []).forEach(ingestUserMemory); } catch (e) {} }
        });
      }
    } catch (e) {}

    return {
      nodes: nodes, edges: edges, byId: byId, byOwner: byOwner, identityOf: identityOf,
      addUserMemory: ingestUserMemory,
      meta: { built: 'derived from CASON_DATA + contributions', get nodeCount() { return nodes.length; }, edgeCount: edges.length },
    };
  }

  /* ============================================================
     accessibleSubgraph(graph, data, personId, opts)
       opts.simNow      -> override horizon year (sim clock)
       opts.knownPeers  -> ids whose individual memories are unlocked
                           (shared encounters; default: none)
     -> { individual, generational, family, horizonYear, maxGen, blocked, stats }
     ============================================================ */
  function accessibleSubgraph(graph, data, personId, opts) {
    opts = opts || {};
    const p = (data.people || {})[personId];
    if (!p) return { individual: [], generational: [], family: [], horizonYear: null, maxGen: null,
                     blocked: [], stats: { visible: 0, blockedFuture: 0, blockedGen: 0, blockedScope: 0 } };

    const N = p.generation;
    const maxGen = N + 1;
    const horizon = (opts.simNow != null) ? opts.simNow : lifeYearOf(p);
    const known = {};
    (opts.knownPeers || []).forEach(function (id) { known[id] = true; });
    known[personId] = true;

    const out = { individual: [], generational: [], family: [] };
    const blocked = [];
    let bFuture = 0, bGen = 0, bScope = 0;

    graph.nodes.forEach(function (n) {
      // GENERATION GATE — never beyond one generation ahead
      if (n.generation != null && n.generation > maxGen) { bGen++; blocked.push({ id: n.id, why: 'gen' }); return; }
      // TEMPORAL GATE — never the future (the circuit breaker)
      if (n.year != null && n.year > horizon) { bFuture++; blocked.push({ id: n.id, why: 'future' }); return; }
      // SCOPE GATE — others' private memory only via a shared encounter
      if (n.scope === 'individual' && n.ownerId && !known[n.ownerId]) { bScope++; return; }
      out[n.scope] ? out[n.scope].push(n) : null;
    });

    return {
      individual: out.individual, generational: out.generational, family: out.family,
      horizonYear: horizon, maxGen: maxGen, blocked: blocked,
      stats: { visible: out.individual.length + out.generational.length + out.family.length,
               blockedFuture: bFuture, blockedGen: bGen, blockedScope: bScope },
    };
  }

  // ---- public API ----
  const API = {
    build: buildMemoryGraph,
    access: accessibleSubgraph,
    helpers: { birthYearOf: birthYearOf, deathYearOf: deathYearOf, lifeYearOf: lifeYearOf,
               eraForGen: eraForGen, placeOf: placeOf, parseLifespan: parseLifespan, contentId: contentId },
    AUTHORED_NODES: AUTHORED_NODES,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) {
    root.buildMemoryGraph = buildMemoryGraph;
    root.accessibleSubgraph = accessibleSubgraph;
    root.CASON_MEMORY_API = API;
    // Build a default graph once data is present (browser convenience).
    if (root.CASON_DATA) {
      const g = buildMemoryGraph(root.CASON_DATA);
      g.access = function (personId, opts) { return accessibleSubgraph(g, root.CASON_DATA, personId, opts); };
      root.CASON_MEMORY = g;
    }
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null));
