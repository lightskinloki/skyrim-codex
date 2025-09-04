import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StandingStone } from "@/types/character";

interface StandingStoneSelectionProps {
  stones: StandingStone[];
  selectedStone: StandingStone | null;
  onStoneSelect: (stone: StandingStone) => void;
}

export function StandingStoneSelection({ stones, selectedStone, onStoneSelect }: StandingStoneSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Choose Your Constellation
        </h3>
        <p className="text-muted-foreground">
          The stars under which you were born shape your destiny and core abilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {stones.map((stone) => (
          <Card
            key={stone.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedStone?.id === stone.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onStoneSelect(stone)}
          >
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <h4 className="font-cinzel font-semibold text-lg">
                  {stone.name}
                </h4>
                <Badge variant="outline" className="mt-1">
                  {stone.archetype}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center">
                  <span className="text-muted-foreground">Might</span>
                  <div className="font-semibold">{stone.baseStats.might}</div>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground">Agility</span>
                  <div className="font-semibold">{stone.baseStats.agility}</div>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground">Magic</span>
                  <div className="font-semibold">{stone.baseStats.magic}</div>
                </div>
                <div className="text-center">
                  <span className="text-muted-foreground">Guile</span>
                  <div className="font-semibold">{stone.baseStats.guile}</div>
                </div>
              </div>

              {selectedStone?.id === stone.id && (
                <div className="mt-4 p-3 bg-muted/30 rounded border-l-4 border-primary">
                  <h5 className="font-semibold text-primary mb-1">
                    {stone.benefitName}
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {stone.benefitDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}