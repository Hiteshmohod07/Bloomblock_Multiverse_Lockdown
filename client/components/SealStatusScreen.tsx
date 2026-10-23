import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LevelConfig } from '../types/game';

interface SealStatusScreenProps {
  level: LevelConfig;
  isCompleted: boolean;
  steps: number;
  totalShards: number;
  collectedShards: number;
  paradoxStability: number;
  onReplayLevel: () => void;
  onNextLevel: () => void;
  hasNextLevel: boolean;
  onReturnToArena: () => void;
}

export const SealStatusScreen: React.FC<SealStatusScreenProps> = ({
  level,
  isCompleted,
  steps,
  totalShards,
  collectedShards,
  paradoxStability,
  onReplayLevel,
  onNextLevel,
  hasNextLevel,
  onReturnToArena,
}) => {
  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFBE83', '#CDB8F5', '#BDECCB', '#BDE7F5', '#FFE08A'],
        });
      } catch {
        // Fallback
      }
    }
  }, [isCompleted]);

  // Performance classification
  let rank = 'A-RANK';
  let rankBadge = 'bg-[#BDECCB] text-[#1e4d2b]';
  if (steps <= level.parSteps && collectedShards === totalShards) {
    rank = 'S-RANK SUPREME';
    rankBadge = 'bg-[#FFE08A] text-[#78350f]';
  } else if (steps <= level.parSteps + 4) {
    rank = 'A-RANK ADEPT';
    rankBadge = 'bg-[#BDECCB] text-[#1e4d2b]';
  } else {
    rank = 'B-RANK APPRENTICE';
    rankBadge = 'bg-[#BDE7F5] text-[#1e3a8a]';
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-4">
      {/* Main Status Slate */}
      <div className="bg-[#FFF8E7] p-6 sm:p-10 rounded-2xl border-4 border-[#2D3748] shadow-[0_8px_0_0_#CDB8F5] flex flex-col items-center text-center pixel-corners relative overflow-hidden">
        {/* Status Header */}
        <div className="bg-[#BDECCB] text-[#1e4d2b] px-4 py-1 rounded-md font-['Press_Start_2P'] text-[9px] uppercase tracking-wider mb-3 border-2 border-[#2D3748] font-bold shadow-xs">
          {isCompleted ? '★ REALITY MATRIX RESTORED ★' : '⚡ LEVEL IN PROGRESS'}
        </div>

        <h1 className="font-['Epilogue'] font-black text-3xl sm:text-5xl text-[#2D3748] uppercase tracking-tight">
          {isCompleted ? 'REALITY RESTORED!' : 'SEAL STATUS REPORT'}
        </h1>

        <p className="font-['Epilogue'] text-xs sm:text-sm text-[#784a19] font-bold uppercase mt-1">
          {level.code}: {level.name}
        </p>

        {/* Rank Classification Plaque */}
        <div className="my-6 p-4 sm:p-6 bg-white rounded-2xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] flex flex-col items-center w-full max-w-md">
          <span className="font-['Press_Start_2P'] text-[8px] text-[#64748B] uppercase mb-1 font-bold">
            SORCERER RANKING
          </span>
          <span className={`px-4 py-1.5 rounded-lg font-['Epilogue'] font-black text-2xl sm:text-4xl border-2 border-[#2D3748] ${rankBadge} mt-1`}>
            {rank}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
          {/* Shards */}
          <div className="bg-white p-4 rounded-xl border-2 border-[#CBD5E1] flex flex-col items-center shadow-xs">
            <span aria-hidden="true" className="material-symbols-outlined text-[#78350f] text-3xl mb-1">diamond</span>
            <span className="font-['Press_Start_2P'] text-[8px] text-[#64748B] uppercase font-bold">
              FRAGMENTS
            </span>
            <span className="font-['Epilogue'] font-black text-2xl text-[#2D3748] mt-1">
              {collectedShards} / {totalShards}
            </span>
          </div>

          {/* Steps */}
          <div className="bg-white p-4 rounded-xl border-2 border-[#CBD5E1] flex flex-col items-center shadow-xs">
            <span aria-hidden="true" className="material-symbols-outlined text-[#1e3a8a] text-3xl mb-1">footprint</span>
            <span className="font-['Press_Start_2P'] text-[8px] text-[#64748B] uppercase font-bold">
              STEPS (PAR {level.parSteps})
            </span>
            <span className="font-['Epilogue'] font-black text-2xl text-[#2D3748] mt-1">
              {steps < 10 ? `0${steps}` : steps}
            </span>
          </div>

          {/* Continuum Stability */}
          <div className="bg-white p-4 rounded-xl border-2 border-[#CBD5E1] flex flex-col items-center shadow-xs">
            <span aria-hidden="true" className="material-symbols-outlined text-[#1e4d2b] text-3xl mb-1">lock_reset</span>
            <span className="font-['Press_Start_2P'] text-[8px] text-[#64748B] uppercase font-bold">
              STABILITY
            </span>
            <span className="font-['Epilogue'] font-black text-2xl text-[#2D3748] mt-1">
              {paradoxStability}%
            </span>
          </div>
        </div>

        {/* Agamotto Log */}
        <div className="w-full bg-white p-4 rounded-xl border-2 border-[#CBD5E1] text-left my-4 shadow-inner">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BDECCB] border border-[#2D3748]" />
            <span className="font-['Press_Start_2P'] text-[8px] text-[#2D3748] uppercase font-bold">
              PROF. AGAMOTTO TRANSMISSION
            </span>
          </div>
          <p className="font-['VT323'] text-xl text-[#2D3748] leading-tight">
            {isCompleted
              ? `Level [${level.code}: ${level.name}] successfully sealed! All multiverse fragments gathered. Departure barriers have formed an impenetrable sling-ring enclosure, safeguarding the timeline.`
              : `Level [${level.code}: ${level.name}] has uncollected fragments or the Exit Portal has not been crossed. Complete the matrix puzzle to restore reality.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-lg mt-2">
          {hasNextLevel && isCompleted && (
            <button
              onClick={onNextLevel}
              className="flex-1 bg-[#BDECCB] hover:bg-[#a6e5b7] text-[#1e4d2b] py-3.5 px-4 rounded-xl font-['Press_Start_2P'] text-[9px] uppercase border-2 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">fast_forward</span>
              <span>NEXT LEVEL</span>
            </button>
          )}

          <button
            onClick={onReplayLevel}
            className="flex-1 bg-[#FFBE83] hover:bg-[#fca564] text-[#7c2d12] py-3.5 px-4 rounded-xl font-['Press_Start_2P'] text-[9px] uppercase border-2 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>
            <span>REPLAY LEVEL</span>
          </button>

          <button
            onClick={onReturnToArena}
            className="flex-1 bg-white hover:bg-slate-50 text-[#2D3748] py-3.5 px-4 rounded-xl font-['Press_Start_2P'] text-[9px] uppercase border-2 border-[#2D3748] shadow-[0_3px_0_0_#2D3748] active:translate-y-0.5 active:shadow-none font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">grid_view</span>
            <span>PUZZLE MAZE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
