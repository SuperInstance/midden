# GESTURE-NOTES — reading the rescued walk third-order

2026-09-20, lane V (`gesture-hull-readouts`). Instrument: gesture-kit
vendored at `vendor/gesture-kit/gesture.js` (upstream
`SuperInstance/gesture-kit` @ `8cd5aa4`, MIT). Subject: `data/lineage.json`
— the real 8-round × 16-dim walk (q16-trajectories PR #1 @ `bfd7ee8`),
verdict: **HONEST GAP @ round 7**, σ = 0.11847104064430357.

> Naming law: gesture-kit's `twistEnergy()` is discrete Frenet **torsion**.
> All values below labeled "torsion" are that instrument. twist-engine's
> σ-shear commensuration (units: seconds) is a different instrument and
> appears nowhere in these numbers.

## Method

Per-round readouts are **cumulative**: round r reads the gesture built from
points `0..r` (`trajectory.map(t => t.point)`), so each row is "the shape of
everything walked so far, at that round." Full-walk row is r7. Pure
`gesture-kit` — no resampling, no normalization; the ℚ¹⁶ integers are fed
verbatim (a global scale factor divides out of `1 − cos` and the sin-θ
torsion anyway; planarity is scale-free by construction).

## Numbers (deterministic — recompute with `npm test`)

| round | arcLength (ℚ-units) | bendingEnergy | torsion | planarity |
|---|---|---|---|---|
| r0 | 0.0 | 0.0000 | 0.000000 | 1.000000 |
| r1 | 385447.3 | 0.0000 | 0.000000 | 1.000000 |
| r2 | 525928.8 | 1.0318 | 0.000000 | 1.000000 |
| r3 | 661854.1 | 2.1510 | 0.988100 | 0.505950 |
| r4 | 782666.8 | 3.4600 | 1.926347 | 0.357884 |
| r5 | 1025476.1 | 5.0436 | 2.732037 | 0.316991 |
| r6 | 1158131.4 | 6.7550 | 3.420749 | 0.315850 |
| **r7** | **1328817.9** | **7.8186** | **3.964612** | **0.339231** |

Full-walk stress profile (per-interior-vertex `1 − cos`):
`1.0318 1.1192 1.3090 1.5836 1.7114 1.0636` — note the last vertex already
relaxes before the gap step.

## The HONEST-GAP corroboration — VERDICT: CORROBORATED, as a hesitation

**planarity corroborates the gap (r7 = 0.3392 vs neighbors 0.3159, 0.3170)
— the step into round 7 adds torsion 0.5439, ~21% below the prior
per-vertex mean 0.6841: a hesitation, not a flattening.**

Precisely:

- r7 planarity (0.339231) is a strict local maximum over its two nearest
  measured neighbors (r6 = 0.315850, r5 = 0.316991). Measurable, real,
  deterministic — not manufactured.
- Mechanism: torsion added by the step into r7 = `3.964612 − 3.420749` =
  **0.543864**, against a prior per-vertex mean of `3.420749 / 5` =
  **0.684150**. ~20.5% below trend.
- What this IS: at the exact round the q16 verdict flags, the walk keeps
  moving (arc still grows by ~171k ℚ-units) and still bends (bendingEnergy
  +1.0636), but its turning stays measurably closer to its own osculating
  plane — the third-order signature of a walker pausing at the edge of the
  gap before whatever comes next.
- What this is NOT: a collapse into the plane. A true flattening would show
  `torsionAdded ≈ 0` and planarity spiking toward 1. We refuse that reading;
  the numbers do not support it, so we do not print it.

Honest limit: with 8 points, r7 is terminal — there is no r8 to compare
forward. The corroboration uses the two preceding rounds as neighbors.
Also, planarity is a *global-so-far* reading; a 4-point sliding window
would need points after the gap that this walk does not have.

## Reproduce

```bash
npm test   # includes test/gesture-panel.test.mjs — guards every number above
```

The panel in the browser (`gesture-panel.mjs`, side panel on index.html)
recomputes these live from `data/lineage.json`; the corroboration line it
prints is generated, never hardcoded.
