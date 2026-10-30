// "A talk with a character": a small map of how the conversation could go, so
// the GM is ready whatever the players say or do.
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { WizardStep, WizardCtx, get, set, sceneGet, Ask, StepIntro } from "./common";
import { Rows, LinesAsk, ParagraphsAsk, selectCls } from "../ui";
import { checkReadAloud, checkSpoken, anyText, blank } from "../coach";
import { SAMPLE } from "../sampleText";
import {
  createDirector, responseNodes, personNodes, addResponseNode, addPersonNode, removeDirectorNode,
  patchDirectorNode, directorNode,
} from "@/utils/sceneBlocks";
import { ConversationDirector, DirectorNode, VoiceAnchor, DirectorReply, SceneNode } from "@/types/campaign";

const T = SAMPLE.talk;

const dirOf = (c: WizardCtx): ConversationDirector | undefined => get(c, "director", "director", true)?.director;
const sceneDir = (s: SceneNode): ConversationDirector | undefined => sceneGet(s, "director", "director", true)?.director;
const patchDir = (c: WizardCtx, fn: (d: ConversationDirector) => ConversationDirector) =>
  set(c, "director", "director", (b) => ({ ...b, director: fn(b.director) }), true);

const shapeText = (name: string) =>
  `${name || "The character"} speaks first. The players respond. Open the card that's closest to what they just did, answer from it, show one reaction from the room, then come back to the main map.`;

/** The whole sample conversation, filled in. */
export function sampleDirector(): ConversationDirector {
  const d = createDirector(T.npc);
  const [welcome, hub, ask, disagree, agree, attack] = d.nodes;
  const fill = (n: DirectorNode, x: { aim: string; anchors: readonly string[]; info: readonly string[]; replies?: readonly { say: string; ans: string }[] }): DirectorNode => ({
    ...n, aim: x.aim, anchors: x.anchors.map((t) => ({ text: t, source: "DRAFT" as const })), info: [...x.info],
    replies: x.replies ? x.replies.map((r) => ({ ...r })) : undefined,
  });
  return {
    ...d, npc: T.npc, mustSay: [...T.mustSay], mustSayNote: "Everything else: your own words.",
    always: [...T.always], beatsLabel: T.beatsLabel, beats: [...T.beats],
    nodes: [
      { ...welcome, intent: "The players open the cellar door." },
      hub,
      fill(ask, T.ask), fill(disagree, T.disagree), fill(agree, T.agree), fill(attack, T.attack),
    ],
  };
}

const RESPONSE_IDEAS: { title: string; intent: string }[] = [
  { title: "They say nothing or hesitate", intent: "The table goes quiet and nobody answers." },
  { title: "They ask about a specific person", intent: "They want to know about someone in the room or someone missing." },
  { title: "They try to bargain", intent: "They offer something in exchange for what they want." },
  { title: "They lie or bluff", intent: "They say something untrue to get an advantage." },
  { title: "They try to leave", intent: "They turn away, or try to end the conversation." },
];

function NodeWhat({ c, id }: { c: WizardCtx; id: string }) {
  const d = dirOf(c); const n = d?.nodes.find((x) => x.id === id);
  if (!d || !n) return null;
  const patch = (p: Partial<DirectorNode>) => patchDir(c, (dd) => patchDirectorNode(dd, id, p));
  const who = d.npc || "the character";
  const replies = n.replies ?? [];
  return (
    <>
      <StepIntro>During the game, you'll tap this card when the players do something like this. Describe the KIND of thing they might do, so any wording they use lands on a card.</StepIntro>
      <Ask q="What did the players do or say?" help="Name the type of action, like 'They disagree'. Don't write a phrase you hope they'll say." example="They disagree or object">
        <Input value={n.title} onChange={(e) => patch({ title: e.target.value })} />
      </Ask>
      <Ask q="What does that look like at the table?" help="One line to help you recognize this moment." example="They say the deal is unfair, or they argue.">
        <Input value={n.intent ?? ""} onChange={(e) => patch({ intent: e.target.value })} />
      </Ask>
      <Ask q={`What does ${who} want out of this moment?`} help="One sentence about what this character is trying to do. It keeps you on track while you improvise their words." example={T.disagree.aim}>
        <Textarea className="min-h-[60px] text-sm" value={n.aim ?? ""} onChange={(e) => patch({ aim: e.target.value })} />
      </Ask>
      <Ask q="If the players say something specific, what's the answer?" help="Optional. A few likely things the players might say, with the answer that's true. This is a shortcut for the questions you can predict." example={`If they say: "${T.ask.replies[0].say}" → ${T.ask.replies[0].ans}`}>
        <Rows rows={replies} addLabel="Add a likely question" empty="None yet. This is optional." newRow={() => ({ say: "", ans: "" } as DirectorReply)}
          onChange={(r) => patch({ replies: r })}
          render={(r, p) => (
            <>
              <Input value={r.say} onChange={(e) => p({ say: e.target.value })} placeholder='If they say...' />
              <Textarea value={r.ans} onChange={(e) => p({ ans: e.target.value })} className="min-h-[50px] text-sm" placeholder={`What ${who} answers or does`} />
            </>
          )} />
      </Ask>
    </>
  );
}

function NodeHow({ c, id, person }: { c: WizardCtx; id: string; person?: boolean }) {
  const d = dirOf(c); const n = d?.nodes.find((x) => x.id === id);
  if (!d || !n) return null;
  const patch = (p: Partial<DirectorNode>) => patchDir(c, (dd) => patchDirectorNode(dd, id, p));
  const who = d.npc || "the character";
  const anchors = n.anchors ?? [];
  return (
    <>
      {person && (
        <Ask q={`What does ${who} say or want when speaking to ${n.title || "this person"}?`} help="Speak to what this person cares about or is hurting over, not a speech about who they are." example="He notices the boy's mother waiting outside and lowers his voice.">
          <Textarea className="min-h-[60px] text-sm" value={n.aim ?? ""} onChange={(e) => patch({ aim: e.target.value })} />
        </Ask>
      )}
      <Ask q={`What does ${who} sound like here?`} help="Write two or three example lines in their voice. You won't read them like a script; they're there to get you into the character's way of speaking." example={T.ask.anchors[0]}>
        <Rows rows={anchors} addLabel="Add an example line" empty="None yet." newRow={() => ({ text: "", source: "DRAFT" } as VoiceAnchor)}
          onChange={(a) => patch({ anchors: a })}
          render={(a, p) => (
            <>
              <Textarea value={a.text} onChange={(e) => p({ text: e.target.value })} className="min-h-[55px] text-sm" placeholder="An example line" />
              {checkSpoken(a.text).map((t, i) => <p key={i} className="text-[11px] text-blue-400">{t.text} {t.why}</p>)}
              <div className="flex gap-2">
                <select className={selectCls} value={a.source} onChange={(e) => p({ source: e.target.value as "SOURCE" | "DRAFT" })}>
                  <option value="DRAFT">I wrote it just for this scene</option>
                  <option value="SOURCE">It's quoted from my notes or a book</option>
                </select>
                {a.source === "SOURCE" && <Input className="flex-1" value={a.ref ?? ""} onChange={(e) => p({ ref: e.target.value })} placeholder="Where in your notes?" />}
              </div>
            </>
          )} />
      </Ask>
      <Ask q="What is true here, and what will they admit?" help="One per line. What the character knows, what they'll answer honestly, and what they won't reveal." example={T.ask.info.join("\n")}>
        <LinesAsk rows={4} value={n.info ?? []} onChange={(info) => patch({ info })} />
      </Ask>
      <Ask q="What do they do while they talk? (optional)" help="Small physical actions make a character feel alive." example="He keeps one hand resting on the barrel.">
        <LinesAsk rows={3} value={n.perf ?? []} onChange={(perf) => patch({ perf })} />
      </Ask>
      <Ask q="How does everyone else react? (optional)" help="One quick beat from the room, so the scene isn't only two people." example="One of Harl's helpers shifts on the stairs.">
        <Textarea className="min-h-[55px] text-sm" value={n.room ?? ""} onChange={(e) => patch({ room: e.target.value })} />
      </Ask>
      {!person && (
        <Ask q="Is there anything you want to be sure to cover? (optional)" help="One per line. These become a checklist you can tick off during the game, so you don't forget to mention something important." example="Mention the deadline is dawn.">
          <LinesAsk rows={3} value={n.points ?? []} onChange={(points) => patch({ points })} />
        </Ask>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">More options (you can ignore these)</summary>
        <div className="mt-2">
          <Ask q="Where can this card lead next?" help="Every card already has a 'back to the main map' button. Tick other cards here if one often follows this one.">
            <div className="flex flex-wrap gap-1">
              {d.nodes.filter((x) => x.id !== id && x.id !== d.hubNodeId).map((x) => (
                <button key={x.id} className={`text-xs border rounded px-2 py-1 ${n.next.includes(x.id) ? "bg-accent/30 border-accent" : ""}`}
                  onClick={() => patch({ next: n.next.includes(x.id) ? n.next.filter((y) => y !== x.id) : [...n.next, x.id] })}>
                  {x.title || "Untitled"}
                </button>
              ))}
            </div>
          </Ask>
        </div>
      </details>
    </>
  );
}

export function conversationSteps(scene: SceneNode): WizardStep[] {
  const d = sceneDir(scene);
  const npcName = d?.npc || "the character";
  const steps: WizardStep[] = [
    {
      key: "who",
      label: "Who they're talking to",
      headline: "Who are the players going to talk to?",
      about: {
        what: "The name of the character. This scene is a conversation with one important character.",
        why: "Instead of writing a script (players never follow scripts), you'll build a small map of how the talk could go. During the game, you tap the card that matches what the players just did.",
        result: "A clickable map of cards with the character's name at the top.",
      },
      done: (s) => !blank(sceneDir(s)?.npc),
      sample: {
        blurb: "A calm smuggler named Harl, with the whole talk filled in.",
        apply: (c) => {
          patchDir(c, () => sampleDirector());
          set(c, "shape", "gmAlert", (b) => ({ ...b, tag: b.tag || "SCENE SHAPE:", text: shapeText(T.npc) }));
        },
      },
      render: (c) => {
        const dd = dirOf(c);
        return (
          <>
            <StepIntro>You'll set up the character, what they say first, and then a card for each kind of thing the players might do.</StepIntro>
            <Ask q="What is the character's name?" help="Any name works, and you can change it later." example={T.npc}>
              <Input value={dd?.npc ?? ""} onChange={(e) => {
                const name = e.target.value;
                patchDir(c, (x) => ({ ...x, npc: name }));
                const cur = get(c, "shape", "gmAlert")?.text ?? "";
                if (!cur || cur === shapeText(dd?.npc ?? "") || cur.startsWith("The NPC speaks first") || cur.endsWith("then come back to the main map.")) {
                  set(c, "shape", "gmAlert", (b) => ({ ...b, tag: b.tag || "SCENE SHAPE:", text: shapeText(name) }));
                }
              }} />
            </Ask>
          </>
        );
      },
    },
    {
      key: "arrival",
      label: "The first meeting",
      headline: `What do the players see and hear when they meet ${npcName}?`,
      about: {
        what: "The words you read out loud when the players arrive, ending with the character's first line.",
        why: "It sets the scene and gives the character an entrance. You read it once, then stop and let the players respond.",
        result: "A blue box to read out loud, followed by a reminder to stop and ask what the players do.",
      },
      done: (s) => anyText(sceneGet(s, "arrival", "readAloud", true)?.paragraphs),
      sample: {
        blurb: "Harl waits calmly in the cellar.",
        apply: (c) => { set(c, "arrival", "readAloud", (b) => ({ ...b, tag: b.tag ?? "ARRIVAL", paragraphs: [...T.arrival] }), true); set(c, "stopAsk", "gmNote", (b) => ({ ...b, text: T.stopAsk })); },
      },
      render: (c) => {
        const paras = get(c, "arrival", "readAloud", true)?.paragraphs ?? [""];
        return (
          <>
            <Ask q="What can the players see and hear, and what is the character's first line?" help="Describe what's physically there, one thing at a time. End with what the character says. Then you'll stop." example={T.arrival.join("\n\n")} tips={checkReadAloud(paras)}>
              <ParagraphsAsk blue rows={10} value={paras} onChange={(paragraphs) => set(c, "arrival", "readAloud", (b) => ({ ...b, tag: b.tag ?? "ARRIVAL", paragraphs }), true)} />
            </Ask>
            <Ask q="What do you do right after reading it?" help="This is a reminder to yourself to stop talking and hand the scene to the players." example={T.stopAsk}>
              <Textarea className="min-h-[60px] text-sm" value={get(c, "stopAsk", "gmNote")?.text ?? ""}
                onChange={(e) => set(c, "stopAsk", "gmNote", (b) => ({ ...b, text: e.target.value }))} />
            </Ask>
          </>
        );
      },
    },
    {
      key: "mustSay",
      label: "Lines to say exactly",
      headline: `Are there any lines ${npcName} must say word for word?`,
      about: {
        what: "A very short list of lines that need to be said exactly as written.",
        why: "Most of what a character says, you'll improvise. A few lines are important enough to say exactly: a threat, a secret, a goodbye. Keeping the list short keeps the conversation natural.",
        result: "A red banner at the top of the conversation map, so you never forget these lines.",
      },
      optional: true,
      done: (s) => anyText(sceneDir(s)?.mustSay),
      sample: { blurb: "One line for the smuggler.", apply: (c) => patchDir(c, (x) => ({ ...x, mustSay: [...T.mustSay], mustSayNote: "Everything else: your own words." })) },
      render: (c) => {
        const dd = dirOf(c);
        return (
          <>
            <Ask q="Which lines must be said exactly, and when?" help="One per line. Two or three is plenty. If none of the lines needs to be exact, leave this empty." example={T.mustSay.join("\n")}>
              <LinesAsk rows={4} value={dd?.mustSay ?? []} onChange={(mustSay) => patchDir(c, (x) => ({ ...x, mustSay }))} />
            </Ask>
            <Ask q="What reminder goes under the banner?" help="Something to keep you relaxed about the rest." example="Everything else: your own words.">
              <Input value={dd?.mustSayNote ?? ""} onChange={(e) => patchDir(c, (x) => ({ ...x, mustSayNote: e.target.value }))} />
            </Ask>
          </>
        );
      },
    },
    {
      key: "carry",
      label: "How they behave",
      headline: `How does ${npcName} behave in general?`,
      about: {
        what: "Things that are always true about how this character acts, plus small things that keep happening in the room.",
        why: "Character habits keep them consistent across the whole conversation. Background moments keep the scene from feeling frozen while two people talk.",
        result: "A reminder line at the bottom of the map, and a list of background moments you can tap once per exchange.",
      },
      optional: true,
      done: (s) => anyText(sceneDir(s)?.always) || anyText(sceneDir(s)?.beats),
      sample: { blurb: "Habits and background moments for Harl.", apply: (c) => patchDir(c, (x) => ({ ...x, always: [...T.always], beatsLabel: T.beatsLabel, beats: [...T.beats] })) },
      render: (c) => {
        const dd = dirOf(c);
        return (
          <>
            <Ask q="What is always true about how they act?" help="One per line. Habits and rules for playing them." example={T.always.join("\n")}>
              <LinesAsk rows={5} value={dd?.always ?? []} onChange={(always) => patchDir(c, (x) => ({ ...x, always }))} />
            </Ask>
            <Ask q="What small things keep happening in the room while they talk?" help="One per line. During the conversation you tap one after each exchange, so the world keeps moving." example={T.beats.join("\n")}>
              <Input className="mb-1" placeholder='What to call these (e.g. "Background beat")' value={dd?.beatsLabel ?? ""} onChange={(e) => patchDir(c, (x) => ({ ...x, beatsLabel: e.target.value }))} />
              <LinesAsk rows={4} value={dd?.beats ?? []} onChange={(beats) => patchDir(c, (x) => ({ ...x, beats }))} />
            </Ask>
          </>
        );
      },
    },
    {
      key: "responses",
      label: "What players might do",
      headline: "What kinds of things might the players do or say?",
      about: {
        what: "The list of cards on your conversation map. Each card is one kind of thing the players might do.",
        why: "Players are unpredictable. Instead of scripting the talk, you make one card for each kind of thing they might do. During the game you tap the card that fits, and it shows you what the character wants and how to answer. We've started you off with four common ones.",
        result: "A grid of cards on the conversation map. The card you've tapped turns green so you can see what you've covered.",
      },
      done: (s) => { const dd = sceneDir(s); return !!dd && responseNodes(dd).length >= 1; },
      render: (c) => {
        const dd = dirOf(c);
        if (!dd) return null;
        const nodes = responseNodes(dd);
        const existing = new Set(nodes.map((n) => n.title));
        return (
          <>
            <StepIntro>You'll fill in each card on the next screens. If one doesn't apply to your scene, delete it. It's fine to have just two or three.</StepIntro>
            <Ask q="Which of these might your players do?" help="Rename any of them, delete the ones you don't need, or add your own.">
              <div className="space-y-2">
                {nodes.map((n) => (
                  <div key={n.id} className="flex gap-2 items-center">
                    <Input value={n.title} onChange={(e) => patchDir(c, (x) => patchDirectorNode(x, n.id, { title: e.target.value }))} />
                    <button className="text-muted-foreground hover:text-destructive" title="Delete this card" onClick={() => patchDir(c, (x) => removeDirectorNode(x, n.id))}><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => patchDir(c, (x) => addResponseNode(x, "New response"))}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add my own
                </Button>
              </div>
            </Ask>
            <Ask q="Need ideas? Tap one to add it.">
              <div className="flex flex-wrap gap-1.5">
                {RESPONSE_IDEAS.filter((i) => !existing.has(i.title)).map((i) => (
                  <button key={i.title} className="text-xs border rounded-full px-3 py-1 hover:bg-accent/20"
                    onClick={() => patchDir(c, (x) => { const withNode = addResponseNode(x, i.title); const added = withNode.nodes[withNode.nodes.length - 1]; return patchDirectorNode(withNode, added.id, { intent: i.intent }); })}>
                    + {i.title}
                  </button>
                ))}
              </div>
            </Ask>
          </>
        );
      },
    },
  ];

  if (d) {
    for (const n of responseNodes(d)) {
      const label = n.title || "New card";
      steps.push({
        key: `node:${n.id}:a`, label: `${label}: what it is`, headline: `When the players do this: "${label}"`,
        about: {
          what: "One card on your map. It describes a kind of thing the players might do, and what the character wants when it happens.",
          why: "When the players do something like this, you tap this card and instantly remember what the character is after.",
          result: "A card on the map. Tapping it shows this information and marks it green.",
        },
        done: (s) => !blank(sceneDir(s)?.nodes.find((x) => x.id === n.id)?.aim),
        render: (c) => <NodeWhat c={c} id={n.id} />,
      });
      steps.push({
        key: `node:${n.id}:b`, label: `${label}: how they sound`, headline: `How does ${npcName} sound when the players do this?`,
        about: {
          what: "Example lines, what the character knows, and how the room reacts.",
          why: "Having a couple of lines in the character's voice keeps you in character. Knowing what they will and won't reveal keeps you consistent.",
          result: "The rest of the same card: example lines, facts, and a background reaction.",
        },
        optional: true,
        done: (s) => { const nn = sceneDir(s)?.nodes.find((x) => x.id === n.id); return !!nn && (!!nn.anchors?.some((a) => a.text.trim()) || anyText(nn.info)); },
        render: (c) => <NodeHow c={c} id={n.id} />,
      });
    }
  }

  steps.push({
    key: "people",
    label: "Speaking to specific people",
    headline: `Does ${npcName} speak differently to particular characters?`,
    about: {
      what: "Optional. If a player brings up something personal, the character can answer that person directly, instead of the whole room.",
      why: "Players love it when a villain or ally notices them specifically. Adding a person here gives you a place to write what the character says to them.",
      result: "A 'Makes it personal' card on the map that lists each person you add.",
    },
    optional: true,
    done: (s) => { const dd = sceneDir(s); return !!dd && personNodes(dd).some((n) => n.title.trim()); },
    render: (c) => {
      const dd = dirOf(c);
      if (!dd) return null;
      const people = personNodes(dd);
      return (
        <Ask q="Which characters might they speak to personally?" help="Add each player character or important companion. You'll write what the character says to each one on the next screens." example="Marta's son Corin, the boy tied to the post.">
          <div className="space-y-2">
            {people.map((n) => (
              <div key={n.id} className="flex gap-2 items-center">
                <Input value={n.title} onChange={(e) => patchDir(c, (x) => patchDirectorNode(x, n.id, { title: e.target.value }))} placeholder="Name" />
                <button className="text-muted-foreground hover:text-destructive" title="Remove" onClick={() => patchDir(c, (x) => removeDirectorNode(x, n.id))}><X className="h-4 w-4" /></button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => patchDir(c, (x) => addPersonNode(x, ""))}><Plus className="h-3.5 w-3.5 mr-1" /> Add a person</Button>
          </div>
        </Ask>
      );
    },
  });

  if (d) {
    for (const n of personNodes(d)) {
      steps.push({
        key: `person:${n.id}`, label: `${n.title || "Person"}: what they say`, headline: `What does ${npcName} say to ${n.title || "this person"}?`,
        about: { what: "What the character says to this one person.", why: "It lets you speak to what this person cares about.", result: "A card for this person, under 'Makes it personal'." },
        done: (s) => !blank(sceneDir(s)?.nodes.find((x) => x.id === n.id)?.aim),
        render: (c) => <NodeHow c={c} id={n.id} person />,
      });
    }
  }
  return steps;
}

export { directorNode };
