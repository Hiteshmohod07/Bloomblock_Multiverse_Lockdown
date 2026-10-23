# Bloomlock: Multiverse Lockdown

A local browser puzzle for Pixathon Topic 3. Recover multiverse fragments in a fractured Sanctum.

Source repository: [Hiteshmohod07/Bloomblock_Multiverse_Lockdown](https://github.com/Hiteshmohod07/Bloomblock_Multiverse_Lockdown).

**Collect every fragment and reach the portal. Every successful move permanently seals the square you leave. At random moments, a surprise cyan rift appears on a tile directly beside you.**

This is the latest user-requested rule: sealing now happens after **every move**, including ordinary movement, rather than only on fragment collection. All five supplied level layouts are unchanged.

## Run and play

Requires Node.js 22.12 or newer. The supplied React UI is integrated with the existing JavaScript engine. Install dependencies once with npm ci.

```powershell
cd D:\code\Pixathon
npm ci
npm start
```

npm start imports valid local audio, builds the supplied UI, then serves web-dist. For iterative development use npm run dev (normally port 5174). Use npm run typecheck and npm run build to verify UI changes.

Open [the game](http://localhost:5173). If a server is already running, open its URL directly. A second launch tries the next available port through 5183 and prints its actual URL. An explicit PORT is respected; to choose 5174 in PowerShell, run `$env:PORT = '5174'` before `npm start`. Stop a server with Ctrl+C.

Refresh existing tabs to load the new rules. Opening index.html directly via file:// does not work because modules and level JSON need HTTP. The server binds only to this computer.

Use **arrows / WASD** or the touch direction buttons. **Z / Time Rewind** undoes one successful move; **R / Restart** resets the chamber and rerolls its starting rift. A held key does not repeat turns.

## Supplied interface and artwork

The active interface is the supplied pastel handheld archive UI, adapted under client/. It uses the exact existing game engine and five level definitions, including hidden adjacent surprise rifts. The original scaffold is retained in the root files as a reference; npm start serves the built React interface. The UI archive is preserved under reference-ui/.

Player rotations, the golden portal, blocked-path obstacle and Infinity Stone fragments are imported into public/assets/. The mobile control dock keeps movement, Time Rewind and Restart available while viewing the board. Menus, Codex, hints, level selection, music controls and victory dialogs use the shared engine state.

The supplied Time rewind.mp3 is valid and plays on undo. The other FIVE requested sound files (menu, gameplay, collection, game over and victory) are saved Suno HTML pages rather than playable media. Their direct linked streams were not decodable. Those hooks currently use built-in sounds, not the requested recordings. Save actual MP3/WAV/M4A/MP4 audio exports into Things_to _add using the same base names and run npm start again; the importer will pick them up. Original user files are preserved.

[Current asset and audio integration guide](docs/IMPORTED_ASSETS.md) lists the exact mappings and remaining audio requirements.

## The two block types

- **Permanent trail seal:** orange hatch with an X. Moving from A to B blocks A, whether or not B contains a fragment. It stays blocked until rewind/restart.
- **Temporary surprise rift:** cyan dotted border with a star. Nothing is shown at the start. At randomly selected turns it suddenly appears on a floor tile immediately up, down, left or right of the player's NEW position. It blocks entry for the next turn, then clears after the next successful step. There are quiet turns between events.
- Future rift positions and event countdowns are never previewed in the UI. The existing violet preview is for the permanent trail only. The surprise becomes visible when it actually spawns.
- Rifts never cover the player, start, portal, fragment tiles, walls, permanent seals, or a protected winning next step. If no safe adjacent floor is available, the event waits rather than blocking an objective or the only escape.
- Restart hides the upcoming rift, rerolls its timing, and excludes the preceding attempt's first-spawn tile and last visible rift from the next first spawn. If those exclusions leave no safe adjacent tile on a turn, spawning waits for a later turn. This history lasts while the page/game instance remains open; older positions can recur on the finite board.
- Rewind restores player, fragments, trail, surprise rift, hidden event countdown, random-generator state, moves and victory state. Replaying an undone move reproduces its surprise timing and position; undo is not a reroll button. Restart deliberately creates fresh randomness.
- Invalid inputs, blocked moves, previews and rendering never advance randomness or add history. Victory blocks movement but still permits rewind and restart.
- The locked portal remains walkable, but entering before all fragments are recovered cannot win. Leaving it now seals it like any other departed square, so an early visit can spoil that path.
- The dashed violet outline labels your current square **This square seals.** Hover/focus a direction to preview its destination. Direction buttons work on touch screens without hover.

Rift placement preserves a verified winning continuation when one is found. If no safe adjacent placement can be verified, spawning is delayed instead of inventing an unavoidable obstruction. Your own trail choices can still create a dead end; use Time Rewind to recover.

## Levels and reference routes

| Level | Direct test link | Supplied reference route | Permanent seals on victory |
| --- | --- | --- | --- |
| 1: The First Seal | [Play](http://localhost:5173/?level=level-1) | RIGHT x4 | 4 |
| 2: TWO REALITIES | [Play](http://localhost:5173/?level=level-2) | UP x3, RIGHT, UP, RIGHT, DOWN | 7 |
| 3: The Forbidden Route | [Play](http://localhost:5173/?level=level-3) | RIGHT x4, UP x2, LEFT x2, UP x2, RIGHT x2 | 12 |
| 4: The Fractured Timeline | [Play](http://localhost:5173/?level=level-4) | UP x2, RIGHT x2, DOWN x2, RIGHT x2, UP x4 | 12 |
| 5: Collapse of the Multiverse | [Play](http://localhost:5173/?level=level-5) | UP x2, RIGHT x2, DOWN x2, RIGHT x2, UP x4 | 12 |

All boards remain 5 x 5. Level 2 retains orange/purple fragments; Levels 3-5 retain purple A/cyan B. Each successful move now adds a trail seal, not just the two collection steps. Supplied routes are recorded separately from actual seeded solver solutions; watch for surprise rifts while playing.

For a reproducible diagnostic timeline, append `&seed=1` to a direct level URL, for example [Level 4, seed 1](http://localhost:5173/?level=level-4&seed=1). The seed applies on page load; Restart still chooses a fresh timeline. Normal URLs use a fresh random seed.

## Verify

For Vercel, import the repository with the project root at this directory. The checked-in vercel.json selects Vite, installs with npm ci, runs the type check and production build, and serves web-dist. The local Things_to _add and reference-ui folders are intentionally excluded from Git/deployment; packaged sprites, validated rewind audio and the committed audio manifest are sufficient for a clean build. Original asset source archives can be retained separately by the Artist.

```powershell
npm test
npm run verify
```

After editing levels or rules, run `npm run verify:write`, then those two checks. The verification script replays actual rift-enabled solutions using seed 1 from levels/solutions.json. It also separately replays the supplied reference routes with the temporary rift disabled and checks every trail seal against levels/walkthroughs.json. The latter is a deterministic geometry/rule check, not the current randomized gameplay configuration.

The solver uses exactly the gameplay transition function. Search identity includes player, collected fragments, permanent trail, current rift position, rift-enabled mode, random-generator state, hidden event countdown and first-spawn restart exclusions. A capped search reports **verification incomplete**, never unsolvable. Unsolvable is reported only after exhaustive search. Restarting begins a new attempt; use fromState to verify its actual exclusions and random state.

Current verification:

- **37 automated tests pass.** Includes all five layouts, trail-only route/undo checks, initially hidden surprises, varying spawn timing, adjacency, one-turn lifetime, seeded blocking, nonmutating previews, exact RNG/timing rewind/replay, external-mutation protection, 150 restart checks, and actual surprise-rift solutions for seeds 1, 7 and 42 on each level.
- All five seed-1 solver solutions verified, in 4 / 7 / 12 / 12 / 12 moves.
- Agent browser checks confirm no initial/future random tile is shown, a surprise appears adjacent to the new player position, it clears on the next successful turn, rewind/replay restores the same event, and restart hides and rerolls the next event.
- Completed all five revised levels in sequence using mobile direction controls and next-level actions. Checked each visible surprise is one orthogonal step from the player and every level begins with no random tile shown. No browser console warnings/errors were reported.
- Inspected the 390 x 844 mobile screenshot; no horizontal overflow or console warnings/errors. Independent human and physical-device playtests remain pending.

## Team handoff

- src/engine.js: immutable level validation, trail rules, seeded rift transitions and reusable GameEngine.
- src/rift.js: deterministic random draws, hidden event scheduling, safe adjacent placement and bounded escape-path planning.
- src/solver.js: solver sharing the full movement rules and explicit RNG identity.
- client/App.tsx: React engine controller, keyboard/touch input, menus and audio.
- client/components/: adapted archive UI and the model-based GameBoard.
- client/styles.css: supplied theme plus responsive board and mobile controls.
- client/media.ts: Infinity Stone sprite mapping.
- client/audio-manifest.json and scripts/import-audio.mjs: validated local audio imports.
- public/assets/: supplied sprites and available audio; provenance.json records source archives and hashes.
- levels/levels.json: five exact supplied layouts.
- levels/solutions.json: seed-1 actual-game solutions and search counts.
- levels/walkthroughs.json: supplied reference directions, full permanent trails and historical collection-seal positions.
- [Level format](docs/LEVEL_FORMAT.md), [Artist handoff](docs/IMPORTED_ASSETS.md), [AI log](AI_LOG.md).

Artist: replace the documented assets, including the moving rift. Puzzle Master: test alternate paths under the new trail rule and observe a new player. This milestone is local; no hosting, accounts, database, leaderboard or public repository was created.
