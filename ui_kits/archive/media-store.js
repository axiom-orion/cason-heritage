/* ============================================================
   The Cason Archive — media & document store  (window.CASON_MEDIA)
   ------------------------------------------------------------
   Where the family loads pictures and documents. Each item is filed
   under a CATEGORY (photograph, deed, census, will, ...) and, when
   known, attached to a PERSON in the record and a DATE — so a scan of
   Thadeous's 1945 probate, or a portrait of Cordelia, lands in the
   right compartment and next to the right ancestor.

   Storage is IndexedDB (holds far more than localStorage, works
   offline, stays on this device) with an in-memory fallback for Node
   and for browsers where IndexedDB is unavailable. Nothing is uploaded
   anywhere; an Export writes a single JSON backup you control.

   PRIVACY: everything here is local to the device until you choose to
   export it. No credentials, no network.

   No-build (window) + Node (module.exports). No regex lookbehind
   (iOS Safari < 16.4). ASCII source.
   ============================================================ */
(function (root) {
  'use strict';

  var DB_NAME = 'cason-archive';
  var STORE = 'items';
  var DB_VERSION = 1;
  var MAX_BYTES = 8 * 1024 * 1024;   // 8 MB per item (data-URL inflates ~33%)

  var CATEGORIES = [
    { key: 'photo', label: 'Photograph' },
    { key: 'portrait', label: 'Portrait' },
    { key: 'document', label: 'Document' },
    { key: 'deed', label: 'Deed / Land' },
    { key: 'census', label: 'Census' },
    { key: 'will', label: 'Will / Probate' },
    { key: 'certificate', label: 'Certificate (birth / death / marriage)' },
    { key: 'letter', label: 'Letter' },
    { key: 'newspaper', label: 'Newspaper' },
    { key: 'other', label: 'Other' },
  ];
  var CAT_KEYS = CATEGORIES.map(function (c) { return c.key; });

  function catLabel(key) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === key) return CATEGORIES[i].label;
    return key;
  }

  /* ---- validation (pure) ---- */
  function validateMeta(m, people) {
    var errors = [];
    m = m || {};
    if (!m.title || !String(m.title).trim()) errors.push('A title is required.');
    if (!m.kind || CAT_KEYS.indexOf(m.kind) === -1) errors.push('Choose a category.');
    if (m.personId && people && !people[m.personId]) errors.push('Attached person is not in the record.');
    if (m.size != null && m.size > MAX_BYTES) errors.push('File is larger than ' + Math.round(MAX_BYTES / (1024 * 1024)) + ' MB.');
    if (m.date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(m.date))) errors.push('Date should be a year, or YYYY-MM / YYYY-MM-DD.');
    return { ok: errors.length === 0, errors: errors };
  }

  function newId() {
    // time-ordered, human-unique-enough; no crypto/random needed for a local store
    var t = (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0;
    newId._n = (newId._n || 0) + 1;
    return 'm' + t.toString(36) + '-' + newId._n.toString(36);
  }

  /* normalize a raw item into the stored shape */
  function normalize(meta, dataUrl) {
    meta = meta || {};
    return {
      id: meta.id || newId(),
      kind: meta.kind || 'other',
      title: String(meta.title || '').trim(),
      personId: meta.personId || null,
      date: meta.date ? String(meta.date).trim() : '',
      note: meta.note ? String(meta.note).trim() : '',
      source: meta.source ? String(meta.source).trim() : '',
      mime: meta.mime || '',
      name: meta.name || '',
      size: meta.size || 0,
      createdAt: meta.createdAt || ((typeof Date !== 'undefined' && Date.now) ? Date.now() : 0),
      dataUrl: dataUrl || meta.dataUrl || '',
    };
  }

  /* ---- indexing (pure) — join items with the record for compartments ---- */
  function index(items, data) {
    var people = (data && data.people) || {};
    var byKind = {}, byPerson = {}, byGen = {}, totalBytes = 0;
    CAT_KEYS.forEach(function (k) { byKind[k] = 0; });
    (items || []).forEach(function (it) {
      byKind[it.kind] = (byKind[it.kind] || 0) + 1;
      totalBytes += it.size || 0;
      if (it.personId) {
        (byPerson[it.personId] = byPerson[it.personId] || []).push(it.id);
        var p = people[it.personId];
        if (p && typeof p.generation === 'number') byGen[p.generation] = (byGen[p.generation] || 0) + 1;
      }
    });
    return {
      count: (items || []).length,
      byKind: byKind,
      byPerson: byPerson,
      byGeneration: byGen,
      peopleWithMedia: Object.keys(byPerson).length,
      totalBytes: totalBytes,
    };
  }

  /* ============================================================
     Storage backend: IndexedDB, or in-memory fallback.
     All methods return Promises so the UI is backend-agnostic.
     ============================================================ */
  function memBackend() {
    var mem = {};
    return {
      kind: 'memory',
      ready: function () { return Promise.resolve(); },
      put: function (item) { mem[item.id] = item; return Promise.resolve(item); },
      all: function () { return Promise.resolve(Object.keys(mem).map(function (k) { return mem[k]; })); },
      get: function (id) { return Promise.resolve(mem[id] || null); },
      remove: function (id) { delete mem[id]; return Promise.resolve(); },
      clear: function () { mem = {}; return Promise.resolve(); },
    };
  }

  function idbBackend(idb) {
    var dbP = null;
    function open() {
      if (dbP) return dbP;
      dbP = new Promise(function (resolve, reject) {
        var req = idb.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function () {
          var db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
      return dbP;
    }
    function tx(mode, fn) {
      return open().then(function (db) {
        return new Promise(function (resolve, reject) {
          var t = db.transaction(STORE, mode);
          var store = t.objectStore(STORE);
          var out = fn(store);
          t.oncomplete = function () { resolve(out && out.__result !== undefined ? out.__result : out); };
          t.onerror = function () { reject(t.error); };
          t.onabort = function () { reject(t.error); };
        });
      });
    }
    return {
      kind: 'indexeddb',
      ready: function () { return open().then(function () {}); },
      put: function (item) { return tx('readwrite', function (s) { s.put(item); return item; }); },
      all: function () {
        return open().then(function (db) {
          return new Promise(function (resolve, reject) {
            var t = db.transaction(STORE, 'readonly');
            var req = t.objectStore(STORE).getAll();
            req.onsuccess = function () { resolve(req.result || []); };
            req.onerror = function () { reject(req.error); };
          });
        });
      },
      get: function (id) {
        return open().then(function (db) {
          return new Promise(function (resolve, reject) {
            var req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
            req.onsuccess = function () { resolve(req.result || null); };
            req.onerror = function () { reject(req.error); };
          });
        });
      },
      remove: function (id) { return tx('readwrite', function (s) { s.delete(id); }); },
      clear: function () { return tx('readwrite', function (s) { s.clear(); }); },
    };
  }

  function makeBackend() {
    try {
      var idb = (typeof indexedDB !== 'undefined') ? indexedDB : (root && root.indexedDB);
      if (idb) return idbBackend(idb);
    } catch (e) { /* fall through */ }
    return memBackend();
  }

  var backend = makeBackend();

  /* ---- public API ---- */
  var API = {
    CATEGORIES: CATEGORIES,
    CAT_KEYS: CAT_KEYS,
    MAX_BYTES: MAX_BYTES,
    catLabel: catLabel,
    validateMeta: validateMeta,
    index: index,
    normalize: normalize,
    backendKind: function () { return backend.kind; },

    ready: function () { return backend.ready(); },

    // add(meta, dataUrl) — dataUrl comes from a FileReader in the UI
    add: function (meta, dataUrl, people) {
      var v = validateMeta(meta, people);
      if (!v.ok) return Promise.reject(new Error(v.errors.join(' ')));
      var item = normalize(meta, dataUrl);
      return backend.put(item).then(function () { return item; });
    },
    update: function (item) { return backend.put(normalize(item, item.dataUrl)); },
    all: function () { return backend.all(); },
    get: function (id) { return backend.get(id); },
    remove: function (id) { return backend.remove(id); },
    clear: function () { return backend.clear(); },

    // backup you control — a single JSON with the data URLs inlined
    exportAll: function () {
      return backend.all().then(function (items) {
        return { app: 'cason-archive', version: 1, exportedAt: (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0, items: items };
      });
    },
    importAll: function (obj) {
      var items = (obj && obj.items) || [];
      return Promise.all(items.map(function (it) { return backend.put(normalize(it, it.dataUrl)); })).then(function () { return items.length; });
    },
  };

  root.CASON_MEDIA = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
