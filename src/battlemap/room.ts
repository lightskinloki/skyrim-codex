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

  const props: PropRule[] = [
    // Deliberately coarse: fractional coordinates, snapped at build (P6a).
    { rule: 'rug', at: [12.2, 8.4], w: 4, h: 2, navy: false },
    { rule: 'table', at: [12.9, 7.1], w: 2 },
    { rule: 'bench', at: [12.15, 9.2], w: 2 },
    { rule: 'bench', at: [12.2, 5.9], w: 2 },

    { rule: 'chest', at: [3.1, 15.4], w: 1, bands: 2 },
    { rule: 'chest', at: [4.4, 15.2], w: 2, bands: 1 },
    { rule: 'crate', at: [24.2, 14.8] },
    { rule: 'crate', at: [25.2, 15.3] },
    { rule: 'barrel', at: [2.4, 3.2] },
    { rule: 'barrel', at: [3.3, 4.15] },
    { rule: 'barrel', at: [25.3, 4.2] },

    { rule: 'shelf', at: [2.6, 9.2], w: 2 },
    { rule: 'shelf', at: [2.6, 11.6], w: 2 },

    { rule: 'brazier', at: [8.2, 3.4], lit: true },
    { rule: 'brazier', at: [19.2, 3.6], lit: true },
    { rule: 'brazier', at: [14.2, 15.4], lit: true },

    { rule: 'column', at: [7.3, 10.2] },
    { rule: 'column', at: [20.4, 10.4] },

    { rule: 'rubble', at: [8.3, 16.2], size: 3 },
    { rule: 'rubble', at: [9.4, 16.4], size: 1 },
    { rule: 'rubble', at: [18.2, 16.3], size: 2 },
    { rule: 'rubble', at: [6.2, 13.2], size: 1 },
    { rule: 'rubble', at: [26.2, 11.4], size: 2 },
    { rule: 'rubble', at: [1.6, 6.2], size: 1 },
    { rule: 'rubble', at: [21.2, 16.2], size: 2 },
  ];

  const braziers = props.filter((p) => p.rule === 'brazier' && p.lit) as Extract<PropRule, { rule: 'brazier' }>[];

  const points: PointLight[] = braziers.map((b, i) => ({
    id: `brazier-${i}`,
    x: (Math.round(b.at[0]) + 0.5) * CELL,
    y: (Math.round(b.at[1]) + 0.35) * CELL,
    radius: 5.0 * CELL,
    // Enough to lift a midnight floor seven steps: a brazier is the difference
    // between a room you cannot see and a room you can.
    intensity: 3.2,
    flicker: 0.5,
  }));

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
