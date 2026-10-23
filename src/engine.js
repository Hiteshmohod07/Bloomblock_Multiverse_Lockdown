import { nextRandom, relocateRift } from './rift.js';

export const DIRECTIONS = Object.freeze({
  up: Object.freeze([-1, 0]), down: Object.freeze([1, 0]),
  left: Object.freeze([0, -1]), right: Object.freeze([0, 1]),
});
export const keyOf = ({ row, column }) => `${row},${column}`;
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

/** Validate and copy named (row, column) data; never freeze the caller's objects. */
export function validateLevel(input) {
  if (!input || typeof input.id !== 'string' || !input.id.trim()) throw new Error('Level needs a nonempty id.');
  if (!Number.isSafeInteger(input.rows) || !Number.isSafeInteger(input.columns) || input.rows < 1 || input.columns < 1)
    throw new Error(`${input.id}: rows and columns must be positive integers.`);
  if (!Array.isArray(input.fragments) || !input.fragments.length) throw new Error(`${input.id}: at least one fragment is required.`);
  if (!Array.isArray(input.walls)) throw new Error(`${input.id}: walls must be an array.`);
  const occupied = new Set();
  const position = (value, label) => {
    if (!value || !Number.isInteger(value.row) || !Number.isInteger(value.column) || value.row < 0 || value.column < 0 || value.row >= input.rows || value.column >= input.columns)
      throw new Error(`${input.id}: ${label} needs valid in-bounds row/column coordinates.`);
    const point = { row: value.row, column: value.column }, key = keyOf(point);
    if (occupied.has(key)) throw new Error(`${input.id}: conflicting object placement at (${key}).`);
    occupied.add(key);
    return point;
  };
  const start = position(input.start, 'one start'), exit = position(input.exit, 'one exit');
  const fragments = input.fragments.map(value => position(value, 'fragment'));
  const walls = input.walls.map(value => position(value, 'wall'));
  return freeze({ id: input.id, name: input.name ?? input.id, subtitle: input.subtitle ?? '',
    hint: input.hint ?? '', provisional: input.provisional === true,
    rows: input.rows, columns: input.columns, start, exit, fragments, walls });
}

export function initialState(level, { riftEnabled = true, seed = 1, excluded = [] } = {}) {
  const rngState = riftEnabled ? nextRandom(seed) : seed >>> 0 || 1;
  const state = { level, player: { ...level.start }, collected: [], barriers: [], moves: 0, status: 'playing',
    riftEnabled, rift: null, rngState, riftCountdown: 1 + rngState % 3, firstRift: null,
    riftAvoid: excluded.filter(Boolean) };
  return state;
}
const copyState = state => ({ ...state, player: { ...state.player }, collected: [...state.collected], barriers: [...state.barriers], rift: state.rift ? { ...state.rift } : null,
  firstRift: state.firstRift ? { ...state.firstRift } : null, riftAvoid: [...state.riftAvoid] });

/** The sole movement rule implementation, shared by engine, preview and solver. */
export function transitionTrail(state, direction) {
  const reject = reason => ({ changed: false, reason, state, event: null });
  if (!Object.hasOwn(DIRECTIONS, direction)) return reject('unknown-direction');
  if (state.status === 'won') return reject('already-won');
  const [dr, dc] = DIRECTIONS[direction];
  const from = { ...state.player }, to = { row: from.row + dr, column: from.column + dc };
  const level = state.level, destination = keyOf(to);
  if (to.row < 0 || to.column < 0 || to.row >= level.rows || to.column >= level.columns) return reject('outside-board');
  if (level.walls.some(wall => keyOf(wall) === destination)) return reject('wall');
  if (state.barriers.includes(destination)) return reject('barrier');
  const collects = level.fragments.some(fragment => keyOf(fragment) === destination) && !state.collected.includes(destination);
  const next = copyState(state);
  next.player = to;
  next.moves += 1;
  next.barriers.push(keyOf(from));
  if (collects) {
    next.collected.push(destination);
  }
  next.status = keyOf(to) === keyOf(level.exit) && next.collected.length === level.fragments.length ? 'won' : 'playing';
  return { changed: true, reason: null, state: next,
    event: { type: 'move', direction, from, to, fragment: collects ? { ...to } : null,
      barrier: { ...from },
      portalActivated: collects && next.collected.length === level.fragments.length,
      victory: next.status === 'won' } };
}

/** Gameplay, preview and solver all use the same seeded rift transition. */
export function transition(state, direction) {
  if (Object.hasOwn(DIRECTIONS, direction) && state.rift && state.status !== 'won') {
    const [dr, dc] = DIRECTIONS[direction];
    if (keyOf({ row: state.player.row + dr, column: state.player.column + dc }) === keyOf(state.rift))
      return { changed: false, reason: 'rift', state, event: null };
  }
  const result = transitionTrail(state, direction);
  if (result.changed && state.riftEnabled) {
    Object.assign(result.state, relocateRift(result.state, [state.rift && keyOf(state.rift)], transitionTrail));
    result.event.rift = { from: state.rift ? { ...state.rift } : null, to: result.state.rift ? { ...result.state.rift } : null };
  }
  return result;
}

const randomSeed = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] || 1;

export class GameEngine {
  #state;
  #history = [];
  #riftEnabled;
  #lastFirstRifts = new Map();
  #lastVisibleRifts = new Map();
  /** @param {any} level @param {{riftEnabled?: boolean, seed?: number}} [options] */
  constructor(level, { riftEnabled = true, seed } = {}) { this.#riftEnabled = riftEnabled; this.loadLevel(level, seed); }
  #freshState(level, seed, currentRift = null) {
    return initialState(level, { riftEnabled: this.#riftEnabled, seed,
      excluded: [this.#lastFirstRifts.get(level.id), currentRift ?? this.#lastVisibleRifts.get(level.id)] });
  }
  loadLevel(level, seed) {
    const validated = validateLevel(level);
    this.#state = this.#freshState(validated, seed ?? (this.#riftEnabled ? randomSeed() : 1));
    this.#history = [];
    return this.getState();
  }
  getState() { return { ...copyState(this.#state), canUndo: this.#history.length > 0 }; }
  move(direction) {
    const result = transition(this.#state, direction);
    if (result.changed) {
      this.#history.push(this.#state);
      this.#state = result.state;
      if (this.#state.rift) {
        this.#lastVisibleRifts.set(this.#state.level.id, keyOf(this.#state.rift));
        if (!this.#history.at(-1).firstRift) this.#lastFirstRifts.set(this.#state.level.id, keyOf(this.#state.rift));
      }
    }
    return { ...result, state: this.getState(), event: result.event ? structuredClone(result.event) : null };
  }
  previewMove(direction) {
    const result = transition(this.#state, direction);
    return { ...result, state: { ...copyState(result.state), canUndo: result.changed || this.#history.length > 0 } };
  }
  undo() {
    if (!this.#history.length) return { changed: false, state: this.getState(), event: null };
    const from = { ...this.#state.player };
    this.#state = this.#history.pop();
    return { changed: true, state: this.getState(), event: { type: 'rewind', from, to: { ...this.#state.player } } };
  }
  restart() {
    const level = this.#state.level;
    this.#state = this.#freshState(level, this.#riftEnabled ? randomSeed() : 1, this.#state.rift && keyOf(this.#state.rift));
    this.#history = [];
    return this.getState();
  }
}
