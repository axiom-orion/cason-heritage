# Reading proposals — 2026-08-01

> The Librarian. Recommendations derived from `books.json` — the log is the profile, so it cannot drift from what was actually finished. **Propose, never publish**: nothing here edits `books.json`, and merging this PR is the approval.

**8** candidate(s) · **8** survived review · **0** withheld

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

Directly addresses AI governance, power structures, and scaling infrastructure for a reader moving from hospitality operations into AI systems.

- **Citation offered:** Crown Publishers catalogue listing, ISBN 9780593593950, pub date September 2023
- **Independent score:** 85/100 (publisher)
- **Reviewer said:** Mustafa Suleyman is a real AI figure and this exact title matches his 2023 Crown release on technology and power.
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### Co-Intelligence

**Ethan Mollick** · `attested` · 2024

Practical guidance on integrating AI into workflows and decision-making, aligning with the reader's shift toward AI memory and governance tools.

- **Citation offered:** Portfolio/Penguin Random House catalogue, ISBN 9780593833483, pub date 2024
- **Independent score:** 85/100 (publisher)
- **Reviewer said:** Ethan Mollick's Co-Intelligence: Living and Working with AI was released by Portfolio in April 2024.
- **Reviewer's own caveat:** ISBN or exact subtitle could be slightly misremembered
- **Verdict:** not in the catalogue, whose coverage of recent titles is incomplete, but the citation survived review at 85/100 (publisher) — treated as uncorroborated, not disproven
- **Gate:** `allow`

### Nexus

**Yuval Noah Harari** · `verified` · first published 2024

Explores information networks and memory systems across history, relevant to building AI memory infrastructure.

- **Citation offered:** HarperCollins publisher announcement and ISBN 9780063286931, pub date 2024
- **Independent score:** 35/100 (publisher)
- **Reviewer said:** No record in my knowledge of Harari publishing a 2024 book titled Nexus; the title is suspiciously on-brand for his prior work on networks and technology.
- **Reviewer's own caveat:** A 2024 title may simply post-date my training data
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### Power and Progress

**Daron Acemoglu** · `verified` · first published 2023

Economic and governance analysis of technology adoption, fitting the reader's Sowell background and AI infrastructure focus.

- **Citation offered:** PublicAffairs catalogue listing, ISBN 9781541702530, pub date 2023
- **Independent score:** 50/100 (publisher)
- **Reviewer said:** Daron Acemoglu is a known author in this area, and 'Power and Progress' sounds highly plausible for his work. However, I have no specific knowledge confirming this particular book's existence by him, especially given its recent claimed publication date.
- **Reviewer's own caveat:** My internal knowledge may not be current enough for a 2023 publication, or the title, while plausible, could be a fabrication designed to sound like this author's work.
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### Same as Ever

**Morgan Housel** · `verified` · first published 2023

Timeless principles of decision-making and risk that complement the reader's economics and scaling titles.

- **Citation offered:** Portfolio/Penguin Random House listing, ISBN 9780593332702, pub date 2023
- **Independent score:** 75/100 (publisher)
- **Reviewer said:** Morgan Housel is a real author in behavioral finance; Same as Ever matches his 2023 release on timeless principles.
- **Reviewer's own caveat:** Title is suspiciously on-brand, raising fabrication risk despite no direct contradiction in knowledge
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### Slow Productivity

**Cal Newport** · `verified` · first published 2024

Operational frameworks for sustainable high-performance work, bridging hospitality operations experience with AI-era execution.

- **Citation offered:** Portfolio publisher page, ISBN 9780593544853, pub date 2024
- **Independent score:** 48/100 (publisher)
- **Reviewer said:** Cal Newport is real and writes in this exact niche, but I have no memory of a 2024 book titled Slow Productivity and the title matches his brand so precisely it raises fabrication risk.
- **Reviewer's own caveat:** publication date after my knowledge cutoff
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### Supercommunicators

**Charles Duhigg** · `verified` · first published 2024

Advanced communication strategies that extend the reader's existing titles on leadership and conversation.

- **Citation offered:** Random House catalogue, ISBN 9780593732335, pub date 2024
- **Independent score:** 45/100 (publisher)
- **Reviewer said:** Duhigg is a real author in this genre but no memory of a 2024 title matching this one; the specific ISBN does not trigger recognition of a known book.
- **Reviewer's own caveat:** recent title outside knowledge cutoff; ISBN could be fabricated or misassigned
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`

### The Anxious Generation

**Jonathan Haidt** · `verified` · first published 2024

Societal impacts of technology platforms, informing governance considerations in AI infrastructure.

- **Citation offered:** Penguin Press listing, ISBN 9780593655030, pub date 2024
- **Independent score:** 85/100 (publisher)
- **Reviewer said:** Haidt's 2024 Penguin book on youth mental health and smartphones matches his established research trajectory and was released under this title.
- **Reviewer's own caveat:** ISBN digit transposition or subtitle variation could falsify the exact citation
- **Verdict:** Open Library confirms title and author
- **Gate:** `allow`


---

*To accept: add the title to `books.json` when finished. The Librarian never writes it — that is the point.*
