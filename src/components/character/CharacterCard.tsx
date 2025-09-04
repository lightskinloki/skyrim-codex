import { Card } from "@/components/ui/card";
import { Character } from "@/types/character";

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Card className="p-6 bg-gradient-stone border border-muted hover:shadow-gold transition-smooth">
      <div className="space-y-4">
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