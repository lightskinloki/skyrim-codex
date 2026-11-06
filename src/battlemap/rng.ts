/**
 * Stateless integer hash, value noise and the Bayer threshold.
 * Nothing here stores state: the same (seed, x, y, salt) gives the same answer
 * forever, which is what makes a scene's whole surface reproducible from
 * { seed, rulesVersion, biome }. See docs/PIXEL-ART-SPEC.md P7.
 */

export function h32(a: number, b: number, c: number): number {
  let h = Math.imul((a | 0) ^ 0x3c6ef372, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca77);
  h ^= Math.imul((b | 0) + 0x5bd1e995, 0xc2b2ae3d);
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f);
  h ^= Math.imul((c | 0) + 0x1b873593, 0x165667b1);
  h = Math.imul(h ^ (h >>> 16), 0x9e3779b1);
  h ^= h >>> 15;
  return h >>> 0;
}

/** Same hash, normalised to 0..1. */
export const hf = (a: number, b = 0, c = 0): number => h32(a, b, c) / 4294967296;

/** 1-D value noise over unbounded time — used for flicker. */
export function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hf(i, seed, 911);
  const b = hf(i + 1, seed, 911);
  return a + (b - a) * u;
}

export function fbm1(x: number, seed: number): number {
  return noise1(x, seed) * 0.55 + noise1(x * 2.13 + 7.1, seed + 1) * 0.3 + noise1(x * 4.7 + 3.3, seed + 2) * 0.15;
}

/** Bilinear value noise on a lattice — the large-scale wash that stops a floor
 *  of identical tiles reading as a grid. Build-time only. */
export function noise2(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hf(seed, ix, iy);
  const b = hf(seed, ix + 1, iy);
  const c = hf(seed, ix, iy + 1);
  const d = hf(seed, ix + 1, iy + 1);
  const top = a + (b - a) * ux;
  const bot = c + (d - c) * ux;
  return top + (bot - top) * uy;
}

/** Two octaves is the useful part; a third only adds cost at this scale. */
export const mottle = (x: number, y: number, seed: number): number =>
  noise2(x, y, seed) * 0.68 + noise2(x * 2.7 + 11.3, y * 2.7 + 5.1, seed + 17) * 0.32;

// 4x4 ordered dither. Precomputed as (n + 0.5) / 16 so the comparison in the
// light pass is a single `<`.
export const BAYER4: Float32Array = Float32Array.from(
  [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16),
);

/** Screen-space threshold for a pixel. Dither belongs at the boundary between
 *  two ramp steps, never on a cast shadow (PIXEL-ART P13). */
export const bayer = (x: number, y: number): number => BAYER4[((y & 3) << 2) | (x & 3)];

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
