// "A fight": what the players are really trying to do, what's being broken or
// protected, who fights how, and what could suddenly change the fight.
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WizardStep, WizardCtx, get, set, sceneGet, first, setFirst, Ask, StepIntro } from "./common";
import { Rows, LinesAsk, ParagraphsAsk, EnemyPicker, selectCls } from "../ui";
import { checkReadAloud, anyText, blank } from "../coach";
import { SAMPLE } from "../sampleText";
import { uid, createTracker, createTierTable } from "@/utils/sceneBlocks";
import { CombatManager, CombatCard, CombatTrigger, ObjectiveTracker, SceneNode, StatusField, TierRange } from "@/types/campaign";

const F = SAMPLE.fight;

const combatOf = (c: WizardCtx): CombatManager | undefined => get(c, "combat", "combat", true)?.combat;
const sceneCombat = (s: SceneNode): CombatManager | undefined => sceneGet(s, "combat", "combat", true)?.combat;
const patchCombat = (c: WizardCtx, fn: (m: CombatManager) => CombatManager) =>
  set(c, "combat", "combat", (b) => ({ ...b, combat: fn(b.combat) }), true);
const patchTracker = (c: WizardCtx, p: Partial<ObjectiveTracker>) =>
  patchCombat(c, (x) => ({ ...x, trackers: x.trackers.map((y, i) => (i === 0 ? { ...y, ...p } : y)) }));

function TierTableEditor({ c, tableId }: { c: WizardCtx; tableId: string }) {
  const t = (c.module.tierTables ?? []).find((x) => x.id === tableId);
  if (!t) return null;
  const patchT = (p: Partial<typeof t>) => c.patchModule((m) => ({ ...m, tierTables: (m.tierTables ?? []).map((x) => (x.id === tableId ? { ...x, ...p } : x)) }));
  return (
    <div className="space-y-2 border rounded p-2">
      <Input value={t.name} onChange={(e) => patchT({ name: e.target.value })} placeholder="What is it called? (e.g. Smoke each round)" />
      <p className="text-xs text-muted-foreground">Each row covers some of the numbers on a 20-sided die. Every number from 1 to 20 should land in exactly one row.</p>
      <Rows rows={t.tiers} addLabel="Add a row" newRow={() => ({ min: 1, max: 20, label: "", effect: "" } as TierRange)}
        onChange={(tiers) => patchT({ tiers })}
        render={(r, p) => (
          <>
            <div className="flex gap-2 items-center">
              <Input type="number" className="w-16" value={r.min} onChange={(e) => p({ min: Number(e.target.value) || 1 })} />
              <span className="text-xs">to</span>
              <Input type="number" className="w-16" value={r.max} onChange={(e) => p({ max: Number(e.target.value) || 20 })} />
              <Input value={r.label} className="flex-1" onChange={(e) => p({ label: e.target.value })} placeholder="What it's called (e.g. Smoky)" />
            </div>
            <Input value={r.effect ?? ""} onChange={(e) => p({ effect: e.target.value })} placeholder="What it does (e.g. Ranged attacks are Hard)" />
          </>
        )} />
    </div>
  );
}

export function combatSteps(scene: SceneNode): WizardStep[] {
  const m = sceneCombat(scene);
  const steps: WizardStep[] = [
    {
      key: "about",
      label: "What the fight is about",
      headline: "What is this fight about?",
      about: {
        what: "A name for the fight, and what the players are really trying to do.",
        why: "It's not always 'defeat everything'. Writing the real goal down keeps you from running a boring slugfest when the interesting goal is to rescue, escape, or protect.",
        result: "A red 'OBJECTIVE' box at the top of your fight screen.",
      },
      done: (s) => !blank(sceneCombat(s)?.objective),
      sample: { blurb: "Rescuing a boy from a smuggler's cellar.", apply: (c) => patchCombat(c, (x) => ({ ...x, title: F.managerTitle, objective: F.objective })) },
      render: (c) => {
        const mm = combatOf(c);
        return (
          <>
            <StepIntro>This screen becomes your fight control panel. It tracks rounds, health of important things, and what each side does, so you're not juggling it in your head.</StepIntro>
            <Ask q="What do you want to call this fight?" help="Just a label for the top of the panel." example={F.managerTitle}>
              <Input value={mm?.title ?? ""} onChange={(e) => patchCombat(c, (x) => ({ ...x, title: e.target.value }))} />
            </Ask>
            <Ask q="What are the players actually trying to do?" help="If it isn't 'beat the enemies', say what it is: escape, rescue someone, break something, hold a door." example={F.objective}>
              <Textarea className="min-h-[90px] text-sm" value={mm?.objective ?? ""} onChange={(e) => patchCombat(c, (x) => ({ ...x, objective: e.target.value }))} />
            </Ask>
          </>
        );
      },
    },
    {
      key: "tracker",
      label: "Something to break or protect",
      headline: "Is there something the players need to break, hold, or protect besides the enemies?",
      about: {
        what: "Optional. A group of objects with their own health, like barrels, wards, doors, or a captive, that matter as much as the enemies do.",
        why: "It gives the fight a shape beyond 'hit the enemy'. You get a health bar for each one, quick damage buttons, and (next screen) something big that happens when enough of them are broken.",
        result: "A panel with a health bar per object and buttons to subtract damage with one click.",
      },
      optional: true,
      done: (s) => (sceneCombat(s)?.trackers.length ?? 0) > 0,
      sample: {
        blurb: "Three barrels of lamp oil.",
        apply: (c) => patchCombat(c, (x) => ({
          ...x,
          trackers: [{ ...createTracker(), title: F.tracker.title, description: F.tracker.description, targets: F.tracker.labels.map((l) => ({ id: uid(), label: l, maxHp: F.tracker.hp })), quickDamage: [...F.tracker.quick], threshold: F.tracker.threshold, thresholdText: F.tracker.banner, triggerBlocks: [] }],
        })),
      },
      render: (c) => {
        const mm = combatOf(c);
        const t = mm?.trackers[0];
        return (
          <>
            <StepIntro>Think of things with health that aren't creatures: crates to smash, a door to hold, wards to break, a captive to free. If nothing like that is in this fight, choose No.</StepIntro>
            <Ask q="Is there something like that in this fight?">
              <div className="flex gap-2">
                <Button size="sm" variant={t ? "default" : "outline"} onClick={() => !t && patchCombat(c, (x) => ({ ...x, trackers: [createTracker()] }))}>Yes, track it</Button>
                <Button size="sm" variant={!t ? "default" : "outline"} onClick={() => t && patchCombat(c, (x) => ({ ...x, trackers: [] }))}>No, just the enemies</Button>
              </div>
            </Ask>
            {t && (
              <>
                <Ask q="What are they called as a group?" example={F.tracker.title}>
                  <Input value={t.title} onChange={(e) => patchTracker(c, { title: e.target.value })} />
                </Ask>
                <Ask q="What should you remember about how they take damage?" example={F.tracker.description}>
                  <Textarea className="min-h-[60px] text-sm" value={t.description ?? ""} onChange={(e) => patchTracker(c, { description: e.target.value })} />
                </Ask>
                <Ask q="How many are there, and how much damage can each take?" help="HP means health points: how much damage it takes before it breaks. The letter is just a name so you can tell them apart.">
                  <Rows rows={t.targets} min={1} addLabel="Add another" newRow={() => ({ id: uid(), label: `Item ${t.targets.length + 1}`, maxHp: 40 })}
                    onChange={(targets) => patchTracker(c, { targets })}
                    render={(x, p) => (
                      <div className="flex gap-2 items-center">
                        <Input className="w-32" value={x.label} onChange={(e) => p({ label: e.target.value })} />
                        <Input type="number" className="w-24" value={x.maxHp} onChange={(e) => p({ maxHp: Number(e.target.value) || 0 })} />
                        <span className="text-xs text-muted-foreground">HP</span>
                      </div>
                    )} />
                </Ask>
                <Ask q="Which damage amounts do you subtract most often?" help="Numbers separated by commas. Each becomes a one-click button, so you don't do the math mid-fight." example="5, 10">
                  <Input value={t.quickDamage.join(", ")} onChange={(e) => patchTracker(c, { quickDamage: e.target.value.split(",").map((n) => Number(n.trim())).filter((n) => !isNaN(n) && n > 0) })} />
                </Ask>
              </>
            )}
          </>
        );
      },
    },
  ];

  if (m?.trackers.length) {
    steps.push({
      key: "threshold",
      label: "The big moment",
      headline: "What big thing happens when enough of them are broken?",
      about: {
        what: "A number, and what happens when that many are broken or destroyed.",
        why: "It turns the health bars into a story beat: the oil ignites, the ward collapses, the door falls. You decide the consequence now so you're not inventing it mid-fight.",
        result: "When enough are down, a pulsing red banner appears with the words to read out loud.",
      },
      optional: true,
      done: (s) => { const t = sceneCombat(s)?.trackers[0]; return !!t?.threshold && anyText(first(t.triggerBlocks, "readAloud")?.paragraphs); },
      sample: {
        blurb: "Two barrels open and the cellar catches fire.",
        apply: (c) => patchTracker(c, { threshold: F.tracker.threshold, thresholdText: F.tracker.banner, triggerBlocks: [
          { id: uid(), kind: "readAloud", tag: "WHEN IT FIRES", paragraphs: [...F.tracker.read] },
          { id: uid(), kind: "gmNote", text: F.tracker.note },
        ] }),
      },
      render: (c) => {
        const t = combatOf(c)?.trackers[0]; if (!t) return null;
        const ra = first(t.triggerBlocks, "readAloud"); const note = first(t.triggerBlocks, "gmNote");
        return (
          <>
            <Ask q="How many must be broken for it to happen?" help="Leave this empty if nothing special happens." example="2">
              <Input type="number" className="w-28" value={t.threshold ?? ""} onChange={(e) => patchTracker(c, { threshold: e.target.value ? Number(e.target.value) : undefined })} />
            </Ask>
            {t.threshold !== undefined && (
              <>
                <Ask q="What does the banner say?" help="A short line you see the moment it happens." example={F.tracker.banner}>
                  <Input value={t.thresholdText ?? ""} onChange={(e) => patchTracker(c, { thresholdText: e.target.value })} />
                </Ask>
                <Ask q="What do you read out loud when it happens?" help="Describe what's physically happening, in order." example={F.tracker.read.join("\n\n")} tips={checkReadAloud(ra?.paragraphs ?? [])}>
                  <ParagraphsAsk blue rows={7} value={ra?.paragraphs ?? [""]}
                    onChange={(paragraphs) => patchTracker(c, { triggerBlocks: setFirst(t.triggerBlocks, "readAloud", (b) => ({ ...b, tag: b.tag ?? "WHEN IT FIRES", paragraphs })) })} />
                </Ask>
                <Ask q="What do you need to remember afterward? (optional)" help="A private note about consequences." example={F.tracker.note}>
                  <Textarea className="min-h-[60px] text-sm" value={note?.text ?? ""}
                    onChange={(e) => patchTracker(c, { triggerBlocks: setFirst(t.triggerBlocks, "gmNote", (b) => ({ ...b, text: e.target.value })) })} />
                </Ask>
              </>
            )}
          </>
        );
      },
    });
  }

  steps.push(
    {
      key: "roll",
      label: "A roll every round",
      headline: "Does anything get rolled at the start of every round?",
      about: {
        what: "Optional. Some fights use a die roll each round to decide something, like the effect of smoke or weather. You describe the possible results ahead of time.",
        why: "If you don't know what this is, you don't need it. Choose No. When you do want it, having the table ready means you just click Roll and read the result.",
        result: "A 'Roll' button in the fight panel that rolls a 20-sided die and shows which result it landed on.",
      },
      optional: true,
      done: (s) => !!sceneCombat(s)?.tierTableId,
      sample: {
        blurb: "Smoke that gets thicker.",
        apply: (c) => {
          const existing = (c.module.tierTables ?? []).find((t) => t.name === F.table.name);
          const id = existing?.id ?? uid();
          if (!existing) c.patchModule((mod) => ({ ...mod, tierTables: [...(mod.tierTables ?? []), { id, name: F.table.name, tiers: F.table.tiers.map((t) => ({ ...t })), critNote: "" }] }));
          patchCombat(c, (x) => ({ ...x, tierTableId: id, tierNote: F.table.note }));
        },
      },
      render: (c) => {
        const mm = combatOf(c);
        const tables = c.module.tierTables ?? [];
        const setTable = (id?: string) => patchCombat(c, (x) => ({ ...x, tierTableId: id }));
        return (
          <>
            <StepIntro>This game uses a 20-sided die. A round table is a short list saying what each range of the die means, like 1 to 10 is 'clear', 11 to 17 is 'smoky', 18 to 20 is 'choking'.</StepIntro>
            <Ask q="Do you want one?">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={!mm?.tierTableId ? "default" : "outline"} onClick={() => setTable(undefined)}>No</Button>
                {tables.map((t) => (
                  <Button key={t.id} size="sm" variant={mm?.tierTableId === t.id ? "default" : "outline"} onClick={() => setTable(t.id)}>Use: {t.name || "Untitled table"}</Button>
                ))}
                <Button size="sm" variant="outline" onClick={() => { const t = createTierTable("New table"); c.patchModule((mod) => ({ ...mod, tierTables: [...(mod.tierTables ?? []), t] })); setTable(t.id); }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Make a new one
                </Button>
              </div>
            </Ask>
            {mm?.tierTableId && (
              <>
                <TierTableEditor c={c} tableId={mm.tierTableId} />
                <Ask q="When should you roll it?" help="A note shown under the roll button." example={F.table.note}>
                  <Textarea className="min-h-[55px] text-sm" value={mm.tierNote ?? ""} onChange={(e) => patchCombat(c, (x) => ({ ...x, tierNote: e.target.value }))} />
                </Ask>
              </>
            )}
          </>
        );
      },
    },
    {
      key: "cards",
      label: "Who fights and how",
      headline: "Who is in this fight, and what does each side go for?",
      about: {
        what: "A short card for each enemy or group: what they try to do, in priority order.",
        why: "In the middle of a fight it's hard to decide what each enemy does. If you decided ahead of time, you can act fast and stay consistent.",
        result: "A card for each side in your fight panel. Numbered ones read top to bottom.",
      },
      done: (s) => (sceneCombat(s)?.cards ?? []).some((cd) => cd.title.trim() && anyText(cd.items)),
      sample: {
        blurb: "Harl, his helpers, and the boy.",
        apply: (c) => patchCombat(c, (x) => ({ ...x, cards: F.cards.map((cd): CombatCard => ({ id: uid(), title: cd.title, ordered: cd.ordered, controller: "gm", items: [...cd.items] })) })),
      },
      render: (c) => {
        const mm = combatOf(c); if (!mm) return null;
        const setCards = (cards: CombatCard[]) => patchCombat(c, (x) => ({ ...x, cards }));
        const preset = (title: string, ordered: boolean, controller: "gm" | "player" = "gm") =>
          setCards([...mm.cards, { id: uid(), title, ordered, controller, items: [""] }]);
        return (
          <>
            <StepIntro>Priorities are numbered so you can read them top to bottom: when the first can't be done, do the second.</StepIntro>
            <Ask q="Who fights, and what does each go for?" help="Tap a starting point, then edit it." example={F.cards.map((cd) => `${cd.title}\n${cd.items.map((i, n) => `  ${cd.ordered ? n + 1 + "." : "-"} ${i}`).join("\n")}`).join("\n")}>
              <div className="flex flex-wrap gap-2 mb-2">
                <Button size="sm" variant="outline" onClick={() => preset("Main enemy", true)}><Plus className="h-3.5 w-3.5 mr-1" /> Main enemy</Button>
                <Button size="sm" variant="outline" onClick={() => preset("Helpers", false)}><Plus className="h-3.5 w-3.5 mr-1" /> Helpers or minions</Button>
                <Button size="sm" variant="outline" onClick={() => preset("Someone present who isn't fighting", false)}><Plus className="h-3.5 w-3.5 mr-1" /> Someone who isn't fighting</Button>
                <Button size="sm" variant="outline" onClick={() => preset("A player-run character", true, "player")}><Plus className="h-3.5 w-3.5 mr-1" /> A character a player runs</Button>
              </div>
              <Rows rows={mm.cards} addLabel="Add a blank card" empty="No cards yet." newRow={() => ({ id: uid(), title: "", items: [""] } as CombatCard)} onChange={setCards}
                render={(card, p) => (
                  <>
                    <div className="flex gap-2">
                      <Input className="flex-1" value={card.title} onChange={(e) => p({ title: e.target.value })} placeholder="Who or what group" />
                      <select className={selectCls} value={card.controller ?? "gm"} onChange={(e) => p({ controller: e.target.value as "gm" | "player" })}>
                        <option value="gm">You run them</option><option value="player">A player runs them</option>
                      </select>
                    </div>
                    <LinesAsk rows={4} value={card.items} onChange={(items) => p({ items })} placeholder="One per line. What do they do?" />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!card.ordered} onChange={(e) => p({ ordered: e.target.checked })} /> Number these as priorities</label>
                    <Input value={card.statLine ?? ""} onChange={(e) => p({ statLine: e.target.value })} placeholder="Stats (optional), e.g. HP 60, damage 8" />
                  </>
                )} />
            </Ask>
          </>
        );
      },
    },
    {
      key: "triggers",
      label: "What could change the fight",
      headline: "Is there anything that could suddenly change the fight?",
      about: {
        what: "Optional. A situation to watch for, like someone being knocked out, and what happens the instant it's true.",
        why: "Twists are easy to forget in the moment. Writing them down means they happen when they should.",
        result: "A tickable card in the fight panel. When you tick it, your notes for that moment appear.",
      },
      optional: true,
      done: (s) => (sceneCombat(s)?.triggers ?? []).some((t) => t.condition.trim()),
      sample: {
        blurb: "Harl refuses to hurt someone who is helpless.",
        apply: (c) => patchCombat(c, (x) => ({ ...x, triggers: F.triggers.map((t): CombatTrigger => ({ id: uid(), condition: t.condition, blocks: [{ id: uid(), kind: "gmNote", text: t.note }] })) })),
      },
      render: (c) => {
        const mm = combatOf(c); if (!mm) return null;
        return (
          <Ask q="What should you watch for?" help="Write the situation, then what happens." example={`${F.triggers[0].condition}: ${F.triggers[0].note}`}>
            <Rows rows={mm.triggers} addLabel="Add something to watch for" empty="None yet. This is optional."
              newRow={() => ({ id: uid(), condition: "", blocks: [] } as CombatTrigger)}
              onChange={(triggers) => patchCombat(c, (x) => ({ ...x, triggers }))}
              render={(t, p) => {
                const ra = first(t.blocks, "readAloud"); const note = first(t.blocks, "gmNote");
                return (
                  <>
                    <Input value={t.condition} onChange={(e) => p({ condition: e.target.value })} placeholder="What to watch for (e.g. A player character is knocked out)" />
                    <ParagraphsAsk blue rows={3} value={ra?.paragraphs ?? [""]} placeholder="Something to read out loud when it happens (optional)"
                      onChange={(paragraphs) => p({ blocks: setFirst(t.blocks, "readAloud", (b) => ({ ...b, paragraphs })) })} />
                    <Textarea className="min-h-[55px] text-sm" value={note?.text ?? ""} placeholder="What you need to know or decide (optional)"
                      onChange={(e) => p({ blocks: setFirst(t.blocks, "gmNote", (b) => ({ ...b, text: e.target.value })) })} />
                  </>
                );
              }} />
          </Ask>
        );
      },
    },
    {
      key: "roster",
      label: "Monsters and tracking",
      headline: "Which monsters are in this fight, and what else do you want to keep track of?",
      about: {
        what: "Optional. Pick monsters from the game's built-in list, and add anything you want displayed at the top of the fight panel.",
        why: "One click loads the monsters into the fight tracker with their stats filled in, so you don't type them yourself.",
        result: "A red 'Send enemies to the fight tracker' button, and extra labels at the top of the panel.",
      },
      optional: true,
      done: (s) => (sceneCombat(s)?.enemies.length ?? 0) > 0,
      sample: { blurb: "Bandits and a bandit chief.", apply: (c) => patchCombat(c, (x) => ({ ...x, enemies: [...F.enemies], statusFields: F.statusFields.map((f): StatusField => ({ id: uid(), label: f.label, initial: f.initial })) })) },
      render: (c) => {
        const mm = combatOf(c); if (!mm) return null;
        return (
          <>
            <Ask q="Which monsters should the fight tracker load for this fight?" help="Pick from the built-in list. The round counter is always there, so you don't need to add one." example="Bandit, Bandit Chief">
              <EnemyPicker value={mm.enemies} onChange={(enemies) => patchCombat(c, (x) => ({ ...x, enemies }))} />
            </Ask>
            <Ask q="What else do you want to see at the top of the panel?" help="Anything you check constantly during the fight, like weather or how loud things are." example="Smoke: None yet">
              <Rows rows={mm.statusFields} addLabel="Add something to track" empty="Nothing extra." newRow={() => ({ id: uid(), label: "", initial: "" } as StatusField)}
                onChange={(statusFields) => patchCombat(c, (x) => ({ ...x, statusFields }))}
                render={(f, p) => (
                  <div className="flex gap-2">
                    <Input className="w-36" value={f.label} onChange={(e) => p({ label: e.target.value })} placeholder="Label" />
                    <Input className="flex-1" value={f.initial} onChange={(e) => p({ initial: e.target.value })} placeholder="Starting value" />
                  </div>
                )} />
            </Ask>
          </>
        );
      },
    },
  );
  return steps;
}
