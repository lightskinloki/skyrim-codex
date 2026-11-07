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
      idx[y * w + x] = v > 0.86 ? 3 : v > 0.58 ? 2 : v > 0.24 ? 1 : 0;
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
      8.1 + hf(s, i, 9) * 0.7,
      8.1 + hf(s, i, 9) * 0.7,
      8.1 + hf(s, i, 9) * 0.7,
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
    emberBox(out, cx, cz, base, top, r, 9.4 + hf(s, k, 6) * 1.2);
  }

  /* ----------------------------------------------------------- tongues */
  // Five tongues, not one cone: a flame is a cluster of licks that lean
  // independently, and the gaps between them are where the coal bed shows
  // through. Sized to a brazier, not to the sprite it replaced: 0.4–0.8 cells
  // tall and about a third of a cell across at the bed.
  for (let n = 0; n < 5; n++) {
    const phase = hf(s, n, 11) * TAU;
    const breathe = 0.85 + 0.3 * (0.5 + 0.5 * Math.sin(time * 2.7 + phase * 2.3));
    const h = (0.52 + hf(s, n, 12) * 0.4) * breathe;
    const ang = hf(s, n, 13) * TAU + time * 0.32;
    const off = n === 0 ? 0.012 : 0.055 + hf(s, n, 14) * 0.085;
    const bx = F.x + Math.cos(ang) * off;
    const bz = F.z + Math.sin(ang) * off;
    const lean = 0.07 + hf(s, n, 15) * 0.06;
    const sway = Math.sin(time * 2.1 + phase) * 0.016;
    const lx = Math.cos(ang + 1.3) * lean + sway;
    const lz = Math.sin(ang + 1.3) * lean + sway * 0.7;
    const r0 = 0.062 + hf(s, n, 16) * 0.045;

    const sidesN = 5;
    const ph = hf(s, n, 17) * TAU;
    const lower = ring(bx, bz, r0, sidesN, ph);
    const midY = base + h * 0.56;
    const mid = ring(bx + lx * 0.35, bz + lz * 0.35, r0 * 0.52, sidesN, ph);
    const tipY = base + h;
    const tip = ring(bx + lx, bz + lz, 0.005, sidesN, ph);

    const flick = 0.35 * Math.sin(time * 6.1 + phase * 3.1) + 0.2 * Math.sin(time * 9.7 + phase);
    // One tongue is the white-hot core; the rest are the orange body of the
    // flame. Without that split the whole fire reads as a pale lamp.
    const core = n === 0;
    const heat = 0.9 + hf(s, n, 18) * 1.1;
    const lLow = core ? 11.4 + flick * 0.6 : 8.4 + heat * 0.5 + flick;
    const lMid = core ? 10.2 + flick * 0.5 : 7.4 + heat * 0.25 + flick * 0.6;
    const lTip = core ? 8.6 + flick * 0.5 : 5.2 + flick * 0.6;

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
