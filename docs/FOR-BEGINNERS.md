# The midden, for beginners

You found a place. It isn't a game and it isn't a slideshow — it's a
landscape built out of a real organization's memory. This page gets you
from "what am I looking at" to "I clicked something and it meant
something" in five minutes.

## What this is, in one breath

The SuperInstance fleet makes software, and like anyone who makes things,
it keeps records — ledgers of what it valued, histories of what it
bred, logs of what it refused to throw away. The midden takes those
records and gives them **coordinates**: a dusk seascape where every hill,
whirlpool, and glowing trail is a real entry from a real record. Nothing
in the scene is decoration. If it glows, it existed.

## Open it (two ways, both free)

**The picture** — a rendered dusk scene:

```bash
git clone https://github.com/SuperInstance/midden
cd midden
python3 -m http.server 8000
# open http://localhost:8000/
```

**The walkable world** — twelve glowing cells on an abyssal floor you
can move through. This one opens straight from disk, no server:

```
# after cloning:
xdg-open midden/world/index.html      # Linux
open midden/world/index.html          # macOS
start midden\world\index.html         # Windows
```

## What to click, and what it means

- **A whirlpool.** Each one is a real open issue in the fleet's canon —
  an unfinished connection between two projects. Click it and your
  browser opens the actual issue on GitHub. The whirlpools are not
  metaphors for debt; they *are* the debt, with URLs.
- **An understory node** (the network under the floor). Click one and
  the world replays, round by round, the walk that a real algorithm
  took — the rounds it kept and the round it threw away.
- **A glowing cell.** Each cell is one round of a real saved
  computation. Cells with **broken rings** are marked SYNTHETIC: the
  world extends past the real data there, honestly labeled, and they
  glow dimmer on purpose. The scene never pretends.

## The one idea to take away

Software projects usually hide their memory in databases and logs. The
midden's idea is that **memory can be geography** — that you can stand
inside a record and notice things you would never see in a table. The
hills are values the fleet held (with the transcript lines that prove
it). The sky is a hash of the fleet's canon — the same hash the
automated systems check. The Choir is a set of exact mathematical
intervals. When you're ready for how each piece works, the engineers'
page (`FOR-ENGINEERS.md`) is one door over, and the dream chapters in
`docs/` are the world-building underneath it all.

You don't need any of that to enjoy the dusk, though. Click a whirlpool.
Watch the understory replay. That's the midden working.

## If something confuses you

Open an issue — `https://github.com/SuperInstance/midden/issues/new` —
and say where you got lost. Confusion is a bug in the documentation, and
this page is meant to be fixed.
