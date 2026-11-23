// Ember Court — game state, turns, combat and screens.
'use strict';

const BEST_KEY = 'ember-court-best';
const START_LIFE = 30;

const state = {
  phase: 'title', // title | player | enemy | over
  turn: 1,
  playerLife: START_LIFE,
  aiLife: START_LIFE,
  playerShield: 0,
  aiShield: 0,
  playerEnergy: 3,
  maxEnergy: 3,
  playerDeck: [],
  aiDeck: [],
  playerHand: [],
  aiHand: [],
  playerDiscard: [],
  aiDiscard: [],
  playerLastElement: null,
  aiLastElement: null,
  score: 0,
  bestScore: 0,
  damageDealt: 0,
  cardsPlayed: 0,
  selected: -1,
  aiEnergy: 0,
  aiTimer: null,
};

function loadBest() {
  try { state.bestScore = Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch (e) { state.bestScore = 0; }
}
function saveBest() {
  try { localStorage.setItem(BEST_KEY, String(state.bestScore)); } catch (e) { /* storage unavailable */ }
}

function drawCard(who) {
  const deck = who === 'player' ? state.playerDeck : state.aiDeck;
  const discard = who === 'player' ? state.playerDiscard : state.aiDiscard;
  const hand = who === 'player' ? state.playerHand : state.aiHand;
  if (deck.length === 0) {
    if (discard.length === 0) return null;
    state[who === 'player' ? 'playerDeck' : 'aiDeck'] = shuffle(discard.splice(0), Math.random);
    return drawCard(who);
  }
  const card = deck.pop();
  if (hand.length < 7) hand.push(card);
  return card;
}

function newGame() {
  state.phase = 'player';
  state.turn = 1;
  state.playerLife = START_LIFE;
  state.aiLife = START_LIFE;
  state.playerShield = 0;
  state.aiShield = 0;
  state.maxEnergy = 3;
  state.playerEnergy = 3;
  state.playerDeck = buildDeck();
  state.aiDeck = buildDeck();
  state.playerHand = [];
  state.aiHand = [];
  state.playerDiscard = [];
  state.aiDiscard = [];
  state.playerLastElement = null;
  state.aiLastElement = null;
  state.score = 0;
  state.damageDealt = 0;
  state.cardsPlayed = 0;
  state.selected = -1;
  for (let i = 0; i < 4; i++) { drawCard('player'); drawCard('ai'); }
  document.getElementById('log').innerHTML = '';
  logLine('The duel begins. Your turn — play a card.');
  hideOverlay('title-screen');
  hideOverlay('win-screen');
  hideOverlay('loss-screen');
  hideOverlay('pause-screen');
  AudioEngine.ensure();
  AudioEngine.startMusic();
  AudioEngine.turn();
  renderAll();
}

/** Damage after shields: returns the life damage actually dealt. */
function dealDamage(target, amount) {
  const shieldKey = target === 'player' ? 'playerShield' : 'aiShield';
  const lifeKey = target === 'player' ? 'playerLife' : 'aiLife';
  let blocked = 0;
  if (state[shieldKey] > 0) {
    blocked = Math.min(state[shieldKey], amount);
    state[shieldKey] -= blocked;
    amount -= blocked;
  }
  state[lifeKey] = Math.max(0, state[lifeKey] - amount);
  return { life: amount, blocked };
}

function describeCard(card) {
  return `<b>${card.name}</b> <span class="adv">${ELEMENTS[card.element].name}</span>`;
}

/** Resolve one played card. `by` is 'player' or 'ai'. */
function playCard(by, card) {
  const isPlayer = by === 'player';
  const hand = isPlayer ? state.playerHand : state.aiHand;
  const discard = isPlayer ? state.playerDiscard : state.aiDiscard;
  const idx = hand.indexOf(card);
  if (idx < 0) return false;
  if (isPlayer) {
    if (state.phase !== 'player' || card.cost > state.playerEnergy) return false;
    state.playerEnergy -= card.cost;
  }
  hand.splice(idx, 1);
  discard.push(card);
  state.cardsPlayed++;
  AudioEngine.playCard();

  if (card.kind === 'guard') {
    if (isPlayer) state.playerShield += card.power;
    else state.aiShield += card.power;
    AudioEngine.guard();
    logLine(`${isPlayer ? 'You' : 'The Warden'} ${KINDS.guard.verb} — ${describeCard(card)} gains ${card.power} shield.`);
    floatText(isPlayer ? 'player' : 'ai', '+' + card.power + ' 🛡', 'heal');
  } else {
    const foeElement = isPlayer ? state.aiLastElement : state.playerLastElement;
    const bonus = advantageBonus(card.element, foeElement);
    const total = card.power + bonus;
    const target = isPlayer ? 'ai' : 'player';
    const res = dealDamage(target, total);
    if (isPlayer) state.damageDealt += res.life;
    if (isPlayer) state.playerLastElement = card.element;
    else state.aiLastElement = card.element;
    AudioEngine.hit();
    if (total >= 6) shakeTable();
    const advText = bonus > 0 ? ' <span class="adv">Advantage +2!</span>' : '';
    logLine(`${isPlayer ? 'You' : 'The Warden'} ${KINDS[card.kind].verb} — ${describeCard(card)} hits for ${total}.${advText}${res.blocked > 0 ? ` (${res.blocked} blocked)` : ''}`);
    floatText(target, '-' + res.life, 'hurt');
    if (card.kind === 'siphon') {
      drawCard(by);
      AudioEngine.draw();
      logLine(`${isPlayer ? 'You draw' : 'The Warden draws'} a card.`);
    }
  }
  state.score = state.damageDealt + Math.max(0, state.playerLife) * 2;
  renderAll();
  checkEnd();
  return true;
}

function checkEnd() {
  if (state.phase === 'over') return;
  if (state.aiLife <= 0) return endGame(true);
  if (state.playerLife <= 0) return endGame(false);
}

function endGame(won) {
  state.phase = 'over';
  if (state.aiTimer) { clearTimeout(state.aiTimer); state.aiTimer = null; }
  if (won) {
    state.score += 50;
    if (state.score > state.bestScore) { state.bestScore = state.score; saveBest(); }
    document.getElementById('win-stats').innerHTML =
      `Turns: <b>${state.turn}</b> &nbsp;·&nbsp; Damage dealt: <b>${state.damageDealt}</b> &nbsp;·&nbsp; Cards played: <b>${state.cardsPlayed}</b><br>Score: <b>${state.score}</b> &nbsp;·&nbsp; Best: <b>${state.bestScore}</b>`;
    showOverlay('win-screen');
    AudioEngine.win();
  } else {
    document.getElementById('loss-stats').innerHTML =
      `Turns: <b>${state.turn}</b> &nbsp;·&nbsp; Damage dealt: <b>${state.damageDealt}</b> &nbsp;·&nbsp; Cards played: <b>${state.cardsPlayed}</b><br>Score: <b>${state.score}</b> &nbsp;·&nbsp; Best: <b>${state.bestScore}</b>`;
    showOverlay('loss-screen');
    AudioEngine.lose();
  }
  AudioEngine.stopMusic();
  renderAll();
}

function startPlayerTurn() {
  state.turn++;
  state.maxEnergy = Math.min(6, 2 + state.turn);
  state.playerEnergy = state.maxEnergy;
  state.phase = 'player';
  state.selected = -1;
  drawCard('player');
  AudioEngine.turn();
  logLine(`Turn ${state.turn} — energy refilled to ${state.playerEnergy}.`);
  renderAll();
}

function endTurn() {
  if (state.phase !== 'player') return;
  state.phase = 'enemy';
  state.selected = -1;
  renderAll();
  document.getElementById('end-turn').disabled = true;
  // The Warden draws, then plays one card at a time with a beat between.
  setTimeout(() => {
    drawCard('ai');
    state.aiEnergy = Math.min(6, 2 + state.turn);
    renderAll();
    aiStep();
  }, 500);
}

function aiStep() {
  if (state.phase !== 'enemy') return;
  const card = chooseAiPlay({
    aiLife: state.aiLife,
    aiShield: state.aiShield,
    playerLife: state.playerLife,
    playerShield: state.playerShield,
    aiEnergy: state.aiEnergy,
    playerLastElement: state.playerLastElement,
  }, state.aiHand);
  if (!card) {
    logLine('The Warden ends its turn.');
    state.aiEnergy = 0;
    document.getElementById('end-turn').disabled = false;
    startPlayerTurn();
    return;
  }
  state.aiEnergy -= card.cost;
  playCard('ai', card);
  if (state.phase === 'over') { document.getElementById('end-turn').disabled = false; return; }
  state.aiTimer = setTimeout(aiStep, 750);
}

/** Player interaction: select a card, or play the selected one. */
function onCardClick(index) {
  if (state.phase !== 'player') return;
  const card = state.playerHand[index];
  if (!card) return;
  if (state.selected === index) {
    // Second click plays it.
    state.selected = -1;
    playCard('player', card);
    return;
  }
  if (card.cost > state.playerEnergy) {
    logLine(`Not enough energy for <b>${card.name}</b> (cost ${card.cost}).`);
    return;
  }
  state.selected = index;
  renderAll();
}

function renderAll() {
  renderPlayerHand(state, state.selected, onCardClick);
  renderOpponentHand(state);
  renderHud(state);
  document.getElementById('end-turn').disabled = state.phase !== 'player';
  document.getElementById('title-best').textContent = String(state.bestScore);
}

// ---- wiring ----
document.getElementById('play-btn').addEventListener('click', newGame);
document.getElementById('win-again').addEventListener('click', newGame);
document.getElementById('loss-again').addEventListener('click', newGame);
document.getElementById('end-turn').addEventListener('click', endTurn);
document.getElementById('mute-btn').addEventListener('click', (e) => {
  const muted = AudioEngine.toggleMute();
  e.target.textContent = muted ? '♪ Off' : '♪ On';
});
document.getElementById('help-btn').addEventListener('click', () => showOverlay('help-screen'));
document.getElementById('help-close').addEventListener('click', () => hideOverlay('help-screen'));
document.getElementById('resume-btn').addEventListener('click', () => hideOverlay('pause-screen'));
document.getElementById('opponent-area').addEventListener('click', (e) => {
  if (state.phase !== 'player' || state.selected < 0) return;
  const card = state.playerHand[state.selected];
  if (!card || card.kind === 'guard') return;
  state.selected = -1;
  playCard('player', card);
});
document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '7') {
    onCardClick(Number(e.key) - 1);
  } else if (e.key === 'Enter') {
    if (state.phase === 'title') newGame();
    else endTurn();
  } else if (e.key === 'm' || e.key === 'M') {
    document.getElementById('mute-btn').click();
  } else if (e.key === 'h' || e.key === 'H') {
    const help = document.getElementById('help-screen');
    help.classList.toggle('hidden');
  } else if (e.key === 'Escape') {
    if (state.phase === 'player' || state.phase === 'enemy') showOverlay('pause-screen');
    else hideOverlay('pause-screen');
  }
});

// Test hook for automated play-testing (not part of the game flow).
window.EMBER_DEBUG = {
  state,
  playCard: (i) => playCard('player', state.playerHand[i]),
  endTurn,
  win: () => {
    const c = state.playerHand.find((x) => x.kind === 'strike');
    if (c && state.phase === 'player') { state.aiLife = 1; state.aiShield = 0; playCard('player', c); }
    else { state.aiLife = 0; checkEnd(); }
  },
  lose: () => { state.playerLife = 0; checkEnd(); },
};

loadBest();
renderAll();
