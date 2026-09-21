/* build-room-state.mjs — generate protocol/midden-room.json from the real fixtures.
 *
 * Lane Z (room-protocol). SCHEMA-FIRST: this script is the ONLY way the
 * reference room is produced, and it produces it exclusively from the
 * committed fixtures in data/ plus in-repo deterministic derivations:
 *
 *   data/terrain.json      → surfaces.ledger   (extractValuesLedger output, verbatim)
 *   data/lineage.json      → surfaces.lineage  (the rescued walk + verdict, verbatim)
 *                            + gestureReadouts (vendored gesture-kit TORSION,
 *                              via gesture-panel.mjs math core — never twist)
 *   data/whirlpools.json   → surfaces.canon.drown (the 4 real canon edge gaps)
 *   data/sky.json          → surfaces.canon.{hash,replaySteps,stars}
 *   data/choir.json        → surfaces.canon.choir (convergentGaps(8), verbatim)
 *   midden.js computeLayout → strain.candorLine.pulses (deterministic stand-in,
 *                              labeled stand-in — no real transcript week yet)
 *
 * Every fixture's raw bytes are sha256-hashed into room.fixtures — that hash
 * is the trace anchor the tests re-check. Regenerate:
 *
 *   node protocol/build-room-state.mjs --stamp 2026-09-20T17:30:00+08:00
 *
 * --stamp (or SOURCE_DATE_EPOCH) makes the build reproducible: same stamp,
 * same bytes in data/, same room state, bit for bit.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeGestureReadout } from '../gesture-panel.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const FIXTURES = ['terrain.json', 'lineage.json', 'whirlpools.json', 'sky.json', 'choir.json'];

const raw = (name) => readFileSync(join(root, 'data', name));
const load = (name) => JSON.parse(raw(name));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function stampFrom(argv, env) {
  const i = argv.indexOf('--stamp');
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  if (env.SOURCE_DATE_EPOCH) return new Date(Number(env.SOURCE_DATE_EPOCH) * 1000).toISOString();
  return new Date().toISOString();
}

/** The full visitable state of the midden, built from the real fixtures. */
export async function buildRoomState(stamp) {
  const terrain = load('terrain.json');
  const lineage = load('lineage.json');
  const whirlpools = load('whirlpools.json');
  const sky = load('sky.json');
  const choir = load('choir.json');

  // ── room + fixture hashes (the trace anchor) ──────────────────────────
  const room = {
    id: 'midden',
    title: 'the midden at dusk',
    kind: 'settled-triangle',
    generatedAt: stamp,
    builder: {
      script: 'protocol/build-room-state.mjs',
      command: 'node protocol/build-room-state.mjs --stamp <ISO-8601>',
    },
    fixtures: {
      hashAlgorithm: 'sha256',
      files: FIXTURES.map((name) => {
        const buf = raw(name);
        return { path: `data/${name}`, sha256: sha256(buf), bytes: buf.byteLength };
      }),
    },
  };

  // ── instruments ────────────────────────────────────────────────────────
  // Naming law (fleet): gesture-kit's twistEnergy is discrete Frenet
  // TORSION — it is called torsion here, always. twist-engine's σ-shear
  // (units: seconds) is a different instrument and is named separately so
  // no number can drift across the boundary.
  const instruments = [
    {
      id: 'torsion',
      label: 'gesture-kit torsion (discrete Frenet)',
      order: 3,
      measures: 'third-order turning of a walked path; the Understory readout, round by round',
      units: 'dimensionless (cumulative 1−cos turning; planarity 1 = flat)',
      source: {
        repo: 'SuperInstance/gesture-kit',
        ref: '8cd5aa415235b41e4aa944104dd796f163510b0c',
        license: 'MIT',
        vendoredAt: 'vendor/gesture-kit/gesture.js',
      },
    },
    {
      id: 'twist-shear',
      label: 'twist-engine σ-shear',
      order: 2,
      measures: "commensuration strain of a transcript under re-measurement — a room's candor line",
      units: 'seconds (σ = 0.24·s, grid = 0.6·s, honest regime 0.15°–6°)',
      source: {
        repo: 'SuperInstance/twist-engine',
        ref: 'docs/1-physicist.md §I (instrument constants, verified in-tree)',
        note: 'named to mark the boundary: it produces NO numbers in this room state yet — the strain pulses below are a declared stand-in, not a σ-shear measurement',
      },
    },
  ];

  // ── surface 1: the ledger surface (values → ridges; terrain.json) ──────
  const ridges = [...terrain.ledger.entries]
    .sort((a, b) => b.strength - a.strength) // the map's convention: elevation desc
    .map((e) => ({
      id: e.id,
      value: e.value,
      strength: e.strength,
      evidenceCount: e.evidence.length,
      firstSeenTurn: e.firstSeenTurn,
      lastSeenTurn: e.lastSeenTurn,
      evidence: e.evidence.map((ev) => ({ ref: String(ev.ref), quote: ev.quote, source: ev.source })),
    }));

  const ledger = {
    source: 'extractValuesLedger',
    provenance: terrain.source,
    turns: terrain.turns,
    dormantCount: terrain.ledger.dormant.length,
    ridges,
    floor: {
      kind: 'integer-lattice',
      axes: ['k', 's'],
      rule: 'identity is exact integers; floats never touch identity (quilt-studio floor law)',
    },
  };

  // ── surface 2: the lineage surface (walks → understory; lineage.json) ──
  const readout = computeGestureReadout(lineage);
  const g = readout.gap;
  const mechanism = !g.corroborated
    ? 'none'
    : g.torsionAddedAtGap < g.priorPerVertexMean
      ? 'hesitation'
      : 'lurch';

  const lineageSurface = {
    source: 'breed()/chain()',
    walk: {
      seed: lineage.seed,
      artist: lineage.artist,
      persona: lineage.persona,
      dimensions: readout.dimensions,
      rounds: readout.nRounds,
      points: buildWalkPoints(lineage),
      ancestry: lineage.ancestry.map((a) => ({ from: a.from, to: a.to, driftQ: a.driftQ, sigmaDrop: a.sigmaDrop })),
    },
    verdict: {
      status: lineage.verdict.status,
      round: lineage.verdict.round,
      sigma: lineage.verdict.sigma,
      residueDims: lineage.verdict.residue.length,
    },
    gestureReadouts: {
      instrument: 'torsion',
      mode: 'cumulative',
      rounds: readout.rounds.map((r) => {
        const row = {
          round: r.round,
          arcLength: r.arcLength,
          bendingEnergy: r.bendingEnergy,
          torsion: r.torsion,
          planarity: r.planarity,
        };
        if (typeof r.sigma === 'number') row.sigma = r.sigma;
        return row;
      }),
      gap: {
        round: g.round,
        corroborated: g.corroborated,
        planarityAtGap: g.planarityAtGap,
        mechanism,
        torsionAddedAtGap: g.torsionAddedAtGap,
        priorPerVertexMean: g.priorPerVertexMean,
      },
    },
  };

  // ── surface 3: the canon surface (hash → sky; gaps → drown; comb → choir) ──
  const steps = /exactly\s+([\d,]+)\s+steps/.exec(sky.source);
  if (!steps) throw new Error('sky.json source does not cite the exact step count — fixture drift?');
  const replaySteps = parseInt(steps[1].replace(/,/g, ''), 10);

  const canon = {
    hash: sky.canonHash,
    replaySteps,
    stars: sky.digits.map((d, i) => ({ index: i, digit: d, value: sky.digitValues[i] })),
    choir: {
      teeth: choir.teeth.map((t, i) => ({ index: i, n: t.n, degrees: t.degrees })),
      unplayableStrata: 1,
      unplayableBasis: 'docs/0-THE-MIDDEN.md §Geography (world doctrine — the fixture carries no playability field; see provenance.gaps)',
    },
    drown: {
      note: 'the canon\'s unACKed edges, filed live; paying a debt reopens the channel',
      whirlpools: whirlpools.whirlpools.map((w) => ({
        id: w.id,
        edge: { from: w.edge.from, to: w.edge.to },
        issueUrl: w.url,
        state: w.state,
        kind: w.kind,
      })),
    },
  };

  // ── the live wire: strain pulses (declared stand-in, honest) ───────────
  const mod = await import('../midden.js');
  const { computeLayout } = mod.default ?? mod;
  const layout = computeLayout({ terrain, lineage, whirlpools, sky, choir }, 1600, 900);
  const candorLine = {
    instrument: 'twist-shear',
    sourceRoom: terrain.room,
    windowDays: 7,
    status: 'stand-in',
    note: 'no real transcript week exists yet (the candor lane shipped an honest null). These pulses are the deterministic stand-in shape from midden.js computeLayout — a labeled placeholder for the first real σ-shear reading, not a measurement.',
    derivedFrom: 'midden.js computeLayout(data,1600,900).candor[].strain (deterministic)',
    pulses: layout.candor.map((p) => p.strain),
  };

  // ── visitor law ─────────────────────────────────────────────────────────
  const visitors = {
    may: ['observe', 'quote-with-citation', 'mark'],
    writes: {
      free: false,
      markCost: 'fuel',
      rule: 'Observation and quotation are free. A mark is a claim on the room: it burns fuel proportional to what it asserts, and it lands only where the surfaces already carry the evidence. room-protocol/1 ships read-only — the mark affordance declares the seam; the fuel meter lands with the write protocol.',
    },
  };

  // ── provenance: sources + honest gaps ────────────────────────────────────
  const provenance = {
    sources: [
      {
        fixture: 'data/terrain.json',
        repo: 'SuperInstance/the-tap',
        ref: 'lane-l-commune-deep @ 42f878e — workers/room-worker/src/values-ledger.ts over test/commune-harness.mjs',
        note: 'real extractor, mock commune, 20 turns',
      },
      {
        fixture: 'data/lineage.json',
        repo: 'SuperInstance/q16-trajectories',
        ref: 'PR #1 lane-n-q16-bridge @ bfd7ee8 — src/breed.js + src/chain()',
        note: 'the rescued ℚ¹⁶ walk; verdict HONEST GAP @ r7',
      },
      {
        fixture: 'data/whirlpools.json',
        repo: 'SuperInstance/{duke-lab,tidepool,quilt-canon-cli}',
        ref: 'issues #4 — verified OPEN at authoring time',
        note: 'the canon\'s real unACKed edges',
      },
      {
        fixture: 'data/sky.json',
        repo: 'the fleet canon',
        ref: 'sandbox proof replayed in exactly 152,580 steps',
        note: 'stars fixed at the hash digits; navigation error is impossible',
      },
      {
        fixture: 'data/choir.json',
        repo: 'SuperInstance/quilt-studio',
        ref: 'packages/quilt-floor/src/golden.mjs convergentGaps(8) @ 5821ebf0b4c30d45559a076a97aa76a8693d6f32',
        note: 'exact code output, not the dream\'s ~0.75° approximation',
      },
    ],
    gaps: [
      {
        area: 'ledger',
        gap: 'no achieved/ ledger exists on disk — the terrain is a mock commune run through the real extractor',
        consequence: 'the first real room death re-settles this surface; strengths here are harness-grounded, not fleet-grounded',
      },
      {
        area: 'strain',
        gap: 'no real transcript week exists yet — the candor lane shipped an honest null',
        consequence: 'pulses are a deterministic stand-in, labeled stand-in; swap for a measured σ-shear reading when candor lands',
      },
      {
        area: 'lineage',
        gap: 'one rescued walk only — the Understory is a single hypha',
        consequence: 'fusion and birth surfaces are unsettled; no Meeting of Waters can be addressed yet',
      },
      {
        area: 'choir',
        gap: 'the fixture carries no playability field; the one-unplayable-stratum line is world doctrine from the dream doc',
        consequence: 'verify against golden.mjs output before the first Moot is scheduled',
      },
      {
        area: 'drown',
        gap: 'whirlpool state was verified OPEN at authoring time; issues are live state and can close',
        consequence: 're-run the builder to re-settle; a closed debt is terrain with better grip (the scar-line law)',
      },
    ],
  };

  return {
    protocol: 'room-protocol/1',
    room,
    instruments,
    surfaces: { ledger, lineage: lineageSurface, canon },
    strain: { candorLine },
    visitors,
    provenance,
  };
}

function buildWalkPoints(lineage) {
  return lineage.trajectory.map((t) => t.point);
}

// ── CLI ──────────────────────────────────────────────────────────────────
const invokedDirectly = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const stamp = stampFrom(process.argv.slice(2), process.env);
  const state = await buildRoomState(stamp);
  const out = join(root, 'protocol', 'midden-room.json');
  writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
  console.log(`wrote ${out} (${state.room.fixtures.files.length} fixtures hashed, stamp ${stamp})`);
}
