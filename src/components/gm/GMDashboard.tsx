// GM Campaign Suite shell — the 4 pillars (Hub / Forge / Live Play / Compendium)
// plus the combat tracker, which is now a sub-view launched from Live Play's
// "Deploy Encounter" as well as its own tab. Combat state is lifted here so a
// scene's enemies flow straight into the tracker.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutDashboard, Hammer, Play, Swords, BookOpen, Scroll } from "lucide-react";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { enemyTemplates } from "@/data/enemies";
import { CampaignProvider } from "./CampaignContext";
import { CampaignHub } from "./hub/CampaignHub";
import { ModuleBuilder } from "./builder/ModuleBuilder";
import { LivePlay } from "./play/LivePlay";
import { CombatView } from "./CombatView";
import { UniversalCompendium } from "./compendium/UniversalCompendium";

interface GMDashboardProps {
  onExit: () => void;
}

function GMDashboardInner({ onExit }: GMDashboardProps) {
  const [combatState, setCombatState] = useState<CombatState>(combatManager.initializeCombat());
  const [activeTab, setActiveTab] = useState("hub");
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K → jump to the compendium and focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveTab("compendium");
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleDeployEncounter(enemyIds: string[]) {
    setCombatState((prev) => {
      let next = prev;
      for (const id of enemyIds) {
        const template = enemyTemplates.find((e) => e.id === id);
        if (template) next = combatManager.addCombatant(next, combatManager.createCombatantFromEnemy(template));
      }
      return next;
    });
    setActiveTab("combat");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onExit}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Exit GM Mode
            </Button>
            <div className="flex items-center gap-2">
              <Scroll className="h-5 w-5 text-primary" />
              <h1 className="font-cinzel text-xl font-bold">GM Campaign Suite</h1>
            </div>
          </div>
          {combatState.active && (
            <Badge variant="outline" className="text-amber-500 border-amber-500">Combat · Round {combatState.round}</Badge>
          )}
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5">
            <TabsTrigger value="hub"><LayoutDashboard className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Hub</span></TabsTrigger>
            <TabsTrigger value="forge"><Hammer className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Forge</span></TabsTrigger>
            <TabsTrigger value="live"><Play className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Live Play</span></TabsTrigger>
            <TabsTrigger value="combat"><Swords className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Combat</span></TabsTrigger>
            <TabsTrigger value="compendium"><BookOpen className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Compendium</span></TabsTrigger>
          </TabsList>

          <TabsContent value="hub" className="mt-4"><CampaignHub /></TabsContent>
          <TabsContent value="forge" className="mt-4"><ModuleBuilder /></TabsContent>
          <TabsContent value="live" className="mt-4"><LivePlay onDeployEncounter={handleDeployEncounter} /></TabsContent>
          <TabsContent value="combat" className="mt-4"><CombatView combatState={combatState} onUpdateState={setCombatState} /></TabsContent>
          <TabsContent value="compendium" className="mt-4"><UniversalCompendium searchInputRef={searchRef} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function GMDashboard({ onExit }: GMDashboardProps) {
  return (
    <CampaignProvider>
      <GMDashboardInner onExit={onExit} />
    </CampaignProvider>
  );
}
