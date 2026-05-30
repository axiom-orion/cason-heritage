# Brand Fonts

Drop your font files here. The folder is already set up with the exact filenames you need.

## Just put the files in this folder

Replace the placeholder files with your real ones (keep the exact names):

- `playfair-display-700.ttf`   ← Display & Headings (main)
- `playfair-display-900.ttf`   ← Display & Headings (strong)
- `source-serif-4-400.ttf`     ← Body Serif (regular)
- `source-serif-4-600.ttf`     ← Body Serif (semibold)
- `inter-600.ttf`              ← Deck bold sans (optional)
- `inter-700.ttf`              ← Deck bold sans (optional)

## For Claude Design

1. Download the minimal set from Google Fonts:
   - Playfair Display (use 700 + 900)
   - Source Serif 4 (use 400 + 600)
   - Inter (use 600 + 700) — only if you want the bold sans for deck headings

2. Copy the real .ttf files into this folder with the names above.

3. Upload those same files directly to Claude Design when it asks for brand fonts.

## For local use in this project

The main files are already wired:

- `slides/index.html` (the audit deck)
- `index.html` (the main heritage narrative)
- `hub.html`
- `brand-fonts.html`

Just drop the real font files into this folder using the exact names, and the pages will use them.

You can also manually add this line after `colors_and_type.css` in any other page:

```html
<link rel="stylesheet" href="/assets/fonts/local-fonts.css">
```

## Current status

The 0-byte files currently in this folder are just placeholders so the structure and names are ready. Replace them with the real fonts.

Last updated: 2026-05
