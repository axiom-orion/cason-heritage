# PR · vorion-marketing migration to @vorionsys/design-tokens

Drop-in replacement of the three files that own visual identity. Net effect: site renders against the new design system, picks up `data-site="vorion"` accent (cyan-600 hub), and the homepage flips to the **Live Ecosystem** direction.

---

## 1 · Install the design tokens

From the `voriongit/vorion-marketing/` repo root:

```bash
npm i @vorionsys/design-tokens@^0.1.0
```

## 2 · Replace three files

Copy these from `migration/vorion-marketing/` into the matching paths in the repo:

| From (this project) | To (vorion-marketing repo) |
|---|---|
| `migration/vorion-marketing/src/layouts/BaseLayout.astro` | `src/layouts/BaseLayout.astro` |
| `migration/vorion-marketing/src/styles/global.css` | `src/styles/global.css` |
| `migration/vorion-marketing/src/pages/index.astro` | `src/pages/index.astro` |

## 3 · Add the new sub-page

```bash
# in voriongit/vorion-marketing/
touch src/pages/spec.astro
```

Then paste the **entire `<body>...</body>`** content of `vorion-spec.html` (this project) into the new `src/pages/spec.astro`, wrapped in:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="BASIS · the specification · v 0.9" site="vorion">
  <!-- paste body here -->
</BaseLayout>
```

The page-scoped `<style>` block in the HTML file can be pasted in as-is — Astro accepts it. The TOC `<script>` at the bottom should be tagged `<script is:inline>` to skip Astro's bundler.

## 4 · Retire the old tokens

```bash
rm src/styles/tokens.css   # superseded by @vorionsys/design-tokens
```

## 5 · Update `tailwind.config.mjs`

Replace the bespoke `vorion: { 50: ... 950 }` color scale with references to the CSS variables. Add at the top of `theme.extend.colors`:

```js
'site-accent': 'var(--site-accent)',
'site-accent-dim': 'var(--site-accent-dim)',
'fg': 'var(--fg)',
'fg-muted': 'var(--fg-muted)',
'bg': 'var(--bg)',
'bg-alt': 'var(--bg-alt)',
'border': 'var(--border)',
```

Existing `vorion: { ... }` scale can stay during transition; mark it deprecated and remove in v0.2.

## 6 · Deploy

```bash
git checkout -b feat/design-system-v1
git add -A
git commit -m "feat: migrate to @vorionsys/design-tokens v0.1.0

- new BaseLayout sets data-site=vorion data-theme=light
- index.astro flips to Live Ecosystem direction (C)
- adds /spec route rendering BASIS 0.9
- retires src/styles/tokens.css"
git push origin feat/design-system-v1
# open PR · auto-deploy preview on Vercel
```

## What changes for the user

- `vorion.org` — homepage is now the **live ecosystem** direction (streaming chain ticker, world map, four-property cards). All older content (manifesto language, choose-your-path tiles, "what is governance" section) is **archived** but not deleted — they remain reachable via `/about` and the existing project sub-pages.
- `vorion.org/spec` — **new**. The BASIS 0.9 spec rendered with serif typography, TOC, signed-by-chain footer.
- All other pages (`/architecture`, `/math`, etc.) continue to render. They'll inherit the new `data-site="vorion"` accent automatically but their bespoke layouts are unchanged in this PR. Plan to revisit in a follow-up PR (`feat/design-system-v1.1`).

## Rollback

```bash
git revert HEAD
# Vercel auto-redeploys the prior commit. Token package can stay installed.
```

It's a low-risk, drop-in PR.
