import { CELL } from './paint';
import { PointLight } from './light';
import { PropRule } from './props';
import { PRESETS, preset, type CharacterSpec } from '@/characters/spec';
import type { Facing, Room, Tier, TokenPlacement } from './room';

/**
 * A cavern with four storeys, built to prove the vertical model rather than to
 * be a backdrop. The pit is the ground storey; three stone shelves climb the
 * north and east walls, one of them overhanging the storey below.
 *
 * Everything here is authored in cells, and every ledge is a rectangle. That is
 * not a limitation of the renderer — the tiers are volumes — it is the same
 * choice the grid makes everywhere else: a cell is the unit players already
 * count in, so a shelf four cells deep is one a GM can lay out by hand.
 */

const COLS = 40;
const ROWS = 30;
const SEED = 0xc0de_71;

const setCell = (g: Uint8Array, cx: number, cz: number, v: number) => {
  if (cx < 0 || cz < 0 || cx >= COLS || cz >= ROWS) return;
  g[cz * COLS + cx] = v;
};

/**
 * A superellipse, not a circle. A circle's corners are the one place a caver
 * wants a shelf and cannot have one; the flatter sides keep the chamber while
 * the rounded corners stop it reading as a rectangle with a bevel.
 */
function edge(cx: number, cz: number): number {
  const dx = Math.abs((cx + 0.5 - 20) / 19.4);
  const dz = Math.abs((cz + 0.5 - 15) / 14.4);
  const p = 3.2;
  const r = Math.pow(Math.pow(dx, p) + Math.pow(dz, p), 1 / p);
  const th = Math.atan2(cz + 0.5 - 15, cx + 0.5 - 20);
  // A slow wobble: enough that the wall is never a straight line, small enough
  // that a shelf placed against it stays inside.
  const wob = 1 + 0.03 * Math.sin(th * 3 + 0.9) + 0.018 * Math.sin(th * 7 - 1.4);
  return r / wob;
}

export function makeCaveRoom(): Room {
  const cells = new Uint8Array(COLS * ROWS);
  for (let cz = 0; cz < ROWS; cz++) {
    for (let cx = 0; cx < COLS; cx++) {
      // Inside the chamber is floor; everything else is solid rock, all the way
      // to the edge of the grid. A cave is carved out of a mass, not wrapped in
      // a one-cell wall — and the mass's dark top is what reads as its roof
      // when the near edge is cut away for the camera.
      const r = edge(cx, cz);
      setCell(cells, cx, cz, r < 1 ? 1 : 2);
    }
  }

  /**
   * Storeys, low to high. C sits on B, so B is its floor — the same rule that
   * makes a gallery over the pit and a mesa on a shelf one code path.
   */
  const tiers: Tier[] = [
    // A rock island in the pit: something to break the floor and stand behind.
    { y: 0.9, deck: 'stone', rects: [[21, 18, 6, 4]] },
    { y: 2.1, deck: 'stone', rects: [[9, 2, 22, 4], [3, 6, 8, 8]] },
    { y: 4.2, deck: 'stone', rects: [[26, 6, 10, 14]] },
    { y: 6.3, deck: 'stone', rects: [[27, 6, 8, 7]] },
  ];

  const props: PropRule[] = [
    // Three ways up: pit to shelf, shelf to shelf, and the last two cells of
    // the gallery onto the high ledge.
    { rule: 'stairs', at: [16, 6], w: 1.8, rise: 2.1, run: 2, dir: -1 },
    { rule: 'stairs', at: [28, 4], w: 1.6, rise: 2.1, run: 2 },
    { rule: 'stairs', at: [29, 12], w: 1.6, rise: 2.1, run: 2, dir: -1 },

    { rule: 'brazier', at: [10, 9], lit: true },
    { rule: 'brazier', at: [22, 18.5], lit: true },
    { rule: 'brazier', at: [11, 3], lit: true },
    { rule: 'brazier', at: [30, 17], lit: true },

    { rule: 'column', at: [7, 16], h: 2.6 },
    { rule: 'column', at: [8.5, 17.5], h: 1.7 },
    { rule: 'column', at: [30, 22], h: 3.1 },
    { rule: 'column', at: [13, 22], h: 2.2 },
    { rule: 'column', at: [11, 14], h: 3.4 },
    { rule: 'column', at: [24, 24], h: 2.4 },

    { rule: 'crate', at: [4, 15] },
    { rule: 'crate', at: [4.6, 15.6] },
    { rule: 'chest', at: [32, 8] },

    { rule: 'rubble', at: [8, 12], size: 3 },
    { rule: 'rubble', at: [9, 13], size: 1 },
    { rule: 'rubble', at: [24, 12], size: 2 },
    { rule: 'rubble', at: [18, 24], size: 3 },
    { rule: 'rubble', at: [33, 24], size: 2 },
    { rule: 'rubble', at: [5, 20], size: 1 },
    { rule: 'rubble', at: [27, 3], size: 2 },
  ];

  // One cold shaft from the roof: the pit is lit from above and the shelves are
  // not, which is what gives the chamber its depth before a fire is lit.
  const points: PointLight[] = [
    { id: 'shaft', x: 19 * CELL, y: 15 * CELL, radius: 6.5 * CELL, intensity: 0.85, flicker: 0 },
  ];

  const tokens: TokenPlacement[] = [
    { id: 'pc-1', spec: preset('knight'), at: [18, 16.4], facing: 1, y: 0 },
    { id: 'npc-1', spec: preset('smith'), at: [13, 3.4], facing: 0, y: 2.1 },
    { id: 'npc-2', spec: PRESETS[2], at: [30, 15.4], facing: 2, y: 4.2 },
    { id: 'npc-3', spec: PRESETS[1] as CharacterSpec, at: [31, 9], facing: 3, y: 6.3 },
  ];

  const path: [number, number][] = [
    [19, 17],
    [18, 17],
    [17, 16],
    [16, 14],
    [16, 11],
    [16, 9],
    [16, 7],
    [16, 6],
    [16, 5],
  ];

  return {
    grid: { cols: COLS, rows: ROWS, seed: SEED, cells },
    props,
    tokens,
    path,
    tiers,
    wallHeight: 7.4,
    rig: {
      ambient: 0.2,
      sun: { azimuth: 205, elevation: 46, intensity: 0.92 },
      points,
    },
  };
}
