import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";
import { CharacterCreatorModal } from "./CharacterCreatorModal";
import { Character } from "@/types/character";

interface WelcomeScreenProps {
  onCreateNew: (character: Character) => void;
  onLoadCharacter: () => void;
  hasExistingCharacters: boolean;
}

export function WelcomeScreen({ onCreateNew, onLoadCharacter, hasExistingCharacters }: WelcomeScreenProps) {
  const [showCreator, setShowCreator] = useState(false);

  const handleCharacterCreated = (character: Character) => {
    onCreateNew(character);
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