import { useState, useEffect, useRef } from "react";
import { CombatantCard } from "./CombatantCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { Swords, Skull, Heart, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GMCombatTrackerProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

export function GMCombatTracker({ combatState, onUpdateState }: GMCombatTrackerProps) {
  const activeCardRef = useRef<HTMLDivElement>(null);

  // Multi-target selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState('');

  // Auto-scroll to active combatant
  useEffect(() => {
    if (activeCardRef.current && combatState.active) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [combatState.currentTurnCombatantId, combatState.active]);

  // Clear stale selections when combatants change
  useEffect(() => {
    const validIds = new Set(combatState.combatants.map(c => c.id));
    setSelectedIds(prev => {
      const filtered = new Set([...prev].filter(id => validIds.has(id)));
      return filtered.size !== prev.size ? filtered : prev;
    });
  }, [combatState.combatants]);

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

  // Sort players/allies by initiative (ascending - lowest first). A tie keeps
  // the existing order: the table rerolls a tied initiative, so Agility must
  // not silently decide it (InitiativeEditor's rules note says the same).
  const sortedPlayersAndAllies = [...playersAndAllies].sort((a, b) => {
    const initA = a.initiative ?? 999;
    const initB = b.initiative ?? 999;
    return initA - initB;
  });

  // Build display order
  type DisplayItem =
    | { type: 'combatant'; combatant: typeof combatState.combatants[0] }
    | { type: 'gm_turn' };

  const displayOrder: DisplayItem[] = [];
  let gmTurnInserted = false;

  for (const player of sortedPlayersAndAllies) {
    if (player.isDead) continue;

    const playerInit = player.initiative ?? 999;
    const playerAgility = player.stats.agility;
    const enemyInit = enemyInitiative ?? 999;

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

  if (!gmTurnInserted && enemies.length > 0) {
    displayOrder.push({ type: 'gm_turn' });
  }

  const deadPlayers = playersAndAllies.filter(c => c.isDead);
  const isGMTurn = combatState.currentTurnCombatantId === 'GM_TURN';

  // ── Handlers ──────────────────────────────────────────────

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setBulkAmount('');
  };

  const handleSelectAll = () => {
    const allLiving = combatState.combatants.filter(c => !c.isDead).map(c => c.id);
    setSelectedIds(new Set(allLiving));
  };

  const handleBulkDamage = () => {
    const amount = parseInt(bulkAmount, 10);
    if (isNaN(amount) || amount <= 0 || selectedIds.size === 0) return;
    const targets = Array.from(selectedIds);
    onUpdateState(prev => combatManager.applyBulkDamage(prev, targets, amount, 'AoE'));
    handleClearSelection();
  };

  const handleBulkHeal = () => {
    const amount = parseInt(bulkAmount, 10);
    if (isNaN(amount) || amount <= 0 || selectedIds.size === 0) return;
    const targets = Array.from(selectedIds);
    onUpdateState(prev => combatManager.applyBulkHealing(prev, targets, amount, 'GM'));
    handleClearSelection();
  };

  const handleHPChange = (combatantId: string, delta: number) => {
    onUpdateState(prev => {
      if (delta > 0) {
        return combatManager.applyHealing(prev, combatantId, delta, "GM");
      } else {
        return combatManager.applyRawDamage(prev, combatantId, Math.abs(delta), "GM");
      }
    });
  };

  const handleHPSet = (combatantId: string, value: number) => {
    onUpdateState(prev => combatManager.setHP(prev, combatantId, value, "GM"));
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
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(combatantId);
      return next;
    });
  };

  const handleNotesChange = (combatantId: string, notes: string) => {
    onUpdateState(prev => combatManager.setCombatantNotes(prev, combatantId, notes));
  };

  // Concealment is the GM's hold on an ambush: the card stays here, dimmed and
  // usable, but the enemy never reaches the players' roster (S6).
  const handleConcealToggle = (combatantId: string) => {
    const combatant = combatState.combatants.find(c => c.id === combatantId);
    if (!combatant) return;
    onUpdateState(prev => combatManager.updateCombatant(prev, combatantId, { concealed: !combatant.concealed }));
  };

  // ── Render ─────────────────────────────────────────────────
  if (combatState.combatants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <p className="text-lg">No combatants yet</p>
        <p className="text-sm">Add enemies or players from the Enemies tab</p>
      </div>
    );
  }

  // Helper to render a CombatantCard with all props wired
  const renderCard = (combatant: typeof combatState.combatants[0], isCurrentTurn: boolean) => (
    <CombatantCard
      key={combatant.id}
      combatant={combatant}
      isCurrentTurn={isCurrentTurn}
      isSelected={selectedIds.has(combatant.id)}
      onSelectionToggle={() => handleToggleSelection(combatant.id)}
      onHPChange={(delta) => handleHPChange(combatant.id, delta)}
      onHPSet={(value) => handleHPSet(combatant.id, value)}
      onFPChange={(delta) => handleFPChange(combatant.id, delta)}
      onDRChange={(delta) => handleDRChange(combatant.id, delta)}
      onStatusRemove={(effectId) => handleStatusRemove(combatant.id, effectId)}
      onActionToggle={(action) => handleActionToggle(combatant.id, action)}
      onDuplicate={() => handleDuplicate(combatant.id)}
      onRemove={() => handleRemove(combatant.id)}
      onNotesChange={(notes) => handleNotesChange(combatant.id, notes)}
      onConcealToggle={combatant.type === 'enemy' ? () => handleConcealToggle(combatant.id) : undefined}
    />
  );

  return (
    <div className="space-y-3">
      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 rounded-lg border border-primary/50 bg-background/95 backdrop-blur p-2 shadow-lg shadow-primary/10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-primary shrink-0">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-muted-foreground"
              onClick={handleSelectAll}
            >
              All
            </Button>
            <div className="flex items-center gap-1 flex-1 min-w-[180px]">
              <Input
                type="number"
                placeholder="Amount"
                value={bulkAmount}
                onChange={e => setBulkAmount(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleBulkDamage(); }}
                className="h-7 text-xs w-20"
                min={1}
              />
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-2 gap-1"
                onClick={handleBulkDamage}
                disabled={!bulkAmount || parseInt(bulkAmount) <= 0}
              >
                <Heart className="h-3 w-3" />
                Damage
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 gap-1 border-green-500 text-green-500 hover:bg-green-500/10"
                onClick={handleBulkHeal}
                disabled={!bulkAmount || parseInt(bulkAmount) <= 0}
              >
                <Zap className="h-3 w-3" />
                Heal
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto shrink-0"
              onClick={handleClearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Turn order ── */}
      {displayOrder.map((item) => {
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
                  {livingEnemies.map((enemy) => renderCard(enemy, isGMTurn))}

                  {/* Dead enemies */}
                  {deadEnemies.length > 0 && (
                    <div className="border-t border-red-500/20 pt-3 mt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Skull className="h-4 w-4" />
                        <span>Fallen Enemies</span>
                      </div>
                      {deadEnemies.map((enemy) => renderCard(enemy, false))}
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
            {renderCard(combatant, isCurrentTurn)}
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
              {renderCard(combatant, false)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
