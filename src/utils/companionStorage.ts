import { Companion } from "@/types/companion";

const STORAGE_KEYS = {
  COMPANION_LIBRARY: 'skyrimTTRPG_companionLibrary',
};

export const companionStorage = {
  getAll(): Companion[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPANION_LIBRARY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading companions:', error);
      return [];
    }
  },

  /** Seed from a default roster only if nothing has been saved yet (first run). */
  ensureSeeded(defaults: Companion[]): Companion[] {
    const existing = this.getAll();
    if (existing.length > 0) return existing;
    localStorage.setItem(STORAGE_KEYS.COMPANION_LIBRARY, JSON.stringify(defaults));
    return defaults;
  },

  save(companion: Companion): { success: boolean; error?: string } {
    try {
      const all = this.getAll();
      const idx = all.findIndex((c) => c.id === companion.id);
      if (idx >= 0) all[idx] = companion; else all.push(companion);
      localStorage.setItem(STORAGE_KEYS.COMPANION_LIBRARY, JSON.stringify(all));
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return { success: false, error: 'Storage limit reached.' };
      }
      console.error('Error saving companion:', error);
      return { success: false, error: 'Failed to save companion.' };
    }
  },

  get(id: string): Companion | null {
    return this.getAll().find((c) => c.id === id) || null;
  },

  delete(id: string): void {
    try {
      const all = this.getAll().filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.COMPANION_LIBRARY, JSON.stringify(all));
    } catch (error) {
      console.error('Error deleting companion:', error);
    }
  },

  /** Summons are ephemeral by nature — remove all of kind 'summon' at once (end of session/combat). */
  clearSummons(): void {
    try {
      const remaining = this.getAll().filter((c) => c.kind !== 'summon');
      localStorage.setItem(STORAGE_KEYS.COMPANION_LIBRARY, JSON.stringify(remaining));
    } catch (error) {
      console.error('Error clearing summons:', error);
    }
  },
};
