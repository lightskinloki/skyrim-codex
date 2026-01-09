import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Dices, 
  ArrowUpDown,
  Skull,
  Crown,
  Swords
} from "lucide-react";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { cn } from "@/lib/utils";

interface InitiativeEditorProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

export function InitiativeEditor({ combatState, onUpdateState }: InitiativeEditorProps) {
  const handleRollAll = () => {
    onUpdateState(prev => {
      const rolled = combatManager.rollAllInitiative(prev);
      return combatManager.sortByInitiative(rolled);
    });
  };

  const handleRollEnemiesOnly = () => {
    onUpdateState(prev => {
      const rolled = combatManager.rollEnemyInitiative(prev);
      return combatManager.sortByInitiative(rolled);
    });
  };

  const handleSort = () => {
    onUpdateState(prev => combatManager.sortByInitiative(prev));
  };

  const handleSetInitiative = (combatantId: string, value: number) => {
    onUpdateState(prev => combatManager.setInitiative(prev, combatantId, value));
  };

  const handleSetEnemyInitiative = (value: number) => {
    // Set the same initiative for all enemies
    onUpdateState(prev => {
      let newState = prev;
      for (const combatant of prev.combatants) {
        if (combatant.type === 'enemy') {
          newState = combatManager.setInitiative(newState, combatant.id, value);
        }
      }
      return newState;
    });
  };

  // Get players/allies sorted by initiative (ascending - lowest first)
  const playersAndAllies = combatState.combatants
    .filter(c => c.type !== 'enemy')
    .sort((a, b) => {
      const initA = a.initiative ?? 999;
      const initB = b.initiative ?? 999;
      if (initA !== initB) return initA - initB;
      return a.stats.agility - b.stats.agility;
    });

  // Get enemies (they share one initiative)
  const enemies = combatState.combatants.filter(c => c.type === 'enemy');
  const enemyInitiative = enemies.length > 0 ? (enemies[0].initiative ?? null) : null;
  const lowestEnemyAgility = enemies.length > 0 
    ? Math.min(...enemies.map(e => e.stats.agility))
    : 0;

  // Build display order: players/allies with GM turn inserted at correct position
  type DisplayItem = 
    | { type: 'combatant'; combatant: typeof combatState.combatants[0] }
    | { type: 'gm_turn'; initiative: number | null; enemies: typeof combatState.combatants };

  const displayOrder: DisplayItem[] = [];
  let gmTurnInserted = false;

  for (const player of playersAndAllies) {
    const playerInit = player.initiative ?? 999;
    const playerAgility = player.stats.agility;
    const enemyInit = enemyInitiative ?? 999;

    // Check if GM turn should come before this player
    if (!gmTurnInserted && enemies.length > 0) {
      if (enemyInit < playerInit) {
        displayOrder.push({ type: 'gm_turn', initiative: enemyInitiative, enemies });
        gmTurnInserted = true;
      } else if (enemyInit === playerInit && lowestEnemyAgility < playerAgility) {
        displayOrder.push({ type: 'gm_turn', initiative: enemyInitiative, enemies });
        gmTurnInserted = true;
      }
    }

    displayOrder.push({ type: 'combatant', combatant: player });
  }

  // Add GM turn at the end if not inserted yet
  if (!gmTurnInserted && enemies.length > 0) {
    displayOrder.push({ type: 'gm_turn', initiative: enemyInitiative, enemies });
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleRollAll} variant="default">
          <Dices className="h-4 w-4 mr-2" />
          Roll All
        </Button>
        <Button onClick={handleRollEnemiesOnly} variant="outline">
          <Dices className="h-4 w-4 mr-2" />
          Roll Enemies Only
        </Button>
        <Button onClick={handleSort} variant="outline">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Sort
        </Button>
      </div>

      {/* Turn Order List */}
      <div className="space-y-2">
        {displayOrder.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No combatants to show
          </p>
        ) : (
          displayOrder.map((item, index) => {
            if (item.type === 'gm_turn') {
              const livingEnemies = item.enemies.filter(e => !e.isDead);
              const deadEnemies = item.enemies.filter(e => e.isDead);
              
              return (
                <Card 
                  key="gm_turn"
                  className="p-3 border-red-500/50 bg-red-950/20"
                >
                  <div className="flex items-center gap-3">
                    {/* Position indicator */}
                    <div className="w-6 h-6 rounded-full bg-red-500/30 flex items-center justify-center text-sm font-bold text-red-400">
                      {index + 1}
                    </div>

                    {/* Initiative Input */}
                    <Input
                      type="number"
                      value={item.initiative ?? ''}
                      onChange={(e) => handleSetEnemyInitiative(parseInt(e.target.value) || 0)}
                      className="w-16 text-center border-red-500/50"
                      placeholder="--"
                    />

                    {/* GM Turn label */}
                    <div className="flex-1 flex items-center gap-2">
                      <Swords className="h-4 w-4 text-red-500" />
                      <span className="font-bold text-red-400">GM Turn</span>
                      <Badge variant="outline" className="border-red-500 text-red-500">
                        {livingEnemies.length} enemies
                      </Badge>
                    </div>
                  </div>

                  {/* List enemies in this turn */}
                  <div className="mt-2 pl-12 space-y-1">
                    {livingEnemies.map(enemy => (
                      <div key={enemy.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        {enemy.isBoss && <Crown className="h-3 w-3 text-amber-500" />}
                        <span>{enemy.name}</span>
                        <span className="text-xs">(AGI: {enemy.stats.agility})</span>
                      </div>
                    ))}
                    {deadEnemies.map(enemy => (
                      <div key={enemy.id} className="flex items-center gap-2 text-sm text-muted-foreground opacity-50">
                        <Skull className="h-3 w-3" />
                        <span className="line-through">{enemy.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            }

            const combatant = item.combatant;
            return (
              <Card 
                key={combatant.id}
                className={cn(
                  "p-3 flex items-center gap-3",
                  combatant.isDead && "opacity-50"
                )}
              >
                {/* Position indicator */}
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Initiative Input */}
                <Input
                  type="number"
                  value={combatant.initiative ?? ''}
                  onChange={(e) => handleSetInitiative(combatant.id, parseInt(e.target.value) || 0)}
                  className="w-16 text-center"
                  placeholder="--"
                />

                {/* Name and badges */}
                <div className="flex-1 flex items-center gap-2">
                  {combatant.isDead && <Skull className="h-4 w-4 text-muted-foreground" />}
                  {combatant.isBoss && <Crown className="h-4 w-4 text-amber-500" />}
                  <span className={cn("font-medium", combatant.isDead && "line-through")}>
                    {combatant.name}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      combatant.type === 'player' && "border-blue-500 text-blue-500",
                      combatant.type === 'ally' && "border-green-500 text-green-500"
                    )}
                  >
                    {combatant.type}
                  </Badge>
                </div>

                {/* Agility (tiebreaker reference) */}
                <div className="text-sm text-muted-foreground">
                  AGI: {combatant.stats.agility}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
        <p><strong>Note:</strong> Lower initiative goes first. Ties broken by lower Agility.</p>
        <p><strong>GM Turn:</strong> All enemies act together on the GM's single initiative roll.</p>
      </div>
    </div>
  );
}