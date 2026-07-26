# Public record audit — 2026-07-26

> The public record auditing itself. Every claim published about the person or the estate, checked against a live source and run through the same typed gate as the family record. **Propose, never publish** — nothing here edits a page.

**20** claim(s) · **19** clean · **0** needs review · **1** BLOCKED

**Autonomy posture:** supervised — no correction is auto-applied — every published-record change routes to a human merge

## Blocked — an honesty violation, fix before this ships

### `cognigate-latency` — 8ms p50 / ~20ms p95

- **require-claim-basis** — claim has no machine check and no stated basis — it rests on nothing a reader can follow
- **no-unsourced-metric** — a metric is published with no machine-checkable source — produce the measurement or restate it as a target

UNRESOLVED — deliberately left unsourced so the gate blocks it. This figure reconciles with nothing: cognigate.dev publishes '~38ms median target / <120ms p99 budget' (explicitly design targets, not measurements), while vorion/docs/benchmarks/phase6-performance.md measures p50 12ms / p95 28ms — where 8ms appears as a *min*, not a p50. Resolve by restating as '~12ms p50 / ~28ms p95' with that file as an attested source, or by producing a measurement that yields 8/20.

## Every claim

| claim | kind | visibility | check | result |
|---|---|---|---|---|
| `cognigate-latency` | metric | public | unverified | ⛔ block · declared uncheckable |
| `livekit-pr-6474` | status | public | github-issue-state | ✅ allow · open |
| `livekit-issue-6473` | status | public | github-issue-state | ✅ allow · open |
| `heritage-people` | metric | public | record-count | ✅ allow · 101 |
| `heritage-generations` | metric | public | record-count | ✅ allow · 11 |
| `heritage-tiers` | metric | public | record-count | ✅ allow · 7 |
| `npm-basis-spec` | status | public | npm-package | ✅ allow · published |
| `site-vorion` | link | public | http-ok | ✅ allow · 200 |
| `site-cognigate` | link | public | http-ok | ✅ allow · 200 |
| `site-bai-cc` | link | public | http-ok | ✅ allow · 200 |
| `site-beodraft` | link | public | http-ok | ✅ allow · 200 |
| `site-agentanchor` | link | public | http-ok | ✅ allow · 200 |
| `site-aurais` | link | public | http-ok | ✅ allow · 200 |
| `site-governed-agents` | link | public | http-ok | ✅ allow · 200 |
| `site-footed` | link | public | http-ok | ✅ allow · 200 |
| `bai-stewarding-tests` | metric | public | attested | ✅ allow · ok |
| `repo-estate-scan` | metric | public | attested | ✅ allow · ok |
| `provisional-patent` | credential | public | unverified | ✅ allow · declared uncheckable |
| `nist-rfi` | credential | public | unverified | ✅ allow · declared uncheckable |
| `hospitality-years` | narrative | public | unverified | ✅ allow · declared uncheckable |

**1 claim(s) BLOCKED — the run exits non-zero.**
