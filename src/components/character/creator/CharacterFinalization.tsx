import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PortraitConfig } from "@/types/character";
import { CharacterSheetRenderContext } from "@/lib/renderSpecCompiler";
import { FinalRenderPanel } from "../FinalRenderPanel";

interface CharacterFinalizationProps {
  characterName: string;
  onNameChange: (name: string) => void;
  portrait?: PortraitConfig;
  onPortraitChange?: (next: PortraitConfig) => void;
  sheetContext?: CharacterSheetRenderContext;
  fallbackRaceImage?: string;
}

export function CharacterFinalization({
  characterName,
  onNameChange,
  portrait,
  onPortraitChange,
  sheetContext,
  fallbackRaceImage,
}: CharacterFinalizationProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-1">
          Finalize &amp; Render Your Legend
        </h3>
        <p className="text-sm text-muted-foreground">
          Name your character and run the final render pass using your Race, Standing Stone, Skills, Starting Kit, and Stage 1 blueprint.
        </p>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label htmlFor="character-name" className="text-primary font-semibold">
              Character Name
            </Label>
            <Input
              id="character-name"
              value={characterName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter your character's name"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      {portrait && onPortraitChange && (
        <FinalRenderPanel
          portrait={portrait}
          onChange={onPortraitChange}
          sheetContext={sheetContext}
          fallbackRaceImage={fallbackRaceImage}
        />
      )}
    </div>
  );
}
