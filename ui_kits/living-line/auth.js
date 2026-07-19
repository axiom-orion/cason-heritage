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
    sb.from('cason_members').select('display_name,generation,approved,tier').eq('email', email).maybeSingle()
      .then(function (r) {
        if (r.data && r.data.approved) set({ mode: 'member', name: r.data.display_name, generation: r.data.generation, tier: r.data.tier || 'outer', email: email, verified: true, signedIn: true });
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

  // ---- Proof surface: artifacts (pics, letters, records) in Supabase Storage ----
  function artifactUrl(path) { return cfg.url ? (cfg.url.replace(/\/$/, '') + '/storage/v1/object/public/proof/' + path) : ''; }
  var ART_COLS = 'id,person_id,title,kind,storage_path,evidence,note,visibility,author_name,created_at';
  function shapeArtifacts(r) {
    // include persona-documents-shaped fields (personId/date/source) so a dated,
    // person-attached Proof artifact can fold into horizon-bounded persona memory.
    return (r && r.data || []).map(function (a) {
      return Object.assign({}, a, {
        url: artifactUrl(a.storage_path),
        personId: a.person_id, date: a.doc_date || null,
        source: 'Proof: ' + (a.author_name || 'family archive'),
      });
    });
  }
  function loadArtifacts() {
    if (!enabled) return Promise.resolve([]);
    // Try with doc_date; if the column isn't there yet (migration not run), the
    // query errors — fall back to the base columns so the Proof surface never
    // goes dark. Deploy order and migration order are thus independent.
    return loadSb().then(function () {
      return sb.from('cason_artifacts').select(ART_COLS + ',doc_date').order('created_at', { ascending: false });
    }).then(function (r) {
      if (r && r.error) throw r.error;
      return shapeArtifacts(r);
    }).catch(function () {
      return sb.from('cason_artifacts').select(ART_COLS).order('created_at', { ascending: false })
        .then(shapeArtifacts).catch(function () { return []; });
    });
  }
  function uploadArtifact(file, meta) {
    meta = meta || {};
    if (!(enabled && state.verified)) return Promise.reject(new Error('Sign in as a verified family member to add to the Proof.'));
    return loadSb().then(function () {
      var safe = String(file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
      var path = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '-' + safe;
      return sb.storage.from('proof').upload(path, file, { upsert: false }).then(function (up) {
        if (up.error) throw up.error;
        var row = {
          person_id: meta.personId || null, title: meta.title, kind: meta.kind || 'document',
          storage_path: path, evidence: meta.evidence || 'possible', note: meta.note || null,
          doc_date: meta.docDate || meta.date || null,
          visibility: meta.visibility || 'public', author_email: state.email, author_name: state.name,
        };
        // Insert with doc_date; if the column isn't there yet (migration not run),
        // retry without it so uploads never fail on account of the new field. The
        // date is simply dropped until the one-line migration is applied.
        return sb.from('cason_artifacts').insert(row).then(function (ins) {
          if (!ins.error) return ins;
          var bare = Object.assign({}, row); delete bare.doc_date;
          return sb.from('cason_artifacts').insert(bare);
        });
      }).then(function (ins) { if (ins.error) throw ins.error; return { ok: true, url: artifactUrl(path) }; });
    });
  }

  // ---- Contestation & Appeal: an auditable challenge ledger ----
  // Any guest can read the ledger; only a verified family member may file an
  // appeal (as themselves) or adjudicate one. The record — and its resolution —
  // is public, so a tier or quarantine decision can always be contested in the open.
  function loadAppeals() {
    if (!enabled) return Promise.resolve([]);
    return loadSb().then(function () {
      return sb.from('cason_appeals').select('id,target_type,target_id,target_label,challenge,evidence,status,submitter_name,resolver_name,resolution_note,created_at,resolved_at').order('created_at', { ascending: false });
    }).then(function (r) { return r.data || []; }).catch(function () { return []; });
  }
  function fileAppeal(rec) {
    rec = rec || {};
    if (!(enabled && state.verified)) return Promise.reject(new Error('Sign in as a verified family member to file an appeal.'));
    return loadSb().then(function () {
      return sb.from('cason_appeals').insert({
        target_type: rec.targetType || 'tier', target_id: rec.targetId, target_label: rec.targetLabel || null,
        challenge: rec.challenge, evidence: rec.evidence || null,
        submitter_email: state.email, submitter_name: state.name,
      }).select().single();
    }).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function resolveAppeal(id, status, note) {
    if (!(enabled && state.verified)) return Promise.reject(new Error('Sign in as a verified family member to adjudicate.'));
    return loadSb().then(function () {
      return sb.from('cason_appeals').update({
        status: status, resolution_note: note || null, resolver_name: state.name,
        resolved_at: status === 'under_review' ? null : new Date().toISOString(),
      }).eq('id', id).select().single();
    }).then(function (r) { if (r.error) throw r.error; return r.data; });
  }

  // ---- In-app approval queue: agent/member proposals to the record ----
  // Public to read (transparency); a verified member may file a proposal (as
  // themselves) or decide one. Approving promotes it into a contribution.
  function loadProposals() {
    if (!enabled) return Promise.resolve([]);
    return loadSb().then(function () {
      return sb.from('cason_proposals').select('id,person_id,kind,summary,evidence,source,justification,origin,status,final_evidence,submitter_name,reviewer_name,decision_note,created_at,decided_at').order('created_at', { ascending: false });
    }).then(function (r) { return r.data || []; }).catch(function () { return []; });
  }
  function submitProposal(rec) {
    rec = rec || {};
    if (!(enabled && state.verified)) return Promise.reject(new Error('Sign in as a verified family member to propose to the record.'));
    return loadSb().then(function () {
      return sb.from('cason_proposals').insert({
        person_id: rec.personId || null, kind: rec.kind || 'write_record', summary: rec.summary,
        evidence: rec.evidence || 'possible', source: rec.source || null, justification: rec.justification || null,
        origin: rec.origin || 'consensus', submitter_email: state.email, submitter_name: state.name,
      }).select().single();
    }).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function decideProposal(id, status, note, finalTier) {
    if (!(enabled && state.verified)) return Promise.reject(new Error('Sign in as a verified family member to decide a proposal.'));
    return loadSb().then(function () {
      return sb.from('cason_proposals').update({
        status: status, decision_note: note || null, reviewer_name: state.name,
        final_evidence: finalTier || null, decided_at: status === 'pending' ? null : new Date().toISOString(),
      }).eq('id', id).select().single();
    }).then(function (r) { if (r.error) throw r.error; return r.data; });
  }

  // ---- Hard tier gate: the signed-in member's granted tier + the private,
  // RLS-protected story content they are allowed to see. Content above the
  // caller's tier never leaves Supabase (enforced by the policy, not the client). ----
  function myTier() { return (state.mode === 'member' && state.verified && state.tier) ? state.tier : 'outsider'; }
  function fetchPrivate() {
    if (!enabled) return Promise.resolve([]);
    return loadSb().then(function () {
      return sb.from('cason_private').select('id,person_id,label,body,min_tier').order('created_at', { ascending: true });
    }).then(function (r) { return r.data || []; }).catch(function () { return []; });
  }

  if (enabled) loadSb().catch(function () {});

  root.CASON_AUTH = {
    enabled: enabled,
    getState: function () { return state; },
    onChange: onChange,
    myTier: myTier, fetchPrivate: fetchPrivate,
    signIn: signIn, signOut: signOut,
    previewMember: previewMember, clearPreview: function () { narrator(); },
    addContribution: addContribution, loadContributions: loadContributions,
    loadArtifacts: loadArtifacts, uploadArtifact: uploadArtifact, artifactUrl: artifactUrl,
    loadAppeals: loadAppeals, fileAppeal: fileAppeal, resolveAppeal: resolveAppeal,
    loadProposals: loadProposals, submitProposal: submitProposal, decideProposal: decideProposal,
  };
})(typeof window !== 'undefined' ? window : this);
