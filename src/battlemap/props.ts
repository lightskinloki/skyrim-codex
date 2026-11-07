import {
  FACE,
  M_CLOTH_NAVY,
  M_CLOTH_RED,
  M_FIRE,
  M_METAL,
  M_STONE_PROP,
  M_WOOD_PROP,
  Mask,
  Surface,
  TAG,
  maskEllipse,
  maskRect,
  makeMask,
} from './surface';
import { CELL } from './paint';
import { h32, hf } from './rng';
import { toCameraRect } from './camera';

/**
 * Props are **solids on the floor**, not sprites.
 * See docs/BATTLEMAP-SPEC.md §12.
 *
 * A prop is a footprint — a rectangle in room space, in cells — plus a height in
 * pixels. Rendering it is a projection, not a placement:
 *
 *   1. the footprint is rotated by the camera transform (exact, whole pixels);
 *   2. the near half of its top plane is drawn, lifted by `height` (the same
 *      oblique projection the walls use: footprint, then a face of `height`);
 *   3. the vertical face is *extruded from the silhouette itself*, column by
 *      column, so a round barrel gets a round side and a table gets legs with
 *      the floor showing between them.
 *
 * The consequence is the one that matters: a prop's position is a function of
 * its footprint and nothing else. There is no offset to get wrong, no sprite to
 * rotate about the wrong origin, and no way for an object to move when the
 * camera turns — it can only be seen from a different side.
 *
 * `at` is therefore the footprint's **north-west corner**, in cells. Keep it on
 * an eighth of a cell (4 px) and every projection lands on whole pixels.
 */

/**
 * `at` is the north-west corner of the footprint. `y` is the height of the
 * surface the prop stands on and defaults to whatever deck is under it, so a
 * crate on a gallery sits on the gallery without being told.
 */
type PropBase = { at: [number, number]; y?: number };

export type PropRule = PropBase &
  (
    | { rule: 'table'; w?: number }
    | { rule: 'bench'; w?: number }
    | { rule: 'chest'; w?: number; bands?: number }
    | { rule: 'crate' }
    | { rule: 'barrel' }
    | { rule: 'shelf'; w?: number }
    | { rule: 'rubble'; size?: number }
    | { rule: 'brazier'; lit?: boolean }
    | { rule: 'rug'; w?: number; h?: number; navy?: boolean }
    | { rule: 'column'; h?: number }
    /** Rises from its own deck to `rise` above it. Steps are real, and each one
     *  is a surface a token can stand on. */
    | { rule: 'stairs'; w?: number; rise: number; run?: number; along?: 'x' | 'z'; dir?: -1 | 1 }
  );

/* ------------------------------------------------------------------ steps */
// Authored a few steps below the lit value: the sun adds ~3.7 steps at noon, so
// these land in the middle of the ramp rather than in its mud.
const WOOD_BODY = 5;
const WOOD_LIP = 8;
const WOOD_SEAM = 4;
const WOOD_DARK = 3;
const WOOD_EDGE = 6;

const EMPTY = 255;

type SideFn = (i: number, d: number, mw: number, h: number) => number;

type Art = {
  cellsX: number;
  cellsY: number;
  height: number;
  mat: number;
  top: Mask;
  /** A vertical-face pixel: column `i`, depth `d` (1 at the top of the face). */
  side: SideFn;
  spec?: number;
  flat?: boolean;
  outline?: boolean;
  /** Emissive overlay, positioned from the top plane's own origin. */
  fire?: { mask: Mask; dx: number; dy: number };
  light?: { radius: number; intensity: number; flicker: number };
};

/* ------------------------------------------------------------------- tops */
/** Sawn boards: long joints, a far lip catching the sky, a dark near edge, and
 *  a grain speckle hashed by position so two tables are not the same table. */
const plankTop = (mw: number, mh: number, joints: number[], seed: number): Mask => {
  const m = makeMask(mw, mh);
  maskRect(m, 0, 0, mw, mh, WOOD_BODY);
  for (const y of joints) maskRect(m, 0, y, mw, 1, WOOD_SEAM);
  maskRect(m, 0, 0, mw, 1, WOOD_EDGE);
  maskRect(m, 0, mh - 1, mw, 1, WOOD_DARK);
  for (let y = 1; y < mh - 1; y++) {
    for (let x = 0; x < mw; x++) {
      const n = hf(seed, x, y);
      if (n > 0.986) m.data[y * mw + x] = 6;
      else if (n < 0.014) m.data[y * mw + x] = WOOD_SEAM;
    }
  }
  return m;
};

const tableTop = (mw: number, mh: number, seed: number): Mask => {
  const m = plankTop(mw, mh, [Math.round(mh * 0.36), Math.round(mh * 0.68)], seed);
  // Breadboard ends: the grain turns at each end of a good table.
  maskRect(m, 0, 0, 3, mh, 7);
  maskRect(m, mw - 3, 0, 3, mh, 7);
  maskRect(m, 3, 0, 1, mh, WOOD_SEAM);
  maskRect(m, mw - 4, 0, 1, mh, WOOD_SEAM);
  return m;
};

const benchTop = (mw: number, mh: number, seed: number): Mask => {
  const m = plankTop(mw, mh, [Math.round(mh * 0.5)], seed);
  maskRect(m, 0, 0, mw, 2, WOOD_EDGE);
  return m;
};

const chestTop = (mw: number, mh: number, bands: number): Mask => {
  const m = makeMask(mw, mh);
  maskRect(m, 0, 0, mw, mh, WOOD_BODY);
  maskRect(m, 0, 0, mw, 1, 7);
  maskRect(m, 0, mh - 1, mw, 1, WOOD_DARK);
  // Strap irons. Wood has no steel step, so the band is the ramp's floor — the
  // same trick the old chest used, and it still reads as iron against oak.
  for (let b = 0; b < bands; b++) {
    const x = Math.round(((b + 0.5) * mw) / bands) - 1;
    maskRect(m, x, 0, 2, mh, 0);
  }
  maskRect(m, 0, 0, mw, 1, 7);
  return m;
};

const crateTop = (mw: number, mh: number, seed: number): Mask => {
  const m = makeMask(mw, mh);
  maskRect(m, 0, 0, mw, mh, WOOD_BODY);
  maskRect(m, 0, 0, mw, 2, WOOD_EDGE);
  maskRect(m, 0, mh - 2, mw, 2, WOOD_DARK);
  // Lid boards, running north-south.
  for (let x = 6; x < mw - 3; x += 7) maskRect(m, x, 2, 1, mh - 4, WOOD_SEAM);
  for (let y = 2; y < mh - 2; y++) {
    for (let x = 0; x < mw; x++) {
      if (hf(seed, x, y) > 0.975) m.data[y * mw + x] = 6;
    }
  }
  return m;
};

const barrelTop = (): Mask => {
  const mw = 24;
  const mh = 24;
  const m = makeMask(mw, mh);
  maskEllipse(m, mw / 2, mh / 2, 12, 12, WOOD_BODY);
  for (let x = 3; x < mw - 2; x += 4) maskRect(m, x, 0, 1, mh, WOOD_SEAM);
  // The iron hoop, read from above as an inset ring.
  maskEllipse(m, mw / 2, mh / 2, 10, 10, WOOD_DARK);
  maskEllipse(m, mw / 2, mh / 2, 9, 9, WOOD_BODY);
  maskEllipse(m, mw / 2, mh / 2, 3, 3, WOOD_DARK);
  maskEllipse(m, mw / 2, mh / 2 - 1, 7, 7, 6);
  return m;
};

const shelfTop = (mw: number, mh: number): Mask => {
  const m = makeMask(mw, mh);
  maskRect(m, 0, 0, mw, mh, WOOD_BODY);
  maskRect(m, 0, 0, mw, 1, WOOD_LIP);
  maskRect(m, 0, mh - 1, mw, 1, WOOD_DARK);
  maskRect(m, 0, 0, 1, mh, WOOD_EDGE);
  maskRect(m, mw - 1, 0, 1, mh, WOOD_DARK);
  return m;
};

const brazierTop = (mw: number, mh: number): Mask => {
  const m = makeMask(mw, mh);
  const cx = mw / 2;
  const cy = mh / 2;
  maskEllipse(m, cx, cy, mw * 0.46, mh * 0.46, 6);
  maskEllipse(m, cx, cy, mw * 0.38, mh * 0.38, 2);
  maskEllipse(m, cx - 1, cy - 1, mw * 0.3, mh * 0.3, 3);
  return m;
};

const brazierFire = (mw: number, mh: number): Mask => {
  const m = makeMask(mw, mh);
  const cx = mw / 2;
  // Embers in the bowl.
  maskEllipse(m, cx, mh - 4, mw * 0.26, 3, 5);
  maskEllipse(m, cx, mh - 4, mw * 0.16, 2, 8);
  // A flame: narrow at the root, a notch at the tip so it reads as fire rather
  // than as a candle. Two licks, one taller than the other.
  for (let j = 0; j < mh - 6; j++) {
    const t = j / (mh - 6);
    const w = Math.max(1, Math.round(4.2 * (1 - t) * (1 - t) + 0.6));
    const wob = Math.round(Math.sin(t * 5.2) * 0.9);
    for (let i = -w; i <= w; i++) {
      const x = Math.round(cx + i + wob);
      const y = j;
      if (x < 0 || y < 0 || x >= mw || y >= mh) continue;
      const d = Math.abs(i) / Math.max(1, w);
      const idx = d > 0.66 ? 4 : d > 0.3 ? 7 : 9;
      m.data[y * mw + x] = Math.min(m.data[y * mw + x], idx);
    }
  }
  return m;
};

const columnTop = (mw: number, mh: number): Mask => {
  const m = makeMask(mw, mh);
  const cx = mw / 2;
  const cy = mh / 2;
  // A capital, not a well. The rings differ by one step at most: a deep ring
  // around a deep ring reads as an opening, and a column is not a hole.
  maskEllipse(m, cx, cy, mw * 0.47, mh * 0.47, 8);
  maskEllipse(m, cx, cy, mw * 0.43, mh * 0.43, 6);
  maskEllipse(m, cx - 1, cy - 1, mw * 0.36, mh * 0.36, 7);
  maskEllipse(m, cx - 1, cy - 1, mw * 0.3, mh * 0.3, 5);
  // Chisel marks across the top, hashed so a colonnade is not a row of stamps.
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.4;
    const x = Math.round(cx + Math.cos(a) * mw * 0.36);
    const y = Math.round(cy + Math.sin(a) * mh * 0.36);
    maskRect(m, x, y, 2, 1, 6);
  }
  return m;
};

const rubbleTop = (size: number, seed: number): Mask => {
  const cells = 0.5 + size * 0.125;
  const mw = Math.round(cells * CELL);
  const mh = Math.round(cells * CELL);
  const m = makeMask(mw, mh);
  for (let k = 0; k < 3 + size; k++) {
    const cx = 3 + hf(seed, k, 1) * (mw - 6);
    const cy = 3 + hf(seed, k, 2) * (mh - 6);
    const r = 2 + hf(seed, k, 3) * (mw * 0.2);
    maskEllipse(m, cx, cy, r, r * 0.82, k === 0 ? 6 : 4);
    maskEllipse(m, cx, cy - 1, r * 0.55, r * 0.4, 8);
  }
  return m;
};

const rugTop = (mw: number, mh: number, navy: boolean): Mask => {
  const m = makeMask(mw, mh);
  maskRect(m, 0, 0, mw, mh, 3);
  maskRect(m, 1, 1, mw - 2, mh - 2, navy ? 4 : 5);
  maskRect(m, 3, 3, mw - 6, mh - 6, 2);
  maskRect(m, 5, 5, mw - 10, mh - 10, navy ? 6 : 4);
  for (let x = 7; x < mw - 7; x += 6) maskRect(m, x, 6, 1, mh - 12, 6);
  maskRect(m, 0, 0, mw, 1, 2);
  maskRect(m, 0, mh - 1, mw, 1, 2);
  return m;
};

/* ------------------------------------------------------------------ sides */
const flatSide: SideFn = () => EMPTY;

// A vertical face loses ~2.4 ramp steps under a high sun before any detail is
// read at all, so prop faces are authored three steps above the top plane. Get
// this wrong and every solid is a dark hole with a lit lid.
const tableSide: SideFn = (i, d, mw) => {
  if (d <= 3) return d === 1 ? 9 : d === 2 ? 8 : 7;
  // Legs. Inset from the ends, with the floor visible between them.
  if (i < 5 || i >= mw - 5) return d >= 13 ? 6 : 7;
  return EMPTY;
};

const benchSide: SideFn = (i, d, mw) => {
  if (d <= 2) return d === 1 ? 9 : 8;
  if (i < 6 || i >= mw - 6) return d >= 9 ? 6 : 7;
  return EMPTY;
};

const chestSide = (bands: number): SideFn => {
  return (i, d, mw, h) => {
    if (d === 1) return 10;
    for (let b = 0; b < bands; b++) {
      const x = Math.round(((b + 0.5) * mw) / bands) - 1;
      if (Math.abs(i - x) < 1.5) return 3;
    }
    if (d === Math.round(h * 0.42)) return 7;
    return d >= h - 1 ? 5 : 8;
  };
};

const crateSide: SideFn = (i, d, mw, h) => {
  if (d === 1) return 10;
  const brace = Math.round((i / Math.max(1, mw - 1)) * h);
  if (Math.abs(d - brace) < 2 || Math.abs(d - (h - brace)) < 2) return 7;
  return d >= h - 1 ? 5 : 8;
};

const barrelSide: SideFn = (i, d, mw, h) => {
  // Iron hoops at the same heights the staves carry them.
  if (d === 3 || d === h - 3) return 7;
  if (d === 1) return 10;
  if (d >= h - 1) return 5;
  // A cylinder: the middle of the face squares to the camera, the edges turn.
  const t = Math.abs((i / Math.max(1, mw - 1)) * 2 - 1);
  if (t > 0.82) return 6;
  if (t < 0.35) return 9;
  return 8;
};

const shelfSide: SideFn = (i, d, mw, h) => {
  if (d === 1) return 10;
  const board = Math.round(h / 3);
  // Boards are lit edges; the recesses behind them are the darkest thing in the
  // piece, which is what makes a case read as open shelves and not as a chest.
  if (d === board || d === board * 2) return 9;
  if (d === board + 1 || d === board * 2 + 1) return 2;
  if (d === 2) return 2;
  const block = Math.floor(i / 3);
  if (i % 3 === 2) return 3;
  return hf(17, block, Math.floor(d / 6)) > 0.45 ? 9 : 7;
};

const brazierSide: SideFn = (i, d, mw, h) => {
  const cx = (mw - 1) / 2;
  // Taper from the bowl's width to a foot: a bowl on a stand, not a bucket.
  const inset = (d / h) * (mw * 0.34);
  if (Math.abs(i - cx) > mw / 2 - inset) return EMPTY;
  if (d === 1) return 10;
  if (d === 2) return 9;
  if (d >= h - 2) return 4;
  return 7;
};

const columnSide: SideFn = (i, d, mw, h) => {
  const inset = d > h - 4 ? 1 : 0;
  if (i < inset || i >= mw - inset) return EMPTY;
  if (d === 1) return 10;
  if (d >= h - 2) return 5;
  const flute = i % 5;
  if (flute === 0) return 6;
  if (flute === 2) return 9;
  return 8;
};

const rubbleSide: SideFn = (_i, d, _mw, h) => (d === 1 ? 9 : d >= h - 1 ? 5 : 7);

/* -------------------------------------------------------------------- art */
const artOf = (p: PropRule, seed: number): Art => {
  const id = h32(seed, Math.round(p.at[0] * 8), Math.round(p.at[1] * 8));

  switch (p.rule) {
    case 'table': {
      const w = p.w ?? 1;
      // Three quarters of a cell deep: a real table is about 3 ft across, and a
      // full cell of depth turns it into a desk with an absurd top.
      const deep = Math.round(CELL * 0.75);
      return {
        cellsX: w,
        cellsY: 0.75,
        height: 15,
        mat: M_WOOD_PROP,
        top: tableTop(w * CELL, deep, id),
        side: tableSide,
        spec: 6,
      };
    }
    case 'bench': {
      const w = p.w ?? 1;
      return {
        cellsX: w,
        cellsY: 0.5,
        height: 10,
        mat: M_WOOD_PROP,
        top: benchTop(w * CELL, CELL / 2, id),
        side: benchSide,
        spec: 6,
      };
    }
    case 'chest': {
      const w = p.w ?? 1;
      const bands = p.bands ?? 2;
      return {
        cellsX: w,
        cellsY: 0.5,
        height: 13,
        mat: M_WOOD_PROP,
        top: chestTop(w * CELL, CELL / 2, bands),
        side: chestSide(bands),
        spec: 18,
      };
    }
    case 'crate':
      return {
        cellsX: 0.75,
        cellsY: 0.75,
        height: 20,
        mat: M_WOOD_PROP,
        top: crateTop(24, 24, id),
        side: crateSide,
        spec: 8,
      };
    case 'barrel':
      return {
        cellsX: 0.75,
        cellsY: 0.75,
        height: 21,
        mat: M_WOOD_PROP,
        top: barrelTop(),
        side: barrelSide,
        spec: 12,
      };
    case 'shelf': {
      const w = p.w ?? 1;
      return {
        cellsX: w,
        cellsY: 0.5,
        height: 30,
        mat: M_WOOD_PROP,
        top: shelfTop(w * CELL, CELL / 2),
        side: shelfSide,
        spec: 6,
      };
    }
    case 'brazier': {
      const lit = !!p.lit;
      const fire = brazierFire(20, 26);
      return {
        cellsX: 0.625,
        cellsY: 0.625,
        height: 11,
        mat: M_METAL,
        top: brazierTop(20, 20),
        side: brazierSide,
        spec: 26,
        fire: lit ? { mask: fire, dx: 0, dy: -14 } : undefined,
        light: lit ? { radius: 4.6 * CELL, intensity: 3.0, flicker: 0.5 } : undefined,
      };
    }
    case 'column':
      return {
        cellsX: 1,
        cellsY: 1,
        height: 30,
        mat: M_STONE_PROP,
        top: columnTop(CELL, CELL),
        side: columnSide,
        spec: 10,
      };
    // The flat board has no height, so it flattens a stair into a raised block.
    // The 3D scene builds the real steps (gl/scene.ts); this is only what the
    // legacy contact sheets need to stay type-correct.
    case 'stairs':
      return {
        cellsX: p.w ?? 1.5,
        cellsY: p.run ?? 2,
        height: Math.round(p.rise * CELL * 0.7),
        mat: M_STONE_PROP,
        top: rubbleTop(3, id),
        side: rubbleSide,
        spec: 6,
      };
    case 'rubble': {
      const size = p.size ?? 2;
      const cells = 0.5 + size * 0.125;
      return {
        cellsX: cells,
        cellsY: cells,
        height: 5,
        mat: M_STONE_PROP,
        top: rubbleTop(size, id),
        side: rubbleSide,
        spec: 8,
      };
    }
    case 'rug': {
      const w = p.w ?? 2;
      const h = p.h ?? 2;
      const navy = !!p.navy;
      return {
        cellsX: w,
        cellsY: h,
        height: 0,
        mat: navy ? M_CLOTH_NAVY : M_CLOTH_RED,
        top: rugTop(w * CELL, h * CELL, navy),
        side: flatSide,
        spec: 2,
        flat: true,
        outline: false,
      };
    }
  }
};

/* --------------------------------------------------------------- geometry */
/** 90° clockwise, exactly: pixel art can turn without resampling. */
const rotMask = (m: Mask): Mask => {
  const out = makeMask(m.h, m.w);
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      out.data[x * out.w + (m.h - 1 - y)] = m.data[y * m.w + x];
    }
  }
  return out;
};

/**
 * Lift the top plane by `height` and hang a face under every column of the
 * silhouette. A column's face starts at that column's own near edge, which is
 * what makes a round top read as a cylinder and a straight one as a box.
 */
const extrude = (top: Mask, height: number, side: SideFn) => {
  const mw = top.w;
  const mh = top.h + height;
  const mask = makeMask(mw, mh);
  const isSide = new Uint8Array(mw * mh);
  let base = -1;

  for (let i = 0; i < mw; i++) {
    let jmax = -1;
    for (let j = 0; j < top.h; j++) if (top.data[j * mw + i] !== EMPTY) jmax = j;
    if (jmax < 0) continue;
    if (jmax > base) base = jmax;
    for (let d = 1; d <= height; d++) {
      const j = jmax + d;
      if (j >= mh) break;
      const v = side(i, d, mw, height);
      if (v === EMPTY) continue;
      mask.data[j * mw + i] = v;
      isSide[j * mw + i] = 1;
    }
  }

  for (let j = 0; j < top.h; j++) {
    for (let i = 0; i < mw; i++) {
      const v = top.data[j * mw + i];
      if (v !== EMPTY) mask.data[j * mw + i] = v;
    }
  }

  return { mask, isSide, base: Math.max(0, base) };
};

export type PlacedProp = {
  art: Art;
  /** Top-left of the top plane, in board pixels (already lifted by height). */
  sx: number;
  sy: number;
  /** Footprint's south edge in board pixels — the depth test. */
  front: number;
  mask: Mask;
  isSide: Uint8Array;
  /** Cells the top plane spans, after the turn. */
  cellsX: number;
  cellsY: number;
};

export type PropLight = { x: number; y: number; radius: number; intensity: number; flicker: number };

/**
 * Project a prop into the camera's frame. The footprint is rotated *as a
 * rectangle*, then the silhouette is turned to match — the face is always
 * extruded toward the camera afterwards, never rotated with the piece.
 */
export function placeProp(
  p: PropRule,
  seed: number,
  margin: number,
  yaw: number,
  cols: number,
  rows: number,
): PlacedProp {
  const art = artOf(p, seed);
  const turns = yaw & 3;

  let top = art.top;
  for (let k = 0; k < turns; k++) top = rotMask(top);

  const r = toCameraRect(p.at[0], p.at[1], p.at[0] + art.cellsX, p.at[1] + art.cellsY, cols, rows, yaw);
  const sx = Math.round(r.x * CELL);
  const sy = margin + Math.round(r.y * CELL);
  const { mask, isSide, base } = extrude(top, art.height, art.side);

  return {
    art,
    sx,
    sy: sy - art.height,
    front: art.flat ? 0 : sy + base,
    mask,
    isSide,
    cellsX: turns & 1 ? art.cellsY : art.cellsX,
    cellsY: turns & 1 ? art.cellsX : art.cellsY,
  };
}

/** Darken a floor pixel by `drop` steps, keeping the grain it already has. */
const wearFloor = (s: Surface, x: number, y: number, drop: number) => {
  if (!s.inBounds(x, y)) return;
  const k = y * s.w + x;
  if (s.tag[k] !== TAG.FLOOR) return;
  s.idx[k] = Math.max(0, s.idx[k] - drop);
};

/** A hard contact shadow at the foot of a solid, dithered at its edge: the same
 *  device the walls use, and the reason a prop sits in the room instead of
 *  hovering over it. */
const contactShadow = (s: Surface, q: PlacedProp, seed: number) => {
  if (q.art.flat) return;
  const { sx, front } = q;
  const w = q.mask.w;
  for (let i = 0; i < w; i++) {
    const x = sx + i;
    wearFloor(s, x, front + 1, 6);
    wearFloor(s, x, front + 2, 4);
    if (hf(seed, x, front) > 0.35) wearFloor(s, x, front + 3, 3);
    if (hf(seed, x, front + 7) > 0.6) wearFloor(s, x, front + 4, 2);
  }
};

/** Paint a placed prop. Returns the lamp it carries, if any. */
export function drawPlaced(s: Surface, q: PlacedProp, seed = 0): PropLight | null {
  const { art, mask, isSide, sx, sy, front } = q;

  contactShadow(s, q, seed);

  s.stamp(mask, sx, sy, art.mat, {
    height: art.height,
    spec: art.spec ?? 0,
    tag: TAG.PROP,
    outline: art.outline !== false,
    front,
  });

  // The extruded face is vertical, and a height field cannot say so: annotate
  // it, or the sun shades it as a slope and the solid turns back into a blob.
  const w = s.w;
  for (let j = 0; j < mask.h; j++) {
    const row = j * mask.w;
    const y = sy + j;
    if (y < 0 || y >= s.h) continue;
    for (let i = 0; i < mask.w; i++) {
      if (!isSide[row + i]) continue;
      const x = sx + i;
      if (x < 0 || x >= s.w) continue;
      if (s.tag[y * w + x] !== TAG.PROP) continue;
      s.setFace(x, y, FACE.SOUTH);
    }
  }

  if (art.fire) {
    s.stamp(art.fire.mask, sx + art.fire.dx, sy + art.fire.dy, M_FIRE, {
      height: art.height,
      spec: 40,
      tag: TAG.PROP,
      outline: false,
      front,
    });
  }

  if (!art.light) return null;
  // The lamp sits on the prop's own footprint centre. It cannot drift from the
  // bowl, because both are derived from the same projected rectangle.
  return {
    x: sx + (q.cellsX * CELL) / 2,
    y: sy + art.height + (q.cellsY * CELL) / 2,
    radius: art.light.radius,
    intensity: art.light.intensity,
    flicker: art.light.flicker,
  };
}
