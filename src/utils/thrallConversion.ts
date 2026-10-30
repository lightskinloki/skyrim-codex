// Turning a corpse into a Dead Thrall.
//
// Dead Thrall has no stat block of its own in the rules — it reanimates "any
// dead humanoid", so the body supplies the sheet. That's the correct reading,
// but it can't be applied raw: a player who drops Jasper Avalon (1,000 HP, the
// Dawn Obsidian reservoir) would otherwise walk away with a 1,000 HP tank.
//
// So a thrall is the body, bound: its own numbers, compressed into the range
// the game already treats as the ceiling for a bound creature. The anchors are
// the guide's strongest summons, not invented ones:
//
//   floor   8 HP / 0 DR  — Familiar
//   ceiling 60 HP / 12 DR / 16 damage / 18 Might — Dremora Lord
//   top    1,000 HP      — the boss scale this campaign actually uses
//
// The binding curve is logarithmic, so it saturates instead of exploding:
// a 20 HP bandit binds to ~22 HP, a 63 HP chief to ~31, a 200 HP elite to ~43,
// and a 1,000 HP boss reaches the 60 HP ceiling and stops there. Nothing ever
// exceeds the Dremora Lord, no matter what you kill.
//
// The body's *shape* survives — its highest stat stays its highest stat, its
// weapon stays its weapon, its DR is scaled from its own DR (Jasper's base DR
// is 0, so a Jasper thrall is still a glass cannon) — only the magnitudes are
// pressed into the band.

import { EnemyTemplate } from '@/data/enemies';
import { Companion, CompanionAbility } from '@/types/companion';

export const THRALL_CEILING = {
  /** Familiar — the weakest thing Conjuration can bind. */
  floorHp: 8,
  /** Dremora Lord — the mightiest thing a Master conjurer is given. */
  maxHp: 60,
  maxDr: 12,
  maxDamage: 16,
  maxStat: 18,
  maxFp: 30,
  /** The scale's top anchor: a 1,000 HP boss binds to the full ceiling. */
  topHp: 1000,
} as const;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/**
 * How much of the corpse's power the binding actually holds, 0..1.
 * Logarithmic: 8 HP binds to 0, 60 HP to ~0.44, 200 to ~0.67, 1000 to 1.
 */
export function bindFraction(rawHp: number): number {
  const hp = Math.max(0, rawHp);
  const scale = Math.log(1 + THRALL_CEILING.topHp / THRALL_CEILING.floorHp);
  return Math.min(1, Math.log(1 + hp / THRALL_CEILING.floorHp) / scale);
}

/** The multiplier applied to a body's DR, damage and stats — never above 1. */
const potency = (f: number) => 0.6 + 0.4 * f;

export interface ThrallSheet {
  hp: number;
  dr: number;
  fp?: number;
  stats: { might: number; agility: number; magic: number; guile: number };
  attacks: { name: string; damage: number; stat: string }[];
  notes: string[];
}

/** The numbers a given body produces as a thrall. Pure — no storage, no ids. */
export function thrallSheetFrom(body: EnemyTemplate): ThrallSheet {
  const f = bindFraction(body.hp);
  const p = potency(f);

  const stats = {
    might: clamp(body.stats.might * p, 1, THRALL_CEILING.maxStat),
    agility: clamp(body.stats.agility * p, 1, THRALL_CEILING.maxStat),
    magic: clamp(body.stats.magic * p, 1, THRALL_CEILING.maxStat),
    guile: clamp(body.stats.guile * p, 1, THRALL_CEILING.maxStat),
  };

  const attacks = body.attacks
    .filter((a) => a.damage > 0)
    .map((a) => ({
      name: a.name,
      damage: clamp(a.damage * p, 3, THRALL_CEILING.maxDamage),
      stat: a.stat,
    }));

  // A caster with no weapon (a pure spellcaster whose every attack entry is a
  // buff) still has hands. Give the corpse something to swing rather than a
  // thrall that cannot act.
  if (attacks.length === 0) {
    attacks.push({ name: 'Shambling Strike', damage: 4, stat: 'might' });
  }

  const notes: string[] = [];
  // Anything in the source with no damage (Ash Shell, a self-buff) can't be an
  // attack; keep its text as a note instead of silently dropping it.
  body.attacks
    .filter((a) => a.damage === 0 && a.properties)
    .forEach((a) => notes.push(`${a.name}: ${a.properties}`));

  return {
    hp: clamp(THRALL_CEILING.floorHp + (THRALL_CEILING.maxHp - THRALL_CEILING.floorHp) * f, THRALL_CEILING.floorHp, THRALL_CEILING.maxHp),
    dr: clamp(body.dr * p, 0, THRALL_CEILING.maxDr),
    ...(body.fp ? { fp: clamp(body.fp * p, 0, THRALL_CEILING.maxFp) } : {}),
    stats,
    attacks,
    notes,
  };
}

/**
 * Build the live card for a reanimated body. `casterName` goes on the card so
 * the roster and the combat strip only show it to the player who raised it.
 */
export function thrallFromBody(body: EnemyTemplate, casterName: string): Companion {
  const sheet = thrallSheetFrom(body);

  const abilities: CompanionAbility[] = sheet.attacks.map((a, i) => ({
    id: `thrall_${body.id}_atk_${i}`,
    name: a.name,
    actionSlot: 'major',
    cost: { type: 'free' },
    description: `${a.damage} damage. Rolls vs. ${a.stat}. ${body.name}'s own weapon, bound to your will.`,
    resetsOn: 'never',
  }));

  abilities.push({
    id: `thrall_${body.id}_bound`,
    name: 'Bound Servant',
    actionSlot: 'passive',
    cost: { type: 'free' },
    description: 'Serves until destroyed — no duration. Can be equipped with armor and weapons you give it. Only one Thrall of any kind may be active at a time.',
    resetsOn: 'passive',
  });

  return {
    id: `thrall_${body.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: body.name,
    kind: 'summon',
    thrall: true,
    tier: 'Dead Thrall',
    highConcept: `Reanimated ${body.name}.`,
    stats: sheet.stats,
    resources: {
      hp: { current: sheet.hp, max: sheet.hp },
      ...(sheet.fp ? { fp: { current: sheet.fp, max: sheet.fp } } : {}),
      dr: sheet.dr,
    },
    abilities,
    equipment: [],
    summonedBy: casterName || undefined,
    duration: 'Until destroyed',
    notes: sheet.notes.length ? sheet.notes.join(' ') : undefined,
  };
}
