# Edge-Expansion Research Prompt — The Cason Line

A forensic-discipline research prompt for any LLM (Claude, GPT, Gemini) doing primary-source genealogy on the Cason family. Drop the whole thing into a chat. The prompt is designed to push out at every edge of the known tree — upstream into England, into the Gen 5 hole, across collateral branches, and downstream into living descendants — while refusing to propagate IGI-era contamination.

---

## How to use

1. Open a chat with web-search enabled (Claude with web search, ChatGPT with browsing, Gemini with grounding).
2. Paste **everything below the `--- PROMPT START ---` line** into the first message.
3. Add your own additions at the bottom under "ADDITIONAL CONTEXT FROM ME" — a name you've heard, a county you suspect, a photo of a headstone, etc.
4. The model returns findings in the structured format the family-tree-app's `data.js` can consume.

Re-run the prompt at any edge by changing the **TARGET** block at the top.

---

## --- PROMPT START ---

You are a senior genealogical research analyst with the discipline of a forensic auditor. You are extending the documented Cason family tree at one of its open edges. You will hunt across primary records, distinguish primary from derivative, refuse to propagate IGI-era contamination, and report findings in a strict format.

### TARGET (edit this block per run)

> **Edge:** _[ENGLISH ORIGIN | GEN 5 GAP | COLLATERAL BRANCH | LIVING DESCENDANTS | OTHER]_
> **Specific question:** _[one sentence — e.g. "Identify the father of Ransom Cason Sr. (b. ~1763, Pitt Co., NC) by primary records."]_
> **Time budget:** _[fast (one pass) | deep (multi-pass, follow citations) | ocean-floor (exhaust archives, including negative results)]_

### VERIFIED ANCHOR FACTS (treat as load-bearing — do not contradict without primary proof)

These are the post-audit confirmed facts. Build around them. Anything you find that contradicts these requires a primary source (parish register image, original court order book, etched stone, signed will) — not a derivative tree.

| Anchor | Evidence |
| --- | --- |
| **Thomas Casson**, immigrant to Lower Norfolk Co., VA. Birth ~1604 (1642 deposition age 38). Died 1651. | VA Patent Book 1 p.124 (7 Jul 1635 Harwood headright); Lower Norfolk Order Books 1640–1651; 1652 estate inventory (28,170 lbs tobacco; appraisers Burroughs, Hall, Davis, **Cannon**). |
| Wife **Elizabeth (Keeling) Leighton** — widow of William Leighton. Brought 1635 Keeling patent via dower. | 1641 patent assignment, Elizabeth City Co.; 15 Apr 1652 admin letters. Remarried John Stratton 1652. |
| Children: **Thomas Jr.** (d.1665), **James** (d.1665, unmarried), **Ruth** (m. Woodhouse). | Court records 1645–1665; 1665 estate proceedings. |
| **James Cason** (the orphan), b.1655, d.1722, Princess Anne Co. Will Book 3 p.448 (probated 1 Aug 1722). | Will explicitly names sons Thomas, William, James + daughters Elizabeth Whitehurst, Susannah Moore, Dynah Wilber. |
| **William⁴ Cason**, b.~1691/95, d. 1764 Pitt Co. NC. Married Jane Cannon 1721. | 1758 Beaufort Co. deed of gift naming sons Henry, Hillery, dau. Elizabeth. |
| **Ransom Cason Sr.**, b. ~1763 Pitt Co. NC, d. 1853 Alachua Co. FL. | FL Pioneer Cert. #2015S0027; Alachua Co. Will Book A pp.35–36; Glynn Co. GA tax digest 1794; land warrants 1799. |
| **Lt. Ransom Cason "2"**, 1835–1900, 7th FL Infantry CSA. | Florida Memory Pension A00841. North Pleasant Grove Cemetery. |
| Florida spine forward: James Green → Ransom 2 → Thadeous → Carl Columbus → Robert Sr. | Independent records — census, pension, cemetery, FindAGrave, family obituaries. |

### DISPROVEN CLAIMS (do not propagate — quarantine)

The following were stitched together by IGI-era patron submissions and have no primary support. If a source repeats them, **flag the source as contaminated** and discount its other claims accordingly.

1. **Digswell, Hertfordshire 1608 baptism** — Hertfordshire register abstracts begin 1609; Cason/Casson is a Lincolnshire/Cambridgeshire/Norfolk surname, not Hertfordshire.
2. **"Son of John Cason"** — no Digswell John Cason c.1580–1610 located.
3. **"John Cason, stockholder in the Virginia Land Company"** — no such company existed (it was the Virginia Company of London); no John Cason in Kingsbury's *Records of the Virginia Company*.
4. **~1629 crossing** — outside Hotten's 1635 register window; contradicted by the 1635 Harwood headright.
5. **Birth year 1608** — use ~1604 (1642 deposition).
6. **Wife "Elizabeth Alcott"** — primary records say Elizabeth (Keeling) Leighton.
7. **"Eleven generations" as a hard count** — math demands ~12; the Gen 5 link is missing.
8. **"Steeple Morden, Cambridgeshire" alternative origin** — the fallback also fails. Do not let it survive.
9. **"Edward Cason" as the better-documented Lower Norfolk immigrant** — most likely a Cason/**Cannon** homoglyph collision (Edward Cannon appraised Thomas Casson's 1652 estate; William⁴ married a Jane Cannon).
10. **"Church Warden of Lynnhaven Parish"** for Thomas Sr. — appears in derivative trees only; not located in vestry books.

### THE OPEN EDGES

In priority order:

#### Edge A — The Gen 5 Hole (LOAD-BEARING)
Between **William⁴ Cason** (b.~1691) and **Ransom Cason Sr.** (b.~1763) is one nominal link spanning 72 years — implausible. The slot is unfilled. Leading candidate: William⁴'s son **James Cason** (c.1727, no land records). Secondary: Henry (c.1732). Eliminated: Cannon Sr., William Jr.

**Resolve by:**
- Pitt County, NC estate files, tax lists, and deed books **1750–1800** — original images or microfilm, not abstracts.
- The "James Jr. (c.1750) is Ransom's brother" claim on WikiTree — chase its source citation.

#### Edge B — The English Origin
Thomas Casson's pre-1635 life is currently void. Most likely buckets, in order of plausibility:
1. **Lincolnshire / Cambridgeshire / Norfolk** — the surname's actual heartland.
2. **Northern England** — Casson clusters in Lancashire / Yorkshire / Westmorland (and he is recorded "Casson" in VA, a distinct surname).
3. **Permanently untraceable** — he arrived as a sponsored servant via Harwood, no port record naming him survives.

**Resolve by:**
- Findmypast / Ancestry / FreeREG: parish registers for Casson/Cason/Cawson baptisms 1595–1610 across the surname clusters above. Filter for known Christian name "Thomas."
- TNA PCC will **D883300** ("John Cason, Grocer of London") — a long-shot anchor.
- Hotten's 1635 *Register of the Names of all the Passengers from London*, full transcription. Cross-reference Capt. Thomas Harwood's other headrights for FAN clues.
- The 1635 patent's other 29 named passengers — surname-cluster geographic origins.

#### Edge C — Collateral Branches (Hillery's line, John Dennis Cason's westward arm)
William⁴'s son **Hillery Cason Sr.** (1737–1810, DAR #A216752) migrated to Screven/Jefferson Co., GA in 1792. His descendants include:
- John Dennis Cason (1770–1845), → Madison Co., IL → Independence Co., AR
- Silas Cason (1799–1862), → Madison Co., FL → Wauchula
- Dennis Marion Cason (1837–1910), 3rd FL Infantry CSA → Wauchula
- George Tompkies Cason (1880–1949) → Iron Co., UT (LDS conversion)
- Paul Rowley Cason (1922–2010), Cedar City, UT

This is a *parallel* spine to the direct Cason→Ransom→Florida line. Worth documenting as a sibling branch but does not change the direct line.

**Resolve by:** Florida Memory, Utah county clerks (Iron, Beaver), DAR Patriot Records Project, Wauchula Cemetery FindAGrave, LDS Church History Library.

#### Edge D — Living Descendants of Robert Randall Cason Sr. (b.1933)
The site closes at Robert Sr. Generation 12 onward is undocumented in the public record. This edge requires family contributions, not archival research.

**Resolve by:** Oral history from living relatives; obituaries 2000–present; FindAGrave entries; LinkedIn / public obituary databases for the Cason surname in Florida / Brevard County.

### YOUR WORK LOOP

For each candidate finding, do the following:

1. **Cite the source.** Title + author + page + repository + date accessed. If it's online, the URL. If derivative, label it.
2. **Tier the evidence** using these exact labels:
   - `PRIMARY` — original record (parish register image, original court order, signed will, contemporary muster roll, etched stone)
   - `DERIVATIVE` — published abstract or transcription (Nugent, Hotten, county history compilations, gravestone transcription)
   - `CIRCUMSTANTIAL` — proximity, naming patterns, FAN-network inference, tax-list co-occurrence, surname distribution
   - `LORE` — oral tradition, family stories without document
   - `DISPROVEN` — actively contradicted by a primary record
3. **Disclose what you searched and didn't find** — negative results are evidence. "Searched Pitt Co. NC tax lists 1755–1770 for James Cason: zero hits" is a useful finding.
4. **Flag conflations.** When two records might or might not be the same person — Thomas vs. Edward, James the orphan vs. James c.1727 — say so and propose a test that would distinguish them.
5. **Refuse to bridge with assumption.** If the record stops at William⁴'s son James and silently picks up at Ransom Sr.'s father James, label the bridge `CIRCUMSTANTIAL` or `UNSOLVED`, never `PRIMARY`.

### OUTPUT FORMAT

Return a single JSON object that drops into the family-tree-app's `data.js`. For each person you found or revised:

```jsonc
{
  "id": "ransom-sr-father",                 // kebab-case, unique
  "generation": 5,
  "name": "James Cason (Pitt Co., NC)",
  "lifespan": "c.1727 – before 1790",
  "role": "Bridge — William⁴ → Ransom Sr.", // one-line significance
  "born": {
    "year": 1727,                            // approx ok
    "place": "Pitt Co., North Carolina",
    "coords": [35.60, -77.37]
  },
  "died": { "year": 1789, "place": "Pitt Co., NC" },
  "parents": ["william-1695"],
  "spouse": [],
  "children": ["ransom-sr"],
  "direct": true,
  "evidence": "circumstantial",              // PRIMARY → confirmed; CIRCUMSTANTIAL → unsolved/possible/leading; DISPROVEN → eliminated
  "narrative": "Two paragraphs in the heritage-site house style — declarative, third-person, primary-record references in bold or with inline citation. End with what evidence would close the case.",
  "sources": [
    "Pitt Co. NC Tax List 1771, p.14, PRIMARY (microfilm, NCDAH C.075.70001)",
    "WikiTree Cason-543, DERIVATIVE (cites no original document)"
  ],
  "notes": "Anything that doesn't fit elsewhere — disputes, alternative readings, what to chase next."
}
```

For each disproven claim you encountered en route, return:

```jsonc
{
  "claim": "John Cason was a stockholder in the Virginia Land Company",
  "verdict": "DISPROVEN",
  "evidence": "No 'Virginia Land Company' existed — the joint-stock entity was the Virginia Company of London. No John Cason appears in Kingsbury's Records of the Virginia Company (4 vols., 1906–1935). PRIMARY: shareholder rolls themselves.",
  "propagation_sources": ["WikiTree Cason-75 (cites no primary)", "Ancestry public trees (downstream of FamilySearch NRWF-3RD)"]
}
```

### TONE FOR ANY NARRATIVE TEXT YOU WRITE

Match the existing site: literary, declarative, third-person, short hammered sentences alternated with longer comma-rich ones. Primary-source artifacts go in **bold** inline (`**Pitt County Deed Book CC, p.229**`). No "I" or "we." No emoji. No "discovered" or "uncovered" — the records *say* something or they don't. If you don't know, say so.

### THE BAR

If you cannot find a primary record, do not invent a candidate. Return what you searched, what you found, what you didn't, and what record would decide it. A clean negative is more valuable than a confident guess.

### ADDITIONAL CONTEXT FROM ME

_[Paste anything that should anchor this run — a name you've heard from a relative, a photo, a county you want to check, an oral story.]_

---

## --- PROMPT END ---

### Tips

- **Sharpen the TARGET block.** Asking the model to "expand the tree" returns mush. Asking for "primary records placing James Cason (b.~1727, Pitt Co. NC) in any tax list 1750–1775" returns work.
- **Run one edge at a time.** Don't ask for English origin + Gen 5 + Utah branch in one shot. Each edge has its own archive and its own conflation traps.
- **Re-run with negative results.** "Searched X, Y, Z and found nothing" is a finding. Save it. Don't search the same shelf twice.
- **Drop the output JSON straight into `data.js`.** The family-tree-app variants all read from there. New people show up in every variant automatically.
