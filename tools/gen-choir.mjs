// gen-choir.mjs — regenerate data/choir.json: the exact commensuration comb.
//
// The retune (choir-retune, 2026-09-20): the sky-choir's teeth are the
// world's commensuration comb as EXACT rational angles. Tooth n rings the
// (n−1)-th supercell revival of the 480-fold supercell:
//
//     θ_n = 360° · (n−1)/480 = 3(n−1)/4°      n = 2..8
//
// Seven bells, evenly spaced at exactly 3/4° — the dream's "~0.75° apart"
// made exact. Every tooth is verified through the vendored Stern–Brocot
// instrument (quilt-studio commensurate.mjs @5821ebf, see
// vendor/quilt-commensurate/PROVENANCE.md): each angle is exactly
// commensurate, error = 0 — not "within tolerance", zero. No float touches
// the rational layer: 3(n−1)/4 is dyadic-exact in f64 for n = 2..8, so the
// JSON rendering is bit-identical to the rational.
//
// Why the coarse ladder died: the old choir shipped convergentGaps(8) floats
// (137.51°, −42.49°, 17.51°, −6.49°, 2.51°, −0.95°, 0.36°). Four of seven
// sat outside the twist instrument's honest regime 0.15°–6.0° (artifacts
// beyond ~2.2°; σ = 0.24·s, grid = 0.60·s — SuperInstance/twist-engine
// app.js, cited in docs/1-physicist.md). The dream's comb lives inside the
// regime; the coarse teeth were the approximation.
//
// Physical anchor for the 3/4° tick: the twist aperture law — chord =
// 2·R0·sin(θ/2) = s — at the canonical 1080p constants (twist-engine
// app.js: s = clamp(min(W,H)/72, 9, 15) = 15, R0 = hypot(1920,1080)/2 +
// 4s = 1161.5) gives θ = 2·asin(15/2323) = 0.7396° — the dream's 0.75°
// within 1.4%. The comb the sim actually resolves there measures mean
// spacing 0.6525° across its 7 windows (0.87°…4.74°, measured headless from
// the real twist.init()). The world keeps the dream's tick, exact: 3/4°.
//
// Regenerate: node tools/gen-choir.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import {
  makeRat, ratToNumber, ratToString, floatToRat, ratCmp, nearestRational,
} from '../vendor/quilt-commensurate/rat.mjs';

export const SUPERCELL = 480; // the world's comb: 480-fold supercell
export const TEETH_N = [2, 3, 4, 5, 6, 7, 8];
export const REGIME = [0.15, 6.0]; // the twist instrument's honest twist regime

// One tooth: the (n−1)-th supercell revival, exact end-to-end.
export function combTooth(n) {
  const k = n - 1; // revival index
  const turns = makeRat(k, SUPERCELL); // exact rational turns
  const degrees = makeRat(360 * k, SUPERCELL); // exact rational degrees (3k/4)

  // instrument verification: nearest rational at denominator ≤ 480 must
  // snap EXACTLY onto the tooth, error exactly 0
  const { rat, error } = nearestRational(turns, SUPERCELL);
  if (ratCmp(rat, turns) !== 0 || ratCmp(error, makeRat(0)) !== 0) {
    throw new Error(`tooth ${n}: not exactly commensurate (got ${ratToString(rat)}, err ${ratToString(error)})`);
  }
  // f64 honesty: the rendered degrees must be the exact dyadic of the
  // rational — no drift between the rational layer and the JSON
  const rendered = ratToNumber(degrees);
  if (ratCmp(floatToRat(rendered), degrees) !== 0) {
    throw new Error(`tooth ${n}: degrees rendering is not the exact dyadic`);
  }
  return { n, turns: ratToString(turns), degrees: rendered };
}

export function buildChoir() {
  const teeth = TEETH_N.map(combTooth);
  return {
    source:
      'midden tools/gen-choir.mjs — exact rational commensuration comb, verified by the ' +
      'vendored Stern–Brocot instrument (SuperInstance/quilt-studio ' +
      '@5821ebf0b4c30d45559a076a97aa76a8693d6f32)',
    note:
      'The 7 teeth of the commensuration comb, retuned exact. Tooth n rings the (n−1)-th ' +
      'supercell revival of the 480-fold supercell: exact rational angle 3(n−1)/4 degrees = ' +
      '(n−1)/480 of a turn. Spacing exactly 0.75° — the dream\'s "~0.75° apart" made exact; ' +
      'every tooth exactly commensurate (error 0, not within tolerance). All teeth inside the ' +
      'twist instrument\'s honest regime 0.15°–6.0°. Regenerate: node tools/gen-choir.mjs',
    supercell: SUPERCELL,
    spacing_degrees: 0.75,
    teeth,
  };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'choir.json');
  writeFileSync(out, JSON.stringify(buildChoir(), null, 2) + '\n');
  console.log('wrote', out);
}
