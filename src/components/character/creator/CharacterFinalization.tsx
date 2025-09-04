import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface CharacterFinalizationProps {
  characterName: string;
  onNameChange: (name: string) => void;
}

export function CharacterFinalization({ characterName, onNameChange }: CharacterFinalizationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Finalize Your Legend
        </h3>
        <p className="text-muted-foreground">
          Give your character a name and review their final attributes.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="character-name" className="text-primary font-semibold">
                Character Name
              </Label>
              <Input
                id="character-name"
                value={characterName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Enter your character's name"
                className="mt-2"
                autoFocus
              />
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Review your character's details in the summary panel to the right.
              When you're ready, click "Finish Character" to begin your adventure!
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}