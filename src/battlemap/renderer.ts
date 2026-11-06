import { CELL, paintRoom } from './paint';
import { Room } from './room';
import { MATERIAL_COUNT, MATERIALS, Surface, COLOUR_OF } from './surface';
import { buildNormals } from './normals';
import { LightCache, LightRig, lightShiftAt, makeLightCache, shade } from './light';
import { drawProp } from './props';
import { drawPath } from './tokens';
import { drawBody } from '@/characters/body';
import { LONGEST_RAMP, packRGB } from './palette';

/**
 * Build once, shade per frame, present as one blit.
 * See docs/PRESENTATION-SPEC.md X1 and PIXEL-ART-SPEC.md P14.
 */

export type DebugView = 'lit' | 'normals' | 'height' | 'spec' | 'materials';

export type RenderOptions = {
  rig: LightRig;
  time: number;
  showPath?: boolean;
  selectedToken?: string | null;
};

export class BoardRenderer {
  readonly room: Room;
  readonly surface: Surface;
  readonly normals: Uint32Array;
  private readonly cache: LightCache;
  private readonly src: HTMLCanvasElement;
  private readonly sctx: CanvasRenderingContext2D;
  private readonly img: ImageData;

  constructor(room: Room) {
    this.room = room;
    const w = room.grid.cols * CELL;
    const h = room.grid.rows * CELL;
    this.surface = new Surface(w, h);
    paintRoom(this.surface, room.grid);
    for (const p of room.props) drawProp(this.surface, p, room.grid.seed);
    this.normals = buildNormals(this.surface, 0.62);
    this.cache = makeLightCache(w, h);

    this.src = document.createElement('canvas');
    this.src.width = w;
    this.src.height = h;
    const ctx = this.src.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.sctx = ctx;
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
    const { rig, time } = opts;
    shade(this.surface, this.normals, rig, this.surface.col, time, this.cache);

    if (opts.showPath) drawPath(this.surface, this.room.path);

    for (const tok of this.room.tokens) {
      // Sample the light at the token so it sits in the same light as the floor.
      const shift = lightShiftAt((Math.round(tok.at[0]) + 0.5) * CELL, (Math.round(tok.at[1]) + 0.85) * CELL, rig, time);
      const phase = time * 1.6 + (tok.id.charCodeAt(0) % 7);
      drawBody(this.surface, tok.spec, tok.at, tok.facing, shift, phase, opts.selectedToken === tok.id);
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

  present(canvas: HTMLCanvasElement, scale: number, quarterTurns: number, panX: number, panY: number) {
    const { w, h } = this.surface;
    this.sctx.putImageData(this.img, 0, 0);

    const q = ((quarterTurns % 4) + 4) % 4;
    const cw = q % 2 === 1 ? h : w;
    const ch = q % 2 === 1 ? w : h;
    const dw = Math.round(cw * scale);
    const dh = Math.round(ch * scale);
    if (canvas.width !== dw) canvas.width = dw;
    if (canvas.height !== dh) canvas.height = dh;
    if (canvas.style.width !== `${dw}px`) canvas.style.width = `${dw}px`;
    if (canvas.style.height !== `${dh}px`) canvas.style.height = `${dh}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, dw, dh);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(dw / 2 - panX, dh / 2 - panY);
    ctx.rotate((q * Math.PI) / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(this.src, -w / 2, -h / 2);
    ctx.restore();
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
    const s = new Surface(fieldPx, fieldPx);
    paintRoom(s, grid);
    // A couple of props so the field is not just a pattern.
    drawProp(s, { rule: 'chest', at: [2, 3], bands: 2 }, seed);
    drawProp(s, { rule: 'brazier', at: [5, 4], lit: true }, seed);
    drawProp(s, { rule: 'rubble', at: [3, 5], size: 2 }, seed);
    const n = buildNormals(s, 0.62);
    const rig: LightRig = {
      ambient: 0.3,
      sun: { azimuth: azimuths[a], elevation: a === 3 ? 82 : 14, intensity: 1 },
      points: [{ x: 5.5 * CELL, y: 4.4 * CELL, radius: 3.2 * CELL, intensity: 1.0, flicker: 0 }],
    };
    shade(s, n, rig, s.col, 0, makeLightCache(fieldPx, fieldPx));

    const ox = 8 + a * (fieldPx + gap);
    const oy = topH;
    for (let y = 0; y < fieldPx; y++) {
      for (let x = 0; x < fieldPx; x++) {
        col[(oy + y) * w + (ox + x)] = s.col[y * fieldPx + x];
      }
    }
  }

  return { w, h, col };
}
