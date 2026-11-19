import { BOTTOM_MARGIN, CELL, RIGHT_MARGIN, TOP_MARGIN, paintRoom } from './paint';
import { Room } from './room';
import { MATERIAL_COUNT, MATERIALS, Surface, COLOUR_OF } from './surface';
import { buildNormals } from './normals';
import { LightCache, LightRig, lightShiftAt, makeLightCache, shade } from './light';
import { PropLight, PropRule, drawPlaced, placeProp } from './props';
import { drawPath } from './tokens';
import { drawBody } from '@/characters/body';
import { LONGEST_RAMP, packRGB } from './palette';
import { rotateGrid, toCamera, toCameraFacing } from './camera';

/**
 * Build once, shade per frame, present as one blit.
 * See docs/PRESENTATION-SPEC.md X1 and PIXEL-ART-SPEC.md P14.
 */

// The camera is pure geometry now, shared with the prop projection — see
// `camera.ts`. Re-exported here because this is where callers expect it.
export { rotateGrid, toCamera, toCameraFacing, toWorld } from './camera';

export type DebugView = 'lit' | 'normals' | 'height' | 'spec' | 'materials';

export type RenderOptions = {
  rig: LightRig;
  time: number;
  showPath?: boolean;
  selectedToken?: string | null;
};

export class BoardRenderer {
  readonly room: Room;
  /** Quarter turns the camera has made; 0 is the authored view. */
  yaw = 0;
  /** The room in camera space. Replaced by `build`, never mutated. */
  grid: ReturnType<typeof rotateGrid>;
  surface: Surface;
  normals: Uint32Array;
  /** Lamps carried by props, already in camera space. */
  private propLights: PropLight[] = [];
  /** The front buffer as built. Bodies rewrite `surface.front` every frame so
   *  they can sort against each other; this is what they start from. */
  private staticFront: Int16Array = new Int16Array(0);
  private cache: LightCache;
  private readonly src: HTMLCanvasElement;
  private readonly sctx: CanvasRenderingContext2D;
  private img: ImageData;

  constructor(room: Room) {
    this.room = room;
    this.grid = room.grid;
    this.surface = new Surface(1, 1);
    this.normals = new Uint32Array(1);
    this.cache = makeLightCache(1, 1);
    this.img = new ImageData(1, 1);

    this.src = document.createElement('canvas');
    const ctx = this.src.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.sctx = ctx;

    this.build(0);
  }

  /**
   * Paint the static board for a camera yaw: floors, then walls in depth order,
   * then every prop projected from its footprint. This is a build step rather
   * than a per-frame cost, because none of it moves until the camera does.
   */
  build(yaw: number) {
    this.yaw = yaw & 3;
    const g = rotateGrid(this.room.grid, this.yaw);
    this.grid = g;
    const w = g.cols * CELL + RIGHT_MARGIN;
    const h = g.rows * CELL + TOP_MARGIN + BOTTOM_MARGIN;
    this.surface = new Surface(w, h);
    paintRoom(this.surface, g, TOP_MARGIN);

    // Project every prop, then lay them down back to front. A prop's depth is
    // its footprint's south edge, so the order follows the room rather than
    // the order someone happened to author the list in.
    const { cols, rows } = this.room.grid;
    const placed = this.room.props
      .map((p) => placeProp(p, g.seed, TOP_MARGIN, this.yaw, cols, rows))
      .sort((a, b) => a.front - b.front);

    this.propLights = [];
    for (let i = 0; i < placed.length; i++) {
      const lamp = drawPlaced(this.surface, placed[i], g.seed);
      if (lamp) this.propLights.push(lamp);
    }

    this.normals = buildNormals(this.surface, 0.62);
    this.staticFront = this.surface.front.slice();
    this.cache = makeLightCache(w, h);

    this.src.width = w;
    this.src.height = h;
    const bytes = new Uint8ClampedArray(this.surface.col.buffer, this.surface.col.byteOffset, this.surface.col.length * 4);
    this.img = new ImageData(bytes, w, h);
  }

  get width() {
    return this.surface.w;
  }
  get height() {
    return this.surface.h;
  }

  /** Shade the board and draw everything that moves. */
  render(opts: RenderOptions) {
    const { time } = opts;
    const { cols, rows } = this.room.grid;
    // The rig is authored in room coordinates: drag it into the camera's frame
    // with the walls, or turning the room would turn the sun with it. Lamps
    // that came from props are already in camera space.
    const rig = {
      ...opts.rig,
      sun: { ...opts.rig.sun, azimuth: opts.rig.sun.azimuth - this.yaw * 90 },
      points: [
        ...opts.rig.points.map((p) => {
          const [cx, cy] = toCamera(p.x / CELL, p.y / CELL, cols, rows, this.yaw);
          return { ...p, x: cx * CELL, y: cy * CELL + TOP_MARGIN };
        }),
        ...this.propLights,
      ],
    };
    shade(this.surface, this.normals, rig, this.surface.col, time, this.cache);

    if (opts.showPath) {
      const path = this.room.path.map(([x, y]) => {
        const [px, py] = toCamera(x + 0.5, y + 0.5, cols, rows, this.yaw);
        return [px - 0.5, py - 0.5] as [number, number];
      });
      drawPath(this.surface, path, TOP_MARGIN);
    }

    // Back to front, so a body nearer the camera covers one further away. The
    // front buffer then settles every body against the wall behind it.
    this.surface.front.set(this.staticFront);
    const bodies = this.room.tokens
      .map((tok) => ({ tok, at: toCamera(tok.at[0], tok.at[1], cols, rows, this.yaw) }))
      .sort((a, b) => a.at[1] - b.at[1]);

    for (const { tok, at } of bodies) {
      // Sample the light at the token so it sits in the same light as the floor.
      const shift = lightShiftAt(
        (Math.round(at[0]) + 0.5) * CELL,
        TOP_MARGIN + (Math.round(at[1]) + 0.85) * CELL,
        rig,
        time,
      );
      const phase = time * 1.6 + (tok.id.charCodeAt(0) % 7);
      drawBody(
        this.surface,
        tok.spec,
        at,
        toCameraFacing(tok.facing, this.yaw),
        shift,
        phase,
        opts.selectedToken === tok.id,
        TOP_MARGIN,
      );
    }
  }

  /** Write a debug view into the colour buffer instead of the lit image. */
  debug(view: DebugView) {
    const s = this.surface;
    const { w, h } = s;
    if (view === 'normals') {
      s.col.set(this.normals);
      return;
    }
    if (view === 'materials') {
      for (let i = 0; i < w * h; i++) {
        const m = s.mat[i];
        const hue = (m * 47) % 360;
        s.col[i] = hslToPacked(hue, 0.45, 0.25 + (s.idx[i] / 12) * 0.5);
      }
      return;
    }
    for (let i = 0; i < w * h; i++) {
      const v = view === 'height' ? (s.height[i] + 8) / 16 : s.spec[i] / 255;
      const c = Math.max(0, Math.min(255, Math.round(v * 255)));
      s.col[i] = packRGB(c, c, c);
    }
  }

  present(canvas: HTMLCanvasElement, scale: number, panX: number, panY: number) {
    const { w, h } = this.surface;
    this.sctx.putImageData(this.img, 0, 0);

    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
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
  return packRGB(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
}

/* ------------------------------------------------------------------ sheet */
/**
 * The E1/E2 gate, as one image: every material's ramp, and one field of floor
 * built from a single tile with offset and flips, shown at four sun azimuths.
 */
export function buildSheet(seed: number): { w: number; h: number; col: Uint32Array } {
  const fieldCells = 8;
  const fieldPx = fieldCells * CELL;
  const gap = 16;
  const topH = 12 * 13 + 8;
  const sw = 9;
  const w = Math.max(8 + 4 * (fieldPx + gap), 16 + LONGEST_RAMP * (sw + 2));
  const h = topH + fieldPx + 32;
  const col = new Uint32Array(w * h).fill(packRGB(10, 9, 14));

  // Ramp table: every material, every step, in order.
  for (let m = 0; m < MATERIAL_COUNT; m++) {
    const mat = MATERIALS[m];
    for (let i = 0; i < LONGEST_RAMP; i++) {
      const c = COLOUR_OF[m * 16 + Math.min(i, mat.packed.length - 1)];
      const x0 = 8 + i * (sw + 2);
      const y0 = 8 + m * 13;
      for (let j = 0; j < sw; j++) for (let k = 0; k < sw; k++) col[(y0 + j) * w + (x0 + k)] = c;
    }
  }

  // Four fields, one per azimuth.
  const azimuths = [200, 225, 305, 90];
  for (let a = 0; a < 4; a++) {
    const grid = {
      cols: fieldCells,
      rows: fieldCells,
      seed,
      cells: new Uint8Array(fieldCells * fieldCells),
    };
    for (let y = 0; y < fieldCells; y++) {
      for (let x = 0; x < fieldCells; x++) {
        const edge = x === 0 || y === 0 || x === fieldCells - 1 || y === fieldCells - 1;
        grid.cells[y * fieldCells + x] = edge ? 2 : 1;
      }
    }
    const s = new Surface(fieldPx + RIGHT_MARGIN, fieldPx + TOP_MARGIN);
    paintRoom(s, grid, TOP_MARGIN);
    // A few props so the field is not just a pattern.
    const sample: PropRule[] = [
      { rule: 'chest', at: [2, 3], bands: 2 },
      { rule: 'brazier', at: [5.25, 4], lit: true },
      { rule: 'rubble', at: [3, 5], size: 2 },
    ];
    for (const q of sample
      .map((p) => placeProp(p, seed, TOP_MARGIN, 0, fieldCells, fieldCells))
      .sort((x, y) => x.front - y.front)) {
      drawPlaced(s, q, seed);
    }
    const n = buildNormals(s, 0.62);
    const rig: LightRig = {
      ambient: 0.3,
      sun: { azimuth: azimuths[a], elevation: a === 3 ? 82 : 14, intensity: 1 },
      points: [{ x: 5.5 * CELL, y: TOP_MARGIN + 4.4 * CELL, radius: 3.2 * CELL, intensity: 1.0, flicker: 0 }],
    };
    shade(s, n, rig, s.col, 0, makeLightCache(s.w, s.h));

    const ox = 8 + a * (fieldPx + gap);
    const oy = topH;
    for (let y = 0; y < fieldPx; y++) {
      for (let x = 0; x < fieldPx; x++) {
        col[(oy + y) * w + (ox + x)] = s.col[y * s.w + x];
      }
    }
  }

  return { w, h, col };
}
