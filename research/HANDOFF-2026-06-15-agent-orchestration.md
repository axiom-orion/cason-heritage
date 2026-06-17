# Agent Orchestration Build — Handoff & Status (2026-06-15)

A durable snapshot of where the `claude/flcason-agent-orchestration-9adb4y` work stands,
written before a deliberate close-everything / reassess pass. Branches survive PR closure,
so nothing below is lost when the PRs are closed — this note records what each branch is,
what's verified, and what's still open to decide.

Build staging follows `research/VORION-GOVERNANCE.md` §10.

## Where we are on the §10 ladder

| Stage | What | Status | Where |
|---|---|---|---|
| **Stage 0** — wire the federation seam | `memory-client.js` ↔ real `agent-memory-service`; gate-contract conformance | **DONE — merged to `main`** | cason #33 (gate-contract), cason #34 (`pagVerify` seam), agent-memory-service #5 (PAG endpoints), `.github` #2 (coordination doc) |
| **Stage 1** — attest consensus independence | bind §4 fingerprints to `require-model-consensus`; reject same-instance "consensus" (§7-2a, part **a** only — NOT the Red-Cell mode) | **NOT BUILT** — repeatedly blocked by transient server rate-limiting; no branch/code exists yet | — (spec: §10 Stage 1, §7-2a) |
| **Stage 2** — H7 standing-claim reconciliation | replay each standing claim's provenance vs current evidence; trip a drift PR on divergence | **BUILT + CI-green, OPEN PR** | cason **#35** · branch `claude/h7-standing-claim-drift` |
| **Stage 3** — PAG crypto | content-address + sign memory/audit writes; agent/model identity per entry; replay snapshot | not started | — |
| **Stage 4** — public-claim honesty pass | `/proof` labels never exceed §9 ledger | not started | — |
| **S0** — weight-space fingerprint | pin HF revision + at-rest artifact SHA-256, land at model load (loaded-state fingerprint already in `main`) | **BUILT + CI-green, OPEN PR** | genealogy-graphrag **#6** · branch `claude/s0-weight-fingerprint` |
| **S1–S3** — self-host ladder | CI swap-test; self-hosted Scribe (Cloud Run GPU, gated on OCR eval corpus); weight-attested triad voice | not started | — |

## Open PRs from this session (CI-green; ready, awaiting reassess/merge decision)

- **cason-heritage #35** — `feat(drift): H7 provenance-replay` (Stage 2).
  Adds ONE invariant (`provenance-replay`) to `scripts/drift-audit.js`'s battery + a helper;
  flags *retracted* and *superseded* sources under still-standing claims; read-only,
  never touches `data.js`. `selftest:all` green (drift 33/33); live `--dry-run` replays 96
  standing claims, all 7 invariants pass. Branch: `claude/h7-standing-claim-drift`.
  - **Reassess note:** the dev branch `claude/flcason-agent-orchestration-9adb4y` carries an
    EARLIER H7 attempt (commit `49c8dad`, "H7 post-commit reconciliation — claims replayed
    against the attested baseline"). #35 is the cleaner, count-vs-chain-aware successor.
    Decide which to keep; they should not both land.

- **genealogy-graphrag #6** — `S0 §10: land pinned HF revision + at-rest artifact SHA-256 at
  model load`. The loaded-state fingerprint had *already* merged to `main` (`554e7f2`); this
  only closes the two §10 gaps (revision pin + artifact SHA wiring), graceful-degrades when
  weights aren't local. `test_attest.py` 15→20, `--demo` S0 gate passes. The 2 `test_pipeline.py`
  errors are pre-existing (offline `sentence_transformers`), green in CI. Branch:
  `claude/s0-weight-fingerprint`.

## Not built — Stage 1 (consensus independence)

The only Stage-1/2/S0 stream that did not land. Three subagent attempts all died on a
**transient server-side rate-limit** (not a code blocker, not a usage limit) before writing
code. Nothing exists on disk or remote for it.

When resumed, the scoped task is part **(a)** of §7-2 only: in the consensus check
(`governed-agents/lib/consensus.ts` canonical → `cason/api/consensus.js` + `governance.js`
port, keeping `contract/gate-contract.json` in sync), count agreement by **distinct attested
model instance**, and make `require-model-consensus` REJECT a consensus whose voices resolve
to the same instance even when the raw count ≥2. Benchmark: a forced same-model "consensus"
is rejected. The Red-Cell adversarial *mode* (§7-2b) is explicitly a later, separate stream.

## Branch inventory (code persists even if PRs close)

- `claude/h7-standing-claim-drift` — Stage 2, on origin (PR #35).
- `claude/s0-weight-fingerprint` — S0, on origin (PR #6).
- `claude/consensus-attested-independence` — does not exist (Stage 1 unbuilt).
- Merged & retired: `claude/gate-contract-conformance` (#33), `claude/seam-pag-verify` (#34).
- `claude/flcason-agent-orchestration-9adb4y` (this dev branch) — carries the superseded
  earlier H7 attempt noted above; review before reusing.

## Operational notes for the reassessment

- **`send_later` / self-check-in scheduling is NOT available** in this session, so no
  hour-out PR re-checks were armed; rely on webhook events.
- Rate-limiting was the session's main friction — sequential (not 3-way concurrent) builds
  avoid it.
- House discipline held throughout: extend-don't-rename (§2 B6), every change selftest-gated,
  propose-never-publish, qualified claims, no model identifiers in any pushed artifact.
