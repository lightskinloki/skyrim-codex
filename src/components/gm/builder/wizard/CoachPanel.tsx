// The wizard's side panel. For the current screen it says, in plain words:
// what this is, why it matters at the table, and what you'll see as a result;
// offers a ready-made example; lists what's still missing in this scene; and
// shows the scene exactly as it will look while you run the game.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Sparkles, Eye, HelpCircle } from "lucide-react";
import { SceneBlocks, RenderCtx } from "../../runsheet/SceneBlockRenderer";
import "../../runsheet/runsheet.css";
import { WizardStep, WizardCtx } from "./steps";
import { sceneProgress } from "./steps";

export function CoachPanel({ step, ctx, onJump }: { step: WizardStep; ctx: WizardCtx; onJump: (stepKey: string) => void }) {
  const [filled, setFilled] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const prog = sceneProgress(ctx.scene, ctx.module);
  const missing = prog.missing.filter((s) => s.key !== step.key);
  const alreadyDone = step.done(ctx.scene, ctx.module);

  const previewCtx: RenderCtx = { goToScene: () => { /* preview only */ }, sceneTitle: (id) => ctx.module.scenes.find((s) => s.id === id)?.title };

  return (
    <div className="space-y-3">
      <Card className="p-3 space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-1.5"><HelpCircle className="h-4 w-4 text-primary" /> About this screen</h4>
        <div className="text-xs space-y-2 leading-relaxed">
          <p><span className="font-semibold">What it is:</span> {step.about.what}</p>
          <p><span className="font-semibold">Why it matters:</span> {step.about.why}</p>
          {step.about.result && <p><span className="font-semibold">What you'll see when you run the game:</span> {step.about.result}</p>}
          {step.optional && <p className="text-muted-foreground italic">This screen is optional. Skip it if it doesn't fit your scene.</p>}
        </div>
      </Card>

      {step.sample && (
        <Card className="p-3 space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-400" /> Not sure what to write?</h4>
          <p className="text-xs text-muted-foreground">{step.sample.blurb} The example comes from a small sample story, "The Silent Mill". Fill it in, then change anything you like.</p>
          <Button size="sm" variant="outline" className="w-full"
            onClick={() => {
              if (alreadyDone && !confirm("This will replace what you've written on this screen with the example. You can undo it. Continue?")) return;
              step.sample!.apply(ctx);
              setFilled(step.key);
            }}>
            Fill in the example
          </Button>
          {filled === step.key && <p className="text-xs text-green-500">Filled in. Edit it to match your own story. If you don't like it, press Undo at the top.</p>}
        </Card>
      )}

      {missing.length > 0 && (
        <Card className="p-3 space-y-1.5">
          <h4 className="text-sm font-semibold">Still to do in this scene</h4>
          <ul className="space-y-1">
            {missing.map((s) => (
              <li key={s.key}>
                <button className="text-xs flex items-center gap-1.5 hover:underline text-left" onClick={() => onJump(s.key)}>
                  <Circle className="h-3 w-3 text-muted-foreground shrink-0" /> {s.label}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {missing.length === 0 && (
        <Card className="p-3">
          <p className="text-xs flex items-center gap-1.5 text-green-500"><CheckCircle2 className="h-4 w-4" /> Everything this scene needs is filled in.</p>
        </Card>
      )}

      <Card className="p-3 space-y-2">
        <button className="text-sm font-semibold flex items-center gap-1.5 w-full text-left" onClick={() => setShowPreview((v) => !v)}>
          <Eye className="h-4 w-4 text-primary" /> How this scene will look {showPreview ? "(hide)" : "(show)"}
        </button>
        {showPreview && (
          <div className="rs rs-preview-frame max-h-[420px] overflow-auto" style={{ padding: "0.5rem" }}>
            <section className={`rs-scene${ctx.scene.accent ? ` accent-${ctx.scene.accent}` : ""}`} style={{ padding: "1rem" }}>
              <div className="rs-scene-header">
                {ctx.scene.label && <div className="rs-scene-number">{ctx.scene.label}</div>}
                <h2 className="rs-scene-title" style={{ fontSize: "1.25rem" }}>{ctx.scene.title}</h2>
                {ctx.scene.subtitle && <p className="rs-scene-subtitle">{ctx.scene.subtitle}</p>}
              </div>
              <SceneBlocks blocks={ctx.scene.blocks} ctx={previewCtx} />
            </section>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">This is a live preview. It updates as you type, and it's what you'll see in Live Play.</p>
      </Card>
    </div>
  );
}
