# Updated artist handoff

The active renderer is now the supplied React UI in client/. See [IMPORTED_ASSETS.md](IMPORTED_ASSETS.md) for current model paths, style controls and audio mappings. The notes below describe the retained earlier scaffold; its src/assets.js is not used by the active React build. The engine effect-event contract remains applicable.

# Artist integration

The initial art consists of CSS tiles and distinct text shapes. No external fonts, paid assets or generated images are required. Add files under `assets/` and set their URLs in `src/assets.js`, relative to the page (`./assets/player.png`, for example). Transparent PNG, WebP or SVG works. A `null` URL keeps the readable placeholder.

| Sprite key | Suggested file | Meaning / fallback |
| --- | --- | --- |
| `player` | `player.png` | Doctor Strange, ivory triangle with red cloak |
| `floor` | `floor.png` | Walkable Sanctum tile |
| `wall` | `wall.png` | Permanent wall with diagonal masonry |
| `fragment` | `fragment.png` | Mint diamond |
| `fragmentA` | `fragment-a.png` | Level 2: glowing orange stepped diamond marked A |
| `fragmentB` | `fragment-b.png` | Level 2: glowing purple stepped square marked B |
| `fragmentPurple` | `fragment-purple.png` | Levels 3–5: glowing purple stepped diamond marked A |
| `fragmentCyan` | `fragment-cyan.png` | Levels 3–5: glowing cyan stepped square marked B |
| `barrier` | `energy-barrier.png` | Orange hatch with × |
| `rift` | `moving-rift.png` | Cyan dotted square with a star; surprise adjacent block |
| `portalLocked` | `portal-locked.png` | Dormant, dashed ring; still walkable |
| `portalActive` | `portal-active.png` | Bright solid ring, ready after all fragments |

Sprite containers fit within a tile; floor sprites sit under objects. `.sprite`, `.player`, `.fragment`, `.portal`, and `.barrier-mark` in `styles.css` control size and layering. Keep silhouettes distinct and the player legible over portal/floor art. A violet dashed outline marks the square the player will leave. Its label is **“This square seals.”** The destination has a separate mint inset highlight. Preserve this distinction, including on touch devices and when colour alone is insufficient.

Every successful move seals its source, including ordinary moves. `.tile.rift` and `.rift-mark` style the surprise obstacle using --rift. Keep its cyan dotted border and star distinct from the trail's diagonal hatch/X. Initially no random tile is shown; display it only when the actual post-move state spawns it beside the player. Do not preview its future position or hidden countdown. It clears on the next successful turn; later random events may spawn another one. Never animate a rift on the player, portal or fragment, or let an animation affect hit detection.

Level 2's `levelArt` mapping in `src/assets.js` selects A/B by fragment array order. Each uses its dedicated asset when set, otherwise the generic fragment asset, otherwise its CSS pixel silhouette and letter. `.two-realities` styles the Sling Ring-inspired orange portal and violet energy barriers. `--fragment-a` and `--fragment-b` in `src/theme.css` control the glow colours; the pixel shapes are built in CSS and require no image files.

Levels 3–5 have separate `levelArt` entries using `fragmentPurple` and `fragmentCyan`, preserving Level 2's orange/purple pair. Their `.fractured-sanctum` class adds orange-red energy seals and the glowing orange portal. Theme variables `--fragment-purple`, `--fragment-cyan`, and `--seal-fire` control those colours. The layout, existing player placeholder, sound hooks and rule engine are shared with earlier levels.

Colours and animation lengths are centralized in `src/theme.css`: `--floor`, `--wall`, `--mint`, `--gold`, `--barrier`, `--preview`, `--move-ms` (140ms), and `--seal-ms` (280ms). Reduced-motion preferences disable animations. Logic runs synchronously before rendering; changing animation duration must never defer, duplicate, or reorder turns.

## Sound and effects

Set `sounds.move`, `sounds.collection`, `sounds.rewind`, and `sounds.victory` to optional audio URLs, e.g. `./assets/collection.ogg`. Missing/rejected audio playback never blocks a turn. Current sound hooks are silent until assets are supplied. Volume defaults to 0.35 in `playSound()`. Victory takes priority over other sounds on a winning move.

Successful moves and rewinds dispatch `window` events named `bloomlock:effect`:

```js
window.addEventListener('bloomlock:effect', ({ detail }) => {
  // Move: type, direction, from, to, fragment, barrier,
  //       portalActivated, victory, rift: { from, to }
  // Rewind: type: 'rewind', from, to
  // All point objects use { row, column }.
});
```

For a successful move, `fragment` is its collected position or `null`; `barrier` is always the **previous player position**. `rift.from` and `rift.to` describe the temporary obstacle relocation, with `null` for absence; the field is omitted in the diagnostic trail-only mode. `portalActivated` is true only on collection of the last fragment. `victory` signals arrival on the active portal. A rewind rerenders the complete restored state, including fragment, permanent trail and temporary rift positions. Invalid moves produce no gameplay effect event. Do not use effect listeners to modify engine state.

The reusable GameEngine in src/engine.js exposes loadLevel(level), move(direction), previewMove(direction), undo(), restart(), and getState(). Moves return { changed, reason, state, event }; rewind returns { changed, state, event }. Load/restart return state. Public states include immutable level data, copied player/set arrays, rift (a copied row/column object or null), rngState, riftEnabled, riftCountdown, firstRift, riftAvoid, moves, status and canUndo. Countdown/restart metadata is for logic and verification, never user-facing hints. Portal appearance derives from collection. Preview does not execute the move, consume randomness or emit effects; render only the permanent trail preview and destination, never the preview result's future rift. Restart intentionally rerolls; undo restores the existing timeline. Constructor { seed: 1 } supports reproducible checks, and { riftEnabled: false } supports trail-rule/geometry diagnostics.
