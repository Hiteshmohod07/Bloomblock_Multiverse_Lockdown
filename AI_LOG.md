# AI work log — Bloomlock

Date: 2026-10-23. Agent: Codex, acting as Driver. This is a record of this session, not evidence of other teammates' tools or human playtests.

## Actual prompts

The user requested execution of `D:\code\Pixathon\Prompt.txt`, then added: `also read this file "D:\code\Pixathon\prompt2.txt" and make the chnages according to the 2nd prompt.` Both files were read. The second prompt superseded the first where they differed.

Key excerpts from the actual task files (excerpts, not invented separate conversations):

1. “Build a playable browser game with a reusable game engine. Use simple placeholder visuals initially so the Artist can replace them later.”
2. “Invalid movement changes nothing, including the move counter and undo history.”
3. “Its search state must include player position, collected fragments, and created barriers.”
4. “All coordinates use zero-indexed (row, column), measured from the top-left.”
5. “Implement this level exactly. Do not add walls, extra fragments, or forced turns.”
6. “Highlight (2,1) as the square that WILL become blocked.”
7. “Only report ‘unsolvable’ after exhaustive search. Report ‘verification incomplete’ if a search limit is reached.”
8. “Only record an AI mistake if one actually occurs.”

## Tools and decisions

- Read the workspace, parent AGENTS.md locations, both prompts, and `Pixathon_Summary_and_Work_Division.txt` using PowerShell. No AGENTS.md or existing source was found. Original task files were preserved.
- Read Sites local-build/preview guidance, the verification skill, and computer-use guidance. The task explicitly requested a local milestone, so no Site registration or deployment was performed.
- Used `apply_patch` and Node scripts to implement dependency-free HTML/CSS/ES modules, a local static server, named-coordinate level validation, the movement engine, solver, UI and documentation.
- Used Node v24.14.1, `node --test`, and the level verification/replay script. No third-party packages were installed. Python was not on PATH during the environment check; this project does not need it.
- Wrote four provisional puzzle definitions because none were supplied beyond the exact tutorial. Search verified both their solutions and selected intentionally losing approach/order branches.
- The final verification produced 16 passing tests and solutions of 4, 7, 9, 14 and 18 moves. Expanded states: 29, 13, 25, 50 and 126 respectively.
- Chrome DevTools opened the local game and returned accessibility snapshots of the loaded tutorial and final five-level menu. A desktop screenshot was visually inspected. Keyboard, click and evaluate-script calls were rejected by the tool approval policy. The alternate CUA browser inventory was empty. Therefore a complete browser playthrough and human touch playtest remain unverified; automated engine replay is recorded separately.

## Actual mistakes and corrections

1. A patch attempted both deletion and addition of `levels/levels.json` in the same request. The patch tool rejected it with `invalid patch: multiple operations target ... levels/levels.json`. No part of that patch applied. It was rewritten as a single update and applied successfully.
2. During implementation review, the successful move event's `to` object shared a reference with the private player state. A consumer could therefore corrupt the engine through an event result even though snapshots were copied. Move events now use `structuredClone()` before being returned. A regression check mutates both the returned event and snapshot, then verifies movement/undo remain correct.
3. The initial preview selection could hide an adjacent fragment's automatic seal preview after a touch move in another direction. Rendering now falls back to all adjacent collection previews unless a specific collection direction is selected, preserving the touch requirement.

The first scaffold used a walled tutorial and x/y coordinates from the original implementation choice. On receipt of prompt2, those were replaced before tutorial verification with the exact open 5×5 board and row/column coordinates. This was a requirement update, not a claimed failure of the supplied tutorial.

## Remaining team work

Puzzle Master: perform the four-RIGHT browser walkthrough, check rewind/replay and mobile input, approve or replace provisional puzzles, and observe a new player. Artist: supply sprite/audio assets through `src/assets.js` and the theme variables. No human playtest, artwork generation, public repository, publication, or teammate activity is claimed by this log.

## Level 2 update — Two Realities

The user supplied the exact 5×5 layout, two fragments, five walls and route: **UP → UP → UP → RIGHT → UP → RIGHT → DOWN**, with the instruction “First implement this exact layout and confirm the winning route. Do not change coordinates or rules without checking with the Puzzle Master.”

- Replaced only provisional Level 2 with the supplied board and confirmed the route through the existing engine before adding presentation changes. Level 1's data and the engine rules were preserved; Levels 3–5 remain provisional.
- Added glowing CSS pixel-art fragments with orange A/diamond and purple B/square silhouettes, separate sprite hooks, violet barriers and an orange Sling Ring-inspired portal. Added the exact subtitle and direct test URL `http://localhost:5173/?level=level-2`.
- Added five Level 2 tests, removed the obsolete provisional Level 2 losing-branch test, and adjusted the existing wall check for the supplied board. `npm test`: **20 passed, 0 failed**. `npm run verify`: all five current levels verified; Level 2 is solved in 7 moves, 42 states expanded.
- Browser tools now accept input in this session. Completed the exact Level 2 keyboard route, collection rewind/replay, post-victory rewind, barrier blocking, restart, wall blocking, and early portal entry at `1/2` without victory. Also completed the route through the direction buttons at a touch-enabled 390×844 viewport. Verified automatic preview marks `(1,2)`, keeps the player visible, and separately marks destination `(1,3)`. Browser DOM checks confirmed both barriers and `2/2`, seven moves, player `(1,4)`, and victory.
- Replayed Level 1's four-RIGHT solution in Chrome successfully. Inspected a mobile screenshot and confirmed no horizontal overflow. The browser console contained no warnings or errors. These are agent-driven browser checks, not an independent human or physical-phone playtest.
- Actual test-authoring correction: an initial zero-fragment portal test attempted to walk outside the board at column 5. With this exact layout, the portal is bounded by A, B, a wall, and the board edge, so reaching it necessarily crosses at least one fragment. Corrected the test to check its initial locked state and actual walkable entry after collecting A; no board coordinates or rules were changed.
- Actual browser-tool correction: enabling mobile emulation reloaded the page, invalidating previously captured element ids. Initial clicks failed with “Element ... no longer exists.” Refreshed the accessibility snapshot, used the new element ids, and reran the direction-button route successfully.

Remaining handoff: the user/Puzzle Master can test the running Level 2 build; independent human and physical-device testing are still useful. Artist assets/audio remain replaceable through the documented hooks.

## Startup correction

The user reported `EADDRINUSE` after running `npm start` while the previously launched game was still listening on 5173. Confirmed the existing server returned HTTP 200 and the updated TWO REALITIES level. The static server had no error listener, so a second launch produced an unhandled exception. Added friendly startup error handling and automatic fallback from the default port to the next available port (up to 5183). Explicit `PORT` settings remain fixed and receive a readable error if occupied. Documented the printed-URL behavior in README.

## Supplied Levels 3–5 update

The user asked: `read this file and execute it "D:\code\Pixathon\Prompt.txt".` The current file is titled **BLOOMLOCK — LEVELS 3, 4 & 5 IMPLEMENTATION PROMPT** and requests exact supplied layouts for The Forbidden Route, The Fractured Timeline and Collapse of the Multiverse, while preserving Levels 1–2, the UI and all existing rules. Its priority instruction is: “Finish one level, test it, then proceed to the next.”

- Read the current prompt and existing level, engine, UI, tests and handoff files. Used PowerShell, Node, `apply_patch`, and Chrome DevTools; no packages, image generation, publishing or external services were needed.
- Replaced provisional Level 3 first and ran its three targeted acceptance tests, then completed its supplied 12-move keyboard route in Chrome. Repeated that sequence for Level 4, then implemented and tested Level 5. No supplied route failed and no coordinates or game rules were changed to accommodate a route.
- Preserved Level 1 and 2 data while replacing later entries; kept the existing engine unchanged. Removed two tests specific to the discarded provisional puzzles and added nine acceptance tests for the three supplied puzzles. The final suite has **27 passing tests**.
- Added `levels/walkthroughs.json` with all five exact supplied demonstration routes and expected barriers. Extended verification to replay those routes separately from independently found solver solutions. `npm run verify:write` found shortest solution lengths **4, 7, 12, 12, 12**, with **29, 42, 54, 235, 96** expanded states. Every supplied route also wins with exactly its specified barriers.
- Added purple A/cyan B pixel silhouettes, distinct letters, optional sprite hooks, orange-red energy seals and an orange portal for Levels 3–5. Level 2 retains its orange/purple presentation. The shared layout, existing character placeholder, input controls and sound hooks were retained.
- Completed all five levels in order in a touch-enabled 390×844 Chrome viewport, using the direction buttons and each Next chamber action. Verified the next level starts at zero moves with no barriers and that Level 5 ends with victory and no next-level button. Reconfirmed Levels 1–2 through that sequence.
- Independently checked each new level's visible preview, player visibility, fragment destination, collection rewind/replay and restart through browser controls. Level 3 previews/seals `(4,2)` before B; Levels 4–5 preview/seal `(2,1)` before A. Final routes create `(4,2)` and `(2,3)` in Level 3, and `(2,1)` and `(4,3)` in Levels 4–5. Automated checks cover early portal entry, revisits, wall/barrier blocking, full rewind at every move, and victory/restart.
- Visually inspected the final level's mobile screenshot and checked its purple/cyan colours, exact walls, and lack of horizontal overflow. Chrome reported no console warnings/errors. These are agent-driven browser checks; no independent human or physical-device playtest is claimed.

Actual corrections in this update:

1. The first patch contained two separate update operations targeting `src/assets.js`. The tool rejected it as `invalid patch: multiple operations target ... src/assets.js`; combined both edits into one file operation and reapplied successfully.
2. PowerShell-to-Node stdin converted Unicode separators in newly written subtitles to `?`. The mobile screenshot revealed the replacement characters. Changed those optional subtitle separators to ASCII hyphens; exact supplied titles, coordinates and rules were unaffected.

All five levels now use supplied layouts; none remain provisional. The running local server serves the latest files. Puzzle Master handoff: open the direct level links in README, refresh old tabs, replay the recorded routes, and observe an unfamiliar player. Artist handoff: replace the documented sprite/audio hooks as desired.

## Every-step trail and hidden adjacent surprises

The user requested a second randomized block and clarified the rules through the input questions:

- The departed square blocks **after every successful move**, not only on collecting fragments.
- The second block is temporary rather than accumulating permanently; restart must change its random pattern.
- The latest steering was: “continue the execution but the random tile should not the shown and it should appear at random point in the game but the twist is it should appear to the adjacent tile of the player's current tile.”

The final implementation follows that latest direction: no random tile is shown at the beginning or previewed before its event. A hidden schedule triggers a surprise on an eligible tile one step up/down/left/right of the player's NEW position. The first event is scheduled after 1-3 successful moves; later events wait 2-4 successful moves. A visible surprise blocks one turn and clears on the next successful move. Unsafe/unavailable events wait for a later turn. The permanent trail is separate and grows on every valid move.

- Updated the reusable engine, preview, renderer, instructions and solver while preserving all five level geometries. Added src/rift.js for explicit seeded randomness, hidden scheduling and safe adjacent placement. A bounded trail-only escape search protects a verified winning next step; lack of a verified placement postpones the hazard rather than claiming the position is unsolvable.
- Rewind restores the full trail, player, fragments, visible rift, hidden event countdown and RNG state. Replaying a move gives the same surprise. Invalid moves and previews consume neither a turn nor randomness. Restart starts with no visible rift, chooses fresh random timing, and excludes the previous first-spawn and last-visible tiles from the next first event. On a finite board older tiles may recur; exclusions persist within the game instance.
- Added constructor seed support for reproducible checking and an optional seed query parameter for diagnostic browser links. A normal browser load uses a fresh seed; Restart rerolls even when the URL specifies a seed. Future random positions/countdowns are not rendered as hints.
- Updated original-rule tests for the authorized every-move trail. Supplied reference walkthroughs record all departed cells in expectedBarriers; expectedCollectionSeals retains the historical two collection-source positions. The verification script separately tests those reference paths with the temporary hazard disabled, then tests actual hazard-enabled solver solutions at seed 1.
- Final automated result: **37 passing tests**. This includes initial invisibility, varied spawn timing, adjacency, one-turn lifetime, actual blocking, no reroll on invalid movement, defensive copies, exact countdown/RNG rewind and replay, 150 restart checks, and actual solutions for seeds 1, 7 and 42 on all five levels. Seed-1 solution lengths are 4, 7, 12, 12, 12; expanded states are 49, 66, 164, 2379 and 35. Limited searches still report verification incomplete, never false unsolvability.
- Agent browser evidence: seed-1 tutorial begins with zero rifts; RIGHT spawns a surprise at (3,1), adjacent to the new player at (2,1), while (2,0) becomes a trail seal. The next RIGHT clears that surprise. Rewind restored it exactly, another rewind hid it at the start, and replay restored the identical event. Restart showed no upcoming tile and a subsequent first surprise appeared at a different coordinate.
- Completed all five levels in sequence through mobile direction controls and next-level actions with the final hidden-adjacent behavior. Checked adjacency after every input, clean initial state on each transition, permanent trail count equal to successful moves, and victory. No console warnings/errors were reported. Browser checks are agent-driven, not independent human or physical-device testing.

The initial global moving-rift version and unused-starting-tile bag were replaced during this same task when the user changed the behavior to hidden adjacent events. That is a requirements change, not a fabricated AI mistake. All current docs describe the final rule; earlier sections of this log are historical snapshots.

## Supplied UI and model integration

The user requested the UI in `Things_to _add/bloom-lock_-multiverse-lockdown.zip`, sounds in the same folder, `golden_circular_portal.zip` for the portal, and `A_portal_golden_LIke.zip` for the player. During implementation they added Main menu, Time rewind and Victory tracks, `obstacle.zip` for blocked paths, and the WhatsApp archive containing Infinity Stone sprites. These additions were integrated into the same ongoing task.

- Inspected every archive before extracting. The UI archive is a React/Tailwind handheld game layout. Model packages contain PNG sprites, not 3D meshes: a golden portal, eight directional player rotations, a blocked-path obstacle, and ten nested Infinity Stone variants. Original user files remain unchanged. Extracted UI sources are preserved under reference-ui; active adapted sources live in client, and model assets in public/assets.
- Used the Sites local workflow, Context7 React/Vite primary documentation, and the React best-practices review guidance. No subagents were used. Installed the minimal React/Vite/Tailwind dependencies and retained package-lock.json. Did not install the archive's Gemini, Express, Three.js or other unused application dependencies.
- Reused the supplied GbaArena, TitleMenu, level selector, status screen, styling, navigation and victory presentation. Replaced the archive's game controller with the existing GameEngine adapter and the supplied board sprites. The archive's demonstration preset, alternate level data and older fragment-only sealing rules are not active. All five supplied layouts and the latest every-move trail/hidden adjacent-rift mechanics are preserved.
- Added responsive tile sizing and a fixed mobile control dock so players can view the board while moving or rewinding. Added keyboard-accessible tile/level buttons, modal focus management, a rewind action in the victory dialog, current-rule Codex text, functional solver hints and independent music/SFX controls. Player sprites face the movement direction; obstacles distinguish permanent trail blocks from fixed walls; temporary rifts retain their cyan dotted styling. Infinity Stone PNGs replace placeholder fragments with A/B badges.
- Validated supplied sound files using byte signatures and ffprobe. Time rewind.mp3 is a valid 5.799-second MP3 and is imported unchanged. The other five .mp4 files are saved Suno HTML pages. Their embedded cloudfront media downloaded as nondecodable encoded data; legacy MP3 links required a signed key. Those bytes are not falsely used as playable audio. Requested real local audio paths from the user and continued independent UI work. The five event hooks currently use built-in fallback sounds; exact menu/gameplay/collection/game-over/victory recordings still need valid exports.
- Added scripts/import-audio.mjs, which automatically discovers real audio with the same base names, rejects HTML, copies valid media into public/assets/audio and records hashes/status in client/audio-manifest.json. A later real export can be integrated simply by running npm start/build. Added a source/hash manifest for supplied model PNGs and documented all mappings in docs/IMPORTED_ASSETS.md.
- Updated npm start to build and serve the imported interface, with npm run dev for Vite. The local server prefers web-dist and supports media byte ranges. Main localhost:5173 now serves the imported UI; localhost:5180 was used as the review build while the previous main game remained playable.

Verification:

- npm run typecheck and npm run build pass. All 37 engine/rift tests pass and all five actual seeded solver solutions and supplied trail-only reference routes still verify.
- Browser-loaded player, portal, obstacle and Infinity Stone images were checked for successful decoding. The provided rewind MP3 reached readyState 4 and played without a media error on Time Rewind. The server returned HTTP 206 for an audio range request.
- Completed all five levels in sequence using the imported UI's mobile direction dock and victory Next Level buttons. Confirmed move/trail counts, exact starting layouts, hidden initial random tile, surprise adjacency, restart, and rewind after victory. The new Codex reflects the actual current rules.
- Inspected desktop/mobile screenshots. An early mobile header overflow was corrected by hiding its decorative badge/avatar on narrow screens; the updated 390px viewport had no header or page overflow. Added the compact mobile dock after seeing the archive's large direction pad fall far below the board on phones.

Actual corrections:

1. Two initial text-transformation attempts expected strings that were absent in GbaArena (CHIPTUNE BGM belonged to TitleMenu, and a redundant isCompleted anchor did not exist). Each script stopped before writing. Replaced these attempts with a checked one-time importer and a separate GameBoard component, then built successfully.
2. TypeScript exposed incomplete inference in the JavaScript engine's seed option and solver's solution array, plus nullable event handling. Added JSDoc for the existing seed option and string-array return, narrowed successful move events, and included Vite's CSS module types. Gameplay behavior did not change.
3. A browser console 404 was traced to a missing favicon; the supplied portal PNG is now the favicon. Original user media was not blamed for an AI error: the saved HTML files were identified as a source-format limitation.

Independent human and physical-phone playtests remain pending. Five exact sound recordings remain blocked on real playable exports; the provided rewind recording is active. The interface/models and fallback audio are available in the running local build.

## GitHub and Vercel release preparation

The user explicitly requested uploading the code to https://github.com/Hiteshmohod07/Bloomblock_Multiverse_Lockdown and deploying it on Vercel. Confirmed that the repository is public and empty and the connected GitHub user Hiteshmohod07 has push/admin permission. Initialized local Git on main, preserving the existing workspace files.

Added vercel.json for the Vite build, type checking, npm ci and web-dist output. Excluded node_modules, generated builds, raw asset-drop archives, reference-only UI files and local configuration from Git/deployment. The packaged PNG/audio assets and committed manifest are included. Updated the audio importer so a clean Git/Vercel checkout builds without the local Things_to _add folder, using the already validated packaged assets.

Pre-release checks: all 37 tests, solver verification, TypeScript checking and the production build pass. The Vercel connector could list existing projects but its create-project request returned 403 for the discovered team scope; browser fallback reached a Vercel login page. No deployment success is claimed at this preparation stage.
