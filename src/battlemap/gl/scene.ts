import {
  M_AUTUMN,
  M_CLOTH_NAVY,
  M_CLOTH_RED,
  M_DIRT,
  M_FIRE,
  M_FLOOR,
  M_FOLIAGE,
  M_GRASS,
  M_METAL,
  M_PLASTER,
  M_STONE_PROP,
  M_THATCH,
  M_WALL,
  M_WATER,
  M_WOOD_FLOOR,
  M_WOOD_PROP,
  M_WOOD_WALL,
} from '../surface';
import { clamp, hf, mottle } from '../rng';
import type { Facing, Room, Tier, TokenPlacement } from '../room';
import {
  Tex,
  clothTexture,
  dirtTexture,
  floorTexture,
  grassTexture,
  leafTexture,
  ledgeTexture,
  metalTexture,
  plasterTexture,
  rockFaceTexture,
  rockTopTexture,
  rugTexture,
  stoneTexture,
  thatchTexture,
  wallFaceTexture,
  wallTopTexture,
  waterTexture,
  woodTexture,
} from './texture';
import { buildSpriteProp, spriteMotion, spriteSize } from './spriteProps';
import { WIND, buildBlade, buildChain, buildDrill, buildGear, buildLever, buildSarcophagus, type SceneAnim } from './animProps';

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
  /** Takes the room-scale wash and the contact darkening, like a floor. */
  wash?: boolean;
  /**
   * The plane this triangle's sun shadow lands on. Zero is the ground. A ledge
   * face throws its shadow onto what it stands on, not onto its own top — which
   * is the difference between a cliff and a floating slab.
   */
  castTo?: number;
  /**
   * Self-lit, in ramp steps per vertex. A flame does not take the sun: its
   * brightness is a property of the vertex, not of where the light rig is. This
   * is the whole emissive path — no second renderer, no additive blend.
   */
  emit?: Vec3;
};

export type Collider = {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** Bottom of the solid, in cells. A ledge starts at the deck under it. */
  base: number;
  /** Top of the solid, in cells — also the surface a token can stand on. */
  top: number;
  /** A run of steps, not a wall: a walker may climb it even when one cell of it
   *  rises more than a single step. `walk.ts` reads this; nothing else does. */
  climb?: boolean;
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
  /** The deck the token stands on, in cells. */
  y: number;
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
  /** Moving parts in their rest pose; the renderer poses them per frame. */
  anims: SceneAnim[];
  /** Contact wash on the cell-corner lattice, one grid per receiving plane:
   *  a surface is darkened only by what rises above it. */
  ambient: { y: number; grid: Float32Array }[];
  grid: Uint8Array;
  /** Highest deck over each cell: where this storey ends and the next begins. */
  tierTop: Float32Array;
  /** Tallest thing in the room, so the frame can be sized before anything is drawn. */
  yMax: number;
};

export const WALL_H = 1.875;

/** The clear height of a doorway, in cells. The wooden frame and the masonry
 *  above it both stop here, so the head cannot disagree with the opening. */
export const DOOR_H = 1.5;
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

/** A single triangle, for gables and anything a quad cannot close. */
const addTri = (
  tris: Tri[],
  a: Vec3,
  b: Vec3,
  c: Vec3,
  n: Vec3,
  mat: number,
  tex: Tex,
  uv: UvFn,
  cast = true,
) => {
  const q0 = uv(a);
  const q1 = uv(b);
  const q2 = uv(c);
  tris.push({
    p0: a,
    p1: b,
    p2: c,
    u0: q0[0],
    v0: q0[1],
    u1: q1[0],
    v1: q1[1],
    u2: q2[0],
    v2: q2[1],
    n,
    mat,
    tex,
    cast,
    receives: false,
  });
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
  rockFace: Tex;
  rockTop: Tex;
  ledge: Tex;
  wood: Tex;
  stone: Tex;
  metal: Tex;
  clothRed: Tex;
  clothNavy: Tex;
  grass: Tex;
  dirt: Tex;
  water: Tex;
  plaster: Tex;
  thatch: Tex;
  leaf: Tex;
  leafAutumn: Tex;
};

const texCache = new Map<number, Textures>();
const floorsCache = new Map<number, Tex[]>();

const texturesFor = (seed: number): Textures => {
  let t = texCache.get(seed);
  if (!t) {
    t = {
      wallFace: wallFaceTexture(seed ^ 0x11c7),
      wallTop: wallTopTexture(seed ^ 0x5a3d),
      rockFace: rockFaceTexture(seed ^ 0x4b9e),
      rockTop: rockTopTexture(seed ^ 0x77a1),
      ledge: ledgeTexture(seed ^ 0x39c5),
      wood: woodTexture(seed ^ 0x2441),
      stone: stoneTexture(seed ^ 0x9ab3),
      metal: metalTexture(seed ^ 0x77dd),
      clothRed: clothTexture(seed ^ 0x331f, false),
      clothNavy: clothTexture(seed ^ 0x8811, true),
      grass: grassTexture(seed ^ 0x4d21),
      dirt: dirtTexture(seed ^ 0x19b7),
      water: waterTexture(seed ^ 0x6f03),
      plaster: plasterTexture(seed ^ 0x2ac9),
      thatch: thatchTexture(seed ^ 0x5d51),
      leaf: leafTexture(seed ^ 0x7c1d, false),
      leafAutumn: leafTexture(seed ^ 0x7c1d, true),
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

const addCollider = (
  c: Collider[],
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  top: number,
  base = 0,
  climb = false,
) => {
  c.push(climb ? { x0, z0, x1, z1, base, top, climb } : { x0, z0, x1, z1, base, top });
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
  anims: SceneAnim[],
  yaw = 0,
) {
  const x0 = p.at[0];
  const z0 = p.at[1];
  const id = Math.round(x0 * 8) * 131 + Math.round(z0 * 8);
  // Every moving thing gets its own phase, so a room's gears and trees are not
  // a chorus line.
  const phase = hf(seed ^ 0x3a17, id, 5) * Math.PI * 2;
  const sink = { tris, anims, colliders, lights };
  const animTex = { metal: tex.metal, stone: tex.stone, wood: tex.wood };

  switch (p.rule) {
    case 'table': {
      const w = p.w ?? 1;
      const d = 0.75;
      const x1 = x0 + w;
      const z1 = z0 + d;
      const slab = p.stone === true;
      const tMat = slab ? M_STONE_PROP : M_WOOD_PROP;
      const tTex = slab ? tex.stone : tex.wood;
      addBox(tris, x0, z0, x1, z1, 0.42, 0.5, tMat, tTex);
      // A slab stands on two stone piers, not four turned legs.
      const leg = slab ? 0.16 : 0.07;
      const inset = 0.05;
      for (const [lx, lz] of [
        [x0 + inset, z0 + inset],
        [x1 - inset - leg, z0 + inset],
        [x0 + inset, z1 - inset - leg],
        [x1 - inset - leg, z1 - inset - leg],
      ]) {
        addBox(tris, lx, lz, lx + leg, lz + leg, 0, 0.42, tMat, tTex);
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
      // A brazier that is not lit has no fire and no coals — the flame used to
      // be pushed regardless, so an unlit bowl burned anyway.
      if (p.lit) {
        fires.push({ x: cx, y: 0.36, z: cz });
        lights.push({ x: cx, y: 0.5, z: cz, radius: 3.0, intensity: 6.2, flicker: 0.35 });
      }
      addCollider(colliders, x0, z0, x0 + d, z0 + d, 0.36);
      break;
    }
    case 'column': {
      const cx = x0 + 0.5;
      const cz = z0 + 0.5;
      // A column has a height because a cave does. A stump reads as furniture;
      // four cells of rock reads as a pillar holding a roof.
      const h = p.h ?? 0.94;
      const shaftTop = Math.max(0.16, h - 0.08);
      addCylinder(tris, cx, cz, 0.46, 0.46, 0, 0.06, M_STONE_PROP, tex.stone, 16);
      addCylinder(tris, cx, cz, 0.35, 0.35, 0.06, shaftTop, M_STONE_PROP, tex.stone, 16, false);
      addCylinder(tris, cx, cz, 0.46, 0.46, shaftTop, h, M_STONE_PROP, tex.stone, 16);
      addCollider(colliders, x0, z0, x0 + 1, z0 + 1, h);
      break;
    }
    case 'stairs': {
      // Real steps, and every one is a surface. `rise` is measured from the
      // deck the stair stands on, so the same rule climbs a pit wall or a
      // gallery without knowing which it is.
      const w = p.w ?? 1.6;
      const run = p.run ?? 2;
      const rise = p.rise;
      const along = p.along ?? 'z';
      const dir = p.dir ?? 1;
      const steps = clamp(Math.round(rise / 0.3), 3, 14);
      for (let s = 0; s < steps; s++) {
        const d0 = (s / steps) * run;
        const d1 = ((s + 1) / steps) * run;
        const a = dir > 0 ? d0 : run - d1;
        const b = dir > 0 ? d1 : run - d0;
        const top = ((s + 1) / steps) * rise;
        if (along === 'z') {
          addBox(tris, x0, z0 + a, x0 + w, z0 + b, 0, top, M_STONE_PROP, tex.stone);
          addCollider(colliders, x0, z0 + a, x0 + w, z0 + b, top, 0, true);
        } else {
          addBox(tris, x0 + a, z0, x0 + b, z0 + w, 0, top, M_STONE_PROP, tex.stone);
          addCollider(colliders, x0 + a, z0, x0 + b, z0 + w, top, 0, true);
        }
      }
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
    case 'house': {
      const w = p.w ?? 4;
      const h = p.h ?? 3;
      const x1 = x0 + w;
      const z1 = z0 + h;
      const inset = 0.06;
      const plinth = 0.17;
      const eave = 1.72;
      // Stone footing, then limewash above it: the two courses are why a house
      // reads as built rather than as a painted block.
      addBox(tris, x0, z0, x1, z1, 0, plinth, M_STONE_PROP, tex.stone);
      addBox(tris, x0 + inset, z0 + inset, x1 - inset, z1 - inset, plinth, eave, M_PLASTER, tex.plaster);

      const ov = 0.2;
      const ridge = eave + Math.min(w, h) * 0.3 + 0.42;
      const roofMat = p.roof === 'wood' ? M_WOOD_PROP : M_THATCH;
      const roofTex = p.roof === 'wood' ? tex.wood : tex.thatch;
      const alongX = w >= h;
      if (alongX) {
        const zc = (z0 + z1) / 2;
        // The two slopes gable toward ±z; normals lean with the pitch so the
        // sun rakes the south side and the north side falls into its own ramp.
        addQuad(tris, [x0 - ov, eave, z1 + ov], [x1 + ov, eave, z1 + ov], [x1 + ov, ridge, zc], [x0 - ov, ridge, zc], [0, 1, 1], roofMat, roofTex, uvTop);
        addQuad(tris, [x1 + ov, eave, z0 - ov], [x0 - ov, eave, z0 - ov], [x0 - ov, ridge, zc], [x1 + ov, ridge, zc], [0, 1, -1], roofMat, roofTex, uvTop);
        addTri(tris, [x0 + inset, eave, z0 + inset], [x0 + inset, eave, z1 - inset], [x0 + inset, ridge - 0.04, zc], [-1, 0, 0], M_PLASTER, tex.plaster, uvTop);
        addTri(tris, [x1 - inset, eave, z1 - inset], [x1 - inset, eave, z0 + inset], [x1 - inset, ridge - 0.04, zc], [1, 0, 0], M_PLASTER, tex.plaster, uvTop);
        addBox(tris, x0 - ov, zc - 0.055, x1 + ov, zc + 0.055, ridge - 0.07, ridge + 0.02, M_WOOD_PROP, tex.wood);
      } else {
        const xc = (x0 + x1) / 2;
        addQuad(tris, [x1 + ov, eave, z0 - ov], [x1 + ov, eave, z1 + ov], [xc, ridge, z1 + ov], [xc, ridge, z0 - ov], [1, 1, 0], roofMat, roofTex, uvTop);
        addQuad(tris, [x0 - ov, eave, z1 + ov], [x0 - ov, eave, z0 - ov], [xc, ridge, z0 - ov], [xc, ridge, z1 + ov], [-1, 1, 0], roofMat, roofTex, uvTop);
        addTri(tris, [x0 + inset, eave, z0 + inset], [x1 - inset, eave, z0 + inset], [xc, ridge - 0.04, z0 + inset], [0, 0, -1], M_PLASTER, tex.plaster, uvTop);
        addTri(tris, [x1 - inset, eave, z1 - inset], [x0 + inset, eave, z1 - inset], [xc, ridge - 0.04, z1 - inset], [0, 0, 1], M_PLASTER, tex.plaster, uvTop);
        addBox(tris, xc - 0.055, z0 - ov, xc + 0.055, z1 + ov, ridge - 0.07, ridge + 0.02, M_WOOD_PROP, tex.wood);
      }

      // A door is a plank panel on one face with a stone lintel over it, and a
      // lit window either side. The panel is what the transition triggers on; it
      // is not a hole, because entering is a load, not a walk.
      const side = p.door ?? 's';
      const dw = Math.min(0.95, w * 0.32);
      const dh = 1.28;
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      const panel = (ax: number, az: number, bx: number, bz: number, n: Vec3) => {
        addQuad(tris, [ax, plinth, az], [bx, plinth, bz], [bx, dh, bz], [ax, dh, az], n, M_WOOD_PROP, tex.wood, uvTop);
        addQuad(tris, [ax - 0.04, dh, az], [bx + 0.04, dh, bz], [bx + 0.04, dh + 0.11, bz], [ax - 0.04, dh + 0.11, az], n, M_STONE_PROP, tex.stone, uvTop);
      };
      if (side === 's') panel(cx - dw / 2, z1 - inset + 0.012, cx + dw / 2, z1 - inset + 0.012, [0, 0, 1]);
      else if (side === 'n') panel(cx + dw / 2, z0 + inset - 0.012, cx - dw / 2, z0 + inset - 0.012, [0, 0, -1]);
      else if (side === 'e') panel(x1 - inset + 0.012, cz + dw / 2, x1 - inset + 0.012, cz - dw / 2, [1, 0, 0]);
      else panel(x0 + inset - 0.012, cz - dw / 2, x0 + inset - 0.012, cz + dw / 2, [-1, 0, 0]);

      const winY = 1.0;
      const winH = 0.3;
      const winW = 0.34;
      const windows: [number, number, number, number][] = [
        [x0 + w * 0.26, z1 - inset + 0.014, 0, winW],
        [x0 + w * 0.74, z1 - inset + 0.014, 0, winW],
      ];
      for (const [wx, wz, , ww] of windows) {
        addQuad(tris, [wx - ww / 2, winY, wz], [wx + ww / 2, winY, wz], [wx + ww / 2, winY + winH, wz], [wx - ww / 2, winY + winH, wz], [0, 0, 1], M_FIRE, tex.wood, uvTop, false);
      }
      lights.push({ x: cx, y: 1.15, z: z1 + 0.35, radius: 2.3, intensity: 1.35, flicker: 0.1 });
      addCollider(colliders, x0, z0, x1, z1, eave);
      break;
    }
    case 'tree': {
      const size = p.size ?? 2;
      const cx = x0 + 0.5;
      const cz = z0 + 0.5;
      const trunkH = 0.6 + size * 0.16;
      addCylinder(tris, cx, cz, 0.07 + size * 0.016, 0.05 + size * 0.012, 0, trunkH, M_WOOD_PROP, tex.wood, 8, false);
      const leafTex = p.autumn ? tex.leafAutumn : tex.leaf;
      const mat = p.autumn ? M_AUTUMN : M_FOLIAGE;
      const r = 0.26 + size * 0.17;
      const base = trunkH * 0.5;
      // Five overlapping layers with staggered centres and a real trunk below.
      // Three neat cones read as a pumpkin; a canopy is a mass of clumps, and
      // the silhouette matters more than the volume where leaves meet.
      const tiers: [number, number, number, number, number][] = [
        [r * 0.94, base, base + 0.22, 0.05, -0.03],
        [r * 1.0, base + 0.14, base + 0.42, -0.04, 0.04],
        [r * 0.84, base + 0.34, base + 0.64, 0.06, 0.05],
        [r * 0.62, base + 0.56, base + 0.86, -0.03, -0.05],
        [r * 0.36, base + 0.78, base + 1.04, 0.02, 0.02],
      ];
      // The canopy sways from the top of the trunk; the trunk stays put.
      const canopy: Tri[] = [];
      for (const [rad, y0, y1, ox, oz] of tiers) {
        addCylinder(canopy, cx + ox, cz + oz, rad, rad * 0.86, y0, y1, mat, leafTex, 10);
      }
      for (const T of canopy) T.cast = false;
      anims.push({
        kind: 'sway',
        tris: canopy,
        origin: [cx, base, cz],
        axis: WIND,
        rate: 0.32 + hf(seed ^ 0x77, id, 2) * 0.12,
        amp: 0.05 + size * 0.02,
        phase,
        height: 1.04,
      });
      addCollider(colliders, cx - 0.15, cz - 0.15, cx + 0.15, cz + 0.15, trunkH);
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
    case 'sprite': {
      const motion = spriteMotion(p.sprite);
      if (!motion) {
        buildSpriteProp(p, yaw, tris, colliders);
        break;
      }
      const body: Tri[] = [];
      buildSpriteProp(p, yaw, body, colliders);
      if (!body.length) break;
      let y0 = Infinity;
      let y1 = -Infinity;
      let sx = 0;
      let sz = 0;
      for (const T of body) {
        for (const v of [T.p0, T.p1, T.p2]) {
          if (v[1] < y0) y0 = v[1];
          if (v[1] > y1) y1 = v[1];
          sx += v[0];
          sz += v[2];
        }
      }
      const n = body.length * 3;
      const height = Math.max(0.2, y1 - y0);
      // A banner swings across its own face, which is what billowing is; a
      // plant leans with the wind.
      const front = body[0].n;
      const across: Vec3 = (() => {
        const l = Math.hypot(front[0], front[2]) || 1;
        return [front[0] / l, 0, front[2] / l];
      })();
      for (const T of body) T.cast = false;
      anims.push({
        kind: motion,
        tris: body,
        origin: [sx / n, motion === 'hang' ? y1 : y0, sz / n],
        axis: motion === 'hang' ? across : WIND,
        rate: motion === 'hang' ? 0.55 : 0.35,
        amp: motion === 'hang' ? 0.09 : 0.03 + spriteSize(p.sprite) * (p.scale ?? 1) * 0.025,
        phase,
        height,
      });
      break;
    }
    case 'gear':
      buildGear(p, animTex, sink, phase);
      break;
    case 'drill':
      buildDrill(p, animTex, sink, phase);
      break;
    case 'sarcophagus':
      buildSarcophagus(p, animTex, sink, phase);
      break;
    case 'lever':
      buildLever(p, animTex, sink);
      break;
    case 'chain':
      buildChain(p, animTex, sink);
      break;
    case 'blade':
      buildBlade(p, animTex, sink);
      break;
  }
}

/* ------------------------------------------------------------------- walls */
const cellAt = (g: Uint8Array, cols: number, rows: number, cx: number, cy: number) => {
  if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return 0;
  return g[cy * cols + cx];
};

/**
 * The near wall of a room is cut to a curb so the table can see in. This is the
 * same test `buildWalls` uses, exposed to the doorway heads: masonry must not
 * hang above a wall the camera has already cut away.
 */
const curbedWall = (
  grid: Uint8Array,
  cols: number,
  rows: number,
  cx: number,
  cy: number,
  yaw: number,
): boolean => {
  const a = (yaw * Math.PI) / 180;
  const fx = -Math.sin(a);
  const fz = -Math.cos(a);
  const dirs: [number, number, number, number][] = [
    [0, -1, 0, -1],
    [0, 1, 0, 1],
    [-1, 0, -1, 0],
    [1, 0, 1, 0],
  ];
  for (const [dx, dz, ox, oz] of dirs) {
    // Only a void neighbour is an exterior face; a floor neighbour is the room.
    const outside = cellAt(grid, cols, rows, cx + dx, cy + dz) === 0;
    if (outside && ox * fx + oz * fz < -0.001) return true;
  }
  return false;
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
  wallH: number,
  rock: boolean,
  doorCells?: Set<number>,
) {
  const a = (yaw * Math.PI) / 180;
  const fx = -Math.sin(a);
  const fz = -Math.cos(a);

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (grid[cy * cols + cx] !== 2) continue;
      // A doorway is a gap in the wall, not an object leaning against it. The
      // cell is skipped entirely and the door frame fills the opening.
      if (doorCells?.has(cy * cols + cx)) continue;

      // A block whose outside faces the camera would hide the room. Cut it to a
      // curb: the room keeps an edge, and the interior is legible from every
      // orbit. Blocks inside the room (pillars, the alcove) stay full height and
      // occlude honestly.
      //
      // A cavern is a chamber carved out of a mass, so "outside" is not a void
      // here: it is the mass itself. What has to be cut is the chamber wall on
      // the camera's side, and any filler rock behind it — the filler is only
      // there so the chamber is not a thin shell, and leaving it at full height
      // would turn the roof into a plateau that fills the frame.
      let curb = false;
      if (rock) {
        // The cave is a chamber inside a mass that runs to the edge of the grid,
        // and the camera slices it: everything on the camera's half of the room
        // is not drawn. A half-plane, not a per-cell test, because a per-cell
        // rule leaves single-cell fins along the cut where two neighbours
        // disagree about which side of the chamber they are on.
        const side = (cx + 0.5 - cols / 2) * fx + (cy + 0.5 - rows / 2) * fz;
        if (side < 0) continue;
      } else {
        // Only a *void* neighbour is an exterior face. A floor neighbour is
        // the inside of the room, and testing that instead curbed every wall
        // cell in the ring — which is exactly how the first pass lost height.
        curb = curbedWall(grid, cols, rows, cx, cy, yaw);
      }

      if (rock && curb) continue;
      const h = curb ? CURB_H : wallH;
      const faceTex = rock ? tex.rockFace : tex.wallFace;
      const topTex = rock ? tex.rockTop : tex.wallTop;
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
        topTex,
        uvTop,
        true,
        false,
        true,
      );
      // The coping is above the floor, so the wash must not be applied to it;
      // the cap keeps its own weathered step instead (CAP_DROP).

      const face = (dx: number, dz: number, quad: [Vec3, Vec3, Vec3, Vec3], n: Vec3, alongX: boolean) => {
        if (!curb && cellAt(grid, cols, rows, cx + dx, cy + dz) === 2) return;
        addQuad(tris, quad[0], quad[1], quad[2], quad[3], n, M_WALL, faceTex, wallUv(h, alongX));
      };

      face(0, -1, [[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], [0, 0, -1], true);
      face(0, 1, [[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]], [0, 0, 1], true);
      face(-1, 0, [[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], [-1, 0, 0], false);
      face(1, 0, [[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], [1, 0, 0], false);

      addCollider(colliders, x0, z0, x1, z1, h, 0);
    }
  }
}

type DoorFace = 'n' | 's' | 'e' | 'w';

/**
 * Which face of a house a doorstep stands in front of, if any. Village doors are
 * porch frames rather than gaps in a terrain wall, so there is no pair of wall
 * cells to read the passage from — the nearest building face is the one the
 * frame belongs to. Dormers aside, a doorstep is within a cell of its face.
 */
const houseFaceAt = (room: Room, dx: number, dz: number): DoorFace | null => {
  const px = dx + 0.5;
  const pz = dz + 0.5;
  let best: DoorFace | null = null;
  let bestD = 2.4;
  for (const p of room.props) {
    if (p.rule !== 'house') continue;
    const w = p.w ?? 4;
    const h = p.h ?? 3;
    const x0 = p.at[0];
    const z0 = p.at[1];
    const x1 = x0 + w;
    const z1 = z0 + h;
    const inX = px >= x0 - 0.75 && px <= x1 + 0.75;
    const inZ = pz >= z0 - 0.75 && pz <= z1 + 0.75;
    const faces: [DoorFace, number, boolean][] = [
      ['n', Math.abs(pz - z0), inX],
      ['s', Math.abs(pz - z1), inX],
      ['w', Math.abs(px - x0), inZ],
      ['e', Math.abs(px - x1), inZ],
    ];
    for (const [side, d, spans] of faces) {
      // A door inside the footprint is not standing at a face.
      if (!spans || d < 0.2) continue;
      if (d < bestD) {
        bestD = d;
        best = side;
      }
    }
  }
  return best;
};

/**
 * Which way a doorway passes: true when you walk north-south, false when you
 * walk east-west. A gap in a wall is decided by the two cells collinear with
 * it, because those are the wall the hole was cut in; failing that, a house
 * face decides, and only then the nearest solid. The frame and the masonry
 * above it both read this, so they cannot disagree about which way the opening
 * faces.
 */
const doorPassageAlongZ = (room: Room, colliders: Collider[], dx: number, dz: number): boolean => {
  const { cells, cols, rows } = room.grid;
  const wallW = cellAt(cells, cols, rows, dx - 1, dz) === 2;
  const wallE = cellAt(cells, cols, rows, dx + 1, dz) === 2;
  const wallN = cellAt(cells, cols, rows, dx, dz - 1) === 2;
  const wallS = cellAt(cells, cols, rows, dx, dz + 1) === 2;
  if (wallW && wallE) return true;
  if (wallN && wallS) return false;

  const face = houseFaceAt(room, dx, dz);
  if (face) return face === 'n' || face === 's';

  const solidNear = (px: number, pz: number) =>
    colliders.some((c) => px >= c.x0 && px <= c.x1 && pz >= c.z0 && pz <= c.z1 && c.top > 0.3);
  if (solidNear(dx + 0.5, dz - 0.5) || solidNear(dx + 0.5, dz + 1.5)) return true;
  if (solidNear(dx - 0.5, dz + 0.5) || solidNear(dx + 1.5, dz + 0.5)) return false;
  return false;
};

/**
 * True when the door cell is part of a terrain wall run: the cell itself is
 * masonry, or the two cells collinear with it are. This is the difference
 * between a doorway cut through a wall and a porch standing in front of a
 * house; the wall case needs a full-depth head, the porch does not.
 */
const doorIsWallGap = (room: Room, dx: number, dz: number, alongZ: boolean): boolean => {
  const { cells, cols, rows } = room.grid;
  if (cells[dz * cols + dx] === 2) return true;
  return alongZ
    ? cellAt(cells, cols, rows, dx - 1, dz) === 2 && cellAt(cells, cols, rows, dx + 1, dz) === 2
    : cellAt(cells, cols, rows, dx, dz - 1) === 2 && cellAt(cells, cols, rows, dx, dz + 1) === 2;
};

/**
 * The wall over a doorway. A gap in a wall is a hole through a volume, not the
 * absence of a wall: the opening has a head, and without it the doorway reads
 * as a missing cell with a frame standing in the breeze. Only openings cut into
 * terrain walls get one — a porch on a house already has the house's stone
 * lintel — detected by the same flanking cells that orient the frame. The near
 * wall is cut to a curb, and gets none, or the head would float over the cut.
 */
const buildDoorHeads = (
  room: Room,
  cols: number,
  rows: number,
  yaw: number,
  tex: Textures,
  tris: Tri[],
  colliders: Collider[],
  wallH: number,
  doorH: number,
) => {
  if (!room.doors?.length || wallH - doorH < 0.02) return;
  const { cells } = room.grid;
  const seen = new Set<number>();
  for (const door of room.doors) {
    const dx = Math.round(door.at[0]);
    const dz = Math.round(door.at[1]);
    if (dx < 0 || dz < 0 || dx >= cols || dz >= rows) continue;
    const key = dz * cols + dx;
    if (seen.has(key)) continue;
    seen.add(key);

    const cell = cells[key];
    const alongZ = doorPassageAlongZ(room, colliders, dx, dz);
    if (!doorIsWallGap(room, dx, dz, alongZ)) continue;

    // The cutaway removes masonry on the camera's side only.
    if (cell === 2 && curbedWall(cells, cols, rows, dx, dz, yaw)) continue;
    if (curbedWall(cells, cols, rows, alongZ ? dx - 1 : dx, alongZ ? dz : dz - 1, yaw)) continue;
    if (curbedWall(cells, cols, rows, alongZ ? dx + 1 : dx, alongZ ? dz : dz + 1, yaw)) continue;

    // Inset a hair: the flanking walls already own the boundary planes, and two
    // coplanar faces z-fight into a stitched seam.
    const d = 0.004;
    const x0 = dx + d;
    const x1 = dx + 1 - d;
    const z0 = dz + d;
    const z1 = dz + 1 - d;
    const faceUv = wallUv(wallH, true);
    const sideUv = wallUv(wallH, false);
    // Built face by face rather than with addBox: the coping texture is anchored
    // to the top of the wall, so the masonry courses run straight through the
    // head and into the wall either side instead of restarting at y = 0.
    addQuad(tris, [x0, wallH, z0], [x1, wallH, z0], [x1, wallH, z1], [x0, wallH, z1], [0, 1, 0], M_WALL, tex.wallTop, uvTop, true, false, true);
    addQuad(tris, [x0, doorH, z1], [x1, doorH, z1], [x1, doorH, z0], [x0, doorH, z0], [0, -1, 0], M_WALL, tex.wallFace, uvTop, false);
    addQuad(tris, [x0, doorH, z0], [x1, doorH, z0], [x1, wallH, z0], [x0, wallH, z0], [0, 0, -1], M_WALL, tex.wallFace, faceUv);
    addQuad(tris, [x1, doorH, z1], [x0, doorH, z1], [x0, wallH, z1], [x1, wallH, z1], [0, 0, 1], M_WALL, tex.wallFace, faceUv);
    addQuad(tris, [x0, doorH, z1], [x0, doorH, z0], [x0, wallH, z0], [x0, wallH, z1], [-1, 0, 0], M_WALL, tex.wallFace, sideUv);
    addQuad(tris, [x1, doorH, z0], [x1, doorH, z1], [x1, wallH, z1], [x1, wallH, z0], [1, 0, 0], M_WALL, tex.wallFace, sideUv);
    // Solid above the opening, open under it: a flier stops at the head, a
    // walker passes through.
    addCollider(colliders, dx, dz, dx + 1, dz + 1, wallH, doorH);
  }
};

/* ------------------------------------------------------------------ tiers */
type TierBuild = { tier: Tier; cover: Uint8Array; base: Float32Array };

/**
 * Upper storeys, as volumes. A tier is a set of cells at a height; every one of
 * them gets a walking top and a face wherever the cell beside it is lower, and
 * the face always starts at the highest thing already under it. That single
 * rule is why the ledges close: nothing is a floating slab, because a ledge's
 * cliff runs down to whatever it stands on — the pit floor, or the storey below
 * it.
 *
 * Tiers are built low to high, so `topAt` is, at every step, the surface under
 * the storey being built. A gallery over the pit and a gallery over a ledge are
 * then the same code path.
 */
function buildTiers(
  room: Room,
  cols: number,
  rows: number,
  seed: number,
  tex: Textures,
  tris: Tri[],
  colliders: Collider[],
): { topAt: Float32Array; builds: TierBuild[] } {
  const topAt = new Float32Array(cols * rows);
  const builds: TierBuild[] = [];
  const tiers = [...(room.tiers ?? [])].sort((a, b) => a.y - b.y);

  for (const tier of tiers) {
    const cover = new Uint8Array(cols * rows);
    for (const [rx, rz, rw, rh] of tier.rects) {
      const x0 = Math.max(0, rx);
      const z0 = Math.max(0, rz);
      const x1 = Math.min(cols, rx + rw);
      const z1 = Math.min(rows, rz + rh);
      for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) cover[z * cols + x] = 1;
    }
    const base = new Float32Array(cols * rows);
    for (let i = 0; i < cover.length; i++) if (cover[i]) base[i] = topAt[i];
    builds.push({ tier, cover, base });
    for (let i = 0; i < cover.length; i++) if (cover[i]) topAt[i] = tier.y;
  }

  const grid = room.grid.cells;
  for (const b of builds) {
    const y = b.tier.y;
    const wood = (b.tier.deck ?? 'stone') === 'wood';
    const topMat = wood ? M_WOOD_FLOOR : M_FLOOR;
    const faceMat = wood ? M_WOOD_WALL : M_WALL;
    const faceTex = wood ? tex.wood : tex.rockFace;

    for (let cz = 0; cz < rows; cz++) {
      for (let cx = 0; cx < cols; cx++) {
        const i = cz * cols + cx;
        if (!b.cover[i]) continue;

        const topTex = wood ? tex.wood : tex.ledge;
        const before = tris.length;
        addQuad(
          tris,
          [cx, y, cz],
          [cx + 1, y, cz],
          [cx + 1, y, cz + 1],
          [cx, y, cz + 1],
          [0, 1, 0],
          topMat,
          topTex,
          (p) => [(p[0] - cx) * PX, (p[2] - cz) * PX],
          false,
          true,
        );
        tris[before].wash = true;
        tris[before + 1].wash = true;

        const face = (
          dx: number,
          dz: number,
          a: Vec3,
          b2: Vec3,
          c2: Vec3,
          d2: Vec3,
          n: Vec3,
          alongX: boolean,
        ) => {
          const nx = cx + dx;
          const nz = cz + dz;
          const inside = nx >= 0 && nz >= 0 && nx < cols && nz < rows;
          // A face against a wall is buried in it.
          if (inside && grid[nz * cols + nx] === 2) return;
          const nb = inside ? topAt[nz * cols + nx] : 0;
          // The neighbour is already at this height (or above it): its own mass
          // covers this edge.
          if (nb >= y - 0.001) return;
          const from = Math.max(b.base[i], nb);
          if (y - from < 0.02) return;
          const q0: Vec3 = [a[0], from, a[2]];
          const q1: Vec3 = [b2[0], from, b2[2]];
          const q2: Vec3 = [c2[0], y, c2[2]];
          const q3: Vec3 = [d2[0], y, d2[2]];
          const t0 = tris.length;
          addQuad(tris, q0, q1, q2, q3, n, faceMat, faceTex, wallUv(y, alongX));
          tris[t0].castTo = from;
          tris[t0 + 1].castTo = from;
        };

        face(0, -1, [cx, 0, cz], [cx + 1, 0, cz], [cx + 1, 0, cz], [cx, 0, cz], [0, 0, -1], true);
        face(0, 1, [cx + 1, 0, cz + 1], [cx, 0, cz + 1], [cx, 0, cz + 1], [cx + 1, 0, cz + 1], [0, 0, 1], true);
        face(-1, 0, [cx, 0, cz + 1], [cx, 0, cz], [cx, 0, cz], [cx, 0, cz + 1], [-1, 0, 0], false);
        face(1, 0, [cx + 1, 0, cz], [cx + 1, 0, cz + 1], [cx + 1, 0, cz + 1], [cx + 1, 0, cz], [1, 0, 0], false);

        addCollider(colliders, cx, cz, cx + 1, cz + 1, y, wood ? y - 0.22 : b.base[i]);
      }
    }
  }

  return { topAt, builds };
}

/* ---------------------------------------------------------------------- ao */
/**
 * Contact darkening, baked per cell corner and per receiving plane.
 *
 * A surface is darkened only by solids that rise above it. That one test is
 * what stops a storey shading itself: a deck's own collider has its top at the
 * deck, so it is not a caster for that plane — but a wall, a crate standing on
 * the deck, or a gallery overhead still is. A floor vertex near a wall or the
 * legs of a table loses a couple of steps, which is what makes the object meet
 * the floor instead of hover over it; the falloff is soft and inverted-square,
 * not a stamped ring, so the dither in the light pass turns it into pixels.
 *
 * All planes are filled in one walk of the colliders: each corner collects the
 * solids within reach once, then each plane keeps only those that stand above
 * it. That keeps a five-storey room's rebuild near the cost of one floor's.
 */
function buildAmbient(
  cols: number,
  rows: number,
  colliders: Collider[],
  planes: number[],
  seed: number,
): { y: number; grid: Float32Array }[] {
  const w = cols + 1;
  const h = rows + 1;
  const grids = planes.map(() => new Float32Array(w * h));
  const R = 1.35;
  // Parallel arrays, not objects: this runs for every corner of every rebuild,
  // and a quarter of a million little allocations is a visible hitch on an
  // orbit, when the scene is rebuilt on every yaw change.
  const nearTop = new Float32Array(colliders.length);
  const nearBase = new Float32Array(colliders.length);
  const nearOcc = new Float32Array(colliders.length);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = i;
      const z = j;
      let count = 0;
      for (let k = 0; k < colliders.length; k++) {
        const c = colliders[k];
        const dx = Math.max(c.x0 - x, 0, x - c.x1);
        const dz = Math.max(c.z0 - z, 0, z - c.z1);
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d >= R) continue;
        nearTop[count] = c.top;
        nearBase[count] = c.base;
        nearOcc[count] = 1 - d / R;
        count++;
      }
      const mot = (mottle(i * 1.15, j * 1.15, seed) - 0.5) * 0.28;
      for (let p = 0; p < planes.length; p++) {
        const y = planes[p];
        let occ = 0;
        for (let k = 0; k < count; k++) {
          // Only a solid that stands on (or below) this surface can make it
          // meet the solid. A lintel floating above a doorway must not darken
          // the floor it happens to be over, or every threshold gets a blob.
          if (nearBase[k] > y + 0.2) continue;
          if (nearTop[k] > y + 0.01 && nearOcc[k] > occ) occ = nearOcc[k];
        }
        grids[p][j * w + i] = -3.0 * occ * occ + mot;
      }
    }
  }
  return planes.map((y, p) => ({ y, grid: grids[p] }));
}

/**
 * The heights a shadow or a contact wash can land on: the ground and the
 * walking top of every storey. A rug floats a centimetre over its deck and
 * snaps to it, because the planes are storeys, not vertex heights.
 */
export function receivingPlanes(tris: Tri[]): number[] {
  const out: number[] = [];
  for (let t = 0; t < tris.length; t++) {
    const T = tris[t];
    if (!T.receives) continue;
    const y = Math.round(T.p0[1] * 1000) / 1000;
    if (!out.some((v) => Math.abs(v - y) < 0.06)) out.push(y);
  }
  if (!out.length) out.push(0);
  out.sort((a, b) => a - b);
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

/** The contact wash for the surface at `y`, from that plane's own grid. */
export const ambientAt = (s: Scene, x: number, z: number, y = 0): number => {
  let best = s.ambient[0];
  let bestD = Math.abs(best.y - y);
  for (let i = 1; i < s.ambient.length; i++) {
    const d = Math.abs(s.ambient[i].y - y);
    if (d < bestD) {
      bestD = d;
      best = s.ambient[i];
    }
  }
  return sampleGrid(best.grid, s.cols, s.rows, x, z);
};

/**
 * Is there a solid in the way at this height? A thing you can stand on is not
 * an obstacle (`c.top <= y`); a thing above your head is not one either, which
 * is what makes a gallery walkable underneath.
 */
export const solidAt = (s: Scene, x: number, z: number, y = 0, clearance = 0.5): boolean => {
  for (let i = 0; i < s.colliders.length; i++) {
    const c = s.colliders[i];
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue;
    if (c.top <= y + 0.01) continue;
    if (c.base >= y + clearance) continue;
    return true;
  }
  return false;
};

/**
 * What do you stand on here, given you can step up `step` and will drop to
 * whatever is below? This is the whole of vertical movement's surface logic: a
 * stair is a run of colliders, a ledge is one big one, and the pit floor is the
 * grid. It also means a path can climb a stair without knowing what a stair is.
 */
export const surfaceAt = (s: Scene, x: number, z: number, fromY: number, step = 0.45): number => {
  let best = -Infinity;
  const reach = fromY + step;
  for (let i = 0; i < s.colliders.length; i++) {
    const c = s.colliders[i];
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue;
    if (c.top > reach) continue;
    if (c.top > best) best = c.top;
  }
  if (best > -Infinity) return best;
  const cx = Math.floor(x);
  const cz = Math.floor(z);
  if (cx >= 0 && cz >= 0 && cx < s.cols && cz < s.rows && s.grid[cz * s.cols + cx] === 1) return 0;
  return fromY;
};

/** The deck at a point, without the walk step: where a prop is placed. */
export const deckAt = (s: Scene, x: number, z: number): number => {
  const cx = Math.floor(x);
  const cz = Math.floor(z);
  if (cx < 0 || cz < 0 || cx >= s.cols || cz >= s.rows) return 0;
  return s.tierTop[cz * s.cols + cx];
};

/* -------------------------------------------------------------------- api */
export function buildScene(room: Room, yaw: number): Scene {
  const { cols, rows, seed } = room.grid;
  const tris: Tri[] = [];
  const colliders: Collider[] = [];
  const fires: SceneFire[] = [];
  const lights: SceneLight[] = [];
  const anims: SceneAnim[] = [];

  // Textures are functions of the seed only, but the scene is rebuilt whenever
  // the yaw crosses a wall's curb, which is every frame of an orbit. Caching
  // them keeps the drag path to geometry.
  const tex = texturesFor(seed);
  const floors = floorsFor(seed);

  // Upper storeys first: their colliders are what the props then stand on.
  const { topAt: tierTop } = buildTiers(room, cols, rows, seed, tex, tris, colliders);

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

  const ground = room.grid.ground;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      if (room.grid.cells[cy * cols + cx] !== 1) continue;
      const v = hf(seed ^ 0x51ed, cx, cy);
      let mat = M_FLOOR;
      let t = v < 0.08 ? floors[0] : v > 0.92 ? floors[2] : v > 0.84 ? floors[3] : v > 0.76 ? floors[4] : floors[1];
      let fy = 0;
      const g = ground ? ground[cy * cols + cx] : 0;
      if (g === 1) {
        mat = M_GRASS;
        t = tex.grass;
      } else if (g === 2) {
        mat = M_DIRT;
        t = tex.dirt;
      } else if (g === 3) {
        // Water sits a few centimetres below the bank so the edge is a lip and
        // not a colour change. The cell is still walkable: a ford, not a wall.
        mat = M_WATER;
        t = tex.water;
        fy = -0.055;
      } else if (g === 4) {
        mat = M_WOOD_FLOOR;
        t = tex.wood;
      }
      const n = nearLight.has(cy * cols + cx) ? 2 : 1;
      const step = 1 / n;
      for (let sz = 0; sz < n; sz++) {
        for (let sx = 0; sx < n; sx++) {
          const x0 = cx + sx * step;
          const z0 = cy + sz * step;
          addQuad(
            tris,
            [x0, fy, z0],
            [x0 + step, fy, z0],
            [x0 + step, fy, z0 + step],
            [x0, fy, z0 + step],
            [0, 1, 0],
            mat,
            t,
            (p) => [(p[0] - cx) * PX, (p[2] - cy) * PX],
            false,
            true,
          );
          tris[tris.length - 1].wash = true;
          tris[tris.length - 2].wash = true;
        }
      }
    }
  }

  const wallH = room.wallHeight ?? WALL_H;
  const doorH = Math.min(DOOR_H, wallH);
  const cavern = room.tiers !== undefined && room.tiers.length > 0;
  buildWalls(
    room.grid.cells,
    cols,
    rows,
    yaw,
    tex,
    tris,
    colliders,
    wallH,
    cavern,
    room.doors?.length
      ? new Set(room.doors.map((d) => Math.round(d.at[1]) * cols + Math.round(d.at[0])))
      : undefined,
  );

  // Everything a prop builds is authored from its own deck up, so the whole
  // prop is built once and then lifted as a unit — vertices, collider, flame
  // and lamp together. Nothing can be left standing on the floor by accident.
  for (const p of room.props) {
    const px = p.at[0] + 0.4;
    const pz = p.at[1] + 0.4;
    const cx = Math.floor(px);
    const cz = Math.floor(pz);
    const base =
      p.y ?? (cx >= 0 && cz >= 0 && cx < cols && cz < rows ? tierTop[cz * cols + cx] : 0);
    const t0 = tris.length;
    const c0 = colliders.length;
    const f0 = fires.length;
    const l0 = lights.length;
    const a0 = anims.length;
    buildProp(p, seed, tex, tris, colliders, fires, lights, anims, yaw);
    // Triangles share their corner arrays, so a vertex must be lifted once, not
    // once per triangle that uses it — that is how a chest becomes a fan.
    const lifted = new Set<Vec3>();
    for (let i = t0; i < tris.length; i++) {
      const T = tris[i];
      lifted.add(T.p0);
      lifted.add(T.p1);
      lifted.add(T.p2);
      // A prop's shadow belongs on the deck it stands on, not on the pit below.
      if (T.cast) T.castTo = base;
    }
    for (let i = a0; i < anims.length; i++) {
      for (const T of anims[i].tris) {
        lifted.add(T.p0);
        lifted.add(T.p1);
        lifted.add(T.p2);
      }
    }
    if (base !== 0) {
      for (let i = a0; i < anims.length; i++) anims[i].origin[1] += base;
      for (const v of lifted) v[1] += base;
      for (let i = c0; i < colliders.length; i++) {
        colliders[i].base += base;
        colliders[i].top += base;
      }
      for (let i = f0; i < fires.length; i++) fires[i].y += base;
      for (let i = l0; i < lights.length; i++) lights[i].y += base;
    }
  }

  // Doorways stand in the floor cell they occupy: two posts, a lintel, and a
  // plank door when shut. The passage comes from the wall the opening was cut
  // in — a gap's flanking cells, or the face of the house it serves — so the
  // frame hangs itself rather than asking the author for an orientation.
  for (const door of room.doors ?? []) {
    const dx = Math.round(door.at[0]);
    const dz = Math.round(door.at[1]);
    if (dx < 0 || dz < 0 || dx >= cols || dz >= rows) continue;
    const alongZ = doorPassageAlongZ(room, colliders, dx, dz);
    const postH = doorH;
    // A doorway at the top of a stair or the end of a bridge stands on that
    // deck, not on the floor under it: the frame is built from y = 0 and lifted
    // as one piece, exactly as a prop is.
    const deck = tierTop[dz * cols + dx];
    const dt0 = tris.length;
    const dc0 = colliders.length;
    const dl0 = lights.length;
    const jamb = 0.11;
    const lintel = 0.14;
    // A header through a wall has to be as deep as the wall or the gap either
    // side of it is a slot to the outside. The header of a porch only has open
    // air around it, so it stays a beam — a full-depth slab up there reads as a
    // tabletop when the camera looks down at the village.
    const gap = doorIsWallGap(room, dx, dz, alongZ);
    const t0 = gap ? 0.06 : 0.4;
    const t1 = gap ? 0.94 : 0.6;
    if (alongZ) {
      addBox(tris, dx + 0.06, dz + 0.07, dx + 0.06 + jamb, dz + 0.93, 0, postH, M_WOOD_PROP, tex.wood);
      addBox(tris, dx + 0.94 - jamb, dz + 0.07, dx + 0.94, dz + 0.93, 0, postH, M_WOOD_PROP, tex.wood);
      addBox(tris, dx + 0.06, dz + t0, dx + 0.94, dz + t1, postH - lintel, postH, M_WOOD_PROP, tex.wood);
      if (door.state !== 'open') {
        // The leaf closes across the passage, in the plane of the frame — not
        // along it. A door at right angles to its own lintel reads as ajar.
        addBox(tris, dx + 0.1, dz + 0.47, dx + 0.9, dz + 0.53, 0, postH - lintel, M_WOOD_PROP, tex.wood);
      }
    } else {
      addBox(tris, dx + 0.07, dz + 0.06, dx + 0.93, dz + 0.06 + jamb, 0, postH, M_WOOD_PROP, tex.wood);
      addBox(tris, dx + 0.07, dz + 0.94 - jamb, dx + 0.93, dz + 0.94, 0, postH, M_WOOD_PROP, tex.wood);
      addBox(tris, dx + t0, dz + 0.06, dx + t1, dz + 0.94, postH - lintel, postH, M_WOOD_PROP, tex.wood);
      if (door.state !== 'open') {
        addBox(tris, dx + 0.47, dz + 0.1, dx + 0.53, dz + 0.9, 0, postH - lintel, M_WOOD_PROP, tex.wood);
      }
    }
    if (door.to) {
      lights.push({ x: dx + 0.5, y: postH - 0.3, z: dz + 0.5, radius: 1.6, intensity: 0.55, flicker: 0.05 });
    }
    if (deck > 0) {
      const lifted = new Set<Vec3>();
      for (let i = dt0; i < tris.length; i++) {
        lifted.add(tris[i].p0);
        lifted.add(tris[i].p1);
        lifted.add(tris[i].p2);
        if (tris[i].cast) tris[i].castTo = deck;
      }
      for (const v of lifted) v[1] += deck;
      for (let i = dc0; i < colliders.length; i++) {
        colliders[i].base += deck;
        colliders[i].top += deck;
      }
      for (let i = dl0; i < lights.length; i++) lights[i].y += deck;
    }
  }

  // A cavern has no wall runs, and its mass is cut to a half-plane; a head built
  // there would survive the cut and hang in the open. Everything else gets the
  // masonry over its doorways once the frames are in place.
  if (!cavern) buildDoorHeads(room, cols, rows, yaw, tex, tris, colliders, wallH, doorH);

  const tokens: SceneToken[] = room.tokens.map((t) => {
    const x = t.at[0] + 0.5;
    const z = t.at[1] + 0.5;
    const cx = Math.floor(x);
    const cz = Math.floor(z);
    const deck = cx >= 0 && cz >= 0 && cx < cols && cz < rows ? tierTop[cz * cols + cx] : 0;
    return { id: t.id, spec: t.spec, x, z, y: t.y ?? deck, facing: t.facing };
  });

  const planes = receivingPlanes(tris);
  const ambient = buildAmbient(cols, rows, colliders, planes, seed);

  let yMax = room.wallHeight ?? WALL_H;
  for (let i = 0; i < colliders.length; i++) if (colliders[i].top > yMax) yMax = colliders[i].top;

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
    anims,
    ambient,
    grid: room.grid.cells,
    tierTop,
    yMax,
  };
}

