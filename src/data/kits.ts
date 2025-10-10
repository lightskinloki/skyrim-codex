import { Kit } from "@/types/character";

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
        damage: 5
      },
      {
        id: "steel-armor",
        name: "Steel Armor",
        type: "armor",
        dr: 3
      }
    ],
    items: ["Potion of Minor Healing"].map(name => ({ name, quantity: 1 })),
    gold: 25
  },
  {
    id: "skirmisher",
    name: "The Skirmisher's Kit",
    description: "For those who prefer to strike from the shadows or from a distance.",
    equipment: [
      {
        id: "longbow",
        name: "Longbow",
        type: "weapon",
        damage: 3
      },
      {
        id: "steel-dagger",
        name: "Steel Dagger",
        type: "weapon",
        damage: 2
      },
      {
        id: "leather-armor",
        name: "Leather Armor",
        type: "armor",
        dr: 1
      }
    ],
    items: ["20 Steel Arrows", "3 Lockpicks", "Vial of Weak Poison"].map(name => ({ name, quantity: 1 })),
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
        damage: 2
      },
      {
        id: "apprentice-robes",
        name: "Apprentice Robes",
        type: "armor",
        dr: 0
      }
    ],
    items: ["Potion of Minor Magicka", "Potion of Minor Magicka"].map(name => ({ name, quantity: 1 })),
    gold: 50
  }
];