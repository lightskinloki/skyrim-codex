import { COLOUR_OF, M_METAL, RAMP_LEN, Surface } from '@/battlemap/surface';
import { CELL } from '@/battlemap/paint';
import { clamp } from '@/battlemap/rng';
import type { Facing } from '@/battlemap/room';
import {
  BUILD_WIDTH,
  CLOTH_MATERIAL,
  hairAt,
  hasHair,
  skinAt,
  type CharacterSpec,
} from './spec';
import { EMPTY, INK, P, ellipse, partMask, rect, type PartMask } from './partmask';
import { drawBodyRaceBehind, drawBodyRaceFace } from './race';

/**
 * The body: 24 × 40 in a 32 px cell, four facings, built from the same spec the
 * bust reads. See docs/PIXEL-ART-SPEC.md §3 (C0–C4).
 *
 * A mask cell is a packed part — (material << 4) | ramp step — the same packing
 * the surface uses, so a face can be skin and a tunic cloth inside one
 * silhouette. It is 16-bit rather than 8-bit because that packing has outgrown a
 * byte: material 15 with step 15 is 255, which would collide with the sentinel
 * and silently punch a hole in a brown-haired character.
 *
 * Everything is authored relative to three bands — `SKIN_BASE[tone] + n`,
 * `hair + n`, `cloth + n` — so a pale nord and a deep-toned redguard shade with
 * the same arithmetic.
 */

export const BODY_W = 24;
export const BODY_H = 40;

const clothAt = (mat: number, n: number) => P(mat, clamp(6 + n, 0, RAMP_LEN[mat] - 1));

/* --------------------------------------------------------------- garments */

function drawTorso(m: PartMask, spec: CharacterSpec, w: number, facing: Facing) {
  const g = spec.garment;
  const mat = CLOTH_MATERIAL[g.torsoCloth];
  const half = 5 + w;
  const cx = BODY_W / 2;

  const shoulderPart =
    g.torso === 'plate' ? clothAt(M_METAL, 2) : g.torso === 'tank' ? skinAt(spec, 0) : clothAt(mat, 1);
  rect(m, Math.round(cx - half - 1), 14, half * 2 + 2, 3, shoulderPart);

  const bodyPart = g.torso === 'plate' ? clothAt(M_METAL, 0) : clothAt(mat, 0);
  rect(m, Math.round(cx - half), 17, half * 2, 8, bodyPart);
  rect(m, Math.round(cx - half + 1), 25, half * 2 - 2, 2, clothAt(mat, -1));

  // The lit side of the torso is the only part that changes with facing.
  const litSide = facing === 3 ? 1 : facing === 2 ? -1 : 0;
  if (litSide > 0) rect(m, Math.round(cx + half - 2), 17, 2, 9, clothAt(mat, 1));
  else if (litSide < 0) rect(m, Math.round(cx - half), 17, 2, 9, clothAt(mat, 1));

  if (g.torso === 'tank') {
    rect(m, Math.round(cx - half - 2), 17, 2, 8, skinAt(spec, 0));
    rect(m, Math.round(cx + half), 17, 2, 8, skinAt(spec, 0));
    rect(m, Math.round(cx - half - 2), 25, 2, 3, skinAt(spec, -1));
    rect(m, Math.round(cx + half), 25, 2, 3, skinAt(spec, -1));
  } else {
    const sleeve = g.torso === 'plate' ? clothAt(M_METAL, 1) : clothAt(mat, 0);
    rect(m, Math.round(cx - half - 2), 17, 2, 9, sleeve);
    rect(m, Math.round(cx + half), 17, 2, 9, sleeve);
  }

  if (g.torso === 'vest') rect(m, Math.round(cx - 2), 15, 4, 4, clothAt(CLOTH_MATERIAL.leather, 3));
  if (g.torso === 'plate') {
    rect(m, Math.round(cx - half - 1), 13, half * 2 + 2, 2, clothAt(M_METAL, 2));
    rect(m, Math.round(cx - 1), 18, 2, 7, clothAt(M_METAL, -2));
  }
  if (g.torso === 'tunic') rect(m, Math.round(cx - 1), 17, 2, 8, clothAt(mat, -2));
}

function drawLegs(m: PartMask, spec: CharacterSpec, w: number) {
  const g = spec.garment;
  const cx = BODY_W / 2;
  const mat = CLOTH_MATERIAL[g.legsCloth];

  if (g.legs === 'skirt') {
    for (let y = 24; y < 37; y++) {
      const spread = 4 + Math.floor((y - 24) / 3) + w;
      rect(m, Math.round(cx - spread), y, spread * 2, 1, clothAt(mat, y > 30 ? -1 : 0));
    }
    rect(m, Math.round(cx - 1), 30, 2, 6, clothAt(mat, 2));
    rect(m, Math.round(cx - 3), 37, 6, 2, P(CLOTH_MATERIAL.leather, 2));
    return;
  }

  const legMat = g.legs === 'greaves' ? M_METAL : mat;
  const legPart = clothAt(legMat, 0);
  const bootPart = P(CLOTH_MATERIAL.leather, 2);
  rect(m, Math.round(cx - w - 3), 26, 3, 8, legPart);
  rect(m, Math.round(cx + w + 1), 26, 3, 8, legPart);
  rect(m, Math.round(cx - w - 3), 34, 4, 4, bootPart);
  rect(m, Math.round(cx + w + 1), 34, 4, 4, bootPart);
  rect(m, Math.round(cx - w - 3), 33, 4, 1, clothAt(legMat, -2));
  rect(m, Math.round(cx + w + 1), 33, 4, 1, clothAt(legMat, -2));
}

/* ------------------------------------------------------------------- head */

function drawHead(m: PartMask, spec: CharacterSpec, facing: Facing) {
  const cx = BODY_W / 2;
  const skinMid = skinAt(spec, 0);
  const skinLit = skinAt(spec, 1);
  const skinDark = skinAt(spec, -1);

  if (hasHair(spec) && spec.hairStyle !== 'bald') {
    ellipse(m, cx, 8, 7, 7.5, hairAt(spec, 0));
    if (spec.hairStyle === 'long' || spec.hairStyle === 'braid') {
      rect(m, Math.round(cx - 7), 8, 14, 9, hairAt(spec, -1));
      if (spec.hairStyle === 'braid') rect(m, Math.round(cx + 1), 14, 2, 8, hairAt(spec, 0));
    }
  }

  ellipse(m, cx, 8.5, 5.4, 6, skinMid);
  rect(m, Math.round(cx - 2), 13, 4, 3, skinDark);

  if (facing === 1) {
    if (hasHair(spec) && spec.hairStyle !== 'bald') {
      ellipse(m, cx, 8.5, 5.6, 6.2, hairAt(spec, 0));
      rect(m, Math.round(cx - 5), 4, 3, 9, hairAt(spec, 1));
    }
    return;
  }

  if (facing === 0) {
    rect(m, Math.round(cx - 5), 5, 10, 2, skinLit);
    rect(m, Math.round(cx - 4), 9, 2, 1, skinDark);
    rect(m, Math.round(cx + 2), 9, 2, 1, skinDark);
    rect(m, Math.round(cx - 4), 10, 2, 2, INK);
    rect(m, Math.round(cx + 2), 10, 2, 2, INK);
    rect(m, Math.round(cx), 10, 1, 3, skinLit);
    rect(m, Math.round(cx - 1), 13, 3, 1, skinDark);
    rect(m, Math.round(cx - 5), 7, 1, 6, skinLit);
  } else {
    const dir = facing === 3 ? 1 : -1;
    const edge = Math.round(cx + dir * 4);
    rect(m, edge, 9, 2, 2, skinLit);
    rect(m, Math.round(cx + dir), 10, 2, 2, INK);
    rect(m, Math.round(cx - dir * 4), 9, 2, 3, skinDark);
  }

  if (spec.beard !== 'none') {
    const beardLit = hairAt(spec, 1);
    const beardMid = hairAt(spec, -1);
    // The beard starts *below* the eye line at y = 10 and grows down from there.
    // Anchored any higher it eats the eyes, and a face with no eyes reads as a
    // hood rather than a dwarf.
    const top = 11.6;
    const chin = spec.beard === 'long' ? 18 : 15;
    ellipse(m, cx, (top + chin) / 2, 5, (chin - top) / 2, beardMid);
    rect(m, Math.round(cx - 4), 12, 3, 2, beardLit);
    if (spec.beard === 'stubble') {
      for (let x = 0; x < 8; x++) rect(m, Math.round(cx - 4 + x), 12 + (x % 2), 1, 1, beardMid);
    } else {
      rect(m, Math.round(cx - 1), 13, 3, 1, skinDark);
    }
  }

  if (hasHair(spec) && spec.hairStyle !== 'bald') {
    rect(m, Math.round(cx - 5), 3, 10, 3, hairAt(spec, 1));
    rect(m, Math.round(cx - 5), 3, 3, 2, hairAt(spec, 2));
  }
}

/* ----------------------------------------------------------------- weapon */

function drawWeapon(m: PartMask, spec: CharacterSpec, facing: Facing) {
  const cx = BODY_W / 2;
  if (spec.weapon === 'hammer') {
    rect(m, Math.round(cx + 8), 12, 2, 18, P(CLOTH_MATERIAL.leather, 3));
    rect(m, Math.round(cx + 7), 9, 4, 4, clothAt(M_METAL, 2));
    rect(m, Math.round(cx + 8), 8, 2, 1, clothAt(M_METAL, 3));
  } else if (spec.weapon === 'sword') {
    const side = facing === 2 ? -1 : 1;
    rect(m, Math.round(cx + side * 8), 18, 1, 11, clothAt(M_METAL, 3));
    rect(m, Math.round(cx + side * 7), 26, 3, 1, clothAt(M_METAL, 1));
  } else if (spec.weapon === 'bow' && facing === 1) {
    ellipse(m, cx, 20, 8, 11, P(CLOTH_MATERIAL.leather, 3));
    ellipse(m, cx, 20, 6, 9, EMPTY);
  }
}

/* ------------------------------------------------------------------- draw */

const cache = new Map<string, PartMask>();

const keyOf = (spec: CharacterSpec, facing: Facing) =>
  [
    facing,
    spec.race,
    spec.build,
    spec.skinTone,
    spec.hair,
    spec.hairStyle,
    spec.beard,
    spec.garment.torso,
    spec.garment.torsoCloth,
    spec.garment.legs,
    spec.garment.legsCloth,
    spec.weapon,
  ].join('|');

function maskFor(spec: CharacterSpec, facing: Facing): PartMask {
  const k = keyOf(spec, facing);
  const hit = cache.get(k);
  if (hit) return hit;
  const m = partMask(BODY_W, BODY_H);
  const w = BUILD_WIDTH[spec.build];
  drawWeapon(m, spec, facing);
  drawLegs(m, spec, w);
  drawTorso(m, spec, w, facing);
  drawBodyRaceBehind(m, spec);
  drawHead(m, spec, facing);
  drawBodyRaceFace(m, spec, facing);
  cache.set(k, m);
  return m;
}

/** The silhouette, stamped with its outline. Shared by the board and by the
 *  character screen, so a token in play and a preview card cannot drift. */
type CanvasLike = { w: number; h: number; col: Uint32Array };

function paintMask(s: CanvasLike, m: PartMask, px: number, py: number, shift: number) {
  const partAt = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= m.w || y >= m.h ? EMPTY : m.data[y * m.w + x];

  for (let j = -1; j <= m.h; j++) {
    for (let i = -1; i <= m.w; i++) {
      const x = px + i;
      const y = py + j;
      if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
      const part = partAt(i, j);
      if (part !== EMPTY) {
        const mat = part >> 4;
        const idx = clamp((part & 15) + shift, 0, RAMP_LEN[mat] - 1);
        s.col[y * s.w + x] = COLOUR_OF[(mat << 4) + idx];
        continue;
      }
      if (
        partAt(i - 1, j) !== EMPTY ||
        partAt(i + 1, j) !== EMPTY ||
        partAt(i, j - 1) !== EMPTY ||
        partAt(i, j + 1) !== EMPTY
      ) {
        s.col[y * s.w + x] = COLOUR_OF[INK];
      }
    }
  }
}

/** A standalone sprite: the preview card's version of the same render. */
export function renderBody(spec: CharacterSpec, facing: Facing, shift = 0): CanvasLike {
  const s: CanvasLike = { w: BODY_W, h: BODY_H, col: new Uint32Array(BODY_W * BODY_H) };
  paintMask(s, maskFor(spec, facing), 0, 0, shift);
  return s;
}

export function drawBody(
  s: Surface,
  spec: CharacterSpec,
  at: [number, number],
  facing: Facing,
  shift: number,
  bobPhase: number,
  selected: boolean,
) {
  const cellX = Math.round(at[0]);
  const cellY = Math.round(at[1]);
  const bob = Math.sin(bobPhase) > 0.86 ? -1 : 0;
  const px = cellX * CELL + Math.floor((CELL - BODY_W) / 2);
  const py = cellY * CELL + CELL - BODY_H - 1 + bob;

  const shadow = COLOUR_OF[(2 << 4) + clamp(2 + shift, 0, RAMP_LEN[2] - 1)];
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 16; i++) {
      const dx = (i - 7.5) / 8;
      const dy = (j - 2) / 2.2;
      if (dx * dx + dy * dy > 1) continue;
      const x = px + 4 + i;
      const y = py + BODY_H - 3 + j;
      if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
      s.col[y * s.w + x] = shadow;
    }
  }

  paintMask(s, maskFor(spec, facing), px, py, shift);

  if (selected) {
    const sx = cellX * CELL + 11;
    const sy = cellY * CELL - 6;
    for (let i = 0; i < 9; i++) {
      const w = i < 4 ? i + 1 : 10 - i;
      for (let k = 0; k < w; k++) {
        const x = sx + i;
        const y = sy + k;
        if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
        s.col[y * s.w + x] = COLOUR_OF[(9 << 4) + 9];
      }
    }
  }
}
