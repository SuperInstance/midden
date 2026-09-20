import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, 'data');

const DATA_FILES = ['terrain.json', 'lineage.json', 'whirlpools.json', 'sky.json', 'choir.json'];

test('every fixture parses as JSON', () => {
  for (const f of DATA_FILES) {
    const j = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
    assert.ok(j && typeof j === 'object', f + ' parsed');
  }
});

test('PROVENANCE.md covers every data file', () => {
  const prov = readFileSync(join(dataDir, 'PROVENANCE.md'), 'utf8');
  for (const f of DATA_FILES) {
    assert.ok(prov.includes(f), 'PROVENANCE.md mentions ' + f);
  }
  // no stray data files left unprovenanced
  const jsonl = readdirSync(dataDir).filter((f) => f.endsWith('.json'));
  for (const f of jsonl) assert.ok(PROV_FILES.has(f) || prov.includes(f), f + ' provenanced');
});

const PROV_FILES = new Set(DATA_FILES);

test('terrain is grounded or absent (the ledger law)', () => {
  const t = JSON.parse(readFileSync(join(dataDir, 'terrain.json'), 'utf8'));
  assert.ok(t.ledger.entries.length > 0, 'ridges exist');
  for (const e of t.ledger.entries) {
    assert.ok(e.evidence.length > 0, e.id + ' has evidence');
    assert.ok(e.strength > 0 && e.strength <= 1, e.id + ' strength in (0,1]');
    for (const ev of e.evidence) {
      assert.ok(ev.source && ev.ref !== undefined && ev.quote, 'evidence cites a real line');
      const idx = parseInt(ev.ref, 10);
      assert.ok(idx >= 0 && idx < t.turns, 'evidence ref inside transcript');
    }
  }
});

test('whirlpools are the 4 real canon edge gaps', () => {
  const w = JSON.parse(readFileSync(join(dataDir, 'whirlpools.json'), 'utf8'));
  assert.strictEqual(w.whirlpools.length, 4);
  const edges = w.whirlpools.map((x) => x.edge.from + '→' + x.edge.to).sort();
  assert.deepStrictEqual(edges, ['duke-lab→tidepool', 'hermit→duke-lab', 'quilt→hermit', 'quilt→tidepool']);
  for (const x of w.whirlpools) {
    assert.ok(x.url.startsWith('https://github.com/SuperInstance/'), x.id + ' real issue URL');
    assert.strictEqual(x.state, 'OPEN');
  }
});

test('sky is the canon hash, 16 digits', () => {
  const s = JSON.parse(readFileSync(join(dataDir, 'sky.json'), 'utf8'));
  assert.strictEqual(s.canonHash, '0x445185a3a99fd2e7');
  assert.strictEqual(s.digits.length, 16);
  assert.strictEqual(s.digitValues.length, 16);
});

test('choir has 7 teeth from the real comb', () => {
  const c = JSON.parse(readFileSync(join(dataDir, 'choir.json'), 'utf8'));
  assert.strictEqual(c.teeth.length, 7);
  assert.deepStrictEqual(c.teeth.map((t) => t.n), [2, 3, 4, 5, 6, 7, 8]);
});
