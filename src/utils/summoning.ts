// Casting a summoning spell should hand the player a finished card, not a
// blank one. This is the single place that knows which spell calls which
// creature, how many may be held at once, and how a corpse becomes a thrall.
//
// Called from both cast surfaces — the character sheet's Known Spells (after
// the FP-spend modal is confirmed) and the combat portal's action stack — so a
// summon behaves the same whichever screen the player cast it from.

import { Companion } from '@/types/companion';
import { Character } from '@/types/character';
import { EnemyTemplate } from '@/data/enemies';
import { getSummonTemplate } from '@/data/summons';
import { defaultCompanions } from '@/data/companions';
import { companionStorage } from './companionStorage';
import { thrallFromBody } from './thrallConversion';

/** Fired on window whenever the roster changes, so open cards refresh live. */
export const COMPANIONS_CHANGED = 'skyrimTTRPG:companions-changed';

export interface SummonRule {
  templateId: string;
  /** Overrides the template's own duration (thralls persist; the Dremora Lord lasts 3 rounds). */
  duration?: string;
}

/**
 * Spell name -> creature. Names match `data/spells.ts` exactly.
 *
 * Dead Thrall is absent on purpose: it reanimates a *body*, not a species, so
 * it goes through `raiseThrall()` and the conversion in thrallConversion.ts.
 */
export const SUMMONS_BY_SPELL: Record<string, SummonRule> = {
  'Conjure Familiar': { templateId: 'summon_familiar' },
  'Raise Zombie': { templateId: 'summon_zombie' },
  'Reanimate Corpse': { templateId: 'summon_reanimated_corpse' },
  'Conjure Flame Atronach': { templateId: 'summon_flame_atronach' },
  'Conjure Frost Atronach': { templateId: 'summon_frost_atronach' },
  Revenant: { templateId: 'summon_revenant' },
  'Conjure Storm Atronach': { templateId: 'summon_storm_atronach' },
  'Dread Zombie': { templateId: 'summon_dread_zombie' },
  'Conjure Dremora Lord': { templateId: 'summon_dremora_lord' },
  // Master-tier thralls reuse the atronach sheets, but stay until destroyed.
  'Flame Thrall': { templateId: 'summon_flame_atronach', duration: 'Until destroyed' },
  'Frost Thrall': { templateId: 'summon_frost_atronach', duration: 'Until destroyed' },
  'Storm Thrall': { templateId: 'summon_storm_atronach', duration: 'Until destroyed' },
};

export const summonRuleFor = (spellName: string): SummonRule | undefined =>
  SUMMONS_BY_SPELL[spellName];

// --- How many may be held at once -------------------------------------------

export interface SummonLimits {
  /** Active summoned/reanimated creatures at once. Base 1; Twin Souls makes it 2. */
  active: number;
  /** Of those, how many may be Thralls. "One Thrall of any kind" = 1. */
  thralls: number;
}

/**
 * The rules' own ceiling, read off the character:
 *
 *   base 1 creature — Twin Souls (Expert Conjuration) says "you may have two",
 *                     which only means anything if everyone else has one.
 *   thralls 1      — "You can only have one Thrall of any kind active."
 *
 * `override` is the seam for hosted play: when the GM screen can set encounter
 * rules, it will raise these numbers on the fly (a GM running a looser table,
 * or an NPC conjurer with their own allowance). Nothing else needs to change.
 */
export function summonLimitsFor(
  character: Character | null,
  override?: Partial<SummonLimits>,
): SummonLimits {
  const rank = character?.skills?.find((s) => s.skillId === 'conjuration')?.rank;
  const twinSouls = rank === 'Expert' || rank === 'Master';

  return {
    active: override?.active ?? (twinSouls ? 2 : 1),
    thralls: override?.thralls ?? 1,
  };
}

export type SpawnFailure = 'unknown_template' | 'at_capacity' | 'thrall_slot_taken';

export interface SpawnRefusal {
  ok: false;
  reason: SpawnFailure;
  /** The ceiling that was hit, and how many are already held. */
  limit?: number;
  active?: number;
}

// A flat result rather than a discriminated union: this repo compiles with
// strictNullChecks off, which quietly defeats boolean-literal narrowing.
export interface SpawnResult {
  ok: boolean;
  summon?: Companion;
  reason?: SpawnFailure;
  limit?: number;
  active?: number;
}

/** Would this caster's next summon be refused? Checkable before spending FP. */
export function summonCapacityError(
  casterName: string,
  limits: SummonLimits,
): SpawnRefusal | null {
  const active = summonsFor(casterName);
  if (active.length >= limits.active) {
    return { ok: false, reason: 'at_capacity', limit: limits.active, active: active.length };
  }
  return null;
}

/**
 * Clone a template into a live summon: fresh HP/FP, every limited ability
 * restored, stamped with its caster, and refused if the caster is already at
 * their allowance.
 */
export function spawnSummon(
  templateId: string,
  casterName: string,
  opts: { duration?: string; limits?: SummonLimits } = {},
): SpawnResult {
  const template = getSummonTemplate(templateId);
  if (!template) return { ok: false, reason: 'unknown_template' };

  const limits = opts.limits ?? { active: 1, thralls: 1 };
  const blocked = summonCapacityError(casterName, limits);
  if (blocked) return blocked;

  const summon: Companion = {
    ...template,
    id: `${template.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    resources: {
      ...template.resources,
      ...(template.resources.hp
        ? { hp: { current: template.resources.hp.max, max: template.resources.hp.max } }
        : {}),
      ...(template.resources.fp
        ? { fp: { current: template.resources.fp.max, max: template.resources.fp.max } }
        : {}),
    },
    abilities: template.abilities.map((a) => ({
      ...a,
      ...(typeof a.maxUses === 'number' ? { usesRemaining: a.maxUses } : {}),
      used: false,
    })),
    summonedBy: casterName || undefined,
    duration: opts.duration ?? template.duration,
  };

  save(summon);
  return { ok: true, summon };
}

/** Would a Dead Thrall cast be refused? Checkable before the picker opens. */
export function thrallCapacityError(
  casterName: string,
  limits: SummonLimits,
): SpawnRefusal | null {
  const active = summonsFor(casterName);
  const thralls = active.filter((s) => s.thrall).length;

  if (thralls >= limits.thralls) {
    return { ok: false, reason: 'thrall_slot_taken', limit: limits.thralls, active: thralls };
  }
  if (active.length >= limits.active) {
    return { ok: false, reason: 'at_capacity', limit: limits.active, active: active.length };
  }
  return null;
}

/**
 * Dead Thrall: reanimate a corpse you actually have. The body's own sheet is
 * compressed by thrallConversion.ts, so a 1,000 HP boss binds to the same
 * ceiling as a Dremora Lord rather than becoming a 1,000 HP tank.
 */
export function raiseThrall(
  body: EnemyTemplate,
  casterName: string,
  opts: { limits?: SummonLimits } = {},
): SpawnResult {
  const limits = opts.limits ?? { active: 1, thralls: 1 };
  const blocked = thrallCapacityError(casterName, limits);
  if (blocked) return blocked;

  const thrall = thrallFromBody(body, casterName);
  save(thrall);
  return { ok: true, summon: thrall };
}

/** Every active summon belonging to this caster (unattributed ones show for everyone). */
export function summonsFor(casterName: string): Companion[] {
  return companionStorage
    .getAll()
    .filter(
      (c) => c.kind === 'summon' && (!c.summonedBy || !casterName || c.summonedBy === casterName),
    );
}

/**
 * Apply damage/healing to a summon and enforce the rise rule.
 *
 * A Revenant reduced to 0 HP is not destroyed: it stays on the field, marked
 * `risePending`, and becomes its Risen form at the start of its next turn
 * (`risePendingSummons`, called on End Turn) — or immediately if the player
 * presses Rise, for tables that resolve it on the spot.
 */
export function applySummonDamage(summon: Companion, delta: number): Companion {
  const hp = summon.resources.hp;
  if (!hp) return summon;

  const next = Math.max(0, Math.min(hp.max, hp.current + delta));
  const updated: Companion = {
    ...summon,
    resources: { ...summon.resources, hp: { ...hp, current: next } },
    ...(next === 0 && summon.risesAs ? { risePending: true } : {}),
  };

  save(updated);
  return updated;
}

/** Swap a fallen card for the form it rises as, keeping its slot, owner and duration. */
export function riseSummon(summon: Companion): Companion | null {
  if (!summon.risesAs) return null;
  const template = getSummonTemplate(summon.risesAs);
  if (!template) return null;

  const risen: Companion = {
    ...template,
    id: summon.id,
    summonedBy: summon.summonedBy,
    duration: summon.duration ?? template.duration,
    resources: {
      ...template.resources,
      ...(template.resources.hp
        ? { hp: { current: template.resources.hp.max, max: template.resources.hp.max } }
        : {}),
    },
    abilities: template.abilities.map((a) => ({
      ...a,
      ...(typeof a.maxUses === 'number' ? { usesRemaining: a.maxUses } : {}),
      used: false,
    })),
    risePending: false,
  };

  save(risen);
  return risen;
}

/** Flip every fallen summon that is due to rise. Returns how many rose. */
export function risePendingSummons(casterName?: string): number {
  const due = companionStorage
    .getAll()
    .filter((c) => c.kind === 'summon' && c.risePending && (!casterName || c.summonedBy === casterName));

  due.forEach((summon) => riseSummon(summon));
  return due.length;
}

export function dismissSummon(id: string): void {
  companionStorage.delete(id);
  announceCompanionsChanged();
}

export function saveSummon(summon: Companion): void {
  save(summon);
}

/** One write path, so the seed-before-first-save bug can't come back. */
function save(summon: Companion): void {
  // If this is the very first thing ever written to the roster, seed the party
  // NPCs first — otherwise summoning before opening the roster would leave
  // every companion card missing.
  companionStorage.ensureSeeded(defaultCompanions);
  companionStorage.save(summon);
  announceCompanionsChanged();
}

function announceCompanionsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COMPANIONS_CHANGED));
  }
}
