import { StandingStone } from "@/types/character";

export const standingStones: StandingStone[] = [
  {
    id: "warrior",
    name: "The Warrior",
    archetype: "Path of Steel",
    baseStats: { might: 16, agility: 12, magic: 4, guile: 8 },
    benefitName: "Adrenaline Rush",
    benefitDescription: "Once per combat, after taking damage, you can choose to gain 1 FP."
  },
  {
    id: "thief",
    name: "The Thief",
    archetype: "Path of Shadows",
    baseStats: { might: 8, agility: 16, magic: 4, guile: 12 },
    benefitName: "Fleet Footed",
    benefitDescription: "You can use \"Dodge\" for 1 FP at any time. This ability does not use your Minor Action."
  },
  {
    id: "mage",
    name: "The Mage",
    archetype: "Path of Sorcery",
    baseStats: { might: 4, agility: 8, magic: 16, guile: 12 },
    benefitName: "Magicka Font",
    benefitDescription: "Your FP is calculated as your Magic Score +2."
  },
  {
    id: "lord",
    name: "The Lord",
    archetype: "The Knight",
    baseStats: { might: 15, agility: 8, magic: 6, guile: 11 },
    benefitName: "Knight's Ward",
    benefitDescription: "You gain +1 to your armor's Damage Reduction and once per adventure, you may re-roll a failed roll against a spell."
  },
  {
    id: "lady",
    name: "The Lady",
    archetype: "The Stalwart",
    baseStats: { might: 12, agility: 10, magic: 10, guile: 8 },
    benefitName: "Lady's Favor",
    benefitDescription: "You start with +2 maximum HP."
  },
  {
    id: "serpent",
    name: "The Serpent",
    archetype: "The Deceiver",
    baseStats: { might: 8, agility: 14, magic: 4, guile: 14 },
    benefitName: "Serpent's Kiss",
    benefitDescription: "Once per combat, use your Major Action to make a Guile roll to paralyze a target, causing them to lose their next Major Action."
  },
  {
    id: "steed",
    name: "The Steed",
    archetype: "The Vanguard",
    baseStats: { might: 14, agility: 14, magic: 4, guile: 8 },
    benefitName: "Unburdened",
    benefitDescription: "You suffer no penalties for wearing Heavy Armor. You have no disadvantage on Sneak rolls. Once per turn, you may move without using your Minor Action."
  },
  {
    id: "shadow",
    name: "The Shadow",
    archetype: "The Assassin",
    baseStats: { might: 8, agility: 17, magic: 4, guile: 11 },
    benefitName: "Shadow Form",
    benefitDescription: "Once per adventure, declare yourself invisible for 3 rounds or until you perform a hostile action."
  },
  {
    id: "tower",
    name: "The Tower",
    archetype: "The Infiltrator",
    baseStats: { might: 7, agility: 12, magic: 4, guile: 17 },
    benefitName: "Infiltrator's Edge",
    benefitDescription: "You may re-roll any single failed Lockpicking or Trap Disarming attempt once per dungeon. Once per adventure, you may declare a \"secret passage,\" bypassing one non-boss encounter or puzzle."
  },
  {
    id: "apprentice",
    name: "The Apprentice",
    archetype: "Glass Cannon",
    baseStats: { might: 6, agility: 8, magic: 17, guile: 9 },
    benefitName: "Arcane Instability",
    benefitDescription: "You have -2 maximum HP, but you regenerate 1 FP at the start of each of your turns in combat."
  },
  {
    id: "atronach",
    name: "The Atronach",
    archetype: "The Conduit",
    baseStats: { might: 4, agility: 6, magic: 18, guile: 12 },
    benefitName: "Spell Absorption",
    benefitDescription: "Once per combat, negate a hostile spell and regain FP equal to its cost. You do not regain FP during a short rest."
  },
  {
    id: "ritual",
    name: "The Ritual",
    archetype: "The Summoner",
    baseStats: { might: 6, agility: 6, magic: 15, guile: 13 },
    benefitName: "Ritual Power",
    benefitDescription: "Once per adventure, cast an empowered Raise Zombie spell for 0 FP that summons a powerful \"Ritual Guardian.\""
  },
  {
    id: "lover",
    name: "The Lover",
    archetype: "Jack-of-All-Trades",
    baseStats: { might: 10, agility: 10, magic: 10, guile: 10 },
    benefitName: "Lover's Comfort",
    benefitDescription: "You may choose four Apprentice skills instead of the usual three."
  }
];