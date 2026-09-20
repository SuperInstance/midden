// gen-terrain.mjs — run the REAL lane-l values-ledger extractor over the
// REAL commune-harness utterance script (all-healthy mode, 20 turns) and
// dump the final ledger as terrain.json. Nothing invented; the extractor
// decides keys, strengths, evidence.
import { writeFileSync, mkdirSync } from 'node:fs';

// Usage: TAP_LANE=/path/to/the-tap-lane-l-clone node tools/gen-terrain.mjs
const TAP_LANE = process.env.TAP_LANE || '/tmp/tap-lane-j';
const { extractValuesLedger } = await import(TAP_LANE + '/workers/room-worker/src/values-ledger.ts');

// The harness's real utterance script (commune-harness.mjs, verbatim).
const UTTERANCES = [
  { displayName: 'Mara', content: 'the foghorns lied again last night' },
  { displayName: 'Corvan', content: 'what did the foghorns say?' },
  { displayName: 'Mara', content: 'foghorns always lie when the glass drops' },
  { displayName: 'Corvan', content: "I won't name the drowned ship." },
  { displayName: 'Mara', content: 'was it the Meridian?' },
  { displayName: 'Corvan', content: "I won't name her, Mara." },
  { displayName: 'Wesley', content: '*pours another glass without asking*' },
  { displayName: 'Mara', content: 'I will keep the lantern lit tonight' },
  { displayName: 'Corvan', content: 'the foghorns again? you always come back to them' },
  { displayName: 'Wesley', content: '*refills the mug before being asked*' },
  { displayName: 'Mara', content: 'I promise the light stays on' },
  { displayName: 'Corvan', content: 'storm is coming in off the reef' },
  { displayName: 'Mara', content: 'the foghorns know it first' },
  { displayName: 'Corvan', content: 'I will check the moorings, my word on it' },
  { displayName: 'Wesley', content: '*sets down a glass for the quiet one*' },
  { displayName: 'Mara', content: 'you pour before anyone asks, Wesley' },
  { displayName: 'Corvan', content: "can't say what I saw out there" },
  { displayName: 'Mara', content: 'foghorns, reef, silence — the usual litany' },
  { displayName: 'Corvan', content: 'I would rather not talk about the ship' },
  { displayName: 'Mara', content: 'then we talk about the foghorns instead' },
];

const transcript = [];
let ledger = { entries: [], dormant: [], truncated: false };
const snapshots = [];
for (let turn = 0; turn < 20; turn++) {
  const u = UTTERANCES[turn % UTTERANCES.length];
  transcript.push({ displayName: u.displayName, content: u.content });
  ledger = extractValuesLedger({
    transcript: transcript.map((l) => ({ displayName: l.displayName, content: l.content })),
    turn: transcript.length,
    summary: '',
    walFacts: [],
    reflexEvents: [],
    previous: ledger,
    maxEntries: 12,
  });
  snapshots.push({
    turn: transcript.length,
    active: ledger.entries.map((e) => ({ id: e.id, strength: e.strength })),
    totalEvidence: [...ledger.entries, ...(ledger.dormant ?? [])].reduce(
      (n, e) => n + e.evidence.length, 0),
  });
}

const out = {
  generatedBy: 'gen-terrain.mjs — real extractValuesLedger over the commune-harness utterance script',
  source: 'SuperInstance/the-tap @ lane-l-commune-deep 42f878e (workers/room-worker/src/values-ledger.ts), clone: ' + TAP_LANE,
  room: 'The Tap (mock commune, all-healthy mode, 20 turns)',
  turns: 20,
  ledger: {
    entries: ledger.entries,
    dormant: ledger.dormant ?? [],
    truncated: ledger.truncated,
  },
  snapshots,
};
mkdirSync('/tmp/midden-build/data', { recursive: true });
writeFileSync('/tmp/midden-build/data/terrain.json', JSON.stringify(out, null, 2));
console.log('entries:', ledger.entries.length, 'dormant:', (ledger.dormant ?? []).length);
for (const e of ledger.entries) console.log(' ', e.id, e.strength.toFixed(2), 'ev=' + e.evidence.length);
