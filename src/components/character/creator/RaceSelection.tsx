import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Race } from "@/types/character";

interface RaceSelectionProps {
  races: Race[];
  selectedRace: Race | null;
  onRaceSelect: (race: Race) => void;
}

export function RaceSelection({ races, selectedRace, onRaceSelect }: RaceSelectionProps) {
  const getStatDisplay = (bonus: string) => {
    const statNames: Record<string, string> = {
      might: "Might",
      agility: "Agility", 
      magic: "Magic",
      guile: "Guile"
    };
    return statNames[bonus] || bonus;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Choose Your Heritage
        </h3>
        <p className="text-muted-foreground">
          Your race determines your innate talents and unique abilities.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {races.map((race) => (
          <Card
            key={race.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedRace?.id === race.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onRaceSelect(race)}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <h4 className="font-cinzel font-semibold text-lg mb-2">
                  {race.name}
                </h4>
                <Badge variant="secondary" className="mb-3">
                  +1 {getStatDisplay(race.bonus)}
                </Badge>
              </div>

              {selectedRace?.id === race.id && race.image && (
                <div className="mt-4 space-y-3">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-primary">
                    <img 
                      src={`/images/races/${race.image}`}
                      alt={race.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded border-l-4 border-primary">
                    <h5 className="font-semibold text-primary mb-1">
                      {race.abilityName}
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      {race.abilityDescription}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
