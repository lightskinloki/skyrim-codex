import { clamp, hf } from '../rng';

/**
 * Textures for the 3D board — ramp indices, not colours.
 * See docs/BATTLEMAP-SPEC.md §17.
 *
 * A texel is a *ramp step*, exactly like a pixel was in the old flat renderer.
 * The 3D pass samples a step, adds the light in steps, and looks the result up
 * in the palette. That is why the scene stays inside the same 61 colours no
 * matter how many faces it has: geometry changed, the colour model did not.
 *
 * Tiling is the whole point of doing this in texture space. A wall's `u` is
 * world distance along the wall, so a 64 px texture with eight-pixel bricks
 * continues across cell boundaries; a per-cell sprite could only ever repeat.
 * Everything below is authored to tile on its own period.
 */

export type Tex = {
  w: number;
  h: number;
  idx: Uint8Array;
  /** Power-of-two wrap masks, or -1 for an odd size (the rug). */
  mx: number;
  my: number;
};

/** Nearest texel, wrapping in both axes. Negative uv is legal. */
export const sampleIdx = (t: Tex, u: number, v: number): number => {
  let x = u | 0;
  let y = v | 0;
  x %= t.w;
  if (x < 0) x += t.w;
  y %= t.h;
  if (y < 0) y += t.h;
  return t.idx[y * t.w + x];
};

const field = (w: number, h: number, v: number): Tex => ({
  w,
  h,
  idx: new Uint8Array(w * h).fill(v),
  mx: (w & (w - 1)) === 0 ? w - 1 : -1,
  my: (h & (h - 1)) === 0 ? h - 1 : -1,
});

/* ------------------------------------------------------------------ floor */
/**
 * One flagstone. The seam is on the north and west edge only, so two adjacent
 * cells meet along exactly one dark line rather than a double border. Three
 * variants are enough: the per-cell hash picks one, and the room-scale wash is
 * added as light in the vertex pass, not baked in here.
 */
export function floorTexture(seed: number, variant: number, cut: 'none' | 'h' | 'v' = 'none'): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 4 + variant;
      if (x === 0 || y === 0) s = 3;
      else {
        const n = hf(seed ^ 0x51ed, x, y);
        if (n > 0.978) s -= 1;
        else if (n < 0.008) s += 1;
        // A chipped arris, one pixel wide, at the odd cell corner.
        if ((x === 1 && y < 3) || (y === 1 && x < 3)) s = 3;
      }
      if (cut === 'h' && y === 16) s = 3;
      if (cut === 'v' && x === 16) s = 3;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }

  // One variant carries a crack. It reaches the cell edge, so cracks appear to
  // continue into the neighbouring stone when two of them land together.
  if (variant === 1) {
    let x = 11;
    let y = 0;
    for (let n = 0; n < 22; n++) {
      if (x < 0 || y < 0 || x >= w || y >= h) break;
      t.idx[y * w + x] = 2;
      if (n % 3 === 0) x += 1;
      else if (n % 5 === 0) x -= 1;
      y += 1;
    }
  }

  return t;
}

/* ------------------------------------------------------------------- wall */
/**
 * A masonry face, 64 px wide and 32 tall. `v` is measured from the top of the
 * wall, so row 0 is the coping and the courses hang below it regardless of how
 * tall the block is. `u` is world distance, so the bond runs through cells.
 *
 * Bricks are eight wide with a four-pixel half-bond: both divide 64, which is
 * what makes the wrap invisible.
 */
export function wallFaceTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 5;
      if (y === 0) s = 8;
      else if (y === 1) s = 6;
      else if (y === 2) s = 2;
      else {
        const band = y - 3;
        const course = Math.floor(band / 6);
        const jointH = band % 6 === 5;
        const jointV = ((x + (course & 1) * 4) & 7) === 0;
        if (jointH || jointV) s = 3;
        else {
          if (band % 6 === 0) s = 6;
          else if (hf(seed ^ 0x6a1d, x, y) > 0.955) s = 7;
          else if (hf(seed ^ 0x6a1d, x + 7, y + 3) < 0.02) s = 4;
        }
      }
      if (y >= h - 3) s = Math.max(1, s - 1);
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/**
 * Cavern wall: strata, not courses. The same 64 px wrap as the masonry, but the
 * horizontal lines are broken by a slow sine and the joints wander, so a cave
 * wall reads as rock rather than as a brick wall that has been stretched.
 *
 * It tiles because the sine's period is the tile width and the strata period
 * divides the tile height.
 */
export function rockFaceTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const off = Math.round(Math.sin((x / w) * Math.PI * 2) * 2.4 + Math.sin((x / w) * Math.PI * 4 + 1.1) * 1.2);
      const yy = (((y + off) % h) + h) % h;
      const band = Math.floor(yy / 8);
      const inBand = yy % 8;
      let s = 4 + (band % 3);
      if (inBand === 0) s = 3;
      else if (inBand === 1) s = Math.min(9, s + 1);
      else if (inBand === 7) s = Math.max(1, s - 1);
      const n = hf(seed ^ 0x2f7d, x, y);
      if (n > 0.9) s += 1;
      else if (n < 0.09) s -= 1;
      // A fault: a wandering crack, one texel wide, that crosses the strata.
      const fault = Math.round(Math.sin((y / h) * Math.PI * 6 + 0.7) * 5 + 11);
      if ((x + 32 + fault) % 37 === 0 && n > 0.35) s = 1;
      t.idx[y * w + x] = clamp(s, 0, 11);
    }
  }
  return t;
}

/**
 * A ledge top. No joints: a shelf is one piece of rock, and a tile seam every
 * cell would make a cave ledge look like a pavement. The strata run across it
 * in one-cell bands, and the flecks are sparse, so the surface reads as stone
 * without ever reading as masonry.
 */
export function ledgeTexture(seed: number): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Blotches first, then a speckle. Stripes here read as planks, which is
      // exactly the wrong answer for a stone shelf.
      let s = 4;
      const blob = hf(seed ^ 0x6c21, x >> 2, y >> 2);
      if (blob > 0.76) s = 5;
      else if (blob < 0.24) s = 3;
      const n = hf(seed ^ 0x2b93, x, y);
      if (n > 0.96) s += 1;
      else if (n < 0.04) s -= 1;
      // A few cracks, aligned to the same lattice so two cells continue one.
      if (hf(seed ^ 0x77c5, x >> 4, y) > 0.985 && n > 0.3) s -= 1;
      t.idx[y * w + x] = clamp(s, 1, 9);
    }
  }
  return t;
}

/** The top of a cavern wall: the rock mass above the chamber, seen from above.
 *  Dark and broken, because a lit coping slab around a cave turns the roof into
 *  a bright picture frame and the pit into a stage. */
export function rockTopTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 2;
      const n = hf(seed ^ 0x8e11, x, y);
      if (n > 0.82) s = 3;
      else if (n < 0.15) s = 1;
      if (hf(seed ^ 0x5d77, x >> 2, y >> 2) > 0.93) s = 1;
      if (hf(seed ^ 0x1c4b, x, y) > 0.992) s = 4;
      t.idx[y * w + x] = clamp(s, 0, 8);
    }
  }
  return t;
}

/** The cap, seen from above: big coping slabs, because a 4 px course on a
 *  32 px cell is a stipple, not masonry. Two slabs to the cell, running bond. */
export function wallTopTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    const course = y >> 3;
    const stagger = (course & 1) * 8;
    for (let x = 0; x < w; x++) {
      const bx = (x + stagger) & 15;
      const by = y & 7;
      const slab = hf(seed ^ 0x3c1f, (x + stagger) >> 4, y >> 3);
      const base = slab > 0.66 ? 5 : slab > 0.33 ? 4 : 6;
      let s = base;
      if (by === 7 || bx === 15) s = 1;
      else if (by === 6) s = base - 2;
      else if (by === 0) s = base + 2;
      else if (bx === 0) s = base + 1;
      else if (bx === 14) s = base - 1;
      else if (hf(seed ^ 0x7b11, x >> 2, y >> 1) > 0.94) s = base + 1;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/* -------------------------------------------------------------- materials */
/** Oak: eight-pixel boards, grain streaks, a dark joint and a lit arris. */
export function woodTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const bx = x & 7;
      let s = 7;
      if (bx === 7) s = 4;
      else if (bx === 0) s = 8;
      else {
        const grain = hf(seed ^ 0x1a2b, x, y >> 2);
        if (grain > 0.94) s = 8;
        else if (grain < 0.035) s = 6;
        if (hf(seed ^ 0x77c1, x >> 1, y) > 0.985) s = 9;
      }
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Rough stone for columns and rubble: mottled, with a few chisel scars. */
export function stoneTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 6;
      const n = hf(seed ^ 0x2f7d, x, y);
      if (n > 0.82) s = 7;
      else if (n < 0.16) s = 5;
      if (hf(seed ^ 0x9c31, x, y) > 0.993) s = 8;
      if (hf(seed ^ 0x44ab, x, y) < 0.006) s = 4;
      // Fluting: vertical channels, so a round column still reads as carved.
      if (x % 9 === 0) s = 4;
      else if (x % 9 === 1) s = 8;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Steel: brushed bands, with the rivet pattern a brazier and a chest share. */
export function metalTexture(seed: number): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 5;
      if (y % 4 === 0) s = 6;
      else if (hf(seed ^ 0x5d19, x, y) > 0.93) s = 6;
      if (x % 8 === 4 && y % 8 === 4) {
        s = 10;
      } else if (x % 8 === 3 && y % 8 === 4) {
        s = 7;
      }
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Woven cloth: a two-pixel tabby, so a big field does not read as flat. */
export function clothTexture(seed: number, navy: boolean): Tex {
  const w = 32;
  const h = 32;
  const t = field(w, h, navy ? 4 : 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const weave = (((x >> 1) + (y >> 1)) & 1) === 0 ? 0 : 1;
      const n = hf(seed ^ 0x6b2f, x, y) > 0.95 ? 1 : 0;
      t.idx[y * w + x] = clamp((navy ? 4 : 5) + weave + n, 0, 12);
    }
  }
  return t;
}

/**
 * A rug sized to its own footprint, because a border is a frame: stretching a
 * tile would put it in the middle of the cloth. One dark edge, one band of
 * pattern, a field of weave. No wrapping — the quad's uv spans it exactly.
 */
/** The smallest power of two at least `n`. */
const pow2 = (n: number): number => {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
};

export function rugTexture(cellsX: number, cellsY: number, navy: boolean): Tex {
  const w = Math.max(8, Math.round(cellsX * 32));
  const h = Math.max(8, Math.round(cellsY * 32));
  const base = navy ? 3 : 4;
  // Padded to a power of two so every texture in the renderer can be sampled
  // with a bitmask. The quad's uv only ever reaches w and h, so the padding is
  // never seen; it exists to keep the inner loop branch-free.
  const t = field(pow2(w), pow2(h), base);
  const tw = t.w;
  const border = 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x < border || y < border || x >= w - border || y >= h - border;
      if (edge) {
        t.idx[y * tw + x] = 2;
        continue;
      }
      const inset = x < border + 3 || y < border + 3 || x >= w - border - 3 || y >= h - border - 3;
      if (inset) {
        t.idx[y * tw + x] = 6;
        continue;
      }
      const weave = (((x >> 1) + (y >> 1)) & 1) === 0 ? 0 : 1;
      let s = base + 1 + weave;
      // A lattice of lozenges, the way a woven rug carries pattern without text.
      const lx = Math.abs(((x / 9) % 2) - 1);
      const ly = Math.abs(((y / 9) % 2) - 1);
      if (lx + ly > 1.55) s += 1;
      if (hf(0x1f2e, x, y) > 0.985) s += 1;
      t.idx[y * tw + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/* ---------------------------------------------------------------- sprites */
/**
 * A token body, and the only sprite left in the scene.
 *
 * Fire used to live here as a 24 x 32 animated flame, and the contact shadow as
 * a stamped ellipse. Both are geometry now — `gl/flame.ts` and the floor-plane
 * shadow in `gl/render.ts` — because a card has a position but no body, and an
 * orbit can always be made to disagree with it. A character is the one thing
 * that *should* turn to face the camera: it has an authored facing, and a card
 * is how four facings become one draw.
 */
export type Sprite = {
  w: number;
  h: number;
  /** Packed RGBA; alpha 0 is transparent. */
  rgba: Uint32Array;
};

/* ---------------------------------------------------------------- village */
/**
 * Ivarstead's surfaces. Everything here is authored on the same 64 px period as
 * the masonry, so a village square does not reveal a smaller tile than the inn
 * floor does.
 */

/** Grass: a mottled field with tufts, not a green noise. The tufts are short
 *  vertical strokes, which is the one shape a field has at 32 px/cell. */
export function grassTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 5;
      const broad = hf(seed ^ 0x1c2d, x >> 2, y >> 2);
      if (broad > 0.72) s = 6;
      else if (broad < 0.24) s = 4;
      const fine = hf(seed ^ 0x77a1, x, y);
      if (fine > 0.9) s = 6;
      else if (fine < 0.1) s = 4;
      // A tuft: three pixels reaching up from a lit base.
      if (fine > 0.965) {
        s = 7;
        if (y > 0 && hf(seed ^ 0x33b9, x, y - 1) > 0.4) t.idx[(y - 1) * w + x] = 7;
      }
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** A trodden path: packed earth, small stones, and a wheel rut every so often. */
export function dirtTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 6;
      const n = hf(seed ^ 0x4a17, x, y);
      if (n > 0.86) s = 7;
      else if (n < 0.14) s = 5;
      // Pebbles sit proud of the mud and catch the sun.
      if (hf(seed ^ 0x6d2b, x >> 1, y >> 1) > 0.982) s = 8;
      if (hf(seed ^ 0x2e9f, x, y) < 0.012) s = 3;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Water: long horizontal ripples, with the light caught on the crests. */
export function waterTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 7);
  for (let y = 0; y < h; y++) {
    const band = Math.sin(y * 0.28) * 0.5 + 0.5;
    for (let x = 0; x < w; x++) {
      let s = 6 + Math.round(band * 2);
      const ripple = hf(seed ^ 0x5b13, x >> 1, y);
      if (ripple > 0.9) s += 1;
      else if (ripple < 0.08) s -= 1;
      // A crest is a short dash, one or two pixels, never a full line.
      if (hf(seed ^ 0x8c41, x >> 2, y) > 0.955) s = 10;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** Limewash: almost flat, with the fine tooth of a brush and a hairline crack. */
export function plasterTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 8);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 8;
      const n = hf(seed ^ 0x3b57, x, y);
      if (n > 0.72) s = 9;
      else if (n < 0.28) s = 7;
      if (hf(seed ^ 0x6e21, x >> 1, y >> 1) > 0.965) s = 10;
      // Damp creeping up from the sill: a band of green-grey, two steps down.
      if (y > 52 && hf(seed ^ 0x1f8d, x, y) > 0.35) s -= 1;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  // One crack, wandering from the top edge. It reaches the tile edge so two
  // plaster faces can share a fracture.
  let cx = 7;
  for (let y = 0; y < h; y++) {
    t.idx[y * w + (cx & 63)] = 4;
    if (hf(seed ^ 0x9a11, y, 3) > 0.72) cx += 1;
    else if (hf(seed ^ 0x9a11, y, 9) > 0.82) cx -= 1;
  }
  return t;
}

/** Thatch: straw laid in diagonal courses, with a dark seam where each course
 *  is pegged down. The diagonal is what stops it reading as wooden shingles. */
export function thatchTexture(seed: number): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, 7);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 7;
      const course = (y + x) % 11;
      if (course === 0) s = 4;
      else if (course < 3) s = 6;
      else if (course > 8) s = 8;
      if (hf(seed ^ 0x2bb1, x, y) > 0.9) s += 1;
      else if (hf(seed ^ 0x2bb1, x, y) < 0.07) s -= 1;
      // A few loose straws catch the light past the eave.
      if (hf(seed ^ 0x7c3d, x >> 1, y) > 0.985) s = 10;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}

/** A canopy: clumped leaves with real holes between them, lit from one side.
 *  `autumn` swaps the ramp's material at the call site, not the pattern. */
export function leafTexture(seed: number, autumn: boolean): Tex {
  const w = 64;
  const h = 64;
  const t = field(w, h, autumn ? 8 : 6);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = autumn ? 8 : 6;
      const clump = hf(seed ^ 0x51c7, x >> 2, y >> 2);
      if (clump > 0.62) s += 1;
      else if (clump < 0.38) s -= 2;
      const leaf = hf(seed ^ 0x73a9, x, y);
      if (leaf > 0.9) s += 2;
      else if (leaf < 0.1) s -= 2;
      // Gaps, so a canopy is not a solid green ball.
      if (hf(seed ^ 0x1d4f, x >> 1, y >> 1) < 0.045) s = 2;
      t.idx[y * w + x] = clamp(s, 0, 12);
    }
  }
  return t;
}
