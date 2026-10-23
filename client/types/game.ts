export type TileType =
  | 'grass'
  | 'path'
  | 'trail'
  | 'flower'
  | 'wall_ruin'
  | 'wall_bush'
  | 'wall_pillar'
  | 'wall_crag'
  | 'wall_gate'
  | 'wall_boulder'
  | 'shard'
  | 'portal';

export interface GridTile {
  row: number;
  col: number;
  type: TileType;
  label?: string;
  sublabel?: string;
  icon?: string;
  isWalkable: boolean;
  shardId?: number;
}

export interface StepRecord {
  fromPos: { row: number; col: number };
  toPos: { row: number; col: number };
  sealedTilePos: { row: number; col: number } | null;
  collectedShardId: number | null;
  stepCount: number;
}

export interface LevelConfig {
  id: string;
  levelNumber: number;
  code: string;
  name: string;
  subtitle: string;
  weather: string;
  gridSize: { rows: number; cols: number };
  startPos: { row: number; col: number };
  portalPos: { row: number; col: number };
  tiles: GridTile[];
  totalShards: number;
  parSteps: number;
  codexIntel: string;
  bgmName: string;
  bpm: number;
}
