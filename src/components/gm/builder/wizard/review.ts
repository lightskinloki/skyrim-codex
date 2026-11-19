// "Check my whole adventure": everything still missing, plus writing notes,
// in plain language, each pointing at the exact screen that fixes it.
import { CampaignModule, SceneNode } from "@/types/campaign";
import { walkBlocks } from "@/utils/sceneBlocks";
import { sceneProgress } from "./steps";
import { checkReadAloud, checkSpoken, checkNoTargetNumber, blank } from "./coach";

export interface ReviewItem {
  level: "todo" | "warn" | "idea";
  sceneId?: string;
  stepKey?: string;
  text: string;
  why?: string;
}

export function reviewModule(module: CampaignModule): ReviewItem[] {
  const items: ReviewItem[] = [];
  if (module.scenes.length === 0) {
    items.push({ level: "todo", text: "You haven't added any scenes yet. Add your first scene to get started." });
    return items;
  }
  if (blank(module.name)) items.push({ level: "todo", text: "Your adventure doesn't have a name yet." });

  module.scenes.forEach((scene: SceneNode, i) => {
    const where = `Scene ${i + 1}, "${scene.title || "Untitled"}"`;
    const prog = sceneProgress(scene, module);
    for (const step of prog.missing) {
      items.push({ level: "todo", sceneId: scene.id, stepKey: step.key, text: `${where}: still needs "${step.label}".` });
    }
    const last = i === module.scenes.length - 1;
    if (!last && scene.kind !== "endings" && !scene.exits.some((e) => e.description.trim())) {
      items.push({ level: "idea", sceneId: scene.id, stepKey: "exits", text: `${where}: doesn't say where the story goes next.`, why: "A last line telling you where to take the table means you're never stuck wondering what comes after." });
    }

    const seen = new Set<string>();
    const add = (level: "warn" | "idea", text: string, why: string) => {
      const key = `${scene.id}:${text}`;
      if (seen.has(key)) return; seen.add(key);
      items.push({ level, sceneId: scene.id, text: `${where}: ${text}`, why });
    };
    walkBlocks(scene.blocks, (b) => {
      if (b.kind === "readAloud") for (const t of checkReadAloud(b.paragraphs)) add(t.level, t.text, t.why);
      if (b.kind === "spoken") for (const t of checkSpoken(b.line)) add(t.level, t.text, t.why);
      if (b.kind === "gmNote" || b.kind === "gmAlert") for (const t of checkNoTargetNumber(b.text)) add(t.level, t.text, t.why);
      if (b.kind === "findable" && !blank(b.name) && blank(b.readAloud) && blank(b.description)) {
        add("warn", `"${b.name}" can be found, but nothing is written about what it is.`, "If you tell the players a thing is there, you need to know what it says or does. Otherwise you'll be inventing it while they wait.");
      }
      if (b.kind === "combat") {
        const c = b.combat;
        for (const tr of c.trackers) {
          if (tr.threshold && !tr.triggerBlocks.some((x) => x.kind === "readAloud" && x.paragraphs.some((p) => p.trim()))) {
            add("idea", `"${tr.title}" has a big moment set, but nothing to read out loud when it happens.`, "When enough of them break, the table will look at you. Having the words ready keeps the moment strong.");
          }
        }
        if (c.tierTableId) {
          const t = (module.tierTables ?? []).find((x) => x.id === c.tierTableId);
          if (t) {
            const covered = new Array(21).fill(0);
            t.tiers.forEach((r) => { for (let n = Math.max(1, r.min); n <= Math.min(20, r.max); n++) covered[n]++; });
            const gaps = covered.map((v, n) => (n > 0 && v === 0 ? n : 0)).filter(Boolean);
            if (gaps.length) add("warn", `the round table "${t.name}" has no result for ${gaps.slice(0, 5).join(", ")}${gaps.length > 5 ? "…" : ""}.`, "If the die lands on a number nothing covers, you'll have to decide on the spot. Make sure rows cover every number from 1 to 20.");
          }
        }
      }
    });
  });
  return items;
}
