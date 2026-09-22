# PROVENANCE — vendor/quilt-commensurate

## rat.mjs — VENDORED, verbatim

Copied **unchanged** (one header block prepended) from
`SuperInstance/quilt-studio`, `packages/quilt-floor/src/commensurate.mjs` @
`5821ebf0b4c30d45559a076a97aa76a8693d6f32`
(commit message: "floor: commensurate — exact rational arithmetic for the
twist instrument (every f64 is a dyadic rat; Stern–Brocot kills the 3/10
tolerance answer: π/(2φ) is 4/13); 124/124").

What was vendored (the whole file — it is already the minimal unit):

- `makeRat`, `ratToNumber`, `ratToString`, `ratAbs`, `ratSub`, `ratCmp`
- `floatToRat` — the exact dyadic expansion of an f64
- `continuedFraction`, `nearestRational` — exact Stern–Brocot search

What was **not** vendored: all of quilt-studio's kernels, floor modules,
golden substrate, views, and tests. Only the exact-rational instrument the
midden's sky-choir needs to verify its comb. If upstream
`commensurate.mjs` changes, re-vendoring is a plain `diff`.

Honest limit (from the vendored header, kept verbatim): π is transcendental;
the instrument measures against f64 shadows and says so. The midden's comb
(3(n−1)/4°, n = 2..8) is rational, so for this use the shadow *is* the
quantity — every tooth verifies with error exactly 0.

License: same terms as SuperInstance/quilt-studio (fleet internal).
