// Renders one ordered list of SceneBlocks in the console runsheet look.
// Used for a scene's top-level blocks, and recursively for branch/choice/
// combat-trigger content — the same renderer, any depth.
import { useState } from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff, MapPin, Swords } from "lucide-react";
import { Inline } from "./Inline";
import { DirectorView } from "./DirectorView";
import { CombatManagerView } from "./CombatManagerView";
import { SceneBlock, Findable } from "@/types/campaign";
import { rollD20 } from "@/utils/sceneBlocks";

export interface RenderCtx {
  /** Jump to another scene by id (exit blocks + endings that carry an exit). */
  goToScene: (id: string) => void;
  /** Scene titles by id, for showing an exit's destination. */
  sceneTitle: (id?: string) => string | undefined;
  /** Toggle a findable resolved/found (persisted on the scene). */
  toggleFound?: (findableBlockId: string) => void;
  foundIds?: Set<string>;
  /** Send EnemyTemplate ids to the combat tracker (a combat block's "Deploy Encounter"). */
  deployEnemies?: (enemyIds: string[]) => void;
}

export function SceneBlocks({ blocks, ctx }: { blocks: SceneBlock[]; ctx: RenderCtx }) {
  return (
    <>
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} ctx={ctx} />
      ))}
    </>
  );
}

function BlockView({ block: b, ctx }: { block: SceneBlock; ctx: RenderCtx }) {
  switch (b.kind) {
    case "readAloud":
      return (
        <div className={`rs-read-aloud${b.tone === "danger" ? " danger" : ""}`}>
          <div className="rs-read-aloud-tag">&gt;&gt; READ ALOUD{b.tag ? ` — ${b.tag}` : ""}</div>
          {b.paragraphs.filter(Boolean).map((p, i) => (
            <p key={i}><Inline text={p} /></p>
          ))}
        </div>
      );
    case "gmNote":
      return (
        <div className="rs-gm-note">
          <span className="rs-gm-tag">{b.tag ?? "GM:"}</span>
          <Inline text={b.text} />
          {b.items?.length ? (
            <ul>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>
          ) : null}
        </div>
      );
    case "gmAlert":
      return (
        <div className="rs-gm-alert">
          <span className="rs-gm-tag">{b.tag ?? "GM:"}</span>
          <Inline text={b.text} />
          {b.items?.length ? (
            <ul>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>
          ) : null}
        </div>
      );
    case "stop":
      return <div className="rs-stop">{b.text}</div>;
    case "spoken":
      return (
        <div className={`rs-spoken${b.tone ? ` tone-${b.tone}` : ""}`}>
          <div className="rs-speaker">{b.speaker}{b.direction ? <span className="dir"> ({b.direction})</span> : null}:</div>
          <div className="rs-spoken-text">"<Inline text={b.line} />"</div>
        </div>
      );
    case "handout":
      return (
        <div className="rs-in-world">
          <div className="rs-in-world-title">HANDOUT — {b.title}</div>
          <div><Inline text={b.text} /></div>
        </div>
      );
    case "quote":
      return (
        <>
          {b.lines.map((l, i) => <div key={i} className="rs-anchor-line">"{l}"</div>)}
        </>
      );
    case "heading":
      return <div className={`rs-heading${b.tone ? ` tone-${b.tone}` : ""}`}><Inline text={b.text} /></div>;
    case "list":
      return (
        <>
          {b.title && <div className="rs-list-title">{b.title}</div>}
          {b.ordered ? (
            <ol>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ol>
          ) : (
            <ul>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>
          )}
        </>
      );
    case "text":
      return b.small ? <p className="rs-small"><Inline text={b.text} /></p> : <p><Inline text={b.text} /></p>;
    case "card":
      return (
        <details className="rs-card" open={b.open}>
          <summary>{b.title}</summary>
          <div className="rs-card-body">
            {b.items.length > 0 && <ul>{b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}</ul>}
            {b.quotes?.map((q, i) => <div key={i} className="rs-anchor-line">"{q}"</div>)}
            {b.note && <p className="rs-small"><Inline text={b.note} /></p>}
          </div>
        </details>
      );
    case "branch":
      return (
        <div className={`rs-branch b-${b.tone}`}>
          <div className="rs-branch-header">
            <span>{b.title}</span>
            {b.tag && <span>{b.tag}</span>}
          </div>
          <div className="rs-branch-body">
            <SceneBlocks blocks={b.blocks} ctx={ctx} />
          </div>
        </div>
      );
    case "choices":
      return <ChoicesView block={b} ctx={ctx} />;
    case "check":
      return <CheckView block={b} />;
    case "findable":
      return <FindableView block={b} ctx={ctx} />;
    case "exit": {
      const dest = ctx.sceneTitle(b.targetSceneId);
      return (
        <div className="rs-exit inline">
          <span className="rs-exit-label">{b.label ?? "EXIT:"}</span>
          {b.targetSceneId ? (
            <button className="rs-exit-dest" onClick={() => ctx.goToScene(b.targetSceneId!)}>
              {b.description}{dest ? ` → ${dest}` : ""}
            </button>
          ) : (
            <span className="rs-exit-dest dead">{b.description}</span>
          )}
        </div>
      );
    }
    case "director":
      return <DirectorView director={b.director} sceneId={b.id} />;
    case "combat":
      return <CombatManagerView combat={b.combat} blockId={b.id} ctx={ctx} />;
    default:
      return null;
  }
}

function ChoicesView({ block: b, ctx }: { block: Extract<SceneBlock, { kind: "choices" }>; ctx: RenderCtx }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = b.options.find((o) => o.id === openId);
  return (
    <div>
      {b.prompt && <p className="rs-choice-prompt"><Inline text={b.prompt} /></p>}
      <div className="rs-actions">
        {b.options.map((o) => (
          <button
            key={o.id}
            className={`rs-dir-btn${openId === o.id ? " active" : ""}`}
            onClick={() => setOpenId(openId === o.id ? null : o.id)}
          >
            {o.label}
            {b.variant === "endings" && o.planned !== undefined && (
              <span className={o.planned ? "planned" : "unplanned"}>
                {o.planned ? `PLANNED${o.source ? ` — ${o.source}` : ""}` : "improvised"}
              </span>
            )}
          </button>
        ))}
      </div>
      {open && (
        <div className="rs-panel">
          <h4>{open.heading ?? open.label}</h4>
          <SceneBlocks blocks={open.blocks} ctx={ctx} />
        </div>
      )}
    </div>
  );
}

function CheckView({ block: b }: { block: Extract<SceneBlock, { kind: "check" }> }) {
  const [result, setResult] = useState<number | null>(null);
  const hard = b.penalty < 0;
  return (
    <div className="rs-check">
      <span className={`rs-roll-check${hard ? " hard" : ""}`}>
        {b.difficulty}{b.stat !== "none" ? ` ${b.stat}` : ""} ({b.penalty > 0 ? "+" : ""}{b.penalty})
      </span>
      {b.label && <span><Inline text={b.label} /></span>}
      <button onClick={() => setResult(rollD20())} title="Roll a raw d20 — apply the modifier to the player's own stat">Roll d20</button>
      {result !== null && <span className="res">{result}{result === 1 ? " (NAT 1)" : result === 20 ? " (NAT 20)" : ""}</span>}
    </div>
  );
}

function FindableView({ block: b, ctx }: { block: Extract<SceneBlock, { kind: "findable" }>; ctx: RenderCtx }) {
  const [revealed, setRevealed] = useState(false);
  const found = ctx.foundIds?.has(b.id) ?? false;
  return (
    <details className="rs-findable" open={revealed} onToggle={(e) => setRevealed((e.target as HTMLDetailsElement).open)}>
      <summary>
        {revealed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        {found && <span className="found">FOUND</span>}
        {b.name}
        {ctx.toggleFound && (
          <button
            className="rs-tool-btn"
            style={{ marginLeft: "auto" }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); ctx.toggleFound!(b.id); }}
          >
            <MapPin className="h-3 w-3" style={{ display: "inline" }} /> {found ? "Unmark" : "Mark found"}
          </button>
        )}
      </summary>
      <div className="rs-findable-body">
        {b.description && <p><Inline text={b.description} /></p>}
        {b.readAloud && <div className="rs-anchor-line">"{b.readAloud}"</div>}
      </div>
    </details>
  );
}

/** Standalone findable-list convenience (used where Findable[] still lives, not a block). */
export function FindableList({ findables, revealed, onToggleReveal, onToggleResolved }: {
  findables: Findable[]; revealed: Set<string>;
  onToggleReveal: (id: string) => void; onToggleResolved: (f: Findable) => void;
}) {
  return (
    <>
      {findables.map((f) => (
        <details key={f.id} className="rs-findable" open={revealed.has(f.id)} onToggle={() => onToggleReveal(f.id)}>
          <summary>
            {revealed.has(f.id) ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {f.resolved && <span className="found">FOUND</span>}
            {f.name}
            <button className="rs-tool-btn" style={{ marginLeft: "auto" }} onClick={(e) => { e.preventDefault(); onToggleResolved(f); }}>
              <MapPin className="h-3 w-3" style={{ display: "inline" }} />
            </button>
          </summary>
          <div className="rs-findable-body">
            {f.description && <p>{f.description}</p>}
            {f.readAloud && <div className="rs-anchor-line">"{f.readAloud}"</div>}
          </div>
        </details>
      ))}
    </>
  );
}
