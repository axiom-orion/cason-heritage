---
name: cason-heritage-design
description: Use this skill to generate well-branded interfaces and assets for the Cason Heritage family-history project (Into the Unknown: The Cason Line), for production or throwaway prototypes/mocks/decks/etc. Contains essential design guidelines, colors, type, fonts, assets, and a UI kit modeled on the existing single-page heritage narrative.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `ui_kits/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Guard rails specific to this brand:

- The voice is **literary, declarative, archival** — third-person, short hammered sentences, never "you" or "we", never emoji. Match the cadence of the existing site before inventing copy.
- Use the **three-font chorus**: Playfair Display (display + numbers), Source Serif 4 (body), Source Sans 3 (eyebrows + captions + dates). Never sans for body. Never invent a fourth family.
- When you need to switch to self-hosted production font files, open `/brand-fonts.html`. It provides the exact flow for selecting Display/Headings and Body Serif files, live previews against the deck and heritage components, and guidance for permanent installation in `assets/fonts/`.
- Use the **parchment-and-gold-leaf** palette from `colors_and_type.css`. Do not introduce cool grays, neons, or saturated blues outside the existing `--deep-blue` token.
- Imagery is **warm, sepia, restrained**. The site uses none in the source — prefer SVG diagrams, maps, and typographic compositions until photography is approved.
- Iconography is **almost absent** — prefer typographic glyphs (`•`, `→`, `—`) and CSS dots. If a true icon is required, use Lucide stroked at `1.5–2px` in `--gold`.
