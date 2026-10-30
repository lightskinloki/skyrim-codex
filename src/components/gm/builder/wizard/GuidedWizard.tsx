// The guided wizard. It takes someone who has never used this app from an empty
// screen to a finished, runnable adventure, one plain question at a time, and
// it is also where they come back to edit and improve it later.
//
//   Setup     → name it, choose an outline
//   Overview  → every scene, how finished it is, what to do next (the "home")
//   Scene     → one question per screen, with a coach beside it
//   Review    → what's missing + writing suggestions for the whole adventure
//   Try it    → run the adventure right here, exactly as Live Play does
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Undo2, Wrench, AlertTriangle, Lightbulb, ListChecks, PlayCircle,
} from "lucide-react";
import { CampaignModule, SceneNode } from "@/types/campaign";
import { WizardCtx, WizardStep, stepsForScene, sceneProgress } from "./steps";
import { CoachPanel } from "./CoachPanel";
import { Glossary } from "./Glossary";
import { Overview } from "./Overview";
import { SetupView } from "./SetupView";
import { reviewModule, ReviewItem } from "./review";
import { PLAIN_KIND } from "./copy";
import { RunsheetView } from "../../runsheet/RunsheetView";

type View =
  | { name: "setup" }
  | { name: "overview" }
  | { name: "scene"; sceneId: string; stepKey: string }
  | { name: "review" }
  | { name: "try" };

export function GuidedWizard({ module, setModule, startIn, savedLabel, onHome, onRun, onAdvanced }: {
  module: CampaignModule;
  setModule: (m: CampaignModule) => void;
  startIn: "setup" | "overview";
  savedLabel: string;
  onHome: () => void;
  onRun: () => void;
  onAdvanced: () => void;
}) {
  const [view, setView] = useState<View>(startIn === "setup" ? { name: "setup" } : { name: "overview" });
  const [tryIndex, setTryIndex] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  /* ---- editing with undo ----
   * `latest` always holds the newest module, so many quick keystrokes never
   * overwrite each other. Each burst of typing is one undo step. */
  const latest = useRef(module);
  useEffect(() => { latest.current = module; }, [module]);
  const undoStack = useRef<CampaignModule[]>([]);
  const lastPush = useRef(0);
  const [undoCount, setUndoCount] = useState(0);

  const apply = (fn: (m: CampaignModule) => CampaignModule) => {
    const prev = latest.current;
    const next = fn(prev);
    if (next === prev) return;
    if (Date.now() - lastPush.current > 1500) {
      undoStack.current.push(prev);
      if (undoStack.current.length > 40) undoStack.current.shift();
      setUndoCount(undoStack.current.length);
    }
    lastPush.current = Date.now();
    latest.current = next;
    setModule(next);
  };
  const undo = () => {
    const prev = undoStack.current.pop();
    setUndoCount(undoStack.current.length);
    if (!prev) return;
    lastPush.current = 0;
    latest.current = prev;
    setModule(prev);
  };
  const restore = (m: CampaignModule) => { apply(() => m); setView({ name: "overview" }); };

  // if the scene being edited was removed, go home
  useEffect(() => {
    if (view.name === "scene" && !module.scenes.some((s) => s.id === view.sceneId)) setView({ name: "overview" });
  }, [module.scenes, view]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [view]);

  const toScene = (sceneId: string, stepKey?: string) => {
    const scene = module.scenes.find((s) => s.id === sceneId); if (!scene) return;
    const steps = stepsForScene(scene);
    setView({ name: "scene", sceneId, stepKey: stepKey && steps.some((s) => s.key === stepKey) ? stepKey : steps[0].key });
  };

  const header = (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <Button size="sm" variant="ghost" onClick={onHome}><ArrowLeft className="h-4 w-4 mr-1" /> All adventures</Button>
      {view.name !== "overview" && view.name !== "setup" && (
        <Button size="sm" variant="ghost" onClick={() => setView({ name: "overview" })}>Back to my scenes</Button>
      )}
      <div className="ml-auto flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{savedLabel}</span>
        <Button size="sm" variant="outline" onClick={undo} disabled={undoCount === 0} title="Undo your last change"><Undo2 className="h-4 w-4 mr-1" /> Undo</Button>
        <Glossary />
        <Button size="sm" variant="ghost" onClick={onAdvanced} title="For people who already know the runsheet format"><Wrench className="h-4 w-4 mr-1" /> Advanced editing</Button>
      </div>
    </div>
  );

  let body: React.ReactNode = null;

  if (view.name === "setup") {
    body = <SetupView module={module} apply={apply} isNew={module.scenes.length === 0} onDone={() => setView({ name: "overview" })} />;
  } else if (view.name === "overview") {
    body = (
      <Overview module={module} apply={apply}
        onEditScene={toScene} onSetup={() => setView({ name: "setup" })}
        onReview={() => setView({ name: "review" })} onTestDrive={() => { setTryIndex(0); setView({ name: "try" }); }} onRun={onRun}
        canUndo={undoCount > 0} onUndo={undo} onRestore={restore} />
    );
  } else if (view.name === "review") {
    body = <ReviewView module={module} onGo={(sid, sk) => (sid ? toScene(sid, sk) : setView({ name: "overview" }))} onTry={() => { setTryIndex(0); setView({ name: "try" }); }} onRun={onRun} />;
  } else if (view.name === "try") {
    body = (
      <div className="space-y-3">
        <Card className="p-3 text-sm text-muted-foreground">
          This is your adventure exactly as it will look while you run the game. Click the buttons, roll the dice, open the cards. Nothing you do here changes your adventure. Blue boxes are what you read out loud; red boxes are reminders; maroon boxes are private notes.
        </Card>
        <RunsheetView module={module} sceneIndex={Math.min(tryIndex, Math.max(0, module.scenes.length - 1))} onSceneIndex={setTryIndex} deployEnemies={() => { /* practice mode */ }} />
        <div className="flex gap-2"><Button variant="outline" onClick={() => setView({ name: "overview" })}>Back to my scenes</Button><Button onClick={onRun}><PlayCircle className="h-4 w-4 mr-1" /> Run it for real</Button></div>
      </div>
    );
  } else {
    const scene = module.scenes.find((s) => s.id === view.sceneId)!;
    body = <SceneFlow module={module} scene={scene} stepKey={view.stepKey} apply={apply}
      onStep={(k) => setView({ name: "scene", sceneId: scene.id, stepKey: k })}
      onNextScene={(id) => toScene(id)} onOverview={() => setView({ name: "overview" })} onReview={() => setView({ name: "review" })} />;
  }

  return (
    <div ref={topRef} className="space-y-1">
      {header}
      {body}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One scene, one question per screen
 * ------------------------------------------------------------------ */

function SceneFlow({ module, scene, stepKey, apply, onStep, onNextScene, onOverview, onReview }: {
  module: CampaignModule; scene: SceneNode; stepKey: string;
  apply: (fn: (m: CampaignModule) => CampaignModule) => void;
  onStep: (key: string) => void; onNextScene: (sceneId: string) => void; onOverview: () => void; onReview: () => void;
}) {
  const steps = useMemo(() => stepsForScene(scene), [scene]);
  const idx = Math.max(0, steps.findIndex((s) => s.key === stepKey));
  const step: WizardStep = steps[idx];
  const sceneIdx = module.scenes.findIndex((s) => s.id === scene.id);
  const nextScene = module.scenes[sceneIdx + 1];
  const prog = sceneProgress(scene, module);

  const ctx: WizardCtx = {
    module, scene, otherScenes: module.scenes.filter((s) => s.id !== scene.id),
    patchScene: (p) => apply((m) => ({ ...m, scenes: m.scenes.map((s) => (s.id === scene.id ? { ...s, ...p } : s)) })),
    patchBlocks: (fn) => apply((m) => ({ ...m, scenes: m.scenes.map((s) => (s.id === scene.id ? { ...s, blocks: fn(s.blocks) } : s)) })),
    patchModule: (fn) => apply(fn),
  };

  const isLast = idx === steps.length - 1;
  const pct = Math.round(((idx + 1) / steps.length) * 100);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-cinzel text-xl font-bold">{scene.title || "Untitled scene"}</h2>
          <span className="text-xs text-muted-foreground">Scene {sceneIdx + 1} of {module.scenes.length} · {PLAIN_KIND[scene.kind ?? "scene"].name}</span>
        </div>
        <div className="h-1.5 bg-muted rounded mt-2 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="text-xs text-muted-foreground mt-1">Screen {idx + 1} of {steps.length}. You can skip around, and nothing here is permanent.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_340px] gap-4 items-start">
        {/* progress list */}
        <Card className="p-2 lg:sticky lg:top-20">
          <ul className="space-y-0.5">
            {steps.map((s, i) => {
              const done = s.done(scene, module);
              return (
                <li key={s.key}>
                  <button onClick={() => onStep(s.key)} className={`w-full text-left flex items-start gap-1.5 rounded px-2 py-1.5 text-xs ${i === idx ? "bg-accent/30 font-semibold" : "hover:bg-accent/10"}`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
                    <span>{s.label}{s.optional && <span className="text-muted-foreground font-normal"> (optional)</span>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* the question */}
        <Card className="p-5 space-y-5">
          <h3 className="font-cinzel text-xl font-bold leading-snug">{step.headline}</h3>
          <div className="space-y-5">{step.render(ctx)}</div>
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => onStep(steps[idx - 1].key)} disabled={idx === 0}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <div className="ml-auto flex gap-2 flex-wrap">
              {!isLast && <Button onClick={() => onStep(steps[idx + 1].key)}>{step.optional && !step.done(scene, module) ? "Skip for now" : "Next"} <ArrowRight className="h-4 w-4 ml-1" /></Button>}
              {isLast && (
                <>
                  <Button variant="outline" onClick={onOverview}>Back to my scenes</Button>
                  {nextScene
                    ? <Button onClick={() => onNextScene(nextScene.id)}>Next scene: {nextScene.title || "Untitled"} <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    : <Button onClick={onReview}>Check everything <ArrowRight className="h-4 w-4 ml-1" /></Button>}
                </>
              )}
            </div>
          </div>
          {isLast && prog.missing.length > 0 && (
            <p className="text-xs text-amber-500">Before you move on: this scene still needs {prog.missing.map((m) => `"${m.label}"`).join(", ")}. You can come back any time.</p>
          )}
        </Card>

        {/* the coach */}
        <CoachPanel step={step} ctx={ctx} onJump={onStep} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Check everything
 * ------------------------------------------------------------------ */

function ReviewView({ module, onGo, onTry, onRun }: { module: CampaignModule; onGo: (sceneId?: string, stepKey?: string) => void; onTry: () => void; onRun: () => void }) {
  const items = useMemo(() => reviewModule(module), [module]);
  const todos = items.filter((i) => i.level === "todo");
  const notes = items.filter((i) => i.level !== "todo");
  const [open, setOpen] = useState<number | null>(null);

  const row = (it: ReviewItem, i: number) => (
    <li key={i} className={`rounded border px-3 py-2 text-sm ${it.level === "todo" ? "border-red-500/40 bg-red-500/5" : it.level === "warn" ? "border-amber-500/50 bg-amber-500/10" : "border-blue-500/40 bg-blue-500/10"}`}>
      <div className="flex gap-2 items-start">
        {it.level === "todo" ? <ListChecks className="h-4 w-4 text-red-400 mt-0.5 shrink-0" /> : it.level === "warn" ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> : <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />}
        <div className="flex-1">
          <p>{it.text}</p>
          {it.why && (
            <>
              <button className="text-xs underline text-muted-foreground" onClick={() => setOpen(open === i ? null : i)}>{open === i ? "Hide why" : "Why does this matter?"}</button>
              {open === i && <p className="text-xs text-muted-foreground mt-1">{it.why}</p>}
            </>
          )}
        </div>
        {(it.sceneId || it.level === "todo") && <Button size="sm" variant="outline" onClick={() => onGo(it.sceneId, it.stepKey)}>Take me there</Button>}
      </div>
    </li>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h2 className="font-cinzel text-2xl font-bold">Check everything</h2>
        <p className="text-sm text-muted-foreground mt-1">A read-through of your whole adventure. "To do" items are things still missing. Suggestions are optional: they're writing tips that make things easier to run at the table, and you decide whether to act on them.</p>
      </div>
      {items.length === 0 ? (
        <Card className="p-5 space-y-3">
          <p className="flex items-center gap-2 text-green-500 font-medium"><CheckCircle2 className="h-5 w-5" /> Nothing is missing and there are no suggestions. This adventure is ready to run.</p>
          <div className="flex gap-2"><Button variant="outline" onClick={onTry}>Try it out first</Button><Button onClick={onRun}><PlayCircle className="h-4 w-4 mr-1" /> Run it for real</Button></div>
        </Card>
      ) : (
        <>
          {todos.length > 0 && <div className="space-y-2"><h3 className="font-semibold text-sm">To do ({todos.length})</h3><ul className="space-y-2">{todos.map((it, i) => row(it, i))}</ul></div>}
          {notes.length > 0 && <div className="space-y-2"><h3 className="font-semibold text-sm">Suggestions ({notes.length})</h3><ul className="space-y-2">{notes.map((it, i) => row(it, i + 1000))}</ul></div>}
          <div className="flex gap-2 pt-2"><Button variant="outline" onClick={onTry}>Try it out anyway</Button><Button variant="outline" onClick={onRun}>Run it anyway</Button></div>
        </>
      )}
    </div>
  );
}
