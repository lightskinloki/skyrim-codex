// Editor for a CombatManager: objective, status fields, objective trackers
// (targets + threshold + what runs when it fires), a tier-table link, cards
// (Jasper's priorities, Dawn stations), triggers (Saijah at 0 HP), and enemies.
// Roll tables themselves are module-level (see the Forge's "Roll tables"
// step); this editor only links to one by id.
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";
import { CombatManager, ObjectiveTracker, CombatCard, CombatTrigger, TrackerTarget, StatusField } from "@/types/campaign";
import { uid, createTracker } from "@/utils/sceneBlocks";
import { BlockListEditor } from "./BlockEditor";
import { enemyTemplates } from "@/data/enemies";

const selectCls = "bg-background border border-border rounded px-2 py-1 text-sm";

function Lines({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} className="min-h-[50px] text-sm" placeholder={placeholder} />
    </div>
  );
}

export function CombatEditor({ combat: c, onChange, tierTables = [] }: {
  combat: CombatManager; onChange: (c: CombatManager) => void;
  /** Roll tables defined at the module level (see the Forge's "Roll tables" step). */
  tierTables?: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-3 border-l-2 border-red-600/40 pl-3">
      <Input value={c.title} onChange={(e) => onChange({ ...c, title: e.target.value })} placeholder="Combat Manager title" />
      <Textarea value={c.objective ?? ""} onChange={(e) => onChange({ ...c, objective: e.target.value })} className="min-h-[40px] text-sm" placeholder="OBJECTIVE: what are the players actually trying to do here?" />

      <div>
        <Label className="text-xs">Status fields (Round is built in)</Label>
        <StatusFieldsEditor fields={c.statusFields} onChange={(statusFields) => onChange({ ...c, statusFields })} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Objective trackers (e.g. five anchors, 300 HP each, three down disrupts)</Label>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange({ ...c, trackers: [...c.trackers, createTracker()] })}>
            <Plus className="h-3 w-3 mr-1" /> Add tracker
          </Button>
        </div>
        {c.trackers.map((t, i) => (
          <TrackerEditor
            key={t.id}
            tracker={t}
            onChange={(next) => onChange({ ...c, trackers: c.trackers.map((x, j) => (j === i ? next : x)) })}
            onRemove={() => onChange({ ...c, trackers: c.trackers.filter((_, j) => j !== i) })}
          />
        ))}
      </div>

      <div>
        <Label className="text-xs">Per-turn roll table (e.g. Zone 3 Tempo)</Label>
        <div className="flex gap-2 items-center mt-1">
          <select className={selectCls} value={c.tierTableId ?? ""} onChange={(e) => onChange({ ...c, tierTableId: e.target.value || undefined })}>
            <option value="">None</option>
            {tierTables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {c.tierTableId && <Input value={c.tierNote ?? ""} onChange={(e) => onChange({ ...c, tierNote: e.target.value })} placeholder="Note under the table" className="mt-1" />}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Cards (priorities, station trackers)</Label>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange({ ...c, cards: [...c.cards, { id: uid(), title: "New card", items: [] }] })}>
            <Plus className="h-3 w-3 mr-1" /> Add card
          </Button>
        </div>
        {c.cards.map((card, i) => (
          <CardEditor
            key={card.id}
            card={card}
            onChange={(next) => onChange({ ...c, cards: c.cards.map((x, j) => (j === i ? next : x)) })}
            onRemove={() => onChange({ ...c, cards: c.cards.filter((_, j) => j !== i) })}
          />
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Triggers (a condition card — Saijah at 0 HP, Jasper's second 0 HP)</Label>
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange({ ...c, triggers: [...c.triggers, { id: uid(), condition: "", blocks: [] }] })}>
            <Plus className="h-3 w-3 mr-1" /> Add trigger
          </Button>
        </div>
        {c.triggers.map((t, i) => (
          <TriggerEditor
            key={t.id}
            trigger={t}
            onChange={(next) => onChange({ ...c, triggers: c.triggers.map((x, j) => (j === i ? next : x)) })}
            onRemove={() => onChange({ ...c, triggers: c.triggers.filter((_, j) => j !== i) })}
          />
        ))}
      </div>

      <div>
        <Label className="text-xs">Enemies (Deploy Encounter sends these to the combat tracker)</Label>
        <div className="flex flex-wrap gap-1 mt-1 mb-1">
          {c.enemies.map((id) => {
            const t = enemyTemplates.find((e) => e.id === id);
            return (
              <span key={id} className="text-xs border rounded px-2 py-0.5">
                {t ? t.name : `${id}?`}
                <button className="ml-1" onClick={() => onChange({ ...c, enemies: c.enemies.filter((e) => e !== id) })}>×</button>
              </span>
            );
          })}
        </div>
        <select className={selectCls} value="" onChange={(e) => { const id = e.target.value; if (id && !c.enemies.includes(id)) onChange({ ...c, enemies: [...c.enemies, id] }); }}>
          <option value="">+ Add enemy…</option>
          {enemyTemplates.filter((t) => !c.enemies.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name} (HP {t.hp})</option>)}
        </select>
      </div>
    </div>
  );
}

function StatusFieldsEditor({ fields, onChange }: { fields: StatusField[]; onChange: (f: StatusField[]) => void }) {
  return (
    <div className="space-y-1 mt-1">
      {fields.map((f, i) => (
        <div key={f.id} className="flex gap-2">
          <Input value={f.label} onChange={(e) => onChange(fields.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="w-32" />
          <Input value={f.initial} onChange={(e) => onChange(fields.map((x, j) => j === i ? { ...x, initial: e.target.value } : x))} placeholder="Starting value" className="flex-1" />
          <button className="text-muted-foreground hover:text-destructive" onClick={() => onChange(fields.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange([...fields, { id: uid(), label: "", initial: "" }])}><Plus className="h-3 w-3 mr-1" /> Add field</Button>
    </div>
  );
}

function TrackerEditor({ tracker: t, onChange, onRemove }: { tracker: ObjectiveTracker; onChange: (t: ObjectiveTracker) => void; onRemove: () => void }) {
  const setTargets = (targets: TrackerTarget[]) => onChange({ ...t, targets });
  return (
    <div className="border rounded p-2 space-y-1.5 mt-1">
      <div className="flex gap-2">
        <Input value={t.title} onChange={(e) => onChange({ ...t, title: e.target.value })} placeholder="Tracker title (e.g. Anchor tracker)" className="flex-1" />
        <button className="text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="h-4 w-4" /></button>
      </div>
      <Textarea value={t.description ?? ""} onChange={(e) => onChange({ ...t, description: e.target.value })} className="min-h-[35px] text-sm" placeholder="What each target is (HP, DR, how it's damaged)." />
      <div>
        <Label className="text-xs">Targets</Label>
        {t.targets.map((x, i) => (
          <div key={x.id} className="flex gap-2 items-center mt-1">
            <Input value={x.label} onChange={(e) => setTargets(t.targets.map((y, j) => j === i ? { ...y, label: e.target.value } : y))} className="w-16" />
            <Input type="number" value={x.maxHp} onChange={(e) => setTargets(t.targets.map((y, j) => j === i ? { ...y, maxHp: Number(e.target.value) || 0 } : y))} className="w-24" placeholder="Max HP" />
            <button className="text-muted-foreground hover:text-destructive" onClick={() => setTargets(t.targets.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <Button size="sm" variant="ghost" className="h-6 text-xs mt-1" onClick={() => setTargets([...t.targets, { id: uid(), label: String.fromCharCode(65 + t.targets.length), maxHp: 100 }])}>
          <Plus className="h-3 w-3 mr-1" /> Add target
        </Button>
      </div>
      <div className="flex gap-2 items-center">
        <Label className="text-xs">Quick-damage buttons</Label>
        <Input value={t.quickDamage.join(", ")} onChange={(e) => onChange({ ...t, quickDamage: e.target.value.split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n)) })} placeholder="10, 100" className="w-32" />
      </div>
      <div className="flex gap-2 items-center">
        <Label className="text-xs">Threshold (how many down triggers it)</Label>
        <Input type="number" value={t.threshold ?? ""} onChange={(e) => onChange({ ...t, threshold: e.target.value ? Number(e.target.value) : undefined })} className="w-20" />
      </div>
      {t.threshold !== undefined && (
        <>
          <Input value={t.thresholdText ?? ""} onChange={(e) => onChange({ ...t, thresholdText: e.target.value })} placeholder="Banner text when it fires" />
          <div>
            <Label className="text-xs">What runs at threshold (e.g. the escape read-aloud)</Label>
            <div className="pl-2 border-l-2 border-border">
              <BlockListEditor blocks={t.triggerBlocks} onChange={(triggerBlocks) => onChange({ ...t, triggerBlocks })} compact />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CardEditor({ card, onChange, onRemove }: { card: CombatCard; onChange: (c: CombatCard) => void; onRemove: () => void }) {
  return (
    <div className="border rounded p-2 space-y-1.5 mt-1">
      <div className="flex gap-2 items-center">
        <Input value={card.title} onChange={(e) => onChange({ ...card, title: e.target.value })} placeholder="Card title" className="flex-1" />
        <select className={selectCls} value={card.controller ?? "gm"} onChange={(e) => onChange({ ...card, controller: e.target.value as "gm" | "player" })}>
          <option value="gm">GM-run</option>
          <option value="player">Player-run</option>
        </select>
        <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!card.ordered} onChange={(e) => onChange({ ...card, ordered: e.target.checked })} /> numbered</label>
        <button className="text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="h-4 w-4" /></button>
      </div>
      <Lines label="Items" value={card.items} onChange={(items) => onChange({ ...card, items })} />
      <Input value={card.statLine ?? ""} onChange={(e) => onChange({ ...card, statLine: e.target.value })} placeholder="Stat line (optional)" />
      <Input value={card.quote ?? ""} onChange={(e) => onChange({ ...card, quote: e.target.value })} placeholder="Quote (optional)" />
    </div>
  );
}

function TriggerEditor({ trigger: t, onChange, onRemove }: { trigger: CombatTrigger; onChange: (t: CombatTrigger) => void; onRemove: () => void }) {
  return (
    <div className="border rounded p-2 space-y-1.5 mt-1">
      <div className="flex gap-2">
        <Input value={t.condition} onChange={(e) => onChange({ ...t, condition: e.target.value })} placeholder="Condition (e.g. Saijah hits 0 HP)" className="flex-1" />
        <button className="text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="pl-2 border-l-2 border-border">
        <BlockListEditor blocks={t.blocks} onChange={(blocks) => onChange({ ...t, blocks })} compact />
      </div>
    </div>
  );
}
