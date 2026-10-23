import { GameEngine, DIRECTIONS, keyOf } from './engine.js';
import { sprites, levelArt, playSound } from './assets.js';

const $ = selector => document.querySelector(selector);
const board = $('#board');
let levels, game, levelIndex = 0;
let previewDirection = null;
const completed = new Set();
const pad = number => String(number).padStart(2, '0');
const keyDirections = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };

function sprite(name, glyph, className = name) {
  const element = document.createElement('span');
  element.className = `sprite ${className}`;
  element.setAttribute('aria-hidden', 'true');
  if (sprites[name]) element.style.backgroundImage = `url("${sprites[name]}")`;
  else element.textContent = glyph;
  return element;
}

function render(event = null) {
  const state = game.getState(), level = state.level;
  $('#level-name').textContent = level.name;
  $('#level-subtitle').textContent = level.subtitle;
  $('#level-number').textContent = `CHAMBER ${pad(levelIndex + 1)}${level.provisional ? ' · PROVISIONAL' : ''}`;
  $('#progress').textContent = `${pad(levelIndex + 1)} / ${pad(levels.length)}`;
  $('#hint').textContent = level.hint;
  $('#moves').textContent = pad(state.moves);
  $('#fragment-count').textContent = `${state.collected.length}/${level.fragments.length}`;
  const allCollected = state.collected.length === level.fragments.length;
  $('#portal-status').textContent = allCollected ? 'PORTAL ACTIVE' : 'PORTAL DORMANT';
  $('#undo').disabled = !state.canUndo;
  $('#next').hidden = state.status !== 'won' || levelIndex === levels.length - 1;
  $('#next').textContent = 'Next chamber →';
  if (state.status === 'won') completed.add(level.id);
  document.querySelectorAll('.level-button').forEach((button, index) => {
    button.classList.toggle('active', index === levelIndex);
    if (index === levelIndex) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    button.querySelector('.check').textContent = completed.has(levels[index].id) ? '✓' : '';
  });

  const candidates = Object.keys(DIRECTIONS).map(direction => ({ direction, ...game.previewMove(direction) }));
  const legal = candidates.filter(result => result.changed);
  const collecting = legal.filter(result => result.event.fragment);
  const selected = candidates.find(result => result.direction === previewDirection);
  const shown = selected?.changed ? [selected] : collecting;
  board.style.setProperty('--columns', level.columns);
  board.replaceChildren();
  board.classList.toggle('board-won', state.status === 'won');
  board.classList.toggle('two-realities', level.id === 'level-2');
  board.classList.toggle('fractured-sanctum', ['level-3', 'level-4', 'level-5'].includes(level.id));
  for (let row = 0; row < level.rows; row++) for (let column = 0; column < level.columns; column++) {
    const key = keyOf({ row, column }), tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.position = key;
    const labels = [];
    if (level.walls.some(wall => keyOf(wall) === key)) { tile.classList.add('wall'); labels.push('Wall'); if (sprites.wall) tile.append(sprite('wall', '')); }
    else { labels.push('Floor'); if (sprites.floor) tile.append(sprite('floor', '')); }
    if (keyOf(level.start) === key) tile.classList.add('start');
    if (keyOf(level.exit) === key) {
      tile.append(sprite(allCollected ? 'portalActive' : 'portalLocked', '◎', `portal${allCollected ? ' active' : ''}`));
      labels.push(allCollected ? 'Active portal' : 'Dormant portal, walkable');
    }
    const fragmentIndex = level.fragments.findIndex(fragment => keyOf(fragment) === key);
    if (fragmentIndex !== -1 && !state.collected.includes(key)) {
      const art = levelArt[level.id]?.[fragmentIndex];
      if (art) {
        const asset = sprites[art.sprite] ? art.sprite : 'fragment';
        tile.append(sprite(asset, art.label, `fragment ${art.className}${sprites[asset] ? '' : ' pixel-fragment'}`));
        labels.push(`Fragment ${art.label}, ${art.colour}`);
      } else { tile.append(sprite('fragment', '◆')); labels.push('Fragment'); }
    }
    if (state.barriers.includes(key)) { tile.classList.add('barrier'); tile.append(sprite('barrier', '×', 'barrier-mark')); labels.push('Energy barrier'); }
    if (state.rift && keyOf(state.rift) === key) { tile.classList.add('rift'); tile.append(sprite('rift', '✣', 'rift-mark')); labels.push('Surprise rift next to you; clears after your next successful step'); }
    if (keyOf(state.player) === key) { tile.append(sprite('player', '▲')); labels.push('You'); }
    if (legal.length && keyOf(state.player) === key) { tile.classList.add('preview-seal'); labels.push('Will seal after your next successful move'); }
    if (shown.some(result => keyOf(result.event.to) === key)) tile.classList.add('preview-target');
    if (event?.to && keyOf(event.to) === key) tile.classList.add('just-moved');
    if (event?.barrier && keyOf(event.barrier) === key) tile.classList.add('just-collected');
    tile.setAttribute('role', 'img');
    tile.setAttribute('aria-label', `Row ${row}, column ${column}: ${labels.join(', ')}`);
    board.append(tile);
  }
  document.querySelectorAll('[data-direction]').forEach(button => {
    const preview = candidates.find(result => result.direction === button.dataset.direction);
    button.classList.toggle('will-collect', Boolean(preview.event?.fragment));
    button.setAttribute('aria-description', preview.changed ? 'Move one square and seal your current square.' : 'This direction is blocked.');
  });
  let message = 'Every successful step seals the square you leave. Plan a path through every fragment.';
  if (shown.length) message = 'Your current square seals after every successful move. You cannot retrace your steps.';
  if (state.rift) message += ' A surprise rift has appeared beside you. Choose another direction.';
  else if (state.moves && state.status !== 'won') message += ' Stay alert: a rift can appear beside you without warning.';
  if (event?.fragment) message = 'Fragment collected. The square you left is now sealed.';
  if (event?.type === 'rewind') message = 'Timeline restored. Your last move has been undone.';
  if (allCollected) message = 'All fragments recovered. Reach the glowing portal.';
  if (!legal.length && state.status !== 'won') message = 'No moves remain in this timeline. Use Time Rewind, or restart for a new rift.';
  if (state.status === 'won') message = levelIndex === levels.length - 1 ? 'Sanctum restored! Final chamber complete. Time Rewind still works.' : 'Chamber restored! Step into the next timeline, or rewind your last move.';
  $('#message').textContent = message;
  $('#message').classList.toggle('success', state.status === 'won');
}

function emit(event) {
  window.dispatchEvent(new CustomEvent('bloomlock:effect', { detail: event }));
  if (event.type === 'rewind') playSound('rewind');
  else if (event.victory) playSound('victory');
  else if (event.fragment) playSound('collection');
  else playSound('move');
}
function move(direction) {
  const result = game.move(direction);
  if (result.changed) { emit(result.event); render(result.event); }
  else if (result.reason !== 'already-won') $('#message').textContent = 'That way is blocked. Try another direction, or use Time Rewind.';
}
function rewind() { const result = game.undo(); if (result.changed) { emit(result.event); render(result.event); } }
function load(index) { levelIndex = index; previewDirection = null; game.loadLevel(levels[index]); render(); }

async function boot() {
  const response = await fetch('./levels/levels.json');
  if (!response.ok) throw new Error('Could not load the level archive.');
  levels = await response.json();
  const parameters = new URLSearchParams(window.location.search);
  const requestedLevel = parameters.get('level');
  const requestedIndex = levels.findIndex(level => level.id === requestedLevel);
  if (requestedIndex >= 0) levelIndex = requestedIndex;
  const seed = Number(parameters.get('seed'));
  game = new GameEngine(levels[levelIndex], Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff ? { seed } : {});
  levels.forEach((level, index) => {
    const button = document.createElement('button');
    button.className = 'level-button';
    button.setAttribute('aria-label', `Chamber ${index + 1}: ${level.name}`);
    const number = document.createElement('span'); number.className = 'number'; number.textContent = pad(index + 1);
    const text = document.createElement('span'), title = document.createElement('strong'), subtitle = document.createElement('small');
    title.textContent = level.name; subtitle.textContent = `${level.provisional ? 'Provisional · ' : ''}${level.subtitle}`; text.append(title, subtitle);
    const check = document.createElement('span'); check.className = 'check'; check.setAttribute('aria-hidden', 'true');
    button.append(number, text, check); button.addEventListener('click', () => load(index)); $('#levels').append(button);
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!keyDirections[key] && key !== 'z' && key !== 'r') return;
    event.preventDefault();
    if (event.repeat) return; // One press is one turn, even if an animation is playing.
    previewDirection = null;
    if (keyDirections[key]) move(keyDirections[key]);
    else if (key === 'z') rewind();
    else { game.restart(); render(); }
  });
  document.querySelectorAll('[data-direction]').forEach(button => {
    const direction = button.dataset.direction;
    button.addEventListener('click', () => { previewDirection = direction; move(direction); });
    for (const type of ['pointerenter', 'focus']) button.addEventListener(type, () => { previewDirection = direction; render(); });
    for (const type of ['pointerleave', 'blur']) button.addEventListener(type, () => { previewDirection = null; render(); });
  });
  $('#undo').addEventListener('click', rewind);
  $('#restart').addEventListener('click', () => { game.restart(); render(); });
  $('#next').addEventListener('click', () => { load((levelIndex + 1) % levels.length); board.focus(); });
  render();
}
boot().catch(error => { $('#message').textContent = `Unable to start: ${error.message} Run npm start and open the local URL.`; console.error(error); });
