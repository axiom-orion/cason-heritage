# Reading proposals — 2026-07-27

> The Librarian. Recommendations derived from `books.json` — the log is the profile, so it cannot drift from what was actually finished. **Propose, never publish**: nothing here edits `books.json`, and merging this PR is the approval.

**4** candidate(s) · **4** survived review · **0** withheld

Profile: 27 finished titles. Endpoint: `https://flcason.com/api/consensus`.

### How each of these was checked

1. **Cited** — the proposing model had to state where it knows the book from. No citation, no consideration.
2. **Scored** — a separate model pass researched the claim and the citation and scored it 0-100, instructed to be hostile. That pass never sees the reading profile, so it cannot be swayed by how well the book fits.
3. **Catalogued** — Open Library, an objective third party.

A catalogue miss is *expected* for a genuinely forthcoming title and is not held against it; those are judged on the citation instead, at a higher bar (70/100 vs 40/100) precisely because nothing else can corroborate them. A title claimed as already published that the catalogue has never heard of is treated as invented.

---

## Proposed

### Co-Intelligence

**Ethan Mollick** · `attested` · 2024

Directly addresses AI governance and practical infrastructure for a reader transitioning from hospitality ops to AI systems.

- **Citation offered:** Penguin Random House catalogue listing, pub date April 2024, ISBN 9780593716717
- **Independent score:** 75/100 (publisher)
- **Reviewer said:** Ethan Mollick is a real Wharton professor who writes about entrepreneurship and AI; the title and 2024 timing align with his known upcoming book on human-AI collaboration.
- **Reviewer's own caveat:** Exact title match to author's niche could still be a plausible fabrication if no ISBN verification exists
- **Verdict:** not in the catalogue, whose coverage of recent titles is incomplete, but the citation survived review at 75/100 (publisher) — treated as uncorroborated, not disproven
- **Gate:** `allow`

### The Coming Wave

**Mustafa Suleyman** · `verified` · first published 2023

Focuses on AI power structures and containment strategies matching the reader's governance work.

- **Citation offered:** Crown Publishing announcement and ISBN 9780593593950
- **Independent score:** 85/100 (publisher)
- **Reviewer said:** Mustafa Suleyman is a real AI figure whose 2023 Crown book The Coming Wave matches the claimed title, author, and year.
- **Reviewer's own caveat:** ISBN or exact subtitle could still mismatch if the citation is fabricated
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### Unmasking AI

**Joy Buolamwini** · `verified` · first published 2023

Examines bias and accountability in AI systems, relevant to infrastructure and ethical scaling.

- **Citation offered:** Random House publisher listing, October 2023 release
- **Independent score:** 50/100 (publisher)
- **Reviewer said:** The author, Joy Buolamwini, is a real and prominent figure in AI ethics whose work directly aligns with the claimed title. However, despite this strong thematic fit and her prominence, I do not have a confirmed recollection of this specific book by this title.
- **Reviewer's own caveat:** The title's extreme alignment with the author's work could be a sign of fabrication. Its recent claimed publication date (2023) means it might be a genuinely new release not yet firmly established in my knowledge base.
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### AI Snake Oil

**Arvind Narayanan and Sayash Kapoor** · `verified` · first published 2024

Critiques AI hype with evidence-based analysis suited to a technical builder with economics background.

- **Citation offered:** Princeton University Press catalogue, September 2024
- **Independent score:** 40/100 (vague)
- **Reviewer said:** Authors exist and work in this area, but the title is suspiciously on-brand and I have no independent knowledge of an actual published book by this name.
- **Reviewer's own caveat:** 2024 title outside my training cutoff; a real forthcoming book could exist
- **Verdict:** Open Library confirms title and author (the citation itself was thin, but the catalogue is the evidence here)
- **Gate:** `allow`


---

*To accept: add the title to `books.json` when finished. The Librarian never writes it — that is the point.*
