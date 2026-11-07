import { M_CLOTH_NAVY, M_CLOTH_RED, M_FLOOR, M_METAL, M_STONE_PROP, M_WALL, M_WOOD_PROP } from '../surface';
import { clamp, hf, mottle } from '../rng';
import type { Facing, Room, TokenPlacement } from '../room';
import {
  Tex,
  clothTexture,
  floorTexture,
  metalTexture,
  rugTexture,
  stoneTexture,
  wallFaceTexture,
  wallTopTexture,
  woodTexture,
} from './texture';

/**
 * The board as a 3D scene: solids with real volumes, a floor, and the
 * colliders that go with them. See docs/BATTLEMAP-SPEC.md §17.
 *
 * There is no sprite in here. A bench is a seat slab and two end supports; a
 * shelf is a back, two sides and four boards; a barrel is a twelve-sided prism
 * with two iron hoops around it. That is the whole change: an object's position
 * is now its geometry, and its geometry is a volume the camera can walk around.
 * Occlusion is not authored anywhere — the depth buffer settles it.
 *
 * Everything is in **cell units**: x east, y up, z south. One cell is one
 * metre-ish, which keeps the numbers readable and makes collision a plain AABB
 * test.
 */

export type Vec3 = [number, number, number];

export type Tri = {
  p0: Vec3;
  p1: Vec3;
  p2: Vec3;
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  u2: number;
  v2: number;
  n: Vec3;
  mat: number;
  tex: Tex;
  /** Contributes to the projected sun shadow. Floors do not. */
  cast: boolean;
  /** Takes the projected sun shadow. Floors and rugs do. */
  receives: boolean;
  /** Wall coping: weathered, and a step under the flagstones. */
  cap?: boolean;
};

export type Collider = {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** Top of the solid, in cells. A rug is 0; a wall is 1.125. */
  h: number;
};

export type SceneLight = {
  x: number;
  y: number;
  z: number;
  radius: number;
  intensity: number;
  flicker: number;
};

export type SceneToken = {
  id: string;
  spec: TokenPlacement['spec'];
  x: number;
  z: number;
  facing: Facing;
};

export type SceneFire = { x: number; y: number; z: number };

export type Scene = {
  room: Room;
  seed: number;
  cols: number;
  rows: number;
  tris: Tri[];
  tokens: SceneToken[];
  fires: SceneFire[];
  lights: SceneLight[];
  colliders: Collider[];
  /** Ambient occlusion on the cell-corner lattice, in ramp steps. */
  ao: Float32Array;
  /** AO plus the room-scale wash, already summed for the floor. */
  floorAmb: Float32Array;
  grid: Uint8Array;
};

export const WALL_H = 1.875;
/** Near walls are cut down to a curb so the room can be seen into. */
export const CURB_H = 0.16;
const PX = 32;

type UvFn = (p: Vec3) => [number, number];

const uvTop: UvFn = (p) => [p[0] * PX, p[2] * PX];
const uvX: UvFn = (p) => [p[0] * PX, p[1] * PX];
const uvZ: UvFn = (p) => [p[2] * PX, p[1] * PX];

const addQuad = (
  tris: Tri[],
  a: Vec3,
  b: Vec3,
  c: Vec3,
  d: Vec3,
  n: Vec3,
  mat: number,
  tex: Tex,
  uv: UvFn,
  cast = true,
  receives = false,
  cap = false,
) => {
  const q0 = uv(a);
  const q1 = uv(b);
  const q2 = uv(c);
  const q3 = uv(d);
  const add = (p0: Vec3, p1: Vec3, p2: Vec3, u0: number, v0: number, u1: number, v1: number, u2: number, v2: number) =>
    tris.push({ p0, p1, p2, u0, v0, u1, v1, u2, v2, n, mat, tex, cast, receives, cap });
  add(a, b, c, q0[0], q0[1], q1[0], q1[1], q2[0], q2[1]);
  add(a, c, d, q0[0], q0[1], q2[0], q2[1], q3[0], q3[1]);
};

const addBox = (
  tris: Tri[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  y0: number,
  y1: number,
  mat: number,
  tex: Tex,
  opts: { top?: boolean; bottom?: boolean; cast?: boolean } = {},
) => {
  const { top = true, bottom = false, cast = true } = opts;
  if (top) {
    addQuad(tris, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], mat, tex, uvTop, cast);
  }
  if (bottom) {
    addQuad(tris, [x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0], [0, -1, 0], mat, tex, uvTop, cast);
  }
  addQuad(tris, [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1], mat, tex, uvX, cast);
  addQuad(tris, [x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], [0, 0, 1], mat, tex, uvX, cast);
  addQuad(tris, [x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [-1, 0, 0], mat, tex, uvZ, cast);
  addQuad(tris, [x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], [1, 0, 0], mat, tex, uvZ, cast);
};

/** A prism, optionally tapered. `r0` is the radius at `y0`, `r1` at `y1`. */
const addCylinder = (
  tris: Tri[],
  cx: number,
  cz: number,
  r0: number,
  r1: number,
  y0: number,
  y1: number,
  mat: number,
  tex: Tex,
  sides = 14,
  cap = true,
) => {
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const x0 = cx + Math.cos(a0) * r0;
    const z0 = cz + Math.sin(a0) * r0;
    const x1 = cx + Math.cos(a1) * r0;
    const z1 = cz + Math.sin(a1) * r0;
    const x2 = cx + Math.cos(a1) * r1;
    const z2 = cz + Math.sin(a1) * r1;
    const x3 = cx + Math.cos(a0) * r1;
    const z3 = cz + Math.sin(a0) * r1;
    // The normal of a tapered wall leans with the wall, so a bowl is shaded
    // like a bowl and not like a pipe.
    const slope = (r0 - r1) / Math.max(0.0001, y1 - y0);
    const len = Math.hypot(1, slope);
    const n: Vec3 = [Math.cos(am) / len, slope / len, Math.sin(am) / len];
    const u0 = (i / sides) * tex.w;
    const u1 = ((i + 1) / sides) * tex.w;
    tris.push({
      p0: [x0, y0, z0],
      p1: [x1, y0, z1],
      p2: [x2, y1, z2],
      u0,
      v0: 0,
      u1,
      v1: 0,
      u2: u1,
      v2: tex.h,
      n,
      mat,
      tex,
      cast: true,
      receives: false,
    });
    tris.push({
      p0: [x0, y0, z0],
      p1: [x2, y1, z2],
      p2: [x3, y1, z3],
      u0,
      v0: 0,
      u1: u1,
      v1: tex.h,
      u2: u0,
      v2: tex.h,
      n,
      mat,
      tex,
      cast: true,
      receives: false,
    });
  }

  if (cap && r1 > 0.001) {
    const cy = y1;
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * Math.PI * 2;
      const a1 = ((i + 1) / sides) * Math.PI * 2;
      const p0: Vec3 = [cx, cy, cz];
      const p1: Vec3 = [cx + Math.cos(a0) * r1, cy, cz + Math.sin(a0) * r1];
      const p2: Vec3 = [cx + Math.cos(a1) * r1, cy, cz + Math.sin(a1) * r1];
      tris.push({
        p0,
        p1,
        p2,
        u0: p0[0] * PX,
        v0: p0[2] * PX,
        u1: p1[0] * PX,
        v1: p1[2] * PX,
        u2: p2[0] * PX,
        v2: p2[2] * PX,
        n: [0, 1, 0],
        mat,
        tex,
        cast: true,
        receives: false,
      });
    }
  }
};

/* -------------------------------------------------------------------- prop */
type Textures = {
  wallFace: Tex;
  wallTop: Tex;
  wood: Tex;
  stone: Tex;
  metal: Tex;
  clothRed: Tex;
  clothNavy: Tex;
};

const texCache = new Map<number, Textures>();
const floorsCache = new Map<number, Tex[]>();

const texturesFor = (seed: number): Textures => {
  let t = texCache.get(seed);
  if (!t) {
    t = {
      wallFace: wallFaceTexture(seed ^ 0x11c7),
      wallTop: wallTopTexture(seed ^ 0x5a3d),
      wood: woodTexture(seed ^ 0x2441),
      stone: stoneTexture(seed ^ 0x9ab3),
      metal: metalTexture(seed ^ 0x77dd),
      clothRed: clothTexture(seed ^ 0x331f, false),
      clothNavy: clothTexture(seed ^ 0x8811, true),
    };
    texCache.set(seed, t);
  }
  return t;
};

/** Six stones, not one: a level tile, a proud one, a worn one with a crack, and
 *  cut half-tiles. The cuts are what stop a room of 32 px cells reading as graph
 *  paper — the same reason the flat board cut one cell in seven. */
const floorsFor = (seed: number): Tex[] => {
  let f = floorsCache.get(seed);
  if (!f) {
    f = [
      floorTexture(seed, -1),
      floorTexture(seed, 0),
      floorTexture(seed, 1),
      floorTexture(seed, 0, 'h'),
      floorTexture(seed, 0, 'v'),
    ];
    floorsCache.set(seed, f);
  }
  return f;
};

const addCollider = (c: Collider[], x0: number, z0: number, x1: number, z1: number, h: number) => {
  c.push({ x0, z0, x1, z1, h });
};

/**
 * Every prop is built from boxes and prisms. `at` is the north-west corner of
 * the footprint, so the footprint in `room.ts` still means exactly what it did
 * — it is now also the collision volume.
 */
function buildProp(
  p: Room['props'][number],
  seed: number,
  tex: Textures,
  tris: Tri[],
  colliders: Collider[],
  fires: SceneFire[],
  lights: SceneLight[],
) {
  const x0 = p.at[0];
  const z0 = p.at[1];
  const id = Math.round(x0 * 8) * 131 + Math.round(z0 * 8);

  switch (p.rule) {
    case 'table': {
      const w = p.w ?? 1;
      const d = 0.75;
      const x1 = x0 + w;
      const z1 = z0 + d;
      addBox(tris, x0, z0, x1, z1, 0.42, 0.5, M_WOOD_PROP, tex.wood);
      const leg = 0.07;
      const inset = 0.05;
      for (const [lx, lz] of [
        [x0 + inset, z0 + inset],
        [x1 - inset - leg, z0 + inset],
        [x0 + inset, z1 - inset - leg],
        [x1 - inset - leg, z1 - inset - leg],
      ]) {
        addBox(tris, lx, lz, lx + leg, lz + leg, 0, 0.42, M_WOOD_PROP, tex.wood);
      }
      addCollider(colliders, x0, z0, x1, z1, 0.47);
      break;
    }
    case 'bench': {
      const w = p.w ?? 1;
      const d = 0.5;
      const x1 = x0 + w;
      const z1 = z0 + d;
      addBox(tris, x0, z0, x1, z1, 0.27, 0.35, M_WOOD_PROP, tex.wood);
      const panel = 0.07;
      addBox(tris, x0 + 0.06, z0 + 0.03, x0 + 0.06 + panel, z1 - 0.03, 0, 0.27, M_WOOD_PROP, tex.wood);
      addBox(tris, x1 - 0.06 - panel, z0 + 0.03, x1 - 0.06, z1 - 0.03, 0, 0.27, M_WOOD_PROP, tex.wood);
      addBox(tris, x0 + 0.13, z0 + 0.18, x1 - 0.13, z0 + 0.23, 0.1, 0.14, M_WOOD_PROP, tex.wood);
      addCollider(colliders, x0, z0, x1, z1, 0.35);
      break;
    }
    case 'chest': {
      const w = p.w ?? 1;
      const d = 0.5;
      const x1 = x0 + w;
      const z1 = z0 + d;
      addBox(tris, x0 + 0.02, z0 + 0.02, x1 - 0.02, z1 - 0.02, 0, 0.36, M_WOOD_PROP, tex.wood);
      addBox(tris, x0, z0, x1, z1, 0.36, 0.41, M_WOOD_PROP, tex.wood);
      const bands = p.bands ?? 2;
      for (let b = 0; b < bands; b++) {
        const bx = x0 + ((b + 0.5) * w) / bands - 0.015;
        addBox(tris, bx, z0 - 0.005, bx + 0.03, z1 + 0.005, 0, 0.4, M_METAL, tex.metal);
      }
      addBox(tris, x0 + w / 2 - 0.04, z1 - 0.01, x0 + w / 2 + 0.04, z1 + 0.035, 0.16, 0.28, M_METAL, tex.metal);
      addCollider(colliders, x0, z0, x1, z1, 0.41);
      break;
    }
    case 'crate': {
      const d = 0.75;
      addBox(tris, x0 + 0.02, z0 + 0.02, x0 + d - 0.02, z0 + d - 0.02, 0, 0.6, M_WOOD_PROP, tex.wood);
      const post = 0.055;
      for (const [px, pz] of [
        [x0, z0],
        [x0 + d - post, z0],
        [x0, z0 + d - post],
        [x0 + d - post, z0 + d - post],
      ]) {
        addBox(tris, px, pz, px + post, pz + post, 0, 0.62, M_WOOD_PROP, tex.wood);
      }
      addBox(tris, x0 + 0.04, z0 + 0.04, x0 + d - 0.04, z0 + d - 0.04, 0.6, 0.63, M_WOOD_PROP, tex.wood);
      addCollider(colliders, x0, z0, x0 + d, z0 + d, 0.63);
      break;
    }
    case 'barrel': {
      const d = 0.75;
      const cx = x0 + d / 2;
      const cz = z0 + d / 2;
      const r = 0.29;
      addCylinder(tris, cx, cz, r, r, 0, 0.66, M_WOOD_PROP, tex.wood);
      addCylinder(tris, cx, cz, r + 0.012, r + 0.012, 0.13, 0.175, M_METAL, tex.metal, 14, false);
      addCylinder(tris, cx, cz, r + 0.012, r + 0.012, 0.49, 0.535, M_METAL, tex.metal, 14, false);
      addCollider(colliders, x0, z0, x0 + d, z0 + d, 0.66);
      break;
    }
    case 'shelf': {
      const w = p.w ?? 1;
      const d = 0.5;
      const x1 = x0 + w;
      const z1 = z0 + d;
      const side = 0.06;
      addBox(tris, x0, z0, x1, z0 + side, 0, 0.96, M_WOOD_PROP, tex.wood);
      addBox(tris, x0, z0, x0 + side, z1, 0, 0.96, M_WOOD_PROP, tex.wood);
      addBox(tris, x1 - side, z0, x1, z1, 0, 0.96, M_WOOD_PROP, tex.wood);
      for (const y of [0.02, 0.34, 0.62, 0.9]) {
        addBox(tris, x0 + side, z0 + side, x1 - side, z1, y, y + 0.04, M_WOOD_PROP, tex.wood);
      }
      addCollider(colliders, x0, z0, x1, z1, 0.96);
      break;
    }
    case 'brazier': {
      const d = 0.625;
      const cx = x0 + d / 2;
      const cz = z0 + d / 2;
      addCylinder(tris, cx, cz, 0.19, 0.19, 0, 0.045, M_METAL, tex.metal, 12);
      addCylinder(tris, cx, cz, 0.075, 0.075, 0.045, 0.2, M_METAL, tex.metal, 10, false);
      addCylinder(tris, cx, cz, 0.12, 0.29, 0.2, 0.34, M_METAL, tex.metal, 14, false);
      addCylinder(tris, cx, cz, 0.29, 0.29, 0.325, 0.36, M_METAL, tex.metal, 14, false);
      fires.push({ x: cx, y: 0.36, z: cz });
      if (p.lit) {
        lights.push({ x: cx, y: 0.5, z: cz, radius: 3.0, intensity: 6.2, flicker: 0.35 });
      }
      addCollider(colliders, x0, z0, x0 + d, z0 + d, 0.36);
      break;
    }
    case 'column': {
      const cx = x0 + 0.5;
      const cz = z0 + 0.5;
      addCylinder(tris, cx, cz, 0.46, 0.46, 0, 0.06, M_STONE_PROP, tex.stone, 16);
      addCylinder(tris, cx, cz, 0.35, 0.35, 0.06, 0.86, M_STONE_PROP, tex.stone, 16, false);
      addCylinder(tris, cx, cz, 0.46, 0.46, 0.86, 0.94, M_STONE_PROP, tex.stone, 16);
      addCollider(colliders, x0, z0, x0 + 1, z0 + 1, 0.94);
      break;
    }
    case 'rubble': {
      const size = p.size ?? 2;
      const span = 0.5 + size * 0.125;
      const chunks = 3 + size;
      for (let k = 0; k < chunks; k++) {
        const w = 0.09 + hf(seed ^ 0x8a1, id, k) * span * 0.36;
        const d = 0.09 + hf(seed ^ 0x8a1, id + 3, k) * span * 0.36;
        const bx = x0 + 0.02 + hf(seed ^ 0x4c7, id + 7, k) * (span - w - 0.04);
        const bz = z0 + 0.02 + hf(seed ^ 0x4c7, id + 11, k) * (span - d - 0.04);
        const h = 0.035 + hf(seed ^ 0x2d9, id + 17, k) * 0.1;
        addBox(tris, bx, bz, bx + w, bz + d, 0, h, M_STONE_PROP, tex.stone);
      }
      addCollider(colliders, x0, z0, x0 + span, z0 + span, 0.1);
      break;
    }
    case 'rug': {
      const w = p.w ?? 2;
      const h = p.h ?? 2;
      const rug = rugTexture(w, h, !!p.navy);
      addQuad(
        tris,
        [x0, 0.012, z0],
        [x0 + w, 0.012, z0],
        [x0 + w, 0.012, z0 + h],
        [x0, 0.012, z0 + h],
        [0, 1, 0],
        p.navy ? M_CLOTH_NAVY : M_CLOTH_RED,
        rug,
        (q) => [(q[0] - x0) * PX, (q[2] - z0) * PX],
        false,
        true,
      );
      break;
    }
  }
}

/* ------------------------------------------------------------------- walls */
const cellAt = (g: Uint8Array, cols: number, rows: number, cx: number, cy: number) => {
  if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return 0;
  return g[cy * cols + cx];
};

/** `v` runs from the top of the block down in world pixels, not normalised, so
 *  a coping course is the same height on a curb and on a two-cell wall. */
const wallUv = (topY: number, alongX: boolean): UvFn => (p) => [
  (alongX ? p[0] : p[2]) * PX,
  (topY - p[1]) * PX,
];

function buildWalls(
  grid: Uint8Array,
  cols: number,
  rows: number,
  yaw: number,
  tex: Textures,
  tris: Tri[],
  colliders: Collider[],
) {
  const a = (yaw * Math.PI) / 180;
  const fx = -Math.sin(a);
  const fz = -Math.cos(a);
  const dirs: [number, number, number, number][] = [
    [0, -1, 0, -1],
    [0, 1, 0, 1],
    [-1, 0, -1, 0],
    [1, 0, 1, 0],
  ];

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (grid[cy * cols + cx] !== 2) continue;

      // A perimeter block whose outside faces the camera would hide the room.
      // Cut it to a curb: the room keeps an edge, and the interior is legible
      // from every orbit. Blocks inside the room (pillars, the alcove) stay
      // full height and occlude honestly.
      let curb = false;
      for (const [dx, dz, ox, oz] of dirs) {
        // Only a *void* neighbour is an exterior face. A floor neighbour is the
        // inside of the room, and testing that instead curbed every wall cell
        // in the ring — which is exactly how the first pass lost its height.
        const outside = cellAt(grid, cols, rows, cx + dx, cy + dz) === 0;
        if (outside && ox * fx + oz * fz < -0.001) curb = true;
      }

      const h = curb ? CURB_H : WALL_H;
      const x0 = cx;
      const z0 = cy;
      const x1 = cx + 1;
      const z1 = cy + 1;

      addQuad(
        tris,
        [x0, h, z0],
        [x1, h, z0],
        [x1, h, z1],
        [x0, h, z1],
        [0, 1, 0],
        M_WALL,
        tex.wallTop,
        uvTop,
        true,
        false,
        true,
      );

      const face = (dx: number, dz: number, quad: [Vec3, Vec3, Vec3, Vec3], n: Vec3, alongX: boolean) => {
        if (!curb && cellAt(grid, cols, rows, cx + dx, cy + dz) === 2) return;
        addQuad(tris, quad[0], quad[1], quad[2], quad[3], n, M_WALL, tex.wallFace, wallUv(h, alongX));
      };

      face(0, -1, [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], [0, 0, -1], true);
      face(0, 1, [[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]], [0, 0, 1], true);
      face(-1, 0, [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], [-1, 0, 0], false);
      face(1, 0, [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], [1, 0, 0], false);

      addCollider(colliders, x0, z0, x1, z1, h);
    }
  }
}

/* ---------------------------------------------------------------------- ao */
/**
 * Contact darkening, baked per cell corner. A floor vertex near a wall or the
 * legs of a table loses a couple of steps, which is what makes the object meet
 * the floor instead of hover over it. Soft and inverted-square, not a stamped
 * ring — the dither in the light pass turns the falloff into pixel steps.
 */
function buildAo(cols: number, rows: number, colliders: Collider[]): Float32Array {
  const w = cols + 1;
  const h = rows + 1;
  const out = new Float32Array(w * h);
  const R = 1.35;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = i;
      const z = j;
      let occ = 0;
      for (let k = 0; k < colliders.length; k++) {
        const c = colliders[k];
        const dx = Math.max(c.x0 - x, 0, x - c.x1);
        const dz = Math.max(c.z0 - z, 0, z - c.z1);
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d >= R) continue;
        const o = 1 - d / R;
        if (o > occ) occ = o;
      }
      out[j * w + i] = -3.0 * occ * occ;
    }
  }
  return out;
}

const sampleGrid = (grid: Float32Array, cols: number, rows: number, x: number, z: number): number => {
  const w = cols + 1;
  const gx = clamp(x, 0, cols);
  const gz = clamp(z, 0, rows);
  const i0 = Math.min(cols - 1, Math.floor(gx));
  const j0 = Math.min(rows - 1, Math.floor(gz));
  const fx = gx - i0;
  const fz = gz - j0;
  const a = grid[j0 * w + i0];
  const b = grid[j0 * w + i0 + 1];
  const c = grid[(j0 + 1) * w + i0];
  const d = grid[(j0 + 1) * w + i0 + 1];
  const top = a + (b - a) * fx;
  const bot = c + (d - c) * fx;
  return top + (bot - top) * fz;
};

export const aoAt = (s: Scene, x: number, z: number): number => sampleGrid(s.ao, s.cols, s.rows, x, z);
export const ambientAt = (s: Scene, x: number, z: number): number => sampleGrid(s.floorAmb, s.cols, s.rows, x, z);

export const solidAt = (s: Scene, x: number, z: number): boolean => {
  for (let i = 0; i < s.colliders.length; i++) {
    const c = s.colliders[i];
    if (x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) return true;
  }
  return false;
};

/* -------------------------------------------------------------------- api */
export function buildScene(room: Room, yaw: number): Scene {
  const { cols, rows, seed } = room.grid;
  const tris: Tri[] = [];
  const colliders: Collider[] = [];
  const fires: SceneFire[] = [];
  const lights: SceneLight[] = [];

  // Textures are functions of the seed only, but the scene is rebuilt whenever
  // the yaw crosses a wall's curb, which is every frame of an orbit. Caching
  // them keeps the drag path to geometry.
  const tex = texturesFor(seed);
  const floors = floorsFor(seed);

  // A point light is smaller than a cell, and a cell lit only at its corners
  // averages the pool away. The floor within one cell of a lit brazier is cut
  // into quarters, which is 108 extra quads for three braziers and enough for
  // the falloff to land where the bowl is.
  const nearLight = new Set<number>();
  for (const p of room.props) {
    if (p.rule !== 'brazier' || !p.lit) continue;
    const bx = Math.floor(p.at[0]);
    const bz = Math.floor(p.at[1]);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = bx + dx;
        const z = bz + dz;
        if (x >= 0 && z >= 0 && x < cols && z < rows) nearLight.add(z * cols + x);
      }
    }
  }

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (room.grid.cells[cy * cols + cx] !== 1) continue;
      const v = hf(seed ^ 0x51ed, cx, cy);
      const t = v < 0.08 ? floors[0] : v > 0.92 ? floors[2] : v > 0.84 ? floors[3] : v > 0.76 ? floors[4] : floors[1];
      const n = nearLight.has(cy * cols + cx) ? 2 : 1;
      const step = 1 / n;
      for (let sz = 0; sz < n; sz++) {
        for (let sx = 0; sx < n; sx++) {
          const x0 = cx + sx * step;
          const z0 = cy + sz * step;
          addQuad(
            tris,
            [x0, 0, z0],
            [x0 + step, 0, z0],
            [x0 + step, 0, z0 + step],
            [x0, 0, z0 + step],
            [0, 1, 0],
            M_FLOOR,
            t,
            (p) => [(p[0] - cx) * PX, (p[2] - cy) * PX],
            false,
            true,
          );
        }
      }
    }
  }

  buildWalls(room.grid.cells, cols, rows, yaw, tex, tris, colliders);

  for (const p of room.props) buildProp(p, seed, tex, tris, colliders, fires, lights);

  const tokens: SceneToken[] = room.tokens.map((t) => ({
    id: t.id,
    spec: t.spec,
    x: t.at[0] + 0.5,
    z: t.at[1] + 0.5,
    facing: t.facing,
  }));

  const ao = buildAo(cols, rows, colliders);
  const floorAmb = new Float32Array(ao.length);
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      floorAmb[j * (cols + 1) + i] = ao[j * (cols + 1) + i] + (mottle(i * 1.15, j * 1.15, seed) - 0.5) * 0.28;
    }
  }

  return {
    room,
    seed,
    cols,
    rows,
    tris,
    tokens,
    fires,
    lights,
    colliders,
    ao,
    floorAmb,
    grid: room.grid.cells,
  };
}

