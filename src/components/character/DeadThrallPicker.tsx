// Dead Thrall doesn't summon a creature — it raises a body. So casting it has
// to ask which body, and show what the binding actually produces before the
// player commits 30 FP.
//
// Candidates come from the humanoid roster the app knows today. When the
// shared encounter board lands, this same list reads the fallen combatants the
// GM is tracking, and nothing else here changes.
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { enemyTemplates, EnemyTemplate } from "@/data/enemies";
import { thrallSheetFrom } from "@/utils/thrallConversion";
import { summonsFor, COMPANIONS_CHANGED, SummonLimits } from "@/utils/summoning";
import { Skull, AlertTriangle, ArrowRight } from "lucide-react";

interface DeadThrallPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  casterName: string;
  limits: SummonLimits;
  /** Called with the chosen body — the caller spends the FP and raises it. */
  onPick: (body: EnemyTemplate) => void;
}

export function DeadThrallPicker({ open, onOpenChange, casterName, limits, onPick }: DeadThrallPickerProps) {
  const [held, setHeld] = useState(0);
  const [heldThrall, setHeldThrall] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const mine = summonsFor(casterName);
      setHeld(mine.length);
      setHeldThrall(mine.find((s) => s.thrall)?.name ?? null);
    };
    refresh();
    window.addEventListener(COMPANIONS_CHANGED, refresh);
    return () => window.removeEventListener(COMPANIONS_CHANGED, refresh);
  }, [casterName, open]);

  const bodies = useMemo(
    () =>
      enemyTemplates
        .filter((e) => e.category === "humanoid")
        .map((body) => ({ body, sheet: thrallSheetFrom(body) }))
        .sort((a, b) => a.body.hp - b.body.hp),
    [],
  );

  const thrallTaken = heldThrall !== null;
  const slotTaken = held >= limits.active;
  const blocked = thrallTaken || slotTaken;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="font-cinzel text-xl tracking-wider flex items-center gap-2">
            <Skull className="h-5 w-5 text-primary" />
            Raise a Corpse
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Any dead humanoid will serve — but a body is bound, not restored. Its own sheet is pressed into the
            ceiling a Master conjurer can hold: 60 HP, 12 DR, 16 damage, 18 in a stat. Serves until destroyed.
          </DialogDescription>
        </DialogHeader>

        {(thrallTaken || (slotTaken && !thrallTaken)) && (
          <div className="px-6 py-3 border-b border-border bg-destructive/10 flex items-start gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {thrallTaken ? (
                <>
                  <strong className="text-destructive">{heldThrall}</strong> is already your Thrall — you can only have
                  one of any kind. Dismiss it first.
                </>
              ) : (
                <>All {limits.active} of your summon slots are full. Dismiss a creature first.</>
              )}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="space-y-2">
            {bodies.map(({ body, sheet }) => {
              const topDamage = sheet.attacks.reduce((m, a) => Math.max(m, a.damage), 0);
              return (
                <div
                  key={body.id}
                  className="rounded border border-border bg-card/50 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate" title={body.name}>{body.name}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {body.hp} HP · DR {body.dr} body
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span className="tabular-nums text-foreground">
                        {sheet.hp} HP · DR {sheet.dr} · {topDamage} dmg
                      </span>
                      <span className="tabular-nums">
                        M{sheet.stats.might} A{sheet.stats.agility} Ma{sheet.stats.magic} G{sheet.stats.guile}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    disabled={blocked}
                    onClick={() => onPick(body)}
                  >
                    Raise
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Bodies listed are the humanoid roster. Once the encounter board is shared, this reads the fallen the GM is
            tracking instead.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
