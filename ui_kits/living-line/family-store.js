/* ============================================================
   Family store  (window.CASON_FAMILY)
   ------------------------------------------------------------
   Persistence, local-first. Saves the imported family (its source GEDCOM +
   a name) in this browser so a visitor comes back to their ancestors
   instead of re-importing. It never leaves the device -- the same trust
   story as the import, now extended between visits. Account sync (Supabase,
   cross-device, shared family) is the next increment and reads the same shape.

     save(name, gedcomText) -> { ok, reason? }   ('too-large' if over quota)
     load()  -> { name, gedcom, savedAt } | null
     has()   -> boolean
     clear()

   We store the source GEDCOM (small, canonical) and re-derive the graph on
   load, rather than the expanded graph. No-build (window) + Node
   (module.exports). ASCII; no regex lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  var KEY = 'cason-family-v1';
  function ls() { return root.localStorage; }

  function save(name, gedcom) {
    try {
      ls().setItem(KEY, JSON.stringify({ name: String(name || 'Your family'), gedcom: String(gedcom || ''), savedAt: Date.now() }));
      return { ok: true };
    } catch (e) {
      var q = e && (e.name === 'QuotaExceededError' || /quota/i.test(String(e.name || e.message || '')));
      return { ok: false, reason: q ? 'too-large' : 'unavailable' };
    }
  }
  function load() {
    try { var raw = ls().getItem(KEY); if (!raw) return null; var o = JSON.parse(raw); return (o && o.gedcom) ? o : null; }
    catch (e) { return null; }
  }
  function clear() { try { ls().removeItem(KEY); } catch (e) {} }
  function has() { return !!load(); }

  var API = { save: save, load: load, clear: clear, has: has, KEY: KEY };
  root.CASON_FAMILY = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
