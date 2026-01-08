import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Heart, Zap, Sword, Shield, Settings, Plus, UserPlus, Play, RotateCcw, Package, Download, Minus, BookText, Edit2, Trash2, X, Check, ScrollText } from "lucide-react";
import { officialEquipment } from "@/data/equipment";
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

// SessionNotes component - saves directly to character object
const NOTES_WARNING_LIMIT = 400000; // ~400KB - show warning
const NOTES_ERROR_LIMIT = 500000;   // ~500KB - block save

interface SessionNotesProps {
  character: Character;
  onUpdateNotes: (notes: string) => void;
}

function SessionNotes({ character, onUpdateNotes }: SessionNotesProps) {
  const notesLength = (character.notes || "").length;
  const isWarning = notesLength > NOTES_WARNING_LIMIT && notesLength <= NOTES_ERROR_LIMIT;
  const isError = notesLength > NOTES_ERROR_LIMIT;

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    // Block saving if over limit - but allow deletion
    if (newNotes.length > NOTES_ERROR_LIMIT && newNotes.length > notesLength) {
      return;
    }
    onUpdateNotes(newNotes);
  };

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="font-cinzel text-lg font-bold text-primary mb-3 flex items-center gap-2">
        <ScrollText className="w-5 h-5" />
        Session Notes
      </h3>
      
      <div className="space-y-3">
        <Textarea
          value={character.notes || ""}
          onChange={handleNotesChange}
          placeholder="Write your session notes here..."
          className={`min-h-[120px] bg-muted border-muted-foreground/20 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
            isError ? 'border-destructive' : isWarning ? 'border-yellow-500' : ''
          }`}
        />
        
        {isError && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive font-medium">
              Session notes are too long and cannot be saved. Please copy your notes to a separate document (Google Docs, text file, etc.) and clear some space here.
            </p>
          </div>
        )}
        
        {isWarning && !isError && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500 rounded-md">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              Notes are getting long. Consider exporting your character or copying notes to a separate document.
            </p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground italic">
            Notes are saved automatically with your character.
          </p>
          <p className={`text-xs ${isError ? 'text-destructive' : isWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
            {formatNumber(notesLength)} / {formatNumber(NOTES_ERROR_LIMIT)} characters
          </p>
        </div>
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
  const [goldModal, setGoldModal] = useState<{
    isOpen: boolean;
    type: 'add' | 'remove';
  }>({
    isOpen: false,
    type: 'add'
  });
  const [fpSpendModal, setFpSpendModal] = useState<{
    isOpen: boolean;
    actionName: string;
    fpCost: number;
  }>({
    isOpen: false,
    actionName: '',
    fpCost: 0
  });
  
  // Equipment management state
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({ name: '', type: 'weapon' as 'weapon' | 'armor' | 'shield', damage: '', dr: '', description: '' });
  const [equipmentSuggestions, setEquipmentSuggestions] = useState<typeof officialEquipment>([]);
  
  // Item management state
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  
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

  const handleGoldAdjust = (amount: number, type: 'add' | 'remove') => {
    const adjustedAmount = type === 'add' ? amount : -amount;
    const newGold = Math.max(0, currentCharacter.inventory.gold + adjustedAmount);
    
    const updatedCharacter = {
      ...currentCharacter,
      inventory: {
        ...currentCharacter.inventory,
        gold: newGold
      }
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
    
    toast({
      title: type === 'add' ? 'Gold Added' : 'Gold Removed',
      description: `${amount} gold ${type === 'add' ? 'added to' : 'removed from'} inventory.`,
    });
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

  // Equipment Management Functions
  const handleEquipmentNameChange = (value: string) => {
    setEquipmentForm({ ...equipmentForm, name: value });
    
    if (value.length > 0) {
      const matches = officialEquipment.filter(item => 
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setEquipmentSuggestions(matches.slice(0, 5));
    } else {
      setEquipmentSuggestions([]);
    }
  };
  
  const handleSelectSuggestion = (item: typeof officialEquipment[0]) => {
    setEquipmentForm({
      name: item.name,
      type: item.type === 'clothing' ? 'armor' : item.type,
      damage: item.damage?.toString() || '',
      dr: item.dr?.toString() || '',
      description: item.description
    });
    setEquipmentSuggestions([]);
  };
  
  const handleAddEquipment = () => {
    if (!equipmentForm.name) return;
    
    const newEquipment: Equipment = {
      id: `custom-${Date.now()}`,
      name: equipmentForm.name,
      type: equipmentForm.type,
      ...(equipmentForm.damage && { damage: parseInt(equipmentForm.damage) }),
      ...(equipmentForm.dr && { dr: parseInt(equipmentForm.dr), baseDr: parseInt(equipmentForm.dr) }),
      ...(equipmentForm.description && { description: equipmentForm.description })
    };
    
    const updatedCharacter = {
      ...currentCharacter,
      equipment: [...currentCharacter.equipment, newEquipment]
    };
    
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
    setAddingEquipment(false);
    setEquipmentForm({ name: '', type: 'weapon', damage: '', dr: '', description: '' });
    setEquipmentSuggestions([]);
  };
  
  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipmentId(item.id);
    setEquipmentForm({
      name: item.name,
      type: item.type,
      damage: item.damage?.toString() || '',
      dr: item.dr?.toString() || '',
      description: item.description || ''
    });
  };
  
  const handleSaveEquipment = (itemId: string) => {
    const updatedEquipment = currentCharacter.equipment.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          name: equipmentForm.name,
          type: equipmentForm.type,
          ...(equipmentForm.damage && { damage: parseInt(equipmentForm.damage) }),
          ...(equipmentForm.dr && { dr: parseInt(equipmentForm.dr), baseDr: (item as any).baseDr || parseInt(equipmentForm.dr) }),
          ...(equipmentForm.description && { description: equipmentForm.description })
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
    setEditingEquipmentId(null);
    setEquipmentForm({ name: '', type: 'weapon', damage: '', dr: '', description: '' });
  };
  
  const handleDeleteEquipment = (itemId: string) => {
    const updatedCharacter = {
      ...currentCharacter,
      equipment: currentCharacter.equipment.filter(item => item.id !== itemId)
    };
    
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };
  
  // Item Management Functions
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    
    const existingIndex = currentCharacter.inventory.items.findIndex(
      item => item.name.toLowerCase() === newItemName.trim().toLowerCase()
    );
    
    if (existingIndex >= 0) {
      const newItems = [...currentCharacter.inventory.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + 1
      };
      const updatedCharacter = {
        ...currentCharacter,
        inventory: { ...currentCharacter.inventory, items: newItems }
      };
      setCurrentCharacter(updatedCharacter);
      onUpdateCharacter(updatedCharacter);
    } else {
      const updatedCharacter = {
        ...currentCharacter,
        inventory: {
          ...currentCharacter.inventory,
          items: [...currentCharacter.inventory.items, { name: newItemName.trim(), quantity: 1 }]
        }
      };
      setCurrentCharacter(updatedCharacter);
      onUpdateCharacter(updatedCharacter);
    }
    setNewItemName('');
    setAddingItem(false);
  };
  
  const handleDeleteItem = (index: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      inventory: {
        ...currentCharacter.inventory,
        items: currentCharacter.inventory.items.filter((_, i) => i !== index)
      }
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };
  
  const handleAdjustItemQuantity = (index: number, delta: number) => {
    const newItems = [...currentCharacter.inventory.items];
    const newQuantity = newItems[index].quantity + delta;
    
    if (newQuantity <= 0) {
      handleDeleteItem(index);
    } else {
      newItems[index] = { ...newItems[index], quantity: newQuantity };
      const updatedCharacter = {
        ...currentCharacter,
        inventory: { ...currentCharacter.inventory, items: newItems }
      };
      setCurrentCharacter(updatedCharacter);
      onUpdateCharacter(updatedCharacter);
    }
  };

  const handleUpdateNotes = (notes: string) => {
    const updatedCharacter = { ...currentCharacter, notes };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
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

  // Gold Modal Component
  const GoldModal = () => {
    const [amount, setAmount] = useState<string>('');

    const handleSubmit = () => {
      const numAmount = parseInt(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        handleGoldAdjust(numAmount, goldModal.type);
        setGoldModal({ ...goldModal, isOpen: false });
        setAmount('');
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    if (!goldModal.isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 className="text-xl font-cinzel font-bold text-primary mb-4">
            {goldModal.type === 'add' ? 'Add Gold' : 'Remove Gold'}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Amount
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              className="w-full px-3 py-2 bg-muted border border-muted-foreground/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter amount..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setGoldModal({ ...goldModal, isOpen: false });
                setAmount('');
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!amount || parseInt(amount) <= 0}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
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
                {getAllEquipment().filter(item => item.id !== 'khajiit-claws').length > 0 ? (
                  <>
                    {getAllEquipment().map((item, index) => {
                      const isKhajiitClaws = item.id === 'khajiit-claws';
                      const isEditing = editingEquipmentId === item.id;
                      
                      if (isEditing) {
                        return (
                          <div key={item.id || index} className="p-3 bg-muted rounded space-y-2 relative">
                            <Input
                              value={equipmentForm.name}
                              onChange={(e) => handleEquipmentNameChange(e.target.value)}
                              placeholder="Item name"
                              className="mb-2"
                            />
                            {equipmentSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full bg-popover border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {equipmentSuggestions.map((suggestion, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                                  >
                                    <div className="font-medium">{suggestion.name}</div>
                                    <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                            <select
                              value={equipmentForm.type}
                              onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value as any })}
                              className="w-full px-3 py-2 bg-background border rounded"
                            >
                              <option value="weapon">Weapon</option>
                              <option value="armor">Armor</option>
                              <option value="shield">Shield</option>
                            </select>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={equipmentForm.damage}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, damage: e.target.value })}
                                placeholder="Damage"
                              />
                              <Input
                                type="number"
                                value={equipmentForm.dr}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, dr: e.target.value })}
                                placeholder="DR"
                              />
                            </div>
                            <Input
                              value={equipmentForm.description}
                              onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                              placeholder="Description"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEquipment(item.id)} className="flex-1">
                                <Check className="w-4 h-4 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingEquipmentId(null);
                                setEquipmentForm({ name: '', type: 'weapon', damage: '', dr: '', description: '' });
                              }} className="flex-1">
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={item.id || index} className="flex items-center justify-between p-3 bg-muted rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
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
                            {!isKhajiitClaws && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleEditEquipment(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteEquipment(item.id)}
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">No equipment equipped</p>
                )}
                
                {addingEquipment ? (
                  <div className="p-3 bg-muted rounded space-y-2 relative">
                    <Input
                      value={equipmentForm.name}
                      onChange={(e) => handleEquipmentNameChange(e.target.value)}
                      placeholder="Start typing item name..."
                      autoFocus
                    />
                    {equipmentSuggestions.length > 0 && (
                      <div className="absolute z-50 w-[calc(100%-1.5rem)] bg-popover border rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {equipmentSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                          >
                            <div className="font-medium">{suggestion.name}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    <select
                      value={equipmentForm.type}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-background border rounded"
                    >
                      <option value="weapon">Weapon</option>
                      <option value="armor">Armor</option>
                      <option value="shield">Shield</option>
                    </select>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={equipmentForm.damage}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, damage: e.target.value })}
                        placeholder="Damage"
                      />
                      <Input
                        type="number"
                        value={equipmentForm.dr}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, dr: e.target.value })}
                        placeholder="DR"
                      />
                    </div>
                    <Input
                      value={equipmentForm.description}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                      placeholder="Description (optional)"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddEquipment} className="flex-1">
                        <Check className="w-4 h-4 mr-1" /> Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setAddingEquipment(false);
                        setEquipmentForm({ name: '', type: 'weapon', damage: '', dr: '', description: '' });
                        setEquipmentSuggestions([]);
                      }} className="flex-1">
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setAddingEquipment(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Equipment
                  </Button>
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
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setGoldModal({ isOpen: true, type: 'remove' })}
                      className="h-8 w-8 p-0"
                      disabled={currentCharacter.inventory.gold <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold text-primary min-w-[4rem] text-center">
                      {currentCharacter.inventory.gold}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setGoldModal({ isOpen: true, type: 'add' })}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {currentCharacter.inventory.items.length > 0 && (
                  <div className="space-y-2">
                    {currentCharacter.inventory.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded gap-2">
                        <span className="text-sm flex-1">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAdjustItemQuantity(index, -1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAdjustItemQuantity(index, 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteItem(index)}
                            className="h-6 w-6 p-0 text-destructive ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {addingItem ? (
                  <div className="flex gap-2">
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Item name"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    />
                    <Button size="sm" onClick={handleAddItem}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setAddingItem(false);
                      setNewItemName('');
                    }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setAddingItem(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                )}
              </div>
            </Card>

            <SessionNotes character={currentCharacter} onUpdateNotes={handleUpdateNotes} />
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
        
        <GoldModal />
      </div>
    </div>
  );
}
