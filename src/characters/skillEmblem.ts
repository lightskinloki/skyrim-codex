import { RAMP_PACKED, packHex } from '@/battlemap/palette';

/**
 * Skill glyphs: 32 × 32, transparent, for the *game* surface.
 *
 * These used to sit on a carved stone plaque and do duty in the character
 * creator. Both jobs were wrong for them. A plaque is a card the app has
 * already drawn, and a creator step is asking the player to choose a fantasy —
 * it gets a painted scene, not a pictogram. What a glyph is actually for is the
 * character sheet and the combat UI: a small, instantly legible mark beside a
 * name, on whatever surface it lands on.
 *
 * So: no background, no frame, one silhouette with a 1 px ink edge. Three to
 * five tones, all from the board's ramps, so a glyph sits in the same light as
 * everything else. Readable at 20 px, which is the size the sheet uses.
 */

export const EMBLEM_SIZE = { w: 32, h: 32 };
export const EMBLEM_INK = packHex('#08070c');

const W = 32;
const H = 32;

const METAL = RAMP_PACKED.metal;
const FIRE = RAMP_PACKED.fire;
const WOOD = RAMP_PACKED.wood;
const NAVY = RAMP_PACKED.navy;
const WOOL = RAMP_PACKED.wool;
const STONE = RAMP_PACKED.stone;
const OLIVE = RAMP_PACKED.olive;

type Glyph = { col: Uint32Array; solid: Uint8Array };

const glyph = (): Glyph => ({ col: new Uint32Array(W * H), solid: new Uint8Array(W * H) });

function put(g: Glyph, x: number, y: number, c: number) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const i = yi * W + xi;
  g.col[i] = c;
  g.solid[i] = 1;
}

function rect(g: Glyph, x: number, y: number, w: number, h: number, c: number) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
}

function line(g: Glyph, x0: number, y0: number, x1: number, y1: number, c: number, width = 1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx - dy;
  for (let guard = 0; guard < 512; guard++) {
    if (width <= 1) put(g, x, y, c);
    else disc(g, x, y, width / 2, c);
    if (x === ex && y === ey) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function disc(g: Glyph, cx: number, cy: number, r: number, c: number) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) put(g, x, y, c);
    }
  }
}

function ring(g: Glyph, cx: number, cy: number, r: number, c: number) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = dx * dx + dy * dy;
      if (d <= r * r && d > (r - 1) * (r - 1)) put(g, x, y, c);
    }
  }
}

function poly(g: Glyph, pts: readonly [number, number][], c: number) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) xs.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) put(g, x, y, c);
    }
  }
}

/** A stroked circular arc, for bows, wards and summoning circles. */
function arc(
  g: Glyph,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  c: number,
  width = 1,
) {
  const steps = Math.max(8, Math.ceil(Math.abs(a1 - a0) * r));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    if (width <= 1) put(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
    else disc(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, width / 2, c);
  }
}

/** Add the 1 px black edge outside the union silhouette. */
function finish(g: Glyph) {
  const edge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (g.solid[i]) continue;
      if (
        (x > 0 && g.solid[i - 1]) ||
        (x < W - 1 && g.solid[i + 1]) ||
        (y > 0 && g.solid[i - W]) ||
        (y < H - 1 && g.solid[i + W])
      ) {
        edge[i] = 1;
      }
    }
  }
  for (let i = 0; i < W * H; i++) if (edge[i]) g.col[i] = EMBLEM_INK;
}

/* ---------------------------------------------------------------- glyphs */

/** A sword at any angle: one geometry, used by both blade skills. */
function swordAt(
  g: Glyph,
  hiltX: number,
  hiltY: number,
  tipX: number,
  tipY: number,
  halfWidth: number,
  guardHalf: number,
  gripLen: number,
) {
  const dx = tipX - hiltX;
  const dy = tipY - hiltY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  poly(g, [
    [hiltX + px * halfWidth, hiltY + py * halfWidth],
    [tipX + px * halfWidth * 0.55, tipY + py * halfWidth * 0.55],
    [tipX, tipY],
    [tipX - px * halfWidth * 0.55, tipY - py * halfWidth * 0.55],
    [hiltX - px * halfWidth, hiltY - py * halfWidth],
  ], METAL[8]);
  line(g, hiltX + px * (halfWidth - 1), hiltY + py * (halfWidth - 1), tipX + px * 0.4, tipY + py * 0.4, METAL[11]);
  line(g, hiltX, hiltY, tipX - ux, tipY - uy, METAL[5]);
  line(g, hiltX - px * guardHalf, hiltY - py * guardHalf, hiltX + px * guardHalf, hiltY + py * guardHalf, FIRE[7], 2);
  line(g, hiltX + px * (guardHalf - 2), hiltY + py * (guardHalf - 2), hiltX - px * (guardHalf - 2), hiltY - py * (guardHalf - 2), FIRE[9]);
  line(g, hiltX, hiltY, hiltX - ux * gripLen, hiltY - uy * gripLen, WOOD[4], 3);
  for (let i = 1; i < gripLen; i += 2) {
    put(g, hiltX - ux * i + px, hiltY - uy * i + py, WOOD[2]);
    put(g, hiltX - ux * i - px, hiltY - uy * i - py, WOOD[2]);
  }
  disc(g, hiltX - ux * (gripLen + 1), hiltY - uy * (gripLen + 1), 2.2, FIRE[8]);
  put(g, hiltX - ux * (gripLen + 1) - 1, hiltY - uy * (gripLen + 1) - 1, FIRE[11]);
}

function oneHanded(g: Glyph) {
  // Angled, light, one hand: the arming sword a traveller actually carries.
  swordAt(g, 11, 21, 24, 5, 2.2, 5.5, 5);
}

function twoHanded(g: Glyph) {
  // Straight up the middle, broad, with a guard you can see from across a room.
  swordAt(g, 16, 21, 16, 3, 3.9, 10, 5);
}

function archery(g: Glyph) {
  // Bow, string, arrow. The arrow does the pointing; the arc does the telling.
  arc(g, 18, 16, 13, Math.PI * 0.62, Math.PI * 1.38, WOOD[5], 2);
  line(g, 11, 5, 11, 27, METAL[10]);
  rect(g, 6, 15, 3, 3, WOOD[3]);
  rect(g, 6, 15, 3, 1, WOOD[6]);
  line(g, 4, 22, 27, 9, WOOD[7]);
  line(g, 27, 9, 23, 9, METAL[11]);
  line(g, 27, 9, 27, 13, METAL[11]);
  put(g, 26, 10, METAL[8]);
  for (const [x, y] of [[5, 21], [7, 20], [6, 22], [8, 21]] as const) put(g, x, y, WOOL[7]);
  put(g, 4, 22, WOOL[5]);
}

function heavyArmor(g: Glyph) {
  poly(g, [[7, 4], [25, 4], [24, 21], [16, 29], [8, 21]], METAL[7]);
  poly(g, [[9, 6], [23, 6], [22, 20], [16, 26], [10, 20]], METAL[9]);
  line(g, 16, 6, 16, 24, METAL[10]);
  line(g, 10, 8, 10, 18, METAL[11]);
  disc(g, 16, 13, 3.2, METAL[6]);
  disc(g, 16, 13, 1.6, METAL[11]);
  for (const [x, y] of [[9, 8], [23, 8], [10, 20], [22, 20]] as const) put(g, x, y, METAL[11]);
  line(g, 8, 22, 16, 29, METAL[5]);
}

function lightArmor(g: Glyph) {
  poly(g, [[9, 5], [23, 5], [24, 11], [22, 13], [21, 24], [11, 24], [10, 13], [8, 11]], WOOD[4]);
  line(g, 9, 6, 23, 6, WOOD[7]);
  line(g, 10, 10, 22, 10, WOOD[2]);
  line(g, 11, 14, 21, 14, WOOD[2]);
  line(g, 16, 6, 16, 24, WOOD[2]);
  rect(g, 14, 8, 4, 3, FIRE[7]);
  rect(g, 14, 17, 4, 3, FIRE[7]);
  put(g, 15, 9, FIRE[11]);
  put(g, 15, 18, FIRE[11]);
  line(g, 12, 22, 20, 22, WOOD[6]);
  line(g, 22, 5, 25, 9, WOOD[6]);
  line(g, 10, 5, 7, 9, WOOD[6]);
}

function destruction(g: Glyph) {
  // A flame with a real silhouette: wide foot, a waist, a whipped tip.
  for (let y = 3; y <= 28; y++) {
    const t = (y - 3) / 25;
    const half = Math.max(0.6, Math.sin(t * Math.PI) * 10.2 + Math.sin(t * 9) * 1.4);
    line(g, 16 - half, y, 16 + half, y, FIRE[7]);
  }
  for (let y = 10; y <= 28; y++) {
    const t = (y - 10) / 18;
    const half = Math.max(0.5, Math.sin(t * Math.PI) * 4.6);
    line(g, 16 - half, y, 16 + half, y, FIRE[9]);
  }
  rect(g, 15, 20, 2, 8, FIRE[11]);
  rect(g, 15, 25, 2, 3, FIRE[12]);
  put(g, 16, 5, FIRE[10]);
  put(g, 22, 9, FIRE[8]);
  put(g, 10, 12, FIRE[8]);
  put(g, 23, 14, FIRE[6]);
}

function restoration(g: Glyph) {
  ring(g, 16, 15, 9, FIRE[7]);
  ring(g, 16, 15, 8, FIRE[9]);
  rect(g, 15, 8, 2, 14, STONE[12]);
  rect(g, 9, 14, 14, 2, STONE[12]);
  disc(g, 16, 15, 2.2, FIRE[11]);
  put(g, 16, 15, STONE[12]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = 16 + Math.cos(a) * 12;
    const y = 15 + Math.sin(a) * 12;
    line(g, x - Math.cos(a), y - Math.sin(a), x + Math.cos(a), y + Math.sin(a), FIRE[8]);
  }
}

function alteration(g: Glyph) {
  // Three arcs, each broken at the top right: force with a seam in it.
  arc(g, 16, 16, 12, Math.PI * 0.2, Math.PI * 1.75, NAVY[9], 2);
  arc(g, 16, 16, 8, Math.PI * 0.45, Math.PI * 2.05, NAVY[11], 2);
  arc(g, 16, 16, 4, Math.PI * 0.9, Math.PI * 2.4, NAVY[12], 2);
  put(g, 16, 16, STONE[12]);
  for (const [x, y] of [[23, 6], [26, 15], [9, 8], [7, 18]] as const) {
    put(g, x, y, NAVY[12]);
    put(g, x + 1, y, NAVY[9]);
    put(g, x, y + 1, NAVY[9]);
  }
}

function illusion(g: Glyph) {
  // An eye, drawn as one almond: two arcs that meet at the corners.
  poly(g, [
    [4, 16],
    [8, 10],
    [16, 7],
    [24, 10],
    [28, 16],
    [24, 22],
    [16, 25],
    [8, 22],
  ], STONE[11]);
  ring(g, 16, 16, 5, NAVY[8]);
  disc(g, 16, 16, 4, NAVY[10]);
  disc(g, 16, 16, 2, NAVY[3]);
  put(g, 15, 15, STONE[12]);
  put(g, 14, 14, STONE[12]);
  // Lashes above, so it is not a floating football.
  line(g, 9, 9, 7, 6, METAL[5]);
  line(g, 13, 7, 12, 4, METAL[5]);
  line(g, 19, 7, 20, 4, METAL[5]);
  line(g, 23, 9, 25, 6, METAL[5]);
}

function conjuration(g: Glyph) {
  // A summoning circle on the floor, with a hooded shade standing in it.
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    const x = 16 + Math.cos(a) * 13;
    const y = 25 + Math.sin(a) * 4;
    put(g, x, y, NAVY[8]);
    put(g, x, y - 1, NAVY[11]);
  }
  for (let i = 0; i < 5; i++) {
    const x = 5 + i * 5.5;
    put(g, Math.round(x), 28 - Math.round(Math.abs(x - 16) * 0.25), NAVY[12]);
  }
  // The shade: hood, shoulders, a hem that has not finished arriving.
  poly(g, [
    [16, 3],
    [21, 9],
    [22, 14],
    [20, 21],
    [18, 22],
    [16, 20],
    [14, 22],
    [12, 21],
    [10, 14],
    [11, 9],
  ], NAVY[5]);
  poly(g, [
    [16, 8],
    [19, 11],
    [18, 16],
    [14, 16],
    [13, 11],
  ], NAVY[3]);
  line(g, 11, 10, 16, 3, NAVY[8]);
  line(g, 21, 10, 16, 3, NAVY[8]);
  line(g, 10, 15, 12, 21, NAVY[8]);
  line(g, 22, 15, 20, 21, NAVY[8]);
  // The eyes are the one warm thing about it.
  put(g, 14, 12, STONE[12]);
  put(g, 18, 12, STONE[12]);
  put(g, 14, 13, NAVY[12]);
  put(g, 18, 13, NAVY[12]);
}

function sneak(g: Glyph) {
  // A boot print in pale dust, pointing up: five toes, a wide ball, a narrow
  // arch, a round heel. A rectangle with a circle under it reads as a mushroom.
  disc(g, 16, 17, 4.8, WOOD[7]);
  rect(g, 14, 18, 4, 7, WOOD[7]);
  disc(g, 16, 26, 3.2, WOOD[7]);
  disc(g, 8, 13, 1.7, WOOD[7]);
  disc(g, 11, 10, 1.7, WOOD[7]);
  disc(g, 15, 8, 1.8, WOOD[7]);
  disc(g, 19, 10, 1.7, WOOD[7]);
  disc(g, 23, 13, 1.6, WOOD[7]);
  line(g, 12, 16, 20, 16, WOOD[10]);
  line(g, 11, 17, 21, 17, WOOD[4]);
  line(g, 15, 20, 15, 24, WOOD[4]);
  line(g, 17, 20, 17, 24, WOOD[4]);
  put(g, 15, 22, WOOD[2]);
  put(g, 17, 23, WOOD[2]);
}

function lockpicking(g: Glyph) {
  // Key and pick crossed: the two halves of the skill.
  ring(g, 11, 10, 5, FIRE[8]);
  ring(g, 11, 10, 3, FIRE[6]);
  line(g, 14, 13, 25, 24, FIRE[8], 2);
  rect(g, 23, 22, 3, 2, FIRE[10]);
  rect(g, 21, 20, 2, 3, FIRE[10]);
  line(g, 9, 27, 23, 6, METAL[10]);
  line(g, 8, 26, 22, 5, METAL[7]);
  line(g, 23, 6, 26, 4, METAL[11]);
  put(g, 25, 3, METAL[11]);
  put(g, 7, 28, METAL[5]);
}

function speech(g: Glyph) {
  // A coin with a crown struck on it: the only language barter understands.
  disc(g, 16, 17, 10, FIRE[6]);
  disc(g, 16, 17, 9, FIRE[8]);
  disc(g, 16, 17, 7, FIRE[10]);
  ring(g, 16, 17, 9, FIRE[11]);
  poly(g, [
    [11, 20],
    [11, 13],
    [14, 16],
    [16, 12],
    [18, 16],
    [21, 13],
    [21, 20],
  ], FIRE[5]);
  rect(g, 12, 21, 8, 1, FIRE[5]);
  put(g, 16, 14, FIRE[12]);
  put(g, 16, 18, FIRE[12]);
}

function rune(g: Glyph) {
  ring(g, 16, 16, 9, STONE[6]);
  ring(g, 16, 16, 8, STONE[4]);
  line(g, 16, 7, 16, 25, STONE[9], 2);
  line(g, 9, 14, 23, 14, STONE[7]);
  line(g, 9, 20, 23, 20, STONE[7]);
  put(g, 16, 4, STONE[11]);
  put(g, 16, 27, STONE[11]);
}

const GLYPHS: Record<string, (g: Glyph) => void> = {
  'one-handed': oneHanded,
  'two-handed': twoHanded,
  archery,
  'heavy-armor': heavyArmor,
  'light-armor': lightArmor,
  destruction,
  restoration,
  alteration,
  illusion,
  conjuration,
  sneak,
  lockpicking,
  speech,
};

export function skillEmblemPixels(id: string): Uint32Array {
  const g = glyph();
  (GLYPHS[id] ?? rune)(g);
  finish(g);
  return g.col;
}

export const SKILL_EMBLEM_IDS = Object.keys(GLYPHS);

const urlCache = new Map<string, string>();

/**
 * A data URL for an <img>. Cached per id: the sheet draws each glyph once per
 * session. The transparent background is preserved, so the glyph takes the
 * colour of whatever card it sits on.
 */
export function skillEmblemUrl(id: string): string {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(W, H);
  new Uint8ClampedArray(img.data.buffer).set(new Uint8Array(skillEmblemPixels(id).buffer));
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL('image/png');
  urlCache.set(id, url);
  return url;
}
