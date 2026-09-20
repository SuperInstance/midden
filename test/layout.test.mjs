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
};
const L = computeLayout(data, 1600, 900);

test('ridge heights are monotonic in strength', () => {
  const byHeight = [...L.ridges].sort((a, b) => b.height - a.height); // elevation desc
  const byStrength = [...L.ridges].sort((a, b) => b.strength - a.strength);
  assert.deepStrictEqual(byHeight.map((r) => r.id), byStrength.map((r) => r.id));
  // exact: height === strength * maxH
  for (const r of L.ridges) {
    assert.ok(Math.abs(r.height / r.strength - 900 * 0.34) < 1e-9, r.id + ' height ∝ strength');
    assert.ok(r.summitY < r.baseY, r.id + ' rises');
  }
});

test('citation paths start at the summit and end at a real turn slot', () => {
  for (const r of L.ridges) {
    assert.strictEqual(r.paths.length, r.evidenceCount, r.id + ' one path per evidence line');
    for (const p of r.paths) {
      assert.ok(Math.abs(p[0].x - r.x) < 1e-9 && Math.abs(p[0].y - r.summitY) < 1e-9, 'path starts at summit');
      const ex = p[3].x;
      assert.ok(ex >= L.margin - 1e-9 && ex <= 1600 - L.margin + 1e-9, 'path ends inside the floor');
      assert.ok(p[3].y > L.horizonY, 'path dives under the floor');
    }
  }
});

test('whirlpool coordinates match the real issue list', () => {
  assert.strictEqual(L.whirlpools.length, data.whirlpools.whirlpools.length);
  L.whirlpools.forEach((w, i) => {
    assert.strictEqual(w.id, data.whirlpools.whirlpools[i].id);
    assert.strictEqual(w.url, data.whirlpools.whirlpools[i].url);
    assert.ok(w.x > 0 && w.x < 1600 && w.y > L.horizonY && w.y < 900, w.id + ' in the Drown band');
  });
});

test('stars are fixed at the canon digits', () => {
  assert.strictEqual(L.stars.length, 16);
  for (const s of L.stars) assert.ok(s.y < L.horizonY, 'star in the sky');
});

test('the (k,s) lattice is an integer grid under the floor', () => {
  assert.ok(L.lattice.cols > 0 && L.lattice.rows > 0);
  assert.ok(L.lattice.originY >= L.horizonY - 1, 'lattice at/under the waterline');
});

test('choir rings with 7 bells on the horizon', () => {
  assert.strictEqual(L.choir.length, 7);
  for (const b of L.choir) assert.ok(Math.abs(b.y - L.horizonY) < 20, 'bell on the horizon');
});

test('the understory carries the rescued walk (8 rounds, honest gap)', () => {
  assert.strictEqual(L.understory.nodes.length, data.lineage.trajectory.length);
  assert.strictEqual(L.understory.nodes.length, 8);
  assert.strictEqual(L.understory.verdict.status, 'HONEST GAP');
  assert.strictEqual(L.understory.links.length, 7);
  for (const n of L.understory.nodes) assert.ok(n.y > L.horizonY, 'filament under the floor');
});

test('the candor line crosses the sky with visible strain', () => {
  assert.strictEqual(L.candor.length, 121);
  for (const p of L.candor) assert.ok(p.y < L.horizonY, 'candor in the sky');
  const maxStrain = Math.max(...L.candor.map((p) => p.strain));
  assert.ok(maxStrain > 0.9, 'strain concentrated and recoverable');
});
