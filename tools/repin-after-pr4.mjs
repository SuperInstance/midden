import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = '/tmp/lane-midden';
const roomPath = root + '/protocol/midden-room.json';
const room = JSON.parse(readFileSync(roomPath, 'utf8'));

// 1. re-pin every data/*.json fixture: sha256 + bytes
const onDisk = readdirSync(root + '/data').filter((f) => f.endsWith('.json')).sort();
room.room.fixtures.files = onDisk.map((f) => {
  const buf = readFileSync(root + '/data/' + f);
  return { path: 'data/' + f, sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.byteLength };
});

// 2. provenance.sources must cover all of them
const covered = new Set(room.provenance.sources.map((s) => s.fixture));
for (const f of onDisk) {
  if (!covered.has('data/' + f)) {
    room.provenance.sources.push({
      fixture: 'data/' + f,
      repo: 'SuperInstance/candor',
      ref: 'e4a85f30',
      note: 'candor v0 first real run acceptance record — see data/PROVENANCE.md §candor-run.json',
    });
  }
}

// 3. canon choir teeth must trace the retuned comb exactly
const choir = JSON.parse(readFileSync(root + '/data/choir.json', 'utf8'));
room.surfaces.canon.choir.teeth = choir.teeth.map((t, i) => ({ index: i, n: t.n, degrees: t.degrees }));

writeFileSync(roomPath, JSON.stringify(room, null, 2) + '\n');
console.log('fixtures pinned:', room.room.fixtures.files.length);
console.log('sources:', room.provenance.sources.length);
console.log('teeth:', JSON.stringify(room.surfaces.canon.choir.teeth));
