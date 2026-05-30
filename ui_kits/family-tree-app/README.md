# Into the Unknown — Family Tree App

A clickable family-tree app for the Cason line, presented as **four side-by-side design variants** on a Design Canvas. Each variant is a working interactive prototype using the same shared data model and component library, so you can mix and match before committing to one direction.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The host page. Opens a pan-zoom canvas with all four variants. Click any artboard's expand button to focus it fullscreen. |
| `data.js` | The entire eleven-generation Cason line as a single `CASON_DATA` object — people, relationships, places, eras, direct-line spine. Designed to grow: append a person to `people`, link them via `parents`/`spouse`/`children`, optionally mark `evidence: 'unsolved'` until verified. |
| `shared.jsx` | Cross-variant components: `PersonNode`, `PersonDrawer` (the unified "tap-to-expand" detail surface), `PhotoSlot` (drag-and-drop upload), `EvidenceBadge`, `ContributeCTA`, `AppHeader`. |
| `V1_Atlas.jsx` | **The Atlas.** Classic top-down branching tree on a parchment canvas. Direct line glows; eliminated branches dim. Pan/zoom + era filters + search. Tap a node → side drawer. |
| `V2_LongScroll.jsx` | **The Long Scroll.** Scroll-as-time. Vertical timeline with a year ticker that updates as you scroll, ancestors alternating around a center gold rail, and a persistent "where they were" panel on the right. |
| `V3_Migration.jsx` | **The Migration.** Map-as-tree. A stylized East-Coast-plus-England map with ancestors plotted at their last known locations; arcs between parent and child trace the migration. The geography IS the family structure. |
| `V4_Vault.jsx` | **The Vault.** Research/contribution two-pane. Searchable index on the left (sorted unsolved-first), focused dossier on the right with photo grid, oral-history upload slot, source list, and an "evidence needed" callout when the record is unsolved. Built for relatives doing the digging. |
| `design-canvas.jsx` | Starter component — handles pan/zoom, focus-mode, and artboard layout. |

## Trying it

1. Open `index.html`.
2. Use the design canvas controls to pan and zoom across the four variants.
3. Click the **expand** icon on any artboard's header to view it fullscreen.
4. Inside any variant, tap a person, drag a photo onto a slot, scroll the timeline, search the index — the prototypes are real.

## Data extension

Add a new person:
```js
'great-grandma-anne': {
  id: 'great-grandma-anne',
  generation: 10,
  name: 'Anne Cason',
  lifespan: '1895 – 1972',
  born: { place: 'Fort White, FL', coords: [29.92, -82.64] },
  parents: ['thadeous','georgia-mckinney'],
  spouse: ['some-husband-id'],
  children: ['her-kids'],
  direct: false,
  evidence: 'unsolved',
  narrative: '…',
  sources: ['family bible, p.4'],
}
```
…and it shows up in every variant.

## Built on

- `../../colors_and_type.css` — the Cason Heritage design system.
- React 18 + Babel standalone.
- No external icon font; the system uses typographic glyphs as its iconography rule.
