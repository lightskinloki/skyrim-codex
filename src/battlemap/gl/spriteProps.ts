import atlasProps from '../atlas/props.json';
import {
  COLOUR_OF,
  M_AUTUMN,
  M_CLOTH_NAVY,
  M_CLOTH_RED,
  M_DIRT,
  M_FIRE,
  M_FOLIAGE,
  M_GRASS,
  M_HAIR_GREY,
  M_METAL,
  M_OLIVE,
  M_PLASTER,
  M_SLATE,
  M_STONE_PROP,
  M_THATCH,
  M_WATER,
  M_WOOD_PROP,
  RAMP_LEN,
} from '../surface';
import type { Collider, Tri, Vec3 } from './scene';
import type { Tex } from './texture';

/**
 * Props cut from 16 x 16 sprites (src/battlemap/atlas/props.json), built as low-poly
 * geometry so they live in the scene like every other solid: lit per face, shadowed,
 * inked at their depth edges, and walked around by their colliders.
 *
 * A sprite pixel becomes a ramp step in one of the board's materials, chosen as the
 * nearest colour the palette can show. The light then moves that step within its
 * own ramp, exactly as it moves a flagstone's. Transparent pixels are material 0
 * and are skipped by the raster, so a plane can carry a silhouette.
 *
 * Four builds, by what the object is:
 *   cross    one plane turned to face the camera: plants and crystals
 *   lathe    the outline spun into a turned solid that shows its front to the camera
 *   extrude  the silhouette given thickness, with a side wall on every edge pixel
 *   decal    a flat quad on the floor, for things drawn from above
 */

export type SpriteKind = 'cross' | 'lathe' | 'extrude' | 'decal';

type AtlasEntry = {
  kind: SpriteKind;
  size: number;
  thick?: number;
  palette: string[];
  rows: string[];
};

const ATLAS = atlasProps as Record<string, AtlasEntry>;

/** The sprite ids a room may place. The document validates against this list. */
export const SPRITE_IDS: string[] = Object.keys(ATLAS);

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** The board's surfaces the sprites may be drawn in. Ink and void are not
 *  materials, and stone floor/wall ramps belong to the architecture. */
const MATERIALS = [
  M_WOOD_PROP, M_STONE_PROP, M_METAL, M_CLOTH_RED, M_CLOTH_NAVY, M_FOLIAGE, M_AUTUMN, M_GRASS,
  M_DIRT, M_WATER, M_PLASTER, M_THATCH, M_HAIR_GREY, M_OLIVE, M_SLATE, M_FIRE,
];

/** Steps the light adds to a vertical face at a noon sun, roughly. Textures are
 *  authored this far under the colour they should read as once lit. */
const LIT_OFFSET = 2;

/** How far a camera-facing plant leans back: 90° less the table's usual pitch. */
const LEAN = (35 * Math.PI) / 180;

const rgbOf = (packed: number): [number, number, number] => [packed & 255, (packed >>> 8) & 255, (packed >>> 16) & 255];

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

/** Nearest (material, step) to a colour, weighted for how the eye reads it. */
const nearest = (rgb: [number, number, number]): [number, number] => {
  let best = Infinity;
  let mat = M_STONE_PROP;
  let step = 0;
  for (const m of MATERIALS) {
    for (let s = 0; s < RAMP_LEN[m]; s++) {
      const [r, g, b] = rgbOf(COLOUR_OF[m * 16 + s]);
      const dr = r - rgb[0];
      const dg = g - rgb[1];
      const db = b - rgb[2];
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < best) {
        best = d;
        mat = m;
        step = s;
      }
    }
  }
  return [mat, step];
};

export type SpriteTex = Tex & {
  /** Per texel: the material, or 0 for a transparent pixel. */
  mats: Uint8Array;
  /** Opaque bounds, inclusive, in texels. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Half the opaque width of each row, in texels (0 for an empty row). */
  half: Float32Array;
  /** The opaque centre column. */
  cx: number;
  /** Per texel: 1 where the pixel is the drawing's dark outline. */
  ink: Uint8Array;
};

const texCache = new Map<string, SpriteTex>();

/**
 * How a sprite prop moves in a draught, if at all: plants sway from the foot, a
 * thin cloth hangs and swings from its rail. Stone, metal and crystal do not.
 */
export function spriteMotion(id: string): 'sway' | 'hang' | null {
  const e = ATLAS[id];
  if (!e) return null;
  if (e.kind === 'cross') return id === 'crystals' ? null : 'sway';
  if (e.kind === 'extrude' && (e.thick ?? 0.2) <= 0.08) return 'hang';
  return null;
}

/** The authored height of a sprite prop, in cells, before `scale`. */
export const spriteSize = (id: string): number => ATLAS[id]?.size ?? 1;

export function spriteTex(id: string): SpriteTex | null {
  const hit = texCache.get(id);
  if (hit) return hit;
  const e = ATLAS[id];
  if (!e) return null;
  const pal = e.palette.map((h) => nearest(hex(h)));
  const idx = new Uint8Array(256);
  const mats = new Uint8Array(256);
  const ink = new Uint8Array(256);
  const lum = e.palette.map((h) => { const [r, g, b] = hex(h); return 0.3 * r + 0.55 * g + 0.15 * b; });
  let x0 = 16;
  let x1 = -1;
  let y0 = 16;
  let y1 = -1;
  const half = new Float32Array(16);
  let sumX = 0;
  let count = 0;
  for (let y = 0; y < 16; y++) {
    let rx0 = 16;
    let rx1 = -1;
    for (let x = 0; x < 16; x++) {
      const ch = e.rows[y][x];
      if (ch === '.') continue;
      const [m, s] = pal[CHARS.indexOf(ch)];
      mats[y * 16 + x] = m;
      idx[y * 16 + x] = Math.max(0, s - LIT_OFFSET);
      if (lum[CHARS.indexOf(ch)] < 40) ink[y * 16 + x] = 1;
      if (x < rx0) rx0 = x;
      if (x > rx1) rx1 = x;
      sumX += x + 0.5;
      count++;
    }
    if (rx1 >= 0) {
      half[y] = (rx1 - rx0 + 1) / 2;
      if (rx0 < x0) x0 = rx0;
      if (rx1 > x1) x1 = rx1;
      if (y < y0) y0 = y;
      y1 = y;
    }
  }
  const tex: SpriteTex = {
    w: 16, h: 16, idx, mats, mx: 15, my: 15, x0, x1, y0, y1, half, cx: count ? sumX / count : 8, ink,
  };
  texCache.set(id, tex);
  return tex;
}

const solidCache = new Map<string, SpriteTex>();

/**
 * The sprite with its outline filled by the body beside it. A turned solid
 * wraps the drawing's columns around itself, and the outline columns would ring
 * it like a cage; the renderer already inks a solid where its depth breaks, so
 * the solid wants the colour without the drawn line.
 */
export function solidTex(id: string): SpriteTex | null {
  const hit = solidCache.get(id);
  if (hit) return hit;
  const base = spriteTex(id);
  if (!base) return null;
  const idx = base.idx.slice();
  const mats = base.mats.slice();
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const k = y * 16 + x;
      if (!base.ink[k]) continue;
      let best = -1;
      let bestD = 99;
      for (let yy = Math.max(0, y - 3); yy <= Math.min(15, y + 3); yy++) {
        for (let xx = Math.max(0, x - 3); xx <= Math.min(15, x + 3); xx++) {
          const kk = yy * 16 + xx;
          if (base.mats[kk] === 0 || base.ink[kk]) continue;
          const d = Math.abs(xx - x) + Math.abs(yy - y);
          if (d < bestD) {
            bestD = d;
            best = kk;
          }
        }
      }
      if (best >= 0) {
        mats[k] = base.mats[best];
        idx[k] = base.idx[best];
      }
    }
  }
  const tex: SpriteTex = { ...base, idx, mats };
  solidCache.set(id, tex);
  return tex;
}

/* ---------------------------------------------------------------- geometry */

type Pt = Vec3;

const tri = (
  tris: Tri[],
  a: Pt,
  b: Pt,
  c: Pt,
  ua: [number, number],
  ub: [number, number],
  uc: [number, number],
  n: Vec3,
  tex: SpriteTex,
  cast: boolean,
  receives = false,
) => {
  // The triangle's own material is a fallback for code that reads it; the
  // raster takes the per-texel material from the texture.
  tris.push({ p0: a, p1: b, p2: c, u0: ua[0], v0: ua[1], u1: ub[0], v1: ub[1], u2: uc[0], v2: uc[1], n, mat: M_STONE_PROP, tex, cast, receives });
};

const quad = (
  tris: Tri[],
  a: Pt, b: Pt, c: Pt, d: Pt,
  ua: [number, number], ub: [number, number], uc: [number, number], ud: [number, number],
  n: Vec3, tex: SpriteTex, cast: boolean, receives = false,
) => {
  tri(tris, a, b, c, ua, ub, uc, n, tex, cast, receives);
  tri(tris, a, c, d, ua, uc, ud, n, tex, cast, receives);
};

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * The texel a wall or lid should be coloured by. The drawing's edge pixel is
 * usually its black outline, and a wall coloured by it reads as a hole from
 * above; so walk inward, away from the air, past the outline to the body.
 */
const inner = (tex: SpriteTex, x: number, y: number, dx: number, dy: number): [number, number] => {
  let cx = x;
  let cy = y;
  for (let i = 0; i < 3; i++) {
    const k = cy * 16 + cx;
    if (!tex.ink[k]) break;
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || ny < 0 || nx > 15 || ny > 15 || tex.mats[ny * 16 + nx] === 0) break;
    cx = nx;
    cy = ny;
  }
  return [cx + 0.5, cy + 0.5];
};

export type SpritePlacement = { sprite: string; at: [number, number]; rot?: number; scale?: number };

/**
 * Build one sprite prop at the deck (y = 0; the scene lifts the whole prop onto
 * its deck afterwards, exactly as it does every other prop). `yaw` is the
 * camera's, which is what lets a crossed plane and a turned solid present their
 * drawn front to the table.
 */
export function buildSpriteProp(p: SpritePlacement, yaw: number, tris: Tri[], colliders: Collider[]) {
  const e = ATLAS[p.sprite];
  const flatTex = spriteTex(p.sprite);
  if (!e || !flatTex || flatTex.x1 < 0) return;
  const tex = flatTex;
  const size = e.size * (p.scale ?? 1);
  const texH = tex.y1 - tex.y0 + 1;
  const k = size / texH; // world units per texel
  const wTex = tex.x1 - tex.x0 + 1;
  const wide = wTex * k;
  const cxw = p.at[0] + Math.max(wide, 0.5) / 2;
  const czw = p.at[1] + Math.max(wide, 0.5) / 2;

  // The camera's right and its direction toward the viewer, in the floor plane.
  const a = (yaw * Math.PI) / 180;
  const right: [number, number] = [Math.cos(a), -Math.sin(a)];
  const toCam: [number, number] = [Math.sin(a), Math.cos(a)];
  const turn = ((p.rot ?? 0) * Math.PI) / 180;

  // Texel (x, y) -> height above the deck for row edges.
  const yOf = (row: number) => (tex.y1 + 1 - row) * k;

  if (e.kind === 'cross') {
    // One plane square to the camera's heading, leaned back so that at the
    // table's usual pitch it is square to the eye too: the drawing reads at its
    // own proportions instead of squashed by the view. The canopy leans over the
    // ground behind the stem, where a tree's crown would be. Turning the camera
    // rebuilds the scene, so the plane always faces it.
    const lean = LEAN;
    const cl = Math.cos(lean);
    const sl = Math.sin(lean);
    const hw = wide / 2;
    const rx = right[0];
    const rz = right[1];
    // Up the plane: straight up, tipped away from the camera.
    const ux = -toCam[0] * sl;
    const uy = cl;
    const uz = -toCam[1] * sl;
    const top = size; // square to the eye, so the drawing keeps its own proportions
    const n = norm([toCam[0] * cl, sl, toCam[1] * cl]);
    quad(
      tris,
      [cxw - rx * hw, 0, czw - rz * hw], [cxw + rx * hw, 0, czw + rz * hw],
      [cxw + rx * hw + ux * top, uy * top, czw + rz * hw + uz * top], [cxw - rx * hw + ux * top, uy * top, czw - rz * hw + uz * top],
      [tex.x0, tex.y1 + 1], [tex.x1 + 1, tex.y1 + 1], [tex.x1 + 1, tex.y0], [tex.x0, tex.y0],
      n, tex, false,
    );
    // A trunk or a stem is all that blocks a walker; the canopy is overhead.
    const r = Math.min(0.18, wide / 4);
    colliders.push({ x0: cxw - r, z0: czw - r, x1: cxw + r, z1: czw + r, base: 0, top: size * (size > 1 ? 0.45 : 1) });
    return;
  }

  if (e.kind === 'decal') {
    const ratio = texH / wTex;
    const hw = wide / 2;
    const hd = (wide * ratio) / 2;
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    const at = (u: number, v: number): Pt => [cxw + u * c - v * s, 0.014, czw + u * s + v * c];
    quad(
      tris, at(-hw, -hd), at(hw, -hd), at(hw, hd), at(-hw, hd),
      [tex.x0, tex.y0], [tex.x1 + 1, tex.y0], [tex.x1 + 1, tex.y1 + 1], [tex.x0, tex.y1 + 1],
      [0, 1, 0], tex, false, true,
    );
    return;
  }

  if (e.kind === 'lathe') {
    const tex = solidTex(p.sprite) ?? flatTex;
    // Spin each row's half-width into a ring. The texture's column is read from
    // how far a point sits across the camera's view, so the drawn front faces the
    // table whatever the yaw, and the light still turns over a real round form.
    const sides = 12;
    const radiusAt = (row: number) => {
      if (row < tex.y0 || row > tex.y1) return 0;
      return tex.half[row] * k;
    };
    const uOf = (cosT: number, sinT: number, r: number) => {
      const across = (cosT * right[0] + sinT * right[1]) * r; // world units across the view
      return tex.cx + across / k;
    };
    let maxR = 0;
    for (let row = tex.y0; row <= tex.y1; row++) {
      // Each row is a band between its own top and bottom edge; the radius at an
      // edge is the mean of the two rows it separates, so the outline is smooth
      // where the sprite steps by a pixel.
      const rTop = (radiusAt(row - 1) + radiusAt(row)) / 2 || radiusAt(row);
      const rBot = (radiusAt(row) + radiusAt(row + 1)) / 2 || radiusAt(row);
      const yt = yOf(row);
      const yb = yOf(row + 1);
      if (radiusAt(row) > maxR) maxR = radiusAt(row);
      for (let i = 0; i < sides; i++) {
        const t0 = (i / sides) * Math.PI * 2;
        const t1 = ((i + 1) / sides) * Math.PI * 2;
        const tm = (t0 + t1) / 2;
        const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const slope = (rBot - rTop) / Math.max(0.0001, yt - yb);
        const n = norm([Math.cos(tm), slope, Math.sin(tm)]);
        const vt = row + 0.02;
        const vb = row + 0.98;
        quad(
          tris,
          [cxw + c0 * rBot, yb, czw + s0 * rBot], [cxw + c1 * rBot, yb, czw + s1 * rBot],
          [cxw + c1 * rTop, yt, czw + s1 * rTop], [cxw + c0 * rTop, yt, czw + s0 * rTop],
          [uOf(c0, s0, rBot), vb], [uOf(c1, s1, rBot), vb], [uOf(c1, s1, rTop), vt], [uOf(c0, s0, rTop), vt],
          n, tex, true,
        );
      }
    }
    // A lid over the top row, coloured from the middle of that row.
    const rTop = radiusAt(tex.y0) / 2;
    if (rTop > 0.01) {
      const yt = yOf(tex.y0);
      for (let i = 0; i < sides; i++) {
        const t0 = (i / sides) * Math.PI * 2;
        const t1 = ((i + 1) / sides) * Math.PI * 2;
        const mid = inner(tex, Math.min(15, Math.floor(tex.cx)), tex.y0, 0, 1);
        tri(
          tris, [cxw, yt, czw], [cxw + Math.cos(t1) * rTop, yt, czw + Math.sin(t1) * rTop],
          [cxw + Math.cos(t0) * rTop, yt, czw + Math.sin(t0) * rTop], mid, mid, mid, [0, 1, 0], tex, true,
        );
      }
    }
    colliders.push({ x0: cxw - maxR, z0: czw - maxR, x1: cxw + maxR, z1: czw + maxR, base: 0, top: size });
    return;
  }

  // extrude: the silhouette, `thick` deep, along the prop's own turn.
  const thick = (e.thick ?? 0.2) * (p.scale ?? 1);
  const along: [number, number] = [Math.cos(turn), Math.sin(turn)];
  // Front is the side toward the camera, so the drawn face is the one seen.
  const nf: [number, number] = [-along[1], along[0]];
  const camSide = nf[0] * toCam[0] + nf[1] * toCam[1] >= 0 ? 1 : -1;
  const nx = nf[0] * camSide;
  const nz = nf[1] * camSide;
  // Keep the drawing's left on the camera's left.
  const flip = along[0] * right[0] + along[1] * right[1] < 0 ? -1 : 1;
  const ax = along[0] * flip;
  const az = along[1] * flip;
  const xOf = (col: number) => (col - (tex.x0 + tex.x1 + 1) / 2) * k;
  const at = (col: number, row: number, depth: number): Pt => [
    cxw + ax * xOf(col) + nx * depth,
    yOf(row),
    czw + az * xOf(col) + nz * depth,
  ];
  const hd = thick / 2;
  const nFront: Vec3 = [nx, 0, nz];
  const nBack: Vec3 = [-nx, 0, -nz];
  const nRight: Vec3 = [ax, 0, az];
  const nLeft: Vec3 = [-ax, 0, -az];
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < 16 && y < 16 && tex.mats[y * 16 + x] !== 0;

  // Front and back are whole quads over the opaque bounds; transparent texels
  // drop out in the raster. The back reads mirrored, as the back of a thing does.
  const X0 = tex.x0;
  const X1 = tex.x1 + 1;
  const Y0 = tex.y0;
  const Y1 = tex.y1 + 1;
  quad(tris, at(X0, Y1, hd), at(X1, Y1, hd), at(X1, Y0, hd), at(X0, Y0, hd),
    [X0, Y1], [X1, Y1], [X1, Y0], [X0, Y0], nFront, tex, true);
  quad(tris, at(X1, Y1, -hd), at(X0, Y1, -hd), at(X0, Y0, -hd), at(X1, Y0, -hd),
    [X1, Y1], [X0, Y1], [X0, Y0], [X1, Y0], nBack, tex, true);

  // A side wall on every edge where an opaque texel meets air, coloured by that
  // texel: this is what gives a cut-out its thickness when the camera turns.
  for (let y = tex.y0; y <= tex.y1; y++) {
    for (let x = tex.x0; x <= tex.x1; x++) {
      if (!opaque(x, y)) continue;
      if (!opaque(x - 1, y)) { const uv = inner(tex, x, y, 1, 0); quad(tris, at(x, y + 1, hd), at(x, y + 1, -hd), at(x, y, -hd), at(x, y, hd), uv, uv, uv, uv, nLeft, tex, false); }
      if (!opaque(x + 1, y)) { const uv = inner(tex, x, y, -1, 0); quad(tris, at(x + 1, y + 1, -hd), at(x + 1, y + 1, hd), at(x + 1, y, hd), at(x + 1, y, -hd), uv, uv, uv, uv, nRight, tex, false); }
      if (!opaque(x, y - 1)) { const uv = inner(tex, x, y, 0, 1); quad(tris, at(x, y, hd), at(x, y, -hd), at(x + 1, y, -hd), at(x + 1, y, hd), uv, uv, uv, uv, [0, 1, 0], tex, false); }
    }
  }
  const hw = wide / 2;
  const ex = Math.abs(ax) * hw + Math.abs(nx) * hd;
  const ez = Math.abs(az) * hw + Math.abs(nz) * hd;
  colliders.push({ x0: cxw - ex, z0: czw - ez, x1: cxw + ex, z1: czw + ez, base: 0, top: size });
}
