// Ember Sigil Duel — tuning and card pool.
// One file, one job: every number the rules use lives here so the rest of the
// game reads like the rules, not like a spreadsheet.

export const GAME_NAME = 'Ember Sigil Duel';
export const RIVAL_NAME = 'Sable the Tidecaller';
export const PLAYER_NAME = 'You';

export const START_LIFE = 30;
export const START_HAND = 4;
export const MAX_HAND = 7;
export const MAX_MANA = 10;
export const DECK_SIZE = 24;

// The four sigils, in wheel order: each beats the next one around the wheel.
// Told apart by colour AND shape, never by text alone.
export const SIGILS = {
  ember: { key: 'ember', name: 'Ember', glyph: '▲', color: '#e5484d', dark: '#7f1d1d', text: '#ffd7d7' },
  gale: { key: 'gale', name: 'Gale', glyph: '◆', color: '#46a758', dark: '#14532d', text: '#d3f8d3' },
  stone: { key: 'stone', name: 'Stone', glyph: '■', color: '#d19a2e', dark: '#713f12', text: '#ffefc2' },
  tide: { key: 'tide', name: 'Tide', glyph: '●', color: '#3e9bde', dark: '#172554', text: '#d3eafd' },
};
export const SIGIL_ORDER = ['ember', 'gale', 'stone', 'tide'];

/** The sigil this sigil beats on the wheel. */
export function beatsSigil(sigil) {
  const i = SIGIL_ORDER.indexOf(sigil);
  return SIGIL_ORDER[(i + 1) % SIGIL_ORDER.length];
}

/** Ward-break bonus when a Strike's sigil beats the defender's ward. */
export const WARD_BREAK_BONUS = 3;
/** Penalty when a Strike's sigil loses to the defender's ward. */
export const WARD_LOSS_PENALTY = 1;
/** Bonus per card when two or more cards of one sigil are played in a turn. */
export const RESONANCE_BONUS = 1;

// Card pool: 24 cards, six per sigil. power = damage (Strike) or shield (Aegis).
// cost = ember mana. id is stable so replays and screenshots stay deterministic.
export const CARD_POOL = [
  { id: 'e1', sigil: 'ember', kind: 'Strike', name: 'Cinder Jab', cost: 1, power: 2 },
  { id: 'e2', sigil: 'ember', kind: 'Strike', name: 'Flare Cut', cost: 2, power: 3 },
  { id: 'e3', sigil: 'ember', kind: 'Strike', name: 'Wildfire', cost: 4, power: 6 },
  { id: 'e4', sigil: 'ember', kind: 'Aegis', name: 'Ashen Guard', cost: 2, power: 3 },
  { id: 'e5', sigil: 'ember', kind: 'Strike', name: 'Ember Lash', cost: 3, power: 4 },
  { id: 'e6', sigil: 'ember', kind: 'Aegis', name: 'Coal Wall', cost: 3, power: 5 },
  { id: 'g1', sigil: 'gale', kind: 'Strike', name: 'Zephyr Dart', cost: 1, power: 2 },
  { id: 'g2', sigil: 'gale', kind: 'Strike', name: 'Gale Rush', cost: 2, power: 4 },
  { id: 'g3', sigil: 'gale', kind: 'Strike', name: 'Storm Call', cost: 4, power: 5 },
  { id: 'g4', sigil: 'gale', kind: 'Aegis', name: 'Wind Veil', cost: 2, power: 4 },
  { id: 'g5', sigil: 'gale', kind: 'Strike', name: 'Razor Wind', cost: 3, power: 4 },
  { id: 'g6', sigil: 'gale', kind: 'Aegis', name: 'Gale Shelter', cost: 1, power: 2 },
  { id: 's1', sigil: 'stone', kind: 'Strike', name: 'Pebble Shot', cost: 1, power: 3 },
  { id: 's2', sigil: 'stone', kind: 'Strike', name: 'Quake Fist', cost: 3, power: 4 },
  { id: 's3', sigil: 'stone', kind: 'Strike', name: 'Mountain Fall', cost: 5, power: 7 },
  { id: 's4', sigil: 'stone', kind: 'Aegis', name: 'Granite Skin', cost: 2, power: 2 },
  { id: 's5', sigil: 'stone', kind: 'Strike', name: 'Boulder Toss', cost: 4, power: 6 },
  { id: 's6', sigil: 'stone', kind: 'Aegis', name: 'Bedrock Aegis', cost: 4, power: 5 },
  { id: 't1', sigil: 'tide', kind: 'Strike', name: 'Ripple Cut', cost: 1, power: 3 },
  { id: 't2', sigil: 'tide', kind: 'Strike', name: 'Wave Crash', cost: 3, power: 4 },
  { id: 't3', sigil: 'tide', kind: 'Strike', name: 'Tidal Surge', cost: 5, power: 7 },
  { id: 't4', sigil: 'tide', kind: 'Aegis', name: 'Foam Guard', cost: 2, power: 3 },
  { id: 't5', sigil: 'tide', kind: 'Strike', name: 'Deep Current', cost: 2, power: 3 },
  { id: 't6', sigil: 'tide', kind: 'Aegis', name: 'Still Water', cost: 3, power: 3 },
];

export const AI_THINK_MS = 650;
