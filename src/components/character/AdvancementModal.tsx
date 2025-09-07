import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Character, CharacterSkill } from "@/types/character";
import { skills } from "@/data/skills";
import { useToast } from "@/hooks/use-toast";
import { ProgressionModal } from "./ProgressionModal";

interface AdvancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'skill' | 'stat' | 'resource';
}

const upgradeOptions: UpgradeOption[] = [
  {
    id: "skill-training",
    name: "Skill Training",
    description: "Promote two Novice skills to the Apprentice tier.",
    cost: 1,
    type: "skill"
  },
  {
    id: "skill-focus",
    name: "Skill Focus", 
    description: "Promote one Apprentice skill to the Adept tier.",
    cost: 1,
    type: "skill"
  },
  {
    id: "resource-training",
    name: "Resource Training",
    description: "Permanently increase your maximum HP by 1 or your maximum FP by 1.",
    cost: 1,
    type: "resource"
  },
  {
    id: "skill-specialization",
    name: "Skill Specialization",
    description: "Promote one Adept skill to the Expert tier.",
    cost: 2,
    type: "skill"
  },
  {
    id: "skill-mastery",
    name: "Skill Mastery",
    description: "Promote one Expert skill to the Master tier.",
    cost: 3,
    type: "skill"
  },
  {
    id: "stat-increase",
    name: "Stat Increase",
    description: "Increase one of your four core Stat Scores by 1 (max 18).",
    cost: 3,
    type: "stat"
  }
];

export function AdvancementModal({ isOpen, onClose, character, onUpdateCharacter }: AdvancementModalProps) {
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeOption | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedStat, setSelectedStat] = useState<string>("");
  const [selectedResource, setSelectedResource] = useState<string>("");
  const { toast } = useToast();

  const canAfford = (option: UpgradeOption) => character.ap >= option.cost;

  const getAvailableSkillsForUpgrade = (fromRank: string, toRank: string) => {
    return character.skills.filter(skill => skill.rank === fromRank);
  };

  const getSkillName = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.name || skillId;
  };

  const getSkillType = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.type || "";
  };

  const handleUpgradeSelect = (option: UpgradeOption) => {
    setSelectedUpgrade(option);
    setSelectedSkills([]);
    setSelectedStat("");
    setSelectedResource("");
  };

  const [pendingProgressions, setPendingProgressions] = useState<Array<{type: 'arcane-expert' | 'arcane-master' | 'combat-master'}>>([]);

  const checkProgressionBenefits = (updatedCharacter: Character, skillId: string, newRank: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return { character: updatedCharacter, progressions: [] };

    const progressions: Array<{type: 'arcane-expert' | 'arcane-master' | 'combat-master'}> = [];

    // Combat Prowess benefits
    if (skill.type === "Combat") {
      if (newRank === "Adept" && !updatedCharacter.progression.combatProwessUnlocked.adept) {
        updatedCharacter.progression.combatProwessUnlocked.adept = true;
        updatedCharacter.resources.hp.max += 2;
        updatedCharacter.resources.hp.current += 2;
        toast({
          title: "Combat Prowess Unlocked!",
          description: "Your body becomes tougher. You gain +2 maximum HP.",
        });
      }
      if (newRank === "Expert" && !updatedCharacter.progression.combatProwessUnlocked.expert) {
        updatedCharacter.progression.combatProwessUnlocked.expert = true;
        updatedCharacter.resources.fp.max += 2;
        updatedCharacter.resources.fp.current += 2;
        toast({
          title: "Combat Prowess Mastery!",
          description: "Your stamina becomes legendary. You gain +2 maximum FP.",
        });
      }
      if (newRank === "Master" && !updatedCharacter.progression.combatProwessUnlocked.master) {
        progressions.push({ type: 'combat-master' });
      }
    }

    // Arcane Studies benefits
    if (skill.type === "Magic") {
      if (newRank === "Adept" && !updatedCharacter.progression.arcaneStudiesUnlocked.adept) {
        updatedCharacter.progression.arcaneStudiesUnlocked.adept = true;
        // Promote one Novice magic skill to Apprentice
        const noviceMagicSkills = updatedCharacter.skills.filter(s => 
          s.rank === "Novice" && skills.find(skill => skill.id === s.skillId)?.type === "Magic"
        );
        if (noviceMagicSkills.length > 0) {
          const skillToPromote = noviceMagicSkills[0];
          skillToPromote.rank = "Apprentice";
          const skillData = skills.find(s => s.id === skillToPromote.skillId);
          skillToPromote.unlockedPerks = skillData?.perks.filter(p => p.rank === "Apprentice").map(p => p.name) || [];
          toast({
            title: "Arcane Studies Unlocked!",
            description: `Your ${getSkillName(skillToPromote.skillId)} skill has been promoted to Apprentice for free!`,
          });
        }
      }
      if (newRank === "Expert" && !updatedCharacter.progression.arcaneStudiesUnlocked.expert) {
        progressions.push({ type: 'arcane-expert' });
      }
      if (newRank === "Master" && !updatedCharacter.progression.arcaneStudiesUnlocked.master) {
        progressions.push({ type: 'arcane-master' });
      }
    }

    return { character: updatedCharacter, progressions };
  };

  const handleConfirmUpgrade = () => {
    if (!selectedUpgrade) return;

    let updatedCharacter = { ...character };
    updatedCharacter.ap -= selectedUpgrade.cost;

    switch (selectedUpgrade.id) {
      case "skill-training":
        if (selectedSkills.length === 2) {
          selectedSkills.forEach(skillId => {
            const skill = updatedCharacter.skills.find(s => s.skillId === skillId);
            if (skill) {
              skill.rank = "Apprentice";
              const skillData = skills.find(s => s.id === skillId);
              skill.unlockedPerks = skillData?.perks.filter(p => p.rank === "Apprentice").map(p => p.name) || [];
            }
          });
        }
        break;

      case "skill-focus":
        if (selectedSkills.length === 1) {
          const skill = updatedCharacter.skills.find(s => s.skillId === selectedSkills[0]);
          if (skill) {
            skill.rank = "Adept";
            const skillData = skills.find(s => s.id === selectedSkills[0]);
            skill.unlockedPerks = skillData?.perks.filter(p => ["Apprentice", "Adept"].includes(p.rank)).map(p => p.name) || [];
            const result = checkProgressionBenefits(updatedCharacter, selectedSkills[0], "Adept");
            updatedCharacter = result.character;
            setPendingProgressions(result.progressions);
          }
        }
        break;

      case "skill-specialization":
        if (selectedSkills.length === 1) {
          const skill = updatedCharacter.skills.find(s => s.skillId === selectedSkills[0]);
          if (skill) {
            skill.rank = "Expert";
            const skillData = skills.find(s => s.id === selectedSkills[0]);
            skill.unlockedPerks = skillData?.perks.filter(p => ["Apprentice", "Adept", "Expert"].includes(p.rank)).map(p => p.name) || [];
            const result = checkProgressionBenefits(updatedCharacter, selectedSkills[0], "Expert");
            updatedCharacter = result.character;
            setPendingProgressions(result.progressions);
          }
        }
        break;

      case "skill-mastery":
        if (selectedSkills.length === 1) {
          const skill = updatedCharacter.skills.find(s => s.skillId === selectedSkills[0]);
          if (skill) {
            skill.rank = "Master";
            const skillData = skills.find(s => s.id === selectedSkills[0]);
            skill.unlockedPerks = skillData?.perks.map(p => p.name) || [];
            const result = checkProgressionBenefits(updatedCharacter, selectedSkills[0], "Master");
            updatedCharacter = result.character;
            setPendingProgressions(result.progressions);
          }
        }
        break;

      case "resource-training":
        if (selectedResource === "hp") {
          updatedCharacter.resources.hp.max += 1;
          updatedCharacter.resources.hp.current += 1;
        } else if (selectedResource === "fp") {
          updatedCharacter.resources.fp.max += 1;
          updatedCharacter.resources.fp.current += 1;
        }
        break;

      case "stat-increase":
        if (selectedStat && updatedCharacter.stats[selectedStat as keyof typeof updatedCharacter.stats] < 18) {
          (updatedCharacter.stats as any)[selectedStat] += 1;
        }
        break;
    }

    onUpdateCharacter(updatedCharacter);
    setSelectedUpgrade(null);
    setSelectedSkills([]);
    setSelectedStat("");
    setSelectedResource("");
    
    toast({
      title: "Character Advanced!",
      description: `Successfully purchased ${selectedUpgrade.name}.`,
    });
  };

  const canConfirmUpgrade = () => {
    if (!selectedUpgrade) return false;

    switch (selectedUpgrade.id) {
      case "skill-training":
        return selectedSkills.length === 2;
      case "skill-focus":
      case "skill-specialization":
      case "skill-mastery":
        return selectedSkills.length === 1;
      case "resource-training":
        return selectedResource !== "";
      case "stat-increase":
        return selectedStat !== "" && character.stats[selectedStat as keyof typeof character.stats] < 18;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Character Advancement</span>
            <Badge variant="outline" className="text-lg">
              AP: {character.ap}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!selectedUpgrade ? (
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Choose an Upgrade</h3>
              {upgradeOptions.map(option => (
                <Card key={option.id} className={`cursor-pointer transition-colors ${canAfford(option) ? 'hover:bg-muted/50' : 'opacity-50'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{option.name}</span>
                      <Badge variant={canAfford(option) ? "default" : "destructive"}>
                        {option.cost} AP
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{option.description}</p>
                    <Button 
                      onClick={() => handleUpgradeSelect(option)}
                      disabled={!canAfford(option)}
                      className="w-full"
                    >
                      Select
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedUpgrade.name}</h3>
                <Button variant="outline" onClick={() => setSelectedUpgrade(null)}>
                  Back
                </Button>
              </div>

              {selectedUpgrade.id === "skill-training" && (
                <div>
                  <p className="mb-3">Select 2 Novice skills to promote to Apprentice:</p>
                  <div className="grid gap-2">
                    {getAvailableSkillsForUpgrade("Novice", "Apprentice").map(skill => (
                      <Card key={skill.skillId} className={`cursor-pointer ${selectedSkills.includes(skill.skillId) ? 'bg-primary/10 border-primary' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{getSkillName(skill.skillId)}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {getSkillType(skill.skillId)}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant={selectedSkills.includes(skill.skillId) ? "default" : "outline"}
                              onClick={() => {
                                if (selectedSkills.includes(skill.skillId)) {
                                  setSelectedSkills(prev => prev.filter(id => id !== skill.skillId));
                                } else if (selectedSkills.length < 2) {
                                  setSelectedSkills(prev => [...prev, skill.skillId]);
                                }
                              }}
                              disabled={!selectedSkills.includes(skill.skillId) && selectedSkills.length >= 2}
                            >
                              {selectedSkills.includes(skill.skillId) ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {(selectedUpgrade.id === "skill-focus" || selectedUpgrade.id === "skill-specialization" || selectedUpgrade.id === "skill-mastery") && (
                <div>
                  <p className="mb-3">
                    Select a {selectedUpgrade.id === "skill-focus" ? "Apprentice" : selectedUpgrade.id === "skill-specialization" ? "Adept" : "Expert"} skill to promote:
                  </p>
                  <div className="grid gap-2">
                    {getAvailableSkillsForUpgrade(
                      selectedUpgrade.id === "skill-focus" ? "Apprentice" : selectedUpgrade.id === "skill-specialization" ? "Adept" : "Expert",
                      selectedUpgrade.id === "skill-focus" ? "Adept" : selectedUpgrade.id === "skill-specialization" ? "Expert" : "Master"
                    ).map(skill => (
                      <Card key={skill.skillId} className={`cursor-pointer ${selectedSkills.includes(skill.skillId) ? 'bg-primary/10 border-primary' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{getSkillName(skill.skillId)}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {getSkillType(skill.skillId)}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant={selectedSkills.includes(skill.skillId) ? "default" : "outline"}
                              onClick={() => setSelectedSkills([skill.skillId])}
                            >
                              {selectedSkills.includes(skill.skillId) ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedUpgrade.id === "resource-training" && (
                <div>
                  <p className="mb-3">Choose which resource to increase:</p>
                  <Select value={selectedResource} onValueChange={setSelectedResource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resource to increase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hp">Health Points (HP)</SelectItem>
                      <SelectItem value="fp">Focus Points (FP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedUpgrade.id === "stat-increase" && (
                <div>
                  <p className="mb-3">Choose which stat to increase (max 18):</p>
                  <Select value={selectedStat} onValueChange={setSelectedStat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stat to increase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="might" disabled={character.stats.might >= 18}>
                        Might ({character.stats.might}/18)
                      </SelectItem>
                      <SelectItem value="agility" disabled={character.stats.agility >= 18}>
                        Agility ({character.stats.agility}/18)
                      </SelectItem>
                      <SelectItem value="magic" disabled={character.stats.magic >= 18}>
                        Magic ({character.stats.magic}/18)
                      </SelectItem>
                      <SelectItem value="guile" disabled={character.stats.guile >= 18}>
                        Guile ({character.stats.guile}/18)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmUpgrade}
                  disabled={!canConfirmUpgrade()}
                  className="flex-1"
                >
                  Confirm Upgrade ({selectedUpgrade.cost} AP)
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {pendingProgressions.map((progression, index) => (
          <ProgressionModal
            key={index}
            isOpen={true}
            onClose={() => setPendingProgressions(prev => prev.filter((_, i) => i !== index))}
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            type={progression.type}
          />
        ))}
      </DialogContent>
    </Dialog>
  );
}