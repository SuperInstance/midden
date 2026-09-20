# ROOM-PROTOCOL — the seam that lets a visitor walk the midden

> Status: SKELETON (lane room-protocol, in flight). Sections marked TODO are
> being filled on this branch; nothing here is final until the PR lands.

## What a room is

TODO (in flight): instruments, ledger surfaces, strain pulses, gesture
readouts, whirlpools/debts, provenance — the visitable state of the midden
built from the real fixtures in `data/`.

## What a visitor may do

TODO (in flight): observe; quote-with-citation; leave a mark that costs fuel
(no free writes). Versioned `room-protocol/1`.

## Files

- `protocol/room-state.schema.json` — JSON Schema for a room's visitable state
- `protocol/build-room-state.mjs` — builds `protocol/midden-room.json` from the real fixtures
- `protocol/midden-room.json` — reference room (generated, committed)
- `tests/room-protocol.test.js` — validation + fixture-trace tests

## Provenance

TODO (in flight): honest gaps listed; every cited number traces to a fixture.
