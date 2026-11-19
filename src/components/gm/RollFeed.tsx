// Roll cards from the table: the outcome, the damage, and the target, in one
// line. The GM taps once to apply it to the tracker instead of asking "how
// much?" and doing the subtraction by hand
// (docs/SESSION-2026-11-09-PLAYTEST.md, S7).
import { useState } from "react";
import { Check, Dices, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RollCard, RollTier } from "@/net/table";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { useTable } from "./TableContext";

const TIER_COLOUR: Record<RollTier, string> = {
  crit: "border-green-500 text-green-400",
  success: "border-emerald-500 text-emerald-400",
  success_complication: "border-amber-500 text-amber-400",
  fail: "border-red-500 text-red-400",
  crit_fail: "border-red-700 text-red-300",
};

const TIER_SHORT: Record<RollTier, string> = {
  crit: "CRIT",
  success: "SUCCESS",
  success_complication: "COMPLICATION",
  fail: "FAIL",
  crit_fail: "CRIT FAIL",
};

interface RollFeedProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

export function RollFeed({ combatState, onUpdateState }: RollFeedProps) {
  const { rolls } = useTable();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const visible = rolls.filter((roll) => !dismissed.has(roll.id)).slice(-4).reverse();
  if (visible.length === 0) return null;

  const enemies = combatState.combatants.filter((c) => c.type === "enemy" && !c.isDead);

  const apply = (roll: RollCard) => {
    const targetId = targets[roll.id] ?? roll.target?.id;
    if (!targetId) return;
    const amount = amounts[roll.id] ?? roll.damage ?? roll.base;
    onUpdateState((prev) => combatManager.applyDamage(prev, targetId, amount, roll.actor));
    setDismissed((prev) => new Set(prev).add(roll.id));
  };

  const dismiss = (id: string) => setDismissed((prev) => new Set(prev).add(id));

  return (
    <Card className="mb-4 p-3">
      <h3 className="mb-2 flex items-center gap-2 font-cinzel text-sm font-bold">
        <Dices className="h-4 w-4" /> Rolls from the table
      </h3>
      <div className="space-y-2">
        {visible.map((roll) => {
          const targetId = targets[roll.id] ?? roll.target?.id ?? "";
          const amount = amounts[roll.id] ?? roll.damage ?? roll.base;
          return (
            <div key={roll.id} className="rounded border border-border p-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={TIER_COLOUR[roll.tier]}>
                  {TIER_SHORT[roll.tier]}
                </Badge>
                <span className="text-sm font-semibold">{roll.actor}</span>
                <span className="text-sm text-muted-foreground">{roll.action}</span>
                <span className="text-xs text-muted-foreground">
                  d20 {roll.die} vs {roll.total}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {roll.damage == null ? "damage held" : `${roll.damage} dmg`}
                </span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => dismiss(roll.id)} title="Dismiss">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <select
                  value={targetId}
                  onChange={(event) => setTargets((prev) => ({ ...prev, [roll.id]: event.target.value }))}
                  className="h-7 rounded border border-border bg-background px-1.5 text-xs"
                >
                  <option value="">Target…</option>
                  {enemies.map((enemy) => (
                    <option key={enemy.id} value={enemy.id}>
                      {enemy.name} ({enemy.hp.current})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(event) =>
                    setAmounts((prev) => ({ ...prev, [roll.id]: Math.max(0, Number(event.target.value) || 0) }))
                  }
                  className="h-7 w-16 text-center text-xs"
                  title="Damage before the target's DR"
                />
                <Button size="sm" className="h-7 text-xs" disabled={!targetId} onClick={() => apply(roll)}>
                  <Check className="h-3 w-3 mr-1" /> Apply
                </Button>
                {roll.target && !enemies.some((enemy) => enemy.id === roll.target!.id) && (
                  <span className="text-[11px] text-amber-400">target is not in this fight</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
