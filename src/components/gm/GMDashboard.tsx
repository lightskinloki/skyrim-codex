import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Swords, 
  ArrowLeft, 
  Play, 
  Square, 
  SkipForward, 
  Undo2, 
  ChevronDown,
  ChevronUp,
  Users,
  Sparkles,
  ListOrdered
} from "lucide-react";
import { GMCombatTracker } from "./GMCombatTracker";
import { EnemyManager } from "./EnemyManager";
import { InitiativeEditor } from "./InitiativeEditor";
import { EffectApplicator } from "./EffectApplicator";
import { CombatLog } from "./CombatLog";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";

interface GMDashboardProps {
  onExit: () => void;
}

export function GMDashboard({ onExit }: GMDashboardProps) {
  const [combatState, setCombatState] = useState<CombatState>(combatManager.initializeCombat());
  const [logOpen, setLogOpen] = useState(true);

  const handleStartCombat = () => {
    setCombatState(prev => combatManager.startCombat(prev));
  };

  const handleEndCombat = () => {
    setCombatState(prev => combatManager.endCombat(prev));
  };

  const handleNextTurn = () => {
    setCombatState(prev => combatManager.nextTurn(prev));
  };

  const handleUndo = () => {
    setCombatState(prev => combatManager.undo(prev));
  };

  const currentCombatant = combatState.combatants.find(
    c => c.id === combatState.currentTurnCombatantId
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onExit}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit GM Mode
              </Button>
              <div className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                <h1 className="font-cinzel text-xl font-bold">GM Control Panel</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {combatState.active && (
                <>
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    Round {combatState.round}
                  </Badge>
                  {currentCombatant && (
                    <Badge variant="secondary">
                      Current: {currentCombatant.name}
                    </Badge>
                  )}
                </>
              )}
              <Badge variant={combatState.active ? "default" : "secondary"}>
                {combatState.active ? "Combat Active" : "Out of Combat"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="border-b bg-muted/30 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            {!combatState.active ? (
              <Button 
                onClick={handleStartCombat}
                disabled={combatState.combatants.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Combat
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleNextTurn}
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 px-8"
                >
                  <SkipForward className="h-5 w-5 mr-2" />
                  Next Turn
                </Button>
                <Button 
                  onClick={handleEndCombat}
                  variant="destructive"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Combat
                </Button>
              </>
            )}
            <Button
              onClick={handleUndo}
              variant="outline"
              disabled={combatState.history.length === 0}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Undo ({combatState.history.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left Panel - Combat Tracker */}
          <Card className="p-4 overflow-hidden flex flex-col">
            <h2 className="font-cinzel text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Combat Tracker
            </h2>
            <div className="flex-1 overflow-auto">
              <GMCombatTracker 
                combatState={combatState}
                onUpdateState={setCombatState}
              />
            </div>
          </Card>

          {/* Right Panel - Tabbed Interface */}
          <Card className="p-4 overflow-hidden flex flex-col">
            <Tabs defaultValue="enemies" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
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
              </TabsList>
              <TabsContent value="enemies" className="flex-1 overflow-auto mt-4">
                <EnemyManager 
                  combatState={combatState}
                  onUpdateState={setCombatState}
                />
              </TabsContent>
              <TabsContent value="effects" className="flex-1 overflow-auto mt-4">
                <EffectApplicator 
                  combatState={combatState}
                  onUpdateState={setCombatState}
                />
              </TabsContent>
              <TabsContent value="initiative" className="flex-1 overflow-auto mt-4">
                <InitiativeEditor 
                  combatState={combatState}
                  onUpdateState={setCombatState}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Bottom Panel - Combat Log */}
      <div className="border-t bg-card/50">
        <Collapsible open={logOpen} onOpenChange={setLogOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full py-2 flex items-center justify-center gap-2">
              {logOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              Combat Log ({combatState.log.length} entries)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="container mx-auto px-4 pb-4">
              <CombatLog 
                combatState={combatState}
                onUpdateState={setCombatState}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
