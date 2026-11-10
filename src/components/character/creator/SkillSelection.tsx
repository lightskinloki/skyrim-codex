import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Skill, CharacterSkill } from "@/types/character";
import { skillArtPath } from "@/characters/creatorArt";
import { CreatorPlate } from "./CreatorPlate";

interface SkillSelectionProps {
  skills: Skill[];
  selectedSkills: CharacterSkill[];
  maxApprenticeSkills: number;
  onSkillsChange: (skills: CharacterSkill[]) => void;
}

const TYPE_NOTE: Record<string, string> = {
  Combat: "How you end a fight.",
  Armor: "How you survive the ones you did not start.",
  Magic: "What you can do that steel cannot.",
  Utility: "What gets you in, out, and paid.",
};

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
    <div className="space-y-7">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Choose Your Skills
        </h3>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Every character starts at Novice in everything. You are choosing where yours stands out:
          one Adept skill and {maxApprenticeSkills} Apprentice skills.
        </p>

        <div className="mt-4 flex justify-center gap-4">
          <Badge variant={adeptCount === 1 ? "default" : "destructive"}>
            Adept Skills: {adeptCount}/1
          </Badge>
          <Badge variant={apprenticeCount === maxApprenticeSkills ? "default" : "destructive"}>
            Apprentice Skills: {apprenticeCount}/{maxApprenticeSkills}
          </Badge>
        </div>
      </div>

      <div className="space-y-7">
        {typeOrder.map(type => (
          <section key={type}>
            <div className="mb-3 flex items-baseline justify-between border-b border-border pb-1">
              <div className="flex items-baseline gap-3">
                <h4 className="text-lg font-cinzel text-primary">{type}</h4>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{TYPE_NOTE[type]}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{skillsByType[type]?.length ?? 0}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {skillsByType[type]?.map(skill => {
                const currentRank = getRankForSkill(skill.id);
                const isExpanded = expandedSkills.has(skill.id);
                const chosen = currentRank !== "Novice";
                const apprenticePerks = skill.perks.filter(p => p.rank === "Apprentice");
                const adeptPerks = skill.perks.filter(p => p.rank === "Adept");

                return (
                  <Card
                    key={skill.id}
                    className={`overflow-hidden transition-colors ${chosen ? "border-primary/50 bg-primary/[0.03]" : ""}`}
                  >
                    <CreatorPlate
                      src={skillArtPath(skill.id)}
                      alt={`${skill.name} artwork`}
                      className="aspect-[16/9]"
                    />

                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-cinzel text-lg font-semibold">{skill.name}</h5>
                            <Badge variant="outline" className="text-[10px]">{skill.type}</Badge>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {skill.summary}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Governing {skill.governingStat}
                      </p>

                      <div className="rounded-r border-l-2 border-primary/30 bg-muted/30 px-3 py-2 text-xs leading-relaxed">
                        <span className="font-medium text-foreground">Apprentice</span>
                        <span className="text-muted-foreground"> — {apprenticePerks.map(p => p.name).join(", ")}</span>
                        <br />
                        <span className="font-medium text-foreground">Adept</span>
                        <span className="text-muted-foreground"> — {adeptPerks.map(p => p.name).join(", ")}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
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

                        {chosen && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto gap-1 text-xs"
                            onClick={() => toggleSkillExpansion(skill.id)}
                          >
                            Perks
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                        )}
                      </div>

                      {chosen && (
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent>
                            <div className="space-y-2 rounded border border-border/60 bg-muted/20 p-3">
                              <h6 className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                                Unlocked at {currentRank}
                              </h6>
                              {getPerksForRank(skill, currentRank as "Apprentice" | "Adept").map(perk => (
                                <div key={perk.name} className="text-xs">
                                  <div className="font-medium">{perk.name}</div>
                                  <div className="text-muted-foreground">{perk.description}</div>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
