/**
 * The 6 Harbinger characters from the original Nightmare board game.
 * Each has a color, a named gravestone position on the board, and 6 keys.
 */
export const CHARACTERS = [
  {
    id: 'gevaudan',
    name: 'Gevaudan',
    color: '#808080',    // grey
    description: 'The Werewolf',
    gravestoneIndex: 0,
    keys: [
      { id: 'gevaudan_1', name: 'Key 1', power: null },
      { id: 'gevaudan_2', name: 'Key 2', power: null },
      { id: 'gevaudan_3', name: 'Key 3', power: null },
      { id: 'gevaudan_4', name: 'Key 4', power: null },
      { id: 'gevaudan_5', name: 'Key 5', power: null },
      { id: 'gevaudan_6', name: 'Black Hole Escape Key', power: 'black_hole_escape', reusable: true },
    ],
  },
  {
    id: 'hellin',
    name: 'Hellin',
    color: '#ff4444',    // red
    description: 'The Poltergeist',
    gravestoneIndex: 6,
    keys: [
      { id: 'hellin_1', name: 'Key 1', power: null },
      { id: 'hellin_2', name: 'Key 2', power: null },
      { id: 'hellin_3', name: 'Key 3', power: null },
      { id: 'hellin_4', name: 'Key 4', power: null },
      { id: 'hellin_5', name: 'Key 5', power: null },
      { id: 'hellin_6', name: 'Black Hole Escape Key', power: 'black_hole_escape', reusable: true },
    ],
  },
  {
    id: 'khufu',
    name: 'Khufu',
    color: '#d4a017',    // gold
    description: 'The Mummy',
    gravestoneIndex: 12,
    keys: [
      { id: 'khufu_1', name: 'Key 1', power: null },
      { id: 'khufu_2', name: 'Key 2', power: null },
      { id: 'khufu_3', name: 'Key 3', power: null },
      { id: 'khufu_4', name: 'Key 4', power: null },
      { id: 'khufu_5', name: 'Key 5', power: null },
      { id: 'khufu_6', name: 'Black Hole Escape Key', power: 'black_hole_escape', reusable: true },
    ],
  },
  {
    id: 'baron_samedi',
    name: 'Baron Samedi',
    color: '#9b59b6',    // purple
    description: 'The Zombie',
    gravestoneIndex: 18,
    keys: [
      { id: 'baron_samedi_1', name: 'Key 1', power: null },
      { id: 'baron_samedi_2', name: 'Key 2', power: null },
      { id: 'baron_samedi_3', name: 'Key 3', power: null },
      { id: 'baron_samedi_4', name: 'Key 4', power: null },
      { id: 'baron_samedi_5', name: 'Key 5', power: null },
      { id: 'baron_samedi_6', name: 'Black Hole Escape Key', power: 'black_hole_escape', reusable: true },
    ],
  },
  {
    id: 'anne_de_chantraine',
    name: 'Anne de Chantraine',
    color: '#ffffff',    // white
    description: 'The Witch',
    gravestoneIndex: 24,
    keys: [
      { id: 'anne_de_chantraine_1', name: 'Key 1', power: null },
      { id: 'anne_de_chantraine_2', name: 'Key 2', power: null },
      { id: 'anne_de_chantraine_3', name: 'Key 3', power: null },
      { id: 'anne_de_chantraine_4', name: 'Key 4', power: null },
      { id: 'anne_de_chantraine_5', name: 'Key 5', power: null },
      { id: 'anne_de_chantraine_6', name: 'Black Hole Escape Key', power: 'black_hole_escape', reusable: true },
    ],
  },
  {
    id: 'elizabeth_bathory',
    name: 'Elizabeth Bathory',
    color: '#2ecc71',    // green
    description: 'The Vampire',
    gravestoneIndex: 30,
    keys: [
      { id: 'elizabeth_bathory_1', name: 'Key 1', power: null },
      { id: 'elizabeth_bathory_2', name: 'Key 2', power: null },
      { id: 'elizabeth_bathory_3', name: 'Key 3', power: null },
      { id: 'elizabeth_bathory_4', name: 'Key 4', power: null },
      { id: 'elizabeth_bathory_5', name: 'Key 5', power: null },
      { id: 'elizabeth_bathory_6', name: 'Black Hole Escape Key', power: 'black_hole_escape', reusable: true },
    ],
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
