import { COLOUR_OF, M_FIRE, RAMP_LEN, Surface, TAG } from './surface';
import { BAYER4, clamp, fbm1 } from './rng';

/**
 * The light rig (PIXEL-ART P15) and the light pass (P13).
 *
 * Light never leaves the palette: it picks a ramp *step*, and the dither only
 * decides the boundary between two neighbouring steps. Cast shadows are drawn
 * as geometry, not computed here — a dithered contact shadow turns to mud.
 *
 * Two caches keep this cheap enough to run every frame:
 *
 *   sunTerm    the sun and ambient, per pixel. Depends on the normals and the
 *              rig only, so it is rebuilt when a slider moves, not per frame.
 *   lightField the point lights, sampled once per 4×4 px block. Light is a
 *              smooth field; at 32 px tiles a 4 px sample is invisible and it
 *              turns four full-board passes into four small ones.
 *
 * Together they take a 900×600 board from 66 ms a frame to a few.
 */

export type SunLight = {
  /** Degrees, measured from +x (east) toward +y (south), i.e. the direction the
   *  light comes FROM. 225 puts the sun in the north-west. */
  azimuth: number;
  /** Degrees above the horizon. 90 is directly overhead: no relief at all. */
  elevation: number;
  /** 0..1 — how strong the sun is when it is above the horizon. */
  intensity: number;
};

export type PointLight = {
  /** Board-space position in art pixels. */
  x: number;
  y: number;
  radius: number;
  intensity: number;
  /** 0..1, scaled by fbm1 when it flickers. */
  flicker?: number;
  id?: string;
};

export type LightRig = {
  sun: SunLight;
  /** 0..1 baseline. 0.55 is "the value the material was authored at". */
  ambient: number;
  points: PointLight[];
};

/* ------------------------------------------------------------------ tuning */
/** Ambient below this darkens the surface; above it lifts. */
const AMBIENT_ZERO = 0.55;
/** Ramp steps per unit of ambient. 0.3 of ambient is ~1.5 steps of shadow. */
const AMBIENT_RANGE = 6.0;
/** Ramp steps the sun adds at full intensity and its elevation's cosine. */
const SUN_LIFT = 5.6;
/** Ramp steps per unit of normal response — this is the relief's whole voice. */
const RELIEF = 5.2;
/** Point lights are sampled one per this many pixels, per axis. */
const LIGHT_STEP = 4;
/** Ramp steps of specular per unit of luminance mask per step of exposure. */
const SPEC_GAIN = 0.0032;

export type LightCache = {
  w: number;
  h: number;
  sunTerm: Float32Array;
  /** The rig the sunTerm was built from, so it can be reused across frames. */
  sunState: Float32Array;
  lightField: Float32Array;
  lw: number;
  lh: number;
};

export const makeLightCache = (w: number, h: number): LightCache => {
  const lw = (w >> 2) + 2;
  const lh = (h >> 2) + 2;
  return {
    w,
    h,
    sunTerm: new Float32Array(w * h),
    sunState: Float32Array.from([NaN, NaN, NaN, NaN]),
    lightField: new Float32Array(lw * lh),
    lw,
    lh,
  };
};

export type SunVector = { x: number; y: number; z: number };

export const sunVector = (sun: SunLight): SunVector => {
  const az = (sun.azimuth * Math.PI) / 180;
  const el = (sun.elevation * Math.PI) / 180;
  const c = Math.cos(el);
  return { x: Math.cos(az) * c, y: Math.sin(az) * c, z: Math.sin(el) };
};

export const sunAbove = (sun: SunLight): number => Math.sin((sun.elevation * Math.PI) / 180);

/** The exposure the whole rig works out to, in ramp steps over the authored value.
 *
 * A low sun is dimmer but never dark: the lift keeps a 0.35 floor and only the
 * remaining 0.65 follows the elevation's cosine. A dawn that reads as a grey
 * board is not a dawn, it is a broken exposure — and because the relief term
 * still uses the full ray, a low sun gets the raking contrast for free.
 */
export const exposureOf = (rig: LightRig): number => {
  const flat = Math.max(0, sunAbove(rig.sun));
  return (
    (rig.ambient - AMBIENT_ZERO) * AMBIENT_RANGE + rig.sun.intensity * (0.35 + 0.65 * flat) * SUN_LIFT
  );
};

const INV127 = 1 / 127;

function buildSunTerm(s: Surface, normals: Uint32Array, rig: LightRig, cache: LightCache) {
  const { w, h } = s;
  const L = sunVector(rig.sun);
  const sunI = rig.sun.intensity;
  const flat = sunAbove(rig.sun);
  const base = exposureOf(rig);
  const term = cache.sunTerm;
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const v = normals[i];
    const nx = ((v & 255) - 128) * INV127;
    const ny = (((v >>> 8) & 255) - 128) * INV127;
    const nz = (((v >>> 16) & 255) - 128) * INV127;
    const ndl = nx * L.x + ny * L.y + nz * L.z;
    term[i] = base + (ndl - flat) * sunI * RELIEF;
  }
  const st = cache.sunState;
  st[0] = rig.sun.azimuth;
  st[1] = rig.sun.elevation;
  st[2] = rig.sun.intensity;
  st[3] = rig.ambient;
}

const sunTermFresh = (cache: LightCache, rig: LightRig) => {
  const st = cache.sunState;
  return (
    st[0] === rig.sun.azimuth && st[1] === rig.sun.elevation && st[2] === rig.sun.intensity && st[3] === rig.ambient
  );
};

function fillPointLights(cache: LightCache, rig: LightRig, t: number) {
  const lf = cache.lightField;
  lf.fill(0);
  if (rig.points.length === 0) return;
  const { lw, lh, w, h } = cache;

  for (let k = 0; k < rig.points.length; k++) {
    const p = rig.points[k];
    const flick = p.flicker ? 1 - p.flicker * 0.55 * (0.5 + 0.5 * fbm1(t * 5.5 + k * 3.17, 71 + k * 13)) : 1;
    const inten = p.intensity * flick;
    if (inten <= 0.002) continue;
    const r = p.radius;
    const r2 = r * r;

    const cx0 = Math.max(0, ((p.x - r) / LIGHT_STEP) | 0);
    const cx1 = Math.min(lw - 1, ((p.x + r) / LIGHT_STEP) | 0);
    const cy0 = Math.max(0, ((p.y - r) / LIGHT_STEP) | 0);
    const cy1 = Math.min(lh - 1, ((p.y + r) / LIGHT_STEP) | 0);

    for (let cy = cy0; cy <= cy1; cy++) {
      const sy = cy * LIGHT_STEP + LIGHT_STEP / 2;
      const dy = p.y - sy;
      const dy2 = dy * dy;
      const row = cy * lw;
      for (let cx = cx0; cx <= cx1; cx++) {
        const dx = p.x - (cx * LIGHT_STEP + LIGHT_STEP / 2);
        const d2 = dx * dx + dy2;
        if (d2 > r2) continue;
        const d = Math.sqrt(d2);
        const atten = 1 - d / r;
        // The lamp sits above the floor, so its cosine term depends on distance
        // alone on a flat surface — which is why it can be baked in here.
        const lz = 1 / (1 + d / r);
        lf[row + cx] += atten * atten * inten * (0.6 + 1.25 * lz);
      }
    }
  }
}

/**
 * Shade the board into `out`. `t` is seconds — used only for flicker, so the
 * same t always gives the same frame.
 */
export function shade(s: Surface, normals: Uint32Array, rig: LightRig, out: Uint32Array, t: number, cache: LightCache) {
  if (!sunTermFresh(cache, rig)) buildSunTerm(s, normals, rig, cache);
  fillPointLights(cache, rig, t);

  const { w, h, mat, idx, spec, tag } = s;
  const term = cache.sunTerm;
  const lf = cache.lightField;
  const lw = cache.lw;
  const bayer = BAYER4;
  const colour = COLOUR_OF;
  const n = w * h;

  for (let y = 0, i = 0; y < h; y++) {
    const lrow = (y >> 2) * lw;
    const yq = (y & 3) << 2;
    for (let x = 0; x < w; x++, i++) {
      const m = mat[i];
      if (m === M_FIRE) {
        out[i] = colour[(m << 4) + idx[i]];
        continue;
      }
      if (m === 0 && tag[i] === TAG.VOID) {
        out[i] = colour[idx[i]];
        continue;
      }

      // The luminance mask rides *inside* the light value rather than as a
      // second threshold: one comparison per pixel instead of two, and the
      // glint dithers with everything else instead of stamping a lone step.
      const t0 = term[i];
      const f = t0 + lf[lrow + (x >> 2)] + spec[i] * SPEC_GAIN * (t0 > 2 ? t0 - 2 : 0);
      const fl = Math.floor(f);
      // Dither only within a quarter-step of the boundary. A Bayer threshold
      // spread over the whole range turns every mid-tone into a 1 px chequer,
      // which reads as woven cloth rather than stone; constraining it to the
      // ambiguous sliver gives a 1–2 px seam at a band edge and flat fields
      // everywhere else, which is what hand-placed pixel art looks like.
      let ii = idx[i] + fl + (f - fl > 0.375 + bayer[yq | (x & 3)] * 0.25 ? 1 : 0);

      const top = RAMP_LEN[m] - 1;
      if (ii < 0) ii = 0;
      else if (ii > top) ii = top;
      out[i] = colour[(m << 4) + ii];
    }
  }
}

/** A single sample of the light at a board position, for sprites drawn after the
 *  pass (tokens) so they sit in the same light as the floor. */
export function lightShiftAt(x: number, y: number, rig: LightRig, t: number): number {
  const L = sunVector(rig.sun);
  const flat = sunAbove(rig.sun);
  // A token stands up, so its normal is straight up: ndl is just Lz.
  let f = exposureOf(rig) + (L.z - flat) * rig.sun.intensity * RELIEF;
  for (let k = 0; k < rig.points.length; k++) {
    const p = rig.points[k];
    const dx = p.x - x;
    const dy = p.y - y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    if (d > p.radius) continue;
    const atten = 1 - d / p.radius;
    const flick = p.flicker ? 1 - p.flicker * 0.55 * (0.5 + 0.5 * fbm1(t * 5.5 + k * 3.17, 71 + k * 13)) : 1;
    f += atten * atten * p.intensity * flick * 1.6;
  }
  return Math.round(clamp(f, -5, 5));
}
