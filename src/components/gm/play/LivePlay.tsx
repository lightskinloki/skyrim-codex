// Pillar 3 — Live Play: walk a module's scenes along a timeline. Each scene
// surfaces read-aloud (front and center), NPC beats, checks, findables, enemies
// (→ Deploy Encounter into the combat tracker), and exits.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, Swords, MapPin, Users, Eye, EyeOff, ArrowRight, Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import { SceneNode, SceneNpc, Findable } from "@/types/campaign";
import { enemyTemplates } from "@/data/enemies";

interface LivePlayProps {
  onDeployEncounter: (enemyIds: string[]) => void;
}

export function LivePlay({ onDeployEncounter }: LivePlayProps) {
  const { campaign, update } = useCampaign();
  const { toast } = useToast();
  const [moduleId, setModuleId] = useState<string | null>(campaign.modules[0]?.id ?? null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [openNpc, setOpenNpc] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const module = campaign.modules.find((m) => m.id === moduleId) ?? null;
  const scenes = module?.scenes ?? [];
  const scene: SceneNode | undefined = scenes[sceneIndex];

  function go(i: number) {
    setSceneIndex(Math.max(0, Math.min(scenes.length - 1, i)));
    setOpenNpc(null);
  }

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleResolved(f: Findable) {
    if (!module) return;
    update((c) => ({
      ...c,
      modules: c.modules.map((m) =>
        m.id !== module.id ? m : {
          ...m,
          scenes: m.scenes.map((s, i) =>
            i !== sceneIndex ? s : { ...s, findables: s.findables.map((x) => x.id === f.id ? { ...x, resolved: !x.resolved } : x) }
          ),
        }
      ),
    }));
  }

  function deploy() {
    if (!scene || scene.enemies.length === 0) return;
    onDeployEncounter(scene.enemies);
    toast({ title: "Encounter deployed", description: `${scene.enemies.length} enemies sent to the Combat tracker.` });
  }

  if (campaign.modules.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        No modules yet. Build one in <span className="font-semibold">The Forge</span>, then run it here.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Module picker + timeline */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <select
            value={moduleId ?? ""}
            onChange={(e) => { setModuleId(e.target.value); setSceneIndex(0); }}
            className="bg-background border rounded px-2 py-1 text-sm"
          >
            {campaign.modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <span className="text-xs text-muted-foreground">{scenes.length} scenes</span>
          <div className="ml-auto flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => go(sceneIndex - 1)} disabled={sceneIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm tabular-nums">{sceneIndex + 1}/{scenes.length}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => go(sceneIndex + 1)} disabled={sceneIndex >= scenes.length - 1}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        {/* subway-map timeline */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex items-center gap-1">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                onClick={() => go(i)}
                className={`flex items-center gap-1 shrink-0 rounded px-2 py-1 text-xs border transition-colors ${
                  i === sceneIndex ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                }`}
                title={s.title}
              >
                <span className="font-bold">{i + 1}</span>
                <span className="max-w-[120px] truncate">{s.title}</span>
                {i < scenes.length - 1 && <ArrowRight className="h-3 w-3 opacity-40" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {!scene ? null : (
        <>
          <div className="flex items-baseline gap-2">
            <h2 className="font-cinzel text-2xl font-bold text-primary">{scene.title}</h2>
            <Badge variant="secondary" className="capitalize">{scene.type}</Badge>
          </div>
          {scene.subtitle && <p className="text-sm italic text-muted-foreground -mt-2">{scene.subtitle}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Col 1 — narrative */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">NARRATIVE</h3>
              {scene.readAloud.length > 0 && (
                <div className="rounded border-l-4 border-blue-500 bg-blue-500/5 p-3 mb-3">
                  <div className="text-xs font-bold text-blue-500 mb-1">▶ READ ALOUD</div>
                  {scene.readAloud.map((p, i) => <p key={i} className="text-sm italic text-blue-100/90 mb-2 last:mb-0">{p}</p>)}
                </div>
              )}
              {scene.gmNotes.map((n, i) => (
                <p key={i} className="text-sm mb-2"><span className="font-bold text-primary">GM:</span> {n}</p>
              ))}
              {scene.bullets.length > 0 && (
                <ul className="text-sm space-y-1 mt-2">
                  {scene.bullets.map((b, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{b}</span></li>)}
                </ul>
              )}
            </Card>

            {/* Col 2 — actors */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> ACTORS</h3>
              {scene.npcs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No NPC beats in this scene.</p>
              ) : (
                <div className="space-y-2">
                  {scene.npcs.map((npc: SceneNpc) => (
                    <div key={npc.id} className="border rounded p-2">
                      <button className="w-full text-left font-medium text-sm flex items-center justify-between" onClick={() => setOpenNpc(openNpc === npc.id ? null : npc.id)}>
                        {npc.name}
                        <ChevronRight className={`h-4 w-4 transition-transform ${openNpc === npc.id ? "rotate-90" : ""}`} />
                      </button>
                      {openNpc === npc.id && (
                        <div className="mt-2 text-sm space-y-2">
                          {npc.line && <p className="italic">"{npc.line}"</p>}
                          {npc.reactions?.map((r, i) => (
                            <p key={i} className="text-xs text-muted-foreground"><span className="font-semibold">{r.action}:</span> {r.response}</p>
                          ))}
                          {!npc.line && !npc.reactions?.length && <p className="text-xs text-muted-foreground">No line recorded.</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Col 3 — action */}
            <Card className="p-4 space-y-4">
              {/* Checks */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">CHECKS</h3>
                {scene.checks.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
                  <div className="flex flex-wrap gap-1">
                    {scene.checks.map((c) => (
                      <Badge key={c.id} variant="outline" className="text-xs" title={c.label}>
                        {c.difficulty}{c.stat !== "none" ? ` ${c.stat}` : ""}{c.penalty ? ` (${c.penalty > 0 ? "+" : ""}${c.penalty})` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Findables */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><Search className="h-4 w-4" /> FINDABLES</h3>
                {scene.findables.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
                  <div className="space-y-1">
                    {scene.findables.map((f) => (
                      <div key={f.id} className="text-sm border rounded p-2">
                        <div className="flex items-center gap-2">
                          <button className="font-medium text-left flex-1" onClick={() => toggleReveal(f.id)}>
                            {f.resolved && <span className="text-green-500 mr-1">✓</span>}{f.name}
                          </button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleReveal(f.id)}>
                            {revealed.has(f.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleResolved(f)} title="Mark found">
                            <MapPin className="h-3 w-3" />
                          </Button>
                        </div>
                        {revealed.has(f.id) && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {f.description && <p>{f.description}</p>}
                            {f.readAloud && <p className="italic text-blue-200/80 mt-1">"{f.readAloud}"</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enemies */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground flex items-center gap-1"><Swords className="h-4 w-4" /> ENEMIES</h3>
                {scene.enemies.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {scene.enemies.map((id, i) => {
                        const t = enemyTemplates.find((e) => e.id === id);
                        return <Badge key={i} variant={t ? "secondary" : "destructive"} className="text-xs">{t ? t.name : `${id}?`}</Badge>;
                      })}
                    </div>
                    <Button size="sm" className="w-full bg-red-700 hover:bg-red-800" onClick={deploy}>
                      <Swords className="h-4 w-4 mr-1" /> Deploy Encounter
                    </Button>
                  </div>
                )}
              </div>

              {/* Exits */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">EXITS</h3>
                {scene.exits.length === 0 ? <p className="text-xs text-muted-foreground">End of the line.</p> : (
                  <div className="space-y-1">
                    {scene.exits.map((ex) => (
                      <button key={ex.id} onClick={() => go(sceneIndex + 1)} className="w-full text-left text-sm border rounded p-2 hover:bg-accent flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span>{ex.description}{ex.branchLabel && <span className="text-muted-foreground"> → {ex.branchLabel}</span>}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
