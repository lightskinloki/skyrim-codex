import { Stats, Character, Race, StandingStone, CharacterSkill } from "@/types/character";

export function calculateFinalStats(baseStats: Stats, race: Race): Stats {
  const finalStats = { ...baseStats };
  finalStats[race.bonus] += 1;
  return finalStats;
}

export function calculateMaxHP(
  finalStats: Stats,
  standingStone: StandingStone,
  race: Race,
  skills: CharacterSkill[],
  character?: Character
): number {
  let maxHP = 8 + Math.floor(finalStats.might / 4);
  
  // Lady stone bonus
  if (standingStone.id === "lady") {
    maxHP += 2;
  }
  
  // Heavy Armor skill bonus
  const hasHeavyArmor = skills.some(skill => 
    skill.skillId === "heavy-armor" && 
    ["Apprentice", "Adept", "Expert", "Master"].includes(skill.rank)
  );
  if (hasHeavyArmor) {
    maxHP += 2;
  }
  
  // Combat Prowess Adept bonus
  if (character?.progression.combatProwessUnlocked.adept) {
    maxHP += 2;
  }
  
  // Apprentice stone penalty
  if (standingStone.id === "apprentice") {
    maxHP -= 2;
  }
  
  return Math.max(1, maxHP); // Minimum 1 HP
}

export function calculateMaxFP(
  finalStats: Stats,
  standingStone: StandingStone,
  race: Race,
  skills: CharacterSkill[],
  character?: Character
): number {
  // Mage stone special calculation - overrides standard formula
  if (standingStone.id === "mage") {
    let maxFP = finalStats.magic + 2;
    
    // High Elf racial bonus still applies
    if (race.id === "high-elf") {
      maxFP += 2;
    }
    
    // Light Armor skill bonus still applies
    const hasLightArmor = skills.some(skill => 
      skill.skillId === "light-armor" && 
      ["Apprentice", "Adept", "Expert", "Master"].includes(skill.rank)
    );
    if (hasLightArmor) {
      maxFP += 2;
    }
    
    return Math.max(1, maxFP);
  }
  
  // Standard calculation for all other stones
  let maxFP = Math.floor(finalStats.agility / 2) + Math.floor(finalStats.magic / 2);
  
  // High Elf racial bonus
  if (race.id === "high-elf") {
    maxFP += 2;
  }
  
  // Light Armor skill bonus
  const hasLightArmor = skills.some(skill => 
    skill.skillId === "light-armor" && 
    ["Apprentice", "Adept", "Expert", "Master"].includes(skill.rank)
  );
  if (hasLightArmor) {
    maxFP += 2;
  }

  // Combat Prowess Expert bonus (FP)
  if (character?.progression.combatProwessUnlocked.expert) {
    maxFP += 2;
  }
  
  return Math.max(1, maxFP); // Minimum 1 FP
}

export function calculateTotalDR(equipment: any[], standingStone: StandingStone): number {
  let totalDR = equipment.reduce((total, item) => total + (item.dr || 0), 0);
  
  // Lord stone bonus
  if (standingStone.id === "lord") {
    totalDR += 1;
  }
  
  return totalDR;
}

export function getMaxApprenticeSkills(standingStone: StandingStone): number {
  return standingStone.id === "lover" ? 4 : 3;
}

export function getCharacterTier(ap: number): string {
  if (ap >= 12) return 'Legendary';
  if (ap >= 7) return 'Master';
  if (ap >= 5) return 'Expert';
  if (ap >= 3) return 'Adept';
  if (ap >= 1) return 'Apprentice';
  return 'Novice';
}

export function updateCharacterResources(character: Character): Character {
  const newMaxHP = calculateMaxHP(character.stats, character.standingStone, character.race, character.skills, character);
  const newMaxFP = calculateMaxFP(character.stats, character.standingStone, character.race, character.skills, character);
  
  const oldMaxHP = character.resources.hp.max;
  const oldMaxFP = character.resources.fp.max;
  
  // Calculate HP adjustment - if max increased, add the difference to current
  const hpIncrease = Math.max(0, newMaxHP - oldMaxHP);
  const fpIncrease = Math.max(0, newMaxFP - oldMaxFP);
  
  return {
    ...character,
    resources: {
      hp: {
        max: newMaxHP,
        current: Math.min(newMaxHP, character.resources.hp.current + hpIncrease)
      },
      fp: {
        max: newMaxFP,
        current: Math.min(newMaxFP, character.resources.fp.current + fpIncrease)
      }
    }
  };
}

export function getKhajiitClawDamage(ap: number): number {
  const tier = getCharacterTier(ap);
  switch (tier) {
    case 'Novice': return 2;
    case 'Apprentice': return 3;
    case 'Adept': return 4;
    case 'Expert': return 5;
    case 'Master':
    case 'Legendary': return 6;
    default: return 2;
  }
}

export function performShortRest(character: Character): Character {
  const { hp, fp } = character.resources;
  
  // Atronach stone special rule - no FP recovery on short rest
  const fpRecovery = character.standingStone.id === "atronach" ? 0 : Math.floor(fp.max / 2);
  
  return {
    ...character,
    resources: {
      hp: { ...hp, current: Math.min(hp.max, hp.current + Math.floor(hp.max / 2)) },
      fp: { ...fp, current: Math.min(fp.max, fp.current + fpRecovery) }
    }
  };
}

export function performLongRest(character: Character): Character {
  const usedAbilities = character.usedAbilities || [];
  
  // Reset all 'per adventure' abilities
  const resetAbilities = usedAbilities.filter(abilityId => {
    // Keep combat abilities, remove adventure abilities
    return !abilityId.includes('racial-') && 
           !abilityId.includes('stone-') &&
           !abilityId.includes('tower-') &&
           !abilityId.includes('shadow-') &&
           !abilityId.includes('ritual-') &&
           !abilityId.includes('lord-');
  });
  
  return {
    ...character,
    resources: {
      hp: { ...character.resources.hp, current: character.resources.hp.max },
      fp: { ...character.resources.fp, current: character.resources.fp.max }
    },
    usedAbilities: resetAbilities
  };
}
