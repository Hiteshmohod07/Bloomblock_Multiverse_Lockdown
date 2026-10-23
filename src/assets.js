// Replace a null with a URL relative to index.html. No engine changes needed.
export const sprites = { player: null, floor: null, wall: null, fragment: null, fragmentA: null, fragmentB: null,
  fragmentPurple: null, fragmentCyan: null,
  barrier: null, rift: null, portalLocked: null, portalActive: null };
// Appearance follows fragment array order; coordinates and rules stay in level data.
export const levelArt = {
  'level-2': [
    { label: 'A', sprite: 'fragmentA', className: 'fragment-a', colour: 'orange' },
    { label: 'B', sprite: 'fragmentB', className: 'fragment-b', colour: 'purple' },
  ],
  'level-3': [
    { label: 'A', sprite: 'fragmentPurple', className: 'fragment-purple', colour: 'purple' },
    { label: 'B', sprite: 'fragmentCyan', className: 'fragment-cyan', colour: 'cyan' },
  ],
  'level-4': [
    { label: 'A', sprite: 'fragmentPurple', className: 'fragment-purple', colour: 'purple' },
    { label: 'B', sprite: 'fragmentCyan', className: 'fragment-cyan', colour: 'cyan' },
  ],
  'level-5': [
    { label: 'A', sprite: 'fragmentPurple', className: 'fragment-purple', colour: 'purple' },
    { label: 'B', sprite: 'fragmentCyan', className: 'fragment-cyan', colour: 'cyan' },
  ],
};
export const sounds = { move: null, collection: null, rewind: null, victory: null };

export function playSound(name) {
  if (!sounds[name]) return;
  const audio = new Audio(sounds[name]);
  audio.volume = 0.35;
  audio.play().catch(() => {}); // Audio policy or a missing optional asset must not block a turn.
}
