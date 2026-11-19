import type { CharacterSpec } from './spec';

/**
 * The character roster, saved locally.
 *
 * A saved character is just its spec — six numbers and a handful of ids. Nothing
 * here stores a sprite, because the sprite does not exist until it is drawn:
 * saving a character costs about 200 bytes, and loading it re-renders at both
 * scales from the same rules.
 */

const KEY = 'skyrimCodex_characterRoster.v1';

export type Roster = CharacterSpec[];

export function loadRoster(): Roster {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Roster).filter((s) => s && typeof s.id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveRoster(roster: Roster): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(roster));
    return true;
  } catch {
    return false;
  }
}

/** Save or replace by id, so "Save" on an existing character updates it. */
export function upsert(roster: Roster, spec: CharacterSpec): Roster {
  const i = roster.findIndex((s) => s.id === spec.id);
  const next = i >= 0 ? roster.map((s, n) => (n === i ? spec : s)) : [...roster, spec];
  saveRoster(next);
  return next;
}

export function remove(roster: Roster, id: string): Roster {
  const next = roster.filter((s) => s.id !== id);
  saveRoster(next);
  return next;
}

export const newId = (): string =>
  `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
