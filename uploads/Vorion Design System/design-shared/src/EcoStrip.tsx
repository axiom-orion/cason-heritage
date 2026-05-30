// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

type SiteId = 'vorion' | 'cognigate' | 'agentanchor' | 'aurais';

interface Props {
  currentSite: SiteId;
  rightSlot?: React.ReactNode;
}

const URLS: Record<SiteId, string> = {
  vorion:      'https://vorion.org',
  cognigate:   'https://cognigate.dev',
  agentanchor: 'https://agentanchorai.com',
  aurais:      'https://aurais.net',
};
const LABELS: Record<SiteId, string> = {
  vorion: 'vorion.org', cognigate: 'cognigate.dev',
  agentanchor: 'agentanchorai.com', aurais: 'aurais.net',
};

export function EcoStrip({ currentSite, rightSlot }: Props) {
  const order: SiteId[] = ['vorion', 'cognigate', 'agentanchor', 'aurais'];
  return (
    <div className="eco-strip">
      <div className="row">
        <span>{'// VORION ECOSYSTEM'}</span>
        {order.map((id, i) => (
          <span key={id} style={{ display: 'contents' }}>
            <a href={URLS[id]} data-site={id} aria-current={id === currentSite ? 'page' : undefined}>
              {LABELS[id]}
            </a>
            {i < order.length - 1 && <span className="sep">/</span>}
          </span>
        ))}
        {rightSlot && <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{rightSlot}</span>}
      </div>
    </div>
  );
}
