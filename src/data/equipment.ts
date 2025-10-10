// Official Equipment Database for Skyrim TTRPG
import { Equipment } from "@/types/character";

export interface EquipmentTemplate extends Equipment {
  category?: string;
  rarity?: string;
}

export const officialWeapons: EquipmentTemplate[] = [
  // One-Handed Weapons - Tier 1
  { id: "iron-dagger", name: "Iron Dagger", type: "weapon", damage: 2, description: "Assassin's Blade. The baseline for a concealed weapon.", category: "One-Handed" },
  { id: "iron-sword", name: "Iron Sword", type: "weapon", damage: 2, description: "Finesse. A common blade for bandits and mercenaries.", category: "One-Handed" },
  { id: "iron-war-axe", name: "Iron War Axe", type: "weapon", damage: 2, description: "Hack & Slash. A crude but effective weapon.", category: "One-Handed" },
  { id: "iron-mace", name: "Iron Mace", type: "weapon", damage: 2, description: "Bone Breaker. Simple, heavy, and gets the job done.", category: "One-Handed" },
  
  // One-Handed Weapons - Tier 2
  { id: "steel-dagger", name: "Steel Dagger", type: "weapon", damage: 2, description: "Assassin's Blade. Well-crafted and reliable.", category: "One-Handed" },
  { id: "steel-sword", name: "Steel Sword", type: "weapon", damage: 3, description: "Finesse. The standard-issue weapon of a professional soldier.", category: "One-Handed" },
  { id: "steel-war-axe", name: "Steel War Axe", type: "weapon", damage: 3, description: "Hack & Slash. A significant improvement over iron.", category: "One-Handed" },
  { id: "steel-mace", name: "Steel Mace", type: "weapon", damage: 3, description: "Bone Breaker. The guard's choice for putting down trouble.", category: "One-Handed" },
  
  // One-Handed Weapons - Tier 3
  { id: "elven-dagger", name: "Elven Dagger", type: "weapon", damage: 3, description: "Assassin's Blade. Lightweight: Grants +1 to your initiative roll.", category: "One-Handed" },
  { id: "elven-sword", name: "Elven Sword", type: "weapon", damage: 3, description: "Finesse. Lightweight: Grants +1 to your initiative roll.", category: "One-Handed" },
  { id: "dwarven-war-axe", name: "Dwarven War Axe", type: "weapon", damage: 3, description: "Hack & Slash. Staggering Force: Power Attacks stagger the target.", category: "One-Handed" },
  { id: "dwarven-mace", name: "Dwarven Mace", type: "weapon", damage: 3, description: "Bone Breaker. Staggering Force: Power Attacks stagger the target.", category: "One-Handed" },
  { id: "orcish-dagger", name: "Orcish Dagger", type: "weapon", damage: 3, description: "Assassin's Blade. Brutal: Power Attacks deal +1 extra damage.", category: "One-Handed" },
  { id: "orcish-war-axe", name: "Orcish War Axe", type: "weapon", damage: 4, description: "Hack & Slash. Orcish weapons focus on raw power.", category: "One-Handed" },
  { id: "orcish-mace", name: "Orcish Mace", type: "weapon", damage: 4, description: "Bone Breaker. A brutal, high-damage option.", category: "One-Handed" },
  
  // One-Handed Weapons - Tier 4
  { id: "glass-dagger", name: "Glass Dagger", type: "weapon", damage: 4, description: "Assassin's Blade. Razor Sharp: Sneak attacks deal x4 damage.", category: "One-Handed" },
  { id: "glass-sword", name: "Glass Sword", type: "weapon", damage: 4, description: "Finesse. Razor Sharp: Critical Successes deal +3 damage.", category: "One-Handed" },
  { id: "glass-war-axe", name: "Glass War Axe", type: "weapon", damage: 4, description: "Hack & Slash. Razor Sharp: Power Attack bleed deals 2 damage.", category: "One-Handed" },
  
  // One-Handed Weapons - Tier 5
  { id: "ebony-dagger", name: "Ebony Dagger", type: "weapon", damage: 5, description: "Assassin's Blade. Masterfully crafted for a silent, deadly strike.", category: "One-Handed" },
  { id: "ebony-sword", name: "Ebony Sword", type: "weapon", damage: 5, description: "Finesse. A rare and coveted blade, the choice of Jarls.", category: "One-Handed" },
  { id: "ebony-war-axe", name: "Ebony War Axe", type: "weapon", damage: 5, description: "Hack & Slash. Weighted perfectly for devastating chops.", category: "One-Handed" },
  { id: "ebony-mace", name: "Ebony Mace", type: "weapon", damage: 5, description: "Bone Breaker. A dense, terrifyingly effective bludgeon.", category: "One-Handed" },
  { id: "daedric-dagger", name: "Daedric Dagger", type: "weapon", damage: 6, description: "Assassin's Blade. Soul Trap: Spend 2 FP on hit to cast Soul Trap.", category: "One-Handed" },
  { id: "daedric-sword", name: "Daedric Sword", type: "weapon", damage: 6, description: "Finesse. Soul Trap: Spend 2 FP on hit to cast Soul Trap.", category: "One-Handed" },
  { id: "daedric-mace", name: "Daedric Mace", type: "weapon", damage: 6, description: "Bone Breaker. Soul Trap: Spend 2 FP on hit to cast Soul Trap.", category: "One-Handed" },
  { id: "dragonbone-dagger", name: "Dragonbone Dagger", type: "weapon", damage: 6, description: "Assassin's Blade. Dragonslayer: +2 damage against dragons.", category: "One-Handed" },
  { id: "dragonbone-sword", name: "Dragonbone Sword", type: "weapon", damage: 6, description: "Finesse. Dragonslayer: +2 damage against dragons.", category: "One-Handed" },
  
  // Two-Handed Weapons - Tier 1
  { id: "iron-greatsword", name: "Iron Greatsword", type: "weapon", damage: 4, description: "Finesse. The cheapest and most common two-handed weapon.", category: "Two-Handed" },
  { id: "iron-battleaxe", name: "Iron Battleaxe", type: "weapon", damage: 4, description: "Deep Wounds. Favored by bandits and raiders.", category: "Two-Handed" },
  
  // Two-Handed Weapons - Tier 2
  { id: "steel-greatsword", name: "Steel Greatsword", type: "weapon", damage: 5, description: "Finesse. The standard weapon for a heavy infantry soldier.", category: "Two-Handed" },
  { id: "steel-battleaxe", name: "Steel Battleaxe", type: "weapon", damage: 5, description: "Deep Wounds. Well-balanced and reliable.", category: "Two-Handed" },
  { id: "steel-warhammer", name: "Steel Warhammer", type: "weapon", damage: 5, description: "Skullcrusher. A dedicated armor-breaking option.", category: "Two-Handed" },
  
  // Two-Handed Weapons - Tier 3
  { id: "elven-greatsword", name: "Elven Greatsword", type: "weapon", damage: 6, description: "Finesse. Lightweight: Grants +1 to initiative roll.", category: "Two-Handed" },
  { id: "dwarven-battleaxe", name: "Dwarven Battleaxe", type: "weapon", damage: 6, description: "Deep Wounds. Staggering Force: Power Attacks stagger the target.", category: "Two-Handed" },
  { id: "dwarven-warhammer", name: "Dwarven Warhammer", type: "weapon", damage: 6, description: "Skullcrusher. Staggering Force: Power Attacks stagger the target.", category: "Two-Handed" },
  { id: "orcish-greatsword", name: "Orcish Greatsword", type: "weapon", damage: 7, description: "Finesse. Brutal: Power Attacks deal +1 extra damage.", category: "Two-Handed" },
  { id: "orcish-battleaxe", name: "Orcish Battleaxe", type: "weapon", damage: 7, description: "Deep Wounds. Orcish weapons focus on raw power.", category: "Two-Handed" },
  { id: "orcish-warhammer", name: "Orcish Warhammer", type: "weapon", damage: 7, description: "Skullcrusher. The quintessential Orcish weapon.", category: "Two-Handed" },
  
  // Two-Handed Weapons - Tier 4
  { id: "glass-greatsword", name: "Glass Greatsword", type: "weapon", damage: 8, description: "Finesse. Razor Sharp: Critical Success bonus attack deals +1 damage.", category: "Two-Handed" },
  { id: "glass-battleaxe", name: "Glass Battleaxe", type: "weapon", damage: 8, description: "Deep Wounds. Razor Sharp: Power Attack bleed deals 3 damage.", category: "Two-Handed" },
  { id: "glass-warhammer", name: "Glass Warhammer", type: "weapon", damage: 8, description: "Skullcrusher. Razor Sharp: Ignores 3 points of DR.", category: "Two-Handed" },
  
  // Two-Handed Weapons - Tier 5
  { id: "ebony-greatsword", name: "Ebony Greatsword", type: "weapon", damage: 9, description: "Finesse. A perfectly balanced blade of volcanic glass.", category: "Two-Handed" },
  { id: "ebony-battleaxe", name: "Ebony Battleaxe", type: "weapon", damage: 9, description: "Deep Wounds. An executioner's weapon.", category: "Two-Handed" },
  { id: "ebony-warhammer", name: "Ebony Warhammer", type: "weapon", damage: 9, description: "Skullcrusher. Incredibly dense and powerful.", category: "Two-Handed" },
  { id: "daedric-greatsword", name: "Daedric Greatsword", type: "weapon", damage: 10, description: "Finesse. Soul Trap: Spend 2 FP on hit to cast Soul Trap.", category: "Two-Handed" },
  { id: "daedric-battleaxe", name: "Daedric Battleaxe", type: "weapon", damage: 10, description: "Deep Wounds. Soul Trap: Spend 2 FP on hit to cast Soul Trap.", category: "Two-Handed" },
  { id: "daedric-warhammer", name: "Daedric Warhammer", type: "weapon", damage: 10, description: "Skullcrusher. Soul Trap: Spend 2 FP on hit to cast Soul Trap.", category: "Two-Handed" },
  { id: "dragonbone-greatsword", name: "Dragonbone Greatsword", type: "weapon", damage: 10, description: "Finesse. Dragonslayer: +2 damage against dragons.", category: "Two-Handed" },
  { id: "dragonbone-battleaxe", name: "Dragonbone Battleaxe", type: "weapon", damage: 10, description: "Deep Wounds. Dragonslayer: +2 damage against dragons.", category: "Two-Handed" },
  
  // Bows
  { id: "long-bow", name: "Long Bow", type: "weapon", damage: 3, description: "Quick Draw. A basic bow made from yew.", category: "Bow" },
  { id: "forsworn-bow", name: "Forsworn Bow", type: "weapon", damage: 3, description: "Savage. A brutal bow crafted from bone and sinew.", category: "Bow" },
  { id: "hunting-bow", name: "Hunting Bow", type: "weapon", damage: 3, description: "Quick Draw, Lightweight. The preferred weapon of hunters.", category: "Bow" },
  { id: "imperial-bow", name: "Imperial Bow", type: "weapon", damage: 4, description: "Quick Draw, Skirmisher. Standard-issue Imperial Legion weapon.", category: "Bow" },
  { id: "falmer-bow", name: "Falmer Bow", type: "weapon", damage: 4, description: "Envenomed. Made from chaurus chitin.", category: "Bow" },
  { id: "elven-bow", name: "Elven Bow", type: "weapon", damage: 5, description: "Quick Draw, Lightweight. Grants +1 to initiative.", category: "Bow" },
  { id: "orcish-bow", name: "Orcish Bow", type: "weapon", damage: 5, description: "Heavy Draw, Brutal. +1 Power Attack Damage.", category: "Bow" },
  { id: "dwarven-bow", name: "Dwarven Bow", type: "weapon", damage: 6, description: "Long Range, Staggering Force. Power Shot knocks prone.", category: "Bow" },
  { id: "glass-bow", name: "Glass Bow", type: "weapon", damage: 7, description: "Quick Draw, Razor Sharp. +1 Bleed damage.", category: "Bow" },
  { id: "ebony-bow", name: "Ebony Bow", type: "weapon", damage: 8, description: "Quick Draw, Long Range. Perfect for a master sniper.", category: "Bow" },
  { id: "daedric-bow", name: "Daedric Bow", type: "weapon", damage: 9, description: "Quick Draw, Soul Trap. Spend 2 FP on hit to cast Soul Trap.", category: "Bow" },
  { id: "dragonbone-bow", name: "Dragonbone Bow", type: "weapon", damage: 9, description: "Quick Draw, Dragonslayer. +2 damage against dragons.", category: "Bow" },
  
  // Crossbows
  { id: "wood-crossbow", name: "Wood Crossbow", type: "weapon", damage: 4, description: "Piercing Bolt, Reload. A crude, homemade crossbow.", category: "Crossbow" },
  { id: "steel-crossbow", name: "Steel Crossbow", type: "weapon", damage: 5, description: "Piercing Bolt, Reload. Made famous by the Dawnguard.", category: "Crossbow" },
  { id: "hunters-crossbow", name: "Hunter's Crossbow", type: "weapon", damage: 4, description: "Piercing Bolt, Reload, Envenomed. For taking down beasts.", category: "Crossbow" },
  { id: "elven-crossbow", name: "Elven Crossbow", type: "weapon", damage: 5, description: "Piercing Bolt, Reload, Skirmisher. Lightweight design.", category: "Crossbow" },
  { id: "orcish-crossbow", name: "Orcish Crossbow", type: "weapon", damage: 6, description: "Piercing Bolt, Reload, Weighted. Rewards stable firing position.", category: "Crossbow" },
  { id: "dwarven-crossbow", name: "Dwarven Crossbow", type: "weapon", damage: 6, description: "Piercing Bolt, Reload, Staggering Force. Powerful impact.", category: "Crossbow" },
  { id: "glass-crossbow", name: "Glass Crossbow", type: "weapon", damage: 7, description: "Piercing Bolt (Ignores 2 DR), Reload. Exceptional trajectory.", category: "Crossbow" },
  { id: "enhanced-dwarven-crossbow", name: "Enhanced Dwarven Crossbow", type: "weapon", damage: 7, description: "Piercing Bolt, Reload, Staggering Force, Bayonet.", category: "Crossbow" },
  { id: "ebony-crossbow", name: "Ebony Crossbow", type: "weapon", damage: 8, description: "Piercing Bolt (Ignores 2 DR), Reload, Long Range.", category: "Crossbow" },
  { id: "daedric-crossbow", name: "Daedric Crossbow", type: "weapon", damage: 9, description: "Piercing Bolt (Ignores 2 DR), Reload, Soul Trap.", category: "Crossbow" },
  { id: "dragonbone-crossbow", name: "Dragonbone Crossbow", type: "weapon", damage: 9, description: "Breaching (Ignores 3 DR), Reload, Dragonslayer.", category: "Crossbow" },
];

export const officialArmor: EquipmentTemplate[] = [
  // Light Armor
  { id: "fur-armor", name: "Fur Armor", type: "armor", dr: 1, description: "Nordic Insulation: Take 1 less frost damage.", category: "Light" },
  { id: "hide-armor", name: "Hide Armor", type: "armor", dr: 1, description: "Rugged: No special properties. Reliable baseline.", category: "Light" },
  { id: "leather-armor", name: "Leather Armor", type: "armor", dr: 1, description: "Supple: Advantage on Sneak rolls.", category: "Light" },
  { id: "studded-armor", name: "Studded Armor", type: "armor", dr: 1, description: "Reinforced: Grants +1 to maximum HP.", category: "Light" },
  { id: "elven-armor", name: "Elven Armor", type: "armor", dr: 2, description: "Moon-Blessed: Grants +1 to maximum FP.", category: "Light" },
  { id: "chitin-armor", name: "Chitin Armor", type: "armor", dr: 2, description: "Noxious Resilience: Advantage on poison resistance.", category: "Light" },
  { id: "scaled-armor", name: "Scaled Armor", type: "armor", dr: 2, description: "Brutish: -1 Sneak penalty, but grants +1 HP.", category: "Light" },
  { id: "glass-armor", name: "Glass Armor", type: "armor", dr: 3, description: "Crystalline Resonance: Considered unarmored for spells.", category: "Light" },
  { id: "stalhrim-light-armor", name: "Stalhrim Armor (Light)", type: "armor", dr: 3, description: "Enchantment Affinity: Enchantments +1 numerical effect.", category: "Light" },
  { id: "dragonscale-armor", name: "Dragonscale Armor", type: "armor", dr: 4, description: "Dragon's Bane: Half damage from dragon breath.", category: "Light" },
  
  // Heavy Armor
  { id: "iron-armor", name: "Iron Armor", type: "armor", dr: 2, description: "Clumsy & Loud: Disadvantage on all Sneak rolls.", category: "Heavy" },
  { id: "banded-iron-armor", name: "Banded Iron Armor", type: "armor", dr: 2, description: "Tougher: Grants +1 HP. Disadvantage on Sneak rolls.", category: "Heavy" },
  { id: "imperial-armor", name: "Imperial Armor", type: "armor", dr: 2, description: "Legion Discipline: +1 Guile on Intimidation. Disadvantage on Sneak.", category: "Heavy" },
  { id: "steel-armor", name: "Steel Armor", type: "armor", dr: 3, description: "Soldier's Standard: Imposes -2 Sneak penalty.", category: "Heavy" },
  { id: "bonemold-armor", name: "Bonemold Armor", type: "armor", dr: 3, description: "Ash Resistance: Advantage vs ash/blight, -1 fire damage. -2 Sneak.", category: "Heavy" },
  { id: "steel-plate-armor", name: "Steel Plate Armor", type: "armor", dr: 4, description: "Masterwork: Imposes only -1 Sneak penalty.", category: "Heavy" },
  { id: "dwarven-armor", name: "Dwarven Armor", type: "armor", dr: 4, description: "Dwemer Resilience: Immune to poisons. -1 Sneak penalty.", category: "Heavy" },
  { id: "orcish-armor", name: "Orcish Armor", type: "armor", dr: 4, description: "Intimidating Presence: +2 Guile on Intimidation. Disadvantage on Sneak.", category: "Heavy" },
  { id: "ebony-armor", name: "Ebony Armor", type: "armor", dr: 5, description: "Night's Embrace: No penalty on Sneak rolls.", category: "Heavy" },
  { id: "stalhrim-heavy-armor", name: "Stalhrim Armor (Heavy)", type: "armor", dr: 5, description: "Enchantment Affinity: Enchantments +1 numerical effect. -1 Sneak.", category: "Heavy" },
  { id: "dragonplate-armor", name: "Dragonplate Armor", type: "armor", dr: 6, description: "Dragon's Bane: Half damage from dragon breath. Disadvantage on Sneak.", category: "Heavy" },
  { id: "daedric-armor", name: "Daedric Armor", type: "armor", dr: 6, description: "Terrifying Visage: Cause Fear. -2 on non-Intimidation social rolls. -1 Sneak.", category: "Heavy" },
];

export const officialShields: EquipmentTemplate[] = [
  { id: "hide-shield", name: "Hide Shield", type: "shield", dr: 2, description: "Bashing Shield: Shield Bash costs 0 FP.", category: "Light" },
  { id: "iron-shield", name: "Iron Shield", type: "shield", dr: 2, description: "Bashing Shield: Shield Bash costs 0 FP.", category: "Light" },
  { id: "steel-shield", name: "Steel Shield", type: "shield", dr: 2, description: "The reliable standard for any warrior.", category: "Standard" },
  { id: "elven-shield", name: "Elven Shield", type: "shield", dr: 2, description: "Arcane Guard: +1 DR against spells when braced.", category: "Standard" },
  { id: "dwarven-shield", name: "Dwarven Shield", type: "shield", dr: 3, description: "Shield Wall: Bracing doesn't use Minor Action.", category: "Heavy" },
  { id: "orcish-shield", name: "Orcish Shield", type: "shield", dr: 3, description: "Spiked Shield: Attacker takes 1 damage when you brace.", category: "Heavy" },
  { id: "ebony-shield", name: "Ebony Shield", type: "shield", dr: 3, description: "Absorbing: Regain 1 FP when hit by spell while braced.", category: "Heavy" },
  { id: "daedric-shield", name: "Daedric Shield", type: "shield", dr: 4, description: "Daedric Ward: Half elemental damage when braced.", category: "Heavy" },
];

export const allOfficialEquipment = [
  ...officialWeapons,
  ...officialArmor,
  ...officialShields,
];
