import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Skill, CharacterSkill } from "@/types/character";

interface SkillSelectionProps {
  skills: Skill[];
  selectedSkills: CharacterSkill[];
  maxApprenticeSkills: number;
  onSkillsChange: (skills: CharacterSkill[]) => void;
}

export function SkillSelection({ skills, selectedSkills, maxApprenticeSkills, onSkillsChange }: SkillSelectionProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());

  const adeptCount = selectedSkills.filter(s => s.rank === "Adept").length;
  const apprenticeCount = selectedSkills.filter(s => s.rank === "Apprentice").length;

  const getRankForSkill = (skillId: string): "Novice" | "Apprentice" | "Adept" => {
    const selected = selectedSkills.find(s => s.skillId === skillId);
    return (selected?.rank === "Expert" || selected?.rank === "Master") ? "Adept" : (selected?.rank || "Novice");
  };

  const canSelectRank = (skillId: string, rank: "Apprentice" | "Adept"): boolean => {
    const currentRank = getRankForSkill(skillId);
    
    if (rank === "Adept") {
      if (currentRank === "Adept") return true;
      return adeptCount < 1;
    }
    
    if (rank === "Apprentice") {
      if (currentRank === "Apprentice") return true;
      if (currentRank === "Adept") return true; // Can downgrade
      return apprenticeCount < maxApprenticeSkills;
    }
    
    return false;
  };

  const handleRankSelect = (skillId: string, rank: "Novice" | "Apprentice" | "Adept") => {
    const newSkills = selectedSkills.filter(s => s.skillId !== skillId);
    
    if (rank !== "Novice") {
      newSkills.push({
        skillId,
        rank,
        unlockedPerks: []
      });
    }
    
    onSkillsChange(newSkills);
  };

  const toggleSkillExpansion = (skillId: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId);
    } else {
      newExpanded.add(skillId);
    }
    setExpandedSkills(newExpanded);
  };

  const getPerksForRank = (skill: Skill, rank: "Apprentice" | "Adept") => {
    if (rank === "Apprentice") {
      return skill.perks.filter(p => p.rank === "Apprentice");
    }
    return skill.perks.filter(p => p.rank === "Apprentice" || p.rank === "Adept");
  };

  const skillsByType = skills.reduce((acc, skill) => {
    if (!acc[skill.type]) acc[skill.type] = [];
    acc[skill.type].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const typeOrder = ["Combat", "Armor", "Magic", "Utility"];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Choose Your Skills
        </h3>
        <p className="text-muted-foreground mb-4">
          Select your expertise areas. You must choose exactly 1 Adept skill and {maxApprenticeSkills} Apprentice skills.
        </p>
        
        <div className="flex justify-center gap-4">
          <Badge variant={adeptCount === 1 ? "default" : "destructive"}>
            Adept Skills: {adeptCount}/1
          </Badge>
          <Badge variant={apprenticeCount === maxApprenticeSkills ? "default" : "destructive"}>
            Apprentice Skills: {apprenticeCount}/{maxApprenticeSkills}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {typeOrder.map(type => (
          <div key={type}>
            <h4 className="text-lg font-cinzel text-primary mb-3 border-b border-border pb-1">
              {type} Skills
            </h4>
            
            <div className="grid gap-3">
              {skillsByType[type]?.map(skill => {
                const currentRank = getRankForSkill(skill.id);
                const isExpanded = expandedSkills.has(skill.id);
                
                return (
                  <Card key={skill.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h5 className="font-semibold">{skill.name}</h5>
                          <Badge variant="outline" className="text-xs">
                            {skill.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={currentRank === "Novice" ? "default" : "outline"}
                              onClick={() => handleRankSelect(skill.id, "Novice")}
                            >
                              Novice
                            </Button>
                            <Button
                              size="sm"
                              variant={currentRank === "Apprentice" ? "default" : "outline"}
                              onClick={() => handleRankSelect(skill.id, "Apprentice")}
                              disabled={!canSelectRank(skill.id, "Apprentice")}
                            >
                              Apprentice
                            </Button>
                            <Button
                              size="sm"
                              variant={currentRank === "Adept" ? "default" : "outline"}
                              onClick={() => handleRankSelect(skill.id, "Adept")}
                              disabled={!canSelectRank(skill.id, "Adept")}
                            >
                              Adept
                            </Button>
                          </div>
                          
                          {currentRank !== "Novice" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSkillExpansion(skill.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {currentRank !== "Novice" && (
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent className="mt-3">
                            <div className="p-3 bg-muted/30 rounded border-l-4 border-primary">
                              <h6 className="font-semibold text-primary mb-2">
                                Unlocked Perks ({currentRank} Rank)
                              </h6>
                              <div className="space-y-2">
                                {getPerksForRank(skill, currentRank as "Apprentice" | "Adept").map(perk => (
                                  <div key={perk.name} className="text-sm">
                                    <div className="font-medium">{perk.name}</div>
                                    <div className="text-muted-foreground">{perk.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}