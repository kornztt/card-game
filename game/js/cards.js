// Ember Court — elements, card pool and deck building.
'use strict';

/** The four elements. `beats` names the element this one has advantage over. */
const ELEMENTS = {
  flame: { name: 'Flame', color: '#e74c3c', dark: '#922b21', beats: 'leaf', glyph: 'flame' },
  leaf: { name: 'Leaf', color: '#27ae60', dark: '#1e8449', beats: 'stone', glyph: 'leaf' },
  stone: { name: 'Stone', color: '#d4ac0d', dark: '#7d6608', beats: 'tide', glyph: 'stone' },
  tide: { name: 'Tide', color: '#3498db', dark: '#2471a3', beats: 'flame', glyph: 'tide' },
};

/** Card kinds: strike hits, guard shields, siphon hits and draws. */
const KINDS = {
  strike: { label: 'Strike', verb: 'strikes' },
  guard: { label: 'Guard', verb: 'guards' },
  siphon: { label: 'Siphon', verb: 'siphons' },
};

/** Inline SVG glyphs, one shape per element (colour + shape, never text alone). */
const GLYPHS = {
  flame: '<svg viewBox="0 0 64 64"><path d="M32 6 C38 20 50 24 50 40 A18 18 0 1 1 14 40 C14 30 22 26 26 18 C28 24 32 24 32 6 Z" fill="#e74c3c" stroke="#922b21" stroke-width="2"/><path d="M32 34 C36 40 40 42 40 48 A8 8 0 1 1 24 48 C24 42 28 40 32 34 Z" fill="#f9c74f"/></svg>',
  leaf: '<svg viewBox="0 0 64 64"><path d="M52 12 C28 10 10 26 12 50 C34 52 52 36 52 12 Z" fill="#27ae60" stroke="#1e8449" stroke-width="2"/><path d="M16 48 C26 36 36 26 48 16" fill="none" stroke="#1e8449" stroke-width="2.5"/></svg>',
  stone: '<svg viewBox="0 0 64 64"><path d="M8 52 L26 14 L40 34 L48 22 L56 52 Z" fill="#d4ac0d" stroke="#7d6608" stroke-width="2"/><path d="M26 14 L32 28 L40 34" fill="none" stroke="#7d6608" stroke-width="2"/></svg>',
  tide: '<svg viewBox="0 0 64 64"><path d="M32 8 C40 22 52 32 52 44 A20 20 0 1 1 12 44 C12 32 24 22 32 8 Z" fill="#3498db" stroke="#2471a3" stroke-width="2"/><path d="M24 46 A8 8 0 0 0 32 52" fill="none" stroke="#aed6f1" stroke-width="2.5"/></svg>',
};

/** Every card in the pool: id, name, kind, element, cost, power. */
const CARD_POOL = [
  { id: 'ember-slash', name: 'Ember Slash', kind: 'strike', element: 'flame', cost: 1, power: 3 },
  { id: 'cinder-fan', name: 'Cinder Fan', kind: 'strike', element: 'flame', cost: 2, power: 5 },
  { id: 'wildfire', name: 'Wildfire', kind: 'strike', element: 'flame', cost: 3, power: 7 },
  { id: 'flame-ward', name: 'Flame Ward', kind: 'guard', element: 'flame', cost: 1, power: 4 },
  { id: 'ash-siphon', name: 'Ash Siphon', kind: 'siphon', element: 'flame', cost: 2, power: 3 },
  { id: 'tide-cut', name: 'Tide Cut', kind: 'strike', element: 'tide', cost: 1, power: 3 },
  { id: 'undertow', name: 'Undertow', kind: 'strike', element: 'tide', cost: 2, power: 5 },
  { id: 'maelstrom', name: 'Maelstrom', kind: 'strike', element: 'tide', cost: 3, power: 7 },
  { id: 'mist-wall', name: 'Mist Wall', kind: 'guard', element: 'tide', cost: 1, power: 4 },
  { id: 'deep-siphon', name: 'Deep Siphon', kind: 'siphon', element: 'tide', cost: 2, power: 3 },
  { id: 'thorn-lash', name: 'Thorn Lash', kind: 'strike', element: 'leaf', cost: 1, power: 3 },
  { id: 'bramble', name: 'Bramble Rush', kind: 'strike', element: 'leaf', cost: 2, power: 5 },
  { id: 'overgrowth', name: 'Overgrowth', kind: 'strike', element: 'leaf', cost: 3, power: 7 },
  { id: 'bark-shield', name: 'Bark Shield', kind: 'guard', element: 'leaf', cost: 1, power: 4 },
  { id: 'sap-siphon', name: 'Sap Siphon', kind: 'siphon', element: 'leaf', cost: 2, power: 3 },
  { id: 'pebble-shot', name: 'Pebble Shot', kind: 'strike', element: 'stone', cost: 1, power: 3 },
  { id: 'boulder', name: 'Boulder Fall', kind: 'strike', element: 'stone', cost: 2, power: 5 },
  { id: 'avalanche', name: 'Avalanche', kind: 'strike', element: 'stone', cost: 3, power: 7 },
  { id: 'granite-ward', name: 'Granite Ward', kind: 'guard', element: 'stone', cost: 1, power: 4 },
  { id: 'ore-siphon', name: 'Ore Siphon', kind: 'siphon', element: 'stone', cost: 2, power: 3 },
  { id: 'spark-jab', name: 'Spark Jab', kind: 'strike', element: 'flame', cost: 1, power: 2 },
  { id: 'spray', name: 'Cold Spray', kind: 'strike', element: 'tide', cost: 1, power: 2 },
  { id: 'vine-whip', name: 'Vine Whip', kind: 'strike', element: 'leaf', cost: 1, power: 2 },
  { id: 'gravel', name: 'Gravel Spray', kind: 'strike', element: 'stone', cost: 1, power: 2 },
];

/** A fresh 24-card deck: three cards of each element, two copies each, shuffled. */
function buildDeck(random) {
  const picks = [];
  for (const element of ['flame', 'tide', 'leaf', 'stone']) {
    const ofElement = CARD_POOL.filter((c) => c.element === element).slice(0, 3);
    for (const card of ofElement) {
      picks.push(card);
      picks.push(card);
    }
  }
  return shuffle(picks, random);
}

/** Fisher–Yates shuffle with an injected random source (defaults to Math.random). */
function shuffle(list, random) {
  const rnd = random || Math.random;
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

/** Advantage damage: +2 when the attacker's element beats the defender's last element. */
function advantageBonus(attackElement, defendElement) {
  if (!defendElement) return 0;
  return ELEMENTS[attackElement].beats === defendElement ? 2 : 0;
}
