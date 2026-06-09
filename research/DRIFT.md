# The Drift Auditor — the system watches itself over time

The governance primitives (the horizon circuit-breaker, the quarantine, the typed
gate, the supersession ledger) each hold *at a point in time*. The Drift Auditor is
the layer that holds them **over** time: a scheduled self-audit that re-derives the
governed state, re-runs the load-bearing invariants, and attests to the result with a
content-addressed digest. It is the "self-aware over long horizons" piece — the
watcher that notices when the record, or the governance, has moved.

`scripts/drift-audit.js` · run it with `npm run drift-audit` · the scheduled run is
`.github/workflows/drift-audit.yml` (Mondays 14:00 UTC, just after the Keeper).

## What it checks (the invariants)

Each is the *same* load-bearing rule the build and the glass-box already enforce —
re-run here on a cadence so a slow regression can't hide:

- `knowledge-horizon` — no persona sees a generation beyond N+1 or a year past its own.
- `referential-integrity` — every kin id resolves to a real person.
- `quarantine-containment` — no disproven/eliminated claim surfaces as fact.
- `supervised-autonomy` — the gate's top tier stays unoccupied (no `write_record`
  is auto-allowed); `governance.autonomyPosture()` must still report supervised.
- `supersession-grounding` — every correction in the ledger is still documented in
  its subject's own `data.js` text (the ledger can't drift into invention).

## Invariant failure vs. drift — two different things

- **An invariant FAILURE is a regression.** It must never happen; the auditor exits
  non-zero so CI / the cron raises it. The self-test proves detection: an injected
  dangling kin reference fails `referential-integrity` while the others stay green.
- **Drift is the record evolving.** The attestation digest is a fingerprint of the
  governed state (people, tiers, sources, open lines, quarantine, and a per-persona
  voice/levity/horizon fingerprint). When the family corrects a tier or a persona's
  characterization, the digest changes — that is *expected*. The auditor reports the
  diff against `research/attestation.json` and refreshes that baseline, leaving an
  auditable trail of what changed and when.

## Propose, never publish

Like the Keeper, the auditor opens a **PR** with its report (`research/drift/`) and
the refreshed attestation; a human merges to accept an evolution, or treats a failure
PR as a bug to fix. It never edits `data.js`. Validate the auditor itself with
`npm run selftest:drift`.
