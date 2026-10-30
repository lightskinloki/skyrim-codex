// The Forge's front door. It assumes nobody has used this before: it says what
// the tool is for, how it works, and offers the three easiest ways to begin.
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, Plus, Trash2, FolderOpen, Upload, Swords } from "lucide-react";
import { CampaignModule } from "@/types/campaign";

export function Home({ modules, bundled, onOpen, onBundled, onNew, onSample, onDelete, onImportFile }: {
  modules: CampaignModule[];
  bundled: CampaignModule[];
  onOpen: (id: string) => void;
  onBundled: (id: string) => void;
  onNew: () => void;
  onSample: () => void;
  onDelete: (id: string) => void;
  onImportFile: (file: File) => void;
}) {
  const first = modules.length === 0 && bundled.length === 0;
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="font-cinzel text-2xl font-bold">{first ? "Welcome. Let's build your first adventure." : "Your adventures"}</h2>
        {first && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            This tool helps you get ready to run a tabletop roleplaying game session. You don't need any experience, and you don't need to read anything first. It asks you one plain question at a time, explains why each one matters, and shows you how your answers will look while you're running the game.
          </p>
        )}
      </div>

      {first && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">How it works</h3>
          <ol className="text-sm list-decimal ml-5 space-y-1 text-muted-foreground">
            <li><span className="text-foreground">Answer questions.</span> Each screen asks one thing, like "What do the players see when they arrive?"</li>
            <li><span className="text-foreground">Watch it take shape.</span> A preview beside each question shows exactly how your answer will look during the game.</li>
            <li><span className="text-foreground">Run it.</span> When you're ready, open it in Live Play, the screen you use at the table. Your work is saved automatically.</li>
          </ol>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Card className="p-4 space-y-2 border-primary/50">
          <h3 className="font-semibold flex items-center gap-1.5"><Plus className="h-4 w-4 text-primary" /> Build a new adventure</h3>
          <p className="text-sm text-muted-foreground">I'll walk you through it, one question at a time.</p>
          <Button onClick={onNew}>Start building</Button>
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-400" /> Show me a finished example first</h3>
          <p className="text-sm text-muted-foreground">A short sample adventure, already filled in. Look through it, run it, and change anything to see how it works.</p>
          <Button variant="outline" onClick={onSample}>Open the example</Button>
        </Card>
      </div>

      {bundled.length > 0 && (
        <Card className="p-4 space-y-2 border-amber-500/40">
          <h3 className="font-semibold flex items-center gap-1.5"><Swords className="h-4 w-4 text-amber-400" /> Ready to run</h3>
          <p className="text-sm text-muted-foreground">
            A finished adventure, already written — every scene, branch, spoken line and hand-out is in place. Open it, look around, then run it from Live Play. Changes you make are yours.
          </p>
          {bundled.map((b) => (
            <div key={b.id} className="flex items-center gap-2 border rounded p-2">
              <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {b.scenes.length} scenes{b.badge ? ` · ${b.badge}` : ""}
                </div>
                {b.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.description}</div>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">Bundled</Badge>
              <Button size="sm" onClick={() => onBundled(b.id)}>Open</Button>
            </div>
          ))}
        </Card>
      )}

      {modules.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold flex items-center gap-1.5"><FolderOpen className="h-4 w-4" /> Continue an adventure</h3>
          <div className="space-y-2">
            {modules.map((m) => (
              <div key={m.id} className="flex items-center gap-2 border rounded p-2">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{m.name || "Untitled adventure"}</div>
                  <div className="text-xs text-muted-foreground">{m.scenes.length} scene{m.scenes.length === 1 ? "" : "s"}</div>
                </div>
                <Button size="sm" onClick={() => onOpen(m.id)}>Open</Button>
                <button className="p-1 text-muted-foreground hover:text-destructive" title="Delete this adventure" onClick={() => onDelete(m.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Already have a written runsheet? (advanced)</summary>
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">If you have notes in the runsheet text format (.md), you can bring them in here. Most people won't need this.</p>
          <label>
            <input type="file" accept=".md,.markdown,text/markdown" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
            <Button asChild size="sm" variant="outline"><span><Upload className="h-4 w-4 mr-1" /> Choose a .md file</span></Button>
          </label>
        </div>
      </details>
    </div>
  );
}
