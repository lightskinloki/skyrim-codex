import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Character } from "@/types/character";
import { Spell } from "@/types/spell";
import { spells } from "@/data/spells";

interface KnownSpellsProps {
  character: Character;
  onSpendFP: (amount: number, actionName: string) => void;
}

export function KnownSpells({ character, onSpendFP }: KnownSpellsProps) {
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());

  const toggleSchool = (school: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(school)) {
      newExpanded.delete(school);
    } else {
      newExpanded.add(school);
    }
    setExpandedSchools(newExpanded);
  };

  // Get character's rank in each magic school
  const getSchoolRank = (schoolId: string): string => {
    const skill = character.skills.find(s => s.skillId === schoolId.toLowerCase());
    return skill?.rank || 'Novice';
  };

  // Filter spells based on character's school ranks
  const getKnownSpells = (): Spell[] => {
    return spells.filter(spell => {
      const schoolRank = getSchoolRank(spell.school);
      const tierOrder = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master'];
      const characterTierIndex = tierOrder.indexOf(schoolRank);
      const spellTierIndex = tierOrder.indexOf(spell.tier);
      return spellTierIndex <= characterTierIndex;
    });
  };

  // Group spells by school
  const spellsBySchool = getKnownSpells().reduce((acc, spell) => {
    if (!acc[spell.school]) acc[spell.school] = [];
    acc[spell.school].push(spell);
    return acc;
  }, {} as Record<string, Spell[]>);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Novice': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'Apprentice': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Adept': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Expert': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Master': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleSpellCast = (spell: Spell) => {
    onSpendFP(spell.fpCost, `Cast ${spell.name}`);
  };

  return (
    <Card className="p-6 bg-card-secondary max-h-[600px] overflow-y-auto">
      <h3 className="font-cinzel font-semibold text-primary mb-4">
        🔮 Known Spells
      </h3>
      
      {Object.keys(spellsBySchool).length === 0 ? (
        <p className="text-muted-foreground italic">No spells known. Advance your magic skills to learn spells.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(spellsBySchool).map(([school, schoolSpells]) => (
            <div key={school}>
              <Collapsible
                open={expandedSchools.has(school)}
                onOpenChange={() => toggleSchool(school)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 bg-muted rounded hover:bg-muted/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      {expandedSchools.has(school) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      
                      <div className="text-left">
                        <span className="font-medium">{school}</span>
                        <p className="text-xs text-muted-foreground">
                          {schoolSpells.length} spell{schoolSpells.length > 1 ? 's' : ''} known
                        </p>
                      </div>
                    </div>

                    <Badge className={getTierColor(getSchoolRank(school))}>
                      {getSchoolRank(school)}
                    </Badge>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="ml-7 mt-2 space-y-2">
                    {schoolSpells.map((spell) => (
                      <div key={spell.name} className="p-3 bg-primary/5 rounded border-l-2 border-primary/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-sm">{spell.name}</h5>
                            <Badge variant="outline" className={`text-xs ${getTierColor(spell.tier)}`}>
                              {spell.tier}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-fatigue font-bold">{spell.fpCost} FP</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 hover:bg-fatigue/20"
                              onClick={() => handleSpellCast(spell)}
                              disabled={character.resources.fp.current < spell.fpCost}
                            >
                              <Zap className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {spell.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}