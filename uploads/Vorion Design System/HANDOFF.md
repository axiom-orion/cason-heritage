# Designer → Engineer handoff · Vorion ecosystem v1

This is the implementation contract. Each page is one section. Each section maps to a component path, a file in `migration/`, and the eng task to actualize it.

## Repo map

```
voriongit/design-tokens      (NEW pkg)  @vorionsys/design-tokens
voriongit/design-shared      (NEW pkg)  @vorionsys/design-shared
voriongit/vorion-marketing   (Astro)    vorion.org
voriongit/cognigate-www      (NEW)      cognigate.dev
voriongit/agentanchor-www    (Next)     agentanchorai.com
voriongit/aurais             (Next)     aurais.net
voriongit/kaizen-www         (NEW)      kaizen.vorion.org (Q3)
```

## Build & deploy order

1. `design-tokens` → npm publish
2. `design-shared` → npm publish (depends on #1)
3. `vorion-marketing` PR → Vercel preview → merge → set domain
4. `cognigate-www` create repo → push → Vercel project → set domain
5. `agentanchor-www` PR → Vercel preview → merge
6. `aurais` PR → Vercel preview → merge
7. `kaizen-www` after Q3 launch

## Section ↔ component map

### vorion.org (Live Ecosystem direction · C)

| Section | Source HTML | Maps to |
|---|---|---|
| Eco-strip | `vorion-www-C.html` lines 280–290 | `<EcoStrip currentSite="vorion" />` |
| Sticky nav | lines 292–302 | `<SiteNav>` |
| Hero w/ live counter | lines 304–340 | inline (page-specific) |
| Live feed reel | lines 342–360 | `<ChainFeed source="basis://chain" />` *(to build)* |
| Four-property cards | lines 380–430 | inline (page-specific) |
| 24h metrics + world map | lines 432–490 | inline + `<WorldMap>` *(to build)* |
| BASIS 0.9 cards | lines 492–520 | inline |
| Signatory CTA | lines 522–540 | inline |
| Site footer | lines 542–600 | `<SiteFooter>` |

**Eng task:** wire `<ChainFeed>` to the real basis://chain reader once it lands. Replace mock data in the script tag.

### cognigate.dev

| Section | Source | Component |
|---|---|---|
| Eco-strip | `cognigate-www.html` | `<EcoStrip currentSite="cognigate" />` |
| Hero + install line | inline (page-specific) | inline |
| Code preview + latency band | inline | `<CodeFrame language tabs />` *(to extract v0.3)* |
| Pipeline diagram | inline | inline |
| SDK grid | inline | inline |
| Perf grid | inline | `<StatBlock>` *(to extract v0.3)* |
| Footer | `<SiteFooter>` |

**Eng task:** wire the install line copy button to clipboard API; wire P50/P99 to `/v1/metrics` once endpoint exists.

### agentanchorai.com

| Section | Source | Component |
|---|---|---|
| Eco-strip | `agentanchor-www.html` | `<EcoStrip currentSite="agentanchor" />` |
| Hero + fleet dashboard preview | inline | inline |
| Trust scale (T0–T7) | inline | `<TierLadder>` *(to extract v0.3)* |
| CISO numbers | inline | `<StatBlock>` |
| Public registry preview | inline | inline |
| 3-SKU pricing | inline | `<PricingGrid>` *(to extract v0.3)* |
| Footer | `<SiteFooter>` |

**`/registry` route**: full search + filter UI. Currently mock data. Eng task: connect to `basis://registry/v1` once read API is live.

### aurais.net

| Section | Source | Component |
|---|---|---|
| Eco-strip | `aurais-www.html` (dark) | `<EcoStrip currentSite="aurais" />` |
| Hero + control room | inline | `<ControlRoomPreview>` *(to extract)* |
| Anomaly workflow | inline | inline |
| SecOps numbers | inline | `<StatBlock>` |
| Integration grid | inline | `<IntegrationGrid>` *(to extract)* |
| Footer | `<SiteFooter>` |

**`/console` route**: the live SecOps console at full scale. Eng task: connect to real chain + SIEM connectors. Critical: keep the keyboard shortcut (⌘K), it's part of the brand.

## Live data dependencies (mocks that need real backends)

| Mock | Lives in | Real source |
|---|---|---|
| Chain feed reel | vorion.org hero | `basis://chain/v1/stream?last=60s` |
| P50 / P99 latency | cognigate.dev | `/v1/metrics?window=1h` |
| Public registry | agentanchor /registry | `basis://registry/v1/agents` |
| Multi-surface scanner | aurais /console | already in `voriongit/vorion-find` — wire it |
| Top regions / world map | vorion.org metrics | `basis://chain/v1/geo` |

## Performance budgets

| Metric | Budget |
|---|---|
| First Contentful Paint | < 1.2s (4G) |
| Largest Contentful Paint | < 2.5s |
| CLS | < 0.1 |
| Page weight (excl. JS) | < 200 KB |
| Live ticker JS | < 8 KB gzipped |

## Accessibility commitments

- All interactive elements keyboard-reachable
- Color contrast ≥ 4.5 : 1 (tested for all six accent + neutral pairs)
- `prefers-reduced-motion` disables all animations (chain pulse, scanner sweep, etc.)
- One H1 per page; semantic landmarks (`<header>`, `<main>`, `<footer>`)

## Browser support

- Chrome / Safari / Firefox / Edge latest two majors
- iOS Safari 16+
- No IE, no legacy Edge

## Open questions for product before launch

1. Real basis://chain reader — when?
2. Are the live numbers we show (14,832 agents, 38 signatories) public-real, or do we keep them as illustrative until 1.0?
3. Eco-strip — show all four domains always, or hide the strip on the current site?
4. Kaizen launch timing — keep "Q3" or commit to a date?

## Versioning contract

| Package | Major | Minor | Patch |
|---|---|---|---|
| design-tokens | breaking var rename | new var | value-only change |
| design-shared | breaking API | new component | bug fix |
| Each site | major redesign | new section | copy tweak |

Sites should always pin to a `^minor` of tokens+shared. Cross-property visual consistency depends on this.

## Sign-off

When all four production sites match these designs at minor 1.0, this doc is the cited reference for "we shipped." File any drift as an issue against the originating repo, not against design.

---

*Design-tokens v0.1.0 · Design-shared v0.1.0 · Handoff doc v1*
