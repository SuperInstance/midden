// The retuned choir — the exact commensuration comb.
// Runs the real generator and the vendored Stern–Brocot instrument; nothing
// here trusts a bare float where a rational can carry the truth.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  makeRat, ratToNumber, ratToString, floatToRat, ratCmp, ratSub, nearestRational,
} from '../vendor/quilt-commensurate/rat.mjs';
import { buildChoir, SUPERCELL, TEETH_N, REGIME } from '../tools/gen-choir.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const choir = JSON.parse(readFileSync(join(root, 'data', 'choir.json'), 'utf8'));

test('comb determinism: the regenerated comb is identical, and degrees are the exact dyadic of the rational', () => {
  const regen = buildChoir();
  assert.deepStrictEqual(regen, choir); // bit-identical across runs
  for (const t of choir.teeth) {
    const deg = makeRat(3 * (t.n - 1), 4);
    assert.equal(ratCmp(floatToRat(t.degrees), deg), 0, `tooth ${t.n}: f64 IS the rational`);
    assert.equal(ratToNumber(deg), t.degrees, `tooth ${t.n}: round-trips bit-exact`);
    // the rational layer never drifts: |rendered − rational| is exactly 0
    assert.equal(ratCmp(ratSub(floatToRat(t.degrees), deg), makeRat(0)), 0);
  }
});

test('every tooth is exactly commensurate — Stern–Brocot snaps on with error exactly 0', () => {
  for (const t of choir.teeth) {
    const [p, q] = t.turns.split('/').map(BigInt);
    const turns = makeRat(p, q);
    assert.equal(ratToString(turns), t.turns, `tooth ${t.n}: normalized rational`);
    const { rat, error } = nearestRational(turns, SUPERCELL);
    assert.equal(ratCmp(rat, turns), 0, `tooth ${t.n}: snapped exactly onto itself`);
    assert.equal(ratCmp(error, makeRat(0)), 0, `tooth ${t.n}: error 0 — no tolerance imports`);
  }
});

test('revival spacing: the dream said ~0.75° — the comb delivers exactly 0.75°, within tolerance', () => {
  const degs = choir.teeth.map((t) => t.degrees);
  const gaps = degs.slice(1).map((d, i) => d - degs[i]);
  for (const g of gaps) assert.equal(g, 0.75, 'every interval is exactly 3/4°');
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  assert.ok(Math.abs(mean - 0.75) <= 0.15, `mean spacing ${mean} within tolerance of ~0.75°`);
  assert.equal(choir.spacing_degrees, 0.75);
});

test('all seven bells ring inside the honest twist regime — the coarse teeth stay dead', () => {
  assert.equal(choir.teeth.length, 7);
  assert.deepStrictEqual(choir.teeth.map((t) => t.n), TEETH_N);
  for (const t of choir.teeth) {
    assert.ok(t.degrees >= REGIME[0] && t.degrees <= REGIME[1], `tooth ${t.n} inside [${REGIME}]`);
  }
  // the old ladder's teeth — 137.51°, −42.49°, 17.51°, −6.49° — were
  // out-of-regime artifacts; none may return
  assert.ok(choir.teeth.every((t) => Math.abs(t.degrees) <= 6.0), 'no out-of-regime tooth');
});
