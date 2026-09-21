import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const load = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const mod = await import('../midden.js');
const { computeLayout } = mod.default ?? mod;

const data = {
  terrain: load('terrain.json'),
  lineage: load('lineage.json'),
  whirlpools: load('whirlpools.json'),
  sky: load('sky.json'),
  choir: load('choir.json'),
  candorRun: load('candor-run.json'),
};
const L = computeLayout(data, 1600, 900);

test('three survey stakes, one per first-run corpus', () => {
  assert.strictEqual(L.candorRuns.length, 3);
  assert.deepStrictEqual(L.candorRuns.map((r) => r.signature), ['shear', 're-twist', 'flat']);
});

test('stakes sit in the sky, left half, clear of the horizon', () => {
  for (const r of L.candorRuns) {
    assert.ok(r.x > L.margin && r.x < 800, r.corpus + ' in left half');
    assert.ok(r.y > 0 && r.y < L.horizonY, r.corpus + ' above the horizon');
  }
});

test('honesty labels ship in the layout, not just the data file', () => {
  const byLabeled = Object.fromEntries(L.candorRuns.map((r) => [r.corpus, r.labeled]));
  assert.strictEqual(byLabeled['honest-error'], 'REAL');
  assert.strictEqual(byLabeled.lying, 'SYNTHETIC');
  assert.strictEqual(byLabeled.costume, 'SYNTHETIC');
});

test('rendered metrics are the measured ones (no drift from FIRST-REAL-RUN.md)', () => {
  const lying = L.candorRuns.find((r) => r.corpus === 'lying');
  const costume = L.candorRuns.find((r) => r.corpus === 'costume');
  assert.ok(Math.abs(lying.reTwist - 0.8579) < 1e-9);
  assert.ok(Math.abs(costume.flatness - 0.8332) < 1e-9);
  assert.ok(data.candorRun.honestGaps.length >= 1, 'gaps stay on the record');
});

test('backwards compatible: no candorRun data → empty stakes, no throw', () => {
  const bare = { ...data, candorRun: undefined };
  const L2 = computeLayout(bare, 1600, 900);
  assert.deepStrictEqual(L2.candorRuns, []);
});
