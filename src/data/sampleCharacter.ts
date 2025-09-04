import { Character } from "@/types/character";
import { races } from "./races";
import { standingStones } from "./standingStones";
import { calculateMaxHP, calculateMaxFP, calculateFinalStats } from "@/utils/characterCalculations";

const nordRace = races.find(r => r.id === "nord")!;
const warriorStone = standingStones.find(s => s.id === "warrior")!;
const finalStats = calculateFinalStats(warriorStone.baseStats, nordRace);

const sampleSkills = [
  {
    skillId: "one-handed",
    rank: "Adept" as const,
    unlockedPerks: ["Fighting Stance", "Savage Strike"]
  },
  {
    skillId: "heavy-armor",
    rank: "Apprentice" as const,
    unlockedPerks: ["Well Fitted"]
  },
  {
    skillId: "smithing",
    rank: "Apprentice" as const,
    unlockedPerks: ["Steel Smithing"]
  }
];

const maxHP = calculateMaxHP(finalStats, warriorStone, nordRace, sampleSkills);
const maxFP = calculateMaxFP(finalStats, warriorStone, nordRace, sampleSkills);

export const sampleCharacter: Character = {
  id: "sample-1",
  name: "Lyralei Stormcaller",
  ap: 25,
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
      "Potion of Minor Healing (x1)",
      "Torch x3",
      "Rations x7"
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