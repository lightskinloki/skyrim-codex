// Actionable card for a companion NPC or an active summon: shows current
// HP/FP, and every ability with a "use" control that spends its cost and
// tracks remaining uses live. Deliberately lighter than CharacterCard — these
// are finished sheets a player reads and acts through, not something they
// build or level up.
import { useState } from "react";
import { Companion, CompanionAbility } from "@/types/companion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, Zap, Shield, Sparkles, RotateCcw, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanionCardProps {
  companion: Companion;
  onUpdate: (companion: Companion) => void;
  onRemove?: (id: string) => void;
}

const SLOT_LABEL: Record<CompanionAbility['actionSlot'], string> = {
  major: 'Major',
  minor: 'Minor',
  reaction: 'Reaction',
  passive: 'Passive',
  free: 'Free',
};

function costLabel(a: CompanionAbility): string {
  if (a.cost.type === 'fp') return `${a.cost.amount} FP`;
  if (a.cost.type === 'hp') return `${a.cost.amount} HP`;
  return 'Free';
}

export function CompanionCard({ companion, onUpdate, onRemove }: CompanionCardProps) {
  const [expanded, setExpanded] = useState(true);

  const adjustResource = (key: 'hp' | 'fp', delta: number) => {
    const res = companion.resources[key];
    if (!res) return; // e.g. GEAR has no HP field at all
    const next = Math.max(0, Math.min(res.max, res.current + delta));
    onUpdate({
      ...companion,
      resources: { ...companion.resources, [key]: { ...res, current: next } },
    });
  };

  const useAbility = (ability: CompanionAbility) => {
    // Spend the resource cost first.
    let resources = companion.resources;
    if (ability.cost.type === 'fp') {
      resources = { ...resources, fp: { ...resources.fp, current: Math.max(0, resources.fp.current - ability.cost.amount) } };
    } else if (ability.cost.type === 'hp' && resources.hp) {
      resources = { ...resources, hp: { ...resources.hp, current: Math.max(0, resources.hp.current - ability.cost.amount) } };
    }

    // Then decrement/flag the ability itself if it's limited-use.
    const abilities = companion.abilities.map((a) => {
      if (a.id !== ability.id) return a;
      if (typeof a.usesRemaining === 'number') {
        return { ...a, usesRemaining: Math.max(0, a.usesRemaining - 1) };
      }
      return { ...a, used: true };
    });

    onUpdate({ ...companion, resources, abilities });
  };

  /** Reset all per-combat abilities (and per-turn ones) — call at the top of a new fight. */
  const resetAbilities = (scope: 'per-combat' | 'per-adventure' | 'per-turn') => {
    const abilities = companion.abilities.map((a) =>
      a.resetsOn === scope
        ? { ...a, usesRemaining: a.maxUses, used: false }
        : a
    );
    onUpdate({ ...companion, abilities });
  };

  const isDepleted = (a: CompanionAbility) =>
    (typeof a.usesRemaining === 'number' && a.usesRemaining <= 0) || a.used === true;

  const canAfford = (a: CompanionAbility) => {
    if (a.cost.type === 'fp') return companion.resources.fp.current >= a.cost.amount;
    if (a.cost.type === 'hp') return companion.resources.hp.current >= a.cost.amount;
    return true;
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-cinzel text-lg font-bold text-primary">{companion.name}</h3>
            <Badge variant={companion.kind === 'summon' ? 'destructive' : 'secondary'}>
              {companion.kind === 'summon' ? 'Summon' : 'Companion'}
            </Badge>
            <Badge variant="outline">{companion.tier}</Badge>
          </div>
          {companion.highConcept && (
            <p className="text-xs italic text-muted-foreground mt-1">{companion.highConcept}</p>
          )}
          {companion.kind === 'summon' && (companion.summonedBy || companion.duration) && (
            <p className="text-xs text-muted-foreground mt-1">
              {companion.summonedBy && <>Summoned by {companion.summonedBy}. </>}
              {companion.duration && <>Duration: {companion.duration}.</>}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          {onRemove && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onRemove(companion.id)} title="Remove">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Resources */}
      <div className={cn("grid gap-2", companion.resources.hp ? "grid-cols-3" : "grid-cols-2")}>
        {companion.resources.hp && (
          <div className="flex items-center gap-2 rounded border p-2">
            <Heart className="h-4 w-4 text-red-500 shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">HP</div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => adjustResource('hp', -1)}>-</Button>
                <span className="text-sm tabular-nums w-14 text-center">{companion.resources.hp.current}/{companion.resources.hp.max}</span>
                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => adjustResource('hp', 1)}>+</Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded border p-2">
          <Zap className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">{companion.resources.hp ? 'FP' : 'FP (also HP)'}</div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => adjustResource('fp', -1)}>-</Button>
              <span className="text-sm tabular-nums w-14 text-center">{companion.resources.fp.current}/{companion.resources.fp.max}</span>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => adjustResource('fp', 1)}>+</Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded border p-2">
          <Shield className="h-4 w-4 text-slate-500 shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">DR</div>
            <div className="text-sm tabular-nums">{companion.resources.dr}</div>
          </div>
        </div>
      </div>

      {expanded && (
        <>
          {companion.stats && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {(['might', 'agility', 'magic', 'guile'] as const).map((k) => (
                <div key={k} className="rounded border p-1">
                  <div className="text-muted-foreground capitalize">{k}</div>
                  <div className="font-bold tabular-nums">{companion.stats![k]}</div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> ABILITIES
              </h4>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => resetAbilities('per-combat')}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset combat
                </Button>
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => resetAbilities('per-adventure')}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset adventure
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {companion.abilities.map((a) => {
                const depleted = isDepleted(a);
                const affordable = canAfford(a) && !depleted;
                const clickable = a.actionSlot !== 'passive';
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-start gap-2 rounded border p-2 text-sm",
                      depleted && "opacity-50",
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{a.name}</span>
                        <Badge variant="outline" className="text-xs">{SLOT_LABEL[a.actionSlot]}</Badge>
                        <Badge variant="secondary" className="text-xs">{costLabel(a)}</Badge>
                        {typeof a.usesRemaining === 'number' && (
                          <Badge variant="outline" className="text-xs">{a.usesRemaining}/{a.maxUses} left</Badge>
                        )}
                        {a.used && <Badge variant="outline" className="text-xs">Used</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    </div>
                    {clickable && (
                      <Button
                        size="sm"
                        variant={affordable ? "default" : "ghost"}
                        className="h-7 text-xs shrink-0"
                        disabled={!affordable}
                        onClick={() => useAbility(a)}
                      >
                        {depleted ? <Check className="h-3 w-3" /> : 'Use'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {companion.equipment.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">EQUIPMENT</h4>
                <ul className="text-xs space-y-1">
                  {companion.equipment.map((e, i) => (
                    <li key={i}>
                      <span className="font-medium">{e.name}</span>
                      {e.damage !== undefined && <span className="text-muted-foreground"> — {e.damage} dmg</span>}
                      {e.dr !== undefined && <span className="text-muted-foreground"> — DR {e.dr}</span>}
                      {e.description && <span className="text-muted-foreground"> — {e.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {companion.combatNote && (
            <p className="text-xs italic text-muted-foreground border-t pt-2">{companion.combatNote}</p>
          )}
        </>
      )}
    </Card>
  );
}
