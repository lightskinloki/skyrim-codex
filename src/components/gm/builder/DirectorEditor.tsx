// Editor for a ConversationDirector: NPC name, must-say lines, the "always"
// performance footer, the beat menu, and the node graph. New directors start
// from createDirector() with the four default player-response nodes already
// wired (Agree / Disagree / Ask more / Attack); the GM adds more from there.
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";
import { ConversationDirector, DirectorNode, VoiceAnchor, DirectorReply } from "@/types/campaign";
import { uid, directorNode } from "@/utils/sceneBlocks";

const selectCls = "bg-background border border-border rounded px-2 py-1 text-sm";

function Lines({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} className="min-h-[50px] text-sm" placeholder={placeholder} />
    </div>
  );
}

export function DirectorEditor({ director: d, onChange }: { director: ConversationDirector; onChange: (d: ConversationDirector) => void }) {
  const [selId, setSelId] = useState<string | null>(d.nodes[0]?.id ?? null);
  const sel = d.nodes.find((n) => n.id === selId) ?? null;

  const patchNode = (id: string, patch: Partial<DirectorNode>) =>
    onChange({ ...d, nodes: d.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });

  const addNode = (group: string) => {
    const n = directorNode({ group, title: "New node" });
    onChange({ ...d, nodes: [...d.nodes, n] });
    setSelId(n.id);
  };
  const removeNode = (id: string) => {
    if (id === d.hubNodeId || id === d.startNodeId) return; // hub and welcome are structural
    onChange({
      ...d,
      nodes: d.nodes.filter((n) => n.id !== id).map((n) => ({ ...n, next: n.next.filter((x) => x !== id) })),
    });
    if (selId === id) setSelId(d.hubNodeId);
  };
  const addGroup = () => {
    const label = prompt("New group label (e.g. \"What the players said\"):");
    if (!label) return;
    onChange({ ...d, groups: [...d.groups, { id: uid(), label }] });
  };

  return (
    <div className="space-y-3 border-l-2 border-amber-600/40 pl-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">NPC name</Label>
          <Input value={d.npc} onChange={(e) => onChange({ ...d, npc: e.target.value })} placeholder="Gaelen" />
        </div>
        <div>
          <Label className="text-xs">Header title (optional)</Label>
          <Input value={d.title ?? ""} onChange={(e) => onChange({ ...d, title: e.target.value })} placeholder="defaults to '<NPC> — Conversation Director'" />
        </div>
      </div>
      <Lines label="MUST-SAY lines (the red banner — keep this short; everything else is the GM's own words)" value={d.mustSay} onChange={(mustSay) => onChange({ ...d, mustSay })} />
      <Input value={d.mustSayNote ?? ""} onChange={(e) => onChange({ ...d, mustSayNote: e.target.value })} placeholder='Note under the banner (default: "Everything else: your own words.")' />
      <Lines label='"Always" performance rules (footer)' value={d.always} onChange={(always) => onChange({ ...d, always })} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input value={d.beatsLabel ?? ""} onChange={(e) => onChange({ ...d, beatsLabel: e.target.value })} placeholder='Beat label (e.g. "Ritual beat")' />
      </div>
      <Lines label="Beat menu (pick-one-per-exchange, one per line)" value={d.beats} onChange={(beats) => onChange({ ...d, beats })} />

      <div>
        <Label className="text-xs">Groups</Label>
        <div className="flex flex-wrap gap-1 mt-1 mb-1">
          {d.groups.map((g) => <span key={g.id} className="text-xs border rounded px-2 py-0.5">{g.label}</span>)}
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={addGroup}><Plus className="h-3 w-3 mr-1" /> Group</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2">
        <div className="border rounded p-1.5 space-y-2 max-h-[420px] overflow-y-auto">
          {d.groups.map((g) => (
            <div key={g.id}>
              <div className="text-[10px] uppercase text-muted-foreground font-mono px-1">{g.label}</div>
              {d.nodes.filter((n) => n.group === g.id).map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left text-xs rounded px-1.5 py-1 ${selId === n.id ? "bg-accent/30" : "hover:bg-accent/10"}`}
                  onClick={() => setSelId(n.id)}
                >
                  {n.title || "Untitled node"}
                  {(n.id === d.hubNodeId || n.id === d.startNodeId) && <span className="text-muted-foreground"> (fixed)</span>}
                </button>
              ))}
              <Button size="sm" variant="ghost" className="h-6 text-xs w-full justify-start" onClick={() => addNode(g.id)}>
                <Plus className="h-3 w-3 mr-1" /> Add node
              </Button>
            </div>
          ))}
        </div>

        {sel && (
          <NodeForm
            node={sel}
            allNodes={d.nodes}
            fixed={sel.id === d.hubNodeId || sel.id === d.startNodeId}
            onChange={(patch) => patchNode(sel.id, patch)}
            onRemove={() => removeNode(sel.id)}
          />
        )}
      </div>
    </div>
  );
}

function NodeForm({ node: n, allNodes, fixed, onChange, onRemove }: {
  node: DirectorNode; allNodes: DirectorNode[]; fixed: boolean;
  onChange: (patch: Partial<DirectorNode>) => void; onRemove: () => void;
}) {
  const anchors = n.anchors ?? [];
  const replies = n.replies ?? [];
  const setAnchors = (a: VoiceAnchor[]) => onChange({ anchors: a });
  const setReplies = (r: DirectorReply[]) => onChange({ replies: r });

  const toggleNext = (id: string) => {
    const has = n.next.includes(id);
    onChange({ next: has ? n.next.filter((x) => x !== id) : [...n.next, id] });
  };

  return (
    <div className="border rounded p-2 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={n.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="What TYPE of thing did the players do (not a phrase they must say)"
          className="flex-1"
        />
        {!fixed && <button className="text-muted-foreground hover:text-destructive" onClick={onRemove}><Trash2 className="h-4 w-4" /></button>}
      </div>
      <Input value={n.intent ?? ""} onChange={(e) => onChange({ intent: e.target.value })} placeholder="What it looks like at the table (e.g. 'They ask for information')" />
      <Input value={n.aim ?? ""} onChange={(e) => onChange({ aim: e.target.value })} placeholder="Their aim in this moment" />
      <Lines label="Must-say / must-do at this node" value={n.must ?? []} onChange={(must) => onChange({ must })} />

      <div>
        <Label className="text-xs">Voice anchors (how they sound)</Label>
        {anchors.map((a, i) => (
          <div key={i} className="flex gap-1 items-start mt-1">
            <select className={selectCls} value={a.source} onChange={(e) => setAnchors(anchors.map((x, j) => j === i ? { ...x, source: e.target.value as "SOURCE" | "DRAFT" } : x))}>
              <option value="SOURCE">SOURCE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
            <div className="flex-1 space-y-1">
              <Textarea value={a.text} onChange={(e) => setAnchors(anchors.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} className="min-h-[40px] text-sm" placeholder="The line" />
              {a.source === "SOURCE" && <Input value={a.ref ?? ""} onChange={(e) => setAnchors(anchors.map((x, j) => j === i ? { ...x, ref: e.target.value } : x))} placeholder="Citation (doc, line)" className="h-7 text-xs" />}
            </div>
            <button className="text-muted-foreground hover:text-destructive" onClick={() => setAnchors(anchors.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <Button size="sm" variant="ghost" className="h-6 text-xs mt-1" onClick={() => setAnchors([...anchors, { text: "", source: "DRAFT" }])}><Plus className="h-3 w-3 mr-1" /> Add anchor</Button>
      </div>

      <Lines label="What's true / what they know" value={n.info ?? []} onChange={(info) => onChange({ info })} />
      <Lines label="Performance" value={n.perf ?? []} onChange={(perf) => onChange({ perf })} />

      <div>
        <Label className="text-xs">If they say... → what they have</Label>
        {replies.map((r, i) => (
          <div key={i} className="flex gap-1 items-start mt-1">
            <div className="flex-1 space-y-1">
              <Input value={r.say} onChange={(e) => setReplies(replies.map((x, j) => j === i ? { ...x, say: e.target.value } : x))} placeholder='"What they might say"' className="h-7 text-xs" />
              <Textarea value={r.ans} onChange={(e) => setReplies(replies.map((x, j) => j === i ? { ...x, ans: e.target.value } : x))} className="min-h-[35px] text-sm" placeholder="What the NPC has" />
            </div>
            <button className="text-muted-foreground hover:text-destructive" onClick={() => setReplies(replies.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <Button size="sm" variant="ghost" className="h-6 text-xs mt-1" onClick={() => setReplies([...replies, { say: "", ans: "" }])}><Plus className="h-3 w-3 mr-1" /> Add reply</Button>
      </div>

      <Input value={n.room ?? ""} onChange={(e) => onChange({ room: e.target.value })} placeholder="Room reacts" />
      <Lines label="Covered this run (coverage checklist)" value={n.points ?? []} onChange={(points) => onChange({ points })} />

      <div>
        <Label className="text-xs">Next (which nodes this one can lead to)</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {allNodes.filter((x) => x.id !== n.id).map((x) => (
            <button
              key={x.id}
              className={`text-xs border rounded px-1.5 py-0.5 ${n.next.includes(x.id) ? "bg-accent/30 border-accent" : ""}`}
              onClick={() => toggleNext(x.id)}
            >
              {x.title || "Untitled"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
