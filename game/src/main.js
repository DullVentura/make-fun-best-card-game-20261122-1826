// Ember Sigil Duel — bootstrap and the rival's turn, card by card.
// One file, one job: wire state + render + input + sound together.

import { AI_THINK_MS } from './config.js';
import {
  newGame, startDuel, playCard, endPlayerTurn, planAiMoves,
  beginNextRound, SCREEN_TABLE,
} from './state.js';
import { buildDom, render } from './render.js';
import { bindInput } from './input.js';
import { playSound, toggleMute, isMuted } from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0
  ? seedParam
  : (Math.floor(Math.random() * 2147483647) || 1);

let state = shotName ? stageShot(shotName) : newGame(seed);
let helpOpen = false;
let aiTimer = null;

const ui = {
  helpOpen: false,
  screen: () => state.screen,
  start() {
    if (state.screen !== 'title') return;
    startDuel(state);
    playSound('turn');
    draw();
  },
  restart() {
    clearTimeout(aiTimer);
    state = newGame((Math.floor(Math.random() * 2147483647) || 1));
    helpOpen = false;
    ui.helpOpen = false;
    draw();
  },
  toggleMute() {
    const muted = toggleMute();
    document.getElementById('btn-mute').textContent = muted ? '✕' : '♪';
    document.getElementById('btn-mute').classList.toggle('off', muted);
  },
  toggleHelp() {
    if (state.screen !== 'table') return;
    helpOpen = !helpOpen;
    ui.helpOpen = helpOpen;
    draw();
  },
  playCard(index) {
    if (state.screen !== SCREEN_TABLE || state.phase !== 'player') return;
    const before = state.screen;
    const result = playCard(state, 'player', index);
    if (!result.ok) {
      if (result.reason === 'not-enough-mana') playSound('denied');
      return;
    }
    playSound(result.card.kind === 'Strike' ? 'hit' : 'shield');
    if (state.screen === 'win') playSound('win');
    if (state.screen === 'loss') playSound('loss');
    draw();
    if (before === SCREEN_TABLE && state.screen === SCREEN_TABLE) return;
  },
  endTurn() {
    if (state.screen !== SCREEN_TABLE || state.phase !== 'player') return;
    if (!endPlayerTurn(state)) return;
    playSound('turn');
    draw();
    runAiTurn();
  },
};

/** Play the rival's planned cards one at a time, then open the next round. */
function runAiTurn() {
  const moves = planAiMoves(state);
  let step = 0;
  const tick = () => {
    if (state.screen !== SCREEN_TABLE) { draw(); return; }
    if (step < moves.length) {
      const id = moves[step];
      step += 1;
      const idx = state.rival.hand.findIndex((c) => c.id === id);
      if (idx >= 0) {
        const card = state.rival.hand[idx];
        playCard(state, 'rival', idx);
        playSound(card.kind === 'Strike' ? 'hit' : 'shield');
      }
      draw();
      if (state.screen === 'win' || state.screen === 'loss') {
        playSound(state.screen === 'win' ? 'win' : 'loss');
        return;
      }
      aiTimer = setTimeout(tick, AI_THINK_MS);
      return;
    }
    beginNextRound(state);
    playSound('turn');
    draw();
  };
  aiTimer = setTimeout(tick, AI_THINK_MS);
}

function draw() {
  ui.helpOpen = helpOpen;
  render(state, ui);
}

buildDom((action) => {
  if (action.type === 'start') ui.start();
  else if (action.type === 'restart') ui.restart();
  else if (action.type === 'mute') ui.toggleMute();
  else if (action.type === 'help') ui.toggleHelp();
  else if (action.type === 'close-help') ui.toggleHelp();
  else if (action.type === 'end-turn') ui.endTurn();
});
bindInput(ui);
if (shotName) document.body.classList.add('no-anim');
draw();

// Expose the live state for headless play-tests (no network, same origin only).
window.__duel = {
  state: () => state,
  ui,
  playCard: (i) => ui.playCard(i),
  endTurn: () => ui.endTurn(),
  start: () => ui.start(),
  restart: () => ui.restart(),
};
