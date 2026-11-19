// Pillar 1 — Campaign Hub: clocks, party status, and the lore web (with the
// "loose threads" candidate list that lets the GM author edges in one click →
// the web grows as a byproduct of use).
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderOpen, RefreshCw, Plus, Minus, Network, Users, Clock, Link2, Download, Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import { characterStorage } from "@/utils/characterStorage";
import { campaignStorage } from "@/utils/campaignStorage";
import { fileSystemManager, FileSystemManager } from "@/utils/FileSystemManager";
import { buildWebFromMount } from "@/utils/LoreWebParser";
import { LoreWebData, CampaignClock, CAMPAIGN_SCHEMA_VERSION } from "@/types/campaign";
import { LoreWebGraph, GraphDatum } from "./LoreWebGraph";

const CLOCK_COLORS = ["#7c1616", "#162e78", "#964600", "#1f6b3a", "#5b21b6"];

export function CampaignHub() {
  const { campaign, update } = useCampaign();
  const { toast } = useToast();
  const [web, setWeb] = useState<LoreWebData | null>(null);
  const [building, setBuilding] = useState(false);
  const [mountedName, setMountedName] = useState<string | null>(null);
  const [newClock, setNewClock] = useState("");
  const party = characterStorage.getCharacterSummaries();

  async function buildNow() {
    // If the campaign already has entities, use them as the registry (so a built
    // campaign rebuilds from any folder). Otherwise the parser discovers a
    // registry.json anywhere under the mounted folder to bootstrap.
    const hasNodes = campaign.nodes.length > 0;
    const registry = hasNodes
      ? campaign.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type, aliases: n.aliases?.length ? n.aliases : [n.name], tags: n.tags }))
      : undefined;
    const annotations = hasNodes
      ? { edges: campaign.edges.map((e) => ({ src: e.src, type: e.type, dst: e.dst, why: e.why })), secrets: campaign.secrets }
      : undefined;

    const { data, meta } = await buildWebFromMount(fileSystemManager, { registry, annotations });
    setWeb(data);
    update((c) => campaignStorage.seedFromLoreWeb(c, data));
    const extra = meta.registriesFound > 1 ? ` · ${meta.registriesFound} registries found, used ${meta.registryPath}` : "";
    toast({
      title: "Lore web built",
      description: `${data.entities.length} entities · ${data.edges.length} edges · ${data.candidates.length} loose threads${extra}.`,
    });
  }

  async function handleBuild() {
    if (!FileSystemManager.isSupported()) {
      toast({ title: "Not supported", description: "Use Chrome, Edge, or Opera to mount a folder.", variant: "destructive" });
      return;
    }
    try {
      setBuilding(true);
      if (!fileSystemManager.mounted) await fileSystemManager.mountDirectory();
      setMountedName(fileSystemManager.folderName || null);
      await buildNow();
    } catch (e: any) {
      toast({ title: "Build failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBuilding(false);
    }
  }

  async function handleChangeFolder() {
    if (!FileSystemManager.isSupported()) {
      toast({ title: "Not supported", description: "Use Chrome, Edge, or Opera to mount a folder.", variant: "destructive" });
      return;
    }
    try {
      setBuilding(true);
      fileSystemManager.unmount();
      await fileSystemManager.mountDirectory();
      setMountedName(fileSystemManager.folderName || null);
      await buildNow();
    } catch (e: any) {
      toast({ title: "Mount failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setBuilding(false);
    }
  }

  function handleUnmount() {
    fileSystemManager.unmount();
    setMountedName(null);
    toast({ title: "Folder released", description: "Mount a folder to build again." });
  }

  function handleUnload() {
    if (!window.confirm("Unload the lore web? This clears the on-screen graph and the imported nodes + edges from this campaign (modules and clocks are kept).")) return;
    setWeb(null);
    update((c) => ({ ...c, nodes: [], edges: [] }));
    toast({ title: "Web unloaded" });
  }

  // The graph renders the freshly built web when available, else the persisted
  // campaign graph (nodes + authored edges) — so it shows even before a rebuild.
  const graphData: GraphDatum = useMemo(() => {
    if (web) {
      return {
        entities: web.entities,
        edges: web.edges.map((e) => ({ src: e.src, type: e.type, dst: e.dst, why: e.why })),
        cooc: web.cooc,
        candidates: web.candidates,
        mentions: web.mentions,
        built: web.built,
      };
    }
    return {
      entities: campaign.nodes.map((n) => ({ id: n.id, name: n.name, type: n.type, tags: n.tags })),
      edges: campaign.edges.map((e) => ({ src: e.src, type: e.type, dst: e.dst, why: e.why })),
      cooc: [],
      candidates: [],
    };
  }, [web, campaign.nodes, campaign.edges]);

  function authorEdgeByIds(a: string, b: string) {
    const why = window.prompt(`Why are ${a} and ${b} connected? (one line)`);
    if (!why) return;
    const type = window.prompt("Edge type (e.g. knows, allied-with, infected):", "related-to") || "related-to";
    update((camp) => ({
      ...camp,
      edges: [...camp.edges, { id: crypto.randomUUID(), src: a, type, dst: b, why, schemaVersion: CAMPAIGN_SCHEMA_VERSION }],
    }));
    // reflect it in the live web immediately: new gold line, thread removed
    setWeb((w) =>
      w ? { ...w, edges: [...w.edges, { src: a, type, dst: b, why }], candidates: w.candidates.filter((x) => !(x.a === a && x.b === b)) } : w
    );
    toast({ title: "Edge authored", description: `${a} → ${type} → ${b}` });
  }

  function addClock() {
    if (!newClock.trim()) return;
    const clock: CampaignClock = {
      id: crypto.randomUUID(),
      name: newClock.trim(),
      maxSegments: 6,
      currentSegments: 0,
      color: CLOCK_COLORS[campaign.clocks.length % CLOCK_COLORS.length],
    };
    update((c) => ({ ...c, clocks: [...c.clocks, clock] }));
    setNewClock("");
  }

  function tickClock(id: string, delta: number) {
    update((c) => ({
      ...c,
      clocks: c.clocks.map((cl) =>
        cl.id === id
          ? { ...cl, currentSegments: Math.max(0, Math.min(cl.maxSegments, cl.currentSegments + delta)) }
          : cl
      ),
    }));
  }

  function removeClock(id: string) {
    update((c) => ({ ...c, clocks: c.clocks.filter((cl) => cl.id !== id) }));
  }

  function exportCampaign() {
    const blob = new Blob([campaignStorage.exportToJSON(campaign)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}.campaign.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importCampaign(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const imported = campaignStorage.importFromJSON(text);
        update(() => imported);
        toast({ title: "Campaign imported", description: imported.name });
      } catch {
        toast({ title: "Import failed", description: "Invalid campaign file.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header / campaign identity */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={campaign.name}
            onChange={(e) => update((c) => ({ ...c, name: e.target.value }))}
            className="max-w-xs font-cinzel text-lg"
          />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{campaign.nodes.length} nodes</Badge>
            <Badge variant="outline">{campaign.edges.length} edges</Badge>
            <Badge variant="outline">{campaign.modules.length} modules</Badge>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCampaign}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <label>
              <input type="file" accept="application/json" className="hidden" onChange={importCampaign} />
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="h-4 w-4 mr-1" /> Import</span>
              </Button>
            </label>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clocks */}
        <Card className="p-4">
          <h3 className="font-cinzel font-bold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Campaign Clocks
          </h3>
          <div className="space-y-3">
            {campaign.clocks.length === 0 && (
              <p className="text-sm text-muted-foreground">No clocks yet — add the ticking threats (Gate-3, CDI, Strain 2.0…).</p>
            )}
            {campaign.clocks.map((cl) => (
              <div key={cl.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cl.name}</span>
                    <span className="text-xs text-muted-foreground">{cl.currentSegments}/{cl.maxSegments}</span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: cl.maxSegments }).map((_, i) => (
                      <div
                        key={i}
                        className="h-3 flex-1 rounded-sm border"
                        style={{ background: i < cl.currentSegments ? cl.color : "transparent", borderColor: cl.color }}
                      />
                    ))}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => tickClock(cl.id, -1)}><Minus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => tickClock(cl.id, 1)}><Plus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeClock(cl.id)}>×</Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input value={newClock} onChange={(e) => setNewClock(e.target.value)} placeholder="New clock name" onKeyDown={(e) => e.key === "Enter" && addClock()} />
              <Button size="sm" onClick={addClock}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>

        {/* Party */}
        <Card className="p-4">
          <h3 className="font-cinzel font-bold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" /> Party ({party.length})
          </h3>
          {party.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved characters. Players create them in Player Mode; they appear here.</p>
          ) : (
            <div className="space-y-2">
              {party.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b pb-1">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.race} · {p.level}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Lore web — the visual graph (display controls + folder management live in the panel) */}
      <Card className="p-4">
        <h3 className="font-cinzel font-bold mb-3 flex items-center gap-2">
          <Network className="h-5 w-5" /> Lore Web
          {graphData.entities.length > 0 && (
            <Badge variant="secondary" className="ml-2">{graphData.entities.length} nodes · {graphData.edges.length} edges{web ? ` · ${web.candidates.length} threads` : ""}</Badge>
          )}
        </h3>
        <LoreWebGraph
          data={graphData}
          onAuthorEdge={authorEdgeByIds}
          management={{
            supported: FileSystemManager.isSupported(),
            mountedName,
            building,
            onBuild: handleBuild,
            onChangeFolder: handleChangeFolder,
            onUnmount: handleUnmount,
            onUnload: handleUnload,
          }}
        />
      </Card>
    </div>
  );
}
