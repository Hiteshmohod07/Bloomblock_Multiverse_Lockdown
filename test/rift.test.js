import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameEngine, DIRECTIONS, keyOf } from '../src/engine.js';
import { solveLevel, stateKey } from '../src/solver.js';

const levels = JSON.parse(readFileSync(new URL('../levels/levels.json', import.meta.url), 'utf8'));
const forbidden = state => new Set([keyOf(state.player), keyOf(state.level.start), keyOf(state.level.exit),
  ...state.level.walls.map(keyOf), ...state.level.fragments.map(keyOf), ...state.barriers]);
const adjacent = state => Math.abs(state.rift.row - state.player.row) + Math.abs(state.rift.column - state.player.column) === 1;

 test('no random tile is shown before the first event, including after restart', () => {
  for (const level of levels) for (const seed of [1, 42, 99, 12345]) {
    const game = new GameEngine(level, { seed });
    assert.equal(game.getState().rift, null); assert.equal(game.getState().firstRift, null);
    assert.ok(game.getState().riftCountdown >= 1 && game.getState().riftCountdown <= 3);
    game.restart(); assert.equal(game.getState().rift, null); assert.equal(game.getState().moves, 0);
  }
});

 test('spawn timing varies by seed and the surprise always appears orthogonally beside the new player position', () => {
  const turns = new Set();
  for (const seed of [1, 7, 42, 99, 12345, 123456]) {
    const game = new GameEngine(levels[0], { seed });
    for (let turn = 1; turn <= 3; turn++) {
      assert.equal(game.move('right').changed, true);
      const state = game.getState();
      if (state.rift) { assert.ok(adjacent(state)); turns.add(turn); break; }
    }
  }
  assert.ok(turns.size > 1, 'Expected variable surprise timing');
});

 test('previews do not consume randomness or change the hidden spawn schedule', () => {
  const first = new GameEngine(levels[0], { seed: 1 }), second = new GameEngine(levels[0], { seed: 1 });
  const before = first.getState();
  for (let i = 0; i < 10; i++) {
    const preview = first.previewMove('right');
    preview.state.player.row = 99;
    if (preview.state.rift) preview.state.rift.row = 99;
    preview.state.riftAvoid.push('9,9');
    assert.deepEqual(first.getState(), before);
  }
  assert.deepEqual(first.move('right'), second.move('right'));
});

 test('a spawned adjacent rift blocks entry and invalid input does not reroll or reschedule it', () => {
  const game = new GameEngine(levels[0], { seed: 1 }); game.move('right');
  const before = game.getState(); assert.ok(before.rift); assert.ok(adjacent(before));
  const direction = Object.entries(DIRECTIONS).find(([, [dr, dc]]) => before.player.row + dr === before.rift.row && before.player.column + dc === before.rift.column)[0];
  assert.equal(game.move(direction).reason, 'rift'); assert.deepEqual(game.getState(), before);
  assert.equal(game.move('left').reason, 'barrier'); assert.deepEqual(game.getState(), before);
  assert.equal(game.move('unknown').changed, false); assert.deepEqual(game.getState(), before);
});

 test('rift snapshots, first-spawn metadata and effect results cannot mutate private state', () => {
  const game = new GameEngine(levels[0], { seed: 1 });
  const result = game.move('right'), before = game.getState(); assert.ok(before.rift);
  const snapshot = game.getState(); snapshot.rift.row = 99; snapshot.firstRift.row = 99; snapshot.riftAvoid.push('9,9');
  result.state.rift.row = 99; result.event.rift.to.row = 99;
  assert.deepEqual(game.getState(), before);
});

 test('each step seals its source; rifts last one turn and rewind restores exact timing and positions for replay', () => {
  const game = new GameEngine(levels[0], { seed: 1 });
  const result = solveLevel(levels[0], { fromState: game.getState() }); assert.equal(result.status, 'solved');
  for (const direction of result.solution) {
    const before = game.getState(), move = game.move(direction), after = game.getState();
    assert.equal(move.changed, true); assert.deepEqual(after.barriers, [...before.barriers, keyOf(before.player)]);
    if (after.rift) { assert.ok(adjacent(after)); assert.ok(!forbidden(after).has(keyOf(after.rift))); }
    if (before.rift) assert.equal(after.rift, null, 'A surprise block should clear after the next successful step');
    game.undo(); assert.deepEqual(game.getState(), before);
    game.move(direction); assert.deepEqual(game.getState(), after);
  }
  assert.equal(game.getState().status, 'won'); assert.equal(game.getState().rift, null);
  const won = game.getState(); assert.equal(game.move('up').changed, false); assert.deepEqual(game.getState(), won);
  game.undo(); assert.equal(game.getState().status, 'playing');
});

 test('150 restarts clear the board, hide the upcoming tile, and avoid repeating the preceding first spawn', () => {
  for (const level of levels) {
    const game = new GameEngine(level, { seed: 1 }); let previousFirst = null; let observed = 0;
    for (let attempt = 0; attempt < 30; attempt++) {
      const initial = game.getState(); assert.equal(initial.rift, null);
      const solution = solveLevel(level, { fromState: initial }); assert.equal(solution.status, 'solved');
      for (const direction of solution.solution) {
        game.move(direction); const state = game.getState();
        if (state.rift) {
          assert.ok(adjacent(state)); if (previousFirst) assert.notEqual(keyOf(state.rift), previousFirst);
          previousFirst = keyOf(state.rift); observed++; break;
        }
      }
      game.restart(); const next = game.getState();
      assert.equal(next.rift, null); assert.equal(next.firstRift, null);
      assert.deepEqual(next.player, level.start); assert.deepEqual(next.barriers, []); assert.deepEqual(next.collected, []);
      assert.equal(next.moves, 0); assert.equal(next.status, 'playing'); assert.equal(next.canUndo, false);
    }
    assert.ok(observed > 0, 'Expected surprise blocks on the included board');
  }
});

 test('solver identity includes current rift, RNG, hidden countdown and restart exclusions', () => {
  const state = new GameEngine(levels[0], { seed: 1 }).getState();
  assert.notEqual(stateKey(state), stateKey({ ...state, rift: { row: 0, column: 0 } }));
  assert.notEqual(stateKey(state), stateKey({ ...state, rngState: state.rngState + 1 }));
  assert.notEqual(stateKey(state), stateKey({ ...state, riftCountdown: state.riftCountdown + 1 }));
  assert.notEqual(stateKey(state), stateKey({ ...state, riftAvoid: ['0,1'] }));
});

 test('all five levels remain solvable and replayable under several actual surprise-rift timelines', () => {
  for (const level of levels) for (const seed of [1, 7, 42]) {
    const game = new GameEngine(level, { seed }), initial = game.getState();
    const result = solveLevel(level, { fromState: initial });
    assert.equal(result.status, 'solved', level.id + ' seed ' + seed + ': ' + result.status);
    for (const direction of result.solution) {
      assert.equal(game.move(direction).changed, true);
      const state = game.getState(); if (state.rift) { assert.ok(adjacent(state)); assert.ok(!forbidden(state).has(keyOf(state.rift))); }
    }
    assert.equal(game.getState().status, 'won'); assert.equal(game.getState().collected.length, level.fragments.length);
    assert.deepEqual(initial, new GameEngine(level, { seed }).getState());
  }
});

 test('a narrow corridor suppresses a surprise when no safe adjacent tile exists', () => {
  const line = { id: 'line', rows: 1, columns: 3, start: { row: 0, column: 0 },
    fragments: [{ row: 0, column: 1 }], exit: { row: 0, column: 2 }, walls: [] };
  const game = new GameEngine(line, { seed: 1 }); assert.equal(game.getState().rift, null);
  game.move('right'); assert.equal(game.getState().rift, null); assert.equal(game.move('right').state.status, 'won');
});
