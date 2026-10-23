// Randomness is explicit state: previews and rewind must never consume a global RNG.
export function nextRandom(seed) {
  let value = seed >>> 0 || 0x9e3779b9;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  return value >>> 0;
}
const keyOf = ({ row, column }) => `${row},${column}`;
const directions = ['up', 'down', 'left', 'right'];
const escapeCache = new Map();
const identity = state => `${state.level.rows}x${state.level.columns}|${state.level.walls.map(keyOf).sort()}|${state.level.fragments.map(keyOf).sort()}|${keyOf(state.level.exit)}|${keyOf(state.player)}|${[...state.collected].sort()}|${[...state.barriers].sort()}`;

/** Find a winning continuation under trail rules, ignoring the temporary rift.
 * A protected next step lets the rift obstruct alternatives without destroying
 * the last winning path. Search failure is never reported as unsolvability.
 */
function escapeStep(start, moveTrail) {
  const cacheKey = identity(start);
  if (escapeCache.has(cacheKey)) return escapeCache.get(cacheKey);
  const visited = new Set();
  let explored = 0;
  const search = state => {
    if (state.status === 'won') return [];
    if (++explored > 12000) return null;
    const key = `${keyOf(state.player)}|${[...state.collected].sort()}|${[...state.barriers].sort()}`;
    if (visited.has(key)) return null;
    visited.add(key);
    const remaining = state.level.fragments.filter(p => !state.collected.includes(keyOf(p)));
    const targets = remaining.length ? remaining : [state.level.exit];
    // A flood-fill quickly discards paths that already sealed off an objective.
    const blocked = new Set([...state.level.walls.map(keyOf), ...state.barriers]);
    const queue = [state.player], reachable = new Set([keyOf(state.player)]);
    for (let head = 0; head < queue.length; head++) {
      const p = queue[head];
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const point = { row: p.row + dr, column: p.column + dc }, tile = keyOf(point);
        if (point.row < 0 || point.column < 0 || point.row >= state.level.rows || point.column >= state.level.columns || blocked.has(tile) || reachable.has(tile)) continue;
        reachable.add(tile); queue.push(point);
      }
    }
    if (![...remaining, state.level.exit].every(p => reachable.has(keyOf(p)))) return null;
    const candidates = directions.map(direction => ({ direction, ...moveTrail(state, direction) })).filter(r => r.changed);
    const distance = p => Math.min(...targets.map(t => Math.abs(t.row - p.row) + Math.abs(t.column - p.column)));
    candidates.sort((a, b) => distance(a.state.player) - distance(b.state.player));
    for (const candidate of candidates) {
      const tail = search(candidate.state);
      if (tail) return [candidate.direction, ...tail];
    }
    return null;
  };
  const route = search(start);
  // Do not introduce a random obstruction if a safe continuation was not verified.
  const result = route?.length ? { direction: route[0], tile: keyOf(moveTrail(start, route[0]).state.player) } : null;
  if (escapeCache.size >= 12000) escapeCache.clear();
  escapeCache.set(cacheKey, result);
  return result;
}

export function relocateRift(state, excluded, moveTrail) {
  const rngState = nextRandom(state.rngState);
  const countdown = state.riftCountdown - 1;
  if (state.status === 'won') return { rift: null, rngState, riftCountdown: 0 };
  if (countdown > 0) return { rift: null, rngState, riftCountdown: countdown };
  const escape = escapeStep(state, moveTrail);
  if (!escape) return { rift: null, rngState, riftCountdown: 1 };
  const blocked = new Set([
    ...state.level.walls.map(keyOf), ...state.barriers, ...excluded.filter(Boolean),
    keyOf(state.player), keyOf(state.level.start), keyOf(state.level.exit), escape.tile,
    ...state.level.fragments.map(keyOf),
    ...(!state.firstRift ? state.riftAvoid : []),
  ]);
  const candidates = [[-1, 0], [1, 0], [0, -1], [0, 1]]
    .map(([dr, dc]) => ({ row: state.player.row + dr, column: state.player.column + dc }))
    .filter(p => p.row >= 0 && p.column >= 0 && p.row < state.level.rows && p.column < state.level.columns && !blocked.has(keyOf(p)));
  const rift = candidates.length ? candidates[rngState % candidates.length] : null;
  return { rift, rngState, riftCountdown: rift ? 2 + rngState % 3 : 1,
    firstRift: state.firstRift ?? (rift ? { ...rift } : null) };
}
