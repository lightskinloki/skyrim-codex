import { useEffect, useRef } from "react";
import { CombatantCard } from "./CombatantCard";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";

interface GMCombatTrackerProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

export function GMCombatTracker({ combatState, onUpdateState }: GMCombatTrackerProps) {
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active combatant
  useEffect(() => {
    if (activeCardRef.current && combatState.active) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [combatState.currentTurnCombatantId, combatState.active]);

  // Get combatants in initiative order
  const sortedCombatants = combatState.active && combatState.turnOrder.length > 0
    ? combatState.turnOrder
        .map(id => combatState.combatants.find(c => c.id === id))
        .filter(Boolean)
    : [...combatState.combatants].sort((a, b) => {
        // Sort by initiative if available, otherwise by name
        if (a.initiative !== null && b.initiative !== null) {
          const initDiff = b.initiative - a.initiative;
          if (initDiff !== 0) return initDiff;
          return b.stats.agility - a.stats.agility;
        }
        return a.name.localeCompare(b.name);
      });

  // Add dead combatants at the end if they're not in turnOrder
  const deadCombatants = combatState.combatants.filter(
    c => c.isDead && !combatState.turnOrder.includes(c.id)
  );

  const handleHPChange = (combatantId: string, delta: number) => {
    onUpdateState(prev => {
      if (delta > 0) {
        return combatManager.applyHealing(prev, combatantId, delta, "GM");
      } else {
        return combatManager.applyRawDamage(prev, combatantId, Math.abs(delta), "GM");
      }
    });
  };

  const handleFPChange = (combatantId: string, delta: number) => {
    onUpdateState(prev => {
      if (delta > 0) {
        return combatManager.applyFPRestore(prev, combatantId, delta, "GM");
      } else {
        return combatManager.applyFPDamage(prev, combatantId, Math.abs(delta), "GM");
      }
    });
  };

  const handleDRChange = (combatantId: string, delta: number) => {
    if (delta < 0) {
      onUpdateState(prev => combatManager.sunderArmor(prev, combatantId, "GM"));
    }
  };

  const handleStatusRemove = (combatantId: string, effectId: string) => {
    onUpdateState(prev => combatManager.removeStatusEffect(prev, combatantId, effectId));
  };

  const handleActionToggle = (combatantId: string, action: 'major' | 'minor' | 'reaction') => {
    onUpdateState(prev => {
      const combatant = prev.combatants.find(c => c.id === combatantId);
      if (!combatant) return prev;

      const updates: Partial<typeof combatant> = {};
      if (action === 'major') updates.majorActionUsed = !combatant.majorActionUsed;
      if (action === 'minor') updates.minorActionUsed = !combatant.minorActionUsed;
      if (action === 'reaction') updates.reactionUsed = !combatant.reactionUsed;

      return combatManager.updateCombatant(prev, combatantId, updates);
    });
  };

  const handleDuplicate = (combatantId: string) => {
    const combatant = combatState.combatants.find(c => c.id === combatantId);
    if (!combatant) return;

    // Generate a new name with increment
    const baseName = combatant.name.replace(/\s*#\d+$/, '');
    const existingNumbers = combatState.combatants
      .filter(c => c.name.startsWith(baseName))
      .map(c => {
        const match = c.name.match(/#(\d+)$/);
        return match ? parseInt(match[1]) : 1;
      });
    const nextNumber = Math.max(...existingNumbers, 0) + 1;
    const newName = `${baseName} #${nextNumber}`;

    const newCombatant = combatManager.createCustomCombatant({
      name: newName,
      type: combatant.type,
      hp: combatant.hp.max,
      fp: combatant.fp.max,
      dr: combatant.baseDr,
      stats: combatant.stats,
      isBoss: combatant.isBoss,
      attacks: combatant.attacks,
      abilities: combatant.abilities,
    });

    onUpdateState(prev => combatManager.addCombatant(prev, newCombatant));
  };

  const handleRemove = (combatantId: string) => {
    onUpdateState(prev => combatManager.removeCombatant(prev, combatantId));
  };

  if (combatState.combatants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <p className="text-lg">No combatants yet</p>
        <p className="text-sm">Add enemies or players from the Enemies tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedCombatants.map((combatant) => {
        if (!combatant) return null;
        const isCurrentTurn = combatant.id === combatState.currentTurnCombatantId;
        
        return (
          <div 
            key={combatant.id} 
            ref={isCurrentTurn ? activeCardRef : undefined}
          >
            <CombatantCard
              combatant={combatant}
              isCurrentTurn={isCurrentTurn}
              onHPChange={(delta) => handleHPChange(combatant.id, delta)}
              onFPChange={(delta) => handleFPChange(combatant.id, delta)}
              onDRChange={(delta) => handleDRChange(combatant.id, delta)}
              onStatusRemove={(effectId) => handleStatusRemove(combatant.id, effectId)}
              onActionToggle={(action) => handleActionToggle(combatant.id, action)}
              onDuplicate={() => handleDuplicate(combatant.id)}
              onRemove={() => handleRemove(combatant.id)}
            />
          </div>
        );
      })}
      
      {/* Show dead combatants that aren't in turn order */}
      {deadCombatants.map((combatant) => (
        <div key={combatant.id}>
          <CombatantCard
            combatant={combatant}
            isCurrentTurn={false}
            onHPChange={(delta) => handleHPChange(combatant.id, delta)}
            onFPChange={(delta) => handleFPChange(combatant.id, delta)}
            onDRChange={(delta) => handleDRChange(combatant.id, delta)}
            onStatusRemove={(effectId) => handleStatusRemove(combatant.id, effectId)}
            onActionToggle={(action) => handleActionToggle(combatant.id, action)}
            onDuplicate={() => handleDuplicate(combatant.id)}
            onRemove={() => handleRemove(combatant.id)}
          />
        </div>
      ))}
    </div>
  );
}
