import { DIRECTIONS, initialState, keyOf, transition, validateLevel } from './engine.js';

/** The moving rift and RNG state affect future moves as well as the trail. */
export function stateKey(state) {
  return `${keyOf(state.player)}|${[...state.collected].sort().join(';')}|${[...state.barriers].sort().join(';')}|${state.riftEnabled ? `${state.rift ? keyOf(state.rift) : '-'}:${state.rngState}:${state.riftCountdown}:${state.firstRift ? 'spawned' : [...state.riftAvoid].sort().join(';')}` : 'no-rift'}`;
}

/** Breadth-first search. A limit is never evidence of unsolvability. */
export function solveLevel(rawLevel, { maxStates = 200000, fromState = null, riftEnabled = true, seed = 1 } = {}) {
  if (!Number.isSafeInteger(maxStates) || maxStates < 1) throw new Error('maxStates must be a positive integer.');
  const level = validateLevel(rawLevel);
  const start = fromState ? { ...fromState, level, player: { ...fromState.player }, collected: [...fromState.collected], barriers: [...fromState.barriers], rift: fromState.rift ? { ...fromState.rift } : null,
    firstRift: fromState.firstRift ? { ...fromState.firstRift } : null, riftAvoid: [...fromState.riftAvoid] } : initialState(level, { riftEnabled, seed });
  const nodes = [{ state: start, parent: -1, direction: null }];
  const visited = new Set([stateKey(start)]);
  const solution = index => {
    /** @type {string[]} */
    const moves = [];
    while (nodes[index].parent !== -1) { moves.push(nodes[index].direction); index = nodes[index].parent; }
    return moves.reverse();
  };
  let limited = false;
  for (let head = 0; head < nodes.length; head++) {
    const current = nodes[head];
    if (current.state.status === 'won') return { status: 'solved', solution: solution(head), explored: head + 1, discovered: visited.size };
    for (const direction of Object.keys(DIRECTIONS)) {
      const result = transition(current.state, direction);
      if (!result.changed) continue;
      const key = stateKey(result.state);
      if (visited.has(key)) continue;
      if (visited.size >= maxStates) { limited = true; continue; }
      visited.add(key);
      nodes.push({ state: result.state, parent: head, direction });
    }
  }
  return { status: limited ? 'verification incomplete' : 'unsolvable', solution: null, explored: nodes.length, discovered: visited.size };
}
