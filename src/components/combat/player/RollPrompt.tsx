// The roll a player used to have to do in their head, then read aloud.
//
// Tap an attack or a spell, roll (or type the die), pick the difficulty the GM
// called, and the card says the outcome and the damage. Sending it puts the
// same sentence on the GM's screen: who, what, which tier, how much, at whom
// (docs/SESSION-2026-11-09-PLAYTEST.md, S7).
import { useEffect, useMemo, useState } from "react";
import { Dices, Send, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Character } from "@/types/character";
import { MajorActionOption } from "@/utils/actionUtils";
import { RollCard, RollTier, VisibleEnemy } from "@/net/table";
import {
  DIFFICULTIES,
  DifficultyId,
  TIER_LABEL,
  damageForTier,
  damageFromText,
  rollD20,
  targetNumber,
  tierForRoll,
} from "@/utils/roll";

const STATS = [
  { id: "might", label: "Might" },
  { id: "agility", label: "Agility" },
  { id: "magic", label: "Magic" },
  { id: "guile", label: "Guile" },
] as const;

type StatId = (typeof STATS)[number]["id"];

const TIER_COLOUR: Record<RollTier, string> = {
  crit: "border-green-500 text-green-400",
  success: "border-emerald-500 text-emerald-400",
  success_complication: "border-amber-500 text-amber-400",
  fail: "border-red-500 text-red-400",
  crit_fail: "border-red-700 text-red-300",
};

interface RollPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: MajorActionOption | null;
  character: Character;
  roster: VisibleEnemy[];
  /** Spend the action, mark the slot, and put the card on the GM's screen. */
  onRecord: (card: RollCard) => void;
}

function defaultStat(action: MajorActionOption | null): StatId {
  if (!action) return "might";
  if (action.type === "spell") return "magic";
  if (/bow|crossbow|sling/i.test(`${action.source ?? ""} ${action.description ?? ""}`)) return "agility";
  return "might";
}

export function RollPrompt({ open, onOpenChange, action, character, roster, onRecord }: RollPromptProps) {
  const [stat, setStat] = useState<StatId>("might");
  const [difficulty, setDifficulty] = useState<DifficultyId>("standard");
  const [die, setDie] = useState<number | null>(null);
  const [targetId, setTargetId] = useState("");

  useEffect(() => {
    if (!open) return;
    setStat(defaultStat(action));
    setDifficulty("standard");
    setDie(null);
    setTargetId("");
  }, [open, action]);

  const baseDamage = useMemo(() => {
    if (!action) return 0;
    if (action.damage != null) return action.damage;
    return damageFromText(action.description);
  }, [action]);

  const statValue = character.stats[stat];
  const tn = targetNumber(statValue, difficulty);
  const tier = die == null ? null : tierForRoll(die, tn);
  const damage = tier ? damageForTier(baseDamage, tier) : null;
  const target = roster.find((enemy) => enemy.id === targetId);

  const send = () => {
    if (!action || die == null || !tier) return;
    onRecord({
      id: crypto.randomUUID(),
      actor: character.name,
      action: action.name,
      tier,
      damage,
      base: baseDamage,
      die,
      total: tn,
      target: target ? { id: target.id, name: target.name } : undefined,
      at: Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cinzel">{action?.name ?? "Roll"}</DialogTitle>
          <DialogDescription>
            {baseDamage > 0 ? `Base damage ${baseDamage}. ` : ""}
            Roll, then the card says the outcome and the number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Stat */}
          <div className="flex items-center gap-1.5">
            <span className="w-16 text-xs uppercase tracking-wide text-muted-foreground">Stat</span>
            {STATS.map((row) => (
              <Button
                key={row.id}
                size="sm"
                variant={stat === row.id ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                onClick={() => setStat(row.id)}
              >
                {row.label} {character.stats[row.id]}
              </Button>
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs uppercase tracking-wide text-muted-foreground">Roll</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as DifficultyId)}
              className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
            >
              {DIFFICULTIES.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.label} {row.mod >= 0 ? `+${row.mod}` : row.mod}
                </option>
              ))}
            </select>
            <Badge variant="outline" className="tabular-nums">
              TN {tn}
            </Badge>
          </div>

          {/* Die */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs uppercase tracking-wide text-muted-foreground">d20</span>
            <Input
              type="number"
              min={1}
              max={20}
              value={die ?? ""}
              onChange={(event) => {
                const value = Number(event.target.value);
                setDie(Number.isInteger(value) && value >= 1 && value <= 20 ? value : null);
              }}
              placeholder="1–20"
              className="h-9 w-20 text-center text-lg tabular-nums"
            />
            <Button variant="outline" onClick={() => setDie(rollD20())}>
              <Dices className="h-4 w-4 mr-2" /> Roll
            </Button>
            {die != null && (
              <span className="text-xs text-muted-foreground">
                {die < tn ? "under" : die === tn ? "on" : "over"} the target number
              </span>
            )}
          </div>

          {/* Outcome */}
          {tier && (
            <div className={`rounded-md border-2 p-3 ${TIER_COLOUR[tier]}`}>
              <div className="font-cinzel text-lg font-bold">{TIER_LABEL[tier]}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                d20 {die} vs TN {tn}
                {damage == null
                  ? " — damage waits on the GM"
                  : damage > 0
                    ? ` — ${baseDamage}${tier === "crit" ? " ×2" : ""} = ${damage} damage`
                    : " — no damage"}
              </div>
            </div>
          )}

          {/* Target */}
          <div className="flex items-center gap-2">
            <span className="flex w-16 items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground">
              <Target className="h-3 w-3" /> Target
            </span>
            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
            >
              <option value="">No target yet</option>
              {roster.map((enemy) => (
                <option key={enemy.id} value={enemy.id}>
                  {enemy.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={send} disabled={!tier}>
            <Send className="h-4 w-4 mr-2" /> Send to GM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
