# @vorionsys/design-tokens

Vorion ecosystem design tokens. One file per concern, importable into any toolchain that understands CSS.

## Install

```sh
npm i @vorionsys/design-tokens
```

## Use

### Next.js (App Router) — `app/layout.tsx`

```tsx
import "@vorionsys/design-tokens/tokens.css";
import "@vorionsys/design-tokens/site-shell.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-site="agentanchor" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
```

### Astro — `src/layouts/BaseLayout.astro`

```astro
---
import "@vorionsys/design-tokens/tokens.css";
import "@vorionsys/design-tokens/site-shell.css";
---
<html lang="en" data-site="vorion" data-theme="light">
  <body><slot /></body>
</html>
```

### Vanilla HTML

```html
<link rel="stylesheet" href="https://unpkg.com/@vorionsys/design-tokens/tokens.css">
<link rel="stylesheet" href="https://unpkg.com/@vorionsys/design-tokens/site-shell.css">
```

## Per-property accent

Set on the root `<html>`. Everything inherits.

| `data-site` | Accent | Property |
|---|---|---|
| `vorion` (default) | violet `#8B5CF6` | the standard |
| `basis` | violet | spec docs |
| `cognigate` | emerald `#10B981` | the runtime |
| `agentanchor` | blue `#3B82F6` | the certification |
| `aurais` | amber `#F59E0B` | the control room |
| `kaizen` | rose `#F43F5E` | the practice |

Dark mode via `data-theme="dark"` on the same element.

## What's in here

- `tokens.css` — colors, type scale, spacing, radii, motion. The single source of truth.
- `site-shell.css` — page-level primitives: top nav, eco-strip, hero, section, footer, buttons, tier pips. Loads after `tokens.css`.

Components (`.v-btn`, `.v-pill`, `.tier-pip`, etc.) live in the consuming app for now — to be extracted to `@vorionsys/design-shared` in v0.2.

## Versioning

Semver. Breaking changes to variable names bump major. New variables bump minor. Value-only changes bump patch. The whole package is &lt; 16 KB unminified.

## License

Apache-2.0
