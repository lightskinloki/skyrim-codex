// Pillar 2 — The Forge: a step-by-step WIZARD. The GM picks what kind of
// scene they're building (opening / conversation / combat / endings /
// resolution / plain scene), the wizard drops in that scene's starter
// blocks — pulled one-to-one from the 9/28 Fire B runsheet's shapes — and
// the GM fills them in with the generic block editor below. No markdown to
// remember; markdown import/export stays for veterans (see the toolbar).
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save, Download, Upload, X,
  AlertTriangle, CheckCircle2, Swords, DoorOpen, Eye, EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import {
  CampaignModule, SceneNode, SceneType, SceneKind, ExitLink, TierRange,
  CAMPAIGN_SCHEMA_VERSION,
} from "@/types/campaign";
import {
  uid, createSceneOfKind, KIND_META, migrateModule, lintModuleV2, createTierTable,
} from "@/utils/sceneBlocks";
import { compileModule, moduleToMarkdown } from "@/utils/moduleCompiler";
import { enemyTemplates } from "@/data/enemies";
import { BlockListEditor } from "./BlockEditor";
import { SceneBlocks, RenderCtx } from "../runsheet/SceneBlockRenderer";
import "../runsheet/runsheet.css";

const selectCls = "bg-background border border-border rounded px-2 py-1 text-sm";
const SCENE_TYPES: SceneType[] = ["set-piece", "character", "social", "combat", "interlude"];
const SCENE_KINDS = Object.keys(KIND_META) as SceneKind[];
const TOP_LEVEL_KINDS = ["readAloud", "gmNote", "gmAlert", "stop", "spoken", "handout", "list", "text",
  "heading", "quote", "card", "branch", "choices", "check", "findable", "exit", "director", "combat"] as const;

function newModule(): CampaignModule {
  const id = uid();
  return {
    id, name: "New Module", scenes: [createSceneOfKind("opening", "Scene 1", id)],
    tierTables: [], schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  };
}

export function ModuleBuilder() {
  const { campaign, update } = useCampaign();
  const { toast } = useToast();
  const [module, setModule] = useState<CampaignModule>(() =>
    campaign.modules[0] ? migrateModule(JSON.parse(JSON.stringify(campaign.modules[0]))) : newModule()
  );
  const [idx, setIdx] = useState(0);
  const [addingKind, setAddingKind] = useState(false);
  const [preview, setPreview] = useState(false);

  const safeIdx = Math.min(idx, module.scenes.length - 1);
  const scene = module.scenes[safeIdx];
  const warnings = useMemo(() => lintModuleV2(module), [module]);

  const patchScene = (p: Partial<SceneNode>) =>
    setModule((m) => ({ ...m, scenes: m.scenes.map((s, i) => (i === safeIdx ? { ...s, ...p } : s)) }));

  const addScene = (kind: SceneKind) => {
    const s = createSceneOfKind(kind, `Scene ${module.scenes.length + 1}`, module.id);
    setModule((m) => ({ ...m, scenes: [...m.scenes, s] }));
    setIdx(module.scenes.length);
    setAddingKind(false);
  };
  const deleteScene = (i: number) => {
    if (module.scenes.length <= 1) return;
    if (!confirm("Delete this scene? This can't be undone.")) return;
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
    if (m) { setModule(migrateModule(JSON.parse(JSON.stringify(m)))); setIdx(0); }
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
      setModule(migrateModule(r.module)); setIdx(0);
      toast({ title: "Imported", description: `${r.module.scenes.length} scenes parsed. Markdown import is the veteran path — the wizard is the easier way in.` });
    });
  };

  if (!scene) return null;
  const otherScenes = module.scenes.filter((s) => s.id !== scene.id);

  const ctx: RenderCtx = {
    goToScene: () => { /* preview only — no navigation */ },
    sceneTitle: (id) => module.scenes.find((s) => s.id === id)?.title,
  };

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
            <Button size="sm" variant="outline" onClick={() => setPreview((p) => !p)}>
              {preview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />} {preview ? "Hide preview" : "Preview"}
            </Button>
            <Button size="sm" onClick={saveModule}><Save className="h-4 w-4 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={exportSheet}><Download className="h-4 w-4 mr-1" /> Export sheet</Button>
            <label>
              <input type="file" accept=".md,.markdown,text/markdown" className="hidden" onChange={importSheet} />
              <Button asChild size="sm" variant="outline"><span><Upload className="h-4 w-4 mr-1" /> Import (veteran)</span></Button>
            </label>
          </div>
        </div>
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer">Masthead & module info (optional)</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <Input value={module.badge ?? ""} onChange={(e) => setModule((m) => ({ ...m, badge: e.target.value }))} placeholder="Badge (e.g. Table-Ready Session Sheet)" />
            <Input value={module.navTitle ?? ""} onChange={(e) => setModule((m) => ({ ...m, navTitle: e.target.value }))} placeholder='Sidebar group title (e.g. "TONIGHT: VAULT → SCENE 22")' />
            <Textarea value={module.description ?? ""} onChange={(e) => setModule((m) => ({ ...m, description: e.target.value }))} className="sm:col-span-2 min-h-[50px]" placeholder="Masthead line — tonight's starting point." />
          </div>
          <TierTablesEditor module={module} onChange={setModule} />
        </details>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-3">
        {/* Scene rail */}
        <Card className="p-2 h-fit">
          <div className="space-y-1">
            {module.scenes.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-1 rounded px-1 ${i === safeIdx ? "bg-accent/20" : ""}`}>
                <button className="flex-1 text-left text-sm truncate py-1" onClick={() => setIdx(i)} title={s.title}>
                  <span className="text-muted-foreground mr-1">{i + 1}.</span>{s.title || "Untitled"}
                  <span className="block text-[10px] text-muted-foreground">{KIND_META[s.kind ?? "scene"].label}</span>
                </button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => moveScene(i, -1)} disabled={i === 0}><ChevronUp className="h-3.5 w-3.5" /></button>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => moveScene(i, 1)} disabled={i === module.scenes.length - 1}><ChevronDown className="h-3.5 w-3.5" /></button>
                <button className="text-muted-foreground hover:text-destructive disabled:opacity-30" onClick={() => deleteScene(i)} disabled={module.scenes.length <= 1}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          {addingKind ? (
            <div className="mt-2 space-y-1">
              {SCENE_KINDS.map((k) => (
                <button key={k} className="w-full text-left border rounded p-1.5 hover:bg-accent/20" onClick={() => addScene(k)}>
                  <div className="text-xs font-semibold">{KIND_META[k].label}</div>
                  <div className="text-[10px] text-muted-foreground">{KIND_META[k].blurb}</div>
                </button>
              ))}
              <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setAddingKind(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setAddingKind(true)}><Plus className="h-4 w-4 mr-1" /> Add scene</Button>
          )}
        </Card>

        {/* Scene form */}
        <div className="space-y-3">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px_150px] gap-2">
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
              <div>
                <Label className="text-xs">Top border</Label>
                <select className={`${selectCls} w-full`} value={scene.accent ?? ""} onChange={(e) => patchScene({ accent: (e.target.value || undefined) as "gold" | "red" | undefined })}>
                  <option value="">none</option>
                  <option value="gold">gold</option>
                  <option value="red">red</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Subtitle (grey line under the title)</Label>
                <Input value={scene.subtitle ?? ""} onChange={(e) => patchScene({ subtitle: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Sidebar label (e.g. "Scene 22 — Live Dialogue Director")</Label>
                <Input value={scene.label ?? ""} onChange={(e) => patchScene({ label: e.target.value })} />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Content</Label>
              <BlockListEditor blocks={scene.blocks} onChange={(blocks) => patchScene({ blocks })} allow={[...TOP_LEVEL_KINDS]} />
            </div>

            {/* Enemies */}
            <div>
              <Label className="text-xs flex items-center gap-1"><Swords className="h-4 w-4" /> Enemies (Deploy Encounter button at the bottom of the scene)</Label>
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
            <ExitsEditor exits={scene.exits} otherScenes={otherScenes} onChange={(exits) => patchScene({ exits })} />
          </Card>

          {preview && (
            <Card className="p-4">
              <Label className="text-xs mb-2 block text-muted-foreground">Live preview (console look)</Label>
              <div className="rs rs-preview-frame">
                <section className={`rs-scene${scene.accent ? ` accent-${scene.accent}` : ""}`}>
                  <div className="rs-scene-header">
                    {scene.label && <div className="rs-scene-number">{scene.label}</div>}
                    <h2 className="rs-scene-title">{scene.title}</h2>
                    {scene.subtitle && <p className="rs-scene-subtitle">{scene.subtitle}</p>}
                  </div>
                  <SceneBlocks blocks={scene.blocks} ctx={ctx} />
                </section>
              </div>
            </Card>
          )}
        </div>

        {/* Preflight rail */}
        <Card className="p-3 h-fit">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            {warnings.length === 0 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            Preflight
          </h4>
          {warnings.length === 0 ? (
            <p className="text-xs text-green-500">Everything looks runnable.</p>
          ) : (
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {warnings.map((w, i) => <li key={i} className="flex gap-1"><span className="text-amber-500">•</span><span>{w}</span></li>)}
            </ul>
          )}
          <div className="mt-3 pt-3 border-t text-[11px] text-muted-foreground space-y-1">
            <p><span className="text-foreground font-medium">{module.scenes.length}</span> scenes</p>
            <p>Save → run it in <span className="text-foreground">Live Play</span>, in this same console look.</p>
            <p>Export sheet → a readable .md; Import is for markdown veterans — the wizard above is the priority path.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ExitsEditor({ exits, otherScenes, onChange }: { exits: ExitLink[]; otherScenes: SceneNode[]; onChange: (e: ExitLink[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1"><DoorOpen className="h-4 w-4" /> Exits</Label>
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange([...exits, { id: uid(), description: "" }])}><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      {exits.map((ex, i) => (
        <div key={ex.id} className="flex flex-wrap gap-2 items-center">
          <Input value={ex.description} className="flex-1 min-w-[140px]" placeholder="Where it leads (e.g. The long climb down)" onChange={(e) => onChange(exits.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
          <select className={selectCls} value={ex.targetSceneId ?? ""} onChange={(e) => onChange(exits.map((x, j) => j === i ? { ...x, targetSceneId: e.target.value || undefined } : x))}>
            <option value="">→ next / unset</option>
            {otherScenes.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <Input value={ex.branchLabel ?? ""} className="w-32" placeholder="branch (opt.)" onChange={(e) => onChange(exits.map((x, j) => j === i ? { ...x, branchLabel: e.target.value } : x))} />
          <button className="text-muted-foreground hover:text-destructive" onClick={() => onChange(exits.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

function TierTablesEditor({ module, onChange }: { module: CampaignModule; onChange: (m: CampaignModule) => void }) {
  const tables = module.tierTables ?? [];
  const setTables = (t: typeof tables) => onChange({ ...module, tierTables: t });

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Roll tables (d20 only — e.g. Zone 3 Tempo)</Label>
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setTables([...tables, createTierTable("New table")])}><Plus className="h-3 w-3 mr-1" /> Add table</Button>
      </div>
      {tables.map((t, ti) => (
        <div key={t.id} className="border rounded p-2 mt-2 space-y-1.5">
          <div className="flex gap-2">
            <Input value={t.name} onChange={(e) => setTables(tables.map((x, j) => j === ti ? { ...x, name: e.target.value } : x))} className="flex-1" />
            <button className="text-muted-foreground hover:text-destructive" onClick={() => setTables(tables.filter((_, j) => j !== ti))}><Trash2 className="h-4 w-4" /></button>
          </div>
          {t.tiers.map((r, ri) => (
            <div key={ri} className="flex gap-2 items-center">
              <Input type="number" value={r.min} className="w-14" onChange={(e) => setTables(tables.map((x, j) => j === ti ? { ...x, tiers: x.tiers.map((y, k) => k === ri ? { ...y, min: Number(e.target.value) || 1 } : y) } : x))} />
              <span className="text-xs">–</span>
              <Input type="number" value={r.max} className="w-14" onChange={(e) => setTables(tables.map((x, j) => j === ti ? { ...x, tiers: x.tiers.map((y, k) => k === ri ? { ...y, max: Number(e.target.value) || 20 } : y) } : x))} />
              <Input value={r.label} className="flex-1" placeholder="Result name" onChange={(e) => setTables(tables.map((x, j) => j === ti ? { ...x, tiers: x.tiers.map((y, k) => k === ri ? { ...y, label: e.target.value } : y) } : x))} />
              <Input value={r.effect ?? ""} className="flex-1" placeholder="Effect" onChange={(e) => setTables(tables.map((x, j) => j === ti ? { ...x, tiers: x.tiers.map((y, k) => k === ri ? { ...y, effect: e.target.value } : y) } : x))} />
              <button className="text-muted-foreground hover:text-destructive" onClick={() => setTables(tables.map((x, j) => j === ti ? { ...x, tiers: x.tiers.filter((_, k) => k !== ri) } : x))}><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setTables(tables.map((x, j) => j === ti ? { ...x, tiers: [...x.tiers, { min: 1, max: 20, label: "" } as TierRange] } : x))}>
            <Plus className="h-3 w-3 mr-1" /> Add tier
          </Button>
        </div>
      ))}
    </div>
  );
}
