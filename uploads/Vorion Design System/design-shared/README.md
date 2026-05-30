# @vorionsys/design-shared

Shared React components for the Vorion ecosystem. Pairs with `@vorionsys/design-tokens` (CSS).

## Install

```sh
npm i @vorionsys/design-shared @vorionsys/design-tokens
```

## Components

- `<EcoStrip currentSite="..." />` — cross-property nav strip
- `<SiteNav brand links cta />` — standard top nav
- `<SiteFooter brand cols />` — standard footer
- `<TierPip tier={3} />` — color-coded T0–T7 badge
- `<ProofRow ts verdict agent description hash />` — one signed event
- `<KickerHero kicker heading lede />` — standard hero

## Use

```tsx
import "@vorionsys/design-tokens/tokens.css";
import "@vorionsys/design-tokens/site-shell.css";
import { EcoStrip, SiteNav, TierPip } from "@vorionsys/design-shared";
```

The DOM/className structure matches what `site-shell.css` styles. Ship the two packages at the same minor version.

## License

Apache-2.0
