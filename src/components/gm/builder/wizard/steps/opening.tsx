// "Start of the session": the recap, who's in the room, and what the players can do.
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WizardStep, WizardCtx, get, set, sceneGet, parseKV, toKV, OptionsAsk, hasOptions, panelText, Ask, StepIntro } from "./common";
import { Rows, LinesAsk, ParagraphsAsk } from "../ui";
import { checkReadAloud, anyText, blank } from "../coach";
import { SAMPLE } from "../sampleText";
import { block } from "@/utils/sceneBlocks";
import { ChoiceOption } from "@/types/campaign";

const S = SAMPLE.opening;

export const openingSteps: WizardStep[] = [
  {
    key: "start",
    label: "Where you begin",
    headline: "What's going on when this session begins?",
    about: {
      what: "A short reminder to yourself about where the players are and how to start.",
      why: "When you sit down, this is the first thing you see. It stops you from starting in the wrong place or spoiling something.",
      result: "A red 'START HERE' box at the very top of the scene.",
    },
    done: (s) => !blank(sceneGet(s, "startHere", "gmAlert")?.text),
    sample: { blurb: "A reminder for a village scene.", apply: (c) => set(c, "startHere", "gmAlert", (b) => ({ ...b, tag: b.tag || "START HERE:", text: S.startHere })) },
    render: (c) => (
      <>
        <StepIntro>This is the start of your session. The players will hear nothing from this screen. It's only for you.</StepIntro>
        <Ask q="Where are the players, and what should you remember at the start?" help="Two or three sentences is plenty. For example, where the scene is, and anything you must not reveal or start too early." example={S.startHere}>
          <Textarea className="min-h-[90px] text-sm" value={get(c, "startHere", "gmAlert")?.text ?? ""}
            onChange={(e) => set(c, "startHere", "gmAlert", (b) => ({ ...b, tag: b.tag || "START HERE:", text: e.target.value }))} />
        </Ask>
      </>
    ),
  },
  {
    key: "resume",
    label: "Words to read out loud",
    headline: "What do you read out loud to bring your players into the scene?",
    about: {
      what: "The description you say aloud to everyone at the table. It's called 'read-aloud text'.",
      why: "It gets everyone picturing the same place. You read it once, cold, so it works best when it's short and full of things they can see, hear, or smell.",
      result: "A blue box you read straight from while running the game.",
    },
    done: (s) => anyText(sceneGet(s, "resume", "readAloud", true)?.paragraphs),
    sample: { blurb: "Arriving at a village with a still mill.", apply: (c) => set(c, "resume", "readAloud", (b) => ({ ...b, tag: b.tag ?? "RESUME", paragraphs: [...S.resume] }), true) },
    render: (c) => {
      const paras = get(c, "resume", "readAloud", true)?.paragraphs ?? [""];
      return (
        <>
          <Ask q="What can the players see, hear, and smell?" help="Describe what's physically there, one thing at a time, in the order they'd notice it. Don't say what their characters feel or decide; that's for the players." example={S.resume.join("\n\n")} tips={checkReadAloud(paras)}>
            <ParagraphsAsk blue rows={9} value={paras}
              onChange={(paragraphs) => set(c, "resume", "readAloud", (b) => ({ ...b, tag: b.tag ?? "RESUME", paragraphs }), true)} />
          </Ask>
          <p className="text-xs text-muted-foreground">Tip: leave a blank line between paragraphs. Each paragraph becomes its own short piece to read.</p>
        </>
      );
    },
  },
  {
    key: "table",
    label: "Handing it to the players",
    headline: "What do you ask to hand the scene over to your players?",
    about: {
      what: "The question you ask right after reading, so the players take over.",
      why: "It's easy to keep talking. Writing the question down makes sure you stop and let them act.",
      result: "A red 'OPEN THE TABLE' box right after the read-aloud.",
    },
    optional: true,
    done: (s) => !blank(sceneGet(s, "openTable", "gmAlert")?.text),
    sample: { blurb: "A standard hand-over.", apply: (c) => set(c, "openTable", "gmAlert", (b) => ({ ...b, tag: b.tag || "OPEN THE TABLE:", text: S.table })) },
    render: (c) => (
      <Ask q="What do you say to start their turn?" help="Put the exact words in **bold** so they stand out." example={S.table}>
        <Textarea className="min-h-[80px] text-sm" value={get(c, "openTable", "gmAlert")?.text ?? ""}
          onChange={(e) => set(c, "openTable", "gmAlert", (b) => ({ ...b, tag: b.tag || "OPEN THE TABLE:", text: e.target.value }))} />
      </Ask>
    ),
  },
  {
    key: "present",
    label: "Who's here",
    headline: "Who is here, and what's each person's situation?",
    about: {
      what: "A short entry for each important character in the scene: the players' characters and the people they might talk to.",
      why: "In the middle of a session it's easy to forget who was hurt, who owed a favor, or who was in the middle of something. This card is a quick reminder.",
      result: "A collapsible card called 'Everyone present'. Click to open it.",
    },
    done: (s) => anyText(sceneGet(s, "present", "card")?.items),
    sample: { blurb: "Two entries: the miller and the villagers.", apply: (c) => set(c, "present", "card", (b) => ({ ...b, open: true, title: b.title || "Everyone present and their current state", items: toKV([...S.present]) })) },
    render: (c) => {
      const rows = parseKV(get(c, "present", "card")?.items ?? []);
      return (
        <Ask q="For each person, what state are they in right now?" help="One entry per person or group. Include anything unresolved: an injury, a promise, a secret you know and they don't." example={S.present.map((p) => `${p.name}: ${p.text}`).join("\n")}>
          <Rows rows={rows} addLabel="Add a person" empty="Nothing yet. Click 'Add a person' to start."
            newRow={() => ({ name: "", text: "" })}
            onChange={(r) => set(c, "present", "card", (b) => ({ ...b, open: b.open ?? true, title: b.title || "Everyone present and their current state", items: toKV(r) }))}
            render={(r, patch) => (
              <>
                <Input value={r.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Name (e.g. Marta)" />
                <Textarea value={r.text} onChange={(e) => patch({ text: e.target.value })} className="min-h-[55px] text-sm" placeholder="Their situation right now" />
              </>
            )} />
        </Ask>
      );
    },
  },
  {
    key: "found",
    label: "What the players have",
    headline: "What have the players found, been given, or read so far?",
    about: {
      what: "A list of clues, items, and written text the players already have.",
      why: "Players will ask 'what did the letter say again?' Having the exact wording in front of you means you never have to guess or flip through notes.",
      result: "Two collapsible cards: one for things they've found, one for exact written text.",
    },
    optional: true,
    done: (s) => anyText(sceneGet(s, "found", "card")?.items) || anyText(sceneGet(s, "exactText", "card")?.quotes),
    sample: { blurb: "Two clues and a sign.", apply: (c) => { set(c, "found", "card", (b) => ({ ...b, title: b.title || "What the party found", items: [...S.found] })); set(c, "exactText", "card", (b) => ({ ...b, title: b.title || "Exact text available to the players", quotes: [...S.exactText] })); } },
    render: (c) => (
      <>
        <Ask q="What have they found or been given?" help="One per line. Include the small facts you'd otherwise have to look up." example={S.found.join("\n")}>
          <LinesAsk rows={5} value={get(c, "found", "card")?.items ?? []}
            onChange={(items) => set(c, "found", "card", (b) => ({ ...b, title: b.title || "What the party found", items }))} />
        </Ask>
        <Ask q="Is there any written text the players can read?" help="Letters, signs, journal pages. Type it word for word, one piece per line, so you can answer questions about it exactly." example={S.exactText.join("\n")}>
          <LinesAsk rows={4} value={get(c, "exactText", "card")?.quotes ?? []}
            onChange={(quotes) => set(c, "exactText", "card", (b) => ({ ...b, title: b.title || "Exact text available to the players", quotes }))} />
        </Ask>
      </>
    ),
  },
  {
    key: "beats",
    label: "Small character moments",
    headline: "What small character moments could the players choose to play?",
    about: {
      what: "Optional moments the players can pick up if they want: a favor, a confession, a bit of banter.",
      why: "They give players something to do besides move the plot. None of them is forced.",
      result: "A collapsible card called 'Available NPC beats'.",
    },
    optional: true,
    done: (s) => anyText(sceneGet(s, "npcBeats", "card")?.items),
    sample: { blurb: "One moment with Marta.", apply: (c) => set(c, "npcBeats", "card", (b) => ({ ...b, title: b.title || "Available NPC beats", items: toKV([...S.beats]) })) },
    render: (c) => {
      const rows = parseKV(get(c, "npcBeats", "card")?.items ?? []);
      return (
        <Ask q="Which small moments could happen if the players want them?" help="Say who it involves and what it could be." example={S.beats.map((b) => `${b.name}: ${b.text}`).join("\n")}>
          <Rows rows={rows} addLabel="Add a moment" empty="None yet. This step is optional."
            newRow={() => ({ name: "", text: "" })}
            onChange={(r) => set(c, "npcBeats", "card", (b) => ({ ...b, title: b.title || "Available NPC beats", items: toKV(r) }))}
            render={(r, patch) => (
              <>
                <Input value={r.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Who it involves" />
                <Textarea value={r.text} onChange={(e) => patch({ text: e.target.value })} className="min-h-[55px] text-sm" placeholder="What could happen" />
              </>
            )} />
        </Ask>
      );
    },
  },
  {
    key: "options",
    label: "What players might do",
    headline: "What might your players do before the story moves on?",
    about: {
      what: "Three or four things players commonly do here. For each one, you write what you'd do or say.",
      why: "Players never do what you expect. Having an answer ready for the common choices means you can respond right away and keep the scene moving.",
      result: "A row of buttons. During the game you tap the one that matches what the players just did, and your notes for it open.",
    },
    done: (s) => hasOptions(s, "options"),
    sample: {
      blurb: "Four common choices in the village.",
      apply: (c) => set(c, "options", "choices", (b) => ({
        ...b,
        options: S.options.map((o): ChoiceOption => ({ id: crypto.randomUUID(), label: o.label, blocks: [block("text", { text: o.text })] })),
      }), true),
    },
    render: (c) => (
      <>
        <StepIntro>Think of the usual things players do: talk to someone, look closely at something, get ready, or head straight for the danger.</StepIntro>
        <Ask q="What might they do, and what do you do or say if they do it?" help="Write the KIND of action on the top line, not a phrase you hope they say. Then write your answer below it." example={S.options.map((o) => `${o.label}\n  → ${o.text}`).join("\n")}>
          <OptionsAsk c={c} role="options" labelHint="They talk to Marta" textHint="What do you do or say if they do this?" />
        </Ask>
        <Ask q="A reminder to yourself: what should you leave to the players?" help="Optional. Shown as a note under the buttons." example={S.noAutomate}>
          <Textarea className="min-h-[60px] text-sm" value={get(c, "noAutomate", "gmNote")?.text ?? ""}
            onChange={(e) => set(c, "noAutomate", "gmNote", (b) => ({ ...b, tag: b.tag || "DO NOT AUTOMATE THE PARTY:", text: e.target.value }))} />
        </Ask>
      </>
    ),
  },
];

/** Used by the sample-module builder to know what text goes where. */
export function applyOpeningSample(c: WizardCtx) {
  for (const s of openingSteps) s.sample?.apply(c);
}
