# ATDD Checklist — Governance, Story: The Cason↔Causey Refusal

**Date:** 2026-06-09
**Author:** the Keeper (orchestration track)
**Primary Test Level:** Unit / API (the policy gate is a pure function; no UI surface)

> Produced with the BMad TEA ATDD workflow. The acceptance test and the demo are
> one artifact: a Y-DNA haplogroup exclusion is a *near-objective* "this merge is
> wrong", so the governor must refuse it **and record the refusal** to the audit
> trail. RED → GREEN both verified below.

---

## Story Summary

The governance gate can already block quarantined myths and revived ruled-out
ancestors. It cannot yet enforce the strongest, most objective genealogical
constraint: a Y-chromosome haplogroup is patrilineal, so two surnames in distinct
haplogroups **cannot** share a direct paternal line. This story adds that rule.

**As a** keeper of a provenance-grounded lineage
**I want** the gate to refuse any record that merges two patrilines a Y-DNA
exclusion keeps apart (Cason↔Causey), and to log that refusal
**So that** a provably-wrong merge can never enter the record, and the refusal is
an inspectable, replayable artifact — the system's acceptance test and its demo.

---

## Acceptance Criteria

1. A `merge_persons` / `link_patriline` (or a `write_record` asserting a patriline)
   that links **Cason** and **Causey** is decided **`block`**.
2. The blocking violation is the named rule **`no-haplogroup-conflict`**, severity
   **block** (hard, not review).
3. The refusal is recorded to the NDJSON audit trace as a **`halted`** event whose
   reason names the exclusion and the excluded line.
4. The rule is **precise**: merging two *Cason* records is not haplogroup-blocked,
   and merely *mentioning* a Causey neighbour (no patriline claim) is not blocked.
5. The exclusion data is **order-independent** (`excludes('Causey','Cason')` ==
   `excludes('Cason','Causey')`).

---

## Failing Tests Created (RED Phase)

### API / Unit Tests (8 assertions)

**File:** `tests/cason-causey-refusal.test.js` (~95 lines) · runner: `node` (the
repo's `selftest:*` convention; the SUT is a pure gate function — no browser).

- ✅ **Test:** a Cason↔Causey paternal merge is BLOCKED
  - **Status (RED):** FAIL — gate returns `allow`; the `no-haplogroup-conflict`
    rule does not exist in `buildKeeperPolicy` yet.
  - **Verifies:** AC 1.
- ✅ **Test:** the blocking violation is `no-haplogroup-conflict`
  - **Status (RED):** FAIL — no such violation produced.
  - **Verifies:** AC 2.
- ✅ **Test:** the trace's `halted` reason names the haplogroup exclusion + Causey
  - **Status (RED):** FAIL — decision had no violations, so the reason was empty.
  - **Verifies:** AC 3.
- ✅ Negative controls (within-Cason merge; Causey-neighbour mention) and the
  order-independence / severity / trace-shape checks **passed in RED already** —
  they assert the rule's *precision* and the surrounding contract, which existed.

---

## Data Factories / Fixtures Created

No `@faker-js/faker` factories — genealogical constraints are **curated, not
random**. The fixture is a small honest dataset:

### Y-DNA Exclusion Fixture

**File:** `ui_kits/living-line/dna-exclusions.js`

**Exports:** `exclusions` (array), `excludes(a, b)`, `firstExcludedPair(surnames)`.

**Honesty:** records the *constraint and its basis*, **not** invented lab results.
Specific haplogroup calls are `null` until the family attaches surname-project
panel IDs; the exclusion carries an honest `evidence` tier (`leading`) until then.
A fabricated haplogroup code in the governor would be worse than an open one.

---

## Mock Requirements

**N/A.** The system under test is a pure, synchronous function
(`evaluatePolicy`) over in-memory data — no network, no external service, no
stubs. Determinism is structural.

## Required data-testid Attributes

**N/A.** No UI is under test in this story. (A future "glass-box" pane that
renders the `.trace.ndjson` would carry `data-testid`s; out of scope here.)

---

## Implementation Checklist (GREEN — all complete)

### Test: a Cason↔Causey paternal merge is BLOCKED (+ violation + trace reason)

**File:** `tests/cason-causey-refusal.test.js`

- [x] Add the `dna-exclusions.js` fixture (Cason↔Causey, honest provenance fields).
- [x] Add `makeNoHaplogroupConflict(exclusions)` to `ui_kits/living-line/governance.js`:
      fires on a merge/link (or a patriline-asserting record) whose surnames hit an
      excluded pair; returns a hard `block` violation naming the pair + basis.
- [x] Insert the rule into `buildKeeperPolicy()` (stable order, before overclaim).
- [x] Export `makeNoHaplogroupConflict`; update the module header rule list.
- [x] Wire it live: `scripts/keeper.js` loads `dna-exclusions.js` and passes
      `dnaExclusions` into the policy, so real runs enforce it too.
- [x] Run: `npm run test:acceptance` → ✅ 8/8 (GREEN).

**Estimated Effort:** ~2 hours · **Actual:** ~1 hour.

---

## Running Tests

```bash
npm run test:acceptance        # this story (node tests/cason-causey-refusal.test.js)
npm run selftest:governance    # the gate + trace contract
npm run selftest:kinship       # the kinship resolver
npm run selftest               # living-line invariants
npm test                       # the Playwright browser smoke suite (UI; unaffected)
```

---

## Red-Green-Refactor Workflow

### RED Phase ✅
All tests written; the 3 implementation-dependent assertions fail on the **missing
rule** (not test bugs); negative controls + contract checks pass. Verified locally.

### GREEN Phase ✅
Minimal rule added; all 8 assertions pass; no regression in the other three suites.

### REFACTOR notes
- The rule keys off `payload.surnames` when present, else word-boundary surname
  matches in the action text — kept narrow (requires a patriline/merge context) so
  a passing mention of a surname never false-positives.
- `no-eliminated-kin` (Seam 1) and `no-haplogroup-conflict` are siblings: both
  encode a curated "this is provably wrong" set as a hard-block policy rule.

---

## Test Execution Evidence

### RED (before the rule)

```
Acceptance — the Cason↔Causey refusal
  ✓ the exclusion is recorded and order-independent (Causey↔Cason)
  ✗ a Cason↔Causey paternal merge is BLOCKED
  ✗ ...the blocking violation is `no-haplogroup-conflict`
  ✓ ...the violation is hard (severity block, not review)
  ✓ the trace records a `halted` refusal event
  ✗ ...whose reason names the haplogroup exclusion and the Causey line
  ✓ merging two Cason records is NOT haplogroup-blocked
  ✓ merely mentioning a Causey neighbor (no patriline claim) is NOT haplogroup-blocked
5 passed, 3 failed.   (exit 1 — RED verified)
```

### GREEN (after the rule)

```
Acceptance — the Cason↔Causey refusal
  ✓ the exclusion is recorded and order-independent (Causey↔Cason)
  ✓ a Cason↔Causey paternal merge is BLOCKED
  ✓ ...the blocking violation is `no-haplogroup-conflict`
  ✓ ...the violation is hard (severity block, not review)
  ✓ the trace records a `halted` refusal event
  ✓ ...whose reason names the haplogroup exclusion and the Causey line
  ✓ merging two Cason records is NOT haplogroup-blocked
  ✓ merely mentioning a Causey neighbor (no patriline claim) is NOT haplogroup-blocked
8 passed, 0 failed.   (exit 0 — GREEN)
```

---

## Notes

- **Test level was chosen, not defaulted.** The constraint lives in a pure gate
  function, so the honest level is Unit/API — not an E2E browser test. The
  Playwright suite (`tests/smoke.spec.js`) still owns the UI, including the
  existing in-app Governance glass-box view.
- **Honesty bar held.** No haplogroup codes were invented; the exclusion is a
  documented constraint with an honest evidence tier and empty panel fields.
- **Next:** render the resulting `.trace.ndjson` (refusals included) in the public
  glass-box pane, turning "supervised-autonomous, here's the audit trail" into
  something on screen.
