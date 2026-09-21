# ROOM-PROTOCOL — the seam that lets a visitor walk the midden

> Version `room-protocol/1` · lane `room-protocol` · 2026-09-20
> Files: `protocol/room-state.schema.json` (the law), `protocol/build-room-state.mjs`
> (the only way a room state is made), `protocol/midden-room.json` (the reference
> room, generated + committed), `tests/room-protocol.test.js` (the immune system),
> `protocol/validate.mjs` (zero-dep schema-subset validator — the repo ships no
> runtime deps and the runner is bare `node --test`).

The midden is the first world the fleet built from real ledgers. Until this
lane, there was no honest way in: a walker (PLATO, the-tap, a stranger) could
admire the dusk scene but could not be handed the *state* — the settled,
replayable fact of the room — in a shape a machine can trust and a human can
read. This protocol is that shape. SCHEMA-FIRST, no server: a room state is a
JSON document, it validates against a schema, every cited number traces to a
fixture, and the reference room is regenerated from the fixtures by one small
script.

## What a room is

A room is a **settled triangle**: three ledger surfaces meeting at one
integer floor, read by named instruments, strained by one live wire.

- **The ledger surface** (`surfaces.ledger`) — what the room holds onto.
  Every value is a ridge; strength is elevation; every evidence line is a
  citation path down to the turn where it was earned. Settled means: nothing
  on the map that isn't in the ledger (the ledger law — grounded or absent).
- **The lineage surface** (`surfaces.lineage`) — what the room walked. The
  rescued walk is carried verbatim (points, ancestry, verdict), read
  third-order by the gesture instrument.
- **The canon surface** (`surfaces.canon`) — what the room answers to. The
  sky is the canon hash (stars fixed at its digits, replayable in exactly
  152,580 steps — the load-bearing constant); the Drown is the canon's real
  unACKed edges, filed as live issues; the Choir is the 7-tooth
  commensuration comb.

The three meet at the floor: the exact **(k,s) integer lattice**. Identity is
integers; floats never touch identity. That is why the triangle is *settled*:
depth is compression, not burial — every element is addressable, replayable,
and hash-checked against the fixture bytes that produced it
(`room.fixtures.files[]`, sha256).

**Instruments** are named, sourced, and bounded. This protocol enforces the
fleet naming law end to end: gesture-kit's `twistEnergy()` is discrete Frenet
**torsion** — the third-order readout of a walked path, and the only gesture
number in a room state. twist-engine's **σ-shear** (units: seconds) is a
different instrument that reads transcripts, not walks; it is named here as
`twist-shear` so no number can drift across the boundary. A room state that
labels a Frenet readout "twist" fails validation — the test suite mutates one
on purpose to prove the schema has teeth.

**Strain pulses** (`strain.candorLine`) are the live wire across the settled
triangle: one week of a live room's transcript through the twist-shear
instrument. In `room-protocol/1` they are a **declared stand-in** — the candor
lane shipped an honest null, so the pulses are a deterministic placeholder
shape, labeled `stand-in`, waiting to be swapped for a real σ-shear reading.
The protocol would rather print an honest null than a persuasive fake.

**Gesture readouts** (`surfaces.lineage.gestureReadouts`) are cumulative —
round *r* reads the gesture of everything walked so far — and they carry the
gap corroboration computed, never asserted: at the verdict round (r7) the walk
keeps moving and bending but turns measurably closer to its osculating plane
(mechanism: `hesitation`, not a flattening).

**Whirlpools/debts** are not decoration. Each one is a real canon edge gap
with a real issue URL and a live `state`. Paying the debt reopens the channel;
a closed debt becomes terrain with better grip (the scar-line law).

**Provenance** is part of the room, not an afterthought: sources name repo +
ref per fixture, and `gaps` lists what is NOT settled (mock-commune terrain,
single-hypha understory, stand-in strain, doctrine-vs-fixture choir
playability, live-issue whirlpools). A room state with an empty gaps list
fails validation.

## What a visitor may do

1. **Observe** — read any surface, free. The whole room state is the view.
2. **Quote-with-citation** — carry a value elsewhere, free *if the citation
   comes with it*. A quote without its citation path is a flicker: it looks
   like a path-marker and leads nowhere.
3. **Mark** — leave a mark on the room. **Marks cost fuel.** A mark is a
   claim on the room; claims burn fuel proportional to what they assert, and
   they land only where the surfaces already carry the evidence.

`room-protocol/1` ships **read-only**: observation and quotation are
implemented by serving the state; the mark affordance declares the seam and
the fuel rule, and the write protocol (fuel meter, mark format, settlement)
lands later. There are no free writes — not one, not ever. That asymmetry is
the world's immune budget: honesty is thermodynamically cheaper.

## The schema

`protocol/room-state.schema.json` (JSON Schema, draft 2020-12 vocabulary as
enforced by `protocol/validate.mjs`). Top-level keys a room state MUST carry,
in order of settling:

| key | what it holds |
|---|---|
| `protocol` | the const `room-protocol/1` — version is law |
| `room` | id, title, kind (`settled-triangle`), generation stamp, builder command, and the fixture hashes (sha256 + bytes per `data/` file) — the trace anchor |
| `instruments` | the named, sourced instruments (`torsion`, `twist-shear`, …) with units and provenance |
| `surfaces` | the settled triangle: `ledger` (ridges + floor), `lineage` (walk + verdict + gesture readouts), `canon` (hash + stars + choir + drown) |
| `strain` | `candorLine` — instrument, source room, window, `status: measured \| stand-in`, pulses |
| `visitors` | the affordances and the write law (`free: false`, `markCost: fuel`) |
| `provenance` | `sources` (repo + ref per fixture) and `gaps` (honest, non-empty) |

Regenerate the reference room after any fixture change:

```bash
node protocol/build-room-state.mjs --stamp "$(date -Iseconds)"
npm test   # 32 checks: 22 pre-existing + 10 protocol guards
```

The builder is deterministic: same `--stamp` (or `SOURCE_DATE_EPOCH`), same
fixture bytes → same room state, bit for bit. The test suite rebuilds the
committed room from its stamp and compares deep-equal.

## Serving it: the PLATO `/api/ag-ui` sketch (doc only — no server in this lane)

When PLATO exposes the midden as a visitable room, the natural seam is an
AG-UI endpoint: `POST /api/ag-ui` accepting a `RunAgentInput` whose
`threadId` names the room (`midden`) opens an SSE stream that begins with
`RUN_STARTED`, immediately emits a `STATE_SNAPSHOT` whose shared-state value
is the room state itself — validated against `room-state.schema.json` at
serve time, with `room.fixtures` hashes echoed in the snapshot so a client
can verify provenance before trusting a pixel — followed by `TEXT_MESSAGE_*`
events narrating the room (a docent that quotes ridges with their citation
paths), `TOOL_CALL_*` events for the surface reads (`read_surface`,
`quote_with_citation`, `propose_mark`), and `RUN_FINISHED` when the visit
closes; a mark proposal returns as a tool call that pauses the run at an
AG-UI human-in-the-loop checkpoint until its fuel cost is approved, and live
re-settlement (a closed whirlpool, a real candor week) reaches already-connected
clients as `STATE_DELTA` JSON Patches against `surfaces.*` — the settled
triangle never mutates silently. This paragraph is the whole endpoint sketch
for this lane: schema-first, doc-only, no server.

## Provenance

Sources and honest gaps are carried *inside* every room state
(`provenance.sources`, `provenance.gaps`) and mirrored in the tests. The
short version: terrain is real-extractor-over-mock-commune; the walk is the
real rescued q16 ℚ¹⁶ walk; the Drown is the real issue list, verified at
authoring time; the sky is the real canon; the Choir is exact `convergentGaps(8)`
output. What is not settled is listed, not hidden — see `provenance.gaps`.
