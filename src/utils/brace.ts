// Bracing is the shield's Minor Action and nothing else.
//
// players guide, Minor Actions: "Bracing with a shield". Line 824: "Reduce the
// damage of the next attack that hits you by an additional 2 points." Gear →
// Shields gives every shield its own Bracing Bonus and the riders that fire
// while braced. There is no weapon parry and no bare-arm brace anywhere in the
// books, so this function never invents one — a character without a shield is
// told why the action is unavailable.
import type { Character, Equipment } from '@/types/character';

export interface BraceProfile {
  shield: Equipment | null;
  /** The shield's bracing bonus, added to DR for the next hit only. */
  bonus: number;
  /** Enchantment riders that fire while braced, in the shield's own words. */
  riders: string[];
}

export function braceProfile(character: Character): BraceProfile {
  const shield = character.equipment.find((item) => item.type === 'shield') ?? null;
  if (!shield) return { shield: null, bonus: 0, riders: [] };
  const description = shield.description ?? '';
  return {
    shield,
    bonus: Math.max(0, shield.dr ?? 0),
    // The data already carries the rule text; matching it keeps the card honest
    // if a shield is added or reworded without touching this file.
    riders: /brac/i.test(description) ? [description] : [],
  };
}

/** One sentence the player can read before committing the Minor Action. */
export function braceSummary(profile: BraceProfile): string {
  if (!profile.shield) {
    return 'No shield equipped. The book braces with a shield only — no weapon parry, no bare arms.';
  }
  return `${profile.shield.name}: +${profile.bonus} DR against the next hit that lands.`;
}
