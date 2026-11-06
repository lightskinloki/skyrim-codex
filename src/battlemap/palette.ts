/**
 * Six ramps, plus ink and void.
 * See docs/PIXEL-ART-SPEC.md §1–§2 (P2).
 *
 * Each ramp runs from a cold, near-black shadow at step 0 to a warm highlight
 * at the top. The hue drifts *along* the ramp rather than staying fixed, which
 * is what makes a lit surface read as lit rather than as a lighter swatch: the
 * shadow side of the room falls toward violet and the sunlit side toward sand.
 * It is also why one ramp can carry a whole mood without a second palette.
 *
 * Colours are packed as little-endian RGBA, which is what ImageData expects:
 *   0xAABBGGRR
 */

export type RampId =
  | 'stone' // cold violet-grey: floors, walls, stairs, most furniture
  | 'wood'  // warm brown: floors, walls, tables, chests
  | 'wool'  // cloth red: rugs, beds, banners
  | 'navy'  // cloth blue: beds, cloth, arcane
  | 'fire'  // emissive: flame, lamp, rune
  | 'metal' // steel: bands, hinges, blades
  | 'ink'   // the outline, and nothing else
  | 'void' // outside the room
  // ---- characters. Measured off the avatar and knight packs (§3).
  | 'skin'
  | 'hairGrey'
  | 'hairGinger'
  | 'hairBrown'
  | 'hairBlack'
  | 'olive' // the green every third villager in Skyrim wears
  | 'slate'; // neutral cloth grey — stone is violet and must not be worn

export const RAMP_HEX: Record<RampId, string[]> = {
  stone: [
    '#0a0810', '#100e1a', '#171423', '#1f1b2e', '#2a253c', '#372f4d', '#463c60',
    '#584c76', '#6d5f8e', '#8774a4', '#a68fb2', '#c8afb8', '#e8d3c2',
  ],
  wood: [
    '#120a05', '#1a1008', '#24160c', '#301d11', '#3f2717', '#51331d', '#664125',
    '#7d512e', '#96633a', '#b0784a', '#c8915f', '#dcaa7c', '#efc79c',
  ],
  wool: [
    '#12040a', '#1c050c', '#28060d', '#36080f', '#470b12', '#5b0f16', '#73151b',
    '#8d1d22', '#a9292b', '#c23934', '#d84d3d', '#e96a4e', '#f78f6b',
  ],
  navy: [
    '#05070e', '#070b16', '#0a1020', '#0d162b', '#111d39', '#162649', '#1c315c',
    '#243e73', '#2e4e8c', '#3c62a6', '#4f7cbd', '#6f9bcf', '#9dc0e2',
  ],
  fire: [
    '#2a0802', '#4d0f03', '#751703', '#a02205', '#c83208', '#e8470c', '#ff6410',
    '#ff8420', '#ffa63a', '#ffc760', '#ffdf8f', '#fff2bd', '#ffffff',
  ],
  metal: [
    '#08090c', '#0e1014', '#15181e', '#1e222a', '#292e38', '#363c49', '#454d5c',
    '#576173', '#6c778c', '#8491a6', '#a0adc1', '#becbdb', '#e2ecf5',
  ],
  ink: ['#000000'],
  void: ['#06050a'],

  // Skin runs from a deep brown shadow to a peach highlight. The three top
  // steps are the pack's own `#e2b27e` / `#fad6b8` / `#ffe0b7`, because a face
  // that is a ramp step off the reference reads as a different art direction.
  skin: [
    '#1a0d0b', '#24120f', '#331a14', '#45231a', '#5a2e20', '#723c28', '#8d4d31',
    '#a9603c', '#c27a4e', '#d49468', '#e2b27e', '#efc79c', '#fadcba',
  ],
  // Hair is four ramps, not one: grey, ginger, brown and black are different
  // hues at the same value, so a single ramp could not hold them.
  hairGrey: [
    '#14100e', '#1d1916', '#2a2521', '#3a342e', '#4a443e', '#5c554e', '#6d665d',
    '#918a80', '#a59e94', '#b5aea3', '#c9c2b7', '#ddcebf', '#f1ebdb',
  ],
  hairGinger: [
    '#1c0b04', '#281006', '#3a1a09', '#4b210b', '#5c2a0d', '#7f3a12', '#a34b17',
    '#c25e1c', '#d97428', '#e88a36', '#f49c4e', '#ffb066', '#ffc98f',
  ],
  hairBrown: [
    '#120c08', '#1b120c', '#241812', '#2f2017', '#3a251a', '#513224', '#6b442f',
    '#855a3d', '#9a6a47', '#a1704c', '#bd8a61', '#d2a078', '#e6bb92',
  ],
  hairBlack: [
    '#0a0a0c', '#101013', '#17161a', '#1e1d22', '#262429', '#2e2c32', '#363338',
    '#3f3c42', '#484449', '#56525a', '#665f6b', '#7a7380', '#8f8894',
  ],
  olive: [
    '#0c0f06', '#12160a', '#1a1f0f', '#232a14', '#2d351a', '#394321', '#46522a',
    '#566434', '#697a3f', '#7d904c', '#93a75c', '#aabd70', '#c2d189',
  ],
  // Cloth grey has to be *neutral*: the stone ramp is violet, and a villager
  // wearing stone ranks as a purple tunic the moment it is lit.
  slate: [
    '#08090b', '#0e1013', '#15181c', '#1d2126', '#272c32', '#333940', '#414850',
    '#525a63', '#666e78', '#7d858f', '#959da6', '#b0b7bf', '#ccd2d8',
  ],
};

export const packRGB = (r: number, g: number, b: number): number =>
  ((255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;

export const packHex = (hex: string): number => {
  const n = parseInt(hex.charAt(0) === '#' ? hex.slice(1) : hex, 16);
  return packRGB((n >> 16) & 255, (n >> 8) & 255, n & 255);
};

export const redOf = (c: number) => c & 255;
export const greenOf = (c: number) => (c >>> 8) & 255;
export const blueOf = (c: number) => (c >>> 16) & 255;

export const luminance = (c: number): number =>
  0.2126 * redOf(c) + 0.7152 * greenOf(c) + 0.0722 * blueOf(c);

/** Packed ramps, indexed by ramp id, for the rare direct-colour path. */
export const RAMP_PACKED: Record<RampId, Uint32Array> = Object.fromEntries(
  Object.entries(RAMP_HEX).map(([id, hexes]) => [id, Uint32Array.from(hexes.map(packHex))]),
) as Record<RampId, Uint32Array>;

/** The six authored ramps, flattened for the contact sheet. */
export const RAMP_ORDER: RampId[] = ['stone', 'wood', 'wool', 'navy', 'fire', 'metal'];
export const LONGEST_RAMP = Math.max(...Object.values(RAMP_HEX).map((r) => r.length));
