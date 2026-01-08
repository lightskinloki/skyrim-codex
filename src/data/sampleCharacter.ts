import { Character } from "@/types/character";
import { races } from "./races";
import { standingStones } from "./standingStones";
import { calculateMaxHP, calculateMaxFP, calculateFinalStats } from "@/utils/characterCalculations";

const nordRace = races.find(r => r.id === "nord")!;
const warriorStone = standingStones.find(s => s.id === "warrior")!;
const finalStats = calculateFinalStats(warriorStone.baseStats, nordRace);

// Valid skill selection: 1 Adept + 3 Apprentice
const sampleSkills = [
  // All 13 skills with proper ranks
  { skillId: "one-handed", rank: "Adept" as const, unlockedPerks: ["Fighting Stance", "Savage Strike"] },
  { skillId: "two-handed", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "archery", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "heavy-armor", rank: "Apprentice" as const, unlockedPerks: ["Well Fitted"] },
  { skillId: "light-armor", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "destruction", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "restoration", rank: "Apprentice" as const, unlockedPerks: ["Respite"] },
  { skillId: "alteration", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "illusion", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "conjuration", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "sneak", rank: "Apprentice" as const, unlockedPerks: ["Silent Roll"] },
  { skillId: "lockpicking", rank: "Novice" as const, unlockedPerks: [] },
  { skillId: "speech", rank: "Novice" as const, unlockedPerks: [] }
];

// Create character first to pass to calculations
const tempCharacter = {
  progression: {
    combatProwessUnlocked: {
      adept: true,
      expert: false,
      master: false
    },
    arcaneStudiesUnlocked: {
      adept: false,
      expert: false,
      master: false
    }
  }
} as Character;

const maxHP = calculateMaxHP(finalStats, warriorStone, nordRace, sampleSkills, tempCharacter);
const maxFP = calculateMaxFP(finalStats, warriorStone, nordRace, sampleSkills, tempCharacter);

export const sampleCharacter: Character = {
  id: "sample-1",
  name: "Bjorn Ironshield",
  ap: 0,
  totalAp: 0,
  race: nordRace,
  standingStone: warriorStone,
  stats: finalStats,
  resources: {
    hp: {
      current: maxHP,
      max: maxHP
    },
    fp: {
      current: maxFP,
      max: maxFP
    }
  },
  skills: sampleSkills,
  equipment: [
    {
      id: "steel-greatsword",
      name: "Steel Greatsword",
      type: "weapon",
      damage: 5,
      description: "A well-crafted two-handed blade"
    },
    {
      id: "steel-armor",
      name: "Steel Armor",
      type: "armor", 
      dr: 3,
      description: "Heavy steel plate armor"
    }
  ],
  inventory: {
    gold: 25,
    items: [
      { name: "Potion of Minor Healing", quantity: 1 },
      { name: "Torch", quantity: 3 },
      { name: "Rations", quantity: 7 }
    ]
  },
  progression: {
    combatProwessUnlocked: {
      adept: true,
      expert: false,
      master: false
    },
    arcaneStudiesUnlocked: {
      adept: false,
      expert: false,
      master: false
    }
  }
};