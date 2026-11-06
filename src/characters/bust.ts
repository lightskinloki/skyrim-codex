import { COLOUR_OF, M_HAIR_BROWN, M_HAIR_GREY, M_INK, M_METAL, M_WOOD_PROP, RAMP_LEN } from '@/battlemap/surface';
import { clamp, hf } from '@/battlemap/rng';
import { EMPTY, P, ellipse, partMask, rect, type PartMask } from './partmask';
import { CLOTH_MATERIAL, hairAt, skinAt, type CharacterSpec } from './spec';
import { RACE_SHAPE, drawBustRaceFace, drawBustRaceHead, showsHair } from './race';

/**
 * The dialogue bust: 128 × 128, head and shoulders, one framing.
 * See docs/PIXEL-ART-SPEC.md §3 (C0, C9).
 *
 * This is a *second render of the spec*, not an upscale of the body: at 128 the
 * outline is 1 px and the eye is 6 px, so the face is built from planes rather
 * than scaled up from a 24 px head.
 *
 * The proportions are fixed here and everything else is derived from them:
 *
 *   crown 19 · hairline 30 · brow 44 · eye 55 · nose tip 75 · mouth 82 · chin 88
 *
 * Those seven numbers are the whole face. The first pass had the hairline at 40,
 * four pixels above the brow, which is why it read as a helmet: a forehead is
 * about a third of the face, and without one the brow ridge and the hair merge
 * into a single band. The hairline and the beard line are *functions of x*, not
 * ellipses — a shape that varies by column can be ragged at no cost, and an
 * ellipse cannot.
 *
 * Z-order is strictly back to front: shoulders · hair behind · neck · head ·
 * race head · hair cap · eyes · nose · mouth · beard mass · beard detail ·
 * race face · hair front.
 */

export const BUST_SIZE = 128;

const CX = 63;
const BROW = 44;
const EYE_Y = 55;
const EYE_L = 52;
const EYE_R = 74;
const NOSE_TIP = 75;
const MOUTH = 82;
const CHIN = 88;

const clothAt = (mat: number, n: number) => P(mat, clamp(7 + n, 0, RAMP_LEN[mat] - 1));

/** The skull's top edge at a column, so hair can follow it. */
const skullTop = (x: number): number => 50 - 31 * Math.sqrt(Math.max(0, 1 - ((x - CX) / 25) ** 2));

/** Where the hair stops and the forehead begins. Ragged by a pixel, by hash. */
const hairlineAt = (x: number): number => {
  const edge = Math.abs(x - CX) / 26;
  const jitter = (hf(x * 3, 11, 5) > 0.62 ? 1 : 0) - (hf(x * 3, 12, 9) > 0.72 ? 1 : 0);
  return Math.round(30 + 13 * edge ** 3 - (edge < 0.22 ? 2 : 0) + jitter);
};

/** Where the beard starts: high at the sideburns, low over the lip. */
const beardTopAt = (x: number): number => Math.round(78 - 14 * (Math.min(1, Math.abs(x - CX) / 19) || 0) ** 0.8);

/** Where the beard stops: a point below the chin, rising to the jaw at the edges. */
const beardBottomAt = (x: number, length: number): number => {
  const edge = Math.min(1, Math.abs(x - CX) / 19);
  return Math.round(86 + length * (1 - edge ** 1.4));
};

/* --------------------------------------------------------------- shoulders */

function drawShoulders(m: PartMask, spec: CharacterSpec) {
  const g = spec.garment;
  const mat = g.torso === 'plate' ? M_METAL : CLOTH_MATERIAL[g.torsoCloth];

  // One shoulder mass, sloping from the neck outward. The half-width grows
  // 20 → 62 and the top edge drops as it goes, which is the whole difference
  // between a bust and a block: the trapezius is the line that sells it.
  const topAt = (x: number) => 100 + Math.round((Math.abs(x - CX) / 62) ** 1.5 * 12);
  for (let x = CX - 62; x <= CX + 62; x++) {
    const top = topAt(x);
    if (top >= BUST_SIZE) continue;
    const half = Math.abs(x - CX) / 62;
    const tone = x < CX - 10 ? clothAt(mat, half > 0.8 ? 0 : 2) : x > CX + 18 ? clothAt(mat, -2) : clothAt(mat, 0);
    rect(m, x, top, 1, BUST_SIZE - top, tone);
  }
  // A dark seam where the shoulder turns away from the light, and a lit collar.
  rect(m, CX + 44, 108, 2, 20, clothAt(mat, -4));
  rect(m, CX - 48, 106, 2, 22, clothAt(mat, 3));

  if (g.torso === 'plate') {
    rect(m, CX - 24, 102, 48, 6, clothAt(M_METAL, 3));
    rect(m, CX - 2, 110, 4, 18, clothAt(M_METAL, -2));
    ellipse(m, CX - 30, 112, 8, 5, clothAt(M_METAL, 4));
  } else if (g.torso === 'tank') {
    // Bare arms: the shoulder mass is skin, then the tank is laid over the chest
    // only. Circles of skin on top of cloth read as pauldrons, not deltoids.
    for (let x = CX - 62; x < CX - 30; x++) {
      const top = topAt(x);
      const lit = x < CX - 40 && x > CX - 54;
      rect(m, x, top, 1, BUST_SIZE - top, lit ? skinAt(spec, 1) : skinAt(spec, -1));
    }
    for (let x = CX + 30; x <= CX + 62; x++) {
      const top = topAt(x);
      rect(m, x, top, 1, BUST_SIZE - top, skinAt(spec, -3));
    }
    rect(m, CX - 16, 102, 32, 8, clothAt(mat, 2));
    rect(m, CX - 8, 100, 16, 6, clothAt(mat, -3)); // the neck opening
    rect(m, CX - 16, 108, 32, 2, clothAt(mat, -2));
  } else if (g.torso === 'vest') {
    rect(m, CX - 9, 100, 18, 16, clothAt(M_WOOD_PROP, 2));
    rect(m, CX - 9, 100, 5, 16, clothAt(M_WOOD_PROP, 4));
    rect(m, CX + 5, 100, 4, 16, clothAt(M_WOOD_PROP, 0));
    rect(m, CX - 13, 100, 26, 6, clothAt(mat, 2));
  } else {
    rect(m, CX - 13, 100, 26, 10, clothAt(mat, 2));
    rect(m, CX - 13, 108, 26, 3, clothAt(mat, -3));
    rect(m, CX - 1, 110, 2, 12, clothAt(mat, -2)); // the placket
  }
}

/* ------------------------------------------------------------------- head */

/** The neck goes down *before* the shoulders, so a gorget can cover it. */
function drawNeck(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);
  rect(m, CX - 13, 80, 26, 26, sk(-5));
  rect(m, CX - 13, 80, 9, 22, sk(-3));
  rect(m, CX - 13, 80, 26, 3, sk(-6)); // the jaw's cast shadow at the top
}

function drawHead(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);

  ellipse(m, CX, 72, 20, 16, sk(0)); // jaw
  ellipse(m, CX, 50, 25, 31, sk(0)); // cranium

  // Planes, not patches. Light is upper-left, so exactly two things are lit —
  // the temple and the cheekbone — and exactly two are not: the right temple and
  // the shadow the brow casts. More than that and the face reads as make-up.
  ellipse(m, CX - 14, 38, 8, 10, sk(1));
  rect(m, CX + 19, 46, 3, 26, sk(-1));
  ellipse(m, CX - 12, 65, 6, 4, sk(1));
  ellipse(m, CX + 8, 78, 10, 4, sk(-2));
  rect(m, CX - 19, BROW + 3, 38, 2, sk(-3));

  // Ears: 4 × 10, not 6 × 14 — at this size an ear is a notch in the
  // silhouette, and anything bigger reads as a handle.
  ellipse(m, CX - 25, 61, 2, 5, sk(-2));
  rect(m, CX - 25, 59, 1, 3, sk(-5));
  ellipse(m, CX + 25, 61, 2, 5, sk(-4));
  rect(m, CX + 25, 59, 1, 3, sk(-6));
}

function drawHairCap(m: PartMask, spec: CharacterSpec) {
  if (!showsHair(spec)) {
    // A shaved scalp is not a bald ellipse: it needs the skull's own shading.
    ellipse(m, CX, 34, 20, 12, skinAt(spec, 1));
    rect(m, CX - 18, 28, 36, 2, skinAt(spec, 2));
    return;
  }
  const mid = hairAt(spec, 0);
  const lit = hairAt(spec, 3);
  const dark = hairAt(spec, -3);

  // Volume above the skull: hair sits on a head, it does not follow the bone.
  for (let x = CX - 28; x <= CX + 28; x++) {
    const top = Math.max(11, Math.round(skullTop(Math.max(CX - 25, Math.min(CX + 25, x))) - 4));
    const bottom = hairlineAt(x);
    if (bottom <= top) continue;
    const tone = x < CX - 6 ? lit : x > CX + 12 ? dark : mid;
    rect(m, x, top, 1, bottom - top, tone);
  }
  // A combed highlight on the lit side and four dark strands, so the mass has
  // grain instead of being one flat swatch. Every strand is clamped inside the
  // cap — a highlight that escapes the silhouette reads as a scratch.
  for (let i = 0; i < 5; i++) {
    const x = CX - 22 + i * 4;
    const top = Math.max(9, Math.round(skullTop(x)) - 4);
    const bottom = Math.min(hairlineAt(x) - 1, top + 10 - i * 2);
    if (bottom > top) rect(m, x, top, 1, bottom - top, hairAt(spec, i < 2 ? 2 : 1));
  }
  rect(m, CX + 4, 14, 2, 14, dark);
  rect(m, CX + 13, 18, 2, 12, dark);
  // The shadow the fringe casts on the forehead — only on the shadow side.
  for (let x = CX + 2; x <= CX + 26; x++) {
    const y = hairlineAt(x);
    rect(m, x, y, 1, 2, skinAt(spec, -2));
  }
}

function drawEyes(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);
  const sclera = P(M_HAIR_GREY, 10);
  const iris = P(M_HAIR_BROWN, 5);
  const slit = RACE_SHAPE[spec.race] === 'khajiit' || RACE_SHAPE[spec.race] === 'argonian';

  for (const ex of [EYE_L, EYE_R]) {
    ellipse(m, ex, EYE_Y, 8, 4, sk(-3)); // socket
    ellipse(m, ex, EYE_Y, 5, 2, sclera);
    if (slit) {
      ellipse(m, ex, EYE_Y + 1, 2, 3, iris);
      rect(m, ex - 1, EYE_Y - 1, 2, 5, P(M_INK, 0));
    } else {
      ellipse(m, ex, EYE_Y + 1, 3, 3, iris);
      rect(m, ex - 1, EYE_Y, 2, 3, P(M_INK, 0));
    }
    rect(m, ex - 2, EYE_Y, 1, 1, P(M_HAIR_GREY, 12)); // catchlight
    rect(m, ex - 6, EYE_Y - 2, 12, 2, sk(-5)); // upper lid and lash
    rect(m, ex - 5, EYE_Y + 3, 10, 1, sk(-5)); // lower lid
  }

  // Brows angled down toward the nose: the whole read of a stern face.
  const brow = hairAt(spec, -1);
  for (let i = 0; i < 13; i++) {
    const drop = Math.round(i * 0.25);
    rect(m, CX - 23 + i, BROW - 1 + drop, 1, 2, brow);
    rect(m, CX + 22 - i, BROW - 1 + drop, 1, 2, hairAt(spec, -3));
  }
}

function drawNose(m: PartMask, spec: CharacterSpec) {
  const shape = RACE_SHAPE[spec.race];
  if (shape === 'khajiit' || shape === 'argonian') return; // the race draws a snout

  const sk = (n: number) => skinAt(spec, n);
  rect(m, CX - 3, EYE_Y + 3, 3, NOSE_TIP - EYE_Y - 3, sk(2)); // lit ridge
  rect(m, CX, EYE_Y + 3, 3, NOSE_TIP - EYE_Y - 3, sk(-2)); // shadowed side
  ellipse(m, CX + 1, NOSE_TIP, 6, 3, sk(1));
  ellipse(m, CX + 4, NOSE_TIP + 1, 3, 2, sk(-2));
  rect(m, CX - 5, NOSE_TIP + 1, 2, 2, sk(-5)); // nostrils
  rect(m, CX + 3, NOSE_TIP + 1, 2, 2, sk(-5));
  rect(m, CX - 7, NOSE_TIP + 3, 15, 1, sk(-4)); // the shadow it casts on the lip
}

function drawMouth(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);
  rect(m, CX - 8, MOUTH, 16, 1, sk(-5));
  rect(m, CX - 6, MOUTH + 2, 12, 2, sk(2));
  rect(m, CX - 4, MOUTH + 5, 8, 1, sk(-3));
}

function drawBeard(m: PartMask, spec: CharacterSpec) {
  if (spec.beard === 'none' || !showsHair(spec)) return;
  const lit = hairAt(spec, 2);
  const mid = hairAt(spec, 0);
  const dark = hairAt(spec, -2);
  const length = spec.beard === 'long' ? 12 : spec.beard === 'full' ? 4 : 0;

  if (spec.beard === 'stubble') {
    for (let x = CX - 19; x <= CX + 19; x++) {
      const top = beardTopAt(x);
      const bottom = beardBottomAt(x, 2);
      for (let y = top; y < bottom; y += 2) {
        if (hf(x, y, 4) > 0.55) rect(m, x, y, 1, 1, dark);
      }
    }
    return;
  }

  // The mass first, shaped by the two functions, so it can never climb past the
  // cheekbones and swallow the eyes. Its outer edge is a shade darker than its
  // middle, which is what gives it a silhouette against the skin.
  for (let x = CX - 20; x <= CX + 20; x++) {
    const top = beardTopAt(x);
    const bottom = beardBottomAt(x, length);
    if (bottom <= top) continue;
    const edge = Math.abs(x - CX) > 16;
    const tone = edge ? dark : x < CX - 5 ? lit : mid;
    rect(m, x, top, 1, bottom - top, tone);
    if (top > 0) rect(m, x, top, 1, 1, hairAt(spec, -4)); // the hard top edge
    // Strands: every third column, in the darker tone, stopping short of the
    // point so the beard thins out rather than being cut off.
    if (x % 3 === 0) rect(m, x, top + 3, 1, Math.max(0, bottom - top - 7), dark);
  }
  rect(m, CX - 5, CHIN + length - 7, 9, 3, lit);

  // Then the mouth, cut back through the mass, then the moustache above it.
  rect(m, CX - 8, MOUTH, 16, 1, skinAt(spec, -5));
  rect(m, CX - 5, MOUTH + 1, 10, 1, skinAt(spec, 3));
  for (let i = 0; i < 9; i++) {
    rect(m, CX - 9 + i, MOUTH - 4 + (i > 4 ? 1 : 0), 1, 3, i < 4 ? lit : mid);
  }
}

/** Behind the head: the mass that gives long hair its width. */
function drawHairBehind(m: PartMask, spec: CharacterSpec) {
  if (!showsHair(spec)) return;
  if (spec.hairStyle === 'long' || spec.hairStyle === 'braid') {
    ellipse(m, CX, 45, 28, 31, hairAt(spec, -3));
    ellipse(m, CX, 43, 26, 28, hairAt(spec, -1));
  } else {
    ellipse(m, CX, 40, 27, 24, hairAt(spec, -2));
  }
}

/** In front: the locks at the temples, and the length that falls past the jaw. */
function drawHairFront(m: PartMask, spec: CharacterSpec) {
  if (!showsHair(spec)) return;
  const lit = hairAt(spec, 2);
  const mid = hairAt(spec, 0);
  const dark = hairAt(spec, -2);

  for (let t = 0; t < 6; t++) {
    const w = 6 - Math.floor(t / 2);
    const y = 34 + t;
    rect(m, CX - 29 - Math.floor(t / 3), y, w, 4, t < 2 ? lit : mid);
    rect(m, CX + 24 + Math.floor(t / 3), y, w, 4, dark);
  }

  if (spec.hairStyle === 'long') {
    // Tapered, not a plank: 10 px at the temple, 3 px at the collarbone, with
    // the outer edge drawn a step darker so the length has a silhouette.
    for (let i = 0; i < 30; i++) {
      const w = Math.max(3, 10 - Math.floor(i / 5));
      const y = 42 + i * 2;
      rect(m, CX - 34, y, w, 2, i < 4 ? lit : mid);
      rect(m, CX - 34, y, 1, 2, i < 4 ? lit : dark);
      rect(m, CX + 34 - w, y + 2, w, 2, dark);
      rect(m, CX + 34 - w, y + 2, w, 1, i > 22 ? mid : dark);
    }
    ellipse(m, CX - 32, 100, 3, 4, mid);
    ellipse(m, CX + 32, 100, 3, 4, dark);
  }
  if (spec.hairStyle === 'braid') {
    // A plait, not a bar: five rows of link, tapering as it falls.
    for (let i = 0; i < 11; i++) {
      const w = i < 7 ? 5 : 3;
      const x = CX + 26 + (i < 7 ? 0 : 1);
      const y = 50 + i * 5;
      rect(m, x, y, w, 3, i % 2 === 0 ? mid : dark);
      rect(m, x, y, 1, 3, lit);
    }
    rect(m, CX + 29, 104, 3, 4, dark);
  }
}

/* ------------------------------------------------------------------- draw */

const cache = new Map<string, PartMask>();

const keyOf = (spec: CharacterSpec) =>
  [spec.race, spec.skinTone, spec.hair, spec.hairStyle, spec.beard, spec.garment.torso, spec.garment.torsoCloth].join(
    '|',
  );

function bustMask(spec: CharacterSpec): PartMask {
  const k = keyOf(spec);
  const hit = cache.get(k);
  if (hit) return hit;

  const m = partMask(BUST_SIZE, BUST_SIZE);
  drawNeck(m, spec);
  drawShoulders(m, spec);
  drawHairBehind(m, spec);
  drawHead(m, spec);
  drawBustRaceHead(m, spec);
  drawHairCap(m, spec);
  drawEyes(m, spec);
  drawNose(m, spec);
  drawMouth(m, spec);
  drawBeard(m, spec);
  drawBustRaceFace(m, spec);
  drawHairFront(m, spec);

  cache.set(k, m);
  return m;
}

/** Packed little-endian RGBA, ready for `new ImageData(new Uint8ClampedArray(col.buffer), 128, 128)`. */
export function renderBust(spec: CharacterSpec): { w: number; h: number; col: Uint32Array } {
  const m = bustMask(spec);
  const { w, h } = m;
  const col = new Uint32Array(w * h);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? EMPTY : m.data[y * w + x]);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const part = at(x, y);
      if (part !== EMPTY) {
        col[y * w + x] = COLOUR_OF[(part >> 4) * 16 + (part & 15)];
        continue;
      }
      if (at(x - 1, y) !== EMPTY || at(x + 1, y) !== EMPTY || at(x, y - 1) !== EMPTY || at(x, y + 1) !== EMPTY) {
        col[y * w + x] = COLOUR_OF[M_INK * 16];
      }
    }
  }
  return { w, h, col };
}

/** How many distinct colours the render used — the C10 gate (target ≤ 32). */
export function bustColourCount(spec: CharacterSpec): number {
  const { col } = renderBust(spec);
  const seen = new Set<number>();
  for (let i = 0; i < col.length; i++) if (col[i] !== 0) seen.add(col[i]);
  return seen.size;
}
