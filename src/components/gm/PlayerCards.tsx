// The GM's live view of every joined player's sheet — not a copy taken when
// they joined. Damage, healing and FP move through the host to the player's
// device, and a player's own spend appears here without being asked for
// (docs/SESSION-2026-11-09-PLAYTEST.md, S1).
//
// The buttons apply raw damage. Armour DR is the fight tracker's job; the only
// thing subtracted here is a brace the player is holding, because that is a
// number the shield supplies and everyone forgets mid-turn.
import { Heart, Zap, Shield, Swords, Check, Link2Off } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateTotalDR } from "@/utils/characterCalculations";
import { useToast } from "@/hooks/use-toast";
import { CombatState } from "@/types/combat";
import { TableMember } from "@/net/table";
import { useTable } from "./TableContext";

const STEP = 5;

export function PlayerCards({ combatState }: { combatState?: CombatState }) {
  const { members, editCharacter, clearBrace } = useTable();
  const { toast } = useToast();

  if (members.length === 0) return null;

  const changeResource = (member: TableMember, stat: "hp" | "fp", delta: number) => {
    editCharacter(member.peerId, (character) => {
      const pool = character.resources[stat];
      return {
        ...character,
        resources: {
          ...character.resources,
          [stat]: { ...pool, current: Math.max(0, Math.min(pool.max, pool.current + delta)) },
        },
      };
    });
  };

  const takeDamage = (member: TableMember, amount: number) => {
    const brace = member.brace?.bonus ?? 0;
    const dealt = Math.max(0, amount - brace);
    editCharacter(member.peerId, (character) => ({
      ...character,
      resources: {
        ...character.resources,
        hp: {
          ...character.resources.hp,
          current: Math.max(0, character.resources.hp.current - dealt),
        },
      },
    }));
    if (brace > 0) {
      clearBrace(member.peerId);
      toast({
        title: `${member.character.name}: brace spent`,
        description:
          dealt === 0
            ? `The shield covers all ${amount}.`
            : `${brace} taken off, ${dealt} landed.`,
      });
    }
  };

  return (
    <Card className="p-3 mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-cinzel text-sm font-bold">
          <Swords className="h-4 w-4" />
          The table
        </h3>
        <Badge variant="outline">{members.filter((m) => m.connected).length} connected</Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const character = member.character;
          const hp = character.resources.hp;
          const fp = character.resources.fp;
          const dr = calculateTotalDR(character.equipment, character.standingStone);
          const fighter = combatState?.combatants.find((c) => c.characterId === character.id);
          const hpPct = hp.max > 0 ? (hp.current / hp.max) * 100 : 0;
          const fpPct = fp.max > 0 ? (fp.current / fp.max) * 100 : 0;

          return (
            <div
              key={member.peerId}
              className={`rounded-lg border border-border p-2.5 ${member.connected ? "" : "opacity-60"}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{character.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {character.race.name} · DR {dr}
                    {fighter ? " · in the fight" : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {member.brace && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-cyan-500/60 text-[10px] text-cyan-400"
                      title={member.brace.label}
                    >
                      <Shield className="h-3 w-3" />+{member.brace.bonus}
                      <button
                        type="button"
                        className="ml-0.5 opacity-70 hover:opacity-100"
                        title="Spend the brace without damage"
                        onClick={() => clearBrace(member.peerId)}
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {!member.connected && <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>

              {/* HP */}
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 shrink-0 text-red-500" />
                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${hpPct > 50 ? "bg-green-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${Math.max(0, hpPct)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums">
                    {hp.current}/{hp.max}
                  </span>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => takeDamage(member, STEP)}>
                    <span className="text-[10px]">−{STEP}</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => takeDamage(member, 1)}>
                    <span className="text-[10px]">−1</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => changeResource(member, "hp", 1)}>
                    <span className="text-[10px]">+1</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => changeResource(member, "hp", STEP)}>
                    <span className="text-[10px]">+{STEP}</span>
                  </Button>
                </div>
              </div>

              {/* FP */}
              <div className="mt-1 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.max(0, fpPct)}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium tabular-nums">
                    {fp.current}/{fp.max}
                  </span>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => changeResource(member, "fp", -STEP)}>
                    <span className="text-[10px]">−{STEP}</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => changeResource(member, "fp", -1)}>
                    <span className="text-[10px]">−1</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => changeResource(member, "fp", 1)}>
                    <span className="text-[10px]">+1</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-5 w-5" onClick={() => changeResource(member, "fp", STEP)}>
                    <span className="text-[10px]">+{STEP}</span>
                  </Button>
                </div>
              </div>

              {fighter && fighter.statusEffects.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {fighter.statusEffects.map((effect) => (
                    <Badge key={effect.id} variant="secondary" className="h-4 px-1 text-[10px]">
                      {effect.type}
                    </Badge>
                  ))}
                </div>
              )}
              {fighter?.isDead && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-red-400">
                  <Check className="h-3 w-3" /> Down
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
