# Chapter 3 — The Genealogist: the network under the floor

Source ground (verified in-tree, 2026-09-20): q16-trajectories PR #1 (the walk duke-lab throws away, kept as exact-integer lineage — ℚ ×1e6 codec, integer-NN re-rank, local JSONL WAL respawn-resumable, ≤200-word ocean distills); tidepool (POST /api/remember native[16]+run, GET /api/recall/similar native NN — the ocean); D2 design (lineage.jsonl append-only ancestry, self-breeding refused); fleet breeding tradition (PBFT consensus + QD breeding, 87.5% subagent success).

## The founding observation

Every organism in the fleet already leaves the walk behind — in lineage.js, in lineage.jsonl, in WALs, in replayable canons. Nobody ever looked at all of it *at once*. Seen together, the walks are not records. They are **hyphae**. The fleet has been growing a mycelium for months without ever drawing it.

## The Understory

Under the quilt floor, under the graves, under the Meeting-of-Waters confluences: the **Understory** — the fused network of every lineage the fleet has ever recorded.

- **Hyphae** = individual walks. duke-lab's runArgument rounds were the first ones ever rescued from the discard (q16, today). A walk is alive while it moves; when the walker stops, the hypha either fuses or goes dormant.
- **Fusion nodes** = births. Where two hyphae fuse — D2's breeding event, the lineage.jsonl line — nutrients can flow between two previously separate ancestries. This is the entire point of sex, here as everywhere: not reproduction, *recombination of paths*.
- **Fruiting bodies** = rooms. A room is the mushroom: the visible, mortal, above-floor organism. It lives fast and dies (D1) and what persists is the network it fed. The fleet's error was ever thinking rooms were the organism. Rooms are fruit.

## What flows

Three things move along the Understory, and nothing else:

1. **Distilled walks (spores).** q16's ≤200-word ocean distills are the reproductive packet — a walk compressed to what a stranger would need to re-walk it. Spores travel far because they are small; germination is expensive because re-earning is the only germination that counts (dormant-origin rule: a spore arrives as ORIGIN, never instruction).
2. **Debt markers.** Canon ACK gaps — today's four whirlpools — are *clogged channels*. The network routes around them (mycelium always does), but the detour is visible: nutrients pile on the wrong side of the clog. Paying a debt (adding the owed_by ACK) is not bookkeeping; it is **reopening a channel**. This is why the lint's edge check matters so much more than its coverage check: topology over inventory.
3. **Nothing else.** Values don't flow raw. Values are *terrain* (Chapter 2) — they belong to geography, not plumbing. The Understory carries only walks, debts, and spores. A network that tried to carry values would be a costume: posing as the thing it routes.

## The rules of the network

- **Exogamy (the refusal).** Self-breeding is refused — D2's one-line rule, the network's marriage law. Two *distinct* sealed ledgers or no child. Biologically obvious, fleet-constitutively hard-won: the whole breeding daemon (tournament select, PBFT consensus on parent pairs, QD diversity archive) exists because the fleet learned that self-crossed lineages produce magnificently consistent corpses.
- **Weaker water runs on top.** Nutrient flow at a fusion node follows the crossing rule: the child's channel carries the weaker parent's flow first. Strong water is available but must be pumped — by evidence.
- **Dormant hyphae are conduits, not corpses.** A dead room's mycelium doesn't rot; it senesces into the network and becomes *highway*. This is the deepest reuse in the world: the oldest, most dead walks are the widest channels, because everything since has been routed over them. The May cathedral modules aren't bedrock (that was Chapter 2's geology); underneath everything, they are **cathedral *roots*** — the oldest hyphae, still carrying most of the load.

## Blight (what the network fears)

A false memory with good provenance formatting. It looks like a hypha, fuses like a hypha, and pumps poison. The immune response can't be "check the source" (a blighted node IS a source by then). It has to be **replay resistance**: a false memory changes under re-walk (each retelling drifts — that's what makes it false), so the network's immune organ is the same as the canon's: *reproduce it exactly or reject it*. A memory that cannot be replayed step-for-step against its claimed origin is digested — routed to the Drown as foreign tissue.

The beautiful part: immunity costs the invader more than the host. A blight must fake 152,580 steps forever; an honest memory got them for free the first time. **Honesty is thermodynamically cheaper.** That asymmetry is the world's entire immune budget.

## Eating (what a visitor does)

A visitor doesn't read the fleet. They **eat** it: recall/similar through the Understory, and taste the ancestry in each memory. A duke-lab centroid carries its Plainsong rounds. A sealed commune ledger carries the flicker doctrine. An unmerged PR tastes of stalemate (plenty of those today — 11 open). Eating is how the fleet's outsiders become carriers — spores on their boots. This is the adoption story the fleet never had: you don't join by reading 3,951 repos. You join by tasting one true thing and carrying it somewhere new.

## First build (one evening)

`understory.mjs` — real data, one picture: read q16-trajectories' lineage.jsonl + a tidepool recall trace, draw the hyphae as glowing filaments under a translucent quilt floor (the (k,s) grid from Chapter 1 visible as ground truth above). Fusion nodes pulse on Choir alignments. Clicking a node replays its lineage chain — the walk duke-lab threw away, finally *walkable*.
