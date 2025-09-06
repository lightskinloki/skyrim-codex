import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Character, CharacterSkill } from "@/types/character";
import { skills } from "@/data/skills";

interface SkillsDisplayProps {
  character: Character;
  onSpendFP: (amount: number, actionName: string) => void;
}

export function SkillsDisplay({ character, onSpendFP }: SkillsDisplayProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const toggleSkill = (skillId: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId);
    } else {
      newExpanded.add(skillId);
    }
    setExpandedSkills(newExpanded);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Novice': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'Apprentice': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Adept': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Expert': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Master': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Get full skill data for each character skill
  const getSkillWithData = (charSkill: CharacterSkill) => {
    const skillData = skills.find(s => s.id === charSkill.skillId);
    return { ...charSkill, skillData };
  };

  // Sort skills by type, then by name
  const sortedSkills = character.skills
    .map(getSkillWithData)
    .filter(skill => skill.skillData) // Only include skills with valid data
    .sort((a, b) => {
      // First sort by type
      const typeComparison = (a.skillData?.type || '').localeCompare(b.skillData?.type || '');
      if (typeComparison !== 0) return typeComparison;
      
      // Then sort by name within the same type
      return (a.skillData?.name || '').localeCompare(b.skillData?.name || '');
    });

  // Group skills by type
  const skillsByType = sortedSkills.reduce((acc, skill) => {
    const type = skill.skillData?.type || 'Unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(skill);
    return acc;
  }, {} as Record<string, typeof sortedSkills>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Combat': return '⚔️';
      case 'Magic': return '🔮';
      case 'Armor': return '🛡️';
      case 'Utility': return '🛠️';
      default: return '❓';
    }
  };

  // Get unlocked perks based on character's rank in the skill
  const getUnlockedPerks = (skill: CharacterSkill) => {
    const skillData = skills.find(s => s.id === skill.skillId);
    if (!skillData) return [];

    const tierOrder = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master'];
    const characterTierIndex = tierOrder.indexOf(skill.rank);
    
    return skillData.perks.filter(perk => {
      const perkTierIndex = tierOrder.indexOf(perk.rank);
      return perkTierIndex <= characterTierIndex;
    });
  };

  const handlePerkUse = (perkName: string, fpCost: number) => {
    onSpendFP(fpCost, `Use ${perkName}`);
  };

  return (
    <Card className="p-6 bg-card-secondary max-h-[600px] overflow-y-auto">
      <h3 className="font-cinzel font-semibold text-primary mb-4">
        Skills & Perks
      </h3>
      
      <div className="space-y-4">
        {Object.entries(skillsByType).map(([type, typeSkills]) => (
          <div key={type}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
              <span className="mr-2">{getTypeIcon(type)}</span>
              {type} Skills
            </h4>
            
            <div className="space-y-2 ml-6">
              {typeSkills.map((skill) => (
                <Collapsible
                  key={skill.skillId}
                  open={expandedSkills.has(skill.skillId)}
                  onOpenChange={() => toggleSkill(skill.skillId)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-muted rounded hover:bg-muted/80 transition-colors">
                      <div className="flex items-center space-x-3">
                        {expandedSkills.has(skill.skillId) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        
                         <div className="text-left">
                           <span className="font-medium">{skill.skillData?.name}</span>
                           {getUnlockedPerks(skill).length > 0 && (
                             <p className="text-xs text-muted-foreground">
                               {getUnlockedPerks(skill).length} perk{getUnlockedPerks(skill).length > 1 ? 's' : ''} unlocked
                             </p>
                           )}
                         </div>
                      </div>

                      <Badge className={getRankColor(skill.rank)}>
                        {skill.rank}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  
                   <CollapsibleContent>
                     <div className="ml-7 mt-2 space-y-2">
                       {getUnlockedPerks(skill).length > 0 ? (
                         getUnlockedPerks(skill).map((perk) => (
                           <div key={perk.name} className="p-3 bg-primary/5 rounded border-l-2 border-primary/30">
                             <div className="flex items-center justify-between mb-1">
                               <div className="flex items-center gap-2">
                                 <h5 className="font-medium text-sm">{perk.name}</h5>
                                 <Badge variant="outline" className="text-xs">
                                   {perk.rank}
                                 </Badge>
                               </div>
                               {perk.fpCost !== undefined && perk.fpCost > 0 && (
                                 <div className="flex items-center gap-2">
                                   <span className="text-xs text-fatigue font-bold">{perk.fpCost} FP</span>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     className="h-6 w-6 p-0 hover:bg-fatigue/20"
                                     onClick={() => handlePerkUse(perk.name, perk.fpCost!)}
                                     disabled={character.resources.fp.current < perk.fpCost}
                                   >
                                     <Zap className="w-3 h-3" />
                                   </Button>
                                 </div>
                               )}
                             </div>
                             <p className="text-xs text-muted-foreground">
                               {perk.description}
                             </p>
                           </div>
                         ))
                       ) : (
                         <p className="text-xs text-muted-foreground italic p-3">
                           No perks unlocked for this skill.
                         </p>
                       )}
                     </div>
                   </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}