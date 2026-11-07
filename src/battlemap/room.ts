import { CELL, RoomGrid } from './paint';
import { PropRule } from './props';
import { LightRig, PointLight } from './light';
import { PRESETS, preset, type CharacterSpec } from '@/characters/spec';

export type Facing = 0 | 1 | 2 | 3; // down, up, left, right

export type TokenPlacement = {
  id: string;
  /** The same spec the dialogue bust renders from. */
  spec: CharacterSpec;
  at: [number, number];
  facing: Facing;
};

export type Room = {
  grid: RoomGrid;
  props: PropRule[];
  tokens: TokenPlacement[];
  /** The demo path: a dotted chain, the way a move is drawn (PRESENTATION X8). */
  path: [number, number][];
  rig: LightRig;
};

const makeGrid = (cols: number, rows: number, seed: number): RoomGrid => ({
  cols,
  rows,
  seed,
  cells: new Uint8Array(cols * rows),
});

const setCell = (g: RoomGrid, cx: number, cy: number, v: number) => {
  if (cx < 0 || cy < 0 || cx >= g.cols || cy >= g.rows) return;
  g.cells[cy * g.cols + cx] = v;
};

const rect = (g: RoomGrid, x: number, y: number, w: number, h: number, v: number) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setCell(g, x + i, y + j, v);
};

const COLS = 28;
const ROWS = 18;

export function makeDemoRoom(): Room {
  const seed = 0x5eed_11;
  const g = makeGrid(COLS, ROWS, seed);

  rect(g, 0, 0, COLS, ROWS, 2);          // solid block
  rect(g, 1, 1, COLS - 2, ROWS - 2, 1);  // carve the floor

  // Pillars.
  rect(g, 4, 3, 2, 2, 2);
  rect(g, 22, 3, 2, 2, 2);
  rect(g, 4, 13, 2, 2, 2);
  rect(g, 22, 13, 2, 2, 2);

  // An alcove in the north-east, with a one-cell door.
  rect(g, 20, 6, 7, 1, 2);
  rect(g, 20, 6, 1, 4, 2);
  rect(g, 26, 6, 1, 4, 2);
  rect(g, 20, 9, 7, 1, 2);
  rect(g, 23, 9, 1, 1, 1);

  // A spur wall, so the room is not a rectangle.
  rect(g, 12, 1, 1, 3, 2);
  rect(g, 1, 8, 4, 1, 2);

  // Every `at` is the **north-west corner of the footprint**, in cells, on an
  // eighth-of-a-cell lattice. The prop is a solid standing on that rectangle:
  // turning the camera rotates the rectangle, so nothing can shift.
  const props: PropRule[] = [
    { rule: 'rug', at: [11.5, 7.5], w: 4, h: 3.5 },
    { rule: 'bench', at: [12.5, 7.75], w: 2 },
    { rule: 'table', at: [12.5, 8.75], w: 2 },
    { rule: 'bench', at: [12.5, 9.75], w: 2 },

    { rule: 'chest', at: [3, 15], w: 1, bands: 2 },
    { rule: 'chest', at: [4.5, 15], w: 1.5, bands: 1 },
    { rule: 'crate', at: [23.75, 14.5] },
    { rule: 'crate', at: [24.75, 15] },
    { rule: 'barrel', at: [2, 3] },
    { rule: 'barrel', at: [2.75, 3.75] },
    { rule: 'barrel', at: [25, 4] },

    { rule: 'shelf', at: [2, 9], w: 2 },
    { rule: 'shelf', at: [2, 11.5], w: 2 },

    { rule: 'brazier', at: [8, 3], lit: true },
    { rule: 'brazier', at: [19, 3.5], lit: true },
    { rule: 'brazier', at: [14, 15], lit: true },

    { rule: 'column', at: [7, 10] },
    { rule: 'column', at: [20, 10] },

    { rule: 'rubble', at: [8.25, 16], size: 3 },
    { rule: 'rubble', at: [9.25, 16.25], size: 1 },
    { rule: 'rubble', at: [18, 16], size: 2 },
    { rule: 'rubble', at: [6, 13], size: 1 },
    { rule: 'rubble', at: [26, 11], size: 2 },
    { rule: 'rubble', at: [1.5, 6], size: 1 },
    { rule: 'rubble', at: [21, 16], size: 2 },
  ];

  // Lamps are not authored here: a brazier's light is derived from the bowl's
  // own footprint at build time, so the glow can never be painted somewhere the
  // bowl is not.
  const points: PointLight[] = [];

  // One cold shaft from a crack in the roof, to prove two moods can coexist.
  points.push({ id: 'shaft', x: 14.5 * CELL, y: 3.2 * CELL, radius: 7 * CELL, intensity: 1.1, flicker: 0 });

  const tokens: TokenPlacement[] = [
    { id: 'pc-1', spec: preset('knight'), at: [12.4, 11.2], facing: 1 },
    { id: 'npc-1', spec: preset('smith'), at: [15.2, 4.4], facing: 0 },
    { id: 'npc-2', spec: PRESETS[2], at: [18.3, 12.4], facing: 2 },
  ];

  const path: [number, number][] = [
    [12, 11], [12, 10], [13, 10], [13, 9], [14, 9], [14, 8],
  ];

  return {
    grid: g,
    props,
    tokens,
    path,
    rig: {
      ambient: 0.3,
      sun: { azimuth: 225, elevation: 58, intensity: 1 },
      points,
    },
  };
}

/**
 * Four moods, one palette. The differences are all in the rig: elevation sets
 * how far the relief swings, azimuth decides which wall is lit, ambient decides
 * how deep the shadow goes, and the braziers stay lit in all four — which is how
 * a noon room and a midnight room read as the same place at different hours.
 */
export const MOODS: { id: string; label: string; rig: Pick<LightRig, 'sun' | 'ambient'> }[] = [
  { id: 'dawn', label: 'Dawn', rig: { ambient: 0.3, sun: { azimuth: 200, elevation: 13, intensity: 1 } } },
  { id: 'noon', label: 'Noon', rig: { ambient: 0.34, sun: { azimuth: 225, elevation: 62, intensity: 1 } } },
  { id: 'dusk', label: 'Dusk', rig: { ambient: 0.28, sun: { azimuth: 305, elevation: 9, intensity: 0.9 } } },
  { id: 'midnight', label: 'Midnight', rig: { ambient: 0.1, sun: { azimuth: 225, elevation: -20, intensity: 0 } } },
];
