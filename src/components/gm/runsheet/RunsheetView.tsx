// The interactive runsheet: sidebar nav + quick tools, masthead, and the
// current scene rendered as ordered blocks. One-to-one layout port of
// FIRE_B_SESSION_RUNSHEET.html's #sidebar / #main-content / .scene-card.
import { useState } from "react";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, Swords } from "lucide-react";
import { SceneBlocks, RenderCtx } from "./SceneBlockRenderer";
import { CampaignModule, SceneNode } from "@/types/campaign";
import { rollD20, tierFor } from "@/utils/sceneBlocks";
import "./runsheet.css";

export function RunsheetView({
  module, sceneIndex, onSceneIndex, deployEnemies,
}: {
  module: CampaignModule;
  sceneIndex: number;
  onSceneIndex: (i: number) => void;
  deployEnemies: (enemyIds: string[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [rollResult, setRollResult] = useState<string>("");
  const scenes = module.scenes;
  const scene = scenes[sceneIndex];
  const firstTable = module.tierTables?.[0];

  const ctx: RenderCtx = {
    goToScene: (id) => {
      const i = scenes.findIndex((s) => s.id === id);
      if (i !== -1) onSceneIndex(i);
    },
    sceneTitle: (id) => scenes.find((s) => s.id === id)?.title,
    deployEnemies,
  };

  function quickRoll() {
    const r = rollD20();
    setRollResult(r === 1 ? `d20: ${r} (NAT 1)` : r === 20 ? `d20: ${r} (NAT 20)` : `d20: ${r}`);
  }
  function quickTier() {
    if (!firstTable) return;
    const r = rollD20();
    const t = tierFor(firstTable, r);
    setRollResult(`${firstTable.name} [${r}]: ${t?.label ?? "?"}`);
  }

  if (!scene) return <div className="rs"><p className="rs-small">No scenes yet.</p></div>;

  return (
    <div className="rs">
      <div className="rs-layout">
        <nav className={`rs-sidebar${collapsed ? " collapsed" : ""}`}>
          {collapsed ? (
            <button className="rs-tool-btn" onClick={() => setCollapsed(false)} title="Expand"><PanelLeft className="h-4 w-4" /></button>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ border: 0, paddingBottom: 0 }}>{module.name}</h2>
                <button className="rs-tool-btn" onClick={() => setCollapsed(true)} title="Collapse"><PanelLeftClose className="h-4 w-4" /></button>
              </div>
              {module.navTitle && <div className="rs-nav-group-title">{module.navTitle}</div>}
              <div className="rs-nav-group">
                {scenes.map((s, i) => (
                  <button key={s.id} className={`rs-nav-item${i === sceneIndex ? " active" : ""}`} onClick={() => onSceneIndex(i)}>
                    <span className="rs-nav-num">{i + 1}.</span>{s.title}
                    {(s.navNote ?? s.subtitle) && <span>{s.navNote ?? s.subtitle}</span>}
                  </button>
                ))}
              </div>
              <div className="rs-widget" style={{ marginTop: "auto" }}>
                <h3>Quick Tools</h3>
                <div className="rs-btn-row">
                  <button className="rs-tool-btn" onClick={quickRoll}>Roll d20</button>
                  {firstTable && <button className="rs-tool-btn" onClick={quickTier}>{firstTable.name}</button>}
                </div>
                <div className="rs-roll-result">{rollResult}</div>
              </div>
            </>
          )}
        </nav>

        <main className="rs-main">
          {(module.badge || module.description) && (
            <header className="rs-masthead">
              {module.badge && <div className="rs-badge">{module.badge}</div>}
              <h1 className="rs-title">{module.name}</h1>
              {module.description && <p className="rs-meta">{module.description}</p>}
            </header>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <button className="rs-tool-btn" onClick={() => onSceneIndex(sceneIndex - 1)} disabled={sceneIndex === 0}><ChevronLeft className="h-3.5 w-3.5" style={{ display: "inline" }} /></button>
            <span className="rs-small" style={{ margin: 0 }}>{sceneIndex + 1} / {scenes.length}</span>
            <button className="rs-tool-btn" onClick={() => onSceneIndex(sceneIndex + 1)} disabled={sceneIndex >= scenes.length - 1}><ChevronRight className="h-3.5 w-3.5" style={{ display: "inline" }} /></button>
          </div>

          <SceneCard scene={scene} ctx={ctx} onAdvance={() => onSceneIndex(sceneIndex + 1)} hasNext={sceneIndex < scenes.length - 1} />
        </main>
      </div>
    </div>
  );
}

function SceneCard({ scene, ctx, onAdvance, hasNext }: { scene: SceneNode; ctx: RenderCtx; onAdvance: () => void; hasNext: boolean }) {
  return (
    <section id={`rs-scene-${scene.id}`} className={`rs-scene${scene.accent ? ` accent-${scene.accent}` : ""}`}>
      <div className="rs-scene-header">
        {scene.label && <div className="rs-scene-number">{scene.label}</div>}
        <h2 className="rs-scene-title">{scene.title}</h2>
        {scene.subtitle && <p className="rs-scene-subtitle">{scene.subtitle}</p>}
      </div>

      <SceneBlocks blocks={scene.blocks} ctx={ctx} />

      {scene.enemies.length > 0 && (
        <button className="rs-deploy" onClick={() => ctx.deployEnemies?.(scene.enemies)} style={{ marginTop: "1rem" }}>
          <Swords className="h-4 w-4" style={{ display: "inline", marginRight: 4 }} /> Deploy Encounter ({scene.enemies.length})
        </button>
      )}

      {scene.exits.map((ex) => (
        <div key={ex.id} className="rs-exit">
          <span className="rs-exit-label">EXIT:</span>
          {ex.targetSceneId ? (
            <button className="rs-exit-dest" onClick={() => ctx.goToScene(ex.targetSceneId!)}>
              {ex.description}{ex.branchLabel ? ` → ${ex.branchLabel}` : ""}
            </button>
          ) : hasNext ? (
            <button className="rs-exit-dest" onClick={onAdvance}>{ex.description}</button>
          ) : (
            <span className="rs-exit-dest dead">{ex.description}</span>
          )}
        </div>
      ))}
    </section>
  );
}
