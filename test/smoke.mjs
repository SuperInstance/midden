/* smoke.mjs — the walkable world must not lie and must not fail to boot.
 *
 * Run:  node test/smoke.mjs          (or `npm test`, which picks this up too)
 *
 * Checks the exported world (world/world.json + world/world-data.js):
 *   - parses, and is the same object in both the .json and the file:// build
 *   - >= 10 rooms, unique ids, sequential rounds
 *   - every walk path connects rooms that exist, in order, with segments
 *   - ember tags present, and only on REAL rooms (nothing synthetic is a verdict)
 *   - the REAL rooms' numbers still match the vendored instrument computed
 *     live from data/lineage.json, and the documented gap reading
 *   - file:// safety: no ES modules, no fetch(), every referenced script exists
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Gesture } from '../vendor/gesture-kit/gesture.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORLD_JSON = path.join(ROOT, 'world', 'world.json');
const WORLD_DATA = path.join(ROOT, 'world', 'world-data.js');
const INDEX_HTML = path.join(ROOT, 'world', 'index.html');
const WORLD_JS = path.join(ROOT, 'world', 'world.js');

let world;
let lineage;

test('world.json parses and declares its schema', () => {
  world = JSON.parse(fs.readFileSync(WORLD_JSON, 'utf8'));
  assert.equal(world.schema, 'midden.world/1');
  assert.ok(Array.isArray(world.rooms));
  lineage = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lineage.json'), 'utf8'));
});

test('the floor has at least 10 rooms', () => {
  assert.ok(world.rooms.length >= 10, `expected >=10 rooms, got ${world.rooms.length}`);
});

test('room ids are unique and rounds are sequential from 0', () => {
  const ids = world.rooms.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate room ids');
  world.rooms.forEach((r, i) => {
    assert.equal(r.round, i, `room ${i} has round ${r.round}`);
    assert.equal(r.id, `r${r.round}`);
  });
});

test('every room carries a provenance label and a position', () => {
  world.rooms.forEach((r) => {
    assert.ok(
      r.provenance === 'REAL' || r.provenance === 'SYNTHETIC',
      `room ${r.id} provenance ${r.provenance}`,
    );
    assert.ok(r.position && Number.isFinite(r.position.x) && Number.isFinite(r.position.z),
      `room ${r.id} has no floor position`);
    assert.ok(r.readout && Number.isFinite(r.readout.planarity), `room ${r.id} readout`);
  });
});

test('rooms are actually walkable — no two cells overlap', () => {
  for (let i = 0; i < world.rooms.length; i++) {
    for (let j = i + 1; j < world.rooms.length; j++) {
      const a = world.rooms[i].position;
      const b = world.rooms[j].position;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      assert.ok(d >= 10, `rooms ${world.rooms[i].id} and ${world.rooms[j].id} are ${d.toFixed(2)}u apart`);
    }
  }
});

test('every walk path connects rooms that exist, in order', () => {
  assert.ok(Array.isArray(world.walks) && world.walks.length >= 1);
  const ids = new Set(world.rooms.map((r) => r.id));
  world.walks.forEach((w) => {
    assert.ok(Array.isArray(w.rooms) && w.rooms.length >= 2, `walk ${w.id} has no path`);
    w.rooms.forEach((id) => assert.ok(ids.has(id), `walk ${w.id} references missing room ${id}`));
    // segments must be the consecutive pairs of the path
    const pairs = w.rooms.slice(0, -1).map((a, i) => `${a}~${w.rooms[i + 1]}`);
    const segs = w.segments.map((s) => `${s.from}~${s.to}`);
    assert.deepEqual(segs, pairs, `walk ${w.id} segments do not match its path`);
    w.segments.forEach((s) => {
      assert.ok(ids.has(s.from) && ids.has(s.to), `walk ${w.id} segment to missing room`);
    });
  });
});

test('the whole-floor walk visits every room exactly once, in round order', () => {
  const whole = world.walks.find((w) => w.id === 'the-whole-floor');
  assert.ok(whole, 'no the-whole-floor walk');
  assert.deepEqual(whole.rooms, world.rooms.map((r) => r.id));
});

test('ember tags are present — and only on REAL rooms', () => {
  const ember = world.rooms.filter((r) => r.honestGap && r.honestGap.tagged);
  assert.ok(ember.length >= 1, 'no ember-tagged room');
  assert.ok(world.rooms.some((r) => r.ember === true), 'no room flagged ember for the renderer');
  ember.forEach((r) => {
    assert.equal(r.provenance, 'REAL', 'a SYNTHETIC room carries a verdict tag — never allowed');
    assert.equal(r.honestGap.status, 'HONEST GAP');
    assert.equal(r.round, world.gap.round);
    assert.equal(r.ember, true);
  });
  // and no other room claims the verdict
  world.rooms.forEach((r) => {
    if (!ember.includes(r)) {
      assert.equal(r.honestGap.tagged, false, `room ${r.id} wrongly tagged`);
      assert.equal(r.ember, false, `room ${r.id} wrongly ember`);
    }
  });
});

test('REAL rooms match the vendored instrument computed live from data/lineage.json', () => {
  const pts = lineage.trajectory.map((t) => t.point);
  world.rooms.slice(0, pts.length).forEach((room, r) => {
    const g = new Gesture(pts.slice(0, r + 1));
    assert.equal(room.provenance, 'REAL');
    assert.ok(Math.abs(room.readout.planarity - g.planarity()) < 1e-6, `r${r} planarity`);
    assert.ok(Math.abs(room.readout.torsion - g.twistEnergy()) < 1e-6, `r${r} torsion`);
    assert.ok(Math.abs(room.readout.arcLength - g.arcLength()) < 1e-3, `r${r} arc`);
  });
});

test('the gap reading matches the documented third-order corroboration', () => {
  const g = world.gap;
  assert.equal(g.round, 7);
  assert.equal(g.status, 'HONEST GAP');
  assert.equal(g.corroborated, true);
  assert.equal(g.planarityAtGap, 0.339231);
  assert.deepEqual(g.neighbors.values, [0.31585, 0.316991]);
  assert.ok(Math.abs(g.torsionStepIntoGap - 0.543864) < 1e-6);
  assert.ok(Math.abs(g.priorPerVertexMean - 0.68415) < 1e-6);
  assert.ok(Math.abs(g.arcStepIntoGap - 170686.5559) < 0.5);
});

test('synthetic rooms are labeled and carry their method — the real walk is untouched', () => {
  const nReal = lineage.trajectory.length;
  world.rooms.forEach((r) => {
    if (r.round < nReal) {
      assert.equal(r.provenance, 'REAL', `r${r.round} should be REAL`);
      assert.ok(!r.method, 'REAL rooms carry no continuation method');
    } else {
      assert.equal(r.provenance, 'SYNTHETIC', `r${r.round} should be SYNTHETIC`);
      assert.ok(r.method && /SYNTHETIC|deterministic|slope/i.test(r.method),
        `r${r.round} has no method note`);
    }
  });
  const walks = { rescued: 0, next: 0 };
  world.walks.forEach((w) => {
    if (w.id === 'rescued-walk') walks.rescued = w;
    if (w.id === 'what-comes-next') walks.next = w;
  });
  assert.equal(walks.rescued.provenance, 'REAL');
  assert.equal(walks.next.provenance, 'SYNTHETIC');
});

test('the REAL room positions are the true PCA projection, unmodified', () => {
  world.rooms.forEach((r) => {
    if (r.provenance === 'REAL') {
      assert.deepEqual(r.position, r.projected,
        `r${r.round} layout was moved off its projection`);
    }
  });
});

test('landmarks are present and cited', () => {
  const lm = world.landmarks || {};
  assert.equal(lm.ridges.items.length, 9, 'ridges');
  assert.equal(lm.whirlpools.items.length, 4, 'whirlpools');
  assert.equal(lm.choir.items.length, 7, 'choir');
  assert.equal(lm.sky.digitValues.length, 16, 'stars');
  [lm.ridges, lm.whirlpools, lm.choir, lm.sky].forEach((b) => {
    assert.ok(b.source && b.source.length > 8, 'landmark block missing its source citation');
  });
});

test('the file:// build inlines the identical object', () => {
  const src = fs.readFileSync(WORLD_DATA, 'utf8');
  assert.ok(/^\/\*/.test(src), 'world-data.js should start with a generation banner');
  const m = src.match(/^window\.WORLD = ([\s\S]+);\s*$/m);
  assert.ok(m, 'world-data.js does not assign window.WORLD');
  const inlined = JSON.parse(m[1]);
  assert.deepEqual(inlined, world, 'world-data.js differs from world.json');
});

test('file:// safety: no ES modules, no fetch, all scripts present on disk', () => {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  assert.ok(!/type=["']module["']/.test(html), 'index.html loads an ES module — breaks file://');
  const srcs = [...html.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.ok(srcs.length >= 3, 'expected three classic scripts');
  srcs.forEach((s) => {
    const p = path.resolve(path.dirname(INDEX_HTML), s);
    assert.ok(fs.existsSync(p), `missing script: ${s}`);
  });
  const js = fs.readFileSync(WORLD_JS, 'utf8');
  assert.ok(!/\bfetch\s*\(/.test(js), 'world.js calls fetch() — breaks file://');
  assert.ok(!/\bimport\s/.test(js), 'world.js uses ES import syntax');
  assert.ok(/window\.WORLD/.test(js), 'world.js does not read the inlined data');
});
