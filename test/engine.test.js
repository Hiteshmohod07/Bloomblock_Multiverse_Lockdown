import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameEngine, keyOf, validateLevel } from '../src/engine.js';
import { solveLevel, stateKey } from '../src/solver.js';

const levels = JSON.parse(readFileSync(new URL('../levels/levels.json', import.meta.url), 'utf8'));
const tutorial = levels[0];
const fresh = () => new GameEngine(tutorial, { riftEnabled: false });
const moveAll = (game, directions) => directions.forEach(direction => assert.equal(game.move(direction).changed, true));

test('tutorial matches the exact supplied geometry and four-RIGHT sequence', () => {
  assert.deepEqual({ id: tutorial.id, name: tutorial.name, rows: tutorial.rows, columns: tutorial.columns,
    start: tutorial.start, fragments: tutorial.fragments, exit: tutorial.exit, walls: tutorial.walls }, {
    id: 'level-1', name: 'The First Seal', rows: 5, columns: 5, start: { row: 2, column: 0 },
    fragments: [{ row: 2, column: 2 }], exit: { row: 2, column: 4 }, walls: [],
  });
  const game = fresh();
  for (let step = 1; step <= 4; step++) {
    const result = game.move('right'), state = game.getState();
    assert.deepEqual(state.player, { row: 2, column: step });
    assert.equal(state.moves, step);
    assert.deepEqual(state.barriers, ['2,0', '2,1', '2,2', '2,3'].slice(0, step));
    assert.deepEqual(state.collected, step >= 2 ? ['2,2'] : []);
    assert.equal(state.status, step === 4 ? 'won' : 'playing');
    assert.equal(result.event.portalActivated, step === 2);
    assert.equal(result.event.victory, step === 4);
  }
});

test('preview identifies the previous square and never mutates state or history', () => {
  const game = fresh(); game.move('right'); const before = game.getState();
  const preview = game.previewMove('right');
  assert.deepEqual(preview.event.barrier, { row: 2, column: 1 });
  assert.deepEqual(preview.event.to, { row: 2, column: 2 });
  assert.deepEqual(game.getState(), before);
  preview.state.player.row = 99; preview.state.barriers.push('0,0');
  assert.deepEqual(game.getState(), before);
  game.undo(); assert.equal(game.getState().canUndo, false);
});

test('collection undo restores fragment, barrier, counter and dormant portal; replay works', () => {
  const game = fresh(); game.move('right'); const before = game.getState();
  game.move('right'); assert.equal(game.getState().collected.length, 1);
  assert.equal(game.undo().event.type, 'rewind');
  assert.deepEqual(game.getState(), before);
  const replay = game.move('right');
  assert.deepEqual(replay.state.barriers, ['2,0', '2,1']);
  assert.equal(replay.event.portalActivated, true);
});

test('ordinary moves seal the source; revisiting a departed fragment square is blocked', () => {
  const game = fresh();
  game.move('right'); assert.deepEqual(game.getState().barriers, ['2,0']);
  moveAll(game, ['right', 'right']);
  const before = game.getState(); assert.equal(game.move('left').reason, 'barrier'); assert.deepEqual(game.getState(), before);
  assert.deepEqual(game.getState().barriers, ['2,0', '2,1', '2,2']);
  assert.deepEqual(game.getState().collected, ['2,2']);
});

test('invalid directions, boundaries, walls and barriers change nothing including undo', () => {
  const game = fresh();
  for (const direction of ['left', 'diagonal', '__proto__']) {
    const before = game.getState(); assert.equal(game.move(direction).changed, false); assert.deepEqual(game.getState(), before);
  }
  moveAll(game, ['right', 'right']); const before = game.getState();
  assert.equal(game.move('left').reason, 'barrier'); assert.deepEqual(game.getState(), before);
  game.undo(); assert.equal(game.getState().moves, 1);
  const walled = new GameEngine(levels[1], { riftEnabled: false }); const wallBefore = walled.getState();
  assert.equal(walled.move('right').reason, 'wall'); assert.deepEqual(walled.getState(), wallBefore);
});

test('portal is walkable before collection and only awards victory after all fragments', () => {
  const game = fresh();
  moveAll(game, ['up', 'right', 'right', 'right', 'right', 'down']);
  assert.deepEqual(game.getState().player, tutorial.exit);
  assert.equal(game.getState().status, 'playing'); assert.equal(game.getState().collected.length, 0);
  game.restart(); moveAll(game, ['right', 'right', 'right', 'right']);
  assert.equal(game.getState().status, 'won');
});

test('victory blocks movement but permits undo, resumed play and restart', () => {
  const game = fresh(); moveAll(game, Array(4).fill('right'));
  const won = game.getState(); assert.equal(game.move('up').changed, false); assert.deepEqual(game.getState(), won);
  game.undo(); assert.equal(game.getState().status, 'playing'); assert.equal(game.getState().moves, 3);
  assert.equal(game.move('right').state.status, 'won');
  game.restart(); assert.deepEqual(game.getState(), fresh().getState()); assert.equal(game.undo().changed, false);
});

test('loadLevel clears history; invalid level load preserves the playable state', () => {
  const game = fresh(); game.move('right');
  const before = game.getState(); assert.throws(() => game.loadLevel({})); assert.deepEqual(game.getState(), before);
  game.loadLevel(levels[1]); assert.equal(game.getState().level.id, 'level-2'); assert.equal(game.getState().canUndo, false);
});

test('outside callers cannot mutate game state through snapshots, level data or event results', () => {
  const data = structuredClone(tutorial), game = new GameEngine(data, { riftEnabled: false });
  data.start.row = 4; data.fragments[0].row = 4;
  const snapshot = game.getState(); snapshot.player.row = 4; snapshot.collected.push('4,4'); snapshot.barriers.push('1,1');
  assert.throws(() => { snapshot.level.start.row = 99; }, TypeError);
  const result = game.move('right'); result.event.to.row = 99; result.state.player.row = 99;
  game.move('right'); game.undo();
  assert.deepEqual(game.getState().player, { row: 2, column: 1 }); assert.deepEqual(game.getState().collected, []);
});

test('validation rejects inconsistent dimensions, bounds, conflicts, missing objects and no fragments', () => {
  const invalid = [
    { rows: 0 }, { columns: 2.5 }, { rows: ['.....'] }, { start: null }, { exit: null }, { fragments: [] },
    { start: { row: -1, column: 0 } }, { exit: { row: 2, column: 5 } },
    { fragments: [{ row: 1.5, column: 2 }] }, { walls: [tutorial.start] },
    { fragments: [tutorial.fragments[0], tutorial.fragments[0]] }, { exit: tutorial.start },
    { walls: [{ row: 0, column: 0 }, { row: 0, column: 0 }] },
  ];
  for (const patch of invalid) assert.throws(() => validateLevel({ ...structuredClone(tutorial), ...patch }));
  assert.equal(validateLevel(tutorial).rows, 5);
});

test('search identity includes position, fragment set and barrier set and ignores set ordering', () => {
  const base = fresh().getState();
  assert.notEqual(stateKey(base), stateKey({ ...base, player: { row: 0, column: 0 } }));
  assert.notEqual(stateKey(base), stateKey({ ...base, collected: ['2,2'] }));
  assert.notEqual(stateKey(base), stateKey({ ...base, barriers: ['2,1'] }));
  assert.equal(stateKey({ ...base, barriers: ['1,1', '2,1'] }), stateKey({ ...base, barriers: ['2,1', '1,1'] }));
});

test('solver distinguishes exhausted search from limited search', () => {
  const impossible = { id: 'impossible', rows: 1, columns: 4, start: { row: 0, column: 0 },
    fragments: [{ row: 0, column: 1 }], exit: { row: 0, column: 3 }, walls: [{ row: 0, column: 2 }] };
  assert.equal(solveLevel(impossible).status, 'unsolvable');
  assert.equal(solveLevel(tutorial, { maxStates: 1 }).status, 'verification incomplete');
  assert.throws(() => solveLevel(tutorial, { maxStates: 0 }));
});


test('every level and its recorded solution is validated and replayed to victory', () => {
  const records = JSON.parse(readFileSync(new URL('../levels/solutions.json', import.meta.url), 'utf8'));
  assert.equal(levels.length, 5); assert.equal(records.length, levels.length);
  for (const level of levels) {
    const result = solveLevel(level); assert.equal(result.status, 'solved');
    const record = records.find(record => record.id === level.id); assert.ok(record); assert.deepEqual(result.solution, record.solution);
    const game = new GameEngine(level, { riftEnabled: false }); moveAll(game, record.solution);
    assert.equal(game.getState().status, 'won');
    assert.equal(game.getState().collected.length, level.fragments.length);
    assert.equal(game.getState().barriers.length, game.getState().moves);
    assert.equal(keyOf(game.getState().player), keyOf(level.exit));
  }
});
