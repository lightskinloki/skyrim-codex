// GM Campaign Suite shell — the 4 pillars (Hub / Forge / Live Play / Compendium)
// plus the combat tracker, which is now a sub-view launched from Live Play's
// "Deploy Encounter" as well as its own tab. Combat state is lifted here so a
// scene's enemies flow straight into the tracker.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutDashboard, Hammer, Play, Swords, BookOpen, Scroll, FlaskConical } from "lucide-react";
import { CombatState } from "@/types/combat";
import { combatManager } from "@/lib/combatManager";
import { enemyTemplates } from "@/data/enemies";
import { CampaignProvider } from "./CampaignContext";
import { TableProvider } from "./TableContext";
import { CampaignHub } from "./hub/CampaignHub";
import { ModuleBuilder } from "./builder/ModuleBuilder";
import { LivePlay } from "./play/LivePlay";
import { CombatView } from "./CombatView";
import { UniversalCompendium } from "./compendium/UniversalCompendium";
import { AlchemyWorkbench } from "./alchemy/AlchemyWorkbench";
import { TableBadge } from "./TableBadge";
import { useTable } from "./TableContext";

interface GMDashboardProps {
  onExit: () => void;
}

function GMDashboardInner({ onExit }: GMDashboardProps) {
  const [combatState, setCombatState] = useState<CombatState>(combatManager.initializeCombat());
  const [activeTab, setActiveTab] = useState("hub");
  const [liveModuleId, setLiveModuleId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { members, editCharacter, publishRoster } = useTable();
  const lastRoster = useRef("");
  const membersRef = useRef(members);
  membersRef.current = members;
  const lastCombat = useRef(combatState);

  // A player's sheet and their combatant are one number, not two. The sheet
  // wins the first direction: anything a player does to themselves on their
  // own screen lands on the tracker without the GM copying it across.
  useEffect(() => {
    setCombatState((prev) => {
      let next = prev;
      for (const member of members) {
        const combatant = prev.combatants.find((c) => c.characterId === member.character.id);
        if (!combatant) continue;
        const hp = member.character.resources.hp;
        const fp = member.character.resources.fp;
        if (
          combatant.hp.current === hp.current &&
          combatant.hp.max === hp.max &&
          combatant.fp.current === fp.current &&
          combatant.fp.max === fp.max
        ) continue;
        next = combatManager.updateCombatant(next, combatant.id, {
          hp: { ...hp },
          fp: { ...fp },
          isDead: hp.current <= 0,
        });
      }
      return next;
    });
  }, [members]);

  // Keep the players' list of what is on the board current. Concealed enemies
  // are simply not in it; there is no "something is there" placeholder to leak.
  useEffect(() => {
    const visible = combatState.combatants
      .filter((c) => c.type === "enemy" && !c.isDead && !c.concealed)
      .map((c) => ({ id: c.id, name: c.name }));
    const key = JSON.stringify(visible);
    if (key === lastRoster.current) return;
    lastRoster.current = key;
    publishRoster(visible);
  }, [combatState.combatants, publishRoster]);

  // A brace the player reported becomes a status effect on their combatant, so
  // the tracker's own damage path subtracts it once and then spends it. The
  // player card shows the same number, for hits applied there instead.
  useEffect(() => {
    setCombatState((prev) => {
      let next = prev;
      for (const member of members) {
        const combatant = prev.combatants.find((c) => c.characterId === member.character.id);
        if (!combatant) continue;
        const held = combatant.statusEffects.find((e) => e.type === 'bracing');
        const want = member.brace?.bonus ?? 0;
        if (want > 0 && held?.bonusValue !== want) {
          if (held) next = combatManager.removeStatusEffect(next, combatant.id, held.id);
          next = combatManager.addStatusEffect(next, combatant.id, 'bracing', 1, 'Brace', undefined, want);
        } else if (want === 0 && held) {
          next = combatManager.removeStatusEffect(next, combatant.id, held.id);
        }
      }
      return next;
    });
  }, [members]);

  // The other direction: a GM's damage or heal on the tracker writes back to
  // the player's sheet. Only a combatant whose HP actually moved in this
  // update is written, so unrelated tracker changes never touch a sheet.
  useEffect(() => {
    const before = lastCombat.current;
    lastCombat.current = combatState;
    for (const combatant of combatState.combatants) {
      if (!combatant.characterId) continue;
      const previous = before.combatants.find((c) => c.id === combatant.id);
      if (!previous) continue;
      if (
        previous.hp.current === combatant.hp.current &&
        previous.fp.current === combatant.fp.current
      ) continue;
      const member = membersRef.current.find((m) => m.character.id === combatant.characterId);
      if (!member) continue;
      if (
        member.character.resources.hp.current === combatant.hp.current &&
        member.character.resources.fp.current === combatant.fp.current
      ) continue;
      editCharacter(member.peerId, (character) => ({
        ...character,
        resources: {
          ...character.resources,
          hp: {
            ...character.resources.hp,
            current: Math.max(0, Math.min(character.resources.hp.max, combatant.hp.current)),
          },
          fp: {
            ...character.resources.fp,
            current: Math.max(0, Math.min(character.resources.fp.max, combatant.fp.current)),
          },
        },
      }));
    }
  }, [combatState, editCharacter]);

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
          <div className="flex items-center gap-2">
            {combatState.active && (
              <Badge variant="outline" className="text-amber-500 border-amber-500">Combat · Round {combatState.round}</Badge>
            )}
            <TableBadge />
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-6">
            <TabsTrigger value="hub"><LayoutDashboard className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Hub</span></TabsTrigger>
            <TabsTrigger value="forge"><Hammer className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Forge</span></TabsTrigger>
            <TabsTrigger value="live"><Play className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Live Play</span></TabsTrigger>
            <TabsTrigger value="combat"><Swords className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Combat</span></TabsTrigger>
            <TabsTrigger value="compendium"><BookOpen className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Compendium</span></TabsTrigger>
            <TabsTrigger value="alchemy"><FlaskConical className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Alchemy</span></TabsTrigger>
          </TabsList>

          <TabsContent value="hub" className="mt-4"><CampaignHub /></TabsContent>
          {/* forceMount: leaving the Forge to peek at Live Play must not throw away what someone is in the middle of writing */}
          <TabsContent value="forge" forceMount className="mt-4 data-[state=inactive]:hidden">
            <ModuleBuilder onRunModule={(id) => { setLiveModuleId(id); setActiveTab("live"); }} />
          </TabsContent>
          <TabsContent value="live" className="mt-4"><LivePlay key={liveModuleId ?? "none"} initialModuleId={liveModuleId} onDeployEncounter={handleDeployEncounter} /></TabsContent>
          <TabsContent value="combat" className="mt-4"><CombatView combatState={combatState} onUpdateState={setCombatState} /></TabsContent>
          <TabsContent value="compendium" className="mt-4"><UniversalCompendium searchInputRef={searchRef} /></TabsContent>
          <TabsContent value="alchemy" className="mt-4"><AlchemyWorkbench /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function GMDashboard({ onExit }: GMDashboardProps) {
  return (
    <CampaignProvider>
      <TableProvider>
        <GMDashboardInner onExit={onExit} />
      </TableProvider>
    </CampaignProvider>
  );
}
