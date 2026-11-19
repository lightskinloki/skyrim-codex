// "How it could end" and "Wrap-up and rewards".
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WizardStep, get, set, sceneGet, first, setFirst, Ask, StepIntro } from "./common";
import { Rows, LinesAsk, ParagraphsAsk, selectCls } from "../ui";
import { checkReadAloud, anyText } from "../coach";
import { SAMPLE } from "../sampleText";
import { uid, block } from "@/utils/sceneBlocks";
import { ChoiceOption, SceneBlock, SceneNode } from "@/types/campaign";

const E = SAMPLE.endings;
const W = SAMPLE.wrap;

const KIND_RANK: Record<string, number> = { list: 0, readAloud: 1, gmNote: 2, exit: 9 };
const sortEnding = (blocks: SceneBlock[]) => [...blocks].sort((a, b) => (KIND_RANK[a.kind] ?? 5) - (KIND_RANK[b.kind] ?? 5));

export function endingsSteps(scene: SceneNode): WizardStep[] {
  const ch = sceneGet(scene, "endings", "choices", true);
  const steps: WizardStep[] = [
    {
      key: "list",
      label: "The possible endings",
      headline: "How could this part of the story end?",
      about: {
        what: "A list of the different ways the story could turn out from here, including the bad ones.",
        why: "Players can surprise you. If you've already thought through each outcome, you won't freeze when they go somewhere unexpected.",
        result: "A row of buttons. When the story reaches an ending, tap its button and see exactly what happens and where to go next.",
      },
      done: (s) => (sceneGet(s, "endings", "choices", true)?.options ?? []).some((o) => o.label.trim()),
      sample: {
        blurb: "Rescue, escape, or defeat.",
        apply: (c) => set(c, "endings", "choices", (b) => ({
          ...b, variant: "endings",
          options: E.options.map((o): ChoiceOption => ({
            id: uid(), label: o.label, planned: o.planned,
            blocks: sortEnding([
              block("list", { items: [...o.list] }),
              ...(o.read.length ? [block("readAloud", { tag: "READ ALOUD", paragraphs: [...o.read] })] : []),
              ...(o.note ? [block("gmNote", { text: o.note })] : []),
              block("exit", { description: E.exit }),
            ]),
          })),
        }), true),
      },
      render: (c) => {
        const cc = get(c, "endings", "choices", true);
        const options = cc?.options ?? [];
        const setOptions = (opts: ChoiceOption[]) => set(c, "endings", "choices", (b) => ({ ...b, variant: "endings", options: opts }), true);
        return (
          <>
            <StepIntro>Think about the ways the players could succeed, partly succeed, or fail. Give each one a name. You'll fill in what happens for each on the next screens.</StepIntro>
            <Ask q="What are the possible endings?" help="'Planned' means you've thought it through. Leave it unchecked for an ending you'd improvise." example={E.options.map((o) => o.label).join("\n")}>
              <Rows rows={options} min={1} addLabel="Add an ending" newRow={() => ({ id: uid(), label: "", blocks: [], planned: true } as ChoiceOption)} onChange={setOptions}
                render={(o, p) => (
                  <>
                    <Input value={o.label} onChange={(e) => p({ label: e.target.value })} placeholder="e.g. They rescue the boy" />
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!o.planned} onChange={(e) => p({ planned: e.target.checked })} /> I've planned this one</label>
                  </>
                )} />
            </Ask>
          </>
        );
      },
    },
  ];
  for (const o of ch?.options ?? []) {
    steps.push({
      key: `ending:${o.id}`,
      label: o.label || "New ending",
      headline: `If the story ends this way ("${o.label || "New ending"}"): what happens?`,
      about: {
        what: "What happens if the players reach this ending, and where the story goes next.",
        why: "It's all ready to read the moment the table gets there.",
        result: "A panel under this ending's button, with the steps to run, anything to read aloud, and a link to the next scene.",
      },
      done: (s) => { const op = sceneGet(s, "endings", "choices", true)?.options.find((x) => x.id === o.id); const l = op && first(op.blocks, "list"); return anyText(l?.items); },
      render: (c) => {
        const cc = get(c, "endings", "choices", true);
        const opt = cc?.options.find((x) => x.id === o.id); if (!opt) return null;
        const setBlocks = (fn: (b: SceneBlock[]) => SceneBlock[]) =>
          set(c, "endings", "choices", (b) => ({ ...b, options: b.options.map((x) => (x.id === o.id ? { ...x, blocks: sortEnding(fn(x.blocks)) } : x)) }), true);
        const list = first(opt.blocks, "list"); const ra = first(opt.blocks, "readAloud");
        const note = first(opt.blocks, "gmNote"); const ex = first(opt.blocks, "exit");
        return (
          <>
            <Ask q="What happens, step by step?" help="One per line, in the order you'd run it." example={E.options[0].list.join("\n")}>
              <LinesAsk rows={5} value={list?.items ?? []} onChange={(items) => setBlocks((bl) => setFirst(bl, "list", (b) => ({ ...b, items })))} />
            </Ask>
            <Ask q="Is there anything to read out loud? (optional)" help="What the players see and hear, in order." example={E.options[0].read.join("\n\n")} tips={checkReadAloud(ra?.paragraphs ?? [])}>
              <ParagraphsAsk blue rows={5} value={ra?.paragraphs ?? [""]} onChange={(paragraphs) => setBlocks((bl) => setFirst(bl, "readAloud", (b) => ({ ...b, tag: b.tag ?? "READ ALOUD", paragraphs })))} />
            </Ask>
            <Ask q="What should you remember or decide? (optional)" help="A private note." example={E.options[1].note}>
              <Textarea className="min-h-[55px] text-sm" value={note?.text ?? ""} onChange={(e) => setBlocks((bl) => setFirst(bl, "gmNote", (b) => ({ ...b, text: e.target.value })))} />
            </Ask>
            <Ask q="Where does the story go next? (optional)" help="Adds a link inside this ending that jumps to another scene.">
              <div className="space-y-1.5">
                <Input value={ex?.description ?? ""} placeholder="e.g. On to the wrap-up" onChange={(e) => setBlocks((bl) => setFirst(bl, "exit", (b) => ({ ...b, description: e.target.value })))} />
                <select className={`${selectCls} w-full`} value={ex?.targetSceneId ?? ""} onChange={(e) => setBlocks((bl) => setFirst(bl, "exit", (b) => ({ ...b, targetSceneId: e.target.value || undefined })))}>
                  <option value="">Not linked to a scene</option>
                  {c.otherScenes.map((s) => <option key={s.id} value={s.id}>Jump to: {s.title}</option>)}
                </select>
              </div>
            </Ask>
          </>
        );
      },
    });
  }
  return steps;
}

function listStep(key: string, label: string, headline: string, role: string, title: string, what: string, why: string, help: string, example: readonly string[]): WizardStep {
  return {
    key, label, headline, optional: true,
    about: { what, why, result: "A titled list you can read at a glance." },
    done: (s) => anyText(sceneGet(s, role, "list")?.items),
    sample: { blurb: "A sample list.", apply: (c) => set(c, role, "list", (b) => ({ ...b, title: b.title || title, items: [...example] })) },
    render: (c) => (
      <Ask q={headline} help={help} example={example.join("\n")}>
        <LinesAsk rows={6} value={get(c, role, "list")?.items ?? []} onChange={(items) => set(c, role, "list", (b) => ({ ...b, title: b.title || title, items }))} />
      </Ask>
    ),
  };
}

export const resolutionSteps: WizardStep[] = [
  {
    key: "read",
    label: "Closing words",
    headline: "What do you read out loud to close the adventure?",
    about: {
      what: "The last thing you say to the table: what they see and hear as the story lets go of them.",
      why: "A strong ending gives the session a shape and leaves the players with a picture.",
      result: "A blue box to read from.",
    },
    done: (s) => anyText(sceneGet(s, "resolution", "readAloud", true)?.paragraphs),
    sample: { blurb: "Morning at the mill.", apply: (c) => set(c, "resolution", "readAloud", (b) => ({ ...b, paragraphs: [...W.read] }), true) },
    render: (c) => {
      const paras = get(c, "resolution", "readAloud", true)?.paragraphs ?? [""];
      return (
        <Ask q="What can the players see and hear?" help="Describe what's there, one thing at a time." example={W.read.join("\n\n")} tips={checkReadAloud(paras)}>
          <ParagraphsAsk blue rows={8} value={paras} onChange={(paragraphs) => set(c, "resolution", "readAloud", (b) => ({ ...b, paragraphs }), true)} />
        </Ask>
      );
    },
  },
  listStep("rewards", "Rewards", "What do the players earn?", "rewards", "GM -- REWARDS:", "Anything the players get for finishing: coins, favors, items, discounts.", "You won't have to invent a reward on the spot, and you'll reward the same effort consistently.", "One per line.", W.rewards),
  listStep("seeds", "Seeds for later", "What did this adventure set up for later?", "seeds", "GM -- SEEDS PLANTED (they finish growing after the module):", "Loose threads that connect to future adventures, such as a name, a clue, or a promise.", "It's how a series of sessions starts to feel like one story. Write them now and you'll remember them later.", "One per line. These are hooks, not things to resolve now.", W.seeds),
  listStep("ledger", "Elsewhere in the world", "What happened elsewhere while the players were busy?", "ledger", "GM -- CONSEQUENCE LEDGER (what the other threads did meanwhile):", "A list of things that changed in the world, or that will, as a result of what the players did or didn't do.", "It makes the world feel like it goes on without them, and it keeps track of consequences.", "One per line.", W.ledger),
];
