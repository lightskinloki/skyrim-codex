import { COLOUR_OF, M_INK, M_WOOD_PROP, RAMP_LEN } from '../surface';
import { CELL } from '../paint';
import { BAYER4, clamp, fbm1, mottle } from '../rng';
import { LightRig, exposureOf, sunAbove, sunVector } from '../light';
import { BODY_H, BODY_W, renderBody } from '@/characters/body';
import type { Facing } from '../room';
import { Scene, Vec3, WALL_H, ambientAt, buildScene, solidAt } from './scene';
import { Sprite, fireSprite, shadowSprite } from './texture';

/**
 * A real 3D board: orthographic camera, z-buffered triangles, billboard
 * tokens. See docs/BATTLEMAP-SPEC.md §17.
 *
 * This replaces the painter's algorithm. The old board decided what covered
 * what by a `front` row and a sprite rotation, so a prop and its footprint could
 * disagree and an orbit could slide an object across the floor. Here every
 * surface has a depth, the depth is interpolated across the triangle, and the
 * nearest one wins. Occlusion is not a rule anyone has to get right.
 *
 * The camera is orthographic on purpose. Perspective would make the far end of
 * a 28-cell room smaller than the near end, which fights the grid: two cells
 * that are the same size on the map would not be the same size on screen, and
 * range would become a perspective judgement. Orthographic keeps the whole
 * board at one scale, which is what a tactical map needs.
 *
 * `pix` is screen pixels per cell at 1×. Textures are authored at 32 px per
 * cell, so 32 is the natural default; the contact sheet renders smaller.
 */

export type CameraView = { yaw: number; pitch: number; pix?: number };

export type Frame = {
  w: number;
  h: number;
  col: Uint32Array;
  depth: Float32Array;
  mat: Uint8Array;
  /** Sun shadow at quarter resolution: a 4 x 4 px block, not a pixel. */
  shadow: Uint8Array;
  /** The same mask blurred into a 0..255 penumbra, read per floor pixel. */
  soft: Uint8Array;
  sw: number;
  sh: number;
  offX: number;
  offY: number;
  pix: number;
};

type Basis = {
  rx: number;
  rz: number;
  ux: number;
  uy: number;
  uz: number;
  fx: number;
  fy: number;
  fz: number;
};

type FireLight = {
  x: number;
  y: number;
  z: number;
  radius: number;
  intensity: number;
  flicker: number;
};

/** Section costs of the last frame, for the offline bench. */
export const renderStats: Record<string, number> = {};

const RAD = Math.PI / 180;
const EDGE = 0.28;
const VOID = COLOUR_OF[0];
const INK = COLOUR_OF[M_INK << 4];
/** Ramp steps per unit of normal response. A little gentler than the flat
 *  board's, because a real box turns several faces at once. */
const RELIEF = 4.2;
/** A vertical face can never face a 58° sun, so the full sun term would drive
 *  every side of every box to step zero. Relief is compressed on the vertical
 *  and the lift covers the sky the face no longer sees: the darkest side lands
 *  near step 4 instead of black. */
const VERTICAL_LIFT = 0;
const RELIEF_VERT = 4.2;
/** The wall coping is weathered and sits a step below the flagstones, so the
 *  eye reads the floor first and the walls as a frame rather than a well. */
const CAP_DROP = 0;

const basisOf = (yaw: number, pitch: number): Basis => {
  const a = yaw * RAD;
  const p = pitch * RAD;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const cp = Math.cos(p);
  const sp = Math.sin(p);
  return {
    rx: ca,
    rz: -sa,
    ux: -sa * sp,
    uy: cp,
    uz: -ca * sp,
    fx: -sa * cp,
    fy: -sp,
    fz: -ca * cp,
  };
};

const projectX = (b: Basis, x: number, z: number): number => x * b.rx + z * b.rz;
const projectY = (b: Basis, x: number, y: number, z: number): number => -(x * b.ux + y * b.uy + z * b.uz);
const depthOf = (b: Basis, x: number, y: number, z: number): number => x * b.fx + y * b.fy + z * b.fz;

const makeFrame = (w: number, h: number, pix: number): Frame => {
  const sw = (w + 3) >> 2;
  const sh = (h + 3) >> 2;
  return {
    w,
    h,
    col: new Uint32Array(w * h),
    depth: new Float32Array(w * h),
    mat: new Uint8Array(w * h),
    shadow: new Uint8Array(sw * sh),
    soft: new Uint8Array(sw * sh),
    sw,
    sh,
    offX: 0,
    offY: 0,
    pix,
  };
};

/** Screen bounds of the room box, plus headroom for a token, at this camera. */
function boundsOf(scene: Scene, b: Basis, pix: number) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const x of [0, scene.cols]) {
    for (const y of [0, WALL_H]) {
      for (const z of [0, scene.rows]) {
        const sx = projectX(b, x, z) * pix;
        const sy = projectY(b, x, y, z) * pix;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
    }
  }
  minY -= BODY_H;
  const pad = 8;
  return {
    w: Math.ceil(maxX - minX) + pad * 2,
    h: Math.ceil(maxY - minY) + pad * 2,
    offX: -minX + pad,
    offY: -minY + pad,
  };
}

export type RenderOpts = {
  showPath?: boolean;
  selectedToken?: string | null;
  time?: number;
  /** Set false while the camera is moving; the outline sweep is a fifth of the frame. */
  outline?: boolean;
  /** Keep the per-pixel material id, which only the debug view reads. */
  materials?: boolean;
};

/**
 * One frame. All buffers are reused across frames when the size is unchanged:
 * the only thing that moves between commits is firelight, and re-allocating a
 * megabyte of frame buffers at 30 Hz is how a renderer gets slow.
 */
export function renderFrame(
  scene: Scene,
  camera: CameraView,
  rig: LightRig,
  opts: RenderOpts = {},
  reuse?: Frame | null,
): Frame {
  const pix = camera.pix ?? CELL;
  const b = basisOf(camera.yaw, camera.pitch);
  const bounds = boundsOf(scene, b, pix);
  const frame =
    reuse && reuse.w === bounds.w && reuse.h === bounds.h && reuse.pix === pix
      ? reuse
      : makeFrame(bounds.w, bounds.h, pix);

  frame.offX = bounds.offX;
  frame.offY = bounds.offY;
  let tMark = performance.now();
  frame.col.fill(VOID);
  frame.depth.fill(1e9);
  const writeMat = opts.materials === true;
  if (writeMat) frame.mat.fill(0);
  frame.shadow.fill(0);
  renderStats.clear = performance.now() - tMark;
  tMark = performance.now();

  const sun = sunVector(rig.sun);
  const sunW = { x: sun.x, y: sun.z, z: sun.y };
  const flat = sunAbove(rig.sun);
  const exposure = exposureOf(rig);
  const sunI = rig.sun.intensity;

  // World-space point lights: the room's rig is authored in board pixels, and
  // the braziers carry their own, derived from their bowls in the scene.
  const time = opts.time ?? 0;
  const lights = [
    ...rig.points.map((p) => ({
      x: p.x / CELL,
      y: 0.55,
      z: p.y / CELL,
      radius: p.radius / CELL,
      intensity: p.intensity,
      flicker: p.flicker ?? 0,
    })),
    ...scene.lights,
  ].map((l, k) => {
    const flick = l.flicker ? 1 - l.flicker * 0.55 * (0.5 + 0.5 * fbm1(time * 5.5 + k * 3.17, 71 + k * 13)) : 1;
    return { ...l, intensity: l.intensity * flick, r2: l.radius * l.radius };
  });

  /** Sun on the face plus every lamp, in ramp steps. */
  const lightAt = (px: number, py: number, pz: number, n: Vec3, sunTerm: number): number => {
    let f = sunTerm;
    let lamps = 0;
    for (let k = 0; k < lights.length; k++) {
      const L = lights[k];
      const dx = L.x - px;
      const dy = L.y - py;
      const dz = L.z - pz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > L.r2) continue;
      const d = Math.sqrt(d2) || 0.0001;
      const ndl = (dx * n[0] + dy * n[1] + dz * n[2]) / d;
      if (ndl <= 0) continue;
      const atten = 1 - d / L.radius;
      lamps += atten * atten * L.intensity * ndl * 1.9;
    }
    // A brazier is a small flame, not a floodlight: uncapped it walks the
    // stone ramp to its cream top and the pool reads as a hole in the floor.
    f += Math.min(lamps, 3.4);
    if (py < 0.05) {
      // The wash and contact darkening are pre-summed on the floor lattice:
      // four hashes per vertex is real money across nine hundred floor quads.
      f += ambientAt(scene, px, pz);
    } else if (n[1] > 0.9) {
      f += (mottle(px * 0.9, pz * 0.9, scene.seed + 13) - 0.5) * 0.45;
    }
    return f;
  };

  const { w, h } = frame;
  const col = frame.col;
  const depth = frame.depth;
  const matBuf = frame.mat;
  const offX = frame.offX;
  const offY = frame.offY;

  const raster = (
    tex: { w: number; h: number; idx: Uint8Array; mx: number; my: number },
    mat: number,
    receives: boolean,
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    qx: number,
    qy: number,
    qz: number,
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
    const area = (bx - ax) * (qy - ay) - (qx - ax) * (by - ay);
    if (area === 0) return;
    const inv = 1 / area;
    const minX = Math.max(0, Math.floor(Math.min(ax, bx, qx)));
    const maxX = Math.min(w - 1, Math.ceil(Math.max(ax, bx, qx)));
    const minY = Math.max(0, Math.floor(Math.min(ay, by, qy)));
    const maxY = Math.min(h - 1, Math.ceil(Math.max(ay, by, qy)));
    const tw = tex.w;
    const th = tex.h;
    const ti = tex.idx;
    const mx = tex.mx;
    const my = tex.my;
    const top = RAMP_LEN[mat] - 1;
    const base = mat << 4;
    const shadowBuf = frame.soft;

    // The barycentrics, depth, uv and light are all affine in screen x, so the
    // inner loop is a handful of adds and one texture fetch rather than a dozen
    // multiplies per pixel. This is the difference between a demo and a board.
    const dc0 = (by - qy) * inv;
    const dc1 = (qy - ay) * inv;
    const dc2 = -dc0 - dc1;
    const dz0 = az - qz;
    const dz1 = bz - qz;
    const dd = dz0 * dc0 + dz1 * dc1;
    const du0 = u0 - u2;
    const du1 = u1 - u2;
    const du = du0 * dc0 + du1 * dc1;
    const dv0 = v0 - v2;
    const dv1 = v1 - v2;
    const dv = dv0 * dc0 + dv1 * dc1;
    const dl0 = l0 - l2;
    const dl1 = l1 - l2;
    const dl = dl0 * dc0 + dl1 * dc1;

    for (let py = minY; py <= maxY; py++) {
      const pyc = py + 0.5;
      const row = (py & 3) << 2;
      const sj = (py >> 2) * frame.sw;
      const pxc = minX + 0.5;
      let c0 = ((bx - pxc) * (qy - pyc) - (qx - pxc) * (by - pyc)) * inv;
      let c1 = ((qx - pxc) * (ay - pyc) - (ax - pxc) * (qy - pyc)) * inv;
      let c2 = 1 - c0 - c1;
      let d = qz + c0 * dz0 + c1 * dz1;
      let u = u2 + c0 * du0 + c1 * du1;
      let v = v2 + c0 * dv0 + c1 * dv1;
      let l = l2 + c0 * dl0 + c1 * dl1;
      for (let px = minX; px <= maxX; px++) {
        if (c0 >= -0.000001 && c1 >= -0.000001 && c2 >= -0.000001) {
          const i = py * w + px;
          if (d < depth[i]) {
            depth[i] = d;
            if (writeMat) matBuf[i] = mat;
            const tx = (u | 0) & mx;
            const ty = (v | 0) & my;
            let lit = l;
            if (receives) lit -= shadowBuf[sj + (px >> 2)] * 0.0125;

            const fl = Math.floor(lit);
            let ii = ti[ty * tw + tx] + fl + (lit - fl > BAYER4[row | (px & 3)] ? 1 : 0);
            if (ii < 0) ii = 0;
            else if (ii > top) ii = top;
            col[i] = COLOUR_OF[base + ii];
          }
        }
        c0 += dc0;
        c1 += dc1;
        c2 += dc2;
        d += dd;
        u += du;
        v += dv;
        l += dl;
      }
    }
  };

  const tris = scene.tris;

  // Projected sun shadows. Every solid is projected onto the floor plane along
  // the sun and unioned into a mask; a floor pixel under the mask loses a few
  // steps. This is what makes a wall meet the ground and a table sit under its
  // own top, and it costs one extra conservative fill of the casters.
  if (sunW.y > 0.04) {
    const shadow = frame.shadow;
    const sw = frame.sw;
    const sh = frame.sh; // quarter-resolution fill
    for (let t = 0; t < tris.length; t++) {
      const T = tris[t];
      if (!T.cast) continue;
      const t0 = T.p0[1] / sunW.y;
      const t1 = T.p1[1] / sunW.y;
      const t2 = T.p2[1] / sunW.y;
      if (t0 > 40 || t1 > 40 || t2 > 40) continue;
      const ax = (projectX(b, T.p0[0] - sunW.x * t0, T.p0[2] - sunW.z * t0) * pix + offX) * 0.25;
      const ay = (projectY(b, T.p0[0] - sunW.x * t0, 0, T.p0[2] - sunW.z * t0) * pix + offY) * 0.25;
      const bx = (projectX(b, T.p1[0] - sunW.x * t1, T.p1[2] - sunW.z * t1) * pix + offX) * 0.25;
      const by = (projectY(b, T.p1[0] - sunW.x * t1, 0, T.p1[2] - sunW.z * t1) * pix + offY) * 0.25;
      const qx = (projectX(b, T.p2[0] - sunW.x * t2, T.p2[2] - sunW.z * t2) * pix + offX) * 0.25;
      const qy = (projectY(b, T.p2[0] - sunW.x * t2, 0, T.p2[2] - sunW.z * t2) * pix + offY) * 0.25;
      const area = (bx - ax) * (qy - ay) - (qx - ax) * (by - ay);
      if (Math.abs(area) < 0.0001) continue;
      const inv = 1 / area;
      const minX = Math.max(0, Math.floor(Math.min(ax, bx, qx)));
      const maxX = Math.min(sw - 1, Math.ceil(Math.max(ax, bx, qx)));
      const minY = Math.max(0, Math.floor(Math.min(ay, by, qy)));
      const maxY = Math.min(sh - 1, Math.ceil(Math.max(ay, by, qy)));
      for (let py = minY; py <= maxY; py++) {
        const pyc = py + 0.5;
        for (let px = minX; px <= maxX; px++) {
          const pxc = px + 0.5;
          const c0 = ((bx - pxc) * (qy - pyc) - (qx - pxc) * (by - pyc)) * inv;
          if (c0 < 0) continue;
          const c1 = ((qx - pxc) * (ay - pyc) - (ax - pxc) * (qy - pyc)) * inv;
          if (c1 < 0) continue;
          if (c0 + c1 > 1) continue;
          shadow[py * sw + px] = 1;
        }
      }
    }
  }

  // A binary block shadow has a four-pixel staircase for an edge, and at 1:1
  // that reads as a hole cut in the floor. Blurring the quarter-res mask into a
  // coverage value gives the penumbra somewhere to land, so the dither can
  // feather it instead of stepping it.
  {
    const shadow = frame.shadow;
    const soft = frame.soft;
    const sw = frame.sw;
    const sh = frame.sh;
    for (let y = 0; y < sh; y++) {
      const y0 = y > 0 ? y - 1 : 0;
      const y1 = y < sh - 1 ? y + 1 : sh - 1;
      for (let x = 0; x < sw; x++) {
        const x0 = x > 0 ? x - 1 : 0;
        const x1 = x < sw - 1 ? x + 1 : sw - 1;
        let sum = 0;
        for (let yy = y0; yy <= y1; yy++) {
          const r = yy * sw;
          sum += shadow[r + x0] + shadow[r + x] + shadow[r + x1];
        }
        soft[y * sw + x] = (sum * 255) / 9;
      }
    }
  }

  renderStats.shadow = performance.now() - tMark;
  tMark = performance.now();
  for (let t = 0; t < tris.length; t++) {
    const T = tris[t];
    const n = T.n;
    // Face-away culling. A tall stack of boxes hides half its triangles; the
    // z-buffer would discard them anyway, but after the fill.
    if (n[0] * b.fx + n[1] * b.fy + n[2] * b.fz >= 0) continue;

    const ndl = n[0] * sunW.x + n[1] * sunW.y + n[2] * sunW.z;
    const vertical = Math.abs(n[1]) < 0.5;
    const sunTerm =
      exposure +
      (vertical ? VERTICAL_LIFT : 0) +
      (ndl - flat) * sunI * (vertical ? RELIEF_VERT : RELIEF) -
      (T.cap ? CAP_DROP : 0);

    const p0 = T.p0;
    const p1 = T.p1;
    const p2 = T.p2;
    const ax = projectX(b, p0[0], p0[2]) * pix + offX;
    const ay = projectY(b, p0[0], p0[1], p0[2]) * pix + offY;
    const az = depthOf(b, p0[0], p0[1], p0[2]);
    const bx = projectX(b, p1[0], p1[2]) * pix + offX;
    const by = projectY(b, p1[0], p1[1], p1[2]) * pix + offY;
    const bz = depthOf(b, p1[0], p1[1], p1[2]);
    const qx = projectX(b, p2[0], p2[2]) * pix + offX;
    const qy = projectY(b, p2[0], p2[1], p2[2]) * pix + offY;
    const qz = depthOf(b, p2[0], p2[1], p2[2]);

    raster(
      T.tex,
      T.mat,
      T.receives,
      ax,
      ay,
      az,
      bx,
      by,
      bz,
      qx,
      qy,
      qz,
      T.u0,
      T.v0,
      T.u1,
      T.v1,
      T.u2,
      T.v2,
      lightAt(p0[0], p0[1], p0[2], n, sunTerm),
      lightAt(p1[0], p1[1], p1[2], n, sunTerm),
      lightAt(p2[0], p2[1], p2[2], n, sunTerm),
    );
  }

  renderStats.tris = performance.now() - tMark;
  tMark = performance.now();
  firePass(frame, b, pix, lights);
  renderStats.fire = performance.now() - tMark;
  tMark = performance.now();
  // Silhouette pass. One ink pixel on the near side of any depth cliff: the
  // same line the flat board drew by hand, now derived from the z-buffer.
  // Depth only changes when the camera or the room does, so a drag can skip
  // the sweep and pick the ink up on the frame that settles.
  if (opts.outline !== false) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        const d = depth[i];
        if (d > 1e8) continue;
        // Two neighbours, both directions tested: the near side of a cliff gets
        // the line whichever of the pair is holding it.
        if (x + 1 < w) {
          const dn = depth[i + 1];
          if (dn > d + EDGE) col[i] = INK;
          else if (d > dn + EDGE) col[i + 1] = INK;
        }
        if (y + 1 < h) {
          const dn = depth[i + w];
          if (dn > d + EDGE) col[i] = INK;
          else if (d > dn + EDGE) col[i + w] = INK;
        }
      }
    }
  }

  renderStats.outline = performance.now() - tMark;
  tMark = performance.now();
  if (opts.showPath) drawPath(frame, scene, b, pix, offX, offY);

  drawSprites(frame, scene, camera, b, exposure, flat, sunI, sunW, lights, opts);
  renderStats.sprites = performance.now() - tMark;

  return frame;
}

/**
 * The braziers' pools, painted after the solids rather than in the vertex
 * light. A point light is smaller than a cell, and a cell lit only at its four
 * corners averages the pool away; walking the light's own screen footprint
 * costs a fraction of a pass and lands the falloff where the bowl is. The tint
 * goes into the oak ramp, so firelight keeps a hue instead of walking the stone
 * ramp to cream.
 */
function firePass(frame: Frame, b: Basis, pix: number, lights: FireLight[]) {
  const { w, h, col, depth, offX, offY } = frame;
  const det = b.rx * b.uz - b.rz * b.ux;
  if (Math.abs(det) < 1e-6) return;
  const inv = 1 / det;
  for (let k = 0; k < lights.length; k++) {
    const L = lights[k];
    if (!(L.flicker > 0) || L.intensity < 2) continue;
    const cx = projectX(b, L.x, L.z) * pix + offX;
    const cy = projectY(b, L.x, 0, L.z) * pix + offY;
    const rx = L.radius * pix;
    const x0 = Math.max(0, Math.floor(cx - rx));
    const x1 = Math.min(w - 1, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - rx));
    const y1 = Math.min(h - 1, Math.ceil(cy + rx));
    const r2 = L.radius * L.radius;
    for (let py = y0; py <= y1; py++) {
      const sy = (py + 0.5 - offY) / pix;
      const row = (py & 3) << 2;
      for (let px = x0; px <= x1; px++) {
        const sx = (px + 0.5 - offX) / pix;
        const wx = (b.uz * sx + b.rz * sy) * inv;
        const wz = (-b.ux * sx - b.rx * sy) * inv;
        const dx = wx - L.x;
        const dz = wz - L.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > r2) continue;
        const i = py * w + px;
        // Only the floor: a wall or a crate in front of the light is not lit
        // by a pool drawn on the ground plane.
        if (Math.abs(depth[i] - (wx * b.fx + wz * b.fz)) > 0.2) continue;
        const fall = 1 - Math.sqrt(d2) / L.radius;
        // The vertex light already lifts the floor here; this pass only has to
        // put the hue back, so it stays a hint rather than a second pool.
        const t = Math.min(0.4, fall * fall * L.intensity * 0.055);
        if (t <= BAYER4[row | (px & 3)]) continue;
        const step = clamp(Math.round(7 + fall * 4), 6, 11);
        col[i] = COLOUR_OF[(M_WOOD_PROP << 4) + step];
      }
    }
  }
}

/* ------------------------------------------------------------------- path */
function drawPath(frame: Frame, scene: Scene, b: Basis, pix: number, offX: number, offY: number) {
  const path = scene.room.path;
  if (path.length === 0) return;
  const dot = COLOUR_OF[(9 << 4) + 5];
  const hot = COLOUR_OF[(9 << 4) + 9];
  const { w, h, col, depth } = frame;

  const screen = path.map(([cx, cz]) => {
    const x = cx + 0.5;
    const z = cz + 0.5;
    return {
      x: Math.round(projectX(b, x, z) * pix + offX),
      y: Math.round(projectY(b, x, 0.02, z) * pix + offY),
      d: depthOf(b, x, 0.02, z) - 0.03,
    };
  });

  screen.forEach((p, n) => {
    const last = n === screen.length - 1;
    const colour = last ? hot : dot;
    for (let j = -3; j <= 3; j++) {
      for (let i = -3; i <= 3; i++) {
        if (((i >> 1) + (j >> 1)) % 2 === 0) continue;
        const x = p.x + i;
        const y = p.y + j;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const k = y * w + x;
        if (p.d >= depth[k]) continue;
        col[k] = colour;
      }
    }
    if (!last) return;
    const prev = screen[n - 1] ?? { x: p.x, y: p.y - 1 };
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    for (let step = 4; step <= 9; step++) {
      const half = Math.round((9 - step) * 0.45);
      for (let o = -half; o <= half; o++) {
        const x = Math.round(p.x + ux * step - uy * o);
        const y = Math.round(p.y + uy * step + ux * o);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const k = y * w + x;
        if (p.d >= depth[k]) continue;
        col[k] = hot;
      }
    }
  });
}

/* ---------------------------------------------------------------- sprites */
type Billboard = {
  depth: number;
  sprite: Sprite;
  left: number;
  top: number;
  d: number;
  /** Erase the floor under a contact shadow with a straight multiply-free dark. */
  kind: 'token' | 'fire' | 'shadow';
};

const spriteCache = new Map<string, { w: number; h: number; rgba: Uint32Array }>();
const fireFrames = [fireSprite(0), fireSprite(1), fireSprite(2), fireSprite(3)];
let shadow: Sprite | null = null;

function bodySprite(spec: Scene['tokens'][number]['spec'], facing: Facing, shift: number) {
  const key = `${spec.id}|${facing}|${shift}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const body = renderBody(spec, facing, shift);
  const out = { w: BODY_W, h: BODY_H, rgba: body.col };
  spriteCache.set(key, out);
  return out;
}

const DIRS: [number, number][] = [
  [0, 1],
  [0, -1],
  [-1, 0],
  [1, 0],
];

/** Which authored facing shows this world direction to this camera. */
function facingFor(dir: Facing, b: Basis): Facing {
  const [dx, dz] = DIRS[dir & 3];
  const toward = -(dx * b.fx + dz * b.fz);
  const side = dx * b.rx + dz * b.rz;
  if (toward > Math.abs(side)) return 0;
  if (-toward > Math.abs(side)) return 1;
  return side > 0 ? 3 : 2;
}

function drawSprites(
  frame: Frame,
  scene: Scene,
  camera: CameraView,
  b: Basis,
  exposure: number,
  flat: number,
  sunI: number,
  sunW: { x: number; y: number; z: number },
  lights: { x: number; y: number; z: number; radius: number; r2: number; intensity: number }[],
  opts: RenderOpts,
) {
  const { w, h, col, depth } = frame;
  const pix = frame.pix;
  const list: Billboard[] = [];

  const shiftAt = (x: number, y: number, z: number): number => {
    let f = exposure + (sunW.y - flat) * sunI * 5.2;
    for (let k = 0; k < lights.length; k++) {
      const L = lights[k];
      const dx = L.x - x;
      const dy = L.y - y;
      const dz = L.z - z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > L.r2) continue;
      const d = Math.sqrt(d2) || 0.0001;
      if (dy <= 0) continue;
      const atten = 1 - d / L.radius;
      f += atten * atten * L.intensity * (dy / d) * 1.9;
    }
    return clamp(Math.round(f), -6, 6);
  };

  if (!shadow) shadow = shadowSprite();

  for (const tok of scene.tokens) {
    const sx = Math.round(projectX(b, tok.x, tok.z) * pix + frame.offX);
    const sy = Math.round(projectY(b, tok.x, 0.01, tok.z) * pix + frame.offY);
    const d = depthOf(b, tok.x, 0.01, tok.z);

    list.push({
      kind: 'shadow',
      depth: d,
      sprite: shadow,
      left: sx - Math.round(shadow.w / 2),
      top: sy - Math.round(shadow.h / 2),
      d: d - 0.012,
    });

    const facing = facingFor(tok.facing, b);
    const shift = shiftAt(tok.x, 0.7, tok.z);
    const sprite = bodySprite(tok.spec, facing, shift);
    const anchor = depthOf(b, tok.x, 0.02, tok.z);
    list.push({
      kind: 'token',
      depth: anchor,
      sprite,
      left: Math.round(sx - sprite.w / 2),
      top: Math.round(sy - sprite.h + 1),
      d: anchor - 0.05,
    });
  }

  const fire = fireFrames[(Math.floor((opts.time ?? 0) * 7) % fireFrames.length + fireFrames.length) % fireFrames.length];
  for (const f of scene.fires) {
    const sx = Math.round(projectX(b, f.x, f.z) * pix + frame.offX);
    const sy = Math.round(projectY(b, f.x, f.y, f.z) * pix + frame.offY);
    const d = depthOf(b, f.x, f.y, f.z);
    list.push({
      kind: 'fire',
      depth: d,
      sprite: fire,
      left: sx - Math.round(fire.w / 2),
      // The sprite's own ember bed sits at its bottom, so the flame is placed
      // with its feet on the bowl rather than around it.
      top: sy - fire.h + 2,
      d: d - 0.03,
    });
  }

  // Far to near, so a nearer sprite covers a farther one without a per-pixel
  // depth write. The scene's own depth stays intact underneath.
  list.sort((a, b2) => b2.depth - a.depth);

  for (const s of list) {
    const { sprite } = s;
    for (let j = 0; j < sprite.h; j++) {
      const y = s.top + j;
      if (y < 0 || y >= h) continue;
      const row = y * w;
      for (let i = 0; i < sprite.w; i++) {
        const x = s.left + i;
        if (x < 0 || x >= w) continue;
        const c = sprite.rgba[j * sprite.w + i];
        if ((c >>> 24) === 0) continue;
        const k = row + x;
        if (s.d >= depth[k]) continue;
        col[k] = c;
      }
    }

    if (s.kind === 'token') continue;
  }
  // Selection chevron, drawn after every sprite so nothing covers it.
  const selected = opts.selectedToken;
  if (selected) {
    const tok = scene.tokens.find((t) => t.id === selected);
    if (tok) {
      const sx = Math.round(projectX(b, tok.x, tok.z) * pix + frame.offX);
      const sy = Math.round(projectY(b, tok.x, 0.01, tok.z) * pix + frame.offY);
      const d = depthOf(b, tok.x, 0.02, tok.z) - 0.1;
      for (let i = 0; i < 9; i++) {
        const half = i < 4 ? i + 1 : 10 - i;
        for (let k = 0; k < half; k++) {
          const x = sx + i - 4;
          const y = sy - BODY_H - 12 + k;
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          const idx = y * w + x;
          if (d >= depth[idx]) continue;
          col[idx] = COLOUR_OF[(9 << 4) + 10];
        }
      }
    }
  }
}

/* ------------------------------------------------------------------- board */
export class Board3D {
  readonly room: Scene['room'];
  private sceneCache: { yaw: number; scene: Scene } | null = null;
  private frame: Frame | null = null;
  private basis: Basis = basisOf(0, 55);
  private offX = 0;
  private offY = 0;
  private pix = CELL;
  private readonly src: HTMLCanvasElement;
  private readonly sctx: CanvasRenderingContext2D;
  private img: ImageData | null = null;

  yaw = 0;
  pitch = 55;

  constructor(room: Scene['room']) {
    this.room = room;
    this.src = document.createElement('canvas');
    const ctx = this.src.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.sctx = ctx;
  }

  get scene(): Scene {
    const yaw = this.yaw;
    if (!this.sceneCache || Math.abs(this.sceneCache.yaw - yaw) > 0.02) {
      this.sceneCache = { yaw, scene: buildSceneCached(this.room, yaw) };
    }
    return this.sceneCache.scene;
  }

  get width() {
    return this.frame?.w ?? 1;
  }
  get height() {
    return this.frame?.h ?? 1;
  }
  get offXpx() {
    return this.offX;
  }
  get offYpx() {
    return this.offY;
  }
  get pixPerCell() {
    return this.pix;
  }

  render(rig: LightRig, opts: RenderOpts = {}) {
    const scene = this.scene;
    this.frame = renderFrame(scene, { yaw: this.yaw, pitch: this.pitch }, rig, opts, this.frame);
    this.basis = basisOf(this.yaw, this.pitch);
    this.offX = this.frame.offX;
    this.offY = this.frame.offY;
    this.pix = this.frame.pix;
  }

  /** Board pixel → room coordinate on the floor plane. */
  worldAt(bx: number, by: number): [number, number] {
    const b = this.basis;
    const a = (bx - this.offX) / this.pix;
    const c = (by - this.offY) / this.pix;
    const t = (c * b.uy) / b.fy;
    const x = b.rx * a - b.ux * c + b.fx * t;
    const z = b.rz * a - b.uz * c + b.fz * t;
    return [x, z];
  }

  solidAtCell(x: number, z: number): boolean {
    return solidAt(this.scene, x, z);
  }

  cellAt(x: number, z: number): number {
    const cx = Math.floor(x);
    const cz = Math.floor(z);
    if (cx < 0 || cz < 0 || cx >= this.scene.cols || cz >= this.scene.rows) return 0;
    return this.scene.grid[cz * this.scene.cols + cx];
  }

  debug(view: 'lit' | 'depth' | 'materials') {
    const f = this.frame;
    if (!f || view === 'lit') return;
    const n = f.w * f.h;
    if (view === 'materials') {
      for (let i = 0; i < n; i++) {
        const m = f.mat[i];
        const hue = (m * 47) % 360;
        f.col[i] = hslToPacked(hue, 0.42, f.depth[i] > 1e8 ? 0.06 : 0.28);
      }
      return;
    }
    let max = 0.001;
    for (let i = 0; i < n; i++) if (f.depth[i] < 1e8 && f.depth[i] > max) max = f.depth[i];
    for (let i = 0; i < n; i++) {
      const d = f.depth[i];
      const v = d > 1e8 ? 0 : Math.round((1 - d / max) * 255);
      f.col[i] = (255 << 24) | (v << 16) | (v << 8) | v;
    }
  }

  present(canvas: HTMLCanvasElement, scale: number, panX: number, panY: number) {
    const f = this.frame;
    if (!f) return;
    if (this.src.width !== f.w || this.src.height !== f.h) {
      this.src.width = f.w;
      this.src.height = f.h;
      this.img = null;
    }
    if (!this.img) {
      const bytes = new Uint8ClampedArray(f.col.buffer, f.col.byteOffset, f.col.length * 4);
      this.img = new ImageData(bytes, f.w, f.h);
    }
    this.sctx.putImageData(this.img, 0, 0);

    const dw = Math.max(1, Math.round(f.w * scale));
    const dh = Math.max(1, Math.round(f.h * scale));
    if (canvas.width !== dw) canvas.width = dw;
    if (canvas.height !== dh) canvas.height = dh;
    if (canvas.style.width !== `${dw}px`) canvas.style.width = `${dw}px`;
    if (canvas.style.height !== `${dh}px`) canvas.style.height = `${dh}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(scale, 0, 0, scale, -Math.round(panX), -Math.round(panY));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.src, 0, 0);
  }
}

/* ------------------------------------------------------------------- sheet */
/** Four suns on one room: the E2 gate, now rendered by the same engine. */
export function buildSheet(room: Scene['room']): { w: number; h: number; col: Uint32Array } {
  const yaw = 32;
  const scene = buildSceneCached(room, yaw);
  const cam: CameraView = { yaw, pitch: 54, pix: 14 };
  const rigs: LightRig[] = [
    { ...room.rig, sun: { ...room.rig.sun, azimuth: 200, elevation: 13 } },
    { ...room.rig, sun: { ...room.rig.sun, azimuth: 90, elevation: 62 } },
    { ...room.rig, sun: { ...room.rig.sun, azimuth: 305, elevation: 8 } },
    { ...room.rig, sun: { ...room.rig.sun, azimuth: 20, elevation: 72 } },
  ];
  const panels = rigs.map((rig) => renderFrame(scene, cam, rig, { showPath: false }));
  const pw = Math.max(...panels.map((p) => p.w));
  const ph = Math.max(...panels.map((p) => p.h));
  const gap = 12;
  const w = pw * 2 + gap * 3;
  const h = ph * 2 + gap * 3;
  const col = new Uint32Array(w * h).fill(COLOUR_OF[0]);
  panels.forEach((p, n) => {
    const ox = gap + (n & 1) * (pw + gap);
    const oy = gap + (n >> 1) * (ph + gap);
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        col[(oy + y) * w + ox + x] = p.col[y * p.w + x];
      }
    }
  });
  return { w, h, col };
}

/* ------------------------------------------------------------------ cache */
const sceneCaches = new Map<Scene['room'], { yaw: number; scene: Scene }>();

function buildSceneCached(room: Scene['room'], yaw: number): Scene {
  const hit = sceneCaches.get(room);
  if (hit && Math.abs(hit.yaw - yaw) < 0.02) return hit.scene;
  const scene = buildScene(room, yaw);
  sceneCaches.set(room, { yaw, scene });
  return scene;
}

function hslToPacked(hDeg: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = hDeg / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return ((255 << 24) | (Math.round((b + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((r + m) * 255)) >>> 0;
}
