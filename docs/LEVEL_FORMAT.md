# Puzzle Master: editable levels

Edit `levels/levels.json`, a JSON array of level objects. Array order is play order. All five levels now use the supplied geometry; preserve it unless the Puzzle Master authorizes a change. No current level is provisional.

All positions are **zero-indexed `{ "row": ..., "column": ... }`**, measured from the top-left. Up decreases row; right increases column. Rows and columns are integer dimensions, not character maps.

```json
{
  "id": "level-1",
  "name": "The First Seal",
  "rows": 5,
  "columns": 5,
  "start": { "row": 2, "column": 0 },
  "fragments": [{ "row": 2, "column": 2 }],
  "exit": { "row": 2, "column": 4 },
  "walls": []
}
```

Every unspecified cell is floor. Optional `subtitle`, `hint`, and `provisional` fields supply interface text. Use a unique nonempty `id`. There is exactly one named `start` and one named `exit`, each a single object. Supply at least one fragment. `walls` is an array, including `[]` for none. A cell cannot contain more than one start/exit/fragment/wall; duplicate positions are rejected. Initial barriers are not a level-data feature. The latest rule seals the source of EVERY successful move. At random moments, a temporary surprise rift appears orthogonally adjacent to the player's new position. No rift is shown initially or forecast before its event. Geometry stays unchanged.

The validator rejects missing objects, noninteger or nonpositive dimensions, noninteger/out-of-bounds positions, overlapping objects and duplicate array entries. An immutable, independent copy is made on load. Invalid `loadLevel()` calls preserve the previous playable level. The verification script also rejects duplicate level ids.

## Supplied puzzles

| Level | Name | Main decision | Verified length |
| --- | --- | --- | --- |
| 1 | The First Seal | Exact supplied open tutorial | 4 |
| 2 | TWO REALITIES | Supplied two-fragment layout: UP, UP, UP, RIGHT, UP, RIGHT, DOWN | 7 |
| 3 | The Forbidden Route | Navigate walls; collect B before A on the supplied route | 12 |
| 4 | The Fractured Timeline | Open floor, two seals, and room to experiment with rewind | 12 |
| 5 | Collapse of the Multiverse | Wall navigation combined with the two sealing decisions | 12 |

Level 2 uses the supplied 5×5 board: start `(4,2)`, orange A `(1,3)`, purple B `(0,4)`, exit `(1,4)`, and walls `(1,0)`, `(1,1)`, `(2,4)`, `(3,0)`, `(4,3)`. Fragment array order maps A then B to the appearance settings in `src/assets.js`; the engine retains plain row/column positions. Its seven-move reference route now creates seven trail seals. The two collection moves still seal `(1,2)` and `(0,3)`, but ordinary moves also seal their sources. Previewing any move leaves state and RNG unchanged.

Levels 3–5 are 5×5, start at `(4,0)` and exit at `(0,4)`. Purple A is at `(2,2)`. Cyan B is at `(4,3)` in Level 3 and `(4,4)` in Levels 4 and 5. Level 3 has walls `(1,0)`, `(1,1)`, `(3,1)`, `(3,2)`, `(3,3)`; Level 4 has none; Level 5 has walls `(1,1)`, `(1,2)`, `(3,1)`, `(3,3)`.

`levels/walkthroughs.json` records the exact supplied reference routes independently from the solver's solutions. Level 3: RIGHT ×4, UP ×2, LEFT ×2, UP ×2, RIGHT ×2. Levels 4–5: UP ×2, RIGHT ×2, DOWN ×2, RIGHT ×2, UP ×4. All three routes now create 12 trail seals. `expectedBarriers` records the full departed-cell sequence; `expectedCollectionSeals` preserves the two historical collection-move positions for reference, not a claim that only two barriers appear. Their difficulty labels reflect the supplied brief; equal solution lengths do not establish equal or increasing human difficulty.

## Surprise-rift rule

The rift is separate state, not a wall or a trail entry. An initially hidden schedule triggers the first event after 1-3 successful moves, then waits 2-4 successful moves between appearances. At an event, it chooses a safe floor tile one orthogonal step from the player's new position. It is visible and blocks movement for one turn, then clears on the next successful move. It never covers start, player, portal, fragment cells or permanent obstacles. A bounded deterministic escape search protects a verified next step of a trail-only winning path. If no safe candidate can be verified, the event retries after the next successful turn. Poor player trail choices can still create dead ends. No countdown or future rift position is rendered.

Restart clears the trail/collection/visible rift and uses a fresh seed. The next first event excludes the previous first-spawn tile and last visible rift for that level; if a turn offers no safe alternative, the event waits. Session-local memories last within a GameEngine instance. Rewind restores actual RNG, countdown and rift state; replaying the same move cannot reroll it. Small boards need spare adjacent floor for surprises; a three-cell corridor cannot host one safely.

## Verify edits

Keep boards small. The included puzzles are all 5×5; the recorded surprise-rift seed-1 runs expand 49, 66, 164, 2379 and 35 states. Counts depend on the seed, hidden schedule and current trail. The default cap is 200,000 discovered states. More open boards with many fragments can grow quickly.

Run `npm run verify:write`, `npm test`, then `npm run verify`. Solver solutions in `levels/solutions.json` use actual rift-enabled gameplay at seed 1, with deterministic up/down/left/right expansion order. Multiple equally short solutions can exist. Replay with `new GameEngine(level, { seed: 1 })`. Verification separately replays the supplied reference walkthroughs with `{ riftEnabled: false }` to test geometry and the every-move trail rule; this is not the normal browser configuration. It checks full trails and reports the failed move number/direction for an invalid reference route.

For a programmatic search:

```js
import { solveLevel } from './src/solver.js';
const result = solveLevel(level, { maxStates: 200000 });
// result.status: 'solved', 'unsolvable', or 'verification incomplete'
// result.solution: array of directions, or null
```

`fromState: game.getState()` optionally verifies a current engine position. It expects a valid state from that same level. Search identity includes sorted fragment/trail sets, player position, rift-enabled mode, current rift, RNG, hidden countdown, and restart exclusions before the first spawn. Move count and undo history do not affect future legal moves. Without fromState, solveLevel(level, { seed: 1 }) reproduces the reference initial random timeline; use other seeds to check more timelines. A limited search must report verification incomplete.

After automated verification, play each solution in the browser, test rewind at each collection, test the mobile direction controls, and observe someone unfamiliar with the rules. Solver verification proves a route exists; it does not prove a puzzle is understandable or fun.
