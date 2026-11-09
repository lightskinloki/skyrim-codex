import { FACE, M_FLOOR, M_INK, M_WALL, RAMP_LEN, Surface, TAG } from './surface';
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
  /** What the floor is made of, one entry per cell, indexing `GROUND_KINDS`.
   *  Absent means stone, which is every room before the village. */
  ground?: Uint8Array;
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

const paintFloorCell = (s: Surface, g: RoomGrid, cx: number, cy: number, wash: Wash, margin: number) => {
  const x0 = cx * CELL;
  const y0 = margin + cy * CELL;
  const seed = g.seed;

  // A cell's own variant: six tiles in seven sit level, the rest are a step
  // proud or a step worn. A broader spread turns the floor into a quilt of
  // 32 px squares — the grid is already drawn, so the tiles do not have to
  // shout it as well.
  const v = hf(seed ^ 0x51ed, cx, cy);
  const variant = v > 0.87 ? 1 : v < 0.07 ? -1 : 0;

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
      // The grid is a drawn line, not a bevel, and it is the *same* line from
      // tile to tile: keying the joint to each cell's own variant broke it into
      // dashes wherever two neighbours differed, which reads as a patchwork
      // rather than as flagstones. A groove with real height is worse still —
      // it makes every cell a raised tile, and a turn of the sun exposes it.
      if (seamN || seamW || seamCut) step = 3;

      // Grain: two or three speckles per cell, hashed by position so no two
      // cells ever repeat (P7).
      const g1 = hf(seed, x, y);
      if (g1 > 0.977) step -= 1;
      else if (g1 < 0.009) step += 1;

      // The wash, dithered, so the floor breathes instead of marching.
      step += ditherStep(wash.at(x, y), x, y);

      s.set(x, y, M_FLOOR, step, seamN || seamW || seamCut ? -1 : 0, 0, TAG.FLOOR);
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

/**
 * A wall is a block with height, projected obliquely. Three surfaces are
 * visible: the top (a full cell, displaced up by WALL_H and right by
 * WALL_SLANT), the south face (WALL_H tall, sheared to meet the top) and the
 * west side (a narrow parallelogram, lit because the sun is in the north-west).
 * The north and east faces are behind the block and never drawn.
 *
 * The first pass painted a wall *texture* inside the flat cell, which reads as
 * a floor plan with dark rugs on it. The second pass built the block but gave
 * every cell its own bevelled slab, so a run of wall read as a row of tiles and
 * the top was the same gramar as the floor. This pass does the opposite:
 *
 *   - the top is continuous brickwork in absolute coordinates, with a joint
 *     pattern shared by every cell in the run and a silhouette only on the
 *     edges that actually end over floor;
 *   - the face is one masonry plane per run, its courses also absolute, so
 *     no two cells meet at a seam;
 *   - the cap and the face are separated by a real coping, and the face meets
 *     the floor at an ink base line and a dithered contact shadow.
 *
 * Every value here is an authored ramp step; the light pass adds the sun.
 */

export const WALL_H = 36;
export const WALL_SLANT = 8;
export const TOP_MARGIN = WALL_H + 4;
/** The cap overhangs the last cell by WALL_SLANT and its ink edge by one more. */
export const RIGHT_MARGIN = WALL_SLANT + 2;
/** Room below the last cell for the contact shadow. */
export const BOTTOM_MARGIN = 16;

/** Darken a floor pixel by `drop` steps, keeping the grain and the wash it
 *  already has — a flat stamped band is worse than no shadow at all. */
const wearFloor = (s: Surface, x: number, y: number, drop: number) => {
  const i = y * s.w + x;
  if (s.tag[i] !== TAG.FLOOR) return;
  s.set(x, y, M_FLOOR, Math.max(0, s.idx[i] - drop), s.height[i], s.spec[i], TAG.FLOOR);
};

/** The top: one continuous run of brickwork, not a tile with a border. */
const paintWallCap = (
  s: Surface,
  g: RoomGrid,
  cx: number,
  cy: number,
  wash: Wash,
  capX: number,
  capY: number,
) => {
  const seed = g.seed;
  const north = !isWall(g, cx, cy - 1);
  const west = !isWall(g, cx - 1, cy);
  const east = !isWall(g, cx + 1, cy);
  const south = !isWall(g, cx, cy + 1);

  for (let j = 0; j < CELL; j++) {
    const y = capY + j;
    // 8 x 4 bricks, running bond, keyed to the board rather than the cell, so
    // the courses cross cell boundaries without a break.
    const course = (y + 4096) >> 2;
    const stagger = (course & 1) * 4;
    for (let i = 0; i < CELL; i++) {
      const x = capX + i;
      const bx = (x + 4096 + stagger) & 7;
      const by = (y + 4096) & 3;
      let step = 6;
      if (by === 3) step = 3; // horizontal joint
      else if (bx === 7) step = 2; // vertical joint
      else {
        const n = hf(seed ^ 0x3c1f, x, y);
        if (n > 0.97) step += 1;
        else if (n < 0.015) step -= 1;
        step += ditherStep(wash.at(x, y) * 0.5, x, y);
      }

      // The rim of the top: the west arris is the sun side, the east is the
      // far side, and the north edge is the lip the eye reads as height.
      if (west && i === 0) step = 8;
      else if (west && i === 1) step = 6;
      if (east && i === CELL - 1) step = 2;
      else if (east && i === CELL - 2) step = 3;
      if (north && j === 0) step = 6;
      else if (north && j === 1) step = 5;

      // The far edge of the top meets the face: a groove, so the copng reads
      // as standing proud of both planes. Hidden inside a thick wall, where
      // the next cell's top starts, so only exposed south edges get it.
      if (south && j === CELL - 1) step = 2;

      s.set(x, y, M_WALL, step, 12, 8, TAG.WALL);
    }
  }

  // Silhouette. One ink line is the whole difference between a raised block
  // and a stain on the floor.
  if (north) for (let i = 0; i < CELL; i++) s.set(capX + i, capY - 1, M_INK, 0, 12, 0, TAG.WALL);
  if (west) for (let j = 0; j < CELL; j++) s.set(capX - 1, capY + j, M_INK, 0, 12, 0, TAG.WALL);
  if (east) for (let j = 0; j < CELL; j++) s.set(capX + CELL, capY + j, M_INK, 0, 12, 0, TAG.WALL);
};

/**
 * The south face. Courses of six pixels, running bond, sheared so the top row
 * sits WALL_SLANT to the right of the bottom one — the same lean as the cap.
 * The coping is the two lit rows at the top; the shadow under it is what makes
 * the plane turn away from the sky.
 */
const paintWallFace = (
  s: Surface,
  g: RoomGrid,
  cx: number,
  cy: number,
  x0: number,
  faceY: number,
  west: boolean,
  east: boolean,
) => {
  const seed = g.seed;
  const COURSE = 6;
  const maxStep = RAMP_LEN[M_WALL] - 1;

  for (let j = 0; j < WALL_H; j++) {
    const y = faceY + j;
    const off = Math.round((WALL_SLANT * (WALL_H - 1 - j)) / (WALL_H - 1));
    const start = x0 + off;
    const band = j - 3;
    const course = Math.floor(band / COURSE);
    const jointH = band >= 0 && band % COURSE === COURSE - 1;

    for (let i = 0; i < CELL; i++) {
      const x = start + i;
      const jointV = band >= 0 && (x + (course & 1) * 6) % 12 === 0;
      let step = 8;

      if (jointH || jointV) step = 5;
      else if (hf(seed ^ 0x6a1d, x, y) > 0.96) step += 1;

      if (j === 0) step = 11; // coping, catching the sky
      else if (j === 1) step = 9;
      else if (j === 2) step = 3; // the shadow the coping throws down
      else if (band % COURSE === 0) step = Math.min(maxStep, step + 1);
      else if (j > WALL_H - 4) step = Math.max(0, step - 1);

      // Only a run's *ends* turn away. Doing this per cell drew a black
      // stripe every 32 px down an unbroken wall, which reads as a fence of
      // separate blocks rather than as one masonry plane.
      if (west && i === 0) step = 1;
      else if (east && i === CELL - 1) step = 2;

      s.set(x, y, M_WALL, step, j < 2 ? 12 : 4, j < 2 ? 16 : 4, TAG.WALL);
      if (j >= 2) s.setFace(x, y, FACE.SOUTH);
    }
  }

  // A hard base line at the foot of the face; the floor below carries the
  // contact shadow, so the block is planted rather than floating.
  for (let i = 0; i < CELL; i++) s.set(x0 + i, faceY + WALL_H - 1, M_INK, 0, 2, 0, TAG.WALL);
};

/** The west side: a narrow parallelogram, from the base edge up to the top. */
const paintWallWest = (s: Surface, g: RoomGrid, cx: number, cy: number, x0: number, y0: number) => {
  const seed = g.seed;

  for (let i = 0; i < WALL_SLANT; i++) {
    const x = x0 + i;
    const shift = Math.round((WALL_H * i) / WALL_SLANT);
    const yTop = y0 - shift;
    const yBottom = y0 + CELL - shift;
    for (let y = yTop; y < yBottom; y++) {
      const joint = (y + 4096) % 6 === 5;
      let step = 6;
      if (joint) step = 2;
      else if (hf(seed ^ 0x2d91, x, y) > 0.96) step = 7;
      // The outer column is the silhouette; the inner one hands over to the
      // cap, one px of lighter stone.
      if (i === 0) step = 2;
      else if (i === WALL_SLANT - 1) step = 7;
      s.set(x, y, M_WALL, step, 4, 3, TAG.WALL);
      s.setFace(x, y, FACE.WEST);
    }
  }
};

const paintWallCell = (s: Surface, g: RoomGrid, cx: number, cy: number, wash: Wash, margin: number) => {
  const x0 = cx * CELL;
  const y0 = margin + cy * CELL;
  const south = !isWall(g, cx, cy + 1);
  const west = !isWall(g, cx - 1, cy);

  // The top is always drawn: it is what occludes the floor behind the wall.
  paintWallCap(s, g, cx, cy, wash, x0 + WALL_SLANT, y0 - WALL_H);
  // Sides before the face, so the face's sheared edge covers the part of the
  // side that has turned out of view.
  if (west) paintWallWest(s, g, cx, cy, x0, y0);
  if (south) paintWallFace(s, g, cx, cy, x0, y0 + CELL - WALL_H, west, !isWall(g, cx + 1, cy));

  // Contact shadow on the playable floor, as geometry: hard rows at the base,
  // two dithered rows at the edge, no blur.
  if (south && isFloor(g, cx, cy + 1)) {
    for (let i = 0; i < CELL; i++) {
      wearFloor(s, x0 + i, y0 + CELL, 7);
      wearFloor(s, x0 + i, y0 + CELL + 1, 6);
      wearFloor(s, x0 + i, y0 + CELL + 2, 4);
      if (hf(g.seed, x0 + i, cy + 3) > 0.3) wearFloor(s, x0 + i, y0 + CELL + 3, 3);
      if (hf(g.seed, x0 + i, cy + 5) > 0.55) wearFloor(s, x0 + i, y0 + CELL + 4, 2);
    }
  }
  if (west && isFloor(g, cx - 1, cy)) {
    for (let j = 3; j < CELL - 3; j++) {
      wearFloor(s, x0 - 1, y0 + j, 5);
      if (hf(g.seed, x0 - 2, y0 + j) > 0.4) wearFloor(s, x0 - 2, y0 + j, 3);
    }
  }

  // Every pixel of the block now knows where the block's own foot is, so a
  // barrel or a body standing behind it can be tested against it cheaply.
  s.markFront(x0 - 1, y0 - WALL_H - 1, CELL + WALL_SLANT + 2, WALL_H + CELL + 2, y0 + CELL, TAG.WALL);
};

/* -------------------------------------------------------------------- api */

export function paintRoom(s: Surface, g: RoomGrid, margin = TOP_MARGIN) {
  // Enough wash to pool the light, not enough to paint a quilt: the relief and
  // the torchlight already carry the large-scale variation.
  const wash = new Wash(g, 1.15);

  for (let cy = 0; cy < g.rows; cy++) {
    for (let cx = 0; cx < g.cols; cx++) {
      if (cellAt(g, cx, cy) === 1) paintFloorCell(s, g, cx, cy, wash, margin);
    }
  }
  // Walls after floors so the shadow band can land on already-painted floor.
  // Back to front: north to south, and east to west because the camera is on
  // the west side of the block — the west face is the one that turns toward us.
  for (let cy = 0; cy < g.rows; cy++) {
    for (let cx = g.cols - 1; cx >= 0; cx--) {
      if (cellAt(g, cx, cy) === 2) paintWallCell(s, g, cx, cy, wash, margin);
    }
  }
}
