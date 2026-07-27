# Reading proposals — 2026-07-27

> The Librarian. Recommendations derived from `books.json` — the log is the profile, so it cannot drift from what was actually finished. **Propose, never publish**: nothing here edits `books.json`, and merging this PR is the approval.

**8** candidate(s) · **1** survived review · **7** withheld

Profile: 27 finished titles. Endpoint: `https://flcason.com/api/consensus`.

### How each of these was checked

1. **Cited** — the proposing model had to state where it knows the book from. No citation, no consideration.
2. **Scored** — a separate model pass researched the claim and the citation and scored it 0-100, instructed to be hostile. That pass never sees the reading profile, so it cannot be swayed by how well the book fits.
3. **Catalogued** — Open Library, an objective third party.

A catalogue miss is *expected* for a genuinely forthcoming title and is not held against it; those are judged on the citation instead, at a higher bar (70/100 vs 40/100) precisely because nothing else can corroborate them. A title claimed as already published that the catalogue has never heard of is treated as invented.

---

## Proposed

### The Coming Wave

**Mustafa Suleyman** · `verified` · first published 2023

Addresses AI power structures and governance risks, aligning with the reader's shift from hospitality operations to AI memory systems.

- **Citation offered:** Crown Publishing announcement, September 2023
- **Independent score:** 65/100 (publisher)
- **Reviewer said:** Mustafa Suleyman is a known AI figure whose expertise matches the topic; Crown is his plausible publisher and a September 2023 announcement date aligns with the actual release window I recall.
- **Reviewer's own caveat:** exact title phrasing and citation wording could still be slightly misremembered
- **Verdict:** Open Library confirms title and author; citation scored 65/100
- **Gate:** `allow`

---

## Withheld — shown on purpose

Kept visible rather than quietly dropped: the count is the honest measure of how much to trust a model on this question at all.

| Title | Author | Claimed | Score | Verdict | Why |
|---|---|---|---|---|---|
| Co-Intelligence | Ethan Mollick | published | 65 | `unverified` | claimed already published, but no catalogue record and the citation scored only 65/100 — nothing independent supports it |
| Nexus | Yuval Noah Harari | published | 15 | `unsupported` | citation rejected on review (vague, scored 15): No book titled Nexus by Harari appears in established knowledge of his output; the title fits his thematic style too neatly and the Random House catalogue citation is too imprecise to verify. |
| The Singularity Is Nearer | Ray Kurzweil | published | 25 | `unsupported` | citation rejected on review (vague, scored 25): Kurzweil exists and wrote the 2005 book, but this near-identical sequel title plus a bare June 2024 publisher announcement citation cannot be substantiated from known facts and matches the pattern of plausible fabrication. |
| Brave New Words | Salman Khan | published | 15 | `unsupported` | citation rejected on review (vague, scored 15): Salman Khan's only known book is The One World Schoolhouse (2012); no record of Brave New Words exists in my knowledge, and the title fits the exact pattern of a plausible fabrication. |
| Scaling People | Claire Hughes Johnson | published | 35 | `unsupported` | citation rejected on review (vague, scored 35): Author exists and topic fits her Stripe background, but title is suspiciously on-the-nose and the 'Stripe Press catalogue listing' citation is too generic to verify without external lookup. |
| Power and Prediction | Ajay Agrawal, Joshua Gans, Avi Goldfarb | published | 25 | `unsupported` | citation rejected on review (none, scored 25): Authors exist and work in this area, but the title is suspiciously close to their known 2018 book Prediction Machines, a classic fabrication signature; no specific knowledge confirms this 2022 title or ISBN. |
| The Worlds I See | Fei-Fei Li | published | 65 | `unverified` | claimed already published, but no catalogue record and the citation scored only 65/100 — nothing independent supports it |


---

*To accept: add the title to `books.json` when finished. The Librarian never writes it — that is the point.*
