import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Copy, 
  Trash2,
  Sword,
  Heart,
  Sparkles,
  SkipForward,
  Swords,
  Dices,
  Zap,
  Skull
} from "lucide-react";
import { CombatState, CombatLogEntry } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CombatLogProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

const logTypeConfig: Record<CombatLogEntry['type'], { icon: React.ReactNode; color: string }> = {
  damage: { icon: <Sword className="h-3 w-3" />, color: 'text-red-500 bg-red-500/10' },
  heal: { icon: <Heart className="h-3 w-3" />, color: 'text-green-500 bg-green-500/10' },
  status: { icon: <Sparkles className="h-3 w-3" />, color: 'text-yellow-500 bg-yellow-500/10' },
  turn: { icon: <SkipForward className="h-3 w-3" />, color: 'text-blue-500 bg-blue-500/10' },
  combat: { icon: <Swords className="h-3 w-3" />, color: 'text-purple-500 bg-purple-500/10' },
  roll: { icon: <Dices className="h-3 w-3" />, color: 'text-cyan-500 bg-cyan-500/10' },
  fp: { icon: <Zap className="h-3 w-3" />, color: 'text-blue-400 bg-blue-400/10' },
  death: { icon: <Skull className="h-3 w-3" />, color: 'text-purple-600 bg-purple-600/10' },
  effect: { icon: <Sparkles className="h-3 w-3" />, color: 'text-amber-500 bg-amber-500/10' },
};

export function CombatLog({ combatState, onUpdateState }: CombatLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatState.log.length]);

  const handleCopyToClipboard = () => {
    const text = combatManager.formatLogForExport(combatState);
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Combat log copied to clipboard",
      });
    });
  };

  const handleClearLog = () => {
    if (confirm("Are you sure you want to clear the combat log?")) {
      onUpdateState(prev => combatManager.clearLog(prev));
    }
  };

  // Group entries by round
  const entriesByRound = combatState.log.reduce((acc, entry) => {
    const round = entry.round || 0;
    if (!acc[round]) acc[round] = [];
    acc[round].push(entry);
    return acc;
  }, {} as Record<number, CombatLogEntry[]>);

  const rounds = Object.keys(entriesByRound).map(Number).sort((a, b) => a - b);

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm font-medium">Combat Log</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearLog}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={scrollRef}
        className="h-[200px] overflow-y-auto p-2 space-y-1"
      >
        {combatState.log.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            No combat events yet
          </p>
        ) : (
          rounds.map(round => (
            <div key={round}>
              {/* Round Divider */}
              {round > 0 && (
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="outline" className="text-xs">
                    Round {round}
                  </Badge>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
              
              {/* Entries for this round */}
              {entriesByRound[round].map(entry => {
                const config = logTypeConfig[entry.type];
                const time = new Date(entry.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                });
                
                return (
                  <div 
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-2 p-1.5 rounded text-sm",
                      config.color
                    )}
                  >
                    <span className="flex-shrink-0 mt-0.5">{config.icon}</span>
                    <span className="flex-1">{entry.description}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {time}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
