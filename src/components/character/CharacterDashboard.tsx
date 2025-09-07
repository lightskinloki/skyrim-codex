import { useState } from "react";
import { Character, Equipment } from "@/types/character";
import { CharacterCard } from "./CharacterCard";
import { StatBlock } from "./StatBlock";
import { ResourceBar } from "./ResourceBar";
import { SkillsDisplay } from "./SkillsDisplay";
import { KnownSpells } from "./KnownSpells";
import { FPSpendModal } from "./FPSpendModal";
import { AdvancementModal } from "./AdvancementModal";
import { GrantAPModal } from "./GrantAPModal";
import { EquipmentModal } from "./EquipmentModal";
import { AbilityTracker } from "./AbilityTracker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, Zap, Sword, Shield, Settings, Plus, UserPlus, Play, RotateCcw, Package, Download, Minus } from "lucide-react";
import { 
  calculateMaxHP, 
  calculateMaxFP, 
  calculateTotalDR, 
  getCharacterTier, 
  updateCharacterResources,
  getKhajiitClawDamage,
  performShortRest,
  performLongRest
} from "@/utils/characterCalculations";
import { useToast } from "@/hooks/use-toast";

// SessionNotes component defined inline to avoid import issues
interface SessionNotesProps {
  characterId: string;
}

function SessionNotes({ characterId }: SessionNotesProps) {
  const [notes, setNotes] = useState<string>("");
  const storageKey = `skyrimTTRPG_notes_${characterId}`;

  // Load existing notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [storageKey]);

  // Auto-save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(storageKey, notes);
  }, [notes, storageKey]);

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
  };

  return (
    <Card className="p-6 bg-card-secondary">
      <h3 className="font-cinzel font-semibold text-primary mb-4 flex items-center">
        <BookText className="w-5 h-5 mr-2" />
        Session Notes
      </h3>
      
      <div className="space-y-3">
        <Textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Write your session notes here..."
          className="min-h-[120px] bg-muted border-muted-foreground/20 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none"
        />
        
        <p className="text-xs text-muted-foreground italic">
          Notes are saved automatically as you type.
        </p>
      </div>
    </Card>
  );
}

interface CharacterDashboardProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onCreateNewCharacter: () => void;
}

export function CharacterDashboard({ character, onUpdateCharacter, onCreateNewCharacter }: CharacterDashboardProps) {
  const [currentCharacter, setCurrentCharacter] = useState<Character>(character);
  const [showAdvancement, setShowAdvancement] = useState(false);
  const [showGrantAP, setShowGrantAP] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [fpSpendModal, setFpSpendModal] = useState<{
    isOpen: boolean;
    actionName: string;
    fpCost: number;
  }>({
    isOpen: false,
    actionName: '',
    fpCost: 0
  });
  const { toast } = useToast();

  const handleResourceAdjust = (type: 'hp' | 'fp', amount: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      resources: {
        ...currentCharacter.resources,
        [type]: {
          ...currentCharacter.resources[type],
          current: Math.max(0, Math.min(
            currentCharacter.resources[type].max,
            currentCharacter.resources[type].current + amount
          ))
        }
      }
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleGoldAdjust = (amount: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      inventory: {
        ...currentCharacter.inventory,
        gold: Math.max(0, currentCharacter.inventory.gold + amount)
      }
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleDrAdjust = (equipmentId: string, amount: number) => {
    const updatedEquipment = currentCharacter.equipment.map(item => {
      if (item.id === equipmentId && item.dr !== undefined) {
        // Ensure baseDr exists, defaulting to current dr if not present
        const baseDr = (item as any).baseDr ?? item.dr;
        const newDr = item.dr + amount;
        
        // Apply constraints: cannot be less than 0 or greater than baseDr
        const constrainedDr = Math.max(0, Math.min(baseDr, newDr));
        
        return {
          ...item,
          dr: constrainedDr,
          baseDr: baseDr // Ensure baseDr is preserved
        };
      }
      return item;
    });

    const updatedCharacter = {
      ...currentCharacter,
      equipment: updatedEquipment
    };
    
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    // Use the new updateCharacterResources function for proper resource recalculation
    const characterWithUpdatedResources = updateCharacterResources(updatedCharacter);
    
    setCurrentCharacter(characterWithUpdatedResources);
    onUpdateCharacter(characterWithUpdatedResources);
  };

  const handleRest = (type: 'short' | 'long') => {
    const updatedCharacter = type === 'short' 
      ? performShortRest(currentCharacter)
      : performLongRest(currentCharacter);
    
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
    
    toast({
      title: `${type === 'short' ? 'Short' : 'Long'} Rest Complete`,
      description: `Resources restored${type === 'long' ? ' and per-adventure abilities reset' : ''}.`,
    });
  };

  const handleGrantAP = (amount: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      ap: currentCharacter.ap + amount
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleSpendFP = (amount: number, actionName: string) => {
    setFpSpendModal({
      isOpen: true,
      actionName,
      fpCost: amount
    });
  };

  const confirmSpendFP = () => {
    const updatedCharacter = {
      ...currentCharacter,
      resources: {
        ...currentCharacter.resources,
        fp: {
          ...currentCharacter.resources.fp,
          current: currentCharacter.resources.fp.current - fpSpendModal.fpCost
        }
      }
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleCombatModeToggle = (enabled: boolean) => {
    let updatedCharacter = { ...currentCharacter, combatMode: enabled };

    // If enabling combat mode, reset per-combat abilities
    if (enabled) {
      const usedAbilities = currentCharacter.usedAbilities || [];
      const combatAbilities = usedAbilities.filter(abilityId => 
        abilityId.includes('warrior-') || 
        abilityId.includes('thief-') ||
        abilityId.includes('atronach-') ||
        abilityId.includes('serpent-')
      );
      
      updatedCharacter.usedAbilities = usedAbilities.filter(id => !combatAbilities.includes(id));
      
      toast({
        title: "Combat Mode Activated",
        description: "Per-combat abilities have been reset.",
      });
    }

    // Apprentice stone FP regeneration happens at end of turn, not mode toggle
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleEndTurn = () => {
    if (currentCharacter.standingStone.id === "apprentice") {
      const updatedCharacter = {
        ...currentCharacter,
        resources: {
          ...currentCharacter.resources,
          fp: {
            ...currentCharacter.resources.fp,
            current: Math.min(
              currentCharacter.resources.fp.max,
              currentCharacter.resources.fp.current + 1
            )
          }
        }
      };
      setCurrentCharacter(updatedCharacter);
      onUpdateCharacter(updatedCharacter);
      
      toast({
        title: "Turn Ended",
        description: "Arcane Instability: You regenerate 1 FP.",
      });
    } else {
      toast({
        title: "Turn Ended",
        description: "Your turn has ended.",
      });
    }
  };

  // Get equipment including Khajiit claws
  const getAllEquipment = (): Equipment[] => {
    const equipment = [...currentCharacter.equipment];
    
    // Add Khajiit claws if character is Khajiit
    if (currentCharacter.race.id === "khajiit") {
      const clawDamage = getKhajiitClawDamage(currentCharacter.ap);
      equipment.push({
        id: "khajiit-claws",
        name: "Khajiit Claws",
        type: "weapon",
        damage: clawDamage,
        description: `Natural weapons that scale with character tier. Current tier: ${getCharacterTier(currentCharacter.ap)}`
      });
    }
    
    return equipment;
  };

  const handleExportCharacter = () => {
    try {
      const characterData = JSON.stringify(currentCharacter, null, 2);
      const blob = new Blob([characterData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentCharacter.name}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Character Exported!",
        description: `${currentCharacter.name}.json has been downloaded.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export character data.",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-cinzel font-bold text-primary mb-2">
                Character Sheet
              </h1>
              <Badge variant="secondary" className="text-lg">
                {getCharacterTier(currentCharacter.ap)} Tier
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                AP: {currentCharacter.ap}
              </Badge>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowGrantAP(true)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button onClick={onCreateNewCharacter} variant="secondary">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Character
              </Button>
              <Button onClick={() => setShowAdvancement(true)} variant="default">
                <Settings className="w-4 h-4 mr-2" />
                Advance Character
              </Button>
              <Button onClick={() => setShowEquipment(true)} variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Manage Equipment
              </Button>
              <Button onClick={handleExportCharacter} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Character
              </Button>
            </div>
            
            <div className="flex gap-3 items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="combat-mode"
                  checked={currentCharacter.combatMode || false}
                  onCheckedChange={handleCombatModeToggle}
                />
                <Label htmlFor="combat-mode" className="text-sm font-medium">
                  Combat Mode
                </Label>
              </div>
              
              {currentCharacter.combatMode && (
                <Button size="sm" onClick={handleEndTurn} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  End Turn
                </Button>
              )}
              
              <Button onClick={() => handleRest('short')} variant="outline" size="sm">
                Short Rest
              </Button>
              <Button onClick={() => handleRest('long')} variant="outline" size="sm">
                Long Rest
              </Button>
            </div>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Stats & Resources */}
          <div className="space-y-6">
            <CharacterCard character={currentCharacter} />
            
            <StatBlock stats={currentCharacter.stats} />
            
            <ResourceBar
              label="Health Points"
              current={currentCharacter.resources.hp.current}
              max={currentCharacter.resources.hp.max}
              type="health"
              onAdjust={(amount) => handleResourceAdjust('hp', amount)}
            />
            
            <ResourceBar
              label="Fatigue Points"
              current={currentCharacter.resources.fp.current}
              max={currentCharacter.resources.fp.max}
              type="fatigue"
              onAdjust={(amount) => handleResourceAdjust('fp', amount)}
            />
          </div>

          {/* Center Column - Equipment & Inventory */}
          <div className="space-y-6">
            <Card className="p-6 bg-card-secondary">
              <h3 className="font-cinzel font-semibold text-primary mb-4 flex items-center">
                <Sword className="w-5 h-5 mr-2" />
                Equipment
              </h3>
              
              <div className="space-y-3">
                {getAllEquipment().length > 0 ? (
                  getAllEquipment().map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {item.damage && (
                          <p className="text-sm font-bold text-destructive">
                            {item.damage} DMG
                          </p>
                        )}
                        {item.dr && (
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDrAdjust(item.id, -1)}
                              className="h-6 w-6 p-0"
                              disabled={item.dr <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <p className="text-sm font-bold text-primary min-w-[3rem] text-center">
                              {item.dr} DR
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDrAdjust(item.id, 1)}
                              className="h-6 w-6 p-0"
                              disabled={item.dr >= ((item as any).baseDr ?? item.dr)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No equipment equipped</p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card-secondary">
              <h3 className="font-cinzel font-semibold text-primary mb-4">
                Inventory
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded">
                  <span className="font-medium">Gold</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleGoldAdjust(-1)}
                      className="h-6 w-6 p-0"
                      disabled={currentCharacter.inventory.gold <= 0}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xl font-bold text-primary min-w-[3rem] text-center">
                      {currentCharacter.inventory.gold}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleGoldAdjust(1)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {currentCharacter.inventory.items.length > 0 && (
                  <div className="space-y-2">
                    {currentCharacter.inventory.items.map((item, index) => (
                      <div key={index} className="p-2 bg-muted rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <SessionNotes characterId={currentCharacter.id} />
          </div>

          {/* Right Column - Skills */}
          <div className="space-y-6">
            <SkillsDisplay character={currentCharacter} onSpendFP={handleSpendFP} />
            
            <KnownSpells character={currentCharacter} onSpendFP={handleSpendFP} />

            <AbilityTracker character={currentCharacter} onUpdateCharacter={handleUpdateCharacter} />

            <Card className="p-6 bg-card-secondary">
              <h3 className="font-cinzel font-semibold text-primary mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Combat Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total DR</span>
                  <span className="text-xl font-bold text-primary">
                    {calculateTotalDR(getAllEquipment(), currentCharacter.standingStone)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Health</span>
                  <span className="text-xl font-bold text-health">
                    {currentCharacter.resources.hp.max}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Fatigue</span>
                  <span className="text-xl font-bold text-fatigue">
                    {currentCharacter.resources.fp.max}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <AdvancementModal
          isOpen={showAdvancement}
          onClose={() => setShowAdvancement(false)}
          character={currentCharacter}
          onUpdateCharacter={handleUpdateCharacter}
        />
        
        <GrantAPModal
          isOpen={showGrantAP}
          onClose={() => setShowGrantAP(false)}
          onGrantAP={handleGrantAP}
        />
        
        <EquipmentModal
          isOpen={showEquipment}
          onClose={() => setShowEquipment(false)}
          character={currentCharacter}
          onUpdateCharacter={handleUpdateCharacter}
        />
        
        <FPSpendModal
          isOpen={fpSpendModal.isOpen}
          onClose={() => setFpSpendModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmSpendFP}
          actionName={fpSpendModal.actionName}
          fpCost={fpSpendModal.fpCost}
          currentFP={currentCharacter.resources.fp.current}
        />
      </div>
    </div>
  );
}
