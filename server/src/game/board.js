/**
 * Board layout for the Nightmare game.
 *
 * The outer ring has 36 gravestone squares arranged in a circle.
 * Each square has a type determining what happens when landed on.
 * 4 inner paths lead from specific outer ring positions to the center NIGHTMARE square.
 *
 * Square types:
 *   'gravestone'        — Named character start (also landing targets)
 *   'time'              — Draw a Time card
 *   'fate'              — Draw a Fate card
 *   'chance'            — Draw a Chance card
 *   'x'                 — Special reward square (referenced by Time cards)
 *   'black_hole'        — Player is trapped
 *   'blank'             — No effect
 *
 * Inner path squares are numbered from the outer ring inward toward the center.
 */

// Outer ring: 36 squares, clockwise
export const OUTER_RING = [
  { index: 0,  type: 'gravestone', character: 'gevaudan',           label: 'Gevaudan' },
  { index: 1,  type: 'time',      label: 'TIME' },
  { index: 2,  type: 'blank',     label: '' },
  { index: 3,  type: 'fate',      label: 'FATE' },
  { index: 4,  type: 'blank',     label: '' },
  { index: 5,  type: 'chance',    label: 'CHANCE' },
  { index: 6,  type: 'gravestone', character: 'hellin',             label: 'Hellin' },
  { index: 7,  type: 'time',      label: 'TIME' },
  { index: 8,  type: 'x',         label: 'X' },
  { index: 9,  type: 'black_hole', label: 'BLACK HOLE' },
  { index: 10, type: 'fate',      label: 'FATE' },
  { index: 11, type: 'chance',    label: 'CHANCE' },
  { index: 12, type: 'gravestone', character: 'khufu',              label: 'Khufu' },
  { index: 13, type: 'time',      label: 'TIME' },
  { index: 14, type: 'blank',     label: '' },
  { index: 15, type: 'fate',      label: 'FATE' },
  { index: 16, type: 'blank',     label: '' },
  { index: 17, type: 'chance',    label: 'CHANCE' },
  { index: 18, type: 'gravestone', character: 'baron_samedi',       label: 'Baron Samedi' },
  { index: 19, type: 'time',      label: 'TIME' },
  { index: 20, type: 'blank',     label: '' },
  { index: 21, type: 'fate',      label: 'FATE' },
  { index: 22, type: 'blank',     label: '' },
  { index: 23, type: 'chance',    label: 'CHANCE' },
  { index: 24, type: 'gravestone', character: 'anne_de_chantraine', label: 'Anne de Chantraine' },
  { index: 25, type: 'time',      label: 'TIME' },
  { index: 26, type: 'x',         label: 'X' },
  { index: 27, type: 'black_hole', label: 'BLACK HOLE' },
  { index: 28, type: 'fate',      label: 'FATE' },
  { index: 29, type: 'chance',    label: 'CHANCE' },
  { index: 30, type: 'gravestone', character: 'elizabeth_bathory',  label: 'Elizabeth Bathory' },
  { index: 31, type: 'time',      label: 'TIME' },
  { index: 32, type: 'blank',     label: '' },
  { index: 33, type: 'fate',      label: 'FATE' },
  { index: 34, type: 'blank',     label: '' },
  { index: 35, type: 'chance',    label: 'CHANCE' },
];

// 4 inner paths, each with 4 squares leading to the center
// entryIndex = the outer ring square that connects to this inner path
export const INNER_PATHS = [
  {
    id: 'path_north',
    entryIndex: 3,
    squares: [
      { pathPosition: 1, label: '' },
      { pathPosition: 2, label: '' },
      { pathPosition: 3, label: '' },
      { pathPosition: 4, label: '' },
    ],
  },
  {
    id: 'path_east',
    entryIndex: 12,
    squares: [
      { pathPosition: 1, label: '' },
      { pathPosition: 2, label: '' },
      { pathPosition: 3, label: '' },
      { pathPosition: 4, label: '' },
    ],
  },
  {
    id: 'path_south',
    entryIndex: 21,
    squares: [
      { pathPosition: 1, label: '' },
      { pathPosition: 2, label: '' },
      { pathPosition: 3, label: '' },
      { pathPosition: 4, label: '' },
    ],
  },
  {
    id: 'path_west',
    entryIndex: 30,
    squares: [
      { pathPosition: 1, label: '' },
      { pathPosition: 2, label: '' },
      { pathPosition: 3, label: '' },
      { pathPosition: 4, label: '' },
    ],
  },
];

// The center square
export const NIGHTMARE_SQUARE = {
  id: 'nightmare_center',
  label: 'NIGHTMARE',
};

export const BOARD_SIZE = OUTER_RING.length; // 36

/**
 * Get the square a player would land on after moving `steps` clockwise
 * from their current outer ring position.
 */
export function getDestination(currentIndex, steps) {
  return (currentIndex + steps) % BOARD_SIZE;
}

/**
 * Check if a given outer ring index is an entry point to an inner path.
 */
export function getInnerPathEntry(outerIndex) {
  return INNER_PATHS.find((p) => p.entryIndex === outerIndex) || null;
}
