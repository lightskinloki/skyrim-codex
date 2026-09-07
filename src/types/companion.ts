// Companion & Summon card types.
//
// Companions (Bjorn, Ylva, Nora, Varon, Mila, GEAR...) and summons (a conjured
// Dremora Lord, an Ice Atronach, a familiar) are both finished, non-leveling
// builds — unlike a PC they don't spend AP through the creator/advancement
// flow, they're just a fixed sheet a player needs to read and act through at
// the table. So this is a lighter model than Character: no skill tree, no
// progression — just stats, resources, and a flat list of actionable
// abilities with their own use-tracking, sourced from each NPC's real sheet
// (Toryggs legacy/Npcs/ + the #npcs channel history).

export interface CompanionStats {
  might: number;
  agility: number;
  magic: number;
  guile: number;
}

export interface CompanionResources {
  /** Omit for a construct whose FP pool IS its structural integrity (e.g. GEAR's Aetherium Core) — don't invent a fake HP number to fill the slot. */
  hp?: { current: number; max: number };
  fp: { current: number; max: number };
  dr: number;
}

export type AbilityCost =
  | { type: 'fp'; amount: number }
  | { type: 'hp'; amount: number }
  | { type: 'free' };

export type AbilityReset = 'per-turn' | 'per-combat' | 'per-adventure' | 'never' | 'passive';

export interface CompanionAbility {
  id: string;
  name: string;
  actionSlot: 'major' | 'minor' | 'reaction' | 'passive' | 'free';
  cost: AbilityCost;
  description: string;
  /** For limited-use abilities: how many uses before it resets, and the reset trigger. */
  maxUses?: number;
  usesRemaining?: number;
  resetsOn?: AbilityReset;
  /** True once toggled "used" this instance — for once-per-combat/adventure flags without a numeric count. */
  used?: boolean;
}

export interface CompanionEquipmentItem {
  name: string;
  description?: string;
  damage?: number;
  dr?: number;
}

export type CompanionKind = 'companion' | 'summon';

export interface Companion {
  id: string;
  name: string;
  kind: CompanionKind;
  /** e.g. "Master Companion (6 AP)", "Adept Companion (4 AP)", "Apprentice", "Master's Form summon" */
  tier: string;
  race?: string;
  highConcept?: string;
  /** Omit entirely (rather than guessing) when the source sheet doesn't give Target Numbers — e.g. a civilian NPC sheet that only lists HP/FP/DR. */
  stats?: CompanionStats;
  resources: CompanionResources;
  abilities: CompanionAbility[];
  equipment: CompanionEquipmentItem[];
  /** Short, table-usable behavior note — how they act in combat, what they avoid. */
  combatNote?: string;
  /** For summons: who called it and how long it lasts. Irrelevant for companions. */
  summonedBy?: string;
  duration?: string;
  notes?: string;
}
