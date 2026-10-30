import { EncounterState } from '@/state/encounter';

const PREFIX = 'skyrimTTRPG_encounter_v1:';

function keyFor(blockId: string): string {
  return `${PREFIX}${blockId}`;
}

/**
 * One live encounter per combat block, kept in localStorage.
 *
 * A fight that survives a refresh is the whole point of Phase 0; the hosted
 * version will move this to the host's disk without changing the shape.
 */
export const encounterStorage = {
  load(blockId: string): EncounterState | null {
    try {
      const raw = localStorage.getItem(keyFor(blockId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as EncounterState;
      if (parsed?.version !== 1 || parsed.blockId !== blockId) return null;
      return parsed;
    } catch (error) {
      console.error('Error loading encounter:', error);
      return null;
    }
  },

  save(state: EncounterState): void {
    try {
      localStorage.setItem(keyFor(state.blockId), JSON.stringify(state));
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  },

  clear(blockId: string): void {
    try {
      localStorage.removeItem(keyFor(blockId));
    } catch (error) {
      console.error('Error clearing encounter:', error);
    }
  },
};
