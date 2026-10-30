// Entry point for the guided step flows: the steps for any scene, plus the
// helper that fills a whole scene with the sample story (used by the sample
// adventure and by each step's "Fill in the example" button).
import { SceneKind, SceneNode, CampaignModule } from "@/types/campaign";
import { WizardStep, WizardCtx, nameStep, exitsStep } from "./common";
import { openingSteps } from "./opening";
import { sceneSteps } from "./scene";
import { conversationSteps } from "./conversation";
import { combatSteps } from "./combat";
import { endingsSteps, resolutionSteps } from "./endings";

export type { WizardStep, WizardCtx } from "./common";

export function stepsForScene(scene: SceneNode): WizardStep[] {
  const kind: SceneKind = scene.kind ?? "scene";
  const body: WizardStep[] =
    kind === "opening" ? openingSteps
      : kind === "conversation" ? conversationSteps(scene)
        : kind === "combat" ? combatSteps(scene)
          : kind === "endings" ? endingsSteps(scene)
            : kind === "resolution" ? resolutionSteps
              : sceneSteps;
  return [nameStep, ...body, exitsStep(kind === "scene" || kind === "opening")];
}

/** Which required steps still have nothing in them, and how far along a scene is. */
export function sceneProgress(scene: SceneNode, module: CampaignModule) {
  const steps = stepsForScene(scene);
  const required = steps.filter((s) => !s.optional);
  const missing = required.filter((s) => !s.done(scene, module));
  return { steps, required: required.length, done: required.length - missing.length, missing };
}

/** Run every step's sample against a scene until nothing new appears
 * (some steps only exist once an earlier one has been filled in). */
export function fillSceneWithSample(module: CampaignModule, scene: SceneNode): { module: CampaignModule; scene: SceneNode } {
  let m = module;
  let s = scene;
  for (let pass = 0; pass < 4; pass++) {
    const steps = stepsForScene(s).filter((st) => st.sample);
    for (const st of steps) {
      const ctx: WizardCtx = {
        module: m, scene: s, otherScenes: m.scenes.filter((x) => x.id !== s.id),
        patchScene: (p) => { s = { ...s, ...p }; },
        patchBlocks: (fn) => { s = { ...s, blocks: fn(s.blocks) }; },
        patchModule: (fn) => { m = fn(m); },
      };
      st.sample!.apply(ctx);
      ctx.scene = s; ctx.module = m;
    }
  }
  return { module: m, scene: s };
}
