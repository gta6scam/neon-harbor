# NEON HARBOR

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gta6scam/neon-harbor/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gta6scam/neon-harbor/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**A 3D open-world getaway game in Puerto Bruma, a neon port city that never sleeps.**
You are Mama Vega's wheelman. One night, eight chained story jobs: grab the contraband
at the docks, beat the clock to each glowing drop, and outrun the PHCPD while the net
tightens — every delivery raises your CHAIN multiplier and the heat in equal measure.

Built with Three.js (vendored under `game/vendor/`), plain static files, no build step
and no network. All sound is synthesised live by the game's own **SoundWeaver Audio**
system (three radio stations, engine, sirens, effects) — there are no audio files.

## Run it

```sh
node serve.ts            # serves game/ on http://localhost:8080
# or, to hand the entry in like the grader does:
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Open the page, press **ENTER**, and take the first job from Mama Vega at Pier 9.

## How to play

| Key | Action |
| --- | --- |
| WASD / arrows | Drive / walk |
| SHIFT | Sprint on foot · Nitro in a car (with the TIDE SHOT upgrade) |
| F | Enter / exit / steal a car (witnesses phone the PHCPD) |
| LMB | Fire the weapon in hand |
| Q | Cycle the weapon wheel |
| Z / X / C | Crew abilities: SWAP PLATES · QUICK FIX · EYES OUT |
| M | Full district map — story list, standing, GPS route |
| G | TALLER BRUMA garage — upgrades & weapons with prices |
| R / 0 | Next radio station / mute SoundWeaver Audio |
| E | Start a street race at a green start gate |

**GOAL:** finish all 8 story jobs and grow from PIER HAND to HARBOR LEGEND.
**WIN:** complete the night — the final job pays out and the run is graded S–F.
**LOSE:** get wasted, or get busted when the net closes at speed zero.

## What's in the city

- **8 chained story jobs** with staged objectives, timers and portrait dialogue —
  pickups, timed multi-drops and lose-the-tail escapes.
- **PHCPD dispatch** that fights back properly: named units (CORAL-48, HARBOR-12…)
  with live roles — PURSUIT, RAMMING, ROADBLOCK, FIRING, SPOTLIGHT — officers who
  get out and shoot, and AIR ONE, a helicopter with a real spotlight, from 4 stars.
  Wanted system with IN SIGHT / SEARCHING states and a witness system for car theft.
- **A crew of three** with portrait ability cards, hotkeys and cooldowns.
- **A six-slot weapon wheel** with ammo, prices and rank/job-locked slots.
- **A respect ladder** (PIER HAND → HARBOR LEGEND) whose unlocks are real.
- **Five districts** with their own standing, a textured full-screen map with a GPS
  route, a round textured minimap with the search zone drawn on it.
- **Side work:** 24 hidden neon shells, 3 street races, 5 stunt ramps, a 3-tier
  garage (engine / armor / nitro), 3 save slots, and a graded end sheet with the
  full run statistics and a nine-category completion checklist.

## Source layout

`game/src/` is split into single-job files the way the game is built: `world.js`
(the city), `vehicles.js`, `peds.js`, `player.js`, `police.js` (dispatch),
`combat.js`, `missions.js`, `hud.js`, `screens.js`, `audio-sound.js`, plus the
`data-*.js` tables for the city, the crew and the eight jobs. `shots.js` stages
the four screenshots in `screenshots/` deterministically (`?shot=cover|title|
map|end&seed=1`); `shoot.mjs` is the maker's tool that captures them.
