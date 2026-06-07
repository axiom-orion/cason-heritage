# The Bloodhound — governed AI record-keeping for the Cason Line

*How the personas stop being storytellers and become **record-keepers**: agents that
sniff out relatives, run every claim to ground, and refuse — structurally — to let a
pretty derivative tree become "fact." This is the architecture behind "teach the AIs to
be the bloodhounds of record keeping."*

It sits one layer above [`edge-expansion-prompt.md`](./edge-expansion-prompt.md): that file
is the **field manual** a human hands to a model for one hunt; this file is the **system**
that runs hunts continuously, scores what comes back, and decides what — if anything —
earns a place in `data.js`.

---

## 0. The one law

> **Corroboration counts independent underlying SOURCES, not the voices that report them.**

This is the whole game, and the Grok episode proved why. Three different models all
"confirmed" Thomas's 1608 Digswell baptism, his father John Cason, his wife Elizabeth
Alcott, his Church-Warden office. That is **not** three confirmations. It is **one**
derivative source — WikiTree Cason-75, an IGI-era reconstruction — echoed three times. A
bloodhound that counts *reporters* gets louder as it gets more wrong. A bloodhound that
counts *sources* notices that the three voices all trace to one unsourced tree, and the
echo collapses to a single weak strand. Every rule below exists to enforce this law.

A corollary the Cason record already lives by: **a primary record outweighs any number of
derivative trees.** One 1635 Harwood headright patent (Patent Book 1, p.124) beats fifty
Ancestry trees that say 1608 Digswell.

---

## 1. The hunt loop (mirrors the persona's Perceive→…→Reflect)

Each persona already runs Perceive → Recall → Plan → Act → Reflect. The bloodhound is the
same shape, pointed outward at the archives instead of inward at memory:

```
Scent  →  Hunt  →  Retrieve  →  Extract  →  Corroborate  →  Adjudicate  →  Attach / Quarantine  →  Log
```

1. **Scent** — pick an open question (`gap` node) to chase. Each gap already names *the
   record that would resolve it* (see the Open Lines worklist). That target record IS the
   scent.
2. **Hunt** — formulate a typed query against the right archive for that record class
   (a Pitt Co. NC will; a Glynn Co. GA marriage bond; a Munden in a Currituck deed).
3. **Retrieve** — pull candidate hits. Each hit carries its **source identity** (the
   actual document, not the website that surfaced it).
4. **Extract** — turn prose into structured **claims**: `{subject, predicate, object,
   date?, place?, source, source_tier}` — e.g. `(ransom-sr, father_of?, james-1727,
   —, Pitt Co. NC, "Tax List 1771", PRIMARY)`.
5. **Corroborate** — gather every claim about the same fact, **de-duplicated by source
   identity**, and score independence (§3).
6. **Adjudicate** — a final pass assigns the evidence tier, writes the provenance, and
   decides: attach, hold, or quarantine (§4).
7. **Attach / Quarantine** — promote into the graph at its earned tier, or send it to the
   quarantine with a documented reason.
8. **Log** — append a content-addressed entry to the validation ledger (§5).

This loop is **governed first, clever second** — exactly like the persona engine's horizon
circuit-breaker. The cleverness (which archive, which query) is replaceable; the
governance (independence, quarantine, tiering, provenance) is load-bearing and never
bypassed.

---

## 2. How a bloodhound *finds* relatives (discovery)

**Gap-driven.** Discovery is not open-ended web-trawling; it is the worklist of `gap`
nodes the graph already derives plus the hand-authored root-questions (`AUTHORED_GAPS`).
Every gap is a typed research job:

| Gap (the scent) | Record class to hunt | Archive |
| --- | --- | --- |
| Father of Ransom Sr. (Gen-5 hole) | will · deed of gift · tax list naming a son Ransom | Pitt Co. NC — NCDAH |
| Phoebe Munden's parents & siblings | marriage bond · will · census household | Currituck / Princess Anne Co. NC–VA |
| Which brother married a Munden sister | marriage record · bond co-signers | Glynn Co. GA; Pitt Co. NC |
| DOB / death / place of each Ransom brother | census · grave · estate file | NC + GA + FL |
| Anne's surname (James the Orphan's wife) | marriage record · Anne-named legacy in a will | Princess Anne Co. VA |

**Edge-expansion (the tree grows outward).** The instant a relative is *attached*, the
extractor derives **new gaps for everyone they touch** — their parents, each sibling, the
spouse, and the spouse's whole family. Add Phoebe's father and you immediately owe gaps for
Phoebe's mother, her siblings, and the Munden line before Georgia. The tree is never
"done"; closing one edge opens three. This is the engine that makes the project *bigger
than imagined* — it is built to accrete forever.

**Two-directional corroboration (the prize move).** Some gaps can be approached from both
sides, and a match where the two paths meet is the strongest signal short of a primary
record:

> The "second Cason–Munden match" is being hunted **from the Cason side** (which of
> Ransom's brothers? → `james-jr-1750` and the unnamed others) **and from the Munden side**
> (`munden-sister` → whom did she marry?). If an independent Cason record names a brother
> who married a Munden, **and** an independent Munden record names a sister who married a
> Cason, and the two name the same couple — that convergence promotes the claim far above
> what either thin source could carry alone.

**Source tiers, ranked.** Discovery weights by source class before anything else:

- **PRIMARY** — parish register image, original court order book, signed will, contemporary
  muster roll, land patent, pension file, etched stone, enumerated census page.
- **DERIVATIVE** — published abstract/transcription (Nugent, Hotten, county histories),
  WikiTree/Ancestry trees, FindAGrave biographies, IGI.
- **TRADITION** — family oral history (e.g. "a sister married a brother"). Real, valuable as
  a *scent*, but it enters at `possible` and must be run to ground before it rises.

**Connectors (the adapter seam).** Today the "archive" is the multi-model consensus
endpoint (`api/consensus.js`) plus a human pasting model exports. The seam is built so live
record sources drop in later without touching the loop: FamilySearch API, Library of
Virginia, NC State Archives (NCDAH), Chronicling America, FindAGrave, census providers.
Same `personaRespond`-style adapter discipline the AI engine already uses.

---

## 3. How a bloodhound *validates* (the core)

Validation is four gates, in order. A claim must pass all four to rise above `possible`.

**Gate 1 — Source-independence de-duplication.** Collapse every supporting voice to its
**underlying source identity**. Three models citing WikiTree Cason-75 → **one** strand
(DERIVATIVE). A census page *and* a will *and* a gravestone → **three** strands. Independence
is the count *after* collapse. (This gate is what would have caught Grok's Gen-1 import on
its own.)

**Gate 2 — Corroboration threshold.**

| Independent strands | Best strand | Earns tier |
| --- | --- | --- |
| ≥2, with ≥1 PRIMARY | primary | `confirmed` |
| 1 PRIMARY, direct | primary | `confirmed` / `leading` (if indirect) |
| ≥2 DERIVATIVE, no primary | derivative | `secondary` |
| 1 DERIVATIVE only | derivative | `possible` |
| TRADITION only | tradition | `possible` |
| circumstantial bridge (no record names the link) | — | `unsolved` — **never** invented |

**Gate 3 — Consistency & conflict checks** (cheap, deterministic, catch fabrication):

- **Chronology** — born < married < died; a parent older than a child by a plausible gap
  (~14–55 yrs); a lifespan that isn't 120 years; a marriage not after a spouse's death.
- **Geography** — migrations form a continuous, period-plausible path (no teleporting a
  Pitt Co. planter to Glynn Co. and back in a year without a record).
- **Identity** — same name ≠ same person. The record warns of exactly this: **Ransom "2"
  (the 1835 Lieutenant, grandson) is not Ransom Jr. (Ransom Sr.'s son)**; Edward *Cannon*
  the 1652 appraiser is not a *Cason*. Name collisions are flagged, not merged.

**Gate 4 — The quarantine check** (§4). Reject on contact anything matching a DISPROVEN
claim.

A claim that fails a gate isn't deleted — it's recorded at the tier it earned (or
`unsolved`/`eliminated`) **with the reason**. Nothing is fabricated to fill a hole; the
hole is named.

---

## 4. The quarantine — disproven claims are sticky

The audit already eliminated a cluster of IGI-era fictions. The bloodhound formalizes them
into an **enforced registry** every incoming claim is checked against, so no model can ever
re-import them (Grok just tried):

| Quarantined claim | Why it stays dead |
| --- | --- |
| Thomas baptized 1608, Digswell, Herts | Digswell register abstracts begin **1609**, *after* the alleged baptism; Cason/Casson is a Lincs/Cambs/Norfolk surname, not Hertfordshire |
| Father "John Cason" | No such Digswell record; welded to an invented "Virginia Land Company stockholder" — no such company existed |
| Wife "Elizabeth Alcott" | The primary 1641 patent names her **Elizabeth (Keeling) Leighton**, relict of William Leighton |
| "Church Warden of Lynnhaven Parish" | Unsourced |
| "~1628/1629 crossing" | The documented crossing is the **1635 Harwood headright**, Patent Book 1 p.124; 1642 deposition gives age 38 (b. ~1604) |
| Cason ⇄ Cannon conflation | Edward Cannon was a 1652 *appraiser* of Thomas's estate, not kin |

Rules: a quarantine entry carries its **disproof and the primary basis for it**; an incoming
claim that matches is auto-rejected and logged (never silently dropped); the registry is
append-only; lifting an entry requires a *primary* record overturning the disproof, decided
by a human. The quarantine is the institutional memory that keeps the family record from
silently rotting back into folklore every time a fresh model is asked.

---

## 5. The validation ledger — auditable by construction

Every adjudication appends one content-addressed entry (same hashing idiom as the memory
graph's tamper-evident node ids):

```json
{
  "id": "claim:<hash(subject+predicate+object)>",
  "claim": "Ransom Cason Sr. is the son of James Cason (c.1727)",
  "strands": [
    { "source": "Pitt Co. NC Tax List 1771 p.14", "tier": "PRIMARY", "supports": "partial" },
    { "source": "WikiTree Cason-543", "tier": "DERIVATIVE", "supports": "yes" }
  ],
  "independent_strands": 2,
  "best_tier": "PRIMARY-partial",
  "checks": { "chronology": "pass", "geography": "pass", "identity": "pass", "quarantine": "clear" },
  "verdict": "leading",
  "conflicts": [],
  "decided_by": "adjudicator-pass",
  "decided_at": "2026-06-07",
  "supersedes": null
}
```

The ledger is the project's **proof surface**: anyone can see *why* a fact carries the tier
it does, which sources back it, and what was rejected en route. Promotions to `confirmed`
are human-gated. Nothing enters the tree without a ledger entry behind it.

---

## 6. Worked example — the open threads seeded this round

`data.js` now carries these as honest leads (`unsolved` / `possible`), each with a `gap` so
the worklist can dispatch a hunt:

- **`munden-father`**, **`munden-sister`** — Phoebe Munden's family, the Munden in-law
  branch. Scent: Currituck / Princess Anne Co. marriage bonds, wills, census households.
- **`james-jr-1750`** — the brother WikiTree names; `possible`, awaiting a primary record
  for his birth, death, and place of death.
- The **second Cason–Munden match** — chased two-directionally (§2) toward the convergence
  that would promote it.
- **Ransom Sr.'s brothers** — DOB / death / place for each, the user's explicit target;
  currently a single owned `gap`, because the honest answer today is *"we don't know how
  many there were."* The bloodhound's job is to make that sentence shorter over time.

None of these assert a fact. They assert a **question, a target record, and a place to
look** — which is exactly what a bloodhound needs to start running.

---

## 7. Phased build

- **P1 — done this round (data layer).** Seeded the Munden + brothers + Puckett edges as
  tiered leads; added owned root-questions so they surface in Open Lines; wrote this spec.
- **P2 — the validator (`research/validate.js`).** The four gates as pure functions over
  `{claim, strands}`; the enforced quarantine registry; the ledger schema. Deterministic,
  unit-testable, no network.
- **P3 — wire the corroborator.** Point the gap worklist at `api/consensus.js`, but make the
  adjudicator **collapse strands by source identity** before counting (Gate 1), so model
  agreement never masquerades as source agreement.
- **P4 — live connectors + autonomous edge-expansion.** Real archives behind the adapter
  seam; personas "inquire into their own roots" on a schedule, surfacing new findings into
  Open Lines for human promotion — the tree growing itself, under governance.

---

## 8. The guarantees (what "bloodhound" must never cost us)

1. **Never fabricate.** A gap stays a gap. `unknown` is a valid, common answer.
2. **Tier everything.** No claim enters without an evidence tier and its provenance.
3. **Independence over volume.** Louder ≠ truer; sources are counted after de-duplication.
4. **Quarantine is sticky.** Disproven stays disproven until a *primary* record says otherwise.
5. **Primary outranks derivative**, always.
6. **Human-gated promotion to `confirmed`.** The machine proposes; the family disposes.
7. **Full provenance.** Every fact can be walked back to the record — or to the honest
   admission that there isn't one yet.

A bloodhound that honors these doesn't just grow the tree. It makes the tree *trustable* —
which is the only kind of family record worth keeping.
