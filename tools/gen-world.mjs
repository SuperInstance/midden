/* gen-world.mjs — export the midden lineage/walk to static JSON for the
 * walkable communal world model (world/index.html).
 *
 * Inputs (all REAL, provenance in data/PROVENANCE.md):
 *   - data/lineage.json  — the rescued 8-round × 16-dim ℚ¹⁶ walk
 *     (q16-trajectories PR #1 @ bfd7ee8, real breed()+chain()),
 *     verdict HONEST GAP @ round 7.
 *   - vendor/gesture-kit/gesture.js — the fleet's third-order instrument
 *     (arc / bend / torsion / planarity), same one gesture-panel.mjs uses.
 *
 * Outputs:
 *   - world/world.json     — machine-readable export (smoke-tested)
 *   - world/world-data.js  — the same object as `window.WORLD = {...}` so the
 *     world can boot from file:// with zero fetches (browsers gate fetch() on
 *     HTTP; file:// would CORS-trap it).
 *
 * Honesty law: rooms sourced from the real walk are `provenance: "REAL"`.
 * The walk ends at round 7 — the gap round — so the world extends past it
 * with a deterministic, documented continuation labeled `provenance:
 * "SYNTHETIC"` on every room, segment and walk it touches. The continuation
 * is arithmetic on the real last four rounds (damped per-feature least-squares
 * slope, clamped to the walk's own [0, 1e6] ℚ-range), NOT new fleet output.
 * Nothing synthetic is ever tagged as a verdict.
 *
 * Naming law (fleet): gesture-kit's twistEnergy() is discrete Frenet TORSION.
 * Everything below labeled "torsion" is that instrument — never twist-engine
 * twist.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Gesture } from '../vendor/gesture-kit/gesture.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, 'world');

// ── Guards: the exporter refuses to ship if the real instrument drifts from
// the numbers documented in docs/GESTURE-NOTES.md (guarded there by
// test/gesture-panel.test.mjs). Catches silent upstream changes.
const NOTES = {
  planarity: { r5: 0.316991, r6: 0.315850, r7: 0.339231 },
  torsion: { r6: 3.420749, r7: 3.964612 },
  torsionStepIntoGap: 0.543864,
  priorPerVertexMean: 0.68415,
  arc: { r6: 1158131.4, r7: 1328817.9 },
};

// ── Synthetic continuation ────────────────────────────────────────────────
const SYNTH_ROUNDS = 4;          // r8..r11
const SYNTH_METHOD =
  'damped per-feature least-squares slope over real rounds 4..7, decay 0.85 ' +
  'per step, clamped to the walk\'s own [0, 1000000] Q-range, rounded to ' +
  'integers. Deterministic; no randomness, no model output, no verdict.';

/** Least-squares slope of y over the last `w` points. */
function slope(ys) {
  const n = ys.length;
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (ys[i] - my);
    den += (i - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** Continue the real trajectory SYNTH_ROUNDS past its end. Deterministic. */
function continueTrajectory(trajectory) {
  const out = trajectory.map((t) => ({ ...t, point: t.point.slice() }));
  const window = trajectory.slice(-4).map((t) => t.point); // real rounds 4..7
  let step = 0;
  let last = out[out.length - 1];
  for (let s = 0; s < SYNTH_ROUNDS; s++) {
    step += 1;
    const damp = 0.85 ** step;
    const point = last.point.map((v, d) => {
      const b = slope(window.map((p) => p[d]));
      const next = v + b * damp;
      return Math.max(0, Math.min(1e6, Math.round(next)));
    });
    const sigma = Math.max(0.05, +(last.sigma * (1 - 0.01 * step)).toFixed(4));
    last = { round: last.round + 1, point, sigma, persona: 'purist' };
    out.push(last);
  }
  return out;
}

// ── Layout: project ℚ¹⁶ onto the two highest-variance REAL feature axes ────
/** Per-feature variance across the REAL rounds only — layout is decided on
 *  real data, then applied unchanged to the synthetic extension. */
function featureVariance(points) {
  const dims = points[0].length;
  const out = [];
  for (let d = 0; d < dims; d++) {
    const col = points.map((p) => p[d]);
    const m = col.reduce((a, b) => a + b, 0) / col.length;
    out.push({ dim: d, variance: col.reduce((a, b) => a + (b - m) ** 2, 0) / col.length });
  }
  return out.sort((a, b) => b.variance - a.variance);
}

function layout(points, dims, spanX, spanZ) {
  const [dx, dz] = dims;
  const xs = points.map((p) => p[dx]);
  const zs = points.map((p) => p[dz]);
  const lo = (a) => Math.min(...a);
  const hi = (a) => Math.max(...a);
  const sx = (hi(xs) - lo(xs)) || 1;
  const sz = (hi(zs) - lo(zs)) || 1;
  return points.map((p, i) => ({
    x: +(((p[dx] - lo(xs)) / sx - 0.5) * spanX).toFixed(3),
    z: +(((p[dz] - lo(zs)) / sz - 0.5) * spanZ).toFixed(3),
    y: 0,
    i,
  }));
}

// ── Export ────────────────────────────────────────────────────────────────
export function buildWorld(lineage) {
  if (!lineage || !Array.isArray(lineage.trajectory) || lineage.trajectory.length < 2) {
    throw new TypeError('lineage.trajectory must be an array of ≥2 {round, point}');
  }
  const realTraj = lineage.trajectory;
  const nReal = realTraj.length;
  const dims = realTraj[0].point.length;
  const verdict = lineage.verdict || {};
  const gapRound = Number.isInteger(verdict.round) ? verdict.round : nReal - 1;

  // 1. synthetic continuation past the gap
  const traj = continueTrajectory(realTraj);
  const points = traj.map((t) => t.point);

  // 2. cumulative third-order readout per round (same instrument as the panel)
  const rounds = points.map((_, r) => {
    const g = new Gesture(points.slice(0, r + 1));
    return {
      round: r,
      arcLength: g.arcLength(),
      bendingEnergy: g.bendingEnergy(),
      torsion: g.twistEnergy(),
      planarity: g.planarity(),
      sigma: traj[r].sigma,
    };
  });

  // 3. guard the REAL rows against the documented numbers
  const near = (a, b, eps = 5e-4) => Math.abs(a - b) <= eps;
  const checks = [
    ['planarity r5', rounds[5].planarity, NOTES.planarity.r5],
    ['planarity r6', rounds[6].planarity, NOTES.planarity.r6],
    ['planarity r7', rounds[7].planarity, NOTES.planarity.r7],
    ['torsion r6', rounds[6].torsion, NOTES.torsion.r6],
    ['torsion r7', rounds[7].torsion, NOTES.torsion.r7],
    ['arc r6', rounds[6].arcLength, NOTES.arc.r6, 0.5],
    ['arc r7', rounds[7].arcLength, NOTES.arc.r7, 0.5],
  ].map(([name, got, want, eps]) => ({ name, got, want, ok: near(got, want, eps ?? 5e-4) }));
  const bad = checks.filter((c) => !c.ok);
  if (bad.length) {
    throw new Error(
      'gesture instrument drifted from docs/GESTURE-NOTES.md:\n' +
      bad.map((c) => `  ${c.name}: got ${c.got}, documented ${c.want}`).join('\n'),
    );
  }

  // 4. layout on the floor
  const top2 = featureVariance(realTraj.map((t) => t.point)).slice(0, 2).map((v) => v.dim);
  const SPAN_X = 260;
  const SPAN_Z = 200;
  const pos = layout(points, top2, SPAN_X, SPAN_Z);

  // 5. rooms
  const rooms = traj.map((t, r) => {
    const synth = r >= nReal;
    const isGap = r === gapRound && !synth;
    return {
      id: `r${r}`,
      round: r,
      label: synth ? `round ${r} — after the gap` : `round ${r}`,
      provenance: synth ? 'SYNTHETIC' : 'REAL',
      method: synth ? SYNTH_METHOD : undefined,
      honestGap: {
        tagged: isGap,
        status: isGap ? (verdict.status ?? 'HONEST GAP') : null,
      },
      ember: isGap,
      position: pos[r],
      readout: {
        arcLength: +rounds[r].arcLength.toFixed(4),
        bendingEnergy: +rounds[r].bendingEnergy.toFixed(4),
        torsion: +rounds[r].torsion.toFixed(6),
        planarity: +rounds[r].planarity.toFixed(6),
        sigma: traj[r].sigma,
      },
    };
  });
  rooms[nReal - 1].label = `round ${nReal - 1} — the gap (verdict)`;

  // 6. walks — every walk lists the rooms it connects, in order.
  const seg = (a, b, provenance, ancestry) => {
    const ra = rounds[a];
    const rb = rounds[b];
    const arc = rb.arcLength - ra.arcLength;
    const torsion = rb.torsion - ra.torsion;
    return {
      from: `r${a}`,
      to: `r${b}`,
      provenance,
      driftQ: ancestry ? ancestry.driftQ : null,
      sigmaDrop: ancestry ? ancestry.sigmaDrop : null,
      planarityFrom: +ra.planarity.toFixed(6),
      planarityTo: +rb.planarity.toFixed(6),
      planarityDelta: +(rb.planarity - ra.planarity).toFixed(6),
      torsion: +torsion.toFixed(6),
      arc: +arc.toFixed(4),
    };
  };

  const rescued = {
    id: 'rescued-walk',
    label: 'the rescued walk (real — the one duke-lab threw away)',
    provenance: 'REAL',
    rooms: traj.slice(0, nReal).map((t) => `r${t.round}`),
    segments: [],
  };
  for (let r = 1; r < nReal; r++) {
    rescued.segments.push(seg(r - 1, r, 'REAL', lineage.ancestry ? lineage.ancestry[r - 1] : null));
  }

  const next = {
    id: 'what-comes-next',
    label: 'what comes next (SYNTHETIC — continuation past the gap)',
    provenance: 'SYNTHETIC',
    method: SYNTH_METHOD,
    rooms: traj.slice(nReal - 1).map((t) => `r${t.round}`),
    segments: [],
  };
  for (let r = nReal; r < traj.length; r++) next.segments.push(seg(r - 1, r, 'SYNTHETIC', null));

  const whole = {
    id: 'the-whole-floor',
    label: 'the whole floor (real walk, then the labeled continuation)',
    provenance: 'MIXED',
    rooms: traj.map((t) => `r${t.round}`),
    segments: [...rescued.segments, ...next.segments],
  };

  // 7. the gap, as the instrument measures it
  const iGap = gapRound;
  const iA = Math.max(0, iGap - 1);
  const iB = Math.max(0, iGap - 2);
  const p = rounds.map((r) => r.planarity);
  const localMax = p[iGap] > p[iA] && p[iGap] > p[iB];
  const localMin = p[iGap] < p[iA] && p[iGap] < p[iB];
  const torsionAdded = rounds[iGap].torsion - rounds[iGap - 1].torsion;
  // Same denominator the panel uses: interior vertices of the walk up to the
  // round before the gap (points 0..iGap-1 → iGap-2 interior vertices).
  // For this walk: 3.420749 / 5 = 0.684150.
  const priorMean = rounds[iGap - 1].torsion / Math.max(1, iGap - 2);

  const gap = {
    round: iGap,
    status: verdict.status ?? null,
    sigma: verdict.sigma ?? null,
    residueDims: Array.isArray(verdict.residue) ? verdict.residue.length : null,
    planarityAtGap: +p[iGap].toFixed(6),
    neighbors: { rounds: [iA, iB], values: [+p[iA].toFixed(6), +p[iB].toFixed(6)] },
    corroborated: localMax || localMin,
    kind: localMax ? 'hesitation' : localMin ? 'lurch' : 'uncorroborated',
    torsionStepIntoGap: +torsionAdded.toFixed(6),
    priorPerVertexMean: +priorMean.toFixed(6),
    arcStepIntoGap: +(rounds[iGap].arcLength - rounds[iGap - 1].arcLength).toFixed(4),
    line:
      `planarity corroborates the gap (r${iGap} = ${p[iGap].toFixed(4)} vs ` +
      `neighbors ${p[iA].toFixed(4)}, ${p[iB].toFixed(4)}) — the step into round ${iGap} ` +
      `adds torsion ${torsionAdded.toFixed(4)}, ` +
      `~${Math.round((1 - torsionAdded / NOTES.priorPerVertexMean) * 100)}% below the prior ` +
      `per-vertex mean ${NOTES.priorPerVertexMean.toFixed(4)}: ` +
      (localMax ? 'a hesitation, not a flattening' : 'no measurable third-order separation'),
  };

  return {
    schema: 'midden.world/1',
    generatedBy: 'node tools/gen-world.mjs',
    title: 'the midden — the floor you can walk',
    note:
      'rooms are the rounds of the rescued Q^16 walk, laid out on the two ' +
      'highest-variance REAL feature axes; trails are the ancestry edges. ' +
      'The verdict round is the ember room.',
    provenance: {
      source: lineage.source ?? null,
      seed: lineage.seed ?? null,
      artist: lineage.artist ?? null,
      persona: lineage.persona ?? null,
      featuresOrder: lineage.featuresOrder ?? null,
      realRounds: nReal,
      syntheticRounds: traj.length - nReal,
      syntheticMethod: SYNTH_METHOD,
      layoutAxes: {
        x: top2[0],
        z: top2[1],
        rule: 'highest per-feature variance across the REAL rounds only',
      },
    },
    dims: { n: dims, nRounds: traj.length, nRealRounds: nReal },
    rooms,
    walks: [rescued, next, whole],
    gap,
    instrumentChecks: checks.map((c) => ({ name: c.name, ok: c.ok })),
  };
}

// ── CLI ───────────────────────────────────────────────────────────────────
function main() {
  const lineage = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'lineage.json'), 'utf8'));
  const world = buildWorld(lineage);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const json = JSON.stringify(world, null, 2) + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'world.json'), json);

  // file:// build: zero fetches, zero modules.
  const boot = `/* world-data.js — GENERATED by tools/gen-world.mjs. Do not edit by hand.\n` +
    ` * Inlined as a global so world/index.html boots from file:// (no fetch, no modules).\n` +
    ` * Regenerate: node tools/gen-world.mjs\n */\nwindow.WORLD = ${JSON.stringify(world, null, 2)};\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'world-data.js'), boot);

  const real = world.rooms.filter((r) => r.provenance === 'REAL').length;
  const synth = world.rooms.filter((r) => r.provenance === 'SYNTHETIC').length;
  console.log(`world.json + world-data.js written: ${world.rooms.length} rooms ` +
    `(${real} REAL / ${synth} SYNTHETIC), ${world.walks.length} walks, ` +
    `gap r${world.gap.round} ${world.gap.kind}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
