import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { RaceSelection } from "./creator/RaceSelection";
import { StandingStoneSelection } from "./creator/StandingStoneSelection";
import { SkillSelection } from "./creator/SkillSelection";
import { KitSelection } from "./creator/KitSelection";
import { CharacterFinalization } from "./creator/CharacterFinalization";
import { CreatorSummaryPanel } from "./creator/CreatorSummaryPanel";

import { Race, StandingStone, Kit, CharacterSkill, Character, Stats } from "@/types/character";
import { races } from "@/data/races";
import { standingStones } from "@/data/standingStones";
import { kits } from "@/data/kits";
import { skills } from "@/data/skills";
import { calculateFinalStats, calculateMaxHP, calculateMaxFP, calculateTotalDR } from "@/utils/characterCalculations";

interface CharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (character: Character) => void;
}

interface CreatorState {
  selectedRace: Race | null;
  selectedStone: StandingStone | null;
  selectedSkills: CharacterSkill[];
  selectedKit: Kit | null;
  characterName: string;
}

const STEP_TITLES = [
  "Choose Your Race",
  "Choose Your Standing Stone", 
  "Choose Your Skills",
  "Choose Your Starting Kit",
  "Finalize Your Legend"
];

export function CharacterCreatorModal({ isOpen, onClose, onCharacterCreated }: CharacterCreatorModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [creatorState, setCreatorState] = useState<CreatorState>({
    selectedRace: null,
    selectedStone: null,
    selectedSkills: [],
    selectedKit: null,
    characterName: ""
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0: return creatorState.selectedRace !== null;
      case 1: return creatorState.selectedStone !== null;
      case 2: return isValidSkillSelection();
      case 3: return creatorState.selectedKit !== null;
      case 4: return creatorState.characterName.trim() !== "";
      default: return false;
    }
  };

  const isValidSkillSelection = () => {
    const adeptSkills = creatorState.selectedSkills.filter(s => s.rank === "Adept");
    const apprenticeSkills = creatorState.selectedSkills.filter(s => s.rank === "Apprentice");
    const maxApprentice = creatorState.selectedStone?.id === "lover" ? 4 : 3;
    
    return adeptSkills.length === 1 && apprenticeSkills.length === maxApprentice;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinishCharacter();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinishCharacter = () => {
    if (!creatorState.selectedRace || !creatorState.selectedStone || !creatorState.selectedKit) return;

    const finalStats = calculateFinalStats(creatorState.selectedStone.baseStats, creatorState.selectedRace);
    
    // Create complete skills array with all 15 skills
    const allSkills: CharacterSkill[] = skills.map(skill => {
      const selectedSkill = creatorState.selectedSkills.find(s => s.skillId === skill.id);
      return selectedSkill || {
        skillId: skill.id,
        rank: "Novice",
        unlockedPerks: []
      };
    });

    const maxHP = calculateMaxHP(finalStats, creatorState.selectedStone, creatorState.selectedRace, allSkills);
    const maxFP = calculateMaxFP(finalStats, creatorState.selectedStone, creatorState.selectedRace, allSkills);
    const totalDR = calculateTotalDR(creatorState.selectedKit.equipment, creatorState.selectedStone);

    const newCharacter: Character = {
      id: `character-${Date.now()}`,
      name: creatorState.characterName,
      ap: 0,
      totalAp: 0,
      race: creatorState.selectedRace,
      standingStone: creatorState.selectedStone,
      stats: finalStats,
      resources: {
        hp: { current: maxHP, max: maxHP },
        fp: { current: maxFP, max: maxFP }
      },
      skills: allSkills,
      equipment: creatorState.selectedKit.equipment,
      inventory: {
        gold: creatorState.selectedKit.gold,
        items: creatorState.selectedKit.items
      },
      progression: {
        combatProwessUnlocked: { adept: false, expert: false, master: false },
        arcaneStudiesUnlocked: { adept: false, expert: false, master: false }
      }
    };

    onCharacterCreated(newCharacter);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <RaceSelection
            races={races}
            selectedRace={creatorState.selectedRace}
            onRaceSelect={(race) => setCreatorState(prev => ({ ...prev, selectedRace: race }))}
          />
        );
      case 1:
        return (
          <StandingStoneSelection
            stones={standingStones}
            selectedStone={creatorState.selectedStone}
            onStoneSelect={(stone) => setCreatorState(prev => ({ ...prev, selectedStone: stone }))}
          />
        );
      case 2:
        return (
          <SkillSelection
            skills={skills}
            selectedSkills={creatorState.selectedSkills}
            maxApprenticeSkills={creatorState.selectedStone?.id === "lover" ? 4 : 3}
            onSkillsChange={(newSkills) => setCreatorState(prev => ({ ...prev, selectedSkills: newSkills }))}
          />
        );
      case 3:
        return (
          <KitSelection
            kits={kits}
            selectedKit={creatorState.selectedKit}
            onKitSelect={(kit) => setCreatorState(prev => ({ ...prev, selectedKit: kit }))}
          />
        );
      case 4:
        return (
          <CharacterFinalization
            characterName={creatorState.characterName}
            onNameChange={(name) => setCreatorState(prev => ({ ...prev, characterName: name }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-background">
        <div className="flex h-[85vh]">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-cinzel text-primary">
                    Step {currentStep + 1} of 5: {STEP_TITLES[currentStep]}
                  </h2>
                  <div className="flex mt-2 space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-12 rounded-full ${
                          i <= currentStep ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-border">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  {currentStep === 4 ? (
                    "Finish Character"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="w-80 border-l border-border bg-card">
            <CreatorSummaryPanel
              race={creatorState.selectedRace}
              stone={creatorState.selectedStone}
              skills={creatorState.selectedSkills}
              kit={creatorState.selectedKit}
              characterName={creatorState.characterName}
              currentStep={currentStep}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
