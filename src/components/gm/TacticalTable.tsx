// GM Tactical Table - High-density table view with inspector panel
import { useState, useEffect, useRef } from "react";
import { CombatState, Combatant, StatusEffectType, STATUS_EFFECT_INFO } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Heart, 
  Zap, 
  Shield, 
  Crown, 
  Skull,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight,
  Swords,
  X,
  Copy,
  Trash2,
  Hammer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TacticalTableProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

// Status effect toggle component
function StatusToggle({ 
  type, 
  active, 
  onClick 
}: { 
  type: StatusEffectType; 
  active: boolean; 
  onClick: () => void;
}) {
  const info = STATUS_EFFECT_INFO[type];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center text-lg transition-all",
              active 
                ? "bg-primary/20 ring-2 ring-primary" 
                : "bg-muted/50 opacity-50 hover:opacity-100"
            )}
          >
            {info.icon}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{type}</p>
          <p className="text-xs text-muted-foreground">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TacticalTable({ combatState, onUpdateState }: TacticalTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gmTurnExpanded, setGmTurnExpanded] = useState(true);
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  
  // Auto-scroll to current turn
  useEffect(() => {
    if (activeRowRef.current && combatState.active) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [combatState.currentTurnCombatantId, combatState.active]);
  
  // Separate combatants
  const playersAndAllies = combatState.combatants.filter(c => c.type !== 'enemy');
  const enemies = combatState.combatants.filter(c => c.type === 'enemy');
  const livingEnemies = enemies.filter(e => !e.isDead);
  const deadEnemies = enemies.filter(e => e.isDead);
  
  const enemyInitiative = enemies.length > 0 ? (enemies[0].initiative ?? null) : null;
  const lowestEnemyAgility = enemies.length > 0 
    ? Math.min(...enemies.map(e => e.stats.agility))
    : 0;
  
  // Sort players by initiative
  const sortedPlayersAndAllies = [...playersAndAllies].sort((a, b) => {
    const initA = a.initiative ?? 999;
    const initB = b.initiative ?? 999;
    if (initA !== initB) return initA - initB;
    return a.stats.agility - b.stats.agility;
  });
  
  // Build display order
  type DisplayItem = 
    | { type: 'combatant'; combatant: Combatant }
    | { type: 'gm_turn' };
  
  const displayOrder: DisplayItem[] = [];
  let gmTurnInserted = false;
  
  for (const player of sortedPlayersAndAllies) {
    if (player.isDead) continue;
    
    const playerInit = player.initiative ?? 999;
    const playerAgility = player.stats.agility;
    const enemyInit = enemyInitiative ?? 999;
    
    if (!gmTurnInserted && enemies.length > 0) {
      if (enemyInit < playerInit) {
        displayOrder.push({ type: 'gm_turn' });
        gmTurnInserted = true;
      } else if (enemyInit === playerInit && lowestEnemyAgility < playerAgility) {
        displayOrder.push({ type: 'gm_turn' });
        gmTurnInserted = true;
      }
    }
    
    displayOrder.push({ type: 'combatant', combatant: player });
  }
  
  if (!gmTurnInserted && enemies.length > 0) {
    displayOrder.push({ type: 'gm_turn' });
  }
  
  // Dead players at end
  const deadPlayers = playersAndAllies.filter(c => c.isDead);
  
  const isGMTurn = combatState.currentTurnCombatantId === 'GM_TURN';
  const selectedCombatant = selectedId 
    ? combatState.combatants.find(c => c.id === selectedId) 
    : null;
  
  // Action handlers
  const handleHPChange = (combatantId: string, delta: number) => {
    onUpdateState(prev => {
      if (delta > 0) {
        return combatManager.applyHealing(prev, combatantId, delta, "GM");
      } else {
        return combatManager.applyRawDamage(prev, combatantId, Math.abs(delta), "GM");
      }
    });
  };
  
  const handleFPChange = (combatantId: string, delta: number) => {
    onUpdateState(prev => {
      if (delta > 0) {
        return combatManager.applyFPRestore(prev, combatantId, delta, "GM");
      } else {
        return combatManager.applyFPDamage(prev, combatantId, Math.abs(delta), "GM");
      }
    });
  };
  
  const handleSunder = (combatantId: string) => {
    onUpdateState(prev => combatManager.sunderArmor(prev, combatantId, "GM"));
  };
  
  const handleToggleStatus = (combatantId: string, effectType: StatusEffectType) => {
    const combatant = combatState.combatants.find(c => c.id === combatantId);
    if (!combatant) return;
    
    const existingEffect = combatant.statusEffects.find(e => e.type === effectType);
    
    if (existingEffect) {
      onUpdateState(prev => combatManager.removeStatusEffect(prev, combatantId, existingEffect.id));
    } else {
      onUpdateState(prev => combatManager.addStatusEffect(prev, combatantId, effectType, 3, "GM"));
    }
  };
  
  const handleDuplicate = (combatant: Combatant) => {
    const baseName = combatant.name.replace(/\s*#\d+$/, '');
    const existingNumbers = combatState.combatants
      .filter(c => c.name.startsWith(baseName))
      .map(c => {
        const match = c.name.match(/#(\d+)$/);
        return match ? parseInt(match[1]) : 1;
      });
    const nextNumber = Math.max(...existingNumbers, 0) + 1;
    const newName = `${baseName} #${nextNumber}`;
    
    const newCombatant = combatManager.createCustomCombatant({
      name: newName,
      type: combatant.type,
      hp: combatant.hp.max,
      fp: combatant.fp.max,
      dr: combatant.baseDr,
      stats: combatant.stats,
      isBoss: combatant.isBoss,
      attacks: combatant.attacks,
      abilities: combatant.abilities,
    });
    
    onUpdateState(prev => combatManager.addCombatant(prev, newCombatant));
  };
  
  const handleRemove = (combatantId: string) => {
    onUpdateState(prev => combatManager.removeCombatant(prev, combatantId));
    if (selectedId === combatantId) setSelectedId(null);
  };
  
  // Render mini HP bar
  const renderHPBar = (combatant: Combatant) => {
    const percent = (combatant.hp.current / combatant.hp.max) * 100;
    return (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
          <div 
            className={cn(
              "h-full transition-all",
              percent > 50 ? "bg-green-500" : percent > 25 ? "bg-yellow-500" : "bg-red-500"
            )}
            style={{ width: `${Math.max(0, percent)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
            {combatant.hp.current}/{combatant.hp.max}
          </span>
        </div>
      </div>
    );
  };
  
  // Render mini FP bar
  const renderFPBar = (combatant: Combatant) => {
    if (combatant.fp.max === 0) return <span className="text-muted-foreground">—</span>;
    const percent = (combatant.fp.current / combatant.fp.max) * 100;
    return (
      <div className="flex items-center gap-2 min-w-[80px]">
        <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${Math.max(0, percent)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
            {combatant.fp.current}/{combatant.fp.max}
          </span>
        </div>
      </div>
    );
  };
  
  // Render status icons
  const renderStatusIcons = (combatant: Combatant) => {
    if (combatant.statusEffects.length === 0) return null;
    return (
      <div className="flex gap-0.5 flex-wrap">
        {combatant.statusEffects.map((effect) => {
          const info = STATUS_EFFECT_INFO[effect.type];
          return (
            <TooltipProvider key={effect.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm">{info.icon}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{effect.type} ({effect.duration} rounds)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };
  
  // Render table row for a combatant
  const renderCombatantRow = (combatant: Combatant, isCurrentTurn: boolean) => {
    return (
      <TableRow
        key={combatant.id}
        ref={isCurrentTurn ? activeRowRef : undefined}
        className={cn(
          "h-12 cursor-pointer transition-all",
          selectedId === combatant.id && "bg-primary/10",
          isCurrentTurn && "bg-amber-500/10 ring-1 ring-amber-500",
          combatant.isDead && "opacity-50"
        )}
        onClick={() => setSelectedId(combatant.id)}
      >
        <TableCell className="font-mono text-center w-12">
          {combatant.initiative ?? '—'}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {combatant.isDead && <Skull className="h-3 w-3 text-muted-foreground" />}
            {combatant.isBoss && <Crown className="h-3 w-3 text-amber-500" />}
            <span className={cn(
              "font-medium",
              combatant.type === 'player' && "text-blue-400",
              combatant.type === 'enemy' && "text-red-400",
              combatant.type === 'ally' && "text-green-400"
            )}>
              {combatant.name}
            </span>
          </div>
        </TableCell>
        <TableCell>{renderHPBar(combatant)}</TableCell>
        <TableCell>{renderFPBar(combatant)}</TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Shield className="h-3 w-3 text-slate-400" />
            <span>{combatant.dr}</span>
            {combatant.dr < combatant.baseDr && (
              <span className="text-xs text-muted-foreground">
                ({combatant.baseDr})
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>{renderStatusIcons(combatant)}</TableCell>
      </TableRow>
    );
  };
  
  if (combatState.combatants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
        <p className="text-lg">No combatants yet</p>
        <p className="text-sm">Add enemies or players from the Enemies tab</p>
      </div>
    );
  }
  
  return (
    <div className="flex h-full gap-4">
      {/* Table Section - 70% */}
      <div className="flex-[7] overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="bg-card hover:bg-card">
                <TableHead className="w-12 text-center">Init</TableHead>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead className="min-w-[120px]">HP</TableHead>
                <TableHead className="min-w-[80px]">FP</TableHead>
                <TableHead className="w-16 text-center">DR</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayOrder.map((item, index) => {
                if (item.type === 'gm_turn') {
                  return (
                    <Collapsible key="gm_turn" open={gmTurnExpanded} onOpenChange={setGmTurnExpanded} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow
                            ref={isGMTurn ? activeRowRef : undefined}
                            className={cn(
                              "h-12 cursor-pointer bg-red-950/30 hover:bg-red-950/50 border-y border-red-500/30",
                              isGMTurn && "ring-1 ring-amber-500"
                            )}
                          >
                            <TableCell className="font-mono text-center text-red-400">
                              {enemyInitiative ?? '—'}
                            </TableCell>
                            <TableCell colSpan={5}>
                              <div className="flex items-center gap-3">
                                {gmTurnExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-red-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-red-400" />
                                )}
                                <Swords className="h-4 w-4 text-red-400" />
                                <span className="font-bold text-red-400">GM TURN</span>
                                <Badge variant="outline" className="border-red-500/50 text-red-400">
                                  {livingEnemies.length} active
                                </Badge>
                                {deadEnemies.length > 0 && (
                                  <Badge variant="outline" className="border-muted text-muted-foreground">
                                    {deadEnemies.length} dead
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <>
                            {livingEnemies.map((enemy) => (
                              <TableRow
                                key={enemy.id}
                                className={cn(
                                  "h-12 cursor-pointer bg-red-950/10 hover:bg-red-950/20",
                                  selectedId === enemy.id && "bg-primary/10"
                                )}
                                onClick={() => setSelectedId(enemy.id)}
                              >
                                <TableCell className="text-center text-muted-foreground">↳</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 pl-4">
                                    {enemy.isBoss && <Crown className="h-3 w-3 text-amber-500" />}
                                    <span className="text-red-400">{enemy.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{renderHPBar(enemy)}</TableCell>
                                <TableCell>{renderFPBar(enemy)}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Shield className="h-3 w-3 text-slate-400" />
                                    <span>{enemy.dr}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{renderStatusIcons(enemy)}</TableCell>
                              </TableRow>
                            ))}
                            {deadEnemies.map((enemy) => (
                              <TableRow
                                key={enemy.id}
                                className={cn(
                                  "h-10 cursor-pointer opacity-50 bg-red-950/5",
                                  selectedId === enemy.id && "bg-primary/10"
                                )}
                                onClick={() => setSelectedId(enemy.id)}
                              >
                                <TableCell className="text-center text-muted-foreground">↳</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 pl-4">
                                    <Skull className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground line-through">{enemy.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell colSpan={4}>
                                  <span className="text-xs text-muted-foreground">Dead</span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                }
                
                return renderCombatantRow(
                  item.combatant, 
                  item.combatant.id === combatState.currentTurnCombatantId
                );
              })}
              
              {/* Dead players at end */}
              {deadPlayers.length > 0 && (
                <>
                  <TableRow className="h-8 bg-muted/20">
                    <TableCell colSpan={6} className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Skull className="h-3 w-3" />
                        Fallen Allies
                      </div>
                    </TableCell>
                  </TableRow>
                  {deadPlayers.map(combatant => renderCombatantRow(combatant, false))}
                </>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      
      {/* Inspector Panel - 30% */}
      <div className="flex-[3] min-w-[280px] border-l border-border">
        {selectedCombatant ? (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedCombatant.isBoss && <Crown className="h-5 w-5 text-amber-500" />}
                <h3 className="font-cinzel text-lg font-bold">{selectedCombatant.name}</h3>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(selectedCombatant)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(selectedCombatant.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Large HP Display */}
            <Card className="p-4 bg-card">
              <div className="text-center mb-2">
                <Heart className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <div className="text-4xl font-bold">
                  {selectedCombatant.hp.current}
                  <span className="text-xl text-muted-foreground"> / {selectedCombatant.hp.max}</span>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleHPChange(selectedCombatant.id, -10)}>-10</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(selectedCombatant.id, -5)}>-5</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(selectedCombatant.id, -1)}>-1</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(selectedCombatant.id, 1)}>+1</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(selectedCombatant.id, 5)}>+5</Button>
              </div>
            </Card>
            
            {/* FP Quick Adjust */}
            {selectedCombatant.fp.max > 0 && (
              <Card className="p-3 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Focus</span>
                  </div>
                  <span className="font-bold">
                    {selectedCombatant.fp.current} / {selectedCombatant.fp.max}
                  </span>
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleFPChange(selectedCombatant.id, -5)}>-5</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFPChange(selectedCombatant.id, -1)}>-1</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFPChange(selectedCombatant.id, 1)}>+1</Button>
                  <Button variant="outline" size="sm" onClick={() => handleFPChange(selectedCombatant.id, 5)}>+5</Button>
                </div>
              </Card>
            )}
            
            {/* DR + Sunder */}
            <Card className="p-3 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">DR</span>
                  <span className="font-bold text-lg">{selectedCombatant.dr}</span>
                  {selectedCombatant.dr < selectedCombatant.baseDr && (
                    <span className="text-sm text-muted-foreground">(base: {selectedCombatant.baseDr})</span>
                  )}
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleSunder(selectedCombatant.id)}
                  disabled={selectedCombatant.dr <= 0}
                >
                  <Hammer className="h-3 w-3 mr-1" />
                  Sunder
                </Button>
              </div>
            </Card>
            
            {/* Status Effects Grid */}
            <Card className="p-3 bg-card">
              <h4 className="font-medium mb-3">Status Effects</h4>
              <div className="grid grid-cols-5 gap-1">
                {(Object.keys(STATUS_EFFECT_INFO) as StatusEffectType[]).map(effectType => (
                  <StatusToggle
                    key={effectType}
                    type={effectType}
                    active={selectedCombatant.statusEffects.some(e => e.type === effectType)}
                    onClick={() => handleToggleStatus(selectedCombatant.id, effectType)}
                  />
                ))}
              </div>
            </Card>
            
            {/* Stats */}
            <Card className="p-3 bg-card">
              <h4 className="font-medium mb-2">Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Might</span>
                  <span className="font-mono">{selectedCombatant.stats.might}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agility</span>
                  <span className="font-mono">{selectedCombatant.stats.agility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magic</span>
                  <span className="font-mono">{selectedCombatant.stats.magic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guile</span>
                  <span className="font-mono">{selectedCombatant.stats.guile}</span>
                </div>
              </div>
            </Card>
            
            {/* Attacks (for enemies) */}
            {selectedCombatant.attacks && selectedCombatant.attacks.length > 0 && (
              <Card className="p-3 bg-card">
                <h4 className="font-medium mb-2">Attacks</h4>
                <div className="space-y-1 text-sm">
                  {selectedCombatant.attacks.map((attack, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{attack.name}</span>
                      <span className="text-red-400 font-mono">{attack.damage} dmg</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>Select a combatant</p>
            <p className="text-sm">to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
