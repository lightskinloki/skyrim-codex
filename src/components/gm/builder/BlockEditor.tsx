// Generic editor for one SceneBlock — every block kind gets its own compact
// form here. Branch/choices recurse into BlockListEditor for nested content;
// director/combat open their own dedicated editors (DirectorEditor / CombatEditor).
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ChevronUp, ChevronDown, X, ChevronRight, Copy,
} from "lucide-react";
import {
  SceneBlock, BranchTone, Difficulty, CheckStat, DIFFICULTY_PENALTY,
} from "@/types/campaign";
import { BLOCK_META, NESTED_KINDS, block, uid, cloneBlock } from "@/utils/sceneBlocks";
import { DirectorEditor } from "./DirectorEditor";
import { CombatEditor } from "./CombatEditor";
import { useCampaign } from "../CampaignContext";

const selectCls = "bg-background border border-border rounded px-2 py-1 text-sm";
const TONES: BranchTone[] = ["red", "green", "gold", "blue", "neutral"];
const DIFFICULTIES = Object.keys(DIFFICULTY_PENALTY) as Difficulty[];
const STATS: CheckStat[] = ["might", "agility", "magic", "guile", "none"];

/* ------------------------------------------------------------------ *
 * The list: add / reorder / remove / duplicate any block kind
 * ------------------------------------------------------------------ */

export function BlockListEditor({ blocks, onChange, allow = NESTED_KINDS, compact }: {
  blocks: SceneBlock[];
  onChange: (b: SceneBlock[]) => void;
  /** Kinds offered in "+ Add block". Defaults to nested-safe kinds. */
  allow?: SceneBlock["kind"][];
  compact?: boolean;
}) {
  const patch = (i: number, next: SceneBlock) => onChange(blocks.map((b, j) => (j === i ? next : b)));
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= blocks.length) return;
    const arr = [...blocks]; [arr[i], arr[j]] = [arr[j], arr[i]]; onChange(arr);
  };
  const duplicate = (i: number) => onChange([...blocks.slice(0, i + 1), cloneBlock(blocks[i]), ...blocks.slice(i + 1)]);
  const add = (kind: SceneBlock["kind"]) => onChange([...blocks, newBlockOf(kind)]);

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => (
        <div key={b.id} className="border rounded p-2 space-y-1.5 bg-background/40">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono flex-1">{BLOCK_META[b.kind].label}</span>
            <button className="text-muted-foreground hover:text-foreground" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="h-3.5 w-3.5" /></button>
            <button className="text-muted-foreground hover:text-foreground" onClick={() => move(i, 1)} disabled={i === blocks.length - 1}><ChevronDown className="h-3.5 w-3.5" /></button>
            <button className="text-muted-foreground hover:text-foreground" onClick={() => duplicate(i)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
            <button className="text-muted-foreground hover:text-destructive" onClick={() => remove(i)}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <BlockForm block={b} onChange={(next) => patch(i, next)} compact={compact} />
        </div>
      ))}
      <AddBlockMenu allow={allow} onAdd={add} />
    </div>
  );
}

function newBlockOf(kind: SceneBlock["kind"]): SceneBlock {
  switch (kind) {
    case "readAloud": return block("readAloud", { paragraphs: [""] });
    case "gmNote": return block("gmNote", { text: "" });
    case "gmAlert": return block("gmAlert", { text: "" });
    case "stop": return block("stop", { text: "GM: STOP. Turn to " });
    case "spoken": return block("spoken", { speaker: "", line: "" });
    case "handout": return block("handout", { title: "", text: "" });
    case "list": return block("list", { items: [""] });
    case "text": return block("text", { text: "" });
    case "heading": return block("heading", { text: "" });
    case "quote": return block("quote", { lines: [""] });
    case "card": return block("card", { title: "", items: [] });
    case "branch": return block("branch", { title: "", tone: "neutral", blocks: [] });
    case "choices": return block("choices", { options: [] });
    case "check": return block("check", { stat: "none", difficulty: "Standard", penalty: 0 });
    case "findable": return block("findable", { name: "", description: "" });
    case "exit": return block("exit", { description: "" });
    case "director": return block("director", { director: { npc: "", mustSay: [], always: [], beats: [], groups: [], startNodeId: "", hubNodeId: "", nodes: [] } });
    case "combat": return block("combat", { combat: { title: "Combat Manager", statusFields: [], trackers: [], cards: [], triggers: [], enemies: [] } });
  }
}

function AddBlockMenu({ allow, onAdd }: { allow: SceneBlock["kind"][]; onAdd: (k: SceneBlock["kind"]) => void }) {
  return (
    <select className={`${selectCls} w-full`} value="" onChange={(e) => { if (e.target.value) onAdd(e.target.value as SceneBlock["kind"]); e.target.value = ""; }}>
      <option value="">+ Add block…</option>
      {allow.map((k) => <option key={k} value={k}>{BLOCK_META[k].label}</option>)}
    </select>
  );
}

/* ------------------------------------------------------------------ *
 * Per-kind forms
 * ------------------------------------------------------------------ */

function LinesField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        className="min-h-[60px] text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}

function ParagraphsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <Label className="text-xs">Paragraphs (blank line = new paragraph)</Label>
      <Textarea
        value={value.join("\n\n")}
        onChange={(e) => onChange(e.target.value.split(/\n\s*\n/))}
        className="min-h-[90px] border-l-4 border-l-blue-500 text-sm"
        placeholder="What is physically there, in order. No PC feelings or conclusions."
      />
    </div>
  );
}

function BlockForm({ block: b, onChange, compact }: { block: SceneBlock; onChange: (b: SceneBlock) => void; compact?: boolean }) {
  const { campaign } = useCampaign();
  const tierTables = campaign.modules.flatMap((m) => m.tierTables ?? []);
  const hint = !compact && <p className="text-[11px] text-muted-foreground">{BLOCK_META[b.kind].hint}</p>;

  switch (b.kind) {
    case "readAloud":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2">
            <Input value={b.tag ?? ""} onChange={(e) => onChange({ ...b, tag: e.target.value })} placeholder="Tag (optional, e.g. RESUME THE VAULT)" className="flex-1" />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={b.tone === "danger"} onChange={(e) => onChange({ ...b, tone: e.target.checked ? "danger" : undefined })} /> failure/danger (red)</label>
          </div>
          <ParagraphsField value={b.paragraphs} onChange={(paragraphs) => onChange({ ...b, paragraphs })} />
        </div>
      );
    case "gmNote":
    case "gmAlert":
      return (
        <div className="space-y-1.5">
          {hint}
          <Input value={b.tag ?? ""} onChange={(e) => onChange({ ...b, tag: e.target.value } as SceneBlock)} placeholder='Tag (defaults to "GM:")' />
          <Textarea value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value } as SceneBlock)} className="min-h-[50px] text-sm" placeholder="What this establishes / the instruction." />
          <LinesField label="Bulleted items (optional)" value={b.items ?? []} onChange={(items) => onChange({ ...b, items } as SceneBlock)} />
        </div>
      );
    case "stop":
      return (
        <div className="space-y-1.5">
          {hint}
          <Input value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} placeholder="GM: STOP. Turn to X's player. Do they...?" />
        </div>
      );
    case "spoken":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2">
            <Input value={b.speaker} onChange={(e) => onChange({ ...b, speaker: e.target.value })} placeholder="Speaker (NAME)" className="flex-1" />
            <Input value={b.direction ?? ""} onChange={(e) => onChange({ ...b, direction: e.target.value })} placeholder="Stage direction (optional)" className="flex-1" />
            <select className={selectCls} value={b.tone ?? "neutral"} onChange={(e) => onChange({ ...b, tone: e.target.value as BranchTone })}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Textarea value={b.line} onChange={(e) => onChange({ ...b, line: e.target.value })} className="min-h-[50px] text-sm" placeholder='What does the SPEAKER get from saying this?' />
        </div>
      );
    case "handout":
      return (
        <div className="space-y-1.5">
          {hint}
          <Input value={b.title} onChange={(e) => onChange({ ...b, title: e.target.value })} placeholder="Title" />
          <Textarea value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} className="min-h-[70px] text-sm" placeholder="The exact in-world text." />
        </div>
      );
    case "list":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2 items-center">
            <Input value={b.title ?? ""} onChange={(e) => onChange({ ...b, title: e.target.value })} placeholder="Title (optional)" className="flex-1" />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!b.ordered} onChange={(e) => onChange({ ...b, ordered: e.target.checked })} /> numbered</label>
          </div>
          <LinesField label="Items (one per line)" value={b.items} onChange={(items) => onChange({ ...b, items })} />
        </div>
      );
    case "text":
      return (
        <div className="space-y-1.5">
          {hint}
          <Textarea value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} className="min-h-[40px] text-sm" placeholder="Paragraph." />
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!b.small} onChange={(e) => onChange({ ...b, small: e.target.checked })} /> small / source citation</label>
        </div>
      );
    case "heading":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2">
            <Input value={b.text} onChange={(e) => onChange({ ...b, text: e.target.value })} placeholder="1. THE CRASH & THE DROP:" className="flex-1" />
            <select className={selectCls} value={b.tone ?? "neutral"} onChange={(e) => onChange({ ...b, tone: e.target.value as BranchTone })}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-1.5">
          {hint}
          <LinesField label="Exact lines (one per line, quoted verbatim)" value={b.lines} onChange={(lines) => onChange({ ...b, lines })} />
        </div>
      );
    case "card":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2 items-center">
            <Input value={b.title} onChange={(e) => onChange({ ...b, title: e.target.value })} placeholder="Card title" className="flex-1" />
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!b.open} onChange={(e) => onChange({ ...b, open: e.target.checked })} /> open by default</label>
          </div>
          <LinesField label="Items (one per line)" value={b.items} onChange={(items) => onChange({ ...b, items })} />
          <LinesField label="Exact quotes (optional, one per line)" value={b.quotes ?? []} onChange={(quotes) => onChange({ ...b, quotes })} />
          <Input value={b.note ?? ""} onChange={(e) => onChange({ ...b, note: e.target.value })} placeholder="Footnote (optional)" />
        </div>
      );
    case "check":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex flex-wrap gap-2 items-center">
            <select className={selectCls} value={b.difficulty} onChange={(e) => { const d = e.target.value as Difficulty; onChange({ ...b, difficulty: d, penalty: DIFFICULTY_PENALTY[d] }); }}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className={selectCls} value={b.stat} onChange={(e) => onChange({ ...b, stat: e.target.value as CheckStat })}>
              {STATS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs font-mono text-muted-foreground">{b.penalty > 0 ? `+${b.penalty}` : b.penalty}</span>
          </div>
          <Input value={b.label ?? ""} onChange={(e) => onChange({ ...b, label: e.target.value })} placeholder="What it's for (e.g. spot the ledger)" />
        </div>
      );
    case "findable":
      return (
        <div className="space-y-1.5">
          {hint}
          <Input value={b.name} onChange={(e) => onChange({ ...b, name: e.target.value })} placeholder="Name" />
          <Input value={b.description} onChange={(e) => onChange({ ...b, description: e.target.value })} placeholder="The gist — the one line when it's picked up." />
          <Textarea value={b.readAloud ?? ""} onChange={(e) => onChange({ ...b, readAloud: e.target.value })} className="min-h-[40px] text-sm" placeholder="Optional: the full in-world text." />
        </div>
      );
    case "exit":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2">
            <Input value={b.description} onChange={(e) => onChange({ ...b, description: e.target.value })} placeholder="Where it leads" className="flex-1" />
            <Input value={b.label ?? ""} onChange={(e) => onChange({ ...b, label: e.target.value })} placeholder='Label (defaults to "EXIT:")' className="w-40" />
          </div>
          <p className="text-[11px] text-muted-foreground">Target scene is set from the scene's own Exits list below (inline exits jump within a choice/branch panel).</p>
        </div>
      );
    case "branch":
      return (
        <div className="space-y-1.5">
          {hint}
          <div className="flex gap-2">
            <Input value={b.title} onChange={(e) => onChange({ ...b, title: e.target.value })} placeholder="=== BRANCH A: SHE REFUSES ===" className="flex-1" />
            <select className={selectCls} value={b.tone} onChange={(e) => onChange({ ...b, tone: e.target.value as BranchTone })}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input value={b.tag ?? ""} onChange={(e) => onChange({ ...b, tag: e.target.value })} placeholder="Right-aligned tag (optional)" />
          <div className="pl-2 border-l-2 border-border">
            <BlockListEditor blocks={b.blocks} onChange={(blocks) => onChange({ ...b, blocks })} compact />
          </div>
        </div>
      );
    case "choices":
      return <ChoicesForm block={b} onChange={onChange} />;
    case "director":
      return <DirectorEditor director={b.director} onChange={(director) => onChange({ ...b, director })} />;
    case "combat":
      return <CombatEditor combat={b.combat} onChange={(combat) => onChange({ ...b, combat })} tierTables={tierTables.map((t) => ({ id: t.id, name: t.name }))} />;
    default:
      return null;
  }
}

function ChoicesForm({ block: b, onChange }: { block: Extract<SceneBlock, { kind: "choices" }>; onChange: (b: SceneBlock) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const setOpts = (options: typeof b.options) => onChange({ ...b, options });

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-muted-foreground">{BLOCK_META.choices.hint}</p>
      <div className="flex gap-2 items-center">
        <Input value={b.prompt ?? ""} onChange={(e) => onChange({ ...b, prompt: e.target.value })} placeholder="Prompt shown above the buttons (optional)" className="flex-1" />
        <select className={selectCls} value={b.variant ?? "choices"} onChange={(e) => onChange({ ...b, variant: e.target.value as "choices" | "endings" })}>
          <option value="choices">choices</option>
          <option value="endings">endings (A/B/C picker)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        {b.options.map((o, i) => (
          <div key={o.id} className="border rounded">
            <div className="flex items-center gap-1 p-1.5">
              <button className="text-muted-foreground" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${openIdx === i ? "rotate-90" : ""}`} />
              </button>
              <Input value={o.label} onChange={(e) => setOpts(b.options.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Button label" className="flex-1 h-7 text-sm" />
              {b.variant === "endings" && (
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input type="checkbox" checked={!!o.planned} onChange={(e) => setOpts(b.options.map((x, j) => j === i ? { ...x, planned: e.target.checked } : x))} /> planned
                </label>
              )}
              <button className="text-muted-foreground hover:text-destructive" onClick={() => setOpts(b.options.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
            </div>
            {openIdx === i && (
              <div className="p-2 pt-0 space-y-1.5 border-t">
                <Input value={o.heading ?? ""} onChange={(e) => setOpts(b.options.map((x, j) => j === i ? { ...x, heading: e.target.value } : x))} placeholder="Panel heading (defaults to the label)" />
                {b.variant === "endings" && (
                  <Input value={o.source ?? ""} onChange={(e) => setOpts(b.options.map((x, j) => j === i ? { ...x, source: e.target.value } : x))} placeholder="Source (e.g. module 1943-1954)" />
                )}
                <BlockListEditor blocks={o.blocks} onChange={(blocks) => setOpts(b.options.map((x, j) => j === i ? { ...x, blocks } : x))} compact />
              </div>
            )}
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={() => { setOpts([...b.options, { id: uid(), label: "New option", blocks: [] }]); setOpenIdx(b.options.length); }}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add option
      </Button>
    </div>
  );
}
