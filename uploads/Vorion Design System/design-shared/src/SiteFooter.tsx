// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

interface FooterCol {
  heading: string;
  links: Array<{ label: string; href: string; muted?: boolean }>;
}

interface Props {
  brand: { title: string; tag: string; body: string };
  cols: FooterCol[];
  legalLeft: string;
  legalRight: string;
}

export function SiteFooter({ brand, cols, legalLeft, legalRight }: Props) {
  return (
    <footer className="site-footer">
      <div className="page">
        <div className="row">
          <div className="brand-block">
            <strong style={{ fontSize: 18, letterSpacing: '-0.01em' }}>{brand.title}</strong>
            <div className="tag">{brand.tag}</div>
            <p>{brand.body}</p>
          </div>
          {cols.map(col => (
            <div key={col.heading}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map(l => (
                  <li key={l.href}>
                    <a href={l.href}>
                      {l.label}
                      {l.muted && <span style={{ color: 'var(--fg-muted)', fontSize: 11 }}> ({l.muted})</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="legal">
          <span>{legalLeft}</span>
          <span>{legalRight}</span>
        </div>
      </div>
    </footer>
  );
}
