import React from 'react';
import { LevelConfig } from '../types/game';

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  levels: LevelConfig[];
  currentLevelId: string;
  onSelectLevel: (level: LevelConfig) => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  levels,
  currentLevelId,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Select level" data-dialog="level" className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#FFF8E7] rounded-2xl border-4 border-[#2D3748] shadow-[0_8px_0_0_#CDB8F5] p-5 sm:p-6 pixel-corners flex flex-col gap-4">
        <div className="flex items-center justify-between border-b-2 pb-3 border-[#CBD5E1]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FFBE83] border border-[#2D3748] animate-pulse" />
            <h2 className="font-['Epilogue'] font-black text-lg text-[#2D3748] uppercase">
              SELECT MULTIVERSE LEVEL (1 - 5)
            </h2>
          </div>
          <button
            aria-label="Close level selector" onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-[#2D3748] border-2 border-[#2D3748] flex items-center justify-center font-bold cursor-pointer"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {levels.map((lvl) => {
            const isSelected = lvl.id === currentLevelId;
            return (
              <button type="button"
                key={lvl.id}
                onClick={() => {
                  onSelectLevel(lvl);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#BDECCB] border-[#2D3748] shadow-[0_3px_0_0_#2D3748]'
                    : 'bg-white hover:bg-slate-50 border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-lg border-2 border-[#2D3748] flex items-center justify-center font-['Press_Start_2P'] text-[9px] font-bold ${
                      isSelected ? 'bg-[#FFE08A] text-[#78350f]' : 'bg-[#BDE7F5] text-[#1e3a8a]'
                    }`}
                  >
                    L{lvl.levelNumber}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-['Epilogue'] font-extrabold text-sm text-[#2D3748]">
                        {lvl.name}
                      </span>
                      <span className="bg-[#BDE7F5] text-[#1e3a8a] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#2D3748]">
                        {lvl.weather}
                      </span>
                    </div>
                    <span className="font-['Hanken_Grotesk'] text-xs text-[#64748B]">
                      {lvl.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-[#FFE08A] text-[#78350f] font-['Press_Start_2P'] text-[7px] px-2 py-1 rounded border border-[#b45309] font-bold">
                    {lvl.totalShards} {lvl.totalShards === 1 ? 'SHARD' : 'SHARDS'}
                  </span>
                  <span className="material-symbols-outlined text-[#2D3748]">chevron_right</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t-2 border-[#CBD5E1]">
          <span className="font-['Press_Start_2P'] text-[7px] text-[#64748B] font-bold">
            CARTRIDGE: GBA-POKE-03
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#2D3748] border-2 border-[#2D3748] font-['Press_Start_2P'] text-[8px] uppercase font-bold cursor-pointer"
            type="button"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};
