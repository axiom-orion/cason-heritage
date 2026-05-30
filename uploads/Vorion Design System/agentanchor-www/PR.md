# PR · agentanchor-www migration to @vorionsys/design-tokens

Replaces the hand-rolled `globals.css` theme system with the shared design tokens. Rewrites the homepage against the new design language. Adds a public registry route.

## 1 · Install

```bash
cd voriongit/agentanchor-www
npm i @vorionsys/design-tokens@^0.1.0
```

## 2 · Replace these files

| From (this project) | To (agentanchor-www repo) |
|---|---|
| `migration/agentanchor-www/app/globals.css` | `app/globals.css` |
| `migration/agentanchor-www/app/layout.tsx`  | `app/layout.tsx` |
| `migration/agentanchor-www/app/page.tsx`    | `app/page.tsx` |
| `migration/agentanchor-www/app/registry/page.tsx` | `app/registry/page.tsx` (new dir) |

## 3 · Retire

```bash
rm styles/tokens.css   # superseded by @vorionsys/design-tokens
```

The bespoke `themes.ts` ACTIVE_THEME system is fully replaced by `data-site="agentanchor"` on the html element. Theme switcher logic can be deleted in a follow-up PR.

## 4 · tailwind.config.ts

Replace the bespoke `primary` / `secondary` / `anchor` color scales with CSS-variable references. Keep `trust` since it's used by the BASIS tier badges.

## 5 · Deploy

```bash
git checkout -b feat/design-system-v1
git add -A
git commit -m "feat: migrate to @vorionsys/design-tokens v0.1.0"
git push origin feat/design-system-v1
```

Vercel auto-deploys preview. Test `/` and `/registry`. Merge.

## Routes shipped

- `/` — CISO-grade homepage (trust scale, fleet dashboard, three-SKU pricing)
- `/registry` — NEW · public registry (search, filters, attestation timeline, embed badge)

## Pages that survive untouched (this PR)

`/concepts`, `/demo`, `/marketplace`, `/partners`, `/pricing`, `/scan`, `/glass`, `/company`, `/cookies`, `/privacy`, `/terms` — all inherit `data-site="agentanchor"` accent automatically. Layouts revisited in follow-up PR.
