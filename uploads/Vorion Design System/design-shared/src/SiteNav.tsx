// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

interface Props {
  brand: React.ReactNode;
  links: Array<{ label: string; href: string; active?: boolean }>;
  cta?: { label: string; href: string };
}

export function SiteNav({ brand, links, cta }: Props) {
  return (
    <header className="site-nav">
      <div className="row">
        <a href="/" className="brand">{brand}</a>
        <nav className="links">
          {links.map(l => (
            <a key={l.href} href={l.href} aria-current={l.active ? 'page' : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
        {cta && <a href={cta.href} className="cta">{cta.label}</a>}
      </div>
    </header>
  );
}
