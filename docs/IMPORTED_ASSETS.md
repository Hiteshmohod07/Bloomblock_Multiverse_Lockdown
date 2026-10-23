# Supplied UI, sprites and sounds

The user-provided archives and source files remain in `Things_to _add`. The UI archive was inspected and preserved as `reference-ui/`. Active adapted components live in `client/`; `src/engine.js`, `src/rift.js`, `src/solver.js` and `levels/` remain the gameplay source of truth. The archive's sample preset state, alternate levels and older collection-only seal rules are not used.

## Run

Install once with `npm ci`. Run `npm start` to import valid local audio, build the React UI and serve it. `npm run dev` launches Vite for development. Checks: `npm run typecheck`, `npm run build`, `npm test`, `npm run verify`. The static server serves `web-dist/` when built, supports audio byte ranges and retains its occupied-port fallback.

The archive contained an unused ThreeDiorama component, but the supplied portal, player, obstacle and stones are PNG sprites. The active handheld arena uses those original sprites directly; it does not claim to convert them into 3D meshes. No AI API key, Gemini dependency, database or account is required.

## Sprite mapping

| Supplied archive | Runtime assets | Usage |
| --- | --- | --- |
| `A_portal_golden_LIke.zip` | `/assets/player/{south,north,east,west,...}.png` | Player faces movement direction; all eight supplied rotations are preserved |
| `golden_circular_portal.zip` | `/assets/portal/golden_circular_portal.png` | Locked appearance is dimmed; active appearance glows |
| `obstacle.zip` | `/assets/obstacle/obstacle.png` | Warm permanent trail blocks and desaturated fixed walls |
| WhatsApp Infinity Stone archive | `/assets/fragments/stone-1.png` through `stone-10.png` | Supplied nested ZIPs extracted without redrawing |

Stone numbering follows the inner archive names: `(1).zip` through `(9).zip` become stone-1 through stone-9; unnumbered `infinity_stones.zip` becomes stone-10. `client/media.ts` maps each level's fragment array order to its image. A/B badges identify fragments independently of colour. Image paths and SHA-256 hashes are recorded in `/assets/provenance.json`.

`client/components/GameBoard.tsx` renders supplied images with pixelated scaling. `client/styles.css` controls image sizes, portal states, obstacle tinting and the supplied pastel handheld theme. Surprise rifts remain cyan dotted tiles with a star so they are distinguishable from the supplied permanent-obstacle image. No future rift location or countdown is drawn. Reduced-motion preferences disable animation.

## Audio mapping and current limitation

| Event | Requested file | Current status |
| --- | --- | --- |
| Main/title menu music | `Main menu.mp4` | Saved Suno HTML page; fallback chiptune |
| Gameplay music | `Background music during gameplay.mp4` | Saved Suno HTML page; fallback chiptune |
| Fragment collection | `fragment collection sound.mp4` | Saved Suno HTML page; fallback effect |
| No legal moves/game over | `Game over.mp4` | Saved Suno HTML page; fallback effect |
| Time Rewind | `Time rewind.mp3` | Valid MP3, imported unchanged and plays on undo |
| Victory | `Victory.mp4` | Saved Suno HTML page; fallback effect |

The five files ending in .mp4 begin with `<!DOCTYPE html>` and contain Suno song pages. Their linked cloudfront media was not playable with ffprobe; the legacy MP3 URLs required a signed key. These were not passed to the browser as fake audio. Real audio exports are still needed to use those exact recordings. The valid rewind MP3 decoded as MP3 with a 5.799-second duration.

Export the actual tracks from Suno as MP3/WAV/M4A (or genuine MP4 containing audio) into `Things_to _add`, preserving the base names above. Keep the old saved pages if desired. `scripts/import-audio.mjs` prefers a valid media candidate, copies it to `public/assets/audio/`, hashes it, and updates `client/audio-manifest.json` during `npm run build` or `npm start`. No code changes are required when replacing saved pages with valid exports. Valid media signatures are required; HTML is explicitly rejected. Original user files are never rewritten.

`client/utils/audio.ts` manages independent SFX and music controls. Music starts only after a user gesture, switches between menu/gameplay modes, and pauses when the tab is hidden. Rewind audio is reused rather than overlapping many copies. Collection, game-over and victory hooks are bound to actual engine outcomes. Missing/custom playback errors fall back to built-in effects and never alter a move. Current fallback sounds are not presented as the user's requested recordings.

## Gameplay and interaction checks

The React controller synchronously calls the same reusable engine; animation and sound never control turns. It retains every-move source sealing, hidden adjacent surprise events, exact RNG/timing rewind, restart variation and all five exact layouts. The source overlay always previews the permanent seal and never forecasts a surprise. Keyboard arrow/WASD, Z/B/Space rewind, R restart, adjacent tile clicks, desktop direction pad and fixed mobile control dock all operate that engine.

Hints call the real solver from the current state, with honest search-limit handling. Menus pause movement; level selection and victory dialogs have keyboard focus management. Rewind remains available in the victory dialog. Codex text reflects the current rules. Browser checks cover all five mobile playthroughs and transitions, loaded sprites, surprise adjacency, restart, victory rewind, valid rewind MP3 playback and responsive layout. Independent human and physical-device testing remain useful.
