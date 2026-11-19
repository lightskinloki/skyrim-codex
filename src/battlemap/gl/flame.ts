import { M_FIRE } from '../surface';
import { hf } from '../rng';
import type { Tex } from './texture';
import type { SceneFire, Tri, Vec3 } from './scene';

/**
 * Fire is geometry, not a sprite. See docs/BATTLEMAP-SPEC.md §17.
 *
 * A painted flame is a card: it has a position but no body, so from a low angle
 * it thins to a line and from a high one it lies flat on the floor it is meant
 * to be burning above. These are real tapered tongues standing in the bowl,
 * plus a coal bed and a few embers — triangles like every other prop, so the
 * camera, the depth buffer and the occluders all treat fire exactly like a
 * chair. The only billboards left in the scene are the character tokens.
 *
 * They are *emissive*: each vertex carries its own light instead of being lit
 * by the sun, which is what a flame does. That is the whole trick — no second
 * renderer, no additive pass, just a triangle that ignores the light rig.
 */

const TAU = Math.PI * 2;

/** A one-texel ramp step: emission alone decides the colour. */
const flat: Tex = { w: 1, h: 1, idx: new Uint8Array([0]), mx: 0, my: 0 };

/** The bed of coals. Ramp steps, so the bed mottles without leaving the palette. */
const coals: Tex = (() => {
  const w = 16;
  const h = 16;
  const idx = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = hf(0x7c1d, x, y);
      // Two steps, not four: a wide ramp made the whole bed a pale disc, and
      // from above the bed is most of what you see of a brazier.
      idx[y * w + x] = v > 0.82 ? 2 : v > 0.4 ? 1 : 0;
    }
  }
  return { w, h, idx, mx: w - 1, my: h - 1 };
})();

const push = (
  out: Tri[],
  p0: Vec3,
  p1: Vec3,
  p2: Vec3,
  n: Vec3,
  tex: Tex,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  l0: number,
  l1: number,
  l2: number,
) => {
  out.push({
    p0,
    p1,
    p2,
    n,
    tex,
    mat: M_FIRE,
    cast: false,
    receives: false,
    u0,
    v0,
    u1,
    v1,
    u2,
    v2,
    emit: [l0, l1, l2],
  });
};

/** A small emissive box: coals, and the sparks that rise off them. */
function emberBox(out: Tri[], cx: number, cz: number, y0: number, y1: number, r: number, lit: number) {
  const b: Vec3[] = [
    [cx - r, y0, cz - r],
    [cx + r, y0, cz - r],
    [cx + r, y0, cz + r],
    [cx - r, y0, cz + r],
  ];
  const t: Vec3[] = b.map((p) => [p[0], y1, p[2]] as Vec3);
  push(out, t[0], t[1], t[2], [0, 1, 0], flat, 0, 0, 0, 0, 0, 0, lit, lit, lit);
  push(out, t[0], t[2], t[3], [0, 1, 0], flat, 0, 0, 0, 0, 0, 0, lit, lit, lit);
  const sides: [number, number, Vec3][] = [
    [0, 1, [0, 0, -1]],
    [1, 2, [1, 0, 0]],
    [2, 3, [0, 0, 1]],
    [3, 0, [-1, 0, 0]],
  ];
  for (const [i, j, n] of sides) {
    push(out, b[i], b[j], t[j], n, flat, 0, 0, 0, 0, 0, 0, lit - 1.4, lit - 1.4, lit - 0.4);
    push(out, b[i], t[j], t[i], n, flat, 0, 0, 0, 0, 0, 0, lit - 1.4, lit - 0.4, lit - 0.4);
  }
}

/**
 * The fire's composition, authored rather than hashed.
 *
 * Five random cones have no silhouette: every brazier gets its own blob, and
 * from above they all collapse into the same disc. These are the licks a bowl
 * of coals actually has — a white-hot core, a main lick, two side licks, a
 * back lick, and three short crowns that curl over the rim. The seed only
 * jitters the composition and spins it per brazier, so the fire keeps a front
 * and a lean from every camera angle. The crowns are what make a top-down view
 * read as fire: they project *outward past the bowl* instead of stacking under
 * the core.
 */
type Tongue = {
  /** Base offset from the fire's centre, in cells. */
  ox: number;
  oz: number;
  height: number;
  radius: number;
  /** Tip offset from the base: the lick's lean. */
  lx: number;
  lz: number;
  low: number;
  mid: number;
  tip: number;
  sides: number;
};

const TONGUES: Tongue[] = [
  // The core: tallest, whitest, and almost upright.
  { ox: 0.0, oz: 0.0, height: 0.86, radius: 0.07, lx: 0.02, lz: 0.01, low: 11.6, mid: 10.4, tip: 8.6, sides: 5 },
  { ox: 0.06, oz: 0.02, height: 0.78, radius: 0.088, lx: 0.11, lz: 0.03, low: 9.8, mid: 8.4, tip: 6.0, sides: 5 },
  { ox: -0.1, oz: 0.05, height: 0.62, radius: 0.07, lx: -0.13, lz: 0.05, low: 9.4, mid: 8.0, tip: 5.6, sides: 5 },
  { ox: 0.08, oz: -0.07, height: 0.54, radius: 0.062, lx: 0.12, lz: -0.08, low: 9.5, mid: 8.0, tip: 5.6, sides: 5 },
  { ox: -0.05, oz: -0.09, height: 0.46, radius: 0.058, lx: -0.06, lz: -0.13, low: 9.1, mid: 7.8, tip: 5.4, sides: 5 },
  // Crowns: short, wide, thrown out over the rim. Read from above.
  { ox: 0.17, oz: 0.04, height: 0.3, radius: 0.065, lx: 0.18, lz: 0.03, low: 9.9, mid: 8.6, tip: 6.6, sides: 4 },
  { ox: -0.16, oz: 0.08, height: 0.27, radius: 0.06, lx: -0.18, lz: 0.07, low: 9.7, mid: 8.4, tip: 6.4, sides: 4 },
  { ox: 0.02, oz: -0.17, height: 0.25, radius: 0.058, lx: 0.02, lz: -0.19, low: 9.5, mid: 8.2, tip: 6.2, sides: 4 },
  // The skirt: low licks lying across the coals. From above these are the fire
  // — a ragged orange edge outside the core, instead of a glowing disc.
  { ox: 0.2, oz: 0.02, height: 0.12, radius: 0.055, lx: 0.1, lz: 0.01, low: 8.9, mid: 7.9, tip: 5.8, sides: 4 },
  { ox: -0.11, oz: 0.17, height: 0.11, radius: 0.05, lx: -0.06, lz: 0.09, low: 8.7, mid: 7.7, tip: 5.6, sides: 4 },
  { ox: -0.16, oz: -0.1, height: 0.13, radius: 0.052, lx: -0.08, lz: -0.05, low: 9.0, mid: 8.0, tip: 5.9, sides: 4 },
];

/** A ring of points around a flame tongue, tapering as it rises. */
const ring = (cx: number, cz: number, r: number, sides: number, phase: number): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = phase + (i / sides) * TAU;
    pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return pts;
};

/**
 * One flame, in cell space, rebuilt every frame.
 *
 * Everything that moves is a function of `time` only — no state is carried
 * between frames, so the fire flickers identically in the browser, in a still
 * dumped offline and in the four-panel contact sheet.
 */
function buildFire(out: Tri[], F: SceneFire, time: number, seed: number) {
  const id = Math.round(F.x * 8) * 131 + Math.round(F.z * 8);
  const s = (seed ^ (id * 0x27d4)) >>> 0;
  const base = F.y;

  /* ---------------------------------------------------------- coal bed */
  const bed = 0.235;
  const sides = 8;
  const bedPhase = hf(s, 1, 0) * TAU;
  const bedPts = ring(F.x, F.z, bed, sides, bedPhase);
  for (let i = 0; i < sides; i++) {
    const a = bedPts[i];
    const b = bedPts[(i + 1) % sides];
    push(
      out,
      [F.x, base, F.z],
      [a[0], base, a[1]],
      [b[0], base, b[1]],
      [0, 1, 0],
      coals,
      F.x * 32,
      F.z * 32,
      a[0] * 32,
      a[1] * 32,
      b[0] * 32,
      b[1] * 32,
      6.3 + hf(s, i, 9) * 0.5,
      6.3 + hf(s, i, 9) * 0.5,
      6.3 + hf(s, i, 9) * 0.5,
    );
  }

  /* ------------------------------------------------------------- coals */
  for (let k = 0; k < 3; k++) {
    const a = bedPhase + (k / 3) * TAU + hf(s, k, 2) * 0.7;
    const d = 0.1 + hf(s, k, 3) * 0.09;
    const cx = F.x + Math.cos(a) * d;
    const cz = F.z + Math.sin(a) * d;
    const r = 0.035 + hf(s, k, 4) * 0.03;
    const top = base + 0.012 + hf(s, k, 5) * 0.02;
    emberBox(out, cx, cz, base, top, r, 8.6 + hf(s, k, 6) * 1.2);
  }

  /* ----------------------------------------------------------- tongues */
  // One composition, spun per brazier and jittered by the seed — not five
  // random cones. The flame has a front, a lean and a ragged edge, and the
  // crown licks sit outside the core so a top-down camera sees fire around the
  // coal bed instead of a glowing disc.
  const spin = hf(s, 3, 1) * TAU;
  const cs = Math.cos(spin);
  const sn = Math.sin(spin);
  const rot = (x: number, z: number): [number, number] => [x * cs - z * sn, x * sn + z * cs];

  for (let n = 0; n < TONGUES.length; n++) {
    const T = TONGUES[n];
    const phase = hf(s, n, 11) * TAU;
    const breathe = 0.9 + 0.22 * (0.5 + 0.5 * Math.sin(time * 2.5 + phase * 2.1));
    const h = T.height * breathe;
    const [ox, oz] = rot(T.ox, T.oz);
    const [leanX, leanZ] = rot(T.lx, T.lz);
    const sway = Math.sin(time * 2.0 + phase) * 0.018;
    const lx = leanX + sway;
    const lz = leanZ + sway * 0.7;
    const bx = F.x + ox;
    const bz = F.z + oz;
    const r0 = T.radius * (0.9 + 0.2 * hf(s, n, 16));

    const sidesN = T.sides;
    const ph = hf(s, n, 17) * TAU;
    const lower = ring(bx, bz, r0, sidesN, ph);
    const midY = base + h * 0.56;
    const mid = ring(bx + lx * 0.35, bz + lz * 0.35, r0 * 0.52, sidesN, ph);
    const tipY = base + h;
    const tip = ring(bx + lx, bz + lz, 0.005, sidesN, ph);

    const flick = 0.35 * Math.sin(time * 6.1 + phase * 3.1) + 0.2 * Math.sin(time * 9.7 + phase);
    // The profile's own temperatures: the core goes white, the crowns stay
    // orange at their tips. Flicker is a nudge on top, not the palette.
    const lLow = T.low + flick * 0.45;
    const lMid = T.mid + flick * 0.35;
    const lTip = T.tip + flick * 0.5;

    const band = (A: [number, number][], B: [number, number][], ay: number, by: number, la: number, lb: number) => {
      for (let i = 0; i < sidesN; i++) {
        const i2 = (i + 1) % sidesN;
        const am = ph + ((i + 0.5) / sidesN) * TAU;
        // Nearly horizontal, so the silhouette is decided by facing and not by
        // the camera's tilt: a flame should not lose its edge looking down.
        const nrm: Vec3 = [Math.cos(am), 0.08, Math.sin(am)];
        const a0: Vec3 = [A[i][0], ay, A[i][1]];
        const a1: Vec3 = [A[i2][0], ay, A[i2][1]];
        const b0: Vec3 = [B[i][0], by, B[i][1]];
        const b1: Vec3 = [B[i2][0], by, B[i2][1]];
        push(out, a0, a1, b1, nrm, flat, 0, 0, 0, 0, 0, 0, la, la, lb);
        push(out, a0, b1, b0, nrm, flat, 0, 0, 0, 0, 0, 0, la, lb, lb);
        // Double-sided. A flame is an open tube, and from a high camera you
        // look down it: culled back faces would punch a hole straight through
        // the fire to the coals. The inner wall is the same emission, so the
        // volume reads as solid from every angle.
        const back: Vec3 = [-nrm[0], -nrm[1], -nrm[2]];
        push(out, b1, a1, a0, back, flat, 0, 0, 0, 0, 0, 0, lb, la, la);
        push(out, b0, b1, a0, back, flat, 0, 0, 0, 0, 0, 0, lb, lb, la);
      }
    };
    band(lower, mid, base, midY, lLow, lMid);
    band(mid, tip, midY, tipY, lMid, lTip);
  }

  /* ------------------------------------------------------------ embers */
  for (let k = 0; k < 4; k++) {
    const cycle = 1.15 + hf(s, k, 21) * 0.5;
    const t = ((time + hf(s, k, 22) * cycle) % cycle) / cycle;
    const a = hf(s, k, 23) * TAU + t * 2.2;
    const r = 0.06 + hf(s, k, 24) * 0.14;
    const cx = F.x + Math.cos(a) * r * (0.4 + t);
    const cz = F.z + Math.sin(a) * r * (0.4 + t);
    const y = base + 0.2 + t * (0.5 + hf(s, k, 25) * 0.35);
    const size = (0.02 + hf(s, k, 26) * 0.018) * (1 - t * 0.45);
    emberBox(out, cx, cz, y, y + size * 2.2, size, 9.6 - t * 4.6);
  }
}

/** Every fire in the room, as triangles, for this instant. */
export function flameTris(fires: SceneFire[], time: number, seed: number): Tri[] {
  const out: Tri[] = [];
  for (let i = 0; i < fires.length; i++) buildFire(out, fires[i], time, seed + i * 7919);
  return out;
}
