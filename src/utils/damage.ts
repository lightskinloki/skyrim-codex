// THE ADDITIVE MULTIPLIER LAW — the Formula of Pain, as executable code.
//
// Sources (both must agree; they do):
//   Frogs-5-skyrim/GM Guide/Reference tables        -> DAMAGE & DR RULES / THE STACKING LAW
//   Frogs-5-skyrim/Toryggs legacy/legendary difficulty -> 1. Lethal Criticals, 2. The Formula of Pain
//
// The rule, in the GM's own words:
//   "add ALL flat bonuses first to build the Base Hit, then add the multipliers together
//    into ONE Total Multiplier and apply it once. Multipliers never multiply each other
//    and never chain: each multiplier past the first adds only its own step (its multiple
//    minus 1). A x2 on a x2 is a x3, never a x4."
//
// Total Multiplier = 1 + the step of each active multiplier.
//
// This module exists because the combat tracker accepts a damage number as given. It is a
// ledger: it subtracts DR and records the result. A number that no legal stack could have
// produced is therefore indistinguishable from a legal one unless something checks it.
// That check is auditReportedDamage().

export interface DamagePart {
  label: string;
  value: number;
}

export interface DamageMultiplier {
  label: string;
  /** The multiplier itself: 2 for x2, 3 for x3. Steps below x2 contribute nothing. */
  multiple: number;
}

/** A Critical Success is one x2 step. Never a multiplier on an already-multiplied total. */
export const CRIT_MULTIPLE = 2;

/**
 * Enemy vulnerability is "one more step in that same sum, never a multiplier on the total
 * — a fire Crit on a fire-vulnerable creature is x3, not x4." Modelled as a x2 step.
 */
export const VULNERABILITY_MULTIPLE = 2;

export interface DamageReadout {
  /** Sum of every flat number: weapon + perks + power attack + buffs + augments. */
  baseHit: number;
  /** Steps added by each active multiplier, in the order declared. */
  steps: { label: string; multiple: number; step: number }[];
  /** 1 + the step of each active multiplier. */
  totalMultiplier: number;
  /** baseHit x totalMultiplier, floored. DR is applied later, by the combat manager. */
  totalDamage: number;
  /** Multipliers that were declared but cannot raise damage (x1 or below). */
  ignored: { label: string; multiple: number }[];
}

function round(n: number, places = 4): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/** Step 1: add up all flat numbers first. */
export function baseHit(parts: readonly DamagePart[]): number {
  return Math.max(0, parts.reduce((sum, part) => sum + part.value, 0));
}

/** Step 2: add the multipliers together into one Total Multiplier. */
export function totalMultiplier(multipliers: readonly DamageMultiplier[]): number {
  return multipliers.reduce((total, m) => total + Math.max(0, m.multiple - 1), 1);
}

/**
 * Reads a damage stack under the Formula of Pain.
 * Never multiplies a multiplier: a x2 on a x2 returns x3.
 */
export function readDamage(
  parts: readonly DamagePart[],
  multipliers: readonly DamageMultiplier[] = [],
): DamageReadout {
  const base = baseHit(parts);
  const steps: DamageReadout['steps'] = [];
  const ignored: DamageReadout['ignored'] = [];

  for (const m of multipliers) {
    const step = m.multiple - 1;
    if (step > 0) steps.push({ label: m.label, multiple: m.multiple, step });
    else ignored.push({ label: m.label, multiple: m.multiple });
  }

  const total = 1 + steps.reduce((sum, s) => sum + s.step, 0);

  return {
    baseHit: base,
    steps,
    totalMultiplier: round(total),
    totalDamage: Math.floor(base * total),
    ignored,
  };
}

export interface DamageAudit {
  /** The highest total this stack can legally produce. */
  legalMax: number;
  reported: number;
  ok: boolean;
  /** How far the reported number exceeds the legal maximum. Zero when legal. */
  over: number;
  /** The multiplier the reported number would require, for explaining the gap. */
  impliedMultiplier: number;
  detail: string;
}

/**
 * Checks a damage number a player reported against the stack they actually declared.
 *
 * A report is legal when it does not exceed what the declared stack can produce. Lower is
 * legal and ordinary — DR, a saved-for-half, or a multiplier the player simply forgot to
 * claim all reduce the number. Higher is not legal under any reading of the law, because
 * multipliers may only add.
 */
export function auditReportedDamage(
  parts: readonly DamagePart[],
  multipliers: readonly DamageMultiplier[],
  reported: number,
): DamageAudit {
  const readout = readDamage(parts, multipliers);
  const legalMax = readout.totalDamage;
  const over = Math.max(0, reported - legalMax);
  const ok = reported <= legalMax;
  const impliedMultiplier = readout.baseHit > 0 ? round(reported / readout.baseHit, 2) : 0;

  let detail: string;
  if (ok) {
    detail =
      `Legal. ${legalMax} was available at x${readout.totalMultiplier}; ` +
      `the declared stack supports ${reported}.`;
  } else {
    detail =
      `Illegal. Base Hit ${readout.baseHit} at x${readout.totalMultiplier} is ${legalMax}, ` +
      `but ${reported} was reported — ${over} over the ceiling. That number needs ` +
      `x${impliedMultiplier} off a Base Hit of ${readout.baseHit}, which this stack cannot reach.`;
  }

  return { legalMax, reported, ok, over, impliedMultiplier, detail };
}

/**
 * The most dangerous legal hit from a given Base Hit, used when sizing an enemy's HP.
 * The reference warns against sizing enemies off a theoretical spike, so this is for
 * inspection only — never a target to balance toward.
 */
export function peakDamage(base: number, multipliers: readonly DamageMultiplier[]): number {
  return Math.floor(base * totalMultiplier(multipliers));
}

/** One-line summary of the stack for a combat log entry. */
export function describeStack(parts: readonly DamagePart[], multipliers: readonly DamageMultiplier[]): string {
  const readout = readDamage(parts, multipliers);
  const flat = parts.map((p) => `${p.label} ${p.value}`).join(' + ') || '0';
  const steps = readout.steps.map((s) => `${s.label} x${s.multiple} (+${s.step})`).join(' + ');
  const stack = steps ? `1 + ${steps}` : '1';
  return `Base Hit ${readout.baseHit} (${flat}) x${readout.totalMultiplier} [${stack}] = ${readout.totalDamage}`;
}
