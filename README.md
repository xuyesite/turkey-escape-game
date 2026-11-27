# Gobble Dash — A Turkey Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/xuyesite/turkey-escape-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/xuyesite/turkey-escape-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A complete, original turkey escape game for the [make.fun bounty](https://make.fun/bounty/turkey-run-game-01). Thanksgiving is coming — you are the turkey, and the farmer is coming faster. Outrun him from the farmyard, through the barnyard, into the kitchen, and out the forest gate.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit http://localhost:8080). No network, no build step — the game is static files.

| Input | Action |
| --- | --- |
| Space / ↑ / click | Jump |
| ↓ | Slide under the knives — hold beside a hay bale to hide |
| ← / → | Step back / sprint (sprint drains stamina) |
| H | Hide in the hay when the farmer is close |
| P | Pause · M — mute · R — restart |

Dodge fences, hay bales, crates, rolling pumpkins, ovens and falling carving knives. Eat corn to stretch your lead, grab golden feathers for a burst of speed, and find pumpkin pie to win back a life. Hide in the hay and the farmer loses your trail — but the oven waits in the kitchen, and the knives fall faster there.

## Layout

- `game/` — the playable game (static files, zero network requests)
  - `src/config.js` — tuning, stages, palette
  - `src/random.js` — seeded RNG (fixed seeds replay the same run)
  - `src/input.js` — keyboard + mouse
  - `src/audio.js` — synthesized WebAudio sound effects
  - `src/turkey.js` — player physics (run, jump, slide, hide)
  - `src/farmer.js` — the farmer's chase / search / lunge AI
  - `src/world.js` — obstacles, pickups, falling knives, collisions
  - `src/render.js` — all canvas drawing (turkey, farmer, farm, kitchen, HUD)
  - `src/main.js` — state machine, game loop, screenshot staging
- `main.ts` — Node 22 hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier`
- `screenshots/` — four real renders of the game (title, farmyard run, kitchen run, escaped ending)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Screenshots

The game supports deterministic staging for its own screenshots: `game/index.html?shot=start|play|kitchen|end&seed=1` renders a fixed scene (see `shots.json`).
