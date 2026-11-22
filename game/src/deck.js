// Ember Sigil Duel — deck, draw pile and seeded shuffle.
// One file, one job: cards in, cards out, never a rule decision.

import { CARD_POOL } from './config.js';

/** mulberry32: a tiny deterministic PRNG so replays and screenshots repeat. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh 24-card deck, shuffled with the given rng. Cards are plain objects. */
export function buildDeck(rng) {
  const deck = CARD_POOL.map((card) => ({ ...card }));
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Draw up to `count` cards from `pile` into `hand` (hand caps at MAX_HAND). */
export function drawCards(pile, hand, count, maxHand) {
  const drawn = [];
  while (drawn.length < count && pile.length > 0 && hand.length < maxHand) {
    const card = pile.shift();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

/** Move the discard pile back into the draw pile and shuffle it. */
export function reshuffleDiscard(pile, discard, rng) {
  while (discard.length > 0) pile.push(discard.pop());
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [pile[i], pile[j]] = [pile[j], pile[i]];
  }
}
