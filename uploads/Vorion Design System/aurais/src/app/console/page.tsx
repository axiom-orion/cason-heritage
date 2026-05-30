// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC
/* eslint-disable react/no-danger */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aurais · console — every bot across every surface',
  description: 'Full-screen SecOps console. Multi-surface scanner (cloud, VMs, k8s, LAN, ports). DoD-style discovery. SIEM-ready.',
};

const PAGE_STYLE = `/* =============================================================================
     /console — full-viewport SecOps console
     Three-pane: sidebar · main · context rail
     ============================================================================= */
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
  body {
    background: #050912; color: #E2E8F0;
    font-family: "Inter", system-ui, sans-serif;
    font-size: 13px; line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; }

  /* App grid */
  .console {
    display: grid;
    grid-template-columns: 240px 1fr 340px;
    grid-template-rows: 44px 1fr;
    height: 100vh;
  }
  .topbar {
    grid-column: 1 / -1;
    display: flex; align-items: center;
    padding: 0 16px;
    background: #050912;
    border-bottom: 1px solid #1E293B;
    gap: 18px;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px; color: #64748B; letter-spacing: 0.06em;
  }
  .topbar .brand {
    display: flex; align-items: center; gap: 8px;
    color: #F1F5F9; font-family: "Inter", sans-serif;
    font-weight: 600; font-size: 13.5px;
    letter-spacing: -0.005em;
    padding-right: 16px; border-right: 1px solid #1E293B;
    height: 100%;
  }
  .topbar .brand .glyph {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: #F59E0B;
    box-shadow: 0 0 8px rgba(245,158,11,0.5);
  }
  .topbar .brand .tag {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; color: #64748B;
    letter-spacing: 0.18em; text-transform: uppercase;
    padding: 1px 6px; border: 1px solid #1E293B; border-radius: 3px;
    margin-left: 6px;
  }
  .topbar .crumb { color: #94A3B8; }
  .topbar .crumb .slash { opacity: 0.4; padding: 0 6px; }
  .topbar .crumb .here { color: #F59E0B; }
  .topbar .right { margin-left: auto; display: flex; align-items: center; gap: 18px; }
  .topbar .pulse {
    display: inline-flex; align-items: center; gap: 8px;
    color: #34D399;
  }
  .topbar .pulse::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: #34D399; box-shadow: 0 0 8px #34D399;
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
  .topbar .user {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 10px;
    border: 1px solid #1E293B; border-radius: 999px;
    color: #94A3B8;
  }
  .topbar .user .avatar {
    width: 18px; height: 18px; border-radius: 50%;
    background: linear-gradient(135deg, #F59E0B, #FB923C);
    font-size: 9px; color: #050912; font-weight: 700;
    display: grid; place-items: center;
  }

  /* ─── SIDEBAR ─────────────────────────────────────────────────── */
  .side {
    background: #050912;
    border-right: 1px solid #1E293B;
    padding: 16px 0;
    overflow-y: auto;
    display: flex; flex-direction: column;
  }
  .side .label {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #475569; padding: 8px 18px 8px;
  }
  .side .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 7px 18px;
    font-size: 13px; color: #94A3B8;
    cursor: pointer;
    position: relative;
  }
  .side .nav-item:hover { color: #F1F5F9; background: rgba(245,158,11,0.05); }
  .side .nav-item.active { color: #F59E0B; background: rgba(245,158,11,0.08); }
  .side .nav-item.active::before {
    content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2px;
    background: #F59E0B;
  }
  .side .nav-item .icon {
    width: 16px; height: 16px; opacity: 0.7;
    stroke: currentColor; fill: none; stroke-width: 1.5;
  }
  .side .nav-item .count {
    margin-left: auto;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; color: #475569; letter-spacing: 0.04em;
    background: #0B1120; padding: 1px 6px; border-radius: 4px;
  }
  .side .nav-item.active .count { color: #F59E0B; background: rgba(245,158,11,0.1); }
  .side .nav-item .count.alert { color: #FB7185; background: rgba(251,113,133,0.1); }

  .side .tenant {
    margin-top: auto;
    padding: 12px 18px;
    border-top: 1px solid #1E293B;
  }
  .side .tenant .name { font-size: 13px; color: #F1F5F9; font-weight: 500; }
  .side .tenant .meta { font-size: 11px; color: #64748B; font-family: "Geist Mono", ui-monospace, monospace; letter-spacing: 0.04em; margin-top: 2px; }
  .side .tenant .switch { font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px; color: #94A3B8; margin-top: 8px; cursor: pointer; }

  /* ─── MAIN PANE ───────────────────────────────────────────────── */
  .main {
    overflow-y: auto;
    background: #050912;
  }
  .main-head {
    padding: 20px 28px 14px;
    border-bottom: 1px solid #1E293B;
    background: #050912;
    position: sticky; top: 0; z-index: 2;
  }
  .main-head h1 {
    font-size: 20px; font-weight: 600; letter-spacing: -0.015em;
    margin: 0 0 4px; color: #F1F5F9;
  }
  .main-head .sub {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px; color: #64748B; letter-spacing: 0.04em;
  }
  .main-head .sub .strong { color: #94A3B8; }

  /* Scan command bar */
  .scan-bar {
    margin-top: 16px;
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .scan-bar .lbl {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; color: #64748B; letter-spacing: 0.12em;
    text-transform: uppercase;
    padding-right: 6px;
  }
  .target {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px 3px 8px;
    background: #050912; border: 1px solid #1E293B;
    border-radius: 4px;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11.5px; color: #E2E8F0;
  }
  .target .kind {
    font-size: 9px; letter-spacing: 0.15em; padding: 1px 5px; border-radius: 2px;
    text-transform: uppercase;
  }
  .target[data-k="lan"] .kind { color: #34D399; background: rgba(52,211,153,0.1); }
  .target[data-k="aws"] .kind { color: #FBBF24; background: rgba(251,191,36,0.1); }
  .target[data-k="gcp"] .kind { color: #93C5FD; background: rgba(147,197,253,0.1); }
  .target[data-k="azure"] .kind { color: #67E8F9; background: rgba(103,232,249,0.1); }
  .target[data-k="k8s"] .kind { color: #A78BFA; background: rgba(167,139,250,0.1); }
  .target[data-k="vm"] .kind { color: #FB923C; background: rgba(251,146,60,0.1); }
  .target[data-k="dev"] .kind { color: #FB7185; background: rgba(251,113,133,0.1); }
  .target .x { color: #475569; cursor: pointer; padding-left: 2px; }
  .target .x:hover { color: #FB7185; }
  .add-target {
    color: #94A3B8; font-size: 11.5px; font-family: "Geist Mono", ui-monospace, monospace;
    padding: 4px 10px; border: 1px dashed #1E293B; border-radius: 4px;
    cursor: pointer;
  }
  .add-target:hover { color: #F59E0B; border-color: #F59E0B; }
  .scan-bar .controls { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .mode-pill {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px; color: #94A3B8;
    padding: 4px 10px; border: 1px solid #1E293B; border-radius: 4px;
    cursor: pointer;
  }
  .mode-pill .v { color: #F59E0B; }
  .scan-btn {
    padding: 6px 14px;
    background: #F59E0B; color: #050912;
    border: 1px solid #F59E0B;
    border-radius: 4px;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer;
  }
  .scan-btn.running {
    background: rgba(245,158,11,0.15); color: #F59E0B;
    border-color: #F59E0B;
  }

  /* Scan progress strip */
  .scan-progress {
    margin-top: 10px;
    display: grid; grid-template-columns: auto 1fr auto;
    gap: 12px; align-items: center;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px; color: #64748B;
  }
  .scan-progress .label { color: #F59E0B; }
  .scan-progress .track {
    height: 4px; background: #0B1120; border-radius: 2px;
    overflow: hidden; position: relative;
  }
  .scan-progress .track > span {
    display: block; height: 100%; width: 67%;
    background: linear-gradient(90deg, #F59E0B, #FBBF24);
  }
  .scan-progress .track::after {
    content: ""; position: absolute; top: 0; bottom: 0;
    left: -40px; width: 80px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: scanwipe 1.6s linear infinite;
  }
  @keyframes scanwipe { to { left: 100%; } }

  /* Tabs */
  .tabs {
    padding: 0 28px;
    background: #050912;
    border-bottom: 1px solid #1E293B;
    display: flex; gap: 0;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px;
  }
  .tab {
    padding: 12px 14px;
    color: #64748B; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; border-bottom: 2px solid transparent;
  }
  .tab:hover { color: #94A3B8; }
  .tab.active { color: #F59E0B; border-bottom-color: #F59E0B; }
  .tab .ct { color: #475569; margin-left: 6px; font-size: 10px; }
  .tab.active .ct { color: #F59E0B; }

  /* Body sections */
  .body { padding: 20px 28px; }

  /* Topology layered view */
  .topo {
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 10px;
    padding: 24px;
  }
  .topo-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 18px;
  }
  .topo-head h3 {
    font-size: 13px; color: #F1F5F9; margin: 0;
    font-family: "Inter", sans-serif; font-weight: 600;
    letter-spacing: -0.005em;
  }
  .topo-head .legend {
    display: flex; gap: 16px;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; color: #64748B; letter-spacing: 0.1em;
  }
  .topo-head .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .topo-head .legend .d { width: 7px; height: 7px; border-radius: 50%; }

  .topo svg { width: 100%; height: 340px; display: block; }

  .topo .surface-label {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px;
    fill: #64748B;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .topo .surface-count { font-size: 10px; fill: #94A3B8; }

  /* Inventory table */
  .inv {
    margin-top: 16px;
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 10px;
    overflow: hidden;
  }
  .inv-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid #1E293B;
  }
  .inv-head h3 {
    font-size: 13px; color: #F1F5F9; margin: 0; font-weight: 600;
  }
  .inv-head .filters {
    display: flex; gap: 6px;
    font-family: "Geist Mono", ui-monospace, monospace; font-size: 10px;
  }
  .inv-head .chip {
    padding: 3px 8px; border: 1px solid #1E293B; border-radius: 4px;
    color: #94A3B8; cursor: pointer; letter-spacing: 0.06em;
  }
  .inv-head .chip.on { color: #F59E0B; border-color: #F59E0B; }
  .inv-head .chip.alert { color: #FB7185; border-color: #FB7185; background: rgba(251,113,133,0.08); }

  table.inv-tab {
    width: 100%; border-collapse: collapse;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11.5px;
  }
  .inv-tab th {
    text-align: left;
    padding: 8px 14px;
    font-size: 10px; color: #475569; letter-spacing: 0.15em;
    text-transform: uppercase; font-weight: 500;
    border-bottom: 1px solid #1E293B;
    background: #050912;
  }
  .inv-tab td {
    padding: 9px 14px;
    border-bottom: 1px solid rgba(30,41,59,0.5);
    color: #CBD5E1;
  }
  .inv-tab tr { cursor: pointer; }
  .inv-tab tr:hover td { background: rgba(245,158,11,0.04); color: #F1F5F9; }
  .inv-tab tr.selected td { background: rgba(245,158,11,0.10); }
  .inv-tab tr.selected td:first-child { border-left: 2px solid #F59E0B; padding-left: 12px; }
  .inv-tab .dot {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    margin-right: 8px; vertical-align: middle;
  }
  .inv-tab .dot.ok { background: #34D399; }
  .inv-tab .dot.warn { background: #FBBF24; }
  .inv-tab .dot.alert { background: #FB7185; box-shadow: 0 0 6px #FB7185; }
  .inv-tab .dot.unk { background: #475569; }
  .inv-tab .name { color: #F1F5F9; font-family: "Inter", sans-serif; font-weight: 500; font-size: 12.5px; }
  .inv-tab .host { color: #94A3B8; }
  .inv-tab .tier {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.04em;
  }
  .inv-tab .tier[data-t="0"] { color: #94A3B8; background: rgba(148,163,184,0.1); }
  .inv-tab .tier[data-t="1"] { color: #FBBF24; background: rgba(251,191,36,0.1); }
  .inv-tab .tier[data-t="2"] { color: #34D399; background: rgba(52,211,153,0.1); }
  .inv-tab .tier[data-t="3"] { color: #60A5FA; background: rgba(96,165,250,0.1); }
  .inv-tab .tier[data-t="4"] { color: #A78BFA; background: rgba(167,139,250,0.1); }
  .inv-tab .tier.unk { color: #FB7185; background: rgba(251,113,133,0.1); }
  .inv-tab .ago { color: #64748B; }

  /* ─── RIGHT RAIL (context panel) ─────────────────────────────── */
  .rail {
    background: #050912;
    border-left: 1px solid #1E293B;
    overflow-y: auto;
    display: flex; flex-direction: column;
  }
  .rail-head {
    padding: 16px 18px 14px;
    border-bottom: 1px solid #1E293B;
  }
  .rail-head .kind {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; letter-spacing: 0.18em; color: #FB7185;
    text-transform: uppercase;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .rail-head .kind::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #FB7185; box-shadow: 0 0 6px #FB7185; }
  .rail-head h2 {
    margin: 8px 0 2px; font-size: 18px; letter-spacing: -0.01em; color: #F1F5F9; font-weight: 600;
  }
  .rail-head .meta {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11px; color: #64748B; letter-spacing: 0.04em;
  }
  .rail-actions {
    padding: 12px 18px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
    border-bottom: 1px solid #1E293B;
  }
  .rail-actions button {
    padding: 8px 10px;
    background: #0B1120; color: #E2E8F0;
    border: 1px solid #1E293B;
    border-radius: 4px;
    font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    font-family: "Geist Mono", ui-monospace, monospace; font-weight: 600;
    cursor: pointer;
  }
  .rail-actions button:hover { border-color: #F59E0B; color: #F59E0B; }
  .rail-actions .danger { background: rgba(251,113,133,0.08); color: #FB7185; border-color: rgba(251,113,133,0.4); }
  .rail-actions .danger:hover { background: rgba(251,113,133,0.18); color: #FB7185; border-color: #FB7185; }
  .rail-actions .primary { background: #F59E0B; color: #050912; border-color: #F59E0B; grid-column: 1 / -1; }
  .rail-actions .primary:hover { background: #FBBF24; color: #050912; }

  .rail-block { padding: 14px 18px; border-bottom: 1px solid #1E293B; }
  .rail-block h4 {
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 10px; letter-spacing: 0.18em; color: #64748B;
    text-transform: uppercase;
    margin: 0 0 10px;
  }
  .kv {
    display: grid; grid-template-columns: 90px 1fr;
    gap: 4px 12px;
    font-family: "Geist Mono", ui-monospace, monospace;
    font-size: 11.5px;
  }
  .kv .k { color: #64748B; }
  .kv .v { color: #E2E8F0; word-break: break-all; }
  .kv .v.warn { color: #FB7185; }
  .kv .v.ok { color: #34D399; }

  .mini-feed { display: grid; gap: 6px; font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; }
  .mini-feed .row {
    display: grid; grid-template-columns: 50px 56px 1fr;
    gap: 8px; align-items: baseline;
  }
  .mini-feed .ts { color: #64748B; }
  .mini-feed .verb.allow { color: #34D399; }
  .mini-feed .verb.deny { color: #FB7185; }
  .mini-feed .verb.attest { color: #F59E0B; }
  .mini-feed .what { color: #CBD5E1; }
  .mini-feed .what .obj { color: #94A3B8; }

  .conn-list { font-family: "Geist Mono", ui-monospace, monospace; font-size: 11px; }
  .conn-list .row {
    display: grid; grid-template-columns: 1fr auto auto;
    gap: 8px; padding: 4px 0;
    border-top: 1px solid rgba(30,41,59,0.5);
  }
  .conn-list .row:first-child { border-top: none; }
  .conn-list .host { color: #E2E8F0; }
  .conn-list .port { color: #64748B; }
  .conn-list .state.active { color: #34D399; }
  .conn-list .state.closed { color: #64748B; }

  /* Scrollbars */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #050912; }
  ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #334155; }`;
const PAGE_HTML  = `<div class="console" data-screen-label="aurais.net/console · scanner view">

  <!-- ───── TOPBAR ──────────────────────────────────────────────── -->
  <div class="topbar">
    <a href="aurais-www.html" class="brand">
      <span class="glyph"></span>
      Aurais
      <span class="tag">console</span>
    </a>
    <div class="crumb">acme-secops<span class="slash">/</span>workspace.prod<span class="slash">/</span><span class="here">scanner</span></div>
    <div class="right">
      <span class="pulse">CHAIN LIVE · 142/s</span>
      <span style="color:#475569;">|</span>
      <span>v 2026.04.18 · build 8842</span>
      <span style="color:#475569;">|</span>
      <a href="#" style="color:#94A3B8;">⌘K</a>
      <div class="user"><span class="avatar">RC</span>r.chen@acme</div>
    </div>
  </div>

  <!-- ───── SIDEBAR ─────────────────────────────────────────────── -->
  <aside class="side">
    <div class="label">// WORKSPACE</div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><path d="M3 12l3-9 6 18 6-18 3 9"/></svg>
      Live feed <span class="count">142/s</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Inventory <span class="count">4,218</span>
    </div>
    <div class="nav-item active">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      Scanner <span class="count">RUNNING</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
      Detections <span class="count alert">3</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Playbooks <span class="count">12</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>
      Attestations <span class="count">2,108</span>
    </div>

    <div class="label" style="margin-top:14px;">// SURFACES</div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      Endpoint hosts <span class="count">312</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg>
      VMs &amp; hypervisors <span class="count">84</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><line x1="3.27" y1="6.96" x2="12" y2="12.01"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      Cloud workloads <span class="count">1,842</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z"/></svg>
      Network ports <span class="count">7,318</span>
    </div>
    <div class="nav-item">
      <svg class="icon" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      Containers · k8s <span class="count">512</span>
    </div>

    <div class="tenant">
      <div class="name">acme-secops</div>
      <div class="meta">8 workspaces · 142 ops</div>
      <div class="switch">▾ switch tenant</div>
    </div>
  </aside>

  <!-- ───── MAIN PANE ───────────────────────────────────────────── -->
  <main class="main">
    <div class="main-head">
      <h1>Scanner — discover agents across the entire attack surface</h1>
      <div class="sub">
        passive + active sweep across <span class="strong">7 surfaces</span>
        · <span class="strong">4,218 agents known</span>
        · <span class="strong">63 new this hour</span>
        · last full sweep <span class="strong">14m ago</span>
      </div>

      <div class="scan-bar">
        <span class="lbl">// TARGETS</span>
        <span class="target" data-k="dev"><span class="kind">device</span>this-host.acme.local<span class="x">×</span></span>
        <span class="target" data-k="lan"><span class="kind">LAN</span>192.168.1.0/24<span class="x">×</span></span>
        <span class="target" data-k="lan"><span class="kind">LAN</span>10.0.0.0/16<span class="x">×</span></span>
        <span class="target" data-k="aws"><span class="kind">AWS</span>prod-us-east-1<span class="x">×</span></span>
        <span class="target" data-k="aws"><span class="kind">AWS</span>prod-eu-west-1<span class="x">×</span></span>
        <span class="target" data-k="gcp"><span class="kind">GCP</span>acme-prod<span class="x">×</span></span>
        <span class="target" data-k="azure"><span class="kind">AZ</span>tenant-04<span class="x">×</span></span>
        <span class="target" data-k="k8s"><span class="kind">K8s</span>prod-cluster<span class="x">×</span></span>
        <span class="target" data-k="k8s"><span class="kind">K8s</span>staging<span class="x">×</span></span>
        <span class="target" data-k="vm"><span class="kind">VM</span>esxi-vault-01<span class="x">×</span></span>
        <span class="add-target">+ add target</span>
        <div class="controls">
          <span class="mode-pill">MODE: <span class="v">STEALTH</span> ▾</span>
          <span class="mode-pill">RATE: <span class="v">120 pps</span> ▾</span>
          <button class="scan-btn running">▶ SCANNING…</button>
        </div>
      </div>

      <div class="scan-progress">
        <span class="label">▸ STEALTH SWEEP</span>
        <span class="track"><span></span></span>
        <span>67% · ETA 1m 14s · 3,142 hosts probed · 84 agents found</span>
      </div>
    </div>

    <div class="tabs">
      <div class="tab active">Topology<span class="ct">7 surfaces</span></div>
      <div class="tab">Inventory<span class="ct">4,218</span></div>
      <div class="tab">Discovered<span class="ct">63 new</span></div>
      <div class="tab">Ports<span class="ct">7,318 open</span></div>
      <div class="tab">History<span class="ct">14d</span></div>
    </div>

    <div class="body">

      <!-- Topology layered view -->
      <div class="topo">
        <div class="topo-head">
          <h3>Layered attack surface · live discovery</h3>
          <div class="legend">
            <span><span class="d" style="background:#34D399"></span> GOVERNED 4,155</span>
            <span><span class="d" style="background:#FBBF24"></span> ENROLLING 47</span>
            <span><span class="d" style="background:#FB7185"></span> UNGOVERNED 13</span>
            <span><span class="d" style="background:#67E8F9"></span> SCANNING…</span>
          </div>
        </div>

        <svg viewBox="0 0 1000 340" xmlns="http://www.w3.org/2000/svg">
          <!-- 5 horizontal lanes for surfaces -->
          <g>
            <!-- Layer 1: Cloud regions -->
            <line x1="20" y1="40" x2="980" y2="40" stroke="#1E293B" stroke-dasharray="2 4" />
            <text x="20" y="34" class="surface-label">CLOUD · 6 ACCOUNTS</text>
            <text x="980" y="34" class="surface-count" text-anchor="end">1,842 workloads</text>

            <!-- Layer 2: VMs / hypervisors -->
            <line x1="20" y1="110" x2="980" y2="110" stroke="#1E293B" stroke-dasharray="2 4" />
            <text x="20" y="104" class="surface-label">VMs · HYPERVISORS</text>
            <text x="980" y="104" class="surface-count" text-anchor="end">84 hosts</text>

            <!-- Layer 3: Kubernetes -->
            <line x1="20" y1="180" x2="980" y2="180" stroke="#1E293B" stroke-dasharray="2 4" />
            <text x="20" y="174" class="surface-label">KUBERNETES · 4 CLUSTERS</text>
            <text x="980" y="174" class="surface-count" text-anchor="end">512 pods</text>

            <!-- Layer 4: LAN endpoints -->
            <line x1="20" y1="250" x2="980" y2="250" stroke="#1E293B" stroke-dasharray="2 4" />
            <text x="20" y="244" class="surface-label">LAN · 2 SUBNETS</text>
            <text x="980" y="244" class="surface-count" text-anchor="end">312 hosts</text>

            <!-- Layer 5: Ports / services -->
            <line x1="20" y1="320" x2="980" y2="320" stroke="#1E293B" stroke-dasharray="2 4" />
            <text x="20" y="314" class="surface-label">OPEN PORTS · BEHAVIORAL FP</text>
            <text x="980" y="314" class="surface-count" text-anchor="end">7,318 ports</text>
          </g>

          <!-- Cloud dots (governed) -->
          <g fill="#34D399">
            <circle cx="60"  cy="60" r="2.5" />
            <circle cx="78"  cy="56" r="2.5" />
            <circle cx="96"  cy="64" r="2.5" />
            <circle cx="118" cy="58" r="2.5" />
            <circle cx="142" cy="62" r="2.5" />
            <circle cx="170" cy="56" r="2.5" />
            <circle cx="194" cy="64" r="2.5" />
            <circle cx="222" cy="60" r="2.5" />
            <circle cx="250" cy="58" r="2.5" />
            <circle cx="276" cy="62" r="2.5" />
            <circle cx="306" cy="56" r="2.5" />
            <circle cx="332" cy="60" r="2.5" />
            <circle cx="358" cy="64" r="2.5" />
            <circle cx="386" cy="58" r="2.5" />
            <circle cx="412" cy="62" r="2.5" />
            <circle cx="440" cy="56" r="2.5" />
            <circle cx="468" cy="60" r="2.5" />
            <circle cx="492" cy="64" r="2.5" />
            <circle cx="522" cy="56" r="2.5" />
            <circle cx="548" cy="60" r="2.5" />
            <circle cx="576" cy="62" r="2.5" />
            <circle cx="604" cy="58" r="2.5" />
            <circle cx="632" cy="64" r="2.5" />
            <circle cx="660" cy="60" r="2.5" />
            <circle cx="688" cy="56" r="2.5" />
            <circle cx="716" cy="62" r="2.5" />
            <circle cx="744" cy="58" r="2.5" />
            <circle cx="772" cy="60" r="2.5" />
            <circle cx="800" cy="64" r="2.5" />
            <circle cx="826" cy="56" r="2.5" />
            <circle cx="854" cy="60" r="2.5" />
            <circle cx="882" cy="58" r="2.5" />
            <circle cx="908" cy="62" r="2.5" />
            <circle cx="936" cy="60" r="2.5" />
            <circle cx="960" cy="56" r="2.5" />
          </g>
          <!-- Cloud — enrolling -->
          <g fill="#FBBF24">
            <circle cx="158" cy="68" r="2.5" />
            <circle cx="372" cy="68" r="2.5" />
            <circle cx="616" cy="68" r="2.5" />
          </g>

          <!-- VM dots -->
          <g fill="#34D399">
            <circle cx="68"  cy="130" r="2.5" />
            <circle cx="110" cy="124" r="2.5" />
            <circle cx="148" cy="128" r="2.5" />
            <circle cx="186" cy="132" r="2.5" />
            <circle cx="232" cy="126" r="2.5" />
            <circle cx="284" cy="130" r="2.5" />
            <circle cx="328" cy="124" r="2.5" />
            <circle cx="378" cy="128" r="2.5" />
            <circle cx="430" cy="126" r="2.5" />
            <circle cx="474" cy="130" r="2.5" />
            <circle cx="522" cy="124" r="2.5" />
            <circle cx="570" cy="128" r="2.5" />
            <circle cx="618" cy="126" r="2.5" />
            <circle cx="666" cy="130" r="2.5" />
            <circle cx="722" cy="124" r="2.5" />
            <circle cx="770" cy="128" r="2.5" />
            <circle cx="820" cy="132" r="2.5" />
            <circle cx="876" cy="126" r="2.5" />
            <circle cx="918" cy="130" r="2.5" />
          </g>
          <g fill="#FB7185">
            <circle cx="408" cy="138" r="3" />
            <circle cx="408" cy="138" r="8" fill="none" stroke="#FB7185" stroke-width="1" opacity="0.5">
              <animate attributeName="r" values="3;14;3" dur="2.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite"/>
            </circle>
            <text x="416" y="142" font-family="ui-monospace,Menlo,monospace" font-size="9" fill="#FB7185">esxi-vault-01 · data-export-helper</text>
          </g>

          <!-- K8s dots -->
          <g fill="#34D399">
            <circle cx="60"  cy="200" r="2.5" />
            <circle cx="92"  cy="196" r="2.5" />
            <circle cx="126" cy="200" r="2.5" />
            <circle cx="166" cy="196" r="2.5" />
            <circle cx="204" cy="200" r="2.5" />
            <circle cx="244" cy="196" r="2.5" />
            <circle cx="284" cy="200" r="2.5" />
            <circle cx="322" cy="196" r="2.5" />
            <circle cx="364" cy="200" r="2.5" />
            <circle cx="404" cy="196" r="2.5" />
            <circle cx="446" cy="200" r="2.5" />
            <circle cx="486" cy="196" r="2.5" />
            <circle cx="528" cy="200" r="2.5" />
            <circle cx="568" cy="196" r="2.5" />
            <circle cx="610" cy="200" r="2.5" />
            <circle cx="650" cy="196" r="2.5" />
            <circle cx="692" cy="200" r="2.5" />
            <circle cx="734" cy="196" r="2.5" />
            <circle cx="774" cy="200" r="2.5" />
            <circle cx="816" cy="196" r="2.5" />
            <circle cx="858" cy="200" r="2.5" />
            <circle cx="898" cy="196" r="2.5" />
            <circle cx="938" cy="200" r="2.5" />
          </g>
          <g fill="#67E8F9">
            <circle cx="180" cy="208" r="3" opacity="0.9">
              <animate attributeName="r" values="2.5;5;2.5" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="430" cy="208" r="3" opacity="0.9">
              <animate attributeName="r" values="2.5;5;2.5" dur="1.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="710" cy="208" r="3" opacity="0.9">
              <animate attributeName="r" values="2.5;5;2.5" dur="1.1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.4;1" dur="1.1s" repeatCount="indefinite"/>
            </circle>
          </g>

          <!-- LAN dots -->
          <g fill="#34D399">
            <circle cx="62"  cy="270" r="2.5" />
            <circle cx="98"  cy="266" r="2.5" />
            <circle cx="138" cy="270" r="2.5" />
            <circle cx="176" cy="266" r="2.5" />
            <circle cx="214" cy="270" r="2.5" />
            <circle cx="250" cy="266" r="2.5" />
            <circle cx="288" cy="270" r="2.5" />
            <circle cx="326" cy="266" r="2.5" />
            <circle cx="362" cy="270" r="2.5" />
            <circle cx="400" cy="266" r="2.5" />
            <circle cx="436" cy="270" r="2.5" />
            <circle cx="472" cy="266" r="2.5" />
            <circle cx="510" cy="270" r="2.5" />
            <circle cx="546" cy="266" r="2.5" />
            <circle cx="582" cy="270" r="2.5" />
            <circle cx="620" cy="266" r="2.5" />
            <circle cx="658" cy="270" r="2.5" />
            <circle cx="694" cy="266" r="2.5" />
            <circle cx="730" cy="270" r="2.5" />
            <circle cx="768" cy="266" r="2.5" />
            <circle cx="804" cy="270" r="2.5" />
            <circle cx="840" cy="266" r="2.5" />
            <circle cx="876" cy="270" r="2.5" />
            <circle cx="916" cy="266" r="2.5" />
            <circle cx="952" cy="270" r="2.5" />
          </g>

          <!-- Ports row (line of activity at bottom) -->
          <g fill="#475569" font-family="ui-monospace,Menlo,monospace" font-size="9">
            <text x="60" y="334">:22</text>
            <text x="110" y="334">:443</text>
            <text x="170" y="334">:5432</text>
            <text x="240" y="334">:6379</text>
            <text x="300" y="334">:8080</text>
            <text x="370" y="334">:9200</text>
            <text x="430" y="334">:11434</text>
            <text x="510" y="334">:3000</text>
            <text x="570" y="334">:4318</text>
            <text x="640" y="334">:50051</text>
            <text x="720" y="334">:7860</text>
            <text x="800" y="334">:8000</text>
            <text x="880" y="334">+ 213 ports</text>
          </g>

          <!-- Connector showing flow from cloud → vm → k8s (just hint) -->
          <g stroke="#1E293B" stroke-width="1" fill="none" opacity="0.5">
            <line x1="408" y1="70" x2="408" y2="135" />
            <line x1="430" y1="140" x2="430" y2="210" />
          </g>

          <!-- Selected highlight ring around chosen agent (esxi-vault-01) -->
          <circle cx="408" cy="138" r="14" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="3 3"/>
        </svg>
      </div>

      <!-- Inventory table -->
      <div class="inv">
        <div class="inv-head">
          <h3>Discovered agents · 63 new in last hour</h3>
          <div class="filters">
            <span class="chip on">ALL</span>
            <span class="chip">CLOUD</span>
            <span class="chip">VM</span>
            <span class="chip">K8S</span>
            <span class="chip">LAN</span>
            <span class="chip alert">UNGOVERNED 13</span>
            <span class="chip">UNATTESTED</span>
          </div>
        </div>
        <table class="inv-tab">
          <thead><tr>
            <th></th>
            <th>name</th>
            <th>surface</th>
            <th>host : port</th>
            <th>service</th>
            <th>tier</th>
            <th>last action</th>
            <th>seen</th>
          </tr></thead>
          <tbody>
          <tr class="selected">
            <td><span class="dot alert"></span></td>
            <td><span class="name">data-export-helper</span></td>
            <td>VM</td>
            <td><span class="host">esxi-vault-01:</span>9211</td>
            <td>cognigate-agent v0.8.1</td>
            <td><span class="tier unk">T0?</span></td>
            <td>db.read(customers) · 14× / 90s</td>
            <td class="ago">14s</td>
          </tr>
          <tr>
            <td><span class="dot warn"></span></td>
            <td><span class="name">unnamed-2af9</span></td>
            <td>K8S</td>
            <td><span class="host">prod-cluster/ns:default:</span>8080</td>
            <td>unknown · fingerprint=ollama</td>
            <td><span class="tier unk">UNK</span></td>
            <td>web.fetch(huggingface.co)</td>
            <td class="ago">38s</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">claude-procurement</span></td>
            <td>AWS</td>
            <td><span class="host">ec2-i-09a2:</span>443</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="4">T4</span></td>
            <td>mail.send(✉ → 12)</td>
            <td class="ago">3s</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">market-scout</span></td>
            <td>AWS</td>
            <td><span class="host">lambda/prod-us-east-1:</span>—</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="3">T3</span></td>
            <td>db.read(orders) ALLOW</td>
            <td class="ago">2s</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">inbox-triage</span></td>
            <td>GCP</td>
            <td><span class="host">cloudrun/triage:</span>—</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="3">T3</span></td>
            <td>mail.send(✉ → 4)</td>
            <td class="ago">11s</td>
          </tr>
          <tr>
            <td><span class="dot warn"></span></td>
            <td><span class="name">code-review</span></td>
            <td>K8S</td>
            <td><span class="host">staging/ns:cr:</span>8443</td>
            <td>cognigate-agent v0.9.2</td>
            <td><span class="tier" data-t="2">T2 → T3</span></td>
            <td>repo.write(pr#142) ALLOW</td>
            <td class="ago">8s</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">research-pal</span></td>
            <td>AZURE</td>
            <td><span class="host">aci-research:</span>443</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="4">T4</span></td>
            <td>web.fetch(scholar.google)</td>
            <td class="ago">22s</td>
          </tr>
          <tr>
            <td><span class="dot alert"></span></td>
            <td><span class="name">unknown-llm-runtime</span></td>
            <td>LAN</td>
            <td><span class="host">192.168.1.74:</span>11434</td>
            <td>ollama · llama3.2:8b</td>
            <td><span class="tier unk">UNGOV</span></td>
            <td>web.fetch(arxiv.org) — no chain</td>
            <td class="ago">42s</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">svc-reconciler</span></td>
            <td>K8S</td>
            <td><span class="host">prod-cluster/finance:</span>50051</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="3">T3</span></td>
            <td>db.write(orders) ALLOW</td>
            <td class="ago">5s</td>
          </tr>
          <tr>
            <td><span class="dot warn"></span></td>
            <td><span class="name">kb-indexer</span></td>
            <td>VM</td>
            <td><span class="host">esxi-search-02:</span>9200</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="2">T2</span></td>
            <td>fs.read(/docs) ALLOW</td>
            <td class="ago">17s</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">on-call-bot</span></td>
            <td>LAN</td>
            <td><span class="host">192.168.1.41:</span>4318</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="3">T3</span></td>
            <td>pagerduty.notify ALLOW</td>
            <td class="ago">1m</td>
          </tr>
          <tr>
            <td><span class="dot alert"></span></td>
            <td><span class="name">shadow-copilot</span></td>
            <td>DEV</td>
            <td><span class="host">this-host:</span>7860</td>
            <td>unknown · gradio fingerprint</td>
            <td><span class="tier unk">UNGOV</span></td>
            <td>fs.read(/home/r.chen/.ssh) ⚠</td>
            <td class="ago">1m</td>
          </tr>
          <tr>
            <td><span class="dot ok"></span></td>
            <td><span class="name">qa-runner</span></td>
            <td>K8S</td>
            <td><span class="host">staging/ns:qa:</span>3000</td>
            <td>cognigate-agent v0.9.4</td>
            <td><span class="tier" data-t="3">T3</span></td>
            <td>shell.exec(npm test) ALLOW</td>
            <td class="ago">2m</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- ───── CONTEXT RAIL ────────────────────────────────────────── -->
  <aside class="rail">
    <div class="rail-head">
      <div class="kind">UNGOVERNED · ATTACK PATH OPEN</div>
      <h2>data-export-helper</h2>
      <div class="meta">first seen <strong style="color:#E2E8F0;">14s ago</strong> · esxi-vault-01:9211</div>
    </div>

    <div class="rail-actions">
      <button class="primary">Quarantine + Enroll in chain</button>
      <button>Inspect process</button>
      <button>View packets</button>
      <button class="danger">⏹ KILL</button>
    </div>

    <div class="rail-block">
      <h4>// IDENTITY (PARTIAL)</h4>
      <div class="kv">
        <span class="k">fingerprint</span><span class="v">cognigate-agent v0.8.1</span>
        <span class="k">cert</span><span class="v warn">none · no AA attestation</span>
        <span class="k">chain</span><span class="v warn">not registered</span>
        <span class="k">declared</span><span class="v warn">no scope manifest</span>
        <span class="k">runtime</span><span class="v">vmware esxi 8.0 · vault-01</span>
        <span class="k">image hash</span><span class="v">sha256:4a2b…f9e1</span>
      </div>
    </div>

    <div class="rail-block">
      <h4>// LAST 5 ACTIONS · NO RECEIPTS</h4>
      <div class="mini-feed">
        <div class="row"><span class="ts">02:14:07</span><span class="verb deny">⚠</span><span class="what">db.read · <span class="obj">customers (1,402 rows)</span></span></div>
        <div class="row"><span class="ts">02:14:01</span><span class="verb deny">⚠</span><span class="what">db.read · <span class="obj">customers (980 rows)</span></span></div>
        <div class="row"><span class="ts">02:13:54</span><span class="verb deny">⚠</span><span class="what">net.out · <span class="obj">api.unknown-bin.io:443</span></span></div>
        <div class="row"><span class="ts">02:13:47</span><span class="verb deny">⚠</span><span class="what">db.read · <span class="obj">customers (842 rows)</span></span></div>
        <div class="row"><span class="ts">02:13:40</span><span class="verb deny">⚠</span><span class="what">process.spawn · <span class="obj">tar -czf /tmp/x.gz</span></span></div>
      </div>
      <div style="margin-top:10px; padding:8px 10px; background: rgba(251,113,133,0.08); border: 1px solid rgba(251,113,133,0.3); border-radius:4px; font-family: 'Geist Mono',monospace; font-size: 11px; color:#FB7185;">
        ▸ pattern matches CVE-2026-3392 staging behaviour
      </div>
    </div>

    <div class="rail-block">
      <h4>// OPEN NETWORK CONNECTIONS · 3</h4>
      <div class="conn-list">
        <div class="row"><span class="host">api.unknown-bin.io</span><span class="port">:443</span><span class="state active">● ACTIVE</span></div>
        <div class="row"><span class="host">10.0.4.18 (postgres-vault)</span><span class="port">:5432</span><span class="state active">● ACTIVE</span></div>
        <div class="row"><span class="host">3.92.184.71 (unknown)</span><span class="port">:8443</span><span class="state active">● ACTIVE</span></div>
      </div>
    </div>

    <div class="rail-block">
      <h4>// SUGGESTED PLAYBOOK</h4>
      <div style="font-family: 'Geist Mono',monospace; font-size: 11.5px; color:#94A3B8; line-height: 1.6;">
        1. quarantine via cognigate (≤4ms)<br>
        2. drop iptables to <span style="color:#FB7185;">api.unknown-bin.io</span><br>
        3. snapshot process tree + memory<br>
        4. enroll in chain w/ scope = none<br>
        5. notify <span style="color:#F59E0B;">data-platform-team</span>
      </div>
      <button style="margin-top: 12px; width: 100%; padding: 8px; background: rgba(245,158,11,0.1); color: #F59E0B; border: 1px solid #F59E0B; border-radius: 4px; font-family: 'Geist Mono',monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; cursor: pointer;">▶ Run playbook · 11s</button>
    </div>
  </aside>

</div>`;
const PAGE_SCRIPT = `/* lightweight: clicking inventory rows updates the selected highlight */
  document.querySelectorAll('.inv-tab tbody tr').forEach(tr => {
    tr.addEventListener('click', () => {
      document.querySelectorAll('.inv-tab tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
    });
  });`;

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: PAGE_HTML }} />
      <script dangerouslySetInnerHTML={{ __html: PAGE_SCRIPT }} />
    </>
  );
}
