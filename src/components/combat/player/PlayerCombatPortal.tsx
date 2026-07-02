// Player Combat Portal - Full screen combat action manager
import { useState } from "react";
import { Character } from "@/types/character";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  AlertCircle,
  Wand2,
  FlaskConical,
  ChevronDown
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
import { calculateTotalDR, updateCharacterResources } from "@/utils/characterCalculations";
import { useToast } from "@/hooks/use-toast";

interface ActionSlot {
  id: string;
  type: 'major' | 'minor' | 'bonus' | 'free';
  label: string;
  used: boolean;
  actionTaken?: string;
  fpSpent?: number;
  hpSpent?: number;
  sourceAbility?: BonusActionAbility;
  sourceEquipmentId?: string;  // enchantment slots
}

// Compact action card used inside the Command Center columns
interface ActionCardProps {
  action: MajorActionOption;
  slotId: string;
  fpCurrent: number;
  usedAbilityIds?: string[];
  onUse: (slotId: string, action: MajorActionOption) => void;
}

function ActionCard({ action, slotId, fpCurrent, usedAbilityIds, onUse }: ActionCardProps) {
  const fpCost = action.fpCost ?? 0;
  const canAfford = fpCost <= fpCurrent;
  const isUsed = !!(action.limitation && usedAbilityIds?.includes(action.id));
  const isDisabled = !canAfford || isUsed;

  return (
    <Card
      className={cn(
        "p-2.5 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/30",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isDisabled && onUse(slotId, action)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm leading-tight block truncate">
            {action.name}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {action.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {fpCost > 0 && (
            <Badge variant={canAfford ? "default" : "destructive"} className="text-xs whitespace-nowrap">
              {fpCost} FP
            </Badge>
          )}
          {action.damage != null && (
            <Badge variant="outline" className="text-xs whitespace-nowrap text-red-400 border-red-400/50">
              {action.damage} dmg
            </Badge>
          )}
          {isUsed && (
            <Badge variant="outline" className="text-xs whitespace-nowrap text-muted-foreground">
              Used
            </Badge>
          )}
          {!canAfford && !isUsed && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
        </div>
      </div>
    </Card>
  );
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
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());

  const toggleSchool = (school: string) => {
    setOpenSchools(prev => {
      const next = new Set(prev);
      if (next.has(school)) next.delete(school);
      else next.add(school);
      return next;
    });
  };

  // Improvise — sandbox override console
  const EMPTY_DELTAS = { hpCurrent: 0, fpCurrent: 0, hpMax: 0, fpMax: 0, might: 0, agility: 0, magic: 0, guile: 0, ap: 0, totalAp: 0, dr: 0 };
  const [showImprovise, setShowImprovise] = useState(false);
  const [improvName, setImprovName] = useState('');
  const [improvNotes, setImprovNotes] = useState('');
  const [deltas, setDeltas] = useState(EMPTY_DELTAS);
  const setDelta = (key: keyof typeof EMPTY_DELTAS, raw: string) => {
    const v = raw === '' || raw === '-' ? 0 : parseInt(raw) || 0;
    setDeltas(prev => ({ ...prev, [key]: v }));
  };

  const resetImprovise = () => {
    setShowImprovise(false);
    setImprovName('');
    setImprovNotes('');
    setDeltas(EMPTY_DELTAS);
  };

  const handleExecuteImprovise = (slotId: string) => {
    if (!improvName.trim()) {
      toast({ title: "Name required", description: "Give your action a name.", variant: "destructive" });
      return;
    }

    const { hpCurrent, fpCurrent, hpMax, fpMax, might, agility, magic, guile, ap, totalAp, dr } = deltas;
    const anyChange = Object.values(deltas).some(v => v !== 0);

    let updated = { ...character };

    // HP / FP current — clamped to [0, max]
    if (hpCurrent !== 0) updated = { ...updated, resources: { ...updated.resources, hp: { ...updated.resources.hp, current: Math.max(0, Math.min(updated.resources.hp.max, updated.resources.hp.current + hpCurrent)) } } };
    if (fpCurrent !== 0) updated = { ...updated, resources: { ...updated.resources, fp: { ...updated.resources.fp, current: Math.max(0, Math.min(updated.resources.fp.max, updated.resources.fp.current + fpCurrent)) } } };

    // HP / FP max — via resourceTraining, then recalculate
    if (hpMax !== 0 || fpMax !== 0) {
      updated = { ...updated, progression: { ...updated.progression, resourceTraining: { hp: (updated.progression.resourceTraining?.hp ?? 0) + hpMax, fp: (updated.progression.resourceTraining?.fp ?? 0) + fpMax } } };
      updated = updateCharacterResources(updated);
    }

    // Attributes — floor at 1, then recalculate HP/FP max since stats feed into them
    if (might !== 0 || agility !== 0 || magic !== 0 || guile !== 0) {
      updated = { ...updated, stats: { might: Math.max(1, updated.stats.might + might), agility: Math.max(1, updated.stats.agility + agility), magic: Math.max(1, updated.stats.magic + magic), guile: Math.max(1, updated.stats.guile + guile) } };
      updated = updateCharacterResources(updated);
    }

    // Progression AP — both fields independent, floor at 0
    if (ap !== 0) updated = { ...updated, ap: Math.max(0, updated.ap + ap) };
    if (totalAp !== 0) updated = { ...updated, totalAp: Math.max(0, (updated.totalAp ?? updated.ap) + totalAp) };

    // DR — adjusts the portal-local sunderModifier (positive = buff DR, negative = debuff)
    if (dr !== 0) setSunderModifier(prev => Math.max(0, prev - dr));

    if (anyChange) onUpdateCharacter(updated);

    // Mark action slot
    const label = improvNotes.trim() ? `${improvName.trim()} — ${improvNotes.trim()}` : improvName.trim();
    setActionSlots(prev => prev.map(s => s.id === slotId ? { ...s, used: true, actionTaken: label } : s));

    // Toast: summarise every non-zero delta
    const changes: string[] = [];
    if (hpCurrent !== 0) changes.push(`HP ${hpCurrent > 0 ? '+' : ''}${hpCurrent}`);
    if (fpCurrent !== 0) changes.push(`FP ${fpCurrent > 0 ? '+' : ''}${fpCurrent}`);
    if (hpMax !== 0) changes.push(`Max HP ${hpMax > 0 ? '+' : ''}${hpMax}`);
    if (fpMax !== 0) changes.push(`Max FP ${fpMax > 0 ? '+' : ''}${fpMax}`);
    if (might !== 0) changes.push(`Might ${might > 0 ? '+' : ''}${might}`);
    if (agility !== 0) changes.push(`Agility ${agility > 0 ? '+' : ''}${agility}`);
    if (magic !== 0) changes.push(`Magic ${magic > 0 ? '+' : ''}${magic}`);
    if (guile !== 0) changes.push(`Guile ${guile > 0 ? '+' : ''}${guile}`);
    if (dr !== 0) changes.push(`DR ${dr > 0 ? '+' : ''}${dr}`);
    if (ap !== 0) changes.push(`AP ${ap > 0 ? '+' : ''}${ap}`);
    if (totalAp !== 0) changes.push(`Total AP ${totalAp > 0 ? '+' : ''}${totalAp}`);
    toast({ title: improvName.trim(), description: changes.length > 0 ? changes.join(' · ') : "Applied" });

    resetImprovise();
    setActiveSlot(null);
  };
  const [actionSlots, setActionSlots] = useState<ActionSlot[]>(() => initializeSlots());
  
  // Initialize action slots based on character abilities
  function initializeSlots(): ActionSlot[] {
    const slots: ActionSlot[] = [
      { id: 'major', type: 'major', label: 'MAJOR ACTION', used: false },
      { id: 'minor', type: 'minor', label: 'MINOR ACTION', used: false },
    ];

    // Add bonus action slots from character perks / standing stone
    // Pre-mark as used if the ability is already in character.usedAbilities (persisted from prior use)
    const bonusAbilities = getBonusActions(character);
    bonusAbilities.forEach((ability, index) => {
      const alreadyUsed = !!(ability.usedAbilityId && character.usedAbilities?.includes(ability.usedAbilityId));
      slots.push({
        id: `bonus-${index}`,
        type: 'bonus',
        label: `BONUS: ${ability.name}`,
        used: alreadyUsed,
        actionTaken: alreadyUsed ? ability.name : undefined,
        sourceAbility: ability,
      });
    });

    // Add a slot for each equipped enchanted item
    for (const item of character.equipment) {
      if (item.enchantment) {
        slots.push({
          id: `enchant-${item.id}`,
          type: item.enchantment.actionSlot,   // 'bonus' or 'free'
          label: `${item.enchantment.actionSlot === 'bonus' ? 'BONUS' : 'FREE'}: ${item.enchantment.name}`,
          used: false,
          sourceEquipmentId: item.id,
        });
      }
    }

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
  const baseDR = calculateTotalDR(character.equipment, character.standingStone);
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

    // Check HP cost (custom abilities only)
    const hpCost = 'hpCost' in action ? (action as MajorActionOption).hpCost || 0 : 0;
    if (hpCost >= character.resources.hp.current) {
      toast({
        title: "Insufficient HP",
        description: `${action.name} requires ${hpCost} HP but you only have ${character.resources.hp.current}.`,
        variant: "destructive",
      });
      return;
    }

    // Build a single merged character update so FP/HP deductions and usedAbilities
    // write all go out in one call — multiple separate onUpdateCharacter calls would
    // race against each other and the last one would overwrite the others.
    let updatedCharacter = { ...character };

    if (fpCost > 0) {
      const newFP = Math.max(0, character.resources.fp.current - fpCost);
      updatedCharacter = {
        ...updatedCharacter,
        resources: { ...updatedCharacter.resources, fp: { ...updatedCharacter.resources.fp, current: newFP } },
      };
    }
    if (hpCost > 0) {
      const newHP = Math.max(0, character.resources.hp.current - hpCost);
      updatedCharacter = {
        ...updatedCharacter,
        resources: { ...updatedCharacter.resources, hp: { ...updatedCharacter.resources.hp, current: newHP } },
      };
    }

    // Resolve usedAbilityId for limited abilities
    const limitation = 'limitation' in action ? action.limitation : undefined;
    if (limitation) {
      const usedAbilityId: string | undefined =
        ('usedAbilityId' in action && (action as { usedAbilityId?: string }).usedAbilityId)
          ? (action as { usedAbilityId?: string }).usedAbilityId
          : action.id.startsWith('custom-') ? action.id
          : undefined;
      if (usedAbilityId) {
        const prev = updatedCharacter.usedAbilities ?? [];
        if (!prev.includes(usedAbilityId)) {
          updatedCharacter = { ...updatedCharacter, usedAbilities: [...prev, usedAbilityId] };
        }
      }
    }

    onUpdateCharacter(updatedCharacter);

    // Mark slot as used in local state
    setActionSlots(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, used: true, actionTaken: action.name, fpSpent: fpCost, hpSpent: hpCost }
        : s
    ));

    setActiveSlot(null);

    const costParts = [];
    if (fpCost > 0) costParts.push(`${fpCost} FP`);
    if (hpCost > 0) costParts.push(`${hpCost} HP`);
    toast({
      title: action.name,
      description: costParts.length > 0 ? `Spent ${costParts.join(', ')}` : "Action used",
    });
  };
  
  // Use an enchantment (deducts charges, marks slot)
  const handleUseEnchantment = (slotId: string, equipmentId: string) => {
    const item = character.equipment.find(e => e.id === equipmentId);
    if (!item?.enchantment) return;
    const enc = item.enchantment;

    if (enc.charges < enc.chargeCost) {
      toast({
        title: "No Charges",
        description: `${enc.name} has no charges remaining. Recharge with a soul gem.`,
        variant: "destructive",
      });
      return;
    }

    // Deduct charges + persist — single onUpdateCharacter call
    const newCharges = Math.max(0, enc.charges - enc.chargeCost);
    const updatedEquipment = character.equipment.map(e =>
      e.id === equipmentId
        ? { ...e, enchantment: { ...e.enchantment!, charges: newCharges } }
        : e
    );
    onUpdateCharacter({ ...character, equipment: updatedEquipment });

    setActionSlots(prev => prev.map(s =>
      s.id === slotId
        ? { ...s, used: true, actionTaken: `${enc.name} (${item.name})` }
        : s
    ));
    setActiveSlot(null);

    toast({
      title: enc.name,
      description: `${item.name} — ${newCharges}/${enc.maxCharges} charges remaining.`,
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
  
  // Build the four column datasets for the Command Center major action Dialog
  function buildMajorActionColumns(actions: MajorActionOption[]) {
    // Column 1 — Weapons: attack actions grouped by weapon name
    const weaponMap = new Map<string, MajorActionOption[]>();
    for (const a of actions) {
      if (a.type === 'attack' && a.source !== 'Racial') {
        const key = a.source ?? 'Unknown';
        if (!weaponMap.has(key)) weaponMap.set(key, []);
        weaponMap.get(key)!.push(a);
      }
    }
    // Standard attack before power attack within each group
    for (const attacks of weaponMap.values()) {
      attacks.sort((a) => (a.id.startsWith('power-attack-') ? 1 : -1));
    }
    const weaponColumns = Array.from(weaponMap.entries()).map(
      ([weaponName, attacks]) => ({ weaponName, attacks })
    );

    // Column 2 — Tactics: standard + ability actions, plus Khajiit Claws if applicable
    const tacticActions = actions.filter(
      a => a.type === 'standard' || a.type === 'ability'
    );
    const khajiitClaws = actions.find(a => a.id === 'attack-claws');
    if (khajiitClaws) tacticActions.push(khajiitClaws);

    // Column 3 — Magic: spell actions grouped by school
    const spellMap = new Map<string, MajorActionOption[]>();
    for (const a of actions) {
      if (a.type === 'spell') {
        const key = a.source ?? 'Unknown';
        if (!spellMap.has(key)) spellMap.set(key, []);
        spellMap.get(key)!.push(a);
      }
    }
    // Insertion order from getKnownSpells already gives Novice-first — no extra sort needed
    const magicColumns = Array.from(spellMap.entries()).map(
      ([school, spells]) => ({ school, spells })
    );

    // Column 4 — Items: potions and poisons from inventory
    const itemActions: MajorActionOption[] = character.inventory.items
      .filter(item => {
        const lc = (item.name ?? '').toLowerCase();
        return (lc.includes('potion') || lc.includes('poison')) && item.quantity > 0;
      })
      .map(item => {
        const lc = (item.name ?? '').toLowerCase();
        const isPoison = lc.includes('poison');
        const safeName = item.name ?? 'Unknown Item';
        return {
          id: `item-${safeName.toLowerCase().replace(/\s+/g, '-')}`,
          name: safeName,
          type: 'standard' as const,
          description: isPoison
            ? `Apply to your weapon. Qty: ${item.quantity}`
            : `Consume to restore resources. Qty: ${item.quantity}`,
          source: isPoison ? 'Poison' : 'Potion',
        };
      });

    return { weaponColumns, tacticActions, magicColumns, itemActions };
  }

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
            
            {actionSlots.map((slot) => {
              // Shared slot card interior
              const slotCardInterior = (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {slot.type === 'major' && <Swords className="h-5 w-5 text-amber-500" />}
                    {slot.type === 'minor' && <Footprints className="h-5 w-5 text-blue-500" />}
                    {slot.type === 'bonus' && <Sparkles className="h-5 w-5 text-purple-500" />}
                    {slot.type === 'free' && <Check className="h-5 w-5 text-green-500" />}
                    <div>
                      <div className="font-semibold tracking-wide">{slot.label}</div>
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
              );

              // MAJOR ACTION — Command Center Dialog (4-column layout)
              if (slot.type === 'major') {
                const { weaponColumns, tacticActions, magicColumns, itemActions } =
                  buildMajorActionColumns(getValidMajorActions(character));

                return (
                  <div key={slot.id}>
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:border-primary/50",
                        slot.used && "opacity-60 bg-muted/50",
                        "border-l-4 border-l-amber-500"
                      )}
                      onClick={() => !slot.used && setActiveSlot(slot.id)}
                    >
                      {slotCardInterior}
                    </Card>

                    <Dialog
                      open={activeSlot === slot.id}
                      onOpenChange={(open) => { setActiveSlot(open ? slot.id : null); if (!open) resetImprovise(); }}
                    >
                      <DialogContent className="max-w-5xl w-full max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                          <DialogTitle className="font-cinzel text-xl tracking-wider flex items-center gap-2">
                            <Swords className="h-5 w-5 text-amber-500" />
                            Choose Major Action
                          </DialogTitle>
                        </DialogHeader>

                        {/* Improvise — full sandbox override console */}
                        {showImprovise && (
                          <div className="flex-1 overflow-auto p-5">
                            <div className="max-w-2xl mx-auto space-y-4">

                              {/* Name + Notes */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-amber-400">Action Name <span className="text-destructive">*</span></label>
                                  <Input placeholder="e.g. Desperate Nova" value={improvName} onChange={e => setImprovName(e.target.value)} autoFocus />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Narrative Notes (optional)</label>
                                  <Input placeholder="e.g. Burning everything to clear the room" value={improvNotes} onChange={e => setImprovNotes(e.target.value)} />
                                </div>
                              </div>

                              {/* Helper text */}
                              <p className="text-xs text-muted-foreground">Enter a positive or negative number in any field to change that stat. Leave at 0 to skip. All changes apply simultaneously when you Execute.</p>

                              {/* Delta grid — header */}
                              <div className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-x-3 gap-y-0 items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1">
                                <span>Stat</span>
                                <span className="text-center">Current</span>
                                <span className="text-center">Change</span>
                                <span className="text-center">→ New</span>
                              </div>

                              {/* RESOURCES */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1.5">Resources</p>
                                <div className="space-y-1.5">
                                  {[
                                    { key: 'hpCurrent' as const, label: '❤️ HP (current)', cur: `${character.resources.hp.current}`, newVal: Math.max(0, Math.min(character.resources.hp.max + deltas.hpMax, character.resources.hp.current + deltas.hpCurrent)) },
                                    { key: 'hpMax'     as const, label: '❤️ Max HP',       cur: `${character.resources.hp.max}`,     newVal: Math.max(1, character.resources.hp.max + deltas.hpMax) },
                                    { key: 'fpCurrent' as const, label: '⚡ FP (current)', cur: `${character.resources.fp.current}`, newVal: Math.max(0, Math.min(character.resources.fp.max + deltas.fpMax, character.resources.fp.current + deltas.fpCurrent)) },
                                    { key: 'fpMax'     as const, label: '⚡ Max FP',       cur: `${character.resources.fp.max}`,     newVal: Math.max(1, character.resources.fp.max + deltas.fpMax) },
                                  ].map(row => (
                                    <div key={row.key} className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-x-3 items-center">
                                      <span className="text-sm">{row.label}</span>
                                      <span className="text-center text-sm text-muted-foreground tabular-nums">{row.cur}</span>
                                      <Input type="number" value={deltas[row.key] || ''} placeholder="0" onChange={e => setDelta(row.key, e.target.value)} className="h-7 text-center px-1 text-sm" />
                                      <span className={cn("text-center text-sm font-semibold tabular-nums", deltas[row.key] > 0 ? "text-green-400" : deltas[row.key] < 0 ? "text-red-400" : "text-muted-foreground")}>{row.newVal}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* ATTRIBUTES */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1.5">Attributes</p>
                                <div className="space-y-1.5">
                                  {([
                                    { key: 'might'   as const, label: '⚔️ Might',   cur: character.stats.might },
                                    { key: 'agility' as const, label: '🏃 Agility', cur: character.stats.agility },
                                    { key: 'magic'   as const, label: '✨ Magic',   cur: character.stats.magic },
                                    { key: 'guile'   as const, label: '🗣️ Guile',   cur: character.stats.guile },
                                  ]).map(row => (
                                    <div key={row.key} className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-x-3 items-center">
                                      <span className="text-sm">{row.label}</span>
                                      <span className="text-center text-sm text-muted-foreground tabular-nums">{row.cur}</span>
                                      <Input type="number" value={deltas[row.key] || ''} placeholder="0" onChange={e => setDelta(row.key, e.target.value)} className="h-7 text-center px-1 text-sm" />
                                      <span className={cn("text-center text-sm font-semibold tabular-nums", deltas[row.key] > 0 ? "text-green-400" : deltas[row.key] < 0 ? "text-red-400" : "text-muted-foreground")}>{Math.max(1, row.cur + deltas[row.key])}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* COMBAT */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Combat</p>
                                <div className="space-y-1.5">
                                  <div className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-x-3 items-center">
                                    <span className="text-sm">🛡️ DR <span className="text-xs text-muted-foreground">(session only)</span></span>
                                    <span className="text-center text-sm text-muted-foreground tabular-nums">{effectiveDR}</span>
                                    <Input type="number" value={deltas.dr || ''} placeholder="0" onChange={e => setDelta('dr', e.target.value)} className="h-7 text-center px-1 text-sm" />
                                    <span className={cn("text-center text-sm font-semibold tabular-nums", deltas.dr > 0 ? "text-green-400" : deltas.dr < 0 ? "text-red-400" : "text-muted-foreground")}>{Math.max(0, effectiveDR + deltas.dr)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* PROGRESSION */}
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1.5">Progression</p>
                                <div className="space-y-1.5">
                                  {([
                                    { key: 'ap'      as const, label: '📈 Available AP', cur: character.ap },
                                    { key: 'totalAp' as const, label: '📈 Total (Earned) AP', cur: character.totalAp ?? character.ap },
                                  ]).map(row => (
                                    <div key={row.key} className="grid grid-cols-[1fr_5rem_5rem_5rem] gap-x-3 items-center">
                                      <span className="text-sm">{row.label}</span>
                                      <span className="text-center text-sm text-muted-foreground tabular-nums">{row.cur}</span>
                                      <Input type="number" value={deltas[row.key] || ''} placeholder="0" onChange={e => setDelta(row.key, e.target.value)} className="h-7 text-center px-1 text-sm" />
                                      <span className={cn("text-center text-sm font-semibold tabular-nums", deltas[row.key] > 0 ? "text-green-400" : deltas[row.key] < 0 ? "text-red-400" : "text-muted-foreground")}>{Math.max(0, row.cur + deltas[row.key])}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          </div>
                        )}

                        {/* 4-column grid — hidden while Improvise form is shown */}
                        <div className={cn("flex-1 overflow-hidden grid grid-cols-4 divide-x divide-border", showImprovise && "hidden")}>
                          {/* Column 1 — Weapons */}
                          <div className="flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-muted/30 border-b border-border flex-shrink-0 flex items-center gap-2">
                              <Swords className="h-4 w-4 text-amber-500" />
                              <span className="font-semibold text-sm tracking-wide text-amber-500 uppercase">Weapons</span>
                            </div>
                            <ScrollArea className="flex-1 px-3 py-2">
                              {weaponColumns.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic py-4 text-center">Nothing available</p>
                              ) : (
                                weaponColumns.map(({ weaponName, attacks }) => (
                                  <div key={weaponName} className="mb-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                                      {weaponName}
                                    </p>
                                    <div className="space-y-1.5">
                                      {attacks.map(action => (
                                        <ActionCard
                                          key={action.id}
                                          action={action}
                                          slotId={slot.id}
                                          fpCurrent={character.resources.fp.current}
                                          usedAbilityIds={character.usedAbilities}
                                          onUse={handleUseAction}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))
                              )}
                            </ScrollArea>
                          </div>

                          {/* Column 2 — Tactics */}
                          <div className="flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-muted/30 border-b border-border flex-shrink-0 flex items-center gap-2">
                              <Footprints className="h-4 w-4 text-blue-400" />
                              <span className="font-semibold text-sm tracking-wide text-blue-400 uppercase">Tactics</span>
                            </div>
                            <ScrollArea className="flex-1 px-3 py-2">
                              {tacticActions.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic py-4 text-center">Nothing available</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {tacticActions.map(action => (
                                    <ActionCard
                                      key={action.id}
                                      action={action}
                                      slotId={slot.id}
                                      fpCurrent={character.resources.fp.current}
                                      onUse={handleUseAction}
                                    />
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>

                          {/* Column 3 — Magic */}
                          <div className="flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-muted/30 border-b border-border flex-shrink-0 flex items-center gap-2">
                              <Wand2 className="h-4 w-4 text-purple-400" />
                              <span className="font-semibold text-sm tracking-wide text-purple-400 uppercase">Magic</span>
                            </div>
                            <ScrollArea className="flex-1 py-2">
                              {magicColumns.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic py-4 text-center">Nothing available</p>
                              ) : (
                                <div className="space-y-1">
                                  {magicColumns.map(({ school, spells }) => (
                                    <Collapsible
                                      key={school}
                                      open={openSchools.has(school)}
                                      onOpenChange={() => toggleSchool(school)}
                                    >
                                      <CollapsibleTrigger className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 rounded-sm transition-colors">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                          {school}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <Badge variant="outline" className="text-xs h-4 px-1">
                                            {spells.length}
                                          </Badge>
                                          <ChevronDown
                                            className={cn(
                                              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                                              openSchools.has(school) && "rotate-180"
                                            )}
                                          />
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <div className="space-y-1.5 px-3 pb-2 pt-1">
                                          {spells.map(action => (
                                            <ActionCard
                                              key={action.id}
                                              action={action}
                                              slotId={slot.id}
                                              fpCurrent={character.resources.fp.current}
                                              onUse={handleUseAction}
                                            />
                                          ))}
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>

                          {/* Column 4 — Items */}
                          <div className="flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-muted/30 border-b border-border flex-shrink-0 flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-green-400" />
                              <span className="font-semibold text-sm tracking-wide text-green-400 uppercase">Items</span>
                            </div>
                            <ScrollArea className="flex-1 px-3 py-2">
                              {itemActions.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic py-4 text-center">Nothing available</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {itemActions.map(action => (
                                    <ActionCard
                                      key={action.id}
                                      action={action}
                                      slotId={slot.id}
                                      fpCurrent={character.resources.fp.current}
                                      onUse={handleUseAction}
                                    />
                                  ))}
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>{/* end 4-column grid */}

                        <div className="px-6 py-3 border-t border-border flex-shrink-0 flex items-center justify-between">
                          {/* Left: Improvise toggle */}
                          {!showImprovise ? (
                            <Button variant="outline" size="sm" onClick={() => setShowImprovise(true)}
                              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                              <Zap className="h-4 w-4 mr-2" /> Improvise
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setShowImprovise(false)}>
                              ← Back
                            </Button>
                          )}
                          {/* Right: Execute or Cancel */}
                          {showImprovise ? (
                            <Button
                              onClick={() => handleExecuteImprovise(slot.id)}
                              disabled={!improvName.trim()}
                              className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              <Zap className="h-4 w-4 mr-2" /> Execute
                            </Button>
                          ) : (
                            <Button variant="ghost" onClick={() => { setActiveSlot(null); resetImprovise(); }}>Cancel</Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              }

              // MINOR / BONUS / FREE — existing Sheet picker (unchanged)
              return (
                <Sheet key={slot.id} open={activeSlot === slot.id} onOpenChange={(open) => setActiveSlot(open ? slot.id : null)}>
                  <SheetTrigger asChild>
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:border-primary/50",
                        slot.used && "opacity-60 bg-muted/50",
                        slot.type === 'minor' && "border-l-4 border-l-blue-500",
                        slot.type === 'bonus' && "border-l-4 border-l-purple-500",
                        slot.type === 'free' && "border-l-4 border-l-green-500"
                      )}
                    >
                      {slotCardInterior}
                    </Card>
                  </SheetTrigger>

                  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle className="font-cinzel">{slot.label} Options</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                      <div className="space-y-2 pr-4">
                        {/* Enchantment slot — dedicated Sheet content */}
                        {slot.sourceEquipmentId ? (() => {
                          const item = character.equipment.find(e => e.id === slot.sourceEquipmentId);
                          const enc = item?.enchantment;
                          if (!enc) return null;
                          const canUse = enc.charges >= enc.chargeCost;
                          return (
                            <Card
                              className={cn(
                                "p-4 cursor-pointer transition-all hover:border-purple-400/50 hover:bg-purple-400/5",
                                !canUse && "opacity-60 cursor-not-allowed"
                              )}
                              onClick={() => canUse && handleUseEnchantment(slot.id, slot.sourceEquipmentId!)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                                    <span className="font-cinzel font-bold text-purple-300">{enc.name}</span>
                                    <Badge variant="outline" className="text-xs border-purple-400/50 text-purple-400">
                                      {item!.name}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{enc.description}</p>
                                  {enc.chargeCost > 1 && (
                                    <p className="text-xs text-muted-foreground mt-1">Costs {enc.chargeCost} charges per use</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className={cn(
                                    "text-lg font-mono font-bold tabular-nums",
                                    enc.charges === 0 ? "text-destructive" : enc.charges <= enc.maxCharges * 0.25 ? "text-amber-400" : "text-purple-300"
                                  )}>
                                    {enc.charges}/{enc.maxCharges}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">charges</span>
                                  {!canUse && <AlertCircle className="h-4 w-4 text-destructive mt-1" />}
                                </div>
                              </div>
                              {canUse && (
                                <div className="mt-3 pt-3 border-t border-border/50 text-center">
                                  <span className="text-xs text-purple-400/80">Click to activate</span>
                                </div>
                              )}
                              {!canUse && (
                                <p className="mt-2 text-xs text-destructive text-center">No charges remaining — recharge with a soul gem</p>
                              )}
                            </Card>
                          );
                        })() : getActionsForSlot(slot).map((action) => {
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
                                      <Badge variant="outline" className="text-xs">{action.source}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                                  {'damage' in action && action.damage && (
                                    <div className="text-sm text-red-400 mt-1">Damage: {action.damage}</div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {fpCost > 0 && (
                                    <Badge variant={canAfford ? "default" : "destructive"} className="text-xs">
                                      {fpCost} FP
                                    </Badge>
                                  )}
                                  {!canAfford && <AlertCircle className="h-4 w-4 text-destructive" />}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
