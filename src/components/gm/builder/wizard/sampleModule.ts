// Builds the finished sample adventure ("The Silent Mill") a newcomer can open,
// run in Live Play, and change. It is produced by running every wizard step's
// own "fill in the example" against a fresh scene, so what a person sees in the
// sample is exactly what each screen's example button would have typed.
import { CampaignModule, SceneKind, SceneNode, CAMPAIGN_SCHEMA_VERSION } from "@/types/campaign";
import { createSceneOfKind, uid, findRole } from "@/utils/sceneBlocks";
import { fillSceneWithSample } from "./steps";
import { SAMPLE } from "./sampleText";

interface Spec { kind: SceneKind; title: string; subtitle?: string; exit?: string }

export function buildSampleModule(): CampaignModule {
  const id = uid();
  const specs: Spec[] = [
    { kind: "opening", title: SAMPLE.opening.title, subtitle: SAMPLE.opening.subtitle, exit: SAMPLE.opening.exit },
    { kind: "scene", title: SAMPLE.place.title, subtitle: SAMPLE.place.subtitle, exit: SAMPLE.place.exit },
    { kind: "conversation", title: SAMPLE.talk.title, subtitle: SAMPLE.talk.subtitle, exit: "The talk ends in a deal or in a fight." },
    { kind: "combat", title: SAMPLE.fight.title, subtitle: SAMPLE.fight.subtitle, exit: SAMPLE.fight.exit },
    { kind: "endings", title: SAMPLE.endings.title, subtitle: "Pick the ending the table reached." },
    { kind: "resolution", title: SAMPLE.wrap.title },
  ];

  let m: CampaignModule = {
    id, name: SAMPLE.moduleName, description: SAMPLE.moduleDesc, badge: "Sample adventure",
    tierTables: [], scenes: [], schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  };
  m.scenes = specs.map((sp) => ({ ...createSceneOfKind(sp.kind, sp.title, id), subtitle: sp.subtitle }));

  // fill each scene with its example content
  for (const sp of specs) {
    const scene = m.scenes.find((s) => s.title === sp.title)!;
    const filled = fillSceneWithSample(m, scene);
    m = { ...filled.module, scenes: filled.module.scenes.map((s) => (s.id === scene.id ? filled.scene : s)) };
  }

  // wire the exits: each scene leads to the next; endings link to the wrap-up
  m = {
    ...m,
    scenes: m.scenes.map((s, i): SceneNode => {
      const next = m.scenes[i + 1];
      const sp = specs[i];
      const exits = sp.exit && next ? [{ id: uid(), description: sp.exit, targetSceneId: next.id }] : [];
      let blocks = s.blocks;
      if (s.kind === "endings" && next) {
        const ch = findRole(s.blocks, "endings", "choices", true);
        if (ch) {
          blocks = s.blocks.map((b) => (b.id === ch.id && b.kind === "choices"
            ? { ...b, options: b.options.map((o) => ({ ...o, blocks: o.blocks.map((x) => (x.kind === "exit" ? { ...x, targetSceneId: next.id } : x)) })) }
            : b));
        }
      }
      return { ...s, exits, blocks };
    }),
  };
  return m;
}
