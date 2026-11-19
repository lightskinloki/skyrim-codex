// "A place or an event": exploring, a discovery, a puzzle, a chase.
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WizardStep, Kind, get, set, sceneGet, OptionsAsk, hasOptions, Ask, StepIntro } from "./common";
import { Rows, ParagraphsAsk, selectCls } from "../ui";
import { checkReadAloud, checkSpoken, checkNoTargetNumber, anyText, blank } from "../coach";
import { SAMPLE } from "../sampleText";
import { block } from "@/utils/sceneBlocks";
import { CheckStat, ChoiceOption, Difficulty, DIFFICULTY_PENALTY, SceneBlock } from "@/types/campaign";

const S = SAMPLE.place;

const DIFFICULTY_PLAIN: Record<Difficulty, string> = {
  "Very Easy": "Very Easy: a big bonus, almost anyone succeeds",
  "Easy": "Easy: a small bonus",
  "Standard": "Standard: no bonus or penalty",
  "Hard": "Hard: a penalty",
  "Very Hard": "Very Hard: a big penalty",
  "Nearly Impossible": "Nearly Impossible: only the lucky or skilled",
  "Impossible": "Impossible: almost never works",
  "Mythic": "Mythic: legendary",
};
const STAT_PLAIN: { v: CheckStat; label: string }[] = [
  { v: "none", label: "Any skill (the player picks)" },
  { v: "might", label: "Might (strength, force)" },
  { v: "agility", label: "Agility (speed, stealth, aim)" },
  { v: "magic", label: "Magic (spells, arcane knowledge)" },
  { v: "guile", label: "Guile (talk, trickery, reading people)" },
];

export const sceneSteps: WizardStep[] = [
  {
    key: "read",
    label: "Words to read out loud",
    headline: "What do the players see and hear?",
    about: {
      what: "The description you read out loud to everyone when the scene begins. It's called 'read-aloud text'.",
      why: "It gets everyone picturing the same place. You read it once, cold, so short and concrete works best.",
      result: "A blue box you read straight from while running the game.",
    },
    done: (s) => anyText(sceneGet(s, "read", "readAloud", true)?.paragraphs),
    sample: { blurb: "A cellar door in a mill.", apply: (c) => set(c, "read", "readAloud", (b) => ({ ...b, paragraphs: [...S.read] }), true) },
    render: (c) => {
      const paras = get(c, "read", "readAloud", true)?.paragraphs ?? [""];
      return (
        <>
          <StepIntro>Say only what is physically there, in the order the players would notice it. What their characters feel or decide is up to the players.</StepIntro>
          <Ask q="What can the players see, hear, and smell?" help="One thing per sentence works well. Leave a blank line between paragraphs." example={S.read.join("\n\n")} tips={checkReadAloud(paras)}>
            <ParagraphsAsk blue rows={9} value={paras} onChange={(paragraphs) => set(c, "read", "readAloud", (b) => ({ ...b, paragraphs }), true)} />
          </Ask>
        </>
      );
    },
  },
  {
    key: "truth",
    label: "What's really going on",
    headline: "What's true here that only you know?",
    about: {
      what: "Your private notes about what's really happening in this scene.",
      why: "Players ask questions you didn't expect. When you know what's actually true, you can answer fairly and stay consistent.",
      result: "A maroon box marked 'GM' that your players never see.",
    },
    done: (s) => !blank(sceneGet(s, "truth", "gmNote", true)?.text),
    sample: { blurb: "The smuggler's secret.", apply: (c) => set(c, "truth", "gmNote", (b) => ({ ...b, text: S.truth }), true) },
    render: (c) => {
      const text = get(c, "truth", "gmNote", true)?.text ?? "";
      return (
        <Ask q="What is really going on?" help="Secrets, who is where, what would happen if the players do nothing, how to judge the likely actions." example={S.truth} tips={checkNoTargetNumber(text)}>
          <Textarea className="min-h-[130px] text-sm" value={text} onChange={(e) => set(c, "truth", "gmNote", (b) => ({ ...b, text: e.target.value }), true)} />
        </Ask>
      );
    },
  },
  {
    key: "speaks",
    label: "What characters say",
    headline: "Does anyone say something here?",
    about: {
      what: "Lines a non-player character says. Write them the way that character would speak.",
      why: "You have the exact words ready, in the right voice, instead of inventing them under pressure.",
      result: "A gold box for each line, showing who says it.",
    },
    optional: true,
    done: (s) => s.blocks.some((b) => b.kind === "spoken" && b.role === "npcLine" && b.line.trim()),
    sample: { blurb: "Marta calls out from the top of the steps.", apply: (c) => c.patchBlocks((bl) => [...bl.filter((b) => !(b.kind === "spoken" && b.role === "npcLine")), ...S.speaks.map((x) => block("spoken", { role: "npcLine", speaker: x.speaker, direction: x.direction, line: x.line }))]) },
    render: (c) => {
      const rows = c.scene.blocks.filter((b): b is Kind<"spoken"> => b.kind === "spoken" && b.role === "npcLine");
      return (
        <Ask q="What do characters say in this scene?" help="Add one line at a time. Ask yourself: why is this person saying it? A line works best when the speaker wants something from saying it." example={`Marta (from the top of the steps): "${S.speaks[0].line}"`}>
          <Rows rows={rows} addLabel="Add a line" empty="No lines yet. This step is optional." newRow={() => block("spoken", { role: "npcLine", speaker: "", line: "" })}
            onChange={(r) => c.patchBlocks((bl) => [...bl.filter((b) => !(b.kind === "spoken" && b.role === "npcLine")), ...r])}
            render={(r, p) => (
              <>
                <div className="flex gap-2">
                  <Input className="flex-1" value={r.speaker} onChange={(e) => p({ speaker: e.target.value })} placeholder="Who says it" />
                  <Input className="flex-1" value={r.direction ?? ""} onChange={(e) => p({ direction: e.target.value })} placeholder="How or where (optional)" />
                </div>
                <Textarea value={r.line} onChange={(e) => p({ line: e.target.value })} className="min-h-[55px] text-sm" placeholder="What they say" />
                {checkSpoken(r.line).length > 0 && (
                  <div className="text-xs text-blue-400">{checkSpoken(r.line)[0].text} {checkSpoken(r.line)[0].why}</div>
                )}
              </>
            )} />
        </Ask>
      );
    },
  },
  {
    key: "rolls",
    label: "Rolls and things to find",
    headline: "Might the players need to roll, or find something?",
    about: {
      what: "Rolls the players might have to make, and objects or clues they can find.",
      why: "Deciding how hard something is ahead of time keeps you consistent. And if you promise a clue, the actual content has to be written down, or you'll be making it up while the players wait.",
      result: "Roll badges you can click to roll a d20, and collapsible cards for each thing they can find.",
    },
    optional: true,
    done: (s) => s.blocks.some((b) => (b.kind === "check" && b.role === "roll") || (b.kind === "findable" && b.role === "find" && (b.name.trim()))),
    sample: {
      blurb: "Two rolls and a torn ledger page.",
      apply: (c) => c.patchBlocks((bl) => [
        ...bl.filter((b) => !((b.kind === "check" && b.role === "roll") || (b.kind === "findable" && b.role === "find"))),
        ...S.rolls.map((r) => block("check", { role: "roll", stat: r.stat as CheckStat, difficulty: r.difficulty as Difficulty, penalty: DIFFICULTY_PENALTY[r.difficulty as Difficulty], label: r.label })),
        ...S.finds.map((f) => block("findable", { role: "find", name: f.name, description: f.description, readAloud: f.readAloud })),
      ]),
    },
    render: (c) => {
      const checks = c.scene.blocks.filter((b): b is Kind<"check"> => b.kind === "check" && b.role === "roll");
      const finds = c.scene.blocks.filter((b): b is Kind<"findable"> => b.kind === "findable" && b.role === "find");
      const swap = (role: string, kind: "check" | "findable", rows: SceneBlock[]) =>
        c.patchBlocks((bl) => [...bl.filter((b) => !(b.kind === kind && b.role === role)), ...rows]);
      return (
        <>
          <StepIntro>In this game, players roll a 20-sided die and try to roll UNDER their own skill number. You never pick a number for them to beat. You pick how hard the task is, and it adds to or subtracts from each player's own number.</StepIntro>
          <Ask q="What rolls might come up?" help="Pick how hard it is, which skill it uses, and what a success gets them." example="Hard, Agility: creep down the steps without the boards creaking.">
            <Rows rows={checks} addLabel="Add a roll" empty="No rolls yet." newRow={() => block("check", { role: "roll", stat: "none", difficulty: "Standard", penalty: 0 })}
              onChange={(r) => swap("roll", "check", r)}
              render={(r, p) => (
                <>
                  <select className={`${selectCls} w-full`} value={r.difficulty} onChange={(e) => { const d = e.target.value as Difficulty; p({ difficulty: d, penalty: DIFFICULTY_PENALTY[d] }); }}>
                    {(Object.keys(DIFFICULTY_PENALTY) as Difficulty[]).map((d) => <option key={d} value={d}>{DIFFICULTY_PLAIN[d]}</option>)}
                  </select>
                  <select className={`${selectCls} w-full`} value={r.stat} onChange={(e) => p({ stat: e.target.value as CheckStat })}>
                    {STAT_PLAIN.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                  </select>
                  <Input value={r.label ?? ""} onChange={(e) => p({ label: e.target.value })} placeholder="What it's for (e.g. creep down the steps quietly)" />
                </>
              )} />
          </Ask>
          <Ask q="What can the players find or pick up?" help="If you tell the players there's information in something, write the actual information here. A clue with nothing behind it leaves you inventing on the spot." example={`${S.finds[0].name}: ${S.finds[0].readAloud}`}>
            <Rows rows={finds} addLabel="Add something to find" empty="Nothing to find yet." newRow={() => block("findable", { role: "find", name: "", description: "" })}
              onChange={(r) => swap("find", "findable", r)}
              render={(r, p) => (
                <>
                  <Input value={r.name} onChange={(e) => p({ name: e.target.value })} placeholder="What it is" />
                  <Input value={r.description} onChange={(e) => p({ description: e.target.value })} placeholder="What you say when a player picks it up" />
                  <Textarea value={r.readAloud ?? ""} onChange={(e) => p({ readAloud: e.target.value })} className="min-h-[55px] text-sm" placeholder="If it has writing or information, type it here exactly" />
                  {blank(r.readAloud) && !blank(r.name) && (
                    <p className="text-[11px] text-amber-500">Nothing is written inside this yet. If players can learn something from it, add it above.</p>
                  )}
                </>
              )} />
          </Ask>
        </>
      );
    },
  },
  {
    key: "options",
    label: "What players might do",
    headline: "What might the players do here, and what happens?",
    about: {
      what: "Three or four things players commonly do in this scene. For each, you write what happens.",
      why: "Players never do what you expect. An answer ready for the common choices lets you respond right away.",
      result: "A row of buttons. Tap the one that matches what the players did and your notes for it open.",
    },
    optional: true,
    done: (s) => hasOptions(s, "options"),
    sample: {
      blurb: "Opening the door, sneaking, or listening.",
      apply: (c) => set(c, "options", "choices", (b) => ({ ...b, options: S.options.map((o): ChoiceOption => ({ id: crypto.randomUUID(), label: o.label, blocks: [block("text", { text: o.text })] })) }), true),
    },
    render: (c) => (
      <Ask q="What might the players do, and what happens if they do it?" help="Write the KIND of action on the top line, not a phrase you hope they say." example={S.options.map((o) => `${o.label}\n  → ${o.text}`).join("\n")}>
        <OptionsAsk c={c} role="options" labelHint="They open the door" textHint="What happens if they do this?" />
      </Ask>
    ),
  },
];
