# Ember Court

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/kornztt/card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/kornztt/card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An elemental card duel. You are the Ember Knight; the Ashen Warden holds the
throne. Play cards from your hand, spend energy, and reduce the Warden to 0
life before yours runs out.

## Rules

- **Four elements**: Flame beats Leaf, Leaf beats Stone, Stone beats Tide,
  Tide beats Flame. An advantaged strike deals +2 damage.
- **Three card kinds**: Strike (deal damage), Guard (gain shield that blocks
  damage), Siphon (deal damage and draw a card).
- **Energy**: 3 on turn one, +1 each turn up to 6, refilled every turn.
- **Turns**: play as many cards as you can afford, then end your turn and the
  Warden answers. Draw a card each turn; your deck reshuffles from the
  discard pile when it runs out.
- **Score**: damage dealt + 2 per life remaining, +50 for a win. Best score
  is kept in localStorage.

## Controls

Mouse: click a card to select it, click again (or the enemy) to play it.
Keys: `1–7` select a card, `Enter` end turn, `M` mute, `H` help,
`Esc` pause.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No network, no build step; all art is inline SVG and all
sound is synthesized with WebAudio.
