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
  { name: "Novice Robes", type: "clothing", dr: 0, description: "Magicka Font: +2 to your maximum FP" },
  { name: "Apprentice Robes", type: "clothing", dr: 0, description: "School Attunement: -1 FP cost for Novice/Apprentice spells from chosen school (min 1)" },
  { name: "Adept Robes", type: "clothing", dr: 0, description: "Greater Attunement: As Apprentice Robes, but also reduces Adept spell costs from chosen school by 1" },
  { name: "Expert Robes", type: "clothing", dr: 0, description: "Potent Casting: Spells from chosen school deal +3 damage (or Healing/Effect)" },
  { name: "Master Robes", type: "clothing", dr: 0, description: "Magical Supremacy: Combines Adept and Expert robe benefits for chosen school" },

  // ARMOR - Light
  { name: "Fur Armor", type: "armor", dr: 1, description: "Nordic Insulation: Take 1 less damage from frost; can halve one frost attack per adventure" },
  { name: "Hide Armor", type: "armor", dr: 1, description: "Rugged: No special properties" },
  { name: "Leather Armor", type: "armor", dr: 1, description: "Supple: Advantage on Sneak rolls" },
  { name: "Studded Armor", type: "armor", dr: 1, description: "Reinforced: +1 max HP" },
  { name: "Elven Armor", type: "armor", dr: 2, description: "Moon-Blessed: +1 max FP" },
  { name: "Chitin Armor", type: "armor", dr: 2, description: "Noxious Resilience: Advantage on rolls to resist poisons" },
  { name: "Scaled Armor", type: "armor", dr: 2, description: "Brutish: -1 penalty to Sneak rolls, +1 max HP" },
  { name: "Glass Armor", type: "armor", dr: 3, description: "Crystalline Resonance: Counts as unarmored for flesh spells (Oakflesh, etc.)" },
  { name: "Stalhrim Armor (Light)", type: "armor", dr: 3, description: "Enchantment Affinity: Enchantment numerical effects are increased by 1" },
  { name: "Dragonscale Armor", type: "armor", dr: 4, description: "Dragon's Bane: Take half damage from all dragon breath attacks" },

  // ARMOR - Heavy
  { name: "Iron Armor", type: "armor", dr: 2, description: "Clumsy & Loud: Disadvantage on all Sneak rolls" },
  { name: "Banded Iron Armor", type: "armor", dr: 2, description: "Tougher: +1 max HP; Disadvantage on Sneak rolls" },
  { name: "Imperial Armor", type: "armor", dr: 2, description: "Legion Discipline: +1 to Guile on Intimidation checks; Disadvantage on Sneak rolls" },
  { name: "Steel Armor", type: "armor", dr: 3, description: "Soldier's Standard: -2 penalty to Sneak Target Number" },
  { name: "Bonemold Armor", type: "armor", dr: 3, description: "Ash Resistance: Advantage vs ash/blight, take 1 less fire damage; -2 to Sneak TN" },
  { name: "Steel Plate Armor", type: "armor", dr: 4, description: "Masterwork: Only -1 penalty to Sneak Target Number" },
  { name: "Dwarven Armor", type: "armor", dr: 4, description: "Dwemer Resilience: Immune to poison, Advantage vs disease; -1 to Sneak TN" },
  { name: "Orcish Armor", type: "armor", dr: 4, description: "Intimidating Presence: +2 to Guile on Intimidation rolls; Disadvantage on Sneak rolls" },
  { name: "Ebony Armor", type: "armor", dr: 5, description: "Night's Embrace: No penalty on Sneak rolls" },
  { name: "Stalhrim Armor (Heavy)", type: "armor", dr: 5, description: "Enchantment Affinity: Enchantment numerical effects increased by 1; -1 to Sneak TN" },
  { name: "Dragonplate Armor", type: "armor", dr: 6, description: "Dragon's Bane: Take half damage from all dragon breath attacks; Disadvantage on Sneak rolls" },
  { name: "Daedric Armor", type: "armor", dr: 6, description: "Terrifying Visage: Cause Fear in one enemy at combat start; -2 on non-Intimidation social rolls; -1 to Sneak TN" },

  // SHIELDS — dr field = bracing bonus (DR gained when using the Brace Minor Action)
  { name: "Hide Shield", type: "shield", dr: 1, description: "The reliable standard for any warrior" },
  { name: "Iron Shield", type: "shield", dr: 1, description: "Bashing Shield: Shield Bash costs 0 FP" },
  { name: "Steel Shield", type: "shield", dr: 2, description: "Bashing Shield: Shield Bash costs 0 FP" },
  { name: "Elven Shield", type: "shield", dr: 2, description: "Arcane Guard: When you brace, gain +1 DR against spells until your next turn" },
  { name: "Dwarven Shield", type: "shield", dr: 3, description: "Shield Wall: Bracing does not use your Minor Action" },
  { name: "Orcish Shield", type: "shield", dr: 3, description: "Spiked Shield: When you brace and are hit by a melee attack, the attacker takes 1 damage" },
  { name: "Ebony Shield", type: "shield", dr: 4, description: "Absorbing: When you brace and are hit by a spell, regain 1 FP" },
  { name: "Daedric Shield", type: "shield", dr: 5, description: "Daedric Ward: When you brace, gain resistance to elemental damage (half damage)" },
  { name: "Dragon Shield", type: "shield", dr: 5, description: "Dragonguard: When you brace, gain +2 DR against Dragons" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — One-Handed Daggers  (Assassin's Blade: x3 sneak damage)
  // Tier 1 (Iron 3), Tier 2 (Steel 4), Tier 3 Racial (Elven 6, Orcish 7),
  // Tier 4 Exotic (Glass 8), Tier 5 Legendary (Ebony/Daedric/Dragonbone 12)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron Dagger", type: "weapon", damage: 3, description: "Assassin's Blade: x3 damage on a successful Sneak attack" },
  { name: "Steel Dagger", type: "weapon", damage: 4, description: "Assassin's Blade: x3 damage on a successful Sneak attack" },
  { name: "Elven Dagger", type: "weapon", damage: 6, description: "Assassin's Blade + Lightweight: -1 to initiative roll at start of combat" },
  { name: "Orcish Dagger", type: "weapon", damage: 7, description: "Assassin's Blade + Brutal: Power Attacks deal an additional +1 damage" },
  { name: "Glass Dagger", type: "weapon", damage: 8, description: "Razor Sharp: Sneak attacks deal quadruple (x4) damage instead of triple" },
  { name: "Ebony Dagger", type: "weapon", damage: 12, description: "Assassin's Blade: x3 damage on a successful Sneak attack" },
  { name: "Daedric Dagger", type: "weapon", damage: 12, description: "Assassin's Blade + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },
  { name: "Dragonbone Dagger", type: "weapon", damage: 12, description: "Assassin's Blade + Dragonslayer: +2 damage against dragons" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — One-Handed Swords  (Finesse: Crit on 1 deals +2 damage)
  // Tier 1 (Iron 4), Tier 2 (Steel 6), Tier 3 (Elven 8),
  // Tier 4 (Glass 10), Tier 5 (Ebony 14, Daedric 15, Dragonbone 16)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron Sword", type: "weapon", damage: 4, description: "Finesse: On a Critical Success (roll of 1), deal an additional +2 damage" },
  { name: "Steel Sword", type: "weapon", damage: 6, description: "Finesse: On a Critical Success (roll of 1), deal an additional +2 damage" },
  { name: "Elven Sword", type: "weapon", damage: 8, description: "Finesse + Lightweight: Grants -1 to initiative roll at start of combat" },
  { name: "Glass Sword", type: "weapon", damage: 10, description: "Finesse + Razor Sharp: Critical Successes deal +3 damage instead of +2" },
  { name: "Ebony Sword", type: "weapon", damage: 14, description: "Finesse: On a Critical Success (roll of 1), deal an additional +2 damage" },
  { name: "Daedric Sword", type: "weapon", damage: 15, description: "Finesse + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },
  { name: "Dragonbone Sword", type: "weapon", damage: 16, description: "Finesse + Dragonslayer: +2 damage against dragons" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — One-Handed War Axes  (Hack & Slash: Power Attack causes 1 Bleed)
  // Tier 1 (Iron 5), Tier 2 (Steel 7), Tier 3 (Dwarven 9, Orcish 9),
  // Tier 4 (Glass 11), Tier 5 (Ebony 15, Daedric ~15)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron War Axe", type: "weapon", damage: 5, description: "Hack & Slash: Power Attack also causes target to take 1 Bleed at start of their next turn" },
  { name: "Steel War Axe", type: "weapon", damage: 7, description: "Hack & Slash: Power Attack also causes target to take 1 Bleed at start of their next turn" },
  { name: "Dwarven War Axe", type: "weapon", damage: 9, description: "Hack & Slash + Staggering Force: Power Attack staggers the target (loses next Major Action)" },
  { name: "Orcish War Axe", type: "weapon", damage: 9, description: "Hack & Slash: Orcish weapons focus on raw power over finesse" },
  { name: "Glass War Axe", type: "weapon", damage: 11, description: "Razor Sharp: Power Attack bleed deals 2 damage instead of 1" },
  { name: "Ebony War Axe", type: "weapon", damage: 15, description: "Hack & Slash: Power Attack also causes target to take 1 Bleed at start of their next turn" },
  { name: "Daedric War Axe", type: "weapon", damage: 15, description: "Hack & Slash + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — One-Handed Maces  (Bone Breaker: Ignore 1 DR)
  // Tier 1 (Iron 5), Tier 2 (Steel 7), Tier 3 (Dwarven 9, Orcish 9),
  // Tier 5 (Ebony 15, Daedric 16)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron Mace", type: "weapon", damage: 5, description: "Bone Breaker: Attacks ignore 1 point of the target's Damage Reduction" },
  { name: "Steel Mace", type: "weapon", damage: 7, description: "Bone Breaker: Attacks ignore 1 point of the target's Damage Reduction" },
  { name: "Dwarven Mace", type: "weapon", damage: 9, description: "Bone Breaker + Staggering Force: Power Attack staggers the target (loses next Major Action)" },
  { name: "Orcish Mace", type: "weapon", damage: 9, description: "Bone Breaker: Attacks ignore 1 point of the target's Damage Reduction" },
  { name: "Ebony Mace", type: "weapon", damage: 15, description: "Bone Breaker: Attacks ignore 1 point of the target's Damage Reduction" },
  { name: "Daedric Mace", type: "weapon", damage: 16, description: "Bone Breaker + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — Two-Handed Greatswords  (Finesse: Crit grants free second attack)
  // Tier 1 (Iron 6), Tier 2 (Steel 9), Tier 3 (Elven 11, Orcish 13),
  // Tier 4 (Glass 15), Tier 5 (Ebony 17, Daedric 20, Dragonbone 22)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron Greatsword", type: "weapon", damage: 6, description: "Finesse: On a Critical Success (roll of 1), immediately make a free second attack against the same target" },
  { name: "Steel Greatsword", type: "weapon", damage: 9, description: "Finesse: On a Critical Success (roll of 1), immediately make a free second attack against the same target" },
  { name: "Elven Greatsword", type: "weapon", damage: 11, description: "Finesse + Lightweight: +1 to initiative roll at start of combat" },
  { name: "Orcish Greatsword", type: "weapon", damage: 13, description: "Finesse + Brutal: Power Attacks deal an additional +1 damage" },
  { name: "Glass Greatsword", type: "weapon", damage: 15, description: "Razor Sharp: The free attack from a Critical Success deals an additional +1 damage" },
  { name: "Ebony Greatsword", type: "weapon", damage: 17, description: "Finesse: On a Critical Success (roll of 1), immediately make a free second attack against the same target" },
  { name: "Daedric Greatsword", type: "weapon", damage: 20, description: "Finesse + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },
  { name: "Dragonbone Greatsword", type: "weapon", damage: 22, description: "Finesse + Dragonslayer: +2 damage against dragons" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — Two-Handed Battleaxes  (Deep Wounds: Power Attack causes 2 Bleed)
  // Tier 1 (Iron 7), Tier 2 (Steel 10), Tier 3 (Dwarven 13, Orcish 13),
  // Tier 4 (Glass 15), Tier 5 (Ebony 17, Daedric 20, Dragonbone 24)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron Battleaxe", type: "weapon", damage: 7, description: "Deep Wounds: Power Attack causes target to take 2 Bleed damage at start of their next turn" },
  { name: "Steel Battleaxe", type: "weapon", damage: 10, description: "Deep Wounds: Power Attack causes target to take 2 Bleed damage at start of their next turn" },
  { name: "Dwarven Battleaxe", type: "weapon", damage: 13, description: "Deep Wounds + Staggering Force: Power Attack staggers the target (loses next Major Action)" },
  { name: "Orcish Battleaxe", type: "weapon", damage: 13, description: "Deep Wounds: Orcish weapons are heavier, granting higher base damage" },
  { name: "Glass Battleaxe", type: "weapon", damage: 15, description: "Razor Sharp: Power Attack bleed deals 3 damage instead of 2" },
  { name: "Ebony Battleaxe", type: "weapon", damage: 17, description: "Deep Wounds: Power Attack causes target to take 2 Bleed damage at start of their next turn" },
  { name: "Daedric Battleaxe", type: "weapon", damage: 20, description: "Deep Wounds + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },
  { name: "Dragonbone Battleaxe", type: "weapon", damage: 24, description: "Deep Wounds + Dragonslayer: +2 damage against dragons" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — Two-Handed Warhammers  (Skullcrusher: Ignore 2 DR)
  // Tier 1 (Iron 8), Tier 2 (Steel 11), Tier 3 (Dwarven 14, Orcish 14),
  // Tier 4 (Glass 16), Tier 5 (Ebony 18, Daedric 22)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Iron Warhammer", type: "weapon", damage: 8, description: "Skullcrusher: Attacks ignore 2 points of the target's Damage Reduction" },
  { name: "Steel Warhammer", type: "weapon", damage: 11, description: "Skullcrusher: Attacks ignore 2 points of the target's Damage Reduction" },
  { name: "Dwarven Warhammer", type: "weapon", damage: 14, description: "Skullcrusher + Staggering Force: Power Attack staggers the target (loses next Major Action)" },
  { name: "Orcish Warhammer", type: "weapon", damage: 14, description: "Skullcrusher: The quintessential Orcish weapon for breaking shield walls" },
  { name: "Glass Warhammer", type: "weapon", damage: 16, description: "Razor Sharp: Now ignores 3 points of DR instead of 2" },
  { name: "Ebony Warhammer", type: "weapon", damage: 18, description: "Skullcrusher: Attacks ignore 2 points of the target's Damage Reduction" },
  { name: "Daedric Warhammer", type: "weapon", damage: 22, description: "Skullcrusher + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — Bows  (Quick Draw: Eagle Eye costs 0 FP)
  // Tier 1 (Long Bow 4, Forsworn 5), Tier 2 (Hunting 6, Imperial 7, Ancient Nord 8),
  // Tier 3 (Falmer 9, Elven 9, Orcish 10, Dwarven 10),
  // Tier 4-5 (Glass 12, Ebony 14, Daedric 16, Dragonbone 16)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Long Bow", type: "weapon", damage: 4, description: "Quick Draw: Using Eagle Eye perk (spending FP to aim) costs 0 FP" },
  { name: "Forsworn Bow", type: "weapon", damage: 5, description: "Savage: On a Critical Success, target takes 2 Bleed damage at start of their next turn" },
  { name: "Hunting Bow", type: "weapon", damage: 6, description: "Quick Draw + Lightweight: No Sneak roll penalty" },
  { name: "Imperial Bow", type: "weapon", damage: 7, description: "Quick Draw + Skirmisher: No Disadvantage when firing at a target in melee range" },
  { name: "Ancient Nord Bow", type: "weapon", damage: 8, description: "Heavy Draw: +1 damage, but -1 to initiative roll at start of combat" },
  { name: "Falmer Bow", type: "weapon", damage: 9, description: "Envenomed: Apply a poison to this bow as a Free Action instead of a Minor Action" },
  { name: "Elven Bow", type: "weapon", damage: 9, description: "Quick Draw + Lightweight: +1 to initiative roll at start of combat" },
  { name: "Orcish Bow", type: "weapon", damage: 10, description: "Heavy Draw + Brutal: +1 damage, -1 initiative; Power Attacks deal +1 damage" },
  { name: "Dwarven Bow", type: "weapon", damage: 10, description: "Long Range + Staggering Force: Advantage at max range; Power Shot can knock prone" },
  { name: "Glass Bow", type: "weapon", damage: 12, description: "Quick Draw + Razor Sharp: Shots cause 1 Bleed damage on hit" },
  { name: "Ebony Bow", type: "weapon", damage: 14, description: "Quick Draw + Long Range: Advantage on attack rolls at furthest range" },
  { name: "Daedric Bow", type: "weapon", damage: 16, description: "Quick Draw + Soul Trap: As a free action on hit, spend 3 FP to cast Soul Trap" },
  { name: "Dragonbone Bow", type: "weapon", damage: 16, description: "Quick Draw + Dragonslayer: +2 damage against dragons" },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAPONS — Crossbows  (Reload: must reload as Minor Action after each shot)
  // All crossbows have Piercing Bolt (ignore 1 DR) unless noted otherwise
  // Tier 1 (Wood 5), Tier 2 (Steel 9, Hunter's 7),
  // Tier 3 (Elven 11, Orcish 12, Dwarven 12),
  // Tier 4 (Glass 14, Enhanced Dwarven 16), Tier 5 (Ebony 18, Daedric 20, Dragonbone 20)
  // ─────────────────────────────────────────────────────────────────────────
  { name: "Wood Crossbow", type: "weapon", damage: 5, description: "Piercing Bolt: Ignore 1 DR; Reload (Minor Action after each shot)" },
  { name: "Steel Crossbow", type: "weapon", damage: 9, description: "Piercing Bolt: Ignore 1 DR; Reload (Minor Action after each shot)" },
  { name: "Hunter's Crossbow", type: "weapon", damage: 7, description: "Piercing Bolt + Envenomed: Apply poison as a Free Action; Reload" },
  { name: "Elven Crossbow", type: "weapon", damage: 11, description: "Piercing Bolt + Skirmisher: No Disadvantage when firing at melee range; Reload" },
  { name: "Orcish Crossbow", type: "weapon", damage: 12, description: "Piercing Bolt + Weighted: +1 damage if you did not move this turn; Reload" },
  { name: "Dwarven Crossbow", type: "weapon", damage: 12, description: "Piercing Bolt + Staggering Force: Spend 3 FP on a successful shot to stagger target; Reload" },
  { name: "Glass Crossbow", type: "weapon", damage: 14, description: "Piercing Bolt (Ignore 2 DR): Ignore 2 points of DR; Reload" },
  { name: "Enhanced Dwarven Crossbow", type: "weapon", damage: 16, description: "Piercing Bolt + Staggering Force + Bayonet (2 melee dmg); Reload" },
  { name: "Ebony Crossbow", type: "weapon", damage: 18, description: "Piercing Bolt (Ignore 2 DR) + Long Range: Advantage at furthest range; Reload" },
  { name: "Daedric Crossbow", type: "weapon", damage: 20, description: "Piercing Bolt (Ignore 2 DR) + Soul Trap: As a free action on hit, spend 2 FP to cast Soul Trap; Reload" },
  { name: "Dragonbone Crossbow", type: "weapon", damage: 20, description: "Breaching (Ignore 3 DR) + Dragonslayer: +2 damage vs dragons; Reload" },
];
