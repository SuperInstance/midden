// gen-lineage.js — regenerate data/lineage.json from the real q16 bridge.
// Run inside a clone of SuperInstance/q16-trajectories, PR #1 branch
// (lane-n-q16-bridge). The walk duke-lab throws away, kept.
'use strict';
const { breed } = require('./src/breed.js');
const { chain } = require('./src/lineage.js');
const fs = require('fs');
const path = require('path');

const bred = breed({ seed: 'q16/midden-at-dusk', artist: 'duke', persona: 'purist' });
const out = {
  generatedBy: 'tools/gen-lineage.js: real breed() + chain()',
  source: 'SuperInstance/q16-trajectories @ lane-n-q16-bridge (PR #1)',
  note: 'the walk duke-lab throws away, kept: one exact-integer point per round in Q^16',
  seed: bred.seed, artist: bred.artist, persona: bred.persona,
  verdict: bred.verdict, nRounds: bred.nRounds,
  featuresOrder: bred.featuresOrder,
  start: bred.start, final: bred.final,
  trajectory: bred.trajectory,
  ancestry: chain(bred),
};
fs.writeFileSync(path.join(__dirname, '..', 'data', 'lineage.json'), JSON.stringify(out, null, 2));
console.log('rounds:', bred.nRounds, 'verdict:', bred.verdict.status);
