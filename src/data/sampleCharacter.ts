import { Character } from "@/types/character";

export const sampleCharacter: Character = {
  id: "sample-1",
  name: "Lyralei Stormcaller",
  ap: 25,
  race: {
    id: "nord",
    name: "Nord",
    bonus: "might",
    abilityName: "Battle Cry",
    abilityDescription: "Once per combat, you can let out a mighty roar that causes all enemies within 30 feet to make a Guile saving throw or be frightened for 1 round."
  },
  standingStone: {
    id: "warrior",
    name: "The Warrior",
    archetype: "Warrior",
    baseStats: { might: 3, agility: 2, magic: 1, guile: 2 },
    benefitName: "Combat Focus",
    benefitDescription: "You gain a +2 bonus to attack rolls when you have 50% or less of your maximum Health Points."
  },
  stats: {
    might: 4, // 3 base + 1 racial bonus
    agility: 2,
    magic: 1,
    guile: 2
  },
  resources: {
    hp: {
      current: 32,
      max: 40 // Base calculation
    },
    fp: {
      current: 18,
      max: 24
    }
  },
  skills: [
    {
      skillId: "one-handed",
      rank: "Adept",
      unlockedPerks: ["Armsman", "Fighting Stance", "Savage Strike"]
    },
    {
      skillId: "block",
      rank: "Apprentice", 
      unlockedPerks: ["Shield Wall"]
    },
    {
      skillId: "heavy-armor",
      rank: "Apprentice",
      unlockedPerks: ["Juggernaut"]
    },
    {
      skillId: "smithing",
      rank: "Apprentice",
      unlockedPerks: ["Steel Smithing"]
    }
  ],
  equipment: [
    {
      id: "steel-sword",
      name: "Steel Sword",
      type: "weapon",
      damage: 8,
      description: "A well-crafted steel blade"
    },
    {
      id: "steel-armor",
      name: "Steel Armor",
      type: "armor", 
      dr: 4,
      description: "Heavy steel plate armor"
    },
    {
      id: "steel-shield",
      name: "Steel Shield",
      type: "shield",
      dr: 3,
      description: "A sturdy steel shield"
    }
  ],
  inventory: {
    gold: 245,
    items: [
      "Health Potion x2",
      "Lockpicks x5", 
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