import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameEngine, DIRECTIONS, keyOf } from '../src/engine.js';

const levels = JSON.parse(readFileSync(new URL('../levels/levels.json', import.meta.url), 'utf8'));
const walkthroughs = JSON.parse(readFileSync(new URL('../levels/walkthroughs.json', import.meta.url), 'utf8'));
const cases = [
  { number: 3, name: 'The Forbidden Route', fragments: [[2, 2], [4, 3]], walls: [[1, 0], [1, 1], [3, 1], [3, 2], [3, 3]],
    route: ['right', 'right', 'right', 'right', 'up', 'up', 'left', 'left', 'up', 'up', 'right', 'right'],
    barriers: ['4,2', '2,3'], earlyPortal: ['right', 'right', 'right', 'right', 'up', 'up', 'up', 'up'] },
  { number: 4, name: 'The Fractured Timeline', fragments: [[2, 2], [4, 4]], walls: [],
    route: ['up', 'up', 'right', 'right', 'down', 'down', 'right', 'right', 'up', 'up', 'up', 'up'],
    barriers: ['2,1', '4,3'], earlyPortal: ['up', 'up', 'up', 'up', 'right', 'right', 'right', 'right'] },
  { number: 5, name: 'Collapse of the Multiverse', fragments: [[2, 2], [4, 4]], walls: [[1, 1], [1, 2], [3, 1], [3, 3]],
    route: ['up', 'up', 'right', 'right', 'down', 'down', 'right', 'right', 'up', 'up', 'up', 'up'],
    barriers: ['2,1', '4,3'], earlyPortal: ['up', 'up', 'up', 'up', 'right', 'right', 'right', 'right'] },
];
const point = ([row, column]) => ({ row, column });

for (const spec of cases) {
  const level = levels[spec.number - 1];
  test(`level ${spec.number}: exact supplied layout, title and recorded walkthrough`, () => {
    assert.equal(level.id, `level-${spec.number}`); assert.equal(level.name, spec.name);
    assert.equal(level.rows, 5); assert.equal(level.columns, 5); assert.notEqual(level.provisional, true);
    assert.deepEqual(level.start, point([4, 0])); assert.deepEqual(level.exit, point([0, 4]));
    assert.deepEqual(level.fragments, spec.fragments.map(point)); assert.deepEqual(level.walls, spec.walls.map(point));
    const record = walkthroughs.find(item => item.id === level.id);
    assert.deepEqual(record.solution, spec.route); assert.deepEqual(record.expectedCollectionSeals, spec.barriers);
  });

  test(`level ${spec.number}: supplied route, seal previews, invalid moves and complete rewind/replay`, () => {
    const game = new GameEngine(level, { riftEnabled: false });
    for (let index = 0; index < spec.route.length; index++) {
      const direction = spec.route[index], before = game.getState();
      for (const candidate of Object.keys(DIRECTIONS)) {
        const preview = game.previewMove(candidate);
        assert.deepEqual(game.getState(), before, 'Preview mutated the current state');
        if (!preview.changed) {
          assert.equal(game.move(candidate).changed, false);
          assert.deepEqual(game.getState(), before, 'Blocked movement mutated state/history');
        }
      }
      const preview = game.previewMove(direction);
      assert.equal(preview.changed, true, `Move ${index + 1} ${direction} failed`);
      if (preview.event.fragment) {
        assert.deepEqual(preview.event.barrier, before.player);
        assert.notDeepEqual(preview.event.barrier, preview.event.to);
      }
      const result = game.move(direction), after = game.getState();
      assert.equal(result.changed, true); assert.equal(after.moves, index + 1);
      assert.equal(after.status, index === spec.route.length - 1 ? 'won' : 'playing');
      if (result.event.fragment) {
        assert.equal(after.collected.length, before.collected.length + 1);
        assert.deepEqual(after.barriers, [...before.barriers, keyOf(before.player)]);
        const reverse = { up: 'down', down: 'up', left: 'right', right: 'left' }[direction];
        assert.equal(game.move(reverse).reason, 'barrier'); assert.deepEqual(game.getState(), after);
      }
      assert.deepEqual(after.barriers, [...before.barriers, keyOf(before.player)], 'Every move must seal its source');
      assert.equal(game.undo().changed, true); assert.deepEqual(game.getState(), before);
      game.move(direction); assert.deepEqual(game.getState(), after);
    }
    assert.deepEqual(game.getState().barriers, walkthroughs.find(item => item.id === level.id).expectedBarriers);
    assert.equal(game.getState().collected.length, 2); assert.deepEqual(game.getState().player, level.exit);
    const won = game.getState(); assert.equal(game.move('left').changed, false); assert.deepEqual(game.getState(), won);
    game.restart(); assert.deepEqual(game.getState(), new GameEngine(level, { riftEnabled: false }).getState());
    assert.equal(game.undo().changed, false);
  });

  test(`level ${spec.number}: premature portal entry stays playable; sealed fragments cannot trigger twice`, () => {
    const game = new GameEngine(level, { riftEnabled: false });
    for (const direction of spec.earlyPortal) assert.equal(game.move(direction).changed, true);
    assert.deepEqual(game.getState().player, level.exit);
    assert.ok(game.getState().collected.length < 2); assert.equal(game.getState().status, 'playing');
    game.restart();
    const collectionStep = spec.number === 3 ? 8 : 4;
    for (const direction of spec.route.slice(0, collectionStep)) game.move(direction);
    const before = game.getState(), outgoing = spec.route[collectionStep];
    assert.deepEqual(before.player, level.fragments[0]);
    const reverse = { up: 'down', down: 'up', left: 'right', right: 'left' }[outgoing];
    assert.equal(game.move(outgoing).changed, true); const after = game.getState();
    assert.equal(game.move(reverse).reason, 'barrier'); assert.deepEqual(game.getState(), after);
    assert.deepEqual(game.getState().collected, before.collected);
  });
}
