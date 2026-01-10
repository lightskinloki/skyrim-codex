// Player Combat Portal - Full screen combat action manager
import { useState } from "react";
import { Character } from "@/types/character";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Heart, 
  Zap, 
  Shield, 
  Minus, 
  Plus, 
  X, 
  Minimize2,
  Swords,
  Footprints,
  Sparkles,
  ChevronRight,
  Check,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getBonusActions, 
  getValidMajorActions, 
  getValidMinorActions,
  BonusActionAbility,
  MajorActionOption,
  MinorActionOption
} from "@/utils/actionUtils";
import { calculateTotalDR } from "@/utils/characterCalculations";
import { useToast } from "@/hooks/use-toast";

interface ActionSlot {
  id: string;
  type: 'major' | 'minor' | 'bonus' | 'free';
  label: string;
  used: boolean;
  actionTaken?: string;
  fpSpent?: number;
  sourceAbility?: BonusActionAbility;
}

interface PlayerCombatPortalProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onClose: () => void;
  onMinimize: () => void;
}

export function PlayerCombatPortal({ 
  character, 
  onUpdateCharacter, 
  onClose, 
  onMinimize 
}: PlayerCombatPortalProps) {
  const { toast } = useToast();
  const [sunderModifier, setSunderModifier] = useState(0);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [actionSlots, setActionSlots] = useState<ActionSlot[]>(() => initializeSlots());
  
  // Initialize action slots based on character abilities
  function initializeSlots(): ActionSlot[] {
    const slots: ActionSlot[] = [
      { id: 'major', type: 'major', label: 'MAJOR ACTION', used: false },
      { id: 'minor', type: 'minor', label: 'MINOR ACTION', used: false },
    ];
    
    // Add bonus action slots based on character abilities
    const bonusAbilities = getBonusActions(character);
    bonusAbilities.forEach((ability, index) => {
      slots.push({
        id: `bonus-${index}`,
        type: 'bonus',
        label: `BONUS: ${ability.name}`,
        used: false,
        sourceAbility: ability,
      });
    });
    
    return slots;
  }
  
  // Resource handlers
  const handleHPChange = (delta: number) => {
    const newHP = Math.max(0, Math.min(
      character.resources.hp.max,
      character.resources.hp.current + delta
    ));
    
    onUpdateCharacter({
      ...character,
      resources: {
        ...character.resources,
        hp: { ...character.resources.hp, current: newHP }
      }
    });
  };
  
  const handleFPChange = (delta: number) => {
    const newFP = Math.max(0, Math.min(
      character.resources.fp.max,
      character.resources.fp.current + delta
    ));
    
    onUpdateCharacter({
      ...character,
      resources: {
        ...character.resources,
        fp: { ...character.resources.fp, current: newFP }
      }
    });
  };
  
  // Calculate effective DR
  const baseDR = calculateTotalDR(character);
  const effectiveDR = Math.max(0, baseDR - sunderModifier);
  
  // Add manual slot
  const handleAddSlot = (slotType: 'bonus' | 'free') => {
    const newSlot: ActionSlot = {
      id: `${slotType}-${Date.now()}`,
      type: slotType,
      label: slotType === 'free' ? 'FREE ACTION' : 'BONUS ACTION',
      used: false,
    };
    setActionSlots([...actionSlots, newSlot]);
  };
  
  // Use action from slot
  const handleUseAction = (slotId: string, action: MajorActionOption | MinorActionOption | BonusActionAbility) => {
    const slot = actionSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    // Check FP cost
    const fpCost = 'fpCost' in action ? action.fpCost || 0 : 0;
    if (fpCost > character.resources.fp.current) {
      toast({
        title: "Insufficient FP",
        description: `${action.name} requires ${fpCost} FP but you only have ${character.resources.fp.current}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Deduct FP
    if (fpCost > 0) {
      handleFPChange(-fpCost);
    }
    
    // Mark slot as used
    setActionSlots(prev => prev.map(s => 
      s.id === slotId 
        ? { ...s, used: true, actionTaken: action.name, fpSpent: fpCost }
        : s
    ));
    
    setActiveSlot(null);
    
    toast({
      title: action.name,
      description: fpCost > 0 ? `Spent ${fpCost} FP` : "Action used",
    });
  };
  
  // Reset turn
  const handleResetTurn = () => {
    setActionSlots(initializeSlots());
    toast({
      title: "Turn Reset",
      description: "All actions have been reset for a new turn.",
    });
  };
  
  // Get valid actions for slot type
  const getActionsForSlot = (slot: ActionSlot) => {
    switch (slot.type) {
      case 'major':
        return getValidMajorActions(character);
      case 'minor':
        return getValidMinorActions(character);
      case 'bonus':
        return slot.sourceAbility ? [slot.sourceAbility] : getBonusActions(character);
      case 'free':
        return [
          { id: 'speak', name: 'Speak', description: 'Say a few words', type: 'standard' as const },
          { id: 'drop', name: 'Drop Item', description: 'Drop something you\'re holding', type: 'item' as const },
        ];
      default:
        return [];
    }
  };
  
  const hpPercent = (character.resources.hp.current / character.resources.hp.max) * 100;
  const fpPercent = (character.resources.fp.current / character.resources.fp.max) * 100;
  
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="font-cinzel text-2xl font-bold text-primary tracking-wider">
            COMBAT ACTIVE
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onMinimize}>
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Vitals Section */}
        <div className="bg-card/50 border-b border-border p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* HP Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">Health</span>
                </div>
                <span className="text-lg font-bold">
                  {character.resources.hp.current} / {character.resources.hp.max}
                </span>
              </div>
              <div className="h-8 bg-muted rounded-full overflow-hidden relative">
                <div 
                  className={cn(
                    "h-full transition-all",
                    hpPercent > 50 ? "bg-green-500" : hpPercent > 25 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.max(0, hpPercent)}%` }}
                />
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleHPChange(-5)}>-5</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(-1)}>-1</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(1)}>+1</Button>
                <Button variant="outline" size="sm" onClick={() => handleHPChange(5)}>+5</Button>
              </div>
            </div>
            
            {/* FP Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Focus</span>
                </div>
                <span className="text-lg font-bold">
                  {character.resources.fp.current} / {character.resources.fp.max}
                </span>
              </div>
              <div className="h-8 bg-muted rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.max(0, fpPercent)}%` }}
                />
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleFPChange(-5)}>-5</Button>
                <Button variant="outline" size="sm" onClick={() => handleFPChange(-1)}>-1</Button>
                <Button variant="outline" size="sm" onClick={() => handleFPChange(1)}>+1</Button>
                <Button variant="outline" size="sm" onClick={() => handleFPChange(5)}>+5</Button>
              </div>
            </div>
            
            {/* DR Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-slate-400" />
                  <span className="font-semibold">Damage Reduction</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{effectiveDR}</div>
                  {sunderModifier > 0 && (
                    <div className="text-sm text-muted-foreground">
                      (Base: {baseDR})
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Sunder:</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setSunderModifier(Math.max(0, sunderModifier - 1))}
                  disabled={sunderModifier <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input 
                  type="number"
                  value={sunderModifier}
                  onChange={(e) => setSunderModifier(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 h-7 text-center px-1"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setSunderModifier(sunderModifier + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Stack */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-cinzel text-xl font-bold">Action Stack</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddSlot('free')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Free Action
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddSlot('bonus')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Bonus Action
                </Button>
                <Button variant="secondary" size="sm" onClick={handleResetTurn}>
                  Reset Turn
                </Button>
              </div>
            </div>
            
            {actionSlots.map((slot) => (
              <Sheet key={slot.id} open={activeSlot === slot.id} onOpenChange={(open) => setActiveSlot(open ? slot.id : null)}>
                <SheetTrigger asChild>
                  <Card 
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:border-primary/50",
                      slot.used && "opacity-60 bg-muted/50",
                      slot.type === 'major' && "border-l-4 border-l-amber-500",
                      slot.type === 'minor' && "border-l-4 border-l-blue-500",
                      slot.type === 'bonus' && "border-l-4 border-l-purple-500",
                      slot.type === 'free' && "border-l-4 border-l-green-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {slot.type === 'major' && <Swords className="h-5 w-5 text-amber-500" />}
                        {slot.type === 'minor' && <Footprints className="h-5 w-5 text-blue-500" />}
                        {slot.type === 'bonus' && <Sparkles className="h-5 w-5 text-purple-500" />}
                        {slot.type === 'free' && <Check className="h-5 w-5 text-green-500" />}
                        <div>
                          <div className="font-semibold tracking-wide">
                            {slot.label}
                          </div>
                          {slot.used && slot.actionTaken && (
                            <div className="text-sm text-muted-foreground">
                              {slot.actionTaken}
                              {slot.fpSpent ? ` (-${slot.fpSpent} FP)` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.used ? (
                          <Badge variant="secondary">USED</Badge>
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Card>
                </SheetTrigger>
                
                <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle className="font-cinzel">
                      {slot.label} Options
                    </SheetTitle>
                  </SheetHeader>
                  
                  <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                    <div className="space-y-2 pr-4">
                      {getActionsForSlot(slot).map((action) => {
                        const fpCost = 'fpCost' in action ? action.fpCost || 0 : 0;
                        const canAfford = fpCost <= character.resources.fp.current;
                        
                        return (
                          <Card 
                            key={action.id || action.name}
                            className={cn(
                              "p-3 cursor-pointer transition-all hover:border-primary/50",
                              !canAfford && "opacity-50"
                            )}
                            onClick={() => canAfford && handleUseAction(slot.id, action as any)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{action.name}</span>
                                  {'source' in action && action.source && (
                                    <Badge variant="outline" className="text-xs">
                                      {action.source}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                                {'damage' in action && action.damage && (
                                  <div className="text-sm text-red-400 mt-1">
                                    Damage: {action.damage}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {fpCost > 0 && (
                                  <Badge 
                                    variant={canAfford ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {fpCost} FP
                                  </Badge>
                                )}
                                {!canAfford && (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
