import type { Character } from '@/types/character';
import type { Build, CharacterSpec, Cloth, HairColour, HairStyle, Race, SkinTone } from './spec';

/**
 * A character sheet, as the board draws it.
 *
 * A token used to carry a copy of a `CharacterSpec`, which meant editing a
 * character never reached a room already built. With `ref` set, the board
 * resolves the spec here every time the room loads: race, build, weapon and
 * armour come from the sheet that actually exists.
 *
 * The sheet has no hair or skin fields yet. Those are picked deterministically
 * from the character id so a given character always looks the same without
 * inventing an appearance editor that would write nowhere.
 */

const RACE_BY_ID: Record<string, Race> = {
  nord: 'nord',
  breton: 'breton',
  imperial: 'imperial',
  redguard: 'redguard',
  'high-elf': 'high-elf',
  'wood-elf': 'wood-elf',
  'dark-elf': 'dark-elf',
  orc: 'orc',
  khajiit: 'khajiit',
  argonian: 'argonian',
};

const SKIN: SkinTone[] = ['deep', 'brown', 'tan', 'fair', 'pale'];
const HAIR: HairColour[] = ['grey', 'ginger', 'brown', 'black'];
const STYLES: HairStyle[] = ['short', 'long', 'braid', 'bald'];

const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};

const weaponOf = (c: Character): CharacterSpec['weapon'] => {
  const w = c.equipment.find((e) => e.type === 'weapon');
  if (!w) return 'none';
  const n = w.name.toLowerCase();
  if (n.includes('bow')) return 'bow';
  if (n.includes('hammer') || n.includes('mace') || n.includes('axe') || n.includes('club')) return 'hammer';
  return 'sword';
};

const buildOf = (c: Character): Build => (c.stats.might >= 8 ? 'burly' : c.stats.might <= 4 ? 'slim' : 'average');

const clothFor = (c: Character): { torsoCloth: Cloth; legsCloth: Cloth; plate: boolean } => {
  const armour = c.equipment.filter((e) => e.type === 'armor');
  const heavy = armour.some((a) => (a.dr ?? 0) >= 3 || /iron|steel|plate|dwarven|ebony/i.test(a.name));
  return heavy
    ? { torsoCloth: 'metal', legsCloth: 'metal', plate: true }
    : { torsoCloth: 'leather', legsCloth: 'navy', plate: false };
};

export function specFromCharacter(c: Character): CharacterSpec {
  const race: Race = RACE_BY_ID[c.race.id] ?? RACE_BY_ID[c.race.name.toLowerCase().replace(/\s+/g, '-')] ?? 'nord';
  const h = hash(c.id);
  const cloth = clothFor(c);
  return {
    id: c.id,
    name: c.name,
    race,
    build: buildOf(c),
    skinTone: SKIN[h % SKIN.length],
    hair: HAIR[(h >>> 3) % HAIR.length],
    hairStyle: STYLES[(h >>> 6) % STYLES.length],
    beard: race === 'argonian' || race === 'khajiit' ? 'none' : h % 3 === 0 ? 'stubble' : 'none',
    garment: {
      torso: cloth.plate ? 'plate' : 'tunic',
      torsoCloth: cloth.torsoCloth,
      legs: cloth.plate ? 'greaves' : 'trousers',
      legsCloth: cloth.legsCloth,
    },
    weapon: weaponOf(c),
  };
}
