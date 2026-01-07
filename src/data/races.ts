import { Race } from "@/types/character";

export const races: Race[] = [
  {
    id: "nord",
    name: "Nord",
    bonus: "might",
    abilityName: "Frost Resistance",
    abilityDescription: "You take 1 less damage from all sources of frost or ice magic. Additionally, once per adventure, when you are hit by an attack that deals frost damage, you can use your reaction to halve the damage against that single attack.",
    image: "nord.jpg"
  },
  {
    id: "breton",
    name: "Breton",
    bonus: "magic",
    abilityName: "Dragonskin",
    abilityDescription: "Once per adventure, when a hostile spell hits you, you may use this ability to take only half damage.",
    image: "breton.jpg"
  },
  {
    id: "imperial",
    name: "Imperial",
    bonus: "guile",
    abilityName: "Voice of the Emperor",
    abilityDescription: "Once per adventure, you can use your Major Action to force a single humanoid enemy to stop fighting for one round.",
    image: "imperial.jpg"
  },
  {
    id: "redguard",
    name: "Redguard",
    bonus: "agility",
    abilityName: "Adrenaline Rush",
    abilityDescription: "Once per adventure, you can use this ability as a free action to immediately regain 10 FP.",
    image: "redguard.jpg"
  },
  {
    id: "high-elf",
    name: "High Elf",
    bonus: "magic",
    abilityName: "Highborn",
    abilityDescription: "You are born with a deeper well of magicka. You gain +2 to your maximum FP.",
    image: "highelf.jpg"
  },
  {
    id: "wood-elf",
    name: "Wood Elf",
    bonus: "agility",
    abilityName: "Command Animal",
    abilityDescription: "Once per adventure, you can make a non-hostile wild animal an ally for one combat encounter.",
    image: "woodelf.jpg"
  },
  {
    id: "dark-elf",
    name: "Dark Elf",
    bonus: "magic",
    abilityName: "Ancestor's Wrath",
    abilityDescription: "Once per adventure, you can surround yourself with fire for 3 rounds. Each time an enemy hits you with a melee attack, they take 1 fire damage and catch fire, taking an additional 2 fire damage at the start of their next turn.",
    image: "darkelf.jpg"
  },
  {
    id: "orc",
    name: "Orc",
    bonus: "might",
    abilityName: "Berserker Rage",
    abilityDescription: "Once per adventure, for 3 rounds, you may enter a rage. While raging, all of your successful melee attacks are automatically considered Critical Successes.",
    image: "orc.jpg"
  },
  {
    id: "khajiit",
    name: "Khajiit",
    bonus: "agility",
    abilityName: "Claws",
    abilityDescription: "Your unarmed attacks are considered a One-Handed weapon with the Finesse property. Their damage is 2, increasing by +1 at the Apprentice, Adept, Expert, and Master tiers of play. They also gain the Hack & Slash property at the Adept tier and are considered Magical at the Master tier.",
    image: "kahjit.jpg"
  },
  {
    id: "argonian",
    name: "Argonian",
    bonus: "guile",
    abilityName: "Histskin",
    abilityDescription: "Once per adventure, as a Major Action, you can trigger your Histskin. You regain 1 HP at the start of each of your turns for the rest of the encounter, and 2 HP per turn once you have 2 skills at the expert level.",
    image: "argonian.jpg"
  }
];
