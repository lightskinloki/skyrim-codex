// Item name resolver — turns whatever a player types into the printed item.
// The catalog is data; the UI only ever asks "what is this name?".

import { consumables, ConsumableEntry } from '@/data/items';
import { officialEquipment, OfficialEquipment } from '@/data/equipment';
import { InventoryItem } from '@/types/character';

export type ResolvedItemKind = 'potion' | 'poison' | 'weapon' | 'armor' | 'shield' | 'misc';

export interface ResolvedItem {
  name: string;
  kind: ResolvedItemKind;
  effect: string;
  restoreHp?: number;
  restoreFp?: number;
  damage?: number;
  dr?: number;
}

/** Case/punctuation/plural-insensitive key so "Minor Healing Potion" == "minor healing potions". */
function normalize(value: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word))
    .join(' ');
}

function fromConsumable(entry: ConsumableEntry): ResolvedItem {
  return {
    name: entry.name,
    kind: entry.kind,
    effect: entry.effect,
    restoreHp: entry.restoreHp,
    restoreFp: entry.restoreFp,
  };
}

function fromEquipment(entry: OfficialEquipment): ResolvedItem {
  const parts: string[] = [];
  if (entry.type === 'weapon' && entry.damage !== undefined) parts.push(`Damage ${entry.damage}`);
  if (entry.type !== 'weapon' && entry.dr !== undefined) {
    parts.push(entry.type === 'shield' ? `Brace DR +${entry.dr}` : `DR ${entry.dr}`);
  }
  parts.push(entry.description);
  return {
    name: entry.name,
    kind: entry.type === 'clothing' ? 'armor' : entry.type,
    effect: parts.join(' · '),
    damage: entry.damage,
    dr: entry.dr,
  };
}

// Rank words the tables use, plus the older "greater" wording found in modules.
const RANK_VALUES: Array<{ test: RegExp; value: number }> = [
  { test: /\bminor\b/, value: 4 },
  { test: /\b(plentiful|greater)\b/, value: 12 },
  { test: /\bvigorous\b/, value: 16 },
  { test: /\bultimate\b/, value: 20 },
];

/**
 * Restorative potions described loosely ("health potion", "minor mana potion")
 * still resolve to a printed number: rank word if present, otherwise the
 * unmarked Common tier (8).
 */
function synthesizePotion(rawName: string): ResolvedItem | null {
  const lower = rawName.toLowerCase();
  const isPotion = /\b(potion|elixir|draught|vial)\b/.test(lower);
  if (!isPotion) return null;

  const restoresFP = /\b(magicka|mana|focus|fp)\b/.test(lower);
  const restoresHP = /\b(healing|health|hp)\b/.test(lower);
  if (!restoresFP && !restoresHP) return null;

  const value = RANK_VALUES.find(rank => rank.test.test(lower))?.value ?? 8;
  return restoresFP
    ? { name: rawName.trim(), kind: 'potion', effect: `Drink to immediately restore ${value} FP.`, restoreFp: value }
    : { name: rawName.trim(), kind: 'potion', effect: `Drink to immediately restore ${value} HP.`, restoreHp: value };
}

/** Look up a free-text item name against the consumable and equipment tables. */
export function lookupItem(rawName: string): ResolvedItem | null {
  const name = (rawName ?? '').trim();
  if (!name) return null;
  const key = normalize(name);

  const exactConsumable = consumables.find(entry => normalize(entry.name) === key);
  if (exactConsumable) return fromConsumable(exactConsumable);

  const aliasConsumable = consumables.find(entry =>
    (entry.aliases ?? []).some(alias => normalize(alias) === key)
  );
  if (aliasConsumable) return fromConsumable(aliasConsumable);

  const synthesized = synthesizePotion(name);
  if (synthesized) return synthesized;

  const exactEquipment = officialEquipment.find(entry => normalize(entry.name) === key);
  if (exactEquipment) return fromEquipment(exactEquipment);

  const partialEquipment = officialEquipment.filter(entry => {
    const equipmentKey = normalize(entry.name);
    return (
      (key.length >= 4 && equipmentKey.includes(key)) ||
      (equipmentKey.length >= 4 && key.includes(equipmentKey))
    );
  });
  if (partialEquipment.length === 1) return fromEquipment(partialEquipment[0]);

  return null;
}

/** Autocomplete for the inventory field. */
export function suggestItems(query: string, limit = 5): ResolvedItem[] {
  const key = normalize(query);
  if (key.length < 2) return [];

  const results = new Map<string, ResolvedItem>();
  for (const entry of consumables) {
    const names = [entry.name, ...(entry.aliases ?? [])].map(normalize);
    if (names.some(candidate => candidate.includes(key))) {
      results.set(entry.name, fromConsumable(entry));
    }
  }
  for (const entry of officialEquipment) {
    if (normalize(entry.name).includes(key)) {
      results.set(entry.name, fromEquipment(entry));
    }
  }
  return Array.from(results.values()).slice(0, limit);
}

/**
 * Resolve an inventory entry. Stored values win (so a GM can edit one item);
 * otherwise the name is looked up live, which also covers characters saved
 * before the catalog existed.
 */
export function resolveInventoryItem(item: InventoryItem): ResolvedItem | null {
  if (item.effect && item.kind) {
    return {
      name: item.name,
      kind: item.kind,
      effect: item.effect,
      restoreHp: item.restoreHp,
      restoreFp: item.restoreFp,
    };
  }
  return lookupItem(item.name);
}

/** Fields to persist on a new inventory entry so the values stay put. */
export function inventoryFieldsFor(name: string): Partial<InventoryItem> {
  const resolved = lookupItem(name);
  if (!resolved) return {};
  return {
    kind: resolved.kind,
    effect: resolved.effect,
    ...(resolved.restoreHp ? { restoreHp: resolved.restoreHp } : {}),
    ...(resolved.restoreFp ? { restoreFp: resolved.restoreFp } : {}),
  };
}
