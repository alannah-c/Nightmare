/**
 * The 6 Harbinger characters from the original Nightmare board game.
 *
 * Key powers (identical for every character, received at random):
 *   1 — Black Hole Lock:  opponent lands on your gravestone → coin HEADS → banish them to Black Hole
 *   2 — Chance Gate:      opponent lands on your gravestone → coin TAILS → take all their Chance cards
 *   3 — Sanctuary:        you land on an opponent's gravestone → nothing can harm you that visit
 *   4 — Fate Gate:        opponent lands on your gravestone → coin HEADS → take all their Fate cards
 *   5 — Time Gate:        opponent lands on your gravestone → coin TAILS → take all their Time cards
 *   6 — Black Hole Escape: use to release yourself from the Black Hole
 */

function makeKeys(charId) {
  return [
    {
      id: `${charId}_1`,
      number: 1,
      name: 'Black Hole Lock',
      description:
        'If an opponent lands on your gravestone, toss the coin: HEADS — that opponent is banished to the Black Hole.',
      power: 'gravestone_banish',
      coinSide: 'heads',
      trigger: 'opponent_on_my_gravestone',
      reusable: true,
    },
    {
      id: `${charId}_2`,
      number: 2,
      name: 'Chance Gate',
      description:
        'If an opponent lands on your gravestone, toss the coin: TAILS — take all that opponent\'s Chance cards.',
      power: 'steal_chance',
      coinSide: 'tails',
      trigger: 'opponent_on_my_gravestone',
      reusable: true,
    },
    {
      id: `${charId}_3`,
      number: 3,
      name: 'Sanctuary',
      description:
        'If you land on an opponent\'s gravestone, nothing can harm you.',
      power: 'sanctuary',
      coinSide: null,
      trigger: 'me_on_opponent_gravestone',
      reusable: true,
    },
    {
      id: `${charId}_4`,
      number: 4,
      name: 'Fate Gate',
      description:
        'If an opponent lands on your gravestone, toss the coin: HEADS — take all the opponent\'s Fate cards.',
      power: 'steal_fate',
      coinSide: 'heads',
      trigger: 'opponent_on_my_gravestone',
      reusable: true,
    },
    {
      id: `${charId}_5`,
      number: 5,
      name: 'Time Gate',
      description:
        'If an opponent lands on your gravestone, toss the coin: TAILS — take all that opponent\'s Time cards.',
      power: 'steal_time',
      coinSide: 'tails',
      trigger: 'opponent_on_my_gravestone',
      reusable: true,
    },
    {
      id: `${charId}_6`,
      number: 6,
      name: 'Black Hole Escape',
      description: 'This key releases you from the Black Hole.',
      power: 'black_hole_escape',
      coinSide: null,
      trigger: 'in_black_hole',
      reusable: false, // consumed on use
    },
  ];
}

export const CHARACTERS = [
  {
    id: 'gevaudan',
    name: 'Gevaudan',
    color: '#222222',    // Black
    description: 'The Werewolf',
    gravestoneIndex: 0,
    keys: makeKeys('gevaudan'),
  },
  {
    id: 'hellin',
    name: 'Hellin',
    color: '#9933cc',    // Purple
    description: 'The Poltergeist',
    gravestoneIndex: 6,
    keys: makeKeys('hellin'),
  },
  {
    id: 'khufu',
    name: 'Khufu',
    color: '#cc3333',    // Red
    description: 'The Mummy',
    gravestoneIndex: 12,
    keys: makeKeys('khufu'),
  },
  {
    id: 'baron_samedi',
    name: 'Baron Samedi',
    color: '#f0f0f0',    // White
    description: 'The Zombie',
    gravestoneIndex: 18,
    keys: makeKeys('baron_samedi'),
  },
  {
    id: 'anne_de_chantraine',
    name: 'Anne de Chantraine',
    color: '#3366cc',    // Blue
    description: 'The Witch',
    gravestoneIndex: 24,
    keys: makeKeys('anne_de_chantraine'),
  },
  {
    id: 'elizabeth_bathory',
    name: 'Elizabeth Bathory',
    color: '#888888',    // Gray
    description: 'The Vampire',
    gravestoneIndex: 30,
    keys: makeKeys('elizabeth_bathory'),
  },
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id);
}

export function getRandomCharacterAssignments(playerCount) {
  const shuffled = [...CHARACTERS].sort(() => Math.random() - 0.5);
  const numberTokens = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, playerCount).map((char, i) => ({
    character: char,
    numberToken: numberTokens[i],
  }));
}
