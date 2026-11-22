// Ember Sigil Duel — screenshot scenes behind ?shot=title|table|win|loss.
// One file, one job: stage a real game into a frame worth judging. Every scene
// plays the real rules forward (startDuel, playCard, the rival's real plan);
// the win/loss scenes only set the life totals first, the way a director
// sets a stage, then let the killing card land for real.

import {
  newGame, startDuel, playCard, endPlayerTurn, planAiMoves,
  beginNextRound, strikeValue, aegisValue,
} from './state.js';

const SHOT_SEED = 20261122;

function bestPlayerCard(state) {
  let best = -1;
  let bestScore = -Infinity;
  state.player.hand.forEach((card, i) => {
    if (card.cost > state.player.mana) return;
    const score = card.kind === 'Strike'
      ? strikeValue(card, state.player, state.rival)
      : aegisValue(card, state.player) - 2;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

/** Put a Strike in `who`'s hand (from deck, else discard) so a scene can end. */
function ensureStrikeInHand(state, who) {
  const side = who === 'player' ? state.player : state.rival;
  if (side.hand.some((c) => c.kind === 'Strike')) return;
  const fromDeck = side.deck.find((c) => c.kind === 'Strike');
  if (fromDeck) {
    side.deck.splice(side.deck.indexOf(fromDeck), 1);
    side.hand.push(fromDeck);
    return;
  }
  const fromDiscard = side.discard.find((c) => c.kind === 'Strike');
  if (fromDiscard) {
    side.discard.splice(side.discard.indexOf(fromDiscard), 1);
    side.hand.push(fromDiscard);
  }
}

/** Play `rounds` full rounds with a simple damage-first policy for both sides. */
function autoRounds(state, rounds) {
  for (let r = 0; r < rounds; r += 1) {
    if (state.screen !== 'table') break;
    let played = 0;
    while (played < 2 && state.phase === 'player' && state.screen === 'table') {
      const idx = bestPlayerCard(state);
      if (idx < 0) break;
      playCard(state, 'player', idx);
      played += 1;
    }
    if (state.screen !== 'table') break;
    if (!endPlayerTurn(state)) break;
    const moves = planAiMoves(state);
    for (const id of moves) {
      const idx = state.rival.hand.findIndex((c) => c.id === id);
      if (idx >= 0) playCard(state, 'rival', idx);
      if (state.screen !== 'table') break;
    }
    if (state.screen !== 'table') break;
    beginNextRound(state);
  }
}

/** Stage the named scene and return the state to render. */
export function stageShot(name) {
  const state = newGame(SHOT_SEED);
  if (name === 'title' || !name) return state;
  startDuel(state);
  if (name === 'table') {
    autoRounds(state, 3);
    return state;
  }
  if (name === 'win') {
    autoRounds(state, 3);
    state.rival.life = 1;
    state.rival.shield = 0;
    state.player.maxMana = 10;
    state.player.mana = 10;
    ensureStrikeInHand(state, 'player');
    const idx = state.player.hand.findIndex((c) => c.kind === 'Strike');
    if (idx >= 0) playCard(state, 'player', idx);
    return state;
  }
  if (name === 'loss') {
    autoRounds(state, 3);
    state.player.life = 1;
    state.player.shield = 0;
    state.rival.maxMana = 10;
    state.rival.mana = 10;
    state.phase = 'ai';
    ensureStrikeInHand(state, 'rival');
    const idx = state.rival.hand.findIndex((c) => c.kind === 'Strike');
    if (idx >= 0) playCard(state, 'rival', idx);
    return state;
  }
  return state;
}
