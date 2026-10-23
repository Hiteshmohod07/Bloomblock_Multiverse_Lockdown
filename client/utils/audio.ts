import tracks from '../audio-manifest.json';

type MusicMode = 'menu' | 'gameplay';
type Effect = 'step' | 'bump' | 'collection' | 'rewind' | 'victory' | 'gameOver' | 'rift';

class AudioManager {
  private context: AudioContext | null = null;
  private muted = false;
  private music: HTMLAudioElement | null = null;
  private notes: ReturnType<typeof setInterval> | null = null;
  private effects = new Map<string, HTMLAudioElement>();
  private musicGeneration = 0;

  private unlock() {
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    return this.context;
  }
  private tone(frequency: number, length = 0.1, volume = 0.04, delay = 0) {
    try {
      const context = this.unlock(), start = context.currentTime + delay;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + length);
    } catch { /* Optional audio must never interrupt a turn. */ }
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) for (const audio of this.effects.values()) audio.pause();
  }
  effect(name: Effect) {
    if (this.muted) return;
    const track = name in tracks ? tracks[name as keyof typeof tracks].url : null;
    if (track) {
      let audio = this.effects.get(name);
      if (!audio) {
        audio = new Audio(track); audio.dataset.audio = name; audio.preload = 'auto'; audio.hidden = true;
        audio.volume = 0.55; document.body.append(audio); this.effects.set(name, audio);
      }
      audio.currentTime = 0;
      void audio.play().catch(() => this.fallback(name));
    } else this.fallback(name);
  }
  private fallback(name: Effect) {
    if (this.muted) return;
    const melodies: Record<Effect, number[]> = {
      step: [180], bump: [90], collection: [523, 659, 784, 1047], rewind: [880, 659, 440, 220],
      victory: [523, 659, 784, 1047, 1319], gameOver: [330, 294, 220, 110], rift: [110, 220, 165],
    };
    melodies[name].forEach((frequency, index) => this.tone(frequency, 0.13, 0.035, index * 0.07));
  }
  async startMusic(mode: MusicMode): Promise<boolean> {
    this.stopMusic(); const generation = this.musicGeneration;
    const url = tracks[mode].url;
    if (url) {
      this.music ??= new Audio(); this.music.dataset.audio = 'music'; this.music.hidden = true;
      if (!this.music.isConnected) document.body.append(this.music);
      this.music.src = url; this.music.loop = true; this.music.volume = 0.18;
      try { await this.music.play(); return generation === this.musicGeneration; }
      catch { if (generation !== this.musicGeneration) return false; }
    }
    // Built-in chiptune remains usable while a saved HTML page awaits a real export.
    this.unlock(); let step = 0;
    const melody = mode === 'menu' ? [220, 330, 440, 330, 261.6, 392, 523, 392] : [164.8, 247, 330, 247, 196, 294, 392, 294];
    const play = () => this.tone(melody[step++ % melody.length], 0.36, 0.012);
    play(); this.notes = setInterval(play, 430); return true;
  }
  stopMusic() {
    this.musicGeneration++; this.music?.pause();
    if (this.notes) clearInterval(this.notes); this.notes = null;
  }
  dispose() {
    this.stopMusic(); for (const audio of this.effects.values()) { audio.pause(); audio.remove(); }
    this.effects.clear(); this.music?.remove(); void this.context?.close(); this.context = null;
  }
}
export const audio = new AudioManager();
