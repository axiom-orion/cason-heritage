// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC
/* eslint-disable react/no-danger */

const PAGE_STYLE = `/* Aurais: dark, control-room, scanner-energy, security ops surface */
  body { background: #050912; color: #E2E8F0; }

  .hero-au { padding: 88px 0 72px; position: relative; overflow: hidden; }
  .hero-au::before {
    /* faint grid */
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%);
  }
  .hero-au .grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: 56px; align-items: center; position: relative; }

  /* Control-room console */
  .console {
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 32px 80px -32px rgba(245,158,11,0.18), 0 0 0 1px rgba(245,158,11,0.05);
  }
  .console .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px;
    background: #050912; border-bottom: 1px solid #1E293B;
    font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em;
    color: #64748B;
  }
  .console .topbar .live { color: #F59E0B; display: inline-flex; align-items: center; gap: 8px; }
  .console .topbar .live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #F59E0B; box-shadow: 0 0 8px #F59E0B; animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* Scanner — three-band row */
  .scanner {
    display: grid; grid-template-columns: 80px 1fr 100px;
    align-items: center; gap: 16px;
    padding: 12px 18px; border-bottom: 1px solid #1E293B;
    font-family: var(--font-mono); font-size: 11px; color: #94A3B8;
  }
  .scanner .lbl { color: #F59E0B; letter-spacing: 0.12em; }
  .scanner .track {
    height: 28px; background: #050912;
    border: 1px solid #1E293B; border-radius: 4px;
    position: relative; overflow: hidden;
  }
  .scanner .blip {
    position: absolute; top: 50%; transform: translateY(-50%);
    height: 14px; width: 3px; background: #F59E0B;
    border-radius: 1px;
  }
  .scanner .blip.warn { background: #FB7185; }
  .scanner .blip.calm { background: #34D399; }
  .scanner .scan-line {
    position: absolute; top: 0; bottom: 0; width: 80px;
    background: linear-gradient(90deg, transparent, rgba(245,158,11,0.25), transparent);
    animation: scan 2.8s linear infinite;
  }
  @keyframes scan { 0% { left: -80px; } 100% { left: 100%; } }
  .scanner .meter { color: #F59E0B; text-align: right; font-weight: 600; letter-spacing: 0.06em; }

  /* Bot grid */
  .bot-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; padding: 18px; }
  .bot {
    aspect-ratio: 1; border-radius: 4px;
    background: #0F172A; border: 1px solid #1E293B;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 9px; color: #475569;
    position: relative;
  }
  .bot.ok { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.3); color: #34D399; }
  .bot.warn { background: rgba(251,191,36,0.10); border-color: rgba(251,191,36,0.4); color: #FBBF24; }
  .bot.alert { background: rgba(251,113,133,0.10); border-color: rgba(251,113,133,0.4); color: #FB7185; box-shadow: 0 0 12px rgba(251,113,133,0.3); }
  .bot.attest { background: rgba(245,158,11,0.10); border-color: rgba(245,158,11,0.4); color: #F59E0B; }
  .bot::after {
    content: ""; position: absolute; top: 4px; right: 4px;
    width: 4px; height: 4px; border-radius: 50%; background: currentColor;
  }

  .console .legend {
    display: flex; gap: 18px; padding: 12px 18px; border-top: 1px solid #1E293B;
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; color: #64748B;
    background: #050912;
  }
  .console .legend span::before { content: "● "; }
  .console .legend .ok::before { color: #34D399; }
  .console .legend .warn::before { color: #FBBF24; }
  .console .legend .alert::before { color: #FB7185; }
  .console .legend .attest::before { color: #F59E0B; }

  /* Hero copy on dark */
  .hero-au .kicker { color: #F59E0B; }
  .hero-au .kicker::before { background: #F59E0B; box-shadow: 0 0 8px #F59E0B; }
  .hero-au h1 { color: #F1F5F9; }
  .hero-au h1 .accent { color: #F59E0B; }
  .hero-au p.lede { color: #94A3B8; }
  .hero-au .actions { display: flex; gap: 12px; margin-bottom: 32px; }

  /* Section overrides for dark surface */
  body.dark-skin .section { border-top-color: #1E293B; }
  section.section { border-top-color: #1E293B; }
  .site-nav { background: rgba(5,9,18,0.92); border-bottom-color: #1E293B; }
  .site-nav nav.links { color: #94A3B8; }
  .eco-strip { background: #050912; border-bottom-color: #1E293B; }
  .eco-strip .row { color: #64748B; }
  .eco-strip a { color: #94A3B8; }
  .eco-strip a:hover, .eco-strip a[aria-current="page"] { color: #F59E0B; }
  .section-head h2 { color: #F1F5F9; }
  .section-head .meta { color: #F59E0B; }
  .section-head .section-lede { color: #94A3B8; }

  /* Telemetry flow */
  .flow-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .flow-card {
    background: #0B1120; border: 1px solid #1E293B; border-radius: 12px;
    padding: 28px;
  }
  .flow-card .step-num { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B; }
  .flow-card h3 { font-size: 22px; color: #F1F5F9; letter-spacing: -0.015em; margin: 12px 0 10px; }
  .flow-card p { color: #94A3B8; margin: 0; line-height: 1.5; font-size: 14px; }
  .flow-card .visual {
    margin-top: 20px; padding: 14px; background: #050912;
    border-radius: 6px; border: 1px solid #1E293B;
    font-family: var(--font-mono); font-size: 11px; color: #64748B;
    line-height: 1.7;
  }
  .flow-card .visual .ok { color: #F59E0B; }

  /* Ops stats */
  .ops-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
  .ops {
    padding: 24px; border: 1px solid #1E293B; border-radius: 10px;
    background: #0B1120;
  }
  .ops .lbl { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B; }
  .ops .big { font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: #F1F5F9; letter-spacing: -0.02em; line-height: 1; margin: 12px 0 6px; }
  .ops .desc { color: #94A3B8; font-size: 12.5px; margin: 0; }
  .ops .delta { font-family: var(--font-mono); font-size: 11px; color: #34D399; margin-left: 6px; }
  .ops .delta.bad { color: #FB7185; }

  /* Quote */
  .ops-quote {
    background: #0B1120;
    border-left: 3px solid #F59E0B;
    padding: 36px 40px;
    border-radius: 0 12px 12px 0;
  }
  .ops-quote blockquote { font-family: var(--font-serif); font-style: italic; font-size: 24px; line-height: 1.4; color: #F1F5F9; margin: 0 0 20px; letter-spacing: -0.005em; max-width: 60ch; }
  .ops-quote .by { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; color: #94A3B8; }

  .site-footer { background: #050912; border-top-color: #1E293B; color: #94A3B8; }
  .site-footer h4 { color: #64748B; }
  .site-footer .legal { border-top-color: #1E293B; color: #64748B; }
  .site-footer .brand-block strong { color: #F1F5F9; }

  @media (max-width: 1100px) {
    .bot-grid { grid-template-columns: repeat(6,1fr); }
  }
  @media (max-width: 880px) {
    .hero-au .grid { grid-template-columns: 1fr; }
    .flow-grid { grid-template-columns: 1fr; }
    .ops-grid { grid-template-columns: 1fr 1fr; }
    .bot-grid { grid-template-columns: repeat(5,1fr); }
  }`;
const PAGE_HTML  = `<div data-screen-label="aurais.net · homepage">

<div class="eco-strip">
  <div class="row">
    <span>// VORION ECOSYSTEM</span>
    <a href="vorion-www.html" data-site="vorion">vorion.org</a><span class="sep">/</span>
    <a href="cognigate-www.html" data-site="cognigate">cognigate.dev</a><span class="sep">/</span>
    <a href="agentanchor-www.html" data-site="agentanchor">agentanchorai.com</a><span class="sep">/</span>
    <a href="aurais-www.html" data-site="aurais" aria-current="page">aurais.net</a>
    <span style="margin-left:auto; opacity:0.6;">// CONTROL · 14,832 BOTS · 8,142 ACTIVE</span>
  </div>
</div>

<header class="site-nav">
  <div class="row">
    <a href="#" class="brand" style="color:#F1F5F9;"><span class="glyph"></span> Aurais <span class="property-tag">control</span></a>
    <nav class="links">
      <a href="#feed">Live feed</a>
      <a href="#workflow">Workflow</a>
      <a href="#ops">For SecOps</a>
      <a href="#integrations">Integrations</a>
    </nav>
    <a href="#contact" class="cta">Open the console →</a>
  </div>
</header>

<section class="hero hero-au">
  <div class="page">
    <div class="grid">
      <div>
        <span class="kicker">▸ Security operations for the agent fleet</span>
        <h1>See every bot. <span class="accent">Curate the ones you trust.</span></h1>
        <p class="lede">A live, searchable, watch-listable feed of every certified agent in the BASIS chain — your fleet, your vendors', your peers'. Triage anomalies. Quarantine on click. Push to your SIEM. Make security operational.</p>
        <div class="actions">
          <a href="#contact" class="btn btn--lg">Open the console <span class="arrow">→</span></a>
          <a href="#feed" class="btn btn--ghost btn--lg" style="color:#E2E8F0; border-color:#1E293B;">Watch the feed</a>
        </div>

        <div style="display: flex; gap: 28px; padding-top: 28px; border-top: 1px solid #1E293B; font-family: var(--font-mono); font-size: 11px; color: #64748B; letter-spacing: 0.1em;">
          <span>SIEM: <strong style="color:#F59E0B;">SPLUNK · SENTINEL · CHRONICLE</strong></span>
          <span>SOAR: <strong style="color:#F59E0B;">XSOAR · TINES</strong></span>
        </div>
      </div>

      <div>
        <div class="console">
          <div class="topbar">
            <span>// CONSOLE · acme-secops</span>
            <span class="live">LIVE · STREAMING 142/s</span>
          </div>
          <div class="scanner">
            <span class="lbl">CHAIN</span>
            <div class="track">
              <div class="scan-line"></div>
              <div class="blip" style="left: 8%;"></div>
              <div class="blip calm" style="left: 22%;"></div>
              <div class="blip" style="left: 38%;"></div>
              <div class="blip warn" style="left: 51%;"></div>
              <div class="blip" style="left: 64%;"></div>
              <div class="blip" style="left: 73%;"></div>
              <div class="blip calm" style="left: 84%;"></div>
              <div class="blip" style="left: 92%;"></div>
            </div>
            <span class="meter">142/s</span>
          </div>
          <div class="scanner">
            <span class="lbl">DENIAL</span>
            <div class="track">
              <div class="blip warn" style="left: 28%;"></div>
              <div class="blip warn" style="left: 67%;"></div>
            </div>
            <span class="meter" style="color:#FBBF24;">2/min</span>
          </div>
          <div class="scanner">
            <span class="lbl">ALERT</span>
            <div class="track">
              <div class="blip alert" style="left: 44%; box-shadow: 0 0 8px #FB7185;"></div>
            </div>
            <span class="meter" style="color:#FB7185;">1 active</span>
          </div>
          <div class="bot-grid">
            <div class="bot ok">cs</div><div class="bot ok">it</div><div class="bot ok">de</div><div class="bot warn">cr</div><div class="bot ok">re</div><div class="bot ok">se</div><div class="bot ok">ms</div><div class="bot ok">ag</div>
            <div class="bot ok">cl</div><div class="bot ok">ap</div><div class="bot ok">bi</div><div class="bot ok">cm</div><div class="bot ok">dn</div><div class="bot warn">de</div><div class="bot ok">ec</div><div class="bot ok">fc</div>
            <div class="bot ok">gh</div><div class="bot ok">ha</div><div class="bot ok">id</div><div class="bot ok">jk</div><div class="bot alert">kl</div><div class="bot ok">ll</div><div class="bot ok">mn</div><div class="bot ok">no</div>
            <div class="bot ok">op</div><div class="bot ok">pq</div><div class="bot ok">qr</div><div class="bot attest">rs</div><div class="bot ok">st</div><div class="bot ok">tu</div><div class="bot ok">uv</div><div class="bot ok">vw</div>
            <div class="bot ok">wx</div><div class="bot ok">xy</div><div class="bot ok">yz</div><div class="bot ok">za</div><div class="bot ok">ab</div><div class="bot attest">bc</div><div class="bot ok">cd</div><div class="bot ok">de</div>
          </div>
          <div class="legend">
            <span class="ok">healthy 38</span>
            <span class="warn">elevated 2</span>
            <span class="alert">alert 1</span>
            <span class="attest">attesting 2</span>
            <span style="margin-left: auto; opacity: 0.6;">UPDATED 2s AGO</span>
          </div>
        </div>
        <p style="font-family: var(--font-mono); font-size: 11px; color: #64748B; text-align: center; margin-top: 12px; letter-spacing: 0.1em;">// LIVE FLEET TILE · 41 OF 142 BOTS SHOWN</p>
      </div>
    </div>
  </div>
</section>

<section class="section" id="workflow">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 01 · the SecOps workflow</div>
        <h2>From signal to verdict in under a minute.</h2>
      </div>
      <p class="section-lede">Aurais is the analyst surface on top of the chain. Every event traceable, every action reversible, every choice logged.</p>
    </div>

    <div class="flow-grid">
      <div class="flow-card">
        <div class="step-num">// 01 · DETECT</div>
        <h3>Anomaly surfaces in the feed</h3>
        <p>Live correlation across signed events from Cognigate. ML baselines per-agent: scope drift, time-of-day shift, target enumeration patterns.</p>
        <div class="visual">
          [02:14:07] <span class="ok">⚠ data-export</span><br />
          → 14 calls in 90s (baseline: 2/h)<br />
          → scope: customers.read (within)<br />
          → confidence: <span class="ok">94%</span> anomaly
        </div>
      </div>
      <div class="flow-card">
        <div class="step-num">// 02 · TRIAGE</div>
        <h3>Inspect the chain in one click</h3>
        <p>Full receipt history, capability ladder, related agents, owning team. No log-grepping; no API stitching. The chain is the timeline.</p>
        <div class="visual">
          chain · last 90s<br />
          ├─ 14× db.read(customers, rows=∞)<br />
          ├─ 0× db.write<br />
          ├─ peer agents: <span class="ok">2 idle</span><br />
          └─ owner: data-platform-team
        </div>
      </div>
      <div class="flow-card">
        <div class="step-num">// 03 · ACT</div>
        <h3>Quarantine, escalate, or clear</h3>
        <p>Three buttons. Each writes to the chain, pushes to your SIEM, notifies the owner. Tier auto-drops on quarantine. Reversible.</p>
        <div class="visual">
          → <span class="ok">QUARANTINE</span> · scope frozen<br />
          → tier T3 → T0 (reversible)<br />
          → splunk: <span class="ok">notif sent</span><br />
          → owner: <span class="ok">paged</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="ops" style="background: #0B1120;">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 02 · for security operations</div>
        <h2>The numbers that change after Aurais lands.</h2>
      </div>
    </div>

    <div class="ops-grid">
      <div class="ops">
        <div class="lbl">// MTTD</div>
        <div class="big">3.2<small style="font-size:14px; font-weight:400; color:#94A3B8;">min</small></div>
        <p class="desc">Mean time to detect agent anomaly. <span class="delta">↓ 88% vs. SIEM-only</span></p>
      </div>
      <div class="ops">
        <div class="lbl">// MTTR</div>
        <div class="big">11<small style="font-size:14px; font-weight:400; color:#94A3B8;">min</small></div>
        <p class="desc">Mean time to quarantine. Includes human review. <span class="delta">↓ 76%</span></p>
      </div>
      <div class="ops">
        <div class="lbl">// COVERAGE</div>
        <div class="big">100%</div>
        <p class="desc">Of certified agent calls. Receipts make it possible.</p>
      </div>
      <div class="ops">
        <div class="lbl">// FALSE POSITIVES</div>
        <div class="big">0.4%</div>
        <p class="desc">Tuned baselines, no rule fatigue. <span class="delta">↓ 92%</span></p>
      </div>
    </div>

    <div style="margin-top: 56px;">
      <div class="ops-quote">
        <blockquote>"My SOC went from 'we found out yesterday' to 'we already quarantined it.' For agent activity, Aurais is the only console I keep open all day."</blockquote>
        <div class="by">— SOC Manager · global telco · 8,200 agents under monitoring</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="integrations">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 03 · integrations</div>
        <h2>Pushes to where you already work.</h2>
      </div>
      <p class="section-lede">Aurais is the agent layer; your SIEM is the unified layer. We don't compete; we feed.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// SIEM</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">Splunk</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">native CEF · v 1.2</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// SIEM</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">Sentinel</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">CEF + KQL pack</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// SIEM</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">Chronicle</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">UDM mapping</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// SOAR</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">XSOAR</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">playbook pack</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// SOAR</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">Tines</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">webhook / story</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// CHAT</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">Slack</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">slash + alerts</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// PAGE</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">PagerDuty</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">events v2 api</div></div>
      <div style="padding: 24px; background: #0B1120; border: 1px solid #1E293B; border-radius: 10px;"><div style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: #F59E0B;">// AUTH</div><div style="font-size: 18px; color: #F1F5F9; margin-top: 12px; font-weight: 500;">Okta · OIDC</div><div style="color: #64748B; font-size: 12px; font-family: var(--font-mono);">scim + saml</div></div>
    </div>
  </div>
</section>

<section class="section" id="contact" style="background: linear-gradient(180deg, #050912 0%, rgba(245,158,11,0.06) 100%);">
  <div class="page" style="text-align: center;">
    <h2 style="font-size: clamp(36px, 4.5vw, 56px); font-weight: 700; letter-spacing: -0.025em; margin: 0 auto 16px; max-width: 22ch; line-height: 1.1; text-wrap: balance; color: #F1F5F9;">Make agent activity operational.</h2>
    <p style="font-size: 18px; color: #94A3B8; max-width: 56ch; margin: 0 auto 36px;">30-minute walkthrough with one of our analysts. We'll plug into your SIEM in real time and show you what's already in the chain.</p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <a href="#" class="btn btn--lg">Schedule a demo <span class="arrow">→</span></a>
      <a href="#" class="btn btn--ghost btn--lg" style="color:#E2E8F0; border-color:#1E293B;">Read the SOC playbook</a>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="page">
    <div class="row">
      <div class="brand-block">
        <strong style="font-size: 18px; letter-spacing: -0.01em;">Aurais · the control room</strong>
        <div class="tag">// VORION ECOSYSTEM</div>
        <p>Live operational console for certified agent fleets. Built on the BASIS chain. Plays nicely with your SIEM/SOAR.</p>
      </div>
      <div><h4>Product</h4><ul>
        <li><a href="#">Console</a></li>
        <li><a href="#">SIEM connectors</a></li>
        <li><a href="#">Playbooks</a></li>
        <li><a href="#">API</a></li>
      </ul></div>
      <div><h4>Use cases</h4><ul>
        <li><a href="#">SOC monitoring</a></li>
        <li><a href="#">Incident response</a></li>
        <li><a href="#">Threat hunting</a></li>
        <li><a href="#">Audit trail</a></li>
      </ul></div>
      <div><h4>Resources</h4><ul>
        <li><a href="#">SOC playbook</a></li>
        <li><a href="#">Detection library</a></li>
        <li><a href="#">Status</a></li>
      </ul></div>
      <div><h4>Family</h4><ul>
        <li><a href="vorion-www.html">Vorion.org</a></li>
        <li><a href="cognigate-www.html">Cognigate</a></li>
        <li><a href="agentanchor-www.html">AgentAnchor</a></li>
      </ul></div>
    </div>
    <div class="legal">
      <span>© 2026 Vorion LLC</span>
      <span>// CONSOLE STATUS · ●NOMINAL · 99.992% TRAILING 30D</span>
    </div>
  </div>
</footer>

</div>`;

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: PAGE_HTML }} />
    </>
  );
}
