# Deployment & CI

## Vercel deploy

This is a pure static site. No build step.

1. Push to GitHub.
2. In Vercel, **Add New… → Project → Import** this repository.
3. **Framework Preset:** *Other*.
4. **Build Command:** *(leave blank)*.
5. **Output Directory:** *(leave blank — root)*.
6. Deploy.

`vercel.json` handles clean URLs and the friendly rewrites:

| Path | Serves |
| --- | --- |
| `/` | `index.html` — heritage landing |
| `/heritage` | `ui_kits/heritage-site/index.html` — the narrative |
| `/tree` | `cason-tree.html` — the audit ledger |
| `/dashboard` | `ui_kits/family-tree-app/index.html` — five variants |
| `/living` | `ui_kits/living-line/index.html` — The Living Line (agentic personas) |
| `/deck` | `slides/index.html` — audit deck |
| `/prompt` | `research/edge-expansion-prompt.md` |

## Local development

```sh
npm install
npm run dev          # serves on http://localhost:4000
```

## Testing

Playwright smoke tests cover page loads, hero rendering, console-error budgets (must be zero), and a handful of interactive paths.

```sh
npm install
npx playwright install --with-deps chromium
npm test             # headless
npm run test:ui      # interactive mode
npm run test:report  # open last HTML report
```

## CI/CD

`.github/workflows/ci.yml` runs three jobs on every push to `main` and every PR:

1. **smoke** — Playwright across all surfaces. Artifact: `playwright-report/`.
2. **lint-html** — fast sanity check that all expected entry points and config files exist.
3. **deploy-preview** — Vercel preview deploy for PRs (gated on `VERCEL_TOKEN` secret).

Production deploys happen automatically via Vercel's git integration once the GitHub repo is connected — no workflow needed for that side.

### Required secrets for `deploy-preview`

- `VERCEL_TOKEN` — personal token from <https://vercel.com/account/tokens>
- `VERCEL_ORG_ID` — from `.vercel/project.json` after first manual deploy
- `VERCEL_PROJECT_ID` — same file

## Live AI & multi-model research (optional — `/living`)

The Living Line runs fully offline by default (deterministic templated voices, no
keys, no cost). Two **serverless functions** under `api/` add live capabilities when
you set the matching environment variables in Vercel (Project → Settings → Environment
Variables). Keys stay server-side; the browser never sees them.

| Endpoint | Feature | Env vars |
| --- | --- | --- |
| `api/persona.js` | Live, in-character dialogue with an ancestor (horizon-bounded — the client only ever sends facts that persona could know) | `ANTHROPIC_API_KEY` · optional `CLAUDE_MODEL` (default `claude-sonnet-4-6`; set to the latest Claude Opus for the highest quality) |
| `api/consensus.js` | **Multi-model research consensus** — asks Grok, Gemini, and Claude the same question in parallel, then a Claude adjudicator corroborates only what ≥2 models agree on (single-source claims are flagged *unverified*) so one model's hallucination can't become fact | any of `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY` · optional `XAI_MODEL` (default `grok-4`), `GEMINI_MODEL` (default `gemini-2.5-flash`). The adjudicator needs `ANTHROPIC_API_KEY`. |

Notes:
- The endpoints use whatever providers are configured; with none set they return a
  clear "not configured" message and the UI stays on the offline path.
- Set `XAI_MODEL` / `GEMINI_MODEL` to a model id your key actually supports; a wrong id
  just marks that one provider failed and consensus proceeds with the rest.
- These calls cost tokens (the consensus runs 3–4 frontier-model calls per question);
  responses are cached client-side so repeats are free. The whole site is a static
  deploy with no build step — the functions use only Node built-ins (no npm install).
- Corroborated findings can be saved (browser `localStorage`) as evidence-tiered,
  clearly-labelled "AI consensus" notes — never as `confirmed`, which stays reserved
  for documented genealogical sources.

## Caching headers

Set by `vercel.json`:

| Pattern | Cache |
| --- | --- |
| `*.html` | revalidate every request |
| `assets/*` | 1 year, immutable |
| `*.css` | 1 day |

## Production checklist

- [ ] Vendor Inter + Geist Mono + Playfair Display + Source Serif/Sans locally (currently CDN from Google Fonts).
- [ ] Add `og:image` to each entry HTML for link unfurls.
- [ ] Configure custom domain in Vercel.
- [ ] Confirm Y-DNA Big Y-700 results landing window (~Jul 2026) — re-run audit and dossiers.
