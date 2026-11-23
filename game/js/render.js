// Ember Court — DOM rendering: hands, life bars, energy, log and flourishes.
'use strict';

/** One card's HTML: cost, element glyph, name, art, type, power. */
function cardHtml(card, index) {
  const el = ELEMENTS[card.element];
  const kind = KINDS[card.kind];
  const powerLine = card.kind === 'guard'
    ? `<div class="card-atk">🛡 ${card.power}</div>`
    : `<div class="card-atk">${card.power} <small>dmg</small></div>`;
  const desc = card.kind === 'siphon' ? 'Hit + draw 1' : (card.kind === 'guard' ? 'Block damage' : 'Deal damage');
  return `<div class="cost">${card.cost}</div>`
    + `<div class="el-icon">${GLYPHS[card.element]}</div>`
    + `<div class="card-name">${card.name}</div>`
    + `<div class="card-art">${GLYPHS[card.element]}</div>`
    + `<div class="card-type">${el.name} · ${kind.label}</div>`
    + `<div class="card-desc">${desc}</div>`
    + powerLine;
}

/** Render the player's hand; `selected` is the index of the chosen card (or -1). */
function renderPlayerHand(state, selected, onSelect) {
  const hand = document.getElementById('player-hand');
  hand.innerHTML = '';
  hand.classList.toggle('compact', state.playerHand.length >= 6);
  state.playerHand.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = 'card el-' + card.element + (i === selected ? ' selected' : '')
      + (card.cost > state.playerEnergy || state.phase !== 'player' ? ' unplayable' : '');
    div.innerHTML = cardHtml(card, i);
    div.dataset.index = String(i);
    div.addEventListener('click', () => onSelect(i));
    hand.appendChild(div);
  });
}

/** Render the opponent's hand as face-down backs (count only — no peeking). */
function renderOpponentHand(state) {
  const hand = document.getElementById('opponent-hand');
  hand.innerHTML = '';
  for (let i = 0; i < state.aiHand.length; i++) {
    const div = document.createElement('div');
    div.className = 'card-back';
    div.textContent = '♜';
    hand.appendChild(div);
  }
}

/** Life bars, shields, decks, energy, score and turn label. */
function renderHud(state) {
  const setLife = (prefix, life, shield) => {
    const fill = document.getElementById(prefix + '-life-fill');
    const text = document.getElementById(prefix + '-life');
    const shieldEl = document.getElementById(prefix + '-shield');
    fill.style.width = Math.max(0, life) / 30 * 100 + '%';
    fill.classList.toggle('low', life <= 10);
    text.textContent = String(Math.max(0, life));
    shieldEl.textContent = shield > 0 ? '🛡' + shield : '';
  };
  setLife('player', state.playerLife, state.playerShield);
  setLife('opponent', state.aiLife, state.aiShield);
  document.getElementById('player-deck').textContent = 'Deck ' + state.playerDeck.length;
  document.getElementById('opponent-deck').textContent = 'Deck ' + state.aiDeck.length;
  const orbs = document.getElementById('energy-orbs');
  orbs.innerHTML = '';
  for (let i = 0; i < state.maxEnergy; i++) {
    const orb = document.createElement('span');
    orb.className = 'energy-orb' + (i < state.playerEnergy ? '' : ' spent');
    orbs.appendChild(orb);
  }
  document.getElementById('score').textContent = String(state.score);
  document.getElementById('best-score').textContent = String(state.bestScore);
  document.getElementById('turn-label').textContent = 'Turn ' + state.turn;
  const banner = document.getElementById('turn-banner');
  if (state.phase === 'player') {
    banner.textContent = 'Your turn — play a card';
    banner.classList.remove('enemy');
  } else if (state.phase === 'enemy') {
    banner.textContent = 'The Warden is thinking…';
    banner.classList.add('enemy');
  } else {
    banner.textContent = '';
  }
}

/** Append a line to the battle log (newest last, keep the last four). */
function logLine(html) {
  const log = document.getElementById('log');
  const div = document.createElement('div');
  div.innerHTML = html;
  log.appendChild(div);
  while (log.children.length > 4) log.removeChild(log.firstChild);
}

/** A floating damage/heal number near the fighter who took it. */
function floatText(target, text, kind) {
  const layer = document.getElementById('float-layer');
  const anchor = document.getElementById(target === 'player' ? 'player-portrait' : 'opponent-portrait');
  const rect = anchor.getBoundingClientRect();
  const span = document.createElement('span');
  span.className = 'float-text' + (kind ? ' ' + kind : '');
  span.textContent = text;
  span.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  span.style.top = (rect.top - 10) + 'px';
  layer.appendChild(span);
  setTimeout(() => span.remove(), 1200);
}

/** A short shake of the whole table on a big hit. */
function shakeTable() {
  const table = document.getElementById('table');
  table.classList.remove('shake');
  void table.offsetWidth;
  table.classList.add('shake');
}

function showOverlay(id) {
  document.getElementById(id).classList.remove('hidden');
}
function hideOverlay(id) {
  document.getElementById(id).classList.add('hidden');
}
