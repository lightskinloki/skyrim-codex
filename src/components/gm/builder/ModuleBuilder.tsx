// Pillar 2 — The Forge: a GUIDED, form-driven module builder.
//
// The GM fills in fields — no markdown syntax to remember — and the app assembles
// structured SceneNodes the rest of the suite runs. Modules are DUAL-FORMAT: the
// structured data drives Live Play, and "Export sheet" writes a human-readable
// session-sheet markdown the GM can run with the app closed (and re-import later).
// The form bakes in the session-sheet rules (archetypes, the difficulty ladder,
// "a beat is never a character sheet") as guardrails + a live preflight checklist.
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Download, Upload, X,
  AlertTriangle, CheckCircle2, Users, Swords, Search, MessageSquare, DoorOpen, BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import {
  CampaignModule, SceneNode, SceneNpc, SceneCheck, Findable, ExitLink,
  SceneType, Difficulty, CheckStat, DIFFICULTY_PENALTY, createScene, CAMPAIGN_SCHEMA_VERSION,
} from "@/types/campaign";
import { compileModule, moduleToMarkdown, lintModule } from "@/utils/moduleCompiler";
import { enemyTemplates } from "@/data/enemies";

const SCENE_TYPES: SceneType[] = ["set-piece", "character", "social", "combat", "interlude"];
const DIFFICULTIES = Object.keys(DIFFICULTY_PENALTY) as Difficulty[];
const STATS: CheckStat[] = ["might", "agility", "magic", "guile", "none"];
const selectCls = "bg-background border border-border rounded px-2 py-1 text-sm";

function newModule(): CampaignModule {
  const id = crypto.randomUUID();
  return { id, name: "New Module", scenes: [createScene({ title: "Scene 1", moduleId: id })], schemaVersion: CAMPAIGN_SCHEMA_VERSION };
}

export function ModuleBuilder() {
  const { campaign, update } = useCampaign();
  const { toast } = useToast();
  const [module, setModule] = useState<CampaignModule>(() =>
    campaign.modules[0] ? JSON.parse(JSON.stringify(campaign.modules[0])) : newModule()
  );
  const [idx, setIdx] = useState(0);

  const safeIdx = Math.min(idx, module.scenes.length - 1);
  const scene = module.scenes[safeIdx];
  const warnings = useMemo(() => lintModule(module.scenes), [module]);
  const entityNames = useMemo(() => campaign.nodes.map((n) => n.name), [campaign.nodes]);

  // ---- module + scene plumbing ----
  const patchScene = (p: Partial<SceneNode>) =>
    setModule((m) => ({ ...m, scenes: m.scenes.map((s, i) => (i === safeIdx ? { ...s, ...p } : s)) }));

  const addScene = () => {
    setModule((m) => ({ ...m, scenes: [...m.scenes, createScene({ title: `Scene ${m.scenes.length + 1}`, moduleId: m.id })] }));
    setIdx(module.scenes.length);
  };
  const deleteScene = (i: number) => {
    if (module.scenes.length <= 1) return;
    setModule((m) => ({ ...m, scenes: m.scenes.filter((_, j) => j !== i) }));
    setIdx((cur) => Math.max(0, Math.min(cur, module.scenes.length - 2)));
  };
  const moveScene = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= module.scenes.length) return;
    setModule((m) => { const a = [...m.scenes]; [a[i], a[j]] = [a[j], a[i]]; return { ...m, scenes: a }; });
    setIdx(j);
  };

  const loadModule = (id: string) => {
    if (id === "__new__") { setModule(newModule()); setIdx(0); return; }
    const m = campaign.modules.find((x) => x.id === id);
    if (m) { setModule(JSON.parse(JSON.stringify(m))); setIdx(0); }
  };
  const saveModule = () => {
    const normalized = { ...module, scenes: module.scenes.map((s) => ({ ...s, moduleId: module.id })) };
    update((c) => ({ ...c, modules: [...c.modules.filter((m) => m.id !== module.id), normalized] }));
    setModule(normalized);
    toast({ title: "Module saved", description: `"${module.name}" is ready in Live Play.` });
  };
  const exportSheet = () => {
    const blob = new Blob([moduleToMarkdown(module)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${module.name.replace(/\s+/g, "-").toLowerCase() || "module"}.md`; a.click();
    URL.revokeObjectURL(url);
  };
  const importSheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    file.text().then((text) => {
      const r = compileModule(text, file.name.replace(/\.md$/i, ""));
      setModule(r.module); setIdx(0);
      toast({ title: "Imported", description: `${r.module.scenes.length} scenes parsed into the builder.` });
    });
  };

  // ---- repeatable field helpers ----
  const setNpcs = (arr: SceneNpc[]) => patchScene({ npcs: arr });
  const setChecks = (arr: SceneCheck[]) => patchScene({ checks: arr });
  const setFindables = (arr: Findable[]) => patchScene({ findables: arr });
  const setExits = (arr: ExitLink[]) => patchScene({ exits: arr });

  if (!scene) return null;
  const otherScenes = module.scenes.filter((s) => s.id !== scene.id);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className={selectCls} value={module.id} onChange={(e) => loadModule(e.target.value)}>
            {!campaign.modules.some((m) => m.id === module.id) && <option value={module.id}>{module.name} (unsaved)</option>}
            {campaign.modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value="__new__">+ New module…</option>
          </select>
          <Input value={module.name} onChange={(e) => setModule((m) => ({ ...m, name: e.target.value }))} className="max-w-xs font-cinzel" placeholder="Module name" />
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={saveModule}><Save className="h-4 w-4 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={exportSheet}><Download className="h-4 w-4 mr-1" /> Export sheet</Button>
            <label>
              <input type="file" accept=".md,.markdown,text/markdown" className="hidden" onChange={importSheet} />
              <Button asChild size="sm" variant="outline"><span><Upload className="h-4 w-4 mr-1" /> Import</span></Button>
            </label>
          </div>
        </div>
      </Card>

      <datalist id="campaign-entities">{entityNames.map((n) => <option key={n} value={n} />)}</datalist>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-3">
        {/* Scene rail */}
        <Card className="p-2 h-fit">
          <div className="space-y-1">
            {module.scenes.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-1 rounded px-1 ${i === safeIdx ? "bg-accent/20" : ""}`}>
                <button className="flex-1 text-left text-sm truncate py-1" onClick={() => setIdx(i)} title={s.title}>
                  <span className="text-muted-foreground mr-1">{i + 1}.</span>{s.title || "Untitled"}
                </button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => moveScene(i, -1)} disabled={i === 0}><ChevronUp className="h-3.5 w-3.5" /></button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => moveScene(i, 1)} disabled={i === module.scenes.length - 1}><ChevronDown className="h-3.5 w-3.5" /></button>
                <button className="text-muted-foreground hover:text-destructive disabled:opacity-30" onClick={() => deleteScene(i)} disabled={module.scenes.length <= 1}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="w-full mt-2" onClick={addScene}><Plus className="h-4 w-4 mr-1" /> Add scene</Button>
        </Card>

        {/* Scene form */}
        <Card className="p-4 space-y-4">
          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2">
            <div>
              <Label className="text-xs">Scene title</Label>
              <Input value={scene.title} onChange={(e) => patchScene({ title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <select className={`${selectCls} w-full`} value={scene.type} onChange={(e) => patchScene({ type: e.target.value as SceneType })}>
                {SCENE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">“What this is” (one line that orients the GM)</Label>
            <Input value={scene.subtitle ?? ""} onChange={(e) => patchScene({ subtitle: e.target.value })} placeholder="e.g. The first room a real villain occupied." />
          </div>

          {/* Read-aloud */}
          <div>
            <Label className="text-xs flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Read-aloud (blank line = new paragraph)</Label>
            <Textarea
              value={scene.readAloud.join("\n\n")}
              onChange={(e) => patchScene({ readAloud: e.target.value.split(/\n\s*\n/) })}
              className="min-h-[90px] border-l-4 border-l-blue-500"
              placeholder="The player-facing moment — the place, the mood, what just changed."
            />
          </div>

          {/* GM notes + bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">GM notes (one per line)</Label>
              <Textarea value={scene.gmNotes.join("\n")} onChange={(e) => patchScene({ gmNotes: e.target.value.split("\n").filter((l) => l.trim()) })} className="min-h-[70px]" placeholder="Truth & adjudication — a beat per line." />
            </div>
            <div>
              <Label className="text-xs">Beats / bullets (one per line)</Label>
              <Textarea value={scene.bullets.join("\n")} onChange={(e) => patchScene({ bullets: e.target.value.split("\n").filter((l) => l.trim()) })} className="min-h-[70px]" placeholder="Discoveries, options, consequences." />
            </div>
          </div>

          {/* NPCs */}
          <FieldSection icon={<Users className="h-4 w-4" />} title="NPC beats" onAdd={() => setNpcs([...scene.npcs, { id: crypto.randomUUID(), name: "" }])}>
            {scene.npcs.map((npc, i) => (
              <div key={npc.id} className="border rounded p-2 space-y-2">
                <div className="flex gap-2">
                  <input list="campaign-entities" className={`${selectCls} flex-1`} value={npc.name} placeholder="NPC name"
                    onChange={(e) => { const name = e.target.value; const node = campaign.nodes.find((n) => n.name.toLowerCase() === name.toLowerCase()); setNpcs(scene.npcs.map((x, j) => j === i ? { ...x, name, nodeId: node?.id } : x)); }} />
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => setNpcs(scene.npcs.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                </div>
                <Input value={npc.line ?? ""} onChange={(e) => setNpcs(scene.npcs.map((x, j) => j === i ? { ...x, line: e.target.value } : x))} placeholder='A spoken line — "When can I go home?"' />
                {(npc.reactions ?? []).map((r, ri) => (
                  <div key={ri} className="flex gap-2 pl-3">
                    <Input value={r.action} className="w-28" placeholder="accept / refuse" onChange={(e) => setNpcs(scene.npcs.map((x, j) => j === i ? { ...x, reactions: x.reactions!.map((rr, k) => k === ri ? { ...rr, action: e.target.value } : rr) } : x))} />
                    <Input value={r.response} className="flex-1" placeholder="how they take it" onChange={(e) => setNpcs(scene.npcs.map((x, j) => j === i ? { ...x, reactions: x.reactions!.map((rr, k) => k === ri ? { ...rr, response: e.target.value } : rr) } : x))} />
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => setNpcs(scene.npcs.map((x, j) => j === i ? { ...x, reactions: x.reactions!.filter((_, k) => k !== ri) } : x))}><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setNpcs(scene.npcs.map((x, j) => j === i ? { ...x, reactions: [...(x.reactions ?? []), { action: "", response: "" }] } : x))}>
                  <MessageSquare className="h-3 w-3 mr-1" /> Add reaction
                </Button>
              </div>
            ))}
            {scene.type === "character" && scene.npcs.every((n) => !n.line) && (
              <p className="text-xs text-amber-500">A character scene needs at least one NPC with a line (a beat is never a character sheet).</p>
            )}
          </FieldSection>

          {/* Checks */}
          <FieldSection icon={<CheckCircle2 className="h-4 w-4" />} title="Checks" onAdd={() => setChecks([...scene.checks, { id: crypto.randomUUID(), difficulty: "Standard", stat: "none", penalty: 0 }])}>
            {scene.checks.map((c, i) => (
              <div key={c.id} className="flex flex-wrap gap-2 items-center">
                <select className={selectCls} value={c.difficulty} onChange={(e) => { const d = e.target.value as Difficulty; setChecks(scene.checks.map((x, j) => j === i ? { ...x, difficulty: d, penalty: DIFFICULTY_PENALTY[d] } : x)); }}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className={selectCls} value={c.stat} onChange={(e) => setChecks(scene.checks.map((x, j) => j === i ? { ...x, stat: e.target.value as CheckStat } : x))}>
                  {STATS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Badge variant="outline" className="text-xs">{c.penalty > 0 ? `+${c.penalty}` : c.penalty}</Badge>
                <Input value={c.label ?? ""} className="flex-1 min-w-[120px]" placeholder="what it's for (e.g. spot the ledger)" onChange={(e) => setChecks(scene.checks.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <button className="text-muted-foreground hover:text-destructive" onClick={() => setChecks(scene.checks.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
              </div>
            ))}
          </FieldSection>

          {/* Findables */}
          <FieldSection icon={<Search className="h-4 w-4" />} title="Findables / loot / handouts" onAdd={() => setFindables([...scene.findables, { id: crypto.randomUUID(), name: "", description: "", resolved: false }])}>
            {scene.findables.map((f, i) => (
              <div key={f.id} className="border rounded p-2 space-y-2">
                <div className="flex gap-2">
                  <input list="campaign-entities" className={`${selectCls} flex-1`} value={f.name} placeholder="Name (e.g. The Family Cache)" onChange={(e) => setFindables(scene.findables.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => setFindables(scene.findables.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                </div>
                <Input value={f.description} onChange={(e) => setFindables(scene.findables.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="The gist — the one line you say when it's picked up." />
                <Textarea value={f.readAloud ?? ""} onChange={(e) => setFindables(scene.findables.map((x, j) => j === i ? { ...x, readAloud: e.target.value } : x))} className="min-h-[50px]" placeholder="Optional handout: the full in-world text." />
              </div>
            ))}
          </FieldSection>

          {/* Enemies */}
          <div>
            <Label className="text-xs flex items-center gap-1"><Swords className="h-4 w-4" /> Enemies (load into combat via Deploy Encounter)</Label>
            <div className="flex flex-wrap gap-1 mt-1 mb-2">
              {scene.enemies.map((id) => {
                const t = enemyTemplates.find((e) => e.id === id);
                return (
                  <Badge key={id} variant={t ? "secondary" : "destructive"} className="text-xs">
                    {t ? t.name : `${id}?`}
                    <button className="ml-1" onClick={() => patchScene({ enemies: scene.enemies.filter((e) => e !== id) })}><X className="h-3 w-3" /></button>
                  </Badge>
                );
              })}
              {scene.enemies.length === 0 && <span className="text-xs text-muted-foreground">None.</span>}
            </div>
            <select className={selectCls} value="" onChange={(e) => { const id = e.target.value; if (id && !scene.enemies.includes(id)) patchScene({ enemies: [...scene.enemies, id] }); }}>
              <option value="">+ Add enemy…</option>
              {enemyTemplates.filter((t) => !scene.enemies.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name} (HP {t.hp})</option>)}
            </select>
          </div>

          {/* Exits */}
          <FieldSection icon={<DoorOpen className="h-4 w-4" />} title="Exits" onAdd={() => setExits([...scene.exits, { id: crypto.randomUUID(), description: "" }])}>
            {scene.exits.map((ex, i) => (
              <div key={ex.id} className="flex flex-wrap gap-2 items-center">
                <Input value={ex.description} className="flex-1 min-w-[140px]" placeholder="Where it leads (e.g. The long climb down)" onChange={(e) => setExits(scene.exits.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                <select className={selectCls} value={ex.targetSceneId ?? ""} onChange={(e) => setExits(scene.exits.map((x, j) => j === i ? { ...x, targetSceneId: e.target.value || undefined } : x))}>
                  <option value="">→ next / unset</option>
                  {otherScenes.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <Input value={ex.branchLabel ?? ""} className="w-32" placeholder="branch (opt.)" onChange={(e) => setExits(scene.exits.map((x, j) => j === i ? { ...x, branchLabel: e.target.value } : x))} />
                <button className="text-muted-foreground hover:text-destructive" onClick={() => setExits(scene.exits.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
              </div>
            ))}
          </FieldSection>
        </Card>

        {/* Preflight rail */}
        <Card className="p-3 h-fit">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            {warnings.length === 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            Preflight
          </h4>
          {warnings.length === 0 ? (
            <p className="text-xs text-green-500">All scenes look runnable.</p>
          ) : (
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {warnings.map((w, i) => <li key={i} className="flex gap-1"><span className="text-amber-500">•</span><span>{w}</span></li>)}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground space-y-1">
            <p><span className="text-foreground font-medium">{module.scenes.length}</span> scenes</p>
            <p>Save → run it in <span className="text-foreground">Live Play</span>.</p>
            <p>Export sheet → a readable .md you can run with the app closed.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function FieldSection({ icon, title, onAdd, children }: { icon: React.ReactNode; title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1">{icon} {title}</Label>
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onAdd}><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      {children}
    </div>
  );
}
