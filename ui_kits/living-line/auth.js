/* ============================================================
   The Living Line — roles & vetting  (window.CASON_AUTH)
   ------------------------------------------------------------
   Two roles:
     • narrator — every guest. Observes the world, asks, researches;
       their notes stay private to their browser. Default.
     • member  — a VETTED living family member. Email magic-link sign-in
       via Supabase; only allowlisted emails (cason_members) become
       members. Members may embody an avatar in the 3-D homestead and
       leave attributed, shared contributions.

   Backend-agnostic: with no Supabase config the module stays in
   narrator mode and offers a clearly-labelled local "member preview"
   (NOT verified) so the experience is demoable for free. Supabase
   loads lazily from a CDN only when configured.
   ============================================================ */
(function (root) {
  'use strict';
  var cfg = root.CASON_SUPABASE || {};
  var enabled = !!(cfg.url && cfg.anonKey);
  var sb = null, sbPromise = null;
  var state = { mode: 'narrator', name: null, email: null, verified: false, preview: false, signedIn: false, enabled: enabled };
  var listeners = [];

  function set(next) { state = Object.assign({ enabled: enabled }, next); listeners.forEach(function (f) { try { f(state); } catch (e) {} }); }
  function narrator(extra) { set(Object.assign({ mode: 'narrator', name: null, verified: false, preview: false }, extra || {})); }

  function loadSb() {
    if (sb) return Promise.resolve(sb);
    if (!enabled) return Promise.reject(new Error('Supabase not configured'));
    if (sbPromise) return sbPromise;
    sbPromise = import('https://esm.sh/@supabase/supabase-js@2').then(function (m) {
      sb = m.createClient(cfg.url, cfg.anonKey);
      sb.auth.onAuthStateChange(function (_e, session) { resolveSession(session); });
      return sb.auth.getSession().then(function (r) { resolveSession(r.data.session); return sb; });
    });
    return sbPromise;
  }

  function resolveSession(session) {
    if (!session || !session.user) { narrator({ signedIn: false }); return; }
    var email = session.user.email;
    sb.from('cason_members').select('display_name,generation,approved').eq('email', email).maybeSingle()
      .then(function (r) {
        if (r.data && r.data.approved) set({ mode: 'member', name: r.data.display_name, generation: r.data.generation, email: email, verified: true, signedIn: true });
        else narrator({ email: email, signedIn: true });
      })
      .catch(function () { narrator({ email: email, signedIn: true }); });
  }

  function onChange(f) { listeners.push(f); try { f(state); } catch (e) {} return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; }

  function signIn(email) {
    return loadSb().then(function () {
      return sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } });
    });
  }
  function signOut() { if (!sb) { narrator(); return Promise.resolve(); } return sb.auth.signOut().then(function () { narrator(); }); }

  // local preview — clearly NOT verified; for demoing the member experience
  function previewMember(name) { set({ mode: 'member', name: name || 'Family (preview)', email: null, verified: false, preview: true, signedIn: false }); }

  function addContribution(rec) {
    if (!(enabled && sb && state.verified)) return Promise.resolve(false);
    return sb.from('cason_contributions').insert({
      person_id: rec.personId, text: rec.text, question: rec.question || null,
      evidence: rec.evidence || 'possible', author_email: state.email, author_name: state.name, source: 'family member',
    }).then(function () { return true; }).catch(function () { return false; });
  }
  function loadContributions() {
    if (!enabled) return Promise.resolve([]);
    return loadSb().then(function () { return sb.from('cason_contributions').select('person_id,text,evidence,author_name'); })
      .then(function (r) { return (r.data || []).map(function (c) { return { personId: c.person_id, text: c.text, evidence: c.evidence || 'possible', source: 'family: ' + c.author_name }; }); })
      .catch(function () { return []; });
  }

  if (enabled) loadSb().catch(function () {});

  root.CASON_AUTH = {
    enabled: enabled,
    getState: function () { return state; },
    onChange: onChange,
    signIn: signIn, signOut: signOut,
    previewMember: previewMember, clearPreview: function () { narrator(); },
    addContribution: addContribution, loadContributions: loadContributions,
  };
})(typeof window !== 'undefined' ? window : this);
