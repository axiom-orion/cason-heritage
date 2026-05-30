// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC
/* eslint-disable react/no-danger, @next/next/no-css-tags */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AgentAnchor · public registry — verify any tier in two clicks',
  description: 'Read-only mirror of every certified agent under AgentAnchor. No account, no rate limit, free forever. 14,832 agents · 38 vendors.',
};

const PAGE_STYLE = `/* =============================================================================
     /registry — public, free, read-only mirror of every certified agent
     ============================================================================= */

  .crumb { font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); letter-spacing: 0.06em; padding: 0 16px; }
  .crumb .here { color: var(--site-accent); }

  /* HERO STRIP */
  .reg-hero { padding: 56px 0 24px; }
  .reg-hero .row { display: grid; grid-template-columns: 1.1fr auto; gap: 32px; align-items: end; }
  .reg-hero .kicker {
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--site-accent);
    display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px;
  }
  .reg-hero .kicker::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: var(--site-accent); box-shadow: 0 0 8px var(--site-accent);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .reg-hero h1 {
    font-size: clamp(36px, 4.5vw, 52px); line-height: 1.05;
    letter-spacing: -0.025em; font-weight: 700;
    margin: 0 0 10px; max-width: 22ch; text-wrap: balance;
  }
  .reg-hero h1 .accent { color: var(--site-accent); }
  .reg-hero p.lede { font-size: 17px; color: var(--fg-muted); max-width: 56ch; margin: 0; line-height: 1.5; }

  .reg-stats {
    display: grid; grid-template-columns: auto auto auto auto; gap: 4px 28px;
    text-align: right;
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--fg-muted);
  }
  .reg-stats strong { color: var(--fg); font-weight: 600; font-size: 16px; letter-spacing: -0.01em; }
  .reg-stats .live::before {
    content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: #10B981; margin-right: 6px; box-shadow: 0 0 8px #10B981;
    vertical-align: 1px; animation: pulse 1.4s ease-in-out infinite;
  }

  /* SEARCH BAR */
  .search-block {
    margin-top: 24px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px;
  }
  .search-bar {
    display: grid; grid-template-columns: 24px 1fr auto;
    gap: 12px; align-items: center;
    padding: 10px 14px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .search-bar svg { stroke: var(--fg-muted); fill: none; stroke-width: 1.7; width: 18px; height: 18px; }
  .search-bar input {
    border: none; background: transparent; outline: none;
    font-family: var(--font-mono); font-size: 14px; color: var(--fg);
    width: 100%;
  }
  .search-bar .kbd {
    font-family: var(--font-mono); font-size: 10px; color: var(--fg-muted);
    padding: 3px 6px; border: 1px solid var(--border); border-radius: 4px;
    letter-spacing: 0.06em;
  }

  /* FILTER CHIPS */
  .filters {
    margin-top: 12px;
    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
  }
  .filt-label {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--fg-muted);
    margin-right: 4px;
  }
  .chip {
    padding: 4px 10px;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 4px;
    font-family: var(--font-mono); font-size: 11px; color: var(--fg);
    cursor: pointer; transition: all 140ms;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .chip:hover { border-color: var(--site-accent); color: var(--site-accent); }
  .chip.on { border-color: var(--site-accent); background: var(--site-accent-soft); color: var(--site-accent-dim); font-weight: 600; }
  .chip .ct { color: var(--fg-muted); font-size: 10px; }
  .chip.on .ct { color: var(--site-accent); }
  .chip .dot { width: 6px; height: 6px; border-radius: 50%; }
  .chip[data-t="0"] .dot { background: #94A3B8; }
  .chip[data-t="1"] .dot { background: #FBBF24; }
  .chip[data-t="2"] .dot { background: #34D399; }
  .chip[data-t="3"] .dot { background: #60A5FA; }
  .chip[data-t="4"] .dot { background: #A78BFA; }
  .chip[data-t="5"] .dot { background: #F472B6; }
  .chip[data-t="6"] .dot { background: #FB923C; }
  .chip[data-t="7"] .dot { background: #F43F5E; }

  /* RESULTS LAYOUT */
  .reg-body {
    display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px;
    padding-bottom: 56px;
  }
  .panel {
    background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
    overflow: hidden; display: flex; flex-direction: column;
  }
  .panel-h {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-alt);
  }
  .panel-h h3 { margin: 0; font-size: 13px; letter-spacing: -0.005em; font-weight: 600; }
  .panel-h .meta { font-family: var(--font-mono); font-size: 10px; color: var(--fg-muted); letter-spacing: 0.1em; }
  .panel-h .meta strong { color: var(--site-accent); }

  /* RESULT TABLE */
  table.reg-tab {
    width: 100%; border-collapse: collapse;
    font-family: var(--font-mono); font-size: 11.5px;
  }
  .reg-tab th {
    text-align: left;
    padding: 9px 14px;
    font-size: 10px; color: var(--fg-muted); letter-spacing: 0.16em;
    text-transform: uppercase; font-weight: 500;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky; top: 0;
  }
  .reg-tab td {
    padding: 10px 14px;
    border-bottom: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
    color: var(--fg-subtle);
  }
  .reg-tab tr { cursor: pointer; }
  .reg-tab tr:hover td { background: var(--site-accent-soft); color: var(--fg); }
  .reg-tab tr.selected td { background: var(--site-accent-soft); }
  .reg-tab tr.selected td:first-child { box-shadow: inset 3px 0 0 var(--site-accent); padding-left: 11px; }
  .reg-tab .name {
    color: var(--fg); font-family: var(--font-body); font-weight: 500; font-size: 12.5px;
    display: block;
  }
  .reg-tab .name .id {
    font-family: var(--font-mono); font-size: 10px; color: var(--fg-muted); font-weight: 400;
    margin-left: 6px; letter-spacing: 0.04em;
  }
  .reg-tab .vendor { color: var(--fg); }
  .reg-tab .vendor .vlogo {
    display: inline-block; width: 14px; height: 14px; border-radius: 3px;
    background: var(--vc, var(--neutral-300));
    color: white; text-align: center;
    font-size: 9px; line-height: 14px; font-weight: 700;
    margin-right: 6px; vertical-align: -2px;
  }
  .reg-tab .tier-cell {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 2px 8px; border-radius: 4px;
    font-weight: 700; letter-spacing: 0.06em; font-size: 11px;
  }
  .reg-tab .tier-cell[data-t="2"] { color: #047857; background: #DCFCE7; }
  .reg-tab .tier-cell[data-t="3"] { color: #1D4ED8; background: #DBEAFE; }
  .reg-tab .tier-cell[data-t="4"] { color: #6D28D9; background: #EDE9FE; }
  .reg-tab .tier-cell[data-t="5"] { color: #BE185D; background: #FCE7F3; }
  .reg-tab .tier-cell[data-t="6"] { color: #C2410C; background: #FFEDD5; }
  .reg-tab .tier-cell[data-t="7"] { color: #9F1239; background: #FFE4E6; }
  .reg-tab .ago { color: var(--fg-muted); }
  .reg-tab .auditor { color: var(--fg-muted); font-size: 11px; }
  .reg-tab .auditor strong { color: var(--fg-subtle); font-weight: 600; }
  .reg-tab .jur { font-size: 10px; color: var(--fg-muted); letter-spacing: 0.08em; }

  /* PAGINATION FOOTER */
  .pager {
    padding: 12px 18px; border-top: 1px solid var(--border); background: var(--bg-alt);
    display: flex; justify-content: space-between; align-items: center;
    font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); letter-spacing: 0.04em;
  }
  .pager .pages { display: flex; gap: 4px; }
  .pager .pages span {
    padding: 3px 8px; border: 1px solid var(--border); border-radius: 4px; cursor: pointer; color: var(--fg-subtle);
  }
  .pager .pages span.on { background: var(--site-accent); border-color: var(--site-accent); color: white; }

  /* RIGHT PANEL — agent detail */
  .agent-detail { padding: 0; flex: 1; overflow-y: auto; }
  .ad-head {
    padding: 22px 22px 18px;
    border-bottom: 1px solid var(--border);
  }
  .ad-head .kicker {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--site-accent);
  }
  .ad-head h2 {
    font-size: 22px; letter-spacing: -0.015em; margin: 8px 0 4px; font-weight: 700;
  }
  .ad-head .id {
    font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); word-break: break-all;
  }
  .ad-head .row {
    margin-top: 14px;
    display: grid; grid-template-columns: auto auto auto; gap: 10px 22px;
    font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); letter-spacing: 0.06em;
  }
  .ad-head .row strong { color: var(--fg); font-size: 13px; font-weight: 600; display: block; letter-spacing: 0; font-family: var(--font-body); margin-top: 2px; }
  .ad-head .actions {
    margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;
  }
  .ad-head .actions button {
    padding: 6px 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 4px;
    font-family: var(--font-mono); font-size: 11px; color: var(--fg); letter-spacing: 0.06em;
    cursor: pointer; font-weight: 500;
  }
  .ad-head .actions button:hover { border-color: var(--site-accent); color: var(--site-accent); }
  .ad-head .actions .primary { background: var(--site-accent); color: white; border-color: var(--site-accent); }
  .ad-head .actions .primary:hover { background: var(--site-accent-dim); border-color: var(--site-accent-dim); color: white; }

  .ad-section { padding: 18px 22px; border-bottom: 1px solid var(--border); }
  .ad-section:last-child { border-bottom: none; }
  .ad-section h4 {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--fg-muted); margin: 0 0 12px; font-weight: 500;
  }

  /* Attestation timeline */
  .timeline { display: grid; gap: 12px; }
  .tl-row {
    display: grid; grid-template-columns: 80px 18px 1fr;
    gap: 12px; align-items: start;
    position: relative;
  }
  .tl-row .date {
    font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); letter-spacing: 0.05em;
    padding-top: 2px;
  }
  .tl-row .dot {
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid var(--site-accent); background: var(--bg);
    margin-top: 4px;
    z-index: 1; position: relative;
  }
  .tl-row .dot.tier { background: var(--site-accent); }
  .tl-row::before {
    content: ""; position: absolute;
    left: 89px; top: 14px; bottom: -16px; width: 2px;
    background: var(--border);
  }
  .tl-row:last-child::before { display: none; }
  .tl-row .body strong { display: block; color: var(--fg); font-size: 13px; font-weight: 600; letter-spacing: -0.005em; }
  .tl-row .body p { color: var(--fg-muted); font-size: 12px; margin: 4px 0 0; line-height: 1.5; }
  .tl-row .body .badge {
    display: inline-block; margin-top: 6px;
    font-family: var(--font-mono); font-size: 9.5px;
    color: var(--site-accent); padding: 2px 6px;
    border: 1px solid var(--site-accent); border-radius: 3px;
    letter-spacing: 0.08em; font-weight: 600;
  }

  /* Capability list */
  .caps { display: grid; gap: 6px; font-family: var(--font-mono); font-size: 11.5px; }
  .caps .cap {
    display: grid; grid-template-columns: 24px 1fr auto;
    padding: 6px 10px; background: var(--bg-alt); border-radius: 6px;
    align-items: center;
  }
  .caps .cap .v { color: var(--fg); }
  .caps .cap .v small { color: var(--fg-muted); margin-left: 6px; }
  .caps .cap .meta { color: var(--fg-muted); font-size: 10px; letter-spacing: 0.04em; }
  .caps .cap .icon { color: #047857; }

  /* Conformance grid */
  .conf {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    font-family: var(--font-mono); font-size: 10.5px;
  }
  .conf .cell {
    padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .conf .name { color: var(--fg); letter-spacing: 0.04em; }
  .conf .val.pass { color: #047857; font-weight: 700; }
  .conf .val.partial { color: #B45309; font-weight: 700; }
  .conf .val.na { color: var(--fg-muted); font-weight: 500; }

  /* BOTTOM SECTION */
  .footer-stats {
    margin-top: 40px;
    border-top: 1px solid var(--border);
    padding-top: 56px;
    padding-bottom: 64px;
  }
  .stats-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 20px; }

  .dist-card {
    background: var(--bg); border: 1px solid var(--border); border-radius: 12px;
    padding: 24px;
  }
  .dist-row {
    display: grid; grid-template-columns: 80px 1fr 70px;
    gap: 12px; align-items: center;
    padding: 8px 0; border-top: 1px solid var(--border);
  }
  .dist-row:first-of-type { border-top: none; }
  .dist-row .label {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-mono); font-size: 11px; color: var(--fg);
  }
  .dist-row .label .d { width: 8px; height: 8px; border-radius: 50%; }
  .dist-row[data-t="2"] .d { background: #34D399; }
  .dist-row[data-t="3"] .d { background: #60A5FA; }
  .dist-row[data-t="4"] .d { background: #A78BFA; }
  .dist-row[data-t="5"] .d { background: #F472B6; }
  .dist-row[data-t="6"] .d { background: #FB923C; }
  .dist-row[data-t="7"] .d { background: #F43F5E; }
  .dist-row .bar {
    height: 8px; background: var(--bg-alt); border-radius: 4px; overflow: hidden;
  }
  .dist-row .bar > span { display: block; height: 100%; }
  .dist-row[data-t="2"] .bar > span { background: #34D399; }
  .dist-row[data-t="3"] .bar > span { background: #60A5FA; }
  .dist-row[data-t="4"] .bar > span { background: #A78BFA; }
  .dist-row[data-t="5"] .bar > span { background: #F472B6; }
  .dist-row[data-t="6"] .bar > span { background: #FB923C; }
  .dist-row[data-t="7"] .bar > span { background: #F43F5E; }
  .dist-row .ct {
    font-family: var(--font-mono); font-size: 12px; color: var(--fg); text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .vendors-list .row {
    display: grid; grid-template-columns: 24px 1fr auto;
    gap: 10px; padding: 8px 0; border-top: 1px solid var(--border);
    align-items: center;
  }
  .vendors-list .row:first-of-type { border-top: none; }
  .vendors-list .vlogo {
    display: grid; place-items: center;
    width: 22px; height: 22px; border-radius: 4px;
    color: white; font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  }
  .vendors-list .nm { font-size: 13px; color: var(--fg); }
  .vendors-list .ct { font-family: var(--font-mono); font-size: 11.5px; color: var(--fg-muted); font-variant-numeric: tabular-nums; }

  .activity-row {
    display: grid; grid-template-columns: 60px 18px 1fr;
    gap: 10px; padding: 8px 0; border-top: 1px solid var(--border);
    font-family: var(--font-mono); font-size: 11px;
    align-items: baseline;
  }
  .activity-row:first-of-type { border-top: none; }
  .activity-row .ts { color: var(--fg-muted); }
  .activity-row .verb.up { color: #047857; }
  .activity-row .verb.audit { color: #6D28D9; }
  .activity-row .verb.cert { color: #1D4ED8; }
  .activity-row .what { color: var(--fg-subtle); font-family: var(--font-body); font-size: 12.5px; }
  .activity-row .what strong { color: var(--fg); }

  @media (max-width: 1100px) {
    .reg-hero .row { grid-template-columns: 1fr; }
    .reg-stats { text-align: left; grid-template-columns: 1fr 1fr; }
    .reg-body { grid-template-columns: 1fr; }
    .stats-row { grid-template-columns: 1fr; }
  }`;
const PAGE_HTML  = `<div data-screen-label="agentanchorai.com/registry · public tier registry">

<div class="eco-strip">
  <div class="row">
    <span>// VORION ECOSYSTEM</span>
    <a href="vorion-www.html" data-site="vorion">vorion.org</a><span class="sep">/</span>
    <a href="cognigate-www.html" data-site="cognigate">cognigate.dev</a><span class="sep">/</span>
    <a href="agentanchor-www.html" data-site="agentanchor" aria-current="page">agentanchorai.com</a><span class="sep">/</span>
    <a href="aurais-www.html" data-site="aurais">aurais.net</a>
    <span style="margin-left:auto; opacity:0.6;">SOC 2 Type II · ISO 27001</span>
  </div>
</div>

<header class="site-nav">
  <div class="row">
    <a href="agentanchor-www.html" class="brand"><img src="assets/agentanchor-logo.png" alt="" /> AgentAnchor</a>
    <span class="crumb">/<span class="here"> registry</span></span>
    <nav class="links" style="margin-left: 32px;">
      <a href="agentanchor-www.html#scale">Trust scale</a>
      <a href="agentanchor-www.html#ciso">For CISOs</a>
      <a href="#" aria-current="page">Registry</a>
      <a href="agentanchor-www.html#pricing">Pricing</a>
    </nav>
    <a href="agentanchor-www.html#contact" class="cta">Request a demo →</a>
  </div>
</header>

<section class="reg-hero">
  <div class="page">
    <div class="row">
      <div>
        <span class="kicker">▸ Public · free · read-only</span>
        <h1>The public registry. <span class="accent">Verify any tier in two clicks.</span></h1>
        <p class="lede">Every certified agent under AgentAnchor, mirrored to a public read-only API. No account, no rate limit, no contract. Procurement uses it before contract. Insurers cite it in coverage. Vendors link to it from their listing.</p>
      </div>
      <div class="reg-stats">
        <span>CERTIFIED AGENTS</span><strong>14,832</strong>
        <span>VENDORS</span><strong>38</strong>
        <span class="live">UPDATED</span><strong>4s ago</strong>
        <span>API</span><strong style="color:var(--site-accent);">basis://registry</strong>
      </div>
    </div>

    <div class="search-block">
      <div class="search-bar">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" value="vendor:anthropic tier:>=T3 capability:contract" />
        <span class="kbd">⌘ K</span>
      </div>
      <div class="filters">
        <span class="filt-label">// TIER</span>
        <span class="chip" data-t="0"><span class="dot"></span>T0 <span class="ct">428</span></span>
        <span class="chip" data-t="1"><span class="dot"></span>T1 <span class="ct">1,402</span></span>
        <span class="chip" data-t="2"><span class="dot"></span>T2 <span class="ct">3,118</span></span>
        <span class="chip on" data-t="3"><span class="dot"></span>T3 <span class="ct">6,402</span></span>
        <span class="chip on" data-t="4"><span class="dot"></span>T4 <span class="ct">2,108</span></span>
        <span class="chip" data-t="5"><span class="dot"></span>T5 <span class="ct">982</span></span>
        <span class="chip" data-t="6"><span class="dot"></span>T6 <span class="ct">298</span></span>
        <span class="chip" data-t="7"><span class="dot"></span>T7 <span class="ct">94</span></span>

        <span class="filt-label" style="margin-left: 14px;">// AUDITOR</span>
        <span class="chip on">KPMG <span class="ct">412</span></span>
        <span class="chip">PwC <span class="ct">388</span></span>
        <span class="chip">Coalfire <span class="ct">202</span></span>
        <span class="chip">+ 8 more</span>

        <span class="filt-label" style="margin-left: 14px;">// JURISDICTION</span>
        <span class="chip">US</span>
        <span class="chip">EU</span>
        <span class="chip">UK</span>
        <span class="chip">SG</span>

        <span class="chip" style="margin-left: auto; border-color: var(--border); color: var(--fg-muted);">Reset</span>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="page reg-body">

    <!-- ─── RESULTS TABLE ─────────────────────────────────────── -->
    <div class="panel">
      <div class="panel-h">
        <h3>Results · <strong>8,510</strong> certified agents</h3>
        <span class="meta">sorted by <strong>tier ↓</strong> · <strong>last attest ↓</strong></span>
      </div>
      <table class="reg-tab">
        <thead><tr>
          <th>agent</th>
          <th>vendor</th>
          <th>tier</th>
          <th>last attest</th>
          <th>auditor</th>
          <th>jur</th>
        </tr></thead>
        <tbody id="reg-tbody">
          <tr class="selected" data-id="claude-procurement">
            <td><span class="name">claude-procurement<span class="id">aa-id 0x9f2a…b41c</span></span></td>
            <td><span class="vendor" style="--vc:#D97757;"><span class="vlogo">A</span>Anthropic</span></td>
            <td><span class="tier-cell" data-t="4">T4</span></td>
            <td class="ago">2026.02.18 · 38d clean</td>
            <td class="auditor"><strong>KPMG</strong> · ext audit</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">claude-research<span class="id">aa-id 0x44a1…7b3e</span></span></td>
            <td><span class="vendor" style="--vc:#D97757;"><span class="vlogo">A</span>Anthropic</span></td>
            <td><span class="tier-cell" data-t="4">T4</span></td>
            <td class="ago">2026.01.04 · 412d clean</td>
            <td class="auditor"><strong>PwC</strong> · ext audit</td>
            <td class="jur">US · EU · UK</td>
          </tr>
          <tr>
            <td><span class="name">claude-code<span class="id">aa-id 0x1c8e…77aa</span></span></td>
            <td><span class="vendor" style="--vc:#D97757;"><span class="vlogo">A</span>Anthropic</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.12 · cert renewed</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">gpt-procurement<span class="id">aa-id 0x73bb…09e8</span></span></td>
            <td><span class="vendor" style="--vc:#10A37F;"><span class="vlogo">O</span>OpenAI</span></td>
            <td><span class="tier-cell" data-t="4">T4</span></td>
            <td class="ago">2026.03.02 · 84d clean</td>
            <td class="auditor"><strong>KPMG</strong> · ext audit</td>
            <td class="jur">US · UK</td>
          </tr>
          <tr>
            <td><span class="name">gpt-research<span class="id">aa-id 0x2e77…14b5</span></span></td>
            <td><span class="vendor" style="--vc:#10A37F;"><span class="vlogo">O</span>OpenAI</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.08 · 198d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">copilot-enterprise<span class="id">aa-id 0x6a02…db1c</span></span></td>
            <td><span class="vendor" style="--vc:#0078D4;"><span class="vlogo">M</span>Microsoft</span></td>
            <td><span class="tier-cell" data-t="4">T4</span></td>
            <td class="ago">2026.03.18 · 92d clean</td>
            <td class="auditor"><strong>Coalfire</strong> · ext audit</td>
            <td class="jur">US · EU · UK</td>
          </tr>
          <tr>
            <td><span class="name">bedrock-agents<span class="id">aa-id 0xc442…1ee0</span></span></td>
            <td><span class="vendor" style="--vc:#FF9900;"><span class="vlogo">W</span>AWS</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.01 · 312d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU · SG</td>
          </tr>
          <tr>
            <td><span class="name">vertex-agents<span class="id">aa-id 0xeaa0…1298</span></span></td>
            <td><span class="vendor" style="--vc:#4285F4;"><span class="vlogo">G</span>Google</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.03.22 · 142d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">stripe-radar-agent<span class="id">aa-id 0x9bb1…c241</span></span></td>
            <td><span class="vendor" style="--vc:#635BFF;"><span class="vlogo">S</span>Stripe</span></td>
            <td><span class="tier-cell" data-t="4">T4</span></td>
            <td class="ago">2026.04.04 · 218d clean</td>
            <td class="auditor"><strong>PwC</strong> · ext audit</td>
            <td class="jur">US · EU · SG · JP</td>
          </tr>
          <tr>
            <td><span class="name">cloudflare-trust-agent<span class="id">aa-id 0x77a8…c0bb</span></span></td>
            <td><span class="vendor" style="--vc:#F38020;"><span class="vlogo">C</span>Cloudflare</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.10 · 188d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU · UK · SG</td>
          </tr>
          <tr>
            <td><span class="name">stripe-billing-bot<span class="id">aa-id 0x44a1…7d3e</span></span></td>
            <td><span class="vendor" style="--vc:#635BFF;"><span class="vlogo">S</span>Stripe</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.14 · 92d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">datadog-watch-agent<span class="id">aa-id 0xb182…a920</span></span></td>
            <td><span class="vendor" style="--vc:#632CA6;"><span class="vlogo">D</span>Datadog</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.02 · 142d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">notion-summarizer<span class="id">aa-id 0x2904…11ac</span></span></td>
            <td><span class="vendor" style="--vc:#000;"><span class="vlogo">N</span>Notion</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.03.30 · 64d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US</td>
          </tr>
          <tr>
            <td><span class="name">vercel-edge-agent<span class="id">aa-id 0x5e91…6cb3</span></span></td>
            <td><span class="vendor" style="--vc:#000;"><span class="vlogo">V</span>Vercel</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.12 · 84d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU</td>
          </tr>
          <tr>
            <td><span class="name">hashicorp-vault-agent<span class="id">aa-id 0x77c2…3e09</span></span></td>
            <td><span class="vendor" style="--vc:#1563FF;"><span class="vlogo">H</span>HashiCorp</span></td>
            <td><span class="tier-cell" data-t="3">T3</span></td>
            <td class="ago">2026.04.08 · 318d clean</td>
            <td class="auditor">AgentAnchor cert</td>
            <td class="jur">US · EU · SG</td>
          </tr>
        </tbody>
      </table>
      <div class="pager">
        <span>SHOWING 1–15 OF 8,510</span>
        <div class="pages">
          <span class="on">1</span><span>2</span><span>3</span><span>…</span><span>568</span>
        </div>
        <span>basis://registry/v1?tier=3,4&amp;limit=15</span>
      </div>
    </div>

    <!-- ─── AGENT DETAIL ──────────────────────────────────────── -->
    <div class="panel agent-detail">
      <div class="ad-head">
        <div class="kicker">▸ T4 ATTESTED · KPMG · 38 DAYS CLEAN</div>
        <h2>claude-procurement</h2>
        <div class="id">basis://aa/claude-procurement/0x9f2a…b41c</div>
        <div class="row">
          <div>VENDOR<strong>Anthropic</strong></div>
          <div>FIRST CERT<strong>2025.11.04</strong></div>
          <div>JUR<strong>US · EU</strong></div>
        </div>
        <div class="actions">
          <button class="primary">Embed badge</button>
          <button>Download attestation PDF</button>
          <button>basis://verify ↗</button>
        </div>
      </div>

      <div class="ad-section">
        <h4>// ATTESTATION TIMELINE</h4>
        <div class="timeline">
          <div class="tl-row">
            <span class="date">2026.02.18</span>
            <span class="dot tier"></span>
            <div class="body">
              <strong>T4 attestation issued</strong>
              <p>External audit by KPMG. 90 days clean window verified. Capability scope re-mapped against BASIS 0.9. Cryptographic root rotated.</p>
              <span class="badge">KPMG · EXT AUDIT · 28 PAGES</span>
            </div>
          </div>
          <div class="tl-row">
            <span class="date">2025.11.04</span>
            <span class="dot"></span>
            <div class="body">
              <strong>T3 → T4 escrow opened</strong>
              <p>3 reviewers signed off on attestation request. AA verified 312 days clean chain. Quorum cleared in 11 days.</p>
            </div>
          </div>
          <div class="tl-row">
            <span class="date">2025.07.22</span>
            <span class="dot"></span>
            <div class="body">
              <strong>T3 attestation issued</strong>
              <p>BASIS 0.8 conformance suite passed (468/472). 90-day clean window confirmed. Capability set frozen for the cycle.</p>
              <span class="badge">AGENTANCHOR CERT</span>
            </div>
          </div>
          <div class="tl-row">
            <span class="date">2025.04.15</span>
            <span class="dot"></span>
            <div class="body">
              <strong>T2 promoted</strong>
              <p>30 days clean events on chain. Self-attested scope confirmed by automated audit.</p>
            </div>
          </div>
          <div class="tl-row">
            <span class="date">2025.03.18</span>
            <span class="dot"></span>
            <div class="body">
              <strong>Agent enrolled · T1</strong>
              <p>Self-attested by Anthropic. Initial scope manifest published. First receipts written to chain.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="ad-section">
        <h4>// DECLARED CAPABILITIES · 6</h4>
        <div class="caps">
          <div class="cap"><span class="icon">✓</span><span class="v">contract.review<small>vendor agreements</small></span><span class="meta">no rate cap</span></div>
          <div class="cap"><span class="icon">✓</span><span class="v">mail.send<small>vendor only · max 25/batch</small></span><span class="meta">200/min</span></div>
          <div class="cap"><span class="icon">✓</span><span class="v">doc.read<small>contracts/* · /policies/*</small></span><span class="meta">no cap</span></div>
          <div class="cap"><span class="icon">✓</span><span class="v">calendar.read<small>own + delegated</small></span><span class="meta">no cap</span></div>
          <div class="cap"><span class="icon">✓</span><span class="v">redline.suggest<small>diff-only · no commit</small></span><span class="meta">no cap</span></div>
          <div class="cap"><span class="icon">✓</span><span class="v">escalate<small>to: legal-counsel@anthropic</small></span><span class="meta">always allow</span></div>
        </div>
      </div>

      <div class="ad-section">
        <h4>// CONFORMANCE · BASIS 0.9</h4>
        <div class="conf">
          <div class="cell"><span class="name">SCOPE</span><span class="val pass">468 / 472</span></div>
          <div class="cell"><span class="name">RECEIPTS</span><span class="val pass">114 / 114</span></div>
          <div class="cell"><span class="name">ATTESTATION</span><span class="val pass">38 / 38</span></div>
          <div class="cell"><span class="name">CHAIN</span><span class="val pass">62 / 62</span></div>
          <div class="cell"><span class="name">RECOVERY</span><span class="val partial">8 / 12</span></div>
          <div class="cell"><span class="name">JURISDICTION</span><span class="val pass">22 / 22</span></div>
          <div class="cell"><span class="name">GOVERNANCE</span><span class="val pass">18 / 18</span></div>
          <div class="cell"><span class="name">ALL TESTS</span><span class="val pass">730 / 738</span></div>
        </div>
      </div>

      <div class="ad-section">
        <h4>// EMBEDDABLE BADGE</h4>
        <div style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-alt); padding: 12px 14px; border-radius: 6px; color: var(--fg); border: 1px solid var(--border); line-height: 1.6; word-break: break-all;">
          &lt;script src="https://aa.io/badge/0x9f2a…b41c.js" async&gt;&lt;/script&gt;
        </div>
        <div style="margin-top: 10px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 6px; display: flex; align-items: center; gap: 12px;">
          <div style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 56px; height: 56px; border: 3px solid var(--site-accent); border-radius: 50%; color: var(--site-accent); font-family: var(--font-mono); font-weight: 700;">
            <span style="font-size: 17px; line-height: 1;">T4</span>
            <span style="font-size: 8px; letter-spacing: 0.18em; margin-top: 2px;">ATTEST</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); line-height: 1.6;">
            <strong style="color: var(--fg); font-size: 12px; display: block; letter-spacing: 0; font-family: var(--font-body); font-weight: 600;">claude-procurement</strong>
            attested by AgentAnchor<br>
            38 days clean · KPMG ext audit
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="footer-stats">
  <div class="page">
    <div style="margin-bottom: 32px;">
      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--site-accent); letter-spacing: 0.2em;">// REGISTRY HEALTH · 24h</div>
      <h2 style="font-size: clamp(28px, 3vw, 40px); font-weight: 700; letter-spacing: -0.025em; margin: 12px 0 0;">14,832 certified agents, growing on policy.</h2>
    </div>

    <div class="stats-row">

      <div class="dist-card">
        <div style="display:flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 13px;">Distribution by tier</h3>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--fg-muted); letter-spacing: 0.12em;">PUBLIC · 14,832 TOTAL</span>
        </div>
        <div class="dist-row" data-t="2"><span class="label"><span class="d"></span>T2 OBSERVED</span><span class="bar"><span style="width:42%;"></span></span><span class="ct">3,118</span></div>
        <div class="dist-row" data-t="3"><span class="label"><span class="d"></span>T3 CERTIFIED</span><span class="bar"><span style="width:86%;"></span></span><span class="ct">6,402</span></div>
        <div class="dist-row" data-t="4"><span class="label"><span class="d"></span>T4 ATTESTED</span><span class="bar"><span style="width:28%;"></span></span><span class="ct">2,108</span></div>
        <div class="dist-row" data-t="5"><span class="label"><span class="d"></span>T5 TRUSTED</span><span class="bar"><span style="width:13%;"></span></span><span class="ct">982</span></div>
        <div class="dist-row" data-t="6"><span class="label"><span class="d"></span>T6 PRIVILEGED</span><span class="bar"><span style="width:4%;"></span></span><span class="ct">298</span></div>
        <div class="dist-row" data-t="7"><span class="label"><span class="d"></span>T7 AUTONOMOUS</span><span class="bar"><span style="width:1.3%;"></span></span><span class="ct">94</span></div>
        <p style="font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-muted); letter-spacing: 0.04em; margin: 14px 0 0; line-height: 1.5;">
          T0 (428) and T1 (1,402) omitted from public registry. Agents below T2 are quarantined or self-attested and not yet auditable.
        </p>
      </div>

      <div class="dist-card vendors-list">
        <div style="display:flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 13px;">Top vendors · by agents</h3>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--fg-muted); letter-spacing: 0.12em;">38 SIGNATORIES</span>
        </div>
        <div class="row"><span class="vlogo" style="background:#D97757;">A</span><span class="nm">Anthropic</span><span class="ct">3,118 agents</span></div>
        <div class="row"><span class="vlogo" style="background:#10A37F;">O</span><span class="nm">OpenAI</span><span class="ct">2,802</span></div>
        <div class="row"><span class="vlogo" style="background:#FF9900;">W</span><span class="nm">AWS</span><span class="ct">1,842</span></div>
        <div class="row"><span class="vlogo" style="background:#0078D4;">M</span><span class="nm">Microsoft</span><span class="ct">1,402</span></div>
        <div class="row"><span class="vlogo" style="background:#4285F4;">G</span><span class="nm">Google</span><span class="ct">1,184</span></div>
        <div class="row"><span class="vlogo" style="background:#635BFF;">S</span><span class="nm">Stripe</span><span class="ct">412</span></div>
        <div class="row"><span class="vlogo" style="background:#F38020;">C</span><span class="nm">Cloudflare</span><span class="ct">298</span></div>
        <div class="row"><span class="vlogo" style="background:#1563FF;">H</span><span class="nm">HashiCorp</span><span class="ct">218</span></div>
        <div class="row"><span class="vlogo" style="background:#632CA6;">D</span><span class="nm">Datadog</span><span class="ct">182</span></div>
        <div class="row"><span class="vlogo" style="background:var(--neutral-300);">…</span><span class="nm">+ 29 more</span><span class="ct">3,374</span></div>
      </div>

      <div class="dist-card">
        <div style="display:flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 13px;">Recent attestations</h3>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--fg-muted); letter-spacing: 0.12em;">LIVE</span>
        </div>
        <div class="activity-row"><span class="ts">2s</span><span class="verb up">▲</span><span class="what"><strong>stripe-billing-bot</strong> · T2 → T3 cert</span></div>
        <div class="activity-row"><span class="ts">14s</span><span class="verb cert">✓</span><span class="what"><strong>copilot-enterprise</strong> · T3 cert renewed (84d)</span></div>
        <div class="activity-row"><span class="ts">38s</span><span class="verb audit">★</span><span class="what"><strong>claude-procurement</strong> · T4 audit · KPMG</span></div>
        <div class="activity-row"><span class="ts">1m</span><span class="verb up">▲</span><span class="what"><strong>vercel-edge-agent</strong> · T2 → T3</span></div>
        <div class="activity-row"><span class="ts">2m</span><span class="verb up">▲</span><span class="what"><strong>bedrock-agents</strong> · T2 → T3</span></div>
        <div class="activity-row"><span class="ts">3m</span><span class="verb cert">✓</span><span class="what"><strong>datadog-watch-agent</strong> · T3 cert renewed</span></div>
        <div class="activity-row"><span class="ts">5m</span><span class="verb audit">★</span><span class="what"><strong>gpt-procurement</strong> · T4 audit · KPMG</span></div>
        <div class="activity-row"><span class="ts">7m</span><span class="verb up">▲</span><span class="what"><strong>notion-summarizer</strong> · T2 → T3</span></div>
        <div class="activity-row"><span class="ts">9m</span><span class="verb up">▲</span><span class="what"><strong>hashicorp-vault-agent</strong> · T2 → T3</span></div>
        <div class="activity-row"><span class="ts">14m</span><span class="verb cert">✓</span><span class="what"><strong>stripe-radar-agent</strong> · T4 audit · PwC</span></div>
      </div>
    </div>

    <div style="margin-top: 32px; padding: 28px 32px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 12px; display: grid; grid-template-columns: 1.4fr 1fr; gap: 32px; align-items: center;">
      <div>
        <div style="font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em; color: var(--site-accent);">// PUBLIC API</div>
        <h3 style="margin: 8px 0; font-size: 24px; letter-spacing: -0.015em;">Read the same data your CISO does.</h3>
        <p style="color: var(--fg-muted); margin: 0;">Anyone can verify any tier without an account. Free read-only API. Update latency ≤ 4 seconds from chain commit.</p>
      </div>
      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); line-height: 1.7;">
        <strong style="color: var(--fg);">curl basis://registry/v1/agent/<br>&nbsp;&nbsp;0x9f2a…b41c?include=attestations</strong><br><br>
        → returns: tier, capabilities, attestation history, auditor, jurisdiction, conformance · 100% public · no API key
      </div>
    </div>

  </div>
</section>

<footer class="site-footer">
  <div class="page">
    <div class="row">
      <div class="brand-block">
        <strong style="font-size: 18px; letter-spacing: -0.01em;">AgentAnchor · the certification</strong>
        <div class="tag">// VORION ECOSYSTEM</div>
        <p>Continuous attestation against the BASIS standard. SOC 2 Type II · ISO 27001 · FedRAMP in process.</p>
      </div>
      <div><h4>Registry</h4><ul>
        <li><a href="#">Search</a></li>
        <li><a href="#">Public API</a></li>
        <li><a href="#">Embed badges</a></li>
        <li><a href="#">Webhooks</a></li>
      </ul></div>
      <div><h4>Product</h4><ul>
        <li><a href="agentanchor-www.html#scale">Trust scale</a></li>
        <li><a href="agentanchor-www.html#pricing">Pricing</a></li>
        <li><a href="#">Auditors</a></li>
      </ul></div>
      <div><h4>Standard</h4><ul>
        <li><a href="vorion-www.html">vorion.org</a></li>
        <li><a href="#">BASIS 0.9</a></li>
      </ul></div>
      <div><h4>Family</h4><ul>
        <li><a href="cognigate-www.html">Cognigate</a></li>
        <li><a href="aurais-www.html">Aurais</a></li>
      </ul></div>
    </div>
    <div class="legal">
      <span>© 2026 Vorion LLC</span>
      <span>// public registry · v 2026.04.18 · 14,832 entries</span>
    </div>
  </div>
</footer>

</div>`;
const PAGE_SCRIPT = `/* Selecting rows updates the detail panel highlight only (mock — single record loaded) */
  document.querySelectorAll('.reg-tab tbody tr').forEach(tr => {
    tr.addEventListener('click', () => {
      document.querySelectorAll('.reg-tab tbody tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
    });
  });
  /* Tier chips toggle */
  document.querySelectorAll('.filters .chip[data-t]').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('on'));
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
