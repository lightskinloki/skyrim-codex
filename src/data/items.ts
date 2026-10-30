// General items & consumables — printed values from "Gear, Consumables, and the Forge".
// This is a data table only. Inventory UI reads it through utils/itemLookup so a
// player never has to remember what a potion does; homebrew names still pass through.

export type ConsumableKind = 'potion' | 'poison' | 'misc';

export interface ConsumableEntry {
  name: string;
  kind: ConsumableKind;
  rarity: string;
  effect: string;
  restoreHp?: number;
  restoreFp?: number;
  /** Alternate spellings/names players actually type. */
  aliases?: string[];
}

export const consumables: ConsumableEntry[] = [
  // ── Potions (Restorative) ────────────────────────────────────────────────
  {
    name: 'Potion of Minor Healing', kind: 'potion', rarity: 'Common',
    effect: 'Drink to immediately restore 4 HP.', restoreHp: 4,
    aliases: ['Minor Healing Potion', 'Minor Health Potion', 'Small Healing Potion'],
  },
  {
    name: 'Potion of Healing', kind: 'potion', rarity: 'Common',
    effect: 'Drink to immediately restore 8 HP.', restoreHp: 8,
    aliases: ['Healing Potion', 'Health Potion'],
  },
  {
    name: 'Potion of Plentiful Healing', kind: 'potion', rarity: 'Uncommon',
    effect: 'Drink to immediately restore 12 HP.', restoreHp: 12,
    aliases: ['Plentiful Healing Potion', 'Greater Healing Potion'],
  },
  {
    name: 'Potion of Vigorous Healing', kind: 'potion', rarity: 'Rare',
    effect: 'Drink to immediately restore 16 HP.', restoreHp: 16,
    aliases: ['Vigorous Healing Potion', 'Strong Healing Potion'],
  },
  {
    name: 'Potion of Ultimate Healing', kind: 'potion', rarity: 'Super Rare',
    effect: 'Drink to immediately restore 20 HP.', restoreHp: 20,
    aliases: ['Ultimate Healing Potion', 'Ultimate Health Potion'],
  },
  {
    name: 'Potion of Minor Magicka', kind: 'potion', rarity: 'Common',
    effect: 'Drink to immediately restore 4 FP.', restoreFp: 4,
    aliases: ['Minor Magicka Potion', 'Minor Mana Potion'],
  },
  {
    name: 'Potion of Magicka', kind: 'potion', rarity: 'Common',
    effect: 'Drink to immediately restore 8 FP.', restoreFp: 8,
    aliases: ['Magicka Potion', 'Mana Potion'],
  },
  {
    name: 'Potion of Plentiful Magicka', kind: 'potion', rarity: 'Uncommon',
    effect: 'Drink to immediately restore 12 FP.', restoreFp: 12,
    aliases: ['Plentiful Magicka Potion', 'Greater Magicka Potion'],
  },
  {
    name: 'Potion of Focus', kind: 'potion', rarity: 'Rare',
    effect: 'Drink to immediately restore 16 FP.', restoreFp: 16,
    aliases: ['Focus Potion'],
  },
  {
    name: 'Potion of Ultimate Magika', kind: 'potion', rarity: 'Rare',
    effect: 'Drink to immediately restore 20 FP.', restoreFp: 20,
    aliases: ['Potion of Ultimate Magicka', 'Ultimate Magicka Potion', 'Ultimate Mana Potion'],
  },
  {
    name: 'Cure Disease Potion', kind: 'potion', rarity: 'Uncommon',
    effect: 'Cures all non-magical diseases affecting you.',
    aliases: ['Potion of Cure Disease'],
  },
  {
    name: 'Cure Poison Potion', kind: 'potion', rarity: 'Uncommon',
    effect: 'Immediately ends the effects of any non-magical poison.',
    aliases: ['Potion of Cure Poison', "Sun's Dust"],
  },

  // ── Potions (Enhancement) ────────────────────────────────────────────────
  {
    name: 'Potion of Fortify Might', kind: 'potion', rarity: 'Uncommon',
    effect: 'Drink to gain a +2 bonus to your Might Target Number for 3 rounds.',
  },
  {
    name: 'Potion of Fortify Agility', kind: 'potion', rarity: 'Uncommon',
    effect: 'Drink to gain a +2 bonus to your Agility Target Number for 3 rounds.',
  },
  {
    name: 'Potion of Resist Fire', kind: 'potion', rarity: 'Uncommon',
    effect: 'For 3 rounds, you take half damage from all sources of fire.',
  },
  {
    name: 'Potion of Resist Frost', kind: 'potion', rarity: 'Uncommon',
    effect: 'For 3 rounds, you take half damage from all sources of frost.',
  },
  {
    name: 'Potion of Resist Shock', kind: 'potion', rarity: 'Uncommon',
    effect: 'For 3 rounds, you take half damage from all sources of shock.',
  },
  {
    name: 'Potion of Invisibility', kind: 'potion', rarity: 'Rare',
    effect: 'Drink to become invisible for 3 rounds or until you perform a hostile action.',
  },

  // ── Poisons ──────────────────────────────────────────────────────────────
  {
    name: 'Weak Poison', kind: 'poison', rarity: 'Common',
    effect: 'Apply to a weapon. The next successful hit with that weapon deals an additional 2 poison damage.',
    aliases: ['Vial of Weak Poison'],
  },
  {
    name: 'Frostbite Spider Venom', kind: 'poison', rarity: 'Common',
    effect: 'Apply to a weapon. The next successful hit forces the target to make a Might roll or become Slowed (cannot use Minor Action for movement) for their next turn.',
  },
  {
    name: 'Damage Magicka Poison', kind: 'poison', rarity: 'Uncommon',
    effect: 'Apply to a weapon. The next successful hit deals no extra damage, but the target loses 5 FP.',
  },
  {
    name: 'Paralysis Poison', kind: 'poison', rarity: 'Rare',
    effect: 'Apply to a weapon. The next successful hit forces the target to make a Might roll or become Paralyzed, losing their next turn completely.',
  },

  // ── Equipment & Miscellaneous ────────────────────────────────────────────
  {
    name: 'Lockpick', kind: 'misc', rarity: 'Common',
    effect: 'A thin piece of metal used to pick locks. A single lockpick breaks on any failed Lockpicking attempt unless you have a perk that prevents it.',
    aliases: ['Lockpicks'],
  },
  {
    name: 'Torch', kind: 'misc', rarity: 'Common',
    effect: 'Provides bright light in a 20-foot radius for one hour (real time). Can be used as a clumsy weapon (Damage 1, can set flammable things alight).',
  },
  {
    name: 'Rope (50 feet)', kind: 'misc', rarity: 'Common',
    effect: "A standard adventurer's tool for climbing, securing items, or setting traps.",
    aliases: ['Rope', 'Rope 50 feet', 'Fifty Feet of Rope'],
  },
  {
    name: 'Animal Pelt', kind: 'misc', rarity: 'Common',
    effect: 'The hide of a beast. Can be sold to merchants or used for crafting.',
    aliases: ['Pelt'],
  },
  {
    name: 'Ore', kind: 'misc', rarity: 'Common',
    effect: 'A chunk of raw ore. Can be sold or used for crafting.',
    aliases: ['Ore (Iron, etc.)', 'Iron Ore', 'Silver Ore', 'Gold Ore', 'Corundum Ore', 'Malachite Ore'],
  },
  {
    name: 'Alchemy Ingredients', kind: 'misc', rarity: 'Common',
    effect: 'Flowers, fungi, and other components used to create potions and poisons with the Alchemy skill.',
  },
  {
    name: 'Soul Gem (Petty)', kind: 'misc', rarity: 'Common',
    effect: 'A magical crystal used to trap the souls of lesser creatures (wolves, mudcrabs, etc.). White Souls: (From beasts and lesser creatures) Can be used to recharge one magic item by half of its total charges rounded up.',
  },
  {
    name: 'Soul Gem (Greater)', kind: 'misc', rarity: 'Uncommon',
    effect: 'A magical crystal that can trap the souls of powerful creatures and humanoids. White Souls: (From beasts and lesser creatures) Can be used to recharge one magic item. Black Souls: (From humanoid races) Are potent and seen by many as a dark perversion of magic. A black soul can be used to recharge a magic item twice before being expended. However, using a black soul carries two great risks: Social Stigma: Recharging or using an item with a black soul is a dark act. If witnessed by a lawful or good-aligned NPC (a guard, priest, or common citizen), you may be treated with suspicion, reported to the authorities, or even attacked by zealous individuals. Catastrophe: When you roll a Critical Failure (a 20) while using an item charged with a black soul, you trigger a Soul Catastrophe. The vengeful soul lashes out, and the GM will determine the dire consequences.',
  },
  {
    name: 'Sweetroll', kind: 'misc', rarity: 'Common',
    effect: 'A delicious pastry. Someone might have stolen it.',
  },
];
