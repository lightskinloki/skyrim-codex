import { Character } from "@/types/character";

const STORAGE_KEYS = {
  CHARACTER_LIBRARY: 'skyrimTTRPG_characterLibrary',
  LAST_LOADED_ID: 'skyrimTTRPG_lastLoadedCharacterId'
};

export interface CharacterSummary {
  id: string;
  name: string;
  race: string;
  standingStone: string;
  level: string;
}

export const characterStorage = {
  // Get all saved characters
  getAllCharacters(): Character[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHARACTER_LIBRARY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading characters:', error);
      return [];
    }
  },

  // Save a character (add or update)
  saveCharacter(character: Character): { success: boolean; error?: string } {
    try {
      const characters = this.getAllCharacters();
      const existingIndex = characters.findIndex(c => c.id === character.id);
      
      if (existingIndex >= 0) {
        characters[existingIndex] = character;
      } else {
        characters.push(character);
      }
      
      localStorage.setItem(STORAGE_KEYS.CHARACTER_LIBRARY, JSON.stringify(characters));
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded:', error);
        return { success: false, error: 'Storage limit reached. Please export your character and reduce notes length.' };
      }
      console.error('Error saving character:', error);
      return { success: false, error: 'Failed to save character.' };
    }
  },

  // Get a specific character by ID
  getCharacter(id: string): Character | null {
    const characters = this.getAllCharacters();
    return characters.find(c => c.id === id) || null;
  },

  // Delete a character
  deleteCharacter(id: string): void {
    try {
      const characters = this.getAllCharacters();
      const filtered = characters.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CHARACTER_LIBRARY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  },

  // Get character summaries for list display
  getCharacterSummaries(): CharacterSummary[] {
    const characters = this.getAllCharacters();
    return characters.map(char => ({
      id: char.id,
      name: char.name,
      race: char.race.name,
      standingStone: char.standingStone.name,
      level: this.getCharacterTier(char.ap)
    }));
  },

  // Get last loaded character ID
  getLastLoadedId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_LOADED_ID);
  },

  // Set last loaded character ID
  setLastLoadedId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_LOADED_ID, id);
  },

  // Clear last loaded character ID
  clearLastLoadedId(): void {
    localStorage.removeItem(STORAGE_KEYS.LAST_LOADED_ID);
  },

  // Check if there are any saved characters
  hasCharacters(): boolean {
    return this.getAllCharacters().length > 0;
  },

  // Helper to get character tier
  getCharacterTier(ap: number): string {
    if (ap >= 120) return 'Legendary';
    if (ap >= 90) return 'Master';
    if (ap >= 60) return 'Expert';
    if (ap >= 30) return 'Adept';
    if (ap >= 10) return 'Apprentice';
    return 'Novice';
  }
};