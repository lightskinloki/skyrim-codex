import type { RoomGrid } from './paint';
import type { Facing } from './room';

/**
 * The camera, as pure geometry.
 *
 * A quarter turn is a **rigid rotation of the room**, never a resample of a
 * finished image and never a per-sprite nudge. Everything that lives in the room
 * — a cell, a prop's footprint, a token, a point light — is moved by exactly
 * these two functions, which are inverses of each other. That is the whole
 * reason nothing can drift when the camera turns: there is one transform, and
 * positions are derived from it rather than adjusted by hand.
 *
 * Coordinates are in cell units, so an anchor that sits on a quarter-cell stays
 * on a quarter-cell after any number of turns, and the pixel projection is exact
 * (no subpixel sampling, no soft edges).
 */

export const toCamera = (x: number, y: number, cols: number, rows: number, yaw: number): [number, number] => {
  switch (yaw & 3) {
    case 1:
      return [y, cols - x];
    case 2:
      return [cols - x, rows - y];
    case 3:
      return [rows - y, x];
    default:
      return [x, y];
  }
};

/** The inverse, for turning a click back into room coordinates. */
export const toWorld = (x: number, y: number, cols: number, rows: number, yaw: number): [number, number] => {
  switch (yaw & 3) {
    case 1:
      return [cols - y, x];
    case 2:
      return [cols - x, rows - y];
    case 3:
      return [y, rows - x];
    default:
      return [x, y];
  }
};

/**
 * A footprint — a rectangle in room space, `[x0..x1] × [y0..y1]` in cells — as
 * the camera sees it. Rotating the two opposite corners and normalising is what
 * keeps a solid on its own patch of floor: the rect changes shape with the view
 * instead of being translated by a guessed offset.
 */
export const toCameraRect = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cols: number,
  rows: number,
  yaw: number,
): { x: number; y: number; w: number; h: number } => {
  const a = toCamera(x0, y0, cols, rows, yaw);
  const b = toCamera(x1, y1, cols, rows, yaw);
  return {
    x: Math.min(a[0], b[0]),
    y: Math.min(a[1], b[1]),
    w: Math.abs(b[0] - a[0]),
    h: Math.abs(b[1] - a[1]),
  };
};

const DIRS: [number, number][] = [[0, 1], [0, -1], [-1, 0], [1, 0]];

/** Which way a body faces, as the camera sees it. Turning the room shows a
 *  character's other side, which is half the point of turning it. */
export const toCameraFacing = (f: Facing, yaw: number): Facing => {
  let [dx, dy] = DIRS[f & 3];
  for (let k = 0; k < (yaw & 3); k++) {
    const nx = dy;
    const ny = -dx;
    dx = nx;
    dy = ny;
  }
  const i = DIRS.findIndex(([a, b]) => a === dx && b === dy);
  return (i < 0 ? 0 : i) as Facing;
};

/** The cell map, rotated into the camera's frame. */
export const rotateGrid = (g: RoomGrid, yaw: number): RoomGrid => {
  const q = yaw & 3;
  if (q === 0) return g;
  const cols = q & 1 ? g.rows : g.cols;
  const rows = q & 1 ? g.cols : g.rows;
  const cells = new Uint8Array(cols * rows);
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      let cx: number;
      let cy: number;
      if (q === 1) {
        cx = y;
        cy = g.cols - 1 - x;
      } else if (q === 2) {
        cx = g.cols - 1 - x;
        cy = g.rows - 1 - y;
      } else {
        cx = g.rows - 1 - y;
        cy = x;
      }
      cells[cy * cols + cx] = g.cells[y * g.cols + x];
    }
  }
  return { cols, rows, cells, seed: g.seed };
};
