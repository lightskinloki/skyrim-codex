import { M_HAIR_GREY } from '@/battlemap/surface';
import { P, ellipse, rect, spike, type PartMask } from './partmask';
import { hasHair, skinAt, type CharacterSpec, type Race } from './spec';

/**
 * What a race adds to a head. See docs/PIXEL-ART-SPEC.md §3 (C2).
 *
 * Races are attachments, not whole-body variants: the body sections are shared,
 * and a race contributes ears, a muzzle, tusks or a crest on top of them. That
 * is the difference between ten races costing ten heads and costing ten small
 * overlays — and it means a player's khajiit wears exactly the same cuirass as
 * their nord.
 *
 * Two scales, two functions: the bust is 128 px and the token is 24 × 40, and a
 * 3 px cat ear at one size is a single pixel at the other. Attachments are
 * authored per scale rather than scaled.
 */

export type RaceShape = 'human' | 'elf' | 'orc' | 'khajiit' | 'argonian';

export const RACE_SHAPE: Record<Race, RaceShape> = {
  nord: 'human',
  breton: 'human',
  imperial: 'human',
  redguard: 'human',
  'high-elf': 'elf',
  'wood-elf': 'elf',
  'dark-elf': 'elf',
  orc: 'orc',
  khajiit: 'khajiit',
  argonian: 'argonian',
};

/** One line on what the race contributes, shown under the race chips. */
export const RACE_NOTE: Record<Race, string> = {
  nord: 'Broad build, human head. No attachments.',
  breton: 'Human head, narrower jaw at the same build.',
  imperial: 'Human head. The baseline every attachment is measured against.',
  redguard: 'Human head, deeper skin band default.',
  'high-elf': 'Swept ears. The tallest ear of the three elven races.',
  'wood-elf': 'Short ears, angled back and out.',
  'dark-elf': 'Long ears held low, close to the skull.',
  orc: 'Heavy brow, wide jaw, two lower tusks.',
  khajiit: 'Muzzle and nose pad, tall triangular ears.',
  argonian: 'Snout, brow crest, no hair. Green, from the olive ramp.',
};

const BONE = P(M_HAIR_GREY, 12);
const BONE_SHADE = P(M_HAIR_GREY, 9);

/* ------------------------------------------------------------------- bust */

const BUST_CX = 63;

/**
 * Ears and crests, drawn after the head and before the hair cap: they sit on the
 * skull, and hair falls over their roots.
 */
export function drawBustRaceHead(m: PartMask, spec: CharacterSpec) {
  const shape = RACE_SHAPE[spec.race];
  const sk = (n: number) => skinAt(spec, n);

  if (shape === 'elf') {
    // A tapered wedge, built one column at a time so the tip is 1 px and the
    // root is thick — an ellipse here would read as a second ear lobe.
    const long = spec.race === 'dark-elf' ? 15 : spec.race === 'high-elf' ? 16 : 11;
    const drop = spec.race === 'wood-elf' ? 0.8 : 1.5;
    for (let t = 0; t < long; t++) {
      const yTop = Math.round(58 - t * drop);
      const h = Math.max(1, Math.round(9 - t * (9 / long)));
      rect(m, BUST_CX - 26 - t, yTop, 1, h, t > long - 4 ? sk(-2) : sk(0));
      rect(m, BUST_CX + 25 + t, yTop, 1, h, t > long - 4 ? sk(-4) : sk(-2));
    }
    rect(m, BUST_CX - 28, 54, 1, 7, sk(-4)); // the fold at the root
    rect(m, BUST_CX + 27, 54, 1, 7, sk(-5));
  }

  if (shape === 'khajiit') {
    // Two triangles rooted where the cranium is still wide enough to hold them.
    spike(m, BUST_CX - 17, 31, 9, 16, sk(0));
    spike(m, BUST_CX - 16, 29, 4, 12, sk(-3));
    spike(m, BUST_CX + 14, 31, 9, 16, sk(-2));
    spike(m, BUST_CX + 14, 29, 4, 12, sk(-5));
    spike(m, BUST_CX - 18, 33, 5, 7, sk(1)); // the inner ear catching light
  }

  if (shape === 'argonian') {
    // A crest of spikes running back over the skull, tallest at the brow.
    for (let i = 0; i < 7; i++) {
      const h = i < 3 ? 9 - i : 5 + (i - 3);
      const x = BUST_CX - 24 + i * 7;
      const base = i < 4 ? 28 : 26;
      spike(m, x, base, 6, h, sk(-1));
      spike(m, x, base, 3, h - 2, i % 2 === 0 ? sk(1) : sk(-2));
    }
    rect(m, BUST_CX - 24, 27, 48, 2, sk(-3));
  }

  if (shape === 'orc') {
    rect(m, BUST_CX - 23, 41, 46, 2, sk(1)); // a heavier brow shelf than a human's
    rect(m, BUST_CX - 23, 43, 46, 4, sk(-4));
    ellipse(m, BUST_CX, 76, 22, 15, sk(-1)); // a jaw that overhangs the neck
    rect(m, BUST_CX - 20, 66, 5, 10, sk(-3));
    rect(m, BUST_CX + 15, 66, 5, 10, sk(-4));
  }
}

/**
 * The front of the face — a muzzle or tusks. Drawn *last*, over the beard,
 * because both sit in front of the jaw.
 */
export function drawBustRaceFace(m: PartMask, spec: CharacterSpec) {
  const shape = RACE_SHAPE[spec.race];

  if (shape === 'orc') {
    // Two lower tusks at the corners of the mouth, catching light on the left.
    for (const [x, lit] of [
      [BUST_CX - 11, true],
      [BUST_CX + 8, false],
    ] as const) {
      rect(m, x, 78, 4, 11, lit ? BONE : BONE_SHADE);
      rect(m, x + (lit ? 1 : 0), 78, 2, 8, lit ? P(M_HAIR_GREY, 13) : BONE);
      rect(m, x, 87, 4, 2, BONE_SHADE);
    }
    rect(m, BUST_CX - 3, 82, 6, 4, skinAt(spec, -5)); // the mouth between them
  }

  if (shape === 'khajiit') {
    // The muzzle covers the human nose entirely, and the pad is what makes it
    // read as a cat rather than as a bearded man with a wide chin. The pad is
    // small and high: a big dark shape at the mouth is a goatee, not a nose.
    ellipse(m, BUST_CX, 74, 14, 10, skinAt(spec, 1));
    ellipse(m, BUST_CX - 2, 70, 9, 6, skinAt(spec, 2));
    ellipse(m, BUST_CX + 6, 76, 6, 6, skinAt(spec, -1));
    spike(m, BUST_CX - 1, 74, 6, 4, skinAt(spec, -5)); // nose pad
    rect(m, BUST_CX - 5, 78, 3, 1, skinAt(spec, -4));
    rect(m, BUST_CX + 2, 78, 3, 1, skinAt(spec, -4));
  }

  if (shape === 'argonian') {
    // A snout: narrower than the khajiit's, all one plane, with slit nostrils.
    ellipse(m, BUST_CX, 71, 11, 12, skinAt(spec, 0));
    ellipse(m, BUST_CX - 2, 67, 7, 7, skinAt(spec, 2));
    rect(m, BUST_CX - 4, 69, 2, 3, skinAt(spec, -5));
    rect(m, BUST_CX + 3, 69, 2, 3, skinAt(spec, -5));
    rect(m, BUST_CX - 6, 76, 13, 1, skinAt(spec, -3));
    rect(m, BUST_CX - 1, 74, 2, 3, skinAt(spec, -3)); // the ridge down the snout
  }

  if (shape === 'khajiit' || shape === 'argonian') {
    // Whisker roots, three a side, one pixel each.
    for (let i = 0; i < 3; i++) {
      const y = 72 + i * 2;
      rect(m, BUST_CX - 14 + i, y, 1, 1, skinAt(spec, -4));
      rect(m, BUST_CX + 11 - i, y, 1, 1, skinAt(spec, -5));
    }
  }
}

/* ------------------------------------------------------------------- body */

const BODY_CX = 12;

/** Behind the token's head: ears that break the silhouette. */
export function drawBodyRaceBehind(m: PartMask, spec: CharacterSpec) {
  const shape = RACE_SHAPE[spec.race];
  const sk = (n: number) => skinAt(spec, n);

  if (shape === 'elf') {
    const long = spec.race === 'dark-elf' ? 3 : spec.race === 'high-elf' ? 4 : 2;
    for (let t = 0; t < long; t++) {
      rect(m, BODY_CX - 6 - t, 6 - t, 1, 2 + t, sk(-1));
      rect(m, BODY_CX + 5 + t, 6 - t, 1, 2 + t, sk(-3));
    }
  }

  if (shape === 'khajiit') {
    for (let t = 0; t < 4; t++) {
      rect(m, BODY_CX - 6 + Math.floor(t / 2), 5 - t, Math.max(1, 3 - t), 1, sk(t > 2 ? -2 : 0));
      rect(m, BODY_CX + 3 - Math.floor(t / 2), 5 - t, Math.max(1, 3 - t), 1, sk(t > 2 ? -3 : -1));
    }
  }

  if (shape === 'argonian') {
    for (let i = 0; i < 4; i++) {
      const h = 3 - Math.abs(i - 1);
      rect(m, BODY_CX - 5 + i * 3, 4 - h, 1, h, i < 2 ? sk(1) : sk(-1));
    }
  }

  if (shape === 'orc') rect(m, BODY_CX - 6, 6, 12, 1, sk(-3));
}

/** In front of the token's head: the muzzle or the tusks. */
export function drawBodyRaceFace(m: PartMask, spec: CharacterSpec, facing: 0 | 1 | 2 | 3) {
  if (facing === 1) return; // the back of a head has no face on it
  const shape = RACE_SHAPE[spec.race];

  if (shape === 'orc') {
    rect(m, BODY_CX - 3, 12, 1, 3, BONE);
    rect(m, BODY_CX + 2, 12, 1, 3, BONE_SHADE);
  }

  if (shape === 'khajiit') {
    ellipse(m, BODY_CX, 11, 4, 3, skinAt(spec, 1));
    rect(m, BODY_CX - 2, 10, 1, 1, skinAt(spec, -4));
    rect(m, BODY_CX + 1, 10, 1, 1, skinAt(spec, -4));
  }

  if (shape === 'argonian') {
    ellipse(m, BODY_CX, 11, 3, 2, skinAt(spec, 1));
    rect(m, BODY_CX - 1, 10, 2, 1, skinAt(spec, -4));
  }
}

/** The hair the head will actually draw: argonians have none. */
export const showsHair = (spec: CharacterSpec): boolean => hasHair(spec) && spec.hairStyle !== 'bald';
