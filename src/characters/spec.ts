import {
  M_CLOTH_NAVY,
  M_CLOTH_RED,
  M_HAIR_BLACK,
  M_HAIR_BROWN,
  M_HAIR_GINGER,
  M_HAIR_GREY,
  M_METAL,
  M_OLIVE,
  M_SKIN,
  M_SLATE,
  M_WOOD_PROP,
  RAMP_LEN,
} from '@/battlemap/surface';
import { clamp } from '@/battlemap/rng';
import { P } from './partmask';

/**
 * One character, two renders. See docs/PIXEL-ART-SPEC.md §3 (C0).
 *
 * The spec is the authored artifact. `bust()` and `body()` both read it, so an
 * outfit change reaches the dialogue portrait and the battle token at once —
 * there is no second sprite to keep in sync.
 */

export type Race =
  | 'nord' | 'breton' | 'imperial' | 'redguard' | 'high-elf'
  | 'wood-elf' | 'dark-elf' | 'orc' | 'khajiit' | 'argonian';

export type Build = 'slim' | 'average' | 'burly';

/** Which band of the skin ramp the face is authored from. */
export type SkinTone = 'deep' | 'brown' | 'tan' | 'fair' | 'pale';

export type HairColour = 'grey' | 'ginger' | 'brown' | 'black';
export type HairStyle = 'bald' | 'short' | 'long' | 'braid';
export type Beard = 'none' | 'stubble' | 'full' | 'long';

export type Cloth = 'grey' | 'olive' | 'wool' | 'navy' | 'metal' | 'leather' | 'skin';

export type Garment = {
  torso: 'tank' | 'tunic' | 'vest' | 'plate';
  torsoCloth: Cloth;
  legs: 'trousers' | 'skirt' | 'greaves';
  legsCloth: Cloth;
};

export type CharacterSpec = {
  id: string;
  name: string;
  race: Race;
  build: Build;
  skinTone: SkinTone;
  hair: HairColour;
  hairStyle: HairStyle;
  beard: Beard;
  garment: Garment;
  weapon: 'none' | 'hammer' | 'sword' | 'bow';
};

/**
 * Runtime lists of every enum above. A room document is data from the outside
 * world, and `RACE_SHAPE` is a lookup, not a switch: an unknown race would index
 * `undefined` and take the token renderer down. These are the values the parser
 * accepts, so the lists and the types cannot drift.
 */
export const RACES: Race[] = [
  'nord', 'breton', 'imperial', 'redguard', 'high-elf',
  'wood-elf', 'dark-elf', 'orc', 'khajiit', 'argonian',
];
export const BUILDS: Build[] = ['slim', 'average', 'burly'];
export const SKIN_TONES: SkinTone[] = ['deep', 'brown', 'tan', 'fair', 'pale'];
export const HAIR_COLOURS: HairColour[] = ['grey', 'ginger', 'brown', 'black'];
export const HAIR_STYLES: HairStyle[] = ['bald', 'short', 'long', 'braid'];
export const BEARDS: Beard[] = ['none', 'stubble', 'full', 'long'];
export const CLOTHS: Cloth[] = ['grey', 'olive', 'wool', 'navy', 'metal', 'leather', 'skin'];
export const TORSOS: Garment['torso'][] = ['tank', 'tunic', 'vest', 'plate'];
export const LEGS: Garment['legs'][] = ['trousers', 'skirt', 'greaves'];
export const WEAPONS: CharacterSpec['weapon'][] = ['none', 'hammer', 'sword', 'bow'];

/** Ramp step the face is authored around, per tone. The face then uses
 *  `base + n` for its lit and shadowed planes, so every tone shades alike. */
export const SKIN_BASE: Record<SkinTone, number> = {
  deep: 3,
  brown: 4,
  tan: 6,
  fair: 8,
  pale: 10,
};

export const CLOTH_MATERIAL: Record<Cloth, number> = {
  grey: M_SLATE, // neutral: the stone ramp is violet and reads as a purple tunic
  olive: M_OLIVE,
  wool: M_CLOTH_RED,
  navy: M_CLOTH_NAVY,
  metal: M_METAL,
  leather: M_WOOD_PROP,
  skin: M_SKIN,
};

export const HAIR_MATERIAL: Record<HairColour, number> = {
  grey: M_HAIR_GREY,
  ginger: M_HAIR_GINGER,
  brown: M_HAIR_BROWN,
  black: M_HAIR_BLACK,
};

/**
 * Argonians are green, so they read from the olive ramp rather than the skin
 * ramp — the same arithmetic on a different material. Everyone else is skin;
 * a Khajiit's fur is the skin ramp, which is warm brown and already correct.
 */
export const SKIN_MATERIAL: Record<Race, number> = {
  nord: M_SKIN,
  breton: M_SKIN,
  imperial: M_SKIN,
  redguard: M_SKIN,
  'high-elf': M_SKIN,
  'wood-elf': M_SKIN,
  'dark-elf': M_SKIN,
  orc: M_SKIN,
  khajiit: M_SKIN,
  argonian: M_OLIVE,
};

/** Argonians have no hair to colour, so every style resolves to a bare skull. */
export const hasHair = (spec: CharacterSpec): boolean => spec.race !== 'argonian';

/** The face's own band on its race's skin ramp, shifted `n` steps. */
export const skinAt = (spec: CharacterSpec, n: number): number => {
  const mat = SKIN_MATERIAL[spec.race];
  return P(mat, clamp(SKIN_BASE[spec.skinTone] + n, 0, RAMP_LEN[mat] - 1));
};

/** The hair's mid tone, shifted `n` steps. */
export const hairAt = (spec: CharacterSpec, n: number): number => {
  const mat = HAIR_MATERIAL[spec.hair];
  return P(mat, clamp(7 + n, 0, RAMP_LEN[mat] - 1));
};

/** Builds widen shoulders and torso; they do not change the head. */
export const BUILD_WIDTH: Record<Build, number> = { slim: -1, average: 0, burly: 2 };

export const RACE_LABEL: Record<Race, string> = {
  nord: 'Nord',
  breton: 'Breton',
  imperial: 'Imperial',
  redguard: 'Redguard',
  'high-elf': 'Altmer',
  'wood-elf': 'Bosmer',
  'dark-elf': 'Dunmer',
  orc: 'Orsimer',
  khajiit: 'Khajiit',
  argonian: 'Argonian',
};

const nord = (s: Partial<CharacterSpec>): CharacterSpec => ({
  id: 'nord',
  name: 'Nord',
  race: 'nord',
  build: 'average',
  skinTone: 'fair',
  hair: 'brown',
  hairStyle: 'short',
  beard: 'none',
  garment: { torso: 'tunic', torsoCloth: 'leather', legs: 'trousers', legsCloth: 'leather' },
  weapon: 'none',
  ...s,
});

/**
 * Four presets, each measured against a reference: the smith and the innkeep
 * are avatar NPC_1 and NPC_2, the merchant is NPC_4's green vest, and the knight
 * is the knight sheet's plate.
 */
export const PRESETS: CharacterSpec[] = [
  nord({
    id: 'smith',
    name: 'Alvar',
    build: 'burly',
    skinTone: 'fair',
    hair: 'grey',
    hairStyle: 'short',
    beard: 'long',
    garment: { torso: 'tank', torsoCloth: 'grey', legs: 'trousers', legsCloth: 'navy' },
    weapon: 'hammer',
  }),
  nord({
    id: 'innkeep',
    name: 'Runa',
    race: 'imperial',
    build: 'slim',
    skinTone: 'pale',
    hair: 'ginger',
    hairStyle: 'long',
    beard: 'none',
    garment: { torso: 'tunic', torsoCloth: 'wool', legs: 'skirt', legsCloth: 'navy' },
    weapon: 'none',
  }),
  nord({
    id: 'merchant',
    name: 'Corvus',
    race: 'breton',
    skinTone: 'tan',
    hair: 'brown',
    hairStyle: 'short',
    beard: 'stubble',
    garment: { torso: 'vest', torsoCloth: 'olive', legs: 'trousers', legsCloth: 'leather' },
    weapon: 'none',
  }),
  nord({
    id: 'knight',
    name: 'Sigrid',
    race: 'nord',
    build: 'burly',
    skinTone: 'fair',
    hair: 'black',
    hairStyle: 'braid',
    beard: 'none',
    garment: { torso: 'plate', torsoCloth: 'metal', legs: 'greaves', legsCloth: 'metal' },
    weapon: 'sword',
  }),
];

export const preset = (id: string): CharacterSpec => PRESETS.find((p) => p.id === id) ?? PRESETS[0];
