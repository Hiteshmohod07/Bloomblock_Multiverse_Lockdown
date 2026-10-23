import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameEngine } from '../src/engine.js';

const level = JSON.parse(readFileSync(new URL('../levels/levels.json', import.meta.url), 'utf8'))[1];
const route = ['up', 'up', 'up', 'right', 'up', 'right', 'down'];
const play = (game, directions) => directions.forEach(direction => assert.equal(game.move(direction).changed, true));

test('Two Realities preserves every supplied coordinate, wall and fragment', () => {
  assert.equal(level.id, 'level-2'); assert.equal(level.name, 'TWO REALITIES');
  assert.equal(level.subtitle, 'Two fragments. One escape. Every move changes the maze.');
  assert.equal(level.provisional, undefined);
  assert.equal(level.rows, 5); assert.equal(level.columns, 5);
  assert.deepEqual(level.start, { row: 4, column: 2 });
  assert.deepEqual(level.fragments, [{ row: 1, column: 3 }, { row: 0, column: 4 }]);
  assert.deepEqual(level.exit, { row: 1, column: 4 });
  assert.deepEqual(level.walls, [{ row: 1, column: 0 }, { row: 1, column: 1 }, { row: 2, column: 4 }, { row: 3, column: 0 }, { row: 4, column: 3 }]);
});

test('the supplied seven-move route wins with the exact barriers and counter progression', () => {
  const game = new GameEngine(level, { riftEnabled: false });
  const positions = [[3, 2], [2, 2], [1, 2], [1, 3], [0, 3], [0, 4], [1, 4]];
  assert.equal(game.getState().collected.length, 0);
  route.forEach((direction, index) => {
    const before = game.getState(), preview = game.previewMove(direction);
    assert.deepEqual(game.getState(), before);
    if (index === 3 || index === 5) {
      assert.deepEqual(preview.event.barrier, before.player);
      assert.notDeepEqual(preview.event.barrier, preview.event.to);
    }
    const result = game.move(direction), state = result.state;
    assert.equal(result.changed, true);
    assert.deepEqual(state.player, { row: positions[index][0], column: positions[index][1] });
    assert.equal(state.moves, index + 1);
    assert.equal(state.collected.length, index < 3 ? 0 : index < 5 ? 1 : 2);
    assert.deepEqual(state.barriers, ['4,2', '3,2', '2,2', '1,2', '1,3', '0,3', '0,4'].slice(0, index + 1));
    assert.equal(result.event.portalActivated, index === 5);
    assert.equal(state.status, index === 6 ? 'won' : 'playing');
  });
});

test('all five walls and both created barriers reject movement without consuming a turn', () => {
  const wallCases = [
    [['up', 'up', 'left', 'left'], 'up'],
    [['up', 'up', 'left'], 'up'],
    [['up', 'right', 'right'], 'up'],
    [['up', 'left'], 'left'],
    [[], 'right'],
  ];
  for (const [path, direction] of wallCases) {
    const game = new GameEngine(level, { riftEnabled: false }); play(game, path); const before = game.getState();
    assert.equal(game.move(direction).reason, 'wall'); assert.deepEqual(game.getState(), before);
  }
  const game = new GameEngine(level, { riftEnabled: false }); play(game, route.slice(0, 4));
  let before = game.getState(); assert.equal(game.move('left').reason, 'barrier'); assert.deepEqual(game.getState(), before);
  play(game, ['up', 'right']); before = game.getState();
  assert.equal(game.move('left').reason, 'barrier'); assert.deepEqual(game.getState(), before);
});

test('rewinding each collection restores the complete state and permits replay', () => {
  const game = new GameEngine(level, { riftEnabled: false });
  for (const direction of route) {
    const before = game.getState(), result = game.move(direction);
    if (result.event.fragment || result.event.victory) {
      const after = game.getState(); game.undo(); assert.deepEqual(game.getState(), before);
      assert.equal(game.move(direction).changed, true); assert.deepEqual(game.getState(), after);
    }
  }
  game.restart(); assert.deepEqual(game.getState(), new GameEngine(level, { riftEnabled: false }).getState());
  assert.equal(game.undo().changed, false);
});

test('portal starts locked and stays walkable without victory at one collected fragment', () => {
  const game = new GameEngine(level, { riftEnabled: false });
  assert.equal(game.getState().collected.length, 0);
  assert.equal(game.getState().status, 'playing');
  play(game, ['up', 'up', 'up', 'right', 'right']);
  assert.deepEqual(game.getState().player, level.exit); assert.equal(game.getState().collected.length, 1);
  assert.equal(game.getState().status, 'playing');
  const before = game.getState();
  assert.equal(game.move('left').reason, 'barrier'); assert.deepEqual(game.getState(), before);
  assert.equal(game.getState().collected.length, 1);
  assert.equal(game.getState().status, 'playing');
});
