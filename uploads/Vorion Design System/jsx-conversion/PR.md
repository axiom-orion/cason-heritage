# PR · convert dangerouslySetInnerHTML pages to real JSX

The first migration shipped HTML-in-strings to ship fast. This PR converts
each `page.tsx` to real JSX components so React events, Next features
(Image, Link), and shared components can reach inside.

## Approach: codemod + handcraft

```
migration/jsx-conversion/
├── PR.md                      ← this file
├── codemod.mjs                ← html → jsx conversion script
├── components/                ← hand-converted shared pieces
│   ├── EcoStrip.tsx
│   ├── SiteNav.tsx
│   ├── SiteFooter.tsx
│   ├── TierPip.tsx
│   ├── ProofRow.tsx
│   └── KickerHero.tsx
└── pages/                     ← per-route examples
    ├── agentanchor.page.tsx
    └── aurais.page.tsx
```

## Run order per repo

1. Copy `migration/jsx-conversion/components/*` to repo's `components/site/`
2. Run `node migration/jsx-conversion/codemod.mjs <path-to-page.tsx>`
   — converts `class` → `className`, `for` → `htmlFor`, fixes self-closing tags,
   inlines style attribute values, extracts `<style>` blocks to scoped CSS.
3. Hand-fix the `@TODO` markers the codemod leaves (typically 4–8 per page).
4. Replace large repeated blocks (eco-strip, site nav, footer) with the
   imported components.

## Repo-by-repo order

| Repo | Pages | Estimated hands-on |
|---|---|---|
| cognigate-www | index + playground | 2 hrs (greenfield, simplest) |
| agentanchor-www | index + registry   | 3 hrs |
| aurais        | index + console    | 4 hrs (most complex) |
| vorion-marketing | spec only        | 2 hrs (index already pure Astro) |

## Acceptance test

After conversion: `<EcoStrip currentSite="cognigate" />` should accept a prop,
event handlers on buttons should fire, and `<Link>` should work for nav.
