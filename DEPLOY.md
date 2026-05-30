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
