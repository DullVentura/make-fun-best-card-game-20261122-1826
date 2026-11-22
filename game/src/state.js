// Ember Sigil Duel — rules, turns and the rival AI.
// One file, one job: the state machine. It never touches the DOM.

import {
  START_LIFE, START_HAND, MAX_HAND, MAX_MANA,
  WARD_BREAK_BONUS, WARD_LOSS_PENALTY, RESONANCE_BONUS,
  beatsSigil, SIGILS,
} from './config.js';
import { buildDeck, drawCards, reshuffleDiscard, makeRng } from './deck.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_TABLE = 'table';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

function freshSide(rng, ward) {
  const deck = buildDeck(rng);
  const hand = [];
  drawCards(deck, hand, START_HAND, MAX_HAND);
  return {
    life: START_LIFE, shield: 0, mana: 0, maxMana: 0,
    hand, deck, discard: [], ward, playedThisTurn: [],
  };
}

/** A brand-new game. `seed` drives both decks so a seed replays the same game. */
export function newGame(seed) {
  const rng = makeRng(seed);
  const state = {
    seed, rng,
    screen: SCREEN_TITLE,
    phase: 'player',
    round: 1,
    player: freshSide(rng, 'ember'),
    rival: freshSide(rng, 'tide'),
    field: [],
    log: ['Welcome to Ember Sigil Duel. Press Enter or tap Start Duel.'],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, shieldsRaised: 0 },
    winner: null,
  };
  return state;
}

/** Begin the duel: leave the title screen and open round 1 for the player. */
export function startDuel(state) {
  state.screen = SCREEN_TABLE;
  state.round = 1;
  beginTurn(state, state.player, true);
  state.log.push('Round 1 — your turn. Play a card, then End Turn (Space).');
}

function manaForRound(round) {
  return Math.min(3 + round - 1, MAX_MANA);
}

function beginTurn(state, side, isPlayer) {
  side.maxMana = manaForRound(state.round);
  side.mana = side.maxMana;
  side.playedThisTurn = [];
  if (side.deck.length === 0 && side.discard.length > 0) {
    reshuffleDiscard(side.deck, side.discard, state.rng);
    state.log.push(`${isPlayer ? 'Your' : "Sable's"} discard pile is shuffled back into the deck.`);
  }
  const drawn = drawCards(side.deck, side.hand, 1, MAX_HAND);
  if (drawn.length > 0 && isPlayer) state.log.push(`You draw ${drawn[0].name}.`);
}

function sideOf(state, who) {
  return who === 'player' ? state.player : state.rival;
}

function otherOf(state, who) {
  return who === 'player' ? state.rival : state.player;
}

function nameOf(who) {
  return who === 'player' ? 'You' : 'Sable';
}

/** How much a Strike is worth against `defender` right now (before it is played). */
export function strikeValue(card, attacker, defender) {
  let value = card.power;
  const sameSigilPlayed = attacker.playedThisTurn.filter((c) => c.sigil === card.sigil).length;
  if (sameSigilPlayed >= 1) value += RESONANCE_BONUS;
  if (beatsSigil(card.sigil) === defender.ward) value += WARD_BREAK_BONUS;
  else if (beatsSigil(defender.ward) === card.sigil) value -= WARD_LOSS_PENALTY;
  return Math.max(1, value);
}

/** How much an Aegis is worth right now (resonance applies to shields too). */
export function aegisValue(card, attacker) {
  let value = card.power;
  const sameSigilPlayed = attacker.playedThisTurn.filter((c) => c.sigil === card.sigil).length;
  if (sameSigilPlayed >= 1) value += RESONANCE_BONUS;
  return value;
}

/**
 * Play the card at `handIndex` for `who`. Returns { ok, reason?, events }.
 * Events are plain strings for the log; the caller renders and plays sounds.
 */
export function playCard(state, who, handIndex) {
  if (state.screen !== SCREEN_TABLE) return { ok: false, reason: 'not-playing' };
  const turnPhase = who === 'player' ? 'player' : 'ai';
  if (state.phase !== turnPhase) return { ok: false, reason: 'not-your-turn' };
  const side = sideOf(state, who);
  const foe = otherOf(state, who);
  const card = side.hand[handIndex];
  if (!card) return { ok: false, reason: 'no-card' };
  if (card.cost > side.mana) return { ok: false, reason: 'not-enough-mana' };

  side.hand.splice(handIndex, 1);
  side.mana -= card.cost;
  side.playedThisTurn.push(card);
  side.discard.push(card);
  side.ward = card.sigil;
  state.stats.cardsPlayed += 1;

  const events = [];
  const sigil = SIGILS[card.sigil];
  if (card.kind === 'Strike') {
    const damage = strikeValue(card, side, foe);
    const broke = beatsSigil(card.sigil) === foe.ward;
    const dulled = !broke && beatsSigil(foe.ward) === card.sigil;
    const absorbed = Math.min(foe.shield, damage);
    foe.shield -= absorbed;
    foe.life -= (damage - absorbed);
    state.stats.damageDealt += who === 'player' ? damage - absorbed : 0;
    state.stats.damageTaken += who === 'rival' ? damage - absorbed : 0;
    events.push(
      `${nameOf(who)} played ${card.name} (${sigil.name} Strike ${card.power})` +
      (broke ? ' — Break! ward shattered' : dulled ? ' — dulled by the ward' : '') +
      ` for ${damage} damage${absorbed > 0 ? ` (${absorbed} absorbed by shield)` : ''}.`,
    );
    state.field.unshift({ card, by: who, text: `${damage} dmg${broke ? ' BREAK!' : ''}` });
  } else {
    const shield = aegisValue(card, side);
    side.shield += shield;
    state.stats.shieldsRaised += shield;
    events.push(`${nameOf(who)} raised ${card.name} (${sigil.name} Aegis) — +${shield} shield.`);
    state.field.unshift({ card, by: who, text: `+${shield} shield` });
  }
  state.field = state.field.slice(0, 4);
  for (const e of events) state.log.push(e);
  state.log = state.log.slice(-6);
  checkEnd(state);
  return { ok: true, events, card };
}

/** End the player's turn: open the rival's turn (mana refill + draw). */
export function endPlayerTurn(state) {
  if (state.screen !== SCREEN_TABLE || state.phase !== 'player') return false;
  state.phase = 'ai';
  beginAiTurn(state);
  return true;
}

/** The rival's plan: the card ids it will play, in order, this turn. */
export function planAiMoves(state) {
  const ai = state.rival;
  const plan = [];
  let mana = ai.mana;
  const played = [];
  const hand = [...ai.hand];
  for (;;) {
    let best = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < hand.length; i += 1) {
      const card = hand[i];
      if (!card || card.cost > mana) continue;
      let score;
      if (card.kind === 'Aegis') {
        score = ai.life <= 12 ? card.power + 3 : card.power - 4;
        if (played.some((c) => c.sigil === card.sigil)) score += 0.5;
      } else {
        const probe = { ...ai, playedThisTurn: [...ai.playedThisTurn, ...played] };
        score = strikeValue(card, probe, state.player);
        if (played.some((c) => c.sigil === card.sigil)) score += 0.5;
      }
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best < 0 || bestScore < 1) break;
    const card = hand[best];
    hand.splice(best, 1);
    mana -= card.cost;
    played.push(card);
    plan.push(card.id);
  }
  return plan;
}

/** After the rival finishes, open the next round for the player. */
export function beginNextRound(state) {
  state.round += 1;
  state.phase = 'player';
  beginTurn(state, state.player, true);
  state.log.push(`Round ${state.round} — your turn. ${state.player.maxMana} mana, draw a card, play on.`);
}

/** Open the rival's turn state (mana refill happens when its turn begins). */
export function beginAiTurn(state) {
  beginTurn(state, state.rival, false);
}

function checkEnd(state) {
  if (state.rival.life <= 0) {
    state.rival.life = 0;
    state.screen = SCREEN_WIN;
    state.phase = 'over';
    state.winner = 'player';
    state.log.push('Sable falls. Victory is yours!');
  } else if (state.player.life <= 0) {
    state.player.life = 0;
    state.screen = SCREEN_LOSS;
    state.phase = 'over';
    state.winner = 'rival';
    state.log.push('Your last ember gutters out. Sable wins this duel.');
  }
}

/** Cards the player can afford right now (for keyboard hints and the AI). */
export function affordableHand(state) {
  return state.player.hand.map((card) => card.cost <= state.player.mana);
}
