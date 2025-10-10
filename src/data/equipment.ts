// Official equipment database from Skyrim TTRPG
export interface OfficialEquipment {
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'clothing';
  damage?: number;
  dr?: number;
  properties?: string[];
  description: string;
}

export const officialEquipment: OfficialEquipment[] = [
  // ARMOR - Clothing & Robes
  { name: "Common Clothes", type: "clothing", dr: 0, description: "No special properties" },
  { name: "Tavern Clothes", type: "clothing", dr: 0, description: "Gregarious: +1 to Guile in inns/taverns" },
  { name: "Fine Clothes", type: "clothing", dr: 0, description: "Well-Dressed: +2 to Guile in formal settings" },
  { name: "Blacksmith's Apron", type: "clothing", dr: 0, description: "Artisan: +1 to Might on Smithing checks" },
  { name: "Novice Robes", type: "clothing", dr: 0, description: "Magicka Font: +1 max FP" },
  { name: "Apprentice Robes", type: "clothing", dr: 0, description: "School Attunement: -1 FP cost for chosen school" },
  { name: "Adept Robes", type: "clothing", dr: 0, description: "Greater Attunement: -1 FP for Novice/Apprentice/Adept spells" },
  { name: "Expert Robes", type: "clothing", dr: 0, description: "Potent Casting: +1 damage from chosen school" },
  { name: "Master Robes", type: "clothing", dr: 0, description: "Magical Supremacy: Combined Adept + Expert benefits" },
  
  // ARMOR - Light
  { name: "Fur Armor", type: "armor", dr: 1, description: "Nordic Insulation: -1 frost damage, can halve one frost attack per adventure" },
  { name: "Hide Armor", type: "armor", dr: 1, description: "Rugged: No special properties" },
  { name: "Leather Armor", type: "armor", dr: 1, description: "Supple: Advantage on Sneak rolls" },
  { name: "Studded Armor", type: "armor", dr: 1, description: "Reinforced: +1 max HP" },
  { name: "Elven Armor", type: "armor", dr: 2, description: "Moon-Blessed: +1 max FP" },
  { name: "Chitin Armor", type: "armor", dr: 2, description: "Noxious Resilience: Advantage vs poisons" },
  { name: "Scaled Armor", type: "armor", dr: 2, description: "Brutish: -1 to Sneak, +1 max HP" },
  { name: "Glass Armor", type: "armor", dr: 3, description: "Crystalline Resonance: Counts as unarmored for flesh spells" },
  { name: "Stalhrim Armor (Light)", type: "armor", dr: 3, description: "Enchantment Affinity: +1 to enchantment effects" },
  { name: "Dragonscale Armor", type: "armor", dr: 4, description: "Dragon's Bane: Half damage from dragon breath" },
  
  // ARMOR - Heavy
  { name: "Iron Armor", type: "armor", dr: 2, description: "Clumsy & Loud: Disadvantage on Sneak rolls" },
  { name: "Banded Iron Armor", type: "armor", dr: 2, description: "Tougher: +1 max HP, Disadvantage on Sneak" },
  { name: "Imperial Armor", type: "armor", dr: 2, description: "Legion Discipline: +1 to Guile on Intimidation, Disadvantage on Sneak" },
  { name: "Steel Armor", type: "armor", dr: 3, description: "Soldier's Standard: -2 penalty to Sneak TN" },
  { name: "Bonemold Armor", type: "armor", dr: 3, description: "Ash Resistance: Advantage vs ash/blight, -1 fire damage, -2 Sneak TN" },
  { name: "Steel Plate Armor", type: "armor", dr: 4, description: "Masterwork: -1 penalty to Sneak TN" },
  { name: "Dwarven Armor", type: "armor", dr: 4, description: "Dwemer Resilience: Immune to poison, Advantage vs disease, -1 Sneak TN" },
  { name: "Orcish Armor", type: "armor", dr: 4, description: "Intimidating Presence: +2 to Guile on Intimidation, Disadvantage on Sneak" },
  { name: "Ebony Armor", type: "armor", dr: 5, description: "Night's Embrace: No penalty on Sneak rolls" },
  { name: "Stalhrim Armor (Heavy)", type: "armor", dr: 5, description: "Enchantment Affinity: +1 to enchantment effects, -1 Sneak TN" },
  { name: "Dragonplate Armor", type: "armor", dr: 6, description: "Dragon's Bane: Half damage from dragon breath, Disadvantage on Sneak" },
  { name: "Daedric Armor", type: "armor", dr: 6, description: "Terrifying Visage: Cause fear in one enemy, -2 non-Intimidation social rolls, -1 Sneak TN" },
  
  // SHIELDS
  { name: "Hide Shield", type: "shield", dr: 2, description: "Bashing Shield: Shield Bash costs 0 FP" },
  { name: "Iron Shield", type: "shield", dr: 2, description: "Bashing Shield: Shield Bash costs 0 FP" },
  { name: "Steel Shield", type: "shield", dr: 2, description: "Standard shield for any warrior" },
  { name: "Elven Shield", type: "shield", dr: 2, description: "Arcane Guard: +1 DR vs spells when braced" },
  { name: "Dwarven Shield", type: "shield", dr: 3, description: "Shield Wall: Bracing doesn't use Minor Action" },
  { name: "Orcish Shield", type: "shield", dr: 3, description: "Spiked Shield: Attacker takes 1 damage when you brace and are hit" },
  { name: "Ebony Shield", type: "shield", dr: 3, description: "Absorbing: Regain 1 FP when braced and hit by spell" },
  { name: "Daedric Shield", type: "shield", dr: 4, description: "Daedric Ward: Half elemental damage when braced" },
  
  // WEAPONS - One-Handed Daggers
  { name: "Iron Dagger", type: "weapon", damage: 2, description: "Assassin's Blade: x3 damage from sneak" },
  { name: "Steel Dagger", type: "weapon", damage: 2, description: "Assassin's Blade: x3 damage from sneak" },
  { name: "Elven Dagger", type: "weapon", damage: 3, description: "Assassin's Blade + Lightweight: +1 initiative" },
  { name: "Orcish Dagger", type: "weapon", damage: 3, description: "Assassin's Blade + Brutal: Power Attacks +1 damage" },
  { name: "Glass Dagger", type: "weapon", damage: 4, description: "Razor Sharp: x4 sneak damage" },
  { name: "Ebony Dagger", type: "weapon", damage: 5, description: "Assassin's Blade: x3 damage from sneak" },
  { name: "Daedric Dagger", type: "weapon", damage: 6, description: "Assassin's Blade + Soul Trap (2 FP)" },
  { name: "Dragonbone Dagger", type: "weapon", damage: 6, description: "Assassin's Blade + Dragonslayer: +2 vs dragons" },
  
  // WEAPONS - One-Handed Swords
  { name: "Iron Sword", type: "weapon", damage: 2, description: "Finesse: Crit (1) deals +2 damage" },
  { name: "Steel Sword", type: "weapon", damage: 3, description: "Finesse: Crit (1) deals +2 damage" },
  { name: "Elven Sword", type: "weapon", damage: 3, description: "Finesse + Lightweight: +1 initiative" },
  { name: "Glass Sword", type: "weapon", damage: 4, description: "Finesse Razor Sharp: Crit deals +3 damage" },
  { name: "Ebony Sword", type: "weapon", damage: 5, description: "Finesse: Crit (1) deals +2 damage" },
  { name: "Daedric Sword", type: "weapon", damage: 6, description: "Finesse + Soul Trap (2 FP)" },
  { name: "Dragonbone Sword", type: "weapon", damage: 6, description: "Finesse + Dragonslayer: +2 vs dragons" },
  
  // WEAPONS - One-Handed War Axes
  { name: "Iron War Axe", type: "weapon", damage: 2, description: "Hack & Slash: Power Attack causes 1 bleed" },
  { name: "Steel War Axe", type: "weapon", damage: 3, description: "Hack & Slash: Power Attack causes 1 bleed" },
  { name: "Dwarven War Axe", type: "weapon", damage: 3, description: "Hack & Slash + Staggering Force: Power Attack staggers" },
  { name: "Orcish War Axe", type: "weapon", damage: 4, description: "Hack & Slash: Power Attack causes 1 bleed" },
  { name: "Glass War Axe", type: "weapon", damage: 4, description: "Razor Sharp: Power Attack bleed deals 2 damage" },
  { name: "Ebony War Axe", type: "weapon", damage: 5, description: "Hack & Slash: Power Attack causes 1 bleed" },
  { name: "Daedric War Axe", type: "weapon", damage: 6, description: "Hack & Slash + Soul Trap (2 FP)" },
  
  // WEAPONS - One-Handed Maces
  { name: "Iron Mace", type: "weapon", damage: 2, description: "Bone Breaker: Ignore 1 DR" },
  { name: "Steel Mace", type: "weapon", damage: 3, description: "Bone Breaker: Ignore 1 DR" },
  { name: "Dwarven Mace", type: "weapon", damage: 3, description: "Bone Breaker + Staggering Force: Power Attack staggers" },
  { name: "Orcish Mace", type: "weapon", damage: 4, description: "Bone Breaker: Ignore 1 DR" },
  { name: "Ebony Mace", type: "weapon", damage: 5, description: "Bone Breaker: Ignore 1 DR" },
  { name: "Daedric Mace", type: "weapon", damage: 6, description: "Bone Breaker + Soul Trap (2 FP)" },
  
  // WEAPONS - Two-Handed Greatswords
  { name: "Iron Greatsword", type: "weapon", damage: 4, description: "Finesse: Crit (1) grants free second attack" },
  { name: "Steel Greatsword", type: "weapon", damage: 5, description: "Finesse: Crit (1) grants free second attack" },
  { name: "Elven Greatsword", type: "weapon", damage: 6, description: "Finesse + Lightweight: +1 initiative" },
  { name: "Orcish Greatsword", type: "weapon", damage: 7, description: "Finesse + Brutal: Power Attacks +1 damage" },
  { name: "Glass Greatsword", type: "weapon", damage: 8, description: "Razor Sharp: Free attack on crit deals +1 damage" },
  { name: "Ebony Greatsword", type: "weapon", damage: 9, description: "Finesse: Crit (1) grants free second attack" },
  { name: "Daedric Greatsword", type: "weapon", damage: 10, description: "Finesse + Soul Trap (2 FP)" },
  { name: "Dragonbone Greatsword", type: "weapon", damage: 10, description: "Finesse + Dragonslayer: +2 vs dragons" },
  
  // WEAPONS - Two-Handed Battleaxes
  { name: "Iron Battleaxe", type: "weapon", damage: 4, description: "Deep Wounds: Power Attack causes 2 bleed" },
  { name: "Steel Battleaxe", type: "weapon", damage: 5, description: "Deep Wounds: Power Attack causes 2 bleed" },
  { name: "Dwarven Battleaxe", type: "weapon", damage: 6, description: "Deep Wounds + Staggering Force: Power Attack staggers" },
  { name: "Orcish Battleaxe", type: "weapon", damage: 7, description: "Deep Wounds: Power Attack causes 2 bleed" },
  { name: "Glass Battleaxe", type: "weapon", damage: 8, description: "Razor Sharp: Power Attack bleed deals 3 damage" },
  { name: "Ebony Battleaxe", type: "weapon", damage: 9, description: "Deep Wounds: Power Attack causes 2 bleed" },
  { name: "Daedric Battleaxe", type: "weapon", damage: 10, description: "Deep Wounds + Soul Trap (2 FP)" },
  { name: "Dragonbone Battleaxe", type: "weapon", damage: 10, description: "Deep Wounds + Dragonslayer: +2 vs dragons" },
  
  // WEAPONS - Two-Handed Warhammers
  { name: "Steel Warhammer", type: "weapon", damage: 5, description: "Skullcrusher: Ignore 2 DR" },
  { name: "Dwarven Warhammer", type: "weapon", damage: 6, description: "Skullcrusher + Staggering Force: Power Attack staggers" },
  { name: "Orcish Warhammer", type: "weapon", damage: 7, description: "Skullcrusher: Ignore 2 DR" },
  { name: "Glass Warhammer", type: "weapon", damage: 8, description: "Razor Sharp: Ignore 3 DR" },
  { name: "Ebony Warhammer", type: "weapon", damage: 9, description: "Skullcrusher: Ignore 2 DR" },
  { name: "Daedric Warhammer", type: "weapon", damage: 10, description: "Skullcrusher + Soul Trap (2 FP)" },
  
  // WEAPONS - Bows
  { name: "Long Bow", type: "weapon", damage: 3, description: "Quick Draw: Eagle Eye costs 0 FP" },
  { name: "Forsworn Bow", type: "weapon", damage: 3, description: "Savage: Crit causes 2 bleed for 1 turn" },
  { name: "Hunting Bow", type: "weapon", damage: 3, description: "Quick Draw + Lightweight: No Sneak penalty" },
  { name: "Imperial Bow", type: "weapon", damage: 4, description: "Quick Draw + Skirmisher: No penalty at melee range" },
  { name: "Ancient Nord Bow", type: "weapon", damage: 4, description: "Heavy Draw: +1 damage, -1 initiative" },
  { name: "Falmer Bow", type: "weapon", damage: 4, description: "Envenomed: Apply poison as free action" },
  { name: "Elven Bow", type: "weapon", damage: 5, description: "Quick Draw + Lightweight: +1 initiative" },
  { name: "Orcish Bow", type: "weapon", damage: 5, description: "Heavy Draw + Brutal: +1 damage, -1 initiative, Power Attack +1" },
  { name: "Dwarven Bow", type: "weapon", damage: 6, description: "Long Range + Staggering: Advantage at max range, Power Shot knocks prone" },
  { name: "Glass Bow", type: "weapon", damage: 7, description: "Quick Draw + Razor Sharp: +1 bleed damage" },
  { name: "Ebony Bow", type: "weapon", damage: 8, description: "Quick Draw + Long Range: Advantage at max range" },
  { name: "Daedric Bow", type: "weapon", damage: 9, description: "Quick Draw + Soul Trap (2 FP)" },
  { name: "Dragonbone Bow", type: "weapon", damage: 9, description: "Quick Draw + Dragonslayer: +2 vs dragons" },
  
  // WEAPONS - Crossbows
  { name: "Wood Crossbow", type: "weapon", damage: 4, description: "Piercing Bolt: Ignore 1 DR, Reload (Minor Action)" },
  { name: "Steel Crossbow", type: "weapon", damage: 5, description: "Piercing Bolt: Ignore 1 DR, Reload (Minor Action)" },
  { name: "Hunter's Crossbow", type: "weapon", damage: 4, description: "Piercing + Envenomed: Apply poison as free action, Reload" },
  { name: "Elven Crossbow", type: "weapon", damage: 5, description: "Piercing + Skirmisher: No penalty at melee range, Reload" },
  { name: "Orcish Crossbow", type: "weapon", damage: 6, description: "Piercing + Weighted: +1 damage if stationary, Reload" },
  { name: "Dwarven Crossbow", type: "weapon", damage: 6, description: "Piercing + Staggering: Spend 1 FP to stagger, Reload" },
  { name: "Glass Crossbow", type: "weapon", damage: 7, description: "Piercing Bolt: Ignore 2 DR, Reload" },
  { name: "Enhanced Dwarven Crossbow", type: "weapon", damage: 7, description: "Piercing + Staggering + Bayonet (2 melee dmg), Reload" },
  { name: "Ebony Crossbow", type: "weapon", damage: 8, description: "Piercing (Ignore 2 DR) + Long Range: Advantage at max range, Reload" },
  { name: "Daedric Crossbow", type: "weapon", damage: 9, description: "Piercing (Ignore 2 DR) + Soul Trap (2 FP), Reload" },
  { name: "Dragonbone Crossbow", type: "weapon", damage: 9, description: "Breaching: Ignore 3 DR, Dragonslayer +2 vs dragons, Reload" },
];
