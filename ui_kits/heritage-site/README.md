# Heritage Site — UI Kit

A high-fidelity, modular recreation of **Into the Unknown: The Cason Line** as interactive React components. The original source is one 2,159-line HTML file; this kit refactors it into reusable JSX so any of these elements can be lifted into new heritage-narrative pages.

## Files

- `index.html` — the assembled page. Open this to see all components composed in their natural order. Click "Begin the Journey" / scroll, expand generation cards, hover the timeline.
- `components.jsx` — primitive components exported to `window`: `Eyebrow`, `Pullquote`, `StatGrid`, `Divider`, `SourceLink`.
- `Hero.jsx` — full hero unit: title, subtitle, tagline, hero-moments rail, dates, scroll-hint chevron.
- `StickyNav.jsx` — backdrop-blurred section nav + reading-progress bar.
- `GenCard.jsx` — timeline generation card (default · highlight · gap variants).
- `Timeline.jsx` — the alternating-rail timeline with center spine and gold-dot markers.
- `EvidenceTable.jsx` — the evidence-board candidate-elimination table with status row tints.
- `MapSection.jsx` — placeholder hero for the Leaflet map area + legend (real map omitted to keep the kit dependency-light).
- `Closing.jsx` — the parchment→deep-blue closing section.
- `SourcesFooter.jsx` — three-column sources grid on deep-blue.

## Design fidelity

- Every color and spacing decision pulls from `../../colors_and_type.css`.
- No new fonts or palette additions.
- Map is intentionally a stylized placeholder (full Leaflet integration lives in the source `cason-heritage/index.html` — copy it from there when needed; it is a couple hundred lines).
- Cards are click-to-expand. Sticky nav reveals after the hero leaves view.
