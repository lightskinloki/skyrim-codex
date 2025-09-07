import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Character, CharacterSkill } from "@/types/character";
import { skills } from "@/data/skills";
import { useToast } from "@/hooks/use-toast";

interface ProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onUpdateCharacter: (character: Character) => void;
  type: 'arcane-adept' | 'arcane-expert' | 'arcane-master' | 'combat-master';
}

export function ProgressionModal({ isOpen, onClose, character, onUpdateCharacter, type }: ProgressionModalProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const { toast } = useToast();

  const getAvailableSkills = () => {
    switch (type) {
      case 'arcane-adept':
        return character.skills.filter(skill => 
          skill.rank === "Novice" && 
          skills.find(s => s.id === skill.skillId)?.type === "Magic"
        );
      case 'arcane-expert':
      case 'arcane-master':
        return character.skills.filter(skill => 
          skill.rank === "Apprentice" && 
          skills.find(s => s.id === skill.skillId)?.type === "Magic"
        );
      case 'combat-master':
        return character.skills.filter(skill => 
          skill.rank === "Apprentice" && 
          (skills.find(s => s.id === skill.skillId)?.type === "Combat" || 
           skills.find(s => s.id === skill.skillId)?.type === "Armor")
        );
      default:
        return [];
    }
  };

  const getSkillName = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.name || skillId;
  };

  const getModalTitle = () => {
    switch (type) {
      case 'arcane-adept':
        return "Arcane Studies - Adept Benefit";
      case 'arcane-expert':
        return "Arcane Studies - Expert Benefit";
      case 'arcane-master':
        return "Arcane Studies - Master Benefit";
      case 'combat-master':
        return "Combat Prowess - Master Benefit";
      default:
        return "Progression Benefit";
    }
  };

  const getModalDescription = () => {
    switch (type) {
      case 'arcane-adept':
        return "Your focused study in magic naturally unlocks understanding of other schools. Choose one Novice magic skill to promote to Apprentice for free.";
      case 'arcane-expert':
        return "Your mastery of magic grants you deeper understanding. Choose one Apprentice magic skill to promote to Adept for free.";
      case 'arcane-master':
        return "Your arcane mastery reaches new heights. Choose another Apprentice magic skill to promote to Adept for free.";
      case 'combat-master':
        return "Your combat mastery is legendary. Choose one Apprentice Combat or Armor skill to promote to Adept for free.";
      default:
        return "";
    }
  };

  const handleConfirm = () => {
    if (!selectedSkill) return;

    const updatedCharacter = { ...character };
    const skill = updatedCharacter.skills.find(s => s.skillId === selectedSkill);
    
    if (skill) {
      if (type === 'arcane-adept') {
        skill.rank = "Apprentice";
        const skillData = skills.find(s => s.id === selectedSkill);
        skill.unlockedPerks = skillData?.perks.filter(p => p.rank === "Apprentice").map(p => p.name) || [];
      } else {
        skill.rank = "Adept";
        const skillData = skills.find(s => s.id === selectedSkill);
        skill.unlockedPerks = skillData?.perks.filter(p => ["Apprentice", "Adept"].includes(p.rank)).map(p => p.name) || [];
      }

      // Mark the progression as unlocked
      if (type === 'arcane-adept') {
        updatedCharacter.progression.arcaneStudiesUnlocked.adept = true;
      } else if (type === 'arcane-expert') {
        updatedCharacter.progression.arcaneStudiesUnlocked.expert = true;
      } else if (type === 'arcane-master') {
        updatedCharacter.progression.arcaneStudiesUnlocked.master = true;
      } else if (type === 'combat-master') {
        updatedCharacter.progression.combatProwessUnlocked.master = true;
      }

      onUpdateCharacter(updatedCharacter);
      
      toast({
        title: "Skill Promoted!",
        description: `${getSkillName(selectedSkill)} has been promoted to Adept for free!`,
      });
    }

    onClose();
  };

  const availableSkills = getAvailableSkills();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">{getModalDescription()}</p>

          {availableSkills.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium">Available Skills:</h4>
              {availableSkills.map(skill => (
                <Card 
                  key={skill.skillId} 
                  className={`cursor-pointer transition-colors ${
                    selectedSkill === skill.skillId ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedSkill(skill.skillId)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{getSkillName(skill.skillId)}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {skills.find(s => s.id === skill.skillId)?.type}
                        </Badge>
                      </div>
                      <Badge variant="secondary">
                        {skill.rank} → {type === 'arcane-adept' ? 'Apprentice' : 'Adept'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              No eligible skills available for this progression benefit.
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedSkill || availableSkills.length === 0}
            >
              Confirm Promotion
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}