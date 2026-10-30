// Pillar 2 — The Forge. By default this is the guided wizard: it assumes the
// person has never built an adventure before, asks one plain question at a time,
// explains why, and shows a live preview. "Advanced editing" (AdvancedForge) is
// the old everything-on-one-screen editor for people who know the format.
//
// Work saves itself: every change is written to the campaign after a short
// pause, and earlier versions are kept, so there is no Save button to forget.
import { SetStateAction, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCampaign } from "../CampaignContext";
import { CampaignModule, CAMPAIGN_SCHEMA_VERSION } from "@/types/campaign";
import { migrateModule, uid } from "@/utils/sceneBlocks";
import { compileModule } from "@/utils/moduleCompiler";
import { GuidedWizard } from "./wizard/GuidedWizard";
import { Home } from "./wizard/Home";
import { AdvancedForge } from "./AdvancedForge";
import { buildSampleModule } from "./wizard/sampleModule";
import { pushSnapshot } from "./wizard/history";
import { SAMPLE } from "./wizard/sampleText";
import { BUNDLED_MODULES } from "@/data/bundledModules";

export function ModuleBuilder({ onRunModule }: { onRunModule?: (moduleId: string) => void }) {
  const { campaign, update } = useCampaign();
  const { toast } = useToast();
  const [module, setModuleState] = useState<CampaignModule | null>(null);
  const [startIn, setStartIn] = useState<"setup" | "overview">("overview");
  const [mode, setMode] = useState<"guided" | "advanced">("guided");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const latest = useRef<CampaignModule | null>(null);
  latest.current = module;

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);

  const persist = (m: CampaignModule) => {
    const normalized = { ...m, scenes: m.scenes.map((s) => ({ ...s, moduleId: m.id })) };
    update((c) => ({
      ...c,
      modules: c.modules.some((x) => x.id === m.id) ? c.modules.map((x) => (x.id === m.id ? normalized : x)) : [...c.modules, normalized],
    }));
    pushSnapshot(normalized, "Automatic save", 3 * 60 * 1000);
    setSavedAt(Date.now());
  };

  // autosave: a moment after the last change
  useEffect(() => {
    if (!module) return;
    if (!module.name.trim() && module.scenes.length === 0) return; // nothing worth saving yet
    const t = setTimeout(() => persist(module), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const open = (m: CampaignModule, s: "setup" | "overview") => {
    setModuleState(m); setStartIn(s); setMode("guided"); setSavedAt(null);
  };
  const openExisting = (id: string) => {
    const m = campaign.modules.find((x) => x.id === id);
    if (m) open(migrateModule(JSON.parse(JSON.stringify(m))), "overview");
  };
  const newAdventure = () =>
    open({ id: uid(), name: "", description: "", tierTables: [], scenes: [], schemaVersion: CAMPAIGN_SCHEMA_VERSION }, "setup");
  // Bundled adventures ship with the app (converted oneshots). Opening one is
  // the same as importing a sheet: it lands in the campaign, then autosaves.
  const openBundled = (id: string) => {
    const bundled = BUNDLED_MODULES.find((m) => m.id === id);
    if (!bundled) return;
    const existing = campaign.modules.find((m) => m.name === bundled.name);
    if (existing) { openExisting(existing.id); return; }
    open(migrateModule(JSON.parse(JSON.stringify(bundled))), "overview");
    toast({ title: "Adventure loaded", description: `${bundled.scenes.length} scenes ready. Run it from Live Play.` });
  };
  const openSample = () => {
    const existing = campaign.modules.find((m) => m.name === SAMPLE.moduleName);
    if (existing) { openExisting(existing.id); return; }
    open(buildSampleModule(), "overview");
    toast({ title: "Sample adventure ready", description: "It's saved, so you can run it in Live Play. Change anything you like." });
  };
  const deleteAdventure = (id: string) => {
    const m = campaign.modules.find((x) => x.id === id);
    if (!m || !confirm(`Delete "${m.name || "Untitled adventure"}" and all of its scenes? This can't be undone.`)) return;
    update((c) => ({ ...c, modules: c.modules.filter((x) => x.id !== id) }));
  };
  const importFile = (file: File) => {
    file.text().then((text) => {
      const r = compileModule(text, file.name.replace(/\.(md|markdown)$/i, ""));
      open(migrateModule(r.module), "overview");
      toast({ title: "Imported", description: `${r.module.scenes.length} scenes brought in. Open any scene to fill in what's missing.` });
    });
  };
  const run = () => { if (latest.current) { persist(latest.current); onRunModule?.(latest.current.id); } };

  const savedLabel = savedAt
    ? `Saved automatically · ${Math.max(0, Math.round((now - savedAt) / 1000)) < 60 ? "just now" : `${Math.round((now - savedAt) / 60000)} min ago`}`
    : "Your work saves automatically";

  if (!module) {
    const unloaded = BUNDLED_MODULES.filter((b) => !campaign.modules.some((m) => m.name === b.name));
    return <Home modules={campaign.modules} bundled={unloaded} onOpen={openExisting} onBundled={openBundled} onNew={newAdventure} onSample={openSample} onDelete={deleteAdventure} onImportFile={importFile} />;
  }

  if (mode === "advanced") {
    const setAdv = (v: SetStateAction<CampaignModule>) => setModuleState((prev) => (typeof v === "function" ? (v as (m: CampaignModule) => CampaignModule)(prev as CampaignModule) : v));
    return <AdvancedForge module={module} setModule={setAdv} onBack={() => setMode("guided")} />;
  }

  return (
    <GuidedWizard
      key={module.id}
      module={module}
      setModule={setModuleState}
      startIn={startIn}
      savedLabel={savedLabel}
      onHome={() => { if (latest.current && (latest.current.name.trim() || latest.current.scenes.length)) persist(latest.current); setModuleState(null); }}
      onRun={run}
      onAdvanced={() => setMode("advanced")}
    />
  );
}
