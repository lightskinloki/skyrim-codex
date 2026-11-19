import { M_INK, RAMP_LEN } from '@/battlemap/surface';
import { clamp } from '@/battlemap/rng';

/**
 * A 16-bit part mask, shared by the body and the bust.
 *
 * A cell is `(material << 4) | ramp step` — the same packing the surface uses —
 * so one silhouette can carry skin, hair, cloth and steel. It is 16-bit rather
 * than 8-bit because that packing has outgrown a byte: material 15 step 15 is
 * 255, which would collide with the empty sentinel and silently punch a hole in
 * a brown-haired character.
 */

export const EMPTY = 0xffff;
export const INK = (M_INK << 4) | 0;

export type PartMask = { w: number; h: number; data: Uint16Array };

export const partMask = (w: number, h: number): PartMask => ({
  w,
  h,
  data: new Uint16Array(w * h).fill(EMPTY),
});

export const P = (mat: number, idx: number) => (mat << 4) | (idx & 15);

export const rect = (m: PartMask, x: number, y: number, w: number, h: number, part: number) => {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(m.w, x + w);
  const y1 = Math.min(m.h, y + h);
  for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) m.data[j * m.w + i] = part;
};

export const ellipse = (m: PartMask, cx: number, cy: number, rx: number, ry: number, part: number) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    if (y < 0 || y >= m.h) continue;
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || x >= m.w) continue;
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) m.data[y * m.w + x] = part;
    }
  }
};

/** A triangle with its base on `yBase`, widening downward. Ears, crests, tusks. */
export const spike = (m: PartMask, cx: number, yBase: number, w: number, h: number, part: number) => {
  const x0 = Math.round(cx - w / 2);
  for (let t = 0; t < h; t++) {
    const ww = Math.max(1, Math.round(w * (1 - t / h)));
    rect(m, x0 + Math.round((w - ww) / 2), yBase - t, ww, 1, part);
  }
};

/** A soft-edged half ellipse, used for a brow ridge or the top of a cheek. */
export const band = (m: PartMask, x: number, y: number, w: number, h: number, part: number) => {
  rect(m, x, y, w, h, part);
};

/** A ramp step inside a material, clamped — the only safe way to add a shift. */
export const stepIn = (mat: number, idx: number, shift = 0) => P(mat, clamp(idx + shift, 0, RAMP_LEN[mat] - 1));
