// Guided item picker tree — data only. The modal walks these branches so a
// player never has to remember wording; every leaf carries its printed values
// from "Gear, Consumables, and the Forge".
import { InventoryItem } from '@/types/character';

export type ItemKind = NonNullable<InventoryItem['kind']>;

export interface ItemValues {
  name: string;
  kind: ItemKind;
  effect: string;
  restoreHp?: number;
  restoreFp?: number;
  /** True only for leaves built from a saved homebrew entry. */
  homebrew?: boolean;
}

export interface ItemLeaf {
  type: 'item';
  id: string;
  label: string;
  detail: string;
  values: ItemValues;
}

export interface CustomNumeric {
  /** What the number means, e.g. "HP restored". */
  label: string;
  defaultValue: number;
  /** Snap the value to the restorative ladder (4/8/12/16/20). */
  useLadder?: boolean;
  /** Restorative resource the value feeds, when it feeds one. */
  resource?: 'hp' | 'fp';
}

/** Custom items only ever land in these buckets today. */
export type CustomKind = 'potion' | 'poison' | 'misc';

export interface ItemCustom {
  type: 'custom';
  id: string;
  label: string;
  detail: string;
  kind: CustomKind;
  /** Suggested name; left blank for a free-form item. */
  baseName: string;
  numeric?: CustomNumeric;
  /** "{value}" is replaced by the numeric value. */
  effect: string;
  /** Non-numeric branches let the player rewrite the effect text. */
  effectEditable?: boolean;
}

export interface ItemGroup {
  type: 'group';
  id: string;
  label: string;
  hint?: string;
  children: ItemNode[];
}

export type ItemNode = ItemGroup | ItemLeaf | ItemCustom;

/** The restorative ladder the book actually prints. */
export const RESTORE_LADDER = [4, 8, 12, 16, 20];

const RANK_LABELS: Record<number, string> = {
  4: 'Minor',
  8: 'Standard',
  12: 'Plentiful',
  16: 'Vigorous',
  20: 'Ultimate',
};

export function rankLabel(value: number): string {
  return RANK_LABELS[value] ?? 'Custom';
}

function item(id: string, label: string, values: ItemValues): ItemLeaf {
  return { type: 'item', id, label, detail: values.effect, values };
}

function custom(node: Omit<ItemCustom, 'type'>): ItemCustom {
  return { type: 'custom', ...node };
}

// ── Potions ────────────────────────────────────────────────────────────────

const restoreHealth: ItemGroup = {
  type: 'group',
  id: 'restore-hp',
  label: 'Restore Health',
  hint: '4 → 20 HP',
  children: [
    item('potion-minor-healing', 'Potion of Minor Healing', {
      name: 'Potion of Minor Healing',
      kind: 'potion',
      effect: 'Drink to immediately restore 4 HP.',
      restoreHp: 4,
    }),
    item('potion-healing', 'Potion of Healing', {
      name: 'Potion of Healing',
      kind: 'potion',
      effect: 'Drink to immediately restore 8 HP.',
      restoreHp: 8,
    }),
    item('potion-plentiful-healing', 'Potion of Plentiful Healing', {
      name: 'Potion of Plentiful Healing',
      kind: 'potion',
      effect: 'Drink to immediately restore 12 HP.',
      restoreHp: 12,
    }),
    item('potion-vigorous-healing', 'Potion of Vigorous Healing', {
      name: 'Potion of Vigorous Healing',
      kind: 'potion',
      effect: 'Drink to immediately restore 16 HP.',
      restoreHp: 16,
    }),
    item('potion-ultimate-healing', 'Potion of Ultimate Healing', {
      name: 'Potion of Ultimate Healing',
      kind: 'potion',
      effect: 'Drink to immediately restore 20 HP.',
      restoreHp: 20,
    }),
    custom({
      id: 'custom-hp',
      label: 'Custom healing potion',
      detail: 'Name it, pick a rank, set the HP.',
      kind: 'potion',
      baseName: 'Homebrew Healing Potion',
      numeric: { label: 'HP restored', defaultValue: 8, useLadder: true, resource: 'hp' },
      effect: 'Drink to immediately restore {value} HP.',
    }),
  ],
};

const restoreMagicka: ItemGroup = {
  type: 'group',
  id: 'restore-fp',
  label: 'Restore Magicka',
  hint: '4 → 20 FP',
  children: [
    item('potion-minor-magicka', 'Potion of Minor Magicka', {
      name: 'Potion of Minor Magicka',
      kind: 'potion',
      effect: 'Drink to immediately restore 4 FP.',
      restoreFp: 4,
    }),
    item('potion-magicka', 'Potion of Magicka', {
      name: 'Potion of Magicka',
      kind: 'potion',
      effect: 'Drink to immediately restore 8 FP.',
      restoreFp: 8,
    }),
    item('potion-plentiful-magicka', 'Potion of Plentiful Magicka', {
      name: 'Potion of Plentiful Magicka',
      kind: 'potion',
      effect: 'Drink to immediately restore 12 FP.',
      restoreFp: 12,
    }),
    item('potion-focus', 'Potion of Focus', {
      name: 'Potion of Focus',
      kind: 'potion',
      effect: 'Drink to immediately restore 16 FP.',
      restoreFp: 16,
    }),
    item('potion-ultimate-magicka', 'Potion of Ultimate Magika', {
      name: 'Potion of Ultimate Magika',
      kind: 'potion',
      effect: 'Drink to immediately restore 20 FP.',
      restoreFp: 20,
    }),
    custom({
      id: 'custom-fp',
      label: 'Custom magicka potion',
      detail: 'Name it, pick a rank, set the FP.',
      kind: 'potion',
      baseName: 'Homebrew Magicka Potion',
      numeric: { label: 'FP restored', defaultValue: 8, useLadder: true, resource: 'fp' },
      effect: 'Drink to immediately restore {value} FP.',
    }),
  ],
};

const cures: ItemGroup = {
  type: 'group',
  id: 'cures',
  label: 'Cures',
  hint: 'Disease & poison',
  children: [
    item('cure-disease', 'Cure Disease Potion', {
      name: 'Cure Disease Potion',
      kind: 'potion',
      effect: 'Cures all non-magical diseases affecting you.',
    }),
    item('cure-poison', 'Cure Poison Potion', {
      name: 'Cure Poison Potion',
      kind: 'potion',
      effect: 'Immediately ends the effects of any non-magical poison.',
    }),
    custom({
      id: 'custom-cure',
      label: 'Custom cure',
      detail: 'Write what it cures.',
      kind: 'potion',
      baseName: 'Homebrew Cure',
      effect: 'Cures all non-magical diseases affecting you.',
      effectEditable: true,
    }),
  ],
};

const fortify: ItemGroup = {
  type: 'group',
  id: 'fortify',
  label: 'Fortify',
  hint: '+2 TN for 3 rounds',
  children: [
    item('fortify-might', 'Potion of Fortify Might', {
      name: 'Potion of Fortify Might',
      kind: 'potion',
      effect: 'Drink to gain a +2 bonus to your Might Target Number for 3 rounds.',
    }),
    item('fortify-agility', 'Potion of Fortify Agility', {
      name: 'Potion of Fortify Agility',
      kind: 'potion',
      effect: 'Drink to gain a +2 bonus to your Agility Target Number for 3 rounds.',
    }),
    custom({
      id: 'custom-fortify',
      label: 'Custom fortify potion',
      detail: 'Write the bonus and duration.',
      kind: 'potion',
      baseName: 'Homebrew Fortify Potion',
      effect: 'Drink to gain a +2 bonus to one Target Number of your choice for 3 rounds.',
      effectEditable: true,
    }),
  ],
};

const resist: ItemGroup = {
  type: 'group',
  id: 'resist',
  label: 'Resist',
  hint: 'Half damage for 3 rounds',
  children: [
    item('resist-fire', 'Potion of Resist Fire', {
      name: 'Potion of Resist Fire',
      kind: 'potion',
      effect: 'For 3 rounds, you take half damage from all sources of fire.',
    }),
    item('resist-frost', 'Potion of Resist Frost', {
      name: 'Potion of Resist Frost',
      kind: 'potion',
      effect: 'For 3 rounds, you take half damage from all sources of frost.',
    }),
    item('resist-shock', 'Potion of Resist Shock', {
      name: 'Potion of Resist Shock',
      kind: 'potion',
      effect: 'For 3 rounds, you take half damage from all sources of shock.',
    }),
    custom({
      id: 'custom-resist',
      label: 'Custom resist potion',
      detail: 'Write what it protects against.',
      kind: 'potion',
      baseName: 'Homebrew Resist Potion',
      effect: 'For 3 rounds, you take half damage from all sources of fire.',
      effectEditable: true,
    }),
  ],
};

const potions: ItemGroup = {
  type: 'group',
  id: 'potions',
  label: 'Potions',
  hint: 'Restorative & enhancement',
  children: [
    {
      type: 'group',
      id: 'restorative',
      label: 'Restorative',
      hint: 'Health, magicka, cures',
      children: [restoreHealth, restoreMagicka, cures],
    },
    {
      type: 'group',
      id: 'enhancement',
      label: 'Enhancement',
      hint: 'Buffs & protection',
      children: [
        fortify,
        resist,
        item('invisibility', 'Potion of Invisibility', {
          name: 'Potion of Invisibility',
          kind: 'potion',
          effect: 'Drink to become invisible for 3 rounds or until you perform a hostile action.',
        }),
        custom({
          id: 'custom-enhancement',
          label: 'Custom enhancement potion',
          detail: 'Write what it does.',
          kind: 'potion',
          baseName: 'Homebrew Enhancement Potion',
          effect: 'For 3 rounds, you gain the chosen effect.',
          effectEditable: true,
        }),
      ],
    },
  ],
};

// ── Poisons ────────────────────────────────────────────────────────────────

const poisons: ItemGroup = {
  type: 'group',
  id: 'poisons',
  label: 'Poisons',
  hint: 'Coats a weapon · Minor Action',
  children: [
    item('weak-poison', 'Weak Poison', {
      name: 'Weak Poison',
      kind: 'poison',
      effect: 'Apply to a weapon. The next successful hit with that weapon deals an additional 2 poison damage.',
    }),
    item('spider-venom', 'Frostbite Spider Venom', {
      name: 'Frostbite Spider Venom',
      kind: 'poison',
      effect: 'Apply to a weapon. The next successful hit forces the target to make a Might roll or become Slowed (cannot use Minor Action for movement) for their next turn.',
    }),
    item('damage-magicka-poison', 'Damage Magicka Poison', {
      name: 'Damage Magicka Poison',
      kind: 'poison',
      effect: 'Apply to a weapon. The next successful hit deals no extra damage, but the target loses 5 FP.',
    }),
    item('paralysis-poison', 'Paralysis Poison', {
      name: 'Paralysis Poison',
      kind: 'poison',
      effect: 'Apply to a weapon. The next successful hit forces the target to make a Might roll or become Paralyzed, losing their next turn completely.',
    }),
    custom({
      id: 'custom-poison',
      label: 'Custom poison',
      detail: 'Name it and set its bonus damage.',
      kind: 'poison',
      baseName: 'Homebrew Poison',
      numeric: { label: 'Bonus poison damage', defaultValue: 2 },
      effect: 'Apply to a weapon. The next successful hit with that weapon deals an additional {value} poison damage.',
    }),
    custom({
      id: 'custom-poison-effect',
      label: 'Custom poison (other effect)',
      detail: 'Write the roll it forces.',
      kind: 'poison',
      baseName: 'Homebrew Poison',
      effect: 'Apply to a weapon. The next hit forces a Might roll or the target suffers the chosen effect.',
      effectEditable: true,
    }),
  ],
};

// ── Tools & Materials ──────────────────────────────────────────────────────

const tools: ItemGroup = {
  type: 'group',
  id: 'tools',
  label: 'Tools & Materials',
  hint: 'Gear, materials, oddities',
  children: [
    item('lockpick', 'Lockpick', {
      name: 'Lockpick',
      kind: 'misc',
      effect: 'A thin piece of metal used to pick locks. A single lockpick breaks on any failed Lockpicking attempt unless you have a perk that prevents it.',
    }),
    item('torch', 'Torch', {
      name: 'Torch',
      kind: 'misc',
      effect: 'Provides bright light in a 20-foot radius for one hour (real time). Can be used as a clumsy weapon (Damage 1, can set flammable things alight).',
    }),
    item('rope', 'Rope (50 feet)', {
      name: 'Rope (50 feet)',
      kind: 'misc',
      effect: "A standard adventurer's tool for climbing, securing items, or setting traps.",
    }),
    item('animal-pelt', 'Animal Pelt', {
      name: 'Animal Pelt',
      kind: 'misc',
      effect: 'The hide of a beast. Can be sold to merchants or used for crafting.',
    }),
    item('ore', 'Ore (Iron, etc.)', {
      name: 'Ore (Iron, etc.)',
      kind: 'misc',
      effect: 'A chunk of raw ore. Can be sold or used for crafting.',
    }),
    item('alchemy-ingredients', 'Alchemy Ingredients', {
      name: 'Alchemy Ingredients',
      kind: 'misc',
      effect: 'Flowers, fungi, and other components used to create potions and poisons with the Alchemy skill.',
    }),
    item('soul-gem-petty', 'Soul Gem (Petty)', {
      name: 'Soul Gem (Petty)',
      kind: 'misc',
      effect: 'A magical crystal used to trap the souls of lesser creatures (wolves, mudcrabs, etc.). White Souls: (From beasts and lesser creatures) Can be used to recharge one magic item by half of its total charges rounded up.',
    }),
    item('soul-gem-greater', 'Soul Gem (Greater)', {
      name: 'Soul Gem (Greater)',
      kind: 'misc',
      effect: 'A magical crystal that can trap the souls of powerful creatures and humanoids. White Souls: (From beasts and lesser creatures) Can be used to recharge one magic item. Black Souls: (From humanoid races) Are potent and seen by many as a dark perversion of magic. A black soul can be used to recharge a magic item twice before being expended. However, using a black soul carries two great risks: Social Stigma: Recharging or using an item with a black soul is a dark act. If witnessed by a lawful or good-aligned NPC (a guard, priest, or common citizen), you may be treated with suspicion, reported to the authorities, or even attacked by zealous individuals. Catastrophe: When you roll a Critical Failure (a 20) while using an item charged with a black soul, you trigger a Soul Catastrophe. The vengeful soul lashes out, and the GM will determine the dire consequences.',
    }),
    item('sweetroll', 'Sweetroll', {
      name: 'Sweetroll',
      kind: 'misc',
      effect: 'A delicious pastry. Someone might have stolen it.',
    }),
    custom({
      id: 'custom-item',
      label: 'Custom item',
      detail: 'Anything else — loot, junk, a quest token.',
      kind: 'misc',
      baseName: '',
      effect: '',
      effectEditable: true,
    }),
  ],
};

/** Top-level branches. Gear can be added here later without touching the modal. */
export const itemTree: ItemGroup[] = [potions, poisons, tools];

/** Every printed leaf name, so a custom item cannot quietly shadow one. */
export function printedItemNames(nodes: ItemNode[] = itemTree): string[] {
  const names: string[] = [];
  for (const node of nodes) {
    if (node.type === 'item') names.push(node.values.name);
    else if (node.type === 'group') names.push(...printedItemNames(node.children));
  }
  return names;
}
