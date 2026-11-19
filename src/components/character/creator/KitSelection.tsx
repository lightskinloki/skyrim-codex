import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kit } from "@/types/character";
import { Sword, Shield, Coins, Backpack } from "lucide-react";
import { kitArtPath } from "@/characters/creatorArt";
import { CreatorPlate } from "./CreatorPlate";

interface KitSelectionProps {
  kits: Kit[];
  selectedKit: Kit | null;
  onKitSelect: (kit: Kit) => void;
}

export function KitSelection({ kits, selectedKit, onKitSelect }: KitSelectionProps) {
  const hasHouseKits = kits.some(kit => kit.house);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-cinzel text-foreground mb-2">
          Choose Your Starting Kit
        </h3>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          One kit, chosen for the character you just built. Hybrids are here too, so a spellsword
          or a nightblade does not have to start as a worse version of a pure build.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {kits.map((kit) => (
          <Card
            key={kit.id}
            className={`cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
              selectedKit?.id === kit.id
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => onKitSelect(kit)}
          >
            <CreatorPlate
              src={kitArtPath(kit.id)}
              alt={`${kit.name} artwork`}
              className="aspect-[16/9]"
            />

            <CardContent className="space-y-4 p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-cinzel font-semibold text-xl">
                    {kit.name}
                  </h4>
                  {kit.house && (
                    <Badge variant="outline" className="shrink-0 text-[10px] uppercase tracking-wide">
                      House kit
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {kit.description}
                </p>
              </div>

              <div>
                <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Sword className="w-4 h-4" />
                  Equipment
                </h5>
                <div className="space-y-1">
                  {kit.equipment.map((item, index) => (
                    <div key={index} className="flex justify-between gap-2 text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.damage !== undefined ? `Dmg ${item.damage}` : item.dr !== undefined ? `DR ${item.dr}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Backpack className="w-4 h-4" />
                  Pack
                </h5>
                <div className="space-y-1">
                  {kit.items.map((item, index) => (
                    <div key={index} className="flex justify-between gap-2 text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Coins className="w-4 h-4" />
                  Starting Gold
                </span>
                <Badge variant="secondary">
                  {kit.gold} Septims
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasHouseKits && (
        <p className="mx-auto max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
          <Shield className="mr-1 inline w-3 h-3 align-[-1px]" />
          House kits are assembled only from gear in the printed equipment table — an option for hybrid
          characters, not a rule. The three kits without the label are the book's own.
        </p>
      )}
    </div>
  );
}
