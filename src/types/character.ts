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
  rank: 'Apprentice' | 'Adept' | 'Expert' | 'Master';
  name: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  type: 'Combat' | 'Magic' | 'Armor' | 'Utility';
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
  items: string[];
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
    items: string[];
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
}

export type CharacterTier = 'Novice' | 'Apprentice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';