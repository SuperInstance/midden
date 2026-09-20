# PROVENANCE — where every fixture came from

Honesty doctrine: every data file below is either REAL fleet output captured at
authoring time (with repo + ref cited), or explicitly marked illustrative.
Nothing else.

## terrain.json — REAL
Produced by running the **real** `extractValuesLedger` from
`SuperInstance/the-tap`, branch `lane-l-commune-deep` @ `42f878e`
(`workers/room-worker/src/values-ledger.ts`, 565 lines, lane-l cut 1+2),
over the real commune-harness utterance script from
`workers/room-worker/test/commune-harness.mjs` (the mock dockside commune,
all-healthy mode, 20 turns). Regenerate:
`node /tmp/gen-terrain.mjs` (driver preserved in repo as `tools/gen-terrain.mjs`,
pointed at a clone of the lane-l tree). 9 ridges, strengths + evidence counts
are the extractor's own output — zero inventions, per the ledger's
GROUNDED-or-absent law (verified by its own no-invention fuzz test).

## lineage.json — REAL
Produced by running the **real** `breed()` + `chain()` from
`SuperInstance/q16-trajectories` PR #1 branch `lane-n-q16-bridge` @ `bfd7ee8`
(`src/breed.js`, `src/lineage.js`). Seed `q16/midden-at-dusk`, artist `duke`,
persona `purist`. 8 rounds, one exact-integer ℚ¹⁶ point per round; verdict
HONEST GAP at round 7 (sigma 0.1185, 12-dim residue) — the walk duke-lab
throws away, kept. Regenerate: `node tools/gen-lineage.js` in a clone of the
PR branch.

## whirlpools.json — REAL
The 4 canon edge gaps filed by today's fleet canon lint sweep, each a live
OPEN issue at authoring time (verified via `gh issue view`, 2026-09-20):
`SuperInstance/duke-lab#4` (hermit→duke-lab),
`SuperInstance/tidepool#4` (duke-lab→tidepool and quilt→tidepool),
`SuperInstance/quilt-canon-cli#4` (quilt→hermit, issues disabled on target).
Lint discipline: `/tmp/lane-p/docs/CANON_LINT.md` (rule 4 — edges are
bidirectional; a one-way edge is a claim the target never agreed to).

## sky.json — REAL
The fleet canon hash `0x445185a3a99fd2e7` — the sandbox proof replayed in
exactly 152,580 steps. The 16 hex digits fix 16 star positions. A memory
that cannot be reproduced in 152,580 exact steps does not exist.

## choir.json — REAL (one honest caveat)
The 7 teeth are exact output of `convergentGaps(8)` (n = 2..8) from
`SuperInstance/quilt-studio` `packages/quilt-floor/src/golden.mjs` @
`5821ebf0b4c30d45559a076a97aa76a8693d6f32` — convergent gaps of the golden
direction, the Twist engine's commensuration comb. The dream chapters
describe the teeth as "~0.75° apart"; the real ladder's fine-teeth spacing
is of that order (the sub-degree window region), but the actual degrees —
including the two large teeth at 137.51° and −42.49° — are what the code
emits, and those real values are what ships. The approximation is the
dream's, not the data's.
