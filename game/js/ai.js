// Ember Court — the Ashen Warden's brain: a readable, counterable heuristic.
'use strict';

/**
 * Pick the AI's next play from its hand, or null to end its turn.
 * The Warden reads the table: it guards when hurt, presses advantage, and
 * spends spare energy on siphons to keep its hand full.
 *
 * state: { aiLife, aiShield, playerLife, playerShield, aiEnergy, playerLastElement }
 * hand: the AI's cards in play order.
 */
function chooseAiPlay(state, hand) {
  const affordable = hand.filter((c) => c.cost <= state.aiEnergy);
  if (affordable.length === 0) return null;

  const scored = affordable.map((card) => {
    let score = 0;
    const bonus = advantageBonus(card.element, state.playerLastElement);
    if (card.kind === 'strike') {
      score = card.power + bonus + (state.playerLife <= card.power + bonus ? 6 : 0);
      if (state.playerShield > 0) score -= 1;
    } else if (card.kind === 'guard') {
      // Guard matters most when the Warden is bleeding.
      score = state.aiLife <= 12 ? card.power + 4 : card.power - 3;
      if (state.aiShield >= 6) score -= 4;
    } else if (card.kind === 'siphon') {
      score = card.power + bonus + 2;
      if (hand.length <= 2) score += 3;
    }
    // Prefer cheap cards when energy is tight, so the turn does more.
    score -= card.cost * 0.4;
    return { card, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  // The Warden stops when nothing left is worth the energy.
  if (best.score < 1) return null;
  return best.card;
}
