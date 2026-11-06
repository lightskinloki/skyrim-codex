import {
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

/**
 * Props are parametric objects, not stamped sprites (PIXEL-ART P5): a table
 * takes its width in cells, a chest its band count. Mask values are ramp
 * indices, so a prop's internal detail is just index steps — the outline and
 * the relief fall out of `stamp`.
 */

export type PropRule =
  | { rule: 'table'; at: [number, number]; w?: number }
  | { rule: 'bench'; at: [number, number]; w?: number }
  | { rule: 'chest'; at: [number, number]; w?: number; bands?: number }
  | { rule: 'crate'; at: [number, number] }
  | { rule: 'barrel'; at: [number, number] }
  | { rule: 'shelf'; at: [number, number]; w?: number }
  | { rule: 'rubble'; at: [number, number]; size?: number }
  | { rule: 'brazier'; at: [number, number]; lit?: boolean }
  | { rule: 'rug'; at: [number, number]; w?: number; h?: number; navy?: boolean }
  | { rule: 'column'; at: [number, number] };

// Authored a few steps below the lit value: the sun adds ~3.7 steps at noon, so
// these land in the middle of the wood ramp rather than in its mud.
const WOOD_BODY = 5;
const WOOD_LIP = 6;
const WOOD_SEAM = 4;
const WOOD_DARK = 3;

const table = (w: number): Mask => {
  const mw = w * CELL - 6;
  const mh = 26;
  const m = makeMask(mw, mh);
  maskRect(m, 2, 2, mw - 4, 16, WOOD_BODY);
  maskRect(m, 2, 2, mw - 4, 1, WOOD_LIP);
  maskRect(m, 2, 17, mw - 4, 1, WOOD_DARK);
  for (let x = 8; x < mw - 4; x += 7) maskRect(m, x, 3, 1, 14, WOOD_SEAM);
  // Legs, visible below the top because the view is slightly high.
  maskRect(m, 3, 18, 2, 6, WOOD_SEAM);
  maskRect(m, mw - 6, 18, 2, 6, WOOD_SEAM);
  maskRect(m, 3, 24, 3, 2, WOOD_DARK);
  maskRect(m, mw - 6, 24, 3, 2, WOOD_DARK);
  return m;
};

const bench = (w: number): Mask => {
  const mw = w * CELL - 10;
  const mh = 18;
  const m = makeMask(mw, mh);
  maskRect(m, 1, 1, mw - 2, 9, WOOD_BODY);
  maskRect(m, 1, 1, mw - 2, 1, WOOD_LIP);
  maskRect(m, 1, 9, mw - 2, 1, WOOD_DARK);
  for (let x = 6; x < mw - 2; x += 6) maskRect(m, x, 2, 1, 7, WOOD_SEAM);
  maskRect(m, 2, 10, 2, 5, WOOD_SEAM);
  maskRect(m, mw - 4, 10, 2, 5, WOOD_SEAM);
  return m;
};

const chest = (w: number, bands: number): Mask => {
  const mw = w * CELL - 6;
  const mh = 24;
  const m = makeMask(mw, mh);
  maskRect(m, 1, 2, mw - 2, 20, WOOD_BODY);
  maskRect(m, 1, 2, mw - 2, 2, WOOD_LIP);
  maskRect(m, 1, 9, mw - 2, 1, WOOD_DARK); // lid line
  maskRect(m, 1, 21, mw - 2, 1, WOOD_DARK);
  for (let b = 0; b < bands; b++) {
    const x = 4 + Math.round((b * (mw - 10)) / Math.max(1, bands - 1 || 1));
    maskRect(m, x, 2, 2, 20, 0);
  }
  // Lock plate.
  maskRect(m, Math.floor(mw / 2) - 2, 8, 4, 6, 0);
  return m;
};

const crate = (): Mask => {
  const mw = 28;
  const mh = 28;
  const m = makeMask(mw, mh);
  maskRect(m, 1, 1, mw - 2, mh - 2, WOOD_BODY);
  maskRect(m, 1, 1, mw - 2, 2, WOOD_LIP);
  maskRect(m, 1, mh - 3, mw - 2, 2, WOOD_DARK);
  for (let n = 3; n < mw - 4; n++) {
    const yy = 3 + Math.round((n * (mh - 8)) / (mw - 7));
    maskRect(m, n, yy, 1, 2, WOOD_SEAM);
    maskRect(m, mw - 1 - n, yy, 1, 2, WOOD_SEAM);
  }
  return m;
};

const barrel = (): Mask => {
  const mw = 24;
  const mh = 28;
  const m = makeMask(mw, mh);
  maskEllipse(m, mw / 2, mh / 2, 10, 13, WOOD_BODY);
  maskRect(m, 2, 5, mw - 4, 1, 0);
  maskRect(m, 2, mh - 8, mw - 4, 1, 0);
  maskEllipse(m, mw / 2, 6, 9, 3, WOOD_LIP);
  maskRect(m, 4, 1, mw - 8, 1, WOOD_SEAM);
  return m;
};

const shelf = (w: number): Mask => {
  const mw = w * CELL - 6;
  const mh = 20;
  const m = makeMask(mw, mh);
  maskRect(m, 1, 0, mw - 2, 16, WOOD_BODY);
  maskRect(m, 1, 0, mw - 2, 1, WOOD_LIP);
  maskRect(m, 1, 16, mw - 2, 1, WOOD_DARK);
  for (let x = 4; x < mw - 3; x += 5) maskRect(m, x, 3, 3, 10, WOOD_SEAM);
  maskRect(m, 2, 4, 2, 2, 3);
  return m;
};

const rubble = (size: number, seed: number): Mask => {
  const mw = 10 + size * 6;
  const mh = 8 + size * 4;
  const m = makeMask(mw, mh);
  for (let k = 0; k < 2 + size; k++) {
    const cx = 3 + hf(seed, k, 1) * (mw - 6);
    const cy = 3 + hf(seed, k, 2) * (mh - 5);
    const r = 2 + hf(seed, k, 3) * 2.5;
    maskEllipse(m, cx, cy, r, r * 0.8, k === 0 ? 5 : 4);
    maskEllipse(m, cx, cy - 1, r * 0.6, r * 0.4, 6);
  }
  return m;
};

const brazier = (lit: boolean): Mask => {
  const mw = 22;
  const mh = 24;
  const m = makeMask(mw, mh);
  maskEllipse(m, mw / 2, mh - 6, 9, 7, 4);
  maskEllipse(m, mw / 2, mh - 7, 7, 5, 2);
  maskRect(m, 6, mh - 2, 10, 2, 3);
  if (lit) {
    maskEllipse(m, mw / 2, mh - 12, 4, 5, 6);
    maskEllipse(m, mw / 2, mh - 14, 2.5, 3.5, 8);
    maskRect(m, mw / 2 - 1, mh - 17, 2, 3, 10);
  }
  return m;
};

const rug = (w: number, h: number, navy: boolean): Mask => {
  const mw = w * CELL - 8;
  const mh = h * CELL - 8;
  const m = makeMask(mw, mh);
  maskRect(m, 0, 0, mw, mh, 3);
  maskRect(m, 1, 1, mw - 2, mh - 2, 5);
  maskRect(m, 3, 3, mw - 6, mh - 6, 2);
  maskRect(m, 5, 5, mw - 10, mh - 10, 4);
  for (let x = 7; x < mw - 7; x += 6) maskRect(m, x, 6, 1, mh - 12, 6);
  return m;
};

const column = (): Mask => {
  const mw = 26;
  const mh = 26;
  const m = makeMask(mw, mh);
  maskEllipse(m, mw / 2, mh / 2, 11, 11, 5);
  maskEllipse(m, mw / 2, mh / 2 - 1, 9, 8, 8);
  maskEllipse(m, mw / 2, mh / 2 + 3, 9, 7, 4);
  maskEllipse(m, mw / 2, mh / 2 + 1, 4, 4, 6);
  return m;
};

/** Props are anchored on a cell but are allowed to overflow it (P5). */
export function drawProp(s: Surface, p: PropRule, seed: number) {
  const [fx, fy] = p.at;
  const cx = Math.round(fx);
  const cy = Math.round(fy);
  const ox = cx * CELL;
  const oy = cy * CELL;
  const id = h32(seed, cx, cy);

  switch (p.rule) {
    case 'table': {
      const w = p.w ?? 1;
      const m = table(w);
      s.stamp(m, ox + 3, oy + 4, M_WOOD_PROP, { height: 2, spec: 6 });
      s.raise(ox + 3, oy + 4, m.w, 2, 1);
      break;
    }
    case 'bench': {
      const m = bench(p.w ?? 1);
      s.stamp(m, ox + 5, oy + 16, M_WOOD_PROP, { height: 2, spec: 6 });
      break;
    }
    case 'chest': {
      const m = chest(p.w ?? 1, p.bands ?? 2);
      s.stamp(m, ox + 3, oy + 5, M_WOOD_PROP, { height: 3, spec: 22 });
      s.raise(ox + 3, oy + 5, m.w, 2, 1);
      break;
    }
    case 'crate': {
      const m = crate();
      s.stamp(m, ox + 2, oy + 3, M_WOOD_PROP, { height: 3, spec: 8 });
      break;
    }
    case 'barrel': {
      const m = barrel();
      s.stamp(m, ox + 4, oy + 3, M_WOOD_PROP, { height: 3, spec: 14 });
      break;
    }
    case 'shelf': {
      const m = shelf(p.w ?? 1);
      s.stamp(m, ox + 3, oy + 6, M_WOOD_PROP, { height: 4, spec: 8 });
      break;
    }
    case 'rubble': {
      const m = rubble(p.size ?? 2, id);
      s.stamp(m, ox + 32 - m.w - 2, oy + 32 - m.h - 2, M_STONE_PROP, { height: 1, spec: 10 });
      break;
    }
    case 'brazier': {
      const m = brazier(!!p.lit);
      s.stamp(m, ox + 5, oy + 4, M_METAL, { height: 3, spec: 40 });
      if (p.lit) {
        // The flame itself is emissive: a separate material so the light rig
        // does not dim it at midnight.
        for (let j = 0; j < m.h; j++) {
          for (let i = 0; i < m.w; i++) {
            if (m.data[j * m.w + i] !== 255 && j < m.h - 12) {
              s.set(ox + 5 + i, oy + 4 + j, M_FIRE, m.data[j * m.w + i], 3, 0, TAG.PROP);
            }
          }
        }
      }
      break;
    }
    case 'rug': {
      const m = rug(p.w ?? 2, p.h ?? 2, !!p.navy);
      s.stamp(m, ox + 4, oy + 4, p.navy ? M_CLOTH_NAVY : M_CLOTH_RED, { height: 0, spec: 2, outline: false });
      break;
    }
    case 'column': {
      const m = column();
      s.stamp(m, ox + 3, oy + 3, M_STONE_PROP, { height: 5, spec: 12 });
      break;
    }
  }
}
