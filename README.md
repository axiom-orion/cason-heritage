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
| `.og-builder/` | Playwright-based screenshot tool for regenerating `og-image.png`. Excluded from deploys. |
| `.vercelignore` | Tells Vercel which folders not to upload. |
| `.gitignore` | Standard ignores for Vercel link, node_modules, OS junk. |

## Regenerating the share card

```sh
cd .og-builder
npm install            # first time only
node screenshot.js     # writes ../og-image.png
```

## Deploying

Vercel is connected. Push to the main branch and a production deploy fires automatically. To deploy from the command line:

```sh
vercel --prod
```

## Design system

The visual system (parchment, gold leaf, rust, deep navy; three-font chorus of Playfair Display + Source Serif 4 + Source Sans 3) was formalized in a separate handoff bundle and the token vocabulary is now inlined at the top of `index.html` under `:root`. The bundle itself (`.design-handoff/`) is referenced but not tracked — re-extract from the source zip if needed.

## Domain

- Primary: https://flcason.com
- Vercel alias: https://cason-heritage.vercel.app
