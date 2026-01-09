import { useEffect, useRef } from "react";
import { CombatantCard } from "./CombatantCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { Swords, Crown, Skull } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Separate players/allies from enemies
  const playersAndAllies = combatState.combatants.filter(c => c.type !== 'enemy');
  const enemies = combatState.combatants.filter(c => c.type === 'enemy');
  const livingEnemies = enemies.filter(e => !e.isDead);
  const deadEnemies = enemies.filter(e => e.isDead);

  // Get enemy initiative (they share one)
  const enemyInitiative = enemies.length > 0 ? (enemies[0].initiative ?? null) : null;
  const lowestEnemyAgility = enemies.length > 0 
    ? Math.min(...enemies.map(e => e.stats.agility))
    : 0;

  // Sort players/allies by initiative (ascending - lowest first)
  const sortedPlayersAndAllies = [...playersAndAllies].sort((a, b) => {
    const initA = a.initiative ?? 999;
    const initB = b.initiative ?? 999;
    if (initA !== initB) return initA - initB;
    return a.stats.agility - b.stats.agility;
  });

  // Build display order
  type DisplayItem = 
    | { type: 'combatant'; combatant: typeof combatState.combatants[0] }
    | { type: 'gm_turn' };

  const displayOrder: DisplayItem[] = [];
  let gmTurnInserted = false;

  for (const player of sortedPlayersAndAllies) {
    if (player.isDead) continue; // Skip dead players in active order

    const playerInit = player.initiative ?? 999;
    const playerAgility = player.stats.agility;
    const enemyInit = enemyInitiative ?? 999;

    // Check if GM turn should come before this player
    if (!gmTurnInserted && enemies.length > 0) {
      if (enemyInit < playerInit) {
        displayOrder.push({ type: 'gm_turn' });
        gmTurnInserted = true;
      } else if (enemyInit === playerInit && lowestEnemyAgility < playerAgility) {
        displayOrder.push({ type: 'gm_turn' });
        gmTurnInserted = true;
      }
    }

    displayOrder.push({ type: 'combatant', combatant: player });
  }

  // Add GM turn at the end if not inserted yet
  if (!gmTurnInserted && enemies.length > 0) {
    displayOrder.push({ type: 'gm_turn' });
  }

  // Add dead players at the end
  const deadPlayers = playersAndAllies.filter(c => c.isDead);

  const isGMTurn = combatState.currentTurnCombatantId === 'GM_TURN';

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
      {displayOrder.map((item, index) => {
        if (item.type === 'gm_turn') {
          return (
            <div 
              key="gm_turn" 
              ref={isGMTurn ? activeCardRef : undefined}
            >
              <Card 
                className={cn(
                  "border-2 border-red-500/50 bg-red-950/10 overflow-hidden",
                  isGMTurn && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background shadow-lg shadow-amber-500/20"
                )}
              >
                {/* GM Turn Header */}
                <div className="bg-red-500/20 px-4 py-3 flex items-center gap-3 border-b border-red-500/30">
                  <Swords className="h-5 w-5 text-red-400" />
                  <span className="font-bold text-red-400 text-lg">GM Turn</span>
                  <Badge variant="outline" className="border-red-500 text-red-400">
                    {livingEnemies.length} active / {enemies.length} total
                  </Badge>
                  {enemyInitiative !== null && (
                    <span className="text-sm text-red-300/70 ml-auto">
                      Initiative: {enemyInitiative}
                    </span>
                  )}
                </div>

                {/* Enemy Cards */}
                <div className="p-3 space-y-3">
                  {livingEnemies.map((enemy) => (
                    <CombatantCard
                      key={enemy.id}
                      combatant={enemy}
                      isCurrentTurn={isGMTurn}
                      onHPChange={(delta) => handleHPChange(enemy.id, delta)}
                      onFPChange={(delta) => handleFPChange(enemy.id, delta)}
                      onDRChange={(delta) => handleDRChange(enemy.id, delta)}
                      onStatusRemove={(effectId) => handleStatusRemove(enemy.id, effectId)}
                      onActionToggle={(action) => handleActionToggle(enemy.id, action)}
                      onDuplicate={() => handleDuplicate(enemy.id)}
                      onRemove={() => handleRemove(enemy.id)}
                    />
                  ))}

                  {/* Dead enemies */}
                  {deadEnemies.length > 0 && (
                    <div className="border-t border-red-500/20 pt-3 mt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Skull className="h-4 w-4" />
                        <span>Fallen Enemies</span>
                      </div>
                      {deadEnemies.map((enemy) => (
                        <CombatantCard
                          key={enemy.id}
                          combatant={enemy}
                          isCurrentTurn={false}
                          onHPChange={(delta) => handleHPChange(enemy.id, delta)}
                          onFPChange={(delta) => handleFPChange(enemy.id, delta)}
                          onDRChange={(delta) => handleDRChange(enemy.id, delta)}
                          onStatusRemove={(effectId) => handleStatusRemove(enemy.id, effectId)}
                          onActionToggle={(action) => handleActionToggle(enemy.id, action)}
                          onDuplicate={() => handleDuplicate(enemy.id)}
                          onRemove={() => handleRemove(enemy.id)}
                        />
                      ))}
                    </div>
                  )}

                  {enemies.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No enemies in combat
                    </p>
                  )}
                </div>
              </Card>
            </div>
          );
        }

        const combatant = item.combatant;
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
      
      {/* Show dead players/allies at the end */}
      {deadPlayers.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Skull className="h-4 w-4" />
            <span>Fallen Allies</span>
          </div>
          {deadPlayers.map((combatant) => (
            <div key={combatant.id} className="mt-2">
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
      )}
    </div>
  );
}