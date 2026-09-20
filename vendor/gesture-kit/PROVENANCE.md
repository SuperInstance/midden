# vendored: @superinstance/gesture-kit

Vendored dependency — midden branch `gesture-hull-readouts`.

## Why vendored, not npm

`npm view @superinstance/gesture-kit` → **404** (not published to the npm
registry as of 2026-09-20). So the library file is vendored here, per midden
doctrine: import, don't fork — the vendored copy is byte-identical to upstream.

## Provenance

| field | value |
|---|---|
| upstream repo | `SuperInstance/gesture-kit` |
| upstream ref | `8cd5aa415235b41e4aa944104dd796f163510b0c` (`main`, "Merge repo initialization; keep built tree") |
| version | `0.1.0` |
| license | **MIT** (Casey Digennaro / SuperInstance — see upstream `LICENSE`) |
| vendored file | `gesture.js` ← upstream `src/gesture.js` (sha-checked identical at vendor time) |

Zero dependencies, pure ES module. Only the core library is vendored; the
upstream `./widget` custom element (`<gesture-hull>`) is intentionally not —
midden renders its own panel (`gesture-panel.mjs`) to match the dusk aesthetic.

## Name collision warning (fleet law)

gesture-kit's `twistEnergy()` is **discrete Frenet torsion** — turning out of
the osculating plane of a curve through any abstract vector space,
dimensionless. twist-engine's "twist" is a **time-domain σ-shear
commensuration instrument** (σ = 0.24·s, grid = 0.6·s, units: seconds).
Same fleet law ("the property is in the twist"), different instruments.
In midden's UI copy the gesture-kit metric is always called **torsion**;
twist-engine's stays **twist**. Never conflate.
