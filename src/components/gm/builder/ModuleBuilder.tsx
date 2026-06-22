// Pillar 2 — The Forge: author a module in markdown using the session-sheet
// vocabulary; compile it to structured scenes; lint it; and harvest inline
// @web: edges into the campaign graph (the web builds itself as you write).
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Hammer, Save, Link2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import { compileModule, CompileResult } from "@/utils/moduleCompiler";
import { CAMPAIGN_SCHEMA_VERSION } from "@/types/campaign";

const STARTER = `# 1  THE LAB, MID-FIGHT — ROLL INITIATIVE
SUBTITLE: The guards deploy. Goal: clear the room and recover the phylactery.

>> READ ALOUD
The heat off the dais is plain on your face. Something in the wall alcoves is
stepping free of the stone, joints grinding.

GM: The trap half-failed; the cage is jacked up on Alfonso's ice.

ENEMIES: false_draugr, false_draugr

- Cold and lightning stop their regen; fire does nothing.
- **Hard Might (-4)** to crack the ice and pull the rapier free.

@web: saijah | bears | rapier | She carries Alfonso's blade.

EXIT -> The long climb down -> 2  THE OPEN SARCOPHAGUS

# 2  THE OPEN SARCOPHAGUS
SUBTITLE: The first room a real villain occupied.

>> READ ALOUD
The lid leans against the stone, a handprint sunk to the second knuckle.

- **Standard Magic** to read the death-sleep runes: shut off from inside.

EXIT -> Onward and down
`;

export function ModuleBuilder() {
  const { campaign, update } = useCampaign();
  const { toast } = useToast();
  const [name, setName] = useState("New Module");
  const [markdown, setMarkdown] = useState(STARTER);
  const [result, setResult] = useState<CompileResult | null>(null);

  const liveStats = useMemo(() => {
    // cheap live indicator without committing a compile
    const scenes = markdown.split(/^#{1,3}\s+/m).length - 1;
    return { scenes: Math.max(scenes, 0), chars: markdown.length };
  }, [markdown]);

  function handleCompile() {
    const r = compileModule(markdown, name);
    setResult(r);
    toast({
      title: "Compiled",
      description: `${r.module.scenes.length} scenes, ${r.inlineEdges.length} edges, ${r.warnings.length} warnings.`,
    });
  }

  function authorEdges() {
    if (!result || result.inlineEdges.length === 0) return;
    update((c) => {
      const key = (e: { src: string; type: string; dst: string }) => `${e.src} ${e.type} ${e.dst}`;
      const existing = new Set(c.edges.map(key));
      const added = result.inlineEdges
        .filter((e) => !existing.has(key(e)))
        .map((e) => ({ id: crypto.randomUUID(), ...e, schemaVersion: CAMPAIGN_SCHEMA_VERSION }));
      return { ...c, edges: [...c.edges, ...added] };
    });
    toast({ title: "Edges authored", description: `${result.inlineEdges.length} @web edges merged into the graph.` });
  }

  function saveModule() {
    const r = result ?? compileModule(markdown, name);
    update((c) => {
      const others = c.modules.filter((m) => m.name !== r.module.name);
      return { ...c, modules: [...others, r.module] };
    });
    setResult(r);
    toast({ title: "Module saved", description: `"${r.module.name}" is ready in Live Play.` });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Editor */}
      <Card className="p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-cinzel" placeholder="Module name" />
          <Badge variant="outline" className="whitespace-nowrap">~{liveStats.scenes} scenes</Badge>
        </div>
        <Textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="font-mono text-sm flex-1 min-h-[460px] resize-none"
          spellCheck={false}
        />
        <div className="flex gap-2 mt-3">
          <Button onClick={handleCompile}><Hammer className="h-4 w-4 mr-1" /> Compile / Preflight</Button>
          <Button variant="outline" onClick={saveModule}><Save className="h-4 w-4 mr-1" /> Save Module</Button>
        </div>
      </Card>

      {/* Preflight output */}
      <Card className="p-4 flex flex-col">
        <h3 className="font-cinzel font-bold mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Preflight
        </h3>
        {!result ? (
          <p className="text-sm text-muted-foreground">
            Write in the session-sheet markers (<code>{">> READ ALOUD"}</code>, <code>GM:</code>,{" "}
            <code>EXIT -&gt;</code>, <code>**Hard Guile (-4)**</code>, <code>@web:</code>) and compile to
            see the structured scenes, lint warnings, and harvested lore-web edges.
          </p>
        ) : (
          <ScrollArea className="flex-1 pr-2">
            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-amber-500 text-sm font-semibold mb-1">
                  <AlertTriangle className="h-4 w-4" /> {result.warnings.length} warnings
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            )}

            {/* Harvested edges */}
            {result.inlineEdges.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold flex items-center gap-1"><Link2 className="h-4 w-4" /> {result.inlineEdges.length} lore-web edges</span>
                  <Button size="sm" variant="ghost" className="h-7" onClick={authorEdges}>Author all into graph</Button>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.inlineEdges.map((e, i) => (
                    <li key={i}><span className="font-medium">{e.src}</span> → {e.type} → <span className="font-medium">{e.dst}</span></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scenes */}
            <div className="space-y-2">
              {result.module.scenes.map((s, i) => (
                <div key={s.id} className="border rounded p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                    <span className="font-medium">{s.title}</span>
                    <Badge variant="secondary" className="text-xs capitalize ml-auto">{s.type}</Badge>
                  </div>
                  {s.subtitle && <p className="text-xs text-muted-foreground italic mt-1">{s.subtitle}</p>}
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{s.readAloud.length} read-aloud</span>
                    <span>· {s.gmNotes.length} GM</span>
                    <span>· {s.npcs.length} NPC</span>
                    <span>· {s.checks.length} checks</span>
                    <span>· {s.findables.length} findables</span>
                    <span>· {s.exits.length} exits</span>
                    {s.enemies.length > 0 && <span>· {s.enemies.length} enemies</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
