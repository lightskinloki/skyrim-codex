import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, 
  UserPlus, 
  ChevronDown,
  Crown,
  Skull,
  Users,
  Bug,
  Ghost,
  Flame,
  Cog
} from "lucide-react";
import { CombatState } from "@/types/combat";
import { enemyTemplates, EnemyTemplate } from "@/data/enemies";
import { combatManager } from "@/lib/combatManager";
import { characterStorage } from "@/utils/characterStorage";

interface EnemyManagerProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  all: <Users className="h-4 w-4" />,
  humanoid: <Users className="h-4 w-4" />,
  beast: <Bug className="h-4 w-4" />,
  undead: <Skull className="h-4 w-4" />,
  daedra: <Flame className="h-4 w-4" />,
  dragon: <Ghost className="h-4 w-4" />,
  construct: <Cog className="h-4 w-4" />,
  summon: <Ghost className="h-4 w-4" />,
};

export function EnemyManager({ combatState, onUpdateState }: EnemyManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantity, setQuantity] = useState(1);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customEnemy, setCustomEnemy] = useState({
    name: '',
    hp: 10,
    fp: 0,
    dr: 1,
    might: 10,
    agility: 10,
    magic: 10,
    guile: 10,
    isBoss: false,
  });

  const categories = ['all', ...new Set(enemyTemplates.map(e => e.category))];
  
  const filteredTemplates = selectedCategory === 'all'
    ? enemyTemplates
    : enemyTemplates.filter(e => e.category === selectedCategory);

  const handleAddFromTemplate = (template: EnemyTemplate) => {
    for (let i = 0; i < quantity; i++) {
      const suffix = quantity > 1 ? ` #${i + 1}` : '';
      const combatant = combatManager.createCombatantFromEnemy(template, template.name + suffix);
      onUpdateState(prev => combatManager.addCombatant(prev, combatant));
    }
  };

  const handleAddCustomEnemy = () => {
    if (!customEnemy.name.trim()) return;

    const combatant = combatManager.createCustomCombatant({
      name: customEnemy.name,
      type: 'enemy',
      hp: customEnemy.hp,
      fp: customEnemy.fp,
      dr: customEnemy.dr,
      stats: {
        might: customEnemy.might,
        agility: customEnemy.agility,
        magic: customEnemy.magic,
        guile: customEnemy.guile,
      },
      isBoss: customEnemy.isBoss,
    });

    onUpdateState(prev => combatManager.addCombatant(prev, combatant));
    
    // Reset form
    setCustomEnemy({
      name: '',
      hp: 10,
      fp: 0,
      dr: 1,
      might: 10,
      agility: 10,
      magic: 10,
      guile: 10,
      isBoss: false,
    });
  };

  const handleLoadCharacter = () => {
    const characters = characterStorage.getCharacterSummaries();
    if (characters.length === 0) {
      return;
    }

    // For now, add all saved characters as players
    characters.forEach(summary => {
      const character = characterStorage.getCharacter(summary.id);
      if (character) {
        const combatant = combatManager.createCombatantFromCharacter(character);
        onUpdateState(prev => combatManager.addCombatant(prev, combatant));
      }
    });
  };

  const savedCharacters = characterStorage.getCharacterSummaries();

  return (
    <div className="space-y-4">
      {/* Load Saved Characters */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Player Characters</h3>
          <Badge variant="outline">{savedCharacters.length} saved</Badge>
        </div>
        {savedCharacters.length > 0 ? (
          <div className="space-y-2">
            {savedCharacters.map(char => {
              const isInCombat = combatState.combatants.some(c => c.characterId === char.id);
              return (
                <div key={char.id} className="flex items-center justify-between text-sm">
                  <span>{char.name} ({char.race})</span>
                  <Button
                    size="sm"
                    variant={isInCombat ? "secondary" : "outline"}
                    disabled={isInCombat}
                    onClick={() => {
                      const character = characterStorage.getCharacter(char.id);
                      if (character) {
                        const combatant = combatManager.createCombatantFromCharacter(character);
                        onUpdateState(prev => combatManager.addCombatant(prev, combatant));
                      }
                    }}
                  >
                    {isInCombat ? "In Combat" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No saved characters found</p>
        )}
      </Card>

      {/* Enemy Templates */}
      <div>
        <h3 className="font-semibold text-sm mb-2">Enemy Templates</h3>
        
        {/* Category Filter */}
        <ScrollArea className="w-full whitespace-nowrap mb-3">
          <div className="flex gap-1">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {categoryIcons[cat]}
                <span className="ml-1">{cat}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Quantity Selector */}
        <div className="flex items-center gap-2 mb-3">
          <Label className="text-sm">Quantity:</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <Button
                key={n}
                variant={quantity === n ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setQuantity(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredTemplates.map(template => (
            <Card 
              key={template.id}
              className="p-2 hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => handleAddFromTemplate(template)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {template.isBoss && <Crown className="h-4 w-4 text-amber-500" />}
                  <span className="font-medium">{template.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>HP: {template.hp}</span>
                  <span>DR: {template.dr}</span>
                  <Plus className="h-4 w-4" />
                </div>
              </div>
              {template.abilities && template.abilities.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {template.abilities.join(', ')}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Enemy Form */}
      <Collapsible open={showCustomForm} onOpenChange={setShowCustomForm}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showCustomForm ? 'rotate-180' : ''}`} />
            Custom Enemy
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <Card className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label className="text-xs">Name</Label>
                <Input
                  value={customEnemy.name}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enemy name"
                />
              </div>
              <div>
                <Label className="text-xs">HP</Label>
                <Input
                  type="number"
                  value={customEnemy.hp}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, hp: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="text-xs">FP</Label>
                <Input
                  type="number"
                  value={customEnemy.fp}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, fp: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="text-xs">DR</Label>
                <Input
                  type="number"
                  value={customEnemy.dr}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, dr: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Checkbox
                  checked={customEnemy.isBoss}
                  onCheckedChange={(checked) => setCustomEnemy(prev => ({ ...prev, isBoss: !!checked }))}
                />
                <Label className="text-xs">Is Boss?</Label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">MIG</Label>
                <Input
                  type="number"
                  value={customEnemy.might}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, might: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="text-xs">AGI</Label>
                <Input
                  type="number"
                  value={customEnemy.agility}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, agility: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="text-xs">MAG</Label>
                <Input
                  type="number"
                  value={customEnemy.magic}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, magic: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label className="text-xs">GUI</Label>
                <Input
                  type="number"
                  value={customEnemy.guile}
                  onChange={(e) => setCustomEnemy(prev => ({ ...prev, guile: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <Button onClick={handleAddCustomEnemy} className="w-full" disabled={!customEnemy.name.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Custom Enemy
            </Button>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
