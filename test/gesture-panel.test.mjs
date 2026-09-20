import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Importing the module under node --test with no DOM must not throw —
// the math core is headless by construction; this IS the guard.
const panel = await import('../gesture-panel.mjs');
const { Gesture } = await import('../vendor/gesture-kit/gesture.js');

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const lineage = JSON.parse(readFileSync(join(root, 'data', 'lineage.json'), 'utf8'));
const readout = panel.computeGestureReadout(lineage);

test('the panel module loads headless and exposes the math core', () => {
  assert.strictEqual(typeof panel.computeGestureReadout, 'function');
  assert.strictEqual(typeof panel.buildWalk, 'function');
});

test('buildWalk feeds the 8-round x 16-dim walk to gesture-kit verbatim', () => {
  const pts = panel.buildWalk(lineage);
  assert.strictEqual(pts.length, 8);
  assert.ok(pts.every((p) => p.length === 16));
  assert.deepStrictEqual(pts[7], lineage.trajectory[7].point); // defensive-copy source, same values
});

test('per-round readouts are cumulative and well-formed', () => {
  assert.strictEqual(readout.rounds.length, 8);
  let prevArc = -1, prevBend = -1, prevTorsion = -1;
  for (const r of readout.rounds) {
    assert.ok(r.arcLength > prevArc, `r${r.round} arc grows`);       // the walk always moves
    assert.ok(r.bendingEnergy >= prevBend - 1e-12, `r${r.round} bend non-decreasing`);
    assert.ok(r.torsion >= prevTorsion - 1e-12, `r${r.round} torsion non-decreasing`);
    assert.ok(r.planarity >= 0 && r.planarity <= 1, `r${r.round} planarity in [0,1]`);
    prevArc = r.arcLength; prevBend = r.bendingEnergy; prevTorsion = r.torsion;
  }
  // rounds too short to twist report planarity 1 — honest, not manufactured
  assert.strictEqual(readout.rounds[0].planarity, 1);
  assert.strictEqual(readout.rounds[1].planarity, 1);
  assert.strictEqual(readout.rounds[2].planarity, 1);
  // first torsion reading lands at r3 (needs 4 points), and it is NOT flat
  assert.ok(readout.rounds[3].torsion > 0);
  assert.ok(readout.rounds[7].planarity < 0.5, 'the full walk is measurably non-planar');
});

test('readout is deterministic — two runs agree bit-for-bit', () => {
  const again = panel.computeGestureReadout(lineage);
  assert.deepStrictEqual(again, readout);
});

test('the panel agrees with the vendored Gesture computed independently', () => {
  const pts = panel.buildWalk(lineage);
  const full = new Gesture(pts);
  assert.ok(Math.abs(readout.full.arcLength - full.arcLength()) < 1e-9);
  assert.ok(Math.abs(readout.full.bendingEnergy - full.bendingEnergy()) < 1e-9);
  assert.ok(Math.abs(readout.full.torsion - full.twistEnergy()) < 1e-9);
  assert.ok(Math.abs(readout.full.planarity - full.planarity()) < 1e-9);
  // per-round cumulative rows match independent prefix gestures
  for (let r = 3; r < 8; r++) {
    const g = new Gesture(pts.slice(0, r + 1));
    assert.ok(Math.abs(readout.rounds[r].planarity - g.planarity()) < 1e-12, `r${r} planarity`);
    assert.ok(Math.abs(readout.rounds[r].torsion - g.twistEnergy()) < 1e-9, `r${r} torsion`);
  }
});

test('planarity corroborates the HONEST GAP at the verdict round', () => {
  assert.strictEqual(readout.gap.round, 7);
  assert.strictEqual(readout.gap.verdictStatus, 'HONEST GAP');
  assert.strictEqual(readout.gap.corroborated, true);
  const [na, nb] = readout.gap.neighbors.values;
  assert.ok(readout.gap.planarityAtGap > na, 'r7 above its nearest neighbor');
  assert.ok(readout.gap.planarityAtGap > nb, 'r7 above its second neighbor');
  assert.match(
    readout.gap.line,
    /^planarity corroborates the gap \(r7 = \d\.\d{4} vs neighbors \d\.\d{4}, \d\.\d{4}\)/
  );
});

test('the corroboration mechanism is a measured torsion hesitation, not a flattening', () => {
  // step into r7 adds LESS torsion per vertex than the walk's prior mean —
  // planarity ticks UP. A manufactured "collapse to the plane" would show
  // torsionAdded ≈ 0. Neither is what a null would look like: near-equal.
  assert.ok(readout.gap.torsionAddedAtGap > 0.1, 'the walk still moves at the gap');
  assert.ok(
    readout.gap.torsionAddedAtGap < readout.gap.priorPerVertexMean,
    'below the prior per-vertex mean — a hesitation'
  );
  // recorded numbers match the doc (guard against doc drift)
  const notes = readFileSync(join(root, 'docs', 'GESTURE-NOTES.md'), 'utf8');
  assert.ok(notes.includes(readout.gap.planarityAtGap.toFixed(4)), 'doc carries the r7 planarity');
  assert.ok(notes.includes(readout.gap.torsionAddedAtGap.toFixed(4)), 'doc carries the added torsion');
});

test('vendored gesture-kit is provenanced (repo + ref + MIT)', () => {
  const prov = readFileSync(join(root, 'vendor', 'gesture-kit', 'PROVENANCE.md'), 'utf8');
  assert.ok(prov.includes('SuperInstance/gesture-kit'), 'names the upstream repo');
  assert.ok(prov.includes('8cd5aa415235b41e4aa944104dd796f163510b0c'), 'pins the upstream ref');
  assert.ok(/MIT/.test(prov), 'carries the MIT license');
});
