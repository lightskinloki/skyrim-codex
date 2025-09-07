import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Upload } from "lucide-react";
import { CharacterCreatorModal } from "./CharacterCreatorModal";
import { Character } from "@/types/character";
import { characterStorage } from "@/utils/characterStorage";
import { useToast } from "@/hooks/use-toast";

interface WelcomeScreenProps {
  onCreateNew: (character: Character) => void;
  onLoadCharacter: () => void;
  hasExistingCharacters: boolean;
}

export function WelcomeScreen({ onCreateNew, onLoadCharacter, hasExistingCharacters }: WelcomeScreenProps) {
  const [showCreator, setShowCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCharacterCreated = (character: Character) => {
    onCreateNew(character);
  };

  const handleImportCharacter = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please select a .json file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const characterData = JSON.parse(content);

        // Basic validation
        if (!characterData.name || !characterData.stats || !characterData.race || !characterData.standingStone) {
          throw new Error("Invalid character file format");
        }

        // Ensure the character has an ID
        if (!characterData.id) {
          characterData.id = `imported-${Date.now()}`;
        }

        // Save to localStorage
        characterStorage.saveCharacter(characterData);

        toast({
          title: "Character Imported!",
          description: `${characterData.name} has been added to your character library.`,
        });

        // Navigate to load character screen
        onLoadCharacter();
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid character file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };
  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Card className="p-12 bg-card-secondary text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-cinzel font-bold text-primary mb-4">
              Your Legend Awaits
            </h1>
            <p className="text-xl text-muted-foreground">
              Begin your adventure in the frozen lands of Skyrim, or continue an existing tale of heroism.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setShowCreator(true)}
              size="lg"
              className="w-full h-16 text-lg font-medium"
            >
              <UserPlus className="w-6 h-6 mr-3" />
              Create New Character
            </Button>

            {hasExistingCharacters && (
              <Button
                onClick={onLoadCharacter}
                size="lg"
                variant="outline"
                className="w-full h-16 text-lg font-medium"
              >
                <Users className="w-6 h-6 mr-3" />
                Load Character
              </Button>
            )}

            <Button
              onClick={handleImportCharacter}
              size="lg"
              variant="secondary"
              className="w-full h-16 text-lg font-medium"
            >
              <Upload className="w-6 h-6 mr-3" />
              Import Character
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Skyrim TTRPG Character Manager
            </p>
          </div>
        </Card>
      </div>

      <CharacterCreatorModal
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onCharacterCreated={handleCharacterCreated}
      />
    </div>
  );
}