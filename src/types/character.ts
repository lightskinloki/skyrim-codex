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

export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield';
  damage?: number;
  dr?: number;
  description?: string;
}

export interface Kit {
  id: string;
  name: string;
  description: string;
  equipment: Equipment[];
  items: Array<{ name: string; quantity: number }>;
  gold: number;
}

export interface Character {
  id: string;
  name: string;
  ap: number;
  race: Race;
  standingStone: StandingStone;
  stats: Stats;
  resources: Resources;
  skills: CharacterSkill[];
  equipment: Equipment[];
  inventory: {
    gold: number;
    items: Array<{ name: string; quantity: number }>;
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
  };
  usedAbilities?: string[];
  combatMode?: boolean;
}

export type CharacterTier = 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';
