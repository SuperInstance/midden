# PROGRESS — lane-ai2 / midden COMMUNAL world model

**Lane:** Lane AI (Cocapn fleet, SuperInstance org). Sandbox: `/tmp/lane-ai2/repo`.
(Brief says `/tmp/lane-ai`; that is a stale prior run's dir, so I stay in my own
assigned sandbox. Nothing touched outside it.)

## Goal
First WALKABLE communal world model: export lineage/walk → static JSON,
Three.js first-person world that opens from `file://`, node smoke test, PR.

## Survey findings (read before building)
- `data/lineage.json` — REAL: 8-round × 16-dim walk (q16-trajectories PR#1
  `bfd7ee8`, real `breed()`+`chain()`), verdict HONEST GAP @ round 7, one
  exact-integer point per round, `ancestry[]` edges with driftQ/sigmaDrop.
- `gesture-panel.mjs` + `vendor/gesture-kit/gesture.js` — the third-order
  instrument (arc/bend/torsion/planarity, cumulative per round). Deterministic,
  headless, ES-module. Numbers guarded by `test/gesture-panel.test.mjs`.
- r7 planarity 0.3392 vs neighbors 0.3159/0.3170 (ember-tagged HONEST GAP);
  torsion step into r7 = 0.5439 vs prior per-vertex mean 0.6841; arc step into
  r7 ≈ +171k ℚ-units. Matches the brief exactly.
- Other REAL fixtures usable as landmarks: terrain.json (9 ridges),
  whirlpools.json (4 voids), choir.json (7 bells), sky.json (16 canon stars).
- Existing `index.html` uses `type="module"` + `fetch()` → the repo's own v0
  needs an HTTP server. My world MUST open from `file://`, so: no modules, no
  fetch — data inlined as `window.WORLD` by the exporter, Three.js vendored as
  the UMD global build (r147, last UMD release).

## Plan
1. [x] Clone, survey, PROGRESS.md
2. [ ] Vendor `vendor/three/three.min.js` (UMD r147) + provenance
3. [ ] `tools/gen-world.mjs` → `world/world.json` + `world/world-data.js`
       (rooms = rounds w/ planarity/torsion/arc + honest-gap tags; walks =
       paths; SYNTHETIC continuation rounds labeled per-room)
4. [ ] `world/index.html` + `world/world.js` — first-person walkable
5. [ ] `test/smoke.mjs` — JSON parses, ≥10 rooms, walk connectivity, ember tags
6. [ ] Branch `lane-ai-midden-worldmodel`, checkpoints, push, PR

## Log
- [t0] Booted. Sandbox confirmed. Repo cloned (main @ 8c1147f).
- [t1] Survey done: lineage.json REAL 8-round walk; gesture instrument
      vendored + tested; file:// strategy chosen (no modules, no fetch).
      Baseline `npm test` = 22 pass / 0 fail.
- [t2] Three.js r147 UMD vendored (`vendor/three/three.min.js`, 607KB, MIT,
      unpkg) + `vendor/three/PROVENANCE.md`.
- [t3] Exporter `tools/gen-world.mjs` written + run. Output `world/world.json`
      + `world/world-data.js` (inlined `window.WORLD` for file://).
      12 rooms = 8 REAL + 4 SYNTHETIC (damped LSQ continuation, labeled);
      3 walks; guards verify instrument vs docs/GESTURE-NOTES.md — all match
      (r7 planarity 0.339231, torsion step 0.543864, arc step 170686.6).
NEXT: world/index.html + world.js (first-person, file://).
- [t4] `world/index.html` + `world/world.js` written: first-person walk,
      classic scripts only (three UMD → world-data.js → world.js), zero fetch.
      Rooms = glowing cells; ember gap room pulses + 110u light pillar;
      mint trails w/ plankton points; broken rings + steel tint on SYNTHETIC;
      landmarks: 9 ledger ridges, 7 choir bells, 4 Drown whirlpools, 16 canon
      stars. Controls: pointer-lock look, WASD/shift, F = follow the trail.
- [t5] Layout fix: raw feature axes were degenerate (walk saturates → rooms
      piled at z=-100, overlapping). Replaced with deterministic PCA on the
      REAL 8x16 matrix, uniform scale (floor keeps the walk's own shape);
      synthetic continuation converges, so its rooms chain at 14u intervals
      along their true direction of travel — true PCA coords kept per-room in
      `projected`. Min pairwise room distance now 14.0u.
NEXT: smoke test, then browser-level check if a headless browser exists.
- [t6] Headless-Chrome verification over file:// (swiftshader). First run
      caught a real bug: emberRooms entries lacked dome/halo -> TypeError per
      frame. Fixed (pillar attached to the room entry). Re-run: 0 console
      errors.
- [t7] Deep links added (#r7 / #at=rN&enter=1 / #walk=1) for sharing a room
      and headless verification. Trail plankton given round soft sprites
      (were bare squares); marine-snow dust field (14k seeded-LCG motes —
      deterministic, seeded from the canon hash) so the abyss reads while
      walking; floor/lamp/grid brightness tuned. Screenshots: intro, r7 gap
      room, r0, autopilot view — all good. Saved world/screenshot.png.
- [t8] test/smoke.mjs: 15 checks, all pass. Full suite `npm test`: 37 pass
      (22 pre-existing + 15 new), 0 fail.
NEXT: README + provenance docs, push, PR.
- [t9] Docs: README "The walkable world" section (run instructions, real vs
      SYNTHETIC split, controls, deep links, regenerate command);
      data/PROVENANCE.md world/world.json entry (MIXED, method disclosed);
      world/screenshot.png committed.
NEXT: push -u origin, open PR.
