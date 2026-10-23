import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine, DIRECTIONS } from '../src/engine.js';
import { solveLevel } from '../src/solver.js';
import { LEVELS, RAW_LEVELS } from './adapter';
import { LevelConfig } from './types/game';
import { GbaArena } from './components/GbaArena';
import { TitleMenu } from './components/TitleMenu';
import { CodexScreen } from './components/CodexScreen';
import { SealStatusScreen } from './components/SealStatusScreen';
import { LevelSelectModal } from './components/LevelSelectModal';
import { audio } from './utils/audio';

type Direction = 'up' | 'down' | 'left' | 'right';
type Point = { row: number; col: number };
const RULE = 'Collect every fragment and reach the portal. Every step seals the tile you leave. Surprise rifts appear beside you at random moments.';
const KEY_DIRECTIONS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
const directionFor = (dr: number, dc: number): Direction | null => dr === -1 && dc === 0 ? 'up' : dr === 1 && dc === 0 ? 'down' : dr === 0 && dc === -1 ? 'left' : dr === 0 && dc === 1 ? 'right' : null;

export default function App() {
  const [engine] = useState(() => {
    const parameters = new URLSearchParams(location.search), index = RAW_LEVELS.findIndex(level => level.id === parameters.get('level'));
    const seed = Number(parameters.get('seed'));
    return new GameEngine(RAW_LEVELS[Math.max(0, index)], Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff ? { seed } : {});
  });
  const [state, setState] = useState(() => engine.getState());
  const [activeTab, setActiveTab] = useState<'arena' | 'title' | 'codex' | 'seal_status'>('arena');
  const [facing, setFacing] = useState<Direction>('down');
  const [lastSealedPos, setLastSealedPos] = useState<Point | null>(null);
  const [justCollectedShardId, setJustCollectedShardId] = useState<number | null>(null);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [bgmActive, setBgmActive] = useState(false);
  const bgmRef = useRef(false), musicTouched = useRef(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [intelMessage, setIntelMessage] = useState(RULE);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const hintGeneration = useRef(0);
  const index = Math.max(0, LEVELS.findIndex(level => level.id === state.level.id));
  const currentLevel = LEVELS[index], rawLevel = RAW_LEVELS[index];
  const playerPos = { row: state.player.row, col: state.player.column };
  const riftPos = state.rift ? { row: state.rift.row, col: state.rift.column } : null;
  const sealedTiles = useMemo(() => new Set<string>(state.barriers), [state.barriers]);
  const collectedShardIds = useMemo(() => new Set(rawLevel.fragments.flatMap((point, n) => state.collected.includes(`${point.row},${point.column}`) ? [n + 1] : [])), [state.collected, rawLevel]);
  const steps = state.moves, isCompleted = state.status === 'won';
  const legal = useMemo(() => Object.keys(DIRECTIONS).filter(direction => engine.previewMove(direction).changed), [engine, state]);
  const isTrapped = !isCompleted && legal.length === 0;
  const paradoxStability = isTrapped ? 0 : Math.max(70, 100 - Math.max(0, steps - currentLevel.parSteps) * 2);
  const hasNextLevel = index < LEVELS.length - 1;

  const startMusic = useCallback((mode: 'menu' | 'gameplay') => {
    void audio.startMusic(mode).catch(() => { bgmRef.current = false; setBgmActive(false); });
  }, []);
  useEffect(() => {
    if (bgmRef.current) startMusic(activeTab === 'title' ? 'menu' : 'gameplay');
  }, [activeTab, startMusic]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { audio.stopMusic(); bgmRef.current = false; setBgmActive(false); } };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); audio.dispose(); };
  }, []);
  const handleToggleBgm = useCallback(() => {
    musicTouched.current = true; bgmRef.current = !bgmRef.current; setBgmActive(bgmRef.current);
    if (bgmRef.current) startMusic(activeTab === 'title' ? 'menu' : 'gameplay'); else audio.stopMusic();
  }, [activeTab, startMusic]);
  const handleToggleSfx = useCallback(() => { const next = !sfxMuted; audio.setMuted(next); setSfxMuted(next); }, [sfxMuted]);

  const handleMove = useCallback((dr: number, dc: number) => {
    if (activeTab !== 'arena' || isLevelModalOpen || thinking) return;
    const direction = directionFor(dr, dc); if (!direction) return;
    const result = engine.move(direction);
    const event = result.event;
    if (!result.changed || !event) {
      if (result.reason !== 'already-won') { audio.effect('bump'); setIntelMessage(result.reason === 'rift' ? 'SURPRISE RIFT: that adjacent tile is temporarily blocked. Find another step or use Time Rewind.' : 'BLOCKED: walls and sealed trail tiles cannot be crossed. Find another route or use Time Rewind.'); }
      return;
    }
    if (!musicTouched.current) { musicTouched.current = true; bgmRef.current = true; setBgmActive(true); startMusic('gameplay'); }
    setState(result.state); setFacing(direction);
    setLastSealedPos({ row: event.from.row, col: event.from.column });
    const fragment = rawLevel.fragments.findIndex(p => p.row === event.to.row && p.column === event.to.column);
    setJustCollectedShardId(event.fragment ? fragment + 1 : null);
    window.dispatchEvent(new CustomEvent('bloomlock:effect', { detail: event }));
    const trapped = result.state.status !== 'won' && !Object.keys(DIRECTIONS).some(d => engine.previewMove(d).changed);
    if (trapped) { audio.effect('gameOver'); setIntelMessage('TIMELINE COLLAPSED. No legal steps remain. Time Rewind restores your last move, or Restart creates a fresh timeline.'); }
    else if (event.victory) { audio.effect('victory'); setIntelMessage('REALITY RESTORED! Every fragment is secured. Time Rewind still works.'); }
    else {
      audio.effect(event.fragment ? 'collection' : 'step');
      if (result.state.rift) { audio.effect('rift'); setIntelMessage('A SURPRISE RIFT has appeared beside you! It blocks one turn. Your previous tile is permanently sealed.'); }
      else setIntelMessage(event.fragment ? 'FRAGMENT SECURED. The tile you left is sealed. Collect the rest, then reach the portal.' : RULE);
    }
  }, [activeTab, isLevelModalOpen, thinking, engine, rawLevel, startMusic]);
  const handleTileClick = useCallback((row: number, col: number) => {
    const player = engine.getState().player;
    if (Math.abs(row - player.row) + Math.abs(col - player.column) !== 1) { setIntelMessage('Choose a tile directly beside the player, or use the direction buttons.'); return; }
    handleMove(row - player.row, col - player.column);
  }, [engine, handleMove]);
  const handleRewind = useCallback(() => {
    const result = engine.undo(); if (!result.changed) return;
    hintGeneration.current++; setThinking(false); setState(result.state); setLastSealedPos(null); setJustCollectedShardId(null);
    audio.effect('rewind'); setIntelMessage('TIME REWIND: your last position, fragment, seal and exact surprise timing have been restored.');
    window.dispatchEvent(new CustomEvent('bloomlock:effect', { detail: result.event }));
  }, [engine]);
  const handleResetLevel = useCallback((level?: LevelConfig) => {
    hintGeneration.current++; setThinking(false);
    if (level && level.id !== engine.getState().level.id) engine.loadLevel(RAW_LEVELS.find(raw => raw.id === level.id)!); else engine.restart();
    setState(engine.getState()); setFacing('down'); setLastSealedPos(null); setJustCollectedShardId(null); setHintsRemaining(3);
    setIntelMessage('FRESH TIMELINE. Every step leaves a seal. The next surprise stays hidden until it appears beside you.');
  }, [engine]);
  const handleSelectLevel = useCallback((level: LevelConfig) => { handleResetLevel(level); setIsLevelModalOpen(false); setActiveTab('arena'); }, [handleResetLevel]);
  const handleNextLevel = useCallback(() => {
    const nextIndex = LEVELS.findIndex(level => level.id === engine.getState().level.id) + 1;
    if (engine.getState().status === 'won' && nextIndex < LEVELS.length) handleSelectLevel(LEVELS[nextIndex]);
  }, [engine, handleSelectLevel]);
  const handleActionA = useCallback(() => {
    const snapshot = engine.getState(); setIntelMessage(`SCAN: ${snapshot.collected.length}/${snapshot.level.fragments.length} fragments recovered. Every step seals its departure tile. The portal opens when all fragments are secured.`);
  }, [engine]);
  const handleHint = useCallback(() => {
    if (thinking || hintsRemaining <= 0 || engine.getState().status === 'won') return;
    const generation = ++hintGeneration.current; setThinking(true); setIntelMessage('Consulting the Eye of Agamotto...');
    setTimeout(() => {
      const snapshot = engine.getState(), level = RAW_LEVELS.find(raw => raw.id === snapshot.level.id)!;
      const result = solveLevel(level, { fromState: snapshot, maxStates: 20000 });
      if (generation !== hintGeneration.current) return;
      setThinking(false);
      const nextStep = result.solution?.[0];
      if (result.status === 'solved' && nextStep) { setHintsRemaining(n => n - 1); setIntelMessage(`AGAMOTTO'S HINT: your next safe step is ${nextStep.toUpperCase()}. The surprise's future location remains hidden.`); }
      else setIntelMessage(result.status === 'unsolvable' ? 'This trail cannot reach every objective. Time Rewind can restore a better route.' : 'The future remains unclear. Try another route or use Time Rewind.');
    }, 0);
  }, [engine, hintsRemaining, thinking]);

  useEffect(() => {
    const dialog = document.querySelector<HTMLElement>('[data-dialog="level"]') ?? document.querySelector<HTMLElement>('[data-dialog="victory"]');
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.querySelector<HTMLElement>('button')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [isLevelModalOpen, state.status, activeTab]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
      const dialog = document.querySelector<HTMLElement>('[data-dialog="level"]') ?? document.querySelector<HTMLElement>('[data-dialog="victory"]');
      if (event.key === 'Tab' && dialog) {
        const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')];
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (event.key === 'Escape') { setIsLevelModalOpen(false); setActiveTab('arena'); return; }
      if (isLevelModalOpen) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (activeTab !== 'arena') { if (key === 'Enter' && !(event.target as HTMLElement).closest('button')) setActiveTab('arena'); return; }
      const direction = KEY_DIRECTIONS[key];
      if (direction || ['z', 'b', ' ', 'r'].includes(key)) {
        event.preventDefault(); if (event.repeat) return;
        if (direction) { const [dr, dc] = DIRECTIONS[direction]; handleMove(dr, dc); }
        else if (key === 'r') handleResetLevel(); else handleRewind();
      } else if (key === 'Enter' && !(event.target as HTMLElement).closest('button')) {
        event.preventDefault(); if (!event.repeat) { if (engine.getState().status === 'won') handleNextLevel(); else handleActionA(); }
      }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  }, [activeTab, isLevelModalOpen, handleMove, handleRewind, handleResetLevel, handleNextLevel, handleActionA, engine]);

  // The supplied archive's presentation is appended below by the integration step.

  return (
    <div className="bg-[#FFF8E7] font-['Hanken_Grotesk'] text-[#2D3748] min-h-screen flex flex-col selection:bg-[#CDB8F5] selection:text-[#221043]">
      {/* RETRO TOP NAVIGATION HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#FFF8E7]/95 backdrop-blur-md border-b-3 border-[#2D3748] shadow-[0_2px_8px_rgba(45,55,72,0.06)]">
        <div className="h-18 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo Lockup */}
          <button type="button" aria-label="Open title menu"
            onClick={() => setActiveTab('title')}
            className="flex items-center gap-2.5 cursor-pointer select-none text-left min-w-0"
          >
            <div className="hidden sm:block bg-[#CDB8F5] px-2.5 py-1 rounded-lg border-2 border-[#2D3748] shadow-xs">
              <span className="font-['Epilogue'] text-[10px] text-[#221043] font-black uppercase tracking-wider">
                MULTIVERSE ENGINE
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Epilogue'] font-black text-lg text-[#2D3748] uppercase tracking-tight leading-none">
                BLOOMLOCK
              </span>
              <span className="font-['Epilogue'] text-[9px] text-[#78350f] uppercase font-bold tracking-wider mt-0.5">
                MULTIVERSE LOCKDOWN
              </span>
            </div>
          </button>

          {/* Central Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#BDE7F5] p-1 rounded-xl border-2 border-[#2D3748]">
            <button
              onClick={() => setActiveTab('arena')}
              className={`px-3.5 py-1.5 uppercase transition-colors rounded-lg font-['Epilogue'] text-[11px] font-bold cursor-pointer ${
                activeTab === 'arena'
                  ? 'bg-[#CDB8F5] text-[#221043] border border-[#2D3748] shadow-[0_2px_0_0_#2D3748]'
                  : 'text-[#2D3748] hover:bg-white/60'
              }`}
              type="button"
            >
              ARENA
            </button>
            <button
              onClick={() => setActiveTab('title')}
              className={`px-3.5 py-1.5 uppercase transition-colors rounded-lg font-['Epilogue'] text-[11px] font-bold cursor-pointer ${
                activeTab === 'title'
                  ? 'bg-[#CDB8F5] text-[#221043] border border-[#2D3748] shadow-[0_2px_0_0_#2D3748]'
                  : 'text-[#2D3748] hover:bg-white/60'
              }`}
              type="button"
            >
              TITLE MENU
            </button>
            <button
              onClick={() => setActiveTab('codex')}
              className={`px-3.5 py-1.5 uppercase transition-colors rounded-lg font-['Epilogue'] text-[11px] font-bold cursor-pointer ${
                activeTab === 'codex'
                  ? 'bg-[#CDB8F5] text-[#221043] border border-[#2D3748] shadow-[0_2px_0_0_#2D3748]'
                  : 'text-[#2D3748] hover:bg-white/60'
              }`}
              type="button"
            >
              CODEX
            </button>
            <button
              onClick={() => setActiveTab('seal_status')}
              className={`px-3.5 py-1.5 uppercase transition-colors rounded-lg font-['Epilogue'] text-[11px] font-bold cursor-pointer ${
                activeTab === 'seal_status'
                  ? 'bg-[#CDB8F5] text-[#221043] border border-[#2D3748] shadow-[0_2px_0_0_#2D3748]'
                  : 'text-[#2D3748] hover:bg-white/60'
              }`}
              type="button"
            >
              SEAL STATUS
            </button>
          </nav>

          {/* System Indicators & Sound Toggle */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#FFF8E7] px-2.5 py-1 rounded-lg font-['Epilogue'] text-[10px] text-[#2D3748] border-2 border-[#2D3748]">
              <span className="text-[#3c6470] font-bold">SYS 3.3V</span>
              <span className="text-[#845322] font-bold">[||||]</span>
            </div>

            <button
              onClick={handleToggleSfx}
              className="flex items-center gap-1 bg-[#FFBE83] hover:bg-[#fca564] text-[#7c2d12] px-2.5 py-1 rounded-lg font-['Epilogue'] text-[10px] uppercase cursor-pointer border-2 border-[#2D3748] font-bold shadow-xs transition-transform active:translate-y-0.5"
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                {!sfxMuted ? 'volume_up' : 'volume_off'}
              </span>
              <span>SFX: {!sfxMuted ? 'ON' : 'OFF'}</span>
            </button>

            <div className="header-avatar w-8 h-8 rounded-full bg-[#CDB8F5] border-2 border-[#2D3748] flex items-center justify-center text-[#221043] shadow-xs">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around bg-[#BDE7F5] px-2 py-1 border-t-2 border-[#2D3748]">
          <button
            onClick={() => setActiveTab('arena')}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
              activeTab === 'arena' ? 'bg-[#CDB8F5] text-[#221043] font-black' : 'text-[#2D3748]'
            }`}
            type="button"
          >
            ARENA
          </button>
          <button
            onClick={() => setActiveTab('title')}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
              activeTab === 'title' ? 'bg-[#CDB8F5] text-[#221043] font-black' : 'text-[#2D3748]'
            }`}
            type="button"
          >
            TITLE
          </button>
          <button
            onClick={() => setActiveTab('codex')}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
              activeTab === 'codex' ? 'bg-[#CDB8F5] text-[#221043] font-black' : 'text-[#2D3748]'
            }`}
            type="button"
          >
            CODEX
          </button>
          <button
            onClick={() => setActiveTab('seal_status')}
            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
              activeTab === 'seal_status' ? 'bg-[#CDB8F5] text-[#221043] font-black' : 'text-[#2D3748]'
            }`}
            type="button"
          >
            STATUS
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="w-full pt-26 md:pt-22 pb-10 flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {activeTab === 'arena' && (
            <GbaArena
              level={currentLevel}
              playerPos={playerPos}
              riftPos={riftPos}
              facing={facing}
              sealedTiles={sealedTiles}
              collectedShardIds={collectedShardIds}
              steps={steps}
              history={[]}
              paradoxStability={paradoxStability}
              intelMessage={intelMessage}
              onMove={handleMove}
              onTileClick={handleTileClick}
              onRewind={handleRewind}
              onReset={() => handleResetLevel(currentLevel)}
              onHint={handleHint}
              onActionA={handleActionA}
              hintsRemaining={hintsRemaining}
              isTrapped={isTrapped}
              isCompleted={isCompleted}
              bgmActive={bgmActive}
              onToggleBgm={handleToggleBgm}
              onSelectLevelModal={() => setIsLevelModalOpen(true)}
              onNextLevel={handleNextLevel}
              hasNextLevel={hasNextLevel}
              lastSealedPos={lastSealedPos}
              justCollectedShardId={justCollectedShardId}
            />
          )}

          {activeTab === 'title' && (
            <TitleMenu
              onStartGame={() => setActiveTab('arena')}
              onOpenCodex={() => setActiveTab('codex')}
              onSelectLevel={handleSelectLevel}
              levels={LEVELS}
              currentLevel={currentLevel}
              sfxMuted={sfxMuted}
              onToggleSfx={handleToggleSfx}
              bgmActive={bgmActive}
              onToggleBgm={handleToggleBgm}
            />
          )}

          {activeTab === 'codex' && (
            <CodexScreen onBackToArena={() => setActiveTab('arena')} />
          )}

          {activeTab === 'seal_status' && (
            <SealStatusScreen
              level={currentLevel}
              isCompleted={isCompleted}
              steps={steps}
              totalShards={currentLevel.totalShards}
              collectedShards={collectedShardIds.size}
              paradoxStability={paradoxStability}
              onReplayLevel={() => {
                handleResetLevel(currentLevel);
                setActiveTab('arena');
              }}
              onNextLevel={handleNextLevel}
              hasNextLevel={hasNextLevel}
              onReturnToArena={() => setActiveTab('arena')}
            />
          )}
        </div>
      </main>

      {activeTab === 'arena' && !isCompleted && !isLevelModalOpen && (
        <div className="mobile-play-dock" role="group" aria-label="Touch gameplay controls">
          <button type="button" aria-label="Move Left" onClick={() => handleMove(0, -1)}>&larr;</button>
          <div className="dock-vertical"><button type="button" aria-label="Move Up" onClick={() => handleMove(-1, 0)}>&uarr;</button><button type="button" aria-label="Move Down" onClick={() => handleMove(1, 0)}>&darr;</button></div>
          <button type="button" aria-label="Move Right" onClick={() => handleMove(0, 1)}>&rarr;</button>
          <button type="button" className="dock-rewind" onClick={handleRewind} disabled={!state.canUndo}>Time<br />Rewind</button>
          <button type="button" className="dock-restart" onClick={() => handleResetLevel()}>Restart</button>
        </div>
      )}
      {/* FOOTER */}
      <footer className="w-full bg-[#FFF8E7] py-5 border-t-3 border-[#2D3748]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex flex-col gap-0.5">
            <span className="font-['Epilogue'] font-black text-xs sm:text-sm text-[#2D3748] uppercase">
              BLOOMLOCK // HANDHELD ARCHIVE DECK MODEL BL-89
            </span>
            <span className="font-['Hanken_Grotesk'] text-xs text-[#64748B]">
              PIXATHON 2026. RESTORE THE FRACTURED SANCTUM.</span>
          </div>
          <div className="flex items-center gap-2 font-['Epilogue'] text-[10px] uppercase text-[#2D3748]">
            <span className="bg-[#BDE7F5] px-2.5 py-1 rounded border-2 border-[#2D3748] font-bold">
              CARTRIDGE: GBA-POKE-03
            </span>
            <span className="bg-[#CDB8F5] px-2.5 py-1 rounded border-2 border-[#2D3748] font-bold text-[#221043]">
              REGION: EMERALD-SECTOR
            </span>
          </div>
        </div>
      </footer>

      {/* LEVEL SELECT MODAL */}
      <LevelSelectModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        levels={LEVELS}
        currentLevelId={currentLevel.id}
        onSelectLevel={handleSelectLevel}
      />
    </div>
  );
}
