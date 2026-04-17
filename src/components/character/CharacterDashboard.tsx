import { useState, useEffect, useRef } from "react";
import { Character, Equipment, CustomAbility, Enchantment } from "@/types/character";
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
import { PlayerCombatPortal } from "@/components/combat/player/PlayerCombatPortal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ToastAction } from "@/components/ui/toast";
import { Heart, Zap, Sword, Shield, Settings, Plus, UserPlus, Play, RotateCcw, Package, Download, Minus, BookText, Edit2, Trash2, X, Check, ScrollText, Sparkles, AlertTriangle, LogOut } from "lucide-react";
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

// AP Display component with editable Total AP
interface APDisplayProps {
  totalAp: number;
  availableAp: number;
  onEditTotalAP: (newTotal: number) => void;
  onGrantAP: () => void;
}

function APDisplay({ totalAp, availableAp, onEditTotalAP, onGrantAP }: APDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(totalAp.toString());

  const handleSave = () => {
    const parsed = parseInt(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onEditTotalAP(parsed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(totalAp.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Total AP:</span>
          <Input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
            className="w-16 h-8 text-center px-1"
          />
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditValue(totalAp.toString()); setIsEditing(false); }} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Badge 
          variant="outline" 
          className="text-lg px-3 py-1 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => { setEditValue(totalAp.toString()); setIsEditing(true); }}
          title="Click to edit Total AP"
        >
          Total AP: {totalAp}
          <Edit2 className="w-3 h-3 ml-1 opacity-50" />
        </Badge>
      )}
      <Badge variant="secondary" className="text-lg px-3 py-1">
        Available: {availableAp}
      </Badge>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onGrantAP}
        className="h-8 w-8 p-0"
        title="Grant AP"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

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

// ── Custom Ability Manager ──────────────────────────────────────────────────

interface CustomAbilityManagerProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

function CustomAbilityManager({ character, onUpdateCharacter }: CustomAbilityManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<{
    name: string; slotType: 'major' | 'minor'; fpCost: string; hpCost: string; description: string;
  }>({ name: '', slotType: 'major', fpCost: '', hpCost: '', description: '' });

  const abilities = character.customAbilities ?? [];

  const resetForm = () => setForm({ name: '', slotType: 'major', fpCost: '', hpCost: '', description: '' });

  const handleSave = () => {
    if (!form.name.trim()) return;
    const newAbility: CustomAbility = {
      id: `${Date.now()}`,
      name: form.name.trim(),
      slotType: form.slotType,
      ...(form.fpCost && { fpCost: Math.max(0, parseInt(form.fpCost)) }),
      ...(form.hpCost && { hpCost: Math.max(0, parseInt(form.hpCost)) }),
      ...(form.description.trim() && { description: form.description.trim() }),
    };
    onUpdateCharacter({ ...character, customAbilities: [...abilities, newAbility] });
    resetForm();
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onUpdateCharacter({ ...character, customAbilities: abilities.filter(a => a.id !== id) });
  };

  return (
    <Card className="p-4 bg-card-secondary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-cinzel font-semibold text-primary flex items-center gap-2">
          <Zap className="w-4 h-4" /> Custom Abilities
        </h3>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        )}
      </div>

      {/* Existing abilities list */}
      {abilities.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground italic">No custom abilities saved. Add one to have it appear in the Combat Portal.</p>
      )}
      <div className="space-y-2 mb-3">
        {abilities.map(ability => (
          <div key={ability.id} className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 bg-muted/20">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{ability.name}</span>
                <Badge variant="outline" className={`text-xs ${ability.slotType === 'major' ? 'text-amber-400 border-amber-400/50' : 'text-blue-400 border-blue-400/50'}`}>
                  {ability.slotType === 'major' ? 'Major' : 'Minor'}
                </Badge>
                {ability.fpCost != null && ability.fpCost > 0 && (
                  <Badge variant="secondary" className="text-xs">{ability.fpCost} FP</Badge>
                )}
                {ability.hpCost != null && ability.hpCost > 0 && (
                  <Badge variant="destructive" className="text-xs">{ability.hpCost} HP</Badge>
                )}
              </div>
              {ability.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ability.description}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(ability.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Inline add form */}
      {isAdding && (
        <div className="border border-border rounded-md p-3 space-y-3 bg-muted/10">
          <Input
            placeholder="Ability name (required)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          {/* Slot type toggle */}
          <div className="flex gap-2">
            <Button size="sm" variant={form.slotType === 'major' ? 'default' : 'outline'}
              onClick={() => setForm(f => ({ ...f, slotType: 'major' }))} className="flex-1 text-xs h-8">
              Major Action
            </Button>
            <Button size="sm" variant={form.slotType === 'minor' ? 'default' : 'outline'}
              onClick={() => setForm(f => ({ ...f, slotType: 'minor' }))} className="flex-1 text-xs h-8">
              Minor Action
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">FP Cost (optional)</label>
              <Input type="number" min={0} placeholder="0" value={form.fpCost}
                onChange={e => setForm(f => ({ ...f, fpCost: e.target.value }))} className="h-8" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">HP Cost (optional)</label>
              <Input type="number" min={0} placeholder="0" value={form.hpCost}
                onChange={e => setForm(f => ({ ...f, hpCost: e.target.value }))} className="h-8" />
            </div>
          </div>
          <Input placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => { resetForm(); setIsAdding(false); }}>
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim()}>
              <Check className="w-3 h-3 mr-1" /> Save
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

interface CharacterDashboardProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  onCreateNewCharacter: () => void;
  onEndSession: () => void;
}

export function CharacterDashboard({ character, onUpdateCharacter, onCreateNewCharacter, onEndSession }: CharacterDashboardProps) {
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
  const EMPTY_EQUIP_FORM = { name: '', type: 'weapon' as 'weapon' | 'armor' | 'shield', damage: '', dr: '', description: '', enchantName: '', enchantDescription: '', enchantMaxCharges: '', enchantChargeCost: '1', enchantActionSlot: 'bonus' as 'bonus' | 'free' };
  const [equipmentForm, setEquipmentForm] = useState(EMPTY_EQUIP_FORM);
  const [equipmentSuggestions, setEquipmentSuggestions] = useState<typeof officialEquipment>([]);
  
  // Item management state
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Exit warning dialog state
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Session export tracking
  const [hasExportedThisSession, setHasExportedThisSession] = useState(false);
  const [showEndSession, setShowEndSession] = useState(false);
  const apBeforeAdvancement = useRef(0);

  const { toast } = useToast();

  // Last-resort safety net: browser's generic "Leave site?" dialog.
  // The End Session button + milestone toasts are the primary save workflow.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

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
        // Stamp baseDr the first time DR is reduced so we remember the original value.
        // If baseDr is already set, use it. If unknown and we're increasing, leave it
        // undefined (no upper clamp) — handles legacy saves where DR was already 0.
        const baseDr = item.baseDr ?? (amount < 0 ? item.dr : undefined);
        const newDr = item.dr + amount;

        // Clamp: never below 0; never above baseDr if baseDr is known
        const constrainedDr = baseDr !== undefined
          ? Math.max(0, Math.min(baseDr, newDr))
          : Math.max(0, newDr);

        return {
          ...item,
          dr: constrainedDr,
          ...(baseDr !== undefined && { baseDr }),
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
    if (type === 'long') {
      showExportReminder('End of Adventure?', 'Long rests are a great time to export your character.');
    }
  };

  const handleGrantAP = (amount: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      ap: Math.max(0, currentCharacter.ap + amount),
      totalAp: Math.max(0, (currentCharacter.totalAp ?? currentCharacter.ap) + amount)
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
    if (amount > 0) {
      showExportReminder('AP Gained!', 'Save your progress before you go.');
    }
  };

  const handleEditTotalAP = (newTotal: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      totalAp: Math.max(0, newTotal)
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
    const totalAp = currentCharacter.totalAp ?? currentCharacter.ap;
    
    // Add Khajiit claws if character is Khajiit
    if (currentCharacter.race.id === "khajiit") {
      const clawDamage = getKhajiitClawDamage(totalAp);
      equipment.push({
        id: "khajiit-claws",
        name: "Khajiit Claws",
        type: "weapon",
        damage: clawDamage,
        description: `Natural weapons that scale with character tier. Current tier: ${getCharacterTier(totalAp)}`
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

    const maxCh = parseInt(equipmentForm.enchantMaxCharges) || 1;
    const newEquipment: Equipment = {
      id: `custom-${Date.now()}`,
      name: equipmentForm.name,
      type: equipmentForm.type,
      ...(equipmentForm.damage && { damage: parseInt(equipmentForm.damage) }),
      ...(equipmentForm.dr && { dr: parseInt(equipmentForm.dr), baseDr: parseInt(equipmentForm.dr) }),
      ...(equipmentForm.description && { description: equipmentForm.description }),
      ...(equipmentForm.enchantName && {
        enchantment: {
          name: equipmentForm.enchantName,
          description: equipmentForm.enchantDescription,
          charges: maxCh,
          maxCharges: maxCh,
          chargeCost: parseInt(equipmentForm.enchantChargeCost) || 1,
          actionSlot: equipmentForm.enchantActionSlot,
        }
      }),
    };

    const updatedCharacter = {
      ...currentCharacter,
      equipment: [...currentCharacter.equipment, newEquipment]
    };

    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
    setAddingEquipment(false);
    setEquipmentForm(EMPTY_EQUIP_FORM);
    setEquipmentSuggestions([]);
  };
  
  const handleEditEquipment = (item: Equipment) => {
    setEditingEquipmentId(item.id);
    setEquipmentForm({
      name: item.name,
      type: item.type,
      damage: item.damage?.toString() || '',
      dr: item.dr?.toString() || '',
      description: item.description || '',
      enchantName: item.enchantment?.name || '',
      enchantDescription: item.enchantment?.description || '',
      enchantMaxCharges: item.enchantment?.maxCharges?.toString() || '',
      enchantChargeCost: item.enchantment?.chargeCost?.toString() || '1',
      enchantActionSlot: item.enchantment?.actionSlot || 'bonus',
    });
  };
  
  const handleSaveEquipment = (itemId: string) => {
    const enchantment: Enchantment | undefined = equipmentForm.enchantName
      ? {
          name: equipmentForm.enchantName,
          description: equipmentForm.enchantDescription,
          maxCharges: parseInt(equipmentForm.enchantMaxCharges) || 1,
          charges: (() => {
            // preserve current charges if max didn't change; otherwise reset to new max
            const existing = currentCharacter.equipment.find(e => e.id === itemId)?.enchantment;
            const newMax = parseInt(equipmentForm.enchantMaxCharges) || 1;
            if (existing && existing.maxCharges === newMax) return existing.charges;
            return newMax;
          })(),
          chargeCost: parseInt(equipmentForm.enchantChargeCost) || 1,
          actionSlot: equipmentForm.enchantActionSlot,
        }
      : undefined;

    const updatedEquipment = currentCharacter.equipment.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          name: equipmentForm.name,
          type: equipmentForm.type,
          ...(equipmentForm.damage && { damage: parseInt(equipmentForm.damage) }),
          ...(equipmentForm.dr && { dr: parseInt(equipmentForm.dr), baseDr: item.baseDr ?? parseInt(equipmentForm.dr) }),
          ...(equipmentForm.description && { description: equipmentForm.description }),
          enchantment,
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
    setEquipmentForm(EMPTY_EQUIP_FORM);
  };
  
  const handleDeleteEquipment = (itemId: string) => {
    const updatedCharacter = {
      ...currentCharacter,
      equipment: currentCharacter.equipment.filter(item => item.id !== itemId)
    };

    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleEnchantmentChargeAdjust = (equipmentId: string, amount: number) => {
    const updatedEquipment = currentCharacter.equipment.map(item => {
      if (item.id === equipmentId && item.enchantment) {
        const newCharges = Math.max(0, Math.min(item.enchantment.maxCharges, item.enchantment.charges + amount));
        return { ...item, enchantment: { ...item.enchantment, charges: newCharges } };
      }
      return item;
    });
    const updatedCharacter = { ...currentCharacter, equipment: updatedEquipment };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleEnchantmentRecharge = (equipmentId: string) => {
    const updatedEquipment = currentCharacter.equipment.map(item => {
      if (item.id === equipmentId && item.enchantment) {
        return { ...item, enchantment: { ...item.enchantment, charges: item.enchantment.maxCharges } };
      }
      return item;
    });
    const updatedCharacter = { ...currentCharacter, equipment: updatedEquipment };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
    toast({ title: 'Recharged', description: 'Enchantment charges restored.' });
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
      
      setHasExportedThisSession(true);
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

  // Non-blocking export reminder toast — only fires if not yet exported this session
  const showExportReminder = (title: string, description: string) => {
    if (hasExportedThisSession) return;
    toast({
      title,
      description,
      action: (
        <ToastAction altText="Export Now" onClick={handleExportCharacter}>
          Export Now
        </ToastAction>
      ),
    });
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
                {getCharacterTier(currentCharacter.totalAp ?? currentCharacter.ap)} Tier
              </Badge>
            </div>
            <APDisplay
              totalAp={currentCharacter.totalAp ?? currentCharacter.ap}
              availableAp={currentCharacter.ap}
              onEditTotalAP={handleEditTotalAP}
              onGrantAP={() => setShowGrantAP(true)}
            />
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button onClick={() => setShowExitWarning(true)} variant="secondary">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Character
              </Button>
              <Button onClick={() => {
                apBeforeAdvancement.current = currentCharacter.ap;
                setShowAdvancement(true);
              }} variant="default">
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
              <Badge
                variant="outline"
                className={hasExportedThisSession
                  ? 'text-green-400 border-green-400/50 cursor-default'
                  : 'text-amber-400 border-amber-400/50 animate-pulse cursor-default'}
              >
                {hasExportedThisSession ? '✓ Exported' : '⚠ Not Exported'}
              </Badge>
              <Button
                onClick={() => setShowEndSession(true)}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                End Session
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
                            {/* Enchantment section */}
                            <div className="border-t pt-2 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-purple-400" /> Enchantment (optional)
                              </p>
                              <Input
                                value={equipmentForm.enchantName}
                                onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantName: e.target.value })}
                                placeholder="Enchantment name (leave blank for none)"
                              />
                              {equipmentForm.enchantName && (
                                <>
                                  <Input
                                    value={equipmentForm.enchantDescription}
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantDescription: e.target.value })}
                                    placeholder="Effect description"
                                  />
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={equipmentForm.enchantMaxCharges}
                                      onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantMaxCharges: e.target.value })}
                                      placeholder="Max charges"
                                    />
                                    <Input
                                      type="number"
                                      min="1"
                                      value={equipmentForm.enchantChargeCost}
                                      onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantChargeCost: e.target.value })}
                                      placeholder="Cost/use"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEquipmentForm({ ...equipmentForm, enchantActionSlot: 'bonus' })}
                                      className={`flex-1 text-xs py-1 rounded border transition-colors ${equipmentForm.enchantActionSlot === 'bonus' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                                    >
                                      Bonus Action
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEquipmentForm({ ...equipmentForm, enchantActionSlot: 'free' })}
                                      className={`flex-1 text-xs py-1 rounded border transition-colors ${equipmentForm.enchantActionSlot === 'free' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                                    >
                                      Free Action
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveEquipment(item.id)} className="flex-1">
                                <Check className="w-4 h-4 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingEquipmentId(null);
                                setEquipmentForm(EMPTY_EQUIP_FORM);
                              }} className="flex-1">
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={item.id || index} className="p-3 bg-muted rounded">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
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
                                      disabled={item.baseDr !== undefined && item.dr >= item.baseDr}
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
                          {/* Enchantment display row */}
                          {item.enchantment && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {item.enchantment.name}
                                    <Badge variant="outline" className="ml-1 text-[10px] py-0 h-4 border-purple-400/50 text-purple-400">
                                      {item.enchantment.actionSlot === 'bonus' ? 'Bonus' : 'Free'}
                                    </Badge>
                                  </p>
                                  {item.enchantment.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.enchantment.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEnchantmentChargeAdjust(item.id, -item.enchantment!.chargeCost)}
                                    className="h-6 w-6 p-0"
                                    disabled={item.enchantment.charges <= 0}
                                    title={`Use (costs ${item.enchantment.chargeCost} charge${item.enchantment.chargeCost !== 1 ? 's' : ''})`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="text-xs font-mono min-w-[2.5rem] text-center tabular-nums">
                                    {item.enchantment.charges}/{item.enchantment.maxCharges}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEnchantmentChargeAdjust(item.id, 1)}
                                    className="h-6 w-6 p-0"
                                    disabled={item.enchantment.charges >= item.enchantment.maxCharges}
                                    title="Add 1 charge"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEnchantmentRecharge(item.id)}
                                    className="h-6 px-2 text-xs text-purple-400 border-purple-400/50"
                                    disabled={item.enchantment.charges >= item.enchantment.maxCharges}
                                    title="Recharge (soul gem)"
                                  >
                                    ↺ Full
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
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
                    {/* Enchantment section */}
                    <div className="border-t pt-2 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" /> Enchantment (optional)
                      </p>
                      <Input
                        value={equipmentForm.enchantName}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantName: e.target.value })}
                        placeholder="Enchantment name (leave blank for none)"
                      />
                      {equipmentForm.enchantName && (
                        <>
                          <Input
                            value={equipmentForm.enchantDescription}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantDescription: e.target.value })}
                            placeholder="Effect description"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={equipmentForm.enchantMaxCharges}
                              onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantMaxCharges: e.target.value })}
                              placeholder="Max charges"
                            />
                            <Input
                              type="number"
                              min="1"
                              value={equipmentForm.enchantChargeCost}
                              onChange={(e) => setEquipmentForm({ ...equipmentForm, enchantChargeCost: e.target.value })}
                              placeholder="Cost/use"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEquipmentForm({ ...equipmentForm, enchantActionSlot: 'major' })}
                              className={`flex-1 text-xs py-1 rounded border transition-colors ${equipmentForm.enchantActionSlot === 'major' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                            >
                              Major Action
                            </button>
                            <button
                              type="button"
                              onClick={() => setEquipmentForm({ ...equipmentForm, enchantActionSlot: 'minor' })}
                              className={`flex-1 text-xs py-1 rounded border transition-colors ${equipmentForm.enchantActionSlot === 'minor' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'}`}
                            >
                              Minor Action
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddEquipment} className="flex-1">
                        <Check className="w-4 h-4 mr-1" /> Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setAddingEquipment(false);
                        setEquipmentForm(EMPTY_EQUIP_FORM);
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

            <CustomAbilityManager character={currentCharacter} onUpdateCharacter={handleUpdateCharacter} />

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
          onClose={() => {
            setShowAdvancement(false);
            if (currentCharacter.ap < apBeforeAdvancement.current) {
              showExportReminder('Character Advanced!', 'Export to keep your progression safe.');
            }
          }}
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

        {/* Exit / new-character warning dialog */}
        <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-primary flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Export Before You Leave?
              </DialogTitle>
              <DialogDescription className="pt-2 space-y-2 text-sm text-muted-foreground">
                <span className="block">
                  Local browser storage can be wiped by browser updates, clearing cookies, using a private/incognito window, or switching devices.
                </span>
                <span className="block font-medium text-foreground">
                  Exporting saves a <code className="text-xs bg-muted px-1 py-0.5 rounded">.json</code> file you can reload at any time — it's the only safe backup.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  handleExportCharacter();
                  setShowExitWarning(false);
                  onCreateNewCharacter();
                }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Character &amp; Continue
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleExportCharacter();
                  setShowExitWarning(false);
                }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Only (Stay Here)
              </Button>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="ghost"
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExitWarning(false);
                    onCreateNewCharacter();
                  }}
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Leave Without Exporting
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* End Session dialog */}
        <Dialog open={showEndSession} onOpenChange={setShowEndSession}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-primary flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                End Session
              </DialogTitle>
              <DialogDescription className="pt-2 space-y-2 text-sm text-muted-foreground">
                <span className="block">
                  Export your character before leaving — local storage can be cleared at any time.
                </span>
                <span className="block font-medium text-foreground">
                  A <code className="text-xs bg-muted px-1 py-0.5 rounded">.json</code> file is the only safe backup.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => { handleExportCharacter(); setShowEndSession(false); onEndSession(); }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export &amp; End Session
              </Button>
              <Button
                variant="outline"
                onClick={() => { handleExportCharacter(); setShowEndSession(false); }}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Only (Stay Here)
              </Button>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="ghost"
                  onClick={() => setShowEndSession(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowEndSession(false); onEndSession(); }}
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  End Without Exporting
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {currentCharacter.combatMode && (
          <PlayerCombatPortal
            character={currentCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onClose={() => handleCombatModeToggle(false)}
            onMinimize={() => { /* Logic to minimize can go here later */ }}
          />
        )}
        {/* --------------------------- */}

      </div>
    </div>
  );
}
