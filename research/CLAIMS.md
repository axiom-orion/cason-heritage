# The Public Record Auditor — governing what the site says about *me*

The other thirteen agents govern the family record: assertions, with sources,
that go stale. The résumé at `/resume` and the portfolio at `/portfolio` are
structurally the same corpus — and until this agent they were governed by
nothing at all.

That gap was not theoretical. On 2026-07-26 both pages claimed the heritage
record held **66 individuals across 12 generations**. The attested record had
said **101 people** since the 6/10 baseline, and the direct line spans
**11** generations. The site's own drift auditor knew the résumé was wrong and
had no way to say so, because nothing connected the two.

## The one idea

**A published claim is a record with provenance.** Give it the same treatment:
a declared source, a tier of confidence, a gate that refuses the dishonest
shapes, and a human at the merge.

## The manifest

`claims.json` is the corpus. Every assertion published about the person or the
estate lives there with the source that backs it:

```json
{
  "id": "livekit-pr-6474",
  "claimKind": "status",
  "visibility": "public",
  "text": "Issue #6473 · PR #6474 — open, CI green",
  "appearsIn": ["resume.html"],
  "verify": { "method": "github-issue-state", "repo": "livekit/agents", "number": 6474, "expect": "open" }
}
```

`appearsIn` is load-bearing in both directions. It is how the auditor catches a
claim silently edited off a page — and it is how `visibility: internal` becomes
enforceable rather than remembered.

## The verifiers

| method | checks | notes |
|---|---|---|
| `github-issue-state` | is that issue/PR still open? | uses `GITHUB_TOKEN` for rate limit when present |
| `npm-package` | is that package actually published? | |
| `http-ok` | does that URL actually serve? | **GET, never HEAD** — `cognigate.dev` answers HEAD with 405 while serving fine |
| `record-count` | counts derived live from `data.js` | self-healing: the 66→101 class of drift cannot silently recur |
| `attested` | a real measurement a workflow cannot reach | must name a `source` **and** an `asOf`; it expires |
| `unverified` | honestly declared uncheckable | must carry a `basis`, and may not be a metric |

`attested` exists because real numbers live in private repos and offline
filings. Without an expiry it would be the loophole that launders every
unsourced figure, so an attestation older than `attestationMaxAgeDays` routes
to a human to re-check.

## The gate

Same engine as `governance.js`, new rules for a new corpus
(`ui_kits/living-line/claim-policy.js`):

| rule | severity | refuses |
|---|---|---|
| `require-claim-basis` | block | an uncheckable claim resting on nothing |
| `no-unsourced-metric` | block | a number with no receipt — prose is not a measurement |
| `no-internal-in-public` | block | proprietary content appearing in a public artifact |
| `claim-must-appear` | block | the manifest attests text the page no longer carries |
| `failed-check-needs-review` | review | a check that ran and failed |
| `drifted-value-needs-review` | review | the source now reads something else |
| `stale-attestation-needs-review` | review | an attestation past its horizon |
| `correction-needs-human-merge` | review | every correction, always |

`no-internal-in-public` is the load-bearing one. It is what turns "what is
proprietary" from something a person has to hold in their head under deadline
into a rule the gate enforces before anything ships.

The top autonomy tier is **unoccupied by design**, exactly as in the family
record: `correction-needs-human-merge` forces every proposed change to at least
`needs_approval`, so no policy path lets the auditor rewrite a page.
`autonomyPosture()` probes a clean correction and proves it still cannot reach
`allow`.

## Run it

```sh
npm run claim-audit              # verify every claim against its live source
npm run claim-audit -- --dry-run # no network, nothing written
npm run selftest:claims          # the refusals (23 assertions)
```

Exit code is non-zero when any claim **blocks**. Claims needing review do not
fail the run — that is what the PR is for. A network outage degrades a check
and says so; it never fabricates a pass.

## The first finding, and what fixing it taught

`cognigate-latency` blocked on the auditor's first run. Both pages published
`~8ms p50 / ~20ms p95` as measured fact, and it reconciled with nothing.

Fixing it surfaced two traps, and the second is the interesting one.

**Trap 1 — the nearest real number was the wrong row.**
`vorion/docs/benchmarks/phase6-performance.md` measures `p50 12ms / p95 28ms`,
which looks like a clean substitute. But that row is `GET /stats` — a dashboard
read, and the *fastest* endpoint in the table. The policy-decision endpoint,
`POST /role-gates/evaluate`, measures **18/42**. Swapping in 12/28 would have
put the fastest read endpoint on a résumé as a policy-decision latency.

**Trap 2 — the file benchmarks the wrong system.**
Those are **Vorion Phase 6 Trust Engine** endpoints. The claim is about
**CogniGate**. CogniGate has no measured latency artifact anywhere — the `p50`
in `cognigate/tests/test_monte_carlo.py` is a probability variable
(`analytical_failure_prob`), not a latency. So citing that file would have
traded one mis-attribution for another that merely *looked* sourced.

The honest resolution was neither: restate the claim as **CogniGate's own
published design target** — `~38ms median / <120ms p99` — worded as a target,
matching `cognigate.dev` verbatim. In the manifest it is `attested` to that
published budget, with the reasoning above recorded in the claim's `note` so
the next person does not re-walk it.

The lesson the gate encodes: **a number is not sourced merely because a number
exists somewhere.** It has to be the same measurement, of the same system.
`no-unsourced-metric` catches the missing source; only a human reading the
source catches the wrong one — which is exactly why every correction routes to
a human merge.

## Porting it to another repo

The agent is generic; the manifest is what makes it about a given surface. To
govern `flasun/flasun`, another `axiom-orion` repo, or a `vorionsys` package:

1. copy `scripts/claim-audit.js`, `ui_kits/living-line/governance.js`,
   `ui_kits/living-line/claim-policy.js`, and `.github/workflows/claim-audit.yml`
2. write a new `claims.json` for that surface's assertions
3. drop the `record-count` verifier if the target has no `data.js`

Nothing else changes. That is what makes it portable rather than bespoke —
and it is how the two ad-hoc "keep public claims true" workflows in the
business estate (`verify-install-commands.yml`, `refresh-ecosystem-status.yml`)
can be replaced by one governed implementation with a gate and a trace.
