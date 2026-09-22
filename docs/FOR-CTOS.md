# The midden, for CTOs

Five minutes, decision-relevant only. What this repo is, what it proves,
what it costs, what it is not.

## What it is

A zero-infrastructure static site that renders an organization's actual
engineering record as a navigable landscape. Every element traces to a
verifiable artifact: value ledgers with transcript citations, a lineage
walk with a saved seed, the organization's canon hash (the identical
hash the automated systems verify), and the four currently-open
cross-project gaps — rendered as whirlpools, each click opening the real
issue. Synthetic or extrapolated content is explicitly labeled and
visually dimmed. Nothing on screen is unaccounted for.

## What it demonstrates

This is the point of the repo. It is evidence about how the organization
operates, not a toy:

1. **Provenance as a first-class artifact.** Every data file carries
   repo, commit, and extraction method (`data/PROVENANCE.md`), and the
   test suite *enforces* the doctrine: zero-invention, evidence-carrying
   ledger entries, hash-pinned fixtures that fail the build when data
   and description drift apart.
2. **Epistemic honesty at the UI layer.** The system distinguishes
   measured from estimated (instruments carry units; derived lines are
   labeled `stand-in`) and real from synthetic (broken rings, dimmer
   glow, no verdict tags). That distinction survives into what users
   see — unusual, and cheap to copy.
3. **Auditability you can click.** Any claim in the scene resolves to a
   URL, a commit, or a hash in under two hops. A board member and a
   staff engineer see the same evidence.
4. **Debt made visible without a dashboard.** The four whirlpools are
   the real open canon gaps — unfinished connections between projects,
   each with an issue tracker entry. Nobody had to prepare a report;
   the landscape is the report.

## Cost and risk posture

- **Runs anywhere static files run.** No server code, no build step, no
  runtime dependencies; `python3 -m http.server` or a `file://` open.
- **Tested:** 60/60 checks green via `node --test`; the validator is
  proven to reject tampered room state (the suite injects a broken room
  and demands ≥4 distinct schema violations).
- **No secrets exposure surface:** fixtures are public artifacts; the
  repo passes GitGuardian. No telemetry, no external calls beyond the
  whirlpool links a user chooses to click.
- **Maintenance cost:** when underlying data changes, a repin tool
  refreshes hashes; the tests tell you exactly what drifted.

## What it is not

- Not a monitoring or observability dashboard — it renders a captured
  record, deliberately. Liveness belongs to other tools.
- Not a game — there is no win state; it is a place for reading the
  record.
- Not a claim of measurement where estimation exists — the labeling
  system is the product.

## The one-sentence version

The midden is what it looks like when an engineering organization's
memory is held to the same standards as its code: cited, tested,
drift-guarded, and honest about its own gaps.
