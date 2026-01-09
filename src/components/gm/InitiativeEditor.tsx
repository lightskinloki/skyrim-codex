import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Dices, 
  ArrowUpDown,
  Skull,
  Crown
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

  // Sort combatants for display: by current initiative, then by agility
  const sortedCombatants = [...combatState.combatants].sort((a, b) => {
    const initA = a.initiative ?? -999;
    const initB = b.initiative ?? -999;
    if (initA !== initB) return initB - initA;
    return b.stats.agility - a.stats.agility;
  });

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

      {/* Combatant List */}
      <div className="space-y-2">
        {sortedCombatants.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No combatants to show
          </p>
        ) : (
          sortedCombatants.map((combatant, index) => (
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
                    combatant.type === 'enemy' && "border-red-500 text-red-500",
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
          ))
        )}
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground border-t pt-3">
        <p><strong>Note:</strong> Higher initiative goes first. Ties are broken by Agility score.</p>
      </div>
    </div>
  );
}
