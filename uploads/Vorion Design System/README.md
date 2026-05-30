# Vorion migration · how each repo picks up the design system

Four repos, one shared tokens package, one migration order.

```
voriongit/design-tokens       (NEW)  → @vorionsys/design-tokens v0.1
voriongit/vorion-marketing    (Astro · exists)
voriongit/cognigate-www       (NEW)  → cognigate.dev
voriongit/agentanchor-www     (Next · exists)
voriongit/aurais              (Next · exists)
```

## Order (ship one at a time)

1. **`design-tokens` package** — publish to npm under `@vorionsys/design-tokens`.
   - This folder (`migration/design-tokens/`) is the entire package.
   - Push to a new repo `voriongit/design-tokens`.
   - `npm publish --access public`.

2. **`vorion-marketing`** — umbrella site. Sets the bar.
   - `npm i @vorionsys/design-tokens`
   - `src/styles/global.css` becomes a 4-line file that imports both CSS files plus Tailwind.
   - `src/layouts/BaseLayout.astro` sets `data-site="vorion"` and `data-theme="light"`.
   - `src/pages/index.astro` is rewritten section-by-section against `vorion-www-C.html` (the chosen direction).
   - `src/pages/spec.astro` is new — copy from `vorion-spec.html`.

3. **`cognigate-www`** — greenfield Astro repo.
   - `npm create astro@latest`
   - `npm i @vorionsys/design-tokens`
   - `src/layouts/BaseLayout.astro` sets `data-site="cognigate"`.
   - `src/pages/index.astro` = `cognigate-www.html`.
   - `src/pages/playground.astro` = `cognigate-playground.html`.

4. **`agentanchor-www`** — biggest rewrite (most existing copy).
   - `npm i @vorionsys/design-tokens`
   - Tear out `app/globals.css` (~100 lines of obsolete vars).
   - `app/layout.tsx` sets `data-site="agentanchor"`.
   - `app/page.tsx` rewritten against `agentanchor-www.html`.
   - `app/registry/page.tsx` is new — copy from `agentanchor-registry.html`.

5. **`aurais`** — most existing UI; preserve, restyle.
   - `npm i @vorionsys/design-tokens`
   - `src/app/globals.css` already has dark vars — replace with token import.
   - `src/app/layout.tsx` sets `data-site="aurais"` `data-theme="dark"`.
   - `src/app/page.tsx` rewritten against `aurais-www.html`.
   - `src/app/console/page.tsx` is new — copy from `aurais-console.html`.

## Deploy

Vercel auto-deploys each repo on push. Each repo needs:

- `vercel.json` — already exists in each repo; no changes needed.
- Domain alias in Vercel dashboard:
  - `voriongit/vorion-marketing` → `vorion.org`
  - `voriongit/cognigate-www`    → `cognigate.dev`
  - `voriongit/agentanchor-www`  → `agentanchorai.com`
  - `voriongit/aurais`           → `aurais.net`

## Cross-property links

The eco-strip at the top of every page hard-codes the four properties. Once all four are deployed under their real domains, the `_site-partials.html` fragment URLs swap from local relative (`vorion-www.html`) to absolute (`https://vorion.org`). One sed pass per repo.
