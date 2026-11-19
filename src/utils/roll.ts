// A roll at this table is an outcome, not arithmetic.
//
// players guide: "Roll d20 against the character's OWN stat plus difficulty.
// Very Easy +4; Easy +2; Standard 0; Hard -4; Very Hard -6; Nearly Impossible
// -8; Impossible -14; Mythic -20. Natural 1: critical success. Under modified
// TN: success. Exactly modified TN: success with a complication. Over: failure.
// Natural 20: catastrophe, even with TN 20+."
//
// Low is good everywhere in FROGS, so this file must never be "fixed" to the
// usual d20 reading.
import type { RollTier } from '@/net/table';

export const DIFFICULTIES = [
  { id: 'very-easy', label: 'Very Easy', mod: 4 },
  { id: 'easy', label: 'Easy', mod: 2 },
  { id: 'standard', label: 'Standard', mod: 0 },
  { id: 'hard', label: 'Hard', mod: -4 },
  { id: 'very-hard', label: 'Very Hard', mod: -6 },
  { id: 'nearly-impossible', label: 'Nearly Impossible', mod: -8 },
  { id: 'impossible', label: 'Impossible', mod: -14 },
  { id: 'mythic', label: 'Mythic', mod: -20 },
] as const;

export type DifficultyId = (typeof DIFFICULTIES)[number]['id'];

export const TIER_LABEL: Record<RollTier, string> = {
  crit: 'Critical success',
  success: 'Success',
  success_complication: 'Success with a complication',
  fail: 'Failure',
  crit_fail: 'Critical failure',
};

/** The number the die is read against: the character's stat plus the GM's difficulty. */
export function targetNumber(stat: number, difficulty: DifficultyId): number {
  const row = DIFFICULTIES.find((d) => d.id === difficulty) ?? DIFFICULTIES[2];
  return stat + row.mod;
}

export function tierForRoll(die: number, tn: number): RollTier {
  if (die <= 1) return 'crit';
  if (die >= 20) return 'crit_fail';
  if (die < tn) return 'success';
  if (die === tn) return 'success_complication';
  return 'fail';
}

/**
 * Damage after the additive-multiplier law: a critical is one x2 step, never a
 * second multiplier (players guide, DAMAGE STACKING). A complication holds the
 * number for the GM instead of applying it (TABLE-SYNC-DECISIONS).
 */
export function damageForTier(base: number, tier: RollTier): number | null {
  if (tier === 'success_complication') return null;
  if (tier === 'crit') return Math.max(0, base) * 2;
  if (tier === 'success') return Math.max(0, base);
  return 0;
}

/** A spell's damage lives in its prose; read the first number it states. */
export function damageFromText(text: string | undefined): number {
  if (!text) return 0;
  const dealing = text.match(/deal(?:ing|s)?\s+(\d+)/i);
  if (dealing) return Number(dealing[1]);
  const typed = text.match(/(\d+)\s+(?:fire|frost|shock|poison|physical|damage)/i);
  if (typed) return Number(typed[1]);
  return 0;
}

export function rollD20(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return 1 + (bytes[0] % 20);
}
