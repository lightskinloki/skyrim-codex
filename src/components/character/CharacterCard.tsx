import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Character } from "@/types/character";
import { Sparkles } from "lucide-react";
import { CharacterPortraitCanvas } from "./CharacterPortraitCanvas";
import { useStoredPortrait } from "@/lib/portraitStorage";

interface CharacterCardProps {
  character: Character;
  onEditAppearance?: () => void;
}

export function CharacterCard({ character, onEditAppearance }: CharacterCardProps) {
  const renderedDataUrl = useStoredPortrait(
    character.portrait?.renderedPortraitId,
    Boolean(character.portrait?.renderOptions?.usePreRenderOnly)
  );

  return (
    <Card className="p-6 bg-gradient-stone border border-muted hover:shadow-gold transition-smooth">
      <div className="space-y-4">
        <div className="relative mx-auto w-52 aspect-[764/1024] rounded-lg overflow-hidden border border-primary/40 shadow-lg bg-[#0c1d24]">
          {renderedDataUrl ? (
            <img
              src={renderedDataUrl}
              alt={character.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <CharacterPortraitCanvas
              portrait={character.portrait}
              fallbackRaceImage={character.race.image}
              fallbackAlt={character.name}
              className="w-full h-full"
            />
          )}
          {onEditAppearance && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onEditAppearance}
              className="absolute bottom-2 right-2 h-7 px-2.5 text-xs bg-background/85 backdrop-blur-sm border border-primary/40 hover:bg-primary hover:text-primary-foreground"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Face Sculptor
            </Button>
          )}
        </div>

        <div className="text-center border-b border-muted pb-4">
          <h2 className="text-2xl font-cinzel font-bold text-primary">
            {character.name}
          </h2>
          <p className="text-muted-foreground">
            {character.race.name} • {character.standingStone.archetype}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-cinzel font-semibold text-primary">
              Adventure Points
            </h3>
            <p className="text-2xl font-bold">{character.ap}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-cinzel font-semibold text-primary">
              Gold
            </h3>
            <p className="text-2xl font-bold">{character.inventory.gold}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}