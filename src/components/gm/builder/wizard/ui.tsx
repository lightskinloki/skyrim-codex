// Building blocks for the guided wizard. Every question carries: the question
// in plain words, a sentence of help, an example from the sample story, and
// (when a field has text) live notes from the coach.
import { ReactNode, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, DoorOpen, Lightbulb, AlertTriangle, ChevronRight } from "lucide-react";
import { ExitLink, SceneNode } from "@/types/campaign";
import { uid } from "@/utils/sceneBlocks";
import { enemyTemplates } from "@/data/enemies";
import { Tip } from "./coach";

export const selectCls = "bg-background border border-border rounded px-2 py-1 text-sm";

/** Coach notes under a field: amber for "heads up", blue for "idea", each with a "why". */
export function Tips({ tips }: { tips: Tip[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (tips.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {tips.map((t, i) => (
        <div key={i} className={`rounded border px-2.5 py-1.5 text-xs ${t.level === "warn" ? "border-amber-500/50 bg-amber-500/10" : "border-blue-500/40 bg-blue-500/10"}`}>
          <div className="flex gap-1.5 items-start">
            {t.level === "warn" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /> : <Lightbulb className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <span className="font-medium">{t.text}</span>{" "}
              <button className="underline text-muted-foreground" onClick={() => setOpen(open === i ? null : i)}>{open === i ? "Hide why" : "Why?"}</button>
              {open === i && <p className="mt-1 text-muted-foreground">{t.why}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** One question: bold prompt, plain help, the answer field(s), an example, and coach notes. */
export function Ask({ q, help, example, tips, children }: { q: string; help?: string; example?: string; tips?: Tip[]; children: ReactNode }) {
  const [showEx, setShowEx] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold leading-snug">{q}</Label>
      {help && <p className="text-xs text-muted-foreground leading-relaxed">{help}</p>}
      {children}
      {tips && <Tips tips={tips} />}
      {example && (
        <div>
          <button className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5" onClick={() => setShowEx((s) => !s)}>
            <ChevronRight className={`h-3 w-3 transition-transform ${showEx ? "rotate-90" : ""}`} /> {showEx ? "Hide example" : "Show me an example"}
          </button>
          {showEx && <p className="mt-1 text-xs italic text-muted-foreground border-l-2 pl-2 whitespace-pre-line">{example}</p>}
        </div>
      )}
    </div>
  );
}

/** A screen's opening line: what this is, in words a stranger understands. */
export function StepIntro({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground border-l-2 border-primary/50 pl-3 leading-relaxed">{children}</p>;
}

/** Textarea whose value is a list of lines. */
export function LinesAsk({ value, onChange, placeholder, rows = 4 }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; rows?: number;
}) {
  return (
    <Textarea
      value={value.join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      className="text-sm"
      style={{ minHeight: `${rows * 1.6}rem` }}
      placeholder={placeholder}
    />
  );
}

/** Paragraph textarea (blank line = new paragraph). */
export function ParagraphsAsk({ value, onChange, placeholder, rows = 6, blue }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; rows?: number; blue?: boolean;
}) {
  return (
    <Textarea
      value={value.join("\n\n")}
      onChange={(e) => onChange(e.target.value.split(/\n\s*\n/))}
      className={`text-sm ${blue ? "border-l-4 border-l-blue-500" : ""}`}
      style={{ minHeight: `${rows * 1.6}rem` }}
      placeholder={placeholder}
    />
  );
}

/** Repeating rows with add/remove. */
export function Rows<T>({ rows, onChange, newRow, render, addLabel, min = 0, empty }: {
  rows: T[];
  onChange: (rows: T[]) => void;
  newRow: () => T;
  render: (row: T, patch: (p: Partial<T>) => void, index: number) => ReactNode;
  addLabel: string;
  min?: number;
  empty?: string;
}) {
  return (
    <div className="space-y-2">
      {rows.length === 0 && empty && <p className="text-xs text-muted-foreground italic">{empty}</p>}
      {rows.map((row, i) => (
        <div key={i} className="border rounded p-2 flex gap-2 items-start bg-background/40">
          <div className="flex-1 space-y-1.5 min-w-0">
            {render(row, (p) => onChange(rows.map((r, j) => (j === i ? { ...r, ...p } : r))), i)}
          </div>
          {rows.length > min && (
            <button className="text-muted-foreground hover:text-destructive mt-1" title="Remove this" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...rows, newRow()])}>
        <Plus className="h-3.5 w-3.5 mr-1" /> {addLabel}
      </Button>
    </div>
  );
}

/** Pick monsters from the built-in list. */
export function EnemyPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((id) => {
          const t = enemyTemplates.find((e) => e.id === id);
          return (
            <Badge key={id} variant={t ? "secondary" : "destructive"} className="text-xs">
              {t ? t.name : `${id}?`}
              <button className="ml-1" onClick={() => onChange(value.filter((e) => e !== id))}><X className="h-3 w-3" /></button>
            </Badge>
          );
        })}
        {value.length === 0 && <span className="text-xs text-muted-foreground">None picked yet.</span>}
      </div>
      <select className={selectCls} value="" onChange={(e) => { const id = e.target.value; if (id && !value.includes(id)) onChange([...value, id]); }}>
        <option value="">+ Pick a monster from the list…</option>
        {enemyTemplates.filter((t) => !value.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name} (HP {t.hp})</option>)}
      </select>
    </div>
  );
}

/** Where does the story go after this scene? */
export function ExitsAsk({ exits, otherScenes, onChange }: { exits: ExitLink[]; otherScenes: SceneNode[]; onChange: (e: ExitLink[]) => void }) {
  return (
    <Rows
      rows={exits}
      onChange={onChange}
      newRow={() => ({ id: uid(), description: "" })}
      addLabel="Add another way this scene can end"
      empty="Nothing here yet. If this is the last scene of your adventure, that's fine."
      render={(ex, patch) => (
        <>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input value={ex.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What happens next (e.g. They go down to the cellar)" />
          </div>
          <select className={`${selectCls} w-full`} value={ex.targetSceneId ?? ""} onChange={(e) => patch({ targetSceneId: e.target.value || undefined })}>
            <option value="">Then the next scene in your list</option>
            {otherScenes.map((s) => <option key={s.id} value={s.id}>Jump to: {s.title}</option>)}
          </select>
        </>
      )}
    />
  );
}
