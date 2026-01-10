// Combat state manager with pure functions for Skyrim TTRPG
import { 
  CombatState, 
  CombatStateSnapshot, 
  Combatant, 
  CombatLogEntry, 
  StatusEffectInstance,
  StatusEffectType 
} from '@/types/combat';
import { EnemyTemplate } from '@/data/enemies';
import { Character } from '@/types/character';
import { calculateTotalDR } from '@/utils/characterCalculations';

// ============ STATE MANAGEMENT ============

export function initializeCombat(): CombatState {
  return {
    active: false,
    round: 0,
    currentTurnIndex: -1,
    currentTurnCombatantId: null,
    combatants: [],
    turnOrder: [],
    log: [],
    history: [],
  };
}

export function createSnapshot(state: CombatState): CombatStateSnapshot {
  const { history, ...stateWithoutHistory } = state;
  return JSON.parse(JSON.stringify(stateWithoutHistory));
}

export function saveToHistory(state: CombatState): CombatState {
  const snapshot = createSnapshot(state);
  // Keep last 20 states for undo
  return {
    ...state,
    history: [...state.history.slice(-19), snapshot],
  };
}

export function undo(state: CombatState): CombatState | null {
  if (state.history.length === 0) return null;
  const previousState = state.history[state.history.length - 1];
  return {
    ...previousState,
    history: state.history.slice(0, -1),
  };
}

// ============ COMBATANT CREATION ============

export function createCombatantFromEnemy(template: EnemyTemplate, nameOverride?: string): Combatant {
  return {
    id: crypto.randomUUID(),
    name: nameOverride || template.name,
    type: 'enemy',
    hp: { current: template.hp, max: template.hp },
    fp: { current: template.fp || 0, max: template.fp || 0 },
    dr: template.dr,
    baseDr: template.dr,
    sunderCount: 0,
    stats: { ...template.stats },
    initiative: null,
    statusEffects: [],
    isDead: false,
    actions: { majorUsed: false, minorUsed: false, bonusCount: 0, bonusUsed: 0, reactionUsed: false, freeActionsUsed: 0 },
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    isBoss: template.isBoss || false,
    attacks: template.attacks ? [...template.attacks] : [],
    abilities: template.abilities ? [...template.abilities] : [],
  };
}

export function createCombatantFromCharacter(character: Character): Combatant {
  const dr = calculateTotalDR(character.equipment, character.standingStone);
  return {
    id: crypto.randomUUID(),
    name: character.name,
    type: 'player',
    hp: { current: character.resources.hp.current, max: character.resources.hp.max },
    fp: { current: character.resources.fp.current, max: character.resources.fp.max },
    dr,
    baseDr: dr,
    sunderCount: 0,
    stats: { ...character.stats },
    initiative: null,
    statusEffects: [],
    isDead: false,
    actions: { majorUsed: false, minorUsed: false, bonusCount: 0, bonusUsed: 0, reactionUsed: false, freeActionsUsed: 0 },
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    isBoss: false,
    characterId: character.id,
  };
}

export interface CustomCombatantOptions {
  name: string;
  type: 'player' | 'enemy' | 'ally';
  hp: number;
  fp?: number;
  dr: number;
  stats: { might: number; agility: number; magic: number; guile: number };
  isBoss?: boolean;
  attacks?: { name: string; damage: number; stat: string; properties?: string }[];
  abilities?: string[];
}

export function createCustomCombatant(options: CustomCombatantOptions): Combatant {
  return {
    id: crypto.randomUUID(),
    name: options.name,
    type: options.type,
    hp: { current: options.hp, max: options.hp },
    fp: { current: options.fp || 0, max: options.fp || 0 },
    dr: options.dr,
    baseDr: options.dr,
    sunderCount: 0, // FIXED: Added this missing field
    stats: options.stats,
    initiative: null,
    statusEffects: [],
    isDead: false,
    // FIXED: Added the new comprehensive actions object
    actions: { 
      majorUsed: false, 
      minorUsed: false, 
      bonusCount: 0, 
      bonusUsed: 0, 
      reactionUsed: false, 
      freeActionsUsed: 0 
    },
    // Keep legacy fields for safety (backward compatibility)
    majorActionUsed: false,
    minorActionUsed: false,
    reactionUsed: false,
    isBoss: options.isBoss || false,
    attacks: options.attacks,
    abilities: options.abilities,
  };
}

// ============ COMBATANT MANAGEMENT ============

export function addCombatant(state: CombatState, combatant: Combatant): CombatState {
  const newState = saveToHistory(state);
  return {
    ...newState,
    combatants: [...newState.combatants, combatant],
  };
}

export function removeCombatant(state: CombatState, combatantId: string): CombatState {
  const combatant = state.combatants.find(c => c.id === combatantId);
  const newState = saveToHistory(state);
  
  let updatedState = {
    ...newState,
    combatants: newState.combatants.filter(c => c.id !== combatantId),
    turnOrder: newState.turnOrder.filter(id => id !== combatantId),
  };
  
  // Add log entry
  if (combatant) {
    updatedState = addLogEntry(updatedState, {
      round: state.round,
      type: 'combat',
      actor: 'System',
      description: `${combatant.name} removed from combat`,
    });
  }
  
  return updatedState;
}

export function updateCombatant(state: CombatState, combatantId: string, updates: Partial<Combatant>): CombatState {
  return {
    ...state,
    combatants: state.combatants.map(c =>
      c.id === combatantId ? { ...c, ...updates } : c
    ),
  };
}

// ============ INITIATIVE ============

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollAllInitiative(state: CombatState): CombatState {
  const newState = saveToHistory(state);
  const updatedCombatants = newState.combatants.map(c => ({
    ...c,
    initiative: rollD20(),
  }));
  
  let updatedState = {
    ...newState,
    combatants: updatedCombatants,
  };
  
  return addLogEntry(updatedState, {
    round: state.round,
    type: 'roll',
    actor: 'System',
    description: 'Initiative rolled for all combatants',
  });
}

export function rollEnemyInitiative(state: CombatState): CombatState {
  const newState = saveToHistory(state);
  
  // Roll once for ALL enemies - they share the same initiative
  const enemyInitiativeRoll = rollD20();
  
  const updatedCombatants = newState.combatants.map(c => ({
    ...c,
    initiative: c.type === 'enemy' ? enemyInitiativeRoll : c.initiative,
  }));
  
  let updatedState = {
    ...newState,
    combatants: updatedCombatants,
  };
  
  return addLogEntry(updatedState, {
    round: state.round,
    type: 'roll',
    actor: 'System',
    description: `Initiative rolled for enemies: ${enemyInitiativeRoll}`,
  });
}

export function setInitiative(state: CombatState, combatantId: string, value: number): CombatState {
  return {
    ...state,
    combatants: state.combatants.map(c =>
      c.id === combatantId ? { ...c, initiative: value } : c
    ),
  };
}

export function sortByInitiative(state: CombatState): CombatState {
  // Separate players/allies from enemies
  const playersAndAllies = state.combatants.filter(c => !c.isDead && c.type !== 'enemy');
  const enemies = state.combatants.filter(c => !c.isDead && c.type === 'enemy');
  
  // Sort players/allies by initiative ASC (lowest roll goes first), then by agility ASC (tiebreaker)
  const sortedPlayers = [...playersAndAllies].sort((a, b) => {
    const initDiff = (a.initiative || 0) - (b.initiative || 0);
    if (initDiff !== 0) return initDiff;
    return a.stats.agility - b.stats.agility;
  });
  
  // Get the enemy initiative (they all share the same one)
  const enemyInitiative = enemies.length > 0 ? (enemies[0].initiative || 0) : Infinity;
  
  // Find lowest enemy agility for tiebreaker
  const lowestEnemyAgility = enemies.length > 0 
    ? Math.min(...enemies.map(e => e.stats.agility))
    : Infinity;
  
  // Build the turn order: insert "GM_TURN" marker where enemies go based on their shared initiative
  const turnOrder: string[] = [];
  let enemyTurnInserted = false;
  
  for (const player of sortedPlayers) {
    const playerInit = player.initiative || 0;
    const playerAgility = player.stats.agility;
    
    // Check if enemy turn should come before this player
    if (!enemyTurnInserted && enemies.length > 0) {
      if (enemyInitiative < playerInit) {
        // Enemy initiative is lower (goes first)
        turnOrder.push('GM_TURN');
        enemyTurnInserted = true;
      } else if (enemyInitiative === playerInit && lowestEnemyAgility < playerAgility) {
        // Same initiative, but enemy has lower agility (goes first)
        turnOrder.push('GM_TURN');
        enemyTurnInserted = true;
      }
    }
    
    turnOrder.push(player.id);
  }
  
  // If enemy turn wasn't inserted yet (enemies go last), add it at the end
  if (!enemyTurnInserted && enemies.length > 0) {
    turnOrder.push('GM_TURN');
  }
  
  return {
    ...state,
    turnOrder,
  };
}

// ============ TURN MANAGEMENT ============

export function startCombat(state: CombatState): CombatState {
  const sortedState = sortByInitiative(state);
  const firstTurnId = sortedState.turnOrder[0] || null;
  
  let newState = saveToHistory({
    ...sortedState,
    active: true,
    round: 1,
    currentTurnIndex: 0,
    currentTurnCombatantId: firstTurnId,
  });
  
  // Log combat start
  newState = addLogEntry(newState, {
    round: 1,
    type: 'combat',
    actor: 'System',
    description: 'Combat has begun!',
  });
  
  // Apply start-of-turn effects for first turn
  if (firstTurnId) {
    if (firstTurnId === 'GM_TURN') {
      // GM turn - reset actions for all enemies
      const enemies = newState.combatants.filter(c => c.type === 'enemy' && !c.isDead);
      for (const enemy of enemies) {
        newState = resetActions(newState, enemy.id);
        newState = applyStartOfTurnEffects(newState, enemy.id);
      }
      newState = addLogEntry(newState, {
        round: 1,
        type: 'turn',
        actor: 'GM',
        description: `GM's turn begins (all enemies act)`,
      });
    } else {
      newState = resetActions(newState, firstTurnId);
      newState = applyStartOfTurnEffects(newState, firstTurnId);
      
      const combatant = newState.combatants.find(c => c.id === firstTurnId);
      if (combatant) {
        newState = addLogEntry(newState, {
          round: 1,
          type: 'turn',
          actor: combatant.name,
          description: `${combatant.name}'s turn begins`,
        });
      }
    }
  }
  
  return newState;
}

function findNextValidTurn(state: CombatState, startIndex: number): { index: number; newRound: boolean } {
  let index = startIndex;
  let newRound = false;
  const totalTurns = state.turnOrder.length;
  
  if (totalTurns === 0) return { index: -1, newRound: false };
  
  // Try to find next valid turn entry, wrapping around if needed
  for (let i = 0; i < totalTurns; i++) {
    if (index >= totalTurns) {
      index = 0;
      newRound = true;
    }
    
    const turnId = state.turnOrder[index];
    
    // GM_TURN is always valid if there are living enemies
    if (turnId === 'GM_TURN') {
      const hasLivingEnemies = state.combatants.some(c => c.type === 'enemy' && !c.isDead);
      if (hasLivingEnemies) {
        return { index, newRound };
      }
    } else {
      // Regular combatant - check if alive
      const combatant = state.combatants.find(c => c.id === turnId);
      if (combatant && !combatant.isDead) {
        return { index, newRound };
      }
    }
    
    index++;
  }
  
  // No valid turns left
  return { index: -1, newRound: false };
}

export function nextTurn(state: CombatState): CombatState {
  if (!state.active) return state;
  
  // Tick status effects at end of current turn
  let newState = state;
  if (state.currentTurnCombatantId) {
    if (state.currentTurnCombatantId === 'GM_TURN') {
      // Tick effects for all enemies
      const enemies = newState.combatants.filter(c => c.type === 'enemy' && !c.isDead);
      for (const enemy of enemies) {
        newState = tickStatusEffects(newState, enemy.id);
      }
    } else {
      newState = tickStatusEffects(newState, state.currentTurnCombatantId);
    }
  }
  
  // Find next valid turn
  const { index: newIndex, newRound } = findNextValidTurn(newState, state.currentTurnIndex + 1);
  
  if (newIndex === -1) {
    // No valid turns left, end combat
    return endCombat(newState);
  }
  
  const newRoundNum = newRound ? state.round + 1 : state.round;
  const newTurnId = newState.turnOrder[newIndex];
  
  newState = saveToHistory({
    ...newState,
    round: newRoundNum,
    currentTurnIndex: newIndex,
    currentTurnCombatantId: newTurnId,
  });
  
  // Log new round if applicable
  if (newRound) {
    newState = addLogEntry(newState, {
      round: newRoundNum,
      type: 'combat',
      actor: 'System',
      description: `Round ${newRoundNum} begins`,
    });
  }
  
  // Reset actions and apply start-of-turn effects
  if (newTurnId) {
    if (newTurnId === 'GM_TURN') {
      // GM turn - reset actions for all enemies
      const enemies = newState.combatants.filter(c => c.type === 'enemy' && !c.isDead);
      for (const enemy of enemies) {
        newState = resetActions(newState, enemy.id);
        newState = applyStartOfTurnEffects(newState, enemy.id);
      }
      newState = addLogEntry(newState, {
        round: newRoundNum,
        type: 'turn',
        actor: 'GM',
        description: `GM's turn begins (all enemies act)`,
      });
    } else {
      newState = resetActions(newState, newTurnId);
      newState = applyStartOfTurnEffects(newState, newTurnId);
      
      const combatant = newState.combatants.find(c => c.id === newTurnId);
      if (combatant) {
        newState = addLogEntry(newState, {
          round: newRoundNum,
          type: 'turn',
          actor: combatant.name,
          description: `${combatant.name}'s turn begins`,
        });
      }
    }
  }
  
  return newState;
}

export function resetActions(state: CombatState, combatantId: string): CombatState {
  // Skip if it's a special marker
  if (combatantId === 'GM_TURN') return state;
  
  return {
    ...state,
    combatants: state.combatants.map(c =>
      c.id === combatantId
        ? { ...c, majorActionUsed: false, minorActionUsed: false, reactionUsed: false }
        : c
    ),
  };
}

export function endCombat(state: CombatState): CombatState {
  let newState = saveToHistory({
    ...state,
    active: false,
    currentTurnIndex: -1,
    currentTurnCombatantId: null,
  });
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'combat',
    actor: 'System',
    description: 'Combat has ended',
  });
}

// ============ DAMAGE & HEALING ============

export function applyDamage(
  state: CombatState, 
  targetId: string, 
  amount: number, 
  source: string, 
  bypassDR: boolean = false
): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  // Check for encased (immune to damage)
  if (target.statusEffects.some(e => e.type === 'encased')) {
    return addLogEntry(state, {
      round: state.round,
      type: 'damage',
      actor: source,
      target: target.name,
      description: `${target.name} is encased and immune to damage!`,
      value: 0,
    });
  }
  
  // Check for bracing bonus
  const bracingEffect = target.statusEffects.find(e => e.type === 'bracing');
  const totalDR = target.dr + (bracingEffect?.bonusValue || 0);
  
  const reduction = bypassDR ? 0 : totalDR;
  const finalDamage = Math.max(0, amount - reduction);
  const newHP = Math.max(0, target.hp.current - finalDamage);
  const wasDead = target.isDead;
  const isDead = newHP <= 0;
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, hp: { ...c.hp, current: newHP }, isDead }
        : c
    ),
  });
  
  // Log damage
  const drText = reduction > 0 ? ` (${reduction} absorbed by DR)` : '';
  newState = addLogEntry(newState, {
    round: state.round,
    type: 'damage',
    actor: source,
    target: target.name,
    description: `${target.name} takes ${finalDamage} damage${drText}`,
    value: finalDamage,
  });
  
  // Log death if combatant just died
  if (isDead && !wasDead) {
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'death',
      actor: source,
      target: target.name,
      description: `${target.name} has fallen!`,
    });
  }
  
  return newState;
}

export function applyRawDamage(state: CombatState, targetId: string, amount: number, source: string): CombatState {
  return applyDamage(state, targetId, amount, source, true);
}

export function applyHealing(state: CombatState, targetId: string, amount: number, source: string): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  const newHP = Math.min(target.hp.max, target.hp.current + amount);
  const actualHealing = newHP - target.hp.current;
  const wasRevived = target.isDead && newHP > 0;
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, hp: { ...c.hp, current: newHP }, isDead: newHP <= 0 }
        : c
    ),
  });
  
  if (wasRevived) {
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'heal',
      actor: source,
      target: target.name,
      description: `${target.name} has been revived!`,
    });
    
    // Re-add to turn order if revived
    if (!newState.turnOrder.includes(targetId)) {
      newState = sortByInitiative(newState);
    }
  }
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'heal',
    actor: source,
    target: target.name,
    description: `${target.name} heals ${actualHealing} HP`,
    value: actualHealing,
  });
}

export function applyFPDamage(state: CombatState, targetId: string, amount: number, source: string): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  const newFP = Math.max(0, target.fp.current - amount);
  const actualDrain = target.fp.current - newFP;
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, fp: { ...c.fp, current: newFP } }
        : c
    ),
  });
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'fp',
    actor: source,
    target: target.name,
    description: `${target.name} loses ${actualDrain} FP`,
    value: actualDrain,
  });
}

export function applyFPRestore(state: CombatState, targetId: string, amount: number, source: string): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  const newFP = Math.min(target.fp.max, target.fp.current + amount);
  const actualRestore = newFP - target.fp.current;
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, fp: { ...c.fp, current: newFP } }
        : c
    ),
  });
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'fp',
    actor: source,
    target: target.name,
    description: `${target.name} restores ${actualRestore} FP`,
    value: actualRestore,
  });
}

export function sunderArmor(state: CombatState, targetId: string, source: string): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target || target.dr <= 0) return state;
  
  const newDR = target.dr - 1;
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, dr: newDR }
        : c
    ),
  });
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'effect',
    actor: source,
    target: target.name,
    description: `${target.name}'s armor is sundered! DR reduced to ${newDR}`,
  });
}

// ============ STATUS EFFECTS ============

const BOSS_IMMUNE_EFFECTS: StatusEffectType[] = ['paralyzed', 'feared', 'frenzied', 'calmed'];

export function addStatusEffect(
  state: CombatState, 
  targetId: string, 
  effectType: StatusEffectType,
  duration: number,
  source: string,
  intensity?: number,
  bonusValue?: number
): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  // Check boss immunity for certain effects
  if (target.isBoss && BOSS_IMMUNE_EFFECTS.includes(effectType)) {
    return addLogEntry(state, {
      round: state.round,
      type: 'status',
      actor: source,
      target: target.name,
      description: `${target.name} resists ${effectType} (Boss immunity)`,
    });
  }
  
  const newEffect: StatusEffectInstance = {
    id: crypto.randomUUID(),
    type: effectType,
    duration,
    source,
    intensity,
    bonusValue,
  };
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, statusEffects: [...c.statusEffects, newEffect] }
        : c
    ),
  });
  
  const durationText = duration > 0 ? ` for ${duration} round${duration > 1 ? 's' : ''}` : ' (permanent)';
  const intensityText = intensity ? ` (${intensity})` : '';
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'status',
    actor: source,
    target: target.name,
    description: `${target.name} is now ${effectType}${intensityText}${durationText}`,
  });
}

export function removeStatusEffect(state: CombatState, targetId: string, effectId: string): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  const effect = target.statusEffects.find(e => e.id === effectId);
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, statusEffects: c.statusEffects.filter(e => e.id !== effectId) }
        : c
    ),
  });
  
  if (effect) {
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'status',
      actor: 'System',
      target: target.name,
      description: `${effect.type} removed from ${target.name}`,
    });
  }
  
  return newState;
}

export function removeAllStatusEffects(state: CombatState, targetId: string, effectType: StatusEffectType): CombatState {
  const target = state.combatants.find(c => c.id === targetId);
  if (!target) return state;
  
  const hasEffect = target.statusEffects.some(e => e.type === effectType);
  if (!hasEffect) return state;
  
  let newState = saveToHistory({
    ...state,
    combatants: state.combatants.map(c =>
      c.id === targetId
        ? { ...c, statusEffects: c.statusEffects.filter(e => e.type !== effectType) }
        : c
    ),
  });
  
  return addLogEntry(newState, {
    round: state.round,
    type: 'status',
    actor: 'System',
    target: target.name,
    description: `All ${effectType} effects removed from ${target.name}`,
  });
}

export function applyStartOfTurnEffects(state: CombatState, combatantId: string): CombatState {
  const combatant = state.combatants.find(c => c.id === combatantId);
  if (!combatant) return state;
  
  let newState = state;
  
  // Apply bleeding damage (stacks)
  const bleedingEffects = combatant.statusEffects.filter(e => e.type === 'bleeding');
  const totalBleed = bleedingEffects.reduce((sum, e) => sum + (e.intensity || 1), 0);
  if (totalBleed > 0) {
    newState = applyRawDamage(newState, combatantId, totalBleed, 'Bleeding');
  }
  
  // Apply burning damage (stacks)
  const burningEffects = combatant.statusEffects.filter(e => e.type === 'burning');
  const totalBurn = burningEffects.reduce((sum, e) => sum + (e.intensity || 1), 0);
  if (totalBurn > 0) {
    newState = applyRawDamage(newState, combatantId, totalBurn, 'Burning');
  }
  
  // Check staggered - lose Minor Action
  if (combatant.statusEffects.some(e => e.type === 'staggered')) {
    newState = {
      ...newState,
      combatants: newState.combatants.map(c =>
        c.id === combatantId ? { ...c, minorActionUsed: true } : c
      ),
    };
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'effect',
      actor: 'System',
      target: combatant.name,
      description: `${combatant.name} loses Minor Action (Staggered)`,
    });
  }
  
  // Check paralyzed or encased - lose all actions
  if (combatant.statusEffects.some(e => e.type === 'paralyzed' || e.type === 'encased')) {
    newState = {
      ...newState,
      combatants: newState.combatants.map(c =>
        c.id === combatantId
          ? { ...c, majorActionUsed: true, minorActionUsed: true }
          : c
      ),
    };
    const effectType = combatant.statusEffects.find(e => e.type === 'paralyzed' || e.type === 'encased')?.type;
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'effect',
      actor: 'System',
      target: combatant.name,
      description: `${combatant.name} cannot act (${effectType})`,
    });
  }
  
  // Check slowed - lose Minor Action for movement (we just mark it used)
  if (combatant.statusEffects.some(e => e.type === 'slowed')) {
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'effect',
      actor: 'System',
      target: combatant.name,
      description: `${combatant.name} is Slowed (cannot use Minor Action for movement)`,
    });
  }
  
  return newState;
}

export function tickStatusEffects(state: CombatState, combatantId: string): CombatState {
  // Called at END of a combatant's turn - decrement durations and remove expired
  const combatant = state.combatants.find(c => c.id === combatantId);
  if (!combatant) return state;
  
  const expiredEffects: StatusEffectInstance[] = [];
  
  const updatedEffects = combatant.statusEffects
    .map(e => {
      if (e.duration <= 0) return e; // Permanent effects
      const newDuration = e.duration - 1;
      if (newDuration <= 0) {
        expiredEffects.push(e);
        return null;
      }
      return { ...e, duration: newDuration };
    })
    .filter((e): e is StatusEffectInstance => e !== null);
  
  let newState: CombatState = {
    ...state,
    combatants: state.combatants.map(c =>
      c.id === combatantId ? { ...c, statusEffects: updatedEffects } : c
    ),
  };
  
  // Log expired effects
  for (const effect of expiredEffects) {
    newState = addLogEntry(newState, {
      round: state.round,
      type: 'status',
      actor: 'System',
      target: combatant.name,
      description: `${effect.type} has worn off from ${combatant.name}`,
    });
  }
  
  return newState;
}

// ============ LOGGING ============

export function addLogEntry(
  state: CombatState, 
  entry: Omit<CombatLogEntry, 'id' | 'timestamp'>
): CombatState {
  const newEntry: CombatLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };
  
  return {
    ...state,
    log: [...state.log, newEntry],
  };
}

export function clearLog(state: CombatState): CombatState {
  return {
    ...state,
    log: [],
  };
}

// ============ UTILITY ============

export function getCombatantById(state: CombatState, id: string): Combatant | undefined {
  return state.combatants.find(c => c.id === id);
}

export function getAliveCombatants(state: CombatState): Combatant[] {
  return state.combatants.filter(c => !c.isDead);
}

export function getCombatantsByType(state: CombatState, type: 'player' | 'enemy' | 'ally'): Combatant[] {
  return state.combatants.filter(c => c.type === type);
}

export function isCurrentTurn(state: CombatState, combatantId: string): boolean {
  return state.currentTurnCombatantId === combatantId;
}

export function formatLogForExport(state: CombatState): string {
  let output = '=== COMBAT LOG ===\n\n';
  let currentRound = 0;
  
  for (const entry of state.log) {
    if (entry.round !== currentRound) {
      currentRound = entry.round;
      output += `\n--- Round ${currentRound} ---\n`;
    }
    
    const time = new Date(entry.timestamp).toLocaleTimeString();
    output += `[${time}] ${entry.description}\n`;
  }
  
  return output;
}

// Export as object for convenient imports
export const combatManager = {
  initializeCombat,
  createSnapshot,
  saveToHistory,
  undo,
  createCombatantFromEnemy,
  createCombatantFromCharacter,
  createCustomCombatant,
  addCombatant,
  removeCombatant,
  updateCombatant,
  rollAllInitiative,
  rollEnemyInitiative,
  setInitiative,
  sortByInitiative,
  startCombat,
  nextTurn,
  resetActions,
  endCombat,
  applyDamage,
  applyRawDamage,
  applyHealing,
  applyFPDamage,
  applyFPRestore,
  sunderArmor,
  addStatusEffect,
  removeStatusEffect,
  removeAllStatusEffects,
  applyStartOfTurnEffects,
  tickStatusEffects,
  addLogEntry,
  clearLog,
  formatLogForExport,
  getCombatantById,
  getAliveCombatants,
  getCombatantsByType,
  isCurrentTurn,
};
