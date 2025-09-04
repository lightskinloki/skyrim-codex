import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Race, StandingStone, Kit, CharacterSkill, Stats } from "@/types/character";
import { calculateFinalStats, calculateMaxHP, calculateMaxFP, calculateTotalDR } from "@/utils/characterCalculations";
import { skills } from "@/data/skills";

interface CreatorSummaryPanelProps {
  race: Race | null;
  stone: StandingStone | null;
  skills: CharacterSkill[];
  kit: Kit | null;
  characterName: string;
  currentStep: number;
}

export function CreatorSummaryPanel({ 
  race, 
  stone, 
  skills: selectedSkills, 
  kit, 
  characterName,
  currentStep 
}: CreatorSummaryPanelProps) {
  
  const finalStats = race && stone ? calculateFinalStats(stone.baseStats, race) : null;
  
  const getStatDisplay = (stat: keyof Stats, value: number) => {
    const bonusStat = race?.bonus === stat;
    return (
      <div className={`text-center ${bonusStat ? 'text-primary font-bold' : ''}`}>
        <div className="text-sm text-muted-foreground capitalize">{stat}</div>
        <div className="text-lg font-semibold">
          {value}
          {bonusStat && <span className="text-xs ml-1">(+1)</span>}
        </div>
      </div>
    );
  };

  const getAllSkillsForCalculation = () => {
    return skills.map(skill => {
      const selected = selectedSkills.find(s => s.skillId === skill.id);
      return selected || {
        skillId: skill.id,
        rank: "Novice" as const,
        unlockedPerks: []
      };
    });
  };

  const finalResources = race && stone && finalStats ? {
    maxHP: calculateMaxHP(finalStats, stone, race, getAllSkillsForCalculation()),
    maxFP: calculateMaxFP(finalStats, stone, race, getAllSkillsForCalculation()),
    totalDR: kit ? calculateTotalDR(kit.equipment, stone) : 0
  } : null;

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-cinzel text-primary">
          Character Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {/* Character Name */}
        {currentStep >= 4 && characterName && (
          <Card>
            <CardContent className="p-3">
              <h3 className="font-cinzel text-lg text-center">
                {characterName}
              </h3>
            </CardContent>
          </Card>
        )}

        {/* Race */}
        {race && (
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <h4 className="font-semibold text-primary">Race</h4>
                <div className="text-lg">{race.name}</div>
                <Badge variant="secondary" className="mt-1">
                  +1 {race.bonus.charAt(0).toUpperCase() + race.bonus.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Standing Stone */}
        {stone && (
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <h4 className="font-semibold text-primary">Standing Stone</h4>
                <div className="text-lg">{stone.name}</div>
                <Badge variant="outline" className="mt-1">
                  {stone.archetype}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Stats */}
        {finalStats && (
          <Card>
            <CardContent className="p-3">
              <h4 className="font-semibold text-primary text-center mb-3">Final Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                {getStatDisplay("might", finalStats.might)}
                {getStatDisplay("agility", finalStats.agility)}
                {getStatDisplay("magic", finalStats.magic)}
                {getStatDisplay("guile", finalStats.guile)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Skills */}
        {selectedSkills.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <h4 className="font-semibold text-primary text-center mb-3">Selected Skills</h4>
              <div className="space-y-2">
                {selectedSkills
                  .sort((a, b) => {
                    if (a.rank === "Adept" && b.rank !== "Adept") return -1;
                    if (a.rank !== "Adept" && b.rank === "Adept") return 1;
                    return 0;
                  })
                  .map(skill => {
                    const skillData = skills.find(s => s.id === skill.skillId);
                    return (
                      <div key={skill.skillId} className="flex justify-between items-center">
                        <span className="text-sm">{skillData?.name}</span>
                        <Badge 
                          variant={skill.rank === "Adept" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {skill.rank}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kit Summary */}
        {kit && (
          <Card>
            <CardContent className="p-3">
              <h4 className="font-semibold text-primary text-center mb-3">Starting Kit</h4>
              <div className="text-center mb-3">
                <div className="font-medium">{kit.name}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium text-primary">Equipment:</div>
                  {kit.equipment.map((item, index) => (
                    <div key={index}>{item.name}</div>
                  ))}
                </div>
                <div>
                  <div className="font-medium text-primary">Gold:</div>
                  <div>{kit.gold} Septims</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Resources */}
        {finalResources && currentStep >= 4 && (
          <Card>
            <CardContent className="p-3">
              <h4 className="font-semibold text-primary text-center mb-3">Final Resources</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Max HP:</span>
                  <span className="font-semibold">{finalResources.maxHP}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max FP:</span>
                  <span className="font-semibold">{finalResources.maxFP}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total DR:</span>
                  <span className="font-semibold">{finalResources.totalDR}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </div>
  );
}