// Types for the Essence alchemy system, sourced from
// "Frogs-5-skyrim/GM Guide/Alchemy GM Reference" (the rules document).
// The in-world "Doctrine of Essences" is a teaching text, not the rules.

export const ESSENCES = [
  'VITALIS',
  'VENITAS',
  'GRAVITAS',
  'AGILITAS',
  'CAECITAS',
  'FORTITAS',
  'ANIMA',
  'IGNIS',
  'GLACIES',
  'FULGUR',
] as const;

export type Essence = (typeof ESSENCES)[number];

/**
 * P = Primary, S = Secondary, T = Tertiary, Q = Quaternary.
 * Q is reserved for relic-tier ingredients and reads as a trace.
 */
export type Tier = 'P' | 'S' | 'T' | 'Q';

export type EssenceTier = readonly [Essence, Tier];

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';

export type IngredientTag = 'sapient' | 'legendary' | 'trace' | 'special';

/** An alternate expression for an ingredient whose dominant Essence depends on intent. */
export interface IngredientVariant {
  label: string;
  essences: readonly EssenceTier[];
}

export interface Ingredient {
  name: string;
  rarity: Rarity;
  essences: readonly EssenceTier[];
  variants?: readonly IngredientVariant[];
  tags?: readonly IngredientTag[];
  /**
   * Essences of this ingredient that lose their own expression to an internal
   * conflict the reference rules on (Canis Root's GRAVITAS against its own
   * AGILITAS, Void Salts' CAECITAS against its own FULGUR, and so on).
   *
   * The general opposition ladder is checked BETWEEN ingredients; an internal
   * conflict is a ruling per ingredient, so it is declared here rather than
   * inferred. Only entries the reference gives a GM note for are listed.
   */
  internalWeakened?: readonly Essence[];
  note?: string;
}

/** The five opposition pairs, from Section 3 of the reference. */
export const OPPOSITION_PAIRS: readonly (readonly [Essence, Essence])[] = [
  ['VITALIS', 'VENITAS'],
  ['GRAVITAS', 'AGILITAS'],
  ['IGNIS', 'GLACIES'],
  ['CAECITAS', 'FULGUR'],
  ['FORTITAS', 'ANIMA'],
];

export const ESSENCE_LABELS: Record<Essence, string> = {
  VITALIS: 'Life',
  VENITAS: 'Entropy',
  GRAVITAS: 'Weight',
  AGILITAS: 'Speed',
  CAECITAS: 'Concealment',
  FORTITAS: 'Hardening',
  ANIMA: 'Spirit',
  IGNIS: 'Fire',
  GLACIES: 'Frost',
  FULGUR: 'Discharge',
};

export type NegationSeverity = 'primary' | 'secondary' | 'tertiary';

export type Quality = 'Standard' | 'Potent' | 'Exceptional' | 'Tainted';

export interface BrewEntry {
  name: string;
  copies?: number;
}

export interface OppositionFinding {
  a: string;
  b: string;
  essenceA: Essence;
  tierA: Tier;
  essenceB: Essence;
  tierB: Tier;
  severity: NegationSeverity;
  /** True when both Essences live in the same ingredient. */
  internal: boolean;
}

export interface ExpressedEssence {
  essence: Essence;
  tier: Tier;
  sources: string[];
  copies: number;
  amplified: boolean;
  weakened: 'none' | 'significantly' | 'minor';
}

export interface BrewEffect {
  essence: Essence;
  label: string;
  value: string;
}
