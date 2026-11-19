// The combat tracker, extracted from the old GMDashboard so it can be hosted as
// a pillar tab AND launched from Live Play's "Deploy Encounter". Combat state is
// lifted to the GMDashboard shell and passed in, so deploying enemies from a
// scene flows straight into this view.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Play, Square, SkipForward, Undo2, ChevronDown, ChevronUp,
  Users, Sparkles, ListOrdered, Swords,
} from "lucide-react";
import { GMCombatTracker } from "./GMCombatTracker";
import { DamageCalculator } from "./DamageCalculator";
import { EnemyManager } from "./EnemyManager";
import { InitiativeEditor } from "./InitiativeEditor";
import { EffectApplicator } from "./EffectApplicator";
import { CombatLog } from "./CombatLog";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { PlayerCards } from "./PlayerCards";
import { RollFeed } from "./RollFeed";
import { useTable } from "./TableContext";

interface CombatViewProps {
  combatState: CombatState;
  onUpdateState: (state: CombatState | ((prev: CombatState) => CombatState)) => void;
}

export function CombatView({ combatState, onUpdateState }: CombatViewProps) {
  const [logOpen, setLogOpen] = useState(true);
  const { members, announceFight } = useTable();

  const currentCombatant = combatState.combatants.find(
    (c) => c.id === combatState.currentTurnCombatantId
  );

  // Start Combat is the GM's one declaration. Everyone at the table who is not
  // already in the fight steps in from their live sheet, at the HP they have
  // right now, and every seat is told to open Combat Mode
  // (docs/SESSION-2026-11-09-PLAYTEST.md, S2).
  const joinedCharacterIds = new Set(
    combatState.combatants.map((c) => c.characterId).filter((id): id is string => !!id)
  );
  const joining = members.filter((m) => m.connected && !joinedCharacterIds.has(m.character.id));
  const canStart = combatState.combatants.length > 0 || joining.length > 0;

  const startFight = () => {
    onUpdateState((prev) => {
      let next = prev;
      for (const member of joining) {
        next = combatManager.addCombatant(
          next,
          combatManager.createCombatantFromCharacter(member.character)
        );
      }
      return combatManager.startCombat(next);
    });
    announceFight("start", { round: 1, title: "Combat" });
  };

  const endFight = () => {
    onUpdateState((prev) => combatManager.endCombat(prev));
    announceFight("end");
  };

  return (
    <div className="flex flex-col">
      {/* Status row */}
      <div className="flex items-center justify-end gap-3 pb-3">
        {combatState.active && (
          <>
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              Round {combatState.round}
            </Badge>
            {currentCombatant && (
              <Badge variant="secondary">Current: {currentCombatant.name}</Badge>
            )}
          </>
        )}
        <Badge variant={combatState.active ? "default" : "secondary"}>
          {combatState.active ? "Combat Active" : "Out of Combat"}
        </Badge>
      </div>

      {/* Control Bar */}
      <div className="border-y bg-muted/30 py-3 mb-4">
        <div className="flex items-center justify-center gap-4">
          {!combatState.active ? (
            <Button
              onClick={startFight}
              disabled={!canStart}
              className="bg-green-600 hover:bg-green-700"
              title={joining.length > 0 ? `Adds ${joining.length} joined player${joining.length === 1 ? "" : "s"} and starts` : undefined}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Combat{joining.length > 0 ? ` (+${joining.length})` : ""}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onUpdateState((prev) => combatManager.nextTurn(prev))}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 px-8"
              >
                <SkipForward className="h-5 w-5 mr-2" />
                Next Turn
              </Button>
              <Button onClick={endFight} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                End Combat
              </Button>
            </>
          )}
          <Button
            onClick={() => onUpdateState((prev) => combatManager.undo(prev) ?? prev)}
            variant="outline"
            disabled={combatState.history.length === 0}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo ({combatState.history.length})
          </Button>
        </div>
      </div>

      {/* Outcomes the players have already rolled */}
      <RollFeed combatState={combatState} onUpdateState={onUpdateState} />

      {/* Every joined player's sheet, live */}
      <PlayerCards combatState={combatState} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 overflow-hidden flex flex-col">
          <h2 className="font-cinzel text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Combat Tracker
          </h2>
          <div className="flex-1 overflow-auto">
            <GMCombatTracker combatState={combatState} onUpdateState={onUpdateState} />
          </div>
        </Card>

        <Card className="p-4 overflow-hidden flex flex-col">
          <Tabs defaultValue="enemies" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="enemies" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Enemies</span>
              </TabsTrigger>
              <TabsTrigger value="effects" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Effects</span>
              </TabsTrigger>
              <TabsTrigger value="initiative" className="flex items-center gap-1">
                <ListOrdered className="h-4 w-4" />
                <span className="hidden sm:inline">Initiative</span>
              </TabsTrigger>
              <TabsTrigger value="damage" className="flex items-center gap-1">
                <Swords className="h-4 w-4" />
                <span className="hidden sm:inline">Damage</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="enemies" className="flex-1 overflow-auto mt-4">
              <EnemyManager combatState={combatState} onUpdateState={onUpdateState} />
            </TabsContent>
            <TabsContent value="effects" className="flex-1 overflow-auto mt-4">
              <EffectApplicator combatState={combatState} onUpdateState={onUpdateState} />
            </TabsContent>
            <TabsContent value="initiative" className="flex-1 overflow-auto mt-4">
              <InitiativeEditor combatState={combatState} onUpdateState={onUpdateState} />
            </TabsContent>
            <TabsContent value="damage" className="flex-1 overflow-auto mt-4">
              <DamageCalculator combatState={combatState} onUpdateState={onUpdateState} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Combat Log */}
      <div className="border-t bg-card/50 mt-4">
        <Collapsible open={logOpen} onOpenChange={setLogOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full py-2 flex items-center justify-center gap-2">
              {logOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              Combat Log ({combatState.log.length} entries)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pb-4">
              <CombatLog combatState={combatState} onUpdateState={onUpdateState} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
