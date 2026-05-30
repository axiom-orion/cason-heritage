// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC
/* eslint-disable react/no-danger, @next/next/no-css-tags */

const PAGE_STYLE = `.hero-aa { padding: 96px 0 72px; }
  .hero-aa .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 56px; align-items: center; }
  .hero-aa .actions { display: flex; gap: 12px; margin-bottom: 32px; }

  /* Certificate / dashboard mockup */
  .cert-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 24px 60px -28px rgba(15,23,42,0.18);
  }
  .cert-card .head {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-alt);
  }
  .cert-card .head .org { font-weight: 600; font-size: 14px; }
  .cert-card .head .meta { font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); letter-spacing: 0.06em; }
  .cert-card .body { padding: 24px 22px; }

  .cert-row {
    display: grid; grid-template-columns: 1fr auto auto auto;
    gap: 16px; align-items: center;
    padding: 12px 0; border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
    font-size: 13px;
  }
  .cert-row:first-child { border-top: none; }
  .cert-row .name { font-weight: 500; color: var(--fg); }
  .cert-row .name .sub { display: block; font-size: 11px; color: var(--fg-muted); font-family: var(--font-mono); margin-top: 2px; letter-spacing: 0.04em; }
  .cert-row .days { font-family: var(--font-mono); color: var(--fg-muted); font-size: 11px; letter-spacing: 0.04em; }

  /* Tier badge highlight (used in hero) */
  .tier-badge-big {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
    width: 110px; height: 110px;
    border: 3px solid #3B82F6; border-radius: 50%;
    background: rgba(59,130,246,0.06);
    color: #3B82F6;
  }
  .tier-badge-big .t { font-family: var(--font-mono); font-size: 36px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
  .tier-badge-big .lbl { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 4px; }

  /* Tier ladder */
  .tier-ladder {
    display: grid; grid-template-columns: 100px 1fr 220px 130px;
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  }
  .tier-ladder > div {
    padding: 18px 22px; border-top: 1px solid var(--border); border-left: 1px solid var(--border);
    display: flex; align-items: center; font-size: 14px;
  }
  .tier-ladder > div:nth-child(-n+4) { border-top: none; background: var(--bg-alt); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-muted); }
  .tier-ladder > div:nth-child(4n+1) { border-left: none; }
  .tier-ladder .meaning { color: var(--fg); }
  .tier-ladder .grant { color: var(--fg-muted); font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.04em; }
  .tier-ladder .stat { font-family: var(--font-mono); color: var(--fg-subtle); font-size: 12px; }

  /* CISO numbers */
  .ciso-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
  .ciso-card { padding: 28px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); }
  .ciso-card .lbl { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; color: var(--site-accent); }
  .ciso-card .big { font-family: var(--font-mono); font-size: 36px; font-weight: 700; letter-spacing: -0.025em; margin: 10px 0 6px; }
  .ciso-card .desc { color: var(--fg-muted); font-size: 13px; margin: 0; line-height: 1.5; }

  .quote-card {
    border-left: 3px solid var(--site-accent);
    padding: 32px 36px;
    background: var(--bg-alt);
    border-radius: 0 12px 12px 0;
  }
  .quote-card blockquote {
    font-family: var(--font-serif); font-style: italic; font-size: 22px; line-height: 1.4;
    margin: 0 0 16px; color: var(--fg); letter-spacing: -0.005em;
  }
  .quote-card .by { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em; color: var(--fg-muted); }

  .pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .price-card { padding: 32px; border: 1px solid var(--border); border-radius: 14px; background: var(--bg); }
  .price-card.feat { border-color: var(--site-accent); box-shadow: 0 0 0 4px color-mix(in oklab, var(--site-accent) 8%, transparent); }
  .price-card .tier { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; color: var(--site-accent); }
  .price-card h3 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 8px 0; }
  .price-card .price { font-family: var(--font-mono); font-size: 32px; font-weight: 600; }
  .price-card .price small { font-size: 13px; color: var(--fg-muted); font-weight: 400; }
  .price-card ul { list-style: none; padding: 0; margin: 24px 0; }
  .price-card li { padding: 6px 0; font-size: 14px; color: var(--fg); border-top: 1px dashed var(--border); }
  .price-card li:first-child { border-top: none; }
  .price-card li::before { content: "✓ "; color: var(--site-accent); font-weight: 700; }

  @media (max-width: 880px) {
    .hero-aa .grid { grid-template-columns: 1fr; }
    .ciso-grid { grid-template-columns: 1fr 1fr; }
    .pricing-grid { grid-template-columns: 1fr; }
    .tier-ladder { grid-template-columns: 70px 1fr; }
    .tier-ladder .grant, .tier-ladder .stat { display: none; }
  }`;
const PAGE_HTML  = `<div data-screen-label="agentanchorai.com · homepage">

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
    <a href="#" class="brand"><img src="assets/agentanchor-logo.png" alt="" /> AgentAnchor <span class="property-tag">certification</span></a>
    <nav class="links">
      <a href="#scale">Trust scale</a>
      <a href="#ciso">For CISOs</a>
      <a href="#registry">Registry</a>
      <a href="#pricing">Pricing</a>
      <a href="#docs">Docs</a>
    </nav>
    <a href="#contact" class="cta">Request a demo →</a>
  </div>
</header>

<section class="hero hero-aa">
  <div class="page">
    <div class="grid">
      <div>
        <span class="kicker">▸ For the CISO with 40 agents already running</span>
        <h1>Reputation arrives <span class="accent">with the bot.</span></h1>
        <p class="lede">CISO-grade certification. Continuous attestation, tier policies, audit logs, and the public registry that lets a buyer confirm an agent's tier before it touches a system. The audit your insurance company actually asks for.</p>
        <div class="actions">
          <a href="#contact" class="btn btn--lg">Request a demo <span class="arrow">→</span></a>
          <a href="#registry" class="btn btn--ghost btn--lg">Search the registry</a>
        </div>

        <div style="display: flex; gap: 28px; align-items: center; padding-top: 28px; border-top: 1px solid var(--border); font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); letter-spacing: 0.1em;">
          <span>SOC 2 TYPE II</span><span>·</span>
          <span>ISO 27001</span><span>·</span>
          <span>HIPAA-READY</span><span>·</span>
          <span>FEDRAMP IN PROCESS</span>
        </div>
      </div>

      <div>
        <div class="cert-card">
          <div class="head">
            <div>
              <div class="org">Acme Inc · agent inventory</div>
              <div class="meta" style="margin-top:2px;">14 governed · 12 attested · 2 in escrow</div>
            </div>
            <span class="tier-pip" data-tier="3" style="font-size:10px;">FLEET T3</span>
          </div>
          <div class="body">
            <div class="cert-row">
              <div class="name">market-scout<span class="sub">finance / read · 247 days</span></div>
              <span class="tier-pip" data-tier="3">T3</span>
              <span class="days">clean</span>
              <span style="color:#34D399;">●</span>
            </div>
            <div class="cert-row">
              <div class="name">inbox-triage<span class="sub">email / write · 198 days</span></div>
              <span class="tier-pip" data-tier="3">T3</span>
              <span class="days">3 near-miss</span>
              <span style="color:#34D399;">●</span>
            </div>
            <div class="cert-row">
              <div class="name">code-review<span class="sub">repo / read · 92 days</span></div>
              <span class="tier-pip" data-tier="2">T2</span>
              <span class="days">→ T3 cert pending</span>
              <span style="color:#FBBF24;">●</span>
            </div>
            <div class="cert-row">
              <div class="name">data-export<span class="sub">data / write · 14 days</span></div>
              <span class="tier-pip" data-tier="1">T1</span>
              <span class="days">3 denials</span>
              <span style="color:#FB7185;">●</span>
            </div>
            <div class="cert-row">
              <div class="name">research-pal<span class="sub">web / read · 412 days</span></div>
              <span class="tier-pip" data-tier="4">T4</span>
              <span class="days">audited Q1</span>
              <span style="color:#34D399;">●</span>
            </div>
          </div>
        </div>
        <p style="font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); text-align: center; margin-top: 12px; letter-spacing: 0.1em;">// LIVE FLEET DASHBOARD · ACME INC</p>
      </div>
    </div>
  </div>
</section>

<section class="section" id="scale" style="background: var(--bg-alt);">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 01 · the trust tier scale</div>
        <h2>T0 to T7. Travels with the agent identity. Always.</h2>
      </div>
      <p class="section-lede">Embedded in HTTP <code>X-AA-Tier</code> response headers, printed on procurement PDFs, displayed next to every agent name in any catalog.</p>
    </div>

    <div class="tier-ladder">
      <div>tier</div><div>what it means</div><div>granted by</div><div>visual</div>
      <div><span class="tier-pip" data-tier="0">T0</span></div><div class="meaning">Sandbox. Quarantined runtime, no real-world side effects.</div><div class="grant">runtime default</div><div class="stat">slate-300</div>
      <div><span class="tier-pip" data-tier="1">T1</span></div><div class="meaning">Declared. Owner has registered behavior + scope. No observation yet.</div><div class="grant">self-attest</div><div class="stat">amber-400</div>
      <div><span class="tier-pip" data-tier="2">T2</span></div><div class="meaning">Observed. ≥30 days of clean signed events. No scope violations.</div><div class="grant">chain</div><div class="stat">emerald-400</div>
      <div><span class="tier-pip" data-tier="3">T3</span></div><div class="meaning">Certified. Conformance suite passed + 90 days clean.</div><div class="grant"><strong style="color:var(--fg);">AgentAnchor</strong></div><div class="stat">blue-400</div>
      <div><span class="tier-pip" data-tier="4">T4</span></div><div class="meaning">Attested. External auditor + cryptographic root of trust.</div><div class="grant"><strong style="color:var(--fg);">AgentAnchor + auditor</strong></div><div class="stat">violet-400</div>
      <div><span class="tier-pip" data-tier="5">T5</span></div><div class="meaning">Trusted. Operating with delegation, recorded.</div><div class="grant">recorded</div><div class="stat">pink-400</div>
      <div><span class="tier-pip" data-tier="6">T6</span></div><div class="meaning">Privileged. High-stakes scope; quorum on grant.</div><div class="grant">quorum + AA</div><div class="stat">orange-400</div>
      <div><span class="tier-pip" data-tier="7">T7</span></div><div class="meaning">Autonomous. Express-routed. 10× penalty on any violation.</div><div class="grant">board + AA</div><div class="stat">rose-500</div>
    </div>
  </div>
</section>

<section class="section" id="ciso">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 02 · for CISOs</div>
        <h2>The numbers your board, auditor, and insurer all want.</h2>
      </div>
    </div>

    <div class="ciso-grid">
      <div class="ciso-card">
        <div class="lbl">// CONTINUOUS</div>
        <div class="big">24/7</div>
        <p class="desc">Attestation, not point-in-time. Tier shifts within minutes of a chain event.</p>
      </div>
      <div class="ciso-card">
        <div class="lbl">// AUDIT-READY</div>
        <div class="big">SOC 2</div>
        <p class="desc">Section 5 controls map directly to T3 attestation. Drop-in for your annual review.</p>
      </div>
      <div class="ciso-card">
        <div class="lbl">// COVERAGE</div>
        <div class="big">14 days</div>
        <p class="desc">From "no governance" to T2 fleet-wide for a 100-agent estate. Median onboarding.</p>
      </div>
      <div class="ciso-card">
        <div class="lbl">// EXPOSURE</div>
        <div class="big" style="color:#10B981;">−83%</div>
        <p class="desc">Reduction in unauthorized scope events post-deployment. Pilot data, n=14.</p>
      </div>
    </div>

    <div style="margin-top: 56px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="quote-card">
        <blockquote>"I had 40 agents and zero idea what they did yesterday. AgentAnchor gave me an answer my external auditor signed off on, in two weeks."</blockquote>
        <div class="by">— Director of Information Security · Fortune 500 fintech</div>
      </div>
      <div class="quote-card">
        <blockquote>"Procurement asked the question we couldn't answer: which tier is this vendor's bot? AgentAnchor became the answer — and the requirement."</blockquote>
        <div class="by">— Head of Vendor Risk · global insurer</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="registry" style="background: var(--bg-alt);">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 03 · the public registry</div>
        <h2>Read-only mirror of every certified agent. Free. Forever.</h2>
      </div>
      <p class="section-lede">Procurement uses it before contract. Vendors link to it from their listing. Insurers cite it in coverage.</p>
    </div>

    <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
      <div style="display: flex; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
        <input type="text" placeholder="Search agents, vendors, capabilities…" style="flex: 1; height: 44px; padding: 0 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-family: inherit;" value="vendor:anthropic" />
        <select style="height: 44px; padding: 0 14px; border: 1px solid var(--border); border-radius: 8px; font-family: inherit; font-size: 14px;"><option>All tiers</option><option>T3+</option><option>T4 only</option></select>
      </div>
      <div style="padding-top: 16px;">
        <div class="cert-row">
          <div class="name">claude-procurement<span class="sub">anthropic / contract.review · 312 days</span></div>
          <span class="tier-pip" data-tier="4">T4</span>
          <span class="days">audited 2026.02</span>
          <span style="color:#34D399;">●</span>
        </div>
        <div class="cert-row">
          <div class="name">claude-research<span class="sub">anthropic / web.read · 412 days</span></div>
          <span class="tier-pip" data-tier="4">T4</span>
          <span class="days">audited 2026.01</span>
          <span style="color:#34D399;">●</span>
        </div>
        <div class="cert-row">
          <div class="name">claude-code<span class="sub">anthropic / repo.write · 198 days</span></div>
          <span class="tier-pip" data-tier="3">T3</span>
          <span class="days">cert renewed</span>
          <span style="color:#34D399;">●</span>
        </div>
        <div class="cert-row">
          <div class="name">claude-inbox<span class="sub">anthropic / email.write · 92 days</span></div>
          <span class="tier-pip" data-tier="2">T2</span>
          <span class="days">→ T3 in 8d</span>
          <span style="color:#FBBF24;">●</span>
        </div>
      </div>
      <p style="font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); text-align: center; margin: 16px 0 0; letter-spacing: 0.06em;">SHOWING 4 OF 14,832 CERTIFIED AGENTS · <a href="#" style="color: var(--site-accent);">VIEW FULL REGISTRY →</a></p>
    </div>
  </div>
</section>

<section class="section" id="pricing">
  <div class="page">
    <div class="section-head">
      <div>
        <div class="meta">// 04 · pricing</div>
        <h2>Three SKUs. Self-serve to FedRAMP.</h2>
      </div>
    </div>

    <div class="pricing-grid">
      <div class="price-card">
        <div class="tier">// CONFORMANCE</div>
        <h3>Self-test</h3>
        <div class="price">Free</div>
        <p style="color: var(--fg-muted); font-size: 13px;">Public test harness. Run it locally; claim T3 readiness in marketing.</p>
        <ul>
          <li>BASIS conformance suite</li>
          <li>Unlimited self-runs</li>
          <li>Public claim badge</li>
          <li>Community support</li>
        </ul>
        <a href="#" class="btn btn--ghost" style="width: 100%; justify-content: center;">Download suite →</a>
      </div>
      <div class="price-card feat">
        <div class="tier">// HOSTED · MOST POPULAR</div>
        <h3>Anchor Cloud</h3>
        <div class="price">\$2k <small>/ mo · 25 agents</small></div>
        <p style="color: var(--fg-muted); font-size: 13px;">SSO, RBAC, dashboards, SOC 2 reports, T3 attestation issued by AgentAnchor.</p>
        <ul>
          <li>Continuous attestation</li>
          <li>SAML SSO + SCIM</li>
          <li>Audit log export (CSV / SIEM)</li>
          <li>Public registry listing</li>
          <li>SOC 2 Type II report</li>
          <li>Email + Slack support</li>
        </ul>
        <a href="#" class="btn" style="width: 100%; justify-content: center;">Start trial →</a>
      </div>
      <div class="price-card">
        <div class="tier">// ENTERPRISE</div>
        <h3>T4 Attestation</h3>
        <div class="price">Contract</div>
        <p style="color: var(--fg-muted); font-size: 13px;">External-auditor-led review. On-prem appliance. The thing your insurer wants.</p>
        <ul>
          <li>Everything in Cloud</li>
          <li>On-prem appliance</li>
          <li>Third-party audit included</li>
          <li>Dedicated TAM</li>
          <li>FedRAMP path (in process)</li>
          <li>Custom SLA</li>
        </ul>
        <a href="#contact" class="btn btn--ghost" style="width: 100%; justify-content: center;">Talk to sales →</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="contact" style="background: linear-gradient(180deg, var(--bg) 0%, var(--bg-alt) 100%);">
  <div class="page" style="text-align: center;">
    <h2 style="font-size: clamp(36px, 4.5vw, 56px); font-weight: 700; letter-spacing: -0.025em; margin: 0 auto 16px; max-width: 22ch; line-height: 1.1; text-wrap: balance;">Bring your fleet under attestation in two weeks.</h2>
    <p style="font-size: 18px; color: var(--fg-muted); max-width: 56ch; margin: 0 auto 36px;">Schedule a 30-minute call. We'll walk your inventory, scope the deployment, and quote on the spot.</p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <a href="#" class="btn btn--lg">Schedule a demo <span class="arrow">→</span></a>
      <a href="#" class="btn btn--ghost btn--lg">Read the whitepaper</a>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="page">
    <div class="row">
      <div class="brand-block">
        <strong style="font-size: 18px; letter-spacing:-0.01em;">AgentAnchor · the certification</strong>
        <div class="tag">// VORION ECOSYSTEM</div>
        <p>Continuous attestation against the BASIS standard. SOC 2 Type II · ISO 27001 · FedRAMP in process.</p>
      </div>
      <div><h4>Product</h4><ul>
        <li><a href="#">Cloud</a></li>
        <li><a href="#">Self-hosted</a></li>
        <li><a href="#">Conformance suite</a></li>
        <li><a href="#">Public registry</a></li>
      </ul></div>
      <div><h4>Compliance</h4><ul>
        <li><a href="#">SOC 2 Type II</a></li>
        <li><a href="#">ISO 27001</a></li>
        <li><a href="#">HIPAA</a></li>
        <li><a href="#">FedRAMP</a></li>
      </ul></div>
      <div><h4>Resources</h4><ul>
        <li><a href="#">CISO whitepaper</a></li>
        <li><a href="#">Procurement FAQ</a></li>
        <li><a href="vorion-www.html">Vorion.org</a></li>
      </ul></div>
      <div><h4>Company</h4><ul>
        <li><a href="#">About</a></li>
        <li><a href="#">Customers</a></li>
        <li><a href="#">Contact</a></li>
        <li><a href="#">Security</a></li>
      </ul></div>
    </div>
    <div class="legal">
      <span>© 2026 Vorion LLC</span>
      <span>SOC 2 Type II · audited by KPMG · 2026.03</span>
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
