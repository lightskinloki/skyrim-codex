import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kit } from "@/types/character";
import { Sword, Shield, Coins } from "lucide-react";

interface KitSelectionProps {
  kits: Kit[];
  selectedKit: Kit | null;
  onKitSelect: (kit: Kit) => void;
}

export function KitSelection({ kits, selectedKit, onKitSelect }: KitSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Choose Your Starting Kit
        </h3>
        <p className="text-muted-foreground">
          Your chosen kit provides essential equipment and gold to begin your adventure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {kits.map((kit) => (
          <Card
            key={kit.id}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedKit?.id === kit.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onKitSelect(kit)}
          >
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h4 className="font-cinzel font-semibold text-xl mb-2">
                  {kit.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {kit.description}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Sword className="w-4 h-4" />
                    Equipment
                  </h5>
                  <div className="space-y-1">
                    {kit.equipment.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.damage ? `Dmg ${item.damage}` : item.dr !== undefined ? `DR ${item.dr}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Items
                  </h5>
                  <div className="space-y-1">
                    {kit.items.map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.name} x{item.quantity}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Starting Gold
                    </span>
                    <Badge variant="secondary">
                      {kit.gold} Septims
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}