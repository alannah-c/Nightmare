/**
 * Board layout data for rendering the SVG board.
 * Mirrors server/src/game/board.js but with rendering coordinates.
 *
 * The board is rendered in a 700x700 SVG viewport.
 * Center is at (350, 350). Outer ring radius ~280. Inner path squares
 * are spaced along 4 diagonal/axis lines toward the center.
 */

const CX = 350;
const CY = 350;
const OUTER_RADIUS = 275;
const INNER_RADII = [210, 160, 110, 60]; // 4 steps inward

// 36 outer ring squares, evenly spaced around the circle
// Starting from top (12 o'clock), going clockwise
export const OUTER_RING = [
  { index: 0,  type: 'gravestone', character: 'gevaudan',           label: 'Gevaudan',           shortLabel: 'GEV' },
  { index: 1,  type: 'time',      label: 'TIME',                   shortLabel: 'T' },
  { index: 2,  type: 'blank',     label: '',                       shortLabel: '' },
  { index: 3,  type: 'fate',      label: 'FATE',                   shortLabel: 'F' },
  { index: 4,  type: 'blank',     label: '',                       shortLabel: '' },
  { index: 5,  type: 'chance',    label: 'CHANCE',                 shortLabel: 'C' },
  { index: 6,  type: 'gravestone', character: 'hellin',             label: 'Hellin',             shortLabel: 'HEL' },
  { index: 7,  type: 'time',      label: 'TIME',                   shortLabel: 'T' },
  { index: 8,  type: 'x',         label: 'X',                      shortLabel: 'X' },
  { index: 9,  type: 'black_hole', label: 'BLACK HOLE',            shortLabel: 'BH' },
  { index: 10, type: 'fate',      label: 'FATE',                   shortLabel: 'F' },
  { index: 11, type: 'chance',    label: 'CHANCE',                 shortLabel: 'C' },
  { index: 12, type: 'gravestone', character: 'khufu',              label: 'Khufu',              shortLabel: 'KHU' },
  { index: 13, type: 'time',      label: 'TIME',                   shortLabel: 'T' },
  { index: 14, type: 'blank',     label: '',                       shortLabel: '' },
  { index: 15, type: 'fate',      label: 'FATE',                   shortLabel: 'F' },
  { index: 16, type: 'blank',     label: '',                       shortLabel: '' },
  { index: 17, type: 'chance',    label: 'CHANCE',                 shortLabel: 'C' },
  { index: 18, type: 'gravestone', character: 'baron_samedi',       label: 'Baron Samedi',       shortLabel: 'BAR' },
  { index: 19, type: 'time',      label: 'TIME',                   shortLabel: 'T' },
  { index: 20, type: 'blank',     label: '',                       shortLabel: '' },
  { index: 21, type: 'fate',      label: 'FATE',                   shortLabel: 'F' },
  { index: 22, type: 'blank',     label: '',                       shortLabel: '' },
  { index: 23, type: 'chance',    label: 'CHANCE',                 shortLabel: 'C' },
  { index: 24, type: 'gravestone', character: 'anne_de_chantraine', label: 'Anne de Chantraine', shortLabel: 'ANN' },
  { index: 25, type: 'time',      label: 'TIME',                   shortLabel: 'T' },
  { index: 26, type: 'x',         label: 'X',                      shortLabel: 'X' },
  { index: 27, type: 'black_hole', label: 'BLACK HOLE',            shortLabel: 'BH' },
  { index: 28, type: 'fate',      label: 'FATE',                   shortLabel: 'F' },
  { index: 29, type: 'chance',    label: 'CHANCE',                 shortLabel: 'C' },
  { index: 30, type: 'gravestone', character: 'elizabeth_bathory',  label: 'Elizabeth Bathory',  shortLabel: 'ELI' },
  { index: 31, type: 'time',      label: 'TIME',                   shortLabel: 'T' },
  { index: 32, type: 'blank',     label: '',                       shortLabel: '' },
  { index: 33, type: 'fate',      label: 'FATE',                   shortLabel: 'F' },
  { index: 34, type: 'blank',     label: '',                       shortLabel: '' },
  { index: 35, type: 'chance',    label: 'CHANCE',                 shortLabel: 'C' },
];

// Character colors matching server
export const CHARACTER_COLORS = {
  gevaudan: '#808080',
  hellin: '#ff4444',
  khufu: '#d4a017',
  baron_samedi: '#9b59b6',
  anne_de_chantraine: '#ffffff',
  elizabeth_bathory: '#2ecc71',
};

// Square type fill colors
export const SQUARE_COLORS = {
  gravestone: '#2a1a3a',
  time: '#3a1a4a',
  fate: '#1a2a4a',
  chance: '#1a3a2a',
  x: '#4a3a1a',
  black_hole: '#0a0a0a',
  blank: '#1e1433',
};

// Square type border colors
export const SQUARE_BORDER_COLORS = {
  gravestone: '#8866aa',
  time: '#9955cc',
  fate: '#5577cc',
  chance: '#44aa66',
  x: '#ccaa44',
  black_hole: '#660022',
  blank: '#332255',
};

// Label colors for square types
export const LABEL_COLORS = {
  gravestone: '#ccaaee',
  time: '#cc88ff',
  fate: '#88aaff',
  chance: '#66dd88',
  x: '#ffcc44',
  black_hole: '#ff3344',
  blank: '#444',
};

/**
 * Calculate (x, y) position for an outer ring square.
 * Index 0 is at the top (12 o'clock), going clockwise.
 */
export function getOuterRingPosition(index) {
  const angle = (index / 36) * Math.PI * 2 - Math.PI / 2; // -90° so 0 is top
  return {
    x: CX + OUTER_RADIUS * Math.cos(angle),
    y: CY + OUTER_RADIUS * Math.sin(angle),
    angle,
  };
}

/**
 * Inner paths: 4 paths from outer ring entry points toward center.
 * Entry indices: 3 (top-right), 12 (bottom-right), 21 (bottom-left), 30 (top-left)
 * But looking at the physical board, the 4 paths form an X shape from the corners.
 */
export const INNER_PATHS = [
  { id: 'path_a', entryIndex: 3,  entryAngle: (3 / 36) * Math.PI * 2 - Math.PI / 2 },
  { id: 'path_b', entryIndex: 12, entryAngle: (12 / 36) * Math.PI * 2 - Math.PI / 2 },
  { id: 'path_c', entryIndex: 21, entryAngle: (21 / 36) * Math.PI * 2 - Math.PI / 2 },
  { id: 'path_d', entryIndex: 30, entryAngle: (30 / 36) * Math.PI * 2 - Math.PI / 2 },
];

/**
 * Get position for an inner path square.
 * pathIndex: 0-3 (which of the 4 paths)
 * step: 1-4 (1 = closest to outer ring, 4 = at the center)
 */
export function getInnerPathPosition(pathIndex, step) {
  const path = INNER_PATHS[pathIndex];
  const radius = INNER_RADII[step - 1];
  return {
    x: CX + radius * Math.cos(path.entryAngle),
    y: CY + radius * Math.sin(path.entryAngle),
  };
}

export const CENTER = { x: CX, y: CY };
export const BOARD_SIZE = 700;
