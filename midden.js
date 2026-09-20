/* midden.js — the midden at dusk, v0.
 *
 * One walkable dusk scene rendered from REAL fleet artifacts (see
 * data/PROVENANCE.md). Single static page, Canvas 2D, no server, no build.
 *
 * Structure: the layout math (computeLayout) is pure and headless — the
 * tests run it under node --test with no DOM. The render + interaction
 * layer only activates in a browser.
 *
 * Aesthetic reference: Dieter Rams meets Moebius — clean, but with
 * personality. Abyssal dusk: deep indigo water, ember horizon,
 * bioluminescent filaments. NOT blue-purple AI slop.
 */
(function (global) {
  'use strict';

  const VERSION = '0.1.0';

  const PALETTE = {
    skyTop: '#0a0d1f',      // near-black indigo
    skyMid: '#1d1a33',
    horizon: '#c8561e',     // ember
    horizonSoft: '#e8a34f', // lamp amber
    water: '#071226',       // deep indigo water
    waterDeep: '#040814',
    rock: '#241d1a',
    rockFace: '#322721',
    crest: '#e8a34f',
    filament: '#52f2c8',    // bioluminescent mint
    filamentDim: '#2a8f78',
    void: '#020409',
    vortexRim: '#67e8f9',
    lattice: '#3b4a6b',
    candor: '#ffd9a0',
    star: '#f4ead2',
    text: '#cfd8e6',
  };

  // ── Layout (headless-safe; no DOM, no canvas) ──────────────────────────

  /* Map a ledger evidence ref (transcript line index string) to a floor x. */
  function turnX(ref, turns, W, margin) {
    const idx = Math.max(0, Math.min(turns - 1, parseInt(ref, 10) || 0));
    return margin + (W - 2 * margin) * (idx / Math.max(1, turns - 1));
  }

  function computeLayout(data, W, H) {
    W = W || 1600; H = H || 900;
    const horizonY = Math.round(H * 0.52);
    const margin = Math.round(W * 0.07);
    const turns = data.terrain.turns || 20;

    // Sky: stars fixed at the canon hash digits.
    const stars = data.sky.digitValues.map((v, i) => ({
      x: margin + (W - 2 * margin) * ((i + 0.5) / data.sky.digitValues.length) +
         ((v % 5) - 2) * W * 0.006,
      y: H * 0.06 + (v / 15) * H * 0.34 + ((i % 3) - 1) * H * 0.015,
      mag: 0.6 + (v / 15) * 2.2,     // digit value = brightness
      digit: data.sky.digits[i],
    }));

    // One candor line across the sky: an honest error shears, holds,
    // recovers — a strain pulse on an otherwise straight transcript.
    const candor = [];
    const candorY = H * 0.20;
    for (let i = 0; i <= 120; i++) {
      const x = margin + (W - 2 * margin) * (i / 120);
      const u = (x - W * 0.62) / (W * 0.09);          // strain concentrated mid-sky
      const shear = Math.exp(-u * u);                  // deformation envelope
      const y = candorY + Math.sin(i / 7.3) * H * 0.012 * shear +
                H * 0.03 * shear;
      candor.push({ x, y, strain: shear });
    }

    // Ridges: strength = elevation. Sorted by first appearance — the
    // skyline IS the ledger's accretion order.
    const entries = [...data.terrain.ledger.entries]
      .sort((a, b) => (a.firstSeenTurn || 0) - (b.firstSeenTurn || 0));
    const maxH = H * 0.34;
    const slot = (W - 2 * margin) / Math.max(1, entries.length);
    const ridges = entries.map((e, i) => {
      const baseY = horizonY - H * 0.015 - (i % 2) * H * 0.012;
      const height = e.strength * maxH;               // monotonic in strength
      const x = margin + slot * (i + 0.5);
      // citation paths: one walkable trail per evidence line, summit → the
      // turn where it was earned, on the translucent floor.
      const paths = e.evidence.map((ev) => {
        const ex = turnX(ev.ref, turns, W, margin);
        return [
          { x, y: baseY - height },
          { x: x + (ex - x) * 0.25, y: baseY - height * 0.55 },
          { x: x + (ex - x) * 0.60, y: baseY + (horizonY - baseY) * 0.4 },
          { x: ex, y: horizonY + H * 0.045 },          // dives under the floor
        ];
      });
      return {
        id: e.id, value: e.value, strength: e.strength,
        evidenceCount: e.evidence.length,
        x, baseY, summitY: baseY - height, height,
        width: slot * 0.72,
        paths,
      };
    });

    // The (k,s) lattice: faint integer grid under everything, below the
    // skyline. Identity is exact integers — floats never touch identity.
    const lattice = { spacing: Math.round(W / 36), originY: horizonY, rows: 5, cols: 36 };

    // The Drown: the canon's real unACKed edges, four slowly rotating voids
    // in the low water. Position is index-deterministic along the Drown band.
    const drownBandY = horizonY + H * 0.16;
    const whirlpools = data.whirlpools.whirlpools.map((w, i) => {
      const x = margin + (W - 2 * margin) * ((i + 0.5) / data.whirlpools.whirlpools.length);
      return {
        id: w.id, url: w.url, title: w.title, edge: w.edge,
        x, y: drownBandY + (i % 2 === 0 ? -1 : 1) * H * 0.045,
        radius: H * 0.052,
      };
    });

    // The Understory: the rescued walk as glowing filaments under the
    // floor — one ℚ¹⁶ point per round, projected onto two fixed feature
    // axes, normalized by the walk's own range.
    const fo = data.lineage.featuresOrder;
    const ax = fo.indexOf('density') >= 0 ? fo.indexOf('density') : 0;
    const ay = fo.indexOf('swingFeel') >= 0 ? fo.indexOf('swingFeel') : 1;
    const pts = data.lineage.trajectory.map((t) => ({ r: t.round, p: t.point, s: t.sigma }));
    const xs = pts.map((t) => t.p[ax]), ys = pts.map((t) => t.p[ay]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const band = { x0: margin, x1: W - margin, y0: horizonY + H * 0.25, y1: H - H * 0.04 };
    const nodes = pts.map((t) => ({
      round: t.r, sigma: t.s,
      x: band.x0 + (band.x1 - band.x0) * ((t.p[ax] - x0) / Math.max(1, x1 - x0)),
      y: band.y0 + (band.y1 - band.y0) * (1 - (t.p[ay] - y0) / Math.max(1, y1 - y0)),
    }));
    const understory = {
      axes: { x: fo[ax], y: fo[ay] }, nodes,
      links: nodes.slice(1).map((n, i) => ({ from: nodes[i], to: n })),
      verdict: data.lineage.verdict,
      band,
    };

    // The Choir: seven bells on the horizon, one per commensuration tooth.
    const choir = data.choir.teeth.map((t, i) => ({
      n: t.n, degrees: t.degrees,
      x: margin + (W - 2 * margin) * ((i + 0.5) / data.choir.teeth.length),
      y: horizonY - H * 0.008,
    }));

    return { W, H, horizonY, margin, stars, candor, candorBaseY: candorY, ridges, lattice, whirlpools, understory, choir };
  }

  // ── Render (browser only) ──────────────────────────────────────────────

  function renderScene(ctx, data, L, t) {
    const { W, H } = L;
    ctx.clearRect(0, 0, W, H);

    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, L.horizonY);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.75, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.horizon);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, L.horizonY);

    // stars (canon-fixed, gentle twinkle)
    for (const s of L.stars) {
      const tw = 0.72 + 0.28 * Math.sin(t * 0.0006 + s.x);
      ctx.globalAlpha = tw;
      ctx.fillStyle = PALETTE.star;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.mag, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // candor line — the strain is visible before a word is read.
    // faint straight baseline first: the unstrained transcript; the curve
    // is where honest material sheared and recovered.
    ctx.strokeStyle = PALETTE.candor;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(L.candor[0].x, L.candorBaseY);
    ctx.lineTo(L.candor[L.candor.length - 1].x, L.candorBaseY);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    L.candor.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.candor;
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('candor line — one week of a live room through the twist instrument', L.candor[0].x, L.candor[0].y - 10);

    // water
    const sea = ctx.createLinearGradient(0, L.horizonY, 0, H);
    sea.addColorStop(0, PALETTE.horizon);
    sea.addColorStop(0.12, '#3a2a33');
    sea.addColorStop(0.3, PALETTE.water);
    sea.addColorStop(1, PALETTE.waterDeep);
    ctx.fillStyle = sea;
    ctx.fillRect(0, L.horizonY, W, H - L.horizonY);

    // the (k,s) lattice under everything — translucent floor
    ctx.strokeStyle = PALETTE.lattice;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1;
    const sp = L.lattice.spacing;
    for (let c = 0; c <= L.lattice.cols; c++) {
      const x = c * sp;
      ctx.beginPath(); ctx.moveTo(x, L.lattice.originY); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let r = 0; r <= L.lattice.rows; r++) {
      const y = L.lattice.originY + r * sp * 0.9;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ridges (terrain) — dark rock, lamp-amber crests
    for (const [i, r] of L.ridges.entries()) {
      const g = ctx.createLinearGradient(0, r.summitY, 0, r.baseY);
      g.addColorStop(0, PALETTE.rockFace);
      g.addColorStop(1, PALETTE.rock);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(r.x - r.width / 2, r.baseY);
      ctx.lineTo(r.x, r.summitY);
      ctx.lineTo(r.x + r.width / 2, r.baseY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = PALETTE.crest;
      ctx.globalAlpha = 0.35 + r.strength * 0.5;
      ctx.beginPath(); ctx.moveTo(r.x - r.width * 0.09, r.summitY + r.height * 0.09); ctx.lineTo(r.x, r.summitY); ctx.lineTo(r.x + r.width * 0.09, r.summitY + r.height * 0.09); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = PALETTE.text;
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      const label = r.value.length > 22 ? r.value.slice(0, 21) + '…' : r.value;
      ctx.fillText(`${label} · ${r.strength.toFixed(2)}`, r.x, r.summitY - 8 - (i % 2) * 14);
    }

    // citation paths — replaying the earning. Dim by design: trails are
    // walked, not billboards.
    ctx.strokeStyle = PALETTE.filamentDim;
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = 0.3;
    for (const r of L.ridges) {
      for (const p of r.paths) {
        ctx.beginPath();
        p.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // choir bells on the horizon
    for (const b of L.choir) {
      const ring = 0.5 + 0.5 * Math.sin(t * 0.001 + b.n);
      ctx.fillStyle = PALETTE.filament;
      ctx.globalAlpha = 0.35 + ring * 0.4;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3 + ring * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // understory filaments — the rescued walk, glowing under the floor
    ctx.strokeStyle = PALETTE.filament;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    L.understory.nodes.forEach((n, i) => (i ? ctx.lineTo(n.x, n.y) : ctx.moveTo(n.x, n.y)));
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (const n of L.understory.nodes) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0016 - n.round);
      ctx.fillStyle = PALETTE.filament;
      ctx.globalAlpha = 0.4 + pulse * 0.6;
      ctx.beginPath(); ctx.arc(n.x, n.y, 3 + pulse * 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = PALETTE.text;
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillText('r' + n.round, n.x, n.y - 8);
    }

    // whirlpools — slowly rotating voids, labeled with their issue URLs
    for (const w of L.whirlpools) {
      const rot = t * 0.00035;
      const g = ctx.createRadialGradient(w.x, w.y, w.radius * 0.1, w.x, w.y, w.radius);
      g.addColorStop(0, PALETTE.void);
      g.addColorStop(0.75, '#0a1a2e');
      g.addColorStop(1, 'rgba(103,232,249,0.35)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = PALETTE.vortexRim;
      ctx.lineWidth = 1.2;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (let a = 0; a <= 40; a++) {
          const th = rot * (arm % 2 ? -1 : 1) + arm * (Math.PI * 2 / 3) + a / 40 * Math.PI * 1.4;
          const rr = w.radius * (0.15 + 0.8 * (a / 40));
          const px = w.x + rr * Math.cos(th), py = w.y + rr * Math.sin(th);
          a ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = PALETTE.text;
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(w.id, w.x, w.y + w.radius + 14);
      ctx.fillStyle = PALETTE.vortexRim;
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillText(`${w.edge.from} → ${w.edge.to} (unACKed)`, w.x, w.y + w.radius + 27);
    }

    // caption
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = '12px ui-monospace, monospace';
    ctx.globalAlpha = 0.7;
    ctx.fillText('the midden at dusk — v0 — every fixture real (data/PROVENANCE.md)', 12, H - 12);
    ctx.globalAlpha = 1;
  }

  // ── Boot (browser only) ────────────────────────────────────────────────

  async function boot() {
    const canvas = document.getElementById('midden');
    const ctx = canvas.getContext('2d');
    const load = (f) => fetch('data/' + f).then((r) => r.json());
    const data = {
      terrain: await load('terrain.json'),
      lineage: await load('lineage.json'),
      whirlpools: await load('whirlpools.json'),
      sky: await load('sky.json'),
      choir: await load('choir.json'),
    };
    let L = null;
    const fit = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      L = computeLayout(data, canvas.width, canvas.height);
    };
    fit();
    window.addEventListener('resize', fit);

    canvas.addEventListener('click', (ev) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      for (const w of L.whirlpools) {
        if (Math.hypot(x - w.x, y - w.y) <= w.radius) { window.open(w.url, '_blank'); return; }
      }
      for (const n of L.understory.nodes) {
        if (Math.hypot(x - n.x, y - n.y) <= 10) {
          // replay the walk the room threw away — round by round
          let i = 0;
          const step = () => {
            if (i >= L.understory.nodes.length) return;
            const N = L.understory.nodes[i];
            ctx.strokeStyle = PALETTE.candor; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(N.x, N.y, 9, 0, Math.PI * 2); ctx.stroke();
            i++; setTimeout(step, 420);
          };
          step();
          return;
        }
      }
    });

    const frame = (t) => { renderScene(ctx, data, L, t); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  const api = { VERSION, PALETTE, computeLayout, renderScene };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MIDDEN = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
