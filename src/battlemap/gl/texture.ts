import { RAMP_PACKED, packRGB } from '../palette';
import { clamp, hf } from '../rng';

/**
 * Textures for the 3D board — ramp indices, not colours.
 * See docs/BATTLEMAP-SPEC.md §17.
 *
 * A texel is a *ramp step*, exactly like a pixel was in the old flat renderer.
 * The 3D pass samples a step, adds the light in steps, and looks the result up
 * in the palette. That is why the scene stays inside the same 61 colours no
 * matter how many faces it has: geometry changed, the colour model did not.
 *
 * Tiling is the whole point of doing this in texture space. A wall's `u` is
 * world distance along the wall, so a 64 px texture with eight-pixel bricks
 * continues across cell boundaries; a per-cell sprite could only ever repeat.
 * Everything below is authored to tile on its own period.
 */

export type Tex = {
  w: number;
  h: number;
  idx: Uint8Array;
  /** Power-of-two wrap masks, or -1 for an odd size (the rug). */
  mx: number;
  my: number;
};

/** Nearest texel, wrapping in both axes. Negative uv is legal. */
export const sampleIdx = (t: Tex, u: number, v: number): number => {
  let x = u | 0;
  let y = v | 0;
  x %= t.w;
  if (x < 0) x += t.w;
  y %= t.h;
  if (y < 0) y += t.h;
  return t.idx[y * t.w + x];
};

const field = (w: number, h: number, v: number): Tex => ({
  w,
  h,
  idx: new Uint8Array(w * h).fill(v),
  mx: (w & (w - 1)) === 0 ? w - 1 : -1,
  my: (h & (h - 1)) === 0 ? h - 1 : -1,
});

/* ------------------------------------------------------------------ floor */
/**
 * One flagstone. The seam is on the north and west edge only, so two adjacent
 * cells meet along exactly one dark line rather than a double border. Three
 * variants are enough: the per-cell hash picks one, and the room-scale wash is
 * added as light in the vertex pass, not baked in here.
 */
export function floorTexture(seed: number, variant: number, cut: 'none' | 'h' | 'v' = 'none'): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 4 + variant;
      if (x === 0 || y === 0) s = 3;
      else {
        const n = hf(seed ^ 0x51ed, x, y);
        if (n > 0.978) s -= 1;
        else if (n < 0.008) s += 1;
        // A chipped arris, one pixel wide, at the odd cell corner.
        if ((x === 1 && y < 3) || (y === 1 && x < 3)) s = 3;
      }
      if (cut === 'h' && y === 16) s = 3;
      if (cut === 'v' && x === 16) s = 3;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }

  // One variant carries a crack. It reaches the cell edge, so cracks appear to
  // continue into the neighbouring stone when two of them land together.
  if (variant === 1) {
    let x = 11;
    let y = 0;
    for (let n = 0; n < 22; n++) {
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      t.idx[y * w + x] = 2;
      if (n % 3 === 0) x += 1;
      else if (n % 5 === 0) x -= 1;
      y += 1;
    }
  }

  return t;
}

/* ------------------------------------------------------------------- wall */
/**
 * A masonry face, 64 px wide and 32 tall. `v` is measured from the top of the
 * wall, so row 0 is the coping and the courses hang below it regardless of how
 * tall the block is. `u` is world distance, so the bond runs through cells.
 *
 * Bricks are eight wide with a four-pixel half-bond: both divide 64, which is
 * what makes the wrap invisible.
 */
export function wallFaceTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 5;
      if (y === 0) s = 8;
      else if (y === 1) s = 6;
      else if (y === 2) s = 2;
      else {
        const band = y - 3;
        const course = Math.floor(band / 6);
        const jointH = band % 6 === 5;
        const jointV = ((x + (course & 1) * 4) & 7) === 0;
        if (jointH || jointV) s = 3;
        else {
          if (band % 6 === 0) s = 6;
          else if (hf(seed ^ 0x6a1d, x, y) > 0.955) s = 7;
          else if (hf(seed ^ 0x6a1d, x + 7, y + 3) < 0.02) s = 4;
        }
      }
      if (y >= h - 3) s = Math.max(1, s - 1);
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** The cap, seen from above: big coping slabs, because a 4 px course on a
 *  32 px cell is a stipple, not masonry. Two slabs to the cell, running bond. */
export function wallTopTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    const course = y >> 3;
    const stagger = (course & 1) * 8;
    for (let x = 0; x < w; x++) {
      const bx = (x + stagger) & 15;
      const by = y & 7;
      const slab = hf(seed ^ 0x3c1f, (x + stagger) >> 4, y >> 3);
      const base = slab > 0.66 ? 5 : slab > 0.33 ? 4 : 6;
      let s = base;
      if (by === 7 || bx === 15) s = 1;
      else if (by === 6) s = base - 2;
      else if (by === 0) s = base + 2;
      else if (bx === 0) s = base + 1;
      else if (bx === 14) s = base - 1;
      else if (hf(seed ^ 0x7b11, x >> 2, y >> 1) > 0.94) s = base + 1;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/* -------------------------------------------------------------- materials */
/** Oak: eight-pixel boards, grain streaks, a dark joint and a lit arris. */
export function woodTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const bx = x & 7;
      let s = 7;
      if (bx === 7) s = 4;
      else if (bx === 0) s = 8;
      else {
        const grain = hf(seed ^ 0x1a2b, x, y >> 2);
        if (grain > 0.94) s = 8;
        else if (grain < 0.035) s = 6;
        if (hf(seed ^ 0x77c1, x >> 1, y) > 0.985) s = 9;
      }
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Rough stone for columns and rubble: mottled, with a few chisel scars. */
export function stoneTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 6;
      const n = hf(seed ^ 0x2f7d, x, y);
      if (n > 0.82) s = 7;
      else if (n < 0.16) s = 5;
      if (hf(seed ^ 0x9c31, x, y) > 0.993) s = 8;
      if (hf(seed ^ 0x44ab, x, y) < 0.006) s = 4;
      // Fluting: vertical channels, so a round column still reads as carved.
      if (x % 9 === 0) s = 4;
      else if (x % 9 === 1) s = 8;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Steel: brushed bands, with the rivet pattern a brazier and a chest share. */
export function metalTexture(seed: number): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 5;
      if (y % 4 === 0) s = 6;
      else if (hf(seed ^ 0x5d19, x, y) > 0.93) s = 6;
      if (x % 8 === 4 && y % 8 === 4) {
        s = 10;
      } else if (x % 8 === 3 && y % 8 === 4) {
        s = 7;
      }
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Woven cloth: a two-pixel tabby, so a big field does not read as flat. */
export function clothTexture(seed: number, navy: boolean): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, navy ? 4 : 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const weave = (((x >> 1) + (y >> 1)) & 1) === 0 ? 0 : 1;
      const n = hf(seed ^ 0x6b2f, x, y) > 0.95 ? 1 : 0;
      t.idx[y * w + x] = clamp((navy ? 4 : 5) + weave + n, 0, 12);
    }
  }
  return t;
}

/**
 * A rug sized to its own footprint, because a border is a frame: stretching a
 * tile would put it in the middle of the cloth. One dark edge, one band of
 * pattern, a field of weave. No wrapping — the quad's uv spans it exactly.
 */
/** The smallest power of two at least `n`. */
const pow2 = (n: number): number => {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
};

export function rugTexture(cellsX: number, cellsY: number, navy: boolean): Tex {
  const w = Math.max(8, Math.round(cellsX * 32));
  const h = Math.max(8, Math.round(cellsY * 32));
  const base = navy ? 3 : 4;
  // Padded to a power of two so every texture in the renderer can be sampled
  // with a bitmask. The quad's uv only ever reaches w and h, so the padding is
  // never seen; it exists to keep the inner loop branch-free.
  const t = field(pow2(w), pow2(h), base);
  const tw = t.w;
  const border = 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x < border || y < border || x >= w - border || y >= h - border;
      if (edge) {
        t.idx[y * tw + x] = 2;
        continue;
      }
      const inset = x < border + 3 || y < border + 3 || x >= w - border - 3 || y >= h - border - 3;
      if (inset) {
        t.idx[y * tw + x] = 6;
        continue;
      }
      const weave = (((x >> 1) + (y >> 1)) & 1) === 0 ? 0 : 1;
      let s = base + 1 + weave;
      // A lattice of lozenges, the way a woven rug carries pattern without text.
      const lx = Math.abs(((x / 9) % 2) - 1);
      const ly = Math.abs(((y / 9) % 2) - 1);
      if (lx + ly > 1.55) s += 1;
      if (hf(0x1f2e, x, y) > 0.985) s += 1;
      t.idx[y * tw + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/* ------------------------------------------------------------------- fire */
export type Sprite = {
  w: number;
  h: number;
  /** Packed RGBA; alpha 0 is transparent. */
  rgba: Uint32Array;
};

/**
 * An animated flame: two frames is enough at eight frames a second. Drawn as a
 * screen-facing billboard above the bowl, so it never turns edge-on and never
 * needs a second quad.
 */
export function fireSprite(frame: number): Sprite {
  const w = 24;
  const h = 32;
  const rgba = new Uint32Array(w * h);
  const ramp = RAMP_PACKED.fire;
  const put = (x: number, y: number, idx: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    rgba[y * w + x] = ramp[clamp(idx, 0, ramp.length - 1)];
  };

  // Embers: a wide, low bed, brightest in the middle.
  for (let y = h - 5; y < h - 1; y++) {
    for (let x = 4; x < w - 4; x++) {
      const dx = (x - w / 2) / 8;
      const dy = (y - (h - 3)) / 2.2;
      if (dx * dx + dy * dy > 1) continue;
      put(x, y, dx * dx + dy * dy < 0.35 ? 9 : 6);
    }
  }

  // The main lick, and a shorter one leaning the other way.
  for (let n = 0; n < 2; n++) {
    const lean = n === 0 ? 0 : -3.2;
    const height = n === 0 ? h - 8 : h - 16;
    for (let j = 0; j < height; j++) {
      const t = j / height;
      const half = Math.max(0.6, (1 - t) * (1 - t) * 4.6 + 0.7);
      const cx = w / 2 + lean * t + Math.sin(t * 5.4 + frame * 1.7 + n) * (0.4 + t * 1.4);
      for (let dx = -half; dx <= half; dx += 0.5) {
        const x = Math.round(cx + dx);
        const y = h - 5 - j;
        const outer = Math.abs(dx) / half;
        let idx = 11 - Math.round(t * 5.4) - (outer > 0.66 ? 2 : outer > 0.33 ? 1 : 0);
        if (j < 3) idx = 12 - Math.round(t * 2);
        put(x, y, idx);
      }
    }
  }

  // A couple of sparks, hashed per frame so they move.
  for (let k = 0; k < 4; k++) {
    const x = 6 + Math.floor(hf(0x9e3, k, frame) * 12);
    const y = 4 + Math.floor(hf(0x51b, k, frame + 7) * 12);
    put(x, y, 11);
  }

  return { w, h, rgba };
}

/** A soft, dither-edged ellipse on the floor: the token's contact shadow. */
export function shadowSprite(): Sprite {
  const w = 24;
  const h = 10;
  const rgba = new Uint32Array(w * h);
  // The floor's own second step, not black: a shadow is a darkening of stone,
  // and a black ellipse reads as a hole in the board.
  const dark = packRGB(23, 20, 35);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      // Ordered edge, not a feathered blur: one extra ring of pixels.
      const rim = d > 0.72;
      if (rim && ((x + y) & 1) === 0) continue;
      rgba[y * w + x] = (255 << 24) | (dark & 0x00ffffff);
    }
  }
  return { w, h, rgba };
}
