import { M_AUTUMN, M_GRASS, M_METAL, M_SLATE, M_STONE_PROP, M_WOOD_PROP } from '../surface';
import type { Tex } from './texture';
import type { Collider, SceneLight, Tri, Vec3 } from './scene';

/**
 * Things that move while the table sits still: gears that turn, a drill that
 * bores, sarcophagi that pulse, trees and banners in a draught.
 *
 * A moving part is ordinary geometry built once with the room, plus a rule for
 * where it is at a given instant. The scene keeps the rest pose; the renderer
 * asks `animTris` for this frame's copy, the way it asks for this frame's
 * flame. Nothing is rebuilt and nothing is a sprite, so a turning gear is lit,
 * depth-tested and inked like the wall it is bolted to.
 *
 * Moving parts do not cast the sun shadow. The shadow mask is cached against the
 * camera and the sun (BATTLEMAP-SPEC §17 R4b), and a caster that moves every
 * frame would either break that cache or leave a shadow that does not follow
 * it. The static mounts — axles, housings, trunks — still cast.
 */

export type AnimKind = 'spin' | 'sway' | 'hang' | 'piston' | 'pulse';

export type SceneAnim = {
  kind: AnimKind;
  /** The rest pose. Shared corner arrays, exactly like a static prop's. */
  tris: Tri[];
  /** The pivot: an axle's centre, a trunk's foot, a banner's rail. */
  origin: Vec3;
  /** Unit vector: the spin axis, the piston's travel, or the wind. */
  axis: Vec3;
  /** Radians per second for a spin; cycles per second for everything else. */
  rate: number;
  /** Piston travel and sway lean in cells, pulse swing in ramp steps. */
  amp: number;
  phase: number;
  /** Sway and hang: the height over (or under) the pivot where the lean is `amp`. */
  height?: number;
};

const TAU = Math.PI * 2;

/** One texel: an emissive triangle's colour is its material and its light. */
const glowTex: Tex = { w: 1, h: 1, idx: new Uint8Array([0]), mx: 0, my: 0 };

/* ------------------------------------------------------------------- frame */
const rotate = (p: Vec3, o: Vec3, k: Vec3, c: number, s: number): Vec3 => {
  // Rodrigues about the axis k through o.
  const x = p[0] - o[0];
  const y = p[1] - o[1];
  const z = p[2] - o[2];
  const d = (k[0] * x + k[1] * y + k[2] * z) * (1 - c);
  const cx = k[1] * z - k[2] * y;
  const cy = k[2] * x - k[0] * z;
  const cz = k[0] * y - k[1] * x;
  return [
    o[0] + x * c + cx * s + k[0] * d,
    o[1] + y * c + cy * s + k[1] * d,
    o[2] + z * c + cz * s + k[2] * d,
  ];
};

/**
 * This instant's triangles for every moving part. Called once per frame; a
 * room's moving parts are a few hundred triangles, so a fresh copy is cheaper
 * than any bookkeeping that would avoid it.
 */
export function animTris(anims: SceneAnim[], time: number): Tri[] {
  const out: Tri[] = [];
  for (const A of anims) {
    const moved = new Map<Vec3, Vec3>();
    let move: (p: Vec3) => Vec3;
    let turnN: ((n: Vec3) => Vec3) | null = null;
    let emit: number | null = null;

    if (A.kind === 'spin') {
      const ang = A.rate * time + A.phase;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const zero: Vec3 = [0, 0, 0];
      move = (p) => rotate(p, A.origin, A.axis, c, s);
      turnN = (n) => rotate(n, zero, A.axis, c, s);
    } else if (A.kind === 'piston') {
      const t = A.amp * (0.5 - 0.5 * Math.cos(TAU * A.rate * time + A.phase));
      move = (p) => [p[0] + A.axis[0] * t, p[1] + A.axis[1] * t, p[2] + A.axis[2] * t];
    } else if (A.kind === 'pulse') {
      // A heartbeat, not a sine: a quick double throb and a long rest, which is
      // what "pulsing like a heart" looks like from across a crypt.
      const ph = (A.rate * time + A.phase / TAU) % 1;
      const beat = Math.max(0, Math.sin(ph * TAU * 2)) * (ph < 0.5 ? 1 : 0.15);
      emit = A.amp * beat;
      move = (p) => p;
    } else {
      // A gust under a slow sway, so a stand of trees does not move in lockstep.
      const w = TAU * A.rate * time + A.phase;
      const lean = A.amp * (Math.sin(w) * 0.75 + Math.sin(w * 2.31 + 1.3) * 0.25);
      const H = A.height ?? 1;
      const hang = A.kind === 'hang';
      move = (p) => {
        const h = hang ? A.origin[1] - p[1] : p[1] - A.origin[1];
        if (h <= 0) return p;
        const f = Math.min(1.4, h / H);
        const d = lean * f * f;
        return [p[0] + A.axis[0] * d, p[1], p[2] + A.axis[2] * d];
      };
    }

    const at = (p: Vec3): Vec3 => {
      let q = moved.get(p);
      if (!q) {
        q = move(p);
        moved.set(p, q);
      }
      return q;
    };

    for (const T of A.tris) {
      const copy: Tri = { ...T, p0: at(T.p0), p1: at(T.p1), p2: at(T.p2) };
      if (turnN) copy.n = turnN(T.n);
      if (emit !== null && T.emit) {
        copy.emit = [T.emit[0] + emit, T.emit[1] + emit, T.emit[2] + emit];
      }
      out.push(copy);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- geometry */
const PX = 32;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a: Vec3, b: Vec3, s = 1): Vec3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * A triangle with texture coordinates projected on its own plane, so a face at
 * any angle keeps a 32-px texel. `cast` is false for every moving part.
 */
const face = (
  out: Tri[],
  a: Vec3,
  b: Vec3,
  c: Vec3,
  n: Vec3,
  mat: number,
  tex: Tex,
  cast: boolean,
) => {
  // Two in-plane axes from the normal: any pair will do for a stone or metal
  // texture, as long as it is the same pair for every corner of the face.
  const ref: Vec3 = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = norm(cross(ref, n));
  const e2 = cross(n, e1);
  const uv = (p: Vec3): [number, number] => [
    (p[0] * e1[0] + p[1] * e1[1] + p[2] * e1[2]) * PX,
    (p[0] * e2[0] + p[1] * e2[1] + p[2] * e2[2]) * PX,
  ];
  const [u0, v0] = uv(a);
  const [u1, v1] = uv(b);
  const [u2, v2] = uv(c);
  out.push({ p0: a, p1: b, p2: c, u0, v0, u1, v1, u2, v2, n, mat, tex, cast, receives: false });
};

const quad = (out: Tri[], a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3, mat: number, tex: Tex, cast: boolean) => {
  face(out, a, b, c, n, mat, tex, cast);
  face(out, a, c, d, n, mat, tex, cast);
};

/** A box with its own axes: a spoke, a lever, a chain link. Axes are unit. */
export const orientedBox = (
  out: Tri[],
  c: Vec3,
  X: Vec3,
  Y: Vec3,
  Z: Vec3,
  hx: number,
  hy: number,
  hz: number,
  mat: number,
  tex: Tex,
  cast: boolean,
) => {
  const P = (sx: number, sy: number, sz: number): Vec3 => [
    c[0] + X[0] * hx * sx + Y[0] * hy * sy + Z[0] * hz * sz,
    c[1] + X[1] * hx * sx + Y[1] * hy * sy + Z[1] * hz * sz,
    c[2] + X[2] * hx * sx + Y[2] * hy * sy + Z[2] * hz * sz,
  ];
  const neg = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]];
  // Each face wound so its corners turn about its outward normal.
  quad(out, P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1), X, mat, tex, cast);
  quad(out, P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1), neg(X), mat, tex, cast);
  quad(out, P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), Y, mat, tex, cast);
  quad(out, P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), neg(Y), mat, tex, cast);
  quad(out, P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1), Z, mat, tex, cast);
  quad(out, P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1), neg(Z), mat, tex, cast);
};

/** The plane a wheel turns in, for an axle along x or z. */
const wheelBasis = (along: 'x' | 'z'): { a: Vec3; e1: Vec3; e2: Vec3 } =>
  along === 'x'
    ? { a: [1, 0, 0], e1: [0, 0, 1], e2: [0, 1, 0] }
    : { a: [0, 0, 1], e1: [0, 1, 0], e2: [1, 0, 0] };

/**
 * A toothed wheel: a disc with square teeth, three spokes proud of each face
 * and a hub. The disc is one polygon per face, so a gear is a few dozen
 * triangles however many teeth it has.
 */
const gearWheel = (
  out: Tri[],
  C: Vec3,
  along: 'x' | 'z',
  r: number,
  thick: number,
  mat: number,
  tex: Tex,
) => {
  const { a, e1, e2 } = wheelBasis(along);
  const teeth = Math.max(8, Math.round(r * 16));
  const tip = r;
  const root = r - Math.min(0.12, r * 0.18);
  const pts: { ang: number; rad: number }[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * TAU;
    const step = TAU / teeth;
    pts.push({ ang: a0, rad: root });
    pts.push({ ang: a0 + step * 0.18, rad: tip });
    pts.push({ ang: a0 + step * 0.5, rad: tip });
    pts.push({ ang: a0 + step * 0.68, rad: root });
  }
  const P = (ang: number, rad: number, d: number): Vec3 =>
    add3(add3(add3(C, e1, Math.cos(ang) * rad), e2, Math.sin(ang) * rad), a, d);
  const front = thick / 2;
  const cF = add3(C, a, front);
  const cB = add3(C, a, -front);
  const nF = a;
  const nB: Vec3 = [-a[0], -a[1], -a[2]];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const f0 = P(p.ang, p.rad, front);
    const f1 = P(q.ang, q.rad, front);
    const b0 = P(p.ang, p.rad, -front);
    const b1 = P(q.ang, q.rad, -front);
    // The raster takes either winding; facing is decided by the normal alone.
    face(out, cF, f0, f1, nF, mat, tex, false);
    face(out, cB, b0, b1, nB, mat, tex, false);
    const mid = (p.ang + q.ang) / 2 + (q.ang < p.ang ? Math.PI : 0);
    const nR = norm(add3(add3([0, 0, 0], e1, Math.cos(mid)), e2, Math.sin(mid)));
    quad(out, b0, b1, f1, f0, nR, mat, tex, false);
  }
  // Spokes stand proud of both faces, so the turn reads even edge-on.
  for (let k = 0; k < 3; k++) {
    const ang = (k / 3) * Math.PI;
    const X = norm(add3(add3([0, 0, 0], e1, Math.cos(ang)), e2, Math.sin(ang)));
    const Y = cross(a, X);
    orientedBox(out, C, X, Y, a, root * 0.92, Math.max(0.035, r * 0.07), thick / 2 + 0.025, mat, tex, false);
  }
  orientedBox(out, C, e1, e2, a, r * 0.2, r * 0.2, thick / 2 + 0.05, M_METAL, tex, false);
};

/* ------------------------------------------------------------------ rules */
export type AnimTextures = { metal: Tex; stone: Tex; wood: Tex };

export type AnimSink = {
  tris: Tri[];
  anims: SceneAnim[];
  colliders: Collider[];
  lights: SceneLight[];
};

const glow = (out: Tri[], a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3, base: number) => {
  for (const [p, q, r] of [
    [a, b, c],
    [a, c, d],
  ] as [Vec3, Vec3, Vec3][]) {
    out.push({
      p0: p,
      p1: q,
      p2: r,
      u0: 0,
      v0: 0,
      u1: 0,
      v1: 0,
      u2: 0,
      v2: 0,
      n,
      mat: M_GRASS,
      tex: glowTex,
      cast: false,
      receives: false,
      emit: [base, base, base],
    });
  }
};

/**
 * A gear standing on its rim (or on `h`, the hub height) with its axle along
 * `along`. The footprint is the wheel's edge-on rectangle: `thick` across the
 * axle and `2r` along the wheel.
 */
export function buildGear(
  p: { at: [number, number]; r?: number; along?: 'x' | 'z'; speed?: number; h?: number },
  tex: AnimTextures,
  sink: AnimSink,
  phase: number,
) {
  const r = p.r ?? 0.6;
  const along = p.along ?? 'x';
  const thick = Math.min(0.24, 0.1 + r * 0.06);
  const hub = Math.max(p.h ?? 0, r + 0.04);
  const C: Vec3 =
    along === 'x' ? [p.at[0] + thick / 2 + 0.05, hub, p.at[1] + r] : [p.at[0] + r, hub, p.at[1] + thick / 2 + 0.05];
  const parts: Tri[] = [];
  // Bronze: the metal texture's steps on the autumn ramp.
  gearWheel(parts, C, along, r, thick, M_AUTUMN, tex.metal);
  // Bigger wheels turn slower, as they would on one drive train.
  const rate = p.speed ?? 0.9 / Math.max(0.3, r);
  const { a } = wheelBasis(along);
  sink.anims.push({ kind: 'spin', tris: parts, origin: C, axis: a, rate, amp: 0, phase });

  // The axle runs back to whatever the gear is mounted on.
  const { e1, e2 } = wheelBasis(along);
  orientedBox(sink.tris, add3(C, a, -thick), e1, e2, a, 0.05, 0.05, thick, M_METAL, tex.metal, true);
  const x0 = p.at[0];
  const z0 = p.at[1];
  const ext = thick + 0.1;
  sink.colliders.push(
    along === 'x'
      ? { x0, z0, x1: x0 + ext, z1: z0 + 2 * r, base: Math.max(0, hub - r), top: hub + r }
      : { x0, z0, x1: x0 + 2 * r, z1: z0 + ext, base: Math.max(0, hub - r), top: hub + r },
  );
}

/**
 * A boring machine: a chassis, a brass housing, a toothed bit that turns, a
 * piston that hammers, two drive gears and a cluster of soul gems that throb.
 * It bores toward `dir` along `along`; the footprint is 3 × 2 cells.
 */
export function buildDrill(
  p: { at: [number, number]; along?: 'x' | 'z'; dir?: -1 | 1 },
  tex: AnimTextures,
  sink: AnimSink,
  phase: number,
) {
  const along = p.along ?? 'x';
  const dir = p.dir ?? 1;
  const L = 3;
  const W = 2;
  // Local frame: f points where the bit bores, s across the machine.
  const f: Vec3 = along === 'x' ? [dir, 0, 0] : [0, 0, dir];
  const s: Vec3 = along === 'x' ? [0, 0, 1] : [1, 0, 0];
  const up: Vec3 = [0, 1, 0];
  const x0 = p.at[0];
  const z0 = p.at[1];
  const sizeX = along === 'x' ? L : W;
  const sizeZ = along === 'x' ? W : L;
  const centre: Vec3 = [x0 + sizeX / 2, 0, z0 + sizeZ / 2];
  const at = (df: number, dy: number, ds: number): Vec3 => add3(add3(add3(centre, f, df), up, dy), s, ds);

  // Chassis and housing. The housing sits back from the bit so the bit has
  // room to stand out from it.
  orientedBox(sink.tris, at(-0.1, 0.2, 0), f, up, s, 1.35, 0.2, 0.95, M_METAL, tex.metal, true);
  orientedBox(sink.tris, at(-0.55, 0.85, 0), f, up, s, 0.85, 0.45, 0.7, M_AUTUMN, tex.metal, true);
  orientedBox(sink.tris, at(-0.55, 1.33, 0), f, up, s, 0.7, 0.04, 0.55, M_METAL, tex.metal, true);

  // The bit: a toothed cone on the bore axis, turning fast.
  const bitTris: Tri[] = [];
  const axisC = at(0.3, 0.85, 0);
  const len = 1.15;
  const r0 = 0.5;
  const sides = 10;
  const tipP = add3(axisC, f, len);
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * TAU;
    const a1 = ((i + 1) / sides) * TAU;
    const rim = (ang: number): Vec3 => add3(add3(axisC, up, Math.cos(ang) * r0), s, Math.sin(ang) * r0);
    const q0 = rim(a0);
    const q1 = rim(a1);
    let n = norm(cross(sub(q1, q0), sub(tipP, q0)));
    // Point the facet's normal away from the axis, whichever way the cross fell.
    const outward = sub(add3(q0, q1, 1), add3(axisC, axisC, 1));
    if (n[0] * outward[0] + n[1] * outward[1] + n[2] * outward[2] < 0) n = [-n[0], -n[1], -n[2]];
    face(bitTris, q0, q1, tipP, n, M_METAL, tex.metal, false);
    // A cutting tooth on every other facet: the spin needs something to see.
    if (i % 2 === 0) {
      const am = (a0 + a1) / 2;
      const R = norm(add3(add3([0, 0, 0], up, Math.cos(am)), s, Math.sin(am)));
      const T = cross(f, R);
      orientedBox(bitTris, add3(add3(axisC, f, len * 0.3), R, r0 * 0.72), f, R, T, 0.14, 0.08, 0.05, M_METAL, tex.metal, false);
    }
  }
  sink.anims.push({ kind: 'spin', tris: bitTris, origin: axisC, axis: f, rate: 5.5 * dir, amp: 0, phase });

  // The piston: GRIND, THUD. It drives the bit's carriage forward and back.
  const pistonTris: Tri[] = [];
  orientedBox(pistonTris, at(-0.35, 1.55, 0), f, up, s, 0.6, 0.12, 0.14, M_METAL, tex.metal, false);
  orientedBox(pistonTris, at(0.2, 1.55, 0), f, up, s, 0.1, 0.18, 0.2, M_AUTUMN, tex.metal, false);
  sink.anims.push({ kind: 'piston', tris: pistonTris, origin: at(0, 1.55, 0), axis: f, rate: 0.9, amp: 0.28, phase });

  // Drive gears on both flanks, counter-turning.
  const flank = along === 'x' ? 'z' : 'x';
  for (const side of [-1, 1]) {
    const C = at(-0.7, 0.85, side * 0.78);
    const gear: Tri[] = [];
    gearWheel(gear, C, flank, 0.42, 0.1, M_AUTUMN, tex.metal);
    const { a } = wheelBasis(flank);
    sink.anims.push({ kind: 'spin', tris: gear, origin: C, axis: a, rate: 1.6 * side, amp: 0, phase: phase + side });
  }

  // Soul gems in a cradle on top: they throb as the machine draws on them.
  const gems: Tri[] = [];
  for (let k = 0; k < 3; k++) {
    const g = at(-1.05 + k * 0.32, 1.52, -0.32 + (k % 2) * 0.18);
    const r = 0.1;
    const tipU = add3(g, up, r * 1.6);
    const tipD = add3(g, up, -r * 0.9);
    const ring: Vec3[] = [add3(g, f, r), add3(g, s, r), add3(g, f, -r), add3(g, s, -r)];
    for (let i = 0; i < 4; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % 4];
      const nu = norm(add3(add3(sub(a, g), sub(b, g), 1), up, r));
      glow(gems, a, b, tipU, tipU, nu, 6);
      const nd = norm(add3(add3(sub(a, g), sub(b, g), 1), up, -r));
      glow(gems, b, a, tipD, tipD, nd, 6);
    }
  }
  sink.anims.push({ kind: 'pulse', tris: gems, origin: centre, axis: up, rate: 0.9, amp: 5, phase });
  sink.lights.push({ x: centre[0], y: 1.7, z: centre[2], radius: 2.4, intensity: 1.4, flicker: 0 });

  sink.colliders.push({ x0, z0, x1: x0 + sizeX, z1: z0 + sizeZ, base: 0, top: 1.4 });
}

/**
 * An upright sarcophagus against a wall, its lid split by a seam of necrotic
 * light that throbs. `face` is the side the lid looks toward.
 */
export function buildSarcophagus(
  p: { at: [number, number]; face?: 'n' | 's' | 'e' | 'w' },
  tex: AnimTextures,
  sink: AnimSink,
  phase: number,
) {
  const faceDir = p.face ?? 's';
  const n: Vec3 =
    faceDir === 's' ? [0, 0, 1] : faceDir === 'n' ? [0, 0, -1] : faceDir === 'e' ? [1, 0, 0] : [-1, 0, 0];
  const across: Vec3 = faceDir === 's' || faceDir === 'n' ? [1, 0, 0] : [0, 0, 1];
  const up: Vec3 = [0, 1, 0];
  const wide = 1;
  const deep = 0.6;
  const H = 2.1;
  const x0 = p.at[0];
  const z0 = p.at[1];
  const sizeX = faceDir === 's' || faceDir === 'n' ? wide : deep;
  const sizeZ = faceDir === 's' || faceDir === 'n' ? deep : wide;
  const c: Vec3 = [x0 + sizeX / 2, 0, z0 + sizeZ / 2];
  const at = (dn: number, dy: number, da: number): Vec3 => add3(add3(add3(c, n, dn), up, dy), across, da);

  // Plinth, body, and a lid that stands a hair proud with a shoulder taper.
  orientedBox(sink.tris, at(0, 0.08, 0), across, up, n, 0.5, 0.08, 0.3, M_STONE_PROP, tex.stone, true);
  orientedBox(sink.tris, at(-0.04, 1.08, 0), across, up, n, 0.42, 0.92, 0.24, M_STONE_PROP, tex.stone, true);
  orientedBox(sink.tris, at(0.02, 1.0, 0), across, up, n, 0.38, 0.78, 0.22, M_STONE_PROP, tex.stone, true);
  orientedBox(sink.tris, at(0.02, 1.86, 0), across, up, n, 0.3, 0.12, 0.22, M_STONE_PROP, tex.stone, true);

  // The seam: a vertical slit down the lid and a crossbar at the breast.
  const lid = 0.245;
  const seam: Tri[] = [];
  const slit = (dy0: number, dy1: number, da0: number, da1: number) =>
    glow(seam, at(lid, dy0, da0), at(lid, dy0, da1), at(lid, dy1, da1), at(lid, dy1, da0), n, 3);
  slit(0.35, 1.72, -0.035, 0.035);
  slit(1.32, 1.4, -0.24, 0.24);
  sink.anims.push({ kind: 'pulse', tris: seam, origin: c, axis: up, rate: 0.75, amp: 7, phase });
  const lamp = at(0.7, 1.1, 0);
  sink.lights.push({ x: lamp[0], y: lamp[1], z: lamp[2], radius: 1.8, intensity: 1.0, flicker: 0 });
  sink.colliders.push({ x0, z0, x1: x0 + sizeX, z1: z0 + sizeZ, base: 0, top: H });
}

/** A control pedestal: a stone drum with a bronze lever thrown back. */
export function buildLever(p: { at: [number, number] }, tex: AnimTextures, sink: AnimSink) {
  const c: Vec3 = [p.at[0] + 0.4, 0, p.at[1] + 0.4];
  const up: Vec3 = [0, 1, 0];
  orientedBox(sink.tris, add3(c, up, 0.42), [1, 0, 0], up, [0, 0, 1], 0.3, 0.42, 0.3, M_STONE_PROP, tex.stone, true);
  orientedBox(sink.tris, add3(c, up, 0.88), [1, 0, 0], up, [0, 0, 1], 0.36, 0.04, 0.36, M_STONE_PROP, tex.stone, true);
  const tilt = norm([0, 1, -0.55]);
  const Z = cross([1, 0, 0], tilt);
  orientedBox(sink.tris, add3(add3(c, up, 0.92), tilt, 0.3), [1, 0, 0], tilt, Z, 0.035, 0.3, 0.035, M_AUTUMN, tex.metal, true);
  orientedBox(sink.tris, add3(add3(c, up, 0.92), tilt, 0.62), [1, 0, 0], tilt, Z, 0.07, 0.05, 0.07, M_METAL, tex.metal, true);
  sink.colliders.push({ x0: c[0] - 0.36, z0: c[2] - 0.36, x1: c[0] + 0.36, z1: c[2] + 0.36, base: 0, top: 0.92 });
}

/**
 * A chain of iron links, `w` cells long along `along`, at height `h`. Links
 * alternate their plane like a real chain. It is overhead, so it blocks only a
 * flier.
 */
export function buildChain(
  p: { at: [number, number]; w?: number; along?: 'x' | 'z'; h?: number },
  tex: AnimTextures,
  sink: AnimSink,
) {
  const len = p.w ?? 3;
  const along = p.along ?? 'x';
  const y = p.h ?? 1.2;
  const f: Vec3 = along === 'x' ? [1, 0, 0] : [0, 0, 1];
  const side: Vec3 = along === 'x' ? [0, 0, 1] : [1, 0, 0];
  const up: Vec3 = [0, 1, 0];
  const start: Vec3 = along === 'x' ? [p.at[0], y, p.at[1] + 0.5] : [p.at[0] + 0.5, y, p.at[1]];
  const link = 0.26;
  const count = Math.max(1, Math.floor(len / link));
  for (let i = 0; i < count; i++) {
    const c = add3(start, f, (i + 0.5) * link);
    const flat = i % 2 === 0;
    const Y = flat ? up : side;
    const Z = flat ? side : up;
    // A link is an open loop: two bars and two ends.
    orientedBox(sink.tris, add3(c, Y, 0.06), f, Y, Z, link * 0.62, 0.02, 0.025, M_METAL, tex.metal, true);
    orientedBox(sink.tris, add3(c, Y, -0.06), f, Y, Z, link * 0.62, 0.02, 0.025, M_METAL, tex.metal, true);
    orientedBox(sink.tris, add3(c, f, link * 0.6), f, Y, Z, 0.02, 0.08, 0.025, M_METAL, tex.metal, true);
    orientedBox(sink.tris, add3(c, f, -link * 0.6), f, Y, Z, 0.02, 0.08, 0.025, M_METAL, tex.metal, true);
  }
  const x0 = Math.min(start[0], start[0] + f[0] * len) - 0.1;
  const x1 = Math.max(start[0], start[0] + f[0] * len) + 0.1;
  const z0 = Math.min(start[2], start[2] + f[2] * len) - 0.1;
  const z1 = Math.max(start[2], start[2] + f[2] * len) + 0.1;
  sink.colliders.push({ x0, z0, x1, z1, base: y - 0.12, top: y + 0.12 });
}

/**
 * A greatsword driven in point-first: blade, crossguard and a leather-wrapped
 * grip. The hilt stands at `at` (its cell's centre), `h` above the deck, and
 * the point goes toward `dir` along `along`. It is a wedge, not a hazard, so
 * it collides only where it is.
 */
export function buildBlade(
  p: { at: [number, number]; along?: 'x' | 'z'; dir?: -1 | 1; h?: number },
  tex: AnimTextures,
  sink: AnimSink,
) {
  const along = p.along ?? 'x';
  const dir = p.dir ?? 1;
  const f: Vec3 = along === 'x' ? [dir, 0, 0] : [0, 0, dir];
  const side: Vec3 = along === 'x' ? [0, 0, 1] : [1, 0, 0];
  const up: Vec3 = [0, 1, 0];
  const hilt: Vec3 = [p.at[0] + 0.5, p.h ?? 1, p.at[1] + 0.5];
  // Ebony is near-black: the slate ramp, bottom steps.
  orientedBox(sink.tris, add3(hilt, f, 0.95), f, up, side, 0.85, 0.09, 0.022, M_SLATE, tex.metal, true);
  orientedBox(sink.tris, add3(hilt, f, 0.06), f, up, side, 0.035, 0.24, 0.05, M_METAL, tex.metal, true);
  orientedBox(sink.tris, add3(hilt, f, -0.22), f, up, side, 0.24, 0.035, 0.035, M_WOOD_PROP, tex.wood, true);
  orientedBox(sink.tris, add3(hilt, f, -0.5), f, up, side, 0.05, 0.05, 0.05, M_METAL, tex.metal, true);
  const a = add3(hilt, f, -0.55);
  const b = add3(hilt, f, 1.8);
  sink.colliders.push({
    x0: Math.min(a[0], b[0]) - 0.1,
    z0: Math.min(a[2], b[2]) - 0.1,
    x1: Math.max(a[0], b[0]) + 0.1,
    z1: Math.max(a[2], b[2]) + 0.1,
    base: hilt[1] - 0.25,
    top: hilt[1] + 0.25,
  });
}

/** Wind for every swaying thing in a room: one direction, so a stand of trees
 *  leans together and reads as weather rather than as jitter. */
export const WIND: Vec3 = norm([1, 0, 0.35]);
