/* ============================================================
   The Living Line — 3-D World  (window.CASON_SCENE)
   ------------------------------------------------------------
   An opt-in low-poly Three.js homestead, a pure VIEW driven by the
   world engine's snapshots. No external assets: ground, buildings,
   trees and people are built from primitives, themed per era. The
   real-time day/night cycle drives the sky & sun; weather adds fog;
   each person walks to the station that matches their current
   activity (field, barn, river, church, house). Click a figure to
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
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* per-era look */
  function themeFor(stage) {
    var byEra = {
      colonial: { ground: 0x6b7a44, accent: 0x8a6b3a, trees: 0x33502f, name: 'tobacco coast' },
      frontier: { ground: 0x556b3a, accent: 0x6b4a2a, trees: 0x274a23, name: 'pine frontier' },
      pioneer: { ground: 0x7c8450, accent: 0x6b4a2a, trees: 0x2f5a3a, name: 'swamp homestead' },
      civil: { ground: 0x7a7350, accent: 0x5a4030, trees: 0x3a4a2a, name: 'a county at war' },
      modern: { ground: 0x6f8a4a, accent: 0x7a5a3a, trees: 0x2f5a2f, name: 'turpentine & field' },
    };
    var t = Object.assign({ rockets: false }, byEra[stage.era] || byEra.modern);
    if (stage.id === 'sc') { t.rockets = true; t.name = 'the Space Coast'; t.ground = 0x6f8a55; }
    return t;
  }

  var STATIONS = {
    house: [-4, 2.5], barn: [4, 2.5], field: [0, -5], river: [-6, -3], church: [6, -3], square: [0, 1.5],
  };

  function stationKey(agent, archetype, env) {
    if (agent.kind === 'sabbath') return 'church';
    if (env && env.weather && env.weather.kind === 'storm') return 'house';
    if (agent.kind === 'rest') return 'house';
    if (agent.kind === 'comic') return 'square';
    // working
    if (archetype === 'matriarch') return 'house';
    if (archetype === 'pioneer') return (hash(agent.id) % 2) ? 'river' : 'field';
    if (archetype === 'collateral') return 'square';
    if (archetype === 'soldier') return 'field';
    return (hash(agent.id) % 2) ? 'barn' : 'field';
  }

  function archColor(archetype) {
    return {
      planter: 0x3b4a6b, orphan: 0x4a4a55, pioneer: 0x6b4a2a, soldier: 0x55503a,
      'frontier-farmer': 0x4a5a3a, matriarch: 0x7a3a4a, modern: 0x3a5a6b, collateral: 0x6b5a3a,
    }[archetype] || 0x5a5a5a;
  }

  function mount(host, opts) {
    return ensureThree().then(function (THREE) { return build(THREE, host, opts || {}); });
  }

  function build(THREE, host, opts) {
    var theme = themeFor(opts.stage || { era: 'modern', id: 'fw' });
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

    // ground
    var ground = new THREE.Mesh(new THREE.CircleGeometry(26, 40), new THREE.MeshLambertMaterial({ color: theme.ground }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    // river / water strip
    var water = new THREE.Mesh(new THREE.PlaneGeometry(6, 26), new THREE.MeshLambertMaterial({ color: 0x355a7a, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2; water.position.set(-9, 0.02, -2); water.rotation.z = 0.2; scene.add(water);

    function box(w, h, d, color, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: color })); m.position.set(x, y, z); scene.add(m); return m; }
    function building(x, z, color, w) { w = w || 2.4; box(w, 1.6, w, color, x, 0.8, z); var roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.85, 1.0, 4), new THREE.MeshLambertMaterial({ color: 0x4a2f1f })); roof.position.set(x, 2.1, z); roof.rotation.y = Math.PI / 4; scene.add(roof); }
    function tree(x, z) { box(0.22, 0.9, 0.22, 0x4a3320, x, 0.45, z); var f = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.7, 6), new THREE.MeshLambertMaterial({ color: theme.trees })); f.position.set(x, 1.7, z); scene.add(f); }

    // house, barn
    building(STATIONS.house[0], STATIONS.house[1], theme.accent, 2.6);
    building(STATIONS.barn[0], STATIONS.barn[1], 0x6b3a2a, 2.8);
    // church with steeple
    building(STATIONS.church[0], STATIONS.church[1], 0xd8d0c0, 2.0);
    var steeple = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), new THREE.MeshLambertMaterial({ color: 0xb8b0a0 })); steeple.position.set(STATIONS.church[0], 3.0, STATIONS.church[1]); steeple.rotation.y = Math.PI / 4; scene.add(steeple);
    // field rows
    for (var r = 0; r < 6; r++) box(7, 0.08, 0.5, 0x5a6b35, 0, 0.05, -7 + r * 0.9);
    // trees scattered (seeded)
    var ts = hash(opts.stage ? opts.stage.id : 'x');
    for (var i = 0; i < 9; i++) { var a = (ts >> i) & 7; tree(-10 + ((ts >> (i * 2)) % 20), -9 + ((a * 3 + i * 2) % 16)); }
    // space-coast rockets on the horizon
    if (theme.rockets) {
      [-7, -3].forEach(function (rx) {
        box(0.7, 6, 0.7, 0xf2f2f2, rx, 3, -16);
        var nose = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 12), new THREE.MeshLambertMaterial({ color: 0xd83a2a })); nose.position.set(rx, 6.6, -16); scene.add(nose);
        box(1.2, 5, 0.4, 0x8a8a8a, rx + 1.1, 2.6, -16); // gantry
      });
    }

    /* people */
    var figures = {}; // id -> { group, target:THREE.Vector3, label }
    function makeLabel(text) {
      var cv = document.createElement('canvas'); cv.width = 128; cv.height = 36;
      var g = cv.getContext('2d'); g.font = '600 22px sans-serif'; g.fillStyle = '#2c1810'; g.textAlign = 'center'; g.fillText(text, 64, 26);
      var tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true })); sp.scale.set(2.2, 0.62, 1); sp.position.y = 1.55; return sp;
    }
    function makeFigure(id) {
      var per = (root.CASON_PERSONAS && root.CASON_PERSONAS.byId[id]) || { archetype: 'collateral', name: id };
      var g = new THREE.Group();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 0.72, 6), new THREE.MeshLambertMaterial({ color: archColor(per.archetype) })); body.position.y = 0.36; g.add(body);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshLambertMaterial({ color: 0xe6c39a })); head.position.y = 0.86; g.add(head);
      var hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 6), new THREE.MeshLambertMaterial({ color: 0x3a2a1a })); hat.position.y = 1.0; g.add(hat);
      g.add(makeLabel((per.name || id).split(' ')[0]));
      g.userData.personId = id;
      g.traverse(function (o) { o.userData.personId = id; });
      return g;
    }
    function slot(id, key) {
      var s = STATIONS[key] || STATIONS.square; var h = hash(id);
      return new THREE.Vector3(s[0] + (((h % 7) - 3) * 0.35), 0, s[1] + ((((h >> 3) % 7) - 3) * 0.35));
    }

    var current = opts.snapshot || null;
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

      // sync figures with present cohort
      var present = {};
      (snap.agents || []).forEach(function (a) {
        present[a.id] = true;
        if (!figures[a.id]) { var grp = makeFigure(a.id); scene.add(grp); var st0 = slot(a.id, stationKey(a, archetypeOf(a.id), env)); grp.position.copy(st0); figures[a.id] = { group: grp, target: st0.clone() }; }
        figures[a.id].target = slot(a.id, stationKey(a, archetypeOf(a.id), env));
        figures[a.id].kind = a.kind;
      });
      Object.keys(figures).forEach(function (id) { if (!present[id]) { scene.remove(figures[id].group); disposeObj(figures[id].group); delete figures[id]; } });
    }
    function archetypeOf(id) { return ((root.CASON_PERSONAS && root.CASON_PERSONAS.byId[id]) || {}).archetype; }

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
    function tick() {
      if (disposed) return;
      raf = requestAnimationFrame(tick); clock += 0.016;
      Object.keys(figures).forEach(function (id) {
        var f = figures[id], p = f.group.position, tg = f.target;
        var dx = tg.x - p.x, dz = tg.z - p.z, d = Math.hypot(dx, dz);
        if (d > 0.05) { p.x += dx * 0.03; p.z += dz * 0.03; f.group.position.y = Math.abs(Math.sin(clock * 6 + (hash(id) % 6))) * 0.06; f.group.rotation.y = Math.atan2(dx, dz); }
        else { f.group.position.y = 0; if (f.kind === 'comic') f.group.rotation.y += 0.01; }
      });
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

    return { update: update, dispose: dispose };
  }

  root.CASON_SCENE = { isSupported: isSupported, mount: mount };
})(typeof window !== 'undefined' ? window : this);
