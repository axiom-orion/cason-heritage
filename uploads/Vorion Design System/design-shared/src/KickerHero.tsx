// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

interface Props {
  kicker: string;
  heading: React.ReactNode;
  lede: React.ReactNode;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trailer?: React.ReactNode;
}

export function KickerHero({ kicker, heading, lede, primaryCta, secondaryCta, trailer }: Props) {
  return (
    <section className="hero">
      <div className="page">
        <span className="kicker">{kicker}</span>
        <h1>{heading}</h1>
        <p className="lede">{lede}</p>
        <div className="actions" style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <a href={primaryCta.href} className="btn btn--lg">
            {primaryCta.label} <span className="arrow">→</span>
          </a>
          {secondaryCta && (
            <a href={secondaryCta.href} className="btn btn--ghost btn--lg">{secondaryCta.label}</a>
          )}
        </div>
        {trailer}
      </div>
    </section>
  );
}
