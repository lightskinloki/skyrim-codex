// Character data types for Skyrim TTRPG
export interface Stats {
  might: number;
  agility: number;
  magic: number;
  guile: number;
}

export interface Resources {
  hp: {
    current: number;
    max: number;
  };
  fp: {
    current: number;
    max: number;
  };
}

export interface Race {
  id: string;
  name: string;
  bonus: keyof Stats;
  abilityName: string;
  abilityDescription: string;
  image: string; // Added for race images
}

export interface StandingStone {
  id: string;
  name: string;
  archetype: string;
  baseStats: Stats;
  benefitName: string;
  benefitDescription: string;
}

export interface Perk {
  rank: 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master';
  name: string;
  description: string;
  fpCost?: number;
  limitation?: 'per combat' | 'per adventure';
}

export interface Skill {
  id: string;
  name: string;
  type: 'Combat' | 'Magic' | 'Armor' | 'Utility';
  governingStat: 'Might' | 'Agility' | 'Magic' | 'Guile';
  perks: Perk[];
}

export interface CharacterSkill {
  skillId: string;
  rank: 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master';
  unlockedPerks: string[];
}

export interface Enchantment {
  name: string;
  description: string;
  charges: number;
  maxCharges: number;
  chargeCost: number;       // charges spent per use, default 1
  actionSlot: 'bonus' | 'free';
}

export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield';
  damage?: number;
  dr?: number;
  baseDr?: number;
  description?: string;
  enchantment?: Enchantment;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  /** Filled in automatically from the item catalog when the name is recognized. */
  kind?: 'potion' | 'poison' | 'weapon' | 'armor' | 'shield' | 'misc';
  effect?: string;
  restoreHp?: number;
  restoreFp?: number;
  /**
   * Built by a player in the item picker, not printed in the rulebook. Shown
   * with a "Brewed" / "Homebrew" tag so a lookalike name can't pass as canon.
   */
  homebrew?: boolean;
}

/** A custom item the player built in the item picker, kept for reuse. */
export interface HomebrewItem {
  id: string;
  name: string;
  kind: 'potion' | 'poison' | 'misc';
  effect: string;
  restoreHp?: number;
  restoreFp?: number;
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  equipment: Equipment[];
  items: InventoryItem[];
  gold: number;
}

export interface CustomAbility {
  id: string;
  name: string;
  slotType: 'major' | 'minor';
  fpCost?: number;
  hpCost?: number;
  description?: string;
  limitation?: 'per combat' | 'per adventure';
}

export interface Character {
  id: string;
  name: string;
  ap: number;
  totalAp: number;
  race: Race;
  standingStone: StandingStone;
  stats: Stats;
  resources: Resources;
  skills: CharacterSkill[];
  equipment: Equipment[];
  inventory: {
    gold: number;
    items: InventoryItem[];
    /** Custom items saved from the picker so they can be added again. */
    homebrew?: HomebrewItem[];
  };
  progression: {
    combatProwessUnlocked: {
      adept: boolean;
      expert: boolean;
      master: boolean;
    };
    arcaneStudiesUnlocked: {
      adept: boolean;
      expert: boolean;
      master: boolean;
    };
    resourceTraining?: {
      hp: number;
      fp: number;
    };
  };
  usedAbilities?: string[];
  combatMode?: boolean;
  notes?: string;
  customAbilities?: CustomAbility[];
}

export type CharacterTier = 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';
