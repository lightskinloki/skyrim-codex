import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Heart, 
  Zap, 
  Shield, 
  Crown, 
  Skull,
  Plus,
  Minus,
  X,
  Copy,
  Trash2
} from "lucide-react";
import { Combatant, StatusEffectType } from "@/types/combat";
import { cn } from "@/lib/utils";

interface CombatantCardProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  onHPChange: (delta: number) => void;
  onFPChange: (delta: number) => void;
  onDRChange: (delta: number) => void;
  onStatusRemove: (effectId: string) => void;
  onActionToggle: (action: 'major' | 'minor' | 'reaction') => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

const statusEffectIcons: Record<StatusEffectType, { icon: string; color: string }> = {
  bleeding: { icon: '🩸', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  burning: { icon: '🔥', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  slowed: { icon: '🐌', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  staggered: { icon: '💫', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
  paralyzed: { icon: '⚡', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  invisible: { icon: '👻', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
  hidden: { icon: '🥷', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
  feared: { icon: '😱', color: 'bg-violet-500/20 text-violet-400 border-violet-500/50' },
  frenzied: { icon: '😤', color: 'bg-red-600/20 text-red-500 border-red-600/50' },
  calmed: { icon: '😌', color: 'bg-teal-500/20 text-teal-400 border-teal-500/50' },
  encased: { icon: '🪨', color: 'bg-stone-500/20 text-stone-400 border-stone-500/50' },
  exposed: { icon: '🎯', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  bracing: { icon: '🛡️', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
};

const typeColors = {
  player: 'border-l-blue-500',
  enemy: 'border-l-red-500',
  ally: 'border-l-green-500',
};

export function CombatantCard({
  combatant,
  isCurrentTurn,
  onHPChange,
  onFPChange,
  onDRChange,
  onStatusRemove,
  onActionToggle,
  onDuplicate,
  onRemove,
}: CombatantCardProps) {
  const hpPercent = (combatant.hp.current / combatant.hp.max) * 100;
  const fpPercent = combatant.fp.max > 0 ? (combatant.fp.current / combatant.fp.max) * 100 : 0;

  return (
    <div
      className={cn(
        "border-l-4 rounded-lg p-3 transition-all",
        typeColors[combatant.type],
        combatant.isDead && "opacity-50 grayscale",
        isCurrentTurn && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background shadow-lg shadow-amber-500/20",
        !combatant.isDead && !isCurrentTurn && "bg-card hover:bg-accent/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {combatant.isDead && <Skull className="h-4 w-4 text-muted-foreground" />}
          {combatant.isBoss && <Crown className="h-4 w-4 text-amber-500" />}
          <span className="font-semibold">{combatant.name}</span>
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
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Resources */}
      <div className="space-y-2 mb-3">
        {/* HP Bar */}
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
            <div 
              className={cn(
                "h-full transition-all",
                hpPercent > 50 ? "bg-green-500" : hpPercent > 25 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${Math.max(0, hpPercent)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
              {combatant.hp.current}/{combatant.hp.max}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onHPChange(-1)}>
              <Minus className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onHPChange(1)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* FP Bar (only if they have FP) */}
        {combatant.fp.max > 0 && (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.max(0, fpPercent)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground">
                {combatant.fp.current}/{combatant.fp.max}
              </span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onFPChange(-1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onFPChange(1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* DR */}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm">
            DR: {combatant.dr}
            {combatant.dr < combatant.baseDr && (
              <span className="text-muted-foreground"> (base: {combatant.baseDr})</span>
            )}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 text-xs ml-auto"
            onClick={() => onDRChange(-1)}
            disabled={combatant.dr <= 0}
          >
            Sunder
          </Button>
        </div>
      </div>

      {/* Status Effects */}
      {combatant.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {combatant.statusEffects.map((effect) => {
            const effectInfo = statusEffectIcons[effect.type];
            return (
              <Badge
                key={effect.id}
                variant="outline"
                className={cn("cursor-pointer hover:opacity-80", effectInfo.color)}
                onClick={() => onStatusRemove(effect.id)}
              >
                <span className="mr-1">{effectInfo.icon}</span>
                {effect.type}
                {effect.intensity && effect.intensity > 1 && ` x${effect.intensity}`}
                {effect.duration > 0 && ` (${effect.duration})`}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Action Tracking */}
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox 
            checked={combatant.majorActionUsed}
            onCheckedChange={() => onActionToggle('major')}
          />
          <span className={combatant.majorActionUsed ? "text-muted-foreground line-through" : ""}>
            Major
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox 
            checked={combatant.minorActionUsed}
            onCheckedChange={() => onActionToggle('minor')}
          />
          <span className={combatant.minorActionUsed ? "text-muted-foreground line-through" : ""}>
            Minor
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox 
            checked={combatant.reactionUsed}
            onCheckedChange={() => onActionToggle('reaction')}
          />
          <span className={combatant.reactionUsed ? "text-muted-foreground line-through" : ""}>
            Reaction
          </span>
        </label>
      </div>

      {/* Initiative (shown inline) */}
      {combatant.initiative !== null && (
        <div className="mt-2 text-xs text-muted-foreground">
          Initiative: {combatant.initiative} | AGI: {combatant.stats.agility}
        </div>
      )}
    </div>
  );
}
