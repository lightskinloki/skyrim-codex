// Shared pieces for the step flows: the context each step receives, block
// lookups by role, and the two steps every scene has (naming it, and saying
// where the story goes next).
import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CampaignModule, SceneNode, SceneBlock, ChoiceOption } from "@/types/campaign";
import { findRole, updateRole, newBlockOf, block, uid } from "@/utils/sceneBlocks";
import { Ask, StepIntro, Rows, ExitsAsk, EnemyPicker, selectCls } from "../ui";

export interface WizardCtx {
  module: CampaignModule;
  scene: SceneNode;
  otherScenes: SceneNode[];
  patchScene: (p: Partial<SceneNode>) => void;
  patchBlocks: (fn: (b: SceneBlock[]) => SceneBlock[]) => void;
  patchModule: (fn: (m: CampaignModule) => CampaignModule) => void;
}

export interface StepAbout {
  /** What this screen is, in one sentence a stranger understands. */
  what: string;
  /** Why it matters when you're running the game. */
  why: string;
  /** What you'll actually see in Live Play as a result. */
  result?: string;
}

export interface WizardStep {
  key: string;
  /** Short plain name shown in the progress list. */
  label: string;
  /** The big question at the top of the screen. */
  headline: string;
  about: StepAbout;
  /** Optional steps can be skipped without leaving the scene incomplete. */
  optional?: boolean;
  /** Has the person put something here? Drives the checkmarks and "what's missing". */
  done: (scene: SceneNode, module: CampaignModule) => boolean;
  render: (c: WizardCtx) => ReactNode;
  /** A ready-made example for this whole screen, applied only when they click "Fill in the example". */
  sample?: { blurb: string; apply: (c: WizardCtx) => void };
}

export type Kind<K extends SceneBlock["kind"]> = Extract<SceneBlock, { kind: K }>;

/* ---------- role helpers ---------- */

export function get<K extends SceneBlock["kind"]>(c: WizardCtx, role: string, kind: K, fb = false) {
  return findRole(c.scene.blocks, role, kind, fb);
}
export function set<K extends SceneBlock["kind"]>(c: WizardCtx, role: string, kind: K, fn: (b: Kind<K>) => Kind<K>, fb = false) {
  c.patchBlocks((bl) => updateRole(bl, role, kind, fn, fb));
}
/** Same as get/set but reading a scene directly (for the `done` checks). */
export function sceneGet<K extends SceneBlock["kind"]>(scene: SceneNode, role: string, kind: K, fb = false) {
  return findRole(scene.blocks, role, kind, fb);
}

export function setFirst<K extends SceneBlock["kind"]>(blocks: SceneBlock[], kind: K, fn: (b: Kind<K>) => Kind<K>): SceneBlock[] {
  const i = blocks.findIndex((b) => b.kind === kind);
  if (i >= 0) { const a = [...blocks]; a[i] = fn(a[i] as Kind<K>); return a; }
  return [...blocks, fn(newBlockOf(kind) as Kind<K>)];
}
export function first<K extends SceneBlock["kind"]>(blocks: SceneBlock[], kind: K): Kind<K> | undefined {
  return blocks.find((b) => b.kind === kind) as Kind<K> | undefined;
}

/** "**Name:** text" items <-> {name, text} rows. */
export const parseKV = (items: string[]) =>
  items.map((it) => { const m = it.match(/^\*\*(.+?):\*\*\s*(.*)$/); return m ? { name: m[1], text: m[2] } : { name: "", text: it }; });
export const toKV = (rows: { name: string; text: string }[]) =>
  rows.map((r) => (r.name.trim() ? `**${r.name.trim()}:** ${r.text}` : r.text));

/* ---------- options ("what might the players do?") ---------- */

export const panelText = (o: ChoiceOption) => (first(o.blocks, "text")?.text ?? "");
export const withPanelText = (o: ChoiceOption, text: string): ChoiceOption => {
  const i = o.blocks.findIndex((b) => b.kind === "text");
  if (i >= 0) { const a = [...o.blocks]; a[i] = { ...(a[i] as Kind<"text">), text }; return { ...o, blocks: a }; }
  return { ...o, blocks: [block("text", { text }), ...o.blocks] };
};

export function OptionsAsk({ c, role, labelHint, textHint }: { c: WizardCtx; role: string; labelHint: string; textHint: string }) {
  const ch = get(c, role, "choices", true);
  const options = ch?.options ?? [];
  const setOptions = (opts: ChoiceOption[]) => set(c, role, "choices", (b) => ({ ...b, options: opts }), true);
  return (
    <Rows
      rows={options}
      onChange={setOptions}
      newRow={() => ({ id: uid(), label: "", blocks: [] })}
      addLabel="Add another thing the players might do"
      min={1}
      render={(o, patch) => (
        <>
          <Input value={o.label} onChange={(e) => patch({ label: e.target.value })} placeholder={labelHint} />
          <Textarea
            value={panelText(o)}
            onChange={(e) => setOptions(options.map((x) => (x.id === o.id ? withPanelText(x, e.target.value) : x)))}
            className="min-h-[70px] text-sm"
            placeholder={textHint}
          />
          {o.blocks.some((b) => b.kind !== "text") && (
            <p className="text-[11px] text-amber-500">This one also has extra content added in Advanced editing. It's kept.</p>
          )}
        </>
      )}
    />
  );
}

export const hasOptions = (scene: SceneNode, role: string) =>
  !!sceneGet(scene, role, "choices", true)?.options.some((o) => o.label.trim() && (panelText(o).trim() || o.blocks.length > 0));

/* ---------- steps every scene has ---------- */

export const nameStep: WizardStep = {
  key: "name",
  label: "Name this scene",
  headline: "Let's give this scene a name",
  about: {
    what: "A name and a one-line summary for this scene.",
    why: "While you run the game, the title and summary are how you find your place at a glance.",
    result: "The large title at the top of the scene, and its entry in the list on the left of your screen.",
  },
  done: (s) => !!s.title.trim() && s.title !== "Untitled Scene",
  sample: undefined,
  render: (c) => (
    <>
      <Ask q="What is this scene called?" help="A short working title. You can change it any time." example="The Cellar Door">
        <Input value={c.scene.title} onChange={(e) => c.patchScene({ title: e.target.value })} />
      </Ask>
      <Ask q="In one line, what is this scene?" help="This appears in grey under the title, to remind you what the scene is when you glance down mid-game." example="The mill's cellar door is chained shut, and someone is humming behind it.">
        <Input value={c.scene.subtitle ?? ""} onChange={(e) => c.patchScene({ subtitle: e.target.value })} />
      </Ask>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">More options (you can ignore these)</summary>
        <div className="space-y-3 mt-2">
          <Ask q="Highlight color along the top edge" help="Gold marks an important moment, red marks danger, none is an ordinary scene.">
            <select className={selectCls} value={c.scene.accent ?? ""} onChange={(e) => c.patchScene({ accent: (e.target.value || undefined) as "gold" | "red" | undefined })}>
              <option value="">None</option><option value="gold">Gold (important)</option><option value="red">Red (danger)</option>
            </select>
          </Ask>
          <Ask q="Small label above the title" help="Optional. Handy for numbering, like 'Scene 3'.">
            <Input value={c.scene.label ?? ""} onChange={(e) => c.patchScene({ label: e.target.value })} />
          </Ask>
        </div>
      </details>
    </>
  ),
};

export function exitsStep(withEnemies: boolean): WizardStep {
  return {
    key: "exits",
    label: "What happens next",
    headline: "Where does the story go after this scene?",
    about: {
      what: "The way out of this scene, and (if you like) which enemies appear here.",
      why: "Every scene ends with a line telling you where to take the table next, so you're never stuck wondering what comes after.",
      result: "A maroon 'EXIT' line at the bottom of the scene. Click it and Live Play jumps to the next scene.",
    },
    optional: true,
    done: (s) => s.exits.some((e) => e.description.trim()),
    sample: {
      blurb: "One line pointing at the next scene.",
      apply: (c) => c.patchScene({ exits: [{ id: uid(), description: "The party goes down the cellar steps." }] }),
    },
    render: (c) => (
      <>
        <Ask q="What happens when this scene is over?" help="Write it like an instruction to yourself. Most scenes just lead to the next one in your list, so you can leave the second box on its default." example="The party goes down the cellar steps and meets Harl.">
          <ExitsAsk exits={c.scene.exits} otherScenes={c.otherScenes} onChange={(exits) => c.patchScene({ exits })} />
        </Ask>
        {withEnemies && (
          <Ask q="Are there any enemies in this scene?" help="Optional. If you pick some, a red 'Send enemies to the fight tracker' button appears. One click loads them, with their stats filled in, ready for combat.">
            <EnemyPicker value={c.scene.enemies} onChange={(enemies) => c.patchScene({ enemies })} />
          </Ask>
        )}
      </>
    ),
  };
}

export { StepIntro, Ask };
