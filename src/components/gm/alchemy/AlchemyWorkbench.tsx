// GM-facing brewing bench: pick ingredients from the catalogue, read the brew.
// Everything shown here comes from the deterministic Essence engine in
// utils/alchemy.ts — no inference, no LLM. When an ingredient has more than one
// expression the bench lists every reading and marks the one the mix supports.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, FlaskConical, Minus, Plus, Search, Sparkles, X } from "lucide-react";
import { INGREDIENTS } from "@/data/alchemy";
import { describeFinding, describeTier, readBrew } from "@/utils/alchemy";
import { BrewEntry, ESSENCE_LABELS, Ingredient, Quality, Rarity } from "@/types/alchemy";
import { cn } from "@/lib/utils";

const QUALITIES: Quality[] = ["Standard", "Potent", "Exceptional"];

const RARITY_CLASS: Record<Rarity, string> = {
  Common: "border-muted-foreground/30 text-muted-foreground",
  Uncommon: "border-emerald-500/50 text-emerald-500",
  Rare: "border-sky-500/50 text-sky-400",
  Legendary: "border-amber-500/60 text-amber-400",
};

function EssenceChips({ ingredient }: { ingredient: Ingredient }) {
  return (
    <div className="flex flex-wrap gap-1">
      {ingredient.essences.map(([essence, tier]) => (
        <span
          key={`${essence}-${tier}`}
          className={cn(
            "rounded border px-1 py-0.5 text-[10px] font-medium leading-none",
            tier === "P" && "border-primary/50 bg-primary/10 text-primary",
            tier === "S" && "border-sky-500/40 text-sky-400",
            tier === "T" && "border-muted-foreground/30 text-muted-foreground",
            tier === "Q" && "border-violet-500/40 text-violet-400",
          )}
          title={`${ESSENCE_LABELS[essence]} — ${describeTier(tier)}`}
        >
          {essence}
          <span className="opacity-60">[{tier}]</span>
        </span>
      ))}
    </div>
  );
}

export function AlchemyWorkbench() {
  const [entries, setEntries] = useState<BrewEntry[]>([]);
  const [quality, setQuality] = useState<Quality>("Standard");
  const [query, setQuery] = useState("");
  const [pinnedLabel, setPinnedLabel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? INGREDIENTS.filter((i) => i.name.toLowerCase().includes(needle))
      : INGREDIENTS;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  const readings = useMemo(
    () => (entries.length ? readBrew(entries, { quality }) : []),
    [entries, quality],
  );

  const bestReading = readings.find((r) => r.mostApplicable) ?? readings[0];
  const activeReading = readings.find((r) => r.label === pinnedLabel) ?? bestReading;
  const ingredientByName = useMemo(
    () => new Map(INGREDIENTS.map((i) => [i.name, i])),
    [],
  );

  function addIngredient(name: string) {
    setEntries((prev) => {
      const existing = prev.find((e) => e.name === name);
      if (existing) {
        return prev.map((e) =>
          e.name === name ? { ...e, copies: Math.min(5, (e.copies ?? 1) + 1) } : e,
        );
      }
      return [...prev, { name, copies: 1 }];
    });
  }

  function setCopies(name: string, delta: number) {
    setEntries((prev) =>
      prev
        .map((e) =>
          e.name === name ? { ...e, copies: Math.max(0, Math.min(5, (e.copies ?? 1) + delta)) } : e,
        )
        .filter((e) => (e.copies ?? 1) > 0),
    );
  }

  function removeIngredient(name: string) {
    setEntries((prev) => prev.filter((e) => e.name !== name));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* ── Catalogue ─────────────────────────────────────────────────── */}
      <Card className="flex h-fit flex-col gap-3 p-3">
        <div>
          <h3 className="font-cinzel text-sm font-semibold">Ingredient Catalogue</h3>
          <p className="text-xs text-muted-foreground">
            Click to add. Click again to add a second measure.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredients…"
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-[460px] pr-3">
          <div className="space-y-1">
            {filtered.map((ingredient) => {
              const inPot = entries.some((e) => e.name === ingredient.name);
              return (
                <button
                  key={ingredient.name}
                  type="button"
                  onClick={() => addIngredient(ingredient.name)}
                  className={cn(
                    "w-full rounded-md border p-2 text-left transition-colors hover:bg-accent",
                    inPot && "border-primary/60 bg-primary/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{ingredient.name}</span>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[10px]", RARITY_CLASS[ingredient.rarity])}
                    >
                      {ingredient.rarity}
                    </Badge>
                  </div>
                  <div className="mt-1">
                    <EssenceChips ingredient={ingredient} />
                  </div>
                  {ingredient.variants?.length ? (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {ingredient.variants.length + 1} readings ·{" "}
                      {ingredient.variants.map((v) => v.label).join(", ")}
                    </p>
                  ) : null}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                Nothing matches “{query}”. Unknown ingredients are the GM's call, not the
                engine's.
              </p>
            )}
          </div>
        </ScrollArea>
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} of {INGREDIENTS.length} entries
        </p>
      </Card>

      {/* ── The pot ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Card className="space-y-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h3 className="font-cinzel text-sm font-semibold">The Pot</h3>
              {activeReading && !activeReading.collapsed && (
                <Badge variant="outline" className="text-[10px]">
                  {entries.length} ingredient{entries.length === 1 ? "" : "s"} ·{" "}
                  {activeReading.pairCount} pair{activeReading.pairCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={quality} onValueChange={(v) => setQuality(v as Quality)}>
                <SelectTrigger className="h-8 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITIES.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEntries([]);
                  setPinnedLabel(null);
                }}
                disabled={!entries.length}
              >
                Clear
              </Button>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Empty. Choose ingredients from the catalogue — the reading appears as soon as
              there is something in the pot.
            </p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => {
                const ingredient = ingredientByName.get(entry.name);
                return (
                  <div
                    key={entry.name}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{entry.name}</span>
                      {ingredient && (
                        <div className="mt-1">
                          <EssenceChips ingredient={ingredient} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCopies(entry.name, -1)}
                        aria-label={`One fewer ${entry.name}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-xs tabular-nums">
                        {entry.copies ?? 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCopies(entry.name, 1)}
                        aria-label={`One more ${entry.name}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeIngredient(entry.name)}
                        aria-label={`Remove ${entry.name}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {activeReading && (
          <>
            {/* Reading picker — only when the mix is ambiguous. */}
            {readings.length > 1 && (
              <Card className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Readings</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {readings.length} valid interpretation{readings.length === 1 ? "" : "s"} of
                    this mix
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {readings.map((reading, index) => (
                    <Button
                      key={`${reading.label}-${index}`}
                      variant={reading.label === activeReading.label ? "default" : "outline"}
                      size="sm"
                      className="h-auto whitespace-normal py-1 text-left text-[11px]"
                      onClick={() => setPinnedLabel(reading.label)}
                    >
                      {reading.mostApplicable && (
                        <Sparkles className="mr-1 h-3 w-3 shrink-0" />
                      )}
                      Reading {index + 1}
                      {reading.mostApplicable ? " · best fit" : ""}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{activeReading.label}</p>
              </Card>
            )}

            {/* Collapse banner. */}
            {activeReading.collapsed && (
              <Card className="border-destructive/60 bg-destructive/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Brew collapses</p>
                    <p className="text-xs text-muted-foreground">
                      Primary Negation. No product, ingredients wasted — a hard stop regardless
                      of anything else in the pot.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* What the pot produces. */}
            {!activeReading.collapsed && (
              <Card className="space-y-2 p-3">
                <Label className="text-xs font-semibold">What it does</Label>
                {activeReading.effects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing survives into the compound.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {activeReading.effects.map((effect) => (
                      <div
                        key={effect.essence}
                        className="flex items-baseline justify-between gap-3 rounded-md border p-2"
                      >
                        <span className="text-sm font-medium">
                          {ESSENCE_LABELS[effect.essence]}
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {effect.essence}
                          </span>
                        </span>
                        <span className="text-right text-sm">{effect.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeReading.expressed.length > 0 && (
                  <div className="flex flex-wrap gap-1 border-t pt-2">
                    {activeReading.expressed.map((essence) => (
                      <span
                        key={essence.essence}
                        className={cn(
                          "rounded border px-1 py-0.5 text-[10px]",
                          essence.weakened === "significantly"
                            ? "border-destructive/40 text-destructive"
                            : essence.weakened === "minor"
                              ? "border-amber-500/40 text-amber-500"
                              : "border-muted-foreground/30 text-muted-foreground",
                        )}
                        title={`${essence.sources.join(", ")}${essence.amplified ? " · amplified" : ""}${
                          essence.weakened !== "none" ? ` · ${essence.weakened} weakened` : ""
                        }`}
                      >
                        {essence.essence}[{essence.tier}]
                        {essence.weakened === "significantly" && " ↓"}
                        {essence.weakened === "minor" && " ↓"}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Opposition, as the engine found it. */}
            {activeReading.findings.length > 0 && (
              <Card className="space-y-2 p-3">
                <Label className="text-xs font-semibold">
                  Negation ({activeReading.findings.length})
                </Label>
                <div className="space-y-1">
                  {activeReading.findings.map((finding, index) => (
                    <p
                      key={index}
                      className={cn(
                        "rounded border p-2 text-xs",
                        finding.severity === "primary"
                          ? "border-destructive/50 text-destructive"
                          : finding.severity === "secondary"
                            ? "border-amber-500/50 text-amber-500"
                            : "text-muted-foreground",
                      )}
                    >
                      {describeFinding(finding)}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            {/* Everything else worth flagging. */}
            {activeReading.flags.length > 0 && (
              <Card className="space-y-2 p-3">
                <Label className="text-xs font-semibold">GM notes</Label>
                <div className="space-y-1">
                  {activeReading.flags
                    .filter((flag) => flag.kind !== "collapse")
                    .map((flag, index) => (
                      <p
                        key={index}
                        className={cn(
                          "rounded border p-2 text-xs",
                          flag.kind === "paralysis" && "border-destructive/50 text-destructive",
                          flag.kind === "diluted" && "border-amber-500/40 text-amber-500",
                          flag.kind === "unknown" && "border-violet-500/40 text-violet-400",
                        )}
                      >
                        {flag.text}
                      </p>
                    ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
