# Session wrap-up — 2026-06-15

A point-in-time snapshot to survive a conversation archive. Safe to prune once acted on.

## Production (verified live this session)
- Site: <https://flcason.com> — apex canonical; `www` redirects; Vercel alias `cason-heritage.vercel.app`.
- `/deck` → **HTTP 200**, serving the "The Cason Audit · 2026" deck (`slides/index.html` + `deck-stage.js`).
- Deploy flow: push to `main` → Vercel production; PRs → preview. No build step (pure static).
- `main` was at `82f6620` at this snapshot.

## What shipped this session
- **PR #2 (merged, squash)** — "Deploy & contribute docs + restore the /deck route": README Deploy/Contribute/Domain sections, restored `slides/` (the `/deck` target an earlier cleanup had removed), and dropped `slides/`, `research/`, `ui_kits/` from `.gitignore`. Fully absorbed into current `main`.

## Branch cleanup (decided 2026-06-15)
**Delete — 7 branches, confirmed fully merged into `main`** (recoverable from their PRs):

| Branch | Merged via |
|---|---|
| `claude/eloquent-galileo-44zYU` | #4–19, 22, 29, 30 |
| `claude/flcason-agent-orchestration-9adb4y` | #21–28 (`almanac.js` confirmed in `main`) |
| `claude/vorion-governance-h7` | #31 |
| `claude/basis-tiers` | #32 |
| `claude/gate-contract-conformance` | #33 |
| `claude/seam-pag-verify` | #34 |
| `claude/affectionate-bardeen-JY6eT` | #3 |

Delete command (the CI env token returns 403 on ref deletion — run locally / via GitHub UI):
```bash
git push origin --delete claude/eloquent-galileo-44zYU claude/flcason-agent-orchestration-9adb4y claude/vorion-governance-h7 claude/basis-tiers claude/gate-contract-conformance claude/seam-pag-verify claude/affectionate-bardeen-JY6eT
```

**Keep:**
- `main`
- `design-system-rescue-2026-06-05` — **orphan branch** (no shared history; author `chunkstar`, 2026-05-30, commit `5c55d47`), 131 files including a `preview/` **design-system gallery** (color systems, component previews, brand iconography) that is **gitignored in `main`** and therefore exists *only here*. This is the "design bundle / prior site content." **Decision for reassessment:** bring `preview/` into `main`, mine it for assets, or keep purely as reference.
- `claude/focused-feynman-ARyDV` — the working branch for this note; delete after it lands.

## Open threads for reassessment
1. **Design system** — decide the fate of the `preview/` gallery that lives only on `design-system-rescue-2026-06-05`.
2. **`DEPLOY.md` route drift** — its table says `/heritage → ui_kits/heritage-site/index.html`, but `vercel.json` rewrites `/heritage → /`. It also omits `/proof` and `/system`. Reconcile against `vercel.json`.
3. **Stopped background search** ("design bundle and any prior site content") — resolved: that content is the `design-system-rescue-2026-06-05` branch. Can be closed.
4. **Pre-existing `DEPLOY.md` production checklist** — vendor fonts locally; add per-page `og:image`.

## Where truth lives
- `README.md` — canonical & current (the narrative site **and** the "Living Line" governed agent system: routes, deploy, contribute, domain).
- `DEPLOY.md` — deploy/CI + serverless env vars for `/living` (minor route drift; see above).
- `research/ORCHESTRATION.md`, `research/KEEPER.md`, `research/bloodhound.md`, `research/DRIFT.md` — agent-system design docs.
- `vercel.json` — source of truth for routes/rewrites.

## Canonical routes (from `vercel.json`)
`/` → `index.html` · `/heritage` → `/` · `/hub` → `/hub` · `/tree` → `/cason-tree` · `/dashboard` → `ui_kits/family-tree-app` · `/living` → `ui_kits/living-line` · `/proof` → `ui_kits/proof` · `/deck` → `slides` · `/system` → `README.md` · `/prompt` → `research/edge-expansion-prompt.md`
