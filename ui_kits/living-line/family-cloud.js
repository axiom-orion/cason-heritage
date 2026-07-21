/* ============================================================
   Family cloud sync  (window.CASON_CLOUD)
   ------------------------------------------------------------
   Lifts the on-device family (CASON_FAMILY) to the account (cason_trees via
   CASON_AUTH), so a signed-in family syncs across devices and every approved
   change persists to the DB, not git. Local-first still holds: signed out,
   everything works on-device; signed in, the cloud is the shared source.

     configured()          -> is there a verified account to sync with?
     push({name,gedcom,tree}) -> save the tree to the account (DB-as-record)
     pull()                -> the account's tree row | null
     pickNewest(local, cloud) -> which copy wins (by timestamp) [pure, tested]

   No-build (window) + Node (module.exports). ASCII; no regex lookbehind.
   ============================================================ */
(function (root) {
  'use strict';

  function AUTH() { return root.CASON_AUTH; }

  function configured() {
    var a = AUTH();
    return !!(a && a.enabled && a.getState && a.getState().verified);
  }
  function push(rec) {
    var a = AUTH();
    return (a && a.saveTree) ? a.saveTree(rec) : Promise.resolve({ ok: false, reason: 'unavailable' });
  }
  function pull() {
    var a = AUTH();
    return (a && a.loadTree) ? a.loadTree() : Promise.resolve(null);
  }

  /* which family to open when both a local save and a cloud tree exist:
     the more recently saved one wins; ties go to the cloud (shared source). */
  function pickNewest(local, cloud) {
    var lt = (local && typeof local.savedAt === 'number') ? local.savedAt : -1;
    var ct = (cloud && cloud.updated_at) ? Date.parse(cloud.updated_at) : -1;
    if (ct >= 0 && ct >= lt) return { source: 'cloud', name: cloud.name, gedcom: cloud.gedcom };
    if (lt >= 0) return { source: 'local', name: local.name, gedcom: local.gedcom };
    if (ct >= 0) return { source: 'cloud', name: cloud.name, gedcom: cloud.gedcom };
    return null;
  }

  var API = { configured: configured, push: push, pull: pull, pickNewest: pickNewest };
  root.CASON_CLOUD = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : globalThis));
