// Pillar 4 — Universal Compendium: one search box over every node in the model
// (core rules + campaign lore). The first concrete slice of the "everything is a
// node" idea: core data is indexed, campaign nodes are authored, both searchable.
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useCampaign } from "../CampaignContext";
import { enemyTemplates } from "@/data/enemies";
import { spells } from "@/data/spells";
import { officialEquipment } from "@/data/equipment";
import { skills } from "@/data/skills";
import { races } from "@/data/races";
import { standingStones } from "@/data/standingStones";

interface Entry {
  kind: string;
  title: string;
  subtitle: string;
  body: string;
  keywords: string;
}

function buildIndex(campaignNodes: { name: string; type: string; tags: string[] }[]): Entry[] {
  const entries: Entry[] = [];

  for (const e of enemyTemplates) {
    entries.push({
      kind: "Enemy", title: e.name, subtitle: `${e.category}${e.isBoss ? " · boss" : ""}`,
      body: `HP ${e.hp} · DR ${e.dr} · MIG ${e.stats.might}/AGI ${e.stats.agility}/MAG ${e.stats.magic}/GUI ${e.stats.guile}` +
        (e.attacks?.length ? `\nAttacks: ${e.attacks.map((a) => `${a.name} (${a.damage})`).join(", ")}` : "") +
        (e.abilities?.length ? `\nAbilities: ${e.abilities.join("; ")}` : ""),
      keywords: `${e.name} ${e.category} enemy`,
    });
  }
  for (const s of spells) {
    entries.push({ kind: "Spell", title: s.name, subtitle: `${s.school} · ${s.tier} · ${s.fpCost} FP`, body: s.description, keywords: `${s.name} ${s.school} ${s.tier} spell` });
  }
  for (const eq of officialEquipment) {
    entries.push({
      kind: "Equipment", title: eq.name,
      subtitle: `${eq.type}${eq.damage != null ? ` · ${eq.damage} dmg` : ""}${eq.dr != null ? ` · DR ${eq.dr}` : ""}`,
      body: eq.description, keywords: `${eq.name} ${eq.type} equipment gear`,
    });
  }
  for (const sk of skills) {
    entries.push({ kind: "Skill", title: sk.name, subtitle: `${sk.type} · ${sk.governingStat}`, body: sk.perks.map((p) => `${p.rank}: ${p.name}`).join("\n"), keywords: `${sk.name} ${sk.type} skill` });
  }
  for (const r of races) {
    entries.push({ kind: "Race", title: r.name, subtitle: `+${String(r.bonus)}`, body: `${r.abilityName}: ${r.abilityDescription}`, keywords: `${r.name} race` });
  }
  for (const st of standingStones) {
    entries.push({ kind: "Standing Stone", title: st.name, subtitle: st.archetype, body: `${st.benefitName}: ${st.benefitDescription}`, keywords: `${st.name} standing stone ${st.archetype}` });
  }
  for (const n of campaignNodes) {
    entries.push({ kind: "Campaign", title: n.name, subtitle: n.type, body: n.tags.join(", "), keywords: `${n.name} ${n.type} ${n.tags.join(" ")}` });
  }
  return entries;
}

const KIND_COLOR: Record<string, string> = {
  Enemy: "text-red-400", Spell: "text-blue-400", Equipment: "text-amber-400",
  Skill: "text-green-400", Race: "text-purple-400", "Standing Stone": "text-cyan-400", Campaign: "text-pink-400",
};

export function UniversalCompendium({ searchInputRef }: { searchInputRef?: React.Ref<HTMLInputElement> }) {
  const { campaign } = useCampaign();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);

  const index = useMemo(
    () => buildIndex(campaign.nodes.map((n) => ({ name: n.name, type: n.type, tags: n.tags }))),
    [campaign.nodes]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 50);
    return index.filter((e) => e.keywords.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)).slice(0, 100);
  }, [query, index]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4 flex flex-col">
        <div className="relative mb-3">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rules + lore (Ctrl+K)…"
            className="pl-8"
          />
        </div>
        <div className="text-xs text-muted-foreground mb-2">{results.length} results · {index.length} indexed</div>
        <ScrollArea className="h-[460px] pr-2">
          <div className="space-y-1">
            {results.map((e, i) => (
              <button
                key={`${e.kind}-${e.title}-${i}`}
                onClick={() => setSelected(e)}
                className={`w-full text-left border rounded p-2 hover:bg-accent ${selected === e ? "bg-accent" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{e.title}</span>
                  <Badge variant="outline" className={`text-[10px] ml-auto ${KIND_COLOR[e.kind] ?? ""}`}>{e.kind}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{e.subtitle}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-4">
        {selected ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-cinzel text-xl font-bold">{selected.title}</h3>
              <Badge variant="outline" className={KIND_COLOR[selected.kind] ?? ""}>{selected.kind}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{selected.subtitle}</p>
            <p className="text-sm whitespace-pre-line">{selected.body}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select an entry to see its full card. The compendium spans every enemy, spell, item, skill, race, stone, and campaign node — one keystroke away.</p>
        )}
      </Card>
    </div>
  );
}
