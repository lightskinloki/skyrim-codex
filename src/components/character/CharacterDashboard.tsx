import { useState } from "react";
import { Character } from "@/types/character";
import { CharacterCard } from "./CharacterCard";
import { StatBlock } from "./StatBlock";
import { ResourceBar } from "./ResourceBar";
import { SkillsDisplay } from "./SkillsDisplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Zap, Sword, Shield, Settings } from "lucide-react";

interface CharacterDashboardProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

export function CharacterDashboard({ character, onUpdateCharacter }: CharacterDashboardProps) {
  const [currentCharacter, setCurrentCharacter] = useState<Character>(character);

  const handleResourceAdjust = (type: 'hp' | 'fp', amount: number) => {
    const updatedCharacter = {
      ...currentCharacter,
      resources: {
        ...currentCharacter.resources,
        [type]: {
          ...currentCharacter.resources[type],
          current: Math.max(0, Math.min(
            currentCharacter.resources[type].max,
            currentCharacter.resources[type].current + amount
          ))
        }
      }
    };
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const handleRest = (type: 'short' | 'long') => {
    const { hp, fp } = currentCharacter.resources;
    
    const updatedResources = type === 'short' 
      ? {
          hp: { ...hp, current: Math.min(hp.max, hp.current + Math.floor(hp.max / 2)) },
          fp: { ...fp, current: Math.min(fp.max, fp.current + Math.floor(fp.max / 2)) }
        }
      : {
          hp: { ...hp, current: hp.max },
          fp: { ...fp, current: fp.max }
        };

    const updatedCharacter = {
      ...currentCharacter,
      resources: updatedResources
    };
    
    setCurrentCharacter(updatedCharacter);
    onUpdateCharacter(updatedCharacter);
  };

  const getCharacterTier = (ap: number) => {
    if (ap >= 120) return 'Legendary';
    if (ap >= 90) return 'Master';
    if (ap >= 60) return 'Expert';
    if (ap >= 30) return 'Adept';
    if (ap >= 10) return 'Apprentice';
    return 'Novice';
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-cinzel font-bold text-primary mb-2">
              Character Sheet
            </h1>
            <Badge variant="secondary" className="text-lg">
              {getCharacterTier(currentCharacter.ap)} Tier
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => handleRest('short')} variant="outline">
              Short Rest
            </Button>
            <Button onClick={() => handleRest('long')} variant="outline">
              Long Rest
            </Button>
            <Button variant="secondary">
              <Settings className="w-4 h-4 mr-2" />
              Advance Character
            </Button>
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Stats & Resources */}
          <div className="space-y-6">
            <CharacterCard character={currentCharacter} />
            
            <StatBlock stats={currentCharacter.stats} />
            
            <ResourceBar
              label="Health Points"
              current={currentCharacter.resources.hp.current}
              max={currentCharacter.resources.hp.max}
              type="health"
              onAdjust={(amount) => handleResourceAdjust('hp', amount)}
            />
            
            <ResourceBar
              label="Fatigue Points"
              current={currentCharacter.resources.fp.current}
              max={currentCharacter.resources.fp.max}
              type="fatigue"
              onAdjust={(amount) => handleResourceAdjust('fp', amount)}
            />
          </div>

          {/* Center Column - Equipment & Inventory */}
          <div className="space-y-6">
            <Card className="p-6 bg-card-secondary">
              <h3 className="font-cinzel font-semibold text-primary mb-4 flex items-center">
                <Sword className="w-5 h-5 mr-2" />
                Equipment
              </h3>
              
              <div className="space-y-3">
                {currentCharacter.equipment.length > 0 ? (
                  currentCharacter.equipment.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                      </div>
                      <div className="text-right">
                        {item.damage && (
                          <p className="text-sm font-bold text-destructive">
                            {item.damage} DMG
                          </p>
                        )}
                        {item.dr && (
                          <p className="text-sm font-bold text-primary">
                            {item.dr} DR
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground italic">No equipment equipped</p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-card-secondary">
              <h3 className="font-cinzel font-semibold text-primary mb-4">
                Inventory
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded">
                  <span className="font-medium">Gold</span>
                  <span className="text-xl font-bold text-primary">
                    {currentCharacter.inventory.gold}
                  </span>
                </div>
                
                {currentCharacter.inventory.items.length > 0 && (
                  <div className="space-y-2">
                    {currentCharacter.inventory.items.map((item, index) => (
                      <div key={index} className="p-2 bg-muted rounded">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Skills */}
          <div className="space-y-6">
            <SkillsDisplay character={currentCharacter} />

            <Card className="p-6 bg-card-secondary">
              <h3 className="font-cinzel font-semibold text-primary mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Combat Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total DR</span>
                  <span className="text-xl font-bold text-primary">
                    {currentCharacter.equipment.reduce((total, item) => total + (item.dr || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Health</span>
                  <span className="text-xl font-bold text-health">
                    {currentCharacter.resources.hp.max}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Max Fatigue</span>
                  <span className="text-xl font-bold text-fatigue">
                    {currentCharacter.resources.fp.max}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}