import React from 'react';
import { GameBoard } from './GameBoard';
import { LevelConfig, StepRecord } from '../types/game';

interface GbaArenaProps {
  level: LevelConfig;
  playerPos: { row: number; col: number };
  riftPos: { row: number; col: number } | null;
  facing: 'up' | 'down' | 'left' | 'right';
  sealedTiles: Set<string>;
  collectedShardIds: Set<number>;
  steps: number;
  history: StepRecord[];
  paradoxStability: number;
  intelMessage: string;
  onMove: (dr: number, dc: number) => void;
  onTileClick: (row: number, col: number) => void;
  onRewind: () => void;
  onReset: () => void;
  onHint: () => void;
  onActionA: () => void;
  hintsRemaining: number;
  isTrapped: boolean;
  isCompleted: boolean;
  bgmActive: boolean;
  onToggleBgm: () => void;
  onSelectLevelModal: () => void;
  onNextLevel: () => void;
  hasNextLevel: boolean;
  lastSealedPos: { row: number; col: number } | null;
  justCollectedShardId: number | null;
}

export const GbaArena: React.FC<GbaArenaProps> = ({
  level,
  playerPos,
  facing,
  riftPos,
  sealedTiles,
  collectedShardIds,
  steps,
  paradoxStability,
  intelMessage,
  onMove,
  onTileClick,
  onRewind,
  onReset,
  onHint,
  onActionA,
  hintsRemaining,
  isTrapped,
  isCompleted,
  bgmActive,
  onToggleBgm,
  onSelectLevelModal,
  onNextLevel,
  hasNextLevel,
  lastSealedPos,
  justCollectedShardId,
}) => {
  const stepDisplay = steps < 10 ? `0${steps}` : `${steps}`;
  const shardsDisplay = `${collectedShardIds.size}/${level.totalShards}`;

  // Check if any adjacent orthogonal tile contains an uncollected shard
  const adjacentUncollectedDirections: Array<{ dr: number; dc: number; shardId: number }> = [];
  const deltas = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  deltas.forEach((d) => {
    const nr = playerPos.row + d.dr;
    const nc = playerPos.col + d.dc;
    const t = level.tiles.find((tile) => tile.row === nr && tile.col === nc);
    if (t?.shardId !== undefined && !collectedShardIds.has(t.shardId)) {
      adjacentUncollectedDirections.push({ dr: d.dr, dc: d.dc, shardId: t.shardId });
    }
  });

  const hasAdjacentShard = adjacentUncollectedDirections.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
      {/* TOP POKÉNAV BANNER */}
      <div className="bg-[#FFF8E7] p-3 sm:p-4 rounded-xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#CDB8F5] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Level Badge Selector */}
          <button
            onClick={onSelectLevelModal}
            className="bg-[#BDECCB] hover:bg-[#a6e5b7] text-[#1e4d2b] px-3 py-1.5 rounded-lg border-2 border-[#2D3748] shadow-[0_2px_0_0_#2D3748] active:translate-y-0.5 font-['Press_Start_2P'] text-[9px] flex items-center gap-1.5 cursor-pointer font-bold transition-transform"
            type="button"
            title="Choose Level"
          >
            <span className="w-2 h-2 rounded-full bg-[#1e4d2b] animate-ping" />
            <span>{level.code} ▾</span>
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-['Epilogue'] font-extrabold text-lg sm:text-xl text-[#2D3748] uppercase tracking-tight">
                {level.name}
              </span>
              <span className="bg-[#BDE7F5] text-[#1e3a8a] font-['Press_Start_2P'] text-[7px] px-2 py-0.5 rounded border border-[#2D3748] font-bold">
                {level.weather}
              </span>
            </div>
            <span className="font-['Epilogue'] text-[10px] text-[#64748B] uppercase font-bold mt-0.5">
              {level.subtitle}
            </span>
          </div>
        </div>

        {/* Telemetry Badges */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Fragments Badge */}
          <div className="bg-[#FFE08A] px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-2 border-[#2D3748] shadow-[0_2px_0_0_#2D3748]">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#784a19]">diamond</span>
            <div className="flex flex-col">
              <span className="font-['Epilogue'] text-[9px] text-[#784a19] uppercase font-bold leading-none">
                FRAGMENTS
              </span>
              <span className="font-['Press_Start_2P'] text-[10px] text-[#2D3748] font-bold mt-0.5">
                <span id="fragment-count">{shardsDisplay}</span>
              </span>
            </div>
          </div>

          {/* Steps Counter */}
          <div className="bg-[#BDE7F5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-2 border-[#2D3748] shadow-[0_2px_0_0_#2D3748]">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-[#1e3a8a]">footprint</span>
            <div className="flex flex-col">
              <span className="font-['Epilogue'] text-[9px] text-[#1e3a8a] uppercase font-bold leading-none">
                STEPS
              </span>
              <span className="font-['Press_Start_2P'] text-[10px] text-[#2D3748] font-bold mt-0.5">
                <span id="moves">{stepDisplay}</span>
              </span>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-[#CDB8F5] px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-2 border-[#2D3748] shadow-[0_2px_0_0_#2D3748]">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#4f3d71]">timeline</span>
            <div className="flex flex-col">
              <span className="font-['Epilogue'] text-[9px] text-[#4f3d71] uppercase font-bold leading-none">
                LEVEL
              </span>
              <span className="font-['Press_Start_2P'] text-[10px] text-[#2D3748] font-bold mt-0.5">
                {level.levelNumber} / 5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEAL PREVIEW ALERT BANNER (When player is next to an uncollected fragment) */}
      {!isCompleted && (
        <div className="bg-[#FFBE83]/30 border-2 border-[#FFBE83] rounded-xl px-4 py-2 flex items-center justify-between gap-2 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[#c2410c] text-xl">warning</span>
            <span className="font-['Press_Start_2P'] text-[8px] sm:text-[9px] text-[#9a3412]">
              EVERY STEP SEALS THE TILE YOU LEAVE. Surprise rifts can appear beside you without warning.
            </span>
          </div>
          <span className="bg-[#FFBE83] text-[#7c2d12] font-['Press_Start_2P'] text-[7px] px-2 py-0.5 rounded border border-[#c2410c] font-bold">
            ACTIVE
          </span>
        </div>
      )}

      {isTrapped && <div role="alert" className="archive-card bg-red-50 font-bold text-red-900">No legal steps remain. Use Time Rewind or Restart to escape this timeline.</div>}
      {/* MAIN GAMEPLAY ARENA: 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* CENTER STAGE: Retro Handheld Puzzle Maze (lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* GBA Screen Frame */}
          <div className="relative bg-[#BDE7F5] p-3 sm:p-5 rounded-2xl border-4 border-[#2D3748] shadow-[0_6px_0_0_#2D3748] flex flex-col items-center justify-center overflow-hidden">
            {/* Screen Bezel Header */}
            <div className="w-full flex flex-wrap items-center justify-between pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded border border-[#2D3748]">
                  <span className="w-2 h-2 rounded-full bg-[#F28C8C]" />
                  <span className="w-2 h-2 rounded-full bg-[#FFE08A]" />
                  <span className="w-2 h-2 rounded-full bg-[#BDECCB]" />
                </div>
                <span className="font-['Press_Start_2P'] text-[8px] text-[#2D3748] uppercase tracking-wider font-bold">
                  GAME BOY ADVANCE // OVERWORLD MATRIX
                </span>
              </div>
              <span className="font-['Press_Start_2P'] text-[7px] bg-white/90 text-[#2D3748] px-2 py-0.5 rounded border border-[#2D3748] font-bold">
                5x5 PIXEL MAZE
              </span>
            </div>

            <GameBoard level={level} player={playerPos} facing={facing} sealed={sealedTiles} collected={collectedShardIds} rift={riftPos} won={isCompleted} trapped={isTrapped} onTileClick={onTileClick} />

            {/* Tile Legend Footnote */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <div className="flex items-center gap-1.5 font-['Epilogue'] text-[11px] text-[#2D3748] font-bold">
                <span className="w-3.5 h-3.5 rounded bg-[#FFBE83] border border-[#c2410c] flex items-center justify-center text-[8px] text-[#9a3412]">
                  🔥
                </span>
                <span>TRAIL BLOCK</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold"><span className="w-3.5 h-3.5 rounded border-2 border-dotted border-[#16748b] bg-[#BDE7F5] text-center text-[9px]">&#10019;</span><span>SURPRISE RIFT</span></div>
              <div className="flex items-center gap-1.5 font-['Epilogue'] text-[11px] text-[#2D3748] font-bold">
                <span className="w-3.5 h-3.5 rounded bg-[#FFE08A] border border-[#b45309] flex items-center justify-center text-[8px] text-[#78350f]">
                  ✦
                </span>
                <span>MULTIVERSE FRAGMENT</span>
              </div>
              <div className="flex items-center gap-1.5 font-['Epilogue'] text-[11px] text-[#2D3748] font-bold">
                <span className="w-3.5 h-3.5 rounded bg-[#CBD5E1] border border-[#2D3748]" />
                <span>WALL MONOLITH</span>
              </div>
              <div className="flex items-center gap-1.5 font-['Epilogue'] text-[11px] text-[#2D3748] font-bold">
                <span className="w-3.5 h-3.5 rounded bg-[#CDB8F5] border border-[#58467b]" />
                <span>EXIT PORTAL</span>
              </div>
            </div>
          </div>

          {/* INSTRUCTION & INTEL DIALOGUE BOX */}
          <div className="bg-[#FFF8E7] p-3 sm:p-4 rounded-xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#CDB8F5] flex flex-col gap-1.5 pixel-corners">
            <div className="bg-white p-3 rounded-lg border-2 border-[#CBD5E1] flex flex-col gap-1 shadow-inner relative">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F28C8C] border border-[#991b1b]" />
                  <span className="font-['Press_Start_2P'] text-[9px] text-[#2D3748] uppercase tracking-wide font-bold">
                    PROF. AGAMOTTO // CODEX INTEL
                  </span>
                </div>
                <span className="font-['Press_Start_2P'] text-[7px] text-[#64748B]">
                  KEYBOARD: [W/A/S/D] OR ARROWS
                </span>
              </div>

              <div className="pt-1.5 flex items-start justify-between gap-3">
                <p id="message" role="status" aria-live="polite" className="font-['VT323'] text-xl sm:text-2xl text-[#2D3748] leading-tight tracking-wide">
                  <span className="text-[#9a3412] font-bold">RULE: </span>
                  {intelMessage}
                </p>
                <span className="text-[#F28C8C] text-sm font-black animate-gba-cursor shrink-0 pt-1">
                  ▼
                </span>
              </div>

              <div className="bg-[#F6EDD9] px-2 py-1 rounded flex flex-wrap items-center justify-between gap-2 font-['Press_Start_2P'] text-[7px] text-[#475569] mt-1 border border-[#E5D7BF]">
                <span>UNDO: [Z] / [SPACE] / [B]</span>
                <span>RESTART: [R]</span>
                <span>SCAN: [ENTER]</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Handheld Controls & Key Actions (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* TIME REWIND & RESTART PANEL */}
          <div className="bg-[#FFF8E7] p-4 rounded-xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#CDB8F5] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CDB8F5] border border-[#2D3748]" />
                <span className="font-['Epilogue'] font-extrabold text-base text-[#2D3748] uppercase">
                  TIME CONTROLS
                </span>
              </div>
              <span className="bg-[#BDE7F5] text-[#1e3a8a] font-['Press_Start_2P'] text-[7px] px-2 py-0.5 rounded border border-[#2D3748] font-bold">
                UNLIMITED
              </span>
            </div>

            <p className="font-['Hanken_Grotesk'] text-xs text-[#49454e] leading-snug">
              Undo moves to restore previous positions, fragment states, and collapse barriers.
            </p>

            {/* VISIBLE TIME REWIND BUTTON with Pastel Lavender Time-Rune Icon */}
            <button
              onClick={onRewind}
              disabled={steps === 0}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 border-2 border-[#2D3748] transition-all ${
                steps > 0
                  ? 'bg-[#CDB8F5] hover:bg-[#bda4eb] text-[#221043] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none cursor-pointer font-bold'
                  : 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed opacity-60'
              }`}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-2xl text-[#221043] animate-pulse">
                hourglass_empty
              </span>
              <span className="font-['Press_Start_2P'] text-[10px] uppercase tracking-wider font-extrabold">
                TIME REWIND
              </span>
            </button>

            {/* RESTART & HINT BUTTONS */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onReset}
                className="bg-[#F28C8C] hover:bg-[#e67575] text-[#742a2a] py-2.5 px-2 rounded-lg border-2 border-[#2D3748] shadow-[0_2px_0_0_#2D3748] active:translate-y-0.5 flex items-center justify-center gap-1 font-['Press_Start_2P'] text-[7px] uppercase cursor-pointer font-bold"
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>RESTART</span>
              </button>

              <button
                onClick={onHint}
                className="bg-[#BDE7F5] hover:bg-[#a9def0] text-[#1e3a8a] py-2.5 px-2 rounded-lg border-2 border-[#2D3748] shadow-[0_2px_0_0_#2D3748] active:translate-y-0.5 flex items-center justify-center gap-1 font-['Press_Start_2P'] text-[7px] uppercase cursor-pointer font-bold"
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">help_center</span>
                <span>HINT ({hintsRemaining})</span>
              </button>
            </div>
          </div>

          {/* VIRTUAL CROSS D-PAD & GAMEPAD DECK */}
          <div className="bg-[#FFF8E7] p-4 rounded-xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#CDB8F5] hidden lg:flex flex-col items-center gap-3">
            <div className="w-full flex items-center justify-between">
              <span className="font-['Press_Start_2P'] text-[8px] text-[#2D3748] uppercase tracking-wider font-bold">
                GBA CONTROLLER
              </span>
              <span className="font-['Press_Start_2P'] text-[7px] text-[#64748B]">MODEL AGB-001</span>
            </div>

            {/* D-Pad Component */}
            <div className="relative w-36 h-36 bg-[#E2E8F0] rounded-full p-2 flex items-center justify-center shadow-inner border-2 border-[#CBD5E1]">
              <button
                onClick={() => onMove(-1, 0)}
                className="absolute top-1 w-10 h-10 bg-[#2D3748] hover:bg-[#3d4b61] text-white rounded-t-lg shadow-[0_2px_0_0_#1a202c] active:translate-y-0.5 flex items-center justify-center cursor-pointer"
                type="button"
                aria-label="Move Up"
              >
                <span aria-hidden="true" className="material-symbols-outlined">arrow_drop_up</span>
              </button>

              <button
                onClick={() => onMove(0, -1)}
                className="absolute left-1 w-10 h-10 bg-[#2D3748] hover:bg-[#3d4b61] text-white rounded-l-lg shadow-[0_2px_0_0_#1a202c] active:translate-x-0.5 flex items-center justify-center cursor-pointer"
                type="button"
                aria-label="Move Left"
              >
                <span aria-hidden="true" className="material-symbols-outlined">arrow_left</span>
              </button>

              <div className="w-8 h-8 bg-[#1a202c] rounded-full flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4A5568]" />
              </div>

              <button
                onClick={() => onMove(0, 1)}
                className="absolute right-1 w-10 h-10 bg-[#2D3748] hover:bg-[#3d4b61] text-white rounded-r-lg shadow-[0_2px_0_0_#1a202c] active:-translate-x-0.5 flex items-center justify-center cursor-pointer"
                type="button"
                aria-label="Move Right"
              >
                <span aria-hidden="true" className="material-symbols-outlined">arrow_right</span>
              </button>

              <button
                onClick={() => onMove(1, 0)}
                className="absolute bottom-1 w-10 h-10 bg-[#2D3748] hover:bg-[#3d4b61] text-white rounded-b-lg shadow-[0_2px_0_0_#1a202c] active:translate-y-0.5 flex items-center justify-center cursor-pointer"
                type="button"
                aria-label="Move Down"
              >
                <span aria-hidden="true" className="material-symbols-outlined">arrow_drop_down</span>
              </button>
            </div>

            {/* Action Buttons [B / A] */}
            <div className="w-full flex items-center justify-around pt-1">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={onRewind}
                  className="w-11 h-11 rounded-full bg-[#F28C8C] hover:bg-[#e67575] text-white font-['Press_Start_2P'] text-[11px] border-2 border-[#2D3748] shadow-[0_3px_0_0_#2D3748] active:translate-y-1 active:shadow-none flex items-center justify-center cursor-pointer font-bold"
                  type="button"
                >
                  B
                </button>
                <span className="font-['Press_Start_2P'] text-[6px] text-[#2D3748] uppercase font-bold">
                  UNDO (B)
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={onActionA}
                  className="w-11 h-11 rounded-full bg-[#BDE7F5] hover:bg-[#a9def0] text-[#1e3a8a] font-['Press_Start_2P'] text-[11px] border-2 border-[#2D3748] shadow-[0_3px_0_0_#2D3748] active:translate-y-1 active:shadow-none flex items-center justify-center cursor-pointer font-bold"
                  type="button"
                >
                  A
                </button>
                <span className="font-['Press_Start_2P'] text-[6px] text-[#2D3748] uppercase font-bold">
                  SCAN (ENTER)
                </span>
              </div>
            </div>
          </div>

          {/* SATCHEL & SOUND CONTROLS */}
          <div className="bg-[#FFF8E7] p-3.5 rounded-xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#CDB8F5] flex flex-col gap-2.5">
            <span className="font-['Epilogue'] font-extrabold text-sm text-[#2D3748] uppercase">
              KEY ITEMS & SOUND
            </span>

            <div className="bg-white p-2.5 rounded-lg border-2 border-[#CBD5E1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-[#c2410c] text-xl">magic_button</span>
                <div className="flex flex-col">
                  <span className="font-['Press_Start_2P'] text-[7px] text-[#2D3748] uppercase font-bold">
                    SLING RING LV.2
                  </span>
                  <span className="text-[10px] text-[#64748B]">Seals departure tiles</span>
                </div>
              </div>
              <span className="font-['Press_Start_2P'] text-[6px] bg-[#BDECCB] text-[#1e4d2b] px-1.5 py-0.5 rounded border border-[#2D3748] font-bold">
                ACTIVE
              </span>
            </div>

            <button
              onClick={onToggleBgm}
              className="w-full bg-white hover:bg-slate-50 p-2 rounded-lg border-2 border-[#CBD5E1] flex items-center justify-between text-left cursor-pointer transition-colors"
              type="button"
            >
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-[#58467b]">
                  {bgmActive ? 'music_note' : 'music_off'}
                </span>
                <span className="font-['Epilogue'] text-xs font-bold text-[#2D3748]">
                  BGM: {level.bgmName}
                </span>
              </div>
              <span className="font-['Press_Start_2P'] text-[7px] text-[#58467b] font-bold">
                {bgmActive ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* VICTORY OVERLAY MODAL: REALITY RESTORED! */}
      {isCompleted && (
        <div role="dialog" aria-modal="true" aria-labelledby="victory-title" data-dialog="victory" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-[#FFF8E7] rounded-2xl border-4 border-[#2D3748] shadow-[0_10px_0_0_#CDB8F5] p-6 sm:p-8 flex flex-col items-center text-center pixel-corners relative overflow-hidden">
            {/* Multiverse magic banner */}
            <div className="bg-[#BDECCB] text-[#1e4d2b] px-4 py-1 rounded-md font-['Press_Start_2P'] text-[9px] uppercase tracking-wider mb-3 border-2 border-[#2D3748] font-bold shadow-sm">
              ★ PLANAR REALITY STABILIZED ★
            </div>

            {/* REALITY RESTORED! */}
            <h2 id="victory-title" tabIndex={-1} className="font-['Epilogue'] font-black text-3xl sm:text-4xl text-[#2D3748] uppercase tracking-tight">
              REALITY RESTORED!
            </h2>

            <p className="font-['Epilogue'] text-xs sm:text-sm text-[#784a19] font-bold uppercase mt-1">
              {level.code}: {level.name}
            </p>

            {/* Magical Pixel Effect Icon */}
            <div className="my-5 w-20 h-20 rounded-2xl bg-[#FFE08A] border-3 border-[#2D3748] shadow-[0_0_24px_rgba(255,224,138,0.8)] flex items-center justify-center animate-bounce">
              <span aria-hidden="true" className="material-symbols-outlined text-4xl text-[#78350f]">
                auto_awesome
              </span>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3 w-full my-2">
              <div className="bg-white p-3 rounded-xl border-2 border-[#CBD5E1]">
                <span className="font-['Press_Start_2P'] text-[7px] text-[#64748B] block">
                  FRAGMENTS
                </span>
                <span className="font-['Press_Start_2P'] text-sm text-[#78350f] font-bold mt-1 block">
                  {collectedShardIds.size} / {level.totalShards}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border-2 border-[#CBD5E1]">
                <span className="font-['Press_Start_2P'] text-[7px] text-[#64748B] block">
                  TOTAL STEPS
                </span>
                <span className="font-['Press_Start_2P'] text-sm text-[#1e3a8a] font-bold mt-1 block">
                  {steps} (PAR {level.parSteps})
                </span>
              </div>
            </div>

            <p className="font-['VT323'] text-xl text-[#2D3748] my-3 leading-relaxed">
              Sorcerer Supreme has secured all multiverse fragments! The Sling-Ring rifts have stabilized, anchoring the Prime Continuum.
            </p>

            <button type="button" onClick={onRewind} className="text-sm font-bold underline py-2">Time Rewind - undo victory</button>
            {/* Next Level & Replay Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
              {hasNextLevel ? (
                <button
                  onClick={onNextLevel}
                  className="w-full bg-[#BDECCB] hover:bg-[#a6e5b7] text-[#1e4d2b] py-3.5 px-4 rounded-xl font-['Press_Start_2P'] text-[10px] uppercase border-2 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none cursor-pointer font-bold transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">fast_forward</span>
                  <span>NEXT LEVEL</span>
                </button>
              ) : (
                <button
                  onClick={onSelectLevelModal}
                  className="w-full bg-[#CDB8F5] hover:bg-[#bda4eb] text-[#221043] py-3.5 px-4 rounded-xl font-['Press_Start_2P'] text-[10px] uppercase border-2 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none cursor-pointer font-bold transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  <span>SELECT LEVEL</span>
                </button>
              )}

              <button
                onClick={onReset}
                className="w-full bg-white hover:bg-slate-100 text-[#2D3748] py-3.5 px-4 rounded-xl font-['Press_Start_2P'] text-[9px] uppercase border-2 border-[#2D3748] shadow-[0_3px_0_0_#2D3748] active:translate-y-0.5 active:shadow-none cursor-pointer font-bold transition-all"
                type="button"
              >
                REPLAY LEVEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
