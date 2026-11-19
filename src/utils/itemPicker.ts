// Payload building and merging for the item picker. Kept pure so the rules the
// dialog enforces can be tested without a browser.
import { HomebrewItem, InventoryItem } from '@/types/character';
import { ItemCustom, ItemLeaf } from '@/data/itemTree';
import { lookupItem } from '@/utils/itemLookup';

export const MAX_QUANTITY = 99;

/** Identity key for names: case and repeated whitespace do not make a new item. */
export function nameKey(value: string): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Quantities are whole numbers in 1..99; anything else is coerced. */
export function toQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(value)));
}

/** Custom values are whole numbers, at least 1. */
export function toCustomValue(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.trunc(value));
}

export function buildLeafItem(leaf: ItemLeaf, quantity: number): InventoryItem {
  return { ...leaf.values, quantity: toQuantity(quantity) };
}

export interface CustomItemFields {
  name: string;
  value: number;
  effect: string;
  quantity: number;
}

/** Returns null when the name is blank, so a nameless item can never be added. */
export function buildCustomItem(node: ItemCustom, fields: CustomItemFields): InventoryItem | null {
  const name = fields.name.trim();
  if (!name) return null;

  const value = toCustomValue(fields.value);
  const effect = node.numeric
    ? node.effect.split('{value}').join(String(value))
    : fields.effect.trim();

  const item: InventoryItem = {
    name,
    quantity: toQuantity(fields.quantity),
    kind: node.kind,
    homebrew: true,
    ...(effect ? { effect } : {}),
  };
  if (node.numeric?.resource === 'hp') item.restoreHp = value;
  if (node.numeric?.resource === 'fp') item.restoreFp = value;
  return item;
}

/** Custom items are only saved for the three picker buckets. */
export function buildHomebrewItem(item: InventoryItem): HomebrewItem | null {
  const name = item.name.trim();
  if (!name) return null;
  if (item.kind !== 'potion' && item.kind !== 'poison' && item.kind !== 'misc') return null;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    kind: item.kind,
    effect: item.effect ?? '',
    ...(item.restoreHp !== undefined ? { restoreHp: item.restoreHp } : {}),
    ...(item.restoreFp !== undefined ? { restoreFp: item.restoreFp } : {}),
  };
}

function sameItem(a: InventoryItem, b: InventoryItem): boolean {
  if (nameKey(a.name) !== nameKey(b.name)) return false;
  // Legacy entries may have no kind; they can still absorb a named pickup.
  if (a.kind && b.kind) return a.kind === b.kind;
  return true;
}

/**
 * Stack onto an existing row when name and kind both match. Defined values from
 * the addition win, but an absent value never erases what the row already knows
 * (e.g. adding a bare "Potion of Healing" keeps its restore 8).
 */
export function mergeInventoryItem(items: InventoryItem[], addition: InventoryItem): InventoryItem[] {
  const index = items.findIndex(existing => sameItem(existing, addition));
  if (index < 0) return [...items, addition];

  const existing = items[index];
  const merged: InventoryItem = {
    name: existing.name,
    quantity: toQuantity(existing.quantity + addition.quantity),
    kind: addition.kind ?? existing.kind,
  };

  const effect = addition.effect ?? existing.effect;
  const restoreHp = addition.restoreHp ?? existing.restoreHp;
  const restoreFp = addition.restoreFp ?? existing.restoreFp;
  if (effect !== undefined) merged.effect = effect;
  if (restoreHp !== undefined) merged.restoreHp = restoreHp;
  if (restoreFp !== undefined) merged.restoreFp = restoreFp;
  // A stack stays tagged once any copy of it was player-made.
  if (existing.homebrew || addition.homebrew) merged.homebrew = true;

  const next = [...items];
  next[index] = merged;
  return next;
}

/**
 * Whether an inventory row is player-made. New rows carry the flag; saves that
 * predate it are inferred from storing their own effect under a name no printed
 * table knows, which is exactly what the picker used to write.
 */
export function isHomebrewItem(item: InventoryItem): boolean {
  if (item.homebrew) return true;
  return Boolean(item.effect) && lookupItem(item.name) === null;
}

/** One saved entry per (name, kind); saving the same custom item updates it. */
export function mergeHomebrewEntry(entries: HomebrewItem[], entry: HomebrewItem): HomebrewItem[] {
  const index = entries.findIndex(
    existing => nameKey(existing.name) === nameKey(entry.name) && existing.kind === entry.kind
  );
  if (index < 0) return [...entries, entry];
  const next = [...entries];
  next[index] = entry;
  return next;
}
