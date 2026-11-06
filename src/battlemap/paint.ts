import { M_FLOOR, M_INK, M_WALL, Surface, TAG } from './surface';
import { bayer, hf, mottle } from './rng';

/**
 * Floors and walls. See docs/PIXEL-ART-SPEC.md P3–P4, P7.
 *
 * A floor pixel is one of a few stone steps. Everything that makes it read as
 * masonry is index arithmetic: the seam, the grain, the decal and the shadow.
 *
 * The anti-tiling work is in three places, at three scales, because a floor
 * that repeats every 32 px is the first thing the eye catches:
 *
 *   per pixel  grain, hashed by absolute position, so no two pixels repeat
 *   per cell   a variant step, so a tile is never its neighbour's twin
 *   per room   a two-octave wash interpolated across the cell lattice and
 *              ordered-dithered, so the floor has pools of light and damp
 *
 * The wash is what does the real work at a distance; the other two only keep it
 * from looking like a gradient over a grid.
 */

export const CELL = 32;

export type RoomGrid = {
  cols: number;
  rows: number;
  /** 0 void, 1 floor, 2 wall */
  cells: Uint8Array;
  seed: number;
};

export const cellAt = (g: RoomGrid, cx: number, cy: number): number => {
  if (cx < 0 || cy < 0 || cx >= g.cols || cy >= g.rows) return 0;
  return g.cells[cy * g.cols + cx];
};

export const isWall = (g: RoomGrid, cx: number, cy: number) => cellAt(g, cx, cy) === 2;
export const isFloor = (g: RoomGrid, cx: number, cy: number) => cellAt(g, cx, cy) === 1;

/** A low-frequency wash on the cell lattice, bilinearly sampled, in ramp steps. */
class Wash {
  private readonly mw: number;
  private readonly mh: number;
  private readonly a: Float32Array;

  constructor(g: RoomGrid, amplitude: number) {
    this.mw = g.cols + 2;
    this.mh = g.rows + 2;
    this.a = new Float32Array(this.mw * this.mh);
    for (let j = 0; j < this.mh; j++) {
      for (let i = 0; i < this.mw; i++) {
        this.a[j * this.mw + i] = (mottle(i * 0.44, j * 0.44, (g.seed ^ 0x2b1d3f) + 7) - 0.5) * amplitude;
      }
    }
  }

  at(px: number, py: number): number {
    const gx = px / CELL;
    const gy = py / CELL;
    let i0 = Math.floor(gx);
    let j0 = Math.floor(gy);
    if (i0 < 0) i0 = 0;
    else if (i0 > this.mw - 2) i0 = this.mw - 2;
    if (j0 < 0) j0 = 0;
    else if (j0 > this.mh - 2) j0 = this.mh - 2;
    const fx = gx - i0;
    const fy = gy - j0;
    const r0 = j0 * this.mw + i0;
    const r1 = r0 + this.mw;
    const top = this.a[r0] + (this.a[r0 + 1] - this.a[r0]) * fx;
    const bot = this.a[r1] + (this.a[r1 + 1] - this.a[r1]) * fx;
    return top + (bot - top) * fy;
  }
}

/** Quantise a fractional step with the same Bayer matrix the light pass uses,
 *  so the wash and the sun agree about where a step boundary is. */
const ditherStep = (amount: number, x: number, y: number): number => {
  const fl = Math.floor(amount);
  return fl + (amount - fl > bayer(x, y) ? 1 : 0);
};

/* ------------------------------------------------------------------ floors */

const paintFloorCell = (s: Surface, g: RoomGrid, cx: number, cy: number, wash: Wash) => {
  const x0 = cx * CELL;
  const y0 = cy * CELL;
  const seed = g.seed;

  // A cell's own variant: four tiles in five sit level, the rest are a step
  // proud or a step worn. Never two identical neighbours, which is what
  // protects the seam from reading as a printed grid.
  const variant = Math.round((hf(seed ^ 0x51ed, cx, cy) - 0.45) * 2);

  // One cell in six is cut in half, so tile sizes vary along a run.
  const cut = hf(seed ^ 0x7a3, cx, cy);
  const cutH = cut > 0.93;
  const cutV = cut > 0.86 && cut <= 0.93;

  for (let j = 0; j < CELL; j++) {
    const y = y0 + j;
    for (let i = 0; i < CELL; i++) {
      const x = x0 + i;
      let step = 4 + variant;

      const seamN = j === 0 && isFloor(g, cx, cy - 1);
      const seamW = i === 0 && isFloor(g, cx - 1, cy);
      const seamCut = (cutH && j === 16) || (cutV && i === 16);
      if (seamN || seamW || seamCut) step = 4 + variant - 1;

      // Grain: two or three speckles per cell, hashed by position so no two
      // cells ever repeat (P7).
      const g1 = hf(seed, x, y);
      if (g1 > 0.977) step -= 1;
      else if (g1 < 0.009) step += 1;

      // The wash, dithered, so the floor breathes instead of marching.
      step += ditherStep(wash.at(x, y), x, y);

      const groove = seamN || seamW || seamCut;
      s.set(x, y, M_FLOOR, step, groove ? -1 : 0, 0, TAG.FLOOR);
    }
  }

  // Decals: a crack or a scatter of pebbles in about one cell in six.
  const d = hf(seed ^ 0x9e37, cx, cy);
  if (d > 0.86 && d < 0.94) {
    const ox = 4 + Math.floor(hf(seed, cx + 11, cy) * 20);
    const oy = 4 + Math.floor(hf(seed, cx, cy + 11) * 20);
    const len = 4 + Math.floor(hf(seed, cx + 3, cy + 3) * 4);
    for (let n = 0; n < len; n++) {
      const x = x0 + ox + n;
      const y = y0 + oy + (n > len / 2 ? 1 : 0);
      s.set(x, y, M_FLOOR, 2, -1, 0, TAG.FLOOR);
      if (n === 1) s.set(x, y + 1, M_FLOOR, 3, -1, 0, TAG.FLOOR);
    }
  } else if (d > 0.8) {
    const ox = 6 + Math.floor(hf(seed, cx + 7, cy + 7) * 16);
    const oy = 6 + Math.floor(hf(seed, cx + 9, cy + 2) * 16);
    s.set(x0 + ox, y0 + oy, M_FLOOR, 7, 1, 0, TAG.FLOOR);
    s.set(x0 + ox + 1, y0 + oy, M_FLOOR, 5, 1, 0, TAG.FLOOR);
    s.set(x0 + ox, y0 + oy + 1, M_FLOOR, 4, 1, 0, TAG.FLOOR);
  }
};

/* ------------------------------------------------------------------- walls */

const paintWallCell = (s: Surface, g: RoomGrid, cx: number, cy: number, wash: Wash) => {
  const x0 = cx * CELL;
  const y0 = cy * CELL;
  const seed = g.seed;

  // Coursing is staggered per cell, not per tile: a wall run must not repeat
  // its joint pattern every 32 px or the masonry reads as wallpaper.
  const rowOff = Math.floor(hf(seed ^ 0x1b7, cx, cy >> 3) * 16);
  const variant = Math.round((hf(seed ^ 0x51ed, cx + 31, cy + 17) - 0.45) * 2);
  const blockH = 8 + (Math.floor(hf(seed ^ 0x2c5, cx, cy) * 3) - 1) * 2;

  for (let j = 0; j < CELL; j++) {
    const y = y0 + j;
    const row = Math.floor(j / blockH);
    for (let i = 0; i < CELL; i++) {
      const x = x0 + i;
      let step = 5 + variant;

      // Mortar: a course line every block, joints every 16 px, staggered.
      if (j % blockH === 0) step = 4 + variant;
      else if ((i + rowOff + (row % 2) * 8) % 16 === 0) step = 4 + variant;
      else if (hf(seed, x, y) > 0.968) step = 6 + variant;

      step += ditherStep(wash.at(x, y) * 0.7, x, y);

      // A block is a plate: its lip catches the sun, and the normal pass turns
      // that into a bevel. Height is per course, so a seven-block wall has
      // seven shelves for the light to rake over.
      const lip = j % blockH === 1 || (i + rowOff + (row % 2) * 8) % 16 === 1;
      s.set(x, y, M_WALL, step, lip ? 3 : 2, lip ? 26 : 8, TAG.WALL);
    }
  }

  const north = !isWall(g, cx, cy - 1) && !isWall(g, cx, cy - 2);
  const south = !isWall(g, cx, cy + 1);
  const west = !isWall(g, cx - 1, cy);
  const east = !isWall(g, cx + 1, cy);

  // Cap: the 1 px lip on the north edge is what the normal pass picks up. It is
  // the whole reason a top-down wall reads as raised (P3 rule 3).
  if (north) {
    for (let i = 0; i < CELL; i++) {
      s.set(x0 + i, y0, M_WALL, 10, 3, 24, TAG.WALL);
      s.set(x0 + i, y0 + 1, M_WALL, 8, 3, 16, TAG.WALL);
    }
  }

  // Outline, drawn on the wall's own edge where it faces open space.
  if (north) for (let i = 0; i < CELL; i++) s.set(x0 + i, y0, M_INK, 0, 3, 0, TAG.WALL);
  if (west) for (let j = 0; j < CELL; j++) s.set(x0, y0 + j, M_INK, 0, 2, 0, TAG.WALL);
  if (east) for (let j = 0; j < CELL; j++) s.set(x0 + CELL - 1, y0 + j, M_INK, 0, 2, 0, TAG.WALL);
  if (south) for (let i = 0; i < CELL; i++) s.set(x0 + i, y0 + CELL - 1, M_INK, 0, 2, 0, TAG.WALL);

  // Shadow: a hard 2–3 px band on the floor to the south. Straight down, no
  // blur, no dither — it is a shape, not a gradient (P3 rule 4, P13).
  if (south && isFloor(g, cx, cy + 1)) {
    for (let i = 0; i < CELL; i++) {
      s.set(x0 + i, y0 + CELL, M_FLOOR, 2, -1, 0, TAG.FLOOR);
      s.set(x0 + i, y0 + CELL + 1, M_FLOOR, 3, 0, 0, TAG.FLOOR);
      s.set(x0 + i, y0 + CELL + 2, M_FLOOR, 4, 0, 0, TAG.FLOOR);
    }
  }
  if (west && isFloor(g, cx - 1, cy)) {
    for (let j = 2; j < CELL; j++) s.set(x0 - 1, y0 + j, M_FLOOR, 3, 0, 0, TAG.FLOOR);
  }
};

/* -------------------------------------------------------------------- api */

export function paintRoom(s: Surface, g: RoomGrid) {
  const wash = new Wash(g, 2.6);

  for (let cy = 0; cy < g.rows; cy++) {
    for (let cx = 0; cx < g.cols; cx++) {
      if (cellAt(g, cx, cy) === 1) paintFloorCell(s, g, cx, cy, wash);
    }
  }
  // Walls after floors so the shadow band can land on already-painted floor.
  for (let cy = 0; cy < g.rows; cy++) {
    for (let cx = 0; cx < g.cols; cx++) {
      if (cellAt(g, cx, cy) === 2) paintWallCell(s, g, cx, cy, wash);
    }
  }
}
