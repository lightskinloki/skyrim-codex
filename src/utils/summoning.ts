// Casting a summoning spell should hand the player a finished card, not a
// blank one. This is the single place that knows which spell calls which
// creature, and the single place that stamps a template into live state.
//
// Called from both cast surfaces — the character sheet's Known Spells (after
// the FP-spend modal is confirmed) and the combat portal's action stack — so a
// summon behaves the same whichever screen the player cast it from.

import { Companion } from '@/types/companion';
import { getSummonTemplate } from '@/data/summons';
import { defaultCompanions } from '@/data/companions';
import { companionStorage } from './companionStorage';

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
 * Deliberately absent: Dead Thrall. The guide gives its spell text but no stat
 * block of its own, so there's nothing honest to spawn from it yet.
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

/**
 * Clone a template into a live summon: fresh HP/FP, every limited ability
 * restored, stamped with its caster. Returns null if the template is unknown.
 */
export function spawnSummon(
  templateId: string,
  casterName: string,
  durationOverride?: string,
): Companion | null {
  const template = getSummonTemplate(templateId);
  if (!template) return null;

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
    duration: durationOverride ?? template.duration,
  };

  // If this is the very first thing ever written to the roster, seed the party
  // NPCs first — otherwise casting a summon before opening the roster would
  // leave every companion card missing.
  companionStorage.ensureSeeded(defaultCompanions);
  companionStorage.save(summon);
  announceCompanionsChanged();
  return summon;
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

  companionStorage.save(updated);
  announceCompanionsChanged();
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

  companionStorage.save(risen);
  announceCompanionsChanged();
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
  companionStorage.save(summon);
  announceCompanionsChanged();
}

function announceCompanionsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COMPANIONS_CHANGED));
  }
}
