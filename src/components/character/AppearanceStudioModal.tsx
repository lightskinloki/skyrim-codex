import { useEffect, useState } from "react";
import { Character, PortraitConfig } from "@/types/character";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, X } from "lucide-react";
import { AppearanceStudio } from "./AppearanceStudio";

interface AppearanceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onSavePortrait: (portrait: PortraitConfig) => void;
}

export function AppearanceStudioModal({
  isOpen,
  onClose,
  character,
  onSavePortrait,
}: AppearanceStudioModalProps) {
  const [draft, setDraft] = useState<PortraitConfig | undefined>(character.portrait);

  useEffect(() => {
    if (isOpen) {
      setDraft(character.portrait);
    }
  }, [isOpen, character.portrait]);

  const handleSave = () => {
    if (!draft) return;
    onSavePortrait(draft);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl text-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Riften Face Sculptor &amp; Wardrobe — {character.name}
          </DialogTitle>
        </DialogHeader>

        <AppearanceStudio
          value={draft}
          raceId={character.race.id}
          onChange={setDraft}
          allowSkeletonSwitch={true}
          compactHeader={true}
          sheetContext={{
            name: character.name,
            race: character.race,
            standingStone: character.standingStone,
            skills: character.skills,
            equipment: character.equipment,
            customAbilities: character.customAbilities,
          }}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1.5" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!draft}>
            <Check className="w-4 h-4 mr-1.5" />
            Save Appearance Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
