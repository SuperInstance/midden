/* gesture-panel.mjs — read the rescued walk, third order.
 *
 * The Understory's ℚ¹⁶ walk (data/lineage.json, real breed()+chain() from
 * q16-trajectories PR #1) read through the fleet's gesture instrument —
 * vendored gesture-kit (vendor/gesture-kit/gesture.js, MIT, zero-dep).
 *
 * The math core (buildWalk / computeGestureReadout / corroboration) is pure
 * and headless: no DOM, no fetch, no clock — the tests run it under
 * node --test. The DOM panel at the bottom only activates in a browser.
 *
 * Naming law (fleet): gesture-kit's twistEnergy is discrete Frenet TORSION —
 * in all UI copy below it is called "torsion". twist-engine's σ-shear
 * instrument stays "twist". Never conflate.
 *
 * Aesthetic reference: Dieter Rams meets Moebius — same dusk palette as
 * midden.js. No blue-purple slop.
 */

import { Gesture } from './vendor/gesture-kit/gesture.js';

// Mirrored from PALETTE in midden.js (kept inline: the panel must boot
// standalone under a module script, independent of classic-script order).
const P = {
  skyTop: '#0a0d1f',
  waterDeep: '#040814',
  horizon: '#c8561e',      // ember — reserved for the gap row
  horizonSoft: '#e8a34f',  // lamp amber
  filament: '#52f2c8',     // bioluminescent mint — the walk's own glow
  filamentDim: '#2a8f78',
  lattice: '#3b4a6b',
  candor: '#ffd9a0',
  text: '#cfd8e6',
};

// ── Math core (headless; tested under node --test) ─────────────────────

/** The walk as gesture-kit wants it: ordered points, oldest first. */
export function buildWalk(lineage) {
  if (!lineage || !Array.isArray(lineage.trajectory)) {
    throw new TypeError('lineage.trajectory must be an array of {round, point}');
  }
  return lineage.trajectory.map((t) => t.point);
}

/** One row per round: the gesture of everything walked SO FAR, read at that
 *  round. arc/bend/torsion are cumulative; planarity is the scale-free
 *  third-order reading (1 = flat, toward 0 as the path keeps leaving its
 *  plane). Rounds too short to twist report planarity 1 — honest, not a bug. */
export function computeGestureReadout(lineage) {
  const points = buildWalk(lineage);
  const verdict = lineage.verdict || {};
  const gapRound = Number.isInteger(verdict.round) ? verdict.round : points.length - 1;

  const rounds = points.map((_, r) => {
    const g = new Gesture(points.slice(0, r + 1));
    const row = {
      round: r,
      arcLength: g.arcLength(),
      bendingEnergy: g.bendingEnergy(),
      torsion: g.twistEnergy(),     // Frenet torsion — NOT twist-engine's twist
      planarity: g.planarity(),
      stress: g.stressProfile(),
    };
    const tr = lineage.trajectory[r];
    if (tr && typeof tr.sigma === 'number') row.sigma = tr.sigma;
    return row;
  });

  const full = new Gesture(points);
  const p = rounds.map((row) => row.planarity);

  // HONEST-GAP corroboration, computed — never asserted. The verdict names a
  // round; the question is whether the third-order reading at that round is
  // measurably different from its neighbors. The gap round is the LAST round
  // of this walk, so its two nearest neighbors are the two rounds before it.
  const n = p.length;
  const iGap = Math.min(Math.max(0, gapRound), n - 1);
  const iA = Math.max(0, iGap - 1);
  const iB = Math.max(0, iGap - 2);
  const neighbors = [p[iA], p[iB]];
  const localMax = p[iGap] > neighbors[0] && p[iGap] > neighbors[1];
  const localMin = p[iGap] < neighbors[0] && p[iGap] < neighbors[1];
  const corroborated = localMax || localMin;

  // Mechanism: how much torsion did the step INTO the gap round add, vs the
  // mean per-vertex torsion of everything before it? Keeps the corroboration
  // honest about WHAT kind of difference it is (hesitation vs flattening vs
  // lurch). The step into the gap is the segment from round iGap-1 → iGap.
  const iPrev = Math.max(0, iGap - 1);
  const torsionAdded = rounds[iGap].torsion - rounds[iPrev].torsion;
  const priorMean = iGap > 0
    ? rounds[iPrev].torsion / Math.max(1, rounds[iPrev].stress.length)
    : 0;

  let line;
  if (corroborated) {
    const dir = localMax ? 'a hesitation, not a flattening' : 'a lurch, not a flattening';
    line =
      `planarity corroborates the gap (r${iGap} = ${p[iGap].toFixed(4)} vs ` +
      `neighbors ${neighbors[0].toFixed(4)}, ${neighbors[1].toFixed(4)}) — ` +
      `the step into round ${iGap} adds torsion ${torsionAdded.toFixed(4)}, ` +
      `${Math.abs(1 - torsionAdded / Math.max(1e-12, priorMean)) >= 0.05
        ? `~${Math.round(Math.abs(1 - torsionAdded / Math.max(1e-12, priorMean)) * 100)}% ${torsionAdded < priorMean ? 'below' : 'above'} the prior per-vertex mean ${priorMean.toFixed(4)}: `
        : `near the prior per-vertex mean ${priorMean.toFixed(4)}: `}` +
      dir;
  } else {
    line =
      `planarity does not corroborate the gap (r${iGap} = ${p[iGap].toFixed(4)} vs ` +
      `neighbors ${neighbors[0].toFixed(4)}, ${neighbors[1].toFixed(4)}) — ` +
      `no measurable third-order separation at the verdict's round; ` +
      `the gap lives in another order, or this instrument is blind to it`;
  }

  return {
    nRounds: points.length,
    dimensions: points[0]?.length ?? 0,
    rounds,
    full: {
      arcLength: full.arcLength(),
      bendingEnergy: full.bendingEnergy(),
      torsion: full.twistEnergy(),
      planarity: full.planarity(),
      stress: full.stressProfile(),
    },
    gap: {
      round: iGap,
      verdictStatus: verdict.status ?? null,
      corroborated,
      planarityAtGap: p[iGap],
      neighbors: { rounds: [iA, iB], values: neighbors },
      torsionAddedAtGap: torsionAdded,
      priorPerVertexMean: priorMean,
      line,
    },
  };
}

// ── DOM panel (browser only; no-op under node --test) ──────────────────

const CSS = `
#gesture-panel {
  position: fixed; top: 12px; right: 12px; width: 272px; z-index: 10;
  background: ${P.waterDeep}e6; border: 1px solid ${P.lattice};
  padding: 12px 14px 10px; font: 11px/1.5 ui-monospace, monospace;
  color: ${P.text}; pointer-events: auto;
}
#gesture-panel h2 {
  margin: 0 0 2px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  color: ${P.filament}; text-transform: uppercase;
}
#gesture-panel .sub { margin: 0 0 10px; font-size: 10px; color: ${P.filamentDim}; }
#gesture-panel .summary { display: grid; grid-template-columns: auto 1fr; gap: 1px 10px; margin-bottom: 10px; }
#gesture-panel .summary dt { color: ${P.filamentDim}; }
#gesture-panel .summary dd { margin: 0; text-align: right; color: ${P.text}; }
#gesture-panel ol.rows { list-style: none; margin: 0 0 10px; padding: 0; }
#gesture-panel ol.rows li {
  display: grid; grid-template-columns: 22px 46px 1fr 44px 56px; gap: 6px;
  align-items: center; padding: 1px 0;
}
#gesture-panel .bar { height: 6px; background: ${P.lattice}33; position: relative; }
#gesture-panel .bar i { position: absolute; inset: 0 auto 0 0; background: ${P.filament}; opacity: 0.85; }
#gesture-panel li.gap { color: ${P.horizonSoft}; }
#gesture-panel li.gap .bar i { background: ${P.horizon}; }
#gesture-panel li.gap .tag {
  color: ${P.horizon}; font-size: 9px; letter-spacing: 0.05em; text-align: right;
}
#gesture-panel .corroboration {
  margin: 0 0 8px; padding-top: 8px; border-top: 1px solid ${P.lattice}55;
  color: ${P.candor}; font-size: 10px;
}
#gesture-panel .law { margin: 0; color: ${P.filamentDim}; font-size: 9px; }
`;

function renderPanel(root, readout, lineage) {
  const doc = root.ownerDocument;
  const style = doc.createElement('style');
  style.textContent = CSS;
  doc.head.appendChild(style);
  root.id = 'gesture-panel';

  const fmt = (x, d = 4) => x.toFixed(d);
  const compact = (x) => (x >= 1e6 ? (x / 1e6).toFixed(4) + 'M' : x.toFixed(1));

  const rows = readout.rounds.map((r) => {
    const gapCls = r.round === readout.gap.round ? ' class="gap"' : '';
    const tag = r.round === readout.gap.round
      ? `<span class="tag">${readout.gap.verdictStatus ?? 'GAP'}</span>` : '<span></span>';
    return (
      `<li${gapCls}><span>r${r.round}</span>` +
      `<span>σ${r.sigma !== undefined ? fmt(r.sigma, 3) : '—'}</span>` +
      `<span class="bar"><i style="width:${(r.planarity * 100).toFixed(1)}%"></i></span>` +
      `<span>${fmt(r.planarity)}</span>${tag}</li>`
    );
  }).join('');

  root.innerHTML = `
    <h2>read the walk</h2>
    <p class="sub">the rescued ℚ¹⁶ walk through gesture-kit — third order (torsion)</p>
    <dl class="summary">
      <dt>arc</dt><dd>${compact(readout.full.arcLength)} ℚ-units</dd>
      <dt>bend</dt><dd>${fmt(readout.full.bendingEnergy)}</dd>
      <dt>torsion</dt><dd>${fmt(readout.full.torsion)}</dd>
      <dt>planarity</dt><dd>${fmt(readout.full.planarity)}</dd>
    </dl>
    <ol class="rows">${rows}</ol>
    <p class="corroboration">${readout.gap.line}</p>
    <p class="law">torsion (gesture-kit) ≠ twist (twist-engine) — different instruments, same fleet law.</p>
  `;
}

async function bootPanel() {
  let root = document.getElementById('gesture-panel');
  if (!root) {
    root = document.createElement('aside');
    document.body.appendChild(root);
  }
  try {
    const lineage = await fetch('data/lineage.json').then((r) => r.json());
    renderPanel(root, computeGestureReadout(lineage), lineage);
  } catch (err) {
    root.innerHTML = `<p class="law">gesture panel could not load the walk: ${String(err)}</p>`;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPanel);
  } else {
    bootPanel();
  }
}
