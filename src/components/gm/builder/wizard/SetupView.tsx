// First-run setup: name the adventure, then choose how to start laying it out.
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { CampaignModule, SceneKind } from "@/types/campaign";
import { createSceneOfKind } from "@/utils/sceneBlocks";
import { Ask, StepIntro } from "./ui";
import { PLAIN_KIND, TYPICAL_OUTLINE } from "./copy";

export function SetupView({ module, apply, isNew, onDone }: {
  module: CampaignModule;
  apply: (fn: (m: CampaignModule) => CampaignModule) => void;
  isNew: boolean;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"info" | "plan">("info");

  const addScenes = (kinds: { kind: SceneKind; title: string }[]) => {
    apply((m) => ({ ...m, scenes: [...m.scenes, ...kinds.map((k) => createSceneOfKind(k.kind, k.title, m.id))] }));
    onDone();
  };

  if (phase === "info") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="font-cinzel text-2xl font-bold">{isNew ? "Let's start your adventure" : "Your adventure's name and summary"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            An <span className="font-semibold">adventure</span> is one game session's worth of story, or a short story with several scenes. You can change everything you type here at any time, and your work is saved automatically.
          </p>
        </div>
        <Card className="p-5 space-y-5">
          <Ask q="What is your adventure called?" help="A working title is fine. Nobody sees it but you." example="The Silent Mill">
            <Input value={module.name} onChange={(e) => apply((m) => ({ ...m, name: e.target.value }))} placeholder="e.g. The Silent Mill" />
          </Ask>
          <Ask q="In a sentence or two, where does the first session begin?" help="This appears at the top of your screen while you run the game, as a reminder." example="The party has just reached the village of Alder Ford, where the mill has stopped turning.">
            <Textarea className="min-h-[80px] text-sm" value={module.description ?? ""} onChange={(e) => apply((m) => ({ ...m, description: e.target.value }))} />
          </Ask>
        </Card>
        <div className="flex justify-end">
          <Button onClick={() => (isNew ? setPhase("plan") : onDone())}>{isNew ? "Next: plan your scenes" : "Done"} <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="font-cinzel text-2xl font-bold">How do you want to start?</h2>
        <StepIntro>A <span className="font-semibold">scene</span> is one moment or place in your adventure: a room the players explore, a talk with someone, a fight. You'll add scenes one at a time, and each type of scene gets its own set of questions. You can add, remove, and reorder scenes later.</StepIntro>
      </div>

      <div className="grid gap-3">
        <Card className="p-4 space-y-2 border-primary/50">
          <h3 className="font-semibold">Give me a typical outline <span className="text-xs font-normal text-primary ml-1">Recommended if you're new</span></h3>
          <p className="text-sm text-muted-foreground">Six scenes that fit most sessions. You'll fill them in one at a time, and delete any you don't need.</p>
          <ol className="text-sm list-decimal ml-5 space-y-0.5">
            {TYPICAL_OUTLINE.map((t) => <li key={t.title}><span className="font-medium">{t.title}</span> <span className="text-muted-foreground">({PLAIN_KIND[t.kind].short})</span></li>)}
          </ol>
          <Button onClick={() => addScenes(TYPICAL_OUTLINE)}>Use this outline</Button>
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">Start with just one scene</h3>
          <p className="text-sm text-muted-foreground">Begin with "Start of the session": a recap, who's in the room, and what the players can do first. Add more scenes when you're ready.</p>
          <Button variant="outline" onClick={() => addScenes([TYPICAL_OUTLINE[0]])}>Start with one scene</Button>
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">I'll pick my own scenes</h3>
          <p className="text-sm text-muted-foreground">You'll go to your adventure's overview and choose each scene type yourself.</p>
          <Button variant="outline" onClick={onDone}>Go to the overview</Button>
        </Card>
      </div>
    </div>
  );
}
