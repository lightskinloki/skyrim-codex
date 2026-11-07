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
const BROW = 48;
const EYE_Y = 56;
const EYE_L = 52;
const EYE_R = 74;
const NOSE_TIP = 71;
const MOUTH = 81;
const CHIN = 89;

const clothAt = (mat: number, n: number) => P(mat, clamp(7 + n, 0, RAMP_LEN[mat] - 1));

/** The skull's top edge at a column, so hair can follow it. */
const skullTop = (x: number): number => 48 - 30 * Math.sqrt(Math.max(0, 1 - ((x - CX) / 25) ** 2));

/**
 * The head's half-width at a row. One curve from brow to chin instead of two
 * ellipses: a cranium laid on a jaw leaves a visible seam at the cheek, and the
 * widest point of a face is the cheekbone, not the middle of an ellipse.
 */
const faceHalf = (y: number): number => {
  if (y < 18 || y > 91) return 0;
  if (y <= 50) return 24.5 * Math.sqrt(Math.max(0, 1 - ((y - 50) / 32) ** 2));
  // A jaw is not the bottom of an ellipse. The old cosine pulled the face in
  // to five pixels at the chin, which is why every bearded character read as a
  // triangle; a real jaw keeps roughly sixty percent of the cheekbone width at
  // the mouth and then rounds off over the last two rows.
  const t = (y - 50) / 39;
  const half = 10 + 14.5 * Math.cos(t * (Math.PI / 2));
  return y > 89 ? half * ((91.5 - y) / 2.5) : half;
};

/** Where the hair stops and the forehead begins. Ragged by a pixel, by hash. */
const hairlineAt = (x: number): number => {
  const edge = Math.min(1, Math.abs(x - CX) / 27);
  // Asymmetric on purpose: a lock falls across the left forehead and the right
  // side is swept back. A symmetric curve is a bowl; this is a haircut.
  const sweep = 7 * Math.exp(-(((x - (CX - 14)) / 8) ** 2));
  const notch = x > CX + 2 ? Math.round(2 * Math.exp(-(((x - (CX + 10)) / 5) ** 2))) : 0;
  return Math.round(36 - 6 * edge ** 2 + sweep - notch);
};

/** The top of the hair mass, a little above the skull so it has volume. */
const hairTopAt = (x: number): number => {
  const dome = 44 - 33 * Math.sqrt(Math.max(0, 1 - ((x - CX) / 27) ** 2));
  // A wave on the lit side and a step at the part: one deliberate line each,
  // not a pixel of hash on every column. A silhouette made of noise reads as a
  // damaged sprite, not as hair.
  const wave = x < CX - 2 ? -Math.round(2 * Math.exp(-(((x - (CX - 13)) / 7) ** 2))) : 0;
  const part = x > CX + 5 && x < CX + 10 ? 1 : 0;
  return Math.max(10, Math.round(dome - 2 + wave + part));
};

/** Where the beard starts: below the lip at the centre, up the jaw at the sides. */
const beardTopAt = (x: number): number =>
  Math.max(66, Math.round(84 - 22 * Math.min(1, Math.abs(x - CX) / 22) ** 1.8));

/** A shaded ellipse with a one-pixel dithered rim, so planes do not read as decals. */
function softEllipse(m: PartMask, cx: number, cy: number, rx: number, ry: number, tone: number, rim: number) {
  for (let y = Math.floor(cy - ry * 1.3); y <= Math.ceil(cy + ry * 1.3); y++) {
    if (y < 0 || y >= m.h) continue;
    for (let x = Math.floor(cx - rx * 1.3); x <= Math.ceil(cx + rx * 1.3); x++) {
      if (x < 0 || x >= m.w) continue;
      const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
      if (d <= 1) m.data[y * m.w + x] = tone;
      else if (d <= 1.55 && hf(x * 3 + 1, y * 5 + 2, 17) > 0.42) m.data[y * m.w + x] = rim;
    }
  }
}

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
  // Ten pixels a side, not thirteen: the neck is behind the jaw, and a column
  // wider than the chin is what made the head look mounted on a post.
  rect(m, CX - 10, CHIN - 4, 20, 22, sk(-4));
  rect(m, CX - 10, CHIN - 4, 7, 20, sk(-1));
  rect(m, CX - 3, CHIN - 4, 6, 20, sk(-2));
  rect(m, CX + 4, CHIN - 4, 6, 20, sk(-4));
  rect(m, CX - 10, CHIN - 4, 20, 3, sk(-6)); // the jaw's cast shadow
  for (let x = CX - 9; x < CX + 10; x++) {
    if (hf(x, 90, 23) > 0.55) rect(m, x, 92, 1, 1, sk(-5)); // the collar's shadow
  }
}

function drawHead(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);

  // The silhouette is one curve, widened at the cheekbones and tapered to the
  // chin. Two ellipses (cranium + jaw) made a wide, flat face with a seam where
  // they met; this gives the jaw an angle instead.
  for (let y = 18; y <= 91; y++) {
    const half = Math.round(faceHalf(y));
    for (let x = CX - half; x <= CX + half; x++) m.data[y * m.w + x] = sk(0);
  }

  // One light, one shadow, one transition. The old pass painted eight soft
  // ellipses onto the face; each was plausible on its own and together they
  // read as camouflage. A face at this size needs a lit side, a shadow side,
  // and three or four local marks — not a dozen patches.
  for (let y = 18; y <= 91; y++) {
    const half = Math.round(faceHalf(y));
    for (let x = CX - half; x <= CX + half; x++) {
      let tone = x < CX - 2 ? sk(1) : x > CX + 4 ? sk(-1) : sk(0);
      if (x >= CX - 3 && x <= CX - 2 && hf(x, y, 41) > 0.45) tone = sk(0);
      if (x >= CX + 4 && x <= CX + 5 && hf(x, y, 43) > 0.5) tone = sk(0);
      m.data[y * m.w + x] = tone;
    }
  }

  // The forehead and cheekbone catch the light; the far temple and the jaw
  // turn away. These are the only patches the face needs.
  for (let y = 32; y <= 41; y++) {
    for (let x = CX - 19; x <= CX - 5; x++) {
      if (hf(x, y, 3) > 0.22) m.data[y * m.w + x] = sk(2);
    }
  }
  for (let y = 58; y <= 64; y++) {
    const t = (y - 61) / 3;
    for (let x = CX - 18; x <= CX - 9; x++) {
      const dx = (x - (CX - 13.5)) / 4.5;
      if (dx * dx + t * t <= 1 && hf(x, y, 7) > 0.2) m.data[y * m.w + x] = sk(2);
    }
  }
  for (let y = 35; y <= 52; y++) {
    for (let x = CX + 16; x <= CX + 23; x++) {
      if (hf(x, y, 29) > 0.3) m.data[y * m.w + x] = sk(-2);
    }
  }

  // The jaw's own edge: a narrow band of shadow, not a black outline. The
  // render's ink outline handles the silhouette; this is the form turning away.
  for (let y = 60; y <= 88; y++) {
    const half = Math.round(faceHalf(y));
    for (let k = 0; k < 2; k++) {
      if (hf(CX + half - k, y, 31) > 0.35) m.data[y * m.w + CX + half - k] = sk(-2);
    }
    if (hf(CX - half, y, 37) > 0.5) m.data[y * m.w + CX - half] = sk(2);
  }
  for (let y = 88; y <= 91; y++) {
    for (let x = CX - 8; x <= CX + 8; x++) m.data[y * m.w + x] = sk(-3);
  }

  // Ears. In a front view an ear is a notch in the silhouette, not a handle:
  // five pixels wide, with a lit helix and a dark canal.
  for (const side of [-1, 1] as const) {
    const ex = CX + side * 24;
    const lit = side < 0;
    for (let y = 55; y <= 67; y++) {
      const w = y < 58 ? 2 : y < 64 ? 3 : 2;
      for (let i = 0; i < w; i++) m.data[y * m.w + ex + side * i] = sk(lit ? -1 : -2);
    }
    rect(m, ex - (side < 0 ? 1 : 0), 57, 1, 4, sk(lit ? 1 : -1));
    rect(m, ex + (side > 0 ? 1 : 0), 62, 1, 3, sk(-4));
    rect(m, ex, 60, 1, 2, sk(-6));
  }
}

function drawHairCap(m: PartMask, spec: CharacterSpec) {
  if (!showsHair(spec)) {
    // A shaved scalp is not a bald ellipse: it needs the skull's own shading.
    softEllipse(m, CX - 5, 28, 13, 8, skinAt(spec, 1), skinAt(spec, 0));
    softEllipse(m, CX - 2, 32, 8, 4, skinAt(spec, 2), skinAt(spec, 1));
    rect(m, CX - 18, 29, 36, 1, skinAt(spec, -1));
    return;
  }
  const mid = hairAt(spec, 0);
  const lit = hairAt(spec, 2);
  const dark = hairAt(spec, -2);
  const darkest = hairAt(spec, -4);

  // Volume above the skull. Three flat tones, a diagonal terminator, no hash:
  // at this size a clean shape reads as hair and a dithered one reads as mould.
  for (let x = CX - 28; x <= CX + 28; x++) {
    const top = hairTopAt(x);
    const bottom = hairlineAt(x);
    if (bottom <= top) continue;
    for (let y = top; y < bottom; y++) {
      const nx = (x - CX) / 28;
      const ny = (y - 14) / 36;
      const l = 0.45 - nx * 0.7 - ny * 0.3;
      const tone = l > 0.24 ? lit : l < -0.06 ? dark : mid;
      m.data[y * m.w + x] = tone;
    }
  }

  // A side part: one pixel of the darkest tone, from the crown to just above
  // the hairline. It is the difference between a haircut and a helmet.
  const partX = CX + 7;
  for (let y = hairTopAt(partX) + 1; y < hairlineAt(partX) - 1; y++) {
    m.data[y * m.w + partX] = darkest;
  }

  // Locks are broad grooves, not single-pixel scratches. Each is a dark line
  // with a lit line beside it, sweeping away from the part, and they stop a
  // pixel short of the hairline so the fringe reads as a separate layer.
  for (let i = 0; i < 4; i++) {
    const x0 = CX - 20 + i * 11;
    const top = hairTopAt(x0) + 2;
    const bottom = hairlineAt(x0) - 1;
    const dir = x0 < partX ? -1 : 1;
    for (let y = top; y < bottom; y++) {
      const xx = x0 + Math.floor((y - top) / 7) * dir;
      const j = y * m.w + xx;
      if ((m.data[j] >> 4) !== (mid >> 4)) continue;
      m.data[j] = dark;
      const k = j - dir;
      if ((m.data[k] >> 4) === (mid >> 4)) m.data[k] = lit;
    }
  }

  // The fringe is three locks that fall past the line, each with its own cast
  // shadow. Between them the forehead is open, which is what keeps the hair
  // from looking like a bowl with a straight rim.
  const locks = [
    { x0: CX - 22, x1: CX - 13, dip: 4 },
    { x0: CX - 13, x1: CX - 5, dip: 3 },
    { x0: CX - 5, x1: CX + 2, dip: 2 },
  ];
  for (const lock of locks) {
    for (let x = lock.x0; x <= lock.x1; x++) {
      const t = (x - lock.x0) / (lock.x1 - lock.x0);
      const base = hairlineAt(x);
      const tip = base + Math.round(Math.sin(t * Math.PI) * lock.dip);
      for (let y = base; y < tip; y++) m.data[y * m.w + x] = x < CX - 14 ? lit : mid;
      m.data[tip * m.w + x] = mid;
      m.data[(tip + 1) * m.w + x] = skinAt(spec, -2);
    }
  }

  // Sideburns follow the cheek instead of hanging at a fixed x. Two pixels on
  // the outside of the face, angled in as the jaw narrows, so they meet the
  // beard rather than stopping in mid-air like a pair of wires.
  for (const side of [-1, 1] as const) {
    for (let y = 38; y <= 64; y++) {
      const x = CX + side * Math.max(2, Math.round(faceHalf(y)) - 1);
      m.data[y * m.w + x] = side < 0 ? mid : dark;
      m.data[y * m.w + x - side] = side < 0 ? lit : mid;
    }
  }
}

function drawEyes(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);
  const sclera = P(M_HAIR_GREY, 11); // cream, not white: a white sclera is a cartoon
  const iris = P(M_HAIR_BROWN, 8);
  const pupil = P(M_INK, 0);
  const glint = P(M_HAIR_GREY, 13);
  const catEye = RACE_SHAPE[spec.race] === 'khajiit' || RACE_SHAPE[spec.race] === 'argonian';

  for (const [ex, far] of [
    [EYE_L, false],
    [EYE_R, true],
  ] as const) {
    const w = far ? 3 : 4;
    const cx = ex + 0.5; // even widths sit on a pixel pair, not a seam

    // The socket is one pixel of shadow, not an ellipse: a dark ring around
    // the eye is a bruise, and it was swallowing the eye it was meant to seat.
    for (let x = ex - w - 2; x <= ex + w + 2; x++) {
      if (hf(x, EYE_Y - 3, 5) > 0.2) m.data[(EYE_Y - 3) * m.w + x] = sk(-1);
    }
    for (let x = ex - w; x <= ex + w; x++) {
      if (hf(x, EYE_Y + 4, 13) > 0.35) m.data[(EYE_Y + 4) * m.w + x] = sk(-1);
    }

    // The white is a sliver at the corners, not the subject. Iris 4 px, pupil
    // 2 px, one pixel of catchlight on the upper left — at this size that is an
    // eye; a bigger white turns the face into a cartoon.
    ellipse(m, cx, EYE_Y + 0.5, w + 0.2, 2.2, sclera);
    ellipse(m, cx, EYE_Y + 0.5, 2.0, 2.0, iris);
    rect(m, ex, EYE_Y - 1, 2, 2, pupil);
    if (catEye) rect(m, ex, EYE_Y - 2, 1, 4, pupil);
    rect(m, ex - 1, EYE_Y - 1, 1, 1, glint);

    // The upper lid covers the top of the iris, so the eye is not a disc. Its
    // line drops at the corners, which is what makes it a lid and not a slot.
    for (let x = ex - w - 1; x <= ex + w + 1; x++) {
      const t = (x - cx) / (w + 1);
      const y = EYE_Y - 2 + (Math.abs(t) > 0.55 ? 1 : 0);
      m.data[y * m.w + x] = sk(-4);
      if (x < ex && hf(x, y, 9) > 0.4) m.data[(y - 1) * m.w + x] = sk(-2); // lash shadow
    }
    // The lower lid is one tone lighter than the upper: light comes from above.
    for (let x = ex - w; x <= ex + w; x++) {
      const t = (x - cx) / w;
      const y = EYE_Y + 3 - (Math.abs(t) > 0.72 ? 1 : 0);
      m.data[y * m.w + x] = sk(-2);
    }
    rect(m, ex - w - 1, EYE_Y + 1, 1, 1, sk(-5)); // inner corner
    rect(m, ex + w + 1, EYE_Y, 1, 1, sk(-5)); // outer corner

    // A crease above the lid, not another outline.
    for (let x = ex - w; x <= ex + w; x++) {
      if (hf(x, 19, 11) > 0.5) m.data[(EYE_Y - 4) * m.w + x] = sk(-2);
    }
  }

  // Brows: thicker at the inner end and angled down toward the nose — the
  // whole read of a stern face at this size. Two tones, the lower one darker,
  // so they sit on the brow ridge instead of being painted on the forehead.
  for (const side of [-1, 1] as const) {
    const outer = CX + side * 21;
    for (let i = 0; i <= 13; i++) {
      const x = outer - side * i;
      const t = i / 13;
      const top = BROW + Math.round(t * 2.5) - Math.round(Math.sin(t * Math.PI));
      const thick = i > 10 ? 4 : 3;
      m.data[top * m.w + x] = hairAt(spec, side < 0 ? 2 : 0);
      for (let k = 1; k < thick; k++) m.data[(top + k) * m.w + x] = hairAt(spec, side < 0 ? -1 : -3);
      if (hf(x, top, 13) > 0.35) m.data[(top - 1) * m.w + x] = sk(-1);
      if (hf(x, top, 31) > 0.6) m.data[(top + thick) * m.w + x] = sk(-2);
    }
  }
}

function drawNose(m: PartMask, spec: CharacterSpec) {
  const shape = RACE_SHAPE[spec.race];
  if (shape === 'khajiit' || shape === 'argonian') return; // the race draws a snout

  const sk = (n: number) => skinAt(spec, n);

  // The bridge is a narrow wedge of two planes, three pixels wide between the
  // brows and five at the tip. A wide, evenly lit bar is what read as a plank.
  for (let y = BROW + 3; y <= NOSE_TIP - 6; y++) {
    const t = (y - (BROW + 3)) / (NOSE_TIP - BROW - 9);
    const half = t < 0.55 ? 2 : 3;
    for (let x = CX - half; x <= CX + half; x++) {
      // Three planes, five steps apart: a bridge that is one step from the
      // cheek is not a bridge, it is a smudge.
      const tone = x <= CX - 2 ? sk(3) : x >= CX + 2 ? sk(-2) : sk(1);
      m.data[y * m.w + x] = tone;
    }
  }

  // The tip: a bulb with a lit top, a dark underside and two slot nostrils.
  // Eleven pixels across at the widest, against a forty-nine-pixel face.
  softEllipse(m, CX + 0.5, NOSE_TIP - 2, 4.8, 2.6, sk(1), sk(0));
  rect(m, CX - 3, NOSE_TIP - 4, 6, 1, sk(2));
  rect(m, CX - 5, NOSE_TIP - 1, 1, 2, sk(-2)); // wings
  rect(m, CX + 5, NOSE_TIP - 1, 1, 2, sk(-2));
  rect(m, CX - 5, NOSE_TIP + 1, 1, 1, sk(-1));
  rect(m, CX + 5, NOSE_TIP + 1, 1, 1, sk(-1));
  rect(m, CX - 2, NOSE_TIP, 2, 1, sk(-5)); // nostril slots
  rect(m, CX + 2, NOSE_TIP, 2, 1, sk(-5));
  rect(m, CX, NOSE_TIP + 1, 1, 1, sk(-4)); // septum

  // What the nose casts on the philtrum, dithered so it is a shadow and not a
  // second moustache.
  for (let x = CX - 3; x <= CX + 3; x++) {
    m.data[(NOSE_TIP + 2) * m.w + x] = sk(-3);
    if (hf(x, NOSE_TIP, 37) > 0.45) m.data[(NOSE_TIP + 3) * m.w + x] = sk(-2);
  }
  rect(m, CX, NOSE_TIP + 4, 1, 2, sk(-2)); // philtrum
}

function drawMouth(m: PartMask, spec: CharacterSpec) {
  const sk = (n: number) => skinAt(spec, n);

  // A mouth is a slot with two lips around it. The line has a slight bow and
  // the corners sit one pixel lower; the lower lip catches the light while the
  // crease beneath it is dark. Thirteen pixels wide: a mouth that touches the
  // jaw is a cartoon, one that is too small vanishes beside a beard.
  for (let x = CX - 6; x <= CX + 6; x++) {
    const t = Math.abs(x - CX) / 6;
    const y = MOUTH + (t > 0.75 ? 1 : 0);
    m.data[y * m.w + x] = sk(-5);
  }
  for (let x = CX - 5; x <= CX + 5; x++) m.data[(MOUTH - 1) * m.w + x] = sk(-2); // upper lip
  for (let x = CX - 4; x <= CX + 4; x++) {
    m.data[(MOUTH + 1) * m.w + x] = sk(2);
    if (Math.abs(x - CX) < 3) m.data[(MOUTH + 2) * m.w + x] = sk(3);
  }
  for (let x = CX - 5; x <= CX + 5; x++) m.data[(MOUTH + 3) * m.w + x] = sk(-3); // crease
  rect(m, CX - 7, MOUTH + 1, 1, 1, sk(-5)); // corners
  rect(m, CX + 7, MOUTH + 1, 1, 1, sk(-5));
  rect(m, CX - 2, MOUTH - 2, 1, 1, sk(-2)); // the bow of the upper lip
  rect(m, CX + 2, MOUTH - 2, 1, 1, sk(-2));
}

/** Shift a packed part one step along its own ramp. */
const shade = (part: number, d: number) => {
  const mat = part >> 4;
  return (mat << 4) | clamp((part & 15) + d, 0, RAMP_LEN[mat] - 1);
};

function drawBeard(m: PartMask, spec: CharacterSpec) {
  if (spec.beard === 'none' || !showsHair(spec)) return;
  const lit = hairAt(spec, 2);
  const mid = hairAt(spec, 0);
  const dark = hairAt(spec, -2);
  const hairMat = mid >> 4;
  const length = spec.beard === 'long' ? 10 : spec.beard === 'full' ? 6 : 2;
  const endY = CHIN + length;
  const cells = new Uint8Array(m.w * m.h);

  // The beard is clipped to the jaw row by row. The previous version filled a
  // fixed twenty-one-pixel column, so at the mouth — where the face is only
  // twenty pixels wide — it floated two centimetres off each cheek and read as
  // a helmet strap. Its width has to follow the bone, with a little volume.
  for (let y = 54; y <= endY; y++) {
    let outer: number;
    if (y <= CHIN) {
      outer = Math.ceil(faceHalf(y)) + 2 + Math.round((y - 68) * 0.1);
    } else {
      outer = Math.max(4, 14 - Math.round((y - CHIN) * 0.8));
    }
    for (let x = CX - outer; x <= CX + outer; x++) {
      if (y < beardTopAt(x)) continue;
      const edge = outer - Math.abs(x - CX);
      let tone = x < CX - 6 ? lit : x > CX + 8 ? dark : mid;
      if (edge <= 1) tone = dark;
      if (y > CHIN - 2) tone = dark;
      if (y < 66) tone = mid; // the sideburn is flatter than the jaw
      if (spec.beard === 'stubble' && hf(x * 3, y * 5, 4) < 0.62) continue;
      m.data[y * m.w + x] = tone;
      cells[y * m.w + x] = 1;
    }
  }

  // A clean top edge with a few stray hairs, not a row of noise. The beard has
  // to grow out of the cheek, so the line is dark and the strays are mid.
  for (let x = CX - 24; x <= CX + 24; x++) {
    const top = beardTopAt(x);
    if (Math.abs(x - CX) < 4) continue;
    const i = top * m.w + x;
    if (cells[i]) m.data[i] = dark;
    if (hf(x, top, 29) > 0.78) {
      m.data[(top - 1) * m.w + x] = mid;
      cells[(top - 1) * m.w + x] = 1;
    }
  }

  // Broad locks, the same trick as the hair: a dark groove with a lit edge,
  // running outward as they fall. Five of them, never one per pixel.
  for (let i = 0; i < 5; i++) {
    const x0 = CX - 19 + i * 8;
    const top = beardTopAt(x0) + 2;
    const dir = x0 < CX ? -1 : 1;
    for (let y = top; y <= endY - 2; y++) {
      const xx = x0 + Math.floor((y - top) / 8) * dir;
      const j = y * m.w + xx;
      if (!cells[j] || (m.data[j] >> 4) !== hairMat) continue;
      m.data[j] = shade(m.data[j], -1);
      const k = j - dir;
      if (cells[k] && (m.data[k] >> 4) === hairMat) m.data[k] = shade(m.data[k], 1);
    }
  }

  // The moustache: two wings over the upper lip, thick enough to read, with a
  // gap at the philtrum and ends that turn down into the beard.
  if (spec.beard !== 'stubble') {
    for (let x = CX - 10; x <= CX + 10; x++) {
      const d = Math.abs(x - CX) / 10;
      if (d < 0.18) continue; // the philtrum gap
      const y = MOUTH - 5 + Math.round(d * 2.6);
      m.data[y * m.w + x] = x < CX ? lit : mid;
      m.data[(y + 1) * m.w + x] = x < CX ? mid : dark;
      if (d > 0.25) m.data[(y + 2) * m.w + x] = dark;
      if (d > 0.8) m.data[(y + 3) * m.w + x] = dark;
    }
  } else {
    for (let x = CX - 10; x <= CX + 10; x++) {
      if (hf(x, 77, 9) > 0.45) m.data[77 * m.w + x] = mid;
      if (hf(x, 78, 11) > 0.6) m.data[78 * m.w + x] = dark;
    }
  }

  drawMouth(m, spec);
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
