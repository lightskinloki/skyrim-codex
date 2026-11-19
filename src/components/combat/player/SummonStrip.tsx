// Whatever the player has conjured, visible during their turn.
//
// The combat portal is already the screen a player stares at while deciding;
// if the thing they summoned lives only on the character sheet, they forget it
// exists and it silently stops acting. So the strip reads the same summons the
// sheet holds, tracks their HP where the fight is happening, and disappears
// entirely when nothing is conjured.
import { useEffect, useState } from "react";
import { Companion } from "@/types/companion";
import { summonsFor, applySummonDamage, riseSummon, dismissSummon, COMPANIONS_CHANGED } from "@/utils/summoning";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

export function SummonStrip({ casterName }: { casterName: string }) {
  const [summons, setSummons] = useState<Companion[]>([]);

  useEffect(() => {
    const refresh = () => setSummons(summonsFor(casterName));
    refresh();
    window.addEventListener(COMPANIONS_CHANGED, refresh);
    return () => window.removeEventListener(COMPANIONS_CHANGED, refresh);
  }, [casterName]);

  if (summons.length === 0) return null;

  const applyDamage = (summon: Companion, delta: number) => {
    applySummonDamage(summon, delta);
  };

  return (
    <div className="bg-card/30 border-b border-border px-6 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <PawPrint className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Summons — they act on your turn
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summons.map((summon) => {
            const hp = summon.resources.hp;
            const pct = hp ? Math.max(0, (hp.current / hp.max) * 100) : 0;
            return (
              <div key={summon.id} className="rounded border border-border bg-card overflow-hidden">
                {summon.image && (
                  <img
                    src={`/images/summons/${summon.image}`}
                    alt={summon.name}
                    className="w-full h-20 object-cover"
                  />
                )}
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate" title={summon.name}>{summon.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {summon.duration ?? 'Encounter'}
                    </Badge>
                  </div>
                  {hp && (
                    <>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            pct > 50 ? "bg-green-500" : pct > 25 ? "bg-yellow-500" : "bg-red-500",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs tabular-nums flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          {hp.current}/{hp.max}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-5 px-1 text-xs" onClick={() => applyDamage(summon, -5)}>-5</Button>
                          <Button size="sm" variant="outline" className="h-5 px-1 text-xs" onClick={() => applyDamage(summon, -1)}>-1</Button>
                          <Button size="sm" variant="outline" className="h-5 px-1 text-xs" onClick={() => applyDamage(summon, 1)}>+1</Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 text-destructive"
                            title="Dismiss"
                            onClick={() => dismissSummon(summon.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  {summon.risePending && (
                    <div className="flex items-center justify-between gap-1 rounded border border-destructive/40 bg-destructive/10 px-1.5 py-1 text-[11px]">
                      <span className="text-destructive font-semibold">Fallen — rises next turn</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-5 px-1.5 text-[11px]"
                        onClick={() => riseSummon(summon)}
                      >
                        Rise
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
