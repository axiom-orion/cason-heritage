# Cason Heritage — _Into the Unknown: The Cason Line_

A single-page heritage narrative tracing eleven generations of the Cason family from Hertfordshire, England (1608) to the Space Coast of Florida (1957).

**Live:** https://flcason.com

## What this is

One self-contained HTML file (`index.html`) with the full story — hero, prologue, four narrative chapters, an evidence board, a timeline of eleven generations, family-tree SVGs, an interactive Leaflet map of the migration, and the closing "Pattern" essay. No build step. No framework. Open in a browser and it works.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | The site. 2,280-line self-contained HTML/CSS/JS. |
| `og-image.png` | 1200×630 social-share card. Referenced from the page's `og:image` / `twitter:image` meta tags. |
| `og-image.html` | The design source for the share card. Edit, then regenerate the PNG with the script below. |
| `.og-builder/` | Playwright screenshot tool for `og-image.png`. Local tooling — not tracked in the repo. |
| `.vercelignore` | Tells Vercel which folders not to upload. |
| `.gitignore` | Standard ignores for Vercel link, node_modules, OS junk. |

## Regenerating the share card

`og-image.html` is the design source for `og-image.png`. The Playwright tool that renders it (`.og-builder/`) is local-only — keep it in your working copy, then:

```sh
cd .og-builder
npm install            # first time only
node screenshot.js     # writes ../og-image.png
```

## Deploy & contribute

The repo is connected to Vercel (project `cason-heritage`, `vorion` team). Every push to `main` ships a production deploy automatically; pull requests get their own preview URL. There's no build step — it's served as static files. To deploy by hand instead:

```sh
vercel --prod
```

Visitors can send in fixes: the footer of the narrative and the ledger carries a **"Submit a correction or document"** button wired to a GitHub Issue Form ([`.github/ISSUE_TEMPLATE/correction.yml`](.github/ISSUE_TEMPLATE/correction.yml)) — corrections, additions, supporting documents/scans (drag-and-drop attachments), and citations all land as labeled issues. (Needs a free GitHub account; swap in a Tally/Formspree form for a no-login path.)

## Design system

The visual system (parchment, gold leaf, rust, deep navy; three-font chorus of Playfair Display + Source Serif 4 + Source Sans 3) was formalized in a separate handoff bundle and the token vocabulary is now inlined at the top of `index.html` under `:root`. The bundle itself (`.design-handoff/`) is referenced but not tracked — re-extract from the source zip if needed.

## Domain

- Canonical: https://flcason.com — the apex, served directly
- `www.flcason.com` redirects to the apex
- Vercel alias: https://cason-heritage.vercel.app
