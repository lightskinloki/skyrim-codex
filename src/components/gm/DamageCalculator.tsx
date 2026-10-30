// GM-facing damage calculator: builds a hit under the Formula of Pain, then checks any
// number a player reports against the ceiling that stack can actually reach.
//
// The combat tracker takes damage as a given number and subtracts DR. This is the surface
// that decides whether the number was possible before it is applied.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Check, Plus, Swords, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { auditReportedDamage, readDamage } from "@/utils/damage";

interface DamageCalculatorProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

interface Row {
  id: number;
  label: string;
  value: string;
}

let nextRowId = 1;
const row = (label = "", value = ""): Row => ({ id: nextRowId++, label, value });

export function DamageCalculator({ combatState, onUpdateState }: DamageCalculatorProps) {
  const [parts, setParts] = useState<Row[]>([row("Weapon", ""), row("Power Attack", "2")]);
  const [multipliers, setMultipliers] = useState<Row[]>([row("Critical Hit", "2")]);
  const [reported, setReported] = useState("");
  const [targetId, setTargetId] = useState("");

  const readout = useMemo(
    () =>
      readDamage(
        parts.map((p) => ({ label: p.label || "Flat", value: Number(p.value) || 0 })),
        multipliers.map((m) => ({ label: m.label || "Multiplier", multiple: Number(m.value) || 1 })),
      ),
    [parts, multipliers],
  );

  const reportedNumber = Number(reported);
  const hasReport = reported.trim() !== "" && !Number.isNaN(reportedNumber);
  const audit = useMemo(
    () =>
      hasReport
        ? auditReportedDamage(
            parts.map((p) => ({ label: p.label || "Flat", value: Number(p.value) || 0 })),
            multipliers.map((m) => ({ label: m.label || "Multiplier", multiple: Number(m.value) || 1 })),
            reportedNumber,
          )
        : null,
    [hasReport, reportedNumber, parts, multipliers],
  );

  const targets = combatState.combatants.filter((c) => !c.isDead);
  const target = targets.find((c) => c.id === targetId) ?? null;

  const update = (list: Row[], setList: (rows: Row[]) => void, id: number, patch: Partial<Row>) =>
    setList(list.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const applyDamage = () => {
    if (!target) return;
    // Goes through applyDamage so the target's DR is honoured.
    onUpdateState((prev) => combatManager.applyDamage(prev, target.id, readout.totalDamage, "Player"));
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Base hit */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-cinzel text-sm font-bold">Base Hit — flats only</h3>
          <span className="font-mono text-muted-foreground">{readout.baseHit}</span>
        </div>
        <div className="space-y-1">
          {parts.map((part) => (
            <div key={part.id} className="flex items-center gap-1">
              <Input
                value={part.label}
                onChange={(e) => update(parts, setParts, part.id, { label: e.target.value })}
                placeholder="Weapon, perk, power attack, augment"
                className="h-8 flex-1 text-xs"
              />
              <Input
                value={part.value}
                onChange={(e) => update(parts, setParts, part.id, { value: e.target.value })}
                inputMode="numeric"
                placeholder="0"
                className="h-8 w-16 text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setParts(parts.filter((p) => p.id !== part.id))}
                aria-label="Remove flat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => setParts([...parts, row()])}>
          <Plus className="mr-1 h-3 w-3" /> Flat
        </Button>
      </div>

      {/* Multipliers */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-cinzel text-sm font-bold">Multipliers — added, never multiplied</h3>
          <span className="font-mono text-muted-foreground">x{readout.totalMultiplier}</span>
        </div>
        <div className="space-y-1">
          {multipliers.map((m) => (
            <div key={m.id} className="flex items-center gap-1">
              <Input
                value={m.label}
                onChange={(e) => update(multipliers, setMultipliers, m.id, { label: e.target.value })}
                placeholder="Critical Hit, Sneak, vulnerability"
                className="h-8 flex-1 text-xs"
              />
              <div className="flex h-8 w-16 items-center rounded-md border border-input px-2">
                <span className="text-xs text-muted-foreground">x</span>
                <input
                  value={m.value}
                  onChange={(e) => update(multipliers, setMultipliers, m.id, { value: e.target.value })}
                  inputMode="decimal"
                  placeholder="2"
                  className="w-full bg-transparent pl-1 text-xs outline-none"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setMultipliers(multipliers.filter((r) => r.id !== m.id))}
                aria-label="Remove multiplier"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setMultipliers([...multipliers, row("Critical Hit", "2")])}
          >
            <Plus className="mr-1 h-3 w-3" /> Crit x2
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setMultipliers([...multipliers, row("Sneak Attack", "3")])}
          >
            <Plus className="mr-1 h-3 w-3" /> Sneak x3
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setMultipliers([...multipliers, row("Vulnerability", "2")])}
          >
            <Plus className="mr-1 h-3 w-3" /> Vulnerability x2
          </Button>
        </div>
        {readout.ignored.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Ignored (cannot raise damage):{" "}
            {readout.ignored.map((i) => `${i.label} x${i.multiple}`).join(", ")}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="rounded-md border bg-muted/30 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">
            {readout.baseHit} &times; {readout.totalMultiplier}
          </span>
          <span className="font-cinzel text-2xl font-bold tabular-nums">{readout.totalDamage}</span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          1{readout.steps.length > 0 ? ` + ${readout.steps.map((s) => `(${s.multiple} - 1)`).join(' + ')}` : ""} = x
          {readout.totalMultiplier}
        </p>
      </div>

      {/* Audit a reported number */}
      <div className="space-y-2">
        <h3 className="font-cinzel text-sm font-bold">Check a reported number</h3>
        <Input
          value={reported}
          onChange={(e) => setReported(e.target.value)}
          inputMode="numeric"
          placeholder="What did they claim?"
          className={cn(
            "h-8 text-xs",
            audit && (audit.ok ? "border-green-600/60" : "border-destructive"),
          )}
        />
        {audit && (
          <div
            className={cn(
              "flex gap-2 rounded-md border p-2 text-xs",
              audit.ok
                ? "border-green-600/40 bg-green-600/10 text-green-600 dark:text-green-400"
                : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {audit.ok ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>{audit.detail}</span>
          </div>
        )}
        {audit && !audit.ok && (
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="destructive">
              <X className="mr-1 h-3 w-3" />
              {audit.over} over
            </Badge>
            <span className="text-muted-foreground">
              Ceiling for this stack: {audit.legalMax}
            </span>
          </div>
        )}
      </div>

      {/* Apply */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="">Apply to…</option>
          {targets.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.hp.current}/{c.hp.max} HP, DR {c.dr})
            </option>
          ))}
        </select>
        <Button size="sm" className="h-8 text-xs" onClick={applyDamage} disabled={!target || readout.totalDamage <= 0}>
          <Swords className="mr-1 h-3.5 w-3.5" />
          Apply {readout.totalDamage}
        </Button>
      </div>
      {target && (
        <p className="text-[11px] text-muted-foreground">
          DR {target.dr} is subtracted by the tracker, not here.
        </p>
      )}
    </div>
  );
}
