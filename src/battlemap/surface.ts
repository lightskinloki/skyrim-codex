import { RAMP_HEX, RAMP_PACKED, RampId, packHex } from './palette';
import { clamp } from './rng';

/**
 * The four buffers (PIXEL-ART P11), plus the lit output.
 *
 *   mat     which material drew this pixel (index into MATERIALS)
 *   idx     the ramp step within that material's ramp
 *   height  relief in art pixels: 0 flat, -1 groove, +2 body, +3 lip
 *   spec    luminance mask 0..255 — behaves as a specular map
 *   tag     what a light may touch (floor / wall / prop / token)
 *
 * Colour is *derived* from (mat, idx) plus the light, which is why the whole
 * scene stays inside 61 colours no matter what the light rig does.
 */

export const TAG = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  PROP: 3,
  TOKEN: 4,
} as const;

/**
 * Which way a vertical face points, where a height map cannot say it.
 *
 * A height field can describe a slope, but a wall face is genuinely vertical:
 * its normal is horizontal, and no amount of height fall-off across 20 px can
 * express that in a 3×3 kernel. Walls write their facing here; `buildNormals`
 * turns it into a real normal, so the sun can rake a south face while leaving
 * the cap overhead lit. This is still the same four buffers — `face` is a
 * one-byte annotation on the height buffer, not a fifth rendered surface.
 */
export const FACE = {
  NONE: 0,
  SOUTH: 1,
  WEST: 2,
  EAST: 3,
  NORTH: 4,
} as const;

/**
 * The near edge of whatever painted a pixel, in screen y. Zero means floor.
 *
 * This is what makes occlusion possible without a z-buffer per object: a wall
 * writes the y of its own base into every pixel it covers, a prop writes the
 * row its feet stand on, and a body is then simply hidden by any surface whose
 * front is nearer than its own feet. A sprite behind a wall loses its pixels
 * to the wall; a sprite in front of one paints over the face. Nothing has to be
 * drawn twice, and nothing has to know what drew it.
 */
export type Material = {
  id: number;
  name: string;
  ramp: RampId;
  packed: Uint32Array;
};

const rampToMaterial = (id: number, name: string, ramp: RampId): Material => ({
  id,
  name,
  ramp,
  packed: RAMP_PACKED[ramp],
});

/** Material ids are fixed by this array's order — nothing else may allocate them. */
export const M_VOID = 0;
export const M_INK = 1;
export const M_FLOOR = 2;
export const M_WALL = 3;
export const M_WOOD_FLOOR = 4;
export const M_WOOD_WALL = 5;
export const M_WOOD_PROP = 6;
export const M_STONE_PROP = 7;
export const M_METAL = 8;
export const M_FIRE = 9;
export const M_CLOTH_RED = 10;
export const M_CLOTH_NAVY = 11;

export const M_SKIN = 12;
export const M_HAIR_GREY = 13;
export const M_HAIR_GINGER = 14;
export const M_HAIR_BROWN = 15;
export const M_HAIR_BLACK = 16;
export const M_OLIVE = 17;
export const M_SLATE = 18;

export const MATERIALS: Material[] = [
  rampToMaterial(M_VOID, 'void', 'void'),
  rampToMaterial(M_INK, 'ink', 'ink'),
  rampToMaterial(M_FLOOR, 'stone floor', 'stone'),
  rampToMaterial(M_WALL, 'stone wall', 'stone'),
  rampToMaterial(M_WOOD_FLOOR, 'wood floor', 'wood'),
  rampToMaterial(M_WOOD_WALL, 'wood wall', 'wood'),
  rampToMaterial(M_WOOD_PROP, 'wood prop', 'wood'),
  rampToMaterial(M_STONE_PROP, 'stone prop', 'stone'),
  rampToMaterial(M_METAL, 'metal', 'metal'),
  rampToMaterial(M_FIRE, 'fire', 'fire'),
  rampToMaterial(M_CLOTH_RED, 'red cloth', 'wool'),
  rampToMaterial(M_CLOTH_NAVY, 'navy cloth', 'navy'),
  rampToMaterial(M_SKIN, 'skin', 'skin'),
  rampToMaterial(M_HAIR_GREY, 'grey hair', 'hairGrey'),
  rampToMaterial(M_HAIR_GINGER, 'ginger hair', 'hairGinger'),
  rampToMaterial(M_HAIR_BROWN, 'brown hair', 'hairBrown'),
  rampToMaterial(M_HAIR_BLACK, 'black hair', 'hairBlack'),
  rampToMaterial(M_OLIVE, 'olive cloth', 'olive'),
  rampToMaterial(M_SLATE, 'grey cloth', 'slate'),
];

export const MATERIAL_COUNT = MATERIALS.length;

/** Flat lookup: colourOf[mat * 16 + idx]. Built once; read per pixel per frame. */
export const COLOUR_OF: Uint32Array = (() => {
  const out = new Uint32Array(MATERIAL_COUNT * 16);
  for (const m of MATERIALS) {
    for (let i = 0; i < 16; i++) out[m.id * 16 + i] = m.packed[Math.min(i, m.packed.length - 1)];
  }
  return out;
})();

export const RAMP_LEN: Uint8Array = Uint8Array.from(MATERIALS.map((m) => m.packed.length));

export const colourNotFound = packHex('#ff00ff');

export type Mask = { w: number; h: number; data: Uint8Array };

export const makeMask = (w: number, h: number): Mask => ({ w, h, data: new Uint8Array(w * h).fill(255) });

export const maskRect = (m: Mask, x: number, y: number, w: number, h: number, idx: number) => {
  for (let j = 0; j < h; j++) {
    const yy = y + j;
    if (yy < 0 || yy >= m.h) continue;
    for (let i = 0; i < w; i++) {
      const xx = x + i;
      if (xx < 0 || xx >= m.w) continue;
      m.data[yy * m.w + xx] = idx;
    }
  }
};

export const maskEllipse = (m: Mask, cx: number, cy: number, rx: number, ry: number, idx: number) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    if (y < 0 || y >= m.h) continue;
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || x >= m.w) continue;
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) m.data[y * m.w + x] = idx;
    }
  }
};

export class Surface {
  readonly w: number;
  readonly h: number;
  readonly mat: Uint8Array;
  readonly idx: Uint8Array;
  readonly height: Int8Array;
  readonly face: Uint8Array;
  readonly spec: Uint8Array;
  readonly tag: Uint8Array;
  /** Base line of the nearest object that painted this pixel (see above). */
  readonly front: Int16Array;
  /** Lit output, packed RGBA. */
  readonly col: Uint32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    const n = w * h;
    this.mat = new Uint8Array(n);
    this.idx = new Uint8Array(n);
    this.height = new Int8Array(n);
    this.face = new Uint8Array(n);
    this.spec = new Uint8Array(n);
    this.tag = new Uint8Array(n);
    this.front = new Int16Array(n);
    this.col = new Uint32Array(n);
  }

  inBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x: number, y: number, mat: number, idx: number, height = 0, spec = 0, tag: number = TAG.FLOOR) {
    if (!this.inBounds(x, y)) return;
    const i = y * this.w + x;
    this.mat[i] = mat;
    this.idx[i] = idx < 0 ? 0 : idx;
    this.height[i] = height;
    this.face[i] = FACE.NONE;
    this.spec[i] = spec;
    this.tag[i] = tag;
  }

  setFace(x: number, y: number, dir: number): void {
    if (!this.inBounds(x, y)) return;
    this.face[y * this.w + x] = dir;
  }

  /** Stamp a base line over pixels a particular kind of object already owns. */
  markFront(x: number, y: number, w: number, h: number, front: number, tag: number) {
    for (let j = 0; j < h; j++) {
      const yy = y + j;
      if (yy < 0 || yy >= this.h) continue;
      for (let i = 0; i < w; i++) {
        const xx = x + i;
        if (xx < 0 || xx >= this.w) continue;
        const k = yy * this.w + xx;
        if (this.tag[k] === tag && this.front[k] < front) this.front[k] = front;
      }
    }
  }

  fill(x: number, y: number, w: number, h: number, mat: number, idx: number, height = 0, spec = 0, tag: number = TAG.FLOOR) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, mat, idx, height, spec, tag);
  }

  fillFn(x: number, y: number, w: number, h: number, fn: (px: number, py: number) => number | null, mat: number, height = 0, spec = 0, tag: number = TAG.FLOOR) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const v = fn(x + i, y + j);
        if (v === null) continue;
        this.set(x + i, y + j, mat, v, height, spec, tag);
      }
    }
  }

  raise(x: number, y: number, w: number, h: number, delta: number) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const xx = x + i;
        const yy = y + j;
        if (!this.inBounds(xx, yy)) continue;
        const k = yy * this.w + xx;
        this.height[k] = clamp(this.height[k] + delta, -8, 8);
      }
    }
  }

  hline(x0: number, x1: number, y: number, mat: number, idx: number, height = 0, tag: number = TAG.FLOOR) {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, mat, idx, height, 0, tag);
  }

  vline(x: number, y0: number, y1: number, mat: number, idx: number, height = 0, tag: number = TAG.FLOOR) {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, mat, idx, height, 0, tag);
  }

  /**
   * Stamp a mask: fill the opaque pixels at `mat`, then draw a 1 px ink outline
   * *outside* the silhouette (PIXEL-ART P3 rule 1). Mask values are ramp
   * indices, so a prop's internal detail is authored as index steps.
   */
  stamp(mask: Mask, ox: number, oy: number, mat: number, opts: { height?: number; spec?: number; tag?: number; outline?: boolean; diagonal?: boolean; front?: number } = {}) {
    const { height = 2, spec = 0, tag = TAG.PROP, outline = true, diagonal = false, front = 0 } = opts;
    // A stamp only wins where nothing nearer already stands. This is the sort
    // the room's prop list never needed: a barrel behind a wall is simply not
    // painted over it, whatever order the props are authored in.
    const maskedOver = (x: number, y: number) => {
      if (!this.inBounds(x, y)) return false;
      const k = y * this.w + x;
      return this.front[k] > front;
    };
    const { w, h, data } = mask;
    const at = (x: number, y: number): number => {
      if (x < 0 || y < 0 || x >= w || y >= h) return 255;
      return data[y * w + x];
    };
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const v = data[j * w + i];
        if (v === 255) continue;
        if (maskedOver(ox + i, oy + j)) continue;
        this.set(ox + i, oy + j, mat, v, height, spec, tag);
        if (this.inBounds(ox + i, oy + j)) this.front[(oy + j) * this.w + ox + i] = front;
      }
    }
    if (!outline) return;
    const neighbourOpaque = (x: number, y: number) =>
      at(x - 1, y) !== 255 ||
      at(x + 1, y) !== 255 ||
      at(x, y - 1) !== 255 ||
      at(x, y + 1) !== 255 ||
      (diagonal && (at(x - 1, y - 1) !== 255 || at(x + 1, y - 1) !== 255 || at(x - 1, y + 1) !== 255 || at(x + 1, y + 1) !== 255));
    for (let j = -1; j <= h; j++) {
      for (let i = -1; i <= w; i++) {
        if (at(i, j) !== 255) continue;
        if (!neighbourOpaque(i, j)) continue;
        if (maskedOver(ox + i, oy + j)) continue;
        this.set(ox + i, oy + j, M_INK, 0, height, 0, tag);
        if (this.inBounds(ox + i, oy + j)) this.front[(oy + j) * this.w + ox + i] = front;
      }
    }
  }
}

export const rampStep = (ramp: RampId, i: number) => Math.min(i, RAMP_HEX[ramp].length - 1);
