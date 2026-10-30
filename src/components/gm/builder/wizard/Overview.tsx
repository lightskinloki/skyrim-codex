// The adventure's home screen: every scene, how finished it is, and what to do
// next. This is where someone comes back to edit and improve an adventure.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronUp, ChevronDown, Copy, Trash2, Plus, Pencil, PlayCircle, ClipboardCheck, Undo2, History, CheckCircle2,
} from "lucide-react";
import { CampaignModule, SceneKind, SceneNode } from "@/types/campaign";
import { createSceneOfKind, uid, cloneBlock } from "@/utils/sceneBlocks";
import { sceneProgress } from "./steps";
import { PLAIN_KIND } from "./copy";
import { loadHistory, describeAge, pushSnapshot, Snapshot } from "./history";

export function Overview({ module, apply, onEditScene, onSetup, onReview, onTestDrive, onRun, canUndo, onUndo, onRestore }: {
  module: CampaignModule;
  apply: (fn: (m: CampaignModule) => CampaignModule) => void;
  onEditScene: (sceneId: string, stepKey?: string) => void;
  onSetup: () => void;
  onReview: () => void;
  onTestDrive: () => void;
  onRun: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onRestore: (m: CampaignModule) => void;
}) {
  const [adding, setAdding] = useState(module.scenes.length === 0);
  const [versions, setVersions] = useState<Snapshot[] | null>(null);

  const rows = module.scenes.map((s) => ({ s, prog: sceneProgress(s, module) }));
  const completeCount = rows.filter((r) => r.prog.missing.length === 0).length;

  const addScene = (kind: SceneKind) => {
    const scene = createSceneOfKind(kind, PLAIN_KIND[kind].name, module.id);
    apply((m) => ({ ...m, scenes: [...m.scenes, scene] }));
    setAdding(false);
    onEditScene(scene.id);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= module.scenes.length) return;
    apply((m) => { const a = [...m.scenes]; [a[i], a[j]] = [a[j], a[i]]; return { ...m, scenes: a }; });
  };
  const duplicate = (i: number) => apply((m) => {
    const src = m.scenes[i];
    const copy: SceneNode = { ...JSON.parse(JSON.stringify(src)), id: uid(), title: `${src.title} (copy)`, blocks: src.blocks.map(cloneBlock), exits: src.exits.map((e) => ({ ...e, id: uid() })) };
    return { ...m, scenes: [...m.scenes.slice(0, i + 1), copy, ...m.scenes.slice(i + 1)] };
  });
  const remove = (i: number) => {
    if (!confirm(`Delete "${module.scenes[i].title}"? You can press Undo right after to bring it back.`)) return;
    pushSnapshot(module, `Before deleting "${module.scenes[i].title}"`);
    apply((m) => ({ ...m, scenes: m.scenes.filter((_, j) => j !== i) }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div>
          <h2 className="font-cinzel text-2xl font-bold">{module.name || "Untitled adventure"}</h2>
          {module.description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{module.description}</p>}
          <button className="text-xs underline text-muted-foreground mt-1" onClick={onSetup}>Change the name or summary</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={onUndo} disabled={!canUndo}><Undo2 className="h-4 w-4 mr-1" /> Undo</Button>
          <Button size="sm" variant="outline" onClick={() => setVersions(versions ? null : loadHistory(module.id))}><History className="h-4 w-4 mr-1" /> Earlier versions</Button>
        </div>
      </div>

      {versions && (
        <Card className="p-3 space-y-2">
          <h3 className="text-sm font-semibold">Earlier versions of this adventure</h3>
          <p className="text-xs text-muted-foreground">A version is saved automatically every few minutes and before anything is deleted. Restoring one brings that version back. Your current work is kept as its own version first, so nothing is lost either way.</p>
          {versions.length === 0 && <p className="text-xs italic text-muted-foreground">No earlier versions yet. They appear after you've been editing for a few minutes.</p>}
          {versions.map((v) => (
            <div key={v.at} className="flex items-center gap-2 text-sm border rounded p-2">
              <div className="flex-1"><span className="font-medium">{describeAge(v.at)}</span> <span className="text-muted-foreground">· {v.module.scenes.length} scenes · {v.label}</span></div>
              <Button size="sm" variant="outline" onClick={() => { pushSnapshot(module, "Before restoring an earlier version"); onRestore(v.module); setVersions(null); }}>Restore</Button>
            </div>
          ))}
        </Card>
      )}

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Your scenes</h3>
          {module.scenes.length > 0 && <span className="text-xs text-muted-foreground">{completeCount} of {module.scenes.length} ready to run</span>}
        </div>
        {module.scenes.length === 0 && <p className="text-sm text-muted-foreground">You don't have any scenes yet. Add your first one below.</p>}
        <div className="space-y-2">
          {rows.map(({ s, prog }, i) => {
            const pct = prog.required ? Math.round((prog.done / prog.required) * 100) : 100;
            const ready = prog.missing.length === 0;
            return (
              <div key={s.id} className="border rounded p-3 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{i + 1}.</span>
                    <span className="font-medium truncate">{s.title || "Untitled"}</span>
                    <span className="text-[11px] border rounded-full px-2 py-0.5 text-muted-foreground">{PLAIN_KIND[s.kind ?? "scene"].name}</span>
                    {ready && <span className="text-[11px] text-green-500 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Ready to run</span>}
                  </div>
                  <div className="h-1.5 bg-muted rounded mt-2 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                  {!ready && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Still needs: {prog.missing.slice(0, 3).map((m) => m.label).join(", ")}{prog.missing.length > 3 ? ` and ${prog.missing.length - 3} more` : ""}.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button size="sm" onClick={() => onEditScene(s.id, prog.missing[0]?.key)}><Pencil className="h-3.5 w-3.5 mr-1" /> {ready ? "Edit" : "Continue"}</Button>
                  <button className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="h-4 w-4" /></button>
                  <button className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30" title="Move later" onClick={() => move(i, 1)} disabled={i === module.scenes.length - 1}><ChevronDown className="h-4 w-4" /></button>
                  <button className="p-1 text-muted-foreground hover:text-foreground" title="Make a copy of this scene" onClick={() => duplicate(i)}><Copy className="h-4 w-4" /></button>
                  <button className="p-1 text-muted-foreground hover:text-destructive" title="Delete this scene" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>

        {adding ? (
          <div className="space-y-2 pt-2">
            <h4 className="text-sm font-semibold">What kind of scene do you want to add?</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {(Object.keys(PLAIN_KIND) as SceneKind[]).map((k) => (
                <button key={k} className="text-left border rounded p-3 hover:bg-accent/20" onClick={() => addScene(k)}>
                  <div className="font-medium text-sm">{PLAIN_KIND[k].name}</div>
                  <div className="text-xs text-muted-foreground">{PLAIN_KIND[k].when}</div>
                </button>
              ))}
            </div>
            {module.scenes.length > 0 && <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>}
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Add a scene</Button>
        )}
      </Card>

      {module.scenes.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">When you're ready</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <button className="border rounded p-3 text-left hover:bg-accent/20" onClick={onReview}>
              <div className="font-medium text-sm flex items-center gap-1.5"><ClipboardCheck className="h-4 w-4 text-primary" /> Check everything</div>
              <div className="text-xs text-muted-foreground mt-1">See what's missing and get writing suggestions for the whole adventure.</div>
            </button>
            <button className="border rounded p-3 text-left hover:bg-accent/20" onClick={onTestDrive}>
              <div className="font-medium text-sm flex items-center gap-1.5"><PlayCircle className="h-4 w-4 text-primary" /> Try it out</div>
              <div className="text-xs text-muted-foreground mt-1">Click through it exactly as you would while running the game, without leaving here.</div>
            </button>
            <button className="border rounded p-3 text-left hover:bg-accent/20" onClick={onRun}>
              <div className="font-medium text-sm flex items-center gap-1.5"><PlayCircle className="h-4 w-4 text-primary" /> Run it for real</div>
              <div className="text-xs text-muted-foreground mt-1">Open it in Live Play, the screen you use during the session.</div>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
