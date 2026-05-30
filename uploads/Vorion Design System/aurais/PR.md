# PR · aurais migration to @vorionsys/design-tokens

Replaces the bespoke @theme block with shared tokens. Rewrites the homepage with the dark control-room aesthetic. Adds the full-screen SecOps console at `/console`.

## 1 · Install

```bash
cd voriongit/aurais
npm i @vorionsys/design-tokens@^0.1.0
```

## 2 · Replace these files

| From (this project) | To (aurais repo) |
|---|---|
| `migration/aurais/src/app/globals.css` | `src/app/globals.css` |
| `migration/aurais/src/app/layout.tsx`  | `src/app/layout.tsx` |
| `migration/aurais/src/app/page.tsx`    | `src/app/page.tsx` |
| `migration/aurais/src/app/console/page.tsx` | `src/app/console/page.tsx` (new dir) |

## 3 · Retire

```bash
rm src/styles/tokens.css   # superseded by @vorionsys/design-tokens
```

## 4 · What we keep

All existing operational routes — `/mission`, `/find`, `/bots`, `/govern`, `/playground`, `/buy`, `/dashboard`, `/install`, `/pair`, `/risk`, `/badge`, `/verify`, `/subscribe`, `/signin` — survive untouched. They inherit `data-site="aurais" data-theme="dark"` automatically.

The existing `<Hero>`, `<BotCard>`, `<ProofChainDemo>`, `<EcosystemDiagram>`, `<CanonicalAboutVorion>` components are NOT replaced in this PR. The new homepage is the marketing surface; product surfaces stay as-is until a follow-up audit.

## 5 · Deploy

```bash
git checkout -b feat/design-system-v1
git add -A
git commit -m "feat: migrate marketing surface to @vorionsys/design-tokens v0.1.0"
git push origin feat/design-system-v1
```

## Routes shipped

- `/` — keeper-facing marketing (scanner + bot grid + SecOps console preview)
- `/console` — NEW · full-screen SecOps console (DoD-style multi-surface scanner)

## Cross-property eco-strip

Updates needed in `src/components/Nav.tsx` — replace the existing nav with the eco-strip pattern. Tracked separately as `feat/eco-strip` follow-up.
