import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/engine.js';
import { solveLevel } from '../src/solver.js';

const levelURL = new URL('../levels/levels.json', import.meta.url);
const solutionURL = new URL('../levels/solutions.json', import.meta.url);
const levels = JSON.parse(await readFile(levelURL, 'utf8'));
assert.equal(new Set(levels.map(level => level.id)).size, levels.length, 'Level ids must be unique.');
const records = levels.map(level => {
  const result = solveLevel(level);
  assert.equal(result.status, 'solved', `${level.id}: ${result.status}`);
  const game = new GameEngine(level, { seed: 1 });
  for (const direction of result.solution) assert.equal(game.move(direction).changed, true);
  assert.equal(game.getState().status, 'won');
  console.log(`${level.id}: solved in ${result.solution.length} moves; ${result.explored} states explored`);
  return { id: level.id, ...result };
});
// Keep supplied demonstration routes distinct from independently found shortest paths.
const walkthroughs = JSON.parse(await readFile(new URL('../levels/walkthroughs.json', import.meta.url), 'utf8'));
assert.deepEqual(walkthroughs.map(item => item.id), levels.map(level => level.id), 'Every level needs one supplied walkthrough.');
for (const record of walkthroughs) {
  const game = new GameEngine(levels.find(level => level.id === record.id), { riftEnabled: false });
  for (const [index, direction] of record.solution.entries()) {
    assert.equal(game.move(direction).changed, true, `${record.id}: supplied move ${index + 1} ${direction} failed`);
  }
  assert.equal(game.getState().status, 'won', `${record.id}: supplied route did not win`);
  assert.deepEqual(game.getState().barriers, record.expectedBarriers, `${record.id}: supplied route created unexpected barriers`);
  console.log(`${record.id}: supplied ${record.solution.length}-move trail-only walkthrough verified`);
}
if (process.argv.includes('--write')) {
  await writeFile(solutionURL, JSON.stringify(records, null, 2) + '\n');
  console.log('Saved levels/solutions.json');
} else {
  const saved = JSON.parse(await readFile(solutionURL, 'utf8'));
  assert.deepEqual(saved, records, 'Recorded solutions are stale. Run npm run verify:write.');
  console.log('Recorded solutions match the current levels and solver.');
}
