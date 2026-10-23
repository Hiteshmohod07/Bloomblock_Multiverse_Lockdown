import React from 'react';
import { LevelConfig } from '../types/game';

interface TitleMenuProps {
  onStartGame: () => void;
  onOpenCodex: () => void;
  onSelectLevel: (lvl: LevelConfig) => void;
  levels: LevelConfig[];
  currentLevel: LevelConfig;
  sfxMuted: boolean;
  onToggleSfx: () => void;
  bgmActive: boolean;
  onToggleBgm: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  onStartGame,
  onOpenCodex,
  onSelectLevel,
  levels,
  currentLevel,
  sfxMuted,
  onToggleSfx,
  bgmActive,
  onToggleBgm,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 py-4">
      {/* Title Hero Screen Box */}
      <div className="w-full bg-[#BDE7F5] p-6 sm:p-10 rounded-2xl border-4 border-[#2D3748] shadow-[0_8px_0_0_#CDB8F5] relative overflow-hidden flex flex-col items-center text-center pixel-corners">
        {/* Floating Arcane Sling-Ring Rune */}
        <div
          className="absolute -top-12 -right-12 w-64 h-64 rounded-full border-4 border-dashed border-[#FFBE83] animate-spin opacity-40 pointer-events-none"
          style={{ animationDuration: '24s' }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border-2 border-dashed border-[#CDB8F5] animate-spin opacity-40 pointer-events-none"
          style={{ animationDuration: '32s' }}
        />

        {/* Engine Badge */}
        <div className="bg-[#CDB8F5] text-[#221043] px-3.5 py-1 rounded-full border-2 border-[#2D3748] font-['Press_Start_2P'] text-[8px] uppercase tracking-widest z-20 mb-4 font-bold shadow-sm">
          ★ NINTENDO RETRO ADVENTURE // 16-BIT CARTRIDGE ★
        </div>

        {/* Hero Title Typography */}
        <h1 className="font-['Epilogue'] font-black text-4xl sm:text-6xl text-[#2D3748] tracking-tight uppercase z-20 flex flex-col items-center">
          <span className="text-[#FFBE83] drop-shadow-[0_2px_0_#b45309]">BLOOMLOCK</span>
          <span className="text-xl sm:text-2xl text-[#2D3748] tracking-widest font-extrabold mt-1">
            MULTIVERSE LOCKDOWN
          </span>
        </h1>

        {/* Doctor Strange-inspired Pixel Sorcerer Hero Plaque */}
        <div className="my-6 z-20 relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-2xl bg-[#FFF8E7] border-3 border-[#2D3748] shadow-[0_0_24px_rgba(255,190,131,0.6)] flex items-center justify-center relative overflow-hidden group">
            <img src="/assets/player/south.png" alt="Sorcerer" className="w-20 h-20 object-contain" style={{imageRendering:"pixelated"}} />
          </div>
        </div>

        <p className="font-['VT323'] text-2xl text-[#2D3748] max-w-lg mb-6 z-20 leading-relaxed">
          The multiverse is fracturing into overworld tiles! As Sorcerer Supreme, explore the mazes, gather all golden reality fragments, and seal the departed tiles with Sling-Ring barriers to restore order.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 z-20 w-full max-w-md">
          <button
            onClick={onStartGame}
            className="w-full bg-[#BDECCB] hover:bg-[#a6e5b7] text-[#1e4d2b] py-3.5 px-6 rounded-xl font-['Press_Start_2P'] text-[11px] uppercase tracking-wider border-2 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">play_circle</span>
            <span>ENTER ARENA [START]</span>
          </button>

          <button
            onClick={onOpenCodex}
            className="w-full bg-[#FFF8E7] hover:bg-white text-[#2D3748] py-3.5 px-6 rounded-xl font-['Press_Start_2P'] text-[10px] uppercase tracking-wider border-2 border-[#2D3748] shadow-[0_4px_0_0_#2D3748] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">auto_stories</span>
            <span>REALITY CODEX</span>
          </button>
        </div>

        <span className="font-['Press_Start_2P'] text-[8px] text-[#2D3748]/70 mt-4 z-20 font-bold">
          PRESS [ENTER] OR [SPACE] TO COMMENCE
        </span>
      </div>

      {/* 5 Levels Selector Box */}
      <div className="w-full bg-[#FFF8E7] p-5 sm:p-6 rounded-xl border-3 border-[#2D3748] shadow-[0_4px_0_0_#CDB8F5] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3 border-[#CBD5E1]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BDECCB] border border-[#2D3748]" />
            <h2 className="font-['Epilogue'] font-extrabold text-lg text-[#2D3748] uppercase">
              SELECT MULTIVERSE LEVEL (1 - 5)
            </h2>
          </div>
          <span className="font-['Press_Start_2P'] text-[8px] text-[#64748B] font-bold">
            CURRENT: {currentLevel.code}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {levels.map((lvl) => {
            const isCurrent = lvl.id === currentLevel.id;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  onSelectLevel(lvl);
                  onStartGame();
                }}
                className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#BDECCB] border-[#2D3748] shadow-[0_3px_0_0_#2D3748]'
                    : 'bg-white hover:bg-slate-50 border-[#CBD5E1]'
                }`}
                type="button"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Press_Start_2P'] text-[8px] text-[#2D3748] font-bold">
                      {lvl.code}
                    </span>
                    <span className="text-[9px] bg-[#FFE08A] text-[#78350f] px-1.5 py-0.5 rounded border border-[#b45309] font-bold">
                      {lvl.totalShards} {lvl.totalShards === 1 ? 'SHARD' : 'SHARDS'}
                    </span>
                  </div>
                  <span className="font-['Epilogue'] font-bold text-sm text-[#2D3748] block">
                    {lvl.name}
                  </span>
                </div>
                <span className="font-['Hanken_Grotesk'] text-[11px] text-[#64748B] mt-2 block">
                  {lvl.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Audio Controls */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#CBD5E1] gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSfx}
              className={`px-3 py-1.5 rounded-lg border-2 border-[#2D3748] text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                !sfxMuted ? 'bg-[#FFE08A] text-[#78350f]' : 'bg-white text-slate-500'
              }`}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                {!sfxMuted ? 'volume_up' : 'volume_off'}
              </span>
              <span>SFX: {!sfxMuted ? 'ENABLED' : 'MUTED'}</span>
            </button>

            <button
              onClick={onToggleBgm}
              className={`px-3 py-1.5 rounded-lg border-2 border-[#2D3748] text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                bgmActive ? 'bg-[#CDB8F5] text-[#221043]' : 'bg-white text-slate-500'
              }`}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                {bgmActive ? 'music_note' : 'music_off'}
              </span>
              <span>MENU MUSIC: {bgmActive ? 'PLAYING' : 'OFF'}</span>
            </button>
          </div>

          <span className="font-['Press_Start_2P'] text-[7px] text-[#64748B] font-bold">
            CARTRIDGE BATTERY: OK [3.3V]
          </span>
        </div>
      </div>
    </div>
  );
};
