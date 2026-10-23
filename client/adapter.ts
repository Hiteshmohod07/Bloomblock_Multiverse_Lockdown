import rawLevels from '../levels/levels.json';
import { LevelConfig } from './types/game';

export const RAW_LEVELS = rawLevels;
export const LEVELS: LevelConfig[] = rawLevels.map((level, index) => {
  const tiles: LevelConfig['tiles'] = [];
  for (let row = 0; row < level.rows; row++) for (let col = 0; col < level.columns; col++) {
    const wall = level.walls.some(p => p.row === row && p.column === col);
    const fragment = level.fragments.findIndex(p => p.row === row && p.column === col);
    const portal = level.exit.row === row && level.exit.column === col;
    tiles.push({ row, col, type: wall ? 'wall_ruin' : portal ? 'portal' : fragment >= 0 ? 'shard' : (row + col) % 3 ? 'grass' : 'path',
      isWalkable: !wall, label: wall ? 'WALL' : `${row},${col}`, ...(fragment >= 0 ? { shardId: fragment + 1 } : {}) });
  }
  return { id: level.id, levelNumber: index + 1, code: `LEVEL ${index + 1}`, name: level.name, subtitle: level.subtitle,
    weather: ['FIRST SEAL', 'TWO REALITIES', 'RUINED SANCTUM', 'FRACTURED TIME', 'FINAL COLLAPSE'][index],
    gridSize: { rows: level.rows, cols: level.columns }, startPos: { row: level.start.row, col: level.start.column },
    portalPos: { row: level.exit.row, col: level.exit.column }, tiles, totalShards: level.fragments.length,
    parSteps: [4, 7, 12, 12, 12][index], codexIntel: level.hint, bgmName: 'Sanctum soundscape', bpm: 84 };
});
