# Session wrap-up — 2026-06-15

A point-in-time snapshot to survive a conversation archive. Treat this as the
**reassessment brief**: what's live, what's still open, what to delete, and the
decisions left to make. Safe to prune once acted on.

## Production (last verified 2026-06-15)
- Site: <https://flcason.com> — apex canonical; `www` redirects; Vercel alias `cason-heritage.vercel.app`.
- `/deck` → HTTP 200, serving the "The Cason Audit · 2026" deck (`slides/index.html` + `deck-stage.js`).
- Deploy flow: push to `main` → Vercel production; PRs → preview. No build step (pure static).
- `main` is at `0f888f3` at this snapshot (after #36 hero-arrow refinements + #37 wrap-up note).

## One PR still open — decide its fate (the main "open" item)
- **PR #35 — `claude/h7-standing-claim-drift`** — "H7 provenance-replay: replay
  standing-claim sources vs current evidence (Stage 2)". Adds exactly one invariant
  (`provenance-replay`) to the weekly `drift-audit.js` battery; reuses existing plumbing
  and never touches `data.js` (propose-never-publish). Tests green (`npm run
  selftest:drift` → 33/0). It is **behind `main`** (opened against `82f6620`).
  - **Decision:** **merge** it (continue the Vorion governance roadmap, Stage 2) or
    **close** it (pause that investment). See "Reassessment" below — this hangs off
    decision #1.

## Branch cleanup (refreshed 2026-06-15, post #36/#37)
**Delete — 9 branches, all merged into `main`** (each recoverable from its PR page):

| Branch | Merged via |
|---|---|
| `claude/eloquent-galileo-44zYU` | #4–19, 22, 29, 30 |
| `claude/flcason-agent-orchestration-9adb4y` | #21–28 |
| `claude/vorion-governance-h7` | #31 |
| `claude/basis-tiers` | #32 |
| `claude/gate-contract-conformance` | #33 |
| `claude/seam-pag-verify` | #34 |
| `claude/affectionate-bardeen-JY6eT` | #3 |
| `claude/hero-arrow-padding-followups` | #36 |
| `claude/focused-feynman-ARyDV` | #37 (+ this wrap-up follow-up — delete after it lands) |

Delete command (the web env token returns 403 on ref deletion — run locally / via the
GitHub **Branches** UI):
```bash
git push origin --delete \
  claude/eloquent-galileo-44zYU claude/flcason-agent-orchestration-9adb4y \
  claude/vorion-governance-h7 claude/basis-tiers claude/gate-contract-conformance \
  claude/seam-pag-verify claude/affectionate-bardeen-JY6eT \
  claude/hero-arrow-padding-followups claude/focused-feynman-ARyDV
```
**Tied to PR #35:** `claude/h7-standing-claim-drift` — delete *after* you merge or close
#35 (append it to the command above once decided).

**Keep:**
- `main`
- `design-system-rescue-2026-06-05` — **orphan branch** (no shared history; author
  `chunkstar`, 2026-05-30, commit `5c55d47`), 131 files including a `preview/`
  **design-system gallery** (color systems, component previews, brand iconography) that
  is **gitignored in `main`** and therefore exists *only here*. This is the "design
  bundle / prior site content." **Decision for reassessment:** bring `preview/` into
  `main`, mine it for assets, or keep purely as reference.

## Reassessment — the open decisions ("are we moving in the directions best for us")
1. **Scope & investment (the load-bearing one).** The repo is two things at once: the
   **narrative heritage site** (static, self-contained, live at flcason.com) and a
   **governed autonomous agent system** — 13 agents, weekly Keeper + drift-audit crons,
   and a Vorion governance roadmap. Decide the balance: keep investing in the agent
   layer, **freeze** it where it is (it is self-tested and stable), or **refocus** on the
   narrative/site experience. Most of the items below flow from this call.
2. **PR #35 / governance roadmap.** Merge (Stage 2 of `research/VORION-GOVERNANCE.md`) or
   close. It is low-risk, tested, and purely additive — but only worth merging if (1)
   says keep building the agent layer.
3. **Design system.** Fate of the `preview/` gallery that lives only on
   `design-system-rescue-2026-06-05` (bring in / mine / keep as reference).
4. **`DEPLOY.md` route drift.** Its table says `/heritage → ui_kits/heritage-site/index.html`,
   but `vercel.json` rewrites `/heritage → /`; it also omits `/proof` and `/system`.
   Reconcile `DEPLOY.md` against `vercel.json` (the source of truth).
5. **Production checklist (pre-existing in `DEPLOY.md`).** Vendor the fonts locally; add
   per-page `og:image`.

## Where truth lives
- `README.md` — canonical & current: the narrative site **and** the "Living Line"
  governed agent system (architecture, routes, deploy, contribute, domain).
- `DEPLOY.md` — deploy/CI + serverless env vars for `/living` (minor route drift; see above).
- `research/ORCHESTRATION.md`, `research/KEEPER.md`, `research/bloodhound.md`,
  `research/DRIFT.md`, `research/VORION-GOVERNANCE.md` — agent-system + governance design docs.
- `vercel.json` — source of truth for routes/rewrites.

## Canonical routes (from `vercel.json`)
`/` → `index.html` · `/heritage` → `/` · `/hub` → `/hub` · `/tree` → `/cason-tree` ·
`/dashboard` → `ui_kits/family-tree-app` · `/living` → `ui_kits/living-line` · `/proof` →
`ui_kits/proof` · `/deck` → `slides` · `/system` → `README.md` · `/prompt` →
`research/edge-expansion-prompt.md`
