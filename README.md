# The Gilded Hour — a heist game

[![Best Heist Game](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/sw897636-web/best-heist-game-20261122/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/sw897636-web/best-heist-game-20261122/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

An original 2D top-down heist game for the [make.fun](https://make.fun/c/best-heist-game-20261122-0559) best-heist-game bounty. One thief, Wren, crosses the Meridian Gallery after dark, takes the Gilded Mask, and slips out the south door — past two patrolling guards, two sweeping cameras, and one alarm meter that never stops watching.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and visit http://localhost:8080). No network, no libraries, no build step — plain canvas and ES modules.

- **WASD / arrows** — move. **Shift** — sneak (slow, quiet). **Space** — run (fast, loud, blows a disguise).
- **E** — EMP burst: kills every camera for 8 seconds and opens the vent grate. Costs 40 battery.
- **Click** — throw a decoy coin: nearby guards walk to the ping. Three coins.
- **F** — disguise: guards barely notice you for 12 seconds, unless you run. Two uses.
- **R** — restart. **P** — pause.

## The room, in one frame

Dark is safe, warm light is watched. Guard cones are green when calm, yellow when suspicious, red when alert, with a `?` or `!` over the guard's head. Being seen fills the alarm meter — up close and dead-centre fast, at the rim or in shadow slow — and the meter drains the moment you break line of sight. A full meter means lockdown (faster patrols, pinned cameras), never an instant loss. A guard only catches you at full alert, and only after the meter warned you first.

Three routes cross the room: **the Gilded Hall** (fast, watched), **the Long Shadow** (slow, quiet, the Ledger of Names on the way), and **the Vent Run** (EMP the grate, crawl the duct, drop behind the Star Sapphire). Take the mask, then the south door opens — get out with the loot for the getaway score.

## Files

- `game/src/` — the game, one responsibility per file: `world` (the room), `vision` (raycast cones), `guards` (patrol + state machine), `cameras` (sweeps), `detection` (cumulative evidence), `alarm` (levels + lockdown), `tools` (EMP / decoy / disguise), `loot`, `routes`, `player`, `input`, `render`, `hud`, `shots` (the four deterministic screenshot scenes), `main` (the loop).
- `main.ts` — the entry program (Node 22, standard library only): copies `game/` and `screenshots/` to `MAKEFUN_OUTPUT_DIR` and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — four real renders of the game's own code: the cover (all five elements in one frame), the tools in use, the tense moment, and the getaway.

## Originality

Everything here is original: the game, the room, the names (Wren, Marlow, Iris, the Meridian Gallery), the art and the rules were written for this entry. Nothing is copied from a commercial game, and the kit starter's game was not reused — only the vendored `vendor/makefun-game.ts` is copied from the kit, byte for byte, as the rules require.
