import { packHex } from '@/battlemap/palette';

/**
 * Skill emblems: 32 × 32, drawn from rules rather than shipped as files.
 *
 * Same discipline as the rest of the app — a skill is not a PNG, it is a glyph
 * plus the palette it is allowed to use. That means a new skill added to
 * `data/skills.ts` costs a dozen lines here, and a re-colour of the whole game
 * re-colours every emblem with it.
 *
 * One shape per skill, drawn to read at 48 px in the creator: the sword is a
 * sword, the flame is a flame. This is a character-creation aid, not a HUD icon
 * — the player is deciding what their character *is*, so the pictures have to
 * say "archery" before the label does (docs/PIXEL-ART-SPEC.md §2 on emblems).
 */

const W = 32;
const H = 32;

const STEEL = ['#463c60', '#584c76', '#6d5f8e', '#8774a4', '#a68fb2', '#c8afb8', '#e8d3c2'].map(packHex);
const GOLD = ['#4b2811', '#6f3f1a', '#985a27', '#c17c39', '#d39147', '#e5a95c', '#f3d79a'].map(packHex);
const LEATHER = ['#1a1008', '#301d11', '#51331d', '#7d512e', '#96633a', '#b0784a', '#dcaa7c'].map(packHex);
const EMBER = ['#4d0f03', '#a02205', '#e8470c', '#ff8420', '#ffc760', '#fff2bd'].map(packHex);
const SKY = ['#162649', '#1c315c', '#2e4e8c', '#4f7cbd', '#9dc0e2'].map(packHex);
const IVORY = ['#c8afb8', '#e8d3c2', '#fff2bd'].map(packHex);
const INK = packHex('#0a0810');
const VOID = 0;

type Ctx = {
  col: Uint32Array;
  /** Art pixels, nearest-neighbour upscaled by the <canvas> at view time. */
  put: (x: number, y: number, c: number) => void;
  rect: (x: number, y: number, w: number, h: number, c: number) => void;
  line: (x0: number, y0: number, x1: number, y1: number, c: number) => void;
  ring: (cx: number, cy: number, r: number, c: number) => void;
  disc: (cx: number, cy: number, r: number, c: number) => void;
};

function makeCtx(): Ctx {
  const col = new Uint32Array(W * H);
  const put = (x: number, y: number, c: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    if (!c) return;
    col[y * W + x] = c;
  };
  const rect = (x: number, y: number, w: number, h: number, c: number) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c);
  };
  const line = (x0: number, y0: number, x1: number, y1: number, c: number) => {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const ex = Math.round(x1);
    const ey = Math.round(y1);
    const dx = Math.abs(ex - x);
    const dy = Math.abs(ey - y);
    const sx = x < ex ? 1 : -1;
    const sy = y < ey ? 1 : -1;
    let err = dx - dy;
    for (let guard = 0; guard < 256; guard++) {
      put(x, y, c);
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
  };
  const disc = (cx: number, cy: number, r: number, c: number) => {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) put(cx + x, cy + y, c);
    }
  };
  const ring = (cx: number, cy: number, r: number, c: number) => {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = x * x + y * y;
        if (d <= r * r && d > (r - 1) * (r - 1)) put(cx + x, cy + y, c);
      }
    }
  };
  return { col, put, rect, line, ring, disc };
}

/** The stone plaque every emblem sits on — the shape is the skill's identity. */
function plaque(g: Ctx) {
  // Corners are cut one pixel so the tile reads as carved stone, not a web card.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const corner = (x < 2 || x > W - 3) && (y < 2 || y > H - 3);
      if (corner) continue;
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      if (edge) {
        g.put(x, y, STEEL[0]);
        continue;
      }
      const frame = x === 1 || y === 1 || x === W - 2 || y === H - 2;
      g.put(x, y, frame ? (y === 2 ? STEEL[4] : STEEL[1]) : INK);
    }
  }
  // Rivets, so a row of emblems has a rhythm.
  for (const [x, y] of [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]] as const) {
    g.put(x, y, STEEL[3]);
  }
  // A faint inner vignette: light from the top-left like every other surface.
  g.line(3, 2, W - 4, 2, STEEL[0]);
  g.line(2, 3, 2, H - 4, STEEL[0]);
}

/* ---------------------------------------------------------------- glyphs */

function oneHanded(g: Ctx) {
  // Blade: a bright edge with a darker fuller, crossguard, hilt.
  g.line(10, 24, 22, 8, STEEL[5]);
  g.line(11, 24, 23, 8, STEEL[3]);
  g.line(12, 25, 24, 9, STEEL[1]);
  g.line(9, 19, 15, 24, GOLD[3]);
  g.line(10, 18, 16, 23, GOLD[2]);
  g.line(9, 25, 13, 28, LEATHER[3]);
  g.put(8, 29, GOLD[4]);
}

function twoHanded(g: Ctx) {
  // Longer, heavier, held two-handed: a broad blade down the middle.
  g.rect(14, 6, 4, 15, STEEL[5]);
  g.rect(15, 6, 2, 15, STEEL[3]);
  g.rect(12, 7, 8, 1, STEEL[2]);
  g.rect(11, 19, 10, 2, GOLD[3]);
  g.rect(11, 18, 10, 1, GOLD[2]);
  g.rect(14, 21, 4, 5, LEATHER[3]);
  g.rect(14, 25, 4, 1, GOLD[2]);
  g.put(15, 4, STEEL[6]);
  g.put(16, 4, STEEL[4]);
}

function archery(g: Ctx) {
  // A drawn bow: the arc is the bow, the straight line the arrow, the notch nock.
  for (let y = 7; y <= 25; y++) {
    const t = (y - 16) / 9;
    const x = 20 - Math.round(Math.cos(t * 1.15) * 6);
    g.put(x, y, LEATHER[5]);
    g.put(x + 1, y, LEATHER[3]);
  }
  g.line(20, 7, 20, 25, IVORY[0]);
  g.line(7, 25, 25, 7, STEEL[4]);
  g.line(8, 26, 26, 8, STEEL[2]);
  g.rect(6, 26, 3, 3, GOLD[3]);
  g.put(25, 7, STEEL[6]);
  g.put(24, 6, STEEL[6]);
}

function heavyArmor(g: Ctx) {
  // A tower shield with a thick plated face.
  for (let y = 5; y <= 27; y++) {
    const inset = y < 11 ? 6 - Math.floor((y - 5) / 2) : 6 + Math.floor((y - 11) / 3);
    for (let x = 16 - inset; x <= 16 + inset; x++) {
      if (y === 5 || x === 16 - inset || x === 16 + inset) g.put(x, y, STEEL[1]);
      else g.put(x, y, STEEL[3]);
    }
  }
  g.rect(15, 8, 2, 16, STEEL[5]);
  g.rect(10, 14, 12, 2, GOLD[3]);
  g.disc(16, 15, 2, GOLD[4]);
}

function lightArmor(g: Ctx) {
  // Leather cuirass: straps and buckles, no plates.
  for (let y = 8; y <= 25; y++) {
    const inset = y < 12 ? 6 : 5;
    g.rect(16 - inset, y, inset * 2, 1, y % 4 === 0 ? LEATHER[2] : LEATHER[4]);
  }
  g.line(11, 9, 21, 9, LEATHER[6]);
  g.line(12, 13, 20, 13, LEATHER[1]);
  g.line(12, 20, 20, 20, LEATHER[1]);
  g.rect(15, 11, 2, 3, GOLD[3]);
  g.rect(15, 18, 2, 3, GOLD[3]);
  g.line(16, 8, 16, 25, LEATHER[2]);
}

function destruction(g: Ctx) {
  // Flame: wide base, licking tongue, hot core.
  for (let y = 0; y < 19; y++) {
    const yy = 26 - y;
    const width = Math.max(1, Math.round((y / 19) * 5 + Math.abs(Math.sin(y * 0.55)) * 2));
    g.rect(16 - width, yy, width * 2, 1, EMBER[1]);
  }
  for (let y = 0; y < 14; y++) {
    const yy = 26 - y;
    const width = Math.max(1, Math.round((y / 14) * 3 + Math.abs(Math.sin(y * 0.7)) * 1.5));
    g.rect(16 - width, yy, width * 2, 1, EMBER[2]);
  }
  for (let y = 0; y < 8; y++) g.rect(15, 24 - y, 2, 1, EMBER[4]);
  g.rect(15, 8, 2, 5, EMBER[3]);
  g.put(16, 5, EMBER[5]);
  g.put(15, 6, EMBER[4]);
}

function restoration(g: Ctx) {
  // A sun: the magicka cross inside a ring.
  g.ring(16, 17, 8, GOLD[2]);
  g.ring(16, 17, 7, GOLD[4]);
  g.rect(15, 11, 2, 13, IVORY[1]);
  g.rect(10, 16, 12, 2, IVORY[1]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.put(16 + Math.round(Math.cos(a) * 10), 17 + Math.round(Math.sin(a) * 10), GOLD[3]);
    g.put(16 + Math.round(Math.cos(a) * 11), 17 + Math.round(Math.sin(a) * 11), GOLD[1]);
  }
}

function alteration(g: Ctx) {
  // A spiral of force: concentric rings breaking open at the top.
  g.ring(16, 17, 9, SKY[1]);
  g.ring(16, 17, 6, SKY[3]);
  g.ring(16, 17, 3, SKY[4]);
  g.rect(15, 8, 2, 4, INK);
  g.line(16, 17, 21, 12, SKY[4]);
  g.put(22, 11, IVORY[0]);
  g.put(16, 17, IVORY[1]);
}

function illusion(g: Ctx) {
  // An eye, lid and iris, with a few lashes.
  for (let x = 7; x <= 25; x++) {
    const t = (x - 16) / 9;
    const y = Math.round(17 - (1 - t * t) * 6);
    g.put(x, y, IVORY[0]);
    g.put(x, y + 1, IVORY[1]);
  }
  for (let x = 7; x <= 25; x++) {
    const t = (x - 16) / 9;
    const y = Math.round(17 + (1 - t * t) * 6);
    g.put(x, y, IVORY[0]);
  }
  g.disc(16, 17, 3, SKY[3]);
  g.disc(16, 17, 1, SKY[0]);
  g.put(15, 16, IVORY[2]);
  for (const x of [9, 13, 19, 23]) g.put(x, 6 + (x % 3), STEEL[2]);
}

function conjuration(g: Ctx) {
  // A summoning circle with a rising hand, drawn in cold light.
  g.ring(16, 20, 9, SKY[2]);
  g.ring(16, 20, 8, SKY[4]);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.put(16 + Math.round(Math.cos(a) * 8), 20 + Math.round(Math.sin(a) * 8), IVORY[1]);
  }
  g.rect(13, 13, 6, 6, IVORY[0]);
  g.rect(14, 14, 4, 5, IVORY[1]);
  for (const x of [14, 16, 18]) g.rect(x, 8, 1, 5, IVORY[0]);
  g.put(13, 12, IVORY[2]);
  g.put(19, 12, IVORY[2]);
}

function sneak(g: Ctx) {
  // A footprint: heel, ball, toes. Silent, directional.
  g.rect(13, 16, 6, 7, LEATHER[3]);
  g.disc(16, 16, 5, LEATHER[4]);
  g.rect(14, 12, 4, 5, LEATHER[4]);
  for (const x of [12, 15, 18, 21]) g.put(x, 8 + Math.abs(16 - x) / 2, LEATHER[5]);
  g.put(16, 24, LEATHER[2]);
  g.put(15, 25, LEATHER[1]);
}

function lockpicking(g: Ctx) {
  // A key and a pick crossed: the two halves of the skill.
  g.ring(12, 12, 4, GOLD[3]);
  g.ring(12, 12, 3, GOLD[2]);
  g.line(15, 15, 25, 25, GOLD[4]);
  g.rect(22, 22, 2, 2, GOLD[5]);
  g.rect(20, 20, 2, 2, GOLD[5]);
  g.line(9, 27, 21, 9, STEEL[4]);
  g.line(8, 26, 20, 8, STEEL[2]);
  g.put(8, 27, STEEL[1]);
  g.put(22, 7, IVORY[0]);
}

function speech(g: Ctx) {
  // A coin and a scroll seal: gold talks.
  g.ring(16, 16, 9, GOLD[2]);
  g.ring(16, 16, 8, GOLD[4]);
  g.rect(12, 12, 8, 9, GOLD[1]);
  g.rect(13, 13, 6, 7, GOLD[3]);
  g.line(14, 15, 18, 15, GOLD[5]);
  g.line(14, 17, 18, 17, GOLD[5]);
  g.line(14, 19, 17, 19, GOLD[5]);
  g.put(24, 10, IVORY[1]);
}

const GLYPHS: Record<string, (g: Ctx) => void> = {
  'one-handed': oneHanded,
  'two-handed': twoHanded,
  archery: archery,
  'heavy-armor': heavyArmor,
  'light-armor': lightArmor,
  destruction: destruction,
  restoration: restoration,
  alteration: alteration,
  illusion: illusion,
  conjuration: conjuration,
  sneak: sneak,
  lockpicking: lockpicking,
  speech: speech,
};

/** Fallback: a rune that says "this skill exists but has no emblem yet". */
function rune(g: Ctx) {
  g.ring(16, 16, 8, STEEL[2]);
  g.rect(15, 8, 2, 16, STEEL[4]);
  g.line(9, 14, 23, 14, STEEL[3]);
  g.line(9, 20, 23, 20, STEEL[3]);
}

export function skillEmblemPixels(id: string): Uint32Array {
  const g = makeCtx();
  plaque(g);
  (GLYPHS[id] ?? rune)(g);
  return g.col;
}

/** Raw pixels, for the tests and for anything that wants to compose them. */
export const SKILL_EMBLEM_IDS = Object.keys(GLYPHS);
export const EMBLEM_SIZE = { w: W, h: H };

const urlCache = new Map<string, string>();

/**
 * A data URL for an <img>. Cached per id: thirteen 32×32 emblems are drawn once
 * per session, because the creator re-renders on every rank click and
 * re-encoding a PNG on each of those would be wasteful for no pixels gained.
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
