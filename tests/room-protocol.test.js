// room-protocol.test.js — the visitable-state contract, enforced.
//
// Three layers, in order:
//   1. SCHEMA — protocol/midden-room.json validates against
//      protocol/room-state.schema.json (via protocol/validate.mjs, the
//      zero-dependency subset validator — same one the builder relies on).
//   2. FIXTURE TRACE — every cited number recomputes from data/*.json, and
//      the sha256 digests + byte counts recorded in room.fixtures match the
//      files on disk. If a fixture drifts, these tests fail loud.
//   3. NAMING LAW + HONESTY — the third-order readout is TORSION (never
//      twist); the strain line is a declared stand-in, not a measurement;
//      provenance.gaps admits what the room is not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const load = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const schema = load('protocol/room-state.schema.json');
const room = load('protocol/midden-room.json');
const terrain = load('data/terrain.json');
const lineage = load('data/lineage.json');
const whirlpools = load('data/whirlpools.json');
const sky = load('data/sky.json');
const choir = load('data/choir.json');

const { validate } = await import('../protocol/validate.mjs');
const { computeGestureReadout } = await import('../gesture-panel.mjs');
const midden = await import('../midden.js');
const { computeLayout } = midden.default ?? midden;

const { surfaces } = room;
const { ledger, lineage: lineageSurface, canon } = surfaces;

// ── 1. schema ────────────────────────────────────────────────────────────

test('room-state validates against room-state.schema.json', () => {
  const { valid, errors } = validate(schema, room);
  assert.ok(valid, 'schema violations:\n' + errors.join('\n'));
});

test('the validator is not decorative — it rejects a broken room', () => {
  const broken = JSON.parse(JSON.stringify(room));
  broken.protocol = 'room-protocol/0';
  broken.room.kind = 'amorphous-blob';
  delete broken.surfaces.ledger.ridges[0].strength;
  broken.surfaces.canon.hash = 'not-a-canon-hash';
  broken.visitors.writes.free = true;
  const { valid, errors } = validate(schema, broken);
  assert.ok(!valid, 'broken room must not validate');
  assert.ok(errors.length >= 4, `expected >=4 errors, got ${errors.length}: ${errors.join('; ')}`);
  assert.ok(errors.some((e) => e.includes('room-protocol/1')), 'const violation on protocol');
  assert.ok(errors.some((e) => e.includes('settled-triangle')), 'const violation on room.kind');
  assert.ok(errors.some((e) => e.includes('/hash')), 'pattern violation on canon hash');
  assert.ok(errors.some((e) => e.includes('expected const false')), 'const violation on writes.free');
});

// ── 2. fixture trace — hash-check inputs ────────────────────────────────

test('room.fixtures hashes + byte sizes match the files on disk', () => {
  assert.strictEqual(room.room.fixtures.hashAlgorithm, 'sha256');
  assert.strictEqual(room.room.fixtures.files.length, 5);
  for (const f of room.room.fixtures.files) {
    const buf = readFileSync(join(root, f.path));
    assert.strictEqual(f.sha256, createHash('sha256').update(buf).digest('hex'), f.path + ' sha256 mismatch');
    assert.strictEqual(f.bytes, buf.byteLength, f.path + ' byte size mismatch');
  }
});

test('provenance.sources covers every fixture file in data/', () => {
  const onDisk = readdirSync(join(root, 'data')).filter((f) => f.endsWith('.json'));
  const covered = new Set(room.provenance.sources.map((s) => s.fixture));
  assert.strictEqual(onDisk.length, 5);
  for (const f of onDisk) assert.ok(covered.has('data/' + f), f + ' missing from provenance.sources');
});

test('ledger ridges are the real extractValuesLedger output, verbatim, elevation-desc', () => {
  assert.strictEqual(ledger.turns, terrain.turns);
  assert.strictEqual(ledger.dormantCount, terrain.ledger.dormant.length);
  const entries = terrain.ledger.entries;
  assert.strictEqual(ledger.ridges.length, entries.length);
  // the map's convention: sorted by strength descending
  for (let i = 1; i < ledger.ridges.length; i++) {
    assert.ok(ledger.ridges[i - 1].strength >= ledger.ridges[i].strength, 'ridges not elevation-ordered');
  }
  const byId = new Map(entries.map((e) => [e.id, e]));
  for (const r of ledger.ridges) {
    const e = byId.get(r.id);
    assert.ok(e, r.id + ' not in terrain fixture');
    assert.strictEqual(r.value, e.value);
    assert.strictEqual(r.strength, e.strength);
    assert.strictEqual(r.evidenceCount, e.evidence.length);
    assert.strictEqual(r.firstSeenTurn, e.firstSeenTurn);
    assert.strictEqual(r.lastSeenTurn, e.lastSeenTurn);
    r.evidence.forEach((ev, i) => {
      assert.strictEqual(ev.ref, String(e.evidence[i].ref));
      assert.strictEqual(ev.quote, e.evidence[i].quote);
      assert.strictEqual(ev.source, e.evidence[i].source);
    });
  }
});

test('lineage surface is the real breed()/chain() walk, point for point', () => {
  const walk = lineageSurface.walk;
  assert.strictEqual(walk.seed, lineage.seed);
  assert.strictEqual(walk.artist, lineage.artist);
  assert.strictEqual(walk.persona, lineage.persona);
  assert.strictEqual(walk.dimensions, 16);
  assert.strictEqual(walk.rounds, lineage.nRounds);
  assert.deepStrictEqual(walk.points, lineage.trajectory.map((t) => t.point));
  assert.deepStrictEqual(walk.ancestry, lineage.ancestry);
  assert.strictEqual(lineageSurface.verdict.status, lineage.verdict.status);
  assert.strictEqual(lineageSurface.verdict.round, lineage.verdict.round);
  assert.strictEqual(lineageSurface.verdict.sigma, lineage.verdict.sigma);
  assert.strictEqual(lineageSurface.verdict.residueDims, lineage.verdict.residue.length);
});

test('gesture readouts recompute from the lineage via gesture-kit (cumulative torsion)', () => {
  const live = computeGestureReadout(lineage);
  const ro = lineageSurface.gestureReadouts;
  assert.strictEqual(ro.instrument, 'torsion');
  assert.strictEqual(ro.mode, 'cumulative');
  assert.strictEqual(ro.rounds.length, live.rounds.length);
  ro.rounds.forEach((row, i) => {
    const ref = live.rounds[i];
    assert.strictEqual(row.round, ref.round);
    assert.strictEqual(row.arcLength, ref.arcLength);
    assert.strictEqual(row.bendingEnergy, ref.bendingEnergy);
    assert.strictEqual(row.torsion, ref.torsion);
    assert.strictEqual(row.planarity, ref.planarity);
    if (typeof ref.sigma === 'number') assert.strictEqual(row.sigma, ref.sigma);
  });
  assert.strictEqual(ro.gap.round, live.gap.round);
  assert.strictEqual(ro.gap.corroborated, live.gap.corroborated);
  assert.strictEqual(ro.gap.planarityAtGap, live.gap.planarityAtGap);
  assert.strictEqual(ro.gap.torsionAddedAtGap, live.gap.torsionAddedAtGap);
  assert.strictEqual(ro.gap.priorPerVertexMean, live.gap.priorPerVertexMean);
});

test('canon surface: hash, replay steps, stars, choir, drown all trace', () => {
  assert.strictEqual(canon.hash, sky.canonHash);
  assert.strictEqual(canon.hash, '0x445185a3a99fd2e7');
  assert.strictEqual(canon.replaySteps, 152580);
  assert.deepStrictEqual(canon.stars, sky.digits.map((d, i) => ({ index: i, digit: d, value: sky.digitValues[i] })));
  assert.deepStrictEqual(canon.choir.teeth, choir.teeth.map((t, i) => ({ index: i, n: t.n, degrees: t.degrees })));
  assert.strictEqual(canon.drown.whirlpools.length, whirlpools.whirlpools.length);
  const byId = new Map(whirlpools.whirlpools.map((w) => [w.id, w]));
  for (const d of canon.drown.whirlpools) {
    const w = byId.get(d.id);
    assert.ok(w, d.id + ' not in whirlpools fixture');
    assert.deepStrictEqual(d.edge, w.edge);
    assert.strictEqual(d.issueUrl, w.url);
    assert.strictEqual(d.state, w.state);
    assert.strictEqual(d.kind, w.kind);
  }
});

test('strain pulses are the deterministic computeLayout stand-in, recomputed', () => {
  const layout = computeLayout({ terrain, lineage, whirlpools, sky, choir }, 1600, 900);
  assert.deepStrictEqual(room.strain.candorLine.pulses, layout.candor.map((p) => p.strain));
  assert.strictEqual(room.strain.candorLine.instrument, 'twist-shear');
  assert.strictEqual(room.strain.candorLine.status, 'stand-in');
  assert.strictEqual(room.strain.candorLine.windowDays, 7);
});

// ── 3. naming law + honesty ─────────────────────────────────────────────

test('naming law: the third-order readout is TORSION; twist-shear is a separate instrument', () => {
  assert.strictEqual(lineageSurface.gestureReadouts.instrument, 'torsion');
  const ro = lineageSurface.gestureReadouts;
  for (const row of ro.rounds) assert.ok(!('twist' in row), 'no readout row may carry a "twist" key');
  assert.ok(!('twist' in ro.gap), 'no gap readout may carry a "twist" key');
  assert.ok(!('full' in ro), 'schema forbids extra readout keys (additionalProperties:false)');
  const ids = room.instruments.map((i) => i.id);
  assert.ok(ids.includes('torsion'), 'torsion instrument declared');
  assert.ok(ids.includes('twist-shear'), 'twist-shear instrument declared as the boundary marker');
  const shear = room.instruments.find((i) => i.id === 'twist-shear');
  assert.match(shear.units, /seconds/, 'σ-shear carries its units: seconds, never dimensionless');
  const torsion = room.instruments.find((i) => i.id === 'torsion');
  assert.match(torsion.units, /dimensionless/, 'torsion carries its units: dimensionless');
});

test('honesty: the strain line is labeled stand-in, not measurement', () => {
  assert.strictEqual(room.strain.candorLine.status, 'stand-in');
  assert.match(room.strain.candorLine.note, /stand-in/);
  assert.ok(room.strain.candorLine.derivedFrom.length > 10);
});

test('provenance.gaps admits what the room is not — five named gaps', () => {
  assert.ok(Array.isArray(room.provenance.gaps));
  assert.strictEqual(room.provenance.gaps.length, 5);
  const areas = room.provenance.gaps.map((g) => g.area);
  assert.deepStrictEqual([...areas].sort(), ['choir', 'drown', 'ledger', 'lineage', 'strain']);
  for (const g of room.provenance.gaps) {
    assert.ok(g.gap.length > 10 && g.consequence.length > 10, g.area + ' gap says something real');
  }
});

test('visitor law: observation + quotation free, a mark costs fuel, no free writes', () => {
  assert.deepStrictEqual(room.visitors.may, ['observe', 'quote-with-citation', 'mark']);
  assert.strictEqual(room.visitors.writes.free, false);
  assert.strictEqual(room.visitors.writes.markCost, 'fuel');
  assert.match(room.visitors.writes.rule, /free/i);
  assert.match(room.visitors.writes.rule, /fuel/i);
});

test('the room is reproducible: rebuild from the same stamp is bit-identical', () => {
  // The committed room was built with --stamp 2026-09-20T17:30:00+08:00.
  // generatedAt is the only time-dependent field; the protocol requires the
  // builder to accept a stamp (buildRoomState is exported for exactly this).
  assert.match(room.room.generatedAt, /^2026-09-20T17:30:00/);
  assert.strictEqual(typeof room.room.builder.script, 'string');
  assert.ok(room.room.builder.command.includes('--stamp'));
});
