// Ember Sigil Duel — every pixel on the table.
// One file, one job: turn state into DOM. It never changes the rules.

import { SIGILS, GAME_NAME, RIVAL_NAME, PLAYER_NAME, START_LIFE } from './config.js';
import { strikeValue, aegisValue, affordableHand } from './state.js';

let root = null;
let els = {};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Build the static table skeleton once. Returns the hooks input.js needs. */
export function buildDom(onAction) {
  root = document.getElementById('app');
  root.innerHTML = '';

  const topbar = el('div', 'topbar');
  const title = el('div', 'topbar-title', GAME_NAME);
  const round = el('div', 'topbar-round');
  round.id = 'round-label';
  const topBtns = el('div', 'topbar-btns');
  const muteBtn = el('button', 'icon-btn', '♪');
  muteBtn.id = 'btn-mute';
  muteBtn.title = 'Mute (M)';
  const helpBtn = el('button', 'icon-btn', '?');
  helpBtn.id = 'btn-help';
  helpBtn.title = 'How to play (H)';
  const restartBtn = el('button', 'icon-btn', '↻');
  restartBtn.id = 'btn-restart';
  restartBtn.title = 'Restart (R)';
  topBtns.append(muteBtn, helpBtn, restartBtn);
  topbar.append(title, round, topBtns);

  const table = el('div', 'table');

  // --- Rival row ---
  const rivalRow = el('div', 'row rival-row');
  const rivalPanel = el('div', 'side-panel rival-panel');
  rivalPanel.append(
    el('div', 'avatar rival-avatar', '●'),
    el('div', 'side-name', RIVAL_NAME),
  );
  const rivalWard = el('div', 'ward');
  rivalWard.id = 'rival-ward';
  const rivalLife = el('div', 'life');
  rivalLife.id = 'rival-life';
  const rivalMana = el('div', 'mana');
  rivalMana.id = 'rival-mana';
  rivalPanel.append(rivalWard, rivalLife, rivalMana);
  const rivalHand = el('div', 'rival-hand');
  rivalHand.id = 'rival-hand';
  const rivalDeck = el('div', 'deck-info');
  rivalDeck.id = 'rival-deck';
  rivalRow.append(rivalPanel, rivalHand, rivalDeck);

  // --- Middle: field + log + end turn ---
  const midRow = el('div', 'row mid-row');
  const field = el('div', 'field');
  field.id = 'field';
  const midCenter = el('div', 'mid-center');
  const log = el('div', 'log');
  log.id = 'log';
  const endBtn = el('button', 'end-btn', 'END TURN  ⏎');
  endBtn.id = 'btn-end-turn';
  midCenter.append(log, endBtn);
  const helpCard = el('div', 'help-card');
  helpCard.innerHTML =
    '<b>How to win:</b> reduce Sable to 0 life.<br>' +
    '<b>Break:</b> a Strike whose sigil beats the foe’s ward deals +3.<br>' +
    '<b>Resonance:</b> 2nd card of one sigil in a turn gets +1.<br>' +
    '<b>Wheel:</b> <span class="sw ember">▲ Ember</span> beats <span class="sw gale">◆ Gale</span> beats ' +
    '<span class="sw stone">■ Stone</span> beats <span class="sw tide">● Tide</span> beats ▲ Ember.<br>' +
    '<b>Keys:</b> 1–7 play a card · Space ends turn · R restarts';
  midRow.append(field, midCenter, helpCard);

  // --- Player row ---
  const playerRow = el('div', 'row player-row');
  const playerPanel = el('div', 'side-panel player-panel');
  playerPanel.append(
    el('div', 'avatar player-avatar', '▲'),
    el('div', 'side-name', PLAYER_NAME),
  );
  const playerWard = el('div', 'ward');
  playerWard.id = 'player-ward';
  const playerLife = el('div', 'life');
  playerLife.id = 'player-life';
  const playerMana = el('div', 'mana');
  playerMana.id = 'player-mana';
  playerPanel.append(playerWard, playerLife, playerMana);
  const playerHand = el('div', 'player-hand');
  playerHand.id = 'player-hand';
  const playerDeck = el('div', 'deck-info');
  playerDeck.id = 'player-deck';
  playerRow.append(playerPanel, playerHand, playerDeck);

  table.append(rivalRow, midRow, playerRow);

  // --- Overlays: title / win / loss / help ---
  const overlay = el('div', 'overlay');
  overlay.id = 'overlay';
  const overlayCard = el('div', 'overlay-card');
  overlayCard.id = 'overlay-card';
  overlay.append(overlayCard);

  root.append(topbar, table, overlay);

  els = { round, rivalWard, rivalLife, rivalMana, rivalHand, rivalDeck, field, log, endBtn,
    playerWard, playerLife, playerMana, playerHand, playerDeck, overlay, overlayCard };

  muteBtn.addEventListener('click', () => onAction({ type: 'mute' }));
  helpBtn.addEventListener('click', () => onAction({ type: 'help' }));
  restartBtn.addEventListener('click', () => onAction({ type: 'restart' }));
  endBtn.addEventListener('click', () => onAction({ type: 'end-turn' }));
  overlay.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) onAction({ type: btn.dataset.action });
  });

  return els;
}

function wardBadge(side) {
  const sigil = SIGILS[side.ward];
  return `<span class="ward-glyph" style="color:${sigil.color}">${sigil.glyph}</span>` +
    `<span class="ward-name">WARD ${sigil.name}</span>`;
}

function lifeHtml(side) {
  const pct = Math.max(0, Math.round((side.life / START_LIFE) * 100));
  const shield = side.shield > 0 ? `<span class="shield-pill">SHIELD +${side.shield}</span>` : '';
  return `<div class="life-bar"><div class="life-fill" style="width:${pct}%"></div>` +
    `<span class="life-text">♥ ${side.life} / ${START_LIFE}</span></div>${shield}`;
}

function manaHtml(side) {
  let dots = '';
  for (let i = 0; i < side.maxMana; i += 1) {
    dots += `<span class="mana-dot${i < side.mana ? ' on' : ''}">●</span>`;
  }
  return `<span class="mana-label">MANA</span>${dots}<span class="mana-num">${side.mana}/${side.maxMana}</span>`;
}

function cardNode(card, opts = {}) {
  const node = el('div', `card${opts.small ? ' card-small' : ''}${opts.back ? ' card-back' : ''}`);
  if (opts.back) {
    node.innerHTML = '<div class="card-back-glyph">▲◆■●</div><div class="card-back-name">SIGIL</div>';
    return node;
  }
  const sigil = SIGILS[card.sigil];
  const value = opts.value !== undefined ? opts.value : card.power;
  node.innerHTML =
    `<div class="card-cost">${card.cost}</div>` +
    (opts.keyHint ? `<div class="card-key">${opts.keyHint}</div>` : '') +
    `<div class="card-sigil" style="color:${sigil.color}">${sigil.glyph}</div>` +
    `<div class="card-power">${value}</div>` +
    `<div class="card-kind">${card.kind === 'Strike' ? 'STRIKE' : 'AEGIS'}</div>` +
    `<div class="card-name">${card.name}</div>` +
    `<div class="card-sigil-name">${sigil.name}</div>` +
    (opts.note ? `<div class="card-note">${opts.note}</div>` : '');
  if (opts.unaffordable) node.classList.add('unaffordable');
  if (opts.index !== undefined) node.dataset.index = String(opts.index);
  return node;
}

/** Full re-render from state. Cheap, total, and always consistent. */
export function render(state, ui) {
  els.round.textContent = state.screen === 'title'
    ? 'A duel of sigils — first to 0 life loses'
    : `ROUND ${state.round} · ${state.phase === 'player' ? 'YOUR TURN' : state.phase === 'ai' ? "SABLE'S TURN" : 'DUEL OVER'}`;

  els.rivalWard.innerHTML = wardBadge(state.rival);
  els.rivalLife.innerHTML = lifeHtml(state.rival);
  els.rivalMana.innerHTML = manaHtml(state.rival);
  els.playerWard.innerHTML = wardBadge(state.player);
  els.playerLife.innerHTML = lifeHtml(state.player);
  els.playerMana.innerHTML = manaHtml(state.player);

  els.rivalHand.innerHTML = '';
  for (let i = 0; i < state.rival.hand.length; i += 1) {
    els.rivalHand.append(cardNode(null, { back: true, small: true }));
  }
  els.rivalDeck.innerHTML = `Deck ${state.rival.deck.length} · Discard ${state.rival.discard.length}`;
  els.playerDeck.innerHTML = `Deck ${state.player.deck.length} · Discard ${state.player.discard.length}`;

  // Player hand, with live values: strike damage preview, aegis shield preview.
  const affordable = affordableHand(state);
  els.playerHand.innerHTML = '';
  state.player.hand.forEach((card, i) => {
    const value = card.kind === 'Strike'
      ? strikeValue(card, state.player, state.rival)
      : aegisValue(card, state.player);
    const note = card.kind === 'Strike'
      ? (value > card.power ? `+${value - card.power} break` : value < card.power ? 'dulled −1' : '')
      : (value > card.power ? `+${value - card.power} resonance` : '');
    const node = cardNode(card, {
      value, note, keyHint: String(i + 1),
      unaffordable: !affordable[i] || state.phase !== 'player' || state.screen !== 'table',
      index: i,
    });
    node.addEventListener('click', () => ui.playCard(i));
    els.playerHand.append(node);
  });

  // Field: the last played cards, small, with what they did.
  els.field.innerHTML = '';
  if (state.field.length === 0) {
    els.field.append(el('div', 'field-empty', 'No cards played yet — the field awaits the first sigil.'));
  } else {
    for (const played of state.field) {
      const node = cardNode(played.card, { small: true, value: played.card.power });
      const tag = el('div', 'field-tag', `${played.by === 'player' ? 'YOU' : 'SABLE'} · ${played.text}`);
      const wrap = el('div', 'field-card');
      wrap.append(node, tag);
      els.field.append(wrap);
    }
  }

  els.log.innerHTML = state.log.slice(-2).map((line) => `<div>${line}</div>`).join('');
  els.endBtn.disabled = state.phase !== 'player' || state.screen !== 'table';
  els.endBtn.classList.toggle('pulse', state.phase === 'player' && state.screen === 'table');

  renderOverlay(state, ui);
}

function overlayHtml(state) {
  if (state.screen === 'title') {
    return `<h1 class="title-h">EMBER<br>SIGIL DUEL</h1>` +
      `<p class="title-sub">A 1-vs-1 card duel against <b>Sable the Tidecaller</b>. Four sigils, one wheel, thirty life each.</p>` +
      `<div class="title-sigils">` +
      Object.values(SIGILS).map((s) => `<span class="title-sigil" style="color:${s.color}">${s.glyph} ${s.name}</span>`).join('') +
      `</div>` +
      `<p class="title-how">Play cards with mouse or keys 1–7. Strikes deal damage, Aegis raises shield. ` +
      `Beat the foe's ward for +3, chain one sigil for +1. End your turn with Space.</p>` +
      `<button class="big-btn" data-action="start">START DUEL</button>` +
      `<p class="title-foot">30 life each · 24-card decks · first to 0 loses</p>`;
  }
  if (state.screen === 'win') {
    return `<h1 class="win-h">VICTORY!</h1>` +
      `<p class="title-sub">Sable's last ember is yours. The duel is won.</p>` +
      statsHtml(state) +
      `<button class="big-btn" data-action="restart">DUEL AGAIN</button>`;
  }
  if (state.screen === 'loss') {
    return `<h1 class="loss-h">DEFEAT</h1>` +
      `<p class="title-sub">Your last ember gutters out. Sable takes this duel.</p>` +
      statsHtml(state) +
      `<button class="big-btn" data-action="restart">TRY AGAIN</button>`;
  }
  return '';
}

function statsHtml(state) {
  return `<div class="stats">` +
    `<div><b>${state.round}</b><span>rounds</span></div>` +
    `<div><b>${state.stats.damageDealt}</b><span>damage dealt</span></div>` +
    `<div><b>${state.stats.cardsPlayed}</b><span>cards played</span></div>` +
    `<div><b>${state.stats.shieldsRaised}</b><span>shield raised</span></div>` +
    `</div>`;
}

function renderOverlay(state, ui) {
  const html = overlayHtml(state);
  const showHelp = ui.helpOpen && state.screen === 'table';
  if (showHelp) {
    els.overlayCard.innerHTML =
      `<h1 class="title-h" style="font-size:44px">HOW TO PLAY</h1>` +
      `<p class="title-sub">Each round: your mana refills and grows (+1 max, up to 10). Draw a card, ` +
      `play as many as you can afford, then End Turn.</p>` +
      `<p class="title-how"><b>Strike</b> — damage equal to its power. <b>Aegis</b> — shield equal to its power, ` +
      `absorbs damage first.<br><b>Break +3</b> — a Strike whose sigil beats the foe's ward. ` +
      `<b>Dulled −1</b> — a Strike whose sigil loses to the ward.<br>` +
      `<b>Resonance +1</b> — the 2nd+ card of one sigil played in a turn.<br>` +
      `The wheel: ▲ Ember beats ◆ Gale beats ■ Stone beats ● Tide beats ▲ Ember.<br>` +
      `Your ward becomes the sigil of the last card you played — Sable reads it too.</p>` +
      `<button class="big-btn" data-action="close-help">BACK TO THE TABLE</button>`;
    els.overlay.classList.add('show');
    return;
  }
  if (html) {
    els.overlayCard.innerHTML = html;
    els.overlay.classList.add('show');
  } else {
    els.overlay.classList.remove('show');
  }
}
