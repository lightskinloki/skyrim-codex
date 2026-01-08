// Combat system types for Skyrim TTRPG GM Dashboard

// Complete status effect list from rulebook
export type StatusEffectType = 
  | 'bleeding'    // X damage at START of turn
  | 'burning'     // X damage at START of turn  
  | 'slowed'      // Cannot use Minor Action for movement
  | 'staggered'   // Loses next Minor Action
  | 'paralyzed'   // Cannot act at all
  | 'invisible'   // Cannot be targeted
  | 'hidden'      // In stealth
  | 'feared'      // Must flee
  | 'frenzied'    // Attacks nearest creature
  | 'calmed'      // Non-hostile
  | 'encased'     // Immune to damage, cannot act (Ash Shell)
  | 'exposed'     // Advantage on next attack against them
  | 'bracing';    // Shield raised, +DR until next turn

export interface StatusEffectInstance {
  id: string;
  type: StatusEffectType;
  duration: number;      // Rounds remaining (-1 = permanent, 0 = remove)
  intensity?: number;    // For bleeding/burning damage amount
  source: string;        // Who applied it
  bonusValue?: number;   // For bracing DR bonus
}

export interface CombatantAttack {
  name: string;
  damage: number;
  stat: string;
  properties?: string;
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'enemy' | 'ally';
  
  // Resources
  hp: { current: number; max: number };
  fp: { current: number; max: number };
  dr: number;
  baseDr: number;        // Original DR (for Sunder tracking)
  
  // Stats (for rolls and tiebreakers)
  stats: {
    might: number;
    agility: number;
    magic: number;
    guile: number;
  };
  
  // Combat state
  initiative: number | null;
  statusEffects: StatusEffectInstance[];
  isDead: boolean;       // HP <= 0, skipped in turn order
  
  // Action tracking (reset at START of turn)
  majorActionUsed: boolean;
  minorActionUsed: boolean;
  reactionUsed: boolean;
  
  // Flags
  isBoss: boolean;       // Immune to certain effects
  characterId?: string;  // Link to saved player character
  
  // Enemy-specific
  attacks?: CombatantAttack[];
  abilities?: string[];
  notes?: string;
}

export type CombatLogEntryType = 'damage' | 'heal' | 'status' | 'turn' | 'combat' | 'roll' | 'fp' | 'death' | 'effect';

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  round: number;
  type: CombatLogEntryType;
  actor: string;
  target?: string;
  description: string;
  value?: number;
}

// Exclude history from the snapshot to prevent infinite nesting
export interface CombatStateSnapshot {
  active: boolean;
  round: number;
  currentTurnIndex: number;
  currentTurnCombatantId: string | null;
  combatants: Combatant[];
  turnOrder: string[];
  log: CombatLogEntry[];
}

export interface CombatState extends CombatStateSnapshot {
  history: CombatStateSnapshot[];  // For undo
}

// Status effect display info
export const STATUS_EFFECT_INFO: Record<StatusEffectType, { icon: string; color: string; description: string }> = {
  bleeding: { icon: '🩸', color: 'text-red-500', description: 'Takes damage at start of turn' },
  burning: { icon: '🔥', color: 'text-orange-500', description: 'Takes fire damage at start of turn' },
  slowed: { icon: '🐢', color: 'text-blue-400', description: 'Cannot use Minor Action for movement' },
  staggered: { icon: '💫', color: 'text-yellow-500', description: 'Loses next Minor Action' },
  paralyzed: { icon: '⚡', color: 'text-purple-500', description: 'Cannot act' },
  invisible: { icon: '👻', color: 'text-gray-400', description: 'Cannot be targeted' },
  hidden: { icon: '🥷', color: 'text-gray-600', description: 'In stealth' },
  feared: { icon: '😱', color: 'text-yellow-600', description: 'Must flee' },
  frenzied: { icon: '😤', color: 'text-red-600', description: 'Attacks nearest creature' },
  calmed: { icon: '😌', color: 'text-green-400', description: 'Non-hostile' },
  encased: { icon: '🪨', color: 'text-stone-500', description: 'Immune to damage, cannot act' },
  exposed: { icon: '🎯', color: 'text-amber-500', description: 'Advantage on next attack against them' },
  bracing: { icon: '🛡️', color: 'text-cyan-500', description: 'Shield raised, bonus DR' },
};
