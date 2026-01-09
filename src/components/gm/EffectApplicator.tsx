import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Users } from "lucide-react";
import { CombatState, StatusEffectType } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { cn } from "@/lib/utils";

interface EffectApplicatorProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

const statusEffectDescriptions: Record<StatusEffectType, string> = {
  bleeding: "Takes damage at START of turn (intensity = damage)",
  burning: "Takes fire damage at START of turn (intensity = damage)",
  slowed: "Cannot use Minor Action for movement",
  staggered: "Loses next Minor Action",
  paralyzed: "Cannot act at all",
  invisible: "Cannot be targeted by enemies",
  hidden: "In stealth, advantage on first attack",
  feared: "Must flee from source",
  frenzied: "Attacks nearest creature (friend or foe)",
  calmed: "Non-hostile, won't fight unless attacked",
  encased: "Immune to damage, cannot act (Ash Shell)",
  exposed: "Advantage on next attack against them",
  bracing: "Shield raised, +DR until next turn (set bonusValue)",
};

const statusEffects: StatusEffectType[] = [
  'bleeding', 'burning', 'slowed', 'staggered', 'paralyzed',
  'invisible', 'hidden', 'feared', 'frenzied', 'calmed',
  'encased', 'exposed', 'bracing'
];

export function EffectApplicator({ combatState, onUpdateState }: EffectApplicatorProps) {
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [effectType, setEffectType] = useState<StatusEffectType>('bleeding');
  const [duration, setDuration] = useState(3);
  const [isPermanent, setIsPermanent] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [bonusValue, setBonusValue] = useState(2);
  const [source, setSource] = useState('');

  const toggleTarget = (id: string) => {
    setSelectedTargets(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllEnemies = () => {
    const enemyIds = combatState.combatants
      .filter(c => c.type === 'enemy' && !c.isDead)
      .map(c => c.id);
    setSelectedTargets(enemyIds);
  };

  const selectAllPlayers = () => {
    const playerIds = combatState.combatants
      .filter(c => c.type === 'player' && !c.isDead)
      .map(c => c.id);
    setSelectedTargets(playerIds);
  };

  const selectAll = () => {
    const allIds = combatState.combatants
      .filter(c => !c.isDead)
      .map(c => c.id);
    setSelectedTargets(allIds);
  };

  const clearSelection = () => {
    setSelectedTargets([]);
  };

  const handleApplyEffect = () => {
    if (selectedTargets.length === 0) return;

    selectedTargets.forEach(targetId => {
      const effect = {
        type: effectType,
        duration: isPermanent ? -1 : duration,
        intensity: ['bleeding', 'burning'].includes(effectType) ? intensity : undefined,
        bonusValue: effectType === 'bracing' ? bonusValue : undefined,
        source: source || 'GM',
      };
      onUpdateState(prev => 
        combatManager.addStatusEffect(prev, targetId, effect.type, effect.duration, effect.source, effect.intensity, effect.bonusValue)
      );
    });

    // Clear selection after applying
    setSelectedTargets([]);
  };

  const needsIntensity = ['bleeding', 'burning'].includes(effectType);
  const needsBonusValue = effectType === 'bracing';

  return (
    <div className="space-y-4">
      {/* Target Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="font-semibold">Select Targets</Label>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={selectAllEnemies}>
              Enemies
            </Button>
            <Button variant="outline" size="sm" onClick={selectAllPlayers}>
              Players
            </Button>
            <Button variant="outline" size="sm" onClick={selectAll}>
              All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
          {combatState.combatants.filter(c => !c.isDead).map(combatant => (
            <label
              key={combatant.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                selectedTargets.includes(combatant.id)
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-accent"
              )}
            >
              <Checkbox
                checked={selectedTargets.includes(combatant.id)}
                onCheckedChange={() => toggleTarget(combatant.id)}
              />
              <span className="text-sm truncate">{combatant.name}</span>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs ml-auto",
                  combatant.type === 'player' && "border-blue-500 text-blue-500",
                  combatant.type === 'enemy' && "border-red-500 text-red-500",
                  combatant.type === 'ally' && "border-green-500 text-green-500"
                )}
              >
                {combatant.type.charAt(0).toUpperCase()}
              </Badge>
            </label>
          ))}
        </div>
        
        {selectedTargets.length > 0 && (
          <Badge className="mt-2">{selectedTargets.length} selected</Badge>
        )}
      </div>

      {/* Effect Configuration */}
      <Card className="p-3 space-y-3">
        <div>
          <Label className="text-xs">Status Effect</Label>
          <Select value={effectType} onValueChange={(v) => setEffectType(v as StatusEffectType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusEffects.map(effect => (
                <SelectItem key={effect} value={effect}>
                  <span className="capitalize">{effect}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {statusEffectDescriptions[effectType]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Duration (rounds)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                disabled={isPermanent}
                min={1}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              checked={isPermanent}
              onCheckedChange={(checked) => setIsPermanent(!!checked)}
            />
            <Label className="text-xs">Permanent</Label>
          </div>
        </div>

        {needsIntensity && (
          <div>
            <Label className="text-xs">Intensity (damage per turn)</Label>
            <Input
              type="number"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        )}

        {needsBonusValue && (
          <div>
            <Label className="text-xs">Bonus DR Value</Label>
            <Input
              type="number"
              value={bonusValue}
              onChange={(e) => setBonusValue(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Source (optional)</Label>
          <Input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., Fire Rune, Bandit"
          />
        </div>
      </Card>

      {/* Apply Button */}
      <Button 
        onClick={handleApplyEffect} 
        className="w-full"
        disabled={selectedTargets.length === 0}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Apply Effect to {selectedTargets.length} Target{selectedTargets.length !== 1 ? 's' : ''}
      </Button>
    </div>
  );
}
