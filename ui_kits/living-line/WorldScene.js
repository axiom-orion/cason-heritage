/* ============================================================
   The Living Line — 3-D World  (window.CASON_SCENE)
   ------------------------------------------------------------
   An opt-in low-poly Three.js homestead, a pure VIEW driven by the
   world engine's snapshots. No external assets: ground, buildings,
   crops, props and people are built from primitives, themed PER PLACE
   so each homestead looks like its own time — a colonial tobacco
   coast, a Carolina log frontier, a Florida pioneer clearing, a
   gutted wartime county, a turpentine-and-pine Fort White, and a
   1950s ranch-house Titusville with orange groves, power lines and
   rockets on the horizon.

   The real-time day/night cycle drives the sky & sun; at dusk a
   campfire lights and the household gathers to it; on the frontier
   someone takes the night watch. People walk to the station that
   matches their current task, arms and legs swinging; the young ones
   are smaller and scamper to the yard to play. Click a figure to
   select them.

   Lazy-loads Three.js from a CDN only when first mounted, and
   feature-detects WebGL — so the deterministic text path stays the
   default and headless CI never spins up a GL context.
   ============================================================ */
(function (root) {
  'use strict';
  var CDN_THREE = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  var threePromise = null;

  function ensureThree() {
    if (root.THREE) return Promise.resolve(root.THREE);
    if (threePromise) return threePromise;
    threePromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = CDN_THREE; s.async = true;
      s.onload = function () { root.THREE ? resolve(root.THREE) : reject(new Error('three missing')); };
      s.onerror = function () { reject(new Error('three failed to load')); };
      document.head.appendChild(s);
    });
    return threePromise;
  }

  function isSupported() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }

  /* ---------- per-PLACE scene profiles — each homestead its own age ----------
     style: house construction · crop: the worked land · props: what stands
     around · water: the river/marsh/Indian-River strip · modern flags. */
  var PROFILES = {
    va: { // Lynnhaven Parish, Virginia — tobacco tidewater, 1640s
      name: 'the tobacco coast', ground: 0x6f7a44, trees: 0x33502f, accent: 0xb7a079,
      house: 'timber', crop: 'tobacco', fence: null, props: ['wharf', 'dryingracks'],
      water: { x: -10, z: -2, w: 8, rot: 0.12, color: 0x3f6a86 },
    },
    nc: { // Beaufort / Pitt Co., North Carolina — Carolina log frontier, 1740s
      name: 'the Carolina frontier', ground: 0x556b3a, trees: 0x274a23, accent: 0x6b4a2a,
      house: 'cabin', crop: 'pine', fence: 'rail', props: ['stumps', 'woodpile'],
      water: { x: -9, z: -3, w: 4, rot: 0.2, color: 0x35597a },
    },
    ga: { // Glynn County, Georgia — coastal pine & marsh, 1810
      name: 'the Georgia coast', ground: 0x6c7c46, trees: 0x2f5230, accent: 0x6b4a2a,
      house: 'cabin', crop: 'palmetto', fence: 'rail', props: ['cattlepen', 'liveoak', 'woodpile'],
      water: { x: -10, z: -2, w: 6, rot: 0.18, color: 0x4a6a70 },
    },
    fl: { // Newnansville, Alachua Co. — Florida pioneer clearing, 1840s
      name: 'the pioneer homestead', ground: 0x7c8450, trees: 0x2f5a3a, accent: 0x6b4a2a,
      house: 'cabin', crop: 'palmetto', fence: 'rail', props: ['cattlepen', 'woodpile'],
      water: { x: -9, z: -2, w: 6, rot: 0.2, color: 0x35617a },
    },
    war: { // Alachua County at war — a gutted county, 1864
      name: 'a county at war', ground: 0x8a8260, trees: 0x46502c, accent: 0x5a4030,
      house: 'cabin', crop: 'fallow', fence: 'broken', props: ['deadtrees', 'woodpile'],
      water: { x: -9, z: -2, w: 5, rot: 0.2, color: 0x4a5560 },
    },
    fw: { // Fort White, Columbia Co. — turpentine & the county's pine, 1900s→
      name: 'Fort White · turpentine & pine', ground: 0x6f8a4a, trees: 0x244a22, accent: 0xc9bfa6,
      house: 'farmhouse', crop: 'pine', fence: 'wire', props: ['sawmill', 'turpentine', 'field'],
      water: null,
    },
    sc: { // Titusville, Brevard Co. — 1950s Space Coast, orange groves, rockets
      name: 'the Space Coast · 1957', ground: 0x77925a, trees: 0x2f6b3a, accent: 0xd8e0d4,
      house: 'ranch', crop: 'citrus', fence: 'wire', props: ['paved', 'powerline', 'rockets', 'palms'],
      water: { x: -11, z: -1, w: 12, rot: 0.05, color: 0x2f6f86 }, // the Indian River
    },
  };
  function profileFor(stage) {
    var byEra = { colonial: 'va', frontier: 'nc', pioneer: 'fl', civil: 'war', modern: 'fw' };
    var p = PROFILES[(stage && stage.id)] || PROFILES[byEra[(stage && stage.era)]] || PROFILES.fl;
    return p;
  }

  var STATIONS = {
    house: [-4, 2.5], barn: [4, 2.5], field: [0, -5], river: [-6, -3], church: [6, -3],
    square: [0, 1.5], fire: [0, 3.6], yard: [2.6, 4.6], gate: [-3.5, 6.5], grove: [7.5, 5],
  };

  function stationKey(agent, archetype, env) {
    var evening = !!(env && env.timeOfDay && (env.timeOfDay.phase === 'dusk' || env.timeOfDay.isNight));
    if (agent.kind === 'sabbath') return 'church';
    if (agent.kind === 'watch') return 'gate';        // the edge of camp, reading the dark
    if (agent.kind === 'fireside') return 'fire';
    if (agent.isChild || agent.kind === 'play') return evening ? 'fire' : 'yard';
    if (env && env.weather && env.weather.kind === 'storm') return 'house';
    if (agent.kind === 'rest') return evening ? 'fire' : 'house';
    if (agent.kind === 'comic') return 'square';
    if (archetype === 'matriarch') return 'house';
    if (archetype === 'pioneer') return (hash(agent.id) % 2) ? 'river' : 'field';
    if (archetype === 'collateral') return 'square';
    if (archetype === 'soldier') return 'field';
    return (hash(agent.id) % 2) ? 'barn' : 'field';
  }

  function archColor(archetype) {
    return {
      planter: 0x3b4a6b, orphan: 0x4a4a55, pioneer: 0x6b4a2a, soldier: 0x55503a,
      'frontier-farmer': 0x4a5a3a, matriarch: 0x7a3a4a, modern: 0x3a5a6b,
      collateral: 0x6b5a3a, child: 0xb06a3a,
    }[archetype] || 0x5a5a5a;
  }

  function mount(host, opts) {
    return ensureThree().then(function (THREE) { return build(THREE, host, opts || {}); });
  }

  function build(THREE, host, opts) {
    var stage = opts.stage || { era: 'modern', id: 'fw' };
    var profile = profileFor(stage);
    var onSelect = opts.onSelect || function () {};

    var W = host.clientWidth || 640, Hh = host.clientHeight || 420;
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, Hh);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.cursor = 'grab';

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fc0e8);
    scene.fog = new THREE.Fog(0x9fc0e8, 18, 46);

    var camera = new THREE.PerspectiveCamera(50, W / Hh, 0.1, 200);
    var orbit = { theta: 0.7, phi: 0.95, radius: 16, tx: 0, tz: -1 };
    function placeCamera() {
      var p = orbit;
      camera.position.set(p.tx + p.radius * Math.sin(p.phi) * Math.sin(p.theta), p.radius * Math.cos(p.phi), p.tz + p.radius * Math.sin(p.phi) * Math.cos(p.theta));
      camera.lookAt(p.tx, 0.5, p.tz);
    }
    placeCamera();

    var hemi = new THREE.HemisphereLight(0xbfd4ff, 0x55502f, 0.7); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1d0, 0.9); sun.position.set(8, 14, 6); scene.add(sun);

    function mat(color) { return new THREE.MeshLambertMaterial({ color: color }); }
    function box(w, h, d, color, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); m.position.set(x, y, z); scene.add(m); return m; }

    // ground
    var ground = new THREE.Mesh(new THREE.CircleGeometry(26, 40), mat(profile.ground));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // water — river, marsh, or the wide Indian River at Titusville
    if (profile.water) {
      var wc = profile.water;
      var water = new THREE.Mesh(new THREE.PlaneGeometry(wc.w, 30), new THREE.MeshLambertMaterial({ color: wc.color, transparent: true, opacity: 0.85 }));
      water.rotation.x = -Math.PI / 2; water.position.set(wc.x, 0.02, wc.z); water.rotation.z = wc.rot; scene.add(water);
    }

    /* ---------- builders ---------- */
    function gableRoof(x, z, w, color, h) {
      var roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.92, h || 1.0, 4), mat(color));
      roof.position.set(x, 1.6 + (h || 1.0) / 2 - 0.2, z); roof.rotation.y = Math.PI / 4; scene.add(roof); return roof;
    }
    function posts(x, z, w, color) { [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (c) { box(0.1, 0.7, 0.1, color, x + c[0] * w * 0.5, 0.35, z + c[1] * 0.5); }); }
    function makeBuilding(style, x, z, color) {
      if (style === 'timber') { box(2.6, 1.7, 2.4, color, x, 0.85, z); gableRoof(x, z, 1.4, 0x6b4a2a, 1.3);
        // dark frame beams
        box(0.12, 1.7, 0.12, 0x4a3320, x - 1.25, 0.85, z + 1.15); box(0.12, 1.7, 0.12, 0x4a3320, x + 1.25, 0.85, z + 1.15); }
      else if (style === 'cabin') { box(2.4, 1.4, 2.2, color, x, 0.7, z); gableRoof(x, z, 1.25, 0x4a3320, 0.9);
        box(0.5, 1.4, 0.06, 0x3a2718, x, 0.7, z + 1.12); } // door
      else if (style === 'farmhouse') { box(2.8, 1.7, 2.4, color, x, 0.85, z); box(2.0, 1.0, 1.8, color, x, 2.0, z); gableRoof(x, z, 1.5, 0x5a4a3a, 1.1);
        box(2.9, 0.1, 0.9, color, x, 1.55, z + 1.5); posts(x, z + 1.55, 2.6, color); } // porch
      else if (style === 'ranch') { // low, wide 1950s ranch
        box(4.0, 1.2, 2.6, color, x, 0.6, z); box(4.2, 0.18, 2.8, 0x8a8278, x, 1.25, z); // shallow slab roof
        box(1.0, 0.9, 0.06, 0x6a8fb0, x - 1.0, 0.55, z + 1.32); // picture window
        box(0.7, 1.2, 0.06, 0x3a2f28, x + 1.3, 0.6, z + 1.32);  // door
        // carport
        box(2.0, 0.12, 2.2, 0x9a9288, x + 3.0, 1.15, z); box(0.12, 1.1, 0.12, 0x9a9288, x + 3.8, 0.55, z + 0.9); box(0.12, 1.1, 0.12, 0x9a9288, x + 3.8, 0.55, z - 0.9); }
      else { box(2.4, 1.5, 2.2, color, x, 0.75, z); gableRoof(x, z, 1.3, 0x4a3320, 1.0); }
    }
    function railFence(x0, z0, x1, z1, broken) {
      var n = 7, color = 0x6b5436;
      for (var i = 0; i < n; i++) {
        if (broken && (i % 3 === 0)) continue;
        var t = i / (n - 1), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
        box(0.08, 0.5, 0.08, color, x, 0.25, z);
        if (i < n - 1 && !(broken && i % 2)) { var mx = x0 + (x1 - x0) * (t + 0.5 / (n - 1)), mz = z0 + (z1 - z0) * (t + 0.5 / (n - 1)); box(0.5, 0.06, 0.05, color, mx, 0.34, mz); box(0.5, 0.06, 0.05, color, mx, 0.18, mz); }
      }
    }
    function wireFence(x0, z0, x1, z1) { for (var i = 0; i < 8; i++) { var t = i / 7; box(0.05, 0.55, 0.05, 0x7a7268, x0 + (x1 - x0) * t, 0.28, z0 + (z1 - z0) * t); } }

    /* crops & flora */
    function pine(x, z) { box(0.18, 1.3, 0.18, 0x4a3320, x, 0.65, z); for (var k = 0; k < 3; k++) { var pt = new THREE.Mesh(new THREE.ConeGeometry(0.72 - k * 0.18, 0.9, 7), mat(0x244a22)); pt.position.set(x, 1.25 + k * 0.5, z); scene.add(pt); } }
    function palmetto(x, z) { var f = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.5, 7), mat(0x3f6b3a)); f.position.set(x, 0.25, z); f.scale.y = 0.6; scene.add(f); }
    function palm(x, z) { box(0.16, 2.2, 0.16, 0x6a5238, x, 1.1, z); var fr = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), mat(0x3a7a44)); fr.position.set(x, 2.3, z); fr.scale.y = 0.5; scene.add(fr); }
    function liveoak(x, z) { box(0.3, 1.0, 0.3, 0x4a3a28, x, 0.5, z); var c = new THREE.Mesh(new THREE.SphereGeometry(1.5, 9, 7), mat(0x39542f)); c.position.set(x, 1.6, z); c.scale.y = 0.7; scene.add(c); }
    function citrus(x, z) { box(0.16, 0.5, 0.16, 0x5a3a22, x, 0.25, z); var cc = new THREE.Mesh(new THREE.SphereGeometry(0.5, 9, 7), mat(0x2f6b35)); cc.position.set(x, 0.8, z); scene.add(cc);
      // a few oranges
      for (var o = 0; o < 4; o++) { var fr = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), mat(0xff8c1a)); fr.position.set(x + (((hash(x + ':' + z + o) % 7) - 3) * 0.12), 0.8 + (((hash(o + 'y') % 5) - 2) * 0.1), z + (((hash(z + o) % 7) - 3) * 0.12)); scene.add(fr); } }
    function deadtree(x, z) { box(0.18, 1.6, 0.18, 0x4a4034, x, 0.8, z); box(0.7, 0.1, 0.1, 0x4a4034, x + 0.2, 1.4, z); }
    function scatterTrees(color, n, seedKey) {
      var s = hash(seedKey);
      for (var i = 0; i < n; i++) { var x = -11 + ((s >> (i * 2)) % 22), z = -10 + (((s >> i) * 3 + i * 5) % 17); box(0.22, 0.9, 0.22, 0x4a3320, x, 0.45, z); var f = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.7, 6), mat(color)); f.position.set(x, 1.7, z); scene.add(f); }
    }
    function rows(fn, x0, z0, cols, rws, dx, dz) { for (var r = 0; r < rws; r++) for (var c = 0; c < cols; c++) fn(x0 + c * dx, z0 + r * dz); }

    /* props */
    function wharf() { box(2.4, 0.12, 1.0, 0x8a7250, profile.water.x + 2.5, 0.25, -2); box(0.12, 0.5, 0.12, 0x5a4630, profile.water.x + 1.5, 0.0, -1.6); box(0.12, 0.5, 0.12, 0x5a4630, profile.water.x + 3.4, 0.0, -2.4); }
    function dryingRacks() { for (var i = 0; i < 3; i++) box(2.4, 0.12, 0.12, 0x6b5a3a, -3 + i * 3, 1.3, -8.5); }
    function cattlePen() { railFence(2.5, 6.5, 6.5, 6.5); railFence(2.5, 6.5, 2.5, 4.0); railFence(6.5, 6.5, 6.5, 4.0);
      [[3.5, 5.4], [5.2, 6.0]].forEach(function (c) { box(0.9, 0.5, 0.4, 0x6b4a38, c[0], 0.4, c[1]); box(0.3, 0.3, 0.3, 0x6b4a38, c[0] + 0.55, 0.5, c[1]); }); }
    function woodpile() { for (var i = 0; i < 4; i++) box(1.0, 0.18, 0.18, 0x6a4a2c, 5.6, 0.1 + i * 0.18, 1.8 + (i % 2) * 0.05); }
    function stumps() { [[-2, -7], [2, -6.5], [-5, 4]].forEach(function (c) { box(0.5, 0.3, 0.5, 0x5a4630, c[0], 0.15, c[1]); }); }
    function sawmill() { box(3.0, 1.6, 2.2, 0x7a6248, -7, 0.8, 4); gableRoof(-7, 4, 1.5, 0x4a3a2a, 0.9);
      for (var i = 0; i < 4; i++) box(1.6, 0.2, 0.3, 0x8a6a44, -5.2, 0.12 + i * 0.2, 4 + (i % 2) * 0.1); // log pile
      var blade = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshLambertMaterial({ color: 0xbfc4c8, side: THREE.DoubleSide })); blade.position.set(-7, 0.9, 5.2); scene.add(blade); }
    function turpentine() { [[8, -2], [9.2, -3.5], [7.6, -4.5]].forEach(function (c) { box(0.2, 1.3, 0.2, 0x6a4a2c, c[0], 0.65, c[1]); for (var k = 0; k < 3; k++) { var pt = new THREE.Mesh(new THREE.ConeGeometry(0.6 - k * 0.16, 0.8, 6), mat(0x244a22)); pt.position.set(c[0], 1.3 + k * 0.45, c[1]); scene.add(pt); } box(0.16, 0.16, 0.12, 0xd8c89a, c[0], 0.5, c[1] + 0.18); }); }
    function pavedRoad() { var rd = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 40), mat(0x4a4a4e)); rd.rotation.x = -Math.PI / 2; rd.position.set(8.5, 0.03, 0); scene.add(rd); for (var i = -4; i <= 4; i++) box(0.12, 0.02, 0.7, 0xd8d04a, 8.5, 0.05, i * 3.0); }
    function powerline() { for (var i = -3; i <= 3; i++) { var x = 9.7, z = i * 3.2; box(0.14, 2.6, 0.14, 0x6a5a48, x, 1.3, z); box(1.0, 0.12, 0.12, 0x6a5a48, x, 2.4, z); } }
    function rockets() { [-7, -3].forEach(function (rx) { box(0.7, 6, 0.7, 0xf2f2f2, rx, 3, -17); var nose = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 12), mat(0xd83a2a)); nose.position.set(rx, 6.6, -17); scene.add(nose); box(1.2, 5, 0.4, 0x8a8a8a, rx + 1.1, 2.6, -17); }); }
    function palms() { rows(palm, 5, 7, 4, 1, 1.6, 0); }

    /* ---------- assemble the homestead ---------- */
    // dwelling, barn, church
    makeBuilding(profile.house, STATIONS.house[0], STATIONS.house[1], profile.accent);
    makeBuilding(profile.house === 'ranch' ? 'ranch' : (profile.house === 'farmhouse' ? 'farmhouse' : 'cabin'), STATIONS.barn[0], STATIONS.barn[1], profile.house === 'ranch' ? 0xc7b89a : 0x6b3a2a);
    makeBuilding(profile.house === 'timber' ? 'timber' : 'cabin', STATIONS.church[0], STATIONS.church[1], 0xd8d0c0);
    var steeple = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), mat(0xb8b0a0)); steeple.position.set(STATIONS.church[0], 3.0, STATIONS.church[1]); steeple.rotation.y = Math.PI / 4; scene.add(steeple);

    // crops — the worked land, in rows
    if (profile.crop === 'tobacco') { for (var tr = 0; tr < 6; tr++) box(7, 0.08, 0.5, 0x5a6b35, 0, 0.05, -7 + tr * 0.9); }
    else if (profile.crop === 'pine') { rows(pine, -11, -10, 4, 4, 2.4, 2.2); scatterTrees(profile.trees, 4, stage.id + 'p'); }
    else if (profile.crop === 'citrus') { rows(citrus, 4.5, 2.5, 4, 4, 1.4, 1.3); }   // the orange grove
    else if (profile.crop === 'palmetto') { for (var sf = 0; sf < 8; sf++) { var ps = hash(stage.id + 'pm' + sf); palmetto(-11 + (ps % 22), -10 + ((ps >> 4) % 17)); } scatterTrees(profile.trees, 4, stage.id + 's'); }
    else if (profile.crop === 'fallow') { box(7, 0.08, 0.5, 0x8a8258, 0, 0.05, -6); scatterTrees(profile.trees, 3, stage.id + 'f'); } // a worn, half-worked field
    else scatterTrees(profile.trees, 6, stage.id + 'x');

    // fences
    if (profile.fence === 'rail') railFence(-2, -2, -8, -2);
    else if (profile.fence === 'wire') wireFence(-2, -2, -8, -2);
    else if (profile.fence === 'broken') railFence(-2, -2, -8, -2, true);

    // props per place
    (profile.props || []).forEach(function (pr) {
      if (pr === 'wharf' && profile.water) wharf();
      else if (pr === 'dryingracks') dryingRacks();
      else if (pr === 'cattlepen') cattlePen();
      else if (pr === 'woodpile') woodpile();
      else if (pr === 'stumps') stumps();
      else if (pr === 'deadtrees') { deadtree(-2, -7); deadtree(2.5, -6); deadtree(-6, 3.5); }
      else if (pr === 'liveoak') { liveoak(-9, 5); liveoak(9, -6); }
      else if (pr === 'sawmill') sawmill();
      else if (pr === 'turpentine') turpentine();
      else if (pr === 'field') { for (var fr2 = 0; fr2 < 4; fr2++) box(6, 0.08, 0.5, 0x6a7b3f, 4, 0.05, -7 + fr2 * 0.9); }
      else if (pr === 'paved') pavedRoad();
      else if (pr === 'powerline') powerline();
      else if (pr === 'rockets') rockets();
      else if (pr === 'palms') palms();
    });

    /* ---------- the campfire — lit at dusk, the household gathers ---------- */
    var fire = new THREE.Group();
    [[0, 0], [0.18, 0.1], [-0.16, 0.12]].forEach(function (c) { var lg = box(0.5, 0.12, 0.12, 0x4a3320, 0, 0.08, 0); lg.position.set(c[0], 0.08, c[1]); lg.rotation.y = hash(c[0] + ':' + c[1]) % 3; fire.remove(lg); fire.add(lg); });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 6, 16), mat(0x6a6258)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; fire.add(ring);
    var flame = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 7), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); flame.position.y = 0.45; fire.add(flame);
    var flameInner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), new THREE.MeshBasicMaterial({ color: 0xffe07a })); flameInner.position.y = 0.4; fire.add(flameInner);
    var fireLight = new THREE.PointLight(0xff7a2a, 0, 10); fireLight.position.set(0, 0.9, 0); fire.add(fireLight);
    fire.position.set(STATIONS.fire[0], 0, STATIONS.fire[1]); fire.visible = false; scene.add(fire);

    /* ---------- people ---------- */
    var figures = {}; // id -> { group, target, kind, isChild, phase, limbs }
    var bubble = null, bubbleFor = null, bubbleText = '';
    function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function makeBubbleSprite(text) {
      var cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      var g = cv.getContext('2d');
      g.fillStyle = 'rgba(250,246,240,0.96)'; roundRect(g, 3, 3, 250, 44, 10); g.fill();
      g.strokeStyle = 'rgba(139,69,19,0.45)'; g.lineWidth = 2; roundRect(g, 3, 3, 250, 44, 10); g.stroke();
      g.fillStyle = '#2c1810'; g.font = '20px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text.length > 30 ? text.slice(0, 29) + '…' : text, 128, 26);
      var tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.scale.set(3.6, 0.9, 1); sp.renderOrder = 10; return sp;
    }
    function makeLabel(text) {
      var cv = document.createElement('canvas'); cv.width = 128; cv.height = 36;
      var g = cv.getContext('2d'); g.font = '600 22px sans-serif'; g.fillStyle = '#2c1810'; g.textAlign = 'center'; g.fillText(text, 64, 26);
      var tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true })); sp.scale.set(2.2, 0.62, 1); sp.position.y = 1.7; return sp;
    }
    function limb(color, len, x, y) {
      var pivot = new THREE.Group();
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.1, len, 0.1), mat(color)); m.position.y = -len / 2; pivot.add(m);
      pivot.position.set(x, y, 0); return pivot;
    }

    // a member's embodied avatar — a present-day "keeper" the family member walks
    var avatar = null, avatarTarget = null;
    function setAvatar(name) {
      if (name && !avatar) {
        avatar = new THREE.Group();
        var ab = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.9, 8), mat(0x2f6f8f)); ab.position.y = 0.62; avatar.add(ab);
        var ah = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(0xe6c39a)); ah.position.y = 1.2; avatar.add(ah);
        var al = limb(0x2f6f8f, 0.4, -0.16, 0.18), ar = limb(0x2f6f8f, 0.4, 0.16, 0.18); avatar.add(al); avatar.add(ar);
        avatar.userData.limbs = { armL: limb(0x2f6f8f, 0.38, -0.28, 0.78), armR: limb(0x2f6f8f, 0.38, 0.28, 0.78), legL: al, legR: ar };
        avatar.add(avatar.userData.limbs.armL); avatar.add(avatar.userData.limbs.armR);
        var rg = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xd4a825 })); rg.rotation.x = Math.PI / 2; rg.position.y = 0.05; avatar.add(rg);
        avatar.add(makeLabel((name || 'You') + ' ✦'));
        avatar.position.set(STATIONS.square[0], 0, STATIONS.square[1] + 2);
        scene.add(avatar);
      } else if (!name && avatar) { scene.remove(avatar); disposeObj(avatar); avatar = null; avatarTarget = null; }
    }
    function makeFigure(id, agent) {
      var per = (root.CASON_PERSONAS && root.CASON_PERSONAS.byId[id]) || { archetype: 'collateral', name: id };
      var arch = (agent && agent.archetype) || per.archetype;
      var col = archColor(arch);
      var g = new THREE.Group();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, 0.6, 6), mat(col)); body.position.y = 0.62; g.add(body);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat(0xe6c39a)); head.position.y = 1.05; g.add(head);
      if (!(agent && agent.isChild)) { var hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 6), mat(arch === 'matriarch' ? 0x5a3a4a : 0x3a2a1a)); hat.position.y = 1.18; g.add(hat); }
      var armL = limb(col, 0.42, -0.22, 0.86), armR = limb(col, 0.42, 0.22, 0.86);
      var legL = limb(0x3a2f28, 0.4, -0.1, 0.34), legR = limb(0x3a2f28, 0.4, 0.1, 0.34);
      g.add(armL); g.add(armR); g.add(legL); g.add(legR);
      g.userData.limbs = { armL: armL, armR: armR, legL: legL, legR: legR };
      g.add(makeLabel((per.name || id).split(' ')[0]));
      if (agent && agent.isChild) g.scale.setScalar(0.6);
      g.userData.personId = id;
      g.traverse(function (o) { o.userData.personId = id; });
      return g;
    }
    function slot(id, key) {
      var s = STATIONS[key] || STATIONS.square; var h = hash(id);
      return new THREE.Vector3(s[0] + (((h % 7) - 3) * 0.35), 0, s[1] + ((((h >> 3) % 7) - 3) * 0.35));
    }
    function archetypeOf(id) { return ((root.CASON_PERSONAS && root.CASON_PERSONAS.byId[id]) || {}).archetype; }

    var current = opts.snapshot || null;
    var fireOn = false;
    function update(snap) {
      current = snap; if (!snap) return;
      var env = snap.env;
      // sky + sun from real-time day/night
      var t = env.timeOfDay, L = t.lightLevel;
      var sky = t.isNight ? new THREE.Color(0x111a30) : (t.phase === 'dawn' || t.phase === 'dusk') ? new THREE.Color(0xe6a35a).lerp(new THREE.Color(0x9fc0e8), L) : new THREE.Color(0x9fc0e8);
      var stormy = env.weather.kind === 'storm' || env.weather.kind === 'rain';
      if (stormy) sky.lerp(new THREE.Color(0x8a8f96), 0.5);
      scene.background = sky; scene.fog.color = sky;
      scene.fog.near = stormy ? 10 : 18; scene.fog.far = stormy ? 34 : 46;
      sun.intensity = 0.18 + L * 0.95 * (stormy ? 0.5 : 1); hemi.intensity = 0.35 + L * 0.45;
      var ang = (t.hour / 24) * Math.PI * 2 - Math.PI / 2; sun.position.set(Math.cos(ang) * 12, Math.max(2, Math.sin(ang) * 14), 6);
      sun.color.set(t.phase === 'dawn' || t.phase === 'dusk' ? 0xffb060 : 0xfff1d0);

      // the fire lights as the day goes
      fireOn = (t.phase === 'dusk' || t.isNight); fire.visible = fireOn;

      // sync figures with the present cohort
      var present = {};
      (snap.agents || []).forEach(function (a) {
        present[a.id] = true;
        var arch = a.archetype || archetypeOf(a.id);
        if (!figures[a.id]) { var grp = makeFigure(a.id, a); scene.add(grp); var st0 = slot(a.id, stationKey(a, arch, env)); grp.position.copy(st0); figures[a.id] = { group: grp, target: st0.clone(), phase: hash(a.id) % 6, limbs: grp.userData.limbs }; }
        figures[a.id].target = slot(a.id, stationKey(a, arch, env));
        figures[a.id].kind = a.kind;
        figures[a.id].isChild = a.isChild;
      });
      Object.keys(figures).forEach(function (id) { if (!present[id]) { scene.remove(figures[id].group); disposeObj(figures[id].group); delete figures[id]; } });

      // encounter speech bubble — the first overheard line, above its speaker
      var enc = snap.encounter, line0 = enc && enc.lines && enc.lines[0];
      if (line0 && figures[line0.speaker]) {
        if (line0.text !== bubbleText) {
          if (bubble) { scene.remove(bubble); if (bubble.material.map) bubble.material.map.dispose(); bubble.material.dispose(); }
          bubble = makeBubbleSprite(line0.text); scene.add(bubble); bubbleText = line0.text;
        }
        bubbleFor = line0.speaker;
      } else { bubbleFor = null; if (bubble) bubble.visible = false; }
    }

    /* interaction: drag-orbit + click-select */
    var down = false, dragged = false, sx = 0, sy = 0;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function onDown(e) { down = true; dragged = false; sx = e.clientX; sy = e.clientY; renderer.domElement.style.cursor = 'grabbing'; }
    function onMove(e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      orbit.theta -= dx * 0.006; orbit.phi = Math.max(0.35, Math.min(1.3, orbit.phi - dy * 0.005));
      sx = e.clientX; sy = e.clientY; placeCamera();
    }
    function onUp(e) {
      renderer.domElement.style.cursor = 'grab';
      if (down && !dragged) {
        var rect = renderer.domElement.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        ray.setFromCamera(ndc, camera);
        var hits = ray.intersectObjects(Object.keys(figures).map(function (k) { return figures[k].group; }), true);
        if (hits.length && hits[0].object.userData.personId) onSelect(hits[0].object.userData.personId);
        else if (avatar) { var gh = ray.intersectObject(ground, false); if (gh.length) { avatarTarget = gh[0].point.clone(); avatarTarget.y = 0; } }
      }
      down = false;
    }
    function onWheel(e) { orbit.radius = Math.max(8, Math.min(28, orbit.radius + e.deltaY * 0.012)); placeCamera(); e.preventDefault(); }
    renderer.domElement.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    function onResize() { var w = host.clientWidth || W, h = host.clientHeight || Hh; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
    window.addEventListener('resize', onResize);

    if (current) update(current);

    var clock = 0, raf = null, disposed = false;
    function swingLimbs(limbs, ang) {
      if (!limbs) return;
      if (limbs.armL) limbs.armL.rotation.x = ang; if (limbs.armR) limbs.armR.rotation.x = -ang;
      if (limbs.legL) limbs.legL.rotation.x = -ang; if (limbs.legR) limbs.legR.rotation.x = ang;
    }
    function tick() {
      if (disposed) return;
      raf = requestAnimationFrame(tick); clock += 0.016;
      Object.keys(figures).forEach(function (id) {
        var f = figures[id], p = f.group.position, tg = f.target;
        var dx = tg.x - p.x, dz = tg.z - p.z, d = Math.hypot(dx, dz);
        var speed = f.isChild ? 0.045 : 0.03, wob = f.isChild ? 9 : 7;
        if (d > 0.05) {
          p.x += dx * speed; p.z += dz * speed;
          f.group.position.y = Math.abs(Math.sin(clock * wob + f.phase)) * (f.isChild ? 0.09 : 0.06);
          f.group.rotation.y = Math.atan2(dx, dz);
          swingLimbs(f.limbs, Math.sin(clock * (wob + 1) + f.phase) * 0.6);
        } else {
          f.group.position.y = 0;
          if (f.kind === 'comic') f.group.rotation.y += 0.01;
          // gentle idle: children fidget, watchers turn, others breathe
          swingLimbs(f.limbs, Math.sin(clock * 1.5 + f.phase) * (f.isChild ? 0.18 : 0.05));
        }
      });
      if (avatar && avatarTarget) { var apx = avatar.position; var adx = avatarTarget.x - apx.x, adz = avatarTarget.z - apx.z, add = Math.hypot(adx, adz); if (add > 0.06) { apx.x += adx * 0.05; apx.z += adz * 0.05; avatar.position.y = Math.abs(Math.sin(clock * 7)) * 0.07; avatar.rotation.y = Math.atan2(adx, adz); swingLimbs(avatar.userData.limbs, Math.sin(clock * 8) * 0.5); } else { avatar.position.y = 0; swingLimbs(avatar.userData.limbs, Math.sin(clock * 1.5) * 0.05); } }
      if (fireOn) { var fl = 0.7 + Math.sin(clock * 12) * 0.18 + Math.sin(clock * 31) * 0.12; fireLight.intensity = 1.5 * fl; flame.scale.y = 0.85 + fl * 0.3; flame.scale.x = flameInner.scale.x = 0.92 + Math.sin(clock * 20) * 0.08; }
      if (bubble && bubbleFor && figures[bubbleFor]) { var bpos = figures[bubbleFor].group.position; bubble.position.set(bpos.x, bpos.y + 2.2, bpos.z); bubble.visible = true; }
      else if (bubble) { bubble.visible = false; }
      renderer.render(scene, camera);
    }
    tick();

    function disposeObj(o) { o.traverse && o.traverse(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose && c.material.dispose(); } }); }
    function dispose() {
      disposed = true; if (raf) cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel); window.removeEventListener('resize', onResize);
      scene.traverse(disposeObj); renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    }

    return { update: update, dispose: dispose, setAvatar: setAvatar };
  }

  root.CASON_SCENE = { isSupported: isSupported, mount: mount };
})(typeof window !== 'undefined' ? window : this);
