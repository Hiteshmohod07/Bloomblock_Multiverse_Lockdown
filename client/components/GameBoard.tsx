import { useState } from 'react';
import { LevelConfig } from '../types/game';
import { FRAGMENT_SPRITES } from '../media';

type Position = { row: number; col: number };
interface Props {
  level: LevelConfig; player: Position; facing: 'up' | 'down' | 'left' | 'right';
  sealed: Set<string>; collected: Set<number>; rift: Position | null;
  won: boolean; trapped: boolean; onTileClick: (row: number, col: number) => void;
}

export function GameBoard({ level, player, facing, sealed, collected, rift, won, trapped, onTileClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const activePortal = collected.size === level.totalShards;
  const playerImage = `/assets/player/${({ up: 'north', down: 'south', left: 'west', right: 'east' })[facing]}.png`;
  return (
    <div className="board-shell">
      <div id="board" className="maze-grid" role="group" aria-label="Maze. Use arrow keys, WASD or direction buttons." data-won={won}
        style={{ gridTemplateColumns: `repeat(${level.gridSize.cols}, minmax(0, 1fr))` }}>
        {level.tiles.map(tile => {
          const key = `${tile.row},${tile.col}`, isPlayer = player.row === tile.row && player.col === tile.col;
          const isSealed = sealed.has(key), isRift = rift?.row === tile.row && rift?.col === tile.col;
          const isWall = !tile.isWalkable, fragment = tile.shardId !== undefined && !collected.has(tile.shardId);
          const portal = tile.type === 'portal';
          const isAdjacent = Math.abs(player.row - tile.row) + Math.abs(player.col - tile.col) === 1;
          const preview = hovered === key && isAdjacent && !isWall && !isSealed && !isRift && !won;
          const description = `Row ${tile.row}, column ${tile.col}: ${isPlayer ? 'Player. ' : ''}${isSealed ? 'Permanent trail block' : isRift ? 'Temporary surprise rift' : isWall ? 'Wall' : fragment ? `Fragment ${tile.shardId === 1 ? 'A' : 'B'}` : portal ? activePortal ? 'Active portal' : 'Locked walkable portal' : 'Floor'}`;
          return <button type="button" key={key} aria-label={description} data-position={key} data-player={isPlayer} data-sealed={isSealed}
            data-rift={isRift} data-fragment={fragment} data-destination={preview}
            className={`maze-tile ${isSealed ? 'sealed-tile' : isRift ? 'surprise-tile' : isWall ? 'wall-tile' : portal ? 'portal-tile' : fragment ? 'fragment-tile' : tile.type === 'path' ? 'path-tile' : 'grass-tile'} ${isPlayer && !won && !trapped ? 'will-seal' : ''}`}
            onPointerEnter={() => setHovered(key)} onPointerLeave={() => setHovered(null)} onFocus={() => setHovered(key)} onBlur={() => setHovered(null)}
            onClick={() => onTileClick(tile.row, tile.col)}>
            {portal && !isSealed && <img src="/assets/portal/golden_circular_portal.png" alt="" draggable={false}
              className={`portal-sprite ${activePortal ? 'portal-active' : 'portal-locked'}`} />}
            {(isSealed || isWall) && <img src="/assets/obstacle/obstacle.png" alt="" draggable={false} className={`obstacle-sprite ${isWall ? 'wall-obstacle' : 'sealed-obstacle'}`} />}
            {fragment && !isSealed && <><img src={FRAGMENT_SPRITES[level.id][tile.shardId! - 1]} className="fragment-sprite" alt="" draggable={false} /><span className="fragment-id">{tile.shardId === 1 ? 'A' : 'B'}</span></>}
            {isRift && <span className="surprise-sprite" aria-hidden="true">&#10019;</span>}
            {isPlayer && <img src={playerImage} alt="" draggable={false} className="player-sprite" />}
            {isPlayer && !won && !trapped ? <span className="seal-preview">This square seals.</span>
              : <span className="tile-caption">{isSealed ? 'SEALED' : isRift ? 'RIFT' : isWall ? 'WALL' : portal ? activePortal ? 'ACTIVE' : 'LOCKED' : fragment ? 'FRAGMENT' : `${tile.row},${tile.col}`}</span>}
          </button>;
        })}
      </div>
    </div>
  );
}
