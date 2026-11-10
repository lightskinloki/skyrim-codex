import { Kit } from "@/types/character";

/**
 * Starting kits.
 *
 * The first three are the book's (players guide, "Choose Your Starting Kit"),
 * word for word, and their numbers are the gear table's own — a Steel Greatsword
 * is 9 damage there and it has to be 9 here, or the kit lies about the character
 * it just made. The last three are house kits, built only from the same printed
 * gear table so a hybrid concept has a legal place to start. They carry `house`
 * and the card labels them.
 */
export const kits: Kit[] = [
  {
    id: "warrior",
    name: "The Warrior's Kit",
    description: "For those who face their foes head-on with steel and fury.",
    equipment: [
      {
        id: "steel-greatsword",
        name: "Steel Greatsword",
        type: "weapon",
        damage: 9
      },
      {
        id: "steel-armor",
        name: "Steel Armor",
        type: "armor",
        dr: 3
      }
    ],
    items: [{ name: "Potion of Minor Healing", quantity: 1 }],
    gold: 25
  },
  {
    id: "skirmisher",
    name: "The Skirmisher's Kit",
    description: "For those who prefer to strike from the shadows or from a distance.",
    equipment: [
      {
        id: "longbow",
        name: "Long Bow",
        type: "weapon",
        damage: 4
      },
      {
        id: "steel-dagger",
        name: "Steel Dagger",
        type: "weapon",
        damage: 4
      },
      {
        id: "leather-armor",
        name: "Leather Armor",
        type: "armor",
        dr: 1
      }
    ],
    items: [
      { name: "Steel Arrows", quantity: 20 },
      { name: "Lockpicks", quantity: 3 },
      { name: "Vial of Weak Poison", quantity: 1 }
    ],
    gold: 25
  },
  {
    id: "mage",
    name: "The Mage's Kit",
    description: "For those who command the arcane arts to vanquish their enemies.",
    equipment: [
      {
        id: "iron-dagger",
        name: "Iron Dagger",
        type: "weapon",
        damage: 3
      },
      {
        id: "apprentice-robes",
        name: "Apprentice Robes",
        type: "armor",
        dr: 0
      }
    ],
    items: [{ name: "Potion of Minor Magicka", quantity: 2 }],
    gold: 50
  },

  // ---------------------------------------------------------------- house kits
  {
    id: "spellsword",
    name: "The Spellsword's Kit",
    description: "Steel in one hand, a spell in the other. Robes keep the magicka coming; the sword keeps the enemy back.",
    house: true,
    equipment: [
      {
        id: "steel-sword",
        name: "Steel Sword",
        type: "weapon",
        damage: 6
      },
      {
        id: "apprentice-robes",
        name: "Apprentice Robes",
        type: "armor",
        dr: 0
      }
    ],
    items: [
      { name: "Potion of Minor Healing", quantity: 1 },
      { name: "Potion of Minor Magicka", quantity: 1 }
    ],
    gold: 35
  },
  {
    id: "nightblade",
    name: "The Nightblade's Kit",
    description: "A knife in the dark, and just enough magic to stay there. Poison for the first hit, illusion for the escape.",
    house: true,
    equipment: [
      {
        id: "steel-dagger",
        name: "Steel Dagger",
        type: "weapon",
        damage: 4
      },
      {
        id: "leather-armor",
        name: "Leather Armor",
        type: "armor",
        dr: 1
      }
    ],
    items: [
      { name: "Vial of Weak Poison", quantity: 1 },
      { name: "Potion of Minor Magicka", quantity: 1 },
      { name: "Lockpicks", quantity: 2 }
    ],
    gold: 30
  },
  {
    id: "ranger",
    name: "The Ranger's Kit",
    description: "A bow for the open ground, an axe for when it closes. Hide and a healing draught keep you in the fight.",
    house: true,
    equipment: [
      {
        id: "longbow",
        name: "Long Bow",
        type: "weapon",
        damage: 4
      },
      {
        id: "iron-war-axe",
        name: "Iron War Axe",
        type: "weapon",
        damage: 5
      },
      {
        id: "hide-armor",
        name: "Hide Armor",
        type: "armor",
        dr: 1
      }
    ],
    items: [
      { name: "Steel Arrows", quantity: 20 },
      { name: "Potion of Minor Healing", quantity: 1 }
    ],
    gold: 20
  }
];
