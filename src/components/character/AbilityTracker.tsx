import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Character } from "@/types/character";
import { skills } from "@/data/skills";
import { Clock, RefreshCw } from "lucide-react";

interface AbilityTrackerProps {
  character: Character;
  onUpdateCharacter: (character: Character) => void;
}

interface TrackedAbility {
  id: string;
  name: string;
  limitation: 'per combat' | 'per adventure';
  source: string;
  used: boolean;
}

export function AbilityTracker({ character, onUpdateCharacter }: AbilityTrackerProps) {
  const getTrackedAbilities = (): TrackedAbility[] => {
    const abilities: TrackedAbility[] = [];

    // Get racial abilities (all are per adventure)
    abilities.push({
      id: `racial-${character.race.id}`,
      name: character.race.abilityName,
      limitation: 'per adventure',
      source: character.race.name,
      used: character.usedAbilities?.includes(`racial-${character.race.id}`) || false
    });

    // Get standing stone abilities
    const stoneAbility = {
      id: `stone-${character.standingStone.id}`,
      name: character.standingStone.benefitName,
      limitation: getStoneAbilityLimitation(character.standingStone.id),
      source: character.standingStone.name,
      used: character.usedAbilities?.includes(`stone-${character.standingStone.id}`) || false
    };
    abilities.push(stoneAbility);

    // Get perk abilities with limitations
    character.skills.forEach(characterSkill => {
      const skillData = skills.find(s => s.id === characterSkill.skillId);
      if (!skillData) return;

      const unlockedPerks = getUnlockedPerks(characterSkill);
      unlockedPerks.forEach(perk => {
        if (perk.limitation) {
          abilities.push({
            id: `perk-${characterSkill.skillId}-${perk.name}`,
            name: perk.name,
            limitation: perk.limitation,
            source: skillData.name,
            used: character.usedAbilities?.includes(`perk-${characterSkill.skillId}-${perk.name}`) || false
          });
        }
      });
    });

    return abilities;
  };

  const getStoneAbilityLimitation = (stoneId: string): 'per combat' | 'per adventure' => {
    switch (stoneId) {
      case 'warrior': // Adrenaline Rush
      case 'thief': // Fleet Footed
      case 'atronach': // Spell Absorption
      case 'serpent': // Serpent's Kiss
        return 'per combat';
      case 'shadow': // Shadow Form
      case 'tower': // Infiltrator's Edge
      case 'lord': // Knight's Ward re-roll
      case 'ritual': // Ritual Power
        return 'per adventure';
      default:
        return 'per adventure';
    }
  };

  const getUnlockedPerks = (characterSkill: typeof character.skills[0]) => {
    const skillData = skills.find(s => s.id === characterSkill.skillId);
    if (!skillData) return [];

    const tierOrder = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master'];
    const characterTierIndex = tierOrder.indexOf(characterSkill.rank);
    
    return skillData.perks.filter(perk => {
      const perkTierIndex = tierOrder.indexOf(perk.rank);
      return perkTierIndex <= characterTierIndex;
    });
  };

  const toggleAbilityUsed = (abilityId: string) => {
    const usedAbilities = character.usedAbilities || [];
    const newUsedAbilities = usedAbilities.includes(abilityId)
      ? usedAbilities.filter(id => id !== abilityId)
      : [...usedAbilities, abilityId];

    onUpdateCharacter({
      ...character,
      usedAbilities: newUsedAbilities
    });
  };

  const resetAbilities = (limitation: 'per combat' | 'per adventure') => {
    const usedAbilities = character.usedAbilities || [];
    const trackedAbilities = getTrackedAbilities();
    
    const abilitiesToReset = trackedAbilities
      .filter(ability => ability.limitation === limitation)
      .map(ability => ability.id);

    const newUsedAbilities = usedAbilities.filter(id => !abilitiesToReset.includes(id));

    onUpdateCharacter({
      ...character,
      usedAbilities: newUsedAbilities
    });
  };

  const trackedAbilities = getTrackedAbilities();
  const combatAbilities = trackedAbilities.filter(a => a.limitation === 'per combat');
  const adventureAbilities = trackedAbilities.filter(a => a.limitation === 'per adventure');

  return (
    <Card className="p-6 bg-card-secondary">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel font-semibold text-primary flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Limited-Use Abilities
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => resetAbilities('per combat')}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset Combat
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => resetAbilities('per adventure')}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset Adventure
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {combatAbilities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
              ⚔️ Per Combat Abilities
            </h4>
            <div className="space-y-2">
              {combatAbilities.map((ability) => (
                <div key={ability.id} className="flex items-center space-x-3 p-2 bg-muted rounded">
                  <Checkbox
                    checked={ability.used}
                    onCheckedChange={() => toggleAbilityUsed(ability.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ability.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {ability.source}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adventureAbilities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
              🗺️ Per Adventure Abilities
            </h4>
            <div className="space-y-2">
              {adventureAbilities.map((ability) => (
                <div key={ability.id} className="flex items-center space-x-3 p-2 bg-muted rounded">
                  <Checkbox
                    checked={ability.used}
                    onCheckedChange={() => toggleAbilityUsed(ability.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ability.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {ability.source}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {trackedAbilities.length === 0 && (
          <p className="text-muted-foreground italic text-center py-4">
            No limited-use abilities available yet.
          </p>
        )}
      </div>
    </Card>
  );
}