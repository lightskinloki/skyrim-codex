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
  skills: CharacterSkill[]
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
  skills: CharacterSkill[]
): number {
  let maxFP = Math.floor(finalStats.agility / 2) + Math.floor(finalStats.magic / 2);
  
  // Mage stone special calculation
  if (standingStone.id === "mage") {
    maxFP = finalStats.magic + 2;
  }
  
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
  if (ap >= 120) return 'Legendary';
  if (ap >= 90) return 'Master';
  if (ap >= 60) return 'Expert';
  if (ap >= 30) return 'Adept';
  if (ap >= 10) return 'Apprentice';
  return 'Novice';
}